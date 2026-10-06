/**
 * Geometrien til verdenskartet (Pakke 45): forenklede kystlinjer som
 * lengde- og breddegrader, Mercator-projeksjon (så Skandinavia beholder
 * formen), og ett utsnitt per fly. Kartet vokser med flyene: Norden med
 * propellflyet, Europa med forretningsjeten, og med langdistansejeten
 * Europa pluss to innfelte ruter for New York og Dubai.
 *
 * Rene funksjoner og data, så de kan testes uten å tegne noe. Kartet er
 * 300 × 200 enheter.
 */

import type { Utenlandsby } from '../engine/types'

export const BREDDE = 300
export const HOYDE = 200

type Punkt = [lengde: number, bredde: number]

/** Fastlands-Europa, med kysten fra Portugal rundt Middelhavet og Skandinavia, og en rett grense mot øst. */
const EUROPA: Punkt[] = [
  [-9, 43], [-9.5, 39], [-8.9, 37], [-6, 36.2], [-2, 36.7], [0.2, 38.8], [3.2, 41.9], [3, 43.3], [5, 43.3], [7.5, 43.8],
  [8.9, 44.4], [10.5, 43], [12, 41.8], [15.6, 40], [16, 38], [17, 39], [18.5, 40.2], [16, 41.4], [13.5, 43.6], [12.3, 45.4],
  [13.6, 45.6], [15.5, 44], [19.4, 41.8], [20, 39.6], [21.7, 36.8], [23.5, 38], [22.9, 40.6], [26, 40.8], [28.9, 41], [28, 43],
  [30, 45.5], [33.5, 44.6], [38, 47], [62, 47], [62, 68], [33, 69], [28, 71], [25.8, 71.1], [19, 70], [14.5, 68.3],
  [12, 65.5], [10, 63.5], [5, 62], [5, 60.4], [5.6, 58.8], [7, 58], [10.5, 59], [11.2, 58.9], [12, 57.7], [12.8, 55.6],
  [14.2, 55.4], [16, 56.5], [18.5, 59.3], [17.5, 61], [21, 64], [24, 65.8], [25.5, 64.9], [21.5, 61.5], [22.5, 60], [25, 60.2],
  [28, 60.5], [30, 59.9], [28, 59.4], [23.5, 59.2], [24, 57], [21, 56.8], [21, 55.5], [19.5, 54.4], [18.6, 54.5], [14.3, 53.9],
  [12, 54.2], [10.9, 54.4], [10.2, 56.2], [10.6, 57.7], [8.2, 56.8], [8.1, 55.5], [8.6, 53.9], [7, 53.4], [4.8, 52.9], [4, 51.6],
  [3, 51.2], [1.6, 50.9], [0.1, 49.5], [-1.3, 49.7], [-1.6, 48.6], [-4.7, 48.4], [-2.2, 47.3], [-1.2, 46], [-1.5, 43.4], [-3.8, 43.5],
  [-8, 43.7],
]
const STORBRITANNIA: Punkt[] = [
  [-5.7, 50.1], [-3, 50.7], [1.4, 51.2], [1.7, 52.6], [0.3, 53.4], [-0.1, 54.5], [-1.6, 55.6], [-2, 56.2], [-1.8, 57.6], [-3.1, 58.6],
  [-5, 58.6], [-5.7, 57], [-5.6, 56], [-4.8, 55], [-3.2, 54.8], [-3, 53.4], [-4.6, 53.3], [-4.2, 52.3], [-5.3, 51.7], [-3.2, 51.4], [-4.5, 51],
]
const IRLAND: Punkt[] = [[-6, 52.2], [-6.1, 53.5], [-5.6, 54.6], [-7.3, 55.3], [-10, 54.2], [-9.5, 53.2], [-10.2, 51.9], [-8.5, 51.6]]
const ISLAND: Punkt[] = [[-22, 64], [-21.5, 65.5], [-18, 66.2], [-14.5, 66], [-13.5, 65], [-15, 64.3], [-18.5, 63.4], [-21, 63.8]]
const SJELLAND: Punkt[] = [[11, 55.3], [11.2, 56], [12.6, 56.1], [12.5, 55.1]]
const SICILIA: Punkt[] = [[12.4, 38.1], [15.6, 38.3], [15.1, 36.7]]
const SARDINIA: Punkt[] = [[9.2, 43], [9.6, 41], [9.8, 39.2], [8.4, 39], [8.2, 40.9], [8.7, 42.6]]
const MALLORCA: Punkt[] = [[2.4, 39.6], [3.4, 39.9], [3.2, 39.3]]
const NORD_AFRIKA: Punkt[] = [[-10, 30], [-9.6, 33], [-6.5, 35.8], [-2, 35.1], [3, 36.8], [10, 37.3], [11, 35.5], [10.5, 31], [-10, 28]]

export const LAND: Punkt[][] = [EUROPA, STORBRITANNIA, IRLAND, ISLAND, SJELLAND, SICILIA, SARDINIA, MALLORCA, NORD_AFRIKA]

/** Østkysten av Nord-Amerika rundt New York, til den innfelte ruta. */
const NORD_AMERIKA: Punkt[] = [
  [-84, 35], [-76, 35.2], [-76.3, 37], [-75.2, 38.5], [-74.2, 39.6], [-74, 40.6], [-72, 41], [-70, 41.7], [-70.6, 42.6], [-70.2, 43.7],
  [-67, 44.8], [-65.5, 45.3], [-64, 46.2], [-66, 48], [-84, 48],
]
const LONG_ISLAND: Punkt[] = [[-74, 40.6], [-72, 41.1], [-71.9, 40.9], [-73.9, 40.5]]
/** Den arabiske halvøya og Iran rundt Dubai. */
const ARABIA: Punkt[] = [
  [34.9, 29.5], [39, 21.5], [42.5, 15], [45, 12.8], [52, 15.6], [55, 17.5], [57.8, 19], [59.8, 22.4], [56.4, 26.4], [55.3, 25.3],
  [51.6, 24.2], [51.2, 26.1], [50, 26.5], [48, 29.5], [47.7, 31], [39, 32], [35.5, 33],
]
const IRAN: Punkt[] = [[48.5, 30], [51, 28], [56.5, 27], [58, 25.6], [62, 25.2], [62, 33], [48.5, 33]]

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
  'New York': { x: 6, y: 112, bredde: 74, hoyde: 62, utsnitt: { vest: -79, ost: -67, sor: 37.5, nord: 45 }, land: [NORD_AMERIKA, LONG_ISLAND] },
  Dubai: { x: 220, y: 112, bredde: 74, hoyde: 62, utsnitt: { vest: 47, ost: 60, sor: 20, nord: 30 }, land: [ARABIA, IRAN] },
}

/** Byene på verdenskartet, og hvilken side navnet står på. */
export const BYPLASS: Record<Utenlandsby, { pos: Punkt; etikett: 'høyre' | 'venstre' | 'under' }> = {
  Stockholm: { pos: [18.07, 59.33], etikett: 'høyre' },
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
