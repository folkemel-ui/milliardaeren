/**
 * Racingteamet (Pakke 90). Formel 1-bilen sto bare i garasjen; nå kan den bli et
 * team. En sesong er åtte løp, ett hver tredje spilldag (et kvarter), mot ni
 * oppdiktede team med to førere hver. Et løp avgjøres ved dagsskiftet av bilen
 * (fire deler i fem trinn), førerne du har ansatt og strategien du har valgt —
 * og litt flaks. Poeng som i Formel 1 (25, 18, 15 … 1 til de ti første), premier
 * per poeng, og to mesterskap: førerne og konstruktørene. Hvert gir et trofé med
 * status, som klubbens.
 *
 * Teamet har sin egen terning (`frø`), og de andre teamene og førerne kommer fra
 * hasher av navn og sesong, så ingenting annet i spillet flytter seg — bortsett
 * fra avisa, som alle nye saker. Fila leser bare typene, terningen, kalenderen og
 * tallformatet, så eiendom.ts kan bruke verdien og statusen herfra.
 */

import { MAKS_HENDELSER } from './innhold'
import { dagnummer } from './kalender'
import { hashNormal, hashTekst, Terning, tilfeldig } from './rng'
import { kortKroner } from './tall'
import type { Bildel, Forer, Lopsstrategi, Overskrift, Racinglop, Racingteam, Spilltilstand, Trofe } from './types'

/** Det koster å melde på et team (bilen har du alt). Forbruk, som luksus. */
export const TEAMPRIS = 25_000_000
/** Bilen du starter med, før noen deler er bygd ut. */
export const BIL_GRUNN = 40
/** Hvert trinn på en del gir så mye fart. Fire deler i fem trinn: 40 → 90. */
export const TRINN_FART = 2.5
/** Prisen for trinn 1–5 på hver del: fra 10 mill til 5 mrd, så bilen betyr noe hele spillet. */
export const DELTRINN_PRIS = [10_000_000, 50_000_000, 220_000_000, 1_000_000_000, 5_000_000_000] as const
/** Selger du teamet, får du så mye av det delene kostet. */
export const SALG_ANDEL = 0.85

export const LOP_PER_SESONG = 8
/** Ett løp hver så mange spilldager: et kvarter. */
export const DAGER_MELLOM = 3
/** Poeng til de ti første, som i Formel 1. */
export const POENG = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const
/** Premie per poeng teamet tar. En seier gir 12,5 mill. */
export const PREMIE_PER_POENG = 500_000
/** Hvert mesterskap gir dette i tillegg til trofeet. */
export const MESTERPREMIE = 50_000_000
/** Hvert trofé gir like mye status som klubbens. */
export const RACING_TROFE_STATUS = 3
export const FORERMESTER = 'Førermester'
export const KONSTRUKTORMESTER = 'Konstruktørmester'

/** Bilen teller mest, føreren litt mindre. */
const VEKT_BIL = 0.6
const VEKT_FORER = 0.4
/**
 * Flaksen i et løp: standardavviket på farten. 5 til Pakke 109; nå teller startplassen også,
 * så flaksen er litt mindre — målt over 300 sesonger står hvert bilnivå der det sto (±0,2 plasser).
 */
export const SPREDNING = 4.6

/** Hver del og når den teller mest (Pakke 109, `DELVEKT`). */
export const BILDELER: Record<Bildel, { navn: string; tekst: string }> = {
  motor: { navn: 'Motor', tekst: 'Kraft på rettene — teller mest i kvalifiseringen.' },
  aero: { navn: 'Aerodynamikk', tekst: 'Holder bilen nede — mest verdt i regn og på en flyvende runde.' },
  chassis: { navn: 'Chassis', tekst: 'Lettere og stivere — teller mest i regn.' },
  depot: { navn: 'Depotmannskap', tekst: 'Raskere dekkskift — teller i løpet, ikke i kvalifiseringen.' },
}
export const BILDELLISTE = Object.keys(BILDELER) as Bildel[]

export const STRATEGIER: Record<Lopsstrategi, { navn: string; tekst: string; fart: number; krasj: number }> = {
  forsiktig: { navn: 'Forsiktig', tekst: 'Litt saktere, men kommer nesten alltid i mål.', fart: -1, krasj: 0.01 },
  normal: { navn: 'Normal', tekst: 'Kjører på bilen og føreren.', fart: 0, krasj: 0.04 },
  aggressiv: { navn: 'Aggressiv', tekst: 'Raskere, men omtrent én av åtte kjører av.', fart: 1.5, krasj: 0.12 },
}
export const STRATEGILISTE = Object.keys(STRATEGIER) as Lopsstrategi[]

/** De ni andre teamene og bilen de starter med. Farten flytter seg litt fra sesong til sesong. */
export const RIVALLAG: readonly { navn: string; bil: number }[] = [
  { navn: 'Scuderia Vesuvio', bil: 88 },
  { navn: 'Kaiser Motorsport', bil: 84 },
  { navn: 'Albion Racing', bil: 79 },
  { navn: 'Équipe Lumière', bil: 73 },
  { navn: 'Sakura Racing', bil: 66 },
  { navn: 'Southern Cross Racing', bil: 59 },
  { navn: 'Lone Star Racing', bil: 52 },
  { navn: 'Dragón Motorsport', bil: 46 },
  { navn: 'Maple Racing', bil: 40 },
]

export const BANER = ['Melbourne', 'Monaco', 'Silverstone', 'Spa', 'Monza', 'Suzuka', 'Interlagos', 'Abu Dhabi'] as const
export type Bane = (typeof BANER)[number]

// ─────────────────────────────────────────────── Bilens tall, startplassen og været (Pakke 109)

/** Et tall delen har på trinn 0 og trinn 5; lavere er bedre for tid og vekt. */
export interface Deltall {
  navn: string
  enhet: string
  fra: number
  til: number
  desimaler?: number
}

/** De virkelige tallene bak hvert trinn: det du ser på bilkortet, som streker mot feltets beste. */
export const DELTALL: Record<Bildel, Deltall[]> = {
  motor: [
    { navn: 'Effekt', enhet: 'hk', fra: 760, til: 1010 },
    { navn: 'Toppfart', enhet: 'km/t', fra: 318, til: 348 },
    { navn: '0–100 km/t', enhet: 's', fra: 2.7, til: 2.2, desimaler: 1 },
  ],
  aero: [
    { navn: 'Marktrykk', enhet: 'kg', fra: 2800, til: 4000 },
    { navn: 'Luftmotstand', enhet: 'cW', fra: 1.1, til: 0.95, desimaler: 2 },
  ],
  chassis: [
    { navn: 'Vekt', enhet: 'kg', fra: 830, til: 798 },
    { navn: 'Stivhet', enhet: 'kNm/°', fra: 30, til: 45 },
  ],
  depot: [{ navn: 'Depotstopp', enhet: 's', fra: 3.6, til: 2.0, desimaler: 1 }],
}

/** Tallet på et trinn (0–5, kan være et brøktall for de andre teamene). */
export const deltall = (t: Deltall, trinn: number) => t.fra + ((t.til - t.fra) * trinn) / 5

/**
 * Hvor mye hver del teller, i kvalifiseringen, i et tørt løp og i regn. Hver rad summerer til 4,
 * så en bil med like mange trinn på alle delene har samme fart overalt — som før Pakke 109. Motor og
 * aero teller mest på en flyvende runde, depotmannskapet ikke i det hele tatt; aero og chassis i regn.
 */
export const DELVEKT: Record<'kval' | 'tort' | 'regn', Record<Bildel, number>> = {
  kval: { motor: 1.4, aero: 1.3, chassis: 1.3, depot: 0 },
  tort: { motor: 1, aero: 0.9, chassis: 0.9, depot: 1.2 },
  regn: { motor: 0.6, aero: 1.5, chassis: 1.3, depot: 0.6 },
}

/** Bilens fart i kvalifisering, et tørt løp eller regn. */
export function bilfartI(r: Pick<Racingteam, 'deler'>, forhold: keyof typeof DELVEKT): number {
  let sum = BIL_GRUNN
  for (const d of BILDELLISTE) sum += (r.deler[d] ?? 0) * TRINN_FART * DELVEKT[forhold][d]
  return sum
}

/** Feltets beste trinn på delene i år: det beste av ditt eget og de andre teamenes. */
export function feltetsBesteTrinn(r: Racingteam): Record<Bildel, number> {
  let rival = 0
  for (const l of RIVALLAG) rival = Math.max(rival, rivaltrinn(rivalbil(l.navn, l.bil, r.sesong)))
  const ut = {} as Record<Bildel, number>
  for (const d of BILDELLISTE) ut[d] = Math.max(rival, r.deler[d] ?? 0)
  return ut
}

/** Et annet teams trinn per del: bilnummeret delt jevnt på de fire. */
export const rivaltrinn = (bil: number) => Math.max(0, Math.min(5, (bil - BIL_GRUNN) / (4 * TRINN_FART)))

/** Flaksen i kvalifiseringen er halv: den beste bilen og føreren står oftest først. */
export const KVAL_SPREDNING = 2.5
/** Hver startplass bak er verdt så mye fart i løpet, og i Monaco, der ingen kommer forbi, ×2,5. */
export const GRID_FART = 0.12
export const MONACO_GRID = 2.5

/** Sjansen for regn på hver bane; Spa og Interlagos oftest. Om lag 1,5 våte løp i sesongen. */
export const REGNSJANSE: Partial<Record<Bane, number>> = { Spa: 0.35, Interlagos: 0.35, Silverstone: 0.25, Suzuka: 0.2 }
export const REGN_ELLERS = 0.12
/** I regn teller føreren mer, flaksen mer, og dobbelt så mange kjører av. */
export const FORER_REGN = 0.5
export const SPREDNING_REGN = 6.5
export const KRASJ_REGN = 2

/** Om det regner i et løp, fra en hash av teamet, sesongen og runden — kjent på forhånd. */
export function regnILop(r: Pick<Racingteam, 'navn' | 'sesong'>, runde: number): boolean {
  return hash(`racing:regn:${r.navn}:${r.sesong}:${runde}`) < (REGNSJANSE[baneFor(runde)] ?? REGN_ELLERS)
}

/** En førers ferdighet i regn i forhold til tørt, omtrent ±5, fra navnet. */
export function vaatferdighet(navn: string): number {
  return Math.max(-10, Math.min(10, Math.round(5 * hashNormal(hashTekst(`racing:vaat:${navn}`)))))
}

const TEAMNAVN = ['Nordlys Racing', 'Midnattsol Racing', 'Vestavind Motorsport', 'Polarstjerna Racing', 'Havørn Racing', 'Kvitfjell Motorsport']
const FORNAVN = ['Aksel', 'Marco', 'Jonas', 'Luca', 'Emil', 'Kenji', 'Pierre', 'Diego', 'Oskar', 'Felipe', 'Tobias', 'Ravi', 'Sven', 'Mateo', 'Hugo', 'Kai', 'Niko', 'Enzo', 'Theo', 'Rafael']
const ETTERNAVN = ['Brekke', 'Moretti', 'Lindqvist', 'Tanaka', 'Dubois', 'Moreno', 'Halvorsen', 'Schneider', 'Costa', 'Novak', 'Varga', 'Kowalski', 'Okafor', 'Silva', 'Berg', 'Larsen', 'Fischer', 'Ito', 'Lambert', 'Navarro']

/** Et tall i [0, 1) fra en nøkkel — samme svar hver gang. */
const hash = (nokkel: string) => tilfeldig(hashTekst(nokkel))

function navnFra(nokkel: string): string {
  return `${FORNAVN[Math.floor(hash(`${nokkel}:for`) * FORNAVN.length)]} ${ETTERNAVN[Math.floor(hash(`${nokkel}:etter`) * ETTERNAVN.length)]}`
}

/**
 * Lønn per spilldag etter ferdighet: 100 000 kr for en nykommer på 45, 5 mill for den beste på 95.
 * To toppførere koster ~240 mill en sesong — omtrent det et mesterteam tar inn i premier.
 */
export function lonnFor(ferdighet: number): number {
  const x = 100_000 * 50 ** ((ferdighet - 45) / 50)
  const steg = 10 ** (Math.floor(Math.log10(x)) - 1)
  return Math.round(x / steg) * steg
}

/** Bilens fart: grunnen og trinnene på de fire delene. */
export function bilfart(r: Racingteam): number {
  let sum = BIL_GRUNN
  for (const d of BILDELLISTE) sum += (r.deler[d] ?? 0) * TRINN_FART
  return sum
}

/** Prisen for neste trinn på en del, eller null når den er bygd helt ut. */
export function nesteDelpris(r: Racingteam, del: Bildel): number | null {
  return DELTRINN_PRIS[r.deler[del] ?? 0] ?? null
}

/** Teamet teller i formuen med det delene har kostet, som stadion i klubben. */
export function racingverdi(s: Spilltilstand): number {
  return s.racing?.investert ?? 0
}

export function racingstatus(s: Spilltilstand): number {
  return (s.racingtrofeer?.length ?? 0) * RACING_TROFE_STATUS
}

export function lonnPerDag(r: Racingteam): number {
  let sum = 0
  for (const f of r.forere) if (f) sum += f.lonn
  return sum
}

/** Et annet teams bil i en sesong: utgangspunktet ± 3. */
export function rivalbil(lag: string, bil: number, sesong: number): number {
  return Math.round(bil + (hash(`racing:${lag}:${sesong}:bil`) * 2 - 1) * 3)
}

/** Et annet teams to førere i en sesong, fra navnet og sesongen. */
export function rivalforere(lag: string, bil: number, sesong: number): { navn: string; ferdighet: number }[] {
  return [0, 1].map((i) => {
    const nokkel = `racing:${lag}:${sesong}:${i}`
    const ferdighet = Math.max(45, Math.min(95, Math.round(bil - 4 + (hash(`${nokkel}:ferdighet`) * 2 - 1) * 8)))
    return { navn: navnFra(nokkel), ferdighet }
  })
}

/**
 * Førerne du kan ansette en sesong: én fra hvert lag av feltet — en nykommer, en
 * midt på treet, en god og en av de beste. Fra teamets navn og sesongen.
 */
export function lagMarked(r: Pick<Racingteam, 'navn' | 'sesong' | 'nesteForerId'>): Forer[] {
  const lag = [
    [45, 58],
    [58, 70],
    [70, 82],
    [82, 95],
  ]
  return lag.map(([fra, til], i) => {
    const nokkel = `racing:marked:${r.navn}:${r.sesong}:${i}`
    const ferdighet = Math.round(fra + hash(`${nokkel}:ferdighet`) * (til - fra))
    return { id: r.nesteForerId + i, navn: navnFra(nokkel), ferdighet, lonn: lonnFor(ferdighet) }
  })
}

/** Et nytt team: grunnbilen, to nykommere i setene og et marked. */
export function nyttRacingteam(s: Spilltilstand): Racingteam {
  const navn = TEAMNAVN[Math.floor(hash(`racing:team:${s.sek}`) * TEAMNAVN.length)]
  const nykommere: Forer[] = [0, 1].map((i) => {
    const nokkel = `racing:nykommer:${navn}:${i}`
    const ferdighet = 48 + Math.floor(hash(`${nokkel}:ferdighet`) * 5)
    return { id: i + 1, navn: navnFra(nokkel), ferdighet, lonn: lonnFor(ferdighet) }
  })
  const r: Racingteam = {
    navn,
    sesong: 1,
    frø: hashTekst(`${navn}:${s.sek}`),
    nesteDag: dagnummer(s.sek) + DAGER_MELLOM,
    runde: 0,
    deler: { motor: 0, aero: 0, chassis: 0, depot: 0 },
    investert: 0,
    forere: nykommere,
    marked: [],
    nesteForerId: 3,
    strategi: 'normal',
    lagpoeng: {},
    forerpoeng: {},
    lop: [],
    sesonger: [],
    premier: 0,
    lonn: 0,
  }
  r.marked = lagMarked(r)
  r.nesteForerId += r.marked.length
  return r
}

/** Banen i et løp: åtte i fast rekkefølge, sesong etter sesong. */
export const baneFor = (runde: number) => BANER[runde % BANER.length]

/** Konstruktørmesterskapet nå: alle ti teamene, flest poeng først. Likt står i fast rekkefølge, ditt team sist. */
export function konstruktortabell(r: Racingteam): { lag: string; poeng: number; deg: boolean }[] {
  const lag = [...RIVALLAG.map((x) => x.navn), r.navn]
  return lag
    .map((navn, i) => ({ lag: navn, poeng: r.lagpoeng[navn] ?? 0, deg: navn === r.navn, i }))
    .sort((a, b) => b.poeng - a.poeng || a.i - b.i)
    .map(({ lag: l, poeng, deg }) => ({ lag: l, poeng, deg }))
}

/** Førermesterskapet nå: alle tjue førerne som har tatt poeng, flest først, og dine selv uten poeng. */
export function forertabell(r: Racingteam): { forer: string; lag: string; poeng: number; deg: boolean }[] {
  const rader = Object.entries(r.forerpoeng).map(([nokkel, poeng]) => {
    const [forer, lag] = nokkel.split('|')
    return { forer, lag, poeng, deg: lag === r.navn }
  })
  for (const f of r.forere) if (f && !rader.some((x) => x.forer === f.navn && x.deg)) rader.push({ forer: f.navn, lag: r.navn, poeng: 0, deg: true })
  return rader.sort((a, b) => b.poeng - a.poeng || a.forer.localeCompare(b.forer))
}

/** En normalfordelt verdi fra terningen. */
function normal(t: Terning): number {
  const u = 1 - t.neste()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * t.neste())
}

interface Bil {
  forer: string
  lag: string
  fart: number
  krasj: boolean
  /** Setet hos deg, eller -1 for et annet team. */
  sete: number
  /** Startplassen, 0 = pole. */
  start: number
}

/**
 * Kjører løpet på teamets egen terning. De andre teamene kjører normalt; ditt team
 * kjører med strategien du har valgt. Trekkene står i fast rekkefølge (de andre
 * først, så dine seter), så samme tilstand gir samme løp. Muterer teamet.
 */
export function kjorLop(r: Racingteam, dag: number): Racinglop {
  const t = new Terning(r.frø)
  // Pakke 109: været og kvalifiseringen kommer fra hasher, så terningen trekker like mange tall som før.
  const runde = r.runde
  const bane = baneFor(runde)
  const regn = regnILop(r, runde)
  const vektForer = regn ? FORER_REGN : VEKT_FORER
  const forerfart = (navn: string, ferdighet: number) => vektForer * (ferdighet + (regn ? vaatferdighet(navn) : 0))
  const felt: { forer: string; lag: string; ferdighet: number; kval: number; lop: number; sete: number }[] = []
  for (const lag of RIVALLAG) {
    // De andre teamene har like mange trinn på alle delene, så bilen er den samme overalt.
    const bil = rivalbil(lag.navn, lag.bil, r.sesong)
    for (const f of rivalforere(lag.navn, lag.bil, r.sesong)) felt.push({ forer: f.navn, lag: lag.navn, ferdighet: f.ferdighet, kval: bil, lop: bil, sete: -1 })
  }
  const kvalBil = bilfartI(r, 'kval')
  const lopBil = bilfartI(r, regn ? 'regn' : 'tort')
  r.forere.forEach((f, sete) => {
    if (f) felt.push({ forer: f.navn, lag: r.navn, ferdighet: f.ferdighet, kval: kvalBil, lop: lopBil, sete })
  })
  const kvalfart = felt.map((b, i) => VEKT_BIL * b.kval + forerfart(b.forer, b.ferdighet) + KVAL_SPREDNING * hashNormal(hashTekst(`racing:kval:${r.navn}:${r.sesong}:${runde}:${b.forer}:${i}`)))
  const start = new Array<number>(felt.length)
  felt
    .map((_, i) => i)
    .sort((a, b) => kvalfart[b] - kvalfart[a])
    .forEach((i, plass) => (start[i] = plass))
  const grid = (i: number) => -GRID_FART * (bane === 'Monaco' ? MONACO_GRID : 1) * start[i]
  const flaks = regn ? SPREDNING_REGN : SPREDNING
  const krasjFaktor = regn ? KRASJ_REGN : 1
  const biler: Bil[] = []
  let n = 0
  for (const lag of RIVALLAG) {
    for (let k = 0; k < 2; k++) {
      const b = felt[n]
      const fart = VEKT_BIL * b.lop + forerfart(b.forer, b.ferdighet) + grid(n) + flaks * normal(t)
      biler.push({ forer: b.forer, lag: lag.navn, fart, krasj: t.sjanse(STRATEGIER.normal.krasj * krasjFaktor), sete: -1, start: start[n] })
      n++
    }
  }
  const st = STRATEGIER[r.strategi]
  r.forere.forEach((f, sete) => {
    // Et tomt sete trekker likevel, så terningen går i samme takt uansett.
    const z = normal(t)
    const krasj = t.sjanse(st.krasj * krasjFaktor)
    if (!f) return
    const i = felt.findIndex((b) => b.sete === sete)
    biler.push({ forer: f.navn, lag: r.navn, fart: VEKT_BIL * lopBil + forerfart(f.navn, f.ferdighet) + st.fart + grid(i) + flaks * z, krasj, sete, start: start[i] })
  })
  r.frø = t.fro
  const imaal = biler.filter((b) => !b.krasj).sort((a, b) => b.fart - a.fart)
  let poeng = 0
  const plasser: (number | null)[] = r.forere.map((f) => (f ? 0 : null))
  imaal.forEach((b, i) => {
    const p = POENG[i] ?? 0
    if (p > 0) {
      r.lagpoeng[b.lag] = (r.lagpoeng[b.lag] ?? 0) + p
      r.forerpoeng[`${b.forer}|${b.lag}`] = (r.forerpoeng[`${b.forer}|${b.lag}`] ?? 0) + p
    }
    if (b.sete >= 0) {
      plasser[b.sete] = i + 1
      poeng += p
    }
  })
  const lop: Racinglop = {
    sesong: r.sesong,
    runde: r.runde + 1,
    dag,
    bane: baneFor(r.runde),
    strategi: r.strategi,
    plasser,
    poeng,
    premie: poeng * PREMIE_PER_POENG,
    pall: imaal.slice(0, 3).map((b) => ({ forer: b.forer, lag: b.lag })),
    regn,
    start: r.forere.map((_, sete) => {
      const b = biler.find((x) => x.sete === sete)
      return b ? b.start + 1 : null
    }),
    pole: (() => {
      const b = biler.find((x) => x.start === 0)!
      return { forer: b.forer, lag: b.lag }
    })(),
    felt: biler.map((b) => ({ forer: b.forer, lag: b.lag, start: b.start + 1, plass: imaal.indexOf(b) + 1 })),
    motor: r.deler.motor ?? 0,
    depot: r.deler.depot ?? 0,
  }
  r.runde += 1
  r.lop.push(lop)
  if (r.lop.length > 2 * LOP_PER_SESONG) r.lop.shift()
  // Hele feltet trengs bare til løpet direkte og rapporten: de to siste løpene beholder det.
  for (const x of r.lop.slice(0, -2)) delete x.felt
  return lop
}

/** Plassen som tekst: «3.», eller «ute» for en krasj. */
export const plasstekst = (p: number) => (p === 0 ? 'ute' : `${p}.`)

/**
 * En linje i hendelsesloggen. Kortet som `leggTilHendelse` i bank.ts (som ikke kan importeres
 * hit uten en ring: bank → eiendom → racing), med samme tak — før Pakke 98 vokste loggen uten.
 */
function hendelse(s: Spilltilstand, tekst: string): void {
  s.hendelser.push({ sek: s.sek, tittel: 'Racing', tekst, alvor: 'info' })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}

/** Racingpenger: i klubbens linje, som før, og i racingens egen del av den (Pakke 98). Muterer. */
function racingpenger(s: Spilltilstand, belop: number): void {
  s.totaltKlubb = (s.totaltKlubb ?? 0) + belop
  s.totaltRacing = (s.totaltRacing ?? 0) + belop
}

/** Sesongen er over: mesterskapene, trofeene, et sammendrag, og en ny sesong med nytt marked. Muterer. */
function sesongslutt(s: Spilltilstand, r: Racingteam, hvem: string, hendelser: string[]): Overskrift[] {
  const saker: Overskrift[] = []
  const lag = konstruktortabell(r)
  const forere = forertabell(r)
  const plass = lag.findIndex((x) => x.deg) + 1
  const forerplass = forere.findIndex((x) => x.deg) + 1
  const titler: string[] = []
  if (forere[0]?.deg) titler.push(FORERMESTER)
  if (lag[0]?.deg) titler.push(KONSTRUKTORMESTER)
  for (const navn of titler) {
    const trofe: Trofe = { navn, sesong: r.sesong, klubb: r.navn }
    s.racingtrofeer = [...(s.racingtrofeer ?? []), trofe]
    s.kontanter += MESTERPREMIE
    racingpenger(s, MESTERPREMIE)
    r.premier += MESTERPREMIE
  }
  if (titler.includes(FORERMESTER)) {
    saker.push({ type: 'deg', tittel: `${forere[0].forer} er verdensmester`, tekst: `${r.navn}, eid av ${hvem.toLowerCase()}, tok tittelen med ${forere[0].poeng} poeng.` })
  } else if (titler.length) {
    saker.push({ type: 'deg', tittel: `${r.navn} er konstruktørmester`, tekst: `Flest poeng av alle teamene: ${lag[0].poeng}.` })
  } else {
    saker.push({ type: 'marked', tittel: `${forere[0]?.forer ?? lag[0].lag} er verdensmester`, tekst: `${r.navn} endte på ${plass}. plass blant teamene.` })
  }
  hendelser.push(titler.length ? `Sesong ${r.sesong} er over: ${titler.join(' og ').toLowerCase()}! ${kortKroner(MESTERPREMIE * titler.length)} i premie.` : `Sesong ${r.sesong} er over: ${plass}. plass blant teamene.`)
  const seire = r.lop.filter((l) => l.sesong === r.sesong && l.plasser.includes(1)).length
  r.sesonger.push({ sesong: r.sesong, plass, poeng: lag[plass - 1].poeng, forerplass, seire, titler })
  if (r.sesonger.length > 10) r.sesonger.shift()
  // Pakke 110: tabellen slik den endte, så siden kan vise den mens det siste løpet kjøres.
  r.sisteTabell = { sesong: r.sesong, lagpoeng: { ...r.lagpoeng }, forerpoeng: { ...r.forerpoeng } }
  r.sesong += 1
  r.runde = 0
  r.lagpoeng = {}
  r.forerpoeng = {}
  r.marked = lagMarked(r)
  r.nesteForerId += r.marked.length
  return saker
}

/**
 * Dagsskiftet for teamet: lønnen til førerne, og på løpsdagen løpet — med poeng,
 * premie og en sak i avisa når det skjer noe verdt å skrive om. Etter det åttende
 * løpet er sesongen over. `hvem` er det avisa kaller deg. Muterer.
 */
export function racingVedDagsskifte(s: Spilltilstand, hvem: string): Overskrift[] {
  const r = s.racing
  if (!r) return []
  // Pakke 110: løpet som ble avgjort ved forrige dagsskifte, er kjørt ferdig nå — avisa og
  // hendelsene om det slippes, og dagens løp holdes tilbake til sitt målflagg.
  const ut = r.ventendeSaker ?? []
  for (const h of r.ventendeHendelser ?? []) hendelse(s, h)
  delete r.ventendeSaker
  delete r.ventendeHendelser
  const dag = dagnummer(s.sek)
  const lonn = lonnPerDag(r)
  s.kontanter -= lonn
  racingpenger(s, -lonn)
  r.lonn += lonn
  if (dag < r.nesteDag) return ut
  const lop = kjorLop(r, dag)
  r.nesteDag = dag + DAGER_MELLOM
  s.kontanter += lop.premie
  racingpenger(s, lop.premie)
  r.premier += lop.premie
  const saker: Overskrift[] = []
  const mine = lop.plasser
    .map((p, i) => ({ p, f: r.forere[i], start: lop.start?.[i] ?? null }))
    .filter((x): x is { p: number; f: Forer; start: number | null } => x.p !== null && !!x.f)
  const beste = mine.filter((x) => x.p > 0).sort((a, b) => a.p - b.p)[0]
  // Pakke 109: startplassen og regnet i saken — «fra pole», «fra 7. plass», «i regnet».
  const fra = (x: { start: number | null }) => (x.start === 1 ? ' fra pole' : x.start ? ` fra ${x.start}. startplass` : '')
  const vaat = lop.regn ? ' i regnet' : ''
  const minPole = mine.find((x) => x.start === 1)
  if (beste?.p === 1) {
    saker.push({ type: 'deg', tittel: `${r.navn} vinner i ${lop.bane}`, tekst: `${beste.f.navn} tok seieren${fra(beste)}${vaat}, foran ${lop.pall[1]?.forer} og ${lop.pall[2]?.forer}.` })
  } else if (beste && beste.p <= 3) {
    saker.push({ type: 'deg', tittel: `Pallplass for ${r.navn} i ${lop.bane}`, tekst: `${beste.f.navn} ble nummer ${beste.p}${fra(beste)}${vaat}. ${lop.pall[0].forer} vant for ${lop.pall[0].lag}.` })
  } else if (minPole) {
    saker.push({ type: 'deg', tittel: `Pole for ${r.navn} i ${lop.bane}`, tekst: `${minPole.f.navn} satte bestetid i kvalifiseringen, men endte ${minPole.p === 0 ? 'utenfor banen' : `på ${minPole.p}. plass`}${vaat}.` })
  } else if (mine.some((x) => x.p === 0)) {
    const ute = mine.find((x) => x.p === 0)!
    saker.push({ type: 'deg', tittel: `Krasj for ${r.navn} i ${lop.bane}`, tekst: `${ute.f.navn} kjørte av${lop.strategi === 'aggressiv' ? ' etter et vågalt forsøk på å ta igjen feltet' : ''}.` })
  }
  const plasser = mine.map((x) => plasstekst(x.p)).join(' og ')
  const hendelser = [`${lop.bane}${lop.regn ? ' (regn)' : ''}: ${plasser || 'ingen førere'} — ${lop.poeng} poeng${lop.premie > 0 ? ` og ${kortKroner(lop.premie)}` : ''}.`]
  if (r.runde >= LOP_PER_SESONG) saker.push(...sesongslutt(s, r, hvem, hendelser))
  r.ventendeSaker = saker
  r.ventendeHendelser = hendelser
  return ut
}
