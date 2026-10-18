/** Pakke 106: skogkortet sier når den bør hogges, og fjøset viser hva dyrene gir og hva som venter. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopDyr, kjopGardsbygg, kjopJord, type Utfall } from '../../engine/handlinger'
import { DAG_SEK } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { Fjoskort, Jordkort } from '../komponenter/JordOgLandemerker'
import { FORKLARINGER } from '../forklaringer'
import { lastAlle } from '../vedBehov'

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

describe('skogkortet', () => {
  it('sier hvor fort tømmeret vokser og hvor lenge til hogst', () => {
    const s = ok(kjopJord(rik(), 'skog-trysil'))
    s.sek += 10 * DAG_SEK
    const html = renderToStaticMarkup(createElement(Jordkort, { s, id: 'skog-trysil' }))
    expect(html).toMatch(/Vokser nå kr [\d,\s]+(mill|mrd)? om dagen · best å hogge om 26 dager/)
    expect(html).not.toContain('Klar for hogst')
  })

  it('sier «Klar for hogst» fra dag 36', () => {
    const s = ok(kjopJord(rik(), 'skog-trysil'))
    s.sek += 40 * DAG_SEK
    const html = renderToStaticMarkup(createElement(Jordkort, { s, id: 'skog-trysil' }))
    expect(html).toContain('<span class="merke gull">Klar for hogst</span>')
    expect(html).not.toContain('best å hogge om')
  })

  it('en gård har ingen skoglinje', () => {
    const s = ok(kjopJord(rik(), 'gard-lista'))
    expect(renderToStaticMarkup(createElement(Jordkort, { s, id: 'gard-lista' }))).not.toContain('Vokser nå')
  })
})

describe('fjøset', () => {
  it('hver rad sier hva ett dyr til gir; ulla og kjøttet som venter, står over', () => {
    let s = ok(kjopGardsbygg(ok(kjopJord(rik(), 'gard-lista')), 'gard-lista', 'fjos'))
    s = ok(kjopDyr(ok(kjopDyr(s, 'gard-lista', 'sau')), 'gard-lista', 'gris'))
    s.sek += 3 * DAG_SEK
    // Pakke 112: fjøset står på sin egen side, «Dyr».
    const html = renderToStaticMarkup(createElement(Fjoskort, { s, id: 'gard-lista' }))
    expect(html).toMatch(/Ull så langt kr [^·]+· klippes 1\. (mai|september)/)
    expect(html).toMatch(/Kjøtt så langt kr [^·]+· slakt \d+\. [a-zø]+/)
    // Fire dyreslag med plass igjen: fire linjer med hva det gir.
    const start = html.indexOf('class="kornlager fjos"')
    const fjos = html.slice(start, html.indexOf('gardsmaskin', start))
    expect(fjos.match(/i uka · tilbake på/g)!.length).toBe(4)
  })

  it('uten sauer og griser står ingen ventelinje', () => {
    let s = ok(kjopGardsbygg(ok(kjopJord(rik(), 'gard-lista')), 'gard-lista', 'fjos'))
    s = ok(kjopDyr(s, 'gard-lista', 'ku'))
    const html = renderToStaticMarkup(createElement(Fjoskort, { s, id: 'gard-lista' }))
    expect(html).not.toContain('så langt')
  })
})

describe('forklaringen', () => {
  it('har dyrenes andeler, regionen og når skogen bør hogges', () => {
    const t = FORKLARINGER.jord.tekst
    expect(t).toContain('Kua gir 4 % av prisen i uka, grisen 5,5 %, sauen 6 % og høna 7 %')
    expect(t).toContain('følger prisene i regionen sin')
    expect(t).toContain('raskest rundt dag 18')
    expect(t).toContain('rundt dag 36')
    expect(t).not.toContain('de første 36 dagene')
  })
})
