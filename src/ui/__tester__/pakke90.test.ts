/** Pakke 90: raden i Samling og racingteamets side. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopLuksus, startRacingteam, type Utfall } from '../../engine/handlinger'
import { kjorLop, LOP_PER_SESONG } from '../../engine/racing'
import type { Spilltilstand } from '../../engine/types'
import { Racingdetalj, Racingrad } from '../komponenter/Racing'
import { FORKLARINGER } from '../forklaringer'
import { MERKER } from '../merker'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medBil(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  return ok(kjopLuksus(s, 'formelbil'))
}

describe('raden i Samling', () => {
  it('vises ikke uten Formel 1-bilen', () => {
    expect(tegn(createElement(Racingrad, { s: nyttSpill() }))).toBe('')
  })

  it('med bilen: et kort som starter et team for 25 mill', () => {
    const html = tegn(createElement(Racingrad, { s: medBil() }))
    expect(html).toContain('Racingteam')
    expect(html).toMatch(/Start et team · kr 25 mill/)
  })

  it('med et team: navnet, sesongen og neste løp, og en rad som åpner siden', () => {
    const s = ok(startRacingteam(medBil()))
    const html = tegn(createElement(Racingrad, { s }))
    expect(html).toContain(s.racing!.navn)
    expect(html).toContain('Sesong 1 · ny sesong · Melbourne om 3 dager')
    expect(html).toContain('klubbside-rad')
  })
})

describe('siden', () => {
  it('har neste løp, strategien, bilen, førerne, markedet og salget', () => {
    const s = ok(startRacingteam(medBil()))
    const html = tegn(createElement(Racingdetalj, { s, tilbake: () => {} }))
    for (const tekst of ['Løp 1 av 8', 'Melbourne om 3 dager', 'Forsiktig', 'Normal', 'Aggressiv', 'Konstruktørene', 'Førerne', 'Bilen', 'Motor', 'Depotmannskap', 'På markedet', 'Selg teamet']) {
      expect(html.toLowerCase()).toContain(tekst.toLowerCase())
    }
    expect(html).toMatch(/Bygg · kr 10 mill/)
    expect(html).toContain('fart 40 av 90')
  })

  it('etter et løp: pallen og dine plasser', () => {
    const s = ok(startRacingteam(medBil()))
    kjorLop(s.racing!, 3)
    const html = tegn(createElement(Racingdetalj, { s, tilbake: () => {} }))
    expect(html).toContain('Siste løp: Melbourne')
    // Pakke 110: den fulle rapporten med hele feltet.
    expect(html).toContain('racing-rapport')
    expect(html).toContain('løp 2 av 8')
  })

  it('en sesong er åtte løp', () => {
    expect(LOP_PER_SESONG).toBe(8)
  })
})

it('forklaringen har tallene fra motoren', () => {
  const t = FORKLARINGER.racing.tekst
  expect(t).toContain('kr 25 mill')
  expect(t).toContain('8 løp')
  expect(t).toMatch(/kr\s500\s000 per poeng/)
  expect(t).toContain('85 %')
})

it('de to nye prestasjonene har medalje', () => {
  expect(MERKER['grand-prix']).toBeTruthy()
  expect(MERKER.verdensmester).toBeTruthy()
})
