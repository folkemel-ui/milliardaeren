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
import { hashTekst, tilfeldig } from './rng'
import type { JordId, NorskBy, Overskrift, Spilltilstand } from './types'

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
export const HOST_ANDEL = 0.12
/** Tømmeret nærmer seg så mange ganger jordverdien … */
export const TOMMER_MAKS = 3
/** … og har vokst til en firedel av det etter så mange dager. Snittveksten er størst da. */
export const TOMMER_DAGER = 36

export const VAER = [
  { navn: 'Tørkesommer', tekst: 'Åkrene er svidd. Bøndene ber om regn.', faktor: 0.4 },
  { navn: 'Regnvær', tekst: 'Det regner mer enn det bør. Avlingene er magre.', faktor: 0.75 },
  { navn: 'Normalt år', tekst: 'Et helt vanlig år for norske bønder.', faktor: 1 },
  { navn: 'Godt år', tekst: 'Sol og regn i passe mengder. Kornet står høyt.', faktor: 1.3 },
  { navn: 'Rekordår', tekst: 'Den beste avlingen i manns minne.', faktor: 1.6 },
] as const

/** Været uka en spilldag hører til — trukket fra uka, ikke fra terningen. */
export function vaer(dag: number) {
  const u = tilfeldig(hashTekst(`vær:${Math.floor(dag / 7)}`))
  return VAER[Math.min(VAER.length - 1, Math.floor(u * VAER.length))]
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
  return [{ type: 'deg', tittel: `${v.navn} på gårdene`, tekst: `${v.tekst} Ukas avling ga ${Math.round(host).toLocaleString('nb-NO')} kr.` }]
}
