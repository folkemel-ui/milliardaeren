/** Pakke 39: akser på grafene og statistikken over hvor inntekten kommer fra. */

import { describe, expect, it } from 'vitest'
import { rundtSteg, tidsmerker, verdimerker } from '../grafakser'
import { KILDER, kildeverdier, kolonner, paagaende, summer } from '../statistikk'
import { nettoInn } from '../komponenter/Oppgjor'
import { DAG_SEK } from '../../engine/kalender'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { periodestart } from '../../engine/oppgjor'

describe('verdiaksen', () => {
  it('runde steg', () => {
    expect(rundtSteg(100)).toBe(25)
    expect(rundtSteg(1_900_000_000)).toBe(500_000_000)
    expect(rundtSteg(3)).toBe(1)
    expect(rundtSteg(0)).toBe(1)
  })

  it('minst tre streker, alle innenfor og uten flyttallsstøy', () => {
    for (const [bunn, topp] of [
      [0, 1],
      [-0.2e9, 1.9e9],
      [166.67, 187.56],
      [0.1, 0.4],
      [-5000, 12000],
      [1e9, 2.1e9],
    ]) {
      const m = verdimerker(bunn, topp)
      expect(m.length).toBeGreaterThanOrEqual(3)
      expect(m.every((v) => v >= bunn - 1e-9 && v <= topp + 1e-9)).toBe(true)
      expect(m.every((v) => String(v).length < 14)).toBe(true)
    }
    expect(verdimerker(-1, 1)).toContain(0)
    expect(Object.is(verdimerker(-1, 1)[2], -0)).toBe(false)
  })
})

describe('tidsaksen', () => {
  it('klokkeslett for en dag, på hele timer', () => {
    const m = tidsmerker(10 * DAG_SEK, 11 * DAG_SEK)
    expect(m.map((x) => x.tekst)).toEqual(['00:00', '06:00', '12:00', '18:00', '00:00'].slice(0, m.length))
    expect(m.length).toBeLessThanOrEqual(5)
  })

  it('datoer for flere dager, på hele dager og aldri flere enn fem', () => {
    for (const dager of [3, 10, 21, 60, 400, 3000]) {
      const m = tidsmerker(0, dager * DAG_SEK)
      expect(m.length).toBeGreaterThanOrEqual(2)
      expect(m.length).toBeLessThanOrEqual(5)
      expect(m.every((x) => x.sek % DAG_SEK === 0)).toBe(true)
      expect(m.every((x) => /^(\d+\. [a-zæøå]{3}|[a-zæøå]{3} \d\d)$/.test(x.tekst))).toBe(true)
    }
  })

  it('tomt spenn gir ingen merker', () => {
    expect(tidsmerker(5, 5)).toEqual([])
  })
})

describe('statistikken', () => {
  it('kildene summerer til det oppgjøret viser som inn', () => {
    const o = { bedrifter: 1000, leie: 500, host: 200, utbytte: 50, sparerente: 5, gevinster: -30, klubb: 80 }
    const v = kildeverdier(o)
    expect(v.leie).toBe(300)
    expect(v.host).toBe(200)
    const sum = KILDER.reduce((t, x) => t + v[x.id], 0)
    expect(sum).toBe(nettoInn({ ...o, periode: 'uke', navn: '', fraDag: 0, tilDag: 7, renter: 0, forbruk: 0, formueFor: 0, formueEtter: 0, besteBedrift: null }))
  })

  it('oppgjør fra før Pakke 39 har jorda i leia', () => {
    expect(kildeverdier({ bedrifter: 0, leie: 500, utbytte: 0, sparerente: 0 })).toMatchObject({ leie: 500, host: 0, klubb: 0, gevinster: 0 })
  })

  it('perioden som pågår, regnes fra tellerstanden', () => {
    const s = nyttSpill()
    const start = periodestart(s)
    s.totaltTjent += 900
    s.totaltLeie += 300
    s.totaltHost += 100
    s.totaltKlubb = (s.totaltKlubb ?? 0) + 40
    expect(paagaende(s, start)).toMatchObject({ bedrifter: 900, leie: 200, host: 100, klubb: 40 })
  })

  it('dager: de ferdige først, så i dag — og summen stemmer med tellerne', () => {
    const start = nyttSpill()
    start.bedrifter[0].nivaa = 30
    const s = simuler(start, DAG_SEK * 4 + 50)
    const k = kolonner(s, 'dag')
    expect(k.length).toBe(4)
    expect(k.at(-1)!.paagaar).toBe(true)
    expect(k.slice(0, -1).every((x) => !x.paagaar)).toBe(true)
    // Tellingen startet ved første dagsskifte: ferdige dager + i dag = alt tjent siden da.
    const vedForsteSkifte = s.dagstart!.tjent - s.dagsoppgjor!.reduce((t, d) => t + d.bedrifter, 0)
    expect(vedForsteSkifte).toBeGreaterThan(0)
    expect(summer(k).bedrifter).toBeCloseTo(s.totaltTjent - vedForsteSkifte)
  })
})
