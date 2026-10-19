/** Pakke 120: en skog i bestand — hogst ett om gangen, bestand å kjøpe, vekstkurven og regnskapet. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { hoggBestand, hoggSkog, kjopBestand, kjopJord, type Utfall } from '../handlinger'
import { DAG_SEK } from '../kalender'
import { nettoformue } from '../formler'
import {
  bestand,
  bestandsverdi,
  eldsteBestand,
  HOGSTER_HUSKET,
  landverdi,
  MAKS_BESTAND,
  nesteBestandpris,
  skogalder,
  START_BESTAND,
  tommerfaktor,
  tommerverdi,
} from '../jord'
import type { Spilltilstand } from '../types'
import { Bestandkort, Skogregnskap, Tommerkurve } from '../../ui/komponenter/Skog'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const ID = 'skog-namdalen'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medSkog(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopJord(s, ID))
}

describe('en skog fra før', () => {
  it('er tre bestand med skogens alder: tømmeret og formuen står på kronen', () => {
    const s = medSkog()
    s.sek += 30 * DAG_SEK
    const j = s.jord[ID]!
    expect(j.bestand).toBeUndefined()
    expect(bestand(j)).toEqual([j.plantetSek, j.plantetSek, j.plantetSek])
    expect(tommerverdi(s, ID)).toBeCloseTo(landverdi(s, ID) * tommerfaktor(30), 2)
    expect(skogalder(s, ID)).toBeCloseTo(30)
  })
})

describe('bestandene', () => {
  it('hvert er en tredel av jorda, og ett hogges for seg: pengene og et nytt bestand', () => {
    let s = medSkog()
    s.sek += 36 * DAG_SEK
    const før = s.kontanter
    const en = bestandsverdi(s, ID, 1)
    expect(en).toBeCloseTo((landverdi(s, ID) / START_BESTAND) * tommerfaktor(36), 2)
    s = ok(hoggBestand(s, ID, 1))
    expect(s.kontanter - før).toBeCloseTo(en, 2)
    expect(bestandsverdi(s, ID, 1)).toBe(0)
    expect(bestandsverdi(s, ID, 0)).toBeCloseTo(en, 2)
    expect(s.jord[ID]!.bestand![1]).toBe(s.sek)
    expect(hoggBestand(s, ID, 1).ok).toBe(false)
    expect(hoggBestand(s, ID, 7).ok).toBe(false)
  })

  it('det eldste står først for hogst, og hele skogen kan fortsatt hogges på én gang', () => {
    let s = medSkog()
    s.sek += 20 * DAG_SEK
    s = ok(hoggBestand(s, ID, 0))
    s.sek += 10 * DAG_SEK
    expect(eldsteBestand(s, ID)).toBe(1)
    s = ok(hoggSkog(s, ID))
    expect(tommerverdi(s, ID)).toBe(0)
    expect(s.jord[ID]!.hogster).toHaveLength(4)
  })

  it('et fjerde og femte kan kjøpes: en tredel av jorda, ×1,5 for det femte, og prisen står i verdien', () => {
    let s = medSkog()
    const tredel = landverdi(s, ID) / START_BESTAND
    expect(nesteBestandpris(s, ID)).toBeCloseTo(tredel, 2)
    const før = nettoformue(s)
    s = ok(kjopBestand(s, ID))
    expect(bestand(s.jord[ID]!)).toHaveLength(4)
    expect(nettoformue(s)).toBeCloseTo(før, -2)
    expect(nesteBestandpris(s, ID)).toBeCloseTo(tredel * 1.5, 2)
    s = ok(kjopBestand(s, ID))
    expect(bestand(s.jord[ID]!)).toHaveLength(MAKS_BESTAND)
    expect(nesteBestandpris(s, ID)).toBeNull()
    expect(kjopBestand(s, ID).ok).toBe(false)
    // Med fem bestand gir skogen 5/3 av tømmeret ved samme alder.
    s.jord[ID]!.bestand = bestand(s.jord[ID]!).map(() => s.sek - 36 * DAG_SEK)
    expect(tommerverdi(s, ID)).toBeCloseTo((5 / 3) * landverdi(s, ID) * tommerfaktor(36), 0)
  })
})

describe('regnskapet', () => {
  it('husker de siste åtte hogstene og alt tømmeret har gitt', () => {
    let s = medSkog()
    let sum = 0
    for (let i = 0; i < 10; i++) {
      s.sek += 12 * DAG_SEK
      const b = eldsteBestand(s, ID)
      sum += bestandsverdi(s, ID, b)
      s = ok(hoggBestand(s, ID, b))
    }
    const j = s.jord[ID]!
    expect(j.hogster).toHaveLength(HOGSTER_HUSKET)
    expect(j.tommerTotalt).toBeCloseTo(sum, 0)
    expect(j.hogster!.at(-1)!.alder).toBeGreaterThan(0)
  })
})

describe('siden', () => {
  it('bestandene, kurven og regnskapet', () => {
    let s = medSkog()
    s.sek += 40 * DAG_SEK
    const kort = tekst(createElement(Bestandkort, { s, id: ID }))
    expect(kort).toContain('Bestand 1')
    expect(kort).toContain('Bestand 3')
    expect(kort).toContain('Bestand 4 av 5')
    expect(tekst(createElement(Tommerkurve, { s, id: ID }))).toContain('gir mest per dag over et helt omløp ved dag 36')
    expect(tekst(createElement(Skogregnskap, { s, id: ID }))).toContain('Ingen hogster ennå')
    s = ok(hoggBestand(s, ID, 0))
    expect(tekst(createElement(Skogregnskap, { s, id: ID }))).toContain('bestand 1')
  })
})
