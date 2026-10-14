/**
 * Pakke 106: dyr som er forskjellige og ull du ser, skog som sier når den bør hogges,
 * og jord som følger regionen sin.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopDyr, kjopGardsbygg, kjopJord, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { eiendomsverdi } from '../eiendom'
import { DAG_SEK, dagFra, dato } from '../kalender'
import { dagerTilHogst, HOGST_BEST_DAG, JORD, jordfaktor, landverdi, tommerfaktor, tommervekst, tommerverdi } from '../jord'
import { DYR, DYRLISTE, dyrGir, dyrKasseNaa, dyrOpptjent, dyrpris, dyrVedDagsskifte, nesteKlipping, nesteSlakt, SLAKT_DAGER, tilskudd } from '../dyr'
import { byfaktor, regionFor } from '../regioner'
import { simuler } from '../simulering'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const ID = 'gard-lista' as const
const SKOG = 'skog-trysil' as const
const UKE_TIMER = (7 * DAG_SEK) / 3600

function medFjos(dag = 7): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  s.sek = dag * DAG_SEK
  return ok(kjopGardsbygg(ok(kjopJord(s, ID)), ID, 'fjos'))
}

describe('dyr som er forskjellige', () => {
  it('kua 4 %, grisen 5,5 %, sauen 6 % og høna 7 % av prisen i uka', () => {
    expect(DYRLISTE.map((d) => DYR[d].uke)).toEqual([0.04, 0.07, 0.06, 0.055])
  })

  it('de billige tjener seg inn fortere, kua gir mest per plass i fjøset', () => {
    const s = medFjos()
    const timer = (d: (typeof DYRLISTE)[number]) => dyrpris(s, ID, d) / (dyrpris(s, ID, d) * DYR[d].uke) * UKE_TIMER
    expect(timer('ku')).toBeCloseTo(14.6, 1)
    expect(timer('gris')).toBeCloseTo(10.6, 1)
    expect(timer('sau')).toBeCloseTo(9.7, 1)
    expect(timer('hone')).toBeCloseTo(8.3, 1)
    const perPlass = (d: (typeof DYRLISTE)[number]) => dyrpris(s, ID, d) * DYR[d].uke
    expect(perPlass('ku')).toBeGreaterThan(perPlass('gris'))
    expect(perPlass('gris')).toBeGreaterThan(perPlass('sau'))
    expect(perPlass('sau')).toBeGreaterThan(perPlass('hone'))
    // Linja på raden tar med tilskuddet, fordelt over året.
    expect(dyrGir(s, ID, 'ku')).toBeGreaterThan(perPlass('ku'))
    expect(dyrGir(s, ID, 'ku') / perPlass('ku')).toBeLessThan(1.07)
  })

  it('høna betaler hver dag sine 7 % i uka', () => {
    const s = ok(kjopDyr(medFjos(), ID, 'hone'))
    const pris = dyrpris(s, ID, 'hone')
    s.sek = 8 * DAG_SEK
    const k = s.kontanter
    dyrVedDagsskifte(s)
    expect((s.kontanter - k) / ((pris * 0.07) / 7)).toBeCloseTo(1, 2)
  })
})

describe('ulla og kjøttet som venter', () => {
  it('teller i formuen fra dagen det vokser, så klippedagen ikke flytter formuen', () => {
    const mai = dagFra(2027, 4, 1)
    let s = ok(kjopDyr(ok(kjopDyr(medFjos(mai - 40), ID, 'sau')), ID, 'sau'))
    for (let d = mai - 39; d < mai; d++) {
      s.sek = d * DAG_SEK
      dyrVedDagsskifte(s)
    }
    // Sekundet dagen skifter: formuen regnes før dagsskiftet, og gårsdagens ull må være med.
    s.sek = mai * DAG_SEK
    const ull = dyrKasseNaa(s, ID).ull
    expect(ull).toBeGreaterThan(0)
    expect(dyrOpptjent(s)).toBeCloseTo(ull + dyrKasseNaa(s, ID).daglig + dyrKasseNaa(s, ID).slakt, 4)
    const før = nettoformue(s)
    const kontanter = s.kontanter
    const verdi = eiendomsverdi(s)
    const stotte = tilskudd(s, ID)
    dyrVedDagsskifte(s)
    // Ulla gikk fra gården til kontantene; tilskuddet 1. mai kom i tillegg — formuen flyttet bare det.
    expect(s.kontanter - kontanter).toBeCloseTo(ull + stotte, 0)
    expect(verdi - eiendomsverdi(s)).toBeCloseTo(ull, 0)
    expect(nettoformue(s) - før).toBeCloseTo(stotte, 0)
    expect(dyrKasseNaa(s, ID).ull).toBe(0)
  })

  it('neste klipping er 1. mai eller 1. september, og slakten hver åttende uke', () => {
    const mai = dagFra(2027, 4, 1)
    expect(nesteKlipping(mai - 1)).toBe(mai)
    const sep = nesteKlipping(mai)
    expect(dato(sep).dag).toBe(1)
    expect(dato(sep).maaned).toBe(8)
    expect(nesteSlakt(0)).toBe(SLAKT_DAGER)
    expect(nesteSlakt(SLAKT_DAGER)).toBe(2 * SLAKT_DAGER)
    expect(nesteSlakt(SLAKT_DAGER - 1)).toBe(SLAKT_DAGER)
  })

  it('uten dyr er eiendommens verdi nøyaktig som før', () => {
    const s = medFjos()
    expect(dyrOpptjent(s)).toBe(0)
  })
})

describe('skog som sier når den bør hogges', () => {
  function medSkog(): Spilltilstand {
    const s = nyttSpill()
    s.kontanter = 1e13
    s.hoyesteFormue = 1e13
    return ok(kjopJord(s, SKOG))
  }

  it('veksten nå er tømmerets stigning per dag, størst ved dag 18', () => {
    const s = medSkog()
    const plantet = s.jord[SKOG]!.plantetSek
    const vekst = (dager: number) => {
      s.sek = plantet + dager * DAG_SEK
      return tommervekst(s, SKOG)
    }
    // Mot tallet regnet ut: tømmeret om litt minus nå, med samme jordverdi.
    s.sek = plantet + 10 * DAG_SEK
    const land = landverdi(s, SKOG)
    const h = 1e-4
    expect(tommervekst(s, SKOG) / ((land * (tommerfaktor(10 + h) - tommerfaktor(10 - h))) / (2 * h))).toBeCloseTo(1, 4)
    // Jorda stiger 0,3 % om dagen, så sammenlign et stykke unna toppen.
    expect(vekst(18)).toBeGreaterThan(vekst(12))
    expect(vekst(18)).toBeGreaterThan(vekst(26))
  })

  it('hogst gir mest per dag ved dag 36; kortet teller ned til da', () => {
    const snitt = (d: number) => tommerfaktor(d) / d
    expect(HOGST_BEST_DAG).toBe(36)
    expect(snitt(36)).toBeGreaterThan(snitt(35))
    expect(snitt(36)).toBeGreaterThan(snitt(37))
    // Fra dag 28 til 46 er det under 2 % fra det beste.
    expect(snitt(28) / snitt(36)).toBeGreaterThan(0.98)
    expect(snitt(46) / snitt(36)).toBeGreaterThan(0.98)
    const s = medSkog()
    s.sek = s.jord[SKOG]!.plantetSek + 10 * DAG_SEK
    expect(dagerTilHogst(s, SKOG)).toBeCloseTo(26, 6)
    s.sek += 40 * DAG_SEK
    expect(dagerTilHogst(s, SKOG)).toBe(0)
    expect(tommervekst({ ...s, jord: {} }, SKOG)).toBe(0)
  })
})

describe('jord som følger regionen sin', () => {
  it('hver jord hører til en region, og verdien ganges med regionens faktor', () => {
    const s = nyttSpill()
    expect(regionFor('Hedmarken')).toBe('oslo')
    expect(regionFor('Lista')).toBe('stavanger')
    expect(regionFor('Trysil')).toBe('fjellet')
    expect(regionFor('Namdalen')).toBe('trondelag')
    for (const id of Object.keys(JORD) as (keyof typeof JORD)[]) {
      expect(landverdi(s, id)).toBeCloseTo(JORD[id].pris * jordfaktor(s) * byfaktor(s, JORD[id].by), 4)
    }
  })

  it('avlingen, dyrene og tømmeret følger med når regionen stiger', () => {
    let s = medFjos()
    s = ok(kjopJord(s, SKOG))
    s.jord[SKOG]!.plantetSek = s.sek - 20 * DAG_SEK
    const før = { land: landverdi(s, ID), ku: dyrpris(s, ID, 'ku'), tommer: tommerverdi(s, SKOG) }
    const opp = structuredClone(s)
    opp.marked.regioner!.indekser.stavanger.avvik += 0.05
    opp.marked.regioner!.indekser.fjellet.avvik += 0.05
    expect(landverdi(opp, ID) / før.land).toBeCloseTo(Math.exp(0.05), 6)
    expect(dyrpris(opp, ID, 'ku') / før.ku).toBeCloseTo(Math.exp(0.05), 6)
    expect(tommerverdi(opp, SKOG) / før.tommer).toBeCloseTo(Math.exp(0.05), 6)
    // Hedmarken følger Oslo, ikke Stavanger.
    expect(landverdi(opp, 'gard-hedmarken')).toBeCloseTo(landverdi(s, 'gard-hedmarken'), 4)
  })

  it('svinger rundt 1 og trekkes tilbake, som husene: tolv timer spill', () => {
    let s = nyttSpill()
    const faktorer: number[] = []
    for (let t = 0; t < 72; t++) {
      s = simuler(s, 600, true)
      faktorer.push(byfaktor(s, 'Lista'))
    }
    const snitt = faktorer.reduce((a, b) => a + b, 0) / faktorer.length
    expect(snitt).toBeGreaterThan(0.93)
    expect(snitt).toBeLessThan(1.07)
    expect(Math.min(...faktorer)).toBeGreaterThan(0.8)
    expect(Math.max(...faktorer)).toBeLessThan(1.25)
    expect(Math.max(...faktorer) - Math.min(...faktorer)).toBeGreaterThan(0.02)
  })
})
