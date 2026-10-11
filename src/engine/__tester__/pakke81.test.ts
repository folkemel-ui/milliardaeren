/** Pakke 81: noe å strekke seg etter — lavere lånegrense, to statusnivåer til og en rival som holder følge. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { laan } from '../handlinger'
import { belaaningsgrad, eiendeler, maksLaanMotSikkerhet, maksNyttLaan, statusfaktor } from '../formler'
import { MAKS_BELAANING, MARGIN_MAAL, MARGINKRAV } from '../innhold'
import { STATUSNIVAAER, statusnivaa } from '../eiendom'
import { TITLER } from '../avis'
import { PRESTASJONER } from '../prestasjoner'
import { RIVALLOFT, rivalvekst, START_RIVALER } from '../rivaler'
import { MERKER } from '../../ui/merker'
import { bedrift, laanUtenTak } from './hjelp'

describe('en lavere lånegrense', () => {
  it('er 20 % av alt du eier; et marginkrav selger fortsatt bare ned til 50 %', () => {
    expect(MAKS_BELAANING).toBe(0.2)
    expect(MARGIN_MAAL).toBe(0.5)
    expect(MARGINKRAV).toBe(0.75)
  })

  it('det største lånet gir nøyaktig 20 % belåning', () => {
    const s = nyttSpill()
    s.kontanter = 1e9
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 50, investert: 1e8 }))
    // Inntektstaket må ikke være det som stopper: sikkerheten skal være grensen her.
    const belop = maksLaanMotSikkerhet(s)
    const etter = laanUtenTak(s, belop)
    expect(belaaningsgrad(etter)).toBeCloseTo(0.2, 6)
    expect(maksLaanMotSikkerhet(etter)).toBe(0)
  })

  it('en lagring med 40 % gjeld beholder alt: ingen salg, bare ikke mer lån', () => {
    const s = nyttSpill()
    s.kontanter = 1e6
    s.gjeld = Math.floor(eiendeler(s) * 0.4)
    expect(maksNyttLaan(s)).toBe(0)
    expect(laan(s, 1).ok).toBe(false)
    const etter = simuler(s, 60)
    expect(etter.hendelser.some((h) => h.tittel === 'Marginkrav')).toBe(false)
  })
})

describe('to statusnivåer til', () => {
  it('Dynasti på 1 200 og Mytisk på 1 400, +2 % inntekt hver', () => {
    expect(STATUSNIVAAER.slice(-3)).toEqual([
      { poeng: 1000, navn: 'Udødelig' },
      { poeng: 1200, navn: 'Dynasti' },
      { poeng: 1400, navn: 'Mytisk' },
    ])
    const s = nyttSpill()
    // Status rett fra trofeer: hvert er verdt 3 poeng.
    s.trofeer = Array.from({ length: 467 }, (_, i) => ({ navn: 'Seriemester', sesong: i, divisjon: 0 })) as never
    expect(statusnivaa(s)).toBe(STATUSNIVAAER.length - 1)
    expect(statusfaktor(s)).toBeCloseTo(1 + 0.02 * 12, 12)
  })

  it('avisa har en tittel for hvert nivå', () => {
    expect(TITLER).toHaveLength(STATUSNIVAAER.length)
  })

  it('Udødelig står på nivå 10; Mytisk er den nye på toppen, med medalje', () => {
    const udodelig = PRESTASJONER.find((p) => p.id === 'udodelig')!
    const mytisk = PRESTASJONER.find((p) => p.id === 'mytisk')!
    expect(udodelig.beskrivelse).toBe('Nå statusnivået Udødelig')
    expect(mytisk).toBeDefined()
    expect(MERKER.mytisk).toBeDefined()
    const felles = (nivaa: number) => ({ status: () => nivaa }) as never
    expect(udodelig.klart(nyttSpill(), felles(10))).toBe(true)
    expect(mytisk.klart(nyttSpill(), felles(11))).toBe(false)
    expect(mytisk.klart(nyttSpill(), felles(12))).toBe(true)
  })
})

describe('en rival som holder følge', () => {
  it('Marit Aas vokser med 0,18 mot 3 000 mrd; tallene i lagringen står', () => {
    const aas = START_RIVALER.find((r) => r.id === 'aas')!
    expect(aas.tak).toBe(150e9)
    expect(aas.vekst).toBe(0.12)
    expect(rivalvekst(aas)).toEqual({ vekst: 0.18, tak: 3000e9 })
    expect(Object.keys(RIVALLOFT)).toEqual(['aas'])
    for (const r of START_RIVALER.filter((x) => x.id !== 'aas')) expect(rivalvekst(r)).toEqual({ vekst: r.vekst, tak: r.tak })
  })

  it('et tak som et oppkjøp har krympet, er fortsatt krympet', () => {
    const aas = { ...START_RIVALER.find((r) => r.id === 'aas')!, tak: 75e9 }
    expect(rivalvekst(aas).tak).toBe(1500e9)
  })

  it('etter 22 timer har hun titalls milliarder (20–60 på tre frø), ikke lenger et tak på 150', { timeout: 120_000 }, async () => {
    let s = nyttSpill()
    for (let t = 0; t < 22; t++) {
      s = simuler(s, 3600)
      await new Promise((r) => setTimeout(r, 0))
    }
    const aas = s.rivaler.find((r) => r.id === 'aas')!
    expect(aas.formue).toBeGreaterThan(15e9)
    expect(aas.formue).toBeLessThan(200e9)
    expect(aas.tak).toBe(150e9)
  })
})
