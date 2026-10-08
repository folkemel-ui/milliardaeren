/**
 * Gårder og skoger. Jorda stiger sakte i verdi, dag for dag.
 *
 * En gård gir avling hver mandag morgen — stor eller liten etter ukas vær.
 * En skog gir ingenting mens den vokser, men tømmeret blir verdt mer for hver
 * dag. Du bestemmer selv når du hogger: da får du betalt for tømmeret, og ny
 * skog plantes. Tømmeret vokser raskest i starten av midtfasen, så det lønner
 * seg å vente — men ikke for alltid.
 */

import { DAG_SEK, dagnummer, ukedag } from './kalender'
import { jevnetVaer, vaerPaaDag, type Vaertype } from './verden'
import type { JordId, NorskBy, Overskrift, Spilltilstand } from './types'
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

/** Jord og tømmer du eier. */
export function jordverdi(s: Spilltilstand): number {
  let sum = 0
  for (const id of JORDLISTE) if (s.jord?.[id]) sum += landverdi(s, id) + tommerverdi(s, id)
  return sum
}

export function jordKostpris(s: Spilltilstand): number {
  return JORDLISTE.reduce((sum, id) => sum + (s.jord?.[id]?.kostpris ?? 0), 0)
}

/** Avlingen gårdene dine gir for uka en spilldag hører til. */
export function ukensHost(s: Spilltilstand, dag = dagnummer(s.sek)): number {
  const v = vaer(dag)
  return JORDLISTE.filter((id) => JORD[id].type === 'gard' && s.jord?.[id]).reduce((sum, id) => sum + landverdi(s, id) * HOST_ANDEL * v.faktor, 0)
}

/** Mandag morgen høstes gårdene for uka som gikk. Gir avisens sak. Muterer. */
export function jordVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.jord || ukedag(s.sek) !== 0) return []
  const forrige = dagnummer(s.sek) - 1
  const host = ukensHost(s, forrige)
  if (host <= 0) return []
  s.kontanter += host
  s.totaltHost += host
  s.totaltLeie += host
  const v = vaer(forrige)
  return [{ type: 'deg', tittel: `${v.navn} på gårdene`, tekst: `${v.tekst} Ukas avling ga ${kortKroner(host)}.` }]
}
