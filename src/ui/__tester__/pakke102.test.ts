/** Pakke 102: Bedrifter fra toppen — mindre over det første kortet, merkene på ett sted, de billige forbedringene i ett trykk. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { forbedringspris, nesteForbedring } from '../../engine/formler'
import { kjopForbedringer } from '../../engine/handlinger'
import { nyttSpill } from '../../engine/start'
import type { Spilltilstand } from '../../engine/types'
import { Bedriftskort } from '../komponenter/Bedriftskort'
import { Bedrifter, BILLIG_ANDEL } from '../screens/Bedrifter'
import { lastAlle } from '../vedBehov'

const tom = () => {}
const tegn = (s: Spilltilstand) => renderToStaticMarkup(createElement(Bedrifter, { s, tilRival: tom }))
let rik: Spilltilstand

beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

describe('mindre over det første kortet', () => {
  it('«Markedet i dag» står i overskriftsraden, og datoen står ikke en gang til', () => {
    const html = tegn(rik)
    const hode = html.slice(html.indexOf('skjerm-hode'), html.indexOf('</div>', html.indexOf('skjerm-hode')))
    expect(hode).toContain('Dine bedrifter')
    // Pakke 129: «Markedet», så bryteren for kompakt visning får plass i raden.
    expect(hode).toContain('Markedet')
    expect(html).not.toContain('dagen-dato')
  })

  it('kjøpsmengdene og rekkefølgen deler én rad, og rekkefølgen er én knapp', () => {
    const html = tegn(rik)
    const rad = html.slice(html.indexOf('bedrifter-kontroller'), html.indexOf('kortliste'))
    expect(rad).toContain('mengdevalg')
    expect(rad).toContain('Rekkefølge på bedriftene')
    expect((rad.match(/aria-label="Rekkefølge: /g) ?? []).length).toBe(1)
  })

  it('i et nytt spill, med én bedrift på nivå 1, står kjøpsmengdene ikke der ennå', () => {
    expect(tegn(nyttSpill())).not.toContain('mengdevalg')
    const s = nyttSpill()
    s.bedrifter[0].nivaa = 10
    expect(tegn(s)).toContain('mengdevalg')
  })

  it('uten kjøpsmengdene kjøper knappen ett nivå, uansett hva som er lagret', () => {
    // «Maks» lagret fra før: med 1 mill i kassa ville knappen ellers kjøpt mange nivåer.
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'milliardaer.kjopsmengde' ? 'maks' : null), setItem: () => {}, removeItem: () => {} })
    try {
      const s = nyttSpill()
      s.kontanter = 1e6
      expect(tegn(s)).toContain('→ nivå 2 ·')
      s.bedrifter[0].nivaa = 10
      expect(tegn(s)).not.toContain('→ nivå 11 ·')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('merkene på ett sted', () => {
  it('«Leder» og retningen står på en egen rad under nivået, ikke på navnelinja', () => {
    const s = structuredClone(rik)
    for (const b of s.bedrifter.slice(0, 3)) {
      b.leder = true
      const html = renderToStaticMarkup(createElement(Bedriftskort, { b, s, mengde: '1', åpne: tom }))
      const h2 = html.slice(html.indexOf('<h2'), html.indexOf('</h2>'))
      expect(h2, b.type).not.toContain('Leder')
      expect(html, b.type).toMatch(/class="kortmerker"><span class="merke kant">Leder/)
    }
  })
})

describe('de billige forbedringene i ett trykk', () => {
  it('en linje over lista når minst to forbedringer koster under 0,1 % av kontantene hver', () => {
    const s = structuredClone(rik)
    const billige = s.bedrifter.filter((b) => {
      const f = nesteForbedring(b)
      return f && b.nivaa >= f.nivaa && forbedringspris(b, f) <= BILLIG_ANDEL * s.kontanter
    })
    expect(billige.length).toBeGreaterThanOrEqual(2)
    // Pakke 129: i én stripe med retningen — halvparten når bedrifter også venter på retning, hele når ikke.
    expect(tegn(s)).toContain(`Kjøp ${billige.length} billige`)
    const utenRetning = structuredClone(s)
    for (const b of utenRetning.bedrifter) b.retning = 'volum'
    expect(tegn(utenRetning)).toContain(`Kjøp alle billige forbedringer (${billige.length})`)
    s.kontanter = 0
    expect(tegn(s)).not.toContain('stripe-billige')
  })

  it('kjøper neste forbedring i hver, og hopper over den det ikke er råd til', () => {
    const s = structuredClone(rik)
    const [a, b] = s.bedrifter.filter((x) => nesteForbedring(x) && x.nivaa >= nesteForbedring(x)!.nivaa)
    const prisA = forbedringspris(a, nesteForbedring(a)!)
    s.kontanter = prisA
    const u = kjopForbedringer(s, [a.id, b.id])
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.tilstand.bedrifter.find((x) => x.id === a.id)!.forbedringer).toBe(a.forbedringer + 1)
    expect(u.tilstand.bedrifter.find((x) => x.id === b.id)!.forbedringer).toBe(b.forbedringer)
    s.kontanter = 0
    expect(kjopForbedringer(s, [a.id, b.id]).ok).toBe(false)
  })
})
