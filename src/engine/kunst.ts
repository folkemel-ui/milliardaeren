/**
 * Kunst: malerier av oppdiktede norske kunstnere. Prisene går opp og ned hver
 * dag, og hver kunstner har sin egen trend — noen er på vei opp, andre går
 * av moten. Av og til åpner en utstilling, og prisene på alt kunstneren har
 * laget, hopper.
 *
 * Et maleri gir status så lenge du eier det, og dobbelt så mye når det henger
 * på museum. Da kan det ikke selges, og det tar en dag å hente det hjem.
 *
 * Kunstmarkedet har sin egen terning, så kunst endrer ikke resten av spillet.
 */

import { Terning } from './rng'
import type { Kunstmarked, MaleriId, Overskrift, Spilltilstand } from './types'

export interface Kunstner {
  navn: string
  /** Forventet endring per dag. */
  trend: number
}

export const KUNSTNERE = {
  vik: { navn: 'Ragnhild Vik', trend: 0.012 },
  solheim: { navn: 'Einar Solheim', trend: 0.004 },
  aske: { navn: 'Tor Aske', trend: -0.004 },
  lind: { navn: 'Maja Lind', trend: 0.008 },
} as const satisfies Record<string, Kunstner>

export type KunstnerId = keyof typeof KUNSTNERE

export interface Maleri {
  id: MaleriId
  navn: string
  kunstner: KunstnerId
  aar: number
  startpris: number
  /** Statuspoeng så lenge du eier det; dobbelt på museum. */
  status: number
  /** Tre farger til miniatyren: himmel, land og detalj. */
  farger: [string, string, string]
}

export const MALERIER: Record<MaleriId, Maleri> = {
  morgenlys: { id: 'morgenlys', navn: 'Fjord i morgenlys', kunstner: 'solheim', aar: 1911, startpris: 400_000, status: 1, farger: ['#f6c7a1', '#3f6f8f', '#f4e3b0'] },
  fiskeverket: { id: 'fiskeverket', navn: 'Fiskeverket', kunstner: 'aske', aar: 1952, startpris: 1_500_000, status: 2, farger: ['#9fb4c7', '#5b4636', '#c0392b'] },
  blaatimen: { id: 'blaatimen', navn: 'Blåtimen', kunstner: 'lind', aar: 1998, startpris: 4_000_000, status: 3, farger: ['#1e3a8a', '#0f172a', '#fbbf24'] },
  'byen-sover': { id: 'byen-sover', navn: 'Byen sover', kunstner: 'vik', aar: 2019, startpris: 9_000_000, status: 4, farger: ['#312e81', '#1f2937', '#f59e0b'] },
  'nordlys-over-vaagen': { id: 'nordlys-over-vaagen', navn: 'Nordlys over Vågen', kunstner: 'solheim', aar: 1924, startpris: 25_000_000, status: 6, farger: ['#0b3d2e', '#1e293b', '#4ade80'] },
  'kvinne-i-roedt': { id: 'kvinne-i-roedt', navn: 'Kvinne i rødt', kunstner: 'lind', aar: 2004, startpris: 60_000_000, status: 8, farger: ['#fde68a', '#7c2d12', '#dc2626'] },
  stormen: { id: 'stormen', navn: 'Stormen', kunstner: 'aske', aar: 1961, startpris: 150_000_000, status: 12, farger: ['#475569', '#1e3a5f', '#e2e8f0'] },
  sommernatt: { id: 'sommernatt', navn: 'Sommernatt', kunstner: 'vik', aar: 2021, startpris: 350_000_000, status: 18, farger: ['#fbcfe8', '#166534', '#fef08a'] },
  'skrik-i-byen': { id: 'skrik-i-byen', navn: 'Skrik i byen', kunstner: 'solheim', aar: 1933, startpris: 900_000_000, status: 30, farger: ['#ea580c', '#1e1b4b', '#fde047'] },
}

export const MALERILISTE = Object.keys(MALERIER) as MaleriId[]

/** Auksjonshuset tar så mye når du kjøper … */
export const KJOPSSALAER = 0.05
/** … og når du selger. */
export const SALGSSALAER = 0.1
/** Daglig svingning rundt trenden. */
const SVINGNING = 0.05
/** Sjansen per kunstner per dag for en utstilling som løfter prisene. */
const UTSTILLING_SJANSE = 0.04
const UTSTILLING_LOFT = 0.3

export function lagKunst(frø: number): Kunstmarked {
  const kurser = {} as Record<MaleriId, number>
  for (const id of MALERILISTE) kurser[id] = MALERIER[id].startpris
  return { kurser, eide: {}, frø: (frø ^ 0x27d4eb2d) | 0 }
}

export function maleripris(s: Spilltilstand, id: MaleriId): number {
  return s.kunst?.kurser[id] ?? MALERIER[id].startpris
}

export const kjopsprisMaleri = (s: Spilltilstand, id: MaleriId) => maleripris(s, id) * (1 + KJOPSSALAER)
export const salgsprisMaleri = (s: Spilltilstand, id: MaleriId) => maleripris(s, id) * (1 - SALGSSALAER)

export function mineMalerier(s: Spilltilstand): MaleriId[] {
  return MALERILISTE.filter((id) => s.kunst?.eide[id])
}

export function kunstverdi(s: Spilltilstand): number {
  return mineMalerier(s).reduce((sum, id) => sum + maleripris(s, id), 0)
}

export function kunststatus(s: Spilltilstand): number {
  return mineMalerier(s).reduce((sum, id) => sum + MALERIER[id].status * (s.kunst.eide[id]!.utlant ? 2 : 1), 0)
}

/** Nye dagspriser, utstillinger, og malerier som hentes hjem fra museet. Muterer. */
export function kunstVedDagsskifte(s: Spilltilstand): Overskrift[] {
  const k = s.kunst
  if (!k) return []
  const t = new Terning(k.frø)
  const saker: Overskrift[] = []
  const loft: Partial<Record<KunstnerId, number>> = {}
  for (const kid of Object.keys(KUNSTNERE) as KunstnerId[]) {
    if (t.sjanse(UTSTILLING_SJANSE)) {
      loft[kid] = 1 + UTSTILLING_LOFT
      const eier = MALERILISTE.some((id) => MALERIER[id].kunstner === kid && k.eide[id])
      saker.push({
        type: eier ? 'deg' : 'marked',
        tittel: `Stor utstilling for ${KUNSTNERE[kid].navn}`,
        tekst: eier ? 'Prisene på verkene stiger kraftig — også på dem du eier.' : 'Samlerne står i kø, og prisene stiger kraftig.',
      })
    }
  }
  for (const id of MALERILISTE) {
    const m = MALERIER[id]
    const u = 1 - t.neste()
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * t.neste())
    k.kurser[id] *= Math.exp(KUNSTNERE[m.kunstner].trend + SVINGNING * normal) * (loft[m.kunstner] ?? 1)
  }
  for (const id of MALERILISTE) {
    const v = k.eide[id]
    if (v?.hentes) {
      v.utlant = false
      v.hentes = false
    }
  }
  k.frø = t.fro
  return saker
}
