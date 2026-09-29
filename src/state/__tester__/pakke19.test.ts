import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import type { Spilltilstand } from '../../engine/types'
import { sjekkTilstand } from '../sjekk'
import { KORT_PAUSE_SEK, taIgjen } from '../borte'
import { pakk, pakkUt } from '../overforing'

const uten = (s: Spilltilstand, felt: string) => {
  const kopi = structuredClone(s) as unknown as Record<string, unknown>
  delete kopi[felt]
  return kopi as unknown as Spilltilstand
}

describe('sjekk av lagringen', () => {
  it('et vanlig spill er i orden', () => {
    expect(sjekkTilstand(nyttSpill())).toBeNull()
    expect(sjekkTilstand(simuler(nyttSpill(), 3600))).toBeNull()
  })

  it('bare et versjonsnummer avvises', () => {
    expect(sjekkTilstand({ versjon: 15 } as unknown as Spilltilstand)).toMatch(/ødelagt/)
  })

  it('manglende felt og tall som ikke er tall avvises', () => {
    expect(sjekkTilstand(uten(nyttSpill(), 'marked'))).toMatch(/marked/)
    expect(sjekkTilstand(uten(nyttSpill(), 'bedrifter'))).toMatch(/bedrifter/)
    // NaN blir null i JSON — begge skal avvises.
    expect(sjekkTilstand({ ...nyttSpill(), kontanter: null as unknown as number })).toMatch(/kontanter/)
    expect(sjekkTilstand({ ...nyttSpill(), gjeld: NaN })).toMatch(/gjeld/)
  })

  it('en bedrift uten nivå avvises', () => {
    const s = nyttSpill()
    s.bedrifter[0].nivaa = null as unknown as number
    expect(sjekkTilstand(s)).toMatch(/bedriftene/)
  })

  it('et spill som krasjer i simuleringen avvises', () => {
    const s = nyttSpill()
    ;(s as unknown as Record<string, unknown>).rivaler = [null]
    expect(sjekkTilstand(s)).not.toBeNull()
  })

  it('en importkode med et ødelagt spill avvises', async () => {
    const kode = await pakk({ versjon: 15 } as unknown as Spilltilstand)
    const r = await pakkUt(kode)
    expect(r.ok).toBe(false)
  })

  it('en importkode med et helt spill går gjennom', async () => {
    const r = await pakkUt(await pakk(simuler(nyttSpill(), 600)))
    expect(r.ok).toBe(true)
  })
})

describe('kort pause', () => {
  // Saftboden har ingen leder ved start.
  const s = nyttSpill()

  it('under et minutt går bedriftene som vanlig', () => {
    const sek = KORT_PAUSE_SEK - 1
    expect(taIgjen(s, sek).kontanter).toBe(simuler(s, sek).kontanter)
    expect(taIgjen(s, sek).kontanter).toBeGreaterThan(s.kontanter)
  })

  it('etter et minutt står bedrifter uten leder stille', () => {
    const borte = taIgjen(s, KORT_PAUSE_SEK)
    expect(borte.kontanter).toBe(simuler(s, KORT_PAUSE_SEK, true).kontanter)
    expect(borte.kontanter).toBeLessThan(simuler(s, KORT_PAUSE_SEK).kontanter)
  })

  it('null sekunder endrer ingenting', () => {
    expect(taIgjen(s, 0)).toBe(s)
  })
})
