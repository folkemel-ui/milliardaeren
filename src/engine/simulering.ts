/**
 * Simuleringen. Tiden går i hele sekunder, så resultatet avhenger bare av
 * tilstanden og antall sekunder — aldri av bildefrekvens eller klokke.
 */

import { inntektPerSek, nettoformue } from './formler'
import type { Spilltilstand } from './types'

/** Flere punkter enn dette, og historikken tynnes ut til halvparten. */
export const MAKS_HISTORIKKPUNKTER = 240

/** Kjører `antall` sekunder frem. Ren funksjon: inndataene røres ikke. */
export function simuler(s: Spilltilstand, antall = 1): Spilltilstand {
  if (antall <= 0) return s
  const n = structuredClone(s)
  for (let i = 0; i < antall; i++) sekund(n)
  return n
}

/** Ett sekund, på en tilstand simuleringen selv eier. */
function sekund(s: Spilltilstand): void {
  const inntekt = inntektPerSek(s)
  s.kontanter += inntekt
  s.totaltTjent += inntekt
  s.sek += 1
  if (s.sek % s.historikk.intervall === 0) loggFormue(s)
}

function loggFormue(s: Spilltilstand): void {
  const h = s.historikk
  h.punkter.push({ sek: s.sek, verdi: nettoformue(s) })
  if (h.punkter.length > MAKS_HISTORIKKPUNKTER) {
    // Behold hvert annet punkt på det nye rutenettet. Første punkt (sek 0)
    // ligger alltid på rutenettet, så grafen mister aldri startpunktet.
    h.intervall *= 2
    h.punkter = h.punkter.filter((p) => p.sek % h.intervall === 0)
  }
}
