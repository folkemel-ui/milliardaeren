import { describe, expect, it } from 'vitest'
import { migrer, type Raatilstand } from '../migrering'
import { SPILLVERSJON, nyttSpill } from '../../engine/start'

describe('migrering', () => {
  it('slipper en lagring fra gjeldende versjon gjennom urørt', () => {
    const s = nyttSpill()
    const r = migrer(JSON.parse(JSON.stringify(s)))
    expect(r).toEqual({ ok: true, tilstand: s, migrert: false })
  })

  it('avviser lagringer fra en nyere versjon', () => {
    const r = migrer({ ...nyttSpill(), versjon: SPILLVERSJON + 1 })
    expect(r.ok).toBe(false)
  })

  it('avviser søppel og manglende versjon', () => {
    expect(migrer(null).ok).toBe(false)
    expect(migrer([1, 2]).ok).toBe(false)
    expect(migrer({ kontanter: 5 }).ok).toBe(false)
  })

  it('kjører trinnene i rekkefølge og stempler versjonen', () => {
    const trinn: Record<number, (s: Raatilstand) => Raatilstand> = {
      1: (s) => ({ ...s, spor: ['1→2'] }),
      2: (s) => ({ ...s, spor: [...(s.spor as string[]), '2→3'] }),
    }
    const inn = { versjon: 1 }
    const r = migrer(inn, 3, trinn)
    expect(r.ok && r.tilstand).toMatchObject({ versjon: 3, spor: ['1→2', '2→3'] })
    expect(r.ok && r.migrert).toBe(true)
    expect(inn).toEqual({ versjon: 1 })
  })

  it('løfter en ekte versjon 1-lagring til versjon 2', () => {
    const v1 = {
      versjon: 1,
      frø: 20260927,
      sek: 120,
      kontanter: 1_120,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 1, startetSek: 0 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }, { sek: 120, verdi: 1_370 }] },
      totaltTjent: 120,
    }
    const r = migrer(v1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.migrert).toBe(true)
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.bedrifter[0]).toMatchObject({ nivaa: 1, ansatte: 0, leder: false, investert: 250 })
    expect(r.tilstand.hoyesteFormue).toBe(1_370)
    expect(r.tilstand.kontanter).toBe(1_120)
  })

  it('avviser en lagring når et trinn mangler', () => {
    const r = migrer({ versjon: 1 }, 3, { 2: (s) => s })
    expect(r.ok).toBe(false)
  })
})
