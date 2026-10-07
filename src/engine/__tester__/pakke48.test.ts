/**
 * Pakke 48 — bedriftene, dypere: ansatte med navn og nivå, og retningen
 * hver bedrift tar på nivå 50.
 */

import { describe, expect, it } from 'vitest'
import { ansett, siOpp, velgRetning, bedriftssalgspris } from '../handlinger'
import { ansettelsespris, bedriftInntektPerSek, bedriftLonn, bedriftsverdi, basisinntekt, lonnFor } from '../formler'
import { antallAv, GRADER, medNyAnsatt, premiumstatus, RETNING_NIVAA, RETNINGER, stab } from '../ansatte'
import { STIGEN, LONN_PER_ANSATT, BEDRIFTSTYPER, BEDRIFTSSALG_RABATT } from '../innhold'
import { statuspoeng } from '../eiendom'
import { nyttSpill } from '../start'
import { bedrift } from './hjelp'
import type { Utfall } from '../handlinger'
import type { Spilltilstand } from '../types'

const ok = (u: Utfall): Spilltilstand => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill med én saftbod på et gitt nivå og nok penger. */
function spill(nivaa: number): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.bedrifter[0].nivaa = nivaa
  return s
}

describe('ansatte med nivå', () => {
  it('eldre lagringer (bare et antall) regnes som erfarne, med faste navn', () => {
    const b = bedrift('kiosk', { ansatte: 3 })
    expect(antallAv(b, 'erfaren')).toBe(3)
    expect(antallAv(b, 'stjerne')).toBe(0)
    expect(stab(b).map((a) => a.grad)).toEqual(['erfaren', 'erfaren', 'erfaren'])
    expect(stab(b)[0].navn).toBe(stab(b)[0].navn)
    expect(stab(b)[0].navn).toMatch(/^\S+ \S+$/)
  })

  it('bare erfarne gir nøyaktig samme regnestykke som før Pakke 48', () => {
    for (const type of STIGEN) {
      for (const n of [0, 1, 4, 10]) {
        const b = bedrift(type, { nivaa: 40, ansatte: n })
        const g = BEDRIFTSTYPER[type].grunninntekt
        expect(bedriftLonn(b)).toBe(g * LONN_PER_ANSATT * n)
        expect(bedriftInntektPerSek(b)).toBe(basisinntekt(b) * (1 + 0.1 * n) - g * LONN_PER_ANSATT * n)
      }
    }
  })

  it('junior, erfaren og stjerne gir og koster det de skal', () => {
    const b = bedrift('kafe', { nivaa: 60 })
    const g = BEDRIFTSTYPER.kafe.grunninntekt
    expect(lonnFor(b, 'junior')).toBe(g * LONN_PER_ANSATT * 0.5)
    expect(lonnFor(b, 'stjerne')).toBe(g * LONN_PER_ANSATT * 3)
    expect(ansettelsespris(b, 'junior')).toBe(Math.round(ansettelsespris(b) * 0.5))
    expect(ansettelsespris(b, 'stjerne')).toBe(Math.round(ansettelsespris(b) * 4))
    const basis = basisinntekt(b)
    expect(bedriftInntektPerSek(medNyAnsatt(b, 'stjerne')) - bedriftInntektPerSek(b)).toBeCloseTo(basis * 0.25 - lonnFor(b, 'stjerne'))
    expect(bedriftInntektPerSek(medNyAnsatt(b, 'junior')) - bedriftInntektPerSek(b)).toBeCloseTo(basis * 0.05 - lonnFor(b, 'junior'))
  })

  it('stjerner først fra nivå 50, og hver ansatt får et navn', () => {
    expect(ansett(spill(49), 'b1', 'stjerne').ok).toBe(false)
    let s = ok(ansett(spill(50), 'b1', 'stjerne'))
    s = ok(ansett(s, 'b1', 'junior'))
    const b = s.bedrifter[0]
    expect(b.ansatte).toBe(2)
    expect(b.stab!.map((a) => a.grad)).toEqual(['stjerne', 'junior'])
    expect(b.stab!.every((a) => /^\S+ \S+$/.test(a.navn))).toBe(true)
  })

  it('du kan si opp en bestemt ansatt', () => {
    let s = spill(50)
    for (const grad of ['junior', 'stjerne', 'erfaren'] as const) s = ok(ansett(s, 'b1', grad))
    const navn = s.bedrifter[0].stab![1].navn
    s = ok(siOpp(s, 'b1', 1))
    expect(s.bedrifter[0].ansatte).toBe(2)
    expect(s.bedrifter[0].stab!.map((a) => a.grad)).toEqual(['junior', 'erfaren'])
    expect(s.bedrifter[0].stab!.some((a) => a.navn === navn && a.grad === 'stjerne')).toBe(false)
    expect(siOpp(s, 'b1', 5).ok).toBe(false)
  })

  it('en eldre bedrift får navn på alle når den første sies opp', () => {
    const s = spill(30)
    s.bedrifter[0].ansatte = 3
    const før = stab(s.bedrifter[0]).map((a) => a.navn)
    const etter = ok(siOpp(s, 'b1', 0))
    expect(etter.bedrifter[0].stab!.map((a) => a.navn)).toEqual(før.slice(1))
  })
})

describe('retning på nivå 50', () => {
  it('velges bare fra nivå 50, og bare én gang', () => {
    expect(velgRetning(spill(RETNING_NIVAA - 1), 'b1', 'volum').ok).toBe(false)
    const s = ok(velgRetning(spill(RETNING_NIVAA), 'b1', 'volum'))
    expect(s.bedrifter[0].retning).toBe('volum')
    expect(velgRetning(s, 'b1', 'premium').ok).toBe(false)
  })

  it('volum gir +15 % inntekt', () => {
    const b = bedrift('hotell', { nivaa: 60 })
    expect(RETNINGER.volum.inntekt).toBe(1.15)
    expect(basisinntekt({ ...b, retning: 'volum' })).toBeCloseTo(basisinntekt(b) * 1.15)
  })

  it('premium gir +30 % verdi, høyere salgspris og status etter trinnet på stigen', () => {
    const b = bedrift('hotell', { nivaa: 60, investert: 1_000_000, retning: 'premium' })
    expect(bedriftsverdi(b)).toBeCloseTo(1_300_000)
    expect(bedriftssalgspris(b)).toBe(Math.round(1_300_000 * (1 - BEDRIFTSSALG_RABATT)))
    const s = nyttSpill()
    s.bedrifter = [bedrift('saftbod', { retning: 'premium' }), b, bedrift('skisenter', { retning: 'premium' })]
    expect(premiumstatus(s)).toBe(1 + (STIGEN.indexOf('hotell') + 1) + 13)
    expect(statuspoeng(s)).toBe(premiumstatus(s))
  })

  it('premium på alle tretten gir 91 statuspoeng', () => {
    const s = nyttSpill()
    s.bedrifter = STIGEN.map((t) => bedrift(t, { retning: 'premium' }))
    expect(premiumstatus(s)).toBe(91)
  })

  it('stjernene og retningen kommer på samme nivå', () => {
    expect(GRADER.stjerne.fraNivaa).toBe(RETNING_NIVAA)
  })
})
