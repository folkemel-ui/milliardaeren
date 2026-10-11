/** Pakke 85: motstandere med profil og vær på kampdagen. */

import { describe, expect, it } from 'vitest'
import { dineForventedeMaal, KAMPVAER, kampvaer, KONTRING, motprofil, PROFIL_SPENN, VIND_HJELP, VIND_SJANSE, type Lagprofil } from '../klubb'
import type { Klubb, Taktikk } from '../types'

const med = (taktikk: Taktikk) => ({ taktikk }) as Klubb
const lag = (n: number): Lagprofil => ({ angrep: n, forsvar: n })

/** Poeng ventet med Poisson-mål (høyst 9, som motoren). */
function poeng(xa: number, xb: number): number {
  const fordeling = (l: number) => {
    const p: number[] = []
    let f = Math.exp(-l)
    for (let k = 0; k <= 9; k++) {
      p.push(f)
      f *= l / (k + 1)
    }
    const sum = p.reduce((a, b) => a + b, 0)
    return p.map((x) => x / sum)
  }
  const a = fordeling(xa)
  const b = fordeling(xb)
  let ut = 0
  for (let i = 0; i <= 9; i++) for (let j = 0; j <= 9; j++) ut += a[i] * b[j] * (i > j ? 3 : i === j ? 1 : 0)
  return ut
}

describe('motstandere med profil', () => {
  it('angrep og forsvar hver for seg, inntil ±10 fra styrken, det samme hver gang', () => {
    for (let i = 0; i < 200; i++) {
      const p = motprofil(`Lag ${i}`, 60)
      expect(Math.abs(p.angrep - 60)).toBeLessThanOrEqual(PROFIL_SPENN)
      expect(Math.abs(p.forsvar - 60)).toBeLessThanOrEqual(PROFIL_SPENN)
      expect(motprofil(`Lag ${i}`, 60)).toEqual(p)
    }
    // Snittet står på styrken.
    const snitt = Array.from({ length: 400 }, (_, i) => motprofil(`Klubb ${i}`, 50)).reduce((a, p) => a + p.angrep + p.forsvar, 0) / 800
    expect(snitt).toBeGreaterThan(49)
    expect(snitt).toBeLessThan(51)
  })

  it('Forsvar tar mer av målene til et lag med sterkt angrep; Angrep gir mer mot et svakt forsvar', () => {
    // Finn ett lag med angrep over styrken og ett med forsvar under.
    const navn = Array.from({ length: 300 }, (_, i) => `Motlag ${i}`)
    const angrepslag = navn.find((n) => motprofil(n, 60).angrep >= 68)!
    const lekk = navn.find((n) => motprofil(n, 60).forsvar <= 52)!
    const pa = motprofil(angrepslag, 60)
    const [, utenK] = dineForventedeMaal(med('balansert'), lag(60), { navn: angrepslag, styrke: 60 }, true, null)
    const [, medF] = dineForventedeMaal(med('forsvar'), lag(60), { navn: angrepslag, styrke: 60 }, true, null)
    expect(medF / utenK).toBeCloseTo(0.75 * (1 - KONTRING * (pa.angrep - 60)), 10)
    const pl = motprofil(lekk, 60)
    const [b1] = dineForventedeMaal(med('balansert'), lag(60), { navn: lekk, styrke: 60 }, true, null)
    const [a1] = dineForventedeMaal(med('angrep'), lag(60), { navn: lekk, styrke: 60 }, true, null)
    expect(a1 / b1).toBeCloseTo(1.3 * (1 + KONTRING * (60 - pl.forsvar)), 10)
  })

  it('riktig taktikk er en annen enn styrkeregelen i rundt en firedel av kampene', () => {
    const taktikker: Taktikk[] = ['forsvar', 'balansert', 'angrep']
    const best = (gap: number, navn: string, hjemme: boolean, profil: boolean) => {
      let b: Taktikk = 'balansert'
      let bp = -1
      for (const t of taktikker) {
        const mot = { navn, styrke: 60 }
        const [xh, xb] = profil ? dineForventedeMaal(med(t), lag(60 + gap), mot, hjemme, null) : dineForventedeMaal(med(t), lag(60 + gap), { navn: '', styrke: 60 }, hjemme, null)
        const p = hjemme ? poeng(xh, xb) : poeng(xb, xh)
        if (p > bp) [b, bp] = [t, p]
      }
      return b
    }
    // Uten profil: et navn med angrep og forsvar på styrken (spennet 0) — her bruker vi et lag der begge er 60.
    let ulik = 0
    let n = 0
    const flate = Array.from({ length: 2000 }, (_, i) => `F ${i}`).find((x) => motprofil(x, 60).angrep === 60 && motprofil(x, 60).forsvar === 60)!
    for (const hjemme of [true, false])
      for (let gap = -20; gap <= 20; gap += 4)
        for (let i = 0; i < 25; i++) {
          n++
          if (best(gap, `Motlag ${i}`, hjemme, true) !== best(gap, flate, hjemme, true)) ulik++
        }
    expect(ulik / n).toBeGreaterThan(0.15)
    expect(ulik / n).toBeLessThan(0.4)
  })
})

describe('været på kampdagen', () => {
  it('regn −10 %, snø −20 %, vind på rundt én dag av seks', () => {
    expect(KAMPVAER).toEqual({ regn: 0.9, sno: 0.8 })
    let vind = 0
    const sett = new Set<string>()
    for (let d = 0; d < 1200; d++) {
      const v = kampvaer(d)
      sett.add(v.vaer)
      if (v.vind) vind++
      expect(v.faktor).toBe(KAMPVAER[v.vaer] ?? 1)
    }
    expect(sett.has('regn') && sett.has('sno')).toBe(true)
    expect(vind / 1200).toBeGreaterThan(VIND_SJANSE * 0.7)
    expect(vind / 1200).toBeLessThan(VIND_SJANSE * 1.3)
  })

  it('været ganger begge lags mål, og vinden hjelper det svakeste laget', () => {
    const k = med('balansert')
    const mot = { navn: 'Motlag 1', styrke: 70 }
    const [h0, b0] = dineForventedeMaal(k, lag(60), mot, true, null)
    const regndag = Array.from({ length: 400 }, (_, d) => d).find((d) => kampvaer(d).vaer === 'regn' && !kampvaer(d).vind)!
    const [hr, br] = dineForventedeMaal(k, lag(60), mot, true, regndag)
    expect(hr / h0).toBeCloseTo(0.9, 10)
    expect(br / b0).toBeCloseTo(0.9, 10)
    const vinddag = Array.from({ length: 400 }, (_, d) => d).find((d) => kampvaer(d).vind && kampvaer(d).faktor === 1)!
    const [hv, bv] = dineForventedeMaal(k, lag(60), mot, true, vinddag)
    // Du er svakest (60 mot 70): dine mål får vinden.
    expect(hv / h0).toBeCloseTo(VIND_HJELP, 10)
    expect(bv / b0).toBeCloseTo(1, 10)
  })
})
