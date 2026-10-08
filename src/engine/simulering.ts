/**
 * Simuleringen. Tiden går i hele sekunder, så resultatet avhenger bare av
 * tilstanden og antall sekunder — aldri av bildefrekvens eller klokke.
 */

import { betalRente, dekkUnderskudd, sjekkMargin } from './bank'
import { bedriftInntektPerSek, nettoformue, sparerentePerSek, statusfaktor } from './formler'
import { leiePerSek, sjekkOppussing } from './eiendom'
import { MARKED_TIKK_SEK, markedstikk, registrerDagslutt } from './marked'
import { utbytteFor } from './kvartal'
import { fondsutbytteIDag } from './fond'
import { erDagsskifte, erHelg } from './kalender'
import { gisUtAvis } from './avis'
import { sjekkPrestasjoner } from './prestasjoner'
import { rivaltikk, rivalutbyttePerSek } from './rivaler'
import { sjekkOrdre } from './ordre'
import { Terning } from './rng'
import { kotikk } from './hender'
import { dagsbilde, konjunkturdrift } from './verden'
import { nyhetsfaktor, trenddrift } from './bransjer'
import { kupongPerSek } from './obligasjoner'
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
  // Det samme som inntektPerSek(s, borte), men hver bedrift og statusen regnes
  // bare én gang: tallene trengs både til kontantene og til regnskapet under.
  const faktor = statusfaktor(s)
  // Dagens kalender (Pakke 49): ukedag, vær, bransjetrend og helligdag per bransje.
  const dag = dagsbilde(s).faktor
  const perBedrift = s.bedrifter.map((b) => (borte && !b.leder ? 0 : bedriftInntektPerSek(b, dag[b.type] * nyhetsfaktor(s, b.type))))
  let sum = 0
  for (let i = 0; i < perBedrift.length; i++) if (!(borte && !s.bedrifter[i].leder)) sum += perBedrift[i]
  const inntekt = sum * faktor
  s.kontanter += inntekt
  s.totaltTjent += inntekt
  // Regnskapet per bedrift. Summen over står for kontantene; dette er bare bokføring.
  const maalHistorikk = (s.sek + 1) % INNTEKT_HISTORIKK_SEK === 0
  for (let i = 0; i < s.bedrifter.length; i++) {
    const b = s.bedrifter[i]
    const denne = borte && !b.leder ? 0 : perBedrift[i] * faktor
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
  // Kupongene fra statsobligasjonene (Pakke 53) regnes som utbytte.
  const kupong = kupongPerSek(s)
  if (kupong > 0) {
    s.kontanter += kupong
    s.totaltUtbytte += kupong
  }
  // Leien kommer uansett — eiendom trenger ingen leder.
  const leie = leiePerSek(s)
  s.kontanter += leie
  s.totaltLeie += leie
  dekkUnderskudd(s)
  betalRente(s)
  s.sek += 1
  // Oppussing som er ferdig nå, gir ny standard fra neste sekund.
  sjekkOppussing(s)

  if (s.sek % MARKED_TIKK_SEK === 0) {
    markedstikk(s.marked, terning, erHelg(s.sek), { ...konjunkturdrift(s), papirer: trenddrift(s) })
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
  kotikk(s, borte)
  if (erDagsskifte(s.sek)) {
    registrerDagslutt(s.marked)
    gisUtAvis(s, terning)
  }
}

function betalUtbytte(s: Spilltilstand): void {
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, { antall: number }][]) {
    sum += b.antall * s.marked.kurser[id].kurs * utbytteFor(s, id)
  }
  sum += fondsutbytteIDag(s)
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
