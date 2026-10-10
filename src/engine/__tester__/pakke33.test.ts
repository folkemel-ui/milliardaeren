import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import {
  investerIStartup,
  kjopKlubb,
  kjopMaleri,
  kjopPapir,
  kjopRivalblokk,
  overtaRival,
  selgKlubb,
  selgMaleri,
  selgPapir,
  selgRivalandel,
  type Utfall,
} from '../handlinger'
import { forbesliste, selskapsverdi } from '../rivaler'
import { nettoformue } from '../formler'
import { KURTASJE } from '../marked'
import { beregnSkatt, skattegrunnlag } from '../skatt'
import { dagsskifteOppgjor } from '../oppgjor'
import { startupsVedDagsskifte } from '../startups'
import { KLUBBNAVN, klubbverdi } from '../klubb'
import { salgsprisMaleri } from '../kunst'
import { migrer } from '../../state/migrering'
import type { Oppgjor, Spilltilstand } from '../types'
import type { Terning } from '../rng'
import { bedrift } from './hjelp'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  return s
}

describe('Forbes-lista', () => {
  it('trekker din andel fra rivalens formue, så den ikke telles to ganger', () => {
    let s = rik()
    s.rivaler[0].formue = 1e9
    s = ok(kjopRivalblokk(s, s.rivaler[0].id))
    const r = s.rivaler[0]
    const rad = forbesliste(s, nettoformue(s)).find((p) => p.rivalId === r.id)!
    expect(rad.formue).toBeCloseTo(r.formue - r.andel * selskapsverdi(r))
    expect(rad.formue).toBeLessThan(r.formue)
  })

  it('er uendret for en rival du ikke eier noe i', () => {
    const s = rik()
    const r = s.rivaler[1]
    expect(forbesliste(s, nettoformue(s)).find((p) => p.rivalId === r.id)!.formue).toBe(r.formue)
  })
})

describe('gevinst ved salg', () => {
  it('et papir som har steget, gir gevinst: det du fikk minus det du betalte', () => {
    let s = ok(kjopPapir(rik(), 'NFS', 100))
    const kost = s.beholdning.NFS!.kostpris
    s.marked.kurser.NFS.kurs *= 1.5
    const før = s.kontanter
    s = ok(selgPapir(s, 'NFS', 100))
    expect(s.totaltGevinst).toBeCloseTo(s.kontanter - før - kost)
    expect(s.totaltGevinst).toBeGreaterThan(0)
  })

  it('et halvt salg regner halve kostprisen', () => {
    let s = ok(kjopPapir(rik(), 'NFS', 100))
    const kost = s.beholdning.NFS!.kostpris
    const før = s.kontanter
    s = ok(selgPapir(s, 'NFS', 50))
    expect(s.totaltGevinst).toBeCloseTo(s.kontanter - før - kost / 2)
  })

  it('et tap bokføres som negativt', () => {
    let s = ok(kjopPapir(rik(), 'NFS', 100))
    s.marked.kurser.NFS.kurs *= 0.5
    s = ok(selgPapir(s, 'NFS', 100))
    expect(s.totaltGevinst).toBeLessThan(0)
    // Kurtasjen på begge veier er med i tapet.
    expect(s.totaltGevinst).toBeLessThan(-100 * 90 * (1 - KURTASJE))
  })

  it('kunst: salgsprisen etter salær minus kjøpsprisen', () => {
    let s = ok(kjopMaleri(rik(), 'morgenlys'))
    const kost = s.kunst.eide.morgenlys!.kostpris
    s.kunst.kurser.morgenlys *= 2
    const inntekt = salgsprisMaleri(s, 'morgenlys')
    s = ok(selgMaleri(s, 'morgenlys'))
    expect(s.totaltGevinst).toBeCloseTo(inntekt - kost)
  })

  it('klubben: salg samme dag gir tap på salgshonoraret', () => {
    let s = ok(kjopKlubb(rik(), KLUBBNAVN[0]))
    const kost = s.klubb!.kostpris
    expect(kost).toBeCloseTo(klubbverdi(s))
    s = ok(selgKlubb(s))
    expect(s.totaltGevinst).toBeLessThan(0)
    expect(s.totaltGevinst).toBeCloseTo(-kost * 0.1)
  })

  it('startup: konkurs er et tap på alt du satte inn', () => {
    const s = rik()
    s.startups.push({ id: 1, ide: 0, runde: 0, verdi: 20e6, andel: 0, investert: 0, investertIRunde: 0, kvalitet: 0.5, inntrykk: 1, status: 'aktiv', startetSek: 0 })
    const n = ok(investerIStartup(s, 1, 1e6))
    startupsVedDagsskifte(n, { neste: () => 0.01, mellom: (a: number) => a, sjanse: () => false, velg: <T,>(l: readonly T[]) => l[0] } as unknown as Terning)
    expect(n.startups[0].status).toBe('konkurs')
    expect(n.totaltGevinst).toBe(-1e6)
  })

  it('et fiendtlig oppkjøp gir ikke et falskt tap når restselskapet selges', () => {
    let s = rik()
    s.bedrifter.push(bedrift('kiosk', { id: 'b9', nivaa: 100, investert: 100_000 }))
    s.rivaler[0].formue = 5e8
    const kontanterFør = s.kontanter
    const investert = (x: Spilltilstand) => x.bedrifter.reduce((sum, b) => sum + b.investert, 0)
    const investertFør = investert(s)
    for (let i = 0; i < 5; i++) s = ok(kjopRivalblokk(s, s.rivaler[0].id))
    s = ok(overtaRival(s, s.rivaler[0].id))
    const betalt = kontanterFør - s.kontanter
    const flyttet = investert(s) - investertFør
    expect(flyttet).toBeGreaterThan(0)
    // Det som ble flyttet inn i bedriftene dine, har tatt kostprisen med seg; premiene blir igjen.
    expect(s.rivaler[0].kostpris).toBeCloseTo(betalt - flyttet)
    const før = s.kontanter
    s = ok(selgRivalandel(s, s.rivaler[0].id))
    expect(s.totaltGevinst).toBeCloseTo(s.kontanter - før - (betalt - flyttet))
  })
})

describe('skatt på gevinst', () => {
  const oppgjor = (felt: Partial<Oppgjor>): Oppgjor => ({
    periode: 'maaned', navn: 'januar 2027', fraDag: 0, tilDag: 31,
    bedrifter: 0, leie: 0, utbytte: 0, sparerente: 0, renter: 0, forbruk: 0,
    formueFor: 0, formueEtter: 0, besteBedrift: null, ...felt,
  })

  it('gevinsten legges til skattegrunnlaget', () => {
    expect(skattegrunnlag(oppgjor({ bedrifter: 100_000, gevinster: 400_000 }))).toBe(500_000)
  })

  it('tap trekkes fra inntekten samme måned, men aldri under null', () => {
    expect(skattegrunnlag(oppgjor({ bedrifter: 100_000, gevinster: -40_000 }))).toBe(60_000)
    expect(skattegrunnlag(oppgjor({ bedrifter: 100_000, gevinster: -400_000 }))).toBe(0)
  })

  it('et oppgjør fra før versjon 18 har ingen gevinster og skattes som før', () => {
    expect(skattegrunnlag(oppgjor({ bedrifter: 100_000 }))).toBe(100_000)
  })

  it('månedsoppgjøret tar med gevinsten fra salg i måneden', () => {
    let s = ok(kjopPapir(rik(), 'NFS', 1000))
    s.marked.kurser.NFS.kurs *= 2
    s = ok(selgPapir(s, 'NFS', 1000))
    const gevinst = s.totaltGevinst
    // Hopp til den første i neste måned.
    s.sek = 28 * 300
    const o = dagsskifteOppgjor(s).find((x) => x.periode === 'maaned')!
    expect(o.gevinster).toBeCloseTo(gevinst)
    expect(beregnSkatt(skattegrunnlag(o))).toBeGreaterThan(0)
  })
})

describe('migrering 17 → 18', () => {
  it('gir teller på null, nullstiller periodene og fører klubben til dagens verdi', () => {
    const s = ok(kjopKlubb(rik(), KLUBBNAVN[0])) as unknown as Record<string, unknown>
    const gammel = structuredClone(s)
    delete gammel.totaltGevinst
    for (const p of ['ukestart', 'maanedstart', 'aarstart']) delete (gammel[p] as Record<string, unknown>).gevinst
    delete (gammel.klubb as Record<string, unknown>).kostpris
    gammel.versjon = 17
    const r = migrer(gammel)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    expect(r.tilstand.totaltGevinst).toBe(0)
    expect(r.tilstand.maanedstart.gevinst).toBe(0)
    expect(r.tilstand.klubb!.kostpris).toBeCloseTo(klubbverdi(r.tilstand))
  })
})
