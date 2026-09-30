/**
 * Rivalene: fire fiktive storkapitalister som bygger formue på egen hånd.
 * Hver eier et holdingselskap verdt halve formuen. Du kan kjøpe deg inn i
 * blokker på 10 %, få utbytte, og fra 50 % gjennomføre et fiendtlig oppkjøp.
 *
 * Veksten er logistisk: rask når rivalen er liten, langsommere mot taket.
 */

import type { Terning } from './rng'
import type { Rival, Spilltilstand } from './types'

export const START_RIVALER: Rival[] = [
  { id: 'gronn', navn: 'Harald Grønn', selskap: 'Grønn Holding', formue: 20_000, tak: 3e9, vekst: 0.6, andel: 0, kostpris: 0, overtatt: false, solgt: [], bud: {} },
  { id: 'lunde', navn: 'Ingrid Lunde', selskap: 'Lunde Invest', formue: 500_000, tak: 12e9, vekst: 0.45, andel: 0, kostpris: 0, overtatt: false, solgt: [], bud: {} },
  { id: 'fjeld', navn: 'Sverre Fjeld', selskap: 'Fjeld Kapital', formue: 30e6, tak: 40e9, vekst: 0.3, andel: 0, kostpris: 0, overtatt: false, solgt: [], bud: {} },
  { id: 'aas', navn: 'Marit Aas', selskap: 'Aas Industrier', formue: 2e9, tak: 150e9, vekst: 0.12, andel: 0, kostpris: 0, overtatt: false, solgt: [], bud: {} },
]

/** Selskapet er verdt så stor andel av eierens formue. */
export const SELSKAPSANDEL = 0.5
/** Én blokk er 10 % av selskapet. */
export const BLOKK = 0.1
/** Hver blokk du alt eier gjør neste 5 % dyrere — eierne selger ikke billig. */
export const BLOKKPREMIE = 0.05
/** Fiendtlig oppkjøp: resten betales med 20 % premie. */
export const OPPKJOPSPREMIE = 0.2
/** Selskapene betaler utbytte per time, som andel av verdien. */
export const RIVALUTBYTTE = 0.03
/** Salg av en eierandel koster 3 % i honorar. */
export const SALGSHONORAR = 0.03
const SVINGNING = 0.15

export function selskapsverdi(r: Rival): number {
  return r.formue * SELSKAPSANDEL
}

/** Verdien av dine eierandeler i rivalenes selskaper. */
export function rivalverdi(s: Spilltilstand): number {
  return (s.rivaler ?? []).reduce((sum, r) => sum + r.andel * selskapsverdi(r), 0)
}

export function rivalutbyttePerSek(s: Spilltilstand): number {
  return (s.rivaler ?? []).reduce((sum, r) => sum + (r.andel * selskapsverdi(r) * RIVALUTBYTTE) / 3600, 0)
}

export function blokkpris(r: Rival): number {
  const eideBlokker = Math.round(r.andel / BLOKK)
  return BLOKK * selskapsverdi(r) * (1 + BLOKKPREMIE * eideBlokker)
}

export function oppkjopspris(r: Rival): number {
  return (1 - r.andel) * selskapsverdi(r) * (1 + OPPKJOPSPREMIE)
}

/** Rivalene vokser, med litt tilfeldig svingning. Muterer — brukes på kopier. dt i timer. */
export function rivaltikk(s: Spilltilstand, t: Terning, dt: number): void {
  for (const r of s.rivaler) {
    const rate = r.vekst * Math.max(0, 1 - r.formue / r.tak)
    const u = 1 - t.neste()
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * t.neste())
    r.formue *= Math.exp(rate * dt + SVINGNING * Math.sqrt(dt) * normal)
  }
}

export interface Plassering {
  navn: string
  formue: number
  deg: boolean
  rivalId?: string
}

/**
 * Det rivalen selv eier: formuen minus den delen av holdingselskapet som er
 * din. Den delen står allerede i din nettoformue, så ellers telles den to ganger.
 */
export function rivalensEgenFormue(r: Rival): number {
  return r.formue - r.andel * selskapsverdi(r)
}

/** Forbes-lista: deg og rivalene som ennå ikke er kjøpt opp, rikest først. */
export function forbesliste(s: Spilltilstand, dinFormue: number): Plassering[] {
  const liste: Plassering[] = [
    { navn: 'Deg', formue: dinFormue, deg: true },
    ...(s.rivaler ?? []).filter((r) => !r.overtatt).map((r) => ({ navn: r.navn, formue: rivalensEgenFormue(r), deg: false, rivalId: r.id })),
  ]
  return liste.sort((a, b) => b.formue - a.formue)
}
