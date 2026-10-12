/**
 * Grafikkpakke G19: en full ramme utenlands. De tretten eiendommene utenlands
 * (Östermalm, Nyhavn, Jordaan, Mitte, Mayfair, Trastevere, Le Marais, villaen på
 * Palmen, toppleiligheten på Manhattan, leiligheten og hotellet i Marbella,
 * leiligheten og hotellet i Zermatt) og de tre siste fra Pakke 76 (Canary Wharf,
 * Downtown Dubai og skyskraperen i Midtown) har ingen vignett lenger. Hver by
 * får sine virkelige naboer ut til sidene, og byens andre tegning står i dis der
 * den virkelig ville synes.
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { EIENDOMSIDER, FLISUTSNITT, FULL_RAMME, Illustrasjon } from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'
import { lastAlle } from '../vedBehov'

const ALLE = [
  'stockholm', 'kobenhavn', 'amsterdam', 'berlin', 'london', 'roma', 'paris', 'dubai', 'newyork',
  'marbella-leilighet', 'marbella-hotell', 'zermatt-leilighet', 'zermatt-hotell',
  'canary-wharf', 'downtown-dubai', 'manhattan-skyskraper',
]
const scene = (id: string) => renderToStaticMarkup(createElement(Scene, { type: id }))
const viewBox = (html: string) => html.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1]
const VIGNETT = /url\(#[a-z0-9]+(vm|km|nm|bm)\)/i
const KILDE = readFileSync('src/ui/komponenter/ved-behov/Eiendomstegninger.tsx', 'utf8')
const kilde = (navn: string) => {
  const i = KILDE.indexOf(`function ${navn}(`)
  return KILDE.slice(i, KILDE.indexOf('\nfunction ', i + 1))
}

/** Hvor mange steder i tegningen som ligger til venstre for x −2 og til høyre for x 98, uten bakken og himmelen. */
function sider(html: string) {
  const uten = html.replace(/<g class="lerret-bakke">[\s\S]*?<\/g>/g, '').replace(/<rect x="-40" y="0"[^>]*class="lerret-himmel"[^>]*\/>/g, '')
  const tall: number[] = []
  for (const m of uten.matchAll(/\b(?:x|cx|x1)="(-?[\d.]+)"/g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/points="(-?[\d.]+),/g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/ d="M(-?[\d.]+) /g)) tall.push(Number(m[1]))
  return { venstre: tall.filter((x) => x <= -2).length, hoyre: tall.filter((x) => x >= 98).length }
}

describe('full ramme utenlands (G19)', () => {
  beforeAll(async () => {
    await lastAlle()
  })

  it('de seksten står i listen, i delen for eiendom, og nå har hver eiendom full ramme', () => {
    expect(ALLE).toHaveLength(16)
    for (const id of ALLE) {
      expect(FULL_RAMME, id).toContain(id)
      expect(EIENDOMSIDER, id).toContain(id)
    }
    expect(EIENDOMSIDER.filter((id) => !FULL_RAMME.includes(id))).toEqual([])
  })

  it.each(ALLE)('%s er bred i scenen, uten vignett, med himmelen over hele rammen', (id) => {
    const html = scene(id)
    expect(html).toContain('class="scene full"')
    expect(viewBox(html)).toBe('-40 0 176 96')
    expect(html).not.toMatch(VIGNETT)
    expect(html).toMatch(/<rect x="-40" y="0" width="176" height="96" fill="url\(#[^"]+hn?\)" class="lerret-himmel"/)
  })

  it.each(ALLE)('%s har tegnet stedet ut til begge sider, ikke bare midten', (id) => {
    const { venstre, hoyre } = sider(scene(id))
    expect(venstre, `${id} venstre`).toBeGreaterThanOrEqual(12)
    expect(hoyre, `${id} høyre`).toBeGreaterThanOrEqual(12)
  })

  it.each(ALLE)('%s har ikke flyttallsrester i markupen fra de nye sidene', (id) => {
    expect(scene(id)).not.toMatch(/\d\.\d{7,}/)
  })

  it('på firkantede steder går tegningen kant i kant, uten vignett', () => {
    for (const id of ALLE) {
      const html = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 132 }))
      expect(viewBox(html), id).toBe('0 0 96 96')
      expect(html, id).not.toMatch(VIGNETT)
    }
  })

  it('flisa er et kvadratisk utsnitt rundt motivet, ut til hjørnene', () => {
    for (const id of ALLE) {
      const boks = FLISUTSNITT[id]
      expect(boks, id).toBeDefined()
      const [x, y, b, h] = boks
      expect(b, id).toBe(h)
      expect(x, id).toBeGreaterThanOrEqual(-40)
      expect(x + b, id).toBeLessThanOrEqual(136)
      expect(y, id).toBeGreaterThanOrEqual(0)
      expect(y + h, id).toBeLessThanOrEqual(96)
      expect(b, id).toBeLessThanOrEqual(90)
      const html = renderToStaticMarkup(createElement(BedriftIkon, { type: id, stor: true }))
      expect(html, id).toContain('class="bedrift-ikon fylt')
      expect(viewBox(html), id).toBe(boks.join(' '))
    }
  })

  it('om natta lyser noe i hver tegning', () => {
    for (const id of ALLE) {
      const html = scene(id)
      const tennes = (html.match(/class="nattvindu"/g) ?? []).length
      const lyser = (html.match(/fill="#(f3dca4|e8c98a|c9a66a)"/g) ?? []).length
      expect(tennes + lyser, id).toBeGreaterThanOrEqual(4)
    }
  })

  it('byens andre tegning står i dis der den ville synes: Downtown bak Palmen, Midtown i skylinen', () => {
    expect(kilde('Dubai')).toContain('Skyskraperen i Downtown')
    expect(kilde('NewYork')).toContain('Skyskraperen i Midtown')
    // Mayfair og Canary Wharf ligger for langt fra hverandre: Big Ben er Mayfairs, DLR er Canary Wharfs.
    expect(kilde('London')).not.toContain('Canary')
    expect(kilde('CanaryWharf')).toContain('DLR')
  })

  it('et landemerke i dis er et hint, ikke hovedmotivet: Downtown-nåla er lavere enn Burj Al Arab står', () => {
    const nal = kilde('Dubai').match(/-18\.3,(\d+)/)
    expect(Number(nal?.[1])).toBeGreaterThanOrEqual(20)
  })

  it('fjellene i dis er mørke nok mot en himmel uten vignett (Matterhorn og La Concha)', () => {
    for (const id of ['zermatt-leilighet', 'zermatt-hotell', 'marbella-leilighet', 'marbella-hotell']) {
      expect(scene(id), id).toContain(`fill="${S.fjell.skygge}"`)
    }
    expect(kilde('Matterhorn')).toContain('fill={S.fjell.skygge}')
    expect(kilde('LaConcha')).toContain('fill={S.fjell.skygge}')
  })

  it('ingen himmel mellom fjellet og bakken: et landbånd under fjellene i Zermatt og Marbella', () => {
    expect(kilde('Alperygg')).toContain('Dalbunnen')
    expect(kilde('Ferieleilighet')).toContain('Landet nedenfor fjellet')
    expect(kilde('Strandhotell')).toContain('landet i dis mellom fjellet og stranda')
  })

  it('Zermatt er bilfritt: eldrosjer, en hesteslede og Gornergratbanen, ingen vanlige biler', () => {
    for (const navn of ['Skileilighet', 'Alpehotell']) {
      expect(kilde(navn), navn).not.toMatch(/<(Bil|Smaabil|Familiebil) /)
      expect(kilde(navn), navn).toContain('<Elbil')
    }
    expect(kilde('Skileilighet')).toContain('Gornergratbanen')
    expect(kilde('Alpehotell')).toContain('Hestesleden')
  })
})
