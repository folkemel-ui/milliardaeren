/**
 * Hvilken del av Profil som er åpen: Meg, Regnskap eller Innstillinger.
 * Huskes i nettleseren, og kan settes utenfra — skattemerket i toppfeltet
 * åpner Regnskap — så den er en liten delt tilstand, ikke bare en useState.
 */

import { useSyncExternalStore } from 'react'

export type Profildel = 'meg' | 'regnskap' | 'innstillinger'

export const PROFILDELER: { id: Profildel; navn: string }[] = [
  { id: 'meg', navn: 'Meg' },
  { id: 'regnskap', navn: 'Regnskap' },
  { id: 'innstillinger', navn: 'Innstillinger' },
]

const NOKKEL = 'milliardaer.profilfane'
const lyttere = new Set<() => void>()

function les(): Profildel {
  try {
    const v = localStorage.getItem(NOKKEL)
    return v === 'regnskap' || v === 'innstillinger' ? v : 'meg'
  } catch {
    return 'meg'
  }
}

let naa: Profildel = les()

export function settProfildel(del: Profildel): void {
  naa = del
  try {
    localStorage.setItem(NOKKEL, del)
  } catch {
    // Uten lagring huskes valget bare til siden lastes på nytt.
  }
  for (const l of lyttere) l()
}

export function useProfildel(): Profildel {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => lyttere.delete(l)
    },
    () => naa,
  )
}
