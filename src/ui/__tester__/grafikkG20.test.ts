/**
 * Grafikkpakke G20: en full ramme for bilene og klokkene. De sju bilene og den
 * unike hyperbilen står hver i sitt rom (garasjen hjemme, glasslokalet,
 * forhandleren, fabrikkhallen, verkstedet av tegl, hotellets innkjørsel,
 * depotgarasjen, museet), og de seks klokkene på sin flate (båtdekket, kommoden,
 * urmakerbenken, skrivepulten, juveleren, tegnebordet). Kortet viser et kvadratisk
 * utsnitt med rommet bak; garasjen og klokkeskapet viser bare tingen. Klokkene har
 * fått et sted i Samling: klokkeskapet.
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { FLISUTSNITT, FULL_RAMME, Illustrasjon, LUKSUSIDER, NAERBILDER } from '../komponenter/Illustrasjoner'
import { lastAlle } from '../vedBehov'

const BILER = ['stasjonsvogn', 'elbil', 'superbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil', 'unikhyperbil']
const KLOKKER = ['dykkerklokke', 'gullklokke', 'mesterverk', 'lommeur', 'diamantklokke', 'skreddersyddklokke']
const ALLE = [...BILER, ...KLOKKER]
const scene = (id: string) => renderToStaticMarkup(createElement(Scene, { type: id }))
const viewBox = (html: string) => html.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1]
const VIGNETT = /url\(#[a-z0-9]+(vm|km|nm|bm)\)/i
const LUKSUS = readFileSync('src/ui/screens/Luksus.tsx', 'utf8')

/**
 * Hvor mange steder i tegningen som ligger til venstre for x −2 og til høyre for x 98, uten
 * bakken og himmelen. Som G19, men folk og sykler (tegnet med `translate`) teller også.
 */
function sider(html: string) {
  const uten = html.replace(/<g class="lerret-bakke">[\s\S]*?<\/g>/g, '').replace(/<rect x="-40" y="0"[^>]*class="lerret-himmel"[^>]*\/>/g, '')
  const tall: number[] = []
  for (const m of uten.matchAll(/\b(?:x|cx|x1)="(-?[\d.]+)"/g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/points="(-?[\d.]+),/g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/ d="M(-?[\d.]+) /g)) tall.push(Number(m[1]))
  for (const m of uten.matchAll(/transform="translate\((-?[\d.]+) /g)) tall.push(Number(m[1]))
  return { venstre: tall.filter((x) => x <= -2).length, hoyre: tall.filter((x) => x >= 98).length }
}

describe('full ramme for bilene og klokkene (G20)', () => {
  beforeAll(async () => {
    await lastAlle()
  })

  it('de fjorten står i listen, i delen for luksus', () => {
    expect(ALLE).toHaveLength(14)
    for (const id of ALLE) {
      expect(FULL_RAMME, id).toContain(id)
      expect(LUKSUSIDER, id).toContain(id)
    }
  })

  it.each(ALLE)('%s er bred i scenen, uten vignett', (id) => {
    const html = scene(id)
    expect(html).toContain('class="scene full"')
    expect(viewBox(html)).toBe('-40 0 176 96')
    expect(html).not.toMatch(VIGNETT)
  })

  // Rommene har færre og større ting enn en gate (en bil under trekk er én flate), så
  // terskelen er 6, ikke G19s 12; hver side er sett på et kontaktark.
  it.each(ALLE)('%s har tegnet stedet ut til begge sider, ikke bare midten', (id) => {
    const { venstre, hoyre } = sider(scene(id))
    expect(venstre, `${id} venstre`).toBeGreaterThanOrEqual(6)
    expect(hoyre, `${id} høyre`).toBeGreaterThanOrEqual(6)
  })

  it.each(ALLE)('%s har ikke flyttallsrester i markupen', (id) => {
    expect(scene(id)).not.toMatch(/\d\.\d{7,}/)
  })

  it('speilingen og lyset over lakken dekker hele den brede rammen', () => {
    const html = scene('stasjonsvogn')
    expect(html).toMatch(/<mask id="[^"]+rm" maskContentUnits="userSpaceOnUse"><rect x="-40" y="84" width="176"/)
    expect(html).toMatch(/<mask id="[^"]+lakk" maskUnits="userSpaceOnUse" x="-40" y="0" width="176"/)
  })

  it('kortet viser det kvadratiske utsnittet med rommet bak, garasjen det brede nærbildet uten rommet', () => {
    for (const id of BILER) {
      const flis = renderToStaticMarkup(createElement(BedriftIkon, { type: id, stor: true }))
      expect(viewBox(flis), id).toBe(FLISUTSNITT[id].join(' '))
      expect(FLISUTSNITT[id][2], id).toBe(FLISUTSNITT[id][3])
      expect(flis, id).toContain('lerret-bakgrunn')
      const plass = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 64, utklipp: true, naerbilde: [86, 74] }))
      expect(viewBox(plass), id).toBe(NAERBILDER[id].join(' '))
      expect(plass, id).not.toContain('lerret-bakgrunn')
    }
  })

  it('i klokkeskapet står klokka på puta, uten esken og flata rundt', () => {
    for (const id of KLOKKER) {
      const hel = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 96 }))
      const skap = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 64, utklipp: true, naerbilde: [70, 60] }))
      // Lokket på esken er med i hele tegningen, ikke i skapet.
      expect(hel, id).toContain('points="22,63.2 82,63.2 85,14 25,14"')
      expect(skap, id).not.toContain('points="22,63.2 82,63.2 85,14 25,14"')
      expect(skap, id).not.toContain('lerret-bakgrunn')
      expect(viewBox(skap), id).toBe(NAERBILDER[id].join(' '))
    }
    // Den graverte plata sitter i lokket, så den er borte i skapet.
    const plate = 'width="16" height="7" rx="1"'
    expect(renderToStaticMarkup(createElement(Illustrasjon, { id: 'skreddersyddklokke', størrelse: 96 }))).toContain(plate)
    expect(renderToStaticMarkup(createElement(Illustrasjon, { id: 'skreddersyddklokke', størrelse: 64, utklipp: true, naerbilde: [70, 60] }))).not.toContain(plate)
  })

  it('dykkerklokka ligger ute på dekket: dagshimmel, og om natta lyser indeksene og lanterna', () => {
    const html = scene('dykkerklokke')
    expect(html).toMatch(/fill="url\(#[^"]+hn\)" class="lerret-himmel"/)
    expect(html).toContain('class="nattlys"')
    expect(html).toContain('class="nattvindu"')
    // De andre står inne, i sitt eget lys, uten natt.
    expect(scene('gullklokke')).not.toContain('class="nattlag"')
  })

  it('klokkeskapet i Samling har tatt over for den sammenfoldede lista', () => {
    expect(LUKSUS).toContain('function Klokkeskap(')
    expect(LUKSUS).toContain('<Klokkeskap s={s} />')
    expect(LUKSUS).not.toContain('id="luksus-klokke"')
    // Nærbildet står i en fast konstant (Pakke 64), for de eide, de unike og den neste.
    expect(LUKSUS).toContain('const NAER_SKAP = [70, 60] as const')
    expect(LUKSUS.match(/naerbilde=\{NAER_SKAP\}/g)).toHaveLength(3)
  })
})
