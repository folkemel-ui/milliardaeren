/** Pakke 115: kraft fra jorda — vind, sol og vann som følger ukas vær — og prestasjonene for en utbygd gård. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { byggKraftverk, kjopDyr, kjopGardsbygg, kjopJord, kjopJorde, kjopNabogard, type Utfall } from '../handlinger'
import { simuler } from '../simulering'
import {
  kraftfaktor,
  kraftpris,
  kraftverkFor,
  kraftverkPerSek,
  kraftverkUke,
  KRAFT_TILBAKE_TIMER,
  KRAFTVERK,
  ODEL_DAGER,
  odelVedDagsskifte,
  utbyggingsgrunnlag,
  UKE_SEK,
  vaer,
} from '../jord'
import { DAG_SEK } from '../kalender'
import { DYRLISTE } from '../dyr'
import { PRESTASJONER, type Felles } from '../prestasjoner'
import type { JordId, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return s
}

const med = (id: JordId) => ok(kjopJord(rik(), id))
const klart = (id: string, s: Spilltilstand) => PRESTASJONER.find((p) => p.id === id)!.klart(s, {} as Felles)

describe('hvor kraftverkene står', () => {
  it('vind og sol på Lista, sol på Hedmarken, vann i Namdalen, ingenting i Trysil', () => {
    expect(kraftverkFor('gard-lista')).toEqual(['vind', 'sol'])
    expect(kraftverkFor('gard-hedmarken')).toEqual(['sol'])
    expect(kraftverkFor('skog-namdalen')).toEqual(['vann'])
    expect(kraftverkFor('skog-trysil')).toEqual([])
  })

  it('panelene trenger en låve; ingen verk står to ganger eller på feil sted', () => {
    let s = med('gard-lista')
    expect(byggKraftverk(s, 'gard-lista', 'sol').ok).toBe(false)
    s = ok(kjopGardsbygg(ok(kjopGardsbygg(s, 'gard-lista', 'silo')), 'gard-lista', 'laave'))
    s = ok(byggKraftverk(s, 'gard-lista', 'sol'))
    expect(byggKraftverk(s, 'gard-lista', 'sol').ok).toBe(false)
    expect(byggKraftverk(s, 'gard-lista', 'vann').ok).toBe(false)
  })
})

describe('prisen og det de gir', () => {
  it('en andel av det maskinene prises etter; prisen står i jordas verdi', () => {
    const s = med('skog-namdalen')
    const pris = kraftpris(s, 'skog-namdalen', 'vann')
    expect(pris).toBeCloseTo(KRAFTVERK.vann.andel * utbyggingsgrunnlag(s, 'skog-namdalen'), 2)
    const etter = ok(byggKraftverk(s, 'skog-namdalen', 'vann'))
    expect(s.kontanter - etter.kontanter).toBeCloseTo(pris, 2)
    expect(etter.jord['skog-namdalen']!.investert).toBeCloseTo(pris, 2)
    expect(etter.jord['skog-namdalen']!.kraftverk?.vann).toBe(0)
  })

  it('tjener seg inn på 10 timer i en vanlig uke', () => {
    const s = med('gard-lista')
    for (const v of ['vind'] as const) {
      expect(kraftverkUke(s, 'gard-lista', v) * ((KRAFT_TILBAKE_TIMER * 3600) / UKE_SEK)).toBeCloseTo(kraftpris(s, 'gard-lista', v), 2)
    }
  })

  it('i snitt ×1; vind og vann mest i dårlige uker, sola i gode — målt over to år', () => {
    for (const v of ['vind', 'vann', 'sol'] as const) {
      let sum = 0
      let darlig = 0
      let nd = 0
      let god = 0
      let ng = 0
      for (let u = 0; u < 104; u++) {
        const f = kraftfaktor(v, u * 7)
        sum += f
        const h = vaer(u * 7).faktor
        if (h < 0.65) {
          darlig += f
          nd++
        } else if (h >= 1.35) {
          god += f
          ng++
        }
      }
      expect(sum / 104).toBeCloseTo(1, 10)
      if (v === 'sol') {
        expect(darlig / nd).toBeLessThan(0.8)
        expect(god / ng).toBeGreaterThan(1.2)
      } else {
        expect(darlig / nd).toBeGreaterThan(1.05)
        expect(god / ng).toBeLessThan(0.95)
      }
    }
  })

  it('betales hvert sekund som leia, og føres på verket', () => {
    let s = ok(byggKraftverk(med('gard-lista'), 'gard-lista', 'vind'))
    // Midt i en uke, så hele perioden har samme vær.
    s.sek = Math.floor(s.sek / UKE_SEK) * UKE_SEK + UKE_SEK / 2
    const per = kraftverkPerSek(s, 'gard-lista', 'vind')
    const host = s.totaltHost
    s = simuler(s, 100)
    // Jorda stiger litt i verdi underveis, så kraften stiger med (0,3 % om dagen).
    const tjent = s.jord['gard-lista']!.kraftverk!.vind!
    expect(tjent).toBeGreaterThan(per * 99.9)
    expect(tjent).toBeLessThan(per * 101)
    expect(s.totaltHost - host).toBeCloseTo(tjent, 2)
  })
})

describe('prestasjonene for en utbygd gård', () => {
  it('Gods, Fullt fjøs, Storbonde og Odelsbonde', () => {
    let s = med('gard-lista')
    for (const id of ['gods', 'fullt-fjos', 'tre-nabogarder', 'odelsgard']) expect(klart(id, s)).toBe(false)
    for (let i = 0; i < 7; i++) s = ok(kjopJorde(s, 'gard-lista'))
    expect(klart('gods', s)).toBe(true)
    s = ok(kjopGardsbygg(s, 'gard-lista', 'fjos'))
    for (let k = 0; k < 5; k++) for (const d of DYRLISTE) s = ok(kjopDyr(s, 'gard-lista', d))
    expect(klart('fullt-fjos', s)).toBe(true)
    for (let i = 0; i < 3; i++) s = ok(kjopNabogard(s, 'gard-lista'))
    expect(klart('tre-nabogarder', s)).toBe(true)
    s.sek += (ODEL_DAGER + 1) * DAG_SEK
    odelVedDagsskifte(s)
    expect(klart('odelsgard', s)).toBe(true)
  })
})
