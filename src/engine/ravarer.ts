/**
 * Råvarene (Pakke 124): olje, laks og gull får priser som beveger seg, og kan handles på
 * børsen som en fjerde flis. Oljeselskapet og fiskeoppdrettet følger prisen på det de lever
 * av: inntekten ganges med hvor høyt prisen står over eller under sitt vanlige nivå, i stedet
 * for ukas hete og kalde bransje. Når den uka gjør olje eller laks het eller kald, dras prisen
 * opp eller ned i stedet (`trenddrift`), så overskriften «Oljeprisen stiger» stemmer.
 *
 * Faktoren leses av avviket uten spillerens eget kurstrykk (`Kurs.trykk`), så du kan ikke
 * kjøpe opp oljeprisen for å løfte ditt eget oljeselskap — de avledede prisenes lekkasje fra
 * gjennomgangen 8. oktober. Avviket svinger rundt null, men e^avvik har et snitt litt over 1;
 * det deles på snittet målt over mange timer, så bransjen i snitt tjener det samme som før.
 */

import type { BedriftstypeId, PapirId, Spilltilstand } from './types'

/** Råvaren hver av de to bransjene lever av. */
export const RAVARE_FOR: Partial<Record<BedriftstypeId, PapirId>> = { oljeselskap: 'OLJ', fiskeoppdrett: 'LAK' }

/**
 * Snittet av e^avvik for hver råvare, målt på spillets eget marked med ukas trender og konjunkturen
 * (12 spill × 300 timer). Inntektsfaktoren deles på det, så den i snitt er 1: halve tiden innen ±10 %,
 * ni av ti ganger mellom ×0,79 og ×1,27 for oljen (×0,80–1,23 for laksen). Uten hopp — med dem
 * svingte inntekten ×0,62–1,50, langt mer enn ukas ±20 % før.
 */
export const RAVARESNITT: Partial<Record<PapirId, number>> = { OLJ: 1.03, LAK: 1.034 }
export const RAVAREFAKTOR_MIN = 0.5
export const RAVAREFAKTOR_MAKS = 1.6

/** Hvor høyt råvaren står over (> 1) eller under (< 1) sitt vanlige nivå, uten ditt eget kurstrykk. */
export function ravarenivaa(s: Spilltilstand, id: PapirId): number {
  const k = s.marked?.kurser?.[id]
  if (!k) return 1
  // Avviket flyttes bare ved markedstikkene, men faktoren trengs hvert sekund for hver bedrift
  // (og i prestasjonenes inntekt): husk siste svar per kurs, som byfaktor gjør.
  const husket = NIVAA.get(k)
  if (husket && husket.avvik === k.avvik) return husket.nivaa
  const nivaa = Math.min(RAVAREFAKTOR_MAKS, Math.max(RAVAREFAKTOR_MIN, Math.exp(k.avvik) / (RAVARESNITT[id] ?? 1)))
  NIVAA.set(k, { avvik: k.avvik, nivaa })
  return nivaa
}
const NIVAA = new WeakMap<object, { avvik: number; nivaa: number }>()

/** Faktoren på en bransjes inntekt fra råvaren den lever av; 1 for alle andre. */
export function ravarefaktor(s: Spilltilstand, type: BedriftstypeId): number {
  const id = RAVARE_FOR[type]
  return id ? ravarenivaa(s, id) : 1
}
