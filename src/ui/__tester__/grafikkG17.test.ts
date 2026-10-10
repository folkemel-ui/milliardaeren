/**
 * Grafikkpakke G17: en full ramme for boligene og hyttene. De elleve norske
 * hjemmene (hybler, leiligheter, rekkehus, hytter og rorbua) har ingen vignett
 * lenger. I scenen er de brede (176 × 96, med den gamle firkanten midt i), stedet
 * fortsetter ut til sidene, og på kortet fyller utsnittet hele flisa.
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { EIENDOMSIDER, FLISUTSNITT, FULL_RAMME, Illustrasjon } from '../komponenter/Illustrasjoner'
import { lastAlle } from '../vedBehov'
import { alleStiler } from './stiler'

/** De elleve hjemmene, gruppert som i `Ideer.md`. */
const HJEM = {
  hybler: ['hybel', 'hybel-oslo', 'hybel-trondheim'],
  leiligheter: ['leilighet', 'leilighet-bergen', 'leilighet-trondheim'],
  rekkehus: ['rekkehus', 'rekkehus-bergen'],
  hytter: ['hytte', 'hytte-trysil', 'hytte-lofoten'],
}
const ALLE = Object.values(HJEM).flat()
const scene = (id: string) => renderToStaticMarkup(createElement(Scene, { type: id }))
const viewBox = (html: string) => html.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1]
/** Vignetten: himmelen (vm), bakgrunnen (km), havet nederst (nm) og bakken (bm). */
const VIGNETT = /url\(#[a-z0-9]+(vm|km|nm|bm)\)/i

/** Hvor mange steder i tegningen som ligger til venstre for x −2 og til høyre for x 98, uten bakken og himmelen. */
function sider(html: string) {
  const uten = html.replace(/<g class="lerret-bakke">[\s\S]*?<\/g>/g, '').replace(/<rect x="-40" y="0"[^>]*class="lerret-himmel"[^>]*\/>/g, '')
  const tall: number[] = []
  for (const m of uten.matchAll(/\b(?:x|cx|x1)="(-?[\d.]+)"/g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/points="(-?[\d.]+),/g)) tall.push(Number(m[1]))
  return { venstre: tall.filter((x) => x <= -2).length, hoyre: tall.filter((x) => x >= 98).length }
}

describe('full ramme for boligene og hyttene (G17)', () => {
  beforeAll(async () => {
    await lastAlle()
  })

  it('de elleve hjemmene står i listen, i delen for eiendom', () => {
    expect(ALLE).toHaveLength(11)
    for (const id of ALLE) {
      expect(FULL_RAMME, id).toContain(id)
      expect(EIENDOMSIDER, id).toContain(id)
    }
  })

  it.each(ALLE)('%s er bred i scenen, uten vignett, med himmelen over hele rammen', (id) => {
    const html = scene(id)
    expect(html).toContain('class="scene full"')
    expect(viewBox(html)).toBe('-40 0 176 96')
    expect(html).not.toMatch(VIGNETT)
    expect(html).toMatch(/<rect x="-40" y="0" width="176" height="96" fill="url\(#[^"]+hn?\)" class="lerret-himmel"/)
    expect(html).toMatch(/<filter id="[^"]+natt" filterUnits="userSpaceOnUse" x="-40" y="0" width="176"/)
  })

  it.each(ALLE)('%s har tegnet stedet ut til begge sider, ikke bare midten', (id) => {
    const { venstre, hoyre } = sider(scene(id))
    // Hver side har noe eget: naboer, bakgrunn, trær, biler, båter. Natta tegner alt to ganger.
    expect(venstre, `${id} venstre`).toBeGreaterThanOrEqual(12)
    expect(hoyre, `${id} høyre`).toBeGreaterThanOrEqual(12)
  })

  it.each(ALLE)('%s har ikke flyttallsrester i markupen fra de nye sidene', (id) => {
    expect(scene(id)).not.toMatch(/\d\.\d{7,}/)
  })

  it('midten er den samme firkanten som før: på firkantede steder går den kant i kant', () => {
    for (const id of ALLE) {
      const html = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 132 }))
      expect(viewBox(html), id).toBe('0 0 96 96')
      expect(html, id).not.toMatch(VIGNETT)
    }
  })

  it('flisa er et kvadratisk utsnitt med bygget og litt hage, ut til hjørnene', () => {
    for (const id of ALLE) {
      const boks = FLISUTSNITT[id]
      expect(boks, id).toBeDefined()
      const [x, y, b, h] = boks
      expect(b, id).toBe(h)
      expect(x, id).toBeGreaterThanOrEqual(-40)
      expect(x + b, id).toBeLessThanOrEqual(136)
      expect(y, id).toBeGreaterThanOrEqual(0)
      expect(y + h, id).toBeLessThanOrEqual(96)
      // Bygget skal være minst halvparten av utsnittet, ellers er det ikke et nærbilde.
      expect(b, id).toBeLessThanOrEqual(92)
      for (const stor of [false, true]) {
        const html = renderToStaticMarkup(createElement(BedriftIkon, { type: id, stor }))
        const px = stor ? 68 : 52
        expect(html, id).toContain('class="bedrift-ikon fylt')
        expect(html, id).toMatch(new RegExp(`<svg[^>]*width="${px}" height="${px}"`))
        expect(viewBox(html), id).toBe(boks.join(' '))
      }
    }
  })

  it('en lås-silhuett av et hjem er bare bygget, uten himmel, bakke og bakgrunn', () => {
    const html = renderToStaticMarkup(createElement('div', { className: 'silhuett' }, createElement(BedriftIkon, { type: 'hybel', stor: true, dempet: true })))
    expect(html).toContain('lerret-bakgrunn')
    expect(alleStiler()).toMatch(/\.silhuett \.bedrift-ikon\.fylt :is\(\.lerret-himmel, \.lerret-bakke, \.lerret-bakgrunn\)\s*\{\s*display: none/)
  })

  it('gata i Gatebilde viser det som en avrundet flis, ikke en hard firkant', () => {
    expect(alleStiler()).toMatch(/\.hus-bilde > svg\.lerret\s*\{[^}]*border-radius: 10px/)
  })

  it('om natta lyser hvert hjem: vinduer som tennes (`nattvindu`) eller har lys i seg hele tiden', () => {
    for (const id of ALLE) {
      const html = scene(id)
      const tennes = (html.match(/class="nattvindu"/g) ?? []).length
      const lyser = (html.match(/fill="#(f3dca4|e8c98a|c9a66a)"/g) ?? []).length
      expect(tennes + lyser, id).toBeGreaterThanOrEqual(6)
    }
  })

  it('gatelyktene er slukket om dagen og lyser om natta, ikke alltid på', () => {
    const kilde = readFileSync('src/ui/komponenter/ved-behov/Eiendomstegninger.tsx', 'utf8')
    const lykt = kilde.slice(kilde.indexOf('function Gatelykt('), kilde.indexOf('function Stakitt('))
    expect(lykt).toContain('className="nattvindu"')
    expect(lykt).toContain('fill={S.glass.skygge}')
    expect(lykt).not.toContain('<Lampe')
  })

  it('de andre eiendommene er som før, til gruppen deres kommer (G18–G19)', () => {
    for (const id of EIENDOMSIDER.filter((x) => !FULL_RAMME.includes(x))) {
      const html = scene(id)
      expect(html, id).toContain('class="scene"')
      expect(viewBox(html), id).toBe('0 0 96 96')
    }
  })
})
