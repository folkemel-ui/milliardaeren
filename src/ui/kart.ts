/**
 * Det kartene viser om hver by: leie og prisutvikling, og symbolene for
 * landemerkene i gatebildet. Delt mellom Norgeskartet og verdenskartet.
 */

import { useRef, type TouchEvent } from 'react'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, leieHverPerSek } from '../engine/eiendom'
import { LANDEMERKER } from '../engine/landemerker'
import { regionEndring, regionFor } from '../engine/regioner'
import type { By, Spilltilstand } from '../engine/types'
import { tall } from './format'

/** Leie per sekund fra byggene i en by som er leid ut — ikke de som pusses opp. */
export function leieIBy(s: Spilltilstand, by: By): number {
  let sum = 0
  for (const id of EIENDOMSSTIGEN) {
    if (EIENDOMSTYPER[id].by !== by || s.oppussing[id]) continue
    sum += (s.eiendommer[id] ?? 0) * leieHverPerSek(s, id)
  }
  return sum
}

/** Leie i kort form for kartet, der plassen er trang: «+kr 904/s», «+kr 187k/s», «+kr 2,2 mill/s». */
export function kartLeie(n: number): string {
  if (n >= 1e6) return `+kr ${tall(n / 1e6, 1)} mill/s`
  if (n >= 1e4) return `+kr ${tall(n / 1e3)}k/s`
  return `+kr ${tall(n)}/s`
}

/** Prisendringen for byens region (eller landet) de siste to timene. */
export function trendFor(s: Spilltilstand, by: By): number {
  return regionEndring(s, regionFor(by))
}

/** Rammen rundt byen: farge etter retning, sterkere jo større endringen er. Under en halv prosent: ingen. */
export function trendRing(endring: number): { klasse: string; styrke: number } | null {
  if (Math.abs(endring) < 0.005) return null
  return { klasse: endring > 0 ? 'opp' : 'ned', styrke: Math.min(1, 0.35 + Math.abs(endring) / 0.04) }
}

export const LANDEMERKESYMBOL: Record<keyof typeof LANDEMERKER, string> = {
  fyret: '🔦',
  hoppbakken: '⛷️',
  borgen: '🏰',
  tarnet: '🗼',
}

/**
 * Langt trykk på en by: `langt(by)` etter et halvt sekund. `hendelser(by)` gir
 * det som skal på byens element; `varLangt()` sier om trykket som endte i et
 * klikk var et langt trykk — da skal klikket ikke også telle.
 */
export function useLangtrykk(langt: (by: By) => void) {
  const tid = useRef<number | null>(null)
  const utløst = useRef(false)
  const avbryt = () => {
    if (tid.current !== null) clearTimeout(tid.current)
    tid.current = null
  }
  return {
    hendelser: (by: By) => ({
      onPointerDown: () => {
        utløst.current = false
        avbryt()
        tid.current = window.setTimeout(() => {
          utløst.current = true
          langt(by)
        }, 500)
      },
      onPointerUp: avbryt,
      onPointerLeave: avbryt,
      onPointerCancel: avbryt,
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    }),
    varLangt: () => utløst.current,
  }
}

/** To fingre som glir fra hverandre over kartet: `zoom` får punktet midt mellom dem, i skjermkoordinater. */
export function useKlyp(zoom: (x: number, y: number) => void) {
  const start = useRef<number | null>(null)
  const avstand = (t: TouchEvent['touches']) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  return {
    onTouchStart: (e: TouchEvent) => {
      start.current = e.touches.length === 2 ? avstand(e.touches) : null
    },
    onTouchMove: (e: TouchEvent) => {
      if (start.current === null || e.touches.length !== 2) return
      if (avstand(e.touches) - start.current > 40) {
        start.current = null
        zoom((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2)
      }
    },
    onTouchEnd: () => {
      start.current = null
    },
  }
}
