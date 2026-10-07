/**
 * Pakke 48: de ansatte har navn og nivå, og på nivå 50 tar hver bedrift en
 * retning for godt. Rene tall og hjelpere — regnestykkene står i formler.ts.
 *
 * Eldre lagringer har bare et antall ansatte. De regnes som erfarne, med navn
 * regnet ut fra bedriften, så ingenting endrer seg for noen før de ansetter
 * eller sier opp. Navnene kommer fra en hash, aldri fra terningen.
 */

import { ANSATT_BONUS, STIGEN } from './innhold'
import { Hashkilde, hashTekst } from './rng'
import type { Ansatt, Ansattgrad, Bedrift, Retning, Spilltilstand } from './types'

export interface Grad {
  navn: string
  /** Inntekten øker med så stor andel av bedriftens basisinntekt. */
  bonus: number
  /** Lønnen, som gange av en erfaren ansatts lønn. */
  lonn: number
  /** Ansettelsen, som gange av prisen for en erfaren. */
  pris: number
  /** Bedriften må ha nådd dette nivået. */
  fraNivaa: number
}

/** Retningen og stjernene kommer på samme nivå. */
export const RETNING_NIVAA = 50

export const GRADER: Record<Ansattgrad, Grad> = {
  junior: { navn: 'Junior', bonus: 0.05, lonn: 0.5, pris: 0.5, fraNivaa: 1 },
  erfaren: { navn: 'Erfaren', bonus: ANSATT_BONUS, lonn: 1, pris: 1, fraNivaa: 1 },
  stjerne: { navn: 'Stjerne', bonus: 0.25, lonn: 3, pris: 4, fraNivaa: RETNING_NIVAA },
}

export const GRADLISTE: Ansattgrad[] = ['junior', 'erfaren', 'stjerne']

export const RETNINGER: Record<Retning, { navn: string; beskrivelse: string; inntekt: number; verdi: number }> = {
  // Volum ble målt til +25 % først: da kom milliarden en time tidligere (6 t 17 min mot 7 t 20 min).
  // Med +15 % kommer den på 6 t 33 min for en spiller som velger volum overalt.
  volum: { navn: 'Volum', beskrivelse: 'Flere kunder, lavere marginer, mer i kassa.', inntekt: 1.15, verdi: 1 },
  premium: { navn: 'Premium', beskrivelse: 'Færre kunder, høyere priser og et navn folk kjenner.', inntekt: 1, verdi: 1.3 },
}

export const RETNINGSLISTE: Retning[] = ['volum', 'premium']

/** Premium gir status etter trinnet på stigen: saftboden 1, skisenteret 13. */
export function retningsstatus(b: Bedrift): number {
  return b.retning === 'premium' ? STIGEN.indexOf(b.type) + 1 : 0
}

/** Status fra alle bedriftene som har valgt premium. */
export function premiumstatus(s: Spilltilstand): number {
  let sum = 0
  for (const b of s.bedrifter) sum += retningsstatus(b)
  return sum
}

/** Inntekten ganges med dette. */
export function retningsfaktor(b: Bedrift): number {
  return b.retning ? RETNINGER[b.retning].inntekt : 1
}

/** Verdien (det investerte) ganges med dette. */
export function verdifaktor(b: Bedrift): number {
  return b.retning ? RETNINGER[b.retning].verdi : 1
}

export function kanVelgeRetning(b: Bedrift): boolean {
  return !b.retning && b.nivaa >= RETNING_NIVAA
}

// ─────────────────────────────────────────────── Navn

const FORNAVN = [
  'Ingrid', 'Ola', 'Nora', 'Jonas', 'Emma', 'Emil', 'Sara', 'Magnus', 'Ida', 'Henrik', 'Thea', 'Tobias',
  'Maja', 'Sander', 'Hanna', 'Mathias', 'Sofie', 'Kristian', 'Leah', 'Eirik', 'Mia', 'Aleksander', 'Ahmed', 'Amina',
  'Sigrid', 'Elias', 'Frida', 'Isak', 'Live', 'Oskar', 'Tuva', 'Vetle', 'Marte', 'Aksel', 'Selma', 'Jakob',
]
const ETTERNAVN = [
  'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen',
  'Berg', 'Haugen', 'Hagen', 'Eriksen', 'Bakken', 'Solberg', 'Strand', 'Moen', 'Lunde', 'Dahl', 'Vik', 'Myhre',
  'Ali', 'Nguyen', 'Lie', 'Brekke', 'Sæther', 'Holm', 'Rønning', 'Aune',
]

/** Et navn fra en hash av grunnlaget — samme grunnlag gir samme navn. */
export function ansattnavn(grunnlag: string): string {
  const h = new Hashkilde(hashTekst(grunnlag))
  return `${FORNAVN[Math.floor(h.neste() * FORNAVN.length)]} ${ETTERNAVN[Math.floor(h.neste() * ETTERNAVN.length)]}`
}

/** De ansatte. Mangler lista (eldre lagringer), er alle erfarne med navn fra bedriften. */
export function stab(b: Bedrift): Ansatt[] {
  return b.stab ?? Array.from({ length: b.ansatte }, (_, i) => ({ navn: ansattnavn(`${b.id}|${i}`), grad: 'erfaren' as const }))
}

/** Hvor mange av hvert nivå. */
export function antallAv(b: Bedrift, grad: Ansattgrad): number {
  if (!b.stab) return grad === 'erfaren' ? b.ansatte : 0
  let n = 0
  for (const a of b.stab) if (a.grad === grad) n++
  return n
}

/**
 * Alle tre antallene i én runde gjennom lista — inntekten og lønnen trenger dem
 * hvert sekund for hver bedrift, og antallAv tre ganger ville gått gjennom den tre ganger.
 */
export function teller(b: Bedrift): Record<Ansattgrad, number> {
  if (!b.stab) return { junior: 0, erfaren: b.ansatte, stjerne: 0 }
  // Lista endres aldri på stedet — ansett og siOpp lager en ny — så tellingen
  // kan huskes per liste. Sparer mye når tiden borte regnes ut.
  const husket = TELLINGER.get(b.stab)
  if (husket) return husket
  const n = { junior: 0, erfaren: 0, stjerne: 0 }
  for (const a of b.stab) n[a.grad]++
  TELLINGER.set(b.stab, n)
  return n
}
const TELLINGER = new WeakMap<Ansatt[], Record<Ansattgrad, number>>()

/** Bedriften med én ansatt til — til å regne på hva en ansettelse gir, uten å ansette. */
export function medNyAnsatt(b: Bedrift, grad: Ansattgrad, navn = ''): Bedrift {
  return { ...b, ansatte: b.ansatte + 1, stab: [...stab(b), { navn, grad }] }
}

/** Bedriften uten den ansatte på plass `indeks`. */
export function utenAnsatt(b: Bedrift, indeks: number): Bedrift {
  const liste = stab(b).filter((_, i) => i !== indeks)
  return { ...b, ansatte: liste.length, stab: liste }
}
