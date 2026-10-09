/**
 * Hvilke hendelser du har sett (Pakke 61): tidspunktet (`sek`) for den nyeste
 * hendelsen da du sist åpnet loggen. Det som er nyere, gir en prikk på
 * bjella i toppfeltet og et «Ny»-merke i loggen. Huskes i nettleseren, ikke i
 * lagringen — det er skjermpynt.
 */

import { useSyncExternalStore } from 'react'
import type { Spilltilstand } from '../engine/types'

const NOKKEL = 'milliardaer.hendelserSett'
const lyttere = new Set<() => void>()

function les(): number {
  try {
    const v = Number(localStorage.getItem(NOKKEL))
    return Number.isFinite(v) && v > 0 ? v : -1
  } catch {
    return -1
  }
}

let sett = les()

/**
 * Hendelser etter dette tidspunktet er usette. Er det merket lenger fram enn
 * spillet har kommet, hører det til et annet spill (start på nytt, import),
 * og da er alt usett.
 */
export function settGrense(s: Spilltilstand): number {
  return sett > s.sek ? -1 : sett
}

export function antallUsette(s: Spilltilstand, grense = settGrense(s)): number {
  let n = 0
  for (let i = s.hendelser.length - 1; i >= 0 && s.hendelser[i].sek > grense; i--) n++
  return n
}

export function merkHendelserSett(sek: number): void {
  if (sek === sett) return
  sett = sek
  try {
    localStorage.setItem(NOKKEL, String(sek))
  } catch {
    // Da huskes det bare til siden lastes på nytt.
  }
  for (const l of lyttere) l()
}

/** Gir en ny tegning når loggen er lest. Tallet selv hentes med `antallUsette`. */
export function useHendelserSett(): number {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => {
        lyttere.delete(l)
      }
    },
    () => sett,
    () => sett,
  )
}
