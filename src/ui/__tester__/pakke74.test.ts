/**
 * Pakke 74 — passer på telefonen: ingen tapt plass i liggende telefon, du
 * kommer tilbake dit du var i en fane, trykkflater på minst 44 px, og tekst
 * du skal lese på 13 px i stedet for 11.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { glemRulling, hentRulling, huskRulling } from '../rullehusk'
import { delnokkel, luksusdel } from '../deler'
import { alleStiler } from './stiler'

const css = alleStiler()

/** Deklarasjonene til én regel, f.eks. `.knapp-liten`, eller null. */
function regel(velger: string): string | null {
  const m = css.match(new RegExp(`(?:^|\\n)${velger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`))
  return m ? m[1] : null
}

const minHoyde = (velger: string) => Number(regel(velger)?.match(/min-height:\s*(\d+)px/)?.[1] ?? 0)

describe('rulling som huskes (ui/rullehusk.ts)', () => {
  beforeEach(() => glemRulling())

  it('en fane åpner der du var, for samme del', () => {
    huskRulling('eiendom', 2500, 'norge/Alle')
    expect(hentRulling('eiendom', 'norge/Alle')).toBe(2500)
  })

  it('en annen del, eller en fane du ikke har vært i, starter øverst', () => {
    huskRulling('luksus', 400, 'samling')
    expect(hentRulling('luksus', 'kunst')).toBe(0)
    expect(hentRulling('profil', 'meg')).toBe(0)
  })

  it('en negativ eller flytende rulling rettes, og siste visning vinner', () => {
    huskRulling('bedrifter', -20, 'kjopt')
    expect(hentRulling('bedrifter', 'kjopt')).toBe(0)
    huskRulling('bedrifter', 812.6, 'kjopt')
    expect(hentRulling('bedrifter', 'kjopt')).toBe(813)
  })

  it('nøkkelen følger delen som er valgt', () => {
    luksusdel.sett('samling')
    const a = delnokkel('luksus')
    luksusdel.sett('kunst')
    expect(delnokkel('luksus')).not.toBe(a)
    luksusdel.sett('samling')
    expect(delnokkel('ukjent')).toBe('')
  })
})

describe('trykkflater og tekst (stilarkene)', () => {
  it('knappene du trykker på hele tida, er 44 px', () => {
    for (const v of ['.knapp', '.knapp-liten', '.segment button', '.mengdevalg button', '.rekkefolge button', '.seksjon-hode', '.forbedring-knapp', '.formuerad-knapp']) {
      expect(minHoyde(v), v).toBeGreaterThanOrEqual(44)
    }
    expect(minHoyde('.formuerad.under .formuerad-knapp')).toBeGreaterThanOrEqual(44)
  })

  it('de små knappene har en usynlig trykkflate på minst 44 px', () => {
    expect(css).toMatch(/\.forklaring-knapp::after \{[^}]*inset: -13px/) // 18 + 2 × 13 = 44
    expect(css).toMatch(/\.avisknapp::after \{[^}]*inset: -8px/) // 28 + 2 × 8 = 44
    expect(css).toMatch(/\.hendelsesknapp::after \{[^}]*inset: -8px -7px/) // 30 × 28 → 44 × 44
    expect(css).toMatch(/\.byvalg button::after \{[^}]*inset: -8px 0/)
    expect(css).toMatch(/\.varsel-lukk::after/)
    expect(css).toMatch(/\.lenkeknapp::after \{[^}]*inset: -13px/)
    expect(css).toMatch(/\.toppfelt-profil::after/)
  })

  it('beskrivelsene og plassnavnene er 13 px, og plassnavnet brytes over to linjer', () => {
    expect(regel('.prestasjon-besk')).toContain('font-size: var(--skrift-2)')
    const navn = regel('.plass-navn') ?? ''
    expect(navn).toContain('font-size: var(--skrift-2)')
    expect(navn).toContain('line-clamp: 2')
    expect(navn).not.toContain('white-space: nowrap')
  })

  it('en telefon på sida får sidemeny og én topplinje, og Fra 1024 px er som før', () => {
    const start = css.indexOf('@media (orientation: landscape) and (max-height: 500px)')
    expect(start).toBeGreaterThan(css.indexOf('@media (min-width: 1024px)'))
    const blokk = css.slice(start)
    expect(blokk).toMatch(/\(max-width: 1023px\)/)
    expect(blokk).toMatch(/--meny-høyde: 0px/)
    expect(blokk).toMatch(/\.fanemeny \{[^}]*position: sticky/)
    expect(blokk).toMatch(/\.toppfelt \{[^}]*flex-direction: row/)
    expect(blokk).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  })
})
