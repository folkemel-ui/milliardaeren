/**
 * Slik skrives spillet til lagringen (Pakke 52). Historikkene — kurser,
 * eiendomsindeksen, regionene, formuen og inntekten per bedrift — er over
 * halvparten av lagringen, og de brukes bare til grafer. De lagres med sju
 * gjeldende sifre i stedet for sytten; alt annet lagres nøyaktig, så ingen
 * spilleregel merker forskjellen (en test passer på det).
 *
 * Alle listene i tilstanden har et tak, så lagringen slutter å vokse når
 * historikkene er fulle (rundt 120 spilldager). Målt med det tyngste spillet
 * (fulltSpill): 137 kB på dag 32, 178 kB fra dag 122 — mot rundt 245 kB uten
 * rundingen. pakke52.test.ts passer på det.
 */

import type { Spilltilstand } from '../engine/types'

/** Gjeldende sifre i historikkene. */
export const HISTORIKK_SIFRE = 7

const rund = (n: number) => (Number.isFinite(n) ? Number(n.toPrecision(HISTORIKK_SIFRE)) : n)

/** Lister med bare tall som er historikk og kan rundes: kurser, indekser, regioner og inntekt per bedrift. */
const TALLHISTORIKK = new Set(['historikk', 'inntektHistorikk'])

function erstatter(nøkkel: string, verdi: unknown): unknown {
  if (TALLHISTORIKK.has(nøkkel) && Array.isArray(verdi) && typeof verdi[0] === 'number') return (verdi as number[]).map(rund)
  // Formuehistorikken: punkter med tidspunkt (holdes nøyaktig) og verdi (rundes).
  if (nøkkel === 'punkter' && Array.isArray(verdi)) return (verdi as { sek: number; verdi: number }[]).map((p) => ({ sek: p.sek, verdi: rund(p.verdi) }))
  return verdi
}

/** Spillet som tekst til lagringen. */
export function tilLagring(s: Spilltilstand): string {
  return JSON.stringify(s, erstatter)
}
