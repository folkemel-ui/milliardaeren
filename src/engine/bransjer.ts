/**
 * Pakke 53: aksjene og bransjene henger sammen. Seks selskaper på børsen
 * hører til en bransje du kan eie (Polaris Olje og oljeselskapet, Bergen
 * Shipping og rederiet osv.):
 *
 *  - ukas trend (Pakke 49) flytter kursen: den hete bransjens aksje får
 *    +4 %/t ekstra drift den uka, den kalde −4 %/t;
 *  - en selskapsnyhet treffer bedriften din i samme bransje: en god nyhet gir
 *    +10 % inntekt i tre spilldager, en dårlig −10 %.
 *
 * Ingenting her trekker fra terningen: trenden er en hash, og nyheten er den
 * selskapsnyheter.ts alt har trukket.
 */

import { dagnummer } from './kalender'
import { PAPIRER } from './marked'
import { ukensTrend } from './verden'
import type { BedriftstypeId, PapirId, Spilltilstand } from './types'

/** Ekstra drift per time for aksjen til ukas hete (+) og kalde (−) bransje. */
export const TRENDDRIFT = 0.04
/** En selskapsnyhet endrer inntekten i bransjen med så mye … */
export const NYHET_VIRKNING = 0.1
/** … i så mange spilldager. */
export const NYHET_DAGER = 3

/** Aksjen som hører til hver bransje — de bransjene som har en. */
export const AKSJE_FOR: Partial<Record<BedriftstypeId, PapirId>> = Object.fromEntries(
  (Object.keys(PAPIRER) as PapirId[]).filter((id) => PAPIRER[id].bransje).map((id) => [PAPIRER[id].bransje!, id]),
)

/** Ekstra drift per aksje denne uka, fra trenden. Tom når ingen av bransjene med aksje er het eller kald. */
export function trenddrift(s: Spilltilstand): Partial<Record<PapirId, number>> {
  const t = ukensTrend(s)
  const ut: Partial<Record<PapirId, number>> = {}
  const het = t.het && AKSJE_FOR[t.het]
  const kald = t.kald && AKSJE_FOR[t.kald]
  if (het) ut[het] = TRENDDRIFT
  if (kald) ut[kald] = -TRENDDRIFT
  return ut
}

/** Hvor mye nyhetene i bransjen endrer inntekten i dag: produktet av dem som gjelder. 1 uten nyheter. */
export function nyhetsfaktor(s: Spilltilstand, type: BedriftstypeId): number {
  const liste = s.bransjenyheter
  if (!liste || liste.length === 0) return 1
  const dag = dagnummer(s.sek)
  let f = 1
  for (const n of liste) if (n.type === type && dag < n.tilDag) f *= n.faktor
  return f
}

/**
 * En selskapsnyhet for \`id\`: eier du en bedrift i aksjens bransje, merker den
 * det i NYHET_DAGER dager. Gir en setning til avisa, eller null. Rydder bort
 * nyheter som er utløpt. Muterer — brukes på kopier.
 */
export function bransjenyhet(s: Spilltilstand, id: PapirId, opp: boolean): string | null {
  const dag = dagnummer(s.sek)
  s.bransjenyheter = (s.bransjenyheter ?? []).filter((n) => dag < n.tilDag)
  const type = PAPIRER[id].bransje
  if (!type || !s.bedrifter.some((b) => b.type === type)) return null
  s.bransjenyheter.push({ type, faktor: opp ? 1 + NYHET_VIRKNING : 1 - NYHET_VIRKNING, tilDag: dag + NYHET_DAGER })
  return opp
    ? `Bransjen nyter godt av det — også din bedrift: +${Math.round(NYHET_VIRKNING * 100)} % i ${NYHET_DAGER} dager.`
    : `Hele bransjen merker det — også din bedrift: −${Math.round(NYHET_VIRKNING * 100)} % i ${NYHET_DAGER} dager.`
}
