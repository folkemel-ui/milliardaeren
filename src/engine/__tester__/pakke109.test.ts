/**
 * Pakke 109: en bil med virkelige tall — delenes tall og når de teller, kvalifiseringen og
 * startrekkefølgen, og regn på løpsdagen.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { racingVedDagsskifte } from '../racing'
import {
  BANER,
  bilfart,
  bilfartI,
  BILDELLISTE,
  DELTALL,
  deltall,
  DELVEKT,
  feltetsBesteTrinn,
  kjorLop,
  LOP_PER_SESONG,
  nyttRacingteam,
  POENG,
  REGN_ELLERS,
  regnILop,
  REGNSJANSE,
  rivaltrinn,
  vaatferdighet,
} from '../racing'
import { Terning } from '../rng'
import type { Bildel, Racingteam } from '../types'

/** Et team med delene som gitt og to førere med `ferdighet`. */
function lag(deler: Record<Bildel, number>, ferdighet = 77): Racingteam {
  const r = nyttRacingteam(nyttSpill())
  r.deler = { ...deler }
  r.forere = [0, 1].map((i) => ({ id: i, navn: `Fører ${i}`, ferdighet, lonn: 0 }))
  return r
}
const jevn = (n: number) => ({ motor: n, aero: n, chassis: n, depot: n })

/** Poeng i snitt per sesong over mange sesonger. */
function poengPerSesong(deler: Record<Bildel, number>, n = 150): number {
  let sum = 0
  for (let k = 0; k < n; k++) {
    const r = lag(deler)
    r.frø = k * 7919 + 13
    r.sesong = k + 1
    for (let i = 0; i < LOP_PER_SESONG; i++) sum += kjorLop(r, i).poeng
  }
  return sum / n
}

describe('delenes tall', () => {
  it('fra trinn 0 til 5: 760 → 1 010 hk, 2 800 → 4 000 kg marktrykk, 830 → 798 kg, depotstopp 3,6 → 2,0 s', () => {
    const t = (d: Bildel, navn: string) => DELTALL[d].find((x) => x.navn === navn)!
    expect([deltall(t('motor', 'Effekt'), 0), deltall(t('motor', 'Effekt'), 5)]).toEqual([760, 1010])
    expect([deltall(t('aero', 'Marktrykk'), 0), deltall(t('aero', 'Marktrykk'), 5)]).toEqual([2800, 4000])
    expect([deltall(t('chassis', 'Vekt'), 0), deltall(t('chassis', 'Vekt'), 5)]).toEqual([830, 798])
    expect(deltall(t('depot', 'Depotstopp'), 5)).toBeCloseTo(2.0, 10)
  })

  it('feltets beste: de andre teamenes bilnummer delt på fire deler, eller ditt eget når det er bedre', () => {
    expect(rivaltrinn(90)).toBe(5)
    expect(rivaltrinn(40)).toBe(0)
    expect(rivaltrinn(65)).toBe(2.5)
    const r = lag({ motor: 5, aero: 0, chassis: 0, depot: 0 })
    const best = feltetsBesteTrinn(r)
    expect(best.motor).toBe(5)
    expect(best.aero).toBeGreaterThan(4)
    expect(best.aero).toBeLessThanOrEqual(5)
  })
})

describe('hver del har sitt øyeblikk', () => {
  it('vektene summerer til 4, så en jevn bil er like rask overalt — som før', () => {
    for (const rad of Object.values(DELVEKT)) expect(BILDELLISTE.reduce((s, d) => s + rad[d], 0)).toBeCloseTo(4, 10)
    for (let n = 0; n <= 5; n++) {
      const r = lag(jevn(n))
      for (const f of ['kval', 'tort', 'regn'] as const) expect(bilfartI(r, f)).toBeCloseTo(bilfart(r), 10)
    }
  })

  it('motoren teller mest i kvalifiseringen, aero og chassis i regn, depotet ikke på en flyvende runde', () => {
    const motor = lag({ motor: 5, aero: 0, chassis: 0, depot: 0 })
    const aero = lag({ motor: 0, aero: 5, chassis: 0, depot: 0 })
    const depot = lag({ motor: 0, aero: 0, chassis: 0, depot: 5 })
    expect(bilfartI(motor, 'kval')).toBeGreaterThan(bilfartI(motor, 'regn'))
    expect(bilfartI(aero, 'regn')).toBeGreaterThan(bilfartI(aero, 'tort'))
    expect(bilfartI(depot, 'kval')).toBe(40)
    expect(bilfartI(depot, 'tort')).toBeGreaterThan(bilfart(depot))
  })

  it('en jevn bil tar like mange poeng som før; en bil bygd aero først tar flere med samme trinn', () => {
    const jevnt = poengPerSesong(jevn(2))
    const aero = poengPerSesong({ motor: 0, aero: 5, chassis: 3, depot: 0 })
    expect(aero).toBeGreaterThan(jevnt)
  })
})

describe('kvalifisering og startrekkefølge', () => {
  it('løpet sier hvor dine startet, hvem som tok pole, og om det regnet', () => {
    const r = lag(jevn(3))
    const lop = kjorLop(r, 3)
    expect(lop.start).toHaveLength(2)
    for (const p of lop.start!) {
      expect(p).toBeGreaterThanOrEqual(1)
      expect(p).toBeLessThanOrEqual(20)
    }
    expect(lop.start![0]).not.toBe(lop.start![1])
    expect(lop.pole?.forer).toBeTruthy()
    expect(typeof lop.regn).toBe('boolean')
  })

  it('terningen trekker like mange tall som før: tre per bil, ingen for kvalifiseringen eller været', () => {
    const r = lag(jevn(2))
    const t = new Terning(r.frø)
    for (let i = 0; i < 20 * 3; i++) t.neste()
    kjorLop(r, 0)
    expect(r.frø).toBe(t.fro)
  })

  it('pole vinner om lag fire av ti løp; den beste bilen starter oftest først', () => {
    let pole = 0
    let vant = 0
    for (let k = 0; k < 200; k++) {
      const r = lag(jevn(5), 95)
      r.frø = k * 31 + 7
      r.sesong = k + 1
      for (let i = 0; i < LOP_PER_SESONG; i++) {
        const lop = kjorLop(r, i)
        if (lop.pole?.lag === r.navn) pole++
        if (lop.pole && lop.pall[0]?.forer === lop.pole.forer) vant++
      }
    }
    const lop = 200 * LOP_PER_SESONG
    expect(pole / lop).toBeGreaterThan(0.3)
    expect(vant / lop).toBeGreaterThan(0.3)
    expect(vant / lop).toBeLessThan(0.55)
  })
})

describe('regn på løpsdagen', () => {
  it('Spa og Interlagos oftest, om lag 1,5 våte løp i sesongen; kjent på forhånd', () => {
    const r = lag(jevn(2))
    const vaate: Record<string, number> = {}
    let sum = 0
    const N = 2000
    for (let s = 1; s <= N; s++) {
      r.sesong = s
      for (let runde = 0; runde < LOP_PER_SESONG; runde++) {
        if (regnILop(r, runde)) {
          vaate[BANER[runde]] = (vaate[BANER[runde]] ?? 0) + 1
          sum++
        }
      }
    }
    expect(vaate.Spa / N).toBeCloseTo(REGNSJANSE.Spa!, 1)
    expect(vaate.Monza / N).toBeCloseTo(REGN_ELLERS, 1)
    expect(sum / N).toBeGreaterThan(1.3)
    expect(sum / N).toBeLessThan(1.8)
    // Samme svar hver gang: værmeldingen på kortet holder.
    expect(regnILop(r, 3)).toBe(regnILop(r, 3))
  })

  it('hver fører har en regnferdighet rundt ±5, fra navnet', () => {
    const v = Array.from({ length: 400 }, (_, i) => vaatferdighet(`Fører nr ${i}`))
    for (const x of v) {
      expect(x).toBeGreaterThanOrEqual(-10)
      expect(x).toBeLessThanOrEqual(10)
    }
    const snitt = v.reduce((a, b) => a + b, 0) / v.length
    expect(Math.abs(snitt)).toBeLessThan(1)
    expect(vaatferdighet('Aksel Brekke')).toBe(vaatferdighet('Aksel Brekke'))
  })

  it('poengene i et løp følger plassene som før', () => {
    const r = lag(jevn(5), 95)
    const lop = kjorLop(r, 0)
    const forventet = lop.plasser.reduce<number>((sum, p) => sum + (p ? (POENG[p - 1] ?? 0) : 0), 0)
    expect(lop.poeng).toBe(forventet)
  })
})

describe('avisa', () => {
  it('en seier sier hvor føreren startet', () => {
    const s = nyttSpill()
    s.kontanter = 1e12
    let funnet = false
    for (let k = 0; k < 40 && !funnet; k++) {
      const r = lag(jevn(5), 95)
      r.frø = k * 13 + 5
      r.nesteDag = 0
      s.racing = r
      const saker = racingVedDagsskifte(s, 'Kjendisen')
      const seier = saker.find((x) => x.tittel.includes('vinner i'))
      if (seier) {
        expect(seier.tekst).toMatch(/tok seieren (fra pole|fra \d+\. startplass)/)
        funnet = true
      }
    }
    expect(funnet).toBe(true)
  })
})
