/** Pakke 130: Investeringer ryddigere — sparknappene på én rad, navn som får plass, og en kortere Bank. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopObligasjon, kjopPapir, laan, type Utfall } from '../../engine/handlinger'
import { bedrift } from '../../engine/__tester__/hjelp'
import type { Spilltilstand } from '../../engine/types'
import { Bank } from '../screens/investeringer/Bank'
import { Papirliste } from '../screens/investeringer/Bors'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const tekst = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  s.bedrifter = [bedrift('bank', { nivaa: 80, leder: true })]
  return s
}

describe('sparknappene', () => {
  it('«Spar av inntekten» har fire kolonner, så «50 %» ikke står alene på en ny rad', () => {
    const html = tegn(createElement(Bank, { s: rik() }))
    expect(html).toContain('class="andelsknapper fire" role="radiogroup" aria-label="Spar av inntekten"')
  })
})

describe('navn som får plass', () => {
  it('en rad du eier har ingen minigraf og verdien i kortform; de andre har grafen', () => {
    // 1 000 aksjer i Nordfjord Sjømat (~kr 180) og nok i Polaris Olje til over en million.
    let s = ok(kjopPapir(rik(), 'NFS', 1000))
    s = ok(kjopPapir(s, 'POL', 10_000))
    const html = tegn(createElement(Papirliste, { s, klasse: 'aksje', velg: () => {} }))
    const eide = html.split('class="kort papirrad eid"').slice(1).map((r) => r.slice(0, r.indexOf('</button>')))
    expect(eide).toHaveLength(2)
    for (const r of eide) expect(r).not.toContain('minigraf')
    // Over en million: kortform («kr 3,1 mill»), ikke hele beløpet.
    expect(eide.join('')).toMatch(/kr [\d,]+ mill/)
    const andre = html.split('class="kort papirrad"').slice(1)
    expect(andre.length).toBeGreaterThan(0)
    for (const r of andre) expect(r.slice(0, r.indexOf('</button>'))).toContain('minigraf')
  })
})

describe('en kortere Bank', () => {
  it('uten obligasjoner og gjeld er begge seksjonene foldet sammen, med en linje som sier hva som er der', () => {
    const html = tegn(createElement(Bank, { s: rik() }))
    expect(html).not.toContain('seksjon åpen')
    expect(tekst(html)).toContain('Obligasjoner')
    expect(tekst(html)).toContain('Ingen ennå')
    expect(tekst(html)).toMatch(/Ingen gjeld · kan låne kr/)
    // Innholdet står ikke på siden før du åpner.
    expect(html).not.toContain('Markedsrente')
    expect(html).not.toContain('Belåningsgrad')
  })

  it('med en obligasjon og gjeld er de åpne, og sammendraget sier hvor mye', () => {
    let s = ok(kjopObligasjon(rik(), 'kort', 1e9))
    s = ok(laan(s, 1e6))
    const html = tegn(createElement(Bank, { s }))
    expect((html.match(/class="seksjon åpen"/g) ?? []).length).toBe(2)
    expect(tekst(html)).toMatch(/1 obligasjon · kr [\d,]+ mrd/)
    expect(tekst(html)).toMatch(/Gjeld kr [\d,]+ mill · [\d,]+ %/)
    expect(html).toContain('Markedsrente')
    expect(html).toContain('Belåningsgrad')
  })

  it('skatten så langt står utenfor lånene, så den ikke foldes bort', () => {
    const s = rik()
    s.totaltTjent += 1e9
    const html = tegn(createElement(Bank, { s }))
    expect(html).not.toContain('seksjon åpen')
    expect(tekst(html)).toContain('Skatt så langt')
  })
})
