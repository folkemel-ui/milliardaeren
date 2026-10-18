/** Pakke 113: dagbrikkene på gårdens kort, prisgrafen, avlingsprisene i «Markedet i dag» og gårdene i «Uka di». */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopJord, type Utfall } from '../../engine/handlinger'
import { DAG_SEK, ukedag } from '../../engine/kalender'
import { avlingspris, GRUPPELISTE, ukeFor } from '../../engine/jord'
import type { Oppgjor, Spilltilstand } from '../../engine/types'
import { Jordkort, Lagerkort } from '../komponenter/JordOgLandemerker'
import { Avlingspriser } from '../komponenter/Avlingspriser'
import { UkaDi } from '../komponenter/UkaDi'
import { AVLING_HOY, AVLING_LAV, markedetIDag } from '../markedet'
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
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return ok(kjopJord(s, 'gard-lista'))
}

describe('dagbrikkene', () => {
  it('sju dager: de som har vært — i dag med — har været, resten kommer', () => {
    for (const ekstra of [0, 2, 6]) {
      const s = medGard()
      let d = 21
      while (ukedag(d * DAG_SEK) !== 0) d++
      s.sek = (d + ekstra) * DAG_SEK + 10
      const html = tegn(createElement(Jordkort, { s, id: 'gard-lista' }))
      expect(html.match(/class="ukedag /g)).toHaveLength(7)
      expect(html.match(/ukedag kommer/g)?.length ?? 0).toBe(6 - ekstra)
      expect(html).toContain('ukedag-navn">M<')
      expect(html).toMatch(/Været så langt gir <strong[^>]*>×\d,\d\d/)
    }
  })

  it('en skog har ingen dagbrikker', () => {
    const s = ok(kjopJord(medGard(), 'skog-trysil'))
    expect(tegn(createElement(Jordkort, { s, id: 'skog-trysil' }))).not.toContain('ukedag')
  })
})

describe('prisgrafen', () => {
  it('tre linjer over åtte uker, ×1,00 stiplet, og denne uka mot snittet skrevet ut', () => {
    const html = tegn(createElement(Avlingspriser, { sek: 50 * DAG_SEK }))
    expect(html.match(/<polyline/g)).toHaveLength(3)
    expect(html).toContain('graf-snitt')
    expect(html.match(/avlingspriser-farge/g)).toHaveLength(3)
    expect(html).toMatch(/(over|under) snittet|som snittet/)
    expect(html).toContain('denne uka')
  })

  it('står på lagerets side', () => {
    expect(tegn(createElement(Lagerkort, { s: medGard(), id: 'gard-lista' }))).toContain('avlingsgraf')
  })
})

describe('«Markedet i dag»', () => {
  it('ingen avlingspriser uten gård', () => {
    const s = nyttSpill()
    expect(markedetIDag(s).linjer.some((l) => /pris/i.test(l.navn))).toBe(false)
  })

  it('med gård: høye og lave priser teller, ellers én stille linje', () => {
    let hoy = 0
    let stille = 0
    for (let d = 7; d < 7 * 60; d += 7) {
      const s = medGard()
      s.sek = d * DAG_SEK
      const uke = ukeFor(d)
      const m = markedetIDag(s)
      const ytterst = GRUPPELISTE.filter((g) => avlingspris(g, uke) >= AVLING_HOY || avlingspris(g, uke) <= AVLING_LAV)
      const linjer = m.linjer.filter((l) => /^(Høy|Lav) pris/.test(l.navn))
      expect(linjer).toHaveLength(ytterst.length)
      expect(linjer.every((l) => l.spesiell)).toBe(true)
      if (ytterst.length) hoy++
      else {
        expect(m.linjer.find((l) => l.navn === 'Avlingsprisene')?.spesiell).toBe(false)
        stille++
      }
    }
    expect(hoy).toBeGreaterThan(0)
    expect(stille).toBeGreaterThan(0)
  })
})

describe('«Uka di»', () => {
  it('gårdene står med beløpet og ukas vær', () => {
    const o = { periode: 'uke', gardene: { host: 12_300_000, vaer: 'God uke' }, forbes: [], formuekurve: [1] } as unknown as Oppgjor
    expect(tegn(createElement(UkaDi, { o }))).toMatch(/Gårdene ga <strong>kr 12,3\s*mill<\/strong> for god uke\./)
  })
})
