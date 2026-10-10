/** Pakke 69: lettere på telefonen — leie, formue og prestasjoner hvert tiende sekund mens du er borte. */

import { describe, expect, it } from 'vitest'
import { BORTE_TAKT, simuler } from '../simulering'
import { leiePerSek } from '../eiendom'
import { fulltSpill } from './hjelp'
import type { Spilltilstand } from '../types'

/** Det tyngste spillet, stilt på et sekund rett etter en hel tier, så blokkene ikke går opp. */
function spill(): Spilltilstand {
  const s = fulltSpill()
  return simuler(s, (BORTE_TAKT - (s.sek % BORTE_TAKT)) % BORTE_TAKT + 3)
}

/** Det samme, men leien betalt hvert eneste sekund: ett kall per sekund gir alltid en full regning. */
function sekundForSekund(s: Spilltilstand, antall: number): Spilltilstand {
  let n = s
  for (let i = 0; i < antall; i++) n = simuler(n, 1, true)
  return n
}

describe('borte: hvert tiende sekund', () => {
  it('blokkene er ti sekunder og står på hele tiere', () => {
    expect(BORTE_TAKT).toBe(10)
    expect(300 % BORTE_TAKT).toBe(0)
  })

  it('leien over ti minutter borte er den samme som sekund for sekund, innenfor 0,01 %', () => {
    const s = spill()
    const samlet = simuler(s, 600, true)
    const hver = sekundForSekund(s, 600)
    const leie = (x: Spilltilstand) => x.totaltLeie - s.totaltLeie
    expect(leie(samlet)).toBeGreaterThan(0)
    expect(Math.abs(leie(samlet) / leie(hver) - 1)).toBeLessThan(1e-4)
    expect(Math.abs(samlet.kontanter / hver.kontanter - 1)).toBeLessThan(1e-4)
  })

  it('sekundene som blir til overs, betales på slutten — ingen leie går tapt', () => {
    const s = spill()
    // Fire sekunder fra et sekund midt i en blokk: ingen hel tier, men fire sekunder leie.
    const etter = simuler(s, 4, true)
    const hver = sekundForSekund(s, 4)
    // Leien kan ta et lite hopp inne i blokken (her +0,23 % mellom sekund 4 og 5), og en samlet
    // regning bruker leien i sekundet den betales — over ti minutter jevner det seg ut (testen over).
    expect(Math.abs((etter.totaltLeie - s.totaltLeie) / (hver.totaltLeie - s.totaltLeie) - 1)).toBeLessThan(5e-3)
    expect(etter.totaltLeie - s.totaltLeie).toBeGreaterThan(leiePerSek(s) * 3.9)
  })

  it('å dele tiden borte i to gir samme leie som i ett', () => {
    const s = spill()
    const ett = simuler(s, 605, true)
    const to = simuler(simuler(s, 600, true), 5, true)
    // En samlet regning bruker leien i sekundet den betales — derfor ikke helt likt.
    expect(Math.abs((to.totaltLeie - s.totaltLeie) / (ett.totaltLeie - s.totaltLeie) - 1)).toBeLessThan(1e-4)
  })

  it('mens du spiller, er alt som før: ett sekund om gangen eller mange gir det samme', () => {
    const s = spill()
    let en = s
    for (let i = 0; i < 25; i++) en = simuler(en, 1)
    const mange = simuler(s, 25)
    expect(mange.kontanter).toBe(en.kontanter)
    expect(mange.totaltLeie).toBe(en.totaltLeie)
    expect(mange.hoyesteFormue).toBe(en.hoyesteFormue)
  })

  it('høyeste formue og formueloggen følger med borte', () => {
    const s = spill()
    const etter = simuler(s, 3600, true)
    expect(etter.hoyesteFormue).toBeGreaterThanOrEqual(s.hoyesteFormue)
    expect(etter.historikk.punkter.at(-1)!.sek % BORTE_TAKT).toBe(0)
  })
})
