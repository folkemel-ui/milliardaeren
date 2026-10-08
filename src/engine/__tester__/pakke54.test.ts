/**
 * Pakke 54 — eiendom med vær og folk: ett vær (avlingene følger ukas faktiske
 * vær), vær på eiendom (også i Alpene og Syden), ledighet, dårlige leietakere
 * og forvaltere med hver sin stil.
 */

import { describe, expect, it } from 'vitest'
import { dagsbilde, EIENDOMSVAER, vaerPaaDag, type Vaertype } from '../verden'
import { vaer } from '../jord'
import { dato, DAG_SEK } from '../kalender'
import { Hashkilde, hashTekst } from '../rng'
import { FORVALTER_MINSTEPRIS, FORVALTERE, forvalterpris, LEDIGHET_MAKS, leiefaktorBy, ledighet, utleieVedDagsskifte } from '../utleie'
import { byverdi, leieHverPerSek, leieIByen } from '../eiendom'
import { ansettForvalter, kjopEiendom, sigOppForvalter } from '../handlinger'
import { nyttSpill } from '../start'
import type { By, EiendomId, Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill med tre hybler og én leilighet i Bergen. */
function iBergen(): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  for (let i = 0; i < 3; i++) s = ok(kjopEiendom(s, 'hybel'))
  return ok(kjopEiendom(s, 'leilighet-bergen'))
}

describe('ett vær', () => {
  it('Norges vær er det samme som i Pakke 49', () => {
    const sjanser = (m: number) =>
      m === 11 || m <= 1
        ? { sol: 0.2, overskyet: 0.3, regn: 0.1, sno: 0.4 }
        : m <= 4
          ? { sol: 0.35, overskyet: 0.35, regn: 0.25, sno: 0.05 }
          : m <= 7
            ? { sol: 0.5, overskyet: 0.3, regn: 0.2, sno: 0 }
            : { sol: 0.2, overskyet: 0.4, regn: 0.35, sno: 0.05 }
    for (let dag = 0; dag < 400; dag++) {
      let u = new Hashkilde(hashTekst(`dagsvær:${dag}`) | 0).neste()
      let gammel: Vaertype = 'overskyet'
      for (const [v, p] of Object.entries(sjanser(dato(dag).maaned)) as [Vaertype, number][]) {
        if (u < p) {
          gammel = v
          break
        }
        u -= p
      }
      expect(vaerPaaDag(dag), `dag ${dag}`).toBe(gammel)
    }
  })

  it('avlingen følger ukas faktiske vær, og svinger omtrent som før', () => {
    expect(vaer(7)).toBe(vaer(13))
    const uker = Array.from({ length: 300 }, (_, u) => vaer(u * 7))
    const faktorer = uker.map((v) => v.faktor)
    const snitt = faktorer.reduce((a, b) => a + b, 0) / faktorer.length
    expect(snitt).toBeGreaterThan(0.9)
    expect(snitt).toBeLessThan(1.1)
    expect(Math.min(...faktorer)).toBeLessThan(0.6)
    expect(Math.max(...faktorer)).toBeGreaterThan(1.4)
    // Dagene i uka er de samme som dagens vær.
    const v = vaer(70)
    const dager = { sol: 0, overskyet: 0, regn: 0, sno: 0 }
    for (let d = 70; d < 77; d++) dager[vaerPaaDag(d)]++
    expect(v.dager).toEqual(dager)
  })
})

describe('vær på eiendom', () => {
  it('Alpene har mye snø om vinteren og Syden sol om sommeren', () => {
    const vinter = Array.from({ length: 90 }, (_, i) => i).filter((d) => [0, 1, 11].includes(dato(d).maaned))
    const sno = vinter.filter((d) => vaerPaaDag(d, 'alpene') === 'sno').length / vinter.length
    expect(sno).toBeGreaterThan(0.4)
    const sommer = Array.from({ length: 365 }, (_, i) => i).filter((d) => [5, 6, 7].includes(dato(d).maaned))
    const sol = sommer.filter((d) => vaerPaaDag(d, 'syden') === 'sol').length / sommer.length
    expect(sol).toBeGreaterThan(0.8)
  })

  it('jevner seg ut til ×1 over to år, for hver eiendom som merker været', () => {
    const s = nyttSpill()
    for (const id of Object.keys(EIENDOMSVAER) as EiendomId[]) {
      let sum = 0
      for (let dag = 0; dag < 728; dag++) sum += dagsbilde(s, dag).eiendom[id] ?? 1
      expect(sum / 728, id).toBeGreaterThan(0.93)
      expect(sum / 728, id).toBeLessThan(1.07)
    }
  })
})

describe('ledighet og forvaltere', () => {
  it('ledigheten er 0–20 % per by og uke, rundt 10 % i snitt', () => {
    const s = nyttSpill()
    const verdier: number[] = []
    for (let uke = 0; uke < 200; uke++) {
      s.sek = uke * 7 * DAG_SEK
      for (const by of ['Bergen', 'Oslo', 'Zermatt'] as By[]) verdier.push(ledighet(s, by))
    }
    expect(Math.min(...verdier)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...verdier)).toBeLessThan(LEDIGHET_MAKS)
    const snitt = verdier.reduce((a, b) => a + b, 0) / verdier.length
    expect(snitt).toBeGreaterThan(0.08)
    expect(snitt).toBeLessThan(0.12)
  })

  it('leien i byen tar med ledigheten — og forvalterens stil', () => {
    const s = iBergen()
    const uten = leiefaktorBy(s, 'Bergen')
    expect(uten).toBeCloseTo(1 - ledighet(s, 'Bergen'))
    const f = ok(ansettForvalter(s, 'Bergen', 'paagaende'))
    const grunn = ledighet(s, 'Bergen')
    expect(ledighet(f, 'Bergen')).toBeCloseTo(grunn * FORVALTERE.paagaende.ledighet)
    expect(leiefaktorBy(f, 'Bergen')).toBeCloseTo((1 - grunn * 0.6) * 1.1)
    expect(leieHverPerSek(f, 'hybel') / leieHverPerSek(s, 'hybel')).toBeCloseTo(leiefaktorBy(f, 'Bergen') / uten)
  })

  it('en forvalter koster 5 % av det du eier i byen, minst kr 100 000, én gang', () => {
    const s = iBergen()
    const pris = forvalterpris(byverdi(s, 'Bergen'))
    expect(pris).toBe(Math.max(FORVALTER_MINSTEPRIS, Math.round(byverdi(s, 'Bergen') * 0.05)))
    const f = ok(ansettForvalter(s, 'Bergen', 'forsiktig'))
    expect(f.kontanter).toBe(s.kontanter - pris)
    expect(f.totaltForbruk - s.totaltForbruk).toBe(pris)
    expect(ansettForvalter(f, 'Bergen', 'lokal').ok).toBe(false)
    expect(ansettForvalter(s, 'Oslo', 'lokal').ok).toBe(false)
    expect(ok(sigOppForvalter(f, 'Bergen')).forvaltere?.Bergen).toBeUndefined()
  })

  it('en dårlig leietaker koster en dags leie i byen, og avisa skriver om det', () => {
    const s = iBergen()
    // Finn en mandag der Bergen får en dårlig leietaker uten forvalter.
    const uke = Array.from({ length: 300 }, (_, i) => i + 1).find((u) => new Hashkilde(hashTekst(`leietaker:Bergen|${u}`)).neste() < 0.1)!
    s.sek = uke * 7 * DAG_SEK
    const før = { kontanter: s.kontanter, leie: s.totaltLeie }
    const forventet = Math.round(leieIByen(s, 'Bergen') * DAG_SEK)
    const saker = utleieVedDagsskifte(s, [{ by: 'Bergen', sted: 'Nordnes' }], (by) => leieIByen(s, by))
    expect(saker).toHaveLength(1)
    expect(saker[0].tekst).toMatch(/forvalter/)
    expect(før.kontanter - s.kontanter).toBe(forventet)
    expect(før.leie - s.totaltLeie).toBe(forventet)
    // Ikke på en tirsdag.
    s.sek += DAG_SEK
    expect(utleieVedDagsskifte(s, [{ by: 'Bergen', sted: 'Nordnes' }], (by) => leieIByen(s, by))).toHaveLength(0)
  })
})
