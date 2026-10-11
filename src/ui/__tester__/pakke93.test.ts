/** Pakke 93: prisene, drivhuset, byggene og kornlageret på gårdens side. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopGardsbygg, kjopJord, kjopJorde, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { Gardskart } from '../komponenter/JordOgLandemerker'
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

describe('gårdens side', () => {
  it('ukas priser for korn, grønnsaker og frukt og bær', () => {
    const html = tegn(createElement(Gardskart, { s: medGard(), id: 'gard-lista' }))
    expect(html).toContain('Priser denne uka')
    expect(html).toMatch(/korn <strong[^>]*>×\d,\d\d/)
    expect(html).toContain('grønnsaker')
    expect(html).toContain('frukt og bær')
  })

  it('byggene: drivhuset krever fem jorder, låven en silo', () => {
    const html = tegn(createElement(Gardskart, { s: medGard(), id: 'gard-lista' }))
    for (const navn of ['Drenering', 'Frostdekke', 'Drivhus', 'Silo', 'Låve']) expect(html).toContain(navn)
    expect(html).toContain('Krever 5 jorder')
    expect(html).toContain('Krever silo')
  })

  it('drivhuset er en ellevte rute, og siloen gir et kornlager med salg', () => {
    let s = medGard()
    s = ok(kjopJorde(ok(kjopJorde(s, 'gard-lista')), 'gard-lista'))
    s = ok(kjopGardsbygg(ok(kjopGardsbygg(s, 'gard-lista', 'drivhus')), 'gard-lista', 'silo'))
    const html = tegn(createElement(Gardskart, { s, id: 'gard-lista' }))
    expect(html).toContain('jordrute dyrket drivhus')
    expect(html).toContain('Tomater')
    expect(html).toContain('Kornlager')
    expect(html).toContain('Lagrer kornet')
    expect(html.match(/merke ok">Bygd/g)).toHaveLength(2)
  })
})

it('forklaringen har prisene, byggene og lageret', () => {
  const t = FORKLARINGER.jord.tekst
  expect(t).toContain('×0,75')
  expect(t).toContain('×1,30')
  expect(t).toContain('Drenering')
  expect(t).toContain('ellevte jord')
  expect(t).toContain('4 uker, 8 med låve')
})
