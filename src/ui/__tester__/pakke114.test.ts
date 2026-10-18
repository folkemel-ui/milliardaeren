/** Pakke 114: nabogården og maskintrinnene på «Jorder og maskiner», og navnet på gårdens kort. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopJord, kjopJorde, kjopMaskin, kjopNabogard, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { Gardskart, Jordkort } from '../komponenter/JordOgLandemerker'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const ID = 'gard-lista'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return ok(kjopJord(s, ID))
}

function medGods(): Spilltilstand {
  let s = medGard()
  for (let i = 0; i < 7; i++) s = ok(kjopJorde(s, ID))
  return s
}

describe('nabogården', () => {
  it('før gods: «Krever gods»', () => {
    const html = tegn(createElement(Gardskart, { s: medGard(), id: ID }))
    expect(html).toContain('Nabogården')
    expect(html).toContain('merke kant">Krever gods')
  })

  it('på et gods: pris og hva den gir; etter tre: ferdig', () => {
    let s = medGods()
    let html = tegn(createElement(Gardskart, { s, id: ID }))
    expect(html).toMatch(/avlingen ×3, og \+25 status/)
    expect(html).toMatch(/≈ kr [^<]+ i uka · tilbake på/)
    for (let i = 0; i < 3; i++) s = ok(kjopNabogard(s, ID))
    html = tegn(createElement(Gardskart, { s, id: ID }))
    expect(html).toContain('Nabogården</strong> · 3 av 3')
    expect(html).toContain('27 ganger så stor')
  })

  it('kortet sier «Gods med 1 nabogård»', () => {
    const s = ok(kjopNabogard(medGods(), ID))
    expect(tegn(createElement(Jordkort, { s, id: ID }))).toContain('Gods med 1 nabogård · 10 av 10 jorder')
  })
})

describe('maskintrinnene', () => {
  it('nå og neste, og «Ferdig» på trinn 3', () => {
    let s = ok(kjopMaskin(medGard(), ID, 'tresker'))
    let html = tegn(createElement(Gardskart, { s, id: ID }))
    expect(html).toContain('Nå +15 % avling; neste +30 % avling')
    s = ok(kjopMaskin(ok(kjopMaskin(s, ID, 'tresker')), ID, 'tresker'))
    html = tegn(createElement(Gardskart, { s, id: ID }))
    expect(html).toContain('Skurtresker</strong> · trinn 3 av 3')
    expect(html).toContain('+45 % avling')
    expect(html).toContain('merke ok">Ferdig')
  })
})
