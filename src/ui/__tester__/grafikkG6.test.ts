/** Grafikkpakke G6: stadion i fem trinn med publikum som masse, og ekte malerier. */

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, Fragment } from 'react'
import { describe, expect, it } from 'vitest'
import { KLUBBNAVN } from '../../engine/klubb'
import { KUNSTNERE, MALERIER, MALERILISTE } from '../../engine/kunst'
import type { MaleriId } from '../../engine/types'
import { drakt } from '../komponenter/Klubbvaapen'
import { bland } from '../komponenter/Papirlogo'
import { MALERIVERK, Maleribilde, maleriformat } from '../komponenter/Malerier'
import { Stadion, STADIONTRINN } from '../komponenter/Stadion'

const stadion = (divisjon: number, navn = KLUBBNAVN[0]) => renderToStaticMarkup(createElement(Stadion, { divisjon, navn }))
const maleri = (id: MaleriId) => renderToStaticMarkup(createElement(Maleribilde, { id, størrelse: 120 }))

/** Antall forekomster av en tekst. */
const antall = (svg: string, tekst: string) => svg.split(tekst).length - 1

function stierErGyldige(svg: string, hva: string) {
  const ARITET: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
  for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
    for (const [, k, args] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
      const n = (args.match(/-?(\d*\.\d+|\d+)(e-?\d+)?/g) ?? []).length
      const a = ARITET[k.toLowerCase()]
      expect(a === 0 ? n === 0 : n > 0 && n % a === 0, `${hva}: ${k}${args}`).toBe(true)
    }
  }
}

describe('stadion (G6)', () => {
  it('fem trinn, alle i 16:9 og alle ulike', () => {
    const alle = Array.from({ length: STADIONTRINN }, (_, d) => stadion(d))
    for (const svg of alle) expect(svg).toContain('viewBox="0 0 160 90"')
    expect(new Set(alle).size).toBe(STADIONTRINN)
  })

  it('publikum er en masse i klubbens farge, og blir flere for hver divisjon', () => {
    const navn = KLUBBNAVN[3]
    const masse = bland(drakt(navn).farger[0], '#000000', 0.35)
    const mengde = Array.from({ length: STADIONTRINN }, (_, d) => antall(stadion(d, navn), `fill="${masse}"`))
    expect(mengde[0]).toBe(0)
    for (let d = 2; d < STADIONTRINN; d++) expect(mengde[d], `divisjon ${d}`).toBeGreaterThan(mengde[d - 1])
  })

  it('Eliteserien er et annet bygg: glasstak i klubbens farge og ingen lysmaster', () => {
    const navn = KLUBBNAVN[2]
    const arena = stadion(4, navn)
    expect(arena).toContain(`stroke="${drakt(navn).farger[0]}" stroke-width="2.4"`)
    // Lysmastene har lampegitter; arenaen har lysene i taket.
    expect(antall(arena, 'width="1.4" height="1.2"')).toBe(0)
    expect(antall(stadion(3, navn), 'width="1.4" height="1.2"')).toBeGreaterThan(0)
  })

  it('ingen av de gamle leketøysfargene, og gyldige stier', () => {
    for (let d = 0; d < STADIONTRINN; d++) {
      const svg = stadion(d)
      for (const gammel of ['#d64545', '#2563eb', '#facc15']) expect(svg, `divisjon ${d}`).not.toContain(gammel)
      stierErGyldige(svg, `divisjon ${d}`)
    }
  })
})

describe('maleriene (G6)', () => {
  it('alle ni har sitt eget verk', () => {
    expect([...MALERIVERK].sort()).toEqual([...MALERILISTE].sort())
    expect(new Set(MALERILISTE.map(maleri)).size).toBe(MALERILISTE.length)
  })

  it('rammen følger tiden: gull for Solheim, eik for Aske, svart for Lind, hvit for Vik', () => {
    const RAMME = { solheim: '#b8892f', aske: '#6b4a32', lind: '#1c1c1c', vik: '#efece6' } as const
    for (const id of MALERILISTE) {
      const k = MALERIER[id].kunstner
      expect(maleri(id), `${id} (${KUNSTNERE[k].navn})`).toContain(`fill="${RAMME[k]}"`)
    }
  })

  it('maleriet passer i boksen og holder formatet sitt', () => {
    for (const id of MALERILISTE) {
      const svg = maleri(id)
      const [, b, h] = svg.match(/width="(\d+)" height="(\d+)"/)!.map(Number)
      expect(Math.max(b, h), id).toBe(120)
      const f = maleriformat(id)
      expect(Math.abs(b / h - f.b / f.h), id).toBeLessThan(0.03)
    }
    // Lind maler stående, de andre liggende.
    expect(maleriformat('kvinne-i-roedt').h).toBeGreaterThan(maleriformat('kvinne-i-roedt').b)
    expect(maleriformat('morgenlys').b).toBeGreaterThan(maleriformat('morgenlys').h)
  })

  it('to like malerier på en side deler ingen id-er, og stiene er gyldige', () => {
    const side = renderToStaticMarkup(createElement(Fragment, null, createElement(Maleribilde, { id: 'stormen' }), createElement(Maleribilde, { id: 'stormen' })))
    const ider = [...side.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ider).size).toBe(ider.length)
    for (const id of MALERILISTE) stierErGyldige(maleri(id), id)
  })
})
