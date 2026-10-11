/** Pakke 84: det sene spillet på én skjerm — eiendom som rader, prestasjoner i kort, hver aksje én gang, korte kort for ferdige bedrifter. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { kjopPapir } from '../../engine/handlinger'
import { FORBEDRINGER } from '../../engine/innhold'
import { AKSJER, KRYPTO } from '../../engine/marked'
import { nyttSpill } from '../../engine/start'
import type { Spilltilstand } from '../../engine/types'
import { Bedriftskort, erFerdig } from '../komponenter/Bedriftskort'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { Papirliste } from '../screens/investeringer/Bors'
import { Prestasjonsliste } from '../screens/Profil'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

let rik: Spilltilstand
beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

describe('eid eiendom som rader', () => {
  it('en fullt kjøpt eiendom er én rad i lista: navn, sted og leie — salg og oppussing på detaljsiden', () => {
    const rad = tegn(createElement(Eiendomskort, { s: rik, id: 'hybel', somRad: true }))
    expect(rad).toContain('eiendomsrad')
    expect(rad).toContain('kan-aapnes')
    expect(rad).toContain('i alt')
    expect(rad).not.toMatch(/Selg ·/)
    expect(rad).not.toMatch(/Pusse opp/)
  })

  it('i gatebildet og på detaljsiden er kortet helt som før', () => {
    expect(tegn(createElement(Eiendomskort, { s: rik, id: 'hybel' }))).toMatch(/Selg ·/)
    expect(tegn(createElement(Eiendomskort, { s: rik, id: 'hybel', iDetalj: true, somRad: true }))).toMatch(/Selg ·/)
  })

  it('det du ikke eier helt, har fortsatt kjøpsknappen i lista', () => {
    const s = nyttSpill()
    s.kontanter = 1e9
    expect(tegn(createElement(Eiendomskort, { s, id: 'hybel', somRad: true }))).toMatch(/Kjøp ·/)
  })
})

describe('prestasjoner i kort', () => {
  it('tallet, de tre neste og de tre siste, og «Se alle»', () => {
    const s = nyttSpill()
    s.prestasjoner = { millionaer: 10, 'forste-ansatt': 30, 'forste-aksje': 20, 'forste-laan': 40 }
    const html = tegn(createElement(Prestasjonsliste, { s }))
    expect((html.match(/class="prestasjon"/g) ?? []).length).toBe(3)
    expect((html.match(/class="prestasjon klart"/g) ?? []).length).toBe(3)
    expect(html).toContain('Neste')
    expect(html).toContain('Sist')
    expect(html).toMatch(/Se alle \d+/)
    // De siste er de nyeste: lånet (40) først, millionæren (10) er ikke med.
    expect(html).not.toContain('>Millionær<')
  })
})

describe('hver aksje én gang', () => {
  it('det du eier står øverst; «Andre aksjer» har bare resten', () => {
    let s = nyttSpill()
    s.kontanter = 1e9
    for (const id of [AKSJER[0], AKSJER[1]]) {
      const u = kjopPapir(s, id, 10)
      if (!u.ok) throw new Error(u.feil)
      s = u.tilstand
    }
    const html = tegn(createElement(Papirliste, { s, klasse: 'aksje', velg: () => {} }))
    expect(html).toContain('Andre aksjer')
    expect((html.match(/class="kort papirrad/g) ?? []).length).toBe(AKSJER.length)
    expect(tegn(createElement(Papirliste, { s: nyttSpill(), klasse: 'krypto', velg: () => {} }))).toContain('Alle mynter')
    expect((tegn(createElement(Papirliste, { s: nyttSpill(), klasse: 'krypto', velg: () => {} })).match(/class="kort papirrad/g) ?? []).length).toBe(KRYPTO.length)
  })
})

describe('korte kort for ferdige bedrifter', () => {
  it('ferdig = alle forbedringene kjøpt og retningen valgt', () => {
    const b = { ...rik.bedrifter[0], forbedringer: FORBEDRINGER[rik.bedrifter[0].type].length, retning: 'volum' as const }
    expect(erFerdig(b)).toBe(true)
    expect(erFerdig({ ...b, retning: undefined })).toBe(false)
    expect(erFerdig({ ...b, forbedringer: 2 })).toBe(false)
  })

  it('det korte kortet har navn, inntekt og oppgraderingen, ikke milepælen eller forbedringene', () => {
    const b = { ...rik.bedrifter[0], forbedringer: 3, retning: 'volum' as const }
    const html = tegn(createElement(Bedriftskort, { b, s: rik, mengde: '1', åpne: () => {} }))
    expect(html).toContain('bedriftskort-ferdig')
    expect(html).toMatch(/→ nivå \d+/)
    expect(html).not.toContain('milepael-spor')
    const full = tegn(createElement(Bedriftskort, { b: { ...b, retning: undefined }, s: rik, mengde: '1', åpne: () => {} }))
    expect(full).toContain('milepael-spor')
  })
})
