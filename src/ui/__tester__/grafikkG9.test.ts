/**
 * Grafikkpakke G9: de ti siste tegningene (eiendommene i utlandet) i den nye
 * stilen, den gamle stilen fjernet, og nærbilder der tegningene er små.
 */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LAGER_FOR, LUKSUS, LUKSUSLISTE } from '../../engine/eiendom'
import { BEDRIFTSTEGNINGER, Illustrasjon, ILLUSTRASJONSIDER, NAERBILDER, NY_STIL } from '../komponenter/Illustrasjoner'
import * as Illustrasjoner from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'

const TI = ['stockholm', 'kobenhavn', 'berlin', 'london', 'newyork', 'dubai', 'marbella-leilighet', 'marbella-hotell', 'zermatt-leilighet', 'zermatt-hotell']
const tegn = (id: string, naerbilde?: [number, number], utklipp = false) => renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 96, naerbilde, utklipp }))
const kilde = (fil: string) => readFileSync(new URL(fil, import.meta.url), 'utf8')

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

describe('de ti siste tegningene (G9)', () => {
  it('står i den nye stilen, er alle ulike, med gyldige stier og uten flyttallsrester', () => {
    const alle = TI.map((id) => tegn(id))
    expect(new Set(alle).size).toBe(TI.length)
    alle.forEach((svg, i) => {
      expect(NY_STIL, TI[i]).toContain(TI[i])
      expect(svg, TI[i]).toContain('viewBox="0 0 96 96"')
      stierErGyldige(svg, TI[i])
      expect(svg.match(/\d\.\d{8,}/g), TI[i]).toBeNull()
    })
  })

  it('Zermatt står i snø, Marbella har basseng og sol', () => {
    for (const id of ['zermatt-leilighet', 'zermatt-hotell']) expect(tegn(id), id).toContain(S.sno.flate)
    for (const id of ['marbella-leilighet', 'marbella-hotell']) expect(tegn(id), id).toContain(S.sjo.lys)
  })

  it('den gamle stilen er borte: ingen F, Svg eller Grunn igjen', () => {
    expect('F' in Illustrasjoner).toBe(false)
    const fil = kilde('../komponenter/Illustrasjoner.tsx')
    expect(fil).not.toMatch(/function (Svg|Grunn)\(/)
    expect(fil).not.toContain('viewBox="0 0 48 48"')
    expect(kilde('../komponenter/Bevegelse.tsx')).not.toMatch(/\bF\./)
  })
})

describe('nærbilder der tegningene er små (G9)', () => {
  it('finnes for alle bedriftene og alt som står i garasjen, havna og hangaren', () => {
    const lager = LUKSUSLISTE.filter((id) => LAGER_FOR[LUKSUS[id].kategori] !== null)
    for (const id of [...BEDRIFTSTEGNINGER, ...lager]) expect(NAERBILDER[id], id).toBeDefined()
  })

  it('ligger innenfor lerretet, og bedriftenes er kvadratiske', () => {
    for (const [id, [x, y, b, h]] of Object.entries(NAERBILDER)) {
      expect(ILLUSTRASJONSIDER, id).toContain(id)
      expect(x >= 0 && y >= 0 && x + b <= 96 && y + h <= 96 && b > 0 && h > 0, id).toBe(true)
      if (BEDRIFTSTEGNINGER.includes(id)) expect(b, id).toBe(h)
    }
  })

  it('tegnes med utsnittet som viewBox, så stort det får plass', () => {
    const svg = tegn('snekke', [86, 74], true)
    const [x, y, b, h] = NAERBILDER.snekke
    expect(svg).toContain(`viewBox="${x} ${y} ${b} ${h}"`)
    const bredde = Number(svg.match(/width="(\d+)"/)?.[1])
    const hoyde = Number(svg.match(/height="(\d+)"/)?.[1])
    expect(bredde).toBeLessThanOrEqual(86)
    expect(hoyde).toBeLessThanOrEqual(74)
    expect(Math.max(bredde / 86, hoyde / 74)).toBeGreaterThan(0.98)
    // Uten nærbilde: hele lerretet, som før.
    expect(tegn('snekke')).toContain('viewBox="0 0 96 96"')
  })

  it('brukes i rivallista og på plassene i lageret', () => {
    // Målene står i en fast konstant (Pakke 64), så Illustrasjon (memo) ikke tegnes på nytt hvert sekund.
    const inv = kilde('../screens/investeringer/Selskaper.tsx')
    expect(inv).toContain('const NAER_RIVAL = [32, 32] as const')
    expect(inv).toContain('naerbilde={NAER_RIVAL}')
    const luksus = kilde('../screens/Luksus.tsx')
    expect(luksus).toContain('const NAER_PLASS = [86, 74] as const')
    expect(luksus.match(/naerbilde=\{NAER_PLASS\}/g)).toHaveLength(2)
  })
})
