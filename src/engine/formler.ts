/** Rene utregninger over tilstanden. Ingen av dem endrer noe. */

import {
  ANSATT_BONUS,
  ANSATT_LONN,
  ANSATTE_PER_NIVAA,
  ANSETTELSE_FAKTOR,
  ANSETTELSE_VEKST,
  BEDRIFTSTYPER,
  LEDER_MINSTEPRIS,
  MAKS_ANSATTE,
  MILEPAELER,
} from './innhold'
import type { Bedrift, BedriftstypeId, Spilltilstand } from './types'

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

/** Inntekten fra nivået alene, før ansatte og lønn. */
export function basisinntekt(b: Bedrift): number {
  return BEDRIFTSTYPER[b.type].grunninntekt * b.nivaa * milepaelfaktor(b.nivaa)
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
 * Samlet inntekt per sekund. Når du er borte, går bare bedriftene med leder —
 * de andre er stengt, og da betales heller ingen lønn.
 */
export function inntektPerSek(s: Spilltilstand, borte = false): number {
  return s.bedrifter.reduce((sum, b) => (borte && !b.leder ? sum : sum + bedriftInntektPerSek(b)), 0)
}

/**
 * Nettoformuen er spillets poengsum: kontanter pluss alt du eier.
 * Investeringer, eiendom, luksus og gjeld legges til her etter hvert.
 */
export function nettoformue(s: Spilltilstand): number {
  return s.kontanter + s.bedrifter.reduce((sum, b) => sum + bedriftsverdi(b), 0)
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
