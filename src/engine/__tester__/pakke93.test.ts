/** Pakke 93: drenering og frostdekke, drivhuset, avlingsprisene, silo og låve. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopGardsbygg, kjopJord, kjopJorde, selgKorn, settLagring, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { DAG_SEK } from '../kalender'
import {
  avlingspris,
  byggpris,
  DRIVHUS_FAKTOR,
  gardHostDeler,
  GRUPPELISTE,
  HOST_ANDEL,
  jordVedDagsskifte,
  jordverdi,
  kornkapasitet,
  kornPerUke,
  KORNSVINN,
  lagerverdi,
  landverdi,
  PRIS_MIN,
  PRIS_SPENN,
  ukefaktor,
  ukeFor,
  vaer,
} from '../jord'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const ID = 'gard-lista' as const
const UKE = 7 * DAG_SEK

/** Et spill som eier gården på Lista, kjøpt mandag morgen den andre uka. */
function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  s.sek = UKE
  return ok(kjopJord(s, ID))
}

/** Mandag morgen etter uka `uke`: høsten betales. Gir det som kom inn. */
function hostMandag(s: Spilltilstand, uke: number): number {
  s.sek = (uke + 1) * UKE
  const k = s.kontanter
  jordVedDagsskifte(s)
  return s.kontanter - k
}

describe('avlingsprisene', () => {
  it('fra ×0,75 til ×1,30, i snitt 1, ny hver uke, egen for hver gruppe og lik i alle spill', () => {
    for (const g of GRUPPELISTE) {
      let sum = 0
      for (let u = 0; u < 4000; u++) {
        const p = avlingspris(g, u)
        expect(p).toBeGreaterThanOrEqual(PRIS_MIN)
        expect(p).toBeLessThanOrEqual(PRIS_MIN + PRIS_SPENN)
        sum += p
      }
      expect(sum / 4000).toBeGreaterThan(0.98)
      expect(sum / 4000).toBeLessThan(1.02)
    }
    expect(avlingspris('korn', 5)).toBe(avlingspris('korn', 5))
    expect(avlingspris('korn', 5)).not.toBe(avlingspris('frukt', 5))
  })
})

describe('drenering og frostdekke', () => {
  it('uten dem: nøyaktig ukas vær fra før', () => {
    for (let u = 0; u < 20; u++) expect(ukefaktor(u * 7, false, false)).toBe(vaer(u * 7).faktor)
  })

  it('aldri verre; over to år gir drenering rundt +13 % og frostdekke rundt +20 %', () => {
    let grunn = 0
    let dren = 0
    let frost = 0
    for (let u = 0; u < 104; u++) {
      const a = ukefaktor(u * 7, false, false)
      const b = ukefaktor(u * 7, true, false)
      const c = ukefaktor(u * 7, false, true)
      expect(b).toBeGreaterThanOrEqual(a)
      expect(c).toBeGreaterThanOrEqual(a)
      grunn += a
      dren += b
      frost += c
    }
    expect(dren / grunn - 1).toBeGreaterThan(0.09)
    expect(dren / grunn - 1).toBeLessThan(0.17)
    expect(frost / grunn - 1).toBeGreaterThan(0.15)
    expect(frost / grunn - 1).toBeLessThan(0.26)
  })

  it('koster 25 og 35 % av gårdens verdi og teller i den: kjøpet flytter bare penger', () => {
    const s = medGard()
    expect(byggpris(s, ID, 'drenering')).toBeCloseTo(0.25 * landverdi(s, ID), 2)
    expect(byggpris(s, ID, 'frostdekke')).toBeCloseTo(0.35 * landverdi(s, ID), 2)
    const etter = ok(kjopGardsbygg(s, ID, 'drenering'))
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s), 0)
    expect(kjopGardsbygg(etter, ID, 'drenering').ok).toBe(false)
  })
})

describe('drivhuset', () => {
  it('krever fem jorder, og gir en ellevte jord: ×0,9 uansett vær, til grønnsakprisen', () => {
    let s = medGard()
    expect(kjopGardsbygg(s, ID, 'drivhus').ok).toBe(false)
    s = ok(kjopJorde(ok(kjopJorde(s, ID)), ID))
    const uten = gardHostDeler(s, ID, 7, 2 * UKE)
    s = ok(kjopGardsbygg(s, ID, 'drivhus'))
    s.jord[ID]!.plantetSek = UKE
    const med = gardHostDeler(s, ID, 7, 2 * UKE)
    const per = (landverdi(s, ID) * HOST_ANDEL) / 3
    expect(med.korn).toBeCloseTo(uten.korn, 2)
    expect(med.annet - uten.annet).toBeCloseTo(per * DRIVHUS_FAKTOR * avlingspris('gronnsaker', ukeFor(7)), 2)
  })
})

describe('silo og låve', () => {
  it('silo: kornet går i lager mandag, inntil fire uker; resten betales; låve krever silo og gir åtte', () => {
    let s = medGard()
    expect(kjopGardsbygg(s, ID, 'laave').ok).toBe(false)
    s = ok(kjopGardsbygg(s, ID, 'silo'))
    expect(s.jord[ID]!.lagre).toBe(true)
    expect(kornkapasitet(s, ID)).toBeCloseTo(4 * kornPerUke(s, ID), 2)
    // Tre jorder er alle korn: første mandag går alt i silo, ingenting betales.
    expect(hostMandag(s, 1)).toBeCloseTo(0, 2)
    expect(s.jord[ID]!.lager).toBeGreaterThan(0)
    // Etter mange uker er siloen full, og det som ikke får plass, selges.
    for (let u = 2; u < 12; u++) hostMandag(s, u)
    expect(s.jord[ID]!.lager!).toBeLessThanOrEqual(kornkapasitet(s, ID) + 1e-6)
    expect(hostMandag(s, 12)).toBeGreaterThan(0)
    s = ok(kjopGardsbygg(s, ID, 'laave'))
    expect(kornkapasitet(s, ID)).toBeCloseTo(8 * kornPerUke(s, ID), 2)
  })

  it('kornet taper 1 % i uka, teller i formuen til ukas pris og selges som avling', () => {
    let s = ok(kjopGardsbygg(medGard(), ID, 'silo'))
    hostMandag(s, 1)
    const lager = s.jord[ID]!.lager!
    expect(jordverdi(s)).toBeGreaterThan(landverdi(s, ID) + s.jord[ID]!.investert!)
    s = ok(settLagring(s, ID, false))
    hostMandag(s, 2)
    expect(s.jord[ID]!.lager).toBeCloseTo(lager * (1 - KORNSVINN), 4)
    const verdi = lagerverdi(s, ID)
    const host = s.totaltHost
    const solgt = ok(selgKorn(s, ID))
    expect(solgt.kontanter - s.kontanter).toBeCloseTo(verdi, 2)
    expect(solgt.totaltHost - host).toBeCloseTo(verdi, 2)
    expect(solgt.jord[ID]!.lager).toBe(0)
    expect(nettoformue(solgt)).toBeCloseTo(nettoformue(s), 0)
    expect(selgKorn(solgt, ID).ok).toBe(false)
  })

  it('uten lagring selges kornet mandag som før', () => {
    const s = ok(settLagring(ok(kjopGardsbygg(medGard(), ID, 'silo')), ID, false))
    expect(hostMandag(s, 1)).toBeGreaterThan(0)
    expect(s.jord[ID]!.lager ?? 0).toBe(0)
  })
})
