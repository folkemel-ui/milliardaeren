/** Pakke 115: kraftkortet på «Jorder og maskiner» og på skogens side. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { byggKraftverk, kjopJord, type Utfall } from '../../engine/handlinger'
import type { JordId, Spilltilstand } from '../../engine/types'
import { Kraftkort } from '../komponenter/JordOgLandemerker'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

function med(id: JordId): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return ok(kjopJord(s, id))
}

describe('kraftkortet', () => {
  it('Lista: vindturbiner med pris og tilbakebetaling, panelene krever låve', () => {
    const html = tegn(createElement(Kraftkort, { s: med('gard-lista'), id: 'gard-lista' }))
    expect(html).toContain('Vindturbiner')
    expect(html).toMatch(/≈ kr [^<]+ i uka · tilbake på (9|10) t/)
    expect(html).toContain('merke kant">Krever låve')
  })

  it('bygd: hva det gir nå og har tjent', () => {
    const s = ok(byggKraftverk(med('skog-namdalen'), 'skog-namdalen', 'vann'))
    const html = tegn(createElement(Kraftkort, { s, id: 'skog-namdalen' }))
    expect(html).toContain('Småkraftverk')
    expect(html).toMatch(/Gir \+kr [^<]+\/s nå · har tjent kr 0/)
    expect(html).toContain('merke ok">Bygd')
  })

  it('ingenting i Trysil', () => {
    expect(tegn(createElement(Kraftkort, { s: med('skog-trysil'), id: 'skog-trysil' }))).toBe('')
  })
})
