/**
 * Grafikkpakke G13: en full ramme for gatebedriftene. Saftboden, pølseboden,
 * gatekjøkkenet og kiosken har ingen vignett lenger: i scenen er de brede
 * (176 × 96, med den gamle firkanten midt i), på kortet fyller nærbildet hele
 * flisa, og på firkantede steder (kjøpsøyeblikket, Avisa) går tegningen kant i
 * kant. De andre tegningene er som før, til gruppen deres kommer (G14–G21).
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { BEDRIFTSTEGNINGER, FULL_RAMME, Illustrasjon, NAERBILDER, type Trinn } from '../komponenter/Illustrasjoner'
import { alleStiler } from './stiler'

const NIVAA = [1, 25, 50, 100]
const TRINN: Trinn[] = [0, 1, 2, 3]
const scene = (id: string, nivaa: number, f: number) => renderToStaticMarkup(createElement(Scene, { type: id, nivaa, forbedringer: f }))
const viewBox = (html: string) => html.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1]
/** Vignetten: himmelen (vm), bakgrunnen (km), havet nederst (nm) og bakken (bm). */
const VIGNETT = /url\(#[a-z0-9]+(vm|km|nm|bm)\)/i

describe('full ramme for gatebedriftene (G13)', () => {
  it('gjelder de fire gatebedriftene', () => {
    expect([...FULL_RAMME]).toEqual(['saftbod', 'polsebod', 'gatekjokken', 'kiosk'])
  })

  it('i scenen er de brede, 176 × 96, uten vignett, på hvert trinn med og uten forbedringer', () => {
    for (const id of FULL_RAMME)
      for (const n of NIVAA)
        for (const f of [0, 3]) {
          const html = scene(id, n, f)
          expect(html, `${id} ${n} f${f}`).toContain('class="scene full"')
          expect(viewBox(html), `${id} ${n}`).toBe('-40 0 176 96')
          expect(html, `${id} ${n} f${f}`).not.toMatch(VIGNETT)
          // Himmelen dekker hele rammen.
          expect(html, `${id} ${n}`).toMatch(/<rect x="-40" y="0" width="176" height="96" fill="url\(#[^"]+hn?\)" class="lerret-himmel"/)
        }
  })

  it('natta dekker hele den brede rammen', () => {
    const html = scene('kiosk', 100, 3)
    expect(html).toMatch(/<filter id="[^"]+natt" filterUnits="userSpaceOnUse" x="-40" y="0" width="176"/)
    expect(html).toMatch(/<filter id="[^"]+glod" filterUnits="userSpaceOnUse" x="-40" y="0" width="176"/)
  })

  it('på firkantede steder er de 96 × 96 kant i kant, uten vignett', () => {
    for (const id of FULL_RAMME)
      for (const trinn of TRINN) {
        const html = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 132, trinn, forbedringer: 3 }))
        expect(viewBox(html), id).toBe('0 0 96 96')
        expect(html, id).not.toMatch(VIGNETT)
      }
  })

  it('på kortet fyller nærbildet hele flisa, og utsnittet holder seg på lerretet på hvert trinn', () => {
    for (const id of FULL_RAMME)
      for (const [n, stor] of NIVAA.flatMap((n) => [[n, false], [n, true]] as const)) {
        const html = renderToStaticMarkup(createElement(BedriftIkon, { type: id, nivaa: n, forbedringer: 3, stor }))
        const px = stor ? 68 : 52
        expect(html, id).toContain('class="bedrift-ikon fylt')
        expect(html, `${id} ${n}`).toMatch(new RegExp(`<svg[^>]*width="${px}" height="${px}"`))
        const [x, y, b, h] = viewBox(html)!.split(' ').map(Number)
        expect(b, id).toBe(h)
        expect(x, `${id} ${n}`).toBeGreaterThanOrEqual(0)
        expect(y + h, `${id} ${n}`).toBeLessThanOrEqual(96)
        expect(x + b, `${id} ${n}`).toBeLessThanOrEqual(96)
        expect(html, id).not.toMatch(VIGNETT)
      }
  })

  it('en silhuett av en bedrift med full ramme er bare motivet', () => {
    const css = alleStiler()
    expect(css).toMatch(/\.silhuett \.bedrift-ikon\.fylt :is\(\.lerret-himmel, \.lerret-bakke, \.lerret-bakgrunn\)\s*\{\s*display: none/)
  })

  it('kjøpsøyeblikket gir tegningen hele flisa', () => {
    expect(readFileSync('src/ui/komponenter/Kjopsglimt.tsx', 'utf8')).toContain('FULL_RAMME.includes(k.id) ? 174 : 132')
  })

  it('de andre bedriftene er som før, til gruppen deres kommer', () => {
    for (const id of BEDRIFTSTEGNINGER.filter((x) => !FULL_RAMME.includes(x))) {
      expect(NAERBILDER[id], id).toBeDefined()
      const html = scene(id, 100, 3)
      expect(html, id).toContain('class="scene"')
      expect(viewBox(html), id).toBe('0 0 96 96')
      expect(html, id).toMatch(/url\(#[a-z0-9]+vm\)/i)
      const flis = renderToStaticMarkup(createElement(BedriftIkon, { type: id, nivaa: 1 }))
      expect(flis, id).not.toContain('fylt')
    }
  })
})
