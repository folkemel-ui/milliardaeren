/**
 * Kalenderen for visning. Spillet starter mandag 4. januar 2027; motoren
 * teller bare dager, og datoen regnes ut her.
 */

import { DAG_SEK } from '../engine/kalender'

const START = Date.UTC(2027, 0, 4)
const UKEDAGER = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
const MÅNEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

function datoFor(dag: number): Date {
  return new Date(START + dag * 86_400_000)
}

/** «Tirsdag 5. januar» */
export function datotekst(dag: number, medÅr = false): string {
  const d = datoFor(dag)
  const tekst = `${UKEDAGER[dag % 7]} ${d.getUTCDate()}. ${MÅNEDER[d.getUTCMonth()]}${medÅr ? ` ${d.getUTCFullYear()}` : ''}`
  return tekst[0].toUpperCase() + tekst.slice(1)
}

/** «Søn 21. feb» — for datolinja, der plassen er trang. */
export function kortDato(dag: number): string {
  const d = datoFor(dag)
  const ukedag = UKEDAGER[dag % 7].slice(0, 3)
  return `${ukedag[0].toUpperCase()}${ukedag.slice(1)} ${d.getUTCDate()}. ${MÅNEDER[d.getUTCMonth()].slice(0, 3)}`
}

/** ISO-ukenummer: uka som har torsdagen i seg, teller. */
export function ukenummer(dag: number): number {
  const d = datoFor(dag)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const årStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - årStart) / 86_400_000 + 1) / 7)
}

/** Klokka i spillet: ett døgn går på DAG_SEK sekunder. «kl. 14:25». */
export function klokke(sek: number): string {
  const minutter = Math.floor(((sek % DAG_SEK) / DAG_SEK) * 1440)
  const t = Math.floor(minutter / 60)
  const m = minutter % 60
  return `${String(t).padStart(2, '0')}:${String(m - (m % 5)).padStart(2, '0')}`
}
