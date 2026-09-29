/**
 * Varslene: toast-meldingene nederst og feiringen midt på skjermen. Et lite
 * abonnementslager utenfor spilltilstanden — varsler er skjermpynt, ikke
 * noe som lagres.
 */

import { useSyncExternalStore } from 'react'
import type { Fane } from './komponenter/Fanemeny'

export type Varseltype = 'god' | 'advarsel' | 'kritisk' | 'feil' | 'avis'

export interface Varsel {
  id: number
  type: Varseltype
  tittel: string
  tekst?: string
  /** Hvor et trykk på varselet tar deg. */
  mål?: Fane
  /** En knapp i varselet, for eksempel «Les» for avisen. */
  handling?: { tekst: string; utfør: () => void }
}

/** Så mange varsler vises på en gang. De eldste skyves ut. */
export const MAKS_SYNLIGE = 3
/** Så lenge et varsel står, i millisekunder. Feil forsvinner raskere. */
export const VARIGHET_MS = 4000
export const FEIL_VARIGHET_MS = 2500

let varsler: Varsel[] = []
let feiring: string | null = null
let nesteId = 1
const lyttere = new Set<() => void>()

function varsle(): void {
  for (const l of lyttere) l()
}

function abonner(fn: () => void): () => void {
  lyttere.add(fn)
  return () => {
    lyttere.delete(fn)
  }
}

export function visVarsel(v: Omit<Varsel, 'id'>): void {
  const id = nesteId++
  varsler = [...varsler, { ...v, id }].slice(-MAKS_SYNLIGE)
  varsle()
  setTimeout(() => fjernVarsel(id), v.type === 'feil' ? FEIL_VARIGHET_MS : VARIGHET_MS)
}

export function fjernVarsel(id: number): void {
  if (!varsler.some((v) => v.id === id)) return
  varsler = varsler.filter((v) => v.id !== id)
  varsle()
}

export function useVarsler(): Varsel[] {
  return useSyncExternalStore(abonner, () => varsler)
}

/** Gullblink, konfetti og en stor tekst — for millionen og milliarden. */
export function visFeiring(tekst: string): void {
  feiring = tekst
  varsle()
}

export function avsluttFeiring(): void {
  feiring = null
  varsle()
}

export function useFeiring(): string | null {
  return useSyncExternalStore(abonner, () => feiring)
}
