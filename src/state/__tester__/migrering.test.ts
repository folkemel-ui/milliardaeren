import { describe, expect, it } from 'vitest'
import { migrer, type Raatilstand } from '../migrering'
import { SPILLVERSJON, nyttSpill } from '../../engine/start'
import { nettoformue } from '../../engine/formler'

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

  it('løfter en versjon 2-lagring til versjon 3 med marked og uendret nettoformue', () => {
    const v2 = {
      versjon: 2,
      frø: 555,
      sek: 600,
      kontanter: 5_000,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 5, startetSek: 0, ansatte: 1, leder: true, investert: 1_500 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }] },
      totaltTjent: 4_000,
      hoyesteFormue: 6_500,
    }
    const r = migrer(v2)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.gjeld).toBe(0)
    expect(r.tilstand.beholdning).toEqual({})
    expect(r.tilstand.marked.kurser.BMT.historikk.length).toBeGreaterThan(100)
    expect(nettoformue(r.tilstand)).toBe(6_500)
  })

  it('løfter en versjon 3-lagring til versjon 4 med eiendomsindeks og uendret formue', () => {
    const v3 = migrer({
      versjon: 2,
      frø: 777,
      sek: 600,
      kontanter: 5_000,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 5, startetSek: 0, ansatte: 1, leder: true, investert: 1_500 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }] },
      totaltTjent: 4_000,
      hoyesteFormue: 6_500,
    }, 3)
    expect(v3.ok).toBe(true)
    if (!v3.ok) return
    const r = migrer(JSON.parse(JSON.stringify(v3.tilstand)))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.marked.eiendom.kurs).toBe(1)
    expect(r.tilstand.marked.eiendom.historikk.length).toBeGreaterThan(100)
    expect(r.tilstand.marked.kurser).toEqual(v3.tilstand.marked.kurser)
    expect(r.tilstand.lager).toEqual({ garasje: 1, havn: 0, hangar: 0 })
    expect(r.tilstand.luksus).toEqual([])
    expect(nettoformue(r.tilstand)).toBe(6_500)
  })

  it('løfter en versjon 4-lagring til versjon 5 og stempler prestasjoner du alt har', () => {
    const s4 = migrer({
      versjon: 2,
      frø: 99,
      sek: 900,
      kontanter: 50_000,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 5, startetSek: 0, ansatte: 1, leder: true, investert: 1_500 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }] },
      totaltTjent: 49_000,
      hoyesteFormue: 51_500,
    }, 4)
    expect(s4.ok).toBe(true)
    if (!s4.ok) return
    const r = migrer(JSON.parse(JSON.stringify(s4.tilstand)))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.avis).toEqual([])
    expect(r.tilstand.forrigeDag.sek).toBe(900)
    expect(Object.keys(r.tilstand.prestasjoner).sort()).toEqual(['fem-sifre', 'forste-ansatt', 'forste-leder', 'forste-steg'])
    expect(nettoformue(r.tilstand)).toBe(51_500)
  })

  it('løfter en versjon 5-lagring til versjon 6 med regnskap, sparekonto og kostpris på eiendom', () => {
    const s5 = migrer({
      versjon: 2,
      frø: 42,
      sek: 900,
      kontanter: 400_000,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 5, startetSek: 0, ansatte: 1, leder: true, investert: 1_500 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }] },
      totaltTjent: 49_000,
      hoyesteFormue: 401_500,
    }, 5)
    expect(s5.ok).toBe(true)
    if (!s5.ok) return
    const v5 = JSON.parse(JSON.stringify(s5.tilstand))
    v5.eiendommer = { hybel: 1 }
    const r = migrer(v5)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.bedrifter[0]).toMatchObject({ tjent: 0, inntektHistorikk: [] })
    expect(r.tilstand.sparing).toBe(0)
    expect(r.tilstand.eiendomKostpris.hybel).toBeCloseTo(250_000 * r.tilstand.marked.eiendom.kurs)
    // 6 → 7: «i dag» starter på null for alle klasser.
    expect(r.tilstand.dagensFlyt).toEqual({ aksje: 0, krypto: 0, eiendom: 0, sparing: 0 })
    expect(r.tilstand.forrigeDag.verdier.eiendom).toBeCloseTo(250_000 * r.tilstand.marked.eiendom.kurs)
  })

  it('løfter en ekte versjon 1-lagring helt frem', () => {
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
