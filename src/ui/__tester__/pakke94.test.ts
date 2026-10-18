/** Pakke 94: fjøset, dyrene og gårdens regnskap på gårdens side. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopDyr, kjopGardsbygg, kjopJord, kjopJorde, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { Fjoskort, Gardsregnskap } from '../komponenter/JordOgLandemerker'
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

function medFjos(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopGardsbygg(ok(kjopJord(s, 'gard-lista')), 'gard-lista', 'fjos'))
}

describe('fjøset', () => {
  it('plassene, dyrene du har og et kjøp per slag', () => {
    const s = ok(kjopDyr(ok(kjopDyr(medFjos(), 'gard-lista', 'ku')), 'gard-lista', 'ku'))
    // Pakke 112: fjøset står på sin egen side, «Dyr».
    const html = tegn(createElement(Fjoskort, { s, id: 'gard-lista' }))
    expect(html).toContain('2 av 4 plasser')
    expect(html).toContain('2 kyr')
    expect(html).toContain('klippes 1. mai og 1. september')
    expect(html).toContain('slakt hver 8. uke')
    expect(html.match(/Kjøp · kr/g)!.length).toBeGreaterThanOrEqual(4)
  })

  it('et fullt fjøs sier at en større gård gir flere plasser', () => {
    let s = medFjos()
    for (let i = 0; i < 4; i++) s = ok(kjopDyr(s, 'gard-lista', 'hone'))
    expect(tegn(createElement(Fjoskort, { s, id: 'gard-lista' }))).toContain('Fjøset er fullt')
  })
})

describe('gårdens regnskap', () => {
  it('ukene med inn og bygd, og summen siden kjøpet', () => {
    const s = ok(kjopJorde(medFjos(), 'gard-lista'))
    const html = tegn(createElement(Gardsregnskap, { s, id: 'gard-lista' }))
    expect(html).toContain('Gårdens regnskap')
    expect(html).toContain('Bygd og kjøpt')
    expect(html).toContain('Høst siden kjøpet')
  })

  it('vises ikke for en skog', () => {
    const s = medFjos()
    s.jord['skog-trysil'] = { kostpris: 1, plantetSek: 0 }
    expect(tegn(createElement(Gardsregnskap, { s, id: 'skog-trysil' }))).toBe('')
  })
})

it('forklaringen har fjøset, dyrene og tilskuddet', () => {
  const t = FORKLARINGER.jord.tekst
  expect(t).toContain('4, 8, 12 og 20 dyr')
  expect(t).toContain('1. mai og 1. september')
  expect(t).toContain('produksjonstilskudd')
})
