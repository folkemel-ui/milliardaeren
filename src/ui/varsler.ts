/**
 * Varslene: toast-meldingene nederst og feiringen midt på skjermen. Et lite
 * abonnementslager utenfor spilltilstanden — varsler er skjermpynt, ikke
 * noe som lagres.
 */

import { useSyncExternalStore } from 'react'
import type { Fane } from './komponenter/Fanemeny'
import type { Feiringsdata, Kjopsart } from './hendelsesstrom'

/** Hvor et trykk på et varsel tar deg: en fane, eller hendelsesloggen (Pakke 61). */
export type Mål = Fane | 'hendelser'

export type Varseltype = 'god' | 'advarsel' | 'kritisk' | 'feil' | 'avis'

export interface Varsel {
  id: number
  type: Varseltype
  tittel: string
  tekst?: string
  /** Hvor et trykk på varselet tar deg. */
  mål?: Mål
  /** En knapp i varselet, for eksempel «Les» for avisen. */
  handling?: { tekst: string; utfør: () => void }
}

/** Så mange varsler vises på en gang. De eldste skyves ut. */
export const MAKS_SYNLIGE = 3
/** Så lenge et varsel står, i millisekunder. Feil forsvinner raskere. */
export const VARIGHET_MS = 4000
export const FEIL_VARIGHET_MS = 2500

let varsler: Varsel[] = []
let feiring: Feiringsdata | null = null
let kjop: Kjopsglimt | null = null
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

/** Konfetti og en tekst for en formuemilepæl — mer jo større milepælen er. */
export function visFeiring(f: Feiringsdata): void {
  feiring = f
  varsle()
}

export function avsluttFeiring(): void {
  feiring = null
  varsle()
}

export function useFeiring(): Feiringsdata | null {
  return useSyncExternalStore(abonner, () => feiring)
}

/** Kjøpsøyeblikket: tegningen av det du nettopp kjøpte, et kort øyeblikk midt på skjermen. */
export interface Kjopsglimt {
  /** Ny for hvert kjøp, så samme ting kjøpt to ganger (solgt imellom) vises på nytt. */
  nr: number
  art: Kjopsart
  id: string
  navn: string
  /** En linje under navnet, som «Inntekten ×1,5» for en fusjon. */
  under?: string
}

let nesteKjop = 1

export function visKjop(k: Omit<Kjopsglimt, 'nr'>): void {
  kjop = { ...k, nr: nesteKjop++ }
  varsle()
}

export function avsluttKjop(nr: number): void {
  if (kjop?.nr !== nr) return
  kjop = null
  varsle()
}

export function useKjop(): Kjopsglimt | null {
  return useSyncExternalStore(abonner, () => kjop)
}
