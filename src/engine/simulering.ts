/**
 * Simuleringen. Tiden går i hele sekunder, så resultatet avhenger bare av
 * tilstanden og antall sekunder — aldri av bildefrekvens eller klokke.
 */

import { betalRente, sjekkMargin } from './bank'
import { inntektPerSek, nettoformue } from './formler'
import { leiePerSek } from './eiendom'
import { MARKED_TIKK_SEK, markedstikk, PAPIRER, UTBYTTE_SEK } from './marked'
import { Terning } from './rng'
import type { PapirId, Spilltilstand } from './types'

/** Flere punkter enn dette, og historikken tynnes ut til halvparten. */
export const MAKS_HISTORIKKPUNKTER = 240

/**
 * Kjører `antall` sekunder frem. Med `borte` går bare bedriftene med leder —
 * markedet, utbyttet og renten går uansett. Ren funksjon: inndataene røres ikke.
 */
export function simuler(s: Spilltilstand, antall = 1, borte = false): Spilltilstand {
  if (antall <= 0) return s
  const n = structuredClone(s)
  const terning = new Terning(n.frø)
  for (let i = 0; i < antall; i++) sekund(n, terning, borte)
  n.frø = terning.fro
  return n
}

/** Ett sekund, på en tilstand simuleringen selv eier. */
function sekund(s: Spilltilstand, terning: Terning, borte: boolean): void {
  const inntekt = inntektPerSek(s, borte)
  s.kontanter += inntekt
  s.totaltTjent += inntekt
  // Leien kommer uansett — eiendom trenger ingen leder.
  const leie = leiePerSek(s)
  s.kontanter += leie
  s.totaltLeie += leie
  betalRente(s)
  s.sek += 1

  if (s.sek % MARKED_TIKK_SEK === 0) markedstikk(s.marked, terning)
  if (s.sek % UTBYTTE_SEK === 0) betalUtbytte(s)
  sjekkMargin(s)

  const formue = nettoformue(s)
  if (formue > s.hoyesteFormue) s.hoyesteFormue = formue
  if (s.sek % s.historikk.intervall === 0) loggFormue(s, formue)
}

function betalUtbytte(s: Spilltilstand): void {
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, { antall: number }][]) {
    sum += b.antall * s.marked.kurser[id].kurs * PAPIRER[id].utbytte
  }
  s.kontanter += sum
  s.totaltUtbytte += sum
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
