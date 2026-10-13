/**
 * Velkomstskjermen: hva som skjedde mens du var borte. Lageret tar vare på
 * tilstanden rett før og rett etter at tiden borte ble regnet ut, og denne
 * rene funksjonen gjør forskjellen om til noe å vise. Ingenting lagres.
 */

import { nettoformue } from '../engine/formler'
import { BORTE_TAK_SEK } from '../engine/innhold'
import { AKSJER, PAPIRER } from '../engine/marked'
import { PRESTASJONER } from '../engine/prestasjoner'
import type { Kamp, Rapport, Spilltilstand, Turnering, UnikId } from '../engine/types'
import { dagnummer } from '../engine/kalender'
import { UNIKE } from '../engine/unike'

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
  /** Kampene per turnering, i fast rekkefølge (Pakke 98): serien først. */
  turneringer: { turnering: Turnering | 'serie'; antall: number }[]
  /** Løpene racingteamet kjørte (Pakke 98), eller null uten løp. */
  racing: { lop: number; seire: number; poeng: number } | null
  /** Unike ting som gikk til en rival på auksjon mens du var borte (Pakke 98). */
  tapteAuksjoner: { navn: string; rival: string; pris: number }[]
  rapporter: { navn: string; utfall: Rapport['utfall'] }[]
  prestasjoner: { navn: string }[]
  hendelser: number
}

/**
 * En kamp kjennes på turneringen, sesongen og runden (Pakke 98). Før var det bare sesong og runde,
 * så en cupkamp i runde 2 gjemte seg bak seriekampen i runde 2.
 */
export const kampnokkel = (k: Kamp) => `${k.turnering ?? 'serie'}:${k.sesong}:${k.runde}`

const TURNERINGSORDEN: (Turnering | 'serie')[] = ['serie', 'cup', 'europa', 'kvalik', 'supercup']
/** Som på klubbsiden, med serien i tillegg. */
export const TURNERINGSNAVN: Record<Turnering | 'serie', string> = { serie: 'Serien', cup: 'Cupen', europa: 'Europa', kvalik: 'Kvalik', supercup: 'Supercupen' }

/** Seier også når kampen ble vunnet på straffer. */
export const vunnet = (k: Kamp) => k.maalFor > k.maalMot || (k.maalFor === k.maalMot && k.straffer === 'deg')
export const tapt = (k: Kamp) => k.maalFor < k.maalMot || (k.maalFor === k.maalMot && k.straffer === 'dem')

export function oppsummer(før: Spilltilstand, etter: Spilltilstand, borteSek: number): Oppsummering {
  const sisteUtgave = før.avis.at(-1)?.dag ?? -1
  // Pakke 86: en kamp som var i gang da du gikk, er ny når du kommer tilbake; en som spilles nå, venter.
  const kjenteKamper = new Set((før.klubb?.kamper ?? []).filter((k) => k.dag !== dagnummer(før.sek)).map(kampnokkel))
  const kamper = (etter.klubb?.kamper ?? []).filter((k) => !kjenteKamper.has(kampnokkel(k)) && k.dag !== dagnummer(etter.sek))
  const kjenteLop = new Set((før.racing?.lop ?? []).map((l) => `${l.sesong}:${l.runde}`))
  const lop = (etter.racing?.lop ?? []).filter((l) => !kjenteLop.has(`${l.sesong}:${l.runde}`))
  // En ting som gikk til en rival, har fått en «gang» til; en som ble trukket uten bud, har ingen rival.
  const tapteAuksjoner = (Object.keys(etter.auksjon?.borte ?? {}) as UnikId[]).flatMap((id) => {
    const b = etter.auksjon!.borte[id]!
    return b.rival && b.pris !== undefined && b.ganger > (før.auksjon?.borte[id]?.ganger ?? 0) ? [{ navn: UNIKE[id].navn, rival: b.rival, pris: b.pris }] : []
  })
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
    kamper,
    turneringer: TURNERINGSORDEN.map((t) => ({ turnering: t, antall: kamper.filter((k) => (k.turnering ?? 'serie') === t).length })).filter((x) => x.antall > 0),
    racing: lop.length ? { lop: lop.length, seire: lop.filter((l) => l.plasser.includes(1)).length, poeng: lop.reduce((sum, l) => sum + l.poeng, 0) } : null,
    tapteAuksjoner,
    rapporter: AKSJER.flatMap((id) => {
      const r = etter.kvartal?.[id]?.siste
      return r && r.dag !== før.kvartal?.[id]?.siste?.dag ? [{ navn: PAPIRER[id].navn, utfall: r.utfall }] : []
    }),
    prestasjoner: PRESTASJONER.filter((p) => etter.prestasjoner[p.id] !== undefined && før.prestasjoner[p.id] === undefined).map((p) => ({ navn: p.navn })),
    hendelser: etter.hendelser.filter((h) => !kjenteHendelser.has(`${h.sek}|${h.tittel}|${h.tekst}`)).length,
  }
}
