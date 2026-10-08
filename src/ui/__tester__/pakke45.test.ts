/** Pakke 45: ferieboliger med sesong, og verdenskartet som vokser med flyene. */

import { describe, expect, it } from 'vitest'
import { dagsbilde } from '../../engine/verden'
import { leiefaktorBy } from '../../engine/utleie'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, leieHverPerSek, SESONGER, sesongfaktor, UTENLANDSBYER } from '../../engine/eiendom'
import { nyttSpill } from '../../engine/start'
import { DAG_SEK, dagFra } from '../../engine/kalender'
import { BREDDE, BYPLASS, byPunkt, HOYDE, INNFELT, LAND, projeksjon, utsnittFor } from '../verdenskartet'
import type { Spilltilstand, Utenlandsby } from '../../engine/types'

/** Et spill på en bestemt dato. */
function på(maaned: number) {
  const s = nyttSpill()
  s.sek = dagFra(2027, maaned, 15) * DAG_SEK
  return s
}

describe('ferieboligene', () => {
  it('fire nye i Marbella og Zermatt, nådd med forretningsjeten', () => {
    const nye = EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].sesong)
    expect(nye.sort()).toEqual(['marbella-hotell', 'marbella-leilighet', 'zermatt-hotell', 'zermatt-leilighet'])
    for (const id of nye) expect(EIENDOMSTYPER[id].reise).toBe(2)
    expect(UTENLANDSBYER).toContain('Marbella')
    expect(UTENLANDSBYER).toContain('Zermatt')
  })

  it('sesongene snitter 1 over året, så ferieboligene tjener som andre over tid', () => {
    for (const f of Object.values(SESONGER)) {
      expect(f).toHaveLength(12)
      expect(f.reduce((a, b) => a + b, 0) / 12).toBeCloseTo(1)
    }
  })

  it('Spania gir mest om sommeren, Alpene om vinteren', () => {
    expect(sesongfaktor(på(6), 'marbella-hotell')).toBe(1.8)
    expect(sesongfaktor(på(0), 'marbella-hotell')).toBe(0.5)
    expect(sesongfaktor(på(0), 'zermatt-hotell')).toBe(1.7)
    expect(sesongfaktor(på(6), 'zermatt-hotell')).toBe(0.9)
    // Vanlige eiendommer har ingen sesong.
    expect(sesongfaktor(på(6), 'leilighet')).toBe(1)
  })

  it('leien følger sesongen', () => {
    // Bare sesongen: været og ledigheten fra Pakke 54 regnes bort.
    const ren = (s: Spilltilstand) => leieHverPerSek(s, 'marbella-leilighet') / ((dagsbilde(s).eiendom['marbella-leilighet'] ?? 1) * leiefaktorBy(s, 'Marbella'))
    const sommer = ren(på(6))
    const vinter = ren(på(0))
    expect(sommer / vinter).toBeCloseTo(1.8 / 0.5, 1)
  })
})

describe('verdenskartet', () => {
  const alle = Object.keys(BYPLASS) as Utenlandsby[]
  const reiseFor = (by: Utenlandsby) => EIENDOMSTYPER[EIENDOMSSTIGEN.find((id) => EIENDOMSTYPER[id].by === by)!].reise!

  it('har en plass for hver utenlandsby', () => {
    expect([...alle].sort()).toEqual([...UTENLANDSBYER].sort())
  })

  it('vokser: hver by synes fra flyet som når den, godt innenfor kanten', () => {
    for (const by of alle) {
      const nivaa = reiseFor(by)
      const pos = byPunkt(by, nivaa)
      expect(pos, by).not.toBeNull()
      const [x, y] = pos!
      expect(x).toBeGreaterThan(6)
      expect(x).toBeLessThan(BREDDE - 6)
      expect(y).toBeGreaterThan(8)
      expect(y).toBeLessThan(HOYDE - 8)
    }
  })

  it('byer lenger unna enn flyet ditt står utenfor kartet', () => {
    expect(byPunkt('Berlin', 1)).toBeNull()
    expect(byPunkt('Marbella', 1)).toBeNull()
    expect(byPunkt('New York', 2)).toBeNull()
    expect(byPunkt('Dubai', 2)).toBeNull()
    // Uten fly ser du Norden, med låste byer du kan fly til.
    expect(byPunkt('Stockholm', 0)).not.toBeNull()
  })

  it('New York og Dubai står i hver sin innfelte rute', () => {
    for (const by of ['New York', 'Dubai'] as const) {
      const [x, y] = byPunkt(by, 3)!
      const i = INNFELT[by]
      expect(x).toBeGreaterThan(i.x)
      expect(x).toBeLessThan(i.x + i.bredde)
      expect(y).toBeGreaterThan(i.y)
      expect(y).toBeLessThan(i.y + i.hoyde)
    }
  })

  it('Mercator holder formen: Norden er høyere enn bred i grader, men får plass', () => {
    const p = projeksjon(utsnittFor(1))
    const [, nord] = p([25.8, 71.1])
    const [, sor] = p([10, 57])
    expect(nord).toBeLessThan(sor)
    expect(LAND.length).toBeGreaterThan(5)
  })
})
