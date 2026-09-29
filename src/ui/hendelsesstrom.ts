/**
 * Hendelsesstrømmen: sammenligner forrige og ny spilltilstand og finner det
 * som er nytt — hendelser (trofeer og opprykk er også hendelser),
 * prestasjoner og avisutgaver. Ren
 * funksjon, så den kan testes uten nettleser. Appen gjør funnene om til
 * varsler.
 */

import { PRESTASJONER } from '../engine/prestasjoner'
import type { Hendelse, Spilltilstand } from '../engine/types'

export type Nytt =
  | { type: 'hendelse'; hendelse: Hendelse }
  | { type: 'prestasjon'; id: string; navn: string; emoji: string }
  | { type: 'avis'; dag: number }

/** Prestasjonene som fortjener gullblink og konfetti. */
export const FEIRES: Record<string, string> = {
  millionaer: 'MILLIONÆR!',
  milliardaer: 'MILLIARDÆR!',
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
  const forrigeUtgave = før.avis.at(-1)?.dag ?? -1
  const nyUtgave = etter.avis.at(-1)?.dag ?? -1
  if (nyUtgave > forrigeUtgave) funn.push({ type: 'avis', dag: nyUtgave })
  return funn
}

/** Flere funn enn dette på én gang (typisk etter tid borte) blir til ett oppsummeringsvarsel. */
export const MAKS_ENKELTVARSLER = 4
