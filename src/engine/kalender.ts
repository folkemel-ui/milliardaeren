/**
 * Spillkalenderen. Én spilldag er DAG_SEK ekte sekunder med appen åpen (eller
 * borte-tid). Motoren trenger bare dagnummer og ukedag; datoen for visning
 * regnes ut i UI-et.
 */

/** Én spilldag varer fem minutter. En uke er dermed 35 minutter. */
export const DAG_SEK = 300

/** Spilldag nummer (0 = første dag). */
export function dagnummer(sek: number): number {
  return Math.floor(sek / DAG_SEK)
}

/** 0 = mandag … 6 = søndag. Spillet starter på en mandag. */
export function ukedag(sek: number): number {
  return dagnummer(sek) % 7
}

/** Børsen er stengt lørdag og søndag. Kryptoen handles hele uka. */
export function erHelg(sek: number): boolean {
  return ukedag(sek) >= 5
}

/** Første sekund i en ny spilldag? */
export function erDagsskifte(sek: number): boolean {
  return sek > 0 && sek % DAG_SEK === 0
}
