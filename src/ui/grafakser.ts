/**
 * Aksene til grafene: runde verdier for rutenettet og tidspunkter langs
 * bunnen. Rene funksjoner, så de kan testes uten å tegne noe.
 */

import { DAG_SEK, dagnummer, dato, MÅNEDER } from '../engine/kalender'
import { klokke, kortDato } from './kalender'

/** Et rundt steg (1, 2, 2,5 eller 5 ganger en tierpotens) som gir omtrent `antall` streker over spennet. */
export function rundtSteg(spenn: number, antall = 4): number {
  if (!(spenn > 0)) return 1
  const grovt = spenn / antall
  const potens = 10 ** Math.floor(Math.log10(grovt))
  const brøk = grovt / potens
  const valgt = brøk <= 1 ? 1 : brøk <= 2 ? 2 : brøk <= 2.5 ? 2.5 : brøk <= 5 ? 5 : 10
  return valgt * potens
}

/**
 * Verdiene der rutenettet går: runde tall mellom `bunn` og `topp`. Gir et
 * rundt steg færre enn tre streker, brukes et finere steg.
 */
export function verdimerker(bunn: number, topp: number, antall = 4): number[] {
  const merker = (steg: number) => {
    const ut: number[] = []
    for (let v = Math.ceil(bunn / steg) * steg; v <= topp + steg * 1e-9; v += steg) {
      // Unngå -0 og flyttallsstøy som 0,30000000000000004.
      ut.push(Math.abs(v) < steg * 1e-9 ? 0 : Number(v.toPrecision(12)))
    }
    return ut
  }
  const grove = merker(rundtSteg(topp - bunn, antall))
  return grove.length >= 3 ? grove : merker(rundtSteg(topp - bunn, antall * 2))
}

/** En spilltime er DAG_SEK / 24 sekunder. */
const TIME = DAG_SEK / 24
const TIDSSTEG = [1, 2, 3, 6, 12].map((t) => t * TIME).concat([1, 2, 3, 7, 14, 28, 56, 91, 182, 364].map((d) => d * DAG_SEK))

export interface Tidsmerke {
  sek: number
  tekst: string
}

/** «5. jan» */
function dagOgMaaned(dag: number): string {
  const d = dato(dag)
  return `${d.dag}. ${MÅNEDER[d.maaned].slice(0, 3)}`
}

/** «jan 28» — for grafer som dekker flere år. */
function maanedOgAar(dag: number): string {
  const d = dato(dag)
  return `${MÅNEDER[d.maaned].slice(0, 3)} ${String(d.aar).slice(2)}`
}

/**
 * Tidspunktene langs bunnen av en graf fra `fra` til `til` (spillsekunder):
 * klokkeslett når grafen dekker en dag eller mindre, ellers datoer — med år
 * når den dekker flere år. Stegene følger døgnet og uka, så merkene havner på
 * hele timer og hele dager.
 */
export function tidsmerker(fra: number, til: number, antall = 4): Tidsmerke[] {
  const spenn = til - fra
  if (!(spenn > 0)) return []
  // Lengre enn stegene rekker: hele år.
  const steg = TIDSSTEG.find((s) => spenn / s <= antall) ?? 364 * DAG_SEK * Math.ceil(spenn / (antall * 364 * DAG_SEK))
  const merker: Tidsmerke[] = []
  for (let sek = Math.ceil(fra / steg) * steg; sek <= til; sek += steg) {
    merker.push({ sek, tekst: steg < DAG_SEK ? klokke(sek) : steg < 182 * DAG_SEK ? dagOgMaaned(dagnummer(sek)) : maanedOgAar(dagnummer(sek)) })
  }
  return merker
}

/** Når et punkt var, til avlesningen: «Tir 5. jan 14:25», eller bare datoen for lange grafer. */
export function tidspunkt(sek: number, medKlokke: boolean): string {
  return `${kortDato(dagnummer(sek))}${medKlokke ? ` ${klokke(sek)}` : ''}`
}
