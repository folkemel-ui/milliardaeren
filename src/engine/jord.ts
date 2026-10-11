/**
 * Gårder og skoger. Jorda stiger sakte i verdi, dag for dag.
 *
 * En gård gir avling hver mandag morgen — stor eller liten etter ukas vær, og
 * for de dagene av uka du eide den (Pakke 57). Selger du midt i uka, får du
 * avlingen så langt med salget.
 * En skog gir ingenting mens den vokser, men tømmeret blir verdt mer for hver
 * dag. Du bestemmer selv når du hogger: da får du betalt for tømmeret, og ny
 * skog plantes. Tømmeret vokser raskest i starten av midtfasen, så det lønner
 * seg å vente — men ikke for alltid.
 */

import { DAG_SEK, dagnummer, ukedag } from './kalender'
import { jevnetVaer, vaerPaaDag, type Vaertype } from './verden'
import type { Gardsmaskin, JordId, Jordstykke, NorskBy, Overskrift, Spilltilstand } from './types'
import { kortKroner } from './tall'

export interface Jordtype {
  id: JordId
  navn: string
  sted: string
  by: NorskBy
  type: 'gard' | 'skog'
  /** Pris for jorda den første spilldagen. */
  pris: number
}

export const JORD: Record<JordId, Jordtype> = {
  'gard-hedmarken': { id: 'gard-hedmarken', navn: 'Gård på Hedmarken', sted: 'Hamar, Innlandet', by: 'Hedmarken', type: 'gard', pris: 40_000_000 },
  'skog-trysil': { id: 'skog-trysil', navn: 'Skog i Trysil', sted: 'Trysil, Innlandet', by: 'Trysil', type: 'skog', pris: 60_000_000 },
  'gard-lista': { id: 'gard-lista', navn: 'Gård på Lista', sted: 'Farsund, Agder', by: 'Lista', type: 'gard', pris: 150_000_000 },
  'skog-namdalen': { id: 'skog-namdalen', navn: 'Skog i Namdalen', sted: 'Namsos, Trøndelag', by: 'Namdalen', type: 'skog', pris: 250_000_000 },
}

export const JORDLISTE = Object.keys(JORD) as JordId[]

/** Jord er til salgs når formuen din en gang har vært så stor andel av prisen. */
export const JORD_SYNLIG_VED = 0.8
/** Jordprisene stiger så mye per spilldag. */
const JORDVEKST_PER_DAG = 0.003
/** En gård gir så stor andel av jordverdien i avling per uke, i et normalt år. */
export const HOST_ANDEL = 0.08
/** Tømmeret nærmer seg så mange ganger jordverdien … */
export const TOMMER_MAKS = 3
/** … og har vokst til en firedel av det etter så mange dager. Snittveksten er størst da. */
export const TOMMER_DAGER = 36

/**
 * Ett vær (Pakke 54): avlingen følger været uka faktisk hadde — de sju dagene
 * med norsk vær fra Pakke 49 — i stedet for et eget ukevær. Sol er godt for
 * kornet, regn og snø mindre. Snittet for uka, jevnet ut per sesong, forsterkes
 * så avlingene svinger omtrent like mye som før (fra rundt 0,4 til 1,6).
 */
const AVLING: Record<Vaertype, number> = { sol: 1.5, overskyet: 1, regn: 0.8, sno: 0.3 }
const FORSTERKNING = 3

const UKER = [
  { fra: 1.35, navn: 'Rekorduke', tekst: 'Den beste avlingen i manns minne.' },
  { fra: 1.1, navn: 'God uke', tekst: 'Sol og regn i passe mengder. Kornet står høyt.' },
  { fra: 0.9, navn: 'Normal uke', tekst: 'En helt vanlig uke for norske bønder.' },
  { fra: 0.65, navn: 'Svak uke', tekst: 'For lite sol. Avlingene er magre.' },
  { fra: 0, navn: 'Elendig uke', tekst: 'Regn og kulde. Bøndene ber om sol.' },
] as const

export interface Ukevaer {
  navn: string
  tekst: string
  faktor: number
  /** Dagene med hvert vær den uka. */
  dager: Record<Vaertype, number>
}

const HUSKET_UKE = new Map<number, Ukevaer>()

/** Været uka en spilldag hører til, og hva det betyr for avlingen. Samme svar for alle dagene i uka. */
export function vaer(dag: number): Ukevaer {
  const uke = Math.floor(dag / 7)
  const husket = HUSKET_UKE.get(uke)
  if (husket) return husket
  const dager: Record<Vaertype, number> = { sol: 0, overskyet: 0, regn: 0, sno: 0 }
  let sum = 0
  for (let d = uke * 7; d < uke * 7 + 7; d++) {
    dager[vaerPaaDag(d)]++
    sum += jevnetVaer(AVLING, 'norge', d)
  }
  const faktor = Math.min(1.8, Math.max(0.3, 1 + FORSTERKNING * (sum / 7 - 1)))
  const u = UKER.find((x) => faktor >= x.fra)!
  const ut: Ukevaer = { navn: u.navn, tekst: `${u.tekst} ${uketekst(dager)}`, faktor, dager }
  if (HUSKET_UKE.size > 200) HUSKET_UKE.clear()
  HUSKET_UKE.set(uke, ut)
  return ut
}

/** «4 dager med sol, 2 med regn og 1 med snø.» */
function uketekst(d: Record<Vaertype, number>): string {
  const deler = ([['sol', 'sol'], ['regn', 'regn'], ['sno', 'snø'], ['overskyet', 'skyer']] as const)
    .filter(([v]) => d[v] > 0)
    .map(([v, navn], i) => `${d[v]}${i === 0 ? (d[v] === 1 ? ' dag' : ' dager') : ''} med ${navn}`)
  if (deler.length === 0) return ''
  const siste = deler.pop()!
  return `${deler.length ? `${deler.join(', ')} og ${siste}` : siste}.`.replace(/^./, (c) => c.toUpperCase())
}

// ─────────────────────────────────────────────── En gård du bygger (Pakke 92)

/** En gård starter med så mange jorder og kan vokse til så mange. */
export const START_JORDER = 3
export const MAKS_JORDER = 10
/** Den fjerde jorda koster halve jordverdien; hver neste ×1,5. */
export const JORDPRIS_ANDEL = 0.5
export const JORDPRIS_VEKST = 1.5

/** Maskinene: én av hver per gård, priset som en andel av gårdens verdi (jorda og det du har bygd). */
export const MASKINER: Record<Gardsmaskin, { navn: string; tekst: string; andel: number; host: number; vaer: number }> = {
  traktor: { navn: 'Traktor', tekst: '+10 % avling', andel: 0.2, host: 1.1, vaer: 0 },
  tresker: { navn: 'Skurtresker', tekst: '+15 % avling', andel: 0.4, host: 1.15, vaer: 0 },
  sproyte: { navn: 'Sprøyte', tekst: 'En dårlig uke faller 30 % mindre', andel: 0.3, host: 1, vaer: 0.3 },
}
export const MASKINLISTE = Object.keys(MASKINER) as Gardsmaskin[]

/** Trinnene en gård vokser i, etter jordene: status og et navn på kortet og i avisa. */
export const GARDSTRINN = [
  { navn: 'Småbruk', bestemt: 'småbruket', fra: 3, status: 0 },
  { navn: 'Gård', bestemt: 'gården', fra: 5, status: 3 },
  { navn: 'Storgård', bestemt: 'storgården', fra: 8, status: 6 },
  { navn: 'Gods', bestemt: 'godset', fra: 10, status: 10 },
] as const

/** Hvor mange jorder en gård har (3 for en gård fra før Pakke 92). */
export function jorder(j: Jordstykke | undefined): number {
  return j?.jorder ?? START_JORDER
}

/** Trinnet etter jordene: 0 småbruk … 3 gods. */
export function gardstrinn(j: Jordstykke | undefined): number {
  const n = jorder(j)
  let t = 0
  for (let i = 0; i < GARDSTRINN.length; i++) if (n >= GARDSTRINN[i].fra) t = i
  return t
}

/** Status fra gårdenes trinn. */
export function jordstatus(s: Spilltilstand): number {
  if (!s.jord) return 0
  let sum = 0
  for (const id of JORDLISTE) {
    const j = s.jord[id]
    if (j && JORD[id].type === 'gard') sum += GARDSTRINN[gardstrinn(j)].status
  }
  return sum
}

/** Prisen for neste jord, eller null når gården er full. Følger jordverdien, så den vokser med deg. */
export function nesteJordpris(s: Spilltilstand, id: JordId): number | null {
  const n = jorder(s.jord?.[id])
  if (n >= MAKS_JORDER) return null
  return landverdi(s, id) * JORDPRIS_ANDEL * JORDPRIS_VEKST ** (n - START_JORDER)
}

/** Gårdens verdi: jorda og det du har bygd. Maskinprisene følger den. */
export function gardsverdi(s: Spilltilstand, id: JordId): number {
  return landverdi(s, id) + (s.jord?.[id]?.investert ?? 0)
}

export function maskinpris(s: Spilltilstand, id: JordId, m: Gardsmaskin): number {
  return MASKINER[m].andel * gardsverdi(s, id)
}

/** Hvor mye mer gården gir enn med tre jorder og ingen maskiner. Nøyaktig 1 for en gård fra før. */
export function gardsfaktor(j: Jordstykke): number {
  let f = jorder(j) / START_JORDER
  for (const m of MASKINLISTE) if (j.maskiner?.[m]) f *= MASKINER[m].host
  return f
}

/** Ukas vær for en gård: sprøyta tar en del av fallet i en dårlig uke. */
export function gardsvaer(j: Jordstykke, faktor: number): number {
  if (faktor >= 1 || !j.maskiner?.sproyte) return faktor
  return faktor + MASKINER.sproyte.vaer * (1 - faktor)
}

/**
 * Før gården bygges ut, bokføres avlingen så langt denne uka med størrelsen den hadde,
 * og resten regnes med den nye fra nå. Ellers ga en jord kjøpt søndag kveld en hel ukes
 * avling (Pakke 57s regel: betal for tiden du eide). Muterer.
 */
export function bokforOpptjent(s: Spilltilstand, id: JordId): void {
  const j = s.jord?.[id]
  if (!j) return
  j.opptjent = (j.opptjent ?? 0) + gardHost(s, id, dagnummer(s.sek), s.sek)
  j.plantetSek = s.sek
}

export function jordfaktor(s: Spilltilstand): number {
  return (1 + JORDVEKST_PER_DAG) ** dagnummer(s.sek)
}

export function landverdi(s: Spilltilstand, id: JordId): number {
  return JORD[id].pris * jordfaktor(s)
}

/** Tømmeret som andel av jordverdien, etter hvor mange dager skogen har vokst. */
export function tommerfaktor(dager: number): number {
  const d = Math.max(0, dager)
  return TOMMER_MAKS * (d / (d + TOMMER_DAGER)) ** 2
}

export function skogalder(s: Spilltilstand, id: JordId): number {
  const j = s.jord?.[id]
  return j ? (s.sek - j.plantetSek) / DAG_SEK : 0
}

/** Hva tømmeret i en skog er verdt nå. */
export function tommerverdi(s: Spilltilstand, id: JordId): number {
  return JORD[id].type === 'skog' ? landverdi(s, id) * tommerfaktor(skogalder(s, id)) : 0
}

/** Jord og tømmer du eier, og det du har bygd på gårdene (Pakke 92). */
export function jordverdi(s: Spilltilstand): number {
  let sum = 0
  for (const id of JORDLISTE) {
    const j = s.jord?.[id]
    if (j) sum += landverdi(s, id) + tommerverdi(s, id) + (j.investert ?? 0)
  }
  return sum
}

export function jordKostpris(s: Spilltilstand): number {
  return JORDLISTE.reduce((sum, id) => sum + (s.jord?.[id]?.kostpris ?? 0), 0)
}

const UKE_SEK = 7 * DAG_SEK

/**
 * Avlingen én gård gir for uka spilldagen `dag` hører til, frem til `til` (et
 * sekund): ukas vær ganget med andelen av uka du eide gården. Før fikk den som
 * eide gården mandag morgen hele uka — kjøp søndag, selg mandag: +4,5 til
 * +13 % av prisen etter meglerhonoraret.
 */
export function gardHost(s: Spilltilstand, id: JordId, dag: number, til: number): number {
  const j = s.jord?.[id]
  if (!j || JORD[id].type !== 'gard') return 0
  const ukestart = Math.floor(dag / 7) * UKE_SEK
  // For en gård er plantetSek dagen du kjøpte den: en gård hogges aldri.
  const andel = Math.min(1, Math.max(0, (til - Math.max(ukestart, j.plantetSek)) / UKE_SEK))
  // Pakke 92: jordene og maskinene ganger avlingen, sprøyta demper en dårlig uke. Uten dem står tallene likt.
  return landverdi(s, id) * HOST_ANDEL * gardsvaer(j, vaer(dag).faktor) * andel * gardsfaktor(j)
}

/** Avlingen en gård du eier, gir mandag for uka som går nå — for dagene du eier den. */
export function ukensGardHost(s: Spilltilstand, id: JordId): number {
  const dag = dagnummer(s.sek)
  return gardHost(s, id, dag, (Math.floor(dag / 7) + 1) * UKE_SEK) + (s.jord?.[id]?.opptjent ?? 0)
}

/** Mandag morgen høstes gårdene for uka som gikk. Gir avisens sak. Muterer. */
export function jordVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.jord || ukedag(s.sek) !== 0) return []
  const dag = dagnummer(s.sek)
  const forrige = dag - 1
  let host = 0
  for (const id of JORDLISTE) {
    host += gardHost(s, id, forrige, dag * DAG_SEK)
    const j = s.jord[id]
    if (j?.opptjent) {
      host += j.opptjent
      j.opptjent = 0
    }
  }
  if (host <= 0) return []
  s.kontanter += host
  s.totaltHost += host
  s.totaltLeie += host
  const v = vaer(forrige)
  // Pakke 92: avisa sier hva gårdene er blitt — «storgården på Lista og småbruket på Hedmarken».
  const garder = JORDLISTE.filter((id) => s.jord[id] && JORD[id].type === 'gard').map((id) => `${GARDSTRINN[gardstrinn(s.jord[id])].bestemt} på ${JORD[id].by}`)
  const fra = garder.length ? ` fra ${garder.length > 1 ? `${garder.slice(0, -1).join(', ')} og ${garder[garder.length - 1]}` : garder[0]}` : ''
  return [{ type: 'deg', tittel: `${v.navn} på gårdene`, tekst: `${v.tekst} Ukas avling ga ${kortKroner(host)}${fra}.` }]
}
