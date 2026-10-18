/**
 * Gårdens sider (Pakke 112). En gårds detaljside er et nav, som klubben fra Pakke 77:
 * kortet med ukas høst, tre rader som åpner hver sin side med tilbake, og tallene. Hvilken
 * side som er åpen, er en liten delt tilstand; Tingdetalj viser siden og lukker den når
 * gården lukkes.
 */

import { useSyncExternalStore } from 'react'

export type Gardsside = 'jorder' | 'dyr' | 'lager'

export const GARDSSIDER: { id: Gardsside; navn: string }[] = [
  { id: 'jorder', navn: 'Jorder og maskiner' },
  { id: 'dyr', navn: 'Dyr' },
  { id: 'lager', navn: 'Lager og regnskap' },
]

const lyttere = new Set<() => void>()
let naa: Gardsside | null = null

export function aapneGardsside(side: Gardsside | null): void {
  if (naa === side) return
  naa = side
  for (const l of lyttere) l()
}

/** Siden som er åpen nå, utenfor React. */
export function aapenGardsside(): Gardsside | null {
  return naa
}

export function useGardsside(): Gardsside | null {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    aapenGardsside,
    () => null,
  )
}
