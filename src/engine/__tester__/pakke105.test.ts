/**
 * Pakke 105: en gård som går opp — maskinene og byggene priset etter avlingen, jorder
 * ×1,25, en sprøyte som gir +8 %, lageret som lagrer billig og selger dyrt, og en låve
 * som tar grønnsakene og frukten også.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopGardsbygg, kjopJord, kjopJorde, kjopMaskin, selgJord, selgKorn, settLagring, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { DAG_SEK } from '../kalender'
import {
  avlingspris,
  byggpris,
  gardGir,
  gardHost,
  gardHostDeler,
  gardsvaer,
  jordVedDagsskifte,
  lagerAv,
  lagerkapasitet,
  lagerverdi,
  lagringsgevinst,
  lagringsvalg,
  landverdi,
  MAKS_JORDER,
  maskinpris,
  nesteJordpris,
  SELG_DYRT,
  UKE_SEK,
  utbyggingsgrunnlag,
  ukefaktor,
} from '../jord'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const ID = 'gard-lista' as const

/** Et spill som eier gården på Lista, kjøpt mandag morgen den andre uka. */
function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  s.sek = UKE_SEK
  return ok(kjopJord(s, ID))
}

function medJorder(s: Spilltilstand, n: number): Spilltilstand {
  while ((s.jord[ID]!.jorder ?? 3) < n) s = ok(kjopJorde(s, ID))
  return s
}

/** Mandag morgen etter uka `uke`: høsten betales. Gir det som kom inn. */
function hostMandag(s: Spilltilstand, uke: number): number {
  s.sek = (uke + 1) * UKE_SEK
  const k = s.kontanter
  jordVedDagsskifte(s)
  return s.kontanter - k
}

/**
 * Avlingen for uka `uke` slik mandagen etter regner den: med jordverdien den dagen, som
 * stiger 0,3 % om dagen (en avling regnet en uke før er ~2 % for liten).
 */
function avlingFor(s: Spilltilstand, uke: number) {
  s.sek = (uke + 1) * UKE_SEK
  return gardHostDeler(s, ID, uke * 7, (uke + 1) * UKE_SEK)
}

/** Timer før et kjøp er tjent inn i en snittuke. */
const timer = (pris: number, perUke: number) => pris / (perUke / UKE_SEK) / 3600

describe('maskinene og byggene priset etter avlingen', () => {
  it('en andel av jorda ganger jordene ÷ 3; drivhuset bare etter jorda', () => {
    let s = medGard()
    const land = landverdi(s, ID)
    expect(maskinpris(s, ID, 'traktor')).toBeCloseTo(0.2 * land, 2)
    s = medJorder(s, 10)
    expect(utbyggingsgrunnlag(s, ID)).toBeCloseTo((land * 10) / 3, 2)
    expect(maskinpris(s, ID, 'traktor')).toBeCloseTo((0.2 * land * 10) / 3, 2)
    expect(byggpris(s, ID, 'drenering')).toBeCloseTo((0.25 * land * 10) / 3, 2)
    expect(byggpris(s, ID, 'laave')).toBeCloseTo((0.15 * land * 10) / 3, 2)
    expect(byggpris(s, ID, 'drivhus')).toBeCloseTo(0.6 * land, 2)
    // Før fulgte prisen alt du hadde bygd: en maskin gjorde den neste dyrere. Ikke nå.
    const før = maskinpris(s, ID, 'tresker')
    s = ok(kjopMaskin(s, ID, 'traktor'))
    expect(maskinpris(s, ID, 'tresker')).toBeCloseTo(før, 2)
  })

  it('traktoren tjener seg inn like fort på et småbruk og et gods: 14,9 t (75,8 t på et gods før)', () => {
    let s = medGard()
    const smaa = timer(maskinpris(s, ID, 'traktor'), gardGir(s, ID, { maskin: 'traktor' }))
    s = medJorder(s, 10)
    const gods = timer(maskinpris(s, ID, 'traktor'), gardGir(s, ID, { maskin: 'traktor' }))
    expect(smaa).toBeCloseTo(14.9, 1)
    expect(gods).toBeCloseTo(smaa, 6)
    for (const b of ['drenering', 'frostdekke'] as const) {
      const a = timer(byggpris(medGard(), ID, b), gardGir(medGard(), ID, { bygg: b }))
      expect(timer(byggpris(s, ID, b), gardGir(s, ID, { bygg: b }))).toBeCloseTo(a, 6)
    }
  })

  it('en gård bygd med de gamle prisene beholder det den betalte, i verdien og i salget', () => {
    let s = medJorder(medGard(), 10)
    // Som om jordene kostet 16,1 ganger jorda, slik de gjorde før Pakke 105.
    s.jord[ID]!.investert = 16.1 * landverdi(s, ID)
    const formue = nettoformue(s)
    const etter = ok(kjopMaskin(s, ID, 'traktor'))
    expect(nettoformue(etter)).toBeCloseTo(formue, 0)
    expect(etter.jord[ID]!.investert).toBeCloseTo(16.1 * landverdi(s, ID) + maskinpris(s, ID, 'traktor'), 0)
  })
})

describe('jordene ×1,25', () => {
  it('de sju koster 7,5 ganger jorda, og den tiende er tilbake på under 45 timer', () => {
    let s = medGard()
    const land = landverdi(s, ID)
    let sum = 0
    let siste = 0
    while ((s.jord[ID]!.jorder ?? 3) < MAKS_JORDER) {
      const p = nesteJordpris(s, ID)!
      siste = timer(p, gardGir(s, ID, { jord: true }))
      sum += p
      s = ok(kjopJorde(s, ID))
    }
    expect(sum / land).toBeCloseTo(7.54, 2)
    expect(siste).toBeLessThan(45)
    expect(siste).toBeGreaterThan(35)
  })
})

describe('sprøyta', () => {
  it('+8 % avling hver uke, og en dårlig uke faller 30 % mindre som før', () => {
    let s = medGard()
    const dag = 7
    const uten = gardHost(s, ID, dag, 2 * UKE_SEK)
    s = ok(kjopMaskin(s, ID, 'sproyte'))
    s.jord[ID]!.plantetSek = UKE_SEK
    const f = ukefaktor(dag, false, false)
    const med = gardHost(s, ID, dag, 2 * UKE_SEK)
    expect(med / uten).toBeCloseTo((1.08 * gardsvaer(s.jord[ID]!, f)) / f, 6)
    expect(gardsvaer(s.jord[ID]!, 0.5)).toBeCloseTo(0.65, 6)
  })

  it('tjener seg inn på rundt 17 timer alene, og under 25 etter drenering og frostdekke', () => {
    let s = medGard()
    expect(timer(maskinpris(s, ID, 'sproyte'), gardGir(s, ID, { maskin: 'sproyte' }))).toBeCloseTo(17.1, 0)
    s = ok(kjopGardsbygg(ok(kjopGardsbygg(s, ID, 'drenering')), ID, 'frostdekke'))
    expect(timer(maskinpris(s, ID, 'sproyte'), gardGir(s, ID, { maskin: 'sproyte' }))).toBeLessThan(25)
  })
})

describe('lagre billig, selg dyrt', () => {
  it('målt over 312 uker av prisene: +13,4 % på kornet med silo, +15,3 % med låve', () => {
    expect(lagringsgevinst('korn', 4)).toBeCloseTo(0.134, 3)
    expect(lagringsgevinst('korn', 8)).toBeCloseTo(0.153, 3)
    expect(lagringsgevinst('gronnsaker', 4)).toBeCloseTo(0.124, 3)
    expect(lagringsgevinst('frukt', 4)).toBeCloseTo(0.132, 3)
    expect(lagringsgevinst('korn', 0)).toBe(0)
  })

  it('en ny silo starter på det; en silo fra før som lagret, går over, en som solgte, gjør ikke', () => {
    const s = ok(kjopGardsbygg(medGard(), ID, 'silo'))
    expect(s.jord[ID]!.lagring).toBe('smart')
    const j = s.jord[ID]!
    expect(lagringsvalg({ ...j, lagring: undefined, lagre: true })).toBe('smart')
    expect(lagringsvalg({ ...j, lagring: undefined, lagre: false })).toBe('selg')
    expect(lagringsvalg({ ...j, lagring: 'lagre', lagre: true })).toBe('lagre')
    expect(settLagring(s, ID, 'tull' as never).ok).toBe(false)
  })

  it('lagrer når prisen er lav, og selger alt — avlingen og lageret — når den er ×1,07 eller mer', () => {
    // Finn en uke med lav kornpris fulgt av en med høy.
    let u = 2
    while (!(avlingspris('korn', u) < SELG_DYRT && avlingspris('korn', u + 1) >= SELG_DYRT)) u++
    const s = ok(kjopGardsbygg(medGard(), ID, 'silo'))
    s.jord[ID]!.plantetSek = u * UKE_SEK
    expect(hostMandag(s, u)).toBeCloseTo(0, 2)
    const lager = s.jord[ID]!.lager!
    expect(lager).toBeGreaterThan(0)
    const host = avlingFor(s, u + 1).korn
    const inn = hostMandag(s, u + 1)
    expect(inn).toBeCloseTo(host + lager * (1 - 0.01) * avlingspris('korn', u + 1), 0)
    expect(s.jord[ID]!.lager).toBe(0)
    expect(s.jord[ID]!.siden!.korn).toBeGreaterThan(0)
  })

  it('over to år gir det mer enn å selge hver mandag, og mye mer enn å lagre og aldri selge', () => {
    const spill = (valg: 'selg' | 'lagre' | 'smart') => {
      const s = ok(settLagring(ok(kjopGardsbygg(medGard(), ID, 'silo')), ID, valg))
      s.kontanter = 0
      for (let u = 1; u < 105; u++) hostMandag(s, u)
      return s.kontanter + lagerverdi(s, ID)
    }
    const selg = spill('selg')
    expect(spill('smart') / selg).toBeGreaterThan(1.08)
    expect(spill('lagre') / selg).toBeLessThan(1)
  })
})

describe('låven', () => {
  /** Ti jorder, drivhus, silo og låve, og lageret på «lagre». */
  function fullGard(): Spilltilstand {
    let s = medJorder(medGard(), 10)
    for (const b of ['drivhus', 'silo', 'laave'] as const) s = ok(kjopGardsbygg(s, ID, b))
    return ok(settLagring(s, ID, 'lagre'))
  }

  it('lagrer fire uker grønnsaker og frukt, drivhusets avling med, og åtte uker korn', () => {
    const s = fullGard()
    expect(lagerkapasitet(s, ID, 'gronnsaker')).toBeGreaterThan(0)
    expect(lagerkapasitet(s, ID, 'frukt')).toBeGreaterThan(0)
    const d = avlingFor(s, 1)
    expect(hostMandag(s, 1)).toBeCloseTo(0, 2)
    expect(lagerAv(s.jord[ID], 'gronnsaker')).toBeCloseTo(d.gronnsaker / avlingspris('gronnsaker', 1), 2)
    expect(lagerAv(s.jord[ID], 'frukt')).toBeCloseTo(d.frukt / avlingspris('frukt', 1), 2)
    for (let u = 2; u < 14; u++) hostMandag(s, u)
    expect(lagerAv(s.jord[ID], 'gronnsaker')).toBeLessThanOrEqual(lagerkapasitet(s, ID, 'gronnsaker') + 1e-6)
  })

  it('uten låve selges grønnsakene og frukten mandag som før', () => {
    const s = ok(settLagring(ok(kjopGardsbygg(medJorder(medGard(), 10), ID, 'silo')), ID, 'lagre'))
    expect(lagerkapasitet(s, ID, 'gronnsaker')).toBe(0)
    const d = avlingFor(s, 1)
    expect(hostMandag(s, 1)).toBeCloseTo(d.annet, 2)
    expect(s.jord[ID]!.lagerAnnet).toBeUndefined()
  })

  it('lageret teller i formuen, selges for hånd og følger med når gården selges', () => {
    let s = fullGard()
    hostMandag(s, 1)
    const verdi = lagerverdi(s, ID)
    expect(verdi).toBeGreaterThan(0)
    const solgt = ok(selgKorn(s, ID))
    expect(solgt.kontanter - s.kontanter).toBeCloseTo(verdi, 2)
    expect(nettoformue(solgt)).toBeCloseTo(nettoformue(s), 0)
    expect(solgt.jord[ID]!.lagerAnnet).toBeUndefined()
    expect(selgKorn(solgt, ID).ok).toBe(false)
    const etterSalg = ok(selgJord(s, ID))
    expect(etterSalg.kontanter - s.kontanter).toBeGreaterThan(verdi)
  })

  it('bygd ut midt i uka: grønnsakene og frukten så langt går i låven mandag, ikke tapt', () => {
    const s = fullGard()
    s.jord[ID]!.plantetSek = UKE_SEK
    s.sek = UKE_SEK + 3 * DAG_SEK
    const før = gardHostDeler(s, ID, 7, s.sek)
    const n = ok(kjopMaskin(s, ID, 'traktor'))
    expect(n.jord[ID]!.opptjentAnnet!.gronnsaker).toBeCloseTo(før.gronnsaker, 4)
    expect(n.jord[ID]!.opptjentAnnet!.frukt).toBeCloseTo(før.frukt, 4)
    const resten = avlingFor(n, 1)
    hostMandag(n, 1)
    expect(lagerAv(n.jord[ID], 'frukt')).toBeCloseTo((før.frukt + resten.frukt) / avlingspris('frukt', 1), 2)
    expect(n.jord[ID]!.opptjentAnnet).toBeUndefined()
  })

  it('koster 15 % og tjener seg inn på rundt 13 timer på en full gård med drivhus', () => {
    let s = medJorder(medGard(), 10)
    s = ok(kjopGardsbygg(ok(kjopGardsbygg(s, ID, 'drivhus')), ID, 'silo'))
    expect(timer(byggpris(s, ID, 'laave'), gardGir(s, ID, { bygg: 'laave' }))).toBeCloseTo(13.2, 0)
  })
})
