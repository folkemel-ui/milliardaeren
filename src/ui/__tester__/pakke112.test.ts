/** Pakke 112: gårdens side i deler, «Gårder og skog» på Eiendom, nedtellingen og «Silo full» på kortet. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopGardsbygg, kjopJord, settLagring, type Utfall } from '../../engine/handlinger'
import { lagerkapasitet } from '../../engine/jord'
import type { Spilltilstand } from '../../engine/types'
import { Fjoskort, Gardsnav, Jordkort, Lagerkort, Landkort } from '../komponenter/JordOgLandemerker'
import { GARDSSIDER } from '../gardssider'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return s
}

const medGard = () => ok(kjopJord(rik(), 'gard-lista'))

describe('gårdens side i deler', () => {
  it('tre sider: jorder og maskiner, dyr, lager og regnskap', () => {
    expect(GARDSSIDER.map((d) => d.navn)).toEqual(['Jorder og maskiner', 'Dyr', 'Lager og regnskap'])
  })

  it('radene sier hva som er der; uten fjøs sier dyrene hva som trengs', () => {
    const html = tegn(createElement(Gardsnav, { s: medGard(), id: 'gard-lista' }))
    expect(html).toContain('3 av 10 jorder · 0 av 3 maskiner')
    expect(html).toContain('Bygg et fjøs først')
    expect(html).toContain('Ukas priser og regnskapet')
    expect(html.match(/klubbside-rad/g)).toHaveLength(3)
  })

  it('en skog har ingen sider', () => {
    const s = ok(kjopJord(rik(), 'skog-trysil'))
    expect(tegn(createElement(Gardsnav, { s, id: 'skog-trysil' }))).toBe('')
  })

  it('dyrene og lageret uten fjøs og silo sier hvor de bygges', () => {
    const s = medGard()
    expect(tegn(createElement(Fjoskort, { s, id: 'gard-lista' }))).toContain('Gården har ikke fjøs ennå')
    const lager = tegn(createElement(Lagerkort, { s, id: 'gard-lista' }))
    expect(lager).toContain('Priser denne uka')
    expect(lager).toContain('Uten silo selges ukas avling mandag')
  })
})

describe('kortet: nedtellingen og «Silo full»', () => {
  it('uka så langt, av omtrent hele uka, og når høsten kommer', () => {
    const html = tegn(createElement(Jordkort, { s: medGard(), id: 'gard-lista' }))
    expect(html).toMatch(/Så langt denne uka kr [^<]+ av omtrent kr [^<]+\. Høstes mandag, om \d+ min\./)
  })

  it('«Silo full» på kortet og på lagerets rad når lageret som tar avlingen, er fullt', () => {
    let s = ok(kjopGardsbygg(medGard(), 'gard-lista', 'silo'))
    s = ok(settLagring(s, 'gard-lista', 'lagre'))
    expect(tegn(createElement(Jordkort, { s, id: 'gard-lista' }))).not.toContain('Silo full')
    s.jord['gard-lista']!.lager = lagerkapasitet(s, 'gard-lista', 'korn')
    expect(tegn(createElement(Jordkort, { s, id: 'gard-lista' }))).toContain('merke varsel">Silo full')
    expect(tegn(createElement(Gardsnav, { s, id: 'gard-lista' }))).toContain('merke varsel">Silo full')
  })
})

describe('«Gårder og skog» på Eiendom', () => {
  it('ingenting uten jord', () => {
    expect(tegn(createElement(Landkort, { s: rik() }))).toBe('')
  })

  it('nedtellingen, uka så langt og én rad per jordstykke — skogen med tømmeret', () => {
    const s = ok(kjopJord(medGard(), 'skog-trysil'))
    const html = tegn(createElement(Landkort, { s }))
    expect(html).toContain('Gårder og skog')
    expect(html).toMatch(/høstes mandag, om \d+ min/)
    expect(html).toMatch(/Så langt denne uka kr [^<]+ av omtrent kr/)
    expect(html.match(/klubbside-rad/g)).toHaveLength(2)
    expect(html).toContain('Gård på Lista')
    expect(html).toMatch(/Tømmer kr [^<]+ · best å hogge om \d+ dager/)
  })

  it('bare skog: ingen nedtelling', () => {
    const s = ok(kjopJord(rik(), 'skog-trysil'))
    const html = tegn(createElement(Landkort, { s }))
    expect(html).not.toContain('høstes mandag')
    expect(html.match(/klubbside-rad/g)).toHaveLength(1)
  })
})
