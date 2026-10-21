/** Pakke 125: en forvalter som lærer — trinn, konjunkturen og renten. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { forvalterBelop, kjopForvaltertrinn, startForvalter, stoppForvalter, type Utfall } from '../handlinger'
import { eiendeler, nettoformue, sparerente } from '../formler'
import { DAG_SEK } from '../kalender'
import { klasseverdier } from '../portefolje'
import { fase, FASE_DAGER, type Fase } from '../verden'
import {
  blanding,
  blandingNaa,
  FORVALTER_GEBYR,
  FORVALTER_GEBYR_LAV,
  FORVALTERTRINN,
  forvaltertrinnpris,
  forvaltetVerdi,
  forvalterVedDagsskifte,
  gebyrsats,
  PROFILLISTE,
} from '../forvalter'
import type { Spilltilstand } from '../types'
import { Formuesforvalter } from '../../ui/komponenter/Formuesforvalter'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

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

/** Første periode (en mandag) med denne konjunkturen. */
function iFase(s: Spilltilstand, f: Fase): Spilltilstand {
  for (let p = 0; p < 200; p++) {
    s.sek = p * FASE_DAGER * DAG_SEK
    if (fase(s) === f) return s
  }
  throw new Error(f)
}

const aksjeandel = (m: Map<string, number>) => [...m].filter(([k]) => !['fond', 'kort', 'lang', 'konto', 'GLD', 'OLJ', 'LAK'].includes(k)).reduce((a, [, v]) => a + v, 0)

describe('trinnene', () => {
  it('koster 0,5 %, 1,5 % og 0,5 % av nettoformuen, én gang, og blir stående når forvalteren sies opp', () => {
    let s = rik()
    expect(FORVALTERTRINN.map((t) => t.andel)).toEqual([0.005, 0.015, 0.005])
    for (let i = 0; i < 3; i++) {
      const pris = forvaltertrinnpris(s)!
      expect(pris).toBeCloseTo(FORVALTERTRINN[i].andel * nettoformue(s), 0)
      const forbruk = s.totaltForbruk
      s = ok(kjopForvaltertrinn(s))
      expect(s.totaltForbruk - forbruk).toBeCloseTo(pris, 0)
    }
    expect(s.forvaltertrinn).toBe(3)
    expect(forvaltertrinnpris(s)).toBeNull()
    expect(kjopForvaltertrinn(s).ok).toBe(false)
    s = ok(startForvalter(s, 'balansert'))
    s = ok(stoppForvalter(s))
    expect(s.forvaltertrinn).toBe(3)
  })

  it('første trinn senker gebyret fra 0,2 til 0,15 % i uka', () => {
    let s = rik()
    expect(gebyrsats(s)).toBe(FORVALTER_GEBYR)
    s = ok(kjopForvaltertrinn(s))
    expect(gebyrsats(s)).toBe(FORVALTER_GEBYR_LAV)
    s = ok(startForvalter(s, 'balansert'))
    s = ok(forvalterBelop(s, 1e9))
    s.sek = 7 * DAG_SEK
    const v = forvaltetVerdi(s)
    const før = s.forvalter!.gebyrBetalt
    forvalterVedDagsskifte(s)
    expect(s.forvalter!.gebyrBetalt - før).toBeCloseTo(FORVALTER_GEBYR_LAV * v, 0)
  })
})

describe('konjunkturen vipper blandingen', () => {
  it('Balansert: aksjene 25 → 35 % i høykonjunktur, 15 % i lavkonjunktur; gullet motsatt', () => {
    expect(aksjeandel(blanding('balansert'))).toBeCloseTo(0.25, 10)
    expect(aksjeandel(blanding('balansert', 'hoy'))).toBeCloseTo(0.35, 10)
    expect(blanding('balansert', 'hoy').get('GLD')).toBeUndefined()
    expect(aksjeandel(blanding('balansert', 'lav'))).toBeCloseTo(0.15, 10)
    expect(blanding('balansert', 'lav').get('GLD')).toBeCloseTo(0.2, 10)
    expect(aksjeandel(blanding('balansert', 'normal'))).toBeCloseTo(0.25, 10)
  })

  it('hver profil summerer til 1 i hver konjunktur; Offensiv tar fra fondet når gullet er brukt', () => {
    for (const p of PROFILLISTE)
      for (const f of [undefined, 'hoy', 'normal', 'lav'] as const)
        for (const rente of [false, true]) expect([...blanding(p, f, rente).values()].reduce((a, x) => a + x, 0), `${p} ${f} ${rente}`).toBeCloseTo(1, 10)
    expect(blanding('offensiv', 'hoy').get('fond')).toBeCloseTo(0.25, 10)
  })
})

describe('renteposten følger renten', () => {
  it('10-årige i høykonjunktur, kontoen i lavkonjunktur, 2-årige ellers — bare med trinn 3', () => {
    expect(blanding('forsiktig', 'hoy', true).get('lang')).toBeCloseTo(0.5, 10)
    expect(blanding('forsiktig', 'lav', true).get('konto')).toBeCloseTo(0.5, 10)
    expect(blanding('forsiktig', 'normal', true).get('kort')).toBeCloseTo(0.5, 10)
    expect(blanding('forsiktig', 'hoy').get('kort')).toBeCloseTo(0.5, 10)
  })

  it('blandingen følger trinnene: uten vipp, med vipp, med vipp og rente', () => {
    let s = iFase(rik(), 'hoy')
    s = ok(startForvalter(s, 'forsiktig'))
    expect(aksjeandel(blandingNaa(s))).toBeCloseTo(0.1, 10)
    s.forvaltertrinn = 2
    expect(aksjeandel(blandingNaa(s))).toBeCloseTo(0.2, 10)
    expect(blandingNaa(s).get('kort')).toBeDefined()
    s.forvaltertrinn = 3
    expect(blandingNaa(s).get('lang')).toBeDefined()
  })

  it('forvalterkontoen får sparekontoens rente, står i formuen og går til sparekontoen ved oppsigelse', () => {
    let s = iFase(rik(), 'lav')
    s.forvaltertrinn = 3
    s = ok(startForvalter(s, 'forsiktig'))
    s = ok(forvalterBelop(s, 1e9))
    const konto = s.forvalter!.konto!
    expect(konto / forvaltetVerdi(s)).toBeGreaterThan(0.45)
    expect(s.obligasjoner?.kort).toBeUndefined()
    // I formuen og i sparekontoens klasse.
    const uten = { ...s, forvalter: { ...s.forvalter!, konto: 0 } }
    expect(eiendeler(s) - eiendeler(uten)).toBeCloseTo(konto, 0)
    expect(klasseverdier(s).sparing).toBeCloseTo(s.sparing + konto, 0)
    // Ett sekund: sparekontoens rente.
    const rente = (konto * sparerente(s)) / 3600
    const t = simuler(s, 1)
    expect(t.forvalter!.konto! - konto).toBeCloseTo(rente, 2)
    // Oppsigelse: til sparekontoen, med kostprisen.
    const sparing = t.sparing
    const u = ok(stoppForvalter(t))
    expect(u.sparing - sparing).toBeCloseTo(t.forvalter!.konto!, 0)
    expect(u.sparingKostpris! - (t.sparingKostpris ?? 0)).toBeCloseTo(t.forvalter!.kontoKostpris!, 0)
  })
})

describe('kortet', () => {
  it('viser trinnene, gebyret og hva forvalteren holder nå', () => {
    let s = iFase(rik(), 'hoy')
    s = ok(startForvalter(s, 'balansert'))
    let html = tekst(createElement(Formuesforvalter, { s }))
    expect(html).toContain('Trinn 1: Lavere gebyr')
    expect(html).toMatch(/Kjøp · kr/)
    expect(html).toContain('Etter trinn 1')
    expect(html).toContain('gebyr 0,2 %')
    s = ok(kjopForvaltertrinn(s))
    s = ok(kjopForvaltertrinn(s))
    html = tekst(createElement(Formuesforvalter, { s }))
    expect(html).toContain('Kjøpt')
    expect(html).toContain('gebyr 0,15 %')
    expect(html).toContain('Høykonjunktur: aksjer 35 %, gull 0 % · 2-årige obligasjoner')
  })
})
