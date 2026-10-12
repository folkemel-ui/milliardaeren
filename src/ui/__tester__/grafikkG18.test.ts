/**
 * Grafikkpakke G18: en full ramme for byggene, jorda og landemerkene. De tretten
 * tegningene fra planen (kontorbyggene i Bjørvika og på Forus, kjøpesenteret i
 * Trondheim, Aker Brygge, øya i Lofoten, gårdene på Hedmarken og Lista, skogene i
 * Trysil og Namdalen, Ytterskjær fyr, Kollen hoppbakke, Steinvik borg og
 * Oslotårnet) og kjøpesenterkjeden fra Pakke 76 har ingen vignett lenger. I scenen
 * er de brede, med de virkelige naboene ut til sidene, og på kortet fyller
 * utsnittet hele flisa.
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { EIENDOMSIDER, FLISUTSNITT, FULL_RAMME, Illustrasjon } from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'
import { lastAlle } from '../vedBehov'

/** De fjorten tegningene, gruppert som i spørsmålene til G18. */
const GRUPPER = {
  byen: ['kontorbygg', 'kontorbygg-stavanger', 'kjopesenter', 'naeringsbygg', 'tarnet', 'kjopesenterkjede'],
  sjoen: ['oy', 'fyret', 'borgen'],
  landet: ['gard-hedmarken', 'gard-lista', 'skog-trysil', 'skog-namdalen', 'hoppbakken'],
}
const ALLE = Object.values(GRUPPER).flat()
const scene = (id: string) => renderToStaticMarkup(createElement(Scene, { type: id }))
const viewBox = (html: string) => html.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1]
const VIGNETT = /url\(#[a-z0-9]+(vm|km|nm|bm)\)/i
const KILDE = readFileSync('src/ui/komponenter/ved-behov/Eiendomstegninger.tsx', 'utf8')
/** Kildeteksten til én tegning, fra `function Navn(` til neste funksjon på toppnivå. */
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

describe('full ramme for byggene, jorda og landemerkene (G18)', () => {
  beforeAll(async () => {
    await lastAlle()
  })

  it('de fjorten står i listen, i delen for eiendom', () => {
    expect(ALLE).toHaveLength(14)
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
  })

  it.each(ALLE)('%s har tegnet stedet ut til begge sider, ikke bare midten', (id) => {
    const { venstre, hoyre } = sider(scene(id))
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
      for (const stor of [false, true]) {
        const html = renderToStaticMarkup(createElement(BedriftIkon, { type: id, stor }))
        const px = stor ? 68 : 52
        expect(html, id).toContain('class="bedrift-ikon fylt')
        expect(html, id).toMatch(new RegExp(`<svg[^>]*width="${px}" height="${px}"`))
        expect(viewBox(html), id).toBe(boks.join(' '))
      }
    }
  })

  it('om natta lyser noe i hver tegning, og byggene i byen lyser mye', () => {
    for (const id of ALLE) {
      const html = scene(id)
      const tennes = (html.match(/class="nattvindu"/g) ?? []).length
      const lyser = (html.match(/fill="#(f3dca4|e8c98a|c9a66a)"/g) ?? []).length
      expect(tennes + lyser, id).toBeGreaterThanOrEqual(GRUPPER.byen.includes(id) ? 10 : 2)
    }
  })

  it('Munchmuseet står ved siden av kontorbygget og i dis bak Oslotårnet, Sørenga til høyre for tårnet', () => {
    expect(kilde('Kontorbygg')).toContain('Munchmuseet')
    expect(kilde('Tarnet')).toContain('Munchmuseet')
    expect(kilde('Tarnet')).toContain('Sørenga')
    expect(kilde('Naeringsbygg')).toContain('Rådhuset')
    expect(kilde('Naeringsbygg')).toContain('Tjuvholmen')
  })

  it('Lofotveggen er tydelig mot himmelen i begge Lofoten-tegningene (øya og rorbua)', () => {
    for (const id of ['oy', 'hytte-lofoten']) {
      const vegg = scene(id).match(/<polygon points="-40,57 -40,[^"]+" fill="(#[0-9a-f]{6})"/)
      expect(vegg?.[1], id).toBe(S.fjell.skygge)
    }
  })

  it('vindmøllene på Lista dreier rundt sitt eget nav', () => {
    const html = scene('gard-lista')
    const moller = html.match(/class="anim-dreie" style="transform-box:view-box;transform-origin:[^"]+"/g) ?? []
    // Tre møller, og scenen tegner motivet to ganger (dagen og nattlaget, G10).
    expect(moller).toHaveLength(6)
    expect(new Set(moller).size).toBe(3)
  })

  it('tingene på avstand har avstandens størrelse: ingen gatelykt fra gata på parkeringen', () => {
    // `Gatelykt` er 44 enheter høy, en lykt på gateavstand; på fjern avstand ville den vært 17 m.
    for (const navn of ['Kjopesenterkjede', 'Kjopesenter', 'KontorbyggStavanger']) {
      expect(kilde(navn), navn).not.toContain('<Gatelykt')
    }
  })

  it('skjærene ute på sjøen har en ujevn forkant, ikke en rett kant som en betongflåte', () => {
    const skjaer = kilde('Skjaer')
    expect(skjaer).toMatch(/\[x2, y\], \[r2\(x2 - \(x2 - x1\) \* 0\.3\), r2\(y \+ 1\)\]/)
  })
})
