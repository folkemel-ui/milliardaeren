/**
 * Porteføljen: alt du har investert utenfor bedriftene — aksjer, krypto,
 * eiendom, rivalselskaper, startups og sparekontoen — med verdi, avkastning og dagens endring.
 *
 * «I dag» er verdien nå minus verdien ved dagens start, minus pengene du har
 * flyttet inn i dag (kjøp og innskudd) og pluss det du har tatt ut (salg og
 * uttak). Da teller bare det markedet (eller renten) har gjort — ikke at du
 * har kjøpt mer.
 */

import { eiendomspris, EIENDOMSSTIGEN, eiendomsverdi } from './eiendom'
import { papirverdi } from './formler'
import type { Aktivaklasse, Beholdning, PapirId, Spilltilstand } from './types'
import { obligasjonKostpris, obligasjonsverdi } from './obligasjoner'
import { PAPIRER } from './marked'
import { rivalverdi } from './rivaler'
import { startupKostpris, startupverdi } from './startups'
import { jordKostpris } from './jord'
import { landemerkeKostpris } from './landemerker'
import { fondKostpris, fondverdi } from './fond'

export type { Aktivaklasse }

export const KLASSER: Aktivaklasse[] = ['aksje', 'krypto', 'fond', 'obligasjon', 'eiendom', 'rival', 'startup', 'sparing']

export interface Postering {
  klasse: Aktivaklasse
  verdi: number
  /** Det du har betalt (eller satt inn) for det du eier nå. */
  kostpris: number
  /** Endring siden dagens start som ikke skyldes kjøp, salg, innskudd eller uttak. */
  iDag: number
}

export function nullPerKlasse(): Record<Aktivaklasse, number> {
  return { aksje: 0, krypto: 0, fond: 0, obligasjon: 0, eiendom: 0, rival: 0, startup: 0, sparing: 0 }
}

export function klasseverdier(s: Spilltilstand): Record<Aktivaklasse, number> {
  return {
    aksje: papirverdi(s, 'aksje'),
    krypto: papirverdi(s, 'krypto'),
    fond: fondverdi(s),
    obligasjon: obligasjonsverdi(s),
    eiendom: eiendomsverdi(s),
    rival: rivalverdi(s),
    startup: startupverdi(s),
    sparing: s.sparing,
  }
}

/** Bokfører penger inn i (+) eller ut av (−) en klasse. Muterer — brukes på kopier. */
export function flyt(s: Spilltilstand, klasse: Aktivaklasse, belop: number): void {
  s.dagensFlyt[klasse] = (s.dagensFlyt[klasse] ?? 0) + belop
}

/**
 * Kostprisen for sparekontoen: det du har satt inn og ikke tatt ut (Pakke 58).
 * Før var den saldoen minus all rente noensinne, så et nytt innskudd etter et
 * uttak viste renten fra før som avkastning. Gamle lagringer bruker den regelen
 * til første innskudd eller uttak.
 */
export function sparingKostpris(s: Spilltilstand): number {
  return s.sparingKostpris ?? Math.max(0, s.sparing - s.totaltSparerente)
}

/** Setter inn på sparekontoen; kostprisen øker like mye. Muterer. */
export function settInnSparing(s: Spilltilstand, belop: number): void {
  s.sparingKostpris = sparingKostpris(s) + belop
  s.sparing += belop
}

/**
 * Tar fra sparekontoen. Kostprisen krymper i takt med saldoen, så det som står
 * igjen har den samme avkastningen som før. Muterer.
 */
export function trekkFraSparing(s: Spilltilstand, belop: number): void {
  if (!(belop > 0)) return
  const igjen = s.sparing - belop
  s.sparingKostpris = s.sparing > 0 && igjen > 0 ? sparingKostpris(s) * (igjen / s.sparing) : 0
  s.sparing = igjen
}

function kostpris(s: Spilltilstand, klasse: Aktivaklasse): number {
  if (klasse === 'sparing') return sparingKostpris(s)
  if (klasse === 'startup') return startupKostpris(s)
  if (klasse === 'fond') return fondKostpris(s)
  if (klasse === 'obligasjon') return obligasjonKostpris(s)
  if (klasse === 'rival') return (s.rivaler ?? []).reduce((sum, r) => sum + r.kostpris, 0)
  if (klasse === 'eiendom') {
    let sum = 0
    for (const id of EIENDOMSSTIGEN) {
      const antall = s.eiendommer[id] ?? 0
      if (antall) sum += s.eiendomKostpris[id] ?? antall * eiendomspris(s, id)
    }
    return sum + jordKostpris(s) + landemerkeKostpris(s)
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
