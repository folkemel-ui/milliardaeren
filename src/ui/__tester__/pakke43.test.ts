/** Pakke 43: klar for 1.0 — innstillinger, versjon og nyheter, bredt oppsett. */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ENDRINGER, VERSJON, visNyheter } from '../versjon'
import { lesBevegelse, lesVarsler, redusertBevegelse, settBevegelse, settVarsler, vises } from '../innstillinger'
import type { Hendelse } from '../../engine/types'
import type { Nytt } from '../hendelsesstrom'
import { alleStiler } from './stiler'

const css = alleStiler()
const pakke = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as { version: string }

const hendelse = (alvor: Hendelse['alvor']): Nytt => ({ type: 'hendelse', hendelse: { sek: 0, tittel: 'X', tekst: '', alvor } })

describe('versjonen', () => {
  it('er 1.0.0, lik package.json, og står øverst i endringsloggen', () => {
    expect(VERSJON).toBe('1.0.0')
    expect(pakke.version).toBe(VERSJON)
    expect(ENDRINGER[0].versjon).toBe(VERSJON)
  })

  it('endringsloggen er nyest først, og hver versjon har noe å si', () => {
    for (let i = 1; i < ENDRINGER.length; i++) expect(ENDRINGER[i].versjon.localeCompare(ENDRINGER[i - 1].versjon, undefined, { numeric: true })).toBeLessThan(0)
    for (const v of ENDRINGER) expect(v.punkter.length).toBeGreaterThanOrEqual(3)
  })

  it('«Nytt i» vises for en spiller som kommer tilbake — ikke for en ny, og bare én gang', () => {
    expect(visNyheter(5_000, null)).toBe(true)
    expect(visNyheter(5_000, '0.5.0')).toBe(true)
    expect(visNyheter(5_000, VERSJON)).toBe(false)
    expect(visNyheter(30, null)).toBe(false)
  })
})

describe('innstillingene', () => {
  it('husker varsler og bevegelse, også uten localStorage', () => {
    settVarsler('viktige')
    expect(lesVarsler()).toBe('viktige')
    settBevegelse('redusert')
    expect(lesBevegelse()).toBe('redusert')
    expect(redusertBevegelse()).toBe(true)
    settBevegelse('system')
    settVarsler('alle')
  })

  it('varselvalget: alle, bare de viktige, eller ingen', () => {
    const fane: Nytt = { type: 'fane', fane: 'luksus' }
    const prestasjon: Nytt = { type: 'prestasjon', id: 'x', navn: 'X' }
    expect([hendelse('info'), hendelse('kritisk'), fane, prestasjon].map((f) => vises(f, 'alle'))).toEqual([true, true, true, true])
    expect([hendelse('info'), hendelse('advarsel'), hendelse('kritisk'), fane, prestasjon].map((f) => vises(f, 'viktige'))).toEqual([false, true, true, true, false])
    expect([hendelse('kritisk'), fane].map((f) => vises(f, 'av'))).toEqual([false, false])
  })

  it('redusert bevegelse stopper alle animasjoner og overganger i CSS-en', () => {
    expect(css).toMatch(/:root\[data-bevegelse='redusert'\] \*,[\s\S]*?animation-duration: 0\.01ms !important;[\s\S]*?transition-duration: 0\.01ms !important;/)
  })
})

describe('bredt oppsett', () => {
  it('fra 1024 px: sidemeny, og kortlistene i to spalter', () => {
    const bred = css.slice(css.indexOf('@media (min-width: 1024px)'))
    expect(bred).toMatch(/\.fanemeny \{[^}]*position: sticky/)
    expect(bred).toMatch(/\.innhold \.kortliste:not\(\.gate-kort, \.lager-valgt, \.tingkort\) \{[^}]*grid-template-columns: repeat\(2/)
    // Telefonen er urørt: logoen i menyen er skjult utenfor den brede skjermen.
    expect(css).toMatch(/\.fanemeny-logo \{\s*display: none;/)
  })
})
