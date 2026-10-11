/**
 * Pakke 54: utleie med folk i. Leiligheter står tomme en stund, og noen
 * leietakere koster penger. En forvalter per by tar seg av det — med en egen
 * stil:
 *
 *  - ledigheten trekkes per by og spilluke: 0–20 % av leien (10 % i snitt);
 *  - hver mandag har hver by du eier i, 10 % sjanse for en dårlig leietaker,
 *    som koster en ukes leie i byen (en dag før Pakke 83) og står i avisa;
 *  - en forvalter ansettes for en engangssum (5 % av det du eier i byen, minst
 *    kr 100 000) og har en egenskap: forsiktig, pågående eller lokalkjent.
 *
 * Alt trekkes fra hasher av byen og uka, ikke fra terningen.
 */

import { dagnummer, DAG_SEK } from './kalender'
import { Hashkilde, hashTekst } from './rng'
import { fase, spilluke } from './verden'
import type { By, ForvalterId, Overskrift, Spilltilstand } from './types'
import { kortKroner } from './tall'

export interface Forvalterstil {
  navn: string
  beskrivelse: string
  /** Ledigheten ganges med dette … */
  ledighet: number
  /** … sjansen for en dårlig leietaker med dette … */
  uflaks: number
  /** … og leien med dette. */
  leie: number
  /** Leien i høykonjunktur, når den er en annen. */
  leieHoy?: number
  /** Ingen tomme leiligheter i lavkonjunktur. */
  ingenLedighetILav?: boolean
}

/**
 * Hver forvalter er best i sin fase av konjunkturen (Pakke 83) — før vant Pågående
 * alltid (forventet leie 0,886 uten, 0,917 / 0,990 / 1,012). Nå, med en ukes leie for
 * en dårlig leietaker og dobbel ledighet i lavkonjunktur: uten forvalter 0,80 (0,70 i
 * lavkonjunktur); Forsiktig 0,95 og 0,98 i lavkonjunktur; Lokalkjent 0,976 i normale
 * tider; Pågående 1,025 i høykonjunktur. Et bytte koster lite (BYTTE_ANDEL), så det
 * lønner seg å bytte når konjunkturen snur.
 */
export const FORVALTERE: Record<ForvalterId, Forvalterstil> = {
  forsiktig: { navn: 'Forsiktig', beskrivelse: 'Velger leietakerne med omhu. Lite bråk, og ingen tomme leiligheter i nedgangstider.', ledighet: 0.3, uflaks: 0.2, leie: 1, ingenLedighetILav: true },
  paagaende: { navn: 'Pågående', beskrivelse: 'Presser leia opp og fyller leilighetene fort — aller mest i oppgangstider. Men tar inn hvem som helst.', ledighet: 0.6, uflaks: 1.5, leie: 1.1, leieHoy: 1.25 },
  lokal: { navn: 'Lokalkjent', beskrivelse: 'Kjenner byen og folkene i den. Mindre tomt, færre problemer og best leie i normale tider.', ledighet: 0.5, uflaks: 0.5, leie: 1.08 },
}

export const FORVALTERLISTE = Object.keys(FORVALTERE) as ForvalterId[]

/** Ledigheten i en by en uke uten forvalter: fra 0 til dette (snitt halvparten). */
export const LEDIGHET_MAKS = 0.2
/** Sjansen per uke og by for en dårlig leietaker uten forvalter. */
export const UFLAKS_SJANSE = 0.1
/** En dårlig leietaker koster så mange dagers leie i byen (1 før Pakke 83). */
export const UFLAKS_DAGER = 7
/** I lavkonjunktur står dobbelt så mye tomt. */
export const LAV_LEDIGHET = 2
/** Å bytte forvalter koster så stor andel av det du eier i byen … */
export const BYTTE_ANDEL = 0.01
/** … men aldri under dette. */
export const BYTTE_MINSTEPRIS = 20_000
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

/** Andelen av leien i byen som står tom denne uka med forvalteren `f` (eller ingen). */
export function ledighetMed(s: Spilltilstand, by: By, f: ForvalterId | undefined): number {
  const lav = fase(s) === 'lav'
  if (lav && f && FORVALTERE[f].ingenLedighetILav) return 0
  return grunnledighet(by, spilluke(dagnummer(s.sek))) * (lav ? LAV_LEDIGHET : 1) * (f ? FORVALTERE[f].ledighet : 1)
}

/** Forvalterens leiefaktor i fasen konjunkturen er i nå. */
export function leieMed(s: Spilltilstand, f: ForvalterId | undefined): number {
  if (!f) return 1
  const stil = FORVALTERE[f]
  return stil.leieHoy !== undefined && fase(s) === 'hoy' ? stil.leieHoy : stil.leie
}

/** Andelen av leien i byen som står tom denne uka, med forvalteren som gjelder. */
export function ledighet(s: Spilltilstand, by: By): number {
  return ledighetMed(s, by, forvalter(s, by))
}

/** Leien i byen ganges med dette: det som ikke står tomt, og forvalterens stil. */
export function leiefaktorBy(s: Spilltilstand, by: By): number {
  const f = forvalter(s, by)
  return (1 - ledighetMed(s, by, f)) * leieMed(s, f)
}

/** Sjansen for en dårlig leietaker i byen en uke, med forvalteren som gjelder. */
export function uflaksSjanse(s: Spilltilstand, by: By): number {
  const f = forvalter(s, by)
  return UFLAKS_SJANSE * (f ? FORVALTERE[f].uflaks : 1)
}

/**
 * Det du kan vente av full leie i byen denne uka med forvalteren `f` (eller ingen):
 * det som ikke står tomt, ganger stilen, minus det dårlige leietakere koster i snitt.
 * Til forvalterkortet, så du ser hvem som er best nå.
 */
export function ventetLeie(s: Spilltilstand, by: By, f: ForvalterId | undefined): number {
  const uflaks = UFLAKS_SJANSE * (f ? FORVALTERE[f].uflaks : 1)
  return (1 - ledighetMed(s, by, f)) * leieMed(s, f) - (uflaks * UFLAKS_DAGER) / 7
}

/** Det et bytte av forvalter koster i byen nå. */
export function byttepris(byverdi: number): number {
  return Math.max(BYTTE_MINSTEPRIS, Math.round(byverdi * BYTTE_ANDEL))
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
 * ukes leie der. \`leieIByen\` gir leien per sekund i byen. Gir sakene til avisa.
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
    const tap = Math.round(leieIByen(by) * DAG_SEK * UFLAKS_DAGER)
    if (tap <= 0) continue
    s.kontanter -= tap
    // En dårlig leietaker trekkes fra leien, så skatten og regnskapet ser det.
    s.totaltLeie -= tap
    const tekst = LEIETAKERTEKST[Math.floor(h.neste() * LEIETAKERTEKST.length)](sted)
    const etter = forvalter(s, by) ? 'Forvalteren rydder opp.' : 'En forvalter kunne ha holdt det unna.'
    saker.push({ type: 'deg', tittel: tekst, tekst: `Det koster deg ${kortKroner(tap)} — en ukes leie i ${by}. ${etter}` })
  }
  return saker
}

