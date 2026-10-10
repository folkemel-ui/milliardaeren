/**
 * Rommene i hjemmene som ett tall (Grafikkpakke G16). Hjemtegningene tar de tre
 * rommenes trinn (0–3 hvert) som ett tall 0–63, så en memo-tegning ikke får en
 * ny liste hvert sekund (Pakke 64). Rent regnestykke, uten React.
 */

import { HJEM, ROM, romtrinn, type HjemId } from '../engine/hjemmene'
import type { RomId, Spilltilstand } from '../engine/types'

export function romkode(a: number, b: number, c: number): number {
  return (a & 3) | ((b & 3) << 2) | ((c & 3) << 4)
}

export function romFraKode(kode: number): readonly [number, number, number] {
  return [kode & 3, (kode >> 2) & 3, (kode >> 4) & 3]
}

/** Koden for et hjem slik det er innredet nå: kjøkken, stue og vinkjeller i Hjemmet, og så videre. */
export function romkodeFor(s: Spilltilstand, id: HjemId): number {
  const [a, b, c] = HJEM[id].rom.map((r) => romtrinn(s, r))
  return romkode(a, b, c)
}

/** Hva et hjem har kostet å innrede, hva det gir i status, og hvor mange trinn av de ni som er tatt. */
export function hjemTall(s: Spilltilstand, id: HjemId): { brukt: number; status: number; trinn: number; alle: number } {
  let brukt = 0
  let status = 0
  let trinn = 0
  let alle = 0
  for (const rom of HJEM[id].rom as RomId[]) {
    const n = romtrinn(s, rom)
    alle += ROM[rom].trinn.length
    for (let i = 0; i < n; i++) {
      brukt += ROM[rom].trinn[i].pris
      status += ROM[rom].trinn[i].status
      trinn++
    }
  }
  return { brukt, status, trinn, alle }
}
