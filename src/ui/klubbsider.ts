/**
 * Klubbens sider (Pakke 77). Klubb-delen er et nav: toppen, neste kamp,
 * formen, en bit av tabellen og fire rader som åpner hver sin side med
 * tilbake — Pakke 66s regel for en del som har vokst ut av plassen sin.
 * Hvilken side som er åpen, er en liten delt tilstand som tingsidene
 * (`detaljvisning.ts`): Luksus viser siden og lukker den når fanen forsvinner.
 */

import { useSyncExternalStore } from 'react'

export type Klubbside = 'tropp' | 'kamper' | 'anlegg' | 'sesonger'

export const KLUBBSIDER: { id: Klubbside; navn: string }[] = [
  { id: 'tropp', navn: 'Troppen og marked' },
  { id: 'kamper', navn: 'Kamper og tabell' },
  { id: 'anlegg', navn: 'Anlegg og økonomi' },
  { id: 'sesonger', navn: 'Sesongene' },
]

const lyttere = new Set<() => void>()
let naa: Klubbside | null = null

export function aapneKlubbside(side: Klubbside | null): void {
  if (naa === side) return
  naa = side
  for (const l of lyttere) l()
}

/** Siden som er åpen nå, utenfor React. */
export function aapenKlubbside(): Klubbside | null {
  return naa
}

export function useKlubbside(): Klubbside | null {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    aapenKlubbside,
    () => null,
  )
}
