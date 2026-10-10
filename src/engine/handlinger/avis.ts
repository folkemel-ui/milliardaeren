/**
 * Avisa: lese dagens utgave.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import type { Spilltilstand } from '../types'
import { feil, type Utfall } from './felles'

export function lesAvis(s: Spilltilstand): Utfall {
  const siste = s.avis[s.avis.length - 1]
  if (!siste || s.avisLest >= siste.dag) return feil('Ingen nye utgaver.')
  const n = structuredClone(s)
  n.avisLest = siste.dag
  return { ok: true, tilstand: n }
}
