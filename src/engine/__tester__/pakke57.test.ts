/**
 * Pakke 57 — rettferdig eiendom. Tre smutthull fra kodegjennomgangen
 * 8. oktober, gjenskapt og stengt: en gård som betalte hele uka for én natt,
 * en forvalter som dekket alt du kjøpte etter at han ble ansatt, og enheter
 * som var billigere å kjøpe ferdig oppusset enn å pusse opp selv.
 */

import { describe, expect, it } from 'vitest'
import { ansettForvalter, kjopEiendom, kjopJord, pussOpp, selgEiendom, selgJord } from '../handlinger'
import { eiendomspris, EIENDOMSTYPER, forvalterpaaslag, kjopsprisEiendom, oppussingspris, STANDARDER } from '../eiendom'
import { eiendomskurs } from '../regioner'
import { HOST_ANDEL, landverdi, vaer } from '../jord'
import { DAG_SEK, dagnummer } from '../kalender'
import { nettoformue } from '../formler'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import type { Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rikt(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e11
  s.hoyesteFormue = 1e12
  return s
}

const UKE = 7 * DAG_SEK

describe('gårdene: avlingen for dagene du eide gården', () => {
  it('kjøpt søndag kveld og solgt mandag morgen gir tap — før +4,5 til +13 %', () => {
    for (const uke of [1, 9]) {
      // To sekunder før mandag, så tre sekunder frem: over dagsskiftet.
      const før = simuler(rikt(), uke * UKE - 2)
      const uten = simuler(før, 3)
      const etter = ok(selgJord(simuler(ok(kjopJord(før, 'gard-lista')), 3), 'gard-lista'))
      expect(etter.kontanter - uten.kontanter, `uke ${uke}`).toBeLessThan(0)
      expect(nettoformue(etter), `uke ${uke}`).toBeLessThan(nettoformue(uten))
    }
  })

  it('en hel uke gir hele avlingen, som før', () => {
    // Kjøpt mandag morgen i uke 1, rett etter forrige avling.
    const s = ok(kjopJord(simuler(rikt(), UKE), 'gard-hedmarken'))
    const mandag = simuler(s, UKE)
    // Uka fra dag 7 til 14, eid hele tiden.
    expect(mandag.totaltHost - s.totaltHost).toBeCloseTo(landverdi(mandag, 'gard-hedmarken') * HOST_ANDEL * vaer(7).faktor, 0)
  })

  it('kjøpt midt i uka gir avling for dagene igjen; solgt midt i uka gir avlingen så langt', () => {
    // Kjøpt onsdag morgen i uke 1: fem av sju dager til mandag.
    const s = ok(kjopJord(simuler(rikt(), UKE + 2 * DAG_SEK), 'gard-hedmarken'))
    const mandag = simuler(s, 5 * DAG_SEK)
    expect(mandag.totaltHost - s.totaltHost).toBeCloseTo(landverdi(mandag, 'gard-hedmarken') * HOST_ANDEL * vaer(7).faktor * (5 / 7), 0)
    // Solgt torsdag morgen uka etter: tre dager eid.
    const torsdag = simuler(mandag, 3 * DAG_SEK)
    const solgt = ok(selgJord(torsdag, 'gard-hedmarken'))
    const forventet = landverdi(torsdag, 'gard-hedmarken') * HOST_ANDEL * vaer(dagnummer(torsdag.sek)).faktor * (3 / 7)
    expect(solgt.totaltHost - torsdag.totaltHost).toBeCloseTo(forventet, 0)
  })
})

describe('forvalteren tar sitt av det du kjøper senere', () => {
  it('et kjøp i en by med forvalter koster 5 % ekstra — før kr 100 000 for alt', () => {
    let s = ok(kjopEiendom(rikt(), 'hybel-oslo'))
    s = ok(ansettForvalter(s, 'Oslo', 'lokal'))
    const pris = kjopsprisEiendom(s, 'kontorbygg')
    expect(forvalterpaaslag(s, 'kontorbygg')).toBeCloseTo(pris * 0.05)
    const etter = ok(kjopEiendom(s, 'kontorbygg'))
    expect(s.kontanter - etter.kontanter).toBeCloseTo(pris * 1.05)
    expect(etter.totaltForbruk - s.totaltForbruk).toBeCloseTo(pris * 0.05)
    // Uten forvalter i byen: ingen påslag.
    expect(forvalterpaaslag(rikt(), 'kontorbygg')).toBe(0)
  })

  it('forvalteren slutter når du har solgt alt i byen', () => {
    let s = ok(kjopEiendom(rikt(), 'hybel-oslo'))
    s = ok(kjopEiendom(s, 'hybel-oslo'))
    s = ok(ansettForvalter(s, 'Oslo', 'lokal'))
    s = ok(selgEiendom(s, 'hybel-oslo'))
    expect(s.forvaltere?.Oslo).toBe('lokal')
    s = ok(selgEiendom(s, 'hybel-oslo'))
    expect(s.forvaltere?.Oslo).toBeUndefined()
  })
})

describe('en ny enhet i et oppusset bygg koster oppussingen den hopper over', () => {
  it('prisen er grunnprisen pluss oppussingene; verdien er standardens', () => {
    const s = rikt()
    const grunn = EIENDOMSTYPER.leilighet.pris * eiendomskurs(s, 'Oslo')
    expect(kjopsprisEiendom(s, 'leilighet')).toBeCloseTo(grunn)
    let sum = 1
    for (let st = 1; st < STANDARDER.length; st++) {
      sum += STANDARDER[st].kostnad
      const m = structuredClone(s)
      m.eiendommer.leilighet = 1
      m.eiendomStandard.leilighet = st
      expect(kjopsprisEiendom(m, 'leilighet')).toBeCloseTo(grunn * sum)
      expect(eiendomspris(m, 'leilighet')).toBeCloseTo(grunn * STANDARDER[st].verdi)
    }
    expect(sum).toBeCloseTo(1.65)
  })

  it('seks leiligheter på Luksus koster det samme begge veier — før 7 % billigere å kjøpe ferdig', () => {
    const s = rikt()
    // Oppussingen fullføres med en gang, så eiendomsindeksen står stille mellom kjøpene.
    const ferdig = (x: Spilltilstand, st: number): Spilltilstand => ({ ...x, oppussing: {}, eiendomStandard: { ...x.eiendomStandard, leilighet: st } })
    // Kjøp seks og pusse opp to ganger …
    let a = s
    for (let i = 0; i < 6; i++) a = ok(kjopEiendom(a, 'leilighet'))
    let oppussing = 0
    for (let st = 1; st <= 2; st++) {
      oppussing += oppussingspris(a, 'leilighet')!
      a = ferdig(ok(pussOpp(a, 'leilighet')), st)
    }
    const veiA = s.kontanter - a.kontanter
    expect(veiA - oppussing).toBeCloseTo(6 * kjopsprisEiendom(s, 'leilighet'))
    // … eller kjøp én, puss den opp to ganger, og kjøp fem til ferdig oppusset.
    let b = ok(kjopEiendom(s, 'leilighet'))
    for (let st = 1; st <= 2; st++) b = ferdig(ok(pussOpp(b, 'leilighet')), st)
    for (let i = 0; i < 5; i++) b = ok(kjopEiendom(b, 'leilighet'))
    const veiB = s.kontanter - b.kontanter
    expect(veiB / veiA).toBeCloseTo(1, 9)
    expect(b.eiendommer.leilighet).toBe(6)
    expect(nettoformue(b)).toBeCloseTo(nettoformue(a))
  })
})
