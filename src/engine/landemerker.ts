/**
 * Landemerker: unike bygg som finnes bare én av. De gir mye status og litt
 * leie. Rivalene kjøper dem også — når en rival er rik nok, kan den slå til
 * en hvilken som helst dag. Da må du by over for å få det tilbake.
 *
 * Verdien følger eiendomsindeksen. Rivalenes kjøp trekkes fra dagen og
 * navnene, ikke fra terningen, så de endrer ikke resten av spillet.
 */

import { dagnummer } from './kalender'
import { hashTekst, tilfeldig } from './rng'
import type { LandemerkeId, NorskBy, Overskrift, Spilltilstand } from './types'
import { eiendomskurs } from './regioner'

export interface Landemerke {
  id: LandemerkeId
  navn: string
  sted: string
  /** Byen på kartet, som også gir regionens priser. */
  by: NorskBy
  pris: number
  /** Statuspoeng så lenge du eier det. */
  status: number
  /** Leie per time, som andel av verdien. */
  avkastning: number
}

export const LANDEMERKER: Record<LandemerkeId, Landemerke> = {
  fyret: { id: 'fyret', navn: 'Fyret på Ytterskjær', sted: 'Ytterskjær, Vestlandet', by: 'Bergen', pris: 800_000_000, status: 25, avkastning: 0.07 },
  hoppbakken: { id: 'hoppbakken', navn: 'Kollen hoppbakke', sted: 'Holmenkollen, Oslo', by: 'Oslo', pris: 2_500_000_000, status: 40, avkastning: 0.06 },
  borgen: { id: 'borgen', navn: 'Steinvik borg', sted: 'Steinvik, Trøndelag', by: 'Trondheim', pris: 6_000_000_000, status: 60, avkastning: 0.05 },
  tarnet: { id: 'tarnet', navn: 'Oslotårnet', sted: 'Bjørvika, Oslo', by: 'Oslo', pris: 15_000_000_000, status: 100, avkastning: 0.04 },
}

export const LANDEMERKELISTE = Object.keys(LANDEMERKER) as LandemerkeId[]

/** En rival kan kjøpe et landemerke når formuen er så mange ganger prisen … */
export const RIVAL_KJOPER_VED = 6
/** … og gjør det med denne sjansen hver dag. */
const RIVAL_SJANSE = 0.12
/** Å kjøpe fra en rival koster verdien ganget med dette. */
export const TILBAKEKJOP_PREMIE = 1.5
export const LANDEMERKE_HONORAR = 0.03

export function landemerkepris(s: Spilltilstand, id: LandemerkeId): number {
  return LANDEMERKER[id].pris * eiendomskurs(s, LANDEMERKER[id].by)
}

export const eierDu = (s: Spilltilstand, id: LandemerkeId) => s.landemerker?.[id]?.eier === 'deg'

export function mineLandemerker(s: Spilltilstand): LandemerkeId[] {
  return LANDEMERKELISTE.filter((id) => eierDu(s, id))
}

export function landemerkeverdi(s: Spilltilstand): number {
  return mineLandemerker(s).reduce((sum, id) => sum + landemerkepris(s, id), 0)
}

export function landemerkeKostpris(s: Spilltilstand): number {
  return mineLandemerker(s).reduce((sum, id) => sum + (s.landemerker[id]?.kostpris ?? 0), 0)
}

export function landemerkeleiePerSek(s: Spilltilstand): number {
  return mineLandemerker(s).reduce((sum, id) => sum + (landemerkepris(s, id) * LANDEMERKER[id].avkastning) / 3600, 0)
}

export function landemerkestatus(s: Spilltilstand): number {
  // Uten mellomliste: statusen regnes flere ganger i sekundet.
  let sum = 0
  for (const id of LANDEMERKELISTE) if (eierDu(s, id)) sum += LANDEMERKER[id].status
  return sum
}

/** Prisen akkurat nå: verdien når det er til salgs, med premie når en rival eier det. */
export function kjopsprisLandemerke(s: Spilltilstand, id: LandemerkeId): number {
  const e = s.landemerker?.[id]
  return landemerkepris(s, id) * (e && e.eier !== 'deg' ? TILBAKEKJOP_PREMIE : 1)
}

/** Rivalene som er rike nok til å kjøpe et landemerke. */
export function rivalerSomKan(s: Spilltilstand, id: LandemerkeId) {
  return (s.rivaler ?? []).filter((r) => !r.overtatt && r.formue >= LANDEMERKER[id].pris * RIVAL_KJOPER_VED)
}

/** Ved dagsskiftet kan en rik rival kjøpe et landemerke som er til salgs. Muterer. */
export function landemerkerVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.landemerker) return []
  const saker: Overskrift[] = []
  const dag = dagnummer(s.sek)
  for (const id of LANDEMERKELISTE) {
    if (s.landemerker[id]) continue
    for (const r of rivalerSomKan(s, id)) {
      if (tilfeldig(hashTekst(`${id}:${r.id}:${dag}`)) >= RIVAL_SJANSE) continue
      s.landemerker[id] = { eier: r.id, kostpris: landemerkepris(s, id) }
      saker.push({ type: 'marked', tittel: `${r.navn} kjøper ${LANDEMERKER[id].navn}`, tekst: 'Et av landets mest kjente bygg har fått ny eier. Andre interesserte må by høyt for å få det.' })
      break
    }
  }
  return saker
}
