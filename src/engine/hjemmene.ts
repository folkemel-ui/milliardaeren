/**
 * Pakke 60 — hjemmene. Tre steder du bor, som åpner seg etter hvert som
 * formuen vokser: hjemmet i Oslo, hytta på Geilo og feriehuset i Marbella.
 * Husene får du; det du kjøper, er innredningen — tre rom i hvert, hvert i tre
 * trinn som tas i rekkefølge.
 *
 * Hvert trinn gir status, priset omtrent som luksus (kroner per statuspoeng
 * stiger med hvert hjem, som fra bil til båt til fly), til sammen rundt 200
 * poeng. Halvparten av det du har brukt, teller i formuen; resten er borte. Et
 * rom kan ikke selges for seg, så det kan ikke kjøpes og selges i ring.
 */

import type { RomId, Spilltilstand } from './types'

export type HjemId = 'oslo' | 'hytta' | 'feriehuset'

export interface Hjem {
  id: HjemId
  navn: string
  sted: string
  /** Hjemmet åpner når formuen din en gang har vært så stor. */
  apnerVed: number
  rom: RomId[]
}

export interface Rom {
  id: RomId
  navn: string
  /** Trinnene i rekkefølge: hva det heter, hva det koster og hvor mye status det gir. */
  trinn: { navn: string; pris: number; status: number }[]
}

export const HJEM: Record<HjemId, Hjem> = {
  oslo: { id: 'oslo', navn: 'Hjemmet', sted: 'Frogner, Oslo', apnerVed: 1_000_000, rom: ['kjokken', 'stue', 'vinkjeller'] },
  hytta: { id: 'hytta', navn: 'Hytta', sted: 'Geilo', apnerVed: 50_000_000, rom: ['peisestue', 'badstue', 'boblebad'] },
  feriehuset: { id: 'feriehuset', navn: 'Feriehuset', sted: 'Marbella, Spania', apnerVed: 1_000_000_000, rom: ['terrasse', 'basseng', 'gjestefloy'] },
}

export const HJEMLISTE = Object.keys(HJEM) as HjemId[]

export const ROM: Record<RomId, Rom> = {
  kjokken: {
    id: 'kjokken',
    navn: 'Kjøkken',
    trinn: [
      { navn: 'Nye fronter og benkeplate', pris: 400_000, status: 1 },
      { navn: 'Kjøkkenøy i marmor', pris: 2_000_000, status: 3 },
      { navn: 'Restaurantkjøkken med vinskap', pris: 8_000_000, status: 6 },
    ],
  },
  stue: {
    id: 'stue',
    navn: 'Stue',
    trinn: [
      { navn: 'Designersofa og eikegulv', pris: 600_000, status: 1 },
      { navn: 'Kunstvegg med belysning', pris: 3_000_000, status: 3 },
      { navn: 'Salong med flygel', pris: 12_000_000, status: 7 },
    ],
  },
  vinkjeller: {
    id: 'vinkjeller',
    navn: 'Vinkjeller',
    trinn: [
      { navn: 'Vinrom med 300 flasker', pris: 1_000_000, status: 2 },
      { navn: 'Kjeller med smaksrom', pris: 5_000_000, status: 4 },
      { navn: 'Samling i verdensklasse', pris: 20_000_000, status: 8 },
    ],
  },
  peisestue: {
    id: 'peisestue',
    navn: 'Peisestue',
    trinn: [
      { navn: 'Peis i naturstein', pris: 6_000_000, status: 3 },
      { navn: 'Tømmerstue med panoramavindu', pris: 25_000_000, status: 6 },
      { navn: 'Peisestue med utsikt over vidda', pris: 80_000_000, status: 10 },
    ],
  },
  badstue: {
    id: 'badstue',
    navn: 'Badstue',
    trinn: [
      { navn: 'Vedfyrt badstue', pris: 8_000_000, status: 3 },
      { navn: 'Badstue med kaldkulp', pris: 30_000_000, status: 7 },
      { navn: 'Spa i fjellet', pris: 100_000_000, status: 11 },
    ],
  },
  boblebad: {
    id: 'boblebad',
    navn: 'Boblebad',
    trinn: [
      { navn: 'Stamp på terrassen', pris: 10_000_000, status: 4 },
      { navn: 'Boblebad i snøen', pris: 40_000_000, status: 8 },
      { navn: 'Utendørs varmebasseng', pris: 120_000_000, status: 12 },
    ],
  },
  terrasse: {
    id: 'terrasse',
    navn: 'Terrasse',
    trinn: [
      { navn: 'Takterrasse med pergola', pris: 60_000_000, status: 6 },
      { navn: 'Terrasse med utekjøkken', pris: 250_000_000, status: 10 },
      { navn: 'Hageanlegg med sitrustrær', pris: 800_000_000, status: 16 },
    ],
  },
  basseng: {
    id: 'basseng',
    navn: 'Basseng',
    trinn: [
      { navn: 'Basseng i hagen', pris: 90_000_000, status: 7 },
      { navn: 'Uendelighetsbasseng', pris: 350_000_000, status: 11 },
      { navn: 'Basseng med strandbar', pris: 1_000_000_000, status: 18 },
    ],
  },
  gjestefloy: {
    id: 'gjestefloy',
    navn: 'Gjestefløy',
    trinn: [
      { navn: 'Gjestesuite', pris: 120_000_000, status: 8 },
      { navn: 'Gjestefløy med personale', pris: 500_000_000, status: 12 },
      { navn: 'Gjestehus for statsbesøk', pris: 1_500_000_000, status: 20 },
    ],
  },
}

export const ROMLISTE = Object.keys(ROM) as RomId[]

/** Hvor mye av det du har brukt på innredningen som teller i formuen. */
export const INNREDNING_VERDI = 0.5

/** Hjemmet et rom hører til. */
export function hjemFor(rom: RomId): HjemId {
  return HJEMLISTE.find((h) => HJEM[h].rom.includes(rom))!
}

export function hjemAapent(s: Spilltilstand, id: HjemId): boolean {
  return s.hoyesteFormue >= HJEM[id].apnerVed
}

/** Hvor mange trinn som er kjøpt i et rom (0–3). */
export function romtrinn(s: Spilltilstand, rom: RomId): number {
  return s.hjem?.[rom] ?? 0
}

/** Det neste trinnet i et rom, eller null når rommet er ferdig. */
export function nesteTrinn(s: Spilltilstand, rom: RomId): Rom['trinn'][number] | null {
  return ROM[rom].trinn[romtrinn(s, rom)] ?? null
}

/** Status fra innredningen. Regnes flere ganger i sekundet: uten mellomlister. */
export function hjemstatus(s: Spilltilstand): number {
  const h = s.hjem
  if (!h) return 0
  let sum = 0
  for (const rom of ROMLISTE) {
    const n = h[rom] ?? 0
    for (let i = 0; i < n; i++) sum += ROM[rom].trinn[i].status
  }
  return sum
}

/** Det du har brukt på innredningen. */
export function hjemkostnad(s: Spilltilstand): number {
  const h = s.hjem
  if (!h) return 0
  let sum = 0
  for (const rom of ROMLISTE) {
    const n = h[rom] ?? 0
    for (let i = 0; i < n; i++) sum += ROM[rom].trinn[i].pris
  }
  return sum
}

/** Det innredningen teller i formuen: halvparten av det du har brukt. */
export function hjemverdi(s: Spilltilstand): number {
  return s.hjem ? hjemkostnad(s) * INNREDNING_VERDI : 0
}
