/** Grafikkpakke G4: rivalportretter, selskapslogoer med ordmerker og startuplogoer. */

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, Fragment } from 'react'
import { describe, expect, it } from 'vitest'
import { PAPIRER } from '../../engine/marked'
import { START_RIVALER } from '../../engine/rivaler'
import { STARTUP_IDEER } from '../../engine/startups'
import type { PapirId } from '../../engine/types'
import { PAPIRLOGOER, Papirlogo, papirfarge } from '../komponenter/Papirlogo'
import { RIVALFARGE, RIVALPORTRETTER, Rivalportrett, type RivalId } from '../komponenter/Rivalportrett'
import { STARTUPMERKER, StartupLogo } from '../komponenter/StartupLogo'
import { MONOGRAMMER, ORDMERKER } from '../ordmerker'

/** Relativ luminans etter WCAG. */
function luminans(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const kontrast = (a: string, b: string) => {
  const [l1, l2] = [luminans(a), luminans(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Kortene logoene står på: mørkt og lyst tema, og avispapiret. */
const FLATER = { mork: '#181613', lys: '#ffffff', avis: '#ebe4d4' }

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const logo = (id: PapirId, ordmerke = false) => tegn(createElement(Papirlogo, { id, størrelse: 36, ordmerke }))
const portrett = (id: RivalId, størrelse: number, form: 'rund' | 'omslag' = 'rund') => tegn(createElement(Rivalportrett, { id, størrelse, form }))

describe('selskapslogoene (G4)', () => {
  it('hvert papir har merke, ordmerke og en farge som står på alle flater', () => {
    for (const id of Object.keys(PAPIRER) as PapirId[]) {
      expect(PAPIRLOGOER, id).toContain(id)
      expect(ORDMERKER[id].d.length, id).toBeGreaterThan(100)
      const farge = papirfarge(id)!
      for (const [flate, bunn] of Object.entries(FLATER)) {
        expect(kontrast(farge, bunn), `${id} på ${flate}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('ingen to selskaper deler farge', () => {
    expect(new Set(PAPIRLOGOER.map(papirfarge)).size).toBe(PAPIRLOGOER.length)
  })

  it('aksjer har sin egen form uten flis; krypto er en preget mynt', () => {
    for (const id of PAPIRLOGOER) {
      const svg = logo(id)
      // Den gamle flisen: en avrundet firkant over hele merket.
      expect(svg, id).not.toMatch(/<rect[^>]*width="24"[^>]*height="24"/)
      const mynt = svg.includes('<circle cx="12" cy="12" r="12"')
      expect(mynt, id).toBe(PAPIRER[id].klasse === 'krypto')
    }
  })

  it('ordmerket står ved siden av merket og gjør logoen bredere', () => {
    for (const id of PAPIRLOGOER) {
      const svg = logo(id, true)
      const bredde = +svg.match(/viewBox="0 0 ([\d.]+) 24"/)![1]
      expect(bredde, id).toBeCloseTo(29 + ORDMERKER[id].bredde, 1)
      expect(ORDMERKER[id].hoyde, id).toBeLessThanOrEqual(22)
      expect(svg, id).toContain(ORDMERKER[id].d)
    }
  })

  it('banken og Bitmynt har monogrammene sine', () => {
    expect(Object.keys(MONOGRAMMER).sort()).toEqual(['BMT', 'NRB'])
    expect(logo('NRB')).toContain(MONOGRAMMER.NRB!.d)
    expect(logo('BMT')).toContain(MONOGRAMMER.BMT!.d)
  })
})

describe('startuplogoene (G4)', () => {
  it('hver startup har sitt eget merke i en egen farge som står på begge kortene', () => {
    const navn = STARTUP_IDEER.map((i) => i.navn)
    expect(Object.keys(STARTUPMERKER).sort()).toEqual([...navn].sort())
    const farger = navn.map((n) => STARTUPMERKER[n].farge)
    expect(new Set(farger).size).toBe(navn.length)
    for (const n of navn) {
      expect(kontrast(STARTUPMERKER[n].farge, FLATER.mork), n).toBeGreaterThanOrEqual(3)
      expect(kontrast(STARTUPMERKER[n].farge, FLATER.lys), n).toBeGreaterThanOrEqual(3)
    }
  })

  it('ingen initialer på en flis lenger: merket er en tegning', () => {
    const svg = tegn(createElement(StartupLogo, { navn: 'Matbudet' }))
    expect(svg).toMatch(/^<svg class="startup-logo" width="40" height="40"/)
    expect(svg).not.toContain('MA')
    expect(tegn(createElement(StartupLogo, { navn: 'Matbudet', liten: true }))).toContain('width="22"')
  })
})

describe('rivalportrettene (G4)', () => {
  it('hver rival har et portrett og en egen farge', () => {
    expect([...RIVALPORTRETTER].sort()).toEqual(START_RIVALER.map((r) => r.id).sort())
    expect(new Set(Object.values(RIVALFARGE)).size).toBe(4)
  })

  it('fire ulike ansikter, ikke samme tegning med ny farge', () => {
    const svg = RIVALPORTRETTER.map((id) => portrett(id, 240, 'omslag'))
    // Fjern id-ene og fargene og sammenlign formene som står igjen.
    const former = svg.map((s) => [...s.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('|'))
    expect(new Set(former).size).toBe(4)
  })

  it('rund i lister med tynn ring, omslag i 4:5 med tynn ramme', () => {
    for (const id of RIVALPORTRETTER) {
      const rund = portrett(id, 44)
      expect(rund, id).toMatch(/width="44" height="44"/)
      expect(rund, id).toContain(`stroke="${RIVALFARGE[id]}"`)
      const omslag = portrett(id, 100, 'omslag')
      expect(omslag, id).toMatch(/width="80" height="100" viewBox="0 0 80 100"/)
      expect(omslag, id).toContain(`stroke="${RIVALFARGE[id]}" stroke-width="1"`)
      // Den gamle tykke ringen var 2,2 enheter i en 48-boks.
      expect(rund, id).not.toContain('stroke-width="2.2"')
    }
  })

  it('små portretter beskjæres tettere rundt ansiktet', () => {
    const boks = (svg: string) => svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) /)![1]
    expect(+boks(portrett('gronn', 28))).toBeLessThan(+boks(portrett('gronn', 44)))
  })

  it('to portretter på samme side deler ingen id-er', () => {
    const side = tegn(
      createElement(
        Fragment,
        null,
        createElement(Rivalportrett, { id: 'aas', størrelse: 44 }),
        createElement(Rivalportrett, { id: 'aas', størrelse: 44 }),
        createElement(Papirlogo, { id: 'BMT', størrelse: 36 }),
        createElement(Papirlogo, { id: 'BMT', størrelse: 36 }),
      ),
    )
    const ider = [...side.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(ider.length).toBeGreaterThan(10)
    expect(new Set(ider).size).toBe(ider.length)
    // Hver url(#…) peker til en id som finnes.
    for (const [, ref] of side.matchAll(/url\(#([^)]+)\)/g)) expect(ider, ref).toContain(ref)
  })

  it('hver sti er gyldig: riktig antall tall etter hver kommando', () => {
    // Nettleseren slutter å tegne en sti ved første feil og skriver det bare i konsollen.
    const ARITET: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
    const alt = [
      ...RIVALPORTRETTER.flatMap((id) => [portrett(id, 44), portrett(id, 28), portrett(id, 200, 'omslag')]),
      ...PAPIRLOGOER.map((id) => logo(id, true)),
      ...STARTUP_IDEER.map((i) => tegn(createElement(StartupLogo, { navn: i.navn }))),
    ]
    for (const svg of alt) {
      for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
        for (const [, k, args] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
          const n = (args.match(/-?(\d*\.\d+|\d+)(e-?\d+)?/g) ?? []).length
          const a = ARITET[k.toLowerCase()]
          expect(a === 0 ? n === 0 : n > 0 && n % a === 0, `${k}${args} i ${d.slice(0, 60)}`).toBe(true)
        }
      }
    }
  })

  it('ingen SVG-tekst: bokstaver og ansikter er stier', () => {
    const alt = [
      ...RIVALPORTRETTER.flatMap((id) => [portrett(id, 44), portrett(id, 200, 'omslag')]),
      ...PAPIRLOGOER.map((id) => logo(id, true)),
      ...STARTUP_IDEER.map((i) => tegn(createElement(StartupLogo, { navn: i.navn }))),
    ]
    for (const svg of alt) expect(svg).not.toContain('<text')
  })
})
