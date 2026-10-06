import { describe, expect, it } from 'vitest'
import { BYLISTE, BYPLAN, byPunkt, etiketter, INNFELT, KUN_JORD, radius, VISNING } from '../norgeskartet'

type Boks = { x: number; y: number; b: number; h: number; hva: string }

const overlapper = (a: Boks, b: Boks) => a.x < b.x + b.b && b.x < a.x + a.b && a.y < b.y + b.h && b.y < a.y + a.h

/** Det lengste leietallet kartet viser, satt på alle byene samtidig. */
const LENGST_LEIE = '+kr 2,2 mill/s'

/** Alle boksene på kartet når alle byene er fulle og viser leie. */
function alleBokser(): Boks[] {
  const bokser: Boks[] = []
  for (const by of BYLISTE) {
    const r = radius(by, true)
    const [x, y] = byPunkt(by)
    bokser.push({ x: x - r - 3, y: y - r - 3, b: 2 * r + 6, h: 2 * r + 6, hva: `${by} (prikk)` })
    const { navn, leie } = etiketter(by, r, LENGST_LEIE)
    bokser.push({ ...navn.boks, hva: `${by} (navn)` })
    if (leie) bokser.push({ ...leie.boks, hva: `${by} (leie)` })
  }
  return bokser
}

describe('Norgeskartet', () => {
  it('ingen navn, leietall eller prikker overlapper når alle byene er fulle', () => {
    const bokser = alleBokser()
    const kollisjoner: string[] = []
    for (let i = 0; i < bokser.length; i++) {
      for (let j = i + 1; j < bokser.length; j++) {
        const [a, b] = [bokser[i], bokser[j]]
        // En bys egne deler står inntil hverandre med vilje.
        if (a.hva.split(' ')[0] === b.hva.split(' ')[0]) continue
        if (overlapper(a, b)) kollisjoner.push(`${a.hva} × ${b.hva}`)
      }
    }
    expect(kollisjoner).toEqual([])
  })

  it('alt står innenfor kartet, og hovedkartets byer holder seg unna innfeltet', () => {
    const innfelt = { x: INNFELT.x, y: INNFELT.y, b: INNFELT.bredde, h: INNFELT.hoyde, hva: 'innfelt' }
    for (const boks of alleBokser()) {
      expect(boks.x, boks.hva).toBeGreaterThanOrEqual(VISNING.x)
      expect(boks.y, boks.hva).toBeGreaterThanOrEqual(VISNING.y)
      expect(boks.x + boks.b, boks.hva).toBeLessThanOrEqual(VISNING.x + VISNING.bredde)
      expect(boks.y + boks.h, boks.hva).toBeLessThanOrEqual(VISNING.y + VISNING.hoyde)
      const by = boks.hva.split(' ')[0] as keyof typeof BYPLAN
      if (!BYPLAN[by].innfelt) expect(overlapper(boks, innfelt), boks.hva).toBe(false)
    }
  })

  it('stedene med bare jord er de tre uten bygg — Trysil fikk hytter i Pakke 44', () => {
    expect([...KUN_JORD].sort()).toEqual(['Hedmarken', 'Lista', 'Namdalen'])
  })
})
