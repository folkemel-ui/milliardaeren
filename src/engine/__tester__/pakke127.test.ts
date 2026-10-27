/** Pakke 127: en forvalter du kan se — regnskapet, skyggekontoen, kurven og linja i søndagsavisa. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { forvalterBelop, settForvalterinnskudd, startForvalter, stoppForvalter, type Utfall } from '../handlinger'
import { sparerente } from '../formler'
import { DAG_SEK } from '../kalender'
import { betalUtMaal, forvalterResultat, forvaltetVerdi, KURVE_DAGER, ukeresultat, utbytteIDag } from '../forvalter'
import { bedrift } from './hjelp'
import type { Spilltilstand } from '../types'
import { Formuesforvalter } from '../../ui/komponenter/Formuesforvalter'
import { UkaDi } from '../../ui/komponenter/UkaDi'

// Linjegraf bruker CSS.escape, som Node ikke har.
vi.stubGlobal('CSS', { escape: (x: string) => x })

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill med 1 mrd hos forvalteren, mandag dag 0. */
function forvaltet(profil: Parameters<typeof startForvalter>[1] = 'balansert'): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  s = ok(startForvalter(s, profil))
  return ok(forvalterBelop(s, 1e9))
}

describe('regnskapet', () => {
  it('starter med forvalteren: det den overtar og det du gir, føres inn, og skyggekontoen får det samme', () => {
    const s = forvaltet()
    const r = s.forvalter!.regnskap!
    expect(r.fra).toBe(s.forvalter!.fra)
    expect(r.inn).toBeGreaterThan(0.99e9)
    expect(r.inn).toBeLessThanOrEqual(1e9 + 1)
    expect(r.skygge).toBeCloseTo(r.inn, 0)
    // Startgebyret var på det den overtok (ingenting), så gebyret står på null.
    expect(forvalterResultat(s)!.gebyr).toBeCloseTo(0, 0)
  })

  it('gevinsten er det den har, pluss det den har betalt ut og gitt i utbytte, minus det den fikk og gebyrene', () => {
    let s = forvaltet()
    s = simuler(s, 9 * DAG_SEK)
    const r = s.forvalter!.regnskap!
    const res = forvalterResultat(s)!
    const gebyr = s.forvalter!.gebyrBetalt - r.gebyr0
    expect(gebyr).toBeGreaterThan(0)
    expect(res.gebyr).toBeCloseTo(gebyr, 0)
    expect(res.gevinst).toBeCloseTo(forvaltetVerdi(s) + r.ut + r.utbytte - r.inn - gebyr, 0)
    expect(res.mer).toBeCloseTo(res.gevinst - res.spar, 0)
  })

  it('skyggekontoen får sparekontoens rente hvert sekund', () => {
    let s = forvaltet()
    const for_ = s.forvalter!.regnskap!.skygge
    const sats = sparerente(s)
    s = simuler(s, 600)
    const etter = s.forvalter!.regnskap!.skygge
    expect(etter / for_ - 1).toBeCloseTo(sats / 6, 4)
  })

  it('et uttak føres ut og trekkes fra skyggekontoen', () => {
    let s = forvaltet()
    s.sek = DAG_SEK + 10
    const r0 = { ...s.forvalter!.regnskap! }
    const kontanter = s.kontanter
    s = ok(forvalterBelop(s, -2e8))
    const ut = s.kontanter - kontanter
    expect(ut).toBeGreaterThan(1.98e8)
    expect(s.forvalter!.regnskap!.ut - r0.ut).toBeCloseTo(ut, 0)
    expect(r0.skygge - s.forvalter!.regnskap!.skygge).toBeCloseTo(ut, 0)
  })

  it('andelen av inntekten føres inn hvert sekund', () => {
    let s = forvaltet()
    s.bedrifter = [bedrift('bank', { nivaa: 50, leder: true })]
    s = ok(settForvalterinnskudd(s, 0.5))
    s.sek = DAG_SEK + 10
    const inn = s.forvalter!.regnskap!.inn
    const konto = s.forvalter!.konto ?? 0
    s = simuler(s, 1)
    expect(s.forvalter!.regnskap!.inn - inn).toBeGreaterThan(0)
    expect(s.forvalter!.regnskap!.inn - inn).toBeCloseTo((s.forvalter!.konto ?? 0) - konto, -2)
  })

  it('sparemålets utbetaling føres ut', () => {
    const s = forvaltet()
    s.sek = DAG_SEK
    s.forvalter!.maal = { belop: 3e8, navn: 'x' }
    const ut = betalUtMaal(s)
    expect(ut).toBeGreaterThan(2.9e8)
    expect(s.forvalter!.regnskap!.ut).toBeCloseTo(ut, 0)
  })

  it('utbyttet og kupongene det den har, føres som dens utbytte', () => {
    let s = forvaltet('utbytte')
    const r0 = s.forvalter!.regnskap!.utbytte
    const u0 = s.totaltUtbytte
    expect(utbytteIDag(s)).toBeGreaterThan(0)
    // Over dagsskiftet til tirsdag: aksjeutbyttet, og kupongene hvert sekund.
    s = simuler(s, DAG_SEK + 5)
    const r = s.forvalter!.regnskap!.utbytte - r0
    expect(r).toBeGreaterThan(0)
    // Uten krypto, andre fond eller rivaler er alt utbyttet i spillet forvalterens.
    expect(r).toBeCloseTo(s.totaltUtbytte - u0, -1)
  })

  it('en forvalter fra før Pakke 127 begynner å telle fra første sekund, med det den har som innskutt', () => {
    let s = forvaltet()
    delete s.forvalter!.regnskap
    s.sek = DAG_SEK + 10
    const verdi = forvaltetVerdi(s)
    s = simuler(s, 1)
    const r = s.forvalter!.regnskap!
    expect(r.fra).toBe(DAG_SEK + 10)
    expect(r.inn).toBeCloseTo(verdi, -3)
    expect(r.gebyr0).toBe(s.forvalter!.gebyrBetalt)
  })

  it('kurven får ett punkt hver dag og husker åtte uker', () => {
    let s = forvaltet()
    s = simuler(s, 3 * DAG_SEK + 5)
    expect(s.forvalter!.regnskap!.kurve).toHaveLength(3)
    s.forvalter!.regnskap!.kurve = new Array(KURVE_DAGER).fill(1)
    s = simuler(s, DAG_SEK)
    expect(s.forvalter!.regnskap!.kurve).toHaveLength(KURVE_DAGER)
    expect(s.forvalter!.regnskap!.kurve.at(-1)).toBeGreaterThan(1e8)
  })

  it('en ny forvalter etter oppsigelse starter et nytt regnskap', () => {
    let s = forvaltet()
    s = simuler(s, DAG_SEK + 5)
    s = ok(stoppForvalter(s))
    expect(s.forvalter).toBeUndefined()
    s = ok(startForvalter(s, 'forsiktig'))
    expect(s.forvalter!.regnskap!.fra).toBe(s.sek)
  })
})

describe('søndagsavisa', () => {
  it('uka etter at forvalteren startet: hva den ga, mot sparekontoen med de samme pengene', () => {
    let s = forvaltet()
    // Første søndag (dag 6) var ukestarten tatt før forvalteren kom: ingen linje. Uka etter har den.
    s = simuler(s, 13 * DAG_SEK + 5)
    const uker = s.oppgjor.filter((o) => o.periode === 'uke')
    expect(uker[0].forvalter).toBeUndefined()
    const o = uker.at(-1)!
    expect(o.forvalter).toBeDefined()
    // En uke er 35 minutter: sparekontoen ~1 % i timen gir ~0,6 %.
    expect(o.forvalter!.spar).toBeGreaterThan(0.003)
    expect(o.forvalter!.spar).toBeLessThan(0.012)
    expect(Math.abs(o.forvalter!.endring)).toBeLessThan(0.2)
    const t = tekst(createElement(UkaDi, { o }))
    expect(t).toContain('Forvalteren ga')
    expect(t).toContain('denne uka (sparekontoen')
  })

  it('ingen linje når regnskapet startet i uka', () => {
    const s = forvaltet()
    const start = { fra: s.sek - 1, verdi: 1e9, inn: 1e9, ut: 0, utbytte: 0, gebyr: 0, skygge: 1e9 }
    expect(ukeresultat(s, start)).toBeNull()
    expect(ukeresultat(s, undefined)).toBeNull()
  })
})

describe('kortet', () => {
  it('sier hva den har gitt siden start, gebyret og forskjellen mot sparekontoen, og viser kurven', () => {
    let s = forvaltet()
    s = simuler(s, 3 * DAG_SEK + 5)
    const html = renderToStaticMarkup(createElement(Formuesforvalter, { s }))
    const t = tekst(createElement(Formuesforvalter, { s }))
    expect(t).toContain('siden start')
    expect(t).toContain('i gebyr')
    expect(t).toMatch(/(mer|mindre) enn sparekontoen/)
    expect(html).toContain('de siste 3 dagene')
  })

  it('en forvalter fra før sier datoen tellingen startet', () => {
    let s = forvaltet()
    delete s.forvalter!.regnskap
    s.sek = 2 * DAG_SEK + 10
    s = simuler(s, 1)
    expect(tekst(createElement(Formuesforvalter, { s }))).toContain('siden 6. januar')
  })
})
