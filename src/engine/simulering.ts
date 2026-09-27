/**
 * Simuleringen. Tiden går i hele sekunder, så resultatet avhenger bare av
 * tilstanden og antall sekunder — aldri av bildefrekvens eller klokke.
 */

import { inntektPerSek, nettoformue } from './formler'
import type { Spilltilstand } from './types'

/** Flere punkter enn dette, og historikken tynnes ut til halvparten. */
export const MAKS_HISTORIKKPUNKTER = 240

/**
 * Kjører `antall` sekunder frem. Med `borte` går bare bedriftene med leder.
 * Ren funksjon: inndataene røres ikke.
 */
export function simuler(s: Spilltilstand, antall = 1, borte = false): Spilltilstand {
  if (antall <= 0) return s
  const n = structuredClone(s)
  for (let i = 0; i < antall; i++) sekund(n, borte)
  return n
}

/** Ett sekund, på en tilstand simuleringen selv eier. */
function sekund(s: Spilltilstand, borte: boolean): void {
  const inntekt = inntektPerSek(s, borte)
  s.kontanter += inntekt
  s.totaltTjent += inntekt
  s.sek += 1
  const formue = nettoformue(s)
  if (formue > s.hoyesteFormue) s.hoyesteFormue = formue
  if (s.sek % s.historikk.intervall === 0) loggFormue(s, formue)
}

function loggFormue(s: Spilltilstand, verdi: number): void {
  const h = s.historikk
  h.punkter.push({ sek: s.sek, verdi })
  if (h.punkter.length > MAKS_HISTORIKKPUNKTER) {
    // Behold hvert annet punkt på det nye rutenettet. Første punkt (sek 0)
    // ligger alltid på rutenettet, så grafen mister aldri startpunktet.
    h.intervall *= 2
    h.punkter = h.punkter.filter((p) => p.sek % h.intervall === 0)
  }
}
