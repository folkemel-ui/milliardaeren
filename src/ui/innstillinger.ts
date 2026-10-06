/**
 * Innstillingene som hører til nettleseren, ikke spillet: bevegelse og
 * varsler. Som temaet og avisvalget lagres de i localStorage, så en ny
 * enhet starter med standardene. Delt tilstand med useSyncExternalStore,
 * så alle som leser dem, oppdateres når de endres.
 */

import { useSyncExternalStore } from 'react'
import type { Nytt } from './hendelsesstrom'

/** «system» følger operativsystemets valg; «redusert» skrur av bevegelse uansett. */
export type Bevegelse = 'system' | 'redusert'
/** «viktige» viser bare varsler om noe som har gått galt — og nye faner. Feil når du trykker, vises alltid. */
export type Varselnivaa = 'alle' | 'viktige' | 'av'

const NOKLER = { bevegelse: 'milliardaer.bevegelse', varsler: 'milliardaer.varsler' } as const

function les<T extends string>(nokkel: string, lovlige: readonly T[], standard: T): T {
  try {
    const v = localStorage.getItem(nokkel) as T | null
    return v && lovlige.includes(v) ? v : standard
  } catch {
    return standard
  }
}

let bevegelse: Bevegelse = les(NOKLER.bevegelse, ['system', 'redusert'] as const, 'system')
let varsler: Varselnivaa = les(NOKLER.varsler, ['alle', 'viktige', 'av'] as const, 'alle')
const lyttere = new Set<() => void>()

function lagre(nokkel: string, verdi: string): void {
  try {
    localStorage.setItem(nokkel, verdi)
  } catch {
    /* bare en bekvemmelighet */
  }
  for (const l of lyttere) l()
}

/** Setter data-bevegelse på <html>, som CSS-en bruker til å skru av animasjonene. */
export function brukBevegelse(b: Bevegelse = bevegelse): void {
  if (typeof document === 'undefined') return
  if (b === 'redusert') document.documentElement.dataset.bevegelse = 'redusert'
  else delete document.documentElement.dataset.bevegelse
}

export function settBevegelse(b: Bevegelse): void {
  bevegelse = b
  brukBevegelse(b)
  lagre(NOKLER.bevegelse, b)
}

export function settVarsler(v: Varselnivaa): void {
  varsler = v
  lagre(NOKLER.varsler, v)
}

export const lesBevegelse = (): Bevegelse => bevegelse
export const lesVarsler = (): Varselnivaa => varsler

/**
 * Skal et funn bli et varsel med dette varselvalget? Viktige er hendelser
 * som ikke bare er til info (marginkrav, skatt innkrevd, konkurs) og nye
 * faner. Avisa har sitt eget valg og går ikke gjennom her.
 */
export function vises(f: Nytt, nivaa: Varselnivaa = varsler): boolean {
  if (nivaa === 'av') return false
  if (nivaa === 'alle') return true
  return f.type === 'fane' || (f.type === 'hendelse' && f.hendelse.alvor !== 'info')
}

/** Skal bevegelsen dempes — fordi du har valgt det her, eller fordi systemet ber om det? */
export function redusertBevegelse(): boolean {
  if (bevegelse === 'redusert') return true
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function abonner(l: () => void): () => void {
  lyttere.add(l)
  return () => lyttere.delete(l)
}

export function useBevegelse(): Bevegelse {
  return useSyncExternalStore(abonner, lesBevegelse, lesBevegelse)
}

export function useVarselnivaa(): Varselnivaa {
  return useSyncExternalStore(abonner, lesVarsler, lesVarsler)
}
