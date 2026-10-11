/**
 * Eiendom, luksus, lager og status: tall som beskriver verden, og de rene
 * utregningene som hører til.
 */

import { eiendomskurs } from './regioner'
import { dagnummer, dato } from './kalender'
import type {
  By,
  EiendomId,
  Eiendomstype,
  LagerId,
  LuksusId,
  LuksusKategori,
  Luksusgjenstand,
  Spilltilstand,
} from './types'
import { klubbstatus } from './klubb'
import { jordverdi } from './jord'
import { landemerkeleiePerSek, landemerkestatus, landemerkeverdi } from './landemerker'
import { kunststatus } from './kunst'
import { premiumstatus } from './ansatte'
import { dagsbilde } from './verden'
import { FORVALTER_ANDEL, forvalter, leiefaktorBy } from './utleie'
import { hjemstatus } from './hjemmene'
import { unikeI, unikstatus, unikverdi } from './unike'
import { racingstatus, racingverdi } from './racing'

// ─────────────────────────────────────────────── Eiendom

/**
 * Eiendommene gir leie hvert sekund — også mens du er borte, uten leder.
 * Avkastningen faller jevnt med prisen: 30 % i timen for en hybel, rundt
 * 18 % for et kontorbygg, 8 % i en toppleilighet på Manhattan og 5,5 % for
 * skyskraperen der (Pakke 76). Den er trygg og krever
 * ingenting av deg, men slår ikke bedriftene når de vokser.
 *
 * Fra Pakke 44 finnes de vanlige byggene i flere byer. Samme bygg har samme
 * avkastning overalt, men prisen følger byen: Oslo rundt 20 % over Bergen,
 * Trondheim rundt 10 % under, hytter i Trysil og Lofoten billigere enn Geilo.
 * Hver by har sin egen region med sin egen pristrend (regioner.ts).
 */
export const EIENDOMSTYPER: Record<EiendomId, Eiendomstype> = {
  'hybel-trondheim': { id: 'hybel-trondheim', navn: 'Hybel', sted: 'Moholt, Trondheim', by: 'Trondheim', pris: 225_000, avkastning: 0.3, maksAntall: 8, statuskrav: 0 },
  hybel: { id: 'hybel', navn: 'Hybel', sted: 'Møhlenpris, Bergen', by: 'Bergen', pris: 250_000, avkastning: 0.3, maksAntall: 8, statuskrav: 0 },
  'hybel-oslo': { id: 'hybel-oslo', navn: 'Hybel', sted: 'Blindern, Oslo', by: 'Oslo', pris: 300_000, avkastning: 0.3, maksAntall: 8, statuskrav: 0 },
  'leilighet-trondheim': { id: 'leilighet-trondheim', navn: 'Leilighet', sted: 'Bakklandet, Trondheim', by: 'Trondheim', pris: 1_900_000, avkastning: 0.25, maksAntall: 6, statuskrav: 0 },
  'leilighet-bergen': { id: 'leilighet-bergen', navn: 'Leilighet', sted: 'Nordnes, Bergen', by: 'Bergen', pris: 2_100_000, avkastning: 0.25, maksAntall: 6, statuskrav: 0 },
  leilighet: { id: 'leilighet', navn: 'Leilighet', sted: 'Grünerløkka, Oslo', by: 'Oslo', pris: 2_500_000, avkastning: 0.25, maksAntall: 6, statuskrav: 0 },
  'rekkehus-bergen': { id: 'rekkehus-bergen', navn: 'Rekkehus', sted: 'Fana, Bergen', by: 'Bergen', pris: 5_700_000, avkastning: 0.24, maksAntall: 5, statuskrav: 0 },
  rekkehus: { id: 'rekkehus', navn: 'Rekkehus', sted: 'Madla, Stavanger', by: 'Stavanger', pris: 6_000_000, avkastning: 0.24, maksAntall: 5, statuskrav: 0 },
  'hytte-lofoten': { id: 'hytte-lofoten', navn: 'Rorbu', sted: 'Reine, Lofoten', by: 'Lofoten', pris: 10_000_000, avkastning: 0.22, maksAntall: 3, statuskrav: 0 },
  'hytte-trysil': { id: 'hytte-trysil', navn: 'Hytte', sted: 'Trysilfjellet', by: 'Trysil', pris: 12_000_000, avkastning: 0.22, maksAntall: 4, statuskrav: 0 },
  hytte: { id: 'hytte', navn: 'Hytte', sted: 'Geilo', by: 'Geilo', pris: 15_000_000, avkastning: 0.22, maksAntall: 4, statuskrav: 0 },
  stockholm: { id: 'stockholm', navn: 'Leilighet på Östermalm', sted: 'Östermalm, Stockholm', by: 'Stockholm', pris: 30_000_000, avkastning: 0.2, maksAntall: 3, statuskrav: 0, reise: 1 },
  'marbella-leilighet': { id: 'marbella-leilighet', navn: 'Ferieleilighet', sted: 'Marbella, Spania', by: 'Marbella', pris: 45_000_000, avkastning: 0.19, maksAntall: 3, statuskrav: 0, reise: 2, sesong: 'sommer' },
  'kontorbygg-stavanger': { id: 'kontorbygg-stavanger', navn: 'Kontorbygg', sted: 'Forus, Stavanger', by: 'Stavanger', pris: 70_000_000, avkastning: 0.18, maksAntall: 3, statuskrav: 0 },
  kontorbygg: { id: 'kontorbygg', navn: 'Kontorbygg', sted: 'Bjørvika, Oslo', by: 'Oslo', pris: 80_000_000, avkastning: 0.18, maksAntall: 4, statuskrav: 0 },
  'zermatt-leilighet': { id: 'zermatt-leilighet', navn: 'Skileilighet', sted: 'Zermatt, Sveits', by: 'Zermatt', pris: 90_000_000, avkastning: 0.18, maksAntall: 3, statuskrav: 0, reise: 2, sesong: 'vinter' },
  kobenhavn: { id: 'kobenhavn', navn: 'Kontorhus i Nyhavn', sted: 'Nyhavn, København', by: 'København', pris: 150_000_000, avkastning: 0.17, maksAntall: 3, statuskrav: 0, reise: 1 },
  amsterdam: { id: 'amsterdam', navn: 'Kanalhus i Jordaan', sted: 'Jordaan, Amsterdam', by: 'Amsterdam', pris: 350_000_000, avkastning: 0.16, maksAntall: 3, statuskrav: 0, reise: 2 },
  kjopesenter: { id: 'kjopesenter', navn: 'Kjøpesenter', sted: 'Trondheim', by: 'Trondheim', pris: 400_000_000, avkastning: 0.15, maksAntall: 3, statuskrav: 0 },
  berlin: { id: 'berlin', navn: 'Bygård i Mitte', sted: 'Mitte, Berlin', by: 'Berlin', pris: 500_000_000, avkastning: 0.14, maksAntall: 3, statuskrav: 0, reise: 2 },
  'marbella-hotell': { id: 'marbella-hotell', navn: 'Strandhotell', sted: 'Costa del Sol, Spania', by: 'Marbella', pris: 700_000_000, avkastning: 0.14, maksAntall: 2, statuskrav: 0, reise: 2, sesong: 'sommer' },
  roma: { id: 'roma', navn: 'Palazzo i Trastevere', sted: 'Trastevere, Roma', by: 'Roma', pris: 800_000_000, avkastning: 0.135, maksAntall: 2, statuskrav: 0, reise: 2 },
  'zermatt-hotell': { id: 'zermatt-hotell', navn: 'Alpehotell', sted: 'Zermatt, Sveits', by: 'Zermatt', pris: 900_000_000, avkastning: 0.135, maksAntall: 2, statuskrav: 0, reise: 2, sesong: 'vinter' },
  london: { id: 'london', navn: 'Byhus i Mayfair', sted: 'Mayfair, London', by: 'London', pris: 1_200_000_000, avkastning: 0.13, maksAntall: 2, statuskrav: 0, reise: 2 },
  naeringsbygg: { id: 'naeringsbygg', navn: 'Næringsbygg', sted: 'Aker Brygge, Oslo', by: 'Oslo', pris: 1_500_000_000, avkastning: 0.12, maksAntall: 2, statuskrav: 3 },
  paris: { id: 'paris', navn: 'Leilighet i Le Marais', sted: 'Le Marais, Paris', by: 'Paris', pris: 2_000_000_000, avkastning: 0.115, maksAntall: 2, statuskrav: 0, reise: 2 },
  dubai: { id: 'dubai', navn: 'Villa på Palmen', sted: 'Palm Jumeirah, Dubai', by: 'Dubai', pris: 4_000_000_000, avkastning: 0.1, maksAntall: 2, statuskrav: 0, reise: 3 },
  oy: { id: 'oy', navn: 'Privat øy', sted: 'Lofoten', by: 'Lofoten', pris: 6_000_000_000, avkastning: 0.05, maksAntall: 1, statuskrav: 5 },
  newyork: { id: 'newyork', navn: 'Toppleilighet på Manhattan', sted: 'Manhattan, New York', by: 'New York', pris: 12_000_000_000, avkastning: 0.08, maksAntall: 1, statuskrav: 0, reise: 3 },
  // Pakke 76: det sene spillet. Over 12 mrd var det ingenting å kjøpe; nå går stigen
  // til 500 mrd, alt før 1 000 mrd-streken, i byer som har valuta og plass på kartet.
  'canary-wharf': { id: 'canary-wharf', navn: 'Kontortårn i Canary Wharf', sted: 'Canary Wharf, London', by: 'London', pris: 25_000_000_000, avkastning: 0.07, maksAntall: 2, statuskrav: 0, reise: 2, utenforByen: true },
  kjopesenterkjede: { id: 'kjopesenterkjede', navn: 'Kjøpesenterkjede', sted: 'Tolv sentre, hovedkontor i Oslo', by: 'Oslo', pris: 75_000_000_000, avkastning: 0.065, maksAntall: 1, statuskrav: 0, utenforByen: true },
  'downtown-dubai': { id: 'downtown-dubai', navn: 'Skyskraper i Downtown Dubai', sted: 'Downtown, Dubai', by: 'Dubai', pris: 200_000_000_000, avkastning: 0.06, maksAntall: 1, statuskrav: 0, reise: 3, utenforByen: true },
  'manhattan-skyskraper': { id: 'manhattan-skyskraper', navn: 'Skyskraper på Manhattan', sted: 'Midtown, New York', by: 'New York', pris: 500_000_000_000, avkastning: 0.055, maksAntall: 1, statuskrav: 0, reise: 3, utenforByen: true },
}

export const EIENDOMSSTIGEN = Object.keys(EIENDOMSTYPER) as EiendomId[]

/** Du kan se og kjøpe en eiendom når formuen din en gang har vært så stor andel av prisen. */
export const EIENDOM_SYNLIG_VED = 0.8
/** Meglerhonorar når du selger. */
export const MEGLERHONORAR = 0.03

// ─────────────────────────────────────────────── Reiser

/** Flyene, i rekkefølge: hvert fly når like langt som de før det, og litt til. */
export const FLY_REKKEFOLGE: LuksusId[] = ['propellfly', 'forretningsjet', 'langdistansejet']

/** Hvor langt du kan reise: 0 uten fly, ellers nummeret på det beste flyet du eier. */
export function reiseNivaa(s: Spilltilstand): number {
  return FLY_REKKEFOLGE.reduce((beste, id, i) => (s.luksus.includes(id) ? i + 1 : beste), 0)
}

/** Flyet som skal til for å kjøpe en eiendom, eller null når den er i Norge. */
export function flyFor(id: EiendomId): LuksusId | null {
  const reise = EIENDOMSTYPER[id].reise
  return reise ? FLY_REKKEFOLGE[reise - 1] : null
}

export function kanReiseTil(s: Spilltilstand, id: EiendomId): boolean {
  return reiseNivaa(s) >= (EIENDOMSTYPER[id].reise ?? 0)
}

/** Utenlandsbyene du eier eiendom i. */
export function byerUtenlands(s: Spilltilstand): Set<string> {
  const byer = new Set<string>()
  // Bare eiendommene i utlandet — prestasjonene spør hvert sekund.
  for (const id of UTENLANDSEIENDOM) if ((s.eiendommer[id] ?? 0) > 0) byer.add(EIENDOMSTYPER[id].by)
  return byer
}

const UTENLANDSEIENDOM = EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].reise)

export const UTENLANDSBYER = [...new Set(EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].reise).map((id) => EIENDOMSTYPER[id].by))]

// ─────────────────────────────────────────────── Standard og oppussing

/**
 * Standardene en eiendomstype kan pusses opp til. Oppussing gir mer leie og
 * høyere verdi, men koster en andel av prisen per enhet og tar noen dager —
 * uten leie mens håndverkerne holder på.
 */
export const STANDARDER = [
  { navn: 'Normal', leie: 1, verdi: 1, kostnad: 0, dager: 0 },
  { navn: 'Oppusset', leie: 1.3, verdi: 1.15, kostnad: 0.25, dager: 2 },
  { navn: 'Luksus', leie: 1.7, verdi: 1.35, kostnad: 0.4, dager: 3 },
]

/*
 * `?.` på eiendomStandard og oppussing er med vilje: migreringskjeden kjører
 * dagens motorkode på lagringer fra før feltene fantes (f.eks. regnes
 * nettoformuen ut i trinn 4 → 5). Da betyr et manglende felt «normal
 * standard» og «ingen oppussing».
 */
export function standard(s: Spilltilstand, id: EiendomId): number {
  return s.eiendomStandard?.[id] ?? 0
}

/** Pris (og verdi) for én enhet: katalogpris × eiendomsindeks × standardens verdifaktor. */
export function eiendomspris(s: Spilltilstand, id: EiendomId): number {
  return EIENDOMSTYPER[id].pris * eiendomskurs(s, EIENDOMSTYPER[id].by) * STANDARDER[standard(s, id)].verdi
}

/**
 * Hva én ny enhet koster (Pakke 57): grunnprisen pluss oppussingen den hopper
 * over — like mye som å kjøpe en vanlig og pusse den opp, bare uten dagene uten
 * leie. Verdien etterpå er eiendomspris, som for en oppusset enhet. Før kostet
 * den bare verdien (×1,35 på Luksus mot ×1,65), så å pusse opp én og kjøpe
 * resten etterpå var 7 % billigere.
 */
export function kjopsprisEiendom(s: Spilltilstand, id: EiendomId): number {
  const oppussing = STANDARDER.slice(1, standard(s, id) + 1).reduce((sum, x) => sum + x.kostnad, 0)
  return EIENDOMSTYPER[id].pris * eiendomskurs(s, EIENDOMSTYPER[id].by) * (1 + oppussing)
}

/** Det forvalteren i byen tar av et kjøp der (Pakke 57): 5 % av prisen, eller null uten forvalter. */
export function forvalterpaaslag(s: Spilltilstand, id: EiendomId): number {
  return forvalter(s, EIENDOMSTYPER[id].by) ? kjopsprisEiendom(s, id) * FORVALTER_ANDEL : 0
}

/** Hva det koster å pusse opp alle enhetene av en type ett trinn, eller null når det ikke går. */
export function oppussingspris(s: Spilltilstand, id: EiendomId): number | null {
  const neste = STANDARDER[standard(s, id) + 1]
  const antall = s.eiendommer[id] ?? 0
  if (!neste || antall === 0) return null
  return antall * EIENDOMSTYPER[id].pris * eiendomskurs(s, EIENDOMSTYPER[id].by) * neste.kostnad
}

/** Alt i eiendomsfanen: boliger og næringsbygg, jord og skog, og landemerker. */
export function eiendomsverdi(s: Spilltilstand): number {
  if (!harEiendom(s)) return jordverdi(s) + landemerkeverdi(s)
  // Regnes hvert sekund: byens kurs regnes én gang per by, og bare for det du eier.
  BYKURS.fill(NaN)
  let sum = 0
  for (let i = 0; i < EIENDOMSSTIGEN.length; i++) {
    const id = EIENDOMSSTIGEN[i]
    const antall = s.eiendommer[id] ?? 0
    if (antall <= 0) continue
    const t = EIENDOMSTYPER[id]
    const nr = BYNR[i]
    let kurs = BYKURS[nr]
    if (Number.isNaN(kurs)) BYKURS[nr] = kurs = eiendomskurs(s, t.by)
    // Samme regnestykke som eiendomspris.
    sum += antall * (t.pris * kurs * STANDARDER[standard(s, id)].verdi)
  }
  return sum + jordverdi(s) + landemerkeverdi(s)
}

/**
 * Sesongene (Pakke 45): leien ganges med månedens faktor, januar først.
 * Snittet over året er 1, så en feriebolig tjener det samme som en vanlig
 * eiendom til samme pris — men det lønner seg å eie den i høysesongen.
 */
export const SESONGER: Record<'sommer' | 'vinter', number[]> = {
  sommer: [0.5, 0.5, 0.6, 0.8, 1.2, 1.6, 1.8, 1.8, 1.2, 0.8, 0.6, 0.6],
  vinter: [1.7, 1.7, 1.5, 0.9, 0.5, 0.6, 0.9, 0.9, 0.5, 0.5, 0.8, 1.5],
}

/** Leiefaktoren for en eiendom akkurat nå: 1 uten sesong, ellers månedens faktor. */
export function sesongfaktor(s: Spilltilstand, id: EiendomId): number {
  const sesong = EIENDOMSTYPER[id].sesong
  return sesong ? SESONGER[sesong][maanedFor(dagnummer(s.sek))] : 1
}

/** Måneden for et dagnummer, husket for siste dag — leien spør hvert sekund. */
export function maanedFor(dag: number): number {
  if (dag !== sisteDag) {
    sisteDag = dag
    sisteMaaned = dato(dag).maaned
  }
  return sisteMaaned
}
let sisteDag = NaN
let sisteMaaned = 0

/** Eier du alt i en by, gir leien der så mye mer (Pakke 44). */
export const BYEIER_BONUS = 0.1

/** Byggene i en by. */
export function byggI(by: By): readonly EiendomId[] {
  // Regnes ut én gang per by: leien spør hvert sekund, for hver eiendom.
  let liste = BYGG_I.get(by)
  if (!liste) BYGG_I.set(by, (liste = EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by)))
  return liste
}
const BYGG_I = new Map<By, EiendomId[]>()

/**
 * Eier du hele byen? Det krever det høyeste antallet av hvert bygg der —
 * alle hyblene og alle leilighetene, ikke bare én av hver. Byer uten bygg
 * (bare jord) kan ikke eies slik.
 */
const BYGG_FOR_BYEN = new Map<By, readonly EiendomId[]>()

/**
 * Byggene som teller når du eier hele byen (Pakke 79): alle i byen unntatt de sene
 * fra Pakke 76 (`utenforByen`). Med dem kostet hele Oslo 78 mrd i stedet for 3,3,
 * og lagringer som eide en hel by, mistet bonusen.
 */
export function byggForHeleByen(by: By): readonly EiendomId[] {
  let liste = BYGG_FOR_BYEN.get(by)
  if (!liste) BYGG_FOR_BYEN.set(by, (liste = byggI(by).filter((id) => !EIENDOMSTYPER[id].utenforByen)))
  return liste
}

export function eierHeleByen(s: Spilltilstand, by: By): boolean {
  const bygg = byggForHeleByen(by)
  if (bygg.length === 0) return false
  // En vanlig løkke: dette spørres for hver by hvert sekund (Pakke 64).
  for (let i = 0; i < bygg.length; i++) if ((s.eiendommer[bygg[i]] ?? 0) < EIENDOMSTYPER[bygg[i]].maksAntall) return false
  return true
}

/** Hvor mange enheter du eier i en by, av hvor mange som teller for hele byen. */
export function enheterI(s: Spilltilstand, by: By): { eid: number; av: number } {
  let eid = 0
  let av = 0
  for (const id of byggForHeleByen(by)) {
    eid += Math.min(s.eiendommer[id] ?? 0, EIENDOMSTYPER[id].maksAntall)
    av += EIENDOMSTYPER[id].maksAntall
  }
  return { eid, av }
}

/** Leie for én enhet per sekund. Følger indeksen og standarden — ikke verdifaktoren — byeierbonusen og sesongen. */
export function leieHverPerSek(s: Spilltilstand, id: EiendomId): number {
  const t = EIENDOMSTYPER[id]
  return leieHver(s, id, eiendomskurs(s, t.by), byfaktorLeie(s, t.by), dagsbilde(s).eiendom[id] ?? 1)
}

/**
 * Det som gjelder hele byen: byeierbonusen (Pakke 44), og hvor mye som står
 * tomt og forvalterens stil (Pakke 54).
 */
function byfaktorLeie(s: Spilltilstand, by: By): number {
  return (eierHeleByen(s, by) ? 1 + BYEIER_BONUS : 1) * leiefaktorBy(s, by)
}

/** Leien per sekund i én by: alle enhetene du eier der, uten de som pusses opp. */
export function leieIByen(s: Spilltilstand, by: By): number {
  let sum = 0
  for (const id of byggI(by)) {
    const antall = s.eiendommer[id] ?? 0
    if (antall > 0 && !s.oppussing?.[id]) sum += antall * leieHverPerSek(s, id)
  }
  return sum
}

/** Det du eier i en by, til markedspris — grunnlaget for prisen på en forvalter. */
export function byverdi(s: Spilltilstand, by: By): number {
  let sum = 0
  for (const id of byggI(by)) sum += (s.eiendommer[id] ?? 0) * eiendomspris(s, id)
  return sum
}

/** Byene du eier eiendom i, med stedet for den dyreste — til avisa. */
export function byerMedEiendom(s: Spilltilstand): { by: By; sted: string }[] {
  const ut = new Map<By, string>()
  for (const id of EIENDOMSSTIGEN) {
    if ((s.eiendommer[id] ?? 0) > 0) ut.set(EIENDOMSTYPER[id].by, EIENDOMSTYPER[id].sted.split(',')[0])
  }
  return [...ut].map(([by, sted]) => ({ by, sted }))
}

/*
 * Mellomlager for én utregning av leie eller verdi: byens kurs og byeierbonus,
 * på plassen til byen i BYER. Tall i en gjenbrukt liste i stedet for et oppslag
 * på bynavnet — leien og verdien regnes hvert sekund, for hver eiendom (Pakke 52).
 * NaN betyr «ikke regnet ut ennå» i denne utregningen.
 */
const BYER = [...new Set(EIENDOMSSTIGEN.map((id) => EIENDOMSTYPER[id].by))]
const BYNR = EIENDOMSSTIGEN.map((id) => BYER.indexOf(EIENDOMSTYPER[id].by))
const BYKURS = new Float64Array(BYER.length)
const BYBONUS = new Float64Array(BYER.length)

/** Selve regnestykket, med byens kurs og byeierbonus regnet ut på forhånd. */
function leieHver(s: Spilltilstand, id: EiendomId, kurs: number, bonus: number, vaer: number): number {
  const t = EIENDOMSTYPER[id]
  return (t.pris * kurs * t.avkastning * STANDARDER[standard(s, id)].leie * bonus * sesongfaktor(s, id) * vaer) / 3600
}

/** Eier du noen eiendom i det hele tatt? Et salg av den siste enheten fjerner nøkkelen. */
function harEiendom(s: Spilltilstand): boolean {
  for (const _ in s.eiendommer) return true
  return false
}

export function leiePerSek(s: Spilltilstand): number {
  // De fleste spill eier ingen eiendom lenge: da slipper sekundet å gå gjennom alle byggene.
  if (!harEiendom(s)) return landemerkeleiePerSek(s)
  // Regnes hvert sekund: byens kurs og byeierbonus regnes én gang per by.
  BYKURS.fill(NaN)
  BYBONUS.fill(NaN)
  // Været for eiendommene som merker det (Pakke 54), regnet én gang for dagen.
  const vaer = dagsbilde(s).eiendom
  let sum = 0
  for (let i = 0; i < EIENDOMSSTIGEN.length; i++) {
    const id = EIENDOMSSTIGEN[i]
    const antall = s.eiendommer[id] ?? 0
    // Under oppussing står enhetene tomme.
    if (antall <= 0 || s.oppussing?.[id]) continue
    const by = EIENDOMSTYPER[id].by
    const nr = BYNR[i]
    let kurs = BYKURS[nr]
    if (Number.isNaN(kurs)) BYKURS[nr] = kurs = eiendomskurs(s, by)
    let bonus = BYBONUS[nr]
    if (Number.isNaN(bonus)) BYBONUS[nr] = bonus = byfaktorLeie(s, by)
    sum += antall * leieHver(s, id, kurs, bonus, vaer[id] ?? 1)
  }
  return sum + landemerkeleiePerSek(s)
}

/** Fullfører oppussinger som er ferdige. Muterer — brukes på kopier. */
export function sjekkOppussing(s: Spilltilstand): void {
  for (const id of EIENDOMSSTIGEN) {
    const o = s.oppussing[id]
    if (o && s.sek >= o.ferdigSek) {
      s.eiendomStandard[id] = o.standard
      delete s.oppussing[id]
    }
  }
}

// ─────────────────────────────────────────────── Luksus

export const LUKSUS: Record<LuksusId, Luksusgjenstand> = {
  stasjonsvogn: { id: 'stasjonsvogn', navn: 'Brukt stasjonsvogn', kategori: 'bil', pris: 150_000, status: 1, linje: 'Tre eiere, alle med hund. Lukten følger med.' },
  elbil: { id: 'elbil', navn: 'Elektrisk sportsbil', kategori: 'bil', pris: 1_200_000, status: 4, linje: 'Fra null til hundre før naboen rekker å se opp fra avisa.' },
  superbil: { id: 'superbil', navn: 'Italiensk superbil', kategori: 'bil', pris: 4_500_000, status: 10, linje: 'Håndbygget i Emilia-Romagna. Lydanlegget er motoren.' },
  hyperbil: { id: 'hyperbil', navn: 'Hyperbil', kategori: 'bil', pris: 25_000_000, status: 30, linje: 'En av 499. Forhandleren ringte deg, ikke omvendt.' },
  gullklokke: { id: 'gullklokke', navn: 'Gullklokke', kategori: 'klokke', pris: 200_000, status: 2, linje: '18 karat og en inngravert dato ingen husker betydningen av.' },
  mesterverk: { id: 'mesterverk', navn: 'Sveitsisk mesterverk', kategori: 'klokke', pris: 2_000_000, status: 6, linje: 'Sveitsisk urverk med 31 steiner og fem års venteliste.' },
  diamantklokke: { id: 'diamantklokke', navn: 'Diamantklokke', kategori: 'klokke', pris: 15_000_000, status: 20, linje: '412 diamanter. Den viser også hva klokka er.' },
  snekke: { id: 'snekke', navn: 'Snekke', kategori: 'baat', pris: 300_000, status: 2, linje: 'Klinkbygd i furu i Risør i 1952. Starter på andre forsøk.' },
  motorbaat: { id: 'motorbaat', navn: 'Motorbåt', kategori: 'baat', pris: 6_000_000, status: 12, linje: '40 knop og en hekkbølge som merkes i nabokommunen.' },
  superyacht: { id: 'superyacht', navn: 'Superyacht', kategori: 'baat', pris: 400_000_000, status: 80, linje: 'Bygget i Viareggio, 74 meter, tolv gjester og et mannskap på tjue.' },
  propellfly: { id: 'propellfly', navn: 'Propellfly', kategori: 'fly', pris: 20_000_000, status: 20, linje: 'Seks seter og én propell. Lander på grus i Lofoten.' },
  forretningsjet: { id: 'forretningsjet', navn: 'Forretningsjet', kategori: 'fly', pris: 250_000_000, status: 60, linje: 'Gardermoen–Nice på to og en halv time, med skinnseter og nett.' },
  langdistansejet: { id: 'langdistansejet', navn: 'Langdistansejet', kategori: 'fly', pris: 1_200_000_000, status: 150, linje: 'Når Singapore uten å lande, og har dusj om bord.' },
  // ── Kom i versjon 17: fyller hullene i prisstigen, så det alltid er noe nytt å sikte mot.
  dykkerklokke: { id: 'dykkerklokke', navn: 'Dykkerklokke', kategori: 'klokke', pris: 40_000, status: 1, linje: 'Vanntett til 300 meter. Brukt ned til 1,2 i hotellbassenget.' },
  veteranbil: { id: 'veteranbil', navn: 'Veteranbil', kategori: 'bil', pris: 600_000, status: 2, linje: '1967, en av 36 bygget. Startes med choke og tålmodighet.' },
  seilbaat: { id: 'seilbaat', navn: 'Seilbåt', kategori: 'baat', pris: 1_500_000, status: 5, linje: '32 fot, rigget for Færderseilasen — og for å ligge til kai.' },
  lommeur: { id: 'lommeur', navn: 'Antikt lommeur', kategori: 'klokke', pris: 5_000_000, status: 10, linje: 'Fra 1890, med kjede og en gravering til «A. fra M.».' },
  helikopter: { id: 'helikopter', navn: 'Helikopter', kategori: 'fly', pris: 8_000_000, status: 14, linje: 'Lander på en tennisbane. Naboene har sluttet å spille tennis.' },
  limousin: { id: 'limousin', navn: 'Limousin', kategori: 'bil', pris: 9_000_000, status: 16, linje: 'Seks meter, minibar og en skillevegg som aldri har vært nede.' },
  seilyacht: { id: 'seilyacht', navn: 'Havseiler', kategori: 'baat', pris: 60_000_000, status: 38, linje: 'Bygget for å krysse Atlanteren. Har krysset Oslofjorden mange ganger.' },
  formelbil: { id: 'formelbil', navn: 'Formel 1-bil', kategori: 'bil', pris: 80_000_000, status: 45, linje: 'Vant to løp i 1998. Setet er formstøpt for en annen.' },
  // ── Pakke 88: det sene sjiktet. Samlingen sluttet ved langdistansejeten (1,2 mrd); dette varer
  // til rundt 100 mrd. Statusen stiger med prisen i hver kategori (pakke28), så hver ny ting
  // gir mer enn den dyreste før den: +440 status i alt.
  unikhyperbil: { id: 'unikhyperbil', navn: 'Unik hyperbil', kategori: 'bil', pris: 5_000_000_000, status: 50, linje: 'Tegnet for deg og bygget én gang. Formen er kopiert av ingen — ennå.' },
  skreddersyddklokke: { id: 'skreddersyddklokke', navn: 'Klokke laget for deg', kategori: 'klokke', pris: 8_000_000_000, status: 40, linje: 'Urmakeren målte håndleddet ditt to ganger og morgenhimmelen én.' },
  megayacht: { id: 'megayacht', navn: 'Megayacht med helipad', kategori: 'baat', pris: 15_000_000_000, status: 90, linje: 'Helipaden er på toppdekket, bassenget rett under. Rekkefølgen er diskutert.' },
  widebodyjet: { id: 'widebodyjet', navn: 'Privat widebody-jet', kategori: 'fly', pris: 40_000_000_000, status: 160, linje: 'Et rutefly bygget om til hjem: soverom, spisesal og et møterom ingen bruker.' },
  ubaat: { id: 'ubaat', navn: 'Ubåt', kategori: 'baat', pris: 60_000_000_000, status: 100, linje: 'Dykker til 300 meter med fem gjester og en kokk som ikke liker trange rom.' },
}

export const LUKSUSLISTE = Object.keys(LUKSUS) as LuksusId[]

export const KATEGORINAVN: Record<LuksusKategori, string> = {
  bil: 'Biler',
  klokke: 'Klokker',
  baat: 'Båter',
  fly: 'Fly',
}

/** Hvor mye du får igjen ved salg. Luksus er forbruk — det er verdt mindre enn du betalte. */
export const RESTVERDI: Record<LuksusKategori, number> = {
  bil: 0.7,
  klokke: 0.9,
  baat: 0.6,
  fly: 0.6,
}

export function restverdi(id: LuksusId): number {
  const g = LUKSUS[id]
  return g.pris * RESTVERDI[g.kategori]
}

/** Luksus teller med i formuen til det du ville fått ved salg. */
export function luksusverdi(s: Spilltilstand): number {
  // De unike tingene fra auksjonene (Pakke 89) står i samlingen og teller med her.
  // Racingteamet (Pakke 90) står i samlingen med det delene har kostet, som stadion i klubben.
  return s.luksus.reduce((sum, id) => sum + restverdi(id), 0) + unikverdi(s) + racingverdi(s)
}

// ─────────────────────────────────────────────── Lager

/** Hvilket lager hver kategori trenger. Klokker ligger i bankboksen og trenger ingen plass. */
export const LAGER_FOR: Record<LuksusKategori, LagerId | null> = {
  bil: 'garasje',
  klokke: null,
  baat: 'havn',
  fly: 'hangar',
}

export const LAGER: Record<LagerId, { navn: string; bestemt: string; enhet: string; startpris: number; vekst: number }> = {
  garasje: { navn: 'Garasje', bestemt: 'garasjen', enhet: 'biler', startpris: 100_000, vekst: 3 },
  havn: { navn: 'Havn', bestemt: 'havna', enhet: 'båter', startpris: 250_000, vekst: 4 },
  hangar: { navn: 'Hangar', bestemt: 'hangaren', enhet: 'fly', startpris: 5_000_000, vekst: 5 },
}

export const LAGERLISTE = Object.keys(LAGER) as LagerId[]

/** Garasjen har én plass fra start; havna og hangaren må bygges. */
export const START_LAGER: Record<LagerId, number> = { garasje: 1, havn: 0, hangar: 0 }

/**
 * Trinnene hvert sted kan bygges ut i (Pakke 88): navn, pris og status. Hvert trinn gir
 * også TRINN_PLASSER plasser, så de dyre tingene får plass uten at plassprisen løper fra.
 */
export const LAGERTRINN: Record<LagerId, { navn: string; pris: number; status: number }[]> = {
  garasje: [
    { navn: 'Utstillingshall', pris: 50_000_000, status: 10 },
    { navn: 'Privat bilmuseum', pris: 2_000_000_000, status: 30 },
  ],
  havn: [
    { navn: 'Marina', pris: 200_000_000, status: 15 },
    { navn: 'Privat havn med verft', pris: 8_000_000_000, status: 40 },
  ],
  hangar: [
    { navn: 'Privat terminal', pris: 1_000_000_000, status: 20 },
    { navn: 'Egen flyplass', pris: 20_000_000_000, status: 50 },
  ],
}
export const TRINN_PLASSER = 2
/** Fra så mange kjøpte plasser vokser prisen bare ×2 per plass (Pakke 88; før ×3, ×4 og ×5 hele veien). */
export const PLASSVEKST_FRA = 5
export const SEN_PLASSVEKST = 2

/** Hvor langt stedet er bygd ut: 0, 1 eller 2. */
export function lagertrinn(s: Spilltilstand, lager: LagerId): number {
  return s.lagerTrinn?.[lager] ?? 0
}

/** Stedets navn med trinnet: «Garasje», «Utstillingshall», «Privat bilmuseum». */
export function lagernavn(s: Spilltilstand, lager: LagerId): string {
  const n = lagertrinn(s, lager)
  return n === 0 ? LAGER[lager].navn : LAGERTRINN[lager][n - 1].navn
}

/** Neste trinn for stedet, eller null når det er bygd helt ut. */
export function nesteLagertrinn(s: Spilltilstand, lager: LagerId): { navn: string; pris: number; status: number } | null {
  return LAGERTRINN[lager][lagertrinn(s, lager)] ?? null
}

/** Status fra trinnene du har bygd. */
export function lagerstatus(s: Spilltilstand): number {
  let sum = 0
  for (const lager of LAGERLISTE) for (let i = 0; i < lagertrinn(s, lager); i++) sum += LAGERTRINN[lager][i].status
  return sum
}

/**
 * Prisen for neste plass. Hver ny plass koster mer enn den forrige: ×3, ×4 eller ×5 opp
 * til den femte du kjøper, så ×2 (Pakke 88). Plassene trinnene gir, teller ikke.
 */
export function utvidelsespris(s: Spilltilstand, lager: LagerId): number {
  const l = LAGER[lager]
  const kjopt = s.lager[lager] - START_LAGER[lager] - TRINN_PLASSER * lagertrinn(s, lager)
  return Math.round(l.startpris * l.vekst ** Math.min(kjopt, PLASSVEKST_FRA - 1) * SEN_PLASSVEKST ** Math.max(0, kjopt - (PLASSVEKST_FRA - 1)))
}

/** Kategorien som står i hvert lager. */
export const KATEGORI_I: Record<LagerId, LuksusKategori> = { garasje: 'bil', havn: 'baat', hangar: 'fly' }

/** Plassene som er i bruk: det du har kjøpt, og de unike tingene fra auksjonene (Pakke 89). */
export function brukteplasser(s: Spilltilstand, lager: LagerId): number {
  return s.luksus.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === lager).length + unikeI(s, KATEGORI_I[lager])
}

// ─────────────────────────────────────────────── Status

export const STATUSNIVAAER: { poeng: number; navn: string }[] = [
  { poeng: 0, navn: 'Ukjent' },
  { poeng: 3, navn: 'Lokal kjendis' },
  { poeng: 10, navn: 'Lovende gründer' },
  { poeng: 25, navn: 'Forretningsprofil' },
  { poeng: 60, navn: 'Rikmann' },
  { poeng: 120, navn: 'Magnat' },
  { poeng: 220, navn: 'Tycoon' },
  { poeng: 350, navn: 'Legende' },
  { poeng: 500, navn: 'Ikon' },
  { poeng: 700, navn: 'Monark' },
  { poeng: 1000, navn: 'Udødelig' },
  // Pakke 81: to til, så de fjerde romtrinnene, klubben og premium har noe å nå.
  { poeng: 1200, navn: 'Dynasti' },
  { poeng: 1400, navn: 'Mytisk' },
]

/** Hvert statusnivå gir så mye mer inntekt fra bedriftene … */
export const STATUS_INNTEKT = 0.02
/** … og så mye lavere rente (prosentpoeng per time). */
export const STATUS_RENTEKUTT = 0.002

/** Status fra luksusen, klubben og trofeene, landemerkene, kunsten og premiumbedriftene. */
export function statuspoeng(s: Spilltilstand): number {
  return s.luksus.reduce((sum, id) => sum + LUKSUS[id].status, 0) + klubbstatus(s) + landemerkestatus(s) + kunststatus(s) + premiumstatus(s) + hjemstatus(s) + lagerstatus(s) + unikstatus(s) + racingstatus(s)
}

export function statusnivaa(s: Spilltilstand): number {
  const p = statuspoeng(s)
  let n = 0
  for (let i = 0; i < STATUSNIVAAER.length; i++) if (p >= STATUSNIVAAER[i].poeng) n = i
  return n
}
