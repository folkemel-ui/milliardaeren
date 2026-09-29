/**
 * Hendelsesstrømmen: sammenligner forrige og ny spilltilstand og finner det
 * som er nytt — hendelser (trofeer og opprykk er også hendelser),
 * prestasjoner og avisutgaver. Ren
 * funksjon, så den kan testes uten nettleser. Appen gjør funnene om til
 * varsler.
 */

import { EIENDOMSTYPER, LUKSUS } from '../engine/eiendom'
import { BEDRIFTSTYPER } from '../engine/innhold'
import { PRESTASJONER } from '../engine/prestasjoner'
import type { EiendomId, Hendelse, Spilltilstand } from '../engine/types'

/** Et kjøp som fortjener et øyeblikk: første bedrift av en type, første eiendom av en type, eller en luksusting. */
export type Kjopsart = 'bedrift' | 'eiendom' | 'luksus'

export type Nytt =
  | { type: 'hendelse'; hendelse: Hendelse }
  | { type: 'prestasjon'; id: string; navn: string; emoji: string }
  | { type: 'avis'; dag: number }
  | { type: 'kjop'; art: Kjopsart; id: string; navn: string }

/** Hvor stor feiringen er: et lite drys, gullblink og konfetti, eller milliarden. */
export type Feiringsniva = 'liten' | 'stor' | 'milliard'

export interface Feiringsdata {
  tekst: string
  niva: Feiringsniva
}

/**
 * Formuemilepælene som feires. Millionen er den store; nullene mellom får et
 * lite drys, og milliarden — målet — får sin egen.
 */
export const FEIRES: Record<string, Feiringsdata> = {
  'fem-sifre': { tekst: 'kr 10 000', niva: 'liten' },
  sekssifret: { tekst: 'kr 100 000', niva: 'liten' },
  millionaer: { tekst: 'MILLIONÆR!', niva: 'stor' },
  'ti-mill': { tekst: 'kr 10 mill', niva: 'liten' },
  'hundre-mill': { tekst: 'kr 100 mill', niva: 'liten' },
  milliardaer: { tekst: 'MILLIARDÆR!', niva: 'milliard' },
}

const RANG: Record<Feiringsniva, number> = { liten: 0, stor: 1, milliard: 2 }

/** Kommer flere milepæler på en gang (etter tid borte), feires bare den største. */
export function stoersteFeiring(funn: Nytt[]): Feiringsdata | null {
  let beste: Feiringsdata | null = null
  for (const f of funn) {
    const d = f.type === 'prestasjon' ? FEIRES[f.id] : undefined
    if (d && (!beste || RANG[d.niva] >= RANG[beste.niva])) beste = d
  }
  return beste
}

const nokkel = (h: Hendelse) => `${h.sek}|${h.tittel}|${h.tekst}`

export function nytt(før: Spilltilstand, etter: Spilltilstand): Nytt[] {
  const funn: Nytt[] = []
  const kjente = new Set((før.hendelser ?? []).map(nokkel))
  for (const h of etter.hendelser ?? []) {
    if (!kjente.has(nokkel(h))) funn.push({ type: 'hendelse', hendelse: h })
  }
  for (const p of PRESTASJONER) {
    if (etter.prestasjoner[p.id] !== undefined && før.prestasjoner[p.id] === undefined) {
      funn.push({ type: 'prestasjon', id: p.id, navn: p.navn, emoji: p.emoji })
    }
  }
  const hadde = new Set(før.bedrifter.map((b) => b.type))
  for (const b of etter.bedrifter) {
    if (!hadde.has(b.type)) {
      hadde.add(b.type)
      funn.push({ type: 'kjop', art: 'bedrift', id: b.type, navn: BEDRIFTSTYPER[b.type].navn })
    }
  }
  for (const id of Object.keys(etter.eiendommer) as EiendomId[]) {
    if ((etter.eiendommer[id] ?? 0) > 0 && (før.eiendommer[id] ?? 0) === 0) {
      funn.push({ type: 'kjop', art: 'eiendom', id, navn: EIENDOMSTYPER[id].navn })
    }
  }
  for (const id of etter.luksus) {
    if (!før.luksus.includes(id)) funn.push({ type: 'kjop', art: 'luksus', id, navn: LUKSUS[id].navn })
  }
  const forrigeUtgave = før.avis.at(-1)?.dag ?? -1
  const nyUtgave = etter.avis.at(-1)?.dag ?? -1
  if (nyUtgave > forrigeUtgave) funn.push({ type: 'avis', dag: nyUtgave })
  return funn
}

/** Flere funn enn dette på én gang (typisk etter tid borte) blir til ett oppsummeringsvarsel. */
export const MAKS_ENKELTVARSLER = 4
