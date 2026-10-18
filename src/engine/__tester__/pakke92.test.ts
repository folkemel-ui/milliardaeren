/** Pakke 92: en gård du bygger — jordene, maskinene og trinnene. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopJord, kjopJorde, kjopMaskin, selgJord, type Utfall } from '../handlinger'
import { statuspoeng } from '../eiendom'
import { nettoformue } from '../formler'
import { dagnummer, DAG_SEK } from '../kalender'
import {
  GARDSTRINN,
  gardHost,
  gardstrinn,
  gardsvaer,
  jorder,
  jordstatus,
  jordVedDagsskifte,
  jordverdi,
  landverdi,
  MAKS_JORDER,
  maskinpris,
  nesteJordpris,
  START_JORDER,
  vaer,
  avlingspris,
  AVLINGER,
  ukeFor,
} from '../jord'
import { MEGLERHONORAR } from '../eiendom'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill som eier gården på Lista, kjøpt mandag morgen den andre uka. */
function medGard(kontanter = 1e12): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  s.sek = 7 * DAG_SEK
  return ok(kjopJord(s, 'gard-lista'))
}

const ID = 'gard-lista' as const

describe('jordene', () => {
  it('tre fra start, opptil ti; den fjerde koster halve jordverdien, hver neste ×1,25 (Pakke 105)', () => {
    let s = medGard()
    expect(jorder(s.jord[ID])).toBe(START_JORDER)
    const land = landverdi(s, ID)
    expect(nesteJordpris(s, ID)).toBeCloseTo(land * 0.5, 2)
    s = ok(kjopJorde(s, ID))
    expect(nesteJordpris(s, ID)).toBeCloseTo(land * 0.625, 2)
    while (jorder(s.jord[ID]) < MAKS_JORDER) s = ok(kjopJorde(s, ID))
    expect(nesteJordpris(s, ID)).toBeNull()
    expect(kjopJorde(s, ID).ok).toBe(false)
    // Alle sju nye jordene: halve jordverdien × (1 + 1,25 + … + 1,25⁶) ≈ 7,5 ganger jorda (16,1 før Pakke 105).
    expect(s.jord[ID]!.investert! / land).toBeCloseTo(7.54, 1)
  })

  it('en jord teller i gårdens verdi til det den kostet: kjøpet flytter bare penger', () => {
    const s = medGard()
    const før = nettoformue(s)
    const etter = ok(kjopJorde(s, ID))
    expect(nettoformue(etter)).toBeCloseTo(før, 0)
    expect(jordverdi(etter) - jordverdi(s)).toBeCloseTo(nesteJordpris(s, ID)!, 2)
  })

  it('avlingen følger jordene: hver jord gir en tredel av tre, til prisen på det som vokser der (Pakke 93)', () => {
    let s = medGard()
    const dag = dagnummer(s.sek)
    const til = (Math.floor(dag / 7) + 1) * 7 * DAG_SEK
    const tre = gardHost(s, ID, dag, til)
    while (jorder(s.jord[ID]) < MAKS_JORDER) s = ok(kjopJorde(s, ID))
    // Etter utbyggingen regnes uka fra nå (og det før er bokført); sett starten tilbake for å sammenligne en hel uke.
    s.jord[ID]!.plantetSek = 7 * DAG_SEK
    const uke = ukeFor(dag)
    const sum = AVLINGER.reduce((x, a) => x + avlingspris(a.gruppe, uke), 0)
    expect(gardHost(s, ID, dag, til) / tre).toBeCloseTo(sum / (3 * avlingspris('korn', uke)), 6)
  })

  it('en jord kjøpt søndag kveld gir ikke en hel ukes avling (Pakke 57s regel)', () => {
    const s = medGard()
    s.sek = 14 * DAG_SEK - 10 // søndag, ti sekunder før mandag
    const uten = structuredClone(s)
    const med = ok(kjopJorde(s, ID))
    const host = (x: Spilltilstand) => {
      x.sek = 14 * DAG_SEK
      const k = x.kontanter
      jordVedDagsskifte(x)
      return x.kontanter - k
    }
    const tre = host(uten)
    // Høsten med fire jorder de siste ti sekundene er nesten den samme som med tre hele uka. Delen som ble
    // bokført søndag, regnes med søndagens jordverdi (0,3 % under mandagens), så uka gir litt mindre — aldri mer.
    expect(host(med) / tre).toBeGreaterThan(0.995)
    expect(host(med) / tre).toBeLessThan(1 + 10 / (7 * DAG_SEK))
  })

  it('selges med jordene, minus meglerhonoraret', () => {
    let s = medGard()
    s = ok(kjopJorde(s, ID))
    const verdi = landverdi(s, ID) + s.jord[ID]!.investert!
    const solgt = ok(selgJord(s, ID))
    expect(solgt.kontanter - s.kontanter).toBeCloseTo(verdi * (1 - MEGLERHONORAR), 0)
  })
})

describe('maskinene', () => {
  it('traktor 20 %, skurtresker 40 %, sprøyte 30 % av gårdens verdi; høyst tre trinn (Pakke 114)', () => {
    let s = medGard()
    const verdi = landverdi(s, ID)
    expect(maskinpris(s, ID, 'traktor')).toBeCloseTo(0.2 * verdi, 2)
    expect(maskinpris(s, ID, 'tresker')).toBeCloseTo(0.4 * verdi, 2)
    expect(maskinpris(s, ID, 'sproyte')).toBeCloseTo(0.3 * verdi, 2)
    for (let i = 0; i < 3; i++) s = ok(kjopMaskin(s, ID, 'traktor'))
    expect(kjopMaskin(s, ID, 'traktor').ok).toBe(false)
  })

  it('traktor og skurtresker gir ×1,1 og ×1,15; sprøyta tar 30 % av fallet i en dårlig uke', () => {
    let s = medGard()
    const dag = dagnummer(s.sek)
    const til = (Math.floor(dag / 7) + 1) * 7 * DAG_SEK
    const før = gardHost(s, ID, dag, til)
    s = ok(kjopMaskin(ok(kjopMaskin(s, ID, 'traktor')), ID, 'tresker'))
    s.jord[ID]!.plantetSek = 7 * DAG_SEK
    expect(gardHost(s, ID, dag, til) / før).toBeCloseTo(1.1 * 1.15, 6)
    const j = { ...s.jord[ID]!, maskiner: { sproyte: true } }
    expect(gardsvaer(j, 0.5)).toBeCloseTo(0.65, 6)
    expect(gardsvaer(j, 1.4)).toBe(1.4)
  })
})

describe('trinnene', () => {
  it('småbruk, gård ved 5, storgård ved 8, gods ved 10: +3, +6 og +10 status', () => {
    let s = medGard()
    const status = statuspoeng(s)
    const sett: string[] = []
    while (jorder(s.jord[ID]) < MAKS_JORDER) {
      s = ok(kjopJorde(s, ID))
      sett.push(GARDSTRINN[gardstrinn(s.jord[ID])].navn)
    }
    expect(sett).toEqual(['Småbruk', 'Gård', 'Gård', 'Gård', 'Storgård', 'Storgård', 'Gods'])
    expect(jordstatus(s)).toBe(10)
    expect(statuspoeng(s) - status).toBe(10)
    expect(s.hendelser.filter((h) => h.tittel === 'Gården').map((h) => h.tekst)).toEqual([
      'Gården på Lista er nå en gård: +3 status.',
      'Gården på Lista er nå en storgård: +6 status.',
      'Gården på Lista er nå et gods: +10 status.',
    ])
  })

  it('avisa sier hva gården er blitt', () => {
    let s = medGard()
    for (let i = 0; i < 2; i++) s = ok(kjopJorde(s, ID))
    s.sek = 14 * DAG_SEK
    const [sak] = jordVedDagsskifte(s)
    expect(sak.tekst).toContain('fra gården på Lista')
  })
})

it('en gård fra før Pakke 92 gir det samme som før, til ukas kornpris (Pakke 93)', () => {
  const s = medGard()
  const j = s.jord[ID]!
  expect(j.jorder).toBeUndefined()
  const dag = dagnummer(s.sek)
  const til = (Math.floor(dag / 7) + 1) * 7 * DAG_SEK
  // Formelen fra før, i samme rekkefølge: jordverdi × 8 % × ukas vær × andel av uka (her hele uka).
  expect(gardHost(s, ID, dag, til)).toBeCloseTo(landverdi(s, ID) * 0.08 * vaer(dag).faktor * avlingspris('korn', ukeFor(dag)), 4)
})
