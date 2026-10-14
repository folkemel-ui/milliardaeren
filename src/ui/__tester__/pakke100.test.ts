/** Pakke 100: bedriftene rebalansert — forbedringene, stjernene og banken. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { ansettelseGir, ansettelsespris, bedriftInntektPerSek, forbedringspris, oppgraderingspris } from '../../engine/formler'
import { BEDRIFTSTYPER, FORBEDRING_PRISFAKTOR, FORBEDRINGER, STIGEN } from '../../engine/innhold'
import { GRADER } from '../../engine/ansatte'
import type { Bedrift } from '../../engine/types'
import { Personale } from '../komponenter/Bedriftskort'
import { FORKLARINGER } from '../forklaringer'

const bedrift = (type: Bedrift['type'], nivaa: number, forbedringer = 0): Bedrift => ({ ...nyttSpill().bedrifter[0], id: 'x', type, nivaa, forbedringer, ansatte: 0, stab: undefined })

describe('forbedringene', () => {
  it('koster 10, 24 og 48 oppgraderinger på nivået de låses opp', () => {
    expect([...FORBEDRING_PRISFAKTOR]).toEqual([10, 24, 48])
    for (const type of STIGEN) {
      FORBEDRINGER[type].forEach((f, i) => {
        const b = bedrift(type, f.nivaa, i)
        // Oppgraderingsprisen er avrundet, forbedringsprisen regnes av den uavrundede: noen kroner fra hverandre.
        expect(forbedringspris(b, f) / (oppgraderingspris(b) * FORBEDRING_PRISFAKTOR[i])).toBeCloseTo(1, 2)
      })
    }
  })

  it('den første er ikke lenger en felle: 2, 1,2 og 0,6 ganger tiden neste nivå tar, der de låses opp (før 6, 1,5 og 0,37)', () => {
    for (const type of STIGEN) {
      const forhold = FORBEDRINGER[type].map((f, i) => {
        const b = bedrift(type, f.nivaa, i)
        const naa = bedriftInntektPerSek(b)
        const forb = forbedringspris(b, f) / (bedriftInntektPerSek({ ...b, forbedringer: i + 1 }) - naa)
        const opp = oppgraderingspris(b) / (bedriftInntektPerSek({ ...b, nivaa: b.nivaa + 1 }) - naa)
        return forb / opp
      })
      expect(forhold[0], type).toBeCloseTo(2, 1)
      expect(forhold[1], type).toBeCloseTo(1.2, 1)
      expect(forhold[2], type).toBeCloseTo(0.6, 1)
    }
  })
})

describe('banken', () => {
  it('oppgraderingen koster kr 270 mill, ikke 300', () => {
    expect(BEDRIFTSTYPER.bank.oppgraderingspris).toBe(270_000_000)
  })
})

describe('stjernene', () => {
  it('koster fortsatt fire ganger en erfaren', () => {
    expect(GRADER.stjerne.pris).toBe(4)
  })

  it('kortet sier når en erfaren gir mer per krone', () => {
    const s = nyttSpill()
    s.kontanter = 1e12
    const b = { ...bedrift('hotell', 60), retning: 'volum' as const }
    s.bedrifter = [b]
    const perKrone = (g: 'erfaren' | 'stjerne') => ansettelseGir(s, b, g) / ansettelsespris(b, g)
    expect(perKrone('erfaren')).toBeGreaterThan(perKrone('stjerne'))
    expect(renderToStaticMarkup(createElement(Personale, { s, b }))).toContain('En erfaren gir mer per krone')
  })

  it('forklaringen sier det samme', () => {
    expect(FORKLARINGER.bedrifter.tekst).toMatch(/en erfaren gir mer per krone/)
    expect(FORKLARINGER.bedrifter.tekst).not.toMatch(/de lønner seg når plassene er fulle/)
  })
})
