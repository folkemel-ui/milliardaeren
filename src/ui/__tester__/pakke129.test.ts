/** Pakke 129: Bedrifter kortere — én stripe, ett segment, kompakt visning og en rolig første dag. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { nyttSpill } from '../../engine/start'
import { DAG_SEK } from '../../engine/kalender'
import { dagsbilde } from '../../engine/verden'
import type { Spilltilstand } from '../../engine/types'
import { IDag, Kompaktrad, ROLIGE_DAGER } from '../komponenter/Bedriftskort'
import { Bedrifter } from '../screens/Bedrifter'
import { bedriftsvisning } from '../deler'
import { lastAlle } from '../vedBehov'

const tom = () => {}
const tegn = (s: Spilltilstand) => renderToStaticMarkup(createElement(Bedrifter, { s, tilRival: tom }))
let rik: Spilltilstand

beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

afterEach(() => bedriftsvisning.sett('kort'))

/** Teksten i elementet som starter med `class="<klasse>"`, til den lukkes. */
function del(html: string, klasse: string, slutt: string): string {
  const i = html.indexOf(`class="${klasse}"`)
  return i < 0 ? '' : html.slice(i, html.indexOf(slutt, i))
}

describe('overskriftsraden', () => {
  it('«Markedet ›» og bryteren for kompakt visning, fra den tredje bedriften', () => {
    const hode = del(tegn(rik), 'skjerm-hode', 'bedrifter-kontroller')
    expect(hode).toContain('Markedet')
    expect(hode).not.toContain('Markedet i dag')
    expect(hode).toMatch(/class="visningsknapp" aria-pressed="false" aria-label="Kompakt visning/)
    expect(tegn(nyttSpill())).not.toContain('visningsknapp')
  })
})

describe('én stripe', () => {
  it('retningen og de billige forbedringene som to halvdeler i én stripe, i én stil', () => {
    const html = tegn(rik)
    expect(html).toContain('class="varselstripe delt"')
    expect(html).toMatch(/stripe-retning[\s\S]*venter på retning/)
    expect(html).toMatch(/stripe-billige[\s\S]*Kjøp \d+ billige/)
    // De gamle linjene i to stiler er borte.
    expect(html).not.toContain('retningslinje')
    expect(html).not.toContain('billiglinje')
  })

  it('bare den ene: hele stripa, med hele teksten', () => {
    const s = structuredClone(rik)
    for (const b of s.bedrifter) b.retning = 'volum'
    const html = tegn(s)
    expect(html).toContain('class="varselstripe"')
    expect(html).toContain('Kjøp alle billige forbedringer (')
    s.kontanter = 0
    expect(tegn(s)).not.toContain('varselstripe')
  })
})

describe('ett segment', () => {
  it('mengdene og rekkefølgen i samme segment, med en strek før rekkefølgen — ingen boks i boksen', () => {
    const rad = del(tegn(rik), 'bedrifter-kontroller segment', 'kortliste')
    expect(rad).toContain('class="mengdevalg" role="radiogroup"')
    expect(rad).toContain('class="rekkefolge med-skille" role="group"')
    expect(rad).toContain('class="rekkefolge-knapp"')
    expect(rad.match(/class="segment/g) ?? []).toHaveLength(0)
  })
})

describe('kompakt visning', () => {
  it('én rad per bedrift, med bildet, navnet, inntekten og prisen på knappen', () => {
    bedriftsvisning.sett('kompakt')
    const html = tegn(rik)
    expect(html).toContain('class="kortliste kompakt"')
    expect(html.match(/bedriftskort-kompakt/g) ?? []).toHaveLength(rik.bedrifter.length)
    expect(html).not.toContain('milepael-spor')
    expect(html).toMatch(/class="visningsknapp aktiv" aria-pressed="true"/)
  })

  it('knappen viser bare prisen, men leser opp hele kjøpet', () => {
    const s = structuredClone(rik)
    const b = s.bedrifter[0]
    s.kontanter = 1e18
    const html = renderToStaticMarkup(createElement(Kompaktrad, { b, s, mengde: '1', åpne: tom }))
    expect(html).toMatch(new RegExp(`aria-label="→ nivå ${b.nivaa + 1} · kr [^"]+"`))
    // Den synlige teksten: etter åpningstaggen, til knappen lukkes.
    const start = html.indexOf('>', html.indexOf('kort-knapp')) + 1
    const synlig = html.slice(start, html.indexOf('</button>', start))
    expect(synlig).not.toContain('nivå')
    expect(synlig).toMatch(/^kr [\d ,]+/)
  })

  it('en klar forbedring og en retning som venter står som tegn ved navnet', () => {
    const s = structuredClone(rik)
    const b = s.bedrifter.find((x) => x.nivaa >= 60)!
    const html = renderToStaticMarkup(createElement(Kompaktrad, { b, s, mengde: '1', åpne: tom }))
    expect(html).toContain('aria-label="En forbedring er klar"')
    expect(html).toContain('aria-label="Venter på retning"')
  })
})

describe('en rolig første dag', () => {
  it('dag 0 og 1 er snø i hvert spill, og været står i grått der; fra dag 2 i farge', () => {
    expect(ROLIGE_DAGER).toBe(2)
    const s = nyttSpill()
    const b = s.bedrifter[0]
    for (const dag of [0, 1]) {
      s.sek = dag * DAG_SEK + 10
      expect(dagsbilde(s).vaer).toBe('sno')
      expect(renderToStaticMarkup(createElement(IDag, { s, b }))).toContain('class="i-dag liten dempet"')
    }
    // Neste dag med vær som gjør noe: rødt eller grønt igjen.
    for (let dag = 2; dag < 20; dag++) {
      s.sek = dag * DAG_SEK + 10
      const html = renderToStaticMarkup(createElement(IDag, { s, b }))
      if (!html) continue
      expect(html).toMatch(/class="i-dag liten (pluss|minus)"/)
      return
    }
    throw new Error('ingen dag med vær etter dag 1')
  })
})
