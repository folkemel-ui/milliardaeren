import { describe, expect, it, vi } from 'vitest'


// Grunnmekanikken testes uten kalenderen fra Pakke 49 (den testes i pakke49.test.ts).
vi.mock('../verden', async (ekte) => (await import('./utenKalender')).utenKalender(ekte))
import { nyttSpill } from '../start'
import { MAKS_HISTORIKKPUNKTER, simuler } from '../simulering'
import { nettoformue } from '../formler'
import { STARTKAPITAL } from '../innhold'

describe('start som en ingen', () => {
  it('starter med 1 000 kr og én saftbod', () => {
    const s = nyttSpill()
    expect(s.kontanter).toBe(STARTKAPITAL)
    expect(s.bedrifter.map((b) => b.type)).toEqual(['saftbod'])
  })
})

describe('nettoformue', () => {
  it('er kontanter pluss det som er investert i bedriftene', () => {
    const s = nyttSpill()
    expect(nettoformue(s)).toBe(STARTKAPITAL + 250)
  })

  it('vokser med inntekten', () => {
    const s = simuler(nyttSpill(), 60)
    expect(nettoformue(s)).toBe(STARTKAPITAL + 250 + 60)
  })

  it('høyeste formue følger med', () => {
    const s = simuler(nyttSpill(), 60)
    expect(s.hoyesteFormue).toBe(nettoformue(s))
  })
})

describe('formuehistorikken', () => {
  it('logger et punkt per intervall, med startpunktet først', () => {
    const s = simuler(nyttSpill(), 100)
    expect(s.historikk.punkter.map((p) => p.sek)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
  })

  it('tynnes ut og holder seg under taket, uansett hvor lenge du spiller', { timeout: 60_000 }, () => {
    const s = simuler(nyttSpill(), 7 * 24 * 60 * 60)
    const h = s.historikk
    expect(h.punkter.length).toBeLessThanOrEqual(MAKS_HISTORIKKPUNKTER)
    expect(h.punkter.length).toBeGreaterThan(MAKS_HISTORIKKPUNKTER / 2 - 1)
    expect(h.punkter[0].sek).toBe(0)
    // Jevnt rutenett: alle punkter ligger på det gjeldende intervallet.
    for (const p of h.punkter) expect(p.sek % h.intervall).toBe(0)
    // Stigende i tid.
    for (let i = 1; i < h.punkter.length; i++) expect(h.punkter[i].sek).toBeGreaterThan(h.punkter[i - 1].sek)
  })
})
