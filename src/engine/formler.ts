/** Rene utregninger over tilstanden. Ingen av dem endrer noe. */

import { BEDRIFTSTYPER } from './innhold'
import type { Bedrift, Spilltilstand } from './types'

export function bedriftInntektPerSek(b: Bedrift): number {
  return BEDRIFTSTYPER[b.type].inntektPerSek * b.nivaa
}

export function bedriftsverdi(b: Bedrift): number {
  return BEDRIFTSTYPER[b.type].grunnverdi * b.nivaa
}

export function inntektPerSek(s: Spilltilstand): number {
  return s.bedrifter.reduce((sum, b) => sum + bedriftInntektPerSek(b), 0)
}

/**
 * Nettoformuen er spillets poengsum: kontanter pluss alt du eier.
 * Investeringer, eiendom, luksus og gjeld legges til her etter hvert.
 */
export function nettoformue(s: Spilltilstand): number {
  return s.kontanter + s.bedrifter.reduce((sum, b) => sum + bedriftsverdi(b), 0)
}
