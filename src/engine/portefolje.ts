/**
 * Porteføljen: alt du har investert utenfor bedriftene — aksjer, krypto,
 * eiendom og sparekontoen — med verdi, avkastning og dagens endring.
 *
 * «I dag» er verdien nå minus verdien ved dagens start, minus pengene du har
 * flyttet inn i dag (kjøp og innskudd) og pluss det du har tatt ut (salg og
 * uttak). Da teller bare det markedet (eller renten) har gjort — ikke at du
 * har kjøpt mer.
 */

import { eiendomspris, EIENDOMSSTIGEN, eiendomsverdi } from './eiendom'
import { papirverdi } from './formler'
import type { Aktivaklasse, Beholdning, PapirId, Spilltilstand } from './types'
import { PAPIRER } from './marked'
import { rivalverdi } from './rivaler'

export type { Aktivaklasse }

export const KLASSER: Aktivaklasse[] = ['aksje', 'krypto', 'eiendom', 'rival', 'sparing']

export interface Postering {
  klasse: Aktivaklasse
  verdi: number
  /** Det du har betalt (eller satt inn) for det du eier nå. */
  kostpris: number
  /** Endring siden dagens start som ikke skyldes kjøp, salg, innskudd eller uttak. */
  iDag: number
}

export function nullPerKlasse(): Record<Aktivaklasse, number> {
  return { aksje: 0, krypto: 0, eiendom: 0, rival: 0, sparing: 0 }
}

export function klasseverdier(s: Spilltilstand): Record<Aktivaklasse, number> {
  return {
    aksje: papirverdi(s, 'aksje'),
    krypto: papirverdi(s, 'krypto'),
    eiendom: eiendomsverdi(s),
    rival: rivalverdi(s),
    sparing: s.sparing,
  }
}

/** Bokfører penger inn i (+) eller ut av (−) en klasse. Muterer — brukes på kopier. */
export function flyt(s: Spilltilstand, klasse: Aktivaklasse, belop: number): void {
  s.dagensFlyt[klasse] += belop
}

function kostpris(s: Spilltilstand, klasse: Aktivaklasse): number {
  if (klasse === 'sparing') {
    // Avkastningen på sparekontoen er renten den har gitt — men aldri mer enn
    // saldoen, så et uttak ikke etterlater «avkastning» på en tom konto.
    return Math.max(0, s.sparing - s.totaltSparerente)
  }
  if (klasse === 'rival') return (s.rivaler ?? []).reduce((sum, r) => sum + r.kostpris, 0)
  if (klasse === 'eiendom') {
    let sum = 0
    for (const id of EIENDOMSSTIGEN) {
      const antall = s.eiendommer[id] ?? 0
      if (antall) sum += s.eiendomKostpris[id] ?? antall * eiendomspris(s, id)
    }
    return sum
  }
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, Beholdning][]) {
    if (PAPIRER[id].klasse === klasse) sum += b.kostpris
  }
  return sum
}

export function portefolje(s: Spilltilstand): Postering[] {
  const verdier = klasseverdier(s)
  return KLASSER.map((klasse) => ({
    klasse,
    verdi: verdier[klasse],
    kostpris: kostpris(s, klasse),
    iDag: verdier[klasse] - (s.forrigeDag.verdier[klasse] ?? 0) - (s.dagensFlyt[klasse] ?? 0),
  }))
}

export function sum(poster: Postering[]): Omit<Postering, 'klasse'> {
  return poster.reduce(
    (a, p) => ({ verdi: a.verdi + p.verdi, kostpris: a.kostpris + p.kostpris, iDag: a.iDag + p.iDag }),
    { verdi: 0, kostpris: 0, iDag: 0 },
  )
}
