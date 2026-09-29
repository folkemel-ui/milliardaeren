/** Rene utregninger over tilstanden. Ingen av dem endrer noe. */

import {
  ANSATT_BONUS,
  ANSATT_LONN,
  ANSATTE_PER_NIVAA,
  ANSETTELSE_FAKTOR,
  ANSETTELSE_VEKST,
  BEDRIFTSTYPER,
  FORBEDRING_PRISFAKTOR,
  FORBEDRINGER,
  LEDER_MINSTEPRIS,
  MAKS_ANSATTE,
  MAKS_BELAANING,
  MILEPAELER,
  RENTE_PER_TIME,
  SPARERENTE_PER_TIME,
} from './innhold'
import { handelskurs, KURTASJE, PAPIRER, rundAntall } from './marked'
import {
  eiendomsverdi,
  leiePerSek,
  luksusverdi,
  STATUS_INNTEKT,
  STATUS_RENTEKUTT,
  statusnivaa,
} from './eiendom'
import { rivalutbyttePerSek, rivalverdi } from './rivaler'
import { fusjonsfaktor } from './fusjon'
import { startupverdi } from './startups'
import { klubbverdi } from './klubb'
import { kunstverdi } from './kunst'
import { fondverdi } from './fond'
import type { Bedrift, BedriftstypeId, Beholdning, Forbedring, PapirId, Spilltilstand } from './types'

// ─────────────────────────────────────────────── Nivåer

/** Inntektsmultiplikatoren fra milepælene: ×2 for hver som er nådd. */
export function milepaelfaktor(nivaa: number): number {
  return 2 ** MILEPAELER.filter((m) => nivaa >= m).length
}

/** Neste nivå som dobler inntekten, eller null når alle er nådd. */
export function nesteMilepael(nivaa: number): number | null {
  return MILEPAELER.find((m) => m > nivaa) ?? null
}

export function oppgraderingspris(b: Bedrift): number {
  const t = BEDRIFTSTYPER[b.type]
  return Math.round(t.oppgraderingspris * t.vekst ** (b.nivaa - 1))
}

// ─────────────────────────────────────────────── Inntekt

/** Produktet av forbedringene som er kjøpt. */
export function forbedringsfaktor(b: Bedrift): number {
  return FORBEDRINGER[b.type].slice(0, b.forbedringer).reduce((f, x) => f * x.faktor, 1)
}

/** Neste forbedring som kan kjøpes (kanskje ikke låst opp ennå), eller null når alle er kjøpt. */
export function nesteForbedring(b: Bedrift): Forbedring | null {
  return FORBEDRINGER[b.type][b.forbedringer] ?? null
}

export function forbedringspris(b: Bedrift, f: Forbedring): number {
  const t = BEDRIFTSTYPER[b.type]
  return Math.round(t.oppgraderingspris * t.vekst ** (f.nivaa - 1) * FORBEDRING_PRISFAKTOR)
}

/** Inntekten fra nivået, forbedringene og fusjonene, før ansatte og lønn. */
export function basisinntekt(b: Bedrift): number {
  return BEDRIFTSTYPER[b.type].grunninntekt * b.nivaa * milepaelfaktor(b.nivaa) * forbedringsfaktor(b) * fusjonsfaktor(b)
}

export function bedriftLonn(b: Bedrift): number {
  return basisinntekt(b) * ANSATT_LONN * b.ansatte
}

/** Nettoinntekt per sekund: basis, pluss det de ansatte gir, minus lønnen deres. */
export function bedriftInntektPerSek(b: Bedrift): number {
  return basisinntekt(b) * (1 + (ANSATT_BONUS - ANSATT_LONN) * b.ansatte)
}

/**
 * En bedrift er verdt det du har investert i den. Da flytter et kjøp bare
 * penger fra kontanter til bedrift — nettoformuen vokser bare av inntekt.
 */
export function bedriftsverdi(b: Bedrift): number {
  return b.investert
}

/**
 * Samlet inntekt per sekund fra bedriftene. Når du er borte, går bare de med
 * leder — de andre er stengt, og da betales heller ingen lønn.
 */
export function inntektPerSek(s: Spilltilstand, borte = false): number {
  const sum = s.bedrifter.reduce((sum, b) => (borte && !b.leder ? sum : sum + bedriftInntektPerSek(b)), 0)
  return sum * statusfaktor(s)
}

/** Statusen din gir bedriftene litt mer inntekt. */
export function statusfaktor(s: Spilltilstand): number {
  return 1 + STATUS_INNTEKT * statusnivaa(s)
}

/** Renten per time, etter statusrabatt. */
export function rentesats(s: Spilltilstand): number {
  return RENTE_PER_TIME - STATUS_RENTEKUTT * statusnivaa(s)
}

export function rentePerSek(s: Spilltilstand): number {
  return (s.gjeld * rentesats(s)) / 3600
}

export function sparerentePerSek(s: Spilltilstand): number {
  return (s.sparing * SPARERENTE_PER_TIME) / 3600
}

/** Det som faktisk kommer inn hvert sekund: bedriftene, leien, sparerenten og rivalutbyttet, minus lånerenter. */
export function nettoPerSek(s: Spilltilstand): number {
  return inntektPerSek(s) + leiePerSek(s) + sparerentePerSek(s) + rivalutbyttePerSek(s) - rentePerSek(s)
}

// ─────────────────────────────────────────────── Formue

export function papirverdi(s: Spilltilstand, klasse?: 'aksje' | 'krypto'): number {
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, Beholdning][]) {
    if (klasse && PAPIRER[id].klasse !== klasse) continue
    sum += b.antall * s.marked.kurser[id].kurs
  }
  return sum
}

/** Alt du eier, før gjeld. */
export function eiendeler(s: Spilltilstand): number {
  return (
    s.kontanter +
    s.sparing +
    s.bedrifter.reduce((sum, b) => sum + bedriftsverdi(b), 0) +
    papirverdi(s) +
    fondverdi(s) +
    eiendomsverdi(s) +
    luksusverdi(s) +
    rivalverdi(s) +
    startupverdi(s) +
    klubbverdi(s) +
    kunstverdi(s)
  )
}

/** Nettoformuen er spillets poengsum: alt du eier minus det du skylder. */
export function nettoformue(s: Spilltilstand): number {
  return eiendeler(s) - s.gjeld
}

// ─────────────────────────────────────────────── Banken

/** Gjeld som andel av eiendelene. */
export function belaaningsgrad(s: Spilltilstand): number {
  const e = eiendeler(s)
  return e > 0 ? s.gjeld / e : s.gjeld > 0 ? Infinity : 0
}

/**
 * Hvor mye du kan låne nå. Et lån øker både eiendeler og gjeld, så grensen
 * (gjeld ≤ andel · eiendeler) gir: nytt lån ≤ (andel · E − G) / (1 − andel).
 */
export function maksNyttLaan(s: Spilltilstand): number {
  return Math.max(0, Math.floor((MAKS_BELAANING * eiendeler(s) - s.gjeld) / (1 - MAKS_BELAANING)))
}

// ─────────────────────────────────────────────── Handel

/** Hvor mange du har råd til å kjøpe, med kurtasje og kurstrykk regnet med. */
export function maksKjop(s: Spilltilstand, id: PapirId): number {
  const kurs = s.marked.kurser[id].kurs
  let antall = s.kontanter / (kurs * (1 + KURTASJE))
  for (let i = 0; i < 8; i++) antall = s.kontanter / (handelskurs(s, id, antall) * (1 + KURTASJE))
  antall = rundAntall(id, antall)
  // Kappingen er konservativ, men sjekk likevel — avrunding skal aldri gi en avvist ordre.
  const steg = PAPIRER[id].klasse === 'aksje' ? 1 : 0.0001
  while (antall > 0 && antall * handelskurs(s, id, antall) * (1 + KURTASJE) > s.kontanter) {
    antall = rundAntall(id, antall - steg)
  }
  return Math.max(0, antall)
}

// ─────────────────────────────────────────────── Kjøp

export function eierType(s: Spilltilstand, type: BedriftstypeId): boolean {
  return s.bedrifter.some((b) => b.type === type)
}

export function erLaastOpp(s: Spilltilstand, type: BedriftstypeId): boolean {
  return s.hoyesteFormue >= BEDRIFTSTYPER[type].laasesOppVed
}

// ─────────────────────────────────────────────── Ansatte og leder

export function maksAnsatte(b: Bedrift): number {
  return Math.min(MAKS_ANSATTE, 1 + Math.floor(b.nivaa / ANSATTE_PER_NIVAA))
}

export function ansettelsespris(b: Bedrift): number {
  return Math.round(oppgraderingspris(b) * ANSETTELSE_FAKTOR * ANSETTELSE_VEKST ** b.ansatte)
}

export function lederpris(type: BedriftstypeId): number {
  return Math.max(LEDER_MINSTEPRIS, BEDRIFTSTYPER[type].pris * 2)
}
