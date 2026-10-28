/** Pakke 132: Luksus kortere — statusstripa på alle delene, jevne rader i Samling og et stadionnavn som får plass. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { STADIONTRINN } from '../../engine/klubb'
import type { Spilltilstand } from '../../engine/types'
import { Luksus } from '../screens/Luksus'
import { PER_RAD, Samlingsoversikt } from '../komponenter/Samlingsoversikt'
import { luksusdel, LUKSUSDELER } from '../deler'
import { lastAlle } from '../vedBehov'

let rik: Spilltilstand

beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

afterEach(() => luksusdel.sett('samling'))

describe('statusen som stripe', () => {
  it('står på hver del — Samling, Hjem, Kunst og Klubb — i stedet for hele kortet', () => {
    for (const d of LUKSUSDELER) {
      luksusdel.sett(d.id)
      const html = renderToStaticMarkup(createElement(Luksus, { s: rik }))
      expect(html, d.id).toContain('class="kort statusstripe" aria-expanded="false"')
      expect(html, d.id).not.toContain('class="kort status"')
    }
  })
})

describe('jevne rader i Samling', () => {
  it('en gruppe på mer enn sju deles jevnt — bilene 4 + 4 — og de andre fyller raden som før', () => {
    expect(PER_RAD).toBe(7)
    const html = renderToStaticMarkup(createElement(Samlingsoversikt, { s: rik }))
    const lister = [...html.matchAll(/<ul class="samling-ikoner"( style="max-width:(\d+)px")?>([\s\S]*?)<\/ul>/g)]
    expect(lister.length).toBeGreaterThan(3)
    for (const [, , bredde, innhold] of lister) {
      // «<li>», ikke «<li»: tegningenes <linearGradient> begynner med de samme tre tegnene.
      const antall = (innhold.match(/<li>/g) ?? []).length
      if (antall > PER_RAD) {
        const rader = Math.ceil(antall / PER_RAD)
        expect(Number(bredde)).toBe(Math.ceil(antall / rader) * 44)
      } else expect(bredde).toBeUndefined()
    }
    // Bilene er gruppen med åtte: 4 × 44 px.
    expect(html).toContain('style="max-width:176px"')
  })
})

describe('stadionnavnet', () => {
  it('det første trinnet heter «Gressbane, 1 tribune», og ingen trinn er lengre enn det lengste som er målt å få plass', () => {
    expect(STADIONTRINN[0].navn).toBe('Gressbane, 1 tribune')
    // Målt på 375 px: «Utvidet nasjonalarena · netto i år −kr 999 999» er 279 av 291 px; den gamle 307.
    for (const t of STADIONTRINN) expect(t.navn.length, t.navn).toBeLessThanOrEqual('Utvidet nasjonalarena'.length)
  })
})
