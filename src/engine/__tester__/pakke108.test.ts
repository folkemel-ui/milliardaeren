/**
 * Pakke 108: en klubb med noe igjen på toppen — Europa som merker seg mesterne, en utvidet
 * nasjonalarena, en supercup som gir mindre status, og flomlys som sier når stadion er fullt.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopKlubb, type Utfall } from '../handlinger'
import {
  CUPMESTER,
  DIVISJONER,
  EUROPA_STATUS,
  EUROPA_STYRKE,
  EUROPA_TAK,
  EUROPA_TITTELLOFT,
  EUROPAMESTER,
  europatitler,
  FLOMLYS,
  klubbstatus,
  klubbVedDagsskifte,
  KLUBBNAVN,
  nyEuropa,
  RUNDER_PER_SESONG,
  STADIONTRINN,
  SUPERCUP_STATUS,
  SUPERCUPMESTER,
  tilskuere,
  TROFE_STATUS,
} from '../klubb'
import type { Kamp, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(fro = 108): Spilltilstand {
  const s = nyttSpill(fro)
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

const vant = (m: Kamp) => m.maalFor > m.maalMot || m.straffer === 'deg'

describe('Europa merker seg mesterne', () => {
  it('uten europeiske trofeer trekkes motstanderne som før, 78–92', () => {
    const k = medKlubb().klubb!
    for (let sesong = 1; sesong <= 30; sesong++) {
      const u = nyEuropa(k, sesong)
      for (const l of u.lag.filter((x) => !x.deg)) {
        expect(l.styrke).toBeGreaterThanOrEqual(EUROPA_STYRKE[0])
        expect(l.styrke).toBeLessThanOrEqual(EUROPA_STYRKE[1])
      }
    }
  })

  it('hver tittel gjør dem 2 sterkere, til 99 — de samme klubbene i samme rekkefølge', () => {
    const k = medKlubb().klubb!
    for (const titler of [1, 3, 6, 20]) {
      const uten = nyEuropa(k, 4)
      const med = nyEuropa(k, 4, titler)
      expect(med.lag.map((l) => l.navn)).toEqual(uten.lag.map((l) => l.navn))
      expect(med.frø).toBe(uten.frø)
      med.lag.forEach((l, i) => {
        if (l.deg) return
        expect(l.styrke).toBe(Math.min(EUROPA_TAK, uten.lag[i].styrke + EUROPA_TITTELLOFT * titler))
      })
    }
    expect(EUROPA_TITTELLOFT).toBe(2)
    expect(EUROPA_TAK).toBe(99)
  })

  it('titlene telles fra trofeskapet', () => {
    const s = medKlubb()
    s.trofeer = [
      { navn: EUROPAMESTER, sesong: 3, klubb: 'A' },
      { navn: CUPMESTER, sesong: 3, klubb: 'A' },
      { navn: EUROPAMESTER, sesong: 5, klubb: 'B' },
    ]
    expect(europatitler(s)).toBe(2)
  })
})

describe('utvidet nasjonalarena', () => {
  it('45 000 plasser for kr 500 mill, etter Nasjonalarena', () => {
    expect(STADIONTRINN.at(-2)!.navn).toBe('Nasjonalarena')
    expect(STADIONTRINN.at(-1)).toEqual({ navn: 'Utvidet nasjonalarena', plasser: 45_000, pris: 500_000_000 })
  })

  it('rommer hele publikummet til en toppklubb i Eliteserien: 25 000 × 1,2 × 1,4 = 42 000', () => {
    const k = medKlubb().klubb!
    k.divisjon = DIVISJONER.length - 1
    k.stadion = { trinn: STADIONTRINN.length - 2, flomlys: true, vip: false, investert: 0 }
    expect(tilskuere(k, 1.4)).toBe(25_000)
    k.stadion.trinn = STADIONTRINN.length - 1
    expect(tilskuere(k, 1.4)).toBe(Math.round(25_000 * FLOMLYS.publikum * 1.4))
    // Om lag 31 mill mer i sesongen med fire–fem hjemmekamper á kr 400.
    const mer = (tilskuere(k, 1.4) - 25_000) * DIVISJONER[k.divisjon].billettpris * (RUNDER_PER_SESONG / 2)
    expect(mer).toBeGreaterThan(28e6)
    expect(mer).toBeLessThan(34e6)
  })
})

describe('supercupen', () => {
  it('en ny gir 1 status, en fra før gir 3 som før', () => {
    const s = medKlubb()
    const før = klubbstatus(s)
    s.trofeer = [{ navn: SUPERCUPMESTER, sesong: 1, klubb: 'A' }]
    expect(klubbstatus(s)).toBe(før + TROFE_STATUS)
    s.trofeer.push({ navn: SUPERCUPMESTER, sesong: 2, klubb: 'A', status: SUPERCUP_STATUS })
    expect(klubbstatus(s)).toBe(før + TROFE_STATUS + 1)
    s.trofeer.push({ navn: EUROPAMESTER, sesong: 2, klubb: 'A' })
    expect(klubbstatus(s)).toBe(før + TROFE_STATUS + 1 + EUROPA_STATUS)
  })

  it('supercupen motoren deler ut, bærer statusen 1', () => {
    let testet = false
    for (let fro = 1; fro <= 12 && !testet; fro++) {
      const s = medKlubb(fro)
      const k = s.klubb!
      for (const p of k.spillere) p.styrke = p.angrep = p.forsvar = 99
      for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
      if (!k.supercup) continue
      klubbVedDagsskifte(s)
      const kamp = k.kamper.find((m) => m.turnering === 'supercup')!
      if (!vant(kamp)) continue
      const t = s.trofeer.find((x) => x.navn === SUPERCUPMESTER)!
      expect(t.status).toBe(SUPERCUP_STATUS)
      testet = true
    }
    expect(testet).toBe(true)
  })
})
