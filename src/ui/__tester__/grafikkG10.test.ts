/**
 * Grafikkpakke G10: en levende scene. Alt beveger seg på den store scenen i
 * detaljvisningene, scenen følger klokka i spillet (natt med tente vinduer), og
 * klokkene viser ekte tid — men bare der. Lister, kort, Avisa og galleriet står
 * midt på dagen og er like lette som før.
 */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { morke } from '../dagognatt'
import { nattstil } from '../dagognatt'
import { BEDRIFTSTEGNINGER, Illustrasjon, NY_STIL, type Trinn } from '../komponenter/Illustrasjoner'
import { IScenen, LYSFARGER, S } from '../komponenter/Tegnestil'
import { DAG_SEK } from '../../engine/kalender'
import { alleStiler } from './stiler'

const css = alleStiler().replace(/\r\n/g, '\n')
const kilde = readFileSync(new URL('../komponenter/Illustrasjoner.tsx', import.meta.url), 'utf8')

const tegn = (id: string, iScenen: boolean, trinn: Trinn = 0, forbedringer = 0) =>
  renderToStaticMarkup(createElement(IScenen.Provider, { value: iScenen }, createElement(Illustrasjon, { id, størrelse: 172, trinn, forbedringer })))

/** Tegningene som står inne (bilene i utstillingen, klokkene i skrinet): ingen natt der. */
const inne = (svg: string) => svg.includes('--himmel-inne-topp')

/** Bedriftene sjekkes på hvert vekstrinn, med og uten forbedringer. */
const varianter = (id: string): [Trinn, number][] =>
  BEDRIFTSTEGNINGER.includes(id) ? ([0, 1, 2, 3] as Trinn[]).flatMap((t): [Trinn, number][] => [[t, 0], [t, 3]]) : [[0, 0]]

afterEach(() => {
  vi.useRealTimers()
})

describe('bevegelse i scenen (G10)', () => {
  it('hver tegning har noe som beveger seg i scenen, på hvert vekstrinn', () => {
    const stille: string[] = []
    for (const id of NY_STIL)
      for (const [t, f] of varianter(id)) if (!/class="[^"]*anim-/.test(tegn(id, true, t, f))) stille.push(`${id} ${t}/${f}`)
    expect(stille).toEqual([])
  })

  it('det som bare finnes i scenen (viserne, lakklyset, vinduet som tennes), tegnes ikke i lista', () => {
    for (const id of NY_STIL) {
      const svg = tegn(id, false)
      expect(svg, id).not.toMatch(/anim-(viser|sveip|vindu)\b/)
      expect(svg, id).not.toContain('nattlag')
      expect(svg, id).not.toContain('lakkmaske')
    }
  })

  it('alle bilene får lyset over lakken, og dekkene holdes utenfor', () => {
    const biler = ['stasjonsvogn', 'elbil', 'superbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil']
    for (const id of biler) {
      const svg = tegn(id, true)
      expect(svg, id).toContain('anim-sveip')
      expect(svg, id).toMatch(/<mask id="[^"]+lakk"/)
      expect(svg, id).toContain('ikke-lakk')
    }
  })

  it('båndet over lakken står utenfor lerretet når det ikke beveger seg', () => {
    const svg = tegn('superbil', true)
    const baand = svg.match(/<g class="anim-sveip">([\s\S]*?)<\/g>/)?.[1] ?? ''
    const xer = [...baand.matchAll(/(-?\d+(?:\.\d+)?),-?\d/g)].map((m) => Number(m[1]))
    expect(xer.length).toBeGreaterThan(0)
    expect(Math.max(...xer)).toBeLessThan(0)
  })

  it('de nye bevegelsene har keyframes, og står i blokken som respekterer mindre bevegelse', () => {
    const blokk = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/)?.[0] ?? ''
    for (const navn of ['dreie', 'propell', 'rotor', 'blink', 'svai', 'vindu', 'sveip', 'viser']) {
      expect(blokk, navn).toContain(`.scene .anim-${navn}`)
    }
    for (const navn of ['dreie', 'propell', 'rotor', 'blink', 'svai', 'vindu', 'sveip']) expect(css, navn).toContain(`@keyframes tegning-${navn}`)
  })
})

describe('klokkene viser ekte tid i scenen (G10)', () => {
  const KLOKKER = ['dykkerklokke', 'gullklokke', 'mesterverk', 'lommeur', 'diamantklokke']

  it('timeviser, minuttviser og sekundviser står der telefonens klokke sier', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 8, 16, 15, 30))
    for (const id of ['dykkerklokke', 'gullklokke', 'mesterverk', 'diamantklokke']) {
      const svg = tegn(id, true)
      expect(svg, id).toContain('transform:rotate(127.75deg)') // 4:15:30 → timeviseren
      expect(svg, id).toContain('transform:rotate(93deg)') // 15 min 30 s
      expect(svg, id).toContain('transform:rotate(180deg)') // 30 s
      expect(svg, id).toContain('animation-delay:-30s')
    }
    // Lommeuret har små sekunder som hopper ett sekund om gangen.
    expect(tegn('lommeur', true)).toMatch(/class="anim-viser tikk"/)
  })

  it('alle fem har sekundviser, og i lista står de på ti over ti uten å gå', () => {
    for (const id of KLOKKER) {
      expect(tegn(id, true).match(/anim-viser/g)?.length, id).toBeGreaterThanOrEqual(3)
      expect(tegn(id, false), id).not.toContain('anim-viser')
    }
    expect(kilde.match(/sekund=\{S\./g)?.length).toBe(4)
  })
})

describe('scenen følger klokka (G10)', () => {
  it('ute får tegningen natthimmel, natt-filter og et lag med lysene — inne og i lista ikke', () => {
    for (const id of NY_STIL) {
      const scene = tegn(id, true)
      const liste = tegn(id, false)
      expect(liste, id).not.toMatch(/id="[^"]+(natt|glod|hn)"/)
      if (inne(scene)) {
        expect(scene, id).not.toContain('nattlag')
        continue
      }
      expect(scene.match(/class="nattlag"/g)?.length, id).toBe(1)
      for (const def of ['natt', 'glod', 'hn']) expect(scene, `${id} ${def}`).toMatch(new RegExp(`id="[^"]+${def}"`))
      expect(scene, id).toContain('var(--natt, 0)')
    }
  })

  it('hver tegning definerer bare det den bruker i scenen også, og alt den bruker finnes', () => {
    for (const id of NY_STIL) {
      const svg = tegn(id, true)
      const definert = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
      const brukt = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])
      for (const ref of brukt) expect(definert, `${id} mangler ${ref}`).toContain(ref)
      for (const def of definert) expect(brukt, `${id} definerer ${def} uten å bruke den`).toContain(def)
      expect(new Set(definert).size, `${id}: samme id to ganger`).toBe(definert.length)
    }
  })

  it('lysfargene i natt-laget er vinduslyset i paletten, og CSS-en kjenner de samme', () => {
    expect([...LYSFARGER]).toEqual([S.vinduLys.lys, S.vinduLys.flate, S.vinduLys.skygge])
    const regel = css.match(/\.nattlag \[fill\]:not\(([^)]*\))/)?.[1] ?? ''
    for (const farge of LYSFARGER) expect(regel, farge).toContain(`'${farge}'`)
    expect(css).toMatch(/\.scene \.nattlag \{[^}]*opacity: var\(--natt, 0\);[^}]*mix-blend-mode: screen;/)
    // Disen ville gjort det svarte grått; den slås av i natt-laget.
    expect(css).toMatch(/\.nattlag \[filter\] \{\s*filter: none;/)
  })

  it('om natta tennes de fleste mørke vinduene, ikke alle', () => {
    const svg = tegn('hotell', true, 3, 3)
    const tente = (svg.match(/class="nattvindu"/g) ?? []).length
    const morke = (svg.match(/fill="#5f7784"/g) ?? []).length
    expect(tente).toBeGreaterThan(morke * 0.4)
    expect(tente).toBeLessThan(morke)
  })

  it('detaljsidene setter --natt etter klokka i spillet', () => {
    expect(nattstil(DAG_SEK / 2)).toEqual({ '--natt': '0.00' }) // kl. 12
    expect(nattstil(0)).toEqual({ '--natt': '1.00' }) // midnatt
    expect(nattstil((DAG_SEK * 19.5) / 24)).toEqual({ '--natt': morke((DAG_SEK * 19.5) / 24).toFixed(2) })
    for (const fil of ['../screens/Bedriftdetalj.tsx', '../screens/Tingdetalj.tsx']) {
      expect(readFileSync(new URL(fil, import.meta.url), 'utf8'), fil).toContain('style={nattstil(s.sek)}')
    }
  })
})
