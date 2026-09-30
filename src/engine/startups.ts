/**
 * Startups: oppstartsselskaper som henter penger i runder — pre-seed, seed og
 * serie A til C. Du kan kjøpe deg inn i runden som pågår, opp til et tak.
 * Hver runde varer én spilldag. Ved dagsskiftet går selskapet enten videre
 * (verdien stiger, og andelen din blir mindre når nye penger kommer inn), går
 * konkurs, eller blir kjøpt opp. Etter serie C børsnoteres det, og du får
 * andelen din utbetalt.
 *
 * Hvert selskap har en skjult kvalitet. Du ser bare et støyete inntrykk av
 * teamet — det hjelper, men det lyver av og til.
 */

import { leggTilHendelse } from './bank'
import { DAG_SEK, dagnummer } from './kalender'
import { flyt } from './portefolje'
import type { Terning } from './rng'
import type { Overskrift, Spilltilstand, Startup, Startupstatus } from './types'

export const RUNDER = [
  { navn: 'Pre-seed', konkurs: 0.3, oppkjop: 0.03 },
  { navn: 'Seed', konkurs: 0.25, oppkjop: 0.05 },
  { navn: 'Serie A', konkurs: 0.2, oppkjop: 0.07 },
  { navn: 'Serie B', konkurs: 0.15, oppkjop: 0.08 },
  { navn: 'Serie C', konkurs: 0.12, oppkjop: 0.08 },
] as const

/** Startups dukker opp når du har vært så rik. */
export const STARTUP_LAAST_OPP = 1_000_000
/** Så mange søker penger samtidig, høyst. */
export const MAKS_AKTIVE = 4
/** Sjansen for at en ny dukker opp ved et dagsskifte (når det er plass). */
const NY_SJANSE = 0.6
/** Avsluttede selskaper som huskes. */
const MAKS_AVSLUTTET = 6
/** Nye penger i hver runde, som andel av verdien etter runden. Det er også hvor mye andelen din vannes ut. */
export const RUNDEANDEL = 0.2
/** Du kan ta høyst så stor del av en runde — resten går til andre investorer. */
export const DIN_DEL_AV_RUNDEN = 0.5
/** Verdien ved start, som andel av den høyeste formuen din — så startups alltid betyr noe. */
const STARTVERDI_ANDEL = 0.02
const STARTVERDI_MIN = 2_000_000
/** Hvor mye verdien ganges med når en runde går bra. */
const VEKST_MIN = 1.5
const VEKST_MAKS = 3.2
/** Et oppkjøp betaler verdien ganget med dette. */
const OPPKJOP_MIN = 1.3
const OPPKJOP_MAKS = 2.5
/** Børsnoteringen gir verdien ganget med dette. */
const BORS_MIN = 1.2
const BORS_MAKS = 2.5

export const INNTRYKK = ['Uprøvd team', 'Lovende team', 'Erfarent team'] as const

export interface StartupIde {
  navn: string
  beskrivelse: string
}

export const STARTUP_IDEER: StartupIde[] = [
  { navn: 'Matbudet', beskrivelse: 'App som leverer middag på døra på under 20 minutter.' },
  { navn: 'Batterikraft', beskrivelse: 'Batterifabrikk for elbiler, bygget på vannkraft.' },
  { navn: 'Laksegen', beskrivelse: 'Bioteknologi som holder oppdrettslaksen frisk.' },
  { navn: 'Hyttebooking', beskrivelse: 'Lei ut hytta når du ikke bruker den selv.' },
  { navn: 'Nordrobot', beskrivelse: 'Roboter som plukker varer på lageret.' },
  { navn: 'Skygge AI', beskrivelse: 'Kunstig intelligens som leser kontrakter for advokater.' },
  { navn: 'Tareskog', beskrivelse: 'Mat og emballasje laget av tare fra kysten.' },
  { navn: 'Havvind Flyt', beskrivelse: 'Flytende vindmøller til dypt vann.' },
  { navn: 'Snøfonn Spill', beskrivelse: 'Spillstudio med et vikingspill i støpeskjeen.' },
  { navn: 'Karbonfangst', beskrivelse: 'Fanger CO₂ fra fabrikkpiper og lagrer den under havbunnen.' },
  { navn: 'Lommebanken', beskrivelse: 'Mobilbank for ungdom, uten gebyrer.' },
  { navn: 'Helsesjekk', beskrivelse: 'Legetime på video, døgnet rundt.' },
  { navn: 'Norsk Romfart', beskrivelse: 'Små satellitter som overvåker isen i Arktis.' },
  { navn: 'Elferja', beskrivelse: 'Elektriske ferjer til fjordene.' },
  { navn: 'Fjellgrip', beskrivelse: 'Klatreutstyr som selger seg selv på sosiale medier.' },
  { navn: 'Kvitre', beskrivelse: 'Et nytt sosialt nettverk — denne gangen blir det annerledes.' },
]

export function ide(st: Startup): StartupIde {
  return STARTUP_IDEER[st.ide] ?? STARTUP_IDEER[0]
}

export function aktive(s: Spilltilstand): Startup[] {
  return (s.startups ?? []).filter((st) => st.status === 'aktiv')
}

/** Hva andelene dine i startups som fortsatt lever, er verdt. */
export function startupverdi(s: Spilltilstand): number {
  return aktive(s).reduce((sum, st) => sum + st.andel * st.verdi, 0)
}

/** Det du har betalt for andelene i startups som fortsatt lever. */
export function startupKostpris(s: Spilltilstand): number {
  return aktive(s).reduce((sum, st) => sum + st.investert, 0)
}

/** Hvor mye du kan investere i runden som pågår. */
export function ledigIRunde(st: Startup): number {
  if (st.status !== 'aktiv') return 0
  return Math.max(0, st.verdi * RUNDEANDEL * DIN_DEL_AV_RUNDEN - st.investertIRunde)
}

/** Sjansen for konkurs i en runde: et svakt team (kvalitet 0) har 40 % høyere risiko, et sterkt 40 % lavere. */
export function konkursrisiko(st: Startup): number {
  return RUNDER[st.runde].konkurs * (1.4 - 0.8 * st.kvalitet)
}

/** Runder beløp til to gjeldende siffer, så verdiene ser ut som ekte verdsettelser. */
function pent(n: number): number {
  const steg = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1)
  return Math.round(n / steg) * steg
}

function nyStartup(s: Spilltilstand, t: Terning): Startup {
  const brukte = new Set(aktive(s).map((st) => st.ide))
  const ledige = STARTUP_IDEER.map((_, i) => i).filter((i) => !brukte.has(i))
  const kvalitet = t.neste()
  // Inntrykket er kvaliteten pluss støy, delt i tre.
  const inntrykk = Math.max(0, Math.min(2, Math.floor((kvalitet + t.mellom(-0.25, 0.25)) * 3)))
  return {
    id: s.nesteStartupId++,
    ide: t.velg(ledige),
    runde: 0,
    verdi: pent(Math.max(STARTVERDI_MIN, s.hoyesteFormue * STARTVERDI_ANDEL) * t.mellom(0.5, 1.5)),
    andel: 0,
    investert: 0,
    investertIRunde: 0,
    kvalitet,
    inntrykk,
    status: 'aktiv',
    startetSek: s.sek,
  }
}

/**
 * Banken tar over andelen din i et selskap som lever, for halvparten av det
 * den er verdt — en andel i en startup kan ikke selges på dagen. Selskapet
 * lever videre uten deg. Muterer. Returnerer hva du fikk.
 */
export function utforStartupovertakelse(s: Spilltilstand, st: Startup, andel: number): number {
  const utbetalt = st.andel * st.verdi * andel
  st.andel = 0
  st.investert = 0
  st.investertIRunde = 0
  s.kontanter += utbetalt
  flyt(s, 'startup', -utbetalt)
  return utbetalt
}

/** Avslutter et selskap og betaler ut andelen din. Muterer. */
function avslutt(s: Spilltilstand, st: Startup, status: Startupstatus, utbetalt: number): void {
  st.status = status
  st.sluttSek = s.sek
  st.utbetalt = utbetalt
  if (utbetalt > 0) {
    s.kontanter += utbetalt
    flyt(s, 'startup', -utbetalt)
  }
}

/**
 * Dagsskiftet for startups: hver runde avgjøres, og kanskje dukker et nytt
 * selskap opp. Gir avisens saker. Muterer — brukes på kopier.
 */
export function startupsVedDagsskifte(s: Spilltilstand, t: Terning): Overskrift[] {
  if (!s.startups) return []
  const saker: Overskrift[] = []
  for (const st of aktive(s)) {
    const { navn } = ide(st)
    const med = st.andel > 0
    const verdiFor = st.andel * st.verdi
    const u = t.neste()
    if (u < konkursrisiko(st)) {
      avslutt(s, st, 'konkurs', 0)
      if (med) {
        saker.push({ type: 'deg', tittel: `${navn} er konkurs`, tekst: 'Pengene er brukt opp, og ingen vil skyte inn mer. Investorene sitter igjen med ingenting.' })
        leggTilHendelse(s, { tittel: 'Konkurs', tekst: `${navn} gikk konkurs. Andelen din er tapt.`, alvor: 'advarsel' })
      }
    } else if (u < konkursrisiko(st) + RUNDER[st.runde].oppkjop) {
      const utbetalt = verdiFor * t.mellom(OPPKJOP_MIN, OPPKJOP_MAKS)
      avslutt(s, st, 'solgt', utbetalt)
      saker.push({ type: med ? 'deg' : 'marked', tittel: `${navn} kjøpt opp`, tekst: med ? 'En utenlandsk gigant kjøper selskapet, og investorene får betalt.' : 'En utenlandsk gigant sikret seg det lovende selskapet.' })
      if (med) leggTilHendelse(s, { tittel: 'Oppkjøp', tekst: `${navn} ble kjøpt opp. Du fikk ${Math.round(utbetalt).toLocaleString('nb-NO')} kr.`, alvor: 'info' })
    } else if (st.runde === RUNDER.length - 1) {
      const utbetalt = verdiFor * t.mellom(BORS_MIN, BORS_MAKS)
      avslutt(s, st, 'bors', utbetalt)
      saker.push({ type: med ? 'deg' : 'marked', tittel: `${navn} til børs`, tekst: med ? 'Kursen steg på første handelsdag, og de tidlige investorene kan telle gevinsten.' : 'Kursen steg på første handelsdag. De tidlige investorene jubler.' })
      if (med) leggTilHendelse(s, { tittel: 'Børsnotering', tekst: `${navn} gikk på børs. Du fikk ${Math.round(utbetalt).toLocaleString('nb-NO')} kr.`, alvor: 'info' })
    } else {
      st.runde += 1
      st.verdi = pent(st.verdi * t.mellom(VEKST_MIN, VEKST_MAKS))
      st.andel *= 1 - RUNDEANDEL
      st.investertIRunde = 0
    }
  }
  if (s.hoyesteFormue >= STARTUP_LAAST_OPP && aktive(s).length < MAKS_AKTIVE && t.sjanse(NY_SJANSE)) {
    const ny = nyStartup(s, t)
    s.startups.push(ny)
    saker.push({ type: 'marked', tittel: `${ide(ny).navn} søker penger`, tekst: `${ide(ny).beskrivelse} Gründerne henter ${RUNDER[0].navn.toLowerCase()}-penger nå.` })
  }
  // Glem de eldste avsluttede.
  const avsluttet = s.startups.filter((st) => st.status !== 'aktiv')
  if (avsluttet.length > MAKS_AVSLUTTET) {
    const glem = new Set(avsluttet.slice(0, avsluttet.length - MAKS_AVSLUTTET).map((st) => st.id))
    s.startups = s.startups.filter((st) => !glem.has(st.id))
  }
  return saker
}

/** Sekunder til rundene avgjøres — ved neste dagsskifte. */
export function tidTilNesteRunde(s: Spilltilstand): number {
  return (dagnummer(s.sek) + 1) * DAG_SEK - s.sek
}
