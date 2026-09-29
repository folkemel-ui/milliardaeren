/**
 * Tiden du var borte. Et kjapt bytte av app er ikke å være borte: da går alt
 * som vanlig. Først etter en lengre pause gjelder reglene for tid borte —
 * bare bedriftene med leder, og aldri mer enn taket.
 */

import { simuler } from '../engine/simulering'
import { BORTE_TAK_SEK } from '../engine/innhold'
import type { Spilltilstand } from '../engine/types'

/** Kortere pauser enn dette regnes som vanlig spilletid. */
export const KORT_PAUSE_SEK = 60

export function taIgjen(s: Spilltilstand, borteSek: number): Spilltilstand {
  if (borteSek < KORT_PAUSE_SEK) return simuler(s, borteSek)
  return simuler(s, Math.min(borteSek, BORTE_TAK_SEK), true)
}
