/**
 * Hva som er nytt i klubben siden du sist så (Pakke 78): ett merke per side.
 * Troppen og marked husker hvilke spillere som var på markedet, Kamper og
 * tabell den siste kampen og Sesongene den siste sesongen — slik de var da du
 * sist åpnet siden. Det som er annerledes nå, får «Ny», og raden på navet en
 * prikk. Huskes i nettleseren, ikke i lagringen, som hendelsesloggen.
 */

import { useSyncExternalStore } from 'react'
import type { Kamp, Klubb } from '../engine/types'

export type Klubbmerker = {
  /** Spillerne på markedet. */
  marked: number[]
  /** Den siste kampen, som `sesong-turnering-runde`. */
  kamp: string
  /** Den siste ferdige sesongen. */
  sesong: number
}

const NOKKEL = 'milliardaer.klubbSett'
const lyttere = new Set<() => void>()

export const kampnokkel = (m: Kamp) => `${m.sesong}-${m.turnering ?? 'serie'}-${m.runde}`

/** Hvordan klubben ser ut nå, med de samme feltene som merkene. */
export function naa(k: Klubb): Klubbmerker {
  const siste = k.kamper[k.kamper.length - 1]
  return {
    marked: k.marked.map((p) => p.id),
    kamp: siste ? kampnokkel(siste) : '',
    sesong: k.sesonger?.[k.sesonger.length - 1]?.sesong ?? 0,
  }
}

function les(): Partial<Record<string, Klubbmerker>> {
  try {
    const v = JSON.parse(localStorage.getItem(NOKKEL) ?? '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** Merkene per klubbnavn, så en annen klubb (eller et nytt spill) ikke arver dem. */
let merker = les()

function skriv(): void {
  try {
    localStorage.setItem(NOKKEL, JSON.stringify(merker))
  } catch {
    // Da huskes det bare til siden lastes på nytt.
  }
  for (const l of lyttere) l()
}

/**
 * Merkene for klubben. Har du aldri sett den før, er det du ser nå utgangspunktet:
 * en ny klubb skal ikke starte med «Ny» på alt.
 */
export function klubbmerker(k: Klubb): Klubbmerker {
  return merker[k.navn] ?? naa(k)
}

/** Første gang klubben vises: lagre utgangspunktet. */
export function startMerker(k: Klubb): void {
  if (merker[k.navn]) return
  merker = { ...merker, [k.navn]: naa(k) }
  skriv()
}

/** Du har sett en side: dens del av merkene blir slik klubben er nå. */
export function merkSett(k: Klubb, felt: keyof Klubbmerker): void {
  const forrige = klubbmerker(k)
  const ny = naa(k)
  if (JSON.stringify(forrige[felt]) === JSON.stringify(ny[felt])) return
  merker = { ...merker, [k.navn]: { ...forrige, [felt]: ny[felt] } }
  skriv()
}

/** Hva som er nytt nå mot merkene. */
export function nytt(k: Klubb, m = klubbmerker(k)): { marked: number; kamp: boolean; sesong: boolean } {
  const n = naa(k)
  return {
    marked: n.marked.filter((id) => !m.marked.includes(id)).length,
    kamp: n.kamp !== '' && n.kamp !== m.kamp,
    sesong: n.sesong > m.sesong,
  }
}

/** Gir en ny tegning når et merke endres. */
export function useKlubbmerker(): unknown {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => {
        lyttere.delete(l)
      }
    },
    () => merker,
    () => merker,
  )
}

/** Til testene. */
export function glemKlubbmerker(): void {
  merker = {}
  try {
    localStorage.removeItem(NOKKEL)
  } catch {
    // Se over.
  }
}
