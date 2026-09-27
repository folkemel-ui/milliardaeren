/**
 * Kalenderen for visning. Datoene kommer fra motorens kalender, så UI og
 * motor alltid er enige om hvilken dag det er.
 */

import { DAG_SEK, dato, MÅNEDER } from '../engine/kalender'

export { ukenummer } from '../engine/kalender'

const UKEDAGER = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']

/** «Tirsdag 5. januar» */
export function datotekst(dag: number, medÅr = false): string {
  const d = dato(dag)
  const tekst = `${UKEDAGER[dag % 7]} ${d.dag}. ${MÅNEDER[d.maaned]}${medÅr ? ` ${d.aar}` : ''}`
  return tekst[0].toUpperCase() + tekst.slice(1)
}

/** «Søn 21. feb» — for datolinja, der plassen er trang. */
export function kortDato(dag: number): string {
  const d = dato(dag)
  const ukedag = UKEDAGER[dag % 7].slice(0, 3)
  return `${ukedag[0].toUpperCase()}${ukedag.slice(1)} ${d.dag}. ${MÅNEDER[d.maaned].slice(0, 3)}`
}

/** Klokka i spillet: ett døgn går på DAG_SEK sekunder. «kl. 14:25». */
export function klokke(sek: number): string {
  const minutter = Math.floor(((sek % DAG_SEK) / DAG_SEK) * 1440)
  const t = Math.floor(minutter / 60)
  const m = minutter % 60
  return `${String(t).padStart(2, '0')}:${String(m - (m % 5)).padStart(2, '0')}`
}
