/**
 * Spillkalenderen. Én spilldag er DAG_SEK ekte sekunder med appen åpen (eller
 * borte-tid). Spillet starter mandag 4. januar 2027. Datoene regnes ut fra
 * dagnummeret alene — aldri fra klokka — så de er like deterministiske som
 * resten av motoren.
 */

/** Én spilldag varer fem minutter. En uke er dermed 35 minutter. */
export const DAG_SEK = 300

const START_MS = Date.UTC(2027, 0, 4)

export const MÅNEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

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

export interface Dato {
  aar: number
  /** 0 = januar. */
  maaned: number
  dag: number
}

export function dato(dag: number): Dato {
  const d = new Date(START_MS + dag * 86_400_000)
  return { aar: d.getUTCFullYear(), maaned: d.getUTCMonth(), dag: d.getUTCDate() }
}

/** Dagnummeret for en dato (0 = januar). Kan være negativt for datoer før spillet startet. */
export function dagFra(aar: number, maaned: number, dag: number): number {
  return Math.round((Date.UTC(aar, maaned, dag) - START_MS) / 86_400_000)
}

/** ISO-ukenummer: uka som har torsdagen i seg, teller. */
export function ukenummer(dag: number): number {
  const d = new Date(START_MS + dag * 86_400_000)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const årStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - årStart) / 86_400_000 + 1) / 7)
}
