/** Pakke 128: små ting på hver skjerm — hjelpeknapper du treffer, en datolinje som får plass, tall du kan lese. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { alleStiler } from './stiler'
import { nyttSpill } from '../../engine/start'
import { DAG_SEK, erHelg } from '../../engine/kalender'
import { Toppfelt } from '../komponenter/Toppfelt'
import type { Spilltilstand } from '../../engine/types'

const css = alleStiler().replace(/\r\n/g, '\n')

/** Deklarasjonene i regelen med nøyaktig denne selektoren. */
function regel(sel: string): Record<string, string> {
  const i = css.indexOf(`\n${sel} {\n`)
  if (i < 0) throw new Error(`fant ikke ${sel}`)
  const kropp = css.slice(i + sel.length + 4, css.indexOf('\n}', i))
  return Object.fromEntries(kropp.split('\n').map((l) => l.trim().replace(/;$/, '').split(': ')).filter((p) => p.length === 2))
}

const px = (v: string) => Number(v.replace('px', ''))

function topp(s: Spilltilstand): string {
  const ingenting = () => {}
  return renderToStaticMarkup(createElement(Toppfelt, { s, tilProfil: ingenting, åpneAvis: ingenting, åpneLogg: ingenting, gåTil: ingenting }))
}

describe('hjelpeknappene', () => {
  it('ser ut som 18 px, men trykkflata er 44 × 44 (Pakke 74, målt på alle 34 knappene i Pakke 128)', () => {
    const knapp = regel('.forklaring-knapp')
    const flate = regel('.forklaring-knapp::after')
    expect(knapp.position).toBe('relative')
    expect(flate.position).toBe('absolute')
    const inn = -px(flate.inset)
    expect(px(knapp.width) + 2 * inn).toBe(44)
    expect(px(knapp.height) + 2 * inn).toBe(44)
  })
})

describe('datolinja', () => {
  /** Første lørdag i spillet, 10 sekunder ut i dagen. */
  function helg(): Spilltilstand {
    const s = nyttSpill()
    s.sek = 5 * DAG_SEK + 10
    expect(erHelg(s.sek)).toBe(true)
    return s
  }

  it('«Børsen stengt» er et låseikon, med ordene for skjermlesere og som tooltip', () => {
    const html = topp(helg())
    expect(html).toMatch(/class="merke varsel merke-ikon" role="img" aria-label="Børsen stengt" title="Børsen stengt"/)
    // Ordene står ikke som synlig tekst lenger — bare datoen, med uka og klokka.
    expect(html.replace(/<[^>]+>/g, ' ')).not.toContain('Børsen stengt')
    expect(html).toContain('uke 1')
  })

  it('ubetalt skatt er et kvitteringsikon som går til regnskapet, med en trykkflate på 44 px', () => {
    const s = helg()
    s.skatt.regninger = [{ id: 1, navn: 'Skatt', belop: 1000, forfallSek: s.sek + DAG_SEK, type: 'skatt' }]
    const html = topp(s)
    expect(html).toMatch(/<button class="merke fare merke-ikon"[^>]*aria-label="Ubetalt skatt — gå til regnskapet"/)
    expect(html.replace(/<[^>]+>/g, ' ')).not.toMatch(/\bSkatt\b/)
    const flate = regel('button.merke-ikon::after')
    // 14 px ikon + 2 × 3 px luft + 2 × 1 px kant = 22, og 12 px ut over og under.
    expect(22 + 2 * -px(flate.inset.split(' ')[0])).toBeGreaterThanOrEqual(44)
  })

  it('på en hverdag uten skatt står ingen merker der', () => {
    const s = nyttSpill()
    s.sek = DAG_SEK + 10
    expect(topp(s)).not.toContain('merke-ikon')
  })
})

describe('tall du kan lese', () => {
  it('en etikett med et tall er 13 px uten store bokstaver; overskriftene er som før', () => {
    const tall = regel('.etikett-tall')
    expect(tall['font-size']).toBe('var(--skrift-2)')
    expect(tall['text-transform']).toBeUndefined()
    const etikett = regel('.etikett')
    expect(etikett['font-size']).toBe('var(--skrift-1)')
    expect(etikett['text-transform']).toBe('uppercase')
  })

  it('«+N status» og prisen under tingene i Samling er 13 px', () => {
    expect(regel('.plass-under')['font-size']).toBe('var(--skrift-2)')
  })
})
