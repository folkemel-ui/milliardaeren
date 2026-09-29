/**
 * «NY»-merket på kort for ting du nettopp har kjøpt. Merket står til du
 * trykker på kortet. Skjermpynt, ikke spill: det huskes i localStorage,
 * ikke i lagringen, så en ny enhet bare starter uten merker.
 *
 * Kortene merker seg selv med data-ny="<id>"; ett trykk hvor som helst
 * inni kortet fjerner merket.
 */

import { useSyncExternalStore } from 'react'

const NOKKEL = 'milliardaer.nye'
/** Flere enn dette blir aldri stående — de eldste faller ut. */
const MAKS = 20

function les(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(NOKKEL) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

let nye: string[] = les()
const lyttere = new Set<() => void>()

function sett(ny: string[]): void {
  nye = ny
  try {
    localStorage.setItem(NOKKEL, JSON.stringify(nye))
  } catch {
    /* bare en bekvemmelighet */
  }
  for (const l of lyttere) l()
}

function abonner(fn: () => void): () => void {
  lyttere.add(fn)
  return () => {
    lyttere.delete(fn)
  }
}

export function merkNy(id: string): void {
  if (nye.includes(id)) return
  sett([...nye, id].slice(-MAKS))
}

export function fjernNy(id: string): void {
  if (nye.includes(id)) sett(nye.filter((x) => x !== id))
}

export function useNy(id: string): boolean {
  return useSyncExternalStore(abonner, () => nye.includes(id))
}

/** Lytter etter trykk på merkede kort. Kalles én gang fra appen; gir tilbake en opprydding. */
export function lyttEtterNyTrykk(): () => void {
  const vedTrykk = (e: Event) => {
    const kort = (e.target as Element | null)?.closest?.('[data-ny]')
    const id = kort?.getAttribute('data-ny')
    if (id) fjernNy(id)
  }
  document.addEventListener('click', vedTrykk, true)
  return () => document.removeEventListener('click', vedTrykk, true)
}
