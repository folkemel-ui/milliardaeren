/** Pakke 126: en forvalter for hvert formål — Utbytte, skattebevisst rebalansering, innskudd av inntekten og sparemål. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { forvalterBelop, settForvalterinnskudd, settForvaltermaal, settSparandel, startForvalter, type Utfall } from '../handlinger'
import { eierType, inntektPerSek } from '../formler'
import { DAG_SEK } from '../kalender'
import { BEDRIFTSTYPER, STIGEN } from '../innhold'
import { PAPIRER } from '../marked'
import {
  blanding,
  blandingNaa,
  forvaltetVerdi,
  forvalterVedDagsskifte,
  maalvekt,
  nesteBedriftsmaal,
  PROFILLISTE,
  utbyttePerDag,
  VINNER_SLINGRING,
} from '../forvalter'
import { bedrift } from './hjelp'
import type { PapirId, Spilltilstand } from '../types'
import { Formuesforvalter } from '../../ui/komponenter/Formuesforvalter'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill med 1 mrd hos forvalteren, på mandag dag 0. */
function forvaltet(profil: Parameters<typeof startForvalter>[1] = 'balansert'): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  s = ok(startForvalter(s, profil))
  return ok(forvalterBelop(s, 1e9))
}

const MANDAG = 7 * DAG_SEK
const TIRSDAG = 8 * DAG_SEK
const aksjeandel = (m: Map<string, number>) => [...m].filter(([k]) => k in PAPIRER && PAPIRER[k as PapirId].klasse === 'aksje').reduce((a, [, v]) => a + v, 0)

describe('Utbytte', () => {
  it('er den fjerde profilen: 60 % trygge aksjer, 20 % Børsfondet, 20 % 2-årige obligasjoner', () => {
    expect(PROFILLISTE).toEqual(['forsiktig', 'balansert', 'offensiv', 'utbytte'])
    const m = blanding('utbytte')
    expect([...m.values()].reduce((a, x) => a + x, 0)).toBeCloseTo(1, 10)
    expect(aksjeandel(m)).toBeCloseTo(0.6, 10)
    expect(m.get('fond')).toBeCloseTo(0.2, 10)
    expect(m.get('kort')).toBeCloseTo(0.2, 10)
    for (const [k] of m) if (k in PAPIRER) expect(PAPIRER[k as PapirId].risiko).toBe('lav')
  })

  it('gir mer utbytte og kuponger hver hverdag enn Balansert med de samme pengene', () => {
    const u = utbyttePerDag(forvaltet('utbytte'))
    const b = utbyttePerDag(forvaltet('balansert'))
    expect(u).toBeGreaterThan(b * 1.3)
    // ~0,08 % av 1 mrd om dagen: rundt kr 0,6–0,9 mill.
    expect(u).toBeGreaterThan(5e5)
    expect(u).toBeLessThan(1e6)
  })
})

describe('skattebevisst rebalansering', () => {
  /** Ganger kursen med `faktor` gjennom avviket, som markedet selv gjør — ellers setter neste handel den tilbake. */
  function flytt(s: Spilltilstand, id: PapirId, faktor: number): void {
    const k = s.marked.kurser[id]
    k.avvik += Math.log(faktor)
    k.kurs *= faktor
  }

  /** Den første aksjen forvalteren holder, med kursen ganget med `faktor`. */
  function lofta(s: Spilltilstand, faktor: number): PapirId {
    const id = (Object.keys(s.beholdning) as PapirId[]).find((p) => PAPIRER[p].klasse === 'aksje')!
    flytt(s, id, faktor)
    return id
  }

  it('en vinner 10 % over målet blir stående; 30 % over selges ned', () => {
    let s = forvaltet()
    s.sek = MANDAG
    const id = lofta(s, 1.1)
    const antall = s.beholdning[id]!.antall
    forvalterVedDagsskifte(s)
    expect(s.beholdning[id]!.antall).toBe(antall)
    s = forvaltet()
    s.sek = MANDAG
    const id2 = lofta(s, 1.3)
    const antall2 = s.beholdning[id2]!.antall
    forvalterVedDagsskifte(s)
    expect(s.beholdning[id2]!.antall).toBeLessThan(antall2)
    expect(VINNER_SLINGRING).toBe(0.2)
  })

  it('en taper 10 % over målet selges ned — tapet trekkes fra skatten', () => {
    const s = forvaltet()
    s.sek = MANDAG
    const id = lofta(s, 1.1)
    const b = s.beholdning[id]!
    b.kostpris = b.antall * s.marked.kurser[id].kurs * 2
    const gevinst = s.totaltGevinst ?? 0
    forvalterVedDagsskifte(s)
    expect(s.beholdning[id]!.antall).toBeLessThan(b.antall)
    expect((s.totaltGevinst ?? 0) - gevinst).toBeLessThan(0)
  })

  it('et uttak gir hele beløpet, også når alt står med gevinst innenfor 20 %', () => {
    let s = forvaltet()
    s.sek = TIRSDAG
    for (const p of Object.keys(s.beholdning) as PapirId[]) flytt(s, p, 1.05)
    const ut = 0.1 * forvaltetVerdi(s)
    const kontanter = s.kontanter
    s = ok(forvalterBelop(s, -ut))
    expect(s.kontanter - kontanter).toBeGreaterThan(ut * 0.99)
  })
})

describe('innskudd av inntekten', () => {
  function medInntekt(): Spilltilstand {
    let s = forvaltet()
    s.bedrifter = [bedrift('bank', { nivaa: 50, leder: true })]
    s = ok(settForvalterinnskudd(s, 0.25))
    return s
  }

  it('bare 0, 10, 25 eller 50 %, og bare med en forvalter', () => {
    const s = forvaltet()
    expect(settForvalterinnskudd(s, 0.3).ok).toBe(false)
    expect(settForvalterinnskudd(nyttSpill(), 0.1).ok).toBe(false)
    const t = ok(settForvalterinnskudd(ok(settForvalterinnskudd(s, 0.5)), 0))
    expect(t.forvalter!.innskudd).toBeUndefined()
  })

  it('en firedel av inntekten går til forvalterkontoen hvert sekund, ved siden av sparingen', () => {
    let s = medInntekt()
    s = ok(settSparandel(s, 0.1))
    s.sek = DAG_SEK + 10
    const inntekt = inntektPerSek(s)
    expect(inntekt).toBeGreaterThan(0)
    const konto = s.forvalter!.konto ?? 0
    const sparing = s.sparing
    const t = simuler(s, 1)
    expect((t.forvalter!.konto ?? 0) - konto).toBeCloseTo(inntekt * 0.25, -2)
    expect(t.sparing - sparing).toBeGreaterThan(inntekt * 0.09)
    // Kostprisen følger med, så avkastningen ikke regner innskuddet som gevinst.
    expect((t.forvalter!.kontoKostpris ?? 0) - (s.forvalter!.kontoKostpris ?? 0)).toBeCloseTo(inntekt * 0.25, -1)
  })

  it('mandag morgen investeres det som er samlet', () => {
    let s = medInntekt()
    s.sek = MANDAG - 600
    s = simuler(s, 590)
    const samlet = s.forvalter!.konto ?? 0
    expect(samlet).toBeGreaterThan(0)
    s = simuler(s, 20)
    expect(s.forvalter!.konto ?? 0).toBeLessThan(samlet * 0.05)
  })
})

describe('sparemålet', () => {
  it('neste bedrift er den billigste du ikke eier og forvalteren ikke har nok til, til dagens pris', () => {
    const s = forvaltet()
    const id = STIGEN.find((b) => !eierType(s, b) && BEDRIFTSTYPER[b].pris > forvaltetVerdi(s))!
    expect(BEDRIFTSTYPER[id].pris).toBeGreaterThan(1e9)
    expect(nesteBedriftsmaal(s)).toEqual({ belop: BEDRIFTSTYPER[id].pris, navn: BEDRIFTSTYPER[id].navn, bedrift: id })
    const t = ok(settForvaltermaal(s, 'bedrift'))
    expect(t.forvalter!.maal!.bedrift).toBe(id)
  })

  it('2, 5 eller 10 ganger det forvalteren har; andre tall avvises', () => {
    const s = forvaltet()
    const t = ok(settForvaltermaal(s, 5))
    expect(t.forvalter!.maal!.belop).toBeCloseTo(5 * forvaltetVerdi(s), 0)
    expect(settForvaltermaal(s, 3).ok).toBe(false)
    expect(ok(settForvaltermaal(t, null)).forvalter!.maal).toBeUndefined()
  })

  it('blandingen glir mot Forsiktig fra halvveis: tre firedeler av målet er halvveis til Forsiktig', () => {
    const s = forvaltet()
    const v = forvaltetVerdi(s)
    s.forvalter!.maal = { belop: v / 0.4, navn: 'x' }
    expect(maalvekt(s)).toBe(0)
    s.forvalter!.maal = { belop: v / 0.75, navn: 'x' }
    expect(maalvekt(s)).toBeCloseTo(0.5, 10)
    const m = blandingNaa(s)
    expect([...m.values()].reduce((a, x) => a + x, 0)).toBeCloseTo(1, 10)
    expect(aksjeandel(m)).toBeCloseTo(0.5 * aksjeandel(blanding('balansert')) + 0.5 * aksjeandel(blanding('forsiktig')), 10)
  })

  it('nådd en hverdag morgen: beløpet betales ut, målet går, og forvalteren holder resten', () => {
    const s = forvaltet()
    s.sek = TIRSDAG
    const v = forvaltetVerdi(s)
    s.forvalter!.maal = { belop: 0.6 * v, navn: 'Rederi', bedrift: 'rederi' }
    const kontanter = s.kontanter
    forvalterVedDagsskifte(s)
    expect(s.kontanter - kontanter).toBeGreaterThan(0.6 * v * 0.99)
    expect(s.forvalter!.maal).toBeUndefined()
    expect(forvaltetVerdi(s)).toBeGreaterThan(0.35 * v)
    expect(s.hendelser.at(-1)!.tittel).toBe('Sparemålet er nådd')
  })

  it('i helgen venter utbetalingen', () => {
    const s = forvaltet()
    s.sek = 5 * DAG_SEK
    s.forvalter!.maal = { belop: 1, navn: 'x' }
    forvalterVedDagsskifte(s)
    expect(s.forvalter!.maal).toBeDefined()
  })
})

describe('kortet', () => {
  it('viser fire profiler, andelen av inntekten, sparemålet og utbyttet', () => {
    let s = forvaltet('utbytte')
    let t = tekst(createElement(Formuesforvalter, { s }))
    expect(t).toContain('Utbytte')
    expect(t).toContain('Gi forvalteren av inntekten')
    expect(t).toContain('Spar til')
    expect(t).toContain('til deg hver hverdag')
    s = ok(settForvaltermaal(s, 'bedrift'))
    t = tekst(createElement(Formuesforvalter, { s }))
    expect(t).toContain(s.forvalter!.maal!.navn)
    expect(t).toContain('Fjern målet')
  })
})
