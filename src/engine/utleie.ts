/**
 * Pakke 54: utleie med folk i. Leiligheter står tomme en stund, og noen
 * leietakere koster penger. En forvalter per by tar seg av det — med en egen
 * stil:
 *
 *  - ledigheten trekkes per by og spilluke: 0–20 % av leien (10 % i snitt);
 *  - hver mandag har hver by du eier i, 10 % sjanse for en dårlig leietaker,
 *    som koster en dags leie i byen og står i avisa;
 *  - en forvalter ansettes for en engangssum (5 % av det du eier i byen, minst
 *    kr 100 000) og har en egenskap: forsiktig, pågående eller lokalkjent.
 *
 * Alt trekkes fra hasher av byen og uka, ikke fra terningen.
 */

import { dagnummer, DAG_SEK } from './kalender'
import { Hashkilde, hashTekst } from './rng'
import { spilluke } from './verden'
import type { By, ForvalterId, Overskrift, Spilltilstand } from './types'
import { kortKroner } from './tall'

export const FORVALTERE: Record<ForvalterId, { navn: string; beskrivelse: string; ledighet: number; uflaks: number; leie: number }> = {
  forsiktig: { navn: 'Forsiktig', beskrivelse: 'Velger leietakerne med omhu. Lite tomt og lite bråk, litt lavere leie.', ledighet: 0.3, uflaks: 0.3, leie: 0.95 },
  paagaende: { navn: 'Pågående', beskrivelse: 'Presser leia opp og fyller leilighetene fort — men tar inn hvem som helst.', ledighet: 0.6, uflaks: 1.5, leie: 1.1 },
  lokal: { navn: 'Lokalkjent', beskrivelse: 'Kjenner byen og folkene i den. Mindre tomt, færre problemer, litt bedre leie.', ledighet: 0.5, uflaks: 0.5, leie: 1.05 },
}

export const FORVALTERLISTE = Object.keys(FORVALTERE) as ForvalterId[]

/** Ledigheten i en by en uke uten forvalter: fra 0 til dette (snitt halvparten). */
export const LEDIGHET_MAKS = 0.2
/** Sjansen per uke og by for en dårlig leietaker uten forvalter. */
export const UFLAKS_SJANSE = 0.1
/** En forvalter koster så stor andel av det du eier i byen … */
export const FORVALTER_ANDEL = 0.05
/** … men aldri under dette. */
export const FORVALTER_MINSTEPRIS = 100_000

let ledighetUke = Number.NaN
const LEDIGHET_I_UKA = new Map<By, number>()

/**
 * Ledigheten i byen denne uka uten forvalter. Husket, for leien spør hvert
 * sekund — per by for uka som gjelder, så sekundet slipper å bygge en
 * tekstnøkkel for hver by (Pakke 64). Samme regnestykke som før.
 */
function grunnledighet(by: By, uke: number): number {
  if (uke !== ledighetUke) {
    ledighetUke = uke
    LEDIGHET_I_UKA.clear()
  }
  let l = LEDIGHET_I_UKA.get(by)
  if (l === undefined) {
    l = new Hashkilde(hashTekst(`ledighet:${by}|${uke}`)).neste() * LEDIGHET_MAKS
    LEDIGHET_I_UKA.set(by, l)
  }
  return l
}

export function forvalter(s: Spilltilstand, by: By): ForvalterId | undefined {
  return s.forvaltere?.[by]
}

/** Andelen av leien i byen som står tom denne uka, med forvalteren som gjelder. */
export function ledighet(s: Spilltilstand, by: By): number {
  const f = forvalter(s, by)
  return grunnledighet(by, spilluke(dagnummer(s.sek))) * (f ? FORVALTERE[f].ledighet : 1)
}

/** Leien i byen ganges med dette: det som ikke står tomt, og forvalterens stil. */
export function leiefaktorBy(s: Spilltilstand, by: By): number {
  const f = forvalter(s, by)
  return (1 - ledighet(s, by)) * (f ? FORVALTERE[f].leie : 1)
}

/** Sjansen for en dårlig leietaker i byen en uke, med forvalteren som gjelder. */
export function uflaksSjanse(s: Spilltilstand, by: By): number {
  const f = forvalter(s, by)
  return UFLAKS_SJANSE * (f ? FORVALTERE[f].uflaks : 1)
}

/** Det en forvalter koster i byen nå. */
export function forvalterpris(byverdi: number): number {
  return Math.max(FORVALTER_MINSTEPRIS, Math.round(byverdi * FORVALTER_ANDEL))
}

const LEIETAKERTEKST = [
  (sted: string) => `Leietaker forsvant fra ${sted} uten å betale`,
  (sted: string) => `Vannskade i utleieleilighet på ${sted}`,
  (sted: string) => `Fest gikk over styr på ${sted}`,
  (sted: string) => `Leietaker på ${sted} nekter å flytte`,
]

/**
 * Mandagens leietakere: i hver by du eier i, kan en dårlig leietaker koste en
 * dags leie der. \`leieIByen\` gir leien per sekund i byen. Gir sakene til avisa.
 * Muterer — brukes på kopier.
 */
export function utleieVedDagsskifte(
  s: Spilltilstand,
  byer: { by: By; sted: string }[],
  leieIByen: (by: By) => number,
): Overskrift[] {
  const dag = dagnummer(s.sek)
  if (dag % 7 !== 0) return []
  const saker: Overskrift[] = []
  for (const { by, sted } of byer) {
    const h = new Hashkilde(hashTekst(`leietaker:${by}|${spilluke(dag)}`))
    if (h.neste() >= uflaksSjanse(s, by)) continue
    const tap = Math.round(leieIByen(by) * DAG_SEK)
    if (tap <= 0) continue
    s.kontanter -= tap
    // En dårlig leietaker trekkes fra leien, så skatten og regnskapet ser det.
    s.totaltLeie -= tap
    const tekst = LEIETAKERTEKST[Math.floor(h.neste() * LEIETAKERTEKST.length)](sted)
    const etter = forvalter(s, by) ? 'Forvalteren rydder opp.' : 'En forvalter kunne ha holdt det unna.'
    saker.push({ type: 'deg', tittel: tekst, tekst: `Det koster deg ${kortKroner(tap)} — en dags leie i ${by}. ${etter}` })
  }
  return saker
}

