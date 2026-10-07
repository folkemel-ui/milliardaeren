/**
 * Detaljsiden for noe du kan eie (Grafikkpakke G7): en eiendom, en gård
 * eller skog, et landemerke, en luksusgjenstand eller et maleri, med den
 * store scenen øverst. Kortene finnes mange steder — lista, byvisningen,
 * gatebildet, lageret, galleriveggen — så hva som er åpent er en liten delt
 * tilstand, ikke en useState i hver skjerm. Skjermen som eier slaget
 * (Eiendom eller Luksus) viser siden, og lukker den når den selv forsvinner.
 */

import { useSyncExternalStore, type MouseEvent } from 'react'

export type Tingslag = 'eiendom' | 'jord' | 'landemerke' | 'luksus' | 'maleri'
export type Ting = { slag: Tingslag; id: string }

/** Hvilken fane hvert slag hører til. */
export const FANE_FOR: Record<Tingslag, 'eiendom' | 'luksus'> = {
  eiendom: 'eiendom',
  jord: 'eiendom',
  landemerke: 'eiendom',
  luksus: 'luksus',
  maleri: 'luksus',
}

const lyttere = new Set<() => void>()
let naa: Ting | null = null

export function aapneTing(t: Ting | null): void {
  if (naa === t || (naa && t && naa.slag === t.slag && naa.id === t.id)) return
  naa = t
  for (const l of lyttere) l()
}

/** Det som er åpent nå, utenfor React. */
export function aapenTing(): Ting | null {
  return naa
}

export function useTing(): Ting | null {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    aapenTing,
    () => null,
  )
}

/**
 * Trykk på et kort åpner detaljsiden, men ikke når trykket traff en knapp
 * (kjøp, selg, pusse opp) eller noe annet som gjør noe selv.
 */
export function trykkApner(t: Ting) {
  return (e: MouseEvent) => {
    const mal = e.target as Element | null
    if (mal?.closest?.('button, a, input, select, textarea, label, [role="button"]')) return
    aapneTing(t)
  }
}
