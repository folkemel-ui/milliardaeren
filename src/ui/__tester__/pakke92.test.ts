/** Pakke 92: gårdens kart og maskinene på gårdens side, og trinnet på kortet. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopJord, kjopJorde, kjopMaskin, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { Gardskart, Jordkort } from '../komponenter/JordOgLandemerker'
import { FORKLARINGER } from '../forklaringer'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopJord(s, 'gard-lista'))
}

describe('gårdens kart', () => {
  it('ti ruter: tre dyrket, neste med pris, resten låst; trinnet og hva neste gir', () => {
    const html = tegn(createElement(Gardskart, { s: medGard(), id: 'gard-lista' }))
    expect(html.match(/jordrute dyrket/g)).toHaveLength(3)
    expect(html.match(/jordrute ny/g)).toHaveLength(1)
    expect(html.match(/jordrute laast/g)).toHaveLength(6)
    expect(html).toContain('Småbruk')
    expect(html).toContain('3 av 10 jorder')
    expect(html).toContain('Gård ved 5 jorder: +3 status.')
    expect(html).toContain('Bygg')
    expect(html).toContain('Havre')
  })

  it('maskinene: trinnet og neste trinn, eller pris (Pakke 114: tre trinn)', () => {
    const s = ok(kjopMaskin(medGard(), 'gard-lista', 'traktor'))
    const html = tegn(createElement(Gardskart, { s, id: 'gard-lista' }))
    expect(html).toContain('Traktor</strong> · trinn 1 av 3')
    expect(html).toMatch(/Trinn 2 · kr/)
    expect(html).toMatch(/Kjøp · kr/)
    expect(html).toContain('Skurtresker')
    expect(html).toContain('Sprøyte')
  })

  it('et gods har ingen ny rute', () => {
    let s = medGard()
    for (let i = 0; i < 7; i++) s = ok(kjopJorde(s, 'gard-lista'))
    const html = tegn(createElement(Gardskart, { s, id: 'gard-lista' }))
    expect(html).toContain('Gods')
    expect(html.match(/jordrute dyrket/g)).toHaveLength(10)
    expect(html).not.toContain('jordrute ny')
  })

  it('vises ikke for en skog', () => {
    const s = medGard()
    s.jord['skog-trysil'] = { kostpris: 1, plantetSek: 0 }
    expect(tegn(createElement(Gardskart, { s, id: 'skog-trysil' }))).toBe('')
  })
})

it('kortet viser trinnet og jordene, og verdien med det som er bygd', () => {
  let s = medGard()
  s = ok(kjopJorde(ok(kjopJorde(s, 'gard-lista')), 'gard-lista'))
  const html = tegn(createElement(Jordkort, { s, id: 'gard-lista' }))
  expect(html).toContain('Gård · 5 av 10 jorder')
})

it('forklaringen har jordene, maskinene og trinnene', () => {
  const t = FORKLARINGER.jord.tekst
  expect(t).toContain('3 jorder')
  expect(t).toContain('opptil 10')
  expect(t).toContain('+10 % avling')
  expect(t).toContain('et gods')
})
