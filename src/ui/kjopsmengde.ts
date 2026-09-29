/**
 * Hvor mange nivåer oppgraderingsknappene kjøper: 1, 10, 100 eller så mange
 * du har råd til. Gjelder hele bedriftsfanen, og huskes i nettleseren.
 */

import { nivaaerDuHarRaadTil, oppgraderingspris, prisForNivaaer } from '../engine/formler'
import type { Bedrift } from '../engine/types'

export type Kjopsmengde = '1' | '10' | '100' | 'maks'

export const MENGDER: { id: Kjopsmengde; navn: string }[] = [
  { id: '1', navn: '×1' },
  { id: '10', navn: '×10' },
  { id: '100', navn: '×100' },
  { id: 'maks', navn: 'Maks' },
]

const NOKKEL = 'milliardaer.kjopsmengde'

export function lesKjopsmengde(): Kjopsmengde {
  try {
    const v = localStorage.getItem(NOKKEL)
    return MENGDER.some((m) => m.id === v) ? (v as Kjopsmengde) : '1'
  } catch {
    return '1'
  }
}

export function lagreKjopsmengde(m: Kjopsmengde): void {
  try {
    localStorage.setItem(NOKKEL, m)
  } catch {
    /* bare en bekvemmelighet */
  }
}

/**
 * Hva knappen skal kjøpe: antall nivåer og prisen. Med «Maks» og ikke råd
 * til ett eneste nivå er antallet 0, og prisen den for neste nivå — så
 * knappen viser hva som mangler.
 */
export function kjop(b: Bedrift, mengde: Kjopsmengde, kontanter: number): { antall: number; pris: number } {
  if (mengde === 'maks') {
    const antall = nivaaerDuHarRaadTil(b, kontanter)
    return antall > 0 ? { antall, pris: prisForNivaaer(b, antall) } : { antall: 0, pris: oppgraderingspris(b) }
  }
  const antall = Number(mengde)
  return { antall, pris: prisForNivaaer(b, antall) }
}
