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
import { filialfaktor } from './filialer'
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

/**
 * Tiden hver del av sekundet bruker, i millisekunder, summert (Pakke 64).
 * Ytelsestesten slår den på for å gi hvert system sitt eget budsjett. Av er den
 * null, og da koster den én sjekk per del — tallene i spillet blir de samme
 * uansett, for klokka leses bare, den styrer ingenting.
 */
export type Delmaaler = Record<string, number>
let maaler: Delmaaler | null = null

/** Slår delmålingen på (et objekt å summere i) eller av (null). */
export function maalDeler(m: Delmaaler | null): void {
  maaler = m
}

function runde(m: Delmaaler, del: string, fra: number): number {
  const naa = performance.now()
  m[del] = (m[del] ?? 0) + naa - fra
  return naa
}

/** Flere punkter enn dette, og historikken tynnes ut til halvparten. */
export const MAKS_HISTORIKKPUNKTER = 240

/** Hver bedrifts inntekt måles hvert minutt, og de siste to timene huskes. */
export const INNTEKT_HISTORIKK_SEK = 60
export const MAKS_INNTEKT_HISTORIKK = 120

/**
 * Mens du er borte, regnes leien, nettoformuen og prestasjonene bare hvert
 * så mange sekund (Pakke 69): de var to tredeler av tiden det tok å ta igjen
 * to timer (det tyngste spillet 379 → 117 ms). Blokkene står på hele tiere
 * i spilltiden, så de faller sammen med dagsskiftene og formueloggen.
 */
export const BORTE_TAKT = 10

/**
 * Kjører `antall` sekunder frem. Med `borte` går bare bedriftene med leder —
 * markedet, utbyttet og renten går uansett — og leien betales samlet hvert
 * BORTE_TAKT. sekund, med resten på det siste. Ren funksjon: inndataene røres ikke.
 */
export function simuler(s: Spilltilstand, antall = 1, borte = false): Spilltilstand {
  if (antall <= 0) return s
  const n = structuredClone(s)
  const terning = new Terning(n.frø)
  let ventende = 0
  for (let i = 0; i < antall; i++) {
    ventende++
    const regn = !borte || (n.sek + 1) % BORTE_TAKT === 0 || i === antall - 1
    sekund(n, terning, borte, regn ? ventende : 0)
    if (regn) ventende = 0
  }
  n.frø = terning.fro
  return n
}

/**
 * Ett sekund, på en tilstand simuleringen selv eier. `leieSek` er hvor mange
 * sekunder leie som betales nå (1 når du spiller); 0 betyr at leien, formuen og
 * prestasjonene venter til blokken er full.
 */
function sekund(s: Spilltilstand, terning: Terning, borte: boolean, leieSek: number): void {
  const m = maaler
  let t = m ? performance.now() : 0
  // Det samme som inntektPerSek(s, borte), men hver bedrift og statusen regnes
  // bare én gang: tallene trengs både til kontantene og til regnskapet under.
  const faktor = statusfaktor(s)
  // Dagens kalender (Pakke 49): ukedag, vær, bransjetrend og helligdag per bransje.
  const dag = dagsbilde(s).faktor
  // Filialene (Pakke 59) går med bedriften: står den stille mens du er borte, gjør de det også.
  const perBedrift = s.bedrifter.map((b) => (borte && !b.leder ? 0 : bedriftInntektPerSek(b, dag[b.type] * nyhetsfaktor(s, b.type) * filialfaktor(s, b))))
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
  if (m) t = runde(m, 'inntekt', t)
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
  if (m) t = runde(m, 'sparing og utbytte', t)
  // Leien kommer uansett — eiendom trenger ingen leder. Borte kommer den samlet.
  if (leieSek > 0) {
    const leie = leiePerSek(s) * leieSek
    s.kontanter += leie
    s.totaltLeie += leie
  }
  if (m) t = runde(m, 'leie', t)
  dekkUnderskudd(s)
  betalRente(s)
  s.sek += 1
  if (m) t = runde(m, 'bank', t)
  // Oppussing som er ferdig nå, gir ny standard fra neste sekund.
  sjekkOppussing(s)
  if (m) t = runde(m, 'oppussing', t)

  if (s.sek % MARKED_TIKK_SEK === 0) {
    markedstikk(s.marked, terning, erHelg(s.sek), { ...konjunkturdrift(s), papirer: trenddrift(s) })
    rivaltikk(s, terning, MARKED_TIKK_SEK / 3600)
    sjekkOrdre(s)
  }
  if (m) t = runde(m, 'marked', t)
  // Utbytte hver morgen børsen er åpen.
  if (erDagsskifte(s.sek) && !erHelg(s.sek)) betalUtbytte(s)
  sjekkMargin(s)
  if (m) t = runde(m, 'utbytte og margin', t)

  const logg = s.sek % s.historikk.intervall === 0
  if (logg || leieSek > 0) {
    const formue = nettoformue(s)
    if (formue > s.hoyesteFormue) s.hoyesteFormue = formue
    if (logg) loggFormue(s, formue)
  }
  if (m) t = runde(m, 'formue', t)
  if (leieSek > 0) sjekkPrestasjoner(s)
  if (m) t = runde(m, 'prestasjoner', t)
  kotikk(s, borte)
  if (erDagsskifte(s.sek)) {
    registrerDagslutt(s.marked)
    gisUtAvis(s, terning)
  }
  if (m) runde(m, 'dagsskifte og kø', t)
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
