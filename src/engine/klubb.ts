/**
 * Fotballklubben. Du kjøper en klubb i 4. divisjon og spiller én kamp hver
 * spilldag. En sesong er ni runder — alle møter alle én gang — og etter siste
 * runde rykker de to beste opp og de to dårligste ned — men bare med et stadion
 * som holder kravet i divisjonen over. Lagene går igjen: alle fem divisjonene
 * står i lagringen, og de andre avgjøres av styrke og flaks (Pakke 66).
 *
 * Laget ditt er så sterkt som snittet av de elleve beste spillerne. Taktikken
 * flytter sjansene: angrep gir flere mål begge veier, forsvar færre.
 *
 * Klubben har sin egen terning, så det å eie en klubb ikke endrer kursene
 * eller noe annet i spillet. Klubben er verdt divisjonens grunnverdi pluss
 * spillerne og stadion — å kjøpe den eller bygge ut flytter bare penger.
 */

import { leggTilHendelse, meldBankenDekket } from './bank'
import { dagnummer } from './kalender'
import { hashTekst, Terning } from './rng'
import { tall } from './tall'
import type { Kamp, Klubb, Lag, Motlag, Overskrift, Spiller, Spilltilstand, Taktikk } from './types'

/**
 * `publikum` er hvor mange som vil se en hjemmekamp når laget går midt på
 * treet; formen flytter det fra ×0,8 til ×1,4. Stadion tar ikke flere enn det
 * har plass til (Pakke 66).
 */
export const DIVISJONER = [
  { navn: '4. divisjon', styrke: 35, verdi: 5_000_000, publikum: 800, billettpris: 100, sponsor: 250_000, status: 3 },
  { navn: '3. divisjon', styrke: 45, verdi: 15_000_000, publikum: 2_000, billettpris: 150, sponsor: 1_500_000, status: 8 },
  { navn: '2. divisjon', styrke: 55, verdi: 40_000_000, publikum: 5_000, billettpris: 200, sponsor: 5_000_000, status: 20 },
  { navn: '1. divisjon', styrke: 65, verdi: 100_000_000, publikum: 10_000, billettpris: 300, sponsor: 15_000_000, status: 45 },
  { navn: 'Eliteserien', styrke: 75, verdi: 250_000_000, publikum: 25_000, billettpris: 400, sponsor: 60_000_000, status: 90 },
] as const

/**
 * Tribunene (Pakke 66). Trinn N rommer hele publikummet i divisjon N også i
 * god form, så en klubb med «sitt» trinn tjener minst det billettene ga før.
 */
export const STADIONTRINN = [
  { navn: 'Gressbane med én tribune', plasser: 700, pris: 0 },
  { navn: 'Ny langsidetribune', plasser: 2_000, pris: 4_000_000 },
  { navn: 'Tribuner rundt banen', plasser: 5_000, pris: 15_000_000 },
  { navn: 'Moderne arena', plasser: 10_000, pris: 50_000_000 },
  { navn: 'Nasjonalarena', plasser: 25_000, pris: 150_000_000 },
] as const

/** Flomlys gir kveldskamper: flere vil komme. */
export const FLOMLYS = { pris: 3_000_000, publikum: 1.2 }
/** VIP-losjen lokker sponsorer. Gjelder fra neste sponsoravtale, ved sesongstart. */
export const VIP = { pris: 25_000_000, sponsor: 1.25 }

/** Lisenskravet for å spille i en divisjon: ett trinn bak det divisjonen fyller. */
export const STADIONKRAV = [
  { trinn: 0, flomlys: false },
  { trinn: 0, flomlys: false },
  { trinn: 1, flomlys: false },
  { trinn: 2, flomlys: true },
  { trinn: 3, flomlys: true },
] as const

export type Stadiondel = 'tribune' | 'flomlys' | 'vip'

/** Klubben er til salgs når formuen din en gang har vært så stor. */
export const KLUBB_LAAST_OPP = 10_000_000
export const ANTALL_LAG = 10
export const RUNDER_PER_SESONG = ANTALL_LAG - 1
/** De to beste rykker opp, de to dårligste ned. */
export const OPPRYKK = 2
export const MIN_TROPP = 11
/** Etter så mange runder varsles et stadion som stenger for opprykk. */
export const STADIONVARSEL_RUNDE = 5
export const MAKS_TROPP = 18
/** Lønn per spilldag, som andel av spillerens verdi. */
export const LONN_ANDEL = 0.02
/** Du betaler så mye over verdien for en spiller på markedet … */
export const KJOPSPREMIE = 0.15
/** … og får så mye under når du selger. */
export const SALGSRABATT = 0.15
/** Megler og advokater tar så mye når klubben selges. */
export const KLUBBSALG_HONORAR = 0.1
/** Hvert trofé gir så mange statuspoeng. */
export const TROFE_STATUS = 3
const MARKED_ANTALL = 6
const PENSJONSALDER = 35

export const TAKTIKKER: Record<Taktikk, { navn: string; beskrivelse: string; egne: number; mot: number }> = {
  forsvar: { navn: 'Forsvar', beskrivelse: 'Færre mål begge veier. Trygt mot sterkere lag.', egne: 0.75, mot: 0.65 },
  balansert: { navn: 'Balansert', beskrivelse: 'Vanlig spill.', egne: 1, mot: 1 },
  angrep: { navn: 'Angrep', beskrivelse: 'Flere mål begge veier. Bra når du må vinne.', egne: 1.3, mot: 1.35 },
}

export const KLUBBNAVN = ['Fjordby IL', 'Nordvik BK', 'Havnes FK', 'Solstad IF', 'Granvik IL', 'Elvebakken BK']

/** Nok navn til alle fem divisjonene (49 motstandere) og noen til lagene som kommer opp nedenfra. */
const LAGNAVN = [
  'Lyngdal SK', 'Bjørkeli FK', 'Skogly FK', 'Vestnes IL', 'Sjøholt SK', 'Fjellstad FK', 'Brattvåg IF', 'Øyrane IL',
  'Kvitfjell BK', 'Storvik FK', 'Heggedal IF', 'Marka SK', 'Tindeland FK', 'Dalsbygda IL', 'Steinvik BK', 'Bølgen FK',
  'Rypefjord IL', 'Furuly SK', 'Strandebarm IF', 'Holmen FK', 'Vindheim BK', 'Lia IL', 'Nesna SK', 'Kjerringøy FK',
  'Breivik IL', 'Fossheim FK', 'Mjøsdal BK', 'Sandvær IF', 'Austrått SK', 'Bjørnstad FK', 'Kvernes IL', 'Lindeberg BK',
  'Haugland IF', 'Revsnes FK', 'Torvik SK', 'Ulvøy IL', 'Eidsbygda FK', 'Glomdal BK', 'Hammarvik IF', 'Solbakken SK',
  'Langeid FK', 'Vardfjell IL', 'Tjeldsund BK', 'Grønnli IF', 'Kirkenær SK', 'Måløysund FK', 'Ospedal IL', 'Fagerheim BK',
  'Nordre Vik IF', 'Ramsøy SK', 'Hestvik FK', 'Sletta IL', 'Kalvøya BK', 'Brekkestø IF', 'Tverrdal SK', 'Elvenes FK',
  'Skjærgård IL', 'Ørnes BK', 'Bakkebø IF', 'Hovland SK', 'Rognan FK', 'Svartstad IL', 'Myrvoll BK', 'Kleppestad IF',
]

const FORNAVN = [
  'Ola', 'Jonas', 'Emil', 'Magnus', 'Sander', 'Henrik', 'Tobias', 'Mathias', 'Kristian', 'Sindre', 'Eirik', 'Martin',
  'Aleksander', 'Jakob', 'Mohammed', 'Elias', 'Filip', 'Adrian', 'Noah', 'Oskar', 'Isak', 'Vetle', 'Brage', 'Aksel',
]
const ETTERNAVN = [
  'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen',
  'Berg', 'Haugen', 'Hagen', 'Eriksen', 'Bakken', 'Solberg', 'Strand', 'Moen', 'Lunde', 'Dahl', 'Aas', 'Vik',
]

// ─────────────────────────────────────────────── Verdier

/** En spiller er verdt mer jo sterkere og yngre spilleren er. */
export function spillerverdi(p: Spiller): number {
  const alder = p.alder <= 23 ? 1.3 : p.alder <= 28 ? 1 : p.alder <= 31 ? 0.7 : 0.4
  return Math.round(150_000 * 1.1 ** (p.styrke - 30) * alder)
}

export const kjopspris = (p: Spiller) => Math.round(spillerverdi(p) * (1 + KJOPSPREMIE))
export const salgspris = (p: Spiller) => Math.round(spillerverdi(p) * (1 - SALGSRABATT))

export function troppsverdi(k: Klubb): number {
  return k.spillere.reduce((sum, p) => sum + spillerverdi(p), 0)
}

/** Divisjonens grunnverdi (navn, supportere, plassen i serien), spillerne og det du har bygd på stadion. */
export function klubbverdi(s: Spilltilstand): number {
  const k = s.klubb
  return k ? DIVISJONER[k.divisjon].verdi + troppsverdi(k) + k.stadion.investert : 0
}

// ─────────────────────────────────────────────── Stadion

export const nyttStadion = (): Klubb['stadion'] => ({ trinn: 0, flomlys: false, vip: false, investert: 0 })

export function plasser(k: Klubb): number {
  return STADIONTRINN[k.stadion.trinn].plasser
}

/** Publikum på en hjemmekamp: så mange som vil komme, men ikke flere enn det er plass til. */
export function tilskuere(k: Klubb, form: number): number {
  const vil = DIVISJONER[k.divisjon].publikum * (k.stadion.flomlys ? FLOMLYS.publikum : 1) * form
  return Math.min(plasser(k), Math.round(vil))
}

/** Formen før neste hjemmekamp: ×0,8 uten seire, ×1,4 med bare seire. */
export function form(k: Klubb): number {
  const meg = k.lag[0]
  return 0.8 + (0.6 * meg.vunnet) / Math.max(1, meg.spilt)
}

export function sponsorbelop(k: Klubb): number {
  return Math.round(DIVISJONER[k.divisjon].sponsor * (k.stadion.vip ? VIP.sponsor : 1))
}

/** Holder stadion lisenskravet i divisjonen? */
export function oppfyllerKrav(k: Klubb, divisjon: number): boolean {
  const krav = STADIONKRAV[divisjon]
  return k.stadion.trinn >= krav.trinn && (!krav.flomlys || k.stadion.flomlys)
}

/** Neste utbygging av en del, eller null når den er ferdig. */
export function nesteUtbygging(k: Klubb, del: Stadiondel): { navn: string; pris: number; plasser?: number } | null {
  if (del === 'tribune') {
    const neste = STADIONTRINN[k.stadion.trinn + 1]
    return neste ? { navn: neste.navn, pris: neste.pris, plasser: neste.plasser } : null
  }
  if (del === 'flomlys') return k.stadion.flomlys ? null : { navn: 'Flomlys', pris: FLOMLYS.pris }
  return k.stadion.vip ? null : { navn: 'VIP-losje', pris: VIP.pris }
}

/** Bygger ut stadion. Pengene går inn i klubbverdien og kostprisen. Muterer. */
export function bygg(s: Spilltilstand, k: Klubb, del: Stadiondel, pris: number): void {
  s.kontanter -= pris
  k.stadion.investert += pris
  k.kostpris = (k.kostpris ?? 0) + pris
  if (del === 'tribune') k.stadion.trinn++
  else if (del === 'flomlys') k.stadion.flomlys = true
  else k.stadion.vip = true
}

export function lonnPerDag(k: Klubb): number {
  return Math.round(k.spillere.reduce((sum, p) => sum + spillerverdi(p) * LONN_ANDEL, 0))
}

/** Snittet av de elleve beste. Mangler du spillere, fyller juniorer på med styrke 20. */
export function lagstyrke(k: Klubb): number {
  const beste = k.spillere.map((p) => p.styrke).sort((a, b) => b - a).slice(0, MIN_TROPP)
  while (beste.length < MIN_TROPP) beste.push(20)
  return beste.reduce((a, b) => a + b, 0) / MIN_TROPP
}

export function klubbstatus(s: Spilltilstand): number {
  return (s.klubb ? DIVISJONER[s.klubb.divisjon].status : 0) + (s.trofeer?.length ?? 0) * TROFE_STATUS
}

// ─────────────────────────────────────────────── Serien

/**
 * Kampene i en runde, som [hjemme, borte]. Rundt-bordet-metoden: lag 0 står
 * fast, de andre roterer ett hakk per runde, så alle møter alle én gang.
 */
export function rundensKamper(runde: number): [number, number][] {
  const andre = Array.from({ length: ANTALL_LAG - 1 }, (_, i) => i + 1)
  const rotert = [...andre.slice(runde % andre.length), ...andre.slice(0, runde % andre.length)]
  const rekke = [0, ...rotert]
  const kamper: [number, number][] = []
  for (let i = 0; i < ANTALL_LAG / 2; i++) {
    const a = rekke[i]
    const b = rekke[ANTALL_LAG - 1 - i]
    kamper.push((runde + i) % 2 === 0 ? [a, b] : [b, a])
  }
  return kamper
}

/** Neste kamp for laget ditt, eller null når sesongen er ferdigspilt. */
export function nesteKamp(k: Klubb): { motstander: Lag; hjemme: boolean } | null {
  if (k.runde >= RUNDER_PER_SESONG) return null
  const kamp = rundensKamper(k.runde).find(([h, b]) => h === 0 || b === 0)!
  return { motstander: k.lag[kamp[0] === 0 ? kamp[1] : kamp[0]], hjemme: kamp[0] === 0 }
}

export const poeng = (l: Lag) => l.vunnet * 3 + l.uavgjort

/** Tabellen: poeng, så målforskjell, så scorede mål. Gir lagenes indekser. */
export function tabell(k: Klubb): number[] {
  return k.lag
    .map((_, i) => i)
    .sort((a, b) => {
      const x = k.lag[a]
      const y = k.lag[b]
      return poeng(y) - poeng(x) || y.maalFor - y.maalMot - (x.maalFor - x.maalMot) || y.maalFor - x.maalFor || a - b
    })
}

export function plassering(k: Klubb): number {
  return tabell(k).indexOf(0) + 1
}

function nyttLag(navn: string, styrke: number, fra?: number): Lag {
  const l: Lag = { navn, styrke, spilt: 0, vunnet: 0, uavgjort: 0, tapt: 0, maalFor: 0, maalMot: 0 }
  if (fra !== undefined) l.fra = fra
  return l
}

/** Navnene som ikke er i bruk i noen divisjon. */
function ledigeNavn(k: Klubb): string[] {
  const brukt = new Set([k.navn, ...k.lag.map((l) => l.navn), ...(k.serier ?? []).flat().map((l) => l.navn)])
  return LAGNAVN.filter((n) => !brukt.has(n))
}

/** Et nytt lag rundt divisjonens nivå, med et navn som ikke er i bruk. */
function trekkLag(ledige: string[], divisjon: number, t: Terning): Motlag {
  const navn = ledige.splice(Math.floor(t.neste() * ledige.length), 1)[0]
  return { navn, styrke: Math.round(DIVISJONER[divisjon].styrke + t.mellom(-8, 8)) }
}

/** Din første serie: ditt lag og ni motstandere. */
function forsteSerie(k: Klubb, t: Terning): Lag[] {
  const ledige = ledigeNavn(k)
  const lag = [nyttLag(k.navn, 0)]
  while (lag.length < ANTALL_LAG) {
    const m = trekkLag(ledige, k.divisjon, t)
    lag.push(nyttLag(m.navn, m.styrke))
  }
  return lag
}

/**
 * Ti lag i hver av de andre divisjonene (Pakke 66). Brukes når klubben kjøpes,
 * og når en klubb fra før Pakke 66 får seriene sine.
 */
export function andreSerier(k: Klubb, t: Terning): Motlag[][] {
  const ledige = ledigeNavn(k)
  return DIVISJONER.map((_, d) => (d === k.divisjon ? [] : Array.from({ length: ANTALL_LAG }, () => trekkLag(ledige, d, t))))
}

/** Indeksene i `lag` som går opp: de to beste som får lov. Du får bare med et stadion som holder kravet. */
export function rykkerOpp(k: Klubb): number[] {
  if (k.divisjon >= DIVISJONER.length - 1) return []
  const sperret = !oppfyllerKrav(k, k.divisjon + 1)
  return tabell(k)
    .filter((i) => i !== 0 || !sperret)
    .slice(0, OPPRYKK)
}

/** Indeksene som går ned. I 4. divisjon blir du, og de to dårligste motstanderne forsvinner ut av serien. */
export function rykkerNed(k: Klubb): number[] {
  const rekke = tabell(k)
  return (k.divisjon > 0 ? rekke : rekke.filter((i) => i !== 0)).slice(-OPPRYKK)
}

type Flytting = Motlag & { fra?: number; deg?: boolean }

/**
 * Opp- og nedrykk i alle divisjonene. Din avgjøres av tabellen; de andre av
 * styrke pluss en sesong med flaks. Lag som forsvinner ut av 4. divisjon,
 * erstattes av nye nedenfra. Styrken trekkes mot divisjonens nivå og vandrer
 * litt, så et lag som rykker opp, ofte rykker ned igjen. Gir lagene som kom
 * til din divisjon. Muterer.
 */
function skiftSerier(k: Klubb, t: Terning): Flytting[] {
  const topp = DIVISJONER.length - 1
  const opp = rykkerOpp(k)
  const ned = rykkerNed(k)
  const nye: Flytting[][] = DIVISJONER.map(() => [])
  const ute: string[] = []
  const flytt = (m: Flytting, fra: number, til: number) => {
    if (til < 0) ute.push(m.navn)
    else nye[til].push(til === fra ? m : { ...m, fra })
  }
  for (let d = 0; d <= topp; d++) {
    if (d === k.divisjon) {
      for (const i of tabell(k)) {
        const m: Flytting = i === 0 ? { navn: k.navn, styrke: 0, deg: true } : { navn: k.lag[i].navn, styrke: k.lag[i].styrke }
        flytt(m, d, opp.includes(i) ? d + 1 : ned.includes(i) ? d - 1 : d)
      }
      continue
    }
    const rangert = k.serier[d]
      .map((m) => ({ m, x: m.styrke + t.mellom(-10, 10) }))
      .sort((a, b) => b.x - a.x)
      .map((r) => r.m)
    rangert.forEach((m, plass) => flytt(m, d, plass < OPPRYKK && d < topp ? d + 1 : plass >= rangert.length - OPPRYKK ? d - 1 : d))
  }
  // Nye lag fra 5. divisjon fyller 4. divisjon — ikke de som nettopp rykket ned dit.
  const brukt = new Set([...nye.flat().map((m) => m.navn), ...ute])
  const ledige = LAGNAVN.filter((n) => !brukt.has(n) && n !== k.navn)
  while (nye[0].length < ANTALL_LAG) nye[0].push({ ...trekkLag(ledige, 0, t), fra: -1 })
  for (let d = 0; d <= topp; d++) {
    for (const m of nye[d]) {
      if (!m.deg) m.styrke = Math.round(m.styrke + (DIVISJONER[d].styrke - m.styrke) * 0.25 + t.mellom(-3, 3))
    }
  }
  const min = nye.findIndex((l) => l.some((m) => m.deg))
  k.divisjon = min
  const andre = nye[min].filter((m) => !m.deg)
  k.lag = [nyttLag(k.navn, 0), ...andre.map((m) => nyttLag(m.navn, m.styrke, m.fra))]
  k.serier = nye.map((l, d) => (d === min ? [] : l.map(({ navn, styrke }) => ({ navn, styrke }))))
  return andre.filter((m) => m.fra !== undefined)
}

/** «2 000 plasser og flomlys» — det divisjonen krever. */
export function kravtekst(divisjon: number): string {
  const krav = STADIONKRAV[divisjon]
  return `${tall(STADIONTRINN[krav.trinn].plasser)} plasser${krav.flomlys ? ' og flomlys' : ''}`
}

/** «5. divisjon» for lag som kommer opp nedenfra. */
export const divisjonsnavn = (d: number) => (d < 0 ? '5. divisjon' : DIVISJONER[d].navn)

function nySpiller(k: Klubb, t: Terning, styrke: number): Spiller {
  return {
    id: k.nesteSpillerId++,
    navn: `${t.velg(FORNAVN)} ${t.velg(ETTERNAVN)}`,
    styrke: Math.max(1, Math.min(99, Math.round(styrke))),
    alder: t.heltall(18, 33),
  }
}

function nyttMarked(k: Klubb, t: Terning): Spiller[] {
  const base = DIVISJONER[k.divisjon].styrke
  return Array.from({ length: MARKED_ANTALL }, () => nySpiller(k, t, base + t.mellom(-10, 12))).sort((a, b) => b.styrke - a.styrke)
}

/** En ny klubb i 4. divisjon med fjorten spillere. Frøet er klubbens eget. */
export function nyKlubb(navn: string, frø: number): Klubb {
  const k: Klubb = {
    navn,
    divisjon: 0,
    sesong: 1,
    runde: 0,
    lag: [],
    spillere: [],
    marked: [],
    taktikk: 'balansert',
    frø,
    nesteSpillerId: 1,
    kamper: [],
    billetter: 0,
    sponsor: 0,
    lonn: 0,
    kostpris: 0,
    seire: 0,
    opprykk: 0,
    stadion: nyttStadion(),
    serier: [],
  }
  const t = new Terning(frø)
  k.lag = forsteSerie(k, t)
  for (let i = 0; i < 14; i++) k.spillere.push(nySpiller(k, t, DIVISJONER[0].styrke + t.mellom(-6, 4)))
  k.spillere.sort((a, b) => b.styrke - a.styrke)
  k.marked = nyttMarked(k, t)
  // Resten av ligaen trekkes til slutt, så troppen og prisen er de samme som før Pakke 66.
  k.serier = andreSerier(k, t)
  k.frø = t.fro
  return k
}

// ─────────────────────────────────────────────── Kampene

/** Poissonfordelt antall mål, med høyst ni. */
function maal(t: Terning, forventet: number): number {
  const grense = Math.exp(-forventet)
  let k = 0
  let p = t.neste()
  while (p > grense && k < 9) {
    k++
    p *= t.neste()
  }
  return k
}

/** Forventede mål for hjemme- og bortelaget. */
export function forventetMaal(hjemme: number, borte: number, th: Taktikk, tb: Taktikk): [number, number] {
  const diff = (hjemme - borte) / 10
  return [
    1.4 * Math.exp(0.35 * diff) * 1.15 * TAKTIKKER[th].egne * TAKTIKKER[tb].mot,
    1.4 * Math.exp(-0.35 * diff) * 0.9 * TAKTIKKER[tb].egne * TAKTIKKER[th].mot,
  ]
}

function registrer(l: Lag, egne: number, mot: number): void {
  l.spilt++
  l.maalFor += egne
  l.maalMot += mot
  if (egne > mot) l.vunnet++
  else if (egne === mot) l.uavgjort++
  else l.tapt++
}

/** Trekker fra kontantene. Rekker de ikke, låner banken deg resten. */
function betal(s: Spilltilstand, belop: number): void {
  s.kontanter -= belop
  if (s.kontanter < 0) {
    s.gjeld += -s.kontanter
    s.kontanter = 0
    meldBankenDekket(s, 'Klubben koster mer enn du har på konto. Banken legger resten på gjelden — med rente.')
  }
}

/** Spiller runden og gir din kamp. Muterer. */
function spillRunde(s: Spilltilstand, k: Klubb, t: Terning): Kamp {
  let din: Kamp | null = null
  for (const [h, b] of rundensKamper(k.runde)) {
    const sh = h === 0 ? lagstyrke(k) : k.lag[h].styrke
    const sb = b === 0 ? lagstyrke(k) : k.lag[b].styrke
    const [xh, xb] = forventetMaal(sh, sb, h === 0 ? k.taktikk : 'balansert', b === 0 ? k.taktikk : 'balansert')
    const mh = maal(t, xh)
    const mb = maal(t, xb)
    registrer(k.lag[h], mh, mb)
    registrer(k.lag[b], mb, mh)
    if (h === 0 || b === 0) {
      const hjemme = h === 0
      din = { sesong: k.sesong, runde: k.runde, motstander: k.lag[hjemme ? b : h].navn, hjemme, maalFor: hjemme ? mh : mb, maalMot: hjemme ? mb : mh }
    }
  }
  k.runde++
  const kamp = din!
  if (kamp.maalFor > kamp.maalMot) k.seire++
  // Billettinntekter på hjemmebane: flere kommer når laget vinner, men ikke flere enn stadion tar.
  if (kamp.hjemme) {
    kamp.tilskuere = tilskuere(k, form(k))
    const inntekt = kamp.tilskuere * DIVISJONER[k.divisjon].billettpris
    s.kontanter += inntekt
    s.totaltKlubb = (s.totaltKlubb ?? 0) + inntekt
    k.billetter += inntekt
  }
  k.kamper.push(kamp)
  if (k.kamper.length > 10) k.kamper.shift()
  return kamp
}

/** Ny sesong: opp- og nedrykk, trofeer, spillerne blir et år eldre, ny serie og ny sponsor. */
function sesongslutt(s: Spilltilstand, k: Klubb, t: Terning): Overskrift[] {
  const saker: Overskrift[] = []
  const plass = plassering(k)
  const div = DIVISJONER[k.divisjon]
  const fra = k.divisjon
  const opp = rykkerOpp(k)
  const sperret = plass <= OPPRYKK && fra < DIVISJONER.length - 1 && !opp.includes(0)
  if (plass === 1) {
    const navn = k.divisjon === DIVISJONER.length - 1 ? 'Seriemester i Eliteserien' : `Vinner av ${div.navn}`
    s.trofeer.push({ navn, sesong: k.sesong, klubb: k.navn })
    saker.push({ type: 'deg', tittel: `${k.navn} vinner ${div.navn}!`, tekst: 'Pokalen ble løftet foran fulle tribuner. Eieren spanderte kake på hele byen.' })
    leggTilHendelse(s, { tittel: 'Trofé', tekst: `${k.navn} vant ${div.navn}.`, alvor: 'info' })
  }
  const iSteden = opp.map((i) => k.lag[i].navn).filter((n) => n !== k.navn)
  const kom = skiftSerier(k, t)
  if (k.divisjon > fra) {
    k.opprykk++
    saker.push({ type: 'deg', tittel: `OPPRYKK: ${k.navn} til ${DIVISJONER[k.divisjon].navn}`, tekst: `Nummer ${plass} på tabellen holdt. Neste sesong venter tøffere motstand.` })
    leggTilHendelse(s, { tittel: 'Opprykk', tekst: `${k.navn} rykker opp til ${DIVISJONER[k.divisjon].navn}.`, alvor: 'info' })
  } else if (k.divisjon < fra) {
    saker.push({ type: 'deg', tittel: `Nedrykk for ${k.navn}`, tekst: `Nummer ${plass} holdt ikke. Supporterne krever nye spillere.` })
    leggTilHendelse(s, { tittel: 'Nedrykk', tekst: `${k.navn} rykker ned til ${DIVISJONER[k.divisjon].navn}.`, alvor: 'advarsel' })
  } else if (sperret) {
    const neste = DIVISJONER[fra + 1].navn
    saker.push({
      type: 'deg',
      tittel: `${k.navn} nektes opprykk`,
      tekst: `Nummer ${plass} på tabellen, men stadion fyller ikke kravet i ${neste}: ${kravtekst(fra + 1)}. ${iSteden.join(' og ')} går opp i stedet.`,
    })
    leggTilHendelse(s, { tittel: 'Nektet opprykk', tekst: `Stadion fyller ikke kravet i ${neste} (${kravtekst(fra + 1)}). ${iSteden.join(' og ')} går opp i stedet.`, alvor: 'advarsel' })
  }
  if (kom.length) {
    leggTilHendelse(s, {
      tittel: `Ny sesong i ${DIVISJONER[k.divisjon].navn}`,
      tekst: `Nye i serien: ${kom.map((m) => `${m.navn} (${m.fra! > k.divisjon ? 'ned' : 'opp'} fra ${divisjonsnavn(m.fra!)})`).join(', ')}.`,
      alvor: 'info',
    })
  }
  // Spillerne blir et år eldre: de unge blir bedre, de eldre dårligere, og de eldste legger opp.
  const pensjonert: string[] = []
  for (const p of k.spillere) {
    p.alder++
    const endring = p.alder <= 23 ? t.heltall(1, 4) : p.alder <= 28 ? t.heltall(-1, 2) : p.alder <= 31 ? t.heltall(-3, 0) : t.heltall(-5, -1)
    p.styrke = Math.max(1, Math.min(99, p.styrke + endring))
    if (p.alder >= PENSJONSALDER) pensjonert.push(p.navn)
  }
  k.spillere = k.spillere.filter((p) => p.alder < PENSJONSALDER).sort((a, b) => b.styrke - a.styrke)
  if (pensjonert.length) saker.push({ type: 'deg', tittel: `${pensjonert[0]} legger opp`, tekst: pensjonert.length > 1 ? `Også ${pensjonert.slice(1).join(' og ')} takker for seg.` : 'En lang karriere er over.' })

  k.sesong++
  k.runde = 0
  k.billetter = 0
  k.lonn = 0
  k.sponsor = 0
  betalSponsor(s, k)
  return saker
}

function betalSponsor(s: Spilltilstand, k: Klubb): void {
  const sponsor = sponsorbelop(k)
  s.kontanter += sponsor
  s.totaltKlubb = (s.totaltKlubb ?? 0) + sponsor
  k.sponsor += sponsor
}

/**
 * Klubben som er til salgs i dag under et navn. Frøet kommer fra navnet og
 * dagen, så troppen og prisen står fast hele dagen.
 */
export function klubbTilSalgs(s: Spilltilstand, navn: string): { klubb: Klubb; pris: number } {
  const klubb = nyKlubb(navn, hashTekst(`${navn}:${dagnummer(s.sek)}`))
  const pris = DIVISJONER[0].verdi + troppsverdi(klubb)
  klubb.kostpris = pris
  return { klubb, pris }
}

/** Første sesongs sponsoravtale betales når klubben kjøpes. Muterer. */
export function startKlubb(s: Spilltilstand, k: Klubb): void {
  s.klubb = k
  betalSponsor(s, k)
}

const resultat = (kamp: Kamp) => (kamp.maalFor > kamp.maalMot ? 'seier' : kamp.maalFor === kamp.maalMot ? 'uavgjort' : 'tap')

/**
 * Dagsskiftet for klubben: runden spilles, lønna betales, markedet fornyes,
 * og etter siste runde er sesongen over. Gir avisens saker. Muterer.
 */
export function klubbVedDagsskifte(s: Spilltilstand): Overskrift[] {
  const k = s.klubb
  if (!k) return []
  const t = new Terning(k.frø)
  const saker: Overskrift[] = []
  const kamp = spillRunde(s, k, t)
  const tekst = { seier: 'Tre nye poeng', uavgjort: 'Ett poeng', tap: 'Ingen poeng' }[resultat(kamp)]
  saker.push({
    type: 'deg',
    tittel: kamp.hjemme ? `${k.navn} ${kamp.maalFor}–${kamp.maalMot} ${kamp.motstander}` : `${kamp.motstander} ${kamp.maalMot}–${kamp.maalFor} ${k.navn}`,
    tekst: `${tekst} i ${DIVISJONER[k.divisjon].navn}. Laget ligger på ${plassering(k)}. plass.`,
  })
  const lonn = lonnPerDag(k)
  betal(s, lonn)
  s.totaltKlubb = (s.totaltKlubb ?? 0) - lonn
  k.lonn += lonn
  // Midt i sesongen: varsle hvis laget ligger an til opprykk, men stadion ikke holder kravet.
  if (k.runde === STADIONVARSEL_RUNDE && k.divisjon < DIVISJONER.length - 1 && plassering(k) <= OPPRYKK && !oppfyllerKrav(k, k.divisjon + 1)) {
    leggTilHendelse(s, {
      tittel: 'Stadionkrav',
      tekst: `${k.navn} ligger på opprykksplass, men ${DIVISJONER[k.divisjon + 1].navn} krever ${kravtekst(k.divisjon + 1)}. Bygg ut før sesongen er over, ellers går neste lag opp i stedet.`,
      alvor: 'advarsel',
    })
  }
  if (k.runde >= RUNDER_PER_SESONG) saker.push(...sesongslutt(s, k, t))
  k.marked = nyttMarked(k, t)
  k.frø = t.fro
  return saker
}
