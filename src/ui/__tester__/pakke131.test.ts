/** Pakke 131: Eiendom kortere — lista etter by, by-knappene du treffer, og kartet som foldes. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { nyttSpill } from '../../engine/start'
import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import type { Spilltilstand } from '../../engine/types'
import { Eiendom, KART_FOLDES_FRA } from '../screens/Eiendom'
import { lastAlle } from '../vedBehov'
import { alleStiler } from './stiler'

const tegn = (s: Spilltilstand) => renderToStaticMarkup(createElement(Eiendom, { s }))
const tekst = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/ /g, ' ').replace(/\s+/g, ' ')
const css = alleStiler().replace(/\r\n/g, '\n')
let rik: Spilltilstand

beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

/** Bynavnene i overskriftene på byseksjonene, i rekkefølge. */
const byoverskrifter = (html: string) => [...html.matchAll(/class="seksjon( åpen)? under"[\s\S]*?class="seksjon-tittel">([^<]+)</g)].map((m) => m[2])

describe('lista etter by', () => {
  it('én seksjon per by, i by-knappenes rekkefølge, med antall eid og leia', () => {
    const html = tegn(rik)
    const byer = byoverskrifter(html)
    const norske = [...new Set(EIENDOMSSTIGEN.filter((id) => !EIENDOMSTYPER[id].reise).map((id) => EIENDOMSTYPER[id].by))]
    expect(byer.length).toBeGreaterThan(3)
    // Rekkefølgen følger stigen, som knappene under kartet.
    expect(byer).toEqual(norske.filter((b) => byer.includes(b)))
    expect(tekst(html)).toMatch(/Oslo [▸ ]*\d+ eid · \+kr/)
    // Pris og leie sorterer fortsatt, nå inne i hver by.
    expect(html).toContain('aria-label="Rekkefølge på eiendommene"')
  })

  it('en by du eier noe i, står åpen; en by med bare det som er til salgs, er foldet', () => {
    const s = structuredClone(rik)
    for (const id of EIENDOMSSTIGEN) if (EIENDOMSTYPER[id].by === 'Bergen') delete s.eiendommer[id]
    const html = tegn(s)
    expect(html).toMatch(/class="seksjon under"[\s\S]{0,400}?>Bergen<[\s\S]{0,200}?Til salgs/)
    expect(html).toMatch(/class="seksjon åpen under"[\s\S]{0,400}?>Oslo</)
  })
})

describe('lista før det første kjøpet', () => {
  it('eier du ingen bygg, står alle byene åpne, så det som er til salgs, er ett trykk unna', () => {
    const s = structuredClone(rik)
    for (const id of EIENDOMSSTIGEN) delete s.eiendommer[id]
    // «Boliger og bygg» er foldet når du ikke eier noe; her har spilleren åpnet den (valget huskes i nettleseren).
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'milliardaer.seksjoner' ? '{"eiendom-boliger":true}' : null), setItem: () => {}, removeItem: () => {} })
    try {
      const html = tegn(s)
      expect(html).not.toMatch(/class="seksjon under"/)
      expect(html).toMatch(/class="seksjon åpen under"/)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('kartet som foldes', () => {
  it('foldet med en stripe når du eier noe i minst fem byer', () => {
    expect(KART_FOLDES_FRA).toBe(5)
    const html = tegn(rik)
    expect(tekst(html)).toMatch(/Kartet [▸ ]*\d+ byer · \+kr/)
    expect(html).not.toContain('norgeskart')
  })

  it('åpent når du eier i færre byer', () => {
    const s = nyttSpill()
    s.kontanter = 1e9
    s.hoyesteFormue = 1e9
    s.eiendommer[EIENDOMSSTIGEN[0]] = 1
    expect(tegn(s)).toContain('norgeskart')
  })
})

describe('by-knappene du treffer', () => {
  it('ser ut som 30 px, men trykkflata går 8 px over og under, inne i radens luft (målt på alle 23 i Pakke 131)', () => {
    const regel = (sel: string) => css.slice(css.indexOf(`\n${sel} {\n`), css.indexOf('\n}', css.indexOf(`\n${sel} {\n`)))
    expect(regel('.byvalg button::after')).toContain('inset: -8px 0;')
    expect(regel('.byvalg button')).toContain('position: relative;')
    // Raden ruller sidelengs og klipper derfor i høyden: luften over og under må romme flata.
    expect(regel('.byvalg')).toContain('padding: 8px 4px 10px;')
  })
})

describe('knapperaden på kortene', () => {
  it('kolonnene deler bredden, så en lang tekst brytes i stedet for å stikke ut av kortet', () => {
    expect(css).toMatch(/\n\.eiendom-knapper \{\n {2}display: grid;\n {2}grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
    expect(css).toMatch(/\n\.eiendom-knapper \.knapp \{[^}]*white-space: normal;/)
  })
})
