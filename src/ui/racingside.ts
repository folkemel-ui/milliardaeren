/**
 * Racingteamets side (Pakke 90). Luksus har alt fire deler — så mange en fane kan ha
 * (`deler.ts`) — så teamet får en side med tilbake, åpnet fra en rad i Samling, som
 * klubbens sider (`klubbsider.ts`). Om siden er åpen, er en liten delt tilstand.
 */

import { useSyncExternalStore } from 'react'

const lyttere = new Set<() => void>()
let aapen = false

export function aapneRacing(vis: boolean): void {
  if (aapen === vis) return
  aapen = vis
  for (const l of lyttere) l()
}

export function racingAapen(): boolean {
  return aapen
}

export function useRacingside(): boolean {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    racingAapen,
    () => false,
  )
}
