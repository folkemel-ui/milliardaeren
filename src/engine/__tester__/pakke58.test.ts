/**
 * Pakke 58 — ærlige tall. Seks små feil fra kodegjennomgangen 8. oktober der
 * spillet viste eller betalte et litt feil tall, gjenskapt og rettet.
 */

import { describe, expect, it } from 'vitest'
import { ansett, kjopPapir, laan, selgPapir, settInn, taUt } from '../handlinger'
import { BANKEN_DEKKET } from '../bank'
import { bedriftInntektIDag, bedriftInntektPerSek, statusfaktor } from '../formler'
import { kotikk, KO_BONUS_SEK } from '../hender'
import { rundAntall } from '../marked'
import { portefolje } from '../portefolje'
import { DAG_SEK } from '../kalender'
import { dagsfaktor } from '../verden'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import { fortegnKroner, perSek, varighet, endring, kroner, kortKroner, tall } from '../../ui/format'
import type { Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('gjeld banken legger på, er ikke et lån du tok', () => {
  it('gir ingen prestasjon, men en melding — høyst én per spilldag', () => {
    // Én erfaren ansatt i saftboden på nivå 1: lønnen er større enn inntekten.
    let s = ok(ansett(nyttSpill(), nyttSpill().bedrifter[0].id, 'erfaren'))
    expect(bedriftInntektPerSek(s.bedrifter[0])).toBeLessThan(0)
    s = simuler(s, 400)
    expect(s.gjeld).toBeGreaterThan(0)
    expect(s.prestasjoner['forste-laan']).toBeUndefined()
    const meldinger = () => s.hendelser.filter((h) => h.tittel === BANKEN_DEKKET).length
    expect(meldinger()).toBe(1)
    // Tre dager til: én melding per dag, ikke én per sekund.
    s = simuler(s, 3 * DAG_SEK)
    expect(meldinger()).toBeGreaterThanOrEqual(3)
    expect(meldinger()).toBeLessThanOrEqual(4)
  })

  it('et lån du tar selv, gir prestasjonen', () => {
    let s = nyttSpill()
    s.kontanter = 1e7
    s.hoyesteFormue = 1e7
    s = simuler(ok(laan(s, 1000)), 1)
    expect(s.harLaant).toBe(true)
    expect(s.prestasjoner['forste-laan']).toBeDefined()
  })
})

describe('køen regner med dagen', () => {
  it('gir tretti sekunder av det bedriften tjener i dag — også på 17. mai', () => {
    const s = nyttSpill()
    const type = s.bedrifter[0].type
    // Dagen med høyest faktor for saftboden det første året.
    const dag = Array.from({ length: 365 }, (_, d) => d).reduce((a, d) => (dagsfaktor({ ...s, sek: d * DAG_SEK }, type) > dagsfaktor({ ...s, sek: a * DAG_SEK }, type) ? d : a), 0)
    let t: Spilltilstand = { ...s, sek: dag * DAG_SEK }
    expect(dagsfaktor(t, type)).toBeGreaterThan(1.5)
    for (let i = 0; i < 20_000 && !t.ko; i++) {
      t = { ...t, sek: t.sek + 1 }
      kotikk(t, false)
    }
    expect(t.ko).toBeTruthy()
    const b = t.bedrifter[0]
    expect(t.ko!.bonus).toBeCloseTo(bedriftInntektIDag(t, b) * KO_BONUS_SEK, 6)
    // Før: uten dagen — en brøkdel av det kortet viste.
    expect(t.ko!.bonus).toBeGreaterThan(bedriftInntektPerSek(b) * statusfaktor(t) * KO_BONUS_SEK * 1.5)
  })
})

describe('kryptoantall uten smuler', () => {
  it('0,57 er 0,57 — før 0,5699', () => {
    expect(rundAntall('BMT', 0.57)).toBe(0.57)
    expect(rundAntall('BMT', 0.29)).toBe(0.29)
    expect(rundAntall('BMT', 1.23456)).toBe(1.2345)
    expect(rundAntall('NFS', 2.9999)).toBe(2)
    expect(rundAntall('NFS', 3 - 1e-12)).toBe(3)
    let s = nyttSpill()
    s.kontanter = 1e9
    s = ok(kjopPapir(s, 'BMT', 0.57))
    expect(s.beholdning.BMT!.antall).toBe(0.57)
    s = ok(selgPapir(s, 'BMT', 0.29))
    expect(s.beholdning.BMT!.antall).toBeCloseTo(0.28, 10)
  })
})

describe('sparekontoen viser ikke gammel rente som avkastning', () => {
  it('et nytt innskudd etter et uttak har ingen avkastning — før +kr 100 501', () => {
    let s = nyttSpill()
    s.kontanter = 2e7
    s = simuler(ok(settInn(s, 1e7)), 3600)
    const sparing = () => portefolje(s).find((p) => p.klasse === 'sparing')!
    expect(sparing().verdi - sparing().kostpris).toBeGreaterThan(0)
    s = ok(taUt(s, Infinity))
    s = ok(settInn(s, 1e7))
    expect(sparing().kostpris).toBeCloseTo(1e7)
    expect(sparing().verdi - sparing().kostpris).toBeCloseTo(0)
  })

  it('et delvis uttak tar avkastningen med seg i samme forhold', () => {
    let s = nyttSpill()
    s.kontanter = 2e7
    s = simuler(ok(settInn(s, 1e7)), 3600)
    const før = portefolje(s).find((p) => p.klasse === 'sparing')!
    s = ok(taUt(s, s.sparing / 2))
    const etter = portefolje(s).find((p) => p.klasse === 'sparing')!
    expect(etter.verdi / etter.kostpris).toBeCloseTo(før.verdi / før.kostpris, 9)
  })
})

describe('tall uten løse minustegn', () => {
  it('null er null', () => {
    expect(kroner(-0)).toBe('kr 0')
    expect(kroner(-1e-9)).toBe('kr 0')
    expect(kroner(0.9999999999)).toBe('kr 1')
    expect(kroner(-1.7)).toBe('kr −2')
    expect(kortKroner(-1e-9)).toBe('kr 0')
    expect(fortegnKroner(-0.3)).toBe('kr 0')
    expect(fortegnKroner(0)).toBe('kr 0')
    expect(fortegnKroner(-141)).toBe('−kr 141')
    expect(fortegnKroner(1240)).toBe('+kr 1 240')
    expect(perSek(NaN)).toBe('+kr 0/s')
    expect(perSek(-0.01)).toBe('+kr 0,0/s')
    expect(perSek(-2.21)).toBe('−kr 2,2/s')
    expect(endring(-0.00001)).toBe('+0,0 %')
    expect(endring(-0.032)).toBe('−3,2 %')
    expect(tall(-0.3)).toBe('0')
  })

  it('sekunder med norsk tallformat', () => {
    expect(varighet(12.5)).toBe('12 s')
    expect(varighet(45)).toBe('45 s')
    expect(varighet(3 * 3600 + 5 * 60)).toBe('3 t 5 min')
  })
})
