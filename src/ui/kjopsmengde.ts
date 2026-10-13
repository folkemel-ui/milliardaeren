/**
 * Hvor mange nivåer oppgraderingsknappene kjøper: 1, 10, 100, så mange du har
 * råd til, eller akkurat opp til neste milepæl (Pakke 99). Gjelder hele
 * bedriftsfanen, og huskes i nettleseren.
 */

import { nesteMilepael, oppgraderingspris, prisForNivaaer, raadTil } from '../engine/formler'
import type { Bedrift } from '../engine/types'

export type Kjopsmengde = '1' | '10' | '100' | 'maks' | 'milepael'

export const MENGDER: { id: Kjopsmengde; navn: string }[] = [
  { id: '1', navn: '×1' },
  { id: '10', navn: '×10' },
  { id: '100', navn: '×100' },
  { id: 'maks', navn: 'Maks' },
  { id: 'milepael', navn: 'Milepæl' },
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
  // Milepæl: hele veien til neste milepæl, eller ingenting — knappen viser hva det koster. Etter den siste: 0.
  if (mengde === 'milepael') {
    const neste = nesteMilepael(b.nivaa, b.type)
    return neste === null ? { antall: 0, pris: oppgraderingspris(b) } : { antall: neste - b.nivaa, pris: prisForNivaaer(b, neste - b.nivaa) }
  }
  if (mengde === 'maks') {
    const r = raadTil(b, kontanter)
    return r.antall > 0 ? r : { antall: 0, pris: oppgraderingspris(b) }
  }
  const antall = Number(mengde)
  return { antall, pris: prisForNivaaer(b, antall) }
}
