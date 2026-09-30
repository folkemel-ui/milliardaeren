/**
 * Fotballklubben. Du kjøper en klubb i 4. divisjon og spiller én kamp hver
 * spilldag. En sesong er ni runder — alle møter alle én gang — og etter siste
 * runde rykker de to beste opp og de to dårligste ned.
 *
 * Laget ditt er så sterkt som snittet av de elleve beste spillerne. Taktikken
 * flytter sjansene: angrep gir flere mål begge veier, forsvar færre.
 *
 * Klubben har sin egen terning, så det å eie en klubb ikke endrer kursene
 * eller noe annet i spillet. Klubben er verdt divisjonens grunnverdi pluss
 * spillerne — å kjøpe den flytter bare penger, som alt annet.
 */

import { leggTilHendelse } from './bank'
import { dagnummer } from './kalender'
import { hashTekst, Terning } from './rng'
import type { Kamp, Klubb, Lag, Overskrift, Spiller, Spilltilstand, Taktikk } from './types'

export const DIVISJONER = [
  { navn: '4. divisjon', styrke: 35, verdi: 5_000_000, billett: 50_000, sponsor: 250_000, status: 3 },
  { navn: '3. divisjon', styrke: 45, verdi: 15_000_000, billett: 200_000, sponsor: 1_500_000, status: 8 },
  { navn: '2. divisjon', styrke: 55, verdi: 40_000_000, billett: 600_000, sponsor: 5_000_000, status: 20 },
  { navn: '1. divisjon', styrke: 65, verdi: 100_000_000, billett: 2_000_000, sponsor: 15_000_000, status: 45 },
  { navn: 'Eliteserien', styrke: 75, verdi: 250_000_000, billett: 6_000_000, sponsor: 60_000_000, status: 90 },
] as const

/** Klubben er til salgs når formuen din en gang har vært så stor. */
export const KLUBB_LAAST_OPP = 10_000_000
export const ANTALL_LAG = 10
export const RUNDER_PER_SESONG = ANTALL_LAG - 1
/** De to beste rykker opp, de to dårligste ned. */
export const OPPRYKK = 2
export const MIN_TROPP = 11
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

const LAGNAVN = [
  'Lyngdal SK', 'Bjørkeli FK', 'Skogly FK', 'Vestnes IL', 'Sjøholt SK', 'Fjellstad FK', 'Brattvåg IF', 'Øyrane IL',
  'Kvitfjell BK', 'Storvik FK', 'Heggedal IF', 'Marka SK', 'Tindeland FK', 'Dalsbygda IL', 'Steinvik BK', 'Bølgen FK',
  'Rypefjord IL', 'Furuly SK', 'Strandebarm IF', 'Holmen FK', 'Vindheim BK', 'Lia IL', 'Nesna SK', 'Kjerringøy FK',
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

/** Divisjonens grunnverdi (stadion, navn, supportere) pluss spillerne. */
export function klubbverdi(s: Spilltilstand): number {
  const k = s.klubb
  return k ? DIVISJONER[k.divisjon].verdi + troppsverdi(k) : 0
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

function nyttLag(navn: string, styrke: number): Lag {
  return { navn, styrke, spilt: 0, vunnet: 0, uavgjort: 0, tapt: 0, maalFor: 0, maalMot: 0 }
}

/** En ny serie: ditt lag og ni motstandere rundt divisjonens nivå. */
function nySerie(k: Klubb, t: Terning): Lag[] {
  const ledige = LAGNAVN.filter((n) => n !== k.navn)
  const lag = [nyttLag(k.navn, 0)]
  const base = DIVISJONER[k.divisjon].styrke
  while (lag.length < ANTALL_LAG) {
    const navn = ledige.splice(Math.floor(t.neste() * ledige.length), 1)[0]
    lag.push(nyttLag(navn, Math.round(base + t.mellom(-8, 8))))
  }
  return lag
}

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
  }
  const t = new Terning(frø)
  k.lag = nySerie(k, t)
  for (let i = 0; i < 14; i++) k.spillere.push(nySpiller(k, t, DIVISJONER[0].styrke + t.mellom(-6, 4)))
  k.spillere.sort((a, b) => b.styrke - a.styrke)
  k.marked = nyttMarked(k, t)
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
  // Billettinntekter på hjemmebane — mer når laget vinner.
  if (kamp.hjemme) {
    const meg = k.lag[0]
    const inntekt = Math.round(DIVISJONER[k.divisjon].billett * (0.8 + (0.6 * meg.vunnet) / Math.max(1, meg.spilt)))
    s.kontanter += inntekt
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
  if (plass === 1) {
    const navn = k.divisjon === DIVISJONER.length - 1 ? 'Seriemester i Eliteserien' : `Vinner av ${div.navn}`
    s.trofeer.push({ navn, sesong: k.sesong, klubb: k.navn })
    saker.push({ type: 'deg', tittel: `${k.navn} vinner ${div.navn}!`, tekst: 'Pokalen ble løftet foran fulle tribuner. Eieren spanderte kake på hele byen.' })
    leggTilHendelse(s, { tittel: 'Trofé', tekst: `${k.navn} vant ${div.navn}.`, alvor: 'info' })
  }
  if (plass <= OPPRYKK && k.divisjon < DIVISJONER.length - 1) {
    k.divisjon++
    k.opprykk++
    saker.push({ type: 'deg', tittel: `OPPRYKK: ${k.navn} til ${DIVISJONER[k.divisjon].navn}`, tekst: `Nummer ${plass} på tabellen holdt. Neste sesong venter tøffere motstand.` })
    leggTilHendelse(s, { tittel: 'Opprykk', tekst: `${k.navn} rykker opp til ${DIVISJONER[k.divisjon].navn}.`, alvor: 'info' })
  } else if (plass > ANTALL_LAG - OPPRYKK && k.divisjon > 0) {
    k.divisjon--
    saker.push({ type: 'deg', tittel: `Nedrykk for ${k.navn}`, tekst: `Nummer ${plass} holdt ikke. Supporterne krever nye spillere.` })
    leggTilHendelse(s, { tittel: 'Nedrykk', tekst: `${k.navn} rykker ned til ${DIVISJONER[k.divisjon].navn}.`, alvor: 'advarsel' })
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
  k.lag = nySerie(k, t)
  k.billetter = 0
  k.lonn = 0
  k.sponsor = 0
  betalSponsor(s, k)
  return saker
}

function betalSponsor(s: Spilltilstand, k: Klubb): void {
  const sponsor = DIVISJONER[k.divisjon].sponsor
  s.kontanter += sponsor
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
  k.lonn += lonn
  if (k.runde >= RUNDER_PER_SESONG) saker.push(...sesongslutt(s, k, t))
  k.marked = nyttMarked(k, t)
  k.frø = t.fro
  return saker
}
