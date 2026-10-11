/**
 * Velkomstskjermen: hva som skjedde mens du var borte. Lageret tar vare på
 * tilstanden rett før og rett etter at tiden borte ble regnet ut, og denne
 * rene funksjonen gjør forskjellen om til noe å vise. Ingenting lagres.
 */

import { nettoformue } from '../engine/formler'
import { BORTE_TAK_SEK } from '../engine/innhold'
import { AKSJER, PAPIRER } from '../engine/marked'
import { PRESTASJONER } from '../engine/prestasjoner'
import type { Kamp, Rapport, Spilltilstand } from '../engine/types'
import { dagnummer } from '../engine/kalender'

/** Kortere fravær enn dette gir ingen velkomst — da holder varslene. */
export const VELKOMST_ETTER_SEK = 5 * 60

export interface Oppsummering {
  borteSek: number
  /** Tiden som faktisk ble regnet: høyst BORTE_TAK_SEK. */
  telteSek: number
  bedrifter: number
  leie: number
  utbytte: number
  renter: number
  formueFor: number
  formueEtter: number
  nyeAviser: number
  kamper: Kamp[]
  rapporter: { navn: string; utfall: Rapport['utfall'] }[]
  prestasjoner: { navn: string }[]
  hendelser: number
}

export function oppsummer(før: Spilltilstand, etter: Spilltilstand, borteSek: number): Oppsummering {
  const sisteUtgave = før.avis.at(-1)?.dag ?? -1
  // Pakke 86: en kamp som var i gang da du gikk, er ny når du kommer tilbake; en som spilles nå, venter.
  const kjenteKamper = new Set((før.klubb?.kamper ?? []).filter((k) => k.dag !== dagnummer(før.sek)).map((k) => `${k.sesong}:${k.runde}`))
  const kjenteHendelser = new Set(før.hendelser.map((h) => `${h.sek}|${h.tittel}|${h.tekst}`))
  return {
    borteSek,
    telteSek: Math.min(borteSek, BORTE_TAK_SEK),
    bedrifter: etter.totaltTjent - før.totaltTjent,
    leie: etter.totaltLeie - før.totaltLeie,
    utbytte: etter.totaltUtbytte - før.totaltUtbytte,
    renter: etter.totaltRentebetalt - før.totaltRentebetalt,
    formueFor: nettoformue(før),
    formueEtter: nettoformue(etter),
    nyeAviser: etter.avis.filter((u) => u.dag > sisteUtgave).length,
    kamper: (etter.klubb?.kamper ?? []).filter((k) => !kjenteKamper.has(`${k.sesong}:${k.runde}`) && k.dag !== dagnummer(etter.sek)),
    rapporter: AKSJER.flatMap((id) => {
      const r = etter.kvartal?.[id]?.siste
      return r && r.dag !== før.kvartal?.[id]?.siste?.dag ? [{ navn: PAPIRER[id].navn, utfall: r.utfall }] : []
    }),
    prestasjoner: PRESTASJONER.filter((p) => etter.prestasjoner[p.id] !== undefined && før.prestasjoner[p.id] === undefined).map((p) => ({ navn: p.navn })),
    hendelser: etter.hendelser.filter((h) => !kjenteHendelser.has(`${h.sek}|${h.tittel}|${h.tekst}`)).length,
  }
}
