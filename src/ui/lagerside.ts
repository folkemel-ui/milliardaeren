/**
 * Garasjen, havna eller hangaren i full størrelse (Pakke 91): et trykk på stedets
 * overskrift i Samling åpner en side med tilbake, der hver plass er dobbelt så stor.
 * Hvilket sted som er åpent, er en liten delt tilstand, som klubbens sider.
 */

import { useSyncExternalStore } from 'react'
import type { LagerId } from '../engine/types'

const lyttere = new Set<() => void>()
let naa: LagerId | null = null

export function aapneLager(lager: LagerId | null): void {
  if (naa === lager) return
  naa = lager
  for (const l of lyttere) l()
}

export function aapentLager(): LagerId | null {
  return naa
}

export function useLagerside(): LagerId | null {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    aapentLager,
    () => null,
  )
}
