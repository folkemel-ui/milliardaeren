/** Pakke 46: et levende kart — dag og natt, bevegelse som respekterer redusert bevegelse. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DAG_SEK } from '../../engine/kalender'
import { dognet, morke, time } from '../dagognatt'
import { Flysymbol, Reisende } from '../komponenter/Bevegelse'
import { settBevegelse } from '../innstillinger'
import { alleStiler } from './stiler'

/** Sekundet for et klokkeslett på en gitt dag. */
const kl = (timer: number, dag = 3) => dag * DAG_SEK + (timer / 24) * DAG_SEK

describe('dag og natt', () => {
  it('klokka følger spilldøgnet', () => {
    expect(time(kl(0))).toBeCloseTo(0)
    expect(time(kl(13.5))).toBeCloseTo(13.5)
  })

  it('lyst om dagen, mørkt om natta, og glidende i skumringen og grålysningen', () => {
    expect(morke(kl(12))).toBe(0)
    expect(morke(kl(23))).toBe(1)
    expect(morke(kl(3))).toBe(1)
    expect(morke(kl(19.5))).toBeCloseTo(0.5)
    expect(morke(kl(6.5))).toBeCloseTo(0.5)
    // Aldri utenfor 0–1, hele døgnet rundt.
    for (let t = 0; t < 24; t += 0.25) {
      expect(morke(kl(t))).toBeGreaterThanOrEqual(0)
      expect(morke(kl(t))).toBeLessThanOrEqual(1)
    }
  })

  it('tiden på døgnet med ord', () => {
    expect([kl(7), kl(12), kl(19), kl(23)].map(dognet)).toEqual(['morgen', 'dag', 'kveld', 'natt'])
  })
})

describe('bevegelse', () => {
  const fly = () => renderToStaticMarkup(createElement(Reisende, { d: 'M0,0 L10,10', periode: 5000, children: createElement(Flysymbol) }))

  it('flyet tegnes — og ingenting ved redusert bevegelse', () => {
    settBevegelse('system')
    expect(fly()).toContain('class="reisende"')
    settBevegelse('redusert')
    expect(fly()).toBe('')
    settBevegelse('system')
  })

  it('ringen ved kjøp er en CSS-animasjon, så redusert bevegelse stopper den også', () => {
    const css = alleStiler()
    expect(css).toMatch(/\.kart-puls \{[^}]*animation: kart-puls/)
    expect(css).toMatch(/\.kart-natt \.kart-land \{[^}]*var\(--natt/)
  })
})
