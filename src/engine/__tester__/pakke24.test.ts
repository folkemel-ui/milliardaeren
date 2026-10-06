/** Pakke 24: regionale eiendomspriser. */

import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { simuler } from '../simulering'
import { nettoformue } from '../formler'
import { eiendomspris, EIENDOMSTYPER, leieHverPerSek } from '../eiendom'
import { byfaktor, eiendomskurs, regionEndring, regionFor, REGIONLISTE } from '../regioner'
import { landemerkepris, LANDEMERKER } from '../landemerker'
import { DAG_SEK } from '../kalender'
import { migrer } from '../../state/migrering'
import type { Spilltilstand } from '../types'

describe('regionale eiendomspriser', () => {
  it('byene hører til hver sin region, og utlandet følger landet (Trøndelag og Nord fra Pakke 44)', () => {
    expect(regionFor('Oslo')).toBe('oslo')
    expect(regionFor('Hedmarken')).toBe('oslo')
    expect(regionFor('Lista')).toBe('stavanger')
    expect(regionFor('Geilo')).toBe('fjellet')
    expect(regionFor('Trondheim')).toBe('trondelag')
    expect(regionFor('Lofoten')).toBe('nord')
    expect(regionFor('Dubai')).toBeNull()
  })

  it('starter likt med landet, med historikk like lang som landsindeksen', () => {
    const s = nyttSpill()
    for (const r of REGIONLISTE) {
      expect(s.marked.regioner.indekser[r].avvik).toBe(0)
      expect(s.marked.regioner.indekser[r].historikk).toHaveLength(s.marked.eiendom.historikk.length)
    }
    for (const id of Object.keys(EIENDOMSTYPER) as (keyof typeof EIENDOMSTYPER)[]) {
      expect(eiendomspris(s, id)).toBeCloseTo(EIENDOMSTYPER[id].pris * s.marked.eiendom.kurs)
    }
  })

  it('går hver sin vei, men holder seg nær landet', () => {
    const s = simuler(nyttSpill(), 2 * DAG_SEK)
    const faktorer = (['Oslo', 'Bergen', 'Stavanger', 'Geilo'] as const).map((by) => byfaktor(s, by))
    // Ikke alle like …
    expect(new Set(faktorer.map((f) => f.toFixed(4))).size).toBeGreaterThan(1)
    // … men aldri langt unna landsindeksen.
    for (const f of faktorer) {
      expect(f).toBeGreaterThan(0.7)
      expect(f).toBeLessThan(1.4)
    }
    // Utlandet følger landsindeksen.
    expect(byfaktor(s, 'Dubai')).toBe(1)
  })

  it('priser, leie og landemerker følger byens region', () => {
    const s = simuler(nyttSpill(), DAG_SEK)
    const oslo = eiendomskurs(s, 'Oslo')
    expect(landemerkepris(s, 'tarnet')).toBeCloseTo(LANDEMERKER.tarnet.pris * oslo)
    const id = (Object.keys(EIENDOMSTYPER) as (keyof typeof EIENDOMSTYPER)[]).find((x) => EIENDOMSTYPER[x].by === 'Bergen')!
    const t = EIENDOMSTYPER[id]
    expect(eiendomspris(s, id)).toBeCloseTo(t.pris * eiendomskurs(s, 'Bergen'))
    expect(leieHverPerSek(s, id)).toBeCloseTo((t.pris * eiendomskurs(s, 'Bergen') * t.avkastning) / 3600)
  })

  it('endringen over to timer regnes fra historikken', () => {
    const s = simuler(nyttSpill(), 3 * 3600)
    const land = s.marked.eiendom
    expect(regionEndring(s, null)).toBeCloseTo(land.kurs / land.historikk[0] - 1)
    const i = s.marked.regioner.indekser.oslo
    expect(regionEndring(s, 'oslo')).toBeCloseTo((land.kurs * Math.exp(i.avvik)) / (land.historikk[0] * Math.exp(i.historikk[0])) - 1)
  })

  it('rører ikke terningen: aksjene og kryptoen blir de samme', () => {
    const med = simuler(nyttSpill(), 6 * 3600)
    const uten = nyttSpill()
    ;(uten.marked as { regioner?: unknown }).regioner = undefined
    const utenEtter = simuler(uten, 6 * 3600)
    expect(med.frø).toBe(utenEtter.frø)
    expect(med.marked.kurser).toEqual(utenEtter.marked.kurser)
    expect(med.marked.eiendom).toEqual(utenEtter.marked.eiendom)
  })
})

describe('migrering 15 → 16', () => {
  /** En versjon 15-lagring: spillet uten regioner. */
  function v15(): Record<string, unknown> {
    const kopi = structuredClone(simuler(nyttSpill(), 3600)) as unknown as { marked: { regioner?: unknown } }
    delete kopi.marked.regioner
    return { ...kopi, versjon: 15 }
  }

  it('gir regioner med full historikk, og alle verdier står som før', () => {
    const gammel = v15()
    const r = migrer(gammel)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    for (const reg of REGIONLISTE) {
      expect(r.tilstand.marked.regioner.indekser[reg].avvik).toBe(0)
      expect(r.tilstand.marked.regioner.indekser[reg].historikk).toHaveLength(r.tilstand.marked.eiendom.historikk.length)
    }
    expect(nettoformue(r.tilstand)).toBeCloseTo(nettoformue(gammel as unknown as Spilltilstand))
    // Og spillet går videre.
    expect(() => simuler(r.tilstand, 600)).not.toThrow()
  })

  it('en ødelagt lagring gir en feilmelding, ikke et krasj', () => {
    expect(() => migrer({ versjon: 15 })).not.toThrow()
    const r = migrer({ versjon: 15 })
    expect(r.ok).toBe(false)
  })
})
