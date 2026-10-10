import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, Fragment } from 'react'
import { describe, expect, it } from 'vitest'
import { BEDRIFTSTEGNINGER, Illustrasjon, ILLUSTRASJONSIDER, NY_STIL } from '../komponenter/Illustrasjoner'
import { HIMMEL, maal, METER, S } from '../komponenter/Tegnestil'
import { alleStiler } from './stiler'

const css = alleStiler().replace(/\r\n/g, '\n')

const tegn = (id: string, trinn: 0 | 1 | 2 | 3 = 0, forbedringer = 0) => renderToStaticMarkup(createElement(Illustrasjon, { id, trinn, forbedringer }))

/** Kanalene 0–1 og relativ luminans for en #rrggbb-farge. */
function farge(hex: string) {
  const k = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = k.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return { metning: Math.max(...k) - Math.min(...k), luminans: 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] }
}

describe('paletten (G1)', () => {
  it('hvert materiale går fra lys via flate til skygge', () => {
    for (const [navn, m] of Object.entries(S)) {
      const [lys, flate, skygge] = [m.lys, m.flate, m.skygge].map((c) => farge(c).luminans)
      expect(lys, navn).toBeGreaterThan(flate)
      expect(flate, navn).toBeGreaterThan(skygge)
    }
  })

  it('er dempet: bare gullet er klarere enn 0,48 i krom (de gamle lekefargene lå på 0,54–0,60)', () => {
    const for_klare = Object.entries(S)
      .filter(([navn]) => navn !== 'gull')
      .flatMap(([navn, m]) => Object.values(m).map((c) => ({ navn, c, metning: farge(c).metning })))
      .filter((x) => x.metning > 0.48)
    expect(for_klare).toEqual([])
  })
})

describe('målestokken (G1)', () => {
  it('nær er større enn gate, og gate større enn fjern', () => {
    expect(METER.naer).toBeGreaterThan(METER.gate)
    expect(METER.gate).toBeGreaterThan(METER.fjern)
  })

  it('en dør er høyere enn en person, og en etasje høyere enn en dør, på hver avstand', () => {
    for (const a of ['naer', 'gate', 'fjern'] as const) {
      expect(maal(a, 'dor')).toBeGreaterThan(maal(a, 'person'))
      expect(maal(a, 'etasje')).toBeGreaterThan(maal(a, 'dor'))
    }
  })
})

describe('tegningene i den nye stilen (G1)', () => {
  it('alle står på 96-lerretet (den gamle 48-stilen er borte etter G9)', () => {
    expect([...NY_STIL].sort()).toEqual([...ILLUSTRASJONSIDER].sort())
    for (const id of ILLUSTRASJONSIDER) expect(tegn(id), id).toContain('viewBox="0 0 96 96"')
  })

  it('bruker bare palettens farger (pluss himmel, skygge, masker og lys)', () => {
    const tillatt = new Set<string>([
      ...Object.values(S).flatMap((m) => [m.lys, m.flate, m.skygge]),
      ...Object.values(HIMMEL).flat(),
      '#000000', // skygger, med lav opasitet
      '#ffffff', // masker og glans
      '#fff4dc', // lyset i utstillingsrommet
    ])
    for (const id of NY_STIL) {
      const varianter = BEDRIFTSTEGNINGER.includes(id) ? [0, 1, 2, 3].map((t) => tegn(id, t as 0 | 1 | 2 | 3, t)) : [tegn(id)]
      for (const svg of varianter) {
        const løse = [...svg.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()).filter((c) => !tillatt.has(c))
        expect(løse, id).toEqual([])
      }
    }
  })

  it('har ingen <text>', () => {
    for (const id of NY_STIL) expect(tegn(id, 3, 3), id).not.toContain('<text')
  })

  it('to like tegninger på samme side får hver sine id-er til gradientene', () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(Illustrasjon, { id: 'kiosk' }), createElement(Illustrasjon, { id: 'kiosk' })))
    const ider = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(ider.length).toBeGreaterThan(0)
    expect(new Set(ider).size).toBe(ider.length)
  })

  it('som utklipp (garasjen, havna) kommer motivet uten himmel og bakke', () => {
    for (const id of ['superbil', 'seilbaat']) {
      const hel = tegn(id)
      const utklipp = renderToStaticMarkup(createElement(Illustrasjon, { id, utklipp: true }))
      expect(hel, id).toMatch(/mask="url\(#[^)]*vm\)"/)
      expect(utklipp, id).not.toMatch(/mask="url\(#[^)]*(vm|bm|rm)\)"/)
      expect(utklipp.length, id).toBeLessThan(hel.length)
    }
  })

  it('kiosken vokser og viser hver forbedring', () => {
    expect(new Set([0, 1, 2, 3].map((t) => tegn('kiosk', t as 0 | 1 | 2 | 3))).size).toBe(4)
    expect(new Set([0, 1, 2, 3].map((f) => tegn('kiosk', 0, f))).size).toBe(4)
    expect(tegn('kiosk', 3)).toContain(S.gull.flate)
  })
})

describe('temaene og bevegelsen (G1)', () => {
  it('det lyse temaet har en egen himmel for hver himmeltype', () => {
    for (const tema of Object.keys(HIMMEL)) {
      expect(css, tema).toContain(`--himmel-${tema}-topp:`)
      expect(css, tema).toContain(`--himmel-${tema}-horisont:`)
    }
  })

  it('den hårfine kanten i lyst tema gjelder bare de gamle tegningene', () => {
    expect(css).toContain(":root[data-theme='light'] .illustrasjon:not(.lerret)")
  })

  it('bevegelsene dobles på 96-lerretet', () => {
    expect(css).toMatch(/\.lerret \{\n {2}--utslag: 2;/)
    const keyframes = css.match(/@keyframes tegning-[a-z]+ \{[\s\S]*?\n\}/g) ?? []
    expect(keyframes.length).toBeGreaterThan(0)
    for (const k of keyframes) expect(k, k.split('\n')[0]).not.toMatch(/[^(]\d+(\.\d+)?px(?! \* var)/)
  })
})
