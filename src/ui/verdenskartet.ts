/**
 * Geometrien til verdenskartet (Pakke 45): kystlinjer og grenser fra Natural
 * Earth (kartdata.ts, Grafikkpakke G3), Mercator-projeksjon (så Skandinavia
 * beholder formen), og ett utsnitt per fly. Kartet vokser med flyene: Norden med
 * propellflyet, Europa med forretningsjeten, og med langdistansejeten
 * Europa pluss to innfelte ruter for New York og Dubai.
 *
 * Rene funksjoner og data, så de kan testes uten å tegne noe. Kartet er
 * 300 × 200 enheter.
 */

import type { Utenlandsby } from '../engine/types'
import { DUBAI, NEW_YORK, NORGE_VERDEN, VERDEN, type Ring } from './kartdata'
import { KRONEPLASS, MERKE_HOYDE, merkebredde } from './norgeskartet'

export const BREDDE = 300
export const HOYDE = 200

type Punkt = [lengde: number, bredde: number]

/** En flat ring fra kartdata.ts som punkter. */
const punkter = (r: Ring): Punkt[] => Array.from({ length: r.length / 2 }, (_, i) => [r[2 * i], r[2 * i + 1]] as Punkt)

/** Landene rundt (Europa, Nord-Afrika, Midtøsten), uten Norge. */
export const LAND: Punkt[][] = VERDEN.map(punkter)
/** Norge, som tegnes i landfargen, som på Norgeskartet. */
export const NORGE: Punkt[][] = NORGE_VERDEN.map(punkter)

export interface Utsnitt {
  /** Lengde- og breddegradene som skal få plass. */
  vest: number
  ost: number
  sor: number
  nord: number
}

export interface Innfelt {
  /** Ruta på kartet, i kartets enheter. */
  x: number
  y: number
  bredde: number
  hoyde: number
  utsnitt: Utsnitt
  land: Punkt[][]
}

/** Utsnittet for hvert fly: 0–1 Norden, 2 Europa, 3 Europa med innfelte ruter. */
export const UTSNITT: Utsnitt[] = [
  { vest: 4, ost: 30, sor: 53.5, nord: 71 },
  { vest: 4, ost: 30, sor: 53.5, nord: 71 },
  { vest: -10, ost: 31, sor: 31.5, nord: 71 },
  { vest: -10, ost: 31, sor: 31.5, nord: 71 },
]

/** De innfelte rutene langdistansejeten åpner, i det tomme havet til venstre og landet til høyre. */
export const INNFELT: Record<'New York' | 'Dubai', Innfelt> = {
  'New York': { x: 6, y: 112, bredde: 74, hoyde: 62, utsnitt: { vest: -79, ost: -67, sor: 37.5, nord: 45 }, land: NEW_YORK.map(punkter) },
  Dubai: { x: 220, y: 112, bredde: 74, hoyde: 62, utsnitt: { vest: 47, ost: 60, sor: 20, nord: 30 }, land: DUBAI.map(punkter) },
}

/** Byene på verdenskartet, og hvilken side navnet står på. */
export const BYPLASS: Record<Utenlandsby, { pos: Punkt; etikett: 'høyre' | 'venstre' | 'under' }> = {
  Stockholm: { pos: [18.07, 59.33], etikett: 'under' },
  København: { pos: [12.57, 55.68], etikett: 'høyre' },
  Berlin: { pos: [13.4, 52.52], etikett: 'høyre' },
  London: { pos: [-0.13, 51.5], etikett: 'venstre' },
  Marbella: { pos: [-4.88, 36.51], etikett: 'høyre' },
  Zermatt: { pos: [7.75, 46.02], etikett: 'høyre' },
  'New York': { pos: [-74.0, 40.71], etikett: 'under' },
  Dubai: { pos: [55.27, 25.2], etikett: 'under' },
}

export const OSLO_POS: Punkt = [10.75, 59.91]

const rad = (g: number) => (g * Math.PI) / 180
/** Mercator: breddegraden strekkes mot polene, så formene holder seg. */
const merc = (bredde: number) => Math.log(Math.tan(Math.PI / 4 + rad(bredde) / 2))

/**
 * En projeksjon som får plass til utsnittet midt i en rute (x, y, bredde,
 * hoyde), med samme skala begge veier. Gir en funksjon fra grader til enheter.
 */
export function projeksjon(u: Utsnitt, rute = { x: 0, y: 0, bredde: BREDDE, hoyde: HOYDE }): (p: Punkt) => [number, number] {
  const x0 = rad(u.vest)
  const x1 = rad(u.ost)
  const y0 = merc(u.sor)
  const y1 = merc(u.nord)
  const skala = Math.min(rute.bredde / (x1 - x0), rute.hoyde / (y1 - y0))
  const midtX = (x0 + x1) / 2
  const midtY = (y0 + y1) / 2
  return ([lengde, bredde]) => [
    rute.x + rute.bredde / 2 + (rad(lengde) - midtX) * skala,
    rute.y + rute.hoyde / 2 - (merc(bredde) - midtY) * skala,
  ]
}

/** En kystlinje som SVG-sti med en gitt projeksjon. */
export function sti(land: Punkt[], p: (q: Punkt) => [number, number]): string {
  return land.map((q, i) => `${i === 0 ? 'M' : 'L'}${p(q)[0].toFixed(1)},${p(q)[1].toFixed(1)}`).join(' ') + ' Z'
}

/** Hvilket utsnitt et reisenivå (0–3) gir. */
export function utsnittFor(nivaa: number): Utsnitt {
  return UTSNITT[Math.max(0, Math.min(UTSNITT.length - 1, nivaa))]
}

/** Står byen i en innfelt rute (New York og Dubai)? */
export function erInnfelt(by: Utenlandsby): by is 'New York' | 'Dubai' {
  return by === 'New York' || by === 'Dubai'
}

/**
 * Hvor en by står på kartet ved et reisenivå, eller null når den ikke synes
 * ennå: innfelte byer kommer med langdistansejeten, de andre når de er
 * innenfor utsnittet.
 */
export function byPunkt(by: Utenlandsby, nivaa: number): [number, number] | null {
  if (erInnfelt(by)) {
    if (nivaa < 3) return null
    const i = INNFELT[by]
    return projeksjon(i.utsnitt, i)(BYPLASS[by].pos)
  }
  const [x, y] = projeksjon(utsnittFor(nivaa))(BYPLASS[by].pos)
  return x >= 0 && x <= BREDDE && y >= 0 && y <= HOYDE ? [x, y] : null
}

/**
 * Antallsmerket på verdenskartet (G3): som på Norgeskartet, på motsatt side av
 * navnet — oppe til venstre når navnet står til høyre, ellers oppe til høyre.
 */
export function merkeboksVerden(x: number, y: number, r: number, sifre: number, krone: boolean, etikett: 'høyre' | 'venstre' | 'under') {
  const b = merkebredde(sifre) + (krone ? KRONEPLASS : 0)
  return { x: etikett === 'høyre' ? x - r * 0.6 - b : x + r * 0.6, y: y - r * 0.6 - MERKE_HOYDE, b, h: MERKE_HOYDE }
}
