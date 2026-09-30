import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { ansett, ansettLeder, bedriftssalgspris, laan, selgBedrift, siOpp, type Utfall } from '../handlinger'
import {
  bedriftInntektPerSek,
  bedriftLonn,
  bruttoPerSek,
  lederpris,
  maksLaanMotSikkerhet,
  maksNyttLaan,
  nettoformue,
  rentesats,
} from '../formler'
import { BEDRIFTSSALG_RABATT, BEDRIFTSTYPER, LAANETAK_TIMER, LONN_PER_ANSATT, RENTE_PER_TIME } from '../innhold'
import { simuler } from '../simulering'
import { migrer } from '../../state/migrering'
import type { Spilltilstand } from '../types'
import { bedrift } from './hjelp'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('fast lønn', () => {
  it('lønnen er fast per ansatt og vokser ikke med nivået', () => {
    const liten = bedrift('kiosk', { nivaa: 1, ansatte: 2 })
    const stor = bedrift('kiosk', { nivaa: 90, ansatte: 2 })
    expect(bedriftLonn(liten)).toBe(2 * LONN_PER_ANSATT * BEDRIFTSTYPER.kiosk.grunninntekt)
    expect(bedriftLonn(stor)).toBe(bedriftLonn(liten))
  })

  it('en ansatt taper penger i en liten bedrift og tjener i en stor', () => {
    const gir = (b: ReturnType<typeof bedrift>) => bedriftInntektPerSek({ ...b, ansatte: b.ansatte + 1 }) - bedriftInntektPerSek(b)
    expect(gir(bedrift('kiosk', { nivaa: 5 }))).toBeLessThan(0)
    expect(gir(bedrift('kiosk', { nivaa: 25, forbedringer: 1 }))).toBeGreaterThan(0)
  })

  it('går kontantene under null, tas resten fra sparekontoen og så som gjeld', () => {
    const s = nyttSpill()
    s.kontanter = 0
    s.bedrifter[0].ansatte = 1
    const tap = -bedriftInntektPerSek(s.bedrifter[0])
    s.sparing = tap * 5
    const etter = simuler(s, 10)
    expect(etter.kontanter).toBe(0)
    expect(etter.sparing).toBe(0)
    expect(etter.gjeld).toBeGreaterThan(0)
  })

  it('du kan si opp en ansatt, uten kostnad og uten å få noe tilbake', () => {
    let s = nyttSpill()
    s.kontanter = 10_000
    s = ok(ansett(s, 'b1'))
    const kontanter = s.kontanter
    s = ok(siOpp(s, 'b1'))
    expect(s.bedrifter[0].ansatte).toBe(0)
    expect(s.kontanter).toBe(kontanter)
    expect(siOpp(s, 'b1').ok).toBe(false)
  })
})

describe('driftskostnader er ikke verdi', () => {
  it('en ansettelse koster nettoformue og bokføres som forbruk', () => {
    const s = nyttSpill()
    s.kontanter = 10_000
    const før = nettoformue(s)
    const n = ok(ansett(s, 'b1'))
    const pris = s.kontanter - n.kontanter
    expect(n.bedrifter[0].investert).toBe(s.bedrifter[0].investert)
    expect(nettoformue(n)).toBeCloseTo(før - pris)
    expect(n.totaltForbruk).toBe(s.totaltForbruk + pris)
  })

  it('en leder koster nettoformue', () => {
    const s = nyttSpill()
    s.kontanter = 10_000
    const n = ok(ansettLeder(s, 'b1'))
    expect(n.bedrifter[0].investert).toBe(s.bedrifter[0].investert)
    expect(nettoformue(n)).toBeCloseTo(nettoformue(s) - lederpris('saftbod'))
  })
})

describe('selge en bedrift', () => {
  function toBedrifter(): Spilltilstand {
    const s = nyttSpill()
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 30, investert: 1_000_000 }))
    return s
  }

  it('gir det som er investert minus rabatten, og tapet bokføres', () => {
    const s = toBedrifter()
    const n = ok(selgBedrift(s, 'b2'))
    expect(n.kontanter - s.kontanter).toBe(1_000_000 * (1 - BEDRIFTSSALG_RABATT))
    expect(bedriftssalgspris(s.bedrifter[1])).toBe(1_000_000 * (1 - BEDRIFTSSALG_RABATT))
    expect(n.bedrifter.map((b) => b.id)).toEqual(['b1'])
    expect(n.totaltGevinst).toBe(-1_000_000 * BEDRIFTSSALG_RABATT)
  })

  it('den siste bedriften kan ikke selges', () => {
    expect(selgBedrift(nyttSpill(), 'b1').ok).toBe(false)
  })

  it('en kø ved bedriften forsvinner med den', () => {
    const s = toBedrifter()
    s.ko = { bedriftId: 'b2', slutterSek: s.sek + 10, bonus: 100 }
    expect(ok(selgBedrift(s, 'b2')).ko).toBeNull()
  })
})

describe('lån med inntektstak', () => {
  it('renten er høyere enn før', () => {
    expect(RENTE_PER_TIME).toBe(0.08)
    expect(rentesats(nyttSpill())).toBe(RENTE_PER_TIME)
  })

  it('uten inntekt nok setter inntekten taket, ikke sikkerheten', () => {
    const s = nyttSpill()
    s.kontanter = 1e9
    const tak = bruttoPerSek(s) * LAANETAK_TIMER * 3600
    expect(maksLaanMotSikkerhet(s)).toBeGreaterThan(tak)
    expect(maksNyttLaan(s)).toBe(Math.floor(tak))
    expect(laan(s, maksNyttLaan(s) + 1).ok).toBe(false)
    expect(laan(s, maksNyttLaan(s)).ok).toBe(true)
  })

  it('med stor inntekt og lite å stille som sikkerhet, setter sikkerheten grensen', () => {
    const s = nyttSpill()
    s.bedrifter.push(bedrift('hotell', { id: 'b2', nivaa: 100, investert: 0 }))
    expect(maksNyttLaan(s)).toBe(maksLaanMotSikkerhet(s))
  })

  it('gjeld du alt har, spiser av taket', () => {
    const s = nyttSpill()
    s.gjeld = bruttoPerSek(s) * LAANETAK_TIMER * 3600
    s.kontanter = s.gjeld
    expect(maksNyttLaan(s)).toBe(0)
  })
})

describe('migrering 18 → 19', () => {
  it('trekker lederprisen fra det som er investert, men aldri under kjøpsprisen', () => {
    const s = nyttSpill() as unknown as Record<string, unknown>
    const bedrifter = s.bedrifter as Record<string, unknown>[]
    bedrifter[0].leder = true
    bedrifter[0].investert = 250 + lederpris('saftbod') + 1_000
    bedrifter.push({ ...bedrift('kiosk', { id: 'b2', leder: true, investert: 40_000 }) })
    s.versjon = 18
    const r = migrer(s)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.bedrifter[0].investert).toBe(250 + 1_000)
    expect(r.tilstand.bedrifter[1].investert).toBe(BEDRIFTSTYPER.kiosk.pris)
  })
})
