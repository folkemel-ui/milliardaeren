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

import { dagnummer } from './kalender'
import { hashTekst, Terning, tilfeldig } from './rng'
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
/** Flaksen i et løp: standardavviket på farten (rundt en femdel av spennet mellom teamene). */
export const SPREDNING = 5

export const BILDELER: Record<Bildel, { navn: string; tekst: string }> = {
  motor: { navn: 'Motor', tekst: 'Mer kraft ut av svingene.' },
  aero: { navn: 'Aerodynamikk', tekst: 'Vinger som holder bilen nede.' },
  chassis: { navn: 'Chassis', tekst: 'Lettere og stivere.' },
  depot: { navn: 'Depotmannskap', tekst: 'Raskere dekkskift.' },
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
}

/**
 * Kjører løpet på teamets egen terning. De andre teamene kjører normalt; ditt team
 * kjører med strategien du har valgt. Trekkene står i fast rekkefølge (de andre
 * først, så dine seter), så samme tilstand gir samme løp. Muterer teamet.
 */
export function kjorLop(r: Racingteam, dag: number): Racinglop {
  const t = new Terning(r.frø)
  const biler: Bil[] = []
  for (const lag of RIVALLAG) {
    const bil = rivalbil(lag.navn, lag.bil, r.sesong)
    for (const f of rivalforere(lag.navn, lag.bil, r.sesong)) {
      const fart = VEKT_BIL * bil + VEKT_FORER * f.ferdighet + SPREDNING * normal(t)
      biler.push({ forer: f.navn, lag: lag.navn, fart, krasj: t.sjanse(STRATEGIER.normal.krasj), sete: -1 })
    }
  }
  const st = STRATEGIER[r.strategi]
  const fart = bilfart(r)
  r.forere.forEach((f, sete) => {
    // Et tomt sete trekker likevel, så terningen går i samme takt uansett.
    const flaks = normal(t)
    const krasj = t.sjanse(st.krasj)
    if (!f) return
    biler.push({ forer: f.navn, lag: r.navn, fart: VEKT_BIL * fart + VEKT_FORER * f.ferdighet + st.fart + SPREDNING * flaks, krasj, sete })
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
  }
  r.runde += 1
  r.lop.push(lop)
  if (r.lop.length > 2 * LOP_PER_SESONG) r.lop.shift()
  return lop
}

/** Plassen som tekst: «3.», eller «ute» for en krasj. */
export const plasstekst = (p: number) => (p === 0 ? 'ute' : `${p}.`)

function hendelse(s: Spilltilstand, tekst: string): void {
  s.hendelser.push({ sek: s.sek, tittel: 'Racing', tekst, alvor: 'info' })
}

/** Sesongen er over: mesterskapene, trofeene, et sammendrag, og en ny sesong med nytt marked. Muterer. */
function sesongslutt(s: Spilltilstand, r: Racingteam, hvem: string): Overskrift[] {
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
    s.totaltKlubb = (s.totaltKlubb ?? 0) + MESTERPREMIE
    r.premier += MESTERPREMIE
  }
  if (titler.includes(FORERMESTER)) {
    saker.push({ type: 'deg', tittel: `${forere[0].forer} er verdensmester`, tekst: `${r.navn}, eid av ${hvem.toLowerCase()}, tok tittelen med ${forere[0].poeng} poeng.` })
  } else if (titler.length) {
    saker.push({ type: 'deg', tittel: `${r.navn} er konstruktørmester`, tekst: `Flest poeng av alle teamene: ${lag[0].poeng}.` })
  } else {
    saker.push({ type: 'marked', tittel: `${forere[0]?.forer ?? lag[0].lag} er verdensmester`, tekst: `${r.navn} endte på ${plass}. plass blant teamene.` })
  }
  hendelse(s, titler.length ? `Sesong ${r.sesong} er over: ${titler.join(' og ').toLowerCase()}! ${kortKroner(MESTERPREMIE * titler.length)} i premie.` : `Sesong ${r.sesong} er over: ${plass}. plass blant teamene.`)
  const seire = r.lop.filter((l) => l.sesong === r.sesong && l.plasser.includes(1)).length
  r.sesonger.push({ sesong: r.sesong, plass, poeng: lag[plass - 1].poeng, forerplass, seire, titler })
  if (r.sesonger.length > 10) r.sesonger.shift()
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
  const dag = dagnummer(s.sek)
  const lonn = lonnPerDag(r)
  s.kontanter -= lonn
  s.totaltKlubb = (s.totaltKlubb ?? 0) - lonn
  r.lonn += lonn
  if (dag < r.nesteDag) return []
  const lop = kjorLop(r, dag)
  r.nesteDag = dag + DAGER_MELLOM
  s.kontanter += lop.premie
  s.totaltKlubb = (s.totaltKlubb ?? 0) + lop.premie
  r.premier += lop.premie
  const saker: Overskrift[] = []
  const mine = lop.plasser.map((p, i) => ({ p, f: r.forere[i] })).filter((x): x is { p: number; f: Forer } => x.p !== null && !!x.f)
  const beste = mine.filter((x) => x.p > 0).sort((a, b) => a.p - b.p)[0]
  if (beste?.p === 1) {
    saker.push({ type: 'deg', tittel: `${r.navn} vinner i ${lop.bane}`, tekst: `${beste.f.navn} tok seieren foran ${lop.pall[1]?.forer} og ${lop.pall[2]?.forer}.` })
  } else if (beste && beste.p <= 3) {
    saker.push({ type: 'deg', tittel: `Pallplass for ${r.navn} i ${lop.bane}`, tekst: `${beste.f.navn} ble nummer ${beste.p}. ${lop.pall[0].forer} vant for ${lop.pall[0].lag}.` })
  } else if (mine.some((x) => x.p === 0)) {
    const ute = mine.find((x) => x.p === 0)!
    saker.push({ type: 'deg', tittel: `Krasj for ${r.navn} i ${lop.bane}`, tekst: `${ute.f.navn} kjørte av${lop.strategi === 'aggressiv' ? ' etter et vågalt forsøk på å ta igjen feltet' : ''}.` })
  }
  const plasser = mine.map((x) => plasstekst(x.p)).join(' og ')
  hendelse(s, `${lop.bane}: ${plasser || 'ingen førere'} — ${lop.poeng} poeng${lop.premie > 0 ? ` og ${kortKroner(lop.premie)}` : ''}.`)
  if (r.runde >= LOP_PER_SESONG) saker.push(...sesongslutt(s, r, hvem))
  return saker
}
