/** Pakke 114: en gård som henger med — nabogårdene, maskiner i trinn, status som vokser og odel. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopGardsbygg, kjopJord, kjopJorde, kjopMaskin, kjopNabogard, selgJord, type Utfall } from '../handlinger'
import { DAG_SEK, dagnummer } from '../kalender'
import { nettoformue } from '../formler'
import {
  forventetUke,
  gardsvaer,
  jordstatus,
  landverdi,
  maskinfaktor,
  maskinpris,
  maskintrinn,
  NABO_STATUS,
  nabopris,
  nesteJordpris,
  ODEL_DAGER,
  ODEL_STATUS,
  odelVedDagsskifte,
} from '../jord'
import type { Jordstykke, Spilltilstand } from '../types'

const ID = 'gard-lista'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return s
}

const medGard = () => ok(kjopJord(rik(), ID))

function medGods(): Spilltilstand {
  let s = medGard()
  for (let i = 0; i < 7; i++) s = ok(kjopJorde(s, ID))
  return s
}

describe('maskiner i trinn', () => {
  it('en maskin kjøpt før Pakke 114 er trinn 1, og avlingen er som før', () => {
    const j: Jordstykke = { kostpris: 0, plantetSek: 0, maskiner: { traktor: true, tresker: true, sproyte: true } }
    expect(maskintrinn(j, 'traktor')).toBe(1)
    expect(maskintrinn({ kostpris: 0, plantetSek: 0 }, 'traktor')).toBe(0)
    expect(maskinfaktor(j)).toBeCloseTo(1.1 * 1.15 * 1.08, 12)
    expect(gardsvaer(j, 0.5)).toBeCloseTo(0.5 + 0.3 * 0.5, 12)
  })

  it('hvert trinn gir det samme igjen og koster 1,5 ganger forrige; høyst tre', () => {
    let s = medGard()
    const p1 = maskinpris(s, ID, 'traktor')
    s = ok(kjopMaskin(s, ID, 'traktor'))
    expect(maskinpris(s, ID, 'traktor')).toBeCloseTo(p1 * 1.5, 2)
    s = ok(kjopMaskin(s, ID, 'traktor'))
    expect(maskinpris(s, ID, 'traktor')).toBeCloseTo(p1 * 2.25, 2)
    s = ok(kjopMaskin(s, ID, 'traktor'))
    expect(maskintrinn(s.jord[ID], 'traktor')).toBe(3)
    expect(s.jord[ID]!.maskiner?.traktor).toBe(true)
    expect(maskinfaktor(s.jord[ID]!)).toBeCloseTo(1.3, 12)
    expect(kjopMaskin(s, ID, 'traktor').ok).toBe(false)
  })

  it('sprøyta demper en dårlig uke 30, 45 og 60 %', () => {
    let s = medGard()
    for (const demping of [0.3, 0.45, 0.6]) {
      s = ok(kjopMaskin(s, ID, 'sproyte'))
      expect(gardsvaer(s.jord[ID]!, 0.4)).toBeCloseTo(0.4 + demping * 0.6, 12)
    }
  })
})

describe('nabogårdene', () => {
  it('bare et gods kan kjøpe; 15 × jordverdien, så tre ganger så mye; høyst tre', () => {
    expect(nabopris(medGard(), ID)).toBeNull()
    expect(kjopNabogard(medGard(), ID).ok).toBe(false)
    let s = medGods()
    const land = landverdi(s, ID)
    expect(nabopris(s, ID)).toBeCloseTo(15 * land, 2)
    s = ok(kjopNabogard(s, ID))
    expect(nabopris(s, ID)).toBeCloseTo(45 * land, 2)
    s = ok(kjopNabogard(ok(kjopNabogard(s, ID)), ID))
    expect(s.jord[ID]!.naboer).toBe(3)
    expect(nabopris(s, ID)).toBeNull()
    expect(kjopNabogard(s, ID).ok).toBe(false)
  })

  it('hver tredobler avlingen og prisene på maskiner og bygg — men ikke jorda i formuen', () => {
    const s = medGods()
    const etter = ok(kjopNabogard(s, ID))
    expect(forventetUke(etter, ID, etter.jord[ID]!) / forventetUke(s, ID, s.jord[ID]!)).toBeCloseTo(3, 10)
    expect(maskinpris(etter, ID, 'tresker') / maskinpris(s, ID, 'tresker')).toBeCloseTo(3, 10)
    expect(landverdi(etter, ID)).toBeCloseTo(landverdi(s, ID), 6)
    expect(nesteJordpris(etter, ID)).toBeNull()
  })

  it('prisen står i gårdens verdi som jordene: formuen faller ikke, og salget tar den med', () => {
    const s = medGods()
    const etter = ok(kjopNabogard(s, ID))
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s), -2)
    expect(etter.jord[ID]!.investert! - s.jord[ID]!.investert!).toBeCloseTo(nabopris(s, ID)!, 2)
    expect(ok(selgJord(etter, ID)).jord[ID]).toBeUndefined()
    expect(etter.hendelser.at(-1)?.tekst).toMatch(/kjøpt nabogården: avlingen ×3, \+25 status/)
  })

  it('status: gods 10, +25 per nabogård', () => {
    let s = medGods()
    expect(jordstatus(s)).toBe(10)
    s = ok(kjopNabogard(s, ID))
    expect(jordstatus(s)).toBe(10 + NABO_STATUS)
  })
})

describe('odel', () => {
  it('etter 90 spilldager blir gården odelsgård: en sak, en linje i loggen og +15 status', () => {
    const s = medGard()
    const fra = s.jord[ID]!.eidFra!
    expect(fra).toBe(dagnummer(s.sek))
    s.sek = (fra + ODEL_DAGER - 1) * DAG_SEK
    expect(odelVedDagsskifte(s)).toEqual([])
    const status = jordstatus(s)
    s.sek = (fra + ODEL_DAGER) * DAG_SEK
    const saker = odelVedDagsskifte(s)
    expect(saker).toHaveLength(1)
    expect(saker[0].tittel).toBe('Gården på Lista er en odelsgård')
    expect(s.jord[ID]!.odel).toBe(true)
    expect(jordstatus(s) - status).toBe(ODEL_STATUS)
    expect(s.hendelser.at(-1)?.tekst).toBe('Gården på Lista er en odelsgård: +15 status.')
    expect(odelVedDagsskifte(s)).toEqual([])
  })

  // Pakke 123: skogene blir odelsskog på samme vilkår (før: aldri).
  it('en gård fra før får dagen den først sees, og en skog blir odel på samme vilkår', () => {
    let s = medGard()
    s = ok(kjopJord(s, 'skog-trysil'))
    delete s.jord[ID]!.eidFra
    s.sek += 10 * DAG_SEK
    odelVedDagsskifte(s)
    expect(s.jord[ID]!.eidFra).toBe(dagnummer(s.sek))
    s.sek += ODEL_DAGER * DAG_SEK
    odelVedDagsskifte(s)
    expect(s.jord[ID]!.odel).toBe(true)
    expect(s.jord['skog-trysil']!.odel).toBe(true)
  })

  it('nye bygg flytter ikke dagen gården ble din', () => {
    const s = ok(kjopGardsbygg(medGard(), ID, 'silo'))
    expect(s.jord[ID]!.eidFra).toBe(dagnummer(medGard().sek))
  })
})
