/** Pakke 88: en samling som varer — det sene sjiktet, steder som vokser og plasser priset for det sene spillet. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { byggLagertrinn, kjopLuksus, utvidLager, type Utfall } from '../handlinger'
import { KATEGORINAVN, LAGER, LAGER_FOR, LAGERTRINN, lagernavn, lagerstatus, lagertrinn, LUKSUS, LUKSUSLISTE, START_LAGER, statuspoeng, TRINN_PLASSER, utvidelsespris } from '../eiendom'
import type { LagerId, LuksusId, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return s
}

const SENE: LuksusId[] = ['unikhyperbil', 'skreddersyddklokke', 'megayacht', 'widebodyjet', 'ubaat']

describe('det sene sjiktet', () => {
  it('fem ting fra 5 til 60 mrd, +540 status i alt (ubåten 100 → 200 i Pakke 107)', () => {
    expect(SENE.map((id) => LUKSUS[id].pris)).toEqual([5e9, 8e9, 15e9, 40e9, 60e9])
    expect(SENE.reduce((sum, id) => sum + LUKSUS[id].status, 0)).toBe(540)
  })

  it('hver er dyrest i sin kategori og gir mer status enn alt før den der', () => {
    for (const id of SENE) {
      const k = LUKSUS[id].kategori
      for (const annen of LUKSUSLISTE.filter((x) => LUKSUS[x].kategori === k && !SENE.includes(x))) {
        expect(LUKSUS[id].pris).toBeGreaterThan(LUKSUS[annen].pris)
        expect(LUKSUS[id].status).toBeGreaterThan(LUKSUS[annen].status)
      }
    }
    expect(Object.keys(KATEGORINAVN)).toContain(LUKSUS.ubaat.kategori)
  })
})

describe('steder som vokser', () => {
  it('to trinn per sted, med navn, status og to plasser hver', () => {
    for (const lager of Object.keys(LAGER) as LagerId[]) expect(LAGERTRINN[lager]).toHaveLength(2)
    let s = rik()
    expect(byggLagertrinn(s, 'havn').ok).toBe(false) // ingen plass ennå
    s = ok(utvidLager(s, 'havn'))
    const plasser = s.lager.havn
    const status = statuspoeng(s)
    s = ok(byggLagertrinn(s, 'havn'))
    expect(lagertrinn(s, 'havn')).toBe(1)
    expect(lagernavn(s, 'havn')).toBe('Marina')
    expect(s.lager.havn).toBe(plasser + TRINN_PLASSER)
    expect(statuspoeng(s) - status).toBe(LAGERTRINN.havn[0].status)
    s = ok(byggLagertrinn(s, 'havn'))
    expect(lagernavn(s, 'havn')).toBe('Privat havn med verft')
    expect(lagerstatus(s)).toBe(LAGERTRINN.havn[0].status + LAGERTRINN.havn[1].status)
    expect(byggLagertrinn(s, 'havn').ok).toBe(false) // bygd helt ut
  })

  it('trinnet er forbruk: kontantene går ned med prisen, det du eier, ikke opp', () => {
    let s = ok(utvidLager(rik(), 'garasje'))
    const før = s.kontanter
    s = ok(byggLagertrinn(s, 'garasje'))
    expect(før - s.kontanter).toBe(LAGERTRINN.garasje[0].pris)
  })
})

describe('plasser priset for det sene spillet', () => {
  it('×5 opp til den femte kjøpte plassen i hangaren, så ×2', () => {
    let s = rik()
    const priser: number[] = []
    for (let i = 0; i < 8; i++) {
      priser.push(utvidelsespris(s, 'hangar'))
      s = ok(utvidLager(s, 'hangar'))
    }
    expect(priser.slice(0, 5)).toEqual([5e6, 25e6, 125e6, 625e6, 3125e6])
    expect(priser[5] / priser[4]).toBe(2)
    expect(priser[6] / priser[5]).toBe(2)
  })

  it('plassene trinnene gir, gjør ikke neste kjøpte plass dyrere', () => {
    let s = ok(utvidLager(rik(), 'hangar'))
    const pris = utvidelsespris(s, 'hangar')
    s = ok(byggLagertrinn(s, 'hangar'))
    expect(utvidelsespris(s, 'hangar')).toBe(pris)
    expect(s.lager.hangar - START_LAGER.hangar).toBe(1 + TRINN_PLASSER)
  })

  it('de sene tingene får plass: kjøp alt i havna med trinnene', () => {
    let s = rik()
    const baater = LUKSUSLISTE.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === 'havn')
    s = ok(utvidLager(s, 'havn'))
    s = ok(byggLagertrinn(s, 'havn'))
    s = ok(byggLagertrinn(s, 'havn'))
    while (s.lager.havn < baater.length) s = ok(utvidLager(s, 'havn'))
    for (const id of baater) s = ok(kjopLuksus(s, id))
    expect(s.luksus.filter((id) => baater.includes(id))).toHaveLength(baater.length)
  })
})
