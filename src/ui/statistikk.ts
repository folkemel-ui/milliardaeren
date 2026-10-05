/**
 * Statistikken: hvor inntekten kommer fra, periode for periode. Kildene står
 * i fast rekkefølge med fast farge (--kilde-1 … --kilde-7), så en kilde har
 * samme farge uansett hvor mange som er med.
 */

import type { Oppgjor, Periodestart, Spilltilstand } from '../engine/types'
import { kortDato, ukenummer } from './kalender'
import { dato, MÅNEDER } from '../engine/kalender'

export type KildeId = 'bedrifter' | 'leie' | 'host' | 'utbytte' | 'sparerente' | 'gevinster' | 'klubb'

export const KILDER: { id: KildeId; navn: string; farge: string }[] = [
  { id: 'bedrifter', navn: 'Bedriftene', farge: 'var(--kilde-1)' },
  { id: 'leie', navn: 'Leie', farge: 'var(--kilde-2)' },
  { id: 'host', navn: 'Avlinger og tømmer', farge: 'var(--kilde-3)' },
  { id: 'utbytte', navn: 'Utbytte', farge: 'var(--kilde-4)' },
  { id: 'sparerente', navn: 'Sparerente', farge: 'var(--kilde-5)' },
  { id: 'gevinster', navn: 'Gevinst og tap ved salg', farge: 'var(--kilde-6)' },
  { id: 'klubb', navn: 'Klubben', farge: 'var(--kilde-7)' },
]

/** Inntekten per kilde i et oppgjør. Leie er uten jorda; oppgjør fra før Pakke 39 har jorda i leia. */
export function kildeverdier(o: Pick<Oppgjor, 'bedrifter' | 'leie' | 'utbytte' | 'sparerente' | 'gevinster' | 'klubb' | 'host'>): Record<KildeId, number> {
  const host = o.host ?? 0
  return {
    bedrifter: o.bedrifter,
    leie: o.leie - host,
    host,
    utbytte: o.utbytte,
    sparerente: o.sparerente,
    gevinster: o.gevinster ?? 0,
    klubb: o.klubb ?? 0,
  }
}

/** Perioden som pågår: tellerne nå minus tellerstanden ved periodens start. */
export function paagaende(s: Spilltilstand, start: Periodestart): Record<KildeId, number> {
  const host = start.host === undefined ? 0 : (s.totaltHost ?? 0) - start.host
  return {
    bedrifter: s.totaltTjent - start.tjent,
    leie: s.totaltLeie - start.leie - host,
    host,
    utbytte: s.totaltUtbytte - start.utbytte,
    sparerente: s.totaltSparerente - start.sparerente,
    gevinster: (s.totaltGevinst ?? 0) - (start.gevinst ?? 0),
    klubb: start.klubb === undefined ? 0 : (s.totaltKlubb ?? 0) - start.klubb,
  }
}

export type Statistikkperiode = 'dag' | 'uke' | 'maaned'

export interface Kolonne {
  /** Kort navn under søylen: «5. jan», «uke 7», «jan». */
  navn: string
  /** Langt navn i avlesningen. */
  tittel: string
  verdier: Record<KildeId, number>
  /** Perioden er ikke ferdig ennå. */
  paagaar: boolean
}

function navn(o: Oppgjor): { navn: string; tittel: string } {
  if (o.periode === 'dag') return { navn: kortDato(o.fraDag).slice(4), tittel: kortDato(o.fraDag) }
  if (o.periode === 'uke') return { navn: o.navn, tittel: o.navn[0].toUpperCase() + o.navn.slice(1) }
  return { navn: o.navn.slice(0, 3), tittel: o.navn[0].toUpperCase() + o.navn.slice(1) }
}

/** Søylene for en periode: de ferdige oppgjørene, eldste først, og så perioden som pågår. */
export function kolonner(s: Spilltilstand, periode: Statistikkperiode): Kolonne[] {
  const ferdige = periode === 'dag' ? (s.dagsoppgjor ?? []) : s.oppgjor.filter((o) => o.periode === periode)
  const ut: Kolonne[] = ferdige.map((o) => ({ ...navn(o), verdier: kildeverdier(o), paagaar: false }))
  const start = periode === 'dag' ? s.dagstart : periode === 'uke' ? s.ukestart : s.maanedstart
  if (start) {
    const nå =
      periode === 'dag'
        ? { navn: 'i dag', tittel: 'I dag så langt' }
        : periode === 'uke'
          ? { navn: `uke ${ukenummer(start.dag + 1)}`, tittel: 'Denne uka så langt' }
          : { navn: MÅNEDER[dato(start.dag).maaned].slice(0, 3), tittel: 'Denne måneden så langt' }
    ut.push({ ...nå, verdier: paagaende(s, start), paagaar: true })
  }
  return ut
}

/** Summen per kilde over søylene. */
export function summer(k: Kolonne[]): Record<KildeId, number> {
  const sum = Object.fromEntries(KILDER.map((x) => [x.id, 0])) as Record<KildeId, number>
  for (const kol of k) for (const x of KILDER) sum[x.id] += kol.verdier[x.id]
  return sum
}
