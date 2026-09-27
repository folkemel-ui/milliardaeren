/**
 * Simuleringen. Tiden går i hele sekunder, så resultatet avhenger bare av
 * tilstanden og antall sekunder — aldri av bildefrekvens eller klokke.
 */

import { betalRente, sjekkMargin } from './bank'
import { bedriftInntektPerSek, inntektPerSek, nettoformue, sparerentePerSek, statusfaktor } from './formler'
import { leiePerSek, sjekkOppussing } from './eiendom'
import { MARKED_TIKK_SEK, markedstikk, PAPIRER } from './marked'
import { erDagsskifte, erHelg } from './kalender'
import { gisUtAvis } from './avis'
import { sjekkPrestasjoner } from './prestasjoner'
import { rivaltikk, rivalutbyttePerSek } from './rivaler'
import { sjekkOrdre } from './ordre'
import { Terning } from './rng'
import type { PapirId, Spilltilstand } from './types'

/** Flere punkter enn dette, og historikken tynnes ut til halvparten. */
export const MAKS_HISTORIKKPUNKTER = 240

/** Hver bedrifts inntekt måles hvert minutt, og de siste to timene huskes. */
export const INNTEKT_HISTORIKK_SEK = 60
export const MAKS_INNTEKT_HISTORIKK = 120

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
  // Regnskapet per bedrift. Summen over står for kontantene; dette er bare bokføring.
  const faktor = statusfaktor(s)
  const maalHistorikk = (s.sek + 1) % INNTEKT_HISTORIKK_SEK === 0
  for (const b of s.bedrifter) {
    const denne = borte && !b.leder ? 0 : bedriftInntektPerSek(b) * faktor
    b.tjent += denne
    if (maalHistorikk) {
      b.inntektHistorikk.push(denne)
      if (b.inntektHistorikk.length > MAKS_INNTEKT_HISTORIKK) b.inntektHistorikk.shift()
    }
  }
  // Sparerenten legges på kontoen, så den renter seg selv.
  const sparerente = sparerentePerSek(s)
  s.sparing += sparerente
  s.totaltSparerente += sparerente
  // Rivalselskapene du eier andeler i, betaler utbytte løpende.
  const rivalutbytte = rivalutbyttePerSek(s)
  s.kontanter += rivalutbytte
  s.totaltUtbytte += rivalutbytte
  // Leien kommer uansett — eiendom trenger ingen leder.
  const leie = leiePerSek(s)
  s.kontanter += leie
  s.totaltLeie += leie
  betalRente(s)
  s.sek += 1
  // Oppussing som er ferdig nå, gir ny standard fra neste sekund.
  sjekkOppussing(s)

  if (s.sek % MARKED_TIKK_SEK === 0) {
    markedstikk(s.marked, terning, erHelg(s.sek))
    rivaltikk(s, terning, MARKED_TIKK_SEK / 3600)
    sjekkOrdre(s)
  }
  // Utbytte hver morgen børsen er åpen.
  if (erDagsskifte(s.sek) && !erHelg(s.sek)) betalUtbytte(s)
  sjekkMargin(s)

  const formue = nettoformue(s)
  if (formue > s.hoyesteFormue) s.hoyesteFormue = formue
  if (s.sek % s.historikk.intervall === 0) loggFormue(s, formue)
  sjekkPrestasjoner(s)
  if (erDagsskifte(s.sek)) gisUtAvis(s, terning)
}

function betalUtbytte(s: Spilltilstand): void {
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, { antall: number }][]) {
    sum += b.antall * s.marked.kurser[id].kurs * PAPIRER[id].utbytte
  }
  if (sum <= 0) return
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
