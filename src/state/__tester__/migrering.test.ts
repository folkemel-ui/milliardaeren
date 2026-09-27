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

  it('avviser en lagring når et trinn mangler', () => {
    const r = migrer({ versjon: 1 }, 3, { 2: (s) => s })
    expect(r.ok).toBe(false)
  })
})
