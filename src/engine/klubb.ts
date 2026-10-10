/**
 * Fotballklubben. Du kjøper en klubb i 4. divisjon og spiller én kamp hver
 * spilldag. En sesong er ni runder — alle møter alle én gang — og etter siste
 * runde rykker de to beste opp og de to dårligste ned — men bare med et stadion
 * som holder kravet i divisjonen over. Lagene går igjen: alle fem divisjonene
 * står i lagringen, og de andre avgjøres av styrke og flaks (Pakke 66).
 *
 * Hver spiller har en posisjon, et angrep og et forsvar (Pakke 71). Du velger
 * formasjon; den beste som er igjen tar hver plass, og en spiller utenfor sin
 * posisjon teller mindre. Lagets angrep gir målene du scorer, forsvaret målene
 * du slipper inn. Taktikken flytter sjansene: angrep gir flere mål begge veier,
 * forsvar færre — hver passer sin kamp. Akademiet sender juniorer opp hver
 * sesong, med et tak de vokser mot.
 *
 * Klubben har sin egen terning, så det å eie en klubb ikke endrer kursene
 * eller noe annet i spillet. Klubben er verdt divisjonens grunnverdi pluss
 * spillerne og stadion — å kjøpe den eller bygge ut flytter bare penger.
 */

import { leggTilHendelse, meldBankenDekket } from './bank'
import { dagnummer } from './kalender'
import { hashTekst, Terning } from './rng'
import { kortKroner, tall } from './tall'
import type { Akademi, Formasjon, Kamp, Klubb, Lag, Maalhendelse, Motlag, Overskrift, Posisjon, Sesongoppsummering, Spiller, Spillerstatistikk, Spillervurdering, Spilltilstand, Taktikk, Turnering, Utslag } from './types'

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
/** Hvert trofé gir så mange statuspoeng … */
export const TROFE_STATUS = 3
/** … og et europeisk så mange (Pakke 73). */
export const EUROPA_STATUS = 5
const MARKED_ANTALL = 6
const PENSJONSALDER = 35

/**
 * Taktikkene (Pakke 71): faktorene er valgt så hver passer sin kamp, regnet
 * eksakt på Poisson-målene for styrkegap fra −30 til +30. Forsvar gir flest
 * poeng når du er klart svakere (fra ~10 under hjemme, ~2 under borte),
 * Balansert i en jevn kamp, Angrep når du er klart sterkere (fra ~4 over
 * hjemme, ~10 over borte). Før var Forsvar best i hver eneste kamp du ikke
 * var sterkere i.
 */
export const TAKTIKKER: Record<Taktikk, { navn: string; beskrivelse: string; egne: number; mot: number }> = {
  forsvar: { navn: 'Forsvar', beskrivelse: 'Færre mål begge veier. Best når motstanderen er klart sterkere.', egne: 0.7, mot: 0.75 },
  balansert: { navn: 'Balansert', beskrivelse: 'Vanlig spill. Best i en jevn kamp.', egne: 1, mot: 1 },
  angrep: { navn: 'Angrep', beskrivelse: 'Flere mål begge veier. Best når du er klart sterkere.', egne: 1.3, mot: 1.4 },
}

// ─────────────────────────────────────────────── Posisjoner og formasjoner (Pakke 71)

/**
 * Posisjonene, med vekten angrep og forsvar har i spillerens styrke — og i
 * lagets: en spiss teller mest i angrepet, en stopper i forsvaret, keeperen
 * bare i forsvaret.
 */
export const POSISJONER: Record<Posisjon, { navn: string; kort: string; angrep: number; forsvar: number }> = {
  keeper: { navn: 'Keeper', kort: 'K', angrep: 0, forsvar: 1 },
  forsvar: { navn: 'Forsvar', kort: 'F', angrep: 0.25, forsvar: 0.75 },
  midtbane: { navn: 'Midtbane', kort: 'M', angrep: 0.5, forsvar: 0.5 },
  angrep: { navn: 'Angrep', kort: 'A', angrep: 0.75, forsvar: 0.25 },
}
export const POSISJONSLISTE = Object.keys(POSISJONER) as Posisjon[]

export const FORMASJONER: Record<Formasjon, Record<Posisjon, number>> = {
  '4-4-2': { keeper: 1, forsvar: 4, midtbane: 4, angrep: 2 },
  '4-3-3': { keeper: 1, forsvar: 4, midtbane: 3, angrep: 3 },
  '5-3-2': { keeper: 1, forsvar: 5, midtbane: 3, angrep: 2 },
}
export const FORMASJONSLISTE = Object.keys(FORMASJONER) as Formasjon[]

/** En spiller utenfor sin posisjon teller så mye … */
export const UTE_AV_POSISJON = 0.7
/** … og en utespiller i mål (eller en keeper på banen) så mye. */
export const UTEN_KEEPER = 0.4
/** En tom plass fylles av en junior fra gata med så mye i både angrep og forsvar. */
export const TOM_PLASS = 20

/** Posisjonene de fjorten første får, så en ny klubb kan stille 4-4-2 — og de atten plassene gamle tropper fordeles på. */
export const STARTPOSISJONER: Posisjon[] = [
  'keeper', 'forsvar', 'forsvar', 'midtbane', 'angrep', 'forsvar', 'midtbane', 'angrep', 'forsvar', 'midtbane', 'keeper', 'midtbane', 'angrep', 'forsvar',
  'midtbane', 'angrep', 'forsvar', 'keeper',
]
/** Markedet trekker posisjon herfra: én keeper av ni. */
const POSISJONSVEKT: Posisjon[] = ['keeper', 'forsvar', 'forsvar', 'forsvar', 'midtbane', 'midtbane', 'midtbane', 'angrep', 'angrep']

const klem = (n: number) => Math.max(1, Math.min(99, Math.round(n)))

/** Styrken: angrep og forsvar veid etter posisjonen. */
export function styrkeAv(posisjon: Posisjon, angrep: number, forsvar: number): number {
  const v = POSISJONER[posisjon]
  return klem(angrep * v.angrep + forsvar * v.forsvar)
}

/**
 * Deler en styrke i angrep og forsvar etter posisjonen, så styrken står:
 * en spiss får angrepet over og forsvaret under, en stopper omvendt, en
 * midtbanespiller nesten likt, en keeper bare forsvar. `spredning` er 0–1
 * fra terningen eller en hash.
 */
export function delStyrke(styrke: number, posisjon: Posisjon, spredning: number): { angrep: number; forsvar: number } {
  if (posisjon === 'keeper') return { angrep: klem(styrke - 15 - Math.round(spredning * 15)), forsvar: klem(styrke) }
  if (posisjon === 'midtbane') {
    const e = Math.round(spredning * 10) - 5
    return { angrep: klem(styrke + e), forsvar: klem(styrke - e) }
  }
  const d = 5 + Math.round(spredning * 10)
  return posisjon === 'angrep'
    ? { angrep: klem(styrke + Math.round(0.25 * d)), forsvar: klem(styrke - Math.round(0.75 * d)) }
    : { angrep: klem(styrke - Math.round(0.75 * d)), forsvar: klem(styrke + Math.round(0.25 * d)) }
}

/** Hvor mye en spiller teller på en plass: alt i egen posisjon, mindre utenfor, lite i mål uten keeper. */
export function plassfaktor(posisjon: Posisjon, plass: Posisjon): number {
  if (posisjon === plass) return 1
  if (posisjon === 'keeper' || plass === 'keeper') return UTEN_KEEPER
  return UTE_AV_POSISJON
}

export interface Startplass {
  plass: Posisjon
  /** null: ingen igjen — en junior fra gata står der. */
  spiller: Spiller | null
}

/**
 * Startelleveren for formasjonen: plass for plass — keeperen først, så
 * forsvar, midtbane og angrep — tar den beste som er igjen, regnet med
 * plassfaktoren. Mangler folk, står plassen tom.
 */
export function startellever(k: Klubb): Startplass[] {
  const igjen = [...k.spillere]
  const ut: Startplass[] = []
  for (const plass of POSISJONSLISTE) {
    for (let i = 0; i < FORMASJONER[k.formasjon][plass]; i++) {
      let beste = -1
      let verdi = -1
      for (let j = 0; j < igjen.length; j++) {
        const v = igjen[j].styrke * plassfaktor(igjen[j].posisjon, plass)
        if (v > verdi) {
          verdi = v
          beste = j
        }
      }
      ut.push({ plass, spiller: beste >= 0 ? igjen.splice(beste, 1)[0] : null })
    }
  }
  return ut
}

/** Id-ene som starter neste kamp. */
export function starterIds(k: Klubb): Set<number> {
  const ids = new Set<number>()
  for (const s of startellever(k)) if (s.spiller) ids.add(s.spiller.id)
  return ids
}

export interface Lagprofil {
  angrep: number
  forsvar: number
}

/** Hvor mye hver plass teller i lagets angrep og forsvar. */
const LAGVEKT: Record<'angrep' | 'forsvar', Record<Posisjon, number>> = {
  angrep: { keeper: 0, forsvar: 0.25, midtbane: 0.6, angrep: 1 },
  forsvar: { keeper: 1, forsvar: 1, midtbane: 0.6, angrep: 0.25 },
}

/**
 * Lagets angrep og forsvar: startelleverens angrep og forsvar, veid etter
 * plassen og ganget med plassfaktoren. Elleve spisser taper i forsvaret, og
 * et lag uten keeper slipper inn.
 */
export function lagprofil(k: Klubb): Lagprofil {
  const ut = { angrep: 0, forsvar: 0 }
  for (const side of ['angrep', 'forsvar'] as const) {
    let sum = 0
    let vekt = 0
    for (const { plass, spiller } of startellever(k)) {
      const w = LAGVEKT[side][plass]
      sum += w * (spiller ? spiller[side] * plassfaktor(spiller.posisjon, plass) : TOM_PLASS)
      vekt += w
    }
    ut[side] = sum / vekt
  }
  return ut
}

// ─────────────────────────────────────────────── Akademiet (Pakke 71)

/** Trinnene: hvor mange juniorer som kommer opp hver sesong, og hvor gode de er mot divisjonens nivå. */
export const AKADEMITRINN = [
  { navn: 'Ingen juniorer', pris: 0, juniorer: 0, nivaa: [0, 0] },
  { navn: 'Juniorlag', pris: 2_000_000, juniorer: 1, nivaa: [-20, -10] },
  { navn: 'Akademi', pris: 12_000_000, juniorer: 2, nivaa: [-15, -5] },
  { navn: 'Talentfabrikk', pris: 60_000_000, juniorer: 3, nivaa: [-10, 0] },
] as const
export const JUNIOR_ALDER = [16, 17] as const
/** En junior kan vokse så mye over det han kommer opp med … */
export const POTENSIAL_LOFT = [10, 30] as const
/** … med så mye per sesong til han er 23. */
export const JUNIOR_VEKST = [2, 6] as const
export const JUNIOR_TIL = 23
/** Spennet spilleren får se rundt potensialet. */
export const POTENSIAL_SPENN = 14

export const nyttAkademi = (): Akademi => ({ trinn: 0, investert: 0 })

export function nesteAkademi(k: Klubb): (typeof AKADEMITRINN)[number] | null {
  return AKADEMITRINN[k.akademi.trinn + 1] ?? null
}

/** Bygger akademiet ett trinn. Pengene går inn i klubbverdien og kostprisen. Muterer. */
export function byggAkademi(s: Spilltilstand, k: Klubb, pris: number): void {
  s.kontanter -= pris
  k.akademi.investert += pris
  k.kostpris = (k.kostpris ?? 0) + pris
  k.akademi.trinn++
}

/** «Kan bli 55–69»: et spenn rundt potensialet, forskjøvet etter en hash så taket ikke kan leses av. */
export function potensialspenn(p: Spiller): [number, number] | null {
  if (p.potensial === undefined || p.alder > JUNIOR_TIL) return null
  const skyv = (hashTekst(`${p.id}:${p.navn}:spenn`) >>> 0) % (POTENSIAL_SPENN - 3)
  const lav = Math.max(1, p.potensial - 2 - skyv)
  return [lav, Math.min(99, lav + POTENSIAL_SPENN)]
}

/** Juniorene som kommer opp ved sesongslutt — så lenge det er plass i troppen. */
function nyeJuniorer(k: Klubb, t: Terning): Spiller[] {
  const trinn = AKADEMITRINN[k.akademi.trinn]
  const ut: Spiller[] = []
  for (let i = 0; i < trinn.juniorer && k.spillere.length + ut.length < MAKS_TROPP; i++) {
    const styrke = DIVISJONER[k.divisjon].styrke + t.mellom(trinn.nivaa[0], trinn.nivaa[1])
    const p = nySpiller(k, t, styrke, t.velg(POSISJONSVEKT))
    p.alder = t.heltall(JUNIOR_ALDER[0], JUNIOR_ALDER[1])
    p.potensial = klem(p.styrke + t.heltall(POTENSIAL_LOFT[0], POTENSIAL_LOFT[1]))
    ut.push(p)
  }
  return ut
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
  return k ? DIVISJONER[k.divisjon].verdi + troppsverdi(k) + k.stadion.investert + (k.akademi?.investert ?? 0) : 0
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

/** Lagstyrken: snittet av lagets angrep og forsvar (Pakke 71) — det tallet motstanderne har ett av. */
export function lagstyrke(k: Klubb): number {
  const { angrep, forsvar } = lagprofil(k)
  return (angrep + forsvar) / 2
}

export function klubbstatus(s: Spilltilstand): number {
  let sum = s.klubb ? DIVISJONER[s.klubb.divisjon].status : 0
  for (const t of s.trofeer ?? []) sum += t.navn === EUROPAMESTER ? EUROPA_STATUS : TROFE_STATUS
  return sum
}

// ─────────────────────────────────────────────── Cupen, Europa og pengene (Pakke 73)

/** TV-penger per sesong, betalt ved sesongstart sammen med sponsoren. */
export const TV_PENGER = [300_000, 1_500_000, 6_000_000, 20_000_000, 60_000_000] as const
/** Premie ved sesongslutt, som andel av TV-pengene: vinneren alt, toeren halvparten, treeren en firedel. */
export const PLASSPREMIE = [1, 0.5, 0.25] as const
/** Cupen: så stor andel av divisjonens TV-penger for hver runde du vinner … */
export const CUP_RUNDEPREMIE = 0.02
/** … og så mye til cupmesteren. */
export const CUP_PREMIE = 40_000_000
/** Europa: premien for hver runde du vinner — kvartfinalen, semifinalen og finalen. */
export const EUROPA_PREMIER = [10_000_000, 20_000_000, 40_000_000] as const
export const CUPMESTER = 'Cupmester'
export const EUROPAMESTER = 'Europamester'
/** Rundenavnene i cupen (seks runder) og i Europa (tre). */
export const CUPRUNDER = ['1. runde', '2. runde', '3. runde', 'Kvartfinale', 'Semifinale', 'Finale'] as const
export const EUROPARUNDER = ['Kvartfinale', 'Semifinale', 'Finale'] as const
/** Dagen i sesongen (1–9) hver cuprunde spilles, og hver Europa-runde. */
export const CUPDAGER = [1, 3, 5, 7, 8, 9] as const
export const EUROPADAGER = [2, 4, 6] as const
/** Så mange lag står over første runde: Eliteserien og de fire beste i 1. divisjon. */
export const CUPSEEDER = 14
/** Europeiske klubber å trekke blant; styrkene ligger over Eliteserien (75). */
export const EUROPAKLUBBER = [
  'Real Castellano', 'Athletic Montserra', 'Olympique Valcourt', 'FC Bergamonte', 'Dynamo Ostwald', 'Sparta Vltavia',
  'Noordzee FC', 'Dunmore Celtic', 'Alvorada SC', 'Bosporus SK', 'Rapid Donaustadt', 'Hansa Küstenstadt',
  'Steaua Carpatia', 'Brøndhavn BK', 'Malmköping FF', 'Helsingin Kotka',
] as const
export const EUROPA_STYRKE = [78, 92] as const

export function tvpenger(k: Klubb): number {
  return TV_PENGER[k.divisjon]
}

/** Alle de femti lagene med styrke: din divisjon fra tabellen, resten fra seriene. Du er med som deg. */
function alleLag(k: Klubb): (Motlag & { deg?: boolean; divisjon: number })[] {
  const ut: (Motlag & { deg?: boolean; divisjon: number })[] = []
  for (let d = 0; d < DIVISJONER.length; d++) {
    if (d === k.divisjon) {
      for (const l of k.lag) ut.push(l.navn === k.navn ? { navn: k.navn, styrke: 0, deg: true, divisjon: d } : { navn: l.navn, styrke: l.styrke, divisjon: d })
    } else for (const m of k.serier[d]) ut.push({ navn: m.navn, styrke: m.styrke, divisjon: d })
  }
  return ut
}

/** Ny cup ved sesongstart: alle femti, de fjorten beste står over første runde. Trekningen har sin egen terning. */
export function nyCup(k: Klubb): Utslag {
  const alle = alleLag(k)
  const styrkeAv = (l: (typeof alle)[number]) => (l.deg ? lagstyrke(k) : l.styrke)
  const seedet = new Set<string>()
  for (const l of alle) if (l.divisjon === DIVISJONER.length - 1) seedet.add(l.navn)
  for (const l of alle.filter((x) => x.divisjon === DIVISJONER.length - 2).sort((a, b) => styrkeAv(b) - styrkeAv(a)).slice(0, CUPSEEDER - ANTALL_LAG)) seedet.add(l.navn)
  const frø = hashTekst(`${k.navn}:${k.sesong}:cup`)
  const t = new Terning(frø)
  // De useedede trekkes først, så første runde kan spilles rett av lista; seedene legges bakerst.
  const useedet = stokk(alle.filter((l) => !seedet.has(l.navn)), t)
  const seeder = stokk(alle.filter((l) => seedet.has(l.navn)), t)
  return { sesong: k.sesong, runde: 0, lag: [...useedet, ...seeder].map(({ navn, styrke, deg }) => (deg ? { navn, styrke, deg } : { navn, styrke })), ute: false, naadd: 0, frø: t.fro }
}

/** Europa neste sesong, for Eliteserie-mesteren: sju klubber fra lista, trukket med egen terning. */
export function nyEuropa(k: Klubb, sesong: number): Utslag {
  const frø = hashTekst(`${k.navn}:${sesong}:europa`)
  const t = new Terning(frø)
  const klubber = stokk([...EUROPAKLUBBER], t).slice(0, 7)
  const lag = klubber.map((navn) => ({ navn, styrke: Math.round(t.mellom(EUROPA_STYRKE[0], EUROPA_STYRKE[1])) }))
  return { sesong, runde: 0, lag: stokk([{ navn: k.navn, styrke: 0, deg: true }, ...lag], t), ute: false, naadd: 0, frø: t.fro }
}

function stokk<T>(liste: T[], t: Terning): T[] {
  const ut = [...liste]
  for (let i = ut.length - 1; i > 0; i--) {
    const j = Math.floor(t.neste() * (i + 1))
    ;[ut[i], ut[j]] = [ut[j], ut[i]]
  }
  return ut
}

/** Hvor langt du kom: rundenavnet du røk ut i, eller mesteren. */
export function naaddTekst(u: Utslag, turnering: Turnering): string {
  const runder = turnering === 'cup' ? CUPRUNDER : EUROPARUNDER
  if (!u.ute && u.lag.length === 1 && u.lag[0].deg) return turnering === 'cup' ? CUPMESTER : EUROPAMESTER
  if (!u.ute) return `Venter på ${runder[u.runde] ?? runder[runder.length - 1].toLowerCase()}`
  return runder[Math.min(u.naadd, runder.length - 1)]
}

/** Neste motstander i turneringen, når du er med og runden er trukket av lista. Du er alltid i et par. */
export function nesteUtslagskamp(u: Utslag | undefined): Motlag | null {
  if (!u || u.ute) return null
  const i = u.lag.findIndex((l) => l.deg)
  if (i < 0) return null
  // Første cuprunde: de fjorten seedene står bakerst og spiller ikke.
  const spiller = u.runde === 0 && u.lag.length > 32 ? u.lag.length - CUPSEEDER : u.lag.length
  if (i >= spiller) return null
  const j = i % 2 === 0 ? i + 1 : i - 1
  return j < spiller ? u.lag[j] : null
}

/** Legger penger i klubbkassa. Muterer. */
function inntekt(s: Spilltilstand, k: Klubb, felt: 'tv' | 'premier', belop: number): void {
  s.kontanter += belop
  s.totaltKlubb = (s.totaltKlubb ?? 0) + belop
  k[felt] = (k[felt] ?? 0) + belop
}

/**
 * Din kamp utenfor serien: samme regnestykke og rapport som en seriekamp, men
 * med turneringens terning, og uavgjort avgjøres på straffer. Muterer.
 */
function spillUtslagskamp(s: Spilltilstand, k: Klubb, t: Terning, mot: Motlag, hjemme: boolean, turnering: Turnering, runde: number): Kamp {
  const ditt = lagprofil(k)
  const [xh, xb] = hjemme ? forventetMaal(ditt, mot.styrke, k.taktikk, 'balansert') : forventetMaal(mot.styrke, ditt, 'balansert', k.taktikk)
  const mh = maal(t, xh)
  const mb = maal(t, xb)
  const kamp: Kamp = { sesong: k.sesong, runde, motstander: mot.navn, hjemme, maalFor: hjemme ? mh : mb, maalMot: hjemme ? mb : mh, turnering }
  kamprapport(k, kamp, hjemme ? xh : xb, hjemme ? xb : xh)
  if (kamp.maalFor === kamp.maalMot) kamp.straffer = t.sjanse(0.5) ? 'deg' : 'dem'
  if (kamp.hjemme) {
    kamp.tilskuere = tilskuere(k, form(k))
    const billett = kamp.tilskuere * DIVISJONER[k.divisjon].billettpris
    s.kontanter += billett
    s.totaltKlubb = (s.totaltKlubb ?? 0) + billett
    k.billetter += billett
  }
  k.kamper.push(kamp)
  if (k.kamper.length > 10) k.kamper.shift()
  return kamp
}

const vantDu = (kamp: Kamp) => kamp.maalFor > kamp.maalMot || kamp.straffer === 'deg'

/**
 * Spiller en runde i en utslagsturnering: parene fra lista i rekkefølge,
 * vinnerne går videre. Andres kamper avgjøres av styrke og turneringens
 * terning; din spilles som en kamp med rapport. Gir din kamp, om du spilte.
 * Muterer.
 */
function spillUtslagsrunde(s: Spilltilstand, k: Klubb, u: Utslag, turnering: Turnering): Kamp | null {
  const t = new Terning(u.frø)
  const runder = turnering === 'cup' ? CUPRUNDER : EUROPARUNDER
  const spiller = u.runde === 0 && u.lag.length > 32 ? u.lag.length - CUPSEEDER : u.lag.length
  const videre: Utslag['lag'] = []
  let din: Kamp | null = null
  for (let i = 0; i + 1 < spiller; i += 2) {
    const a = u.lag[i]
    const b = u.lag[i + 1]
    if (a.deg || b.deg) {
      const hjemme = !!a.deg
      const mot = hjemme ? b : a
      din = spillUtslagskamp(s, k, t, mot, hjemme, turnering, u.runde)
      videre.push(vantDu(din) ? (hjemme ? a : b) : mot)
    } else {
      const [xa, xb] = forventetMaal(a.styrke, b.styrke, 'balansert', 'balansert')
      const ma = maal(t, xa)
      const mb = maal(t, xb)
      videre.push(ma > mb || (ma === mb && t.sjanse(0.5)) ? a : b)
    }
  }
  for (let i = spiller; i < u.lag.length; i++) videre.push(u.lag[i])
  if (din) {
    if (vantDu(din)) {
      u.naadd = u.runde + 1
      inntekt(s, k, 'premier', turnering === 'cup' ? Math.round(tvpenger(k) * CUP_RUNDEPREMIE) : EUROPA_PREMIER[u.runde])
    } else u.ute = true
  }
  u.lag = stokk(videre, t)
  u.runde++
  u.frø = t.fro
  // Mesteren: bare du igjen.
  if (!u.ute && u.runde >= runder.length) u.lag = u.lag.filter((l) => l.deg)
  return din
}

/** Cupen og Europa på dagens dag i sesongen. Gir avisens saker. Muterer. */
function spillTurneringer(s: Spilltilstand, k: Klubb, dag: number): Overskrift[] {
  const saker: Overskrift[] = []
  if (dag === 1) k.cup = nyCup(k)
  for (const turnering of ['cup', 'europa'] as const) {
    const u = k[turnering]
    const dager = turnering === 'cup' ? CUPDAGER : EUROPADAGER
    const runde = (dager as readonly number[]).indexOf(dag)
    if (!u || runde < 0 || u.runde !== runde) continue
    const runder = turnering === 'cup' ? CUPRUNDER : EUROPARUNDER
    const navn = turnering === 'cup' ? 'Cupen' : 'Europa'
    const din = spillUtslagsrunde(s, k, u, turnering)
    if (!din) continue
    const vant = vantDu(din)
    const siste = u.runde >= runder.length
    if (vant && siste) {
      const trofe = turnering === 'cup' ? CUPMESTER : EUROPAMESTER
      s.trofeer.push({ navn: trofe, sesong: k.sesong, klubb: k.navn })
      if (turnering === 'cup') inntekt(s, k, 'premier', CUP_PREMIE)
      saker.push({ type: 'deg', tittel: `${k.navn} er ${trofe.toLowerCase()}!`, tekst: `${din.maalFor}–${din.maalMot} mot ${din.motstander} i finalen${din.straffer ? ', avgjort på straffer' : ''}. Byen feiret til langt på natt.` })
      leggTilHendelse(s, { tittel: 'Trofé', tekst: `${k.navn} vant ${navn.toLowerCase() === 'cupen' ? 'cupen' : 'Europa'}.`, alvor: 'info' })
    } else {
      const scorere = scorertekst(din)
      saker.push({
        type: 'deg',
        tittel: `${navn}: ${din.hjemme ? `${k.navn} ${din.maalFor}–${din.maalMot} ${din.motstander}` : `${din.motstander} ${din.maalMot}–${din.maalFor} ${k.navn}`}`,
        tekst: `${runder[u.runde - 1]}${din.straffer ? `, avgjort på straffer — ${vant ? 'videre' : 'ute'}` : vant ? ' — videre' : ' — ute'}.${scorere ? ` Mål: ${scorere}.` : ''}`,
      })
    }
  }
  return saker
}

/** TV-pengene for sesongen, med sponsoren. Muterer. */
function betalTv(s: Spilltilstand, k: Klubb): void {
  inntekt(s, k, 'tv', tvpenger(k))
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

function nySpiller(k: Klubb, t: Terning, styrke: number, posisjon: Posisjon = t.velg(POSISJONSVEKT)): Spiller {
  const s = klem(styrke)
  const { angrep, forsvar } = delStyrke(s, posisjon, t.neste())
  return {
    id: k.nesteSpillerId++,
    navn: `${t.velg(FORNAVN)} ${t.velg(ETTERNAVN)}`,
    styrke: s,
    alder: t.heltall(18, 33),
    posisjon,
    angrep,
    forsvar,
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
    formasjon: '4-4-2',
    akademi: nyttAkademi(),
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
  for (let i = 0; i < 14; i++) k.spillere.push(nySpiller(k, t, DIVISJONER[0].styrke + t.mellom(-6, 4), STARTPOSISJONER[i]))
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

/**
 * Forventede mål for hjemme- og bortelaget: hjemmelagets angrep mot
 * bortelagets forsvar, og omvendt (Pakke 71). Et lag gitt som ett tall har
 * samme angrep og forsvar — da er regnestykket det samme som før.
 */
export function forventetMaal(hjemme: number | Lagprofil, borte: number | Lagprofil, th: Taktikk, tb: Taktikk): [number, number] {
  const h = typeof hjemme === 'number' ? { angrep: hjemme, forsvar: hjemme } : hjemme
  const b = typeof borte === 'number' ? { angrep: borte, forsvar: borte } : borte
  return [
    1.4 * Math.exp((0.35 * (h.angrep - b.forsvar)) / 10) * 1.15 * TAKTIKKER[th].egne * TAKTIKKER[tb].mot,
    1.4 * Math.exp((0.35 * (b.angrep - h.forsvar)) / 10) * 0.9 * TAKTIKKER[tb].egne * TAKTIKKER[th].mot,
  ]
}

// ─────────────────────────────────────────────── Kamprapporten (Pakke 72)

/** Så ofte en plass scorer, alt annet likt: en spiss fire ganger så ofte som en back, keeperen aldri. */
const SCORERVEKT: Record<Posisjon, number> = { keeper: 0, forsvar: 1, midtbane: 2, angrep: 4 }
/** Hvor mange sesonger som huskes. */
export const SESONGER_HUSKET = 20
/** Årets spiller må ha spilt så mange kamper. */
export const KAMPER_FOR_PRIS = 5

const tomStatistikk = (): Spillerstatistikk => ({ kamper: 0, maal: 0, assist: 0, sum: 0 })

/** Snittvurderingen, eller null uten kamper. */
export function snittvurdering(st: Spillerstatistikk | undefined): number | null {
  return st && st.kamper > 0 ? Math.round((st.sum / st.kamper) * 10) / 10 : null
}

/** Trekker en spiller blant elleveren, veid etter plass og angrep; `ikke` holdes utenfor (assisten er en annen). */
function trekkScorer(t: Terning, elleve: { spiller: Spiller; plass: Posisjon }[], ikke?: number): Spiller | null {
  let sum = 0
  const vekter = elleve.map(({ spiller, plass }) => {
    const v = spiller.id === ikke ? 0 : SCORERVEKT[plass] * spiller.angrep
    sum += v
    return v
  })
  if (sum <= 0) return null
  let x = t.neste() * sum
  for (let i = 0; i < elleve.length; i++) {
    x -= vekter[i]
    if (x < 0) return elleve[i].spiller
  }
  return elleve[elleve.length - 1].spiller
}

/**
 * Rapporten for din kamp, trukket ETTER resultatet med en egen terning fra
 * klubben, sesongen og runden — så tabellen og klubbens terning står som
 * før Pakke 72, og den samme kampen leser likt hver gang. Hvert mål får et
 * minutt og en scorer (dine fra startelleveren, veid etter plass og angrep,
 * med en assist fra en annen; motstanderens et navn fra listene), og hver
 * av de elleve en vurdering: angrep og midtbane fra hva laget scoret mot
 * forventningen, forsvar og keeper fra hva det slapp inn, pluss mål og
 * assist og rent bur. Muterer spillernes statistikk.
 */
function kamprapport(k: Klubb, kamp: Kamp, forventetFor: number, forventetMot: number): void {
  const t = new Terning(hashTekst(`${k.navn}:${kamp.sesong}:${kamp.runde}:rapport`))
  const elleve = startellever(k).filter((p): p is { plass: Posisjon; spiller: Spiller } => p.spiller !== null)
  const hendelser: Maalhendelse[] = []
  const scoret = new Map<number, number>()
  const assistert = new Map<number, number>()
  for (let i = 0; i < kamp.maalFor; i++) {
    const scorer = trekkScorer(t, elleve)
    const assist = scorer && t.sjanse(0.7) ? trekkScorer(t, elleve, scorer.id) : null
    hendelser.push({ minutt: t.heltall(1, 90), navn: scorer ? scorer.navn : 'Selvmål', id: scorer?.id, assist: assist?.navn, mot: false })
    if (scorer) scoret.set(scorer.id, (scoret.get(scorer.id) ?? 0) + 1)
    if (assist) assistert.set(assist.id, (assistert.get(assist.id) ?? 0) + 1)
  }
  for (let i = 0; i < kamp.maalMot; i++) {
    const navn = t.velg(ETTERNAVN)
    hendelser.push({ minutt: t.heltall(1, 90), navn, mot: true })
    const nokkel = `${navn} (${kamp.motstander})`
    k.toppscorere = { ...(k.toppscorere ?? {}), [nokkel]: ((k.toppscorere ?? {})[nokkel] ?? 0) + 1 }
  }
  hendelser.sort((a, b) => a.minutt - b.minutt)
  kamp.maal = hendelser
  const vurderinger: Spillervurdering[] = []
  for (const { spiller, plass } of elleve) {
    const fremme = plass === 'angrep' ? 1 : plass === 'midtbane' ? 0.5 : 0
    const basis = 6 + fremme * (kamp.maalFor - forventetFor) * 0.6 + (1 - fremme) * (forventetMot - kamp.maalMot) * 0.6
    let v = basis + (scoret.get(spiller.id) ?? 0) + 0.5 * (assistert.get(spiller.id) ?? 0) + (fremme === 0 && kamp.maalMot === 0 ? 0.5 : 0) + t.mellom(-0.4, 0.4)
    v = Math.round(Math.max(4, Math.min(10, v)) * 10) / 10
    vurderinger.push({ id: spiller.id, navn: spiller.navn, plass, vurdering: v })
    for (const st of [(spiller.sesong ??= tomStatistikk()), (spiller.karriere ??= tomStatistikk())]) {
      st.kamper++
      st.maal += scoret.get(spiller.id) ?? 0
      st.assist += assistert.get(spiller.id) ?? 0
      st.sum += v
    }
  }
  kamp.vurderinger = vurderinger
  kamp.beste = vurderinger.reduce((b, v) => (v.vurdering > b.vurdering ? v : b), vurderinger[0])?.id
}

/** «Hansen (12), Berg (77)» — dine scorere, til avisa. */
export function scorertekst(kamp: Kamp): string {
  const egne = (kamp.maal ?? []).filter((m) => !m.mot)
  return egne.map((m) => `${m.navn.split(' ').at(-1)} (${m.minutt})`).join(', ')
}

/** Divisjonens toppscorere denne sesongen: dine spillere og motstandernes, de fem beste. */
export function toppscorere(k: Klubb, antall = 5): { navn: string; maal: number; deg: boolean }[] {
  const liste = k.spillere.filter((p) => (p.sesong?.maal ?? 0) > 0).map((p) => ({ navn: p.navn, maal: p.sesong!.maal, deg: true }))
  for (const [navn, maal] of Object.entries(k.toppscorere ?? {})) liste.push({ navn, maal, deg: false })
  return liste.sort((a, b) => b.maal - a.maal || a.navn.localeCompare(b.navn)).slice(0, antall)
}

/** Sesongens toppscorer i troppen og årets spiller (beste snitt med minst KAMPER_FOR_PRIS kamper). */
export function sesongpriser(k: Klubb): { toppscorer: Sesongoppsummering['toppscorer']; aaretsSpiller: Sesongoppsummering['aaretsSpiller'] } {
  let toppscorer: Sesongoppsummering['toppscorer'] = null
  let aaretsSpiller: Sesongoppsummering['aaretsSpiller'] = null
  for (const p of k.spillere) {
    const st = p.sesong
    if (!st) continue
    if (st.maal > 0 && (!toppscorer || st.maal > toppscorer.maal)) toppscorer = { navn: p.navn, maal: st.maal }
    const snitt = snittvurdering(st)
    if (snitt !== null && st.kamper >= KAMPER_FOR_PRIS && (!aaretsSpiller || snitt > aaretsSpiller.snitt)) aaretsSpiller = { navn: p.navn, snitt }
  }
  return { toppscorer, aaretsSpiller }
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
  const ditt = lagprofil(k)
  for (const [h, b] of rundensKamper(k.runde)) {
    const sh = h === 0 ? ditt : k.lag[h].styrke
    const sb = b === 0 ? ditt : k.lag[b].styrke
    const [xh, xb] = forventetMaal(sh, sb, h === 0 ? k.taktikk : 'balansert', b === 0 ? k.taktikk : 'balansert')
    const mh = maal(t, xh)
    const mb = maal(t, xb)
    registrer(k.lag[h], mh, mb)
    registrer(k.lag[b], mb, mh)
    if (h === 0 || b === 0) {
      const hjemme = h === 0
      din = { sesong: k.sesong, runde: k.runde, motstander: k.lag[hjemme ? b : h].navn, hjemme, maalFor: hjemme ? mh : mb, maalMot: hjemme ? mb : mh }
      // Rapporten trekkes etter resultatet, med sin egen terning (Pakke 72).
      kamprapport(k, din, hjemme ? xh : xb, hjemme ? xb : xh)
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
  // Sesongen som var (Pakke 72): skrives før tabellen byttes ut.
  const meg = k.lag[0]
  const priser = sesongpriser(k)
  const oppsummering: Sesongoppsummering = {
    sesong: k.sesong,
    divisjon: fra,
    plass,
    poeng: poeng(meg),
    maalFor: meg.maalFor,
    maalMot: meg.maalMot,
    toppscorer: priser.toppscorer,
    aaretsSpiller: priser.aaretsSpiller,
    billetter: k.billetter,
    sponsor: k.sponsor,
    lonn: k.lonn,
    utfall: 'samme',
    neste: fra,
  }
  if (priser.aaretsSpiller) saker.push({ type: 'deg', tittel: `${priser.aaretsSpiller.navn} er årets spiller i ${k.navn}`, tekst: `Snitt ${tall(priser.aaretsSpiller.snitt, 1)} over sesongen.${priser.toppscorer ? ` Toppscorer: ${priser.toppscorer.navn} med ${priser.toppscorer.maal} mål.` : ''}` })
  // Plasspremien (Pakke 73): vinneren får TV-pengene en gang til, toeren halvparten, treeren en firedel.
  if (plass <= PLASSPREMIE.length) {
    const premie = Math.round(tvpenger(k) * PLASSPREMIE[plass - 1])
    inntekt(s, k, 'premier', premie)
    saker.push({ type: 'deg', tittel: `${kortKroner(premie)} i premie til ${k.navn}`, tekst: `Nummer ${plass} i ${div.navn} gir penger i kassa.` })
  }
  oppsummering.tv = k.tv ?? 0
  oppsummering.premier = k.premier ?? 0
  if (k.cup) oppsummering.cup = naaddTekst(k.cup, 'cup')
  if (k.europa) oppsummering.europa = naaddTekst(k.europa, 'europa')
  if (plass === 1) {
    const navn = k.divisjon === DIVISJONER.length - 1 ? 'Seriemester i Eliteserien' : `Vinner av ${div.navn}`
    oppsummering.trofe = navn
    s.trofeer.push({ navn, sesong: k.sesong, klubb: k.navn })
    saker.push({ type: 'deg', tittel: `${k.navn} vinner ${div.navn}!`, tekst: 'Pokalen ble løftet foran fulle tribuner. Eieren spanderte kake på hele byen.' })
    leggTilHendelse(s, { tittel: 'Trofé', tekst: `${k.navn} vant ${div.navn}.`, alvor: 'info' })
  }
  const iSteden = opp.map((i) => k.lag[i].navn).filter((n) => n !== k.navn)
  const kom = skiftSerier(k, t)
  oppsummering.utfall = k.divisjon > fra ? 'opp' : k.divisjon < fra ? 'ned' : sperret ? 'nektet' : 'samme'
  oppsummering.neste = k.divisjon
  k.sesonger = [...(k.sesonger ?? []), oppsummering].slice(-SESONGER_HUSKET)
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
  // En junior fra akademiet vokser raskere, men aldri over taket sitt (Pakke 71).
  const pensjonert: string[] = []
  for (const p of k.spillere) {
    p.alder++
    const junior = p.potensial !== undefined && p.alder <= JUNIOR_TIL
    let endring = junior ? t.heltall(JUNIOR_VEKST[0], JUNIOR_VEKST[1]) : p.alder <= 23 ? t.heltall(1, 4) : p.alder <= 28 ? t.heltall(-1, 2) : p.alder <= 31 ? t.heltall(-3, 0) : t.heltall(-5, -1)
    if (junior) endring = Math.min(endring, p.potensial! - p.styrke)
    p.angrep = klem(p.angrep + endring)
    p.forsvar = klem(p.forsvar + endring)
    p.styrke = styrkeAv(p.posisjon, p.angrep, p.forsvar)
    if (p.alder >= PENSJONSALDER) pensjonert.push(p.navn)
  }
  k.spillere = k.spillere.filter((p) => p.alder < PENSJONSALDER).sort((a, b) => b.styrke - a.styrke)
  if (pensjonert.length) saker.push({ type: 'deg', tittel: `${pensjonert[0]} legger opp`, tekst: pensjonert.length > 1 ? `Også ${pensjonert.slice(1).join(' og ')} takker for seg.` : 'En lang karriere er over.' })
  const juniorer = nyeJuniorer(k, t)
  if (juniorer.length) {
    k.spillere = [...k.spillere, ...juniorer].sort((a, b) => b.styrke - a.styrke)
    const navn = juniorer.map((p) => `${p.navn} (${p.alder})`)
    saker.push({ type: 'deg', tittel: `${juniorer.length === 1 ? 'Ny junior' : `${juniorer.length} nye juniorer`} fra akademiet`, tekst: `${navn.join(', ')} rykker opp i A-troppen. Treneren ser et tak et stykke over dagens nivå.` })
  }

  k.sesong++
  k.runde = 0
  k.billetter = 0
  k.lonn = 0
  k.sponsor = 0
  // Sesongtallene nullstilles; karrieren står (Pakke 72).
  for (const p of k.spillere) delete p.sesong
  delete k.toppscorere
  // Cupen er over; Europa venter Eliteserie-mesteren neste sesong (Pakke 73).
  delete k.cup
  delete k.tv
  delete k.premier
  if (fra === DIVISJONER.length - 1 && plass === 1) {
    k.europa = nyEuropa(k, k.sesong)
    saker.push({ type: 'deg', tittel: `${k.navn} skal spille i Europa`, tekst: `Seriegullet gir plass i kvartfinalen mot ${nesteUtslagskamp(k.europa)?.navn ?? 'Europas beste'}. Kampene spilles mellom seriekampene.` })
  } else delete k.europa
  betalSponsor(s, k)
  betalTv(s, k)
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

/** Første sesongs sponsoravtale og TV-penger betales når klubben kjøpes. Muterer. */
export function startKlubb(s: Spilltilstand, k: Klubb): void {
  s.klubb = k
  betalSponsor(s, k)
  betalTv(s, k)
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
  const scorere = scorertekst(kamp)
  const beste = kamp.vurderinger?.find((v) => v.id === kamp.beste)
  saker.push({
    type: 'deg',
    tittel: kamp.hjemme ? `${k.navn} ${kamp.maalFor}–${kamp.maalMot} ${kamp.motstander}` : `${kamp.motstander} ${kamp.maalMot}–${kamp.maalFor} ${k.navn}`,
    tekst: `${tekst} i ${DIVISJONER[k.divisjon].navn}.${scorere ? ` Mål: ${scorere}.` : ''}${beste ? ` Banens beste: ${beste.navn} (${tall(beste.vurdering, 1)}).` : ''} Laget ligger på ${plassering(k)}. plass.`,
  })
  // Cupen og Europa spilles ved siden av serien, på faste dager i sesongen (Pakke 73).
  saker.push(...spillTurneringer(s, k, k.runde))
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
