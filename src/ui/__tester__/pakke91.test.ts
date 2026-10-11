/** Pakke 91: oversikten over samlingen, stedene i full størrelse og en linje om hver ting. */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { LUKSUS, LUKSUSLISTE } from '../../engine/eiendom'
import { UNIKLISTE } from '../../engine/unike'
import type { Spilltilstand } from '../../engine/types'
import { Samlingsoversikt } from '../komponenter/Samlingsoversikt'
import { Luksuskort } from '../screens/Luksus'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const kilde = (sti: string) => readFileSync(new URL(sti, import.meta.url), 'utf8')

beforeAll(async () => {
  await lastAlle()
})

function med(...ider: string[]): Spilltilstand {
  const s = nyttSpill()
  s.luksus = ider as Spilltilstand['luksus']
  return s
}

describe('en linje om hver ting', () => {
  it('alle 26 har sin egen linje, kort nok for én til to linjer på en telefon', () => {
    const linjer = LUKSUSLISTE.map((id) => LUKSUS[id].linje)
    expect(linjer).toHaveLength(26)
    expect(new Set(linjer).size).toBe(26)
    for (const l of linjer) {
      expect(l.length).toBeGreaterThan(20)
      expect(l.length).toBeLessThanOrEqual(90)
    }
  })

  it('står på kortet, under statusen', () => {
    const html = tegn(createElement(Luksuskort, { s: nyttSpill(), id: 'superyacht' }))
    expect(html).toContain('Bygget i Viareggio, 74 meter')
  })
})

describe('oversikten', () => {
  it('en rad per slag med «x av y», en knapp per ting, skygge for det du ikke eier', () => {
    const html = tegn(createElement(Samlingsoversikt, { s: med('stasjonsvogn', 'elbil', 'gullklokke') }))
    expect(html).toContain('3 av 26')
    expect(html).toMatch(/Biler <span class="dempet">2 av 8/)
    expect(html).toMatch(/Klokker <span class="dempet">1 av 6/)
    expect(html).toMatch(/Båter <span class="dempet">0 av 7/)
    expect(html).toMatch(/Fly <span class="dempet">0 av 5/)
    expect(html.match(/<button class="samling-ting/g)).toHaveLength(26)
    expect(html.match(/samling-skygge/g)).toHaveLength(23)
  })

  it('de unike: bare dem du eier, i gull, og hvor mange av tolv', () => {
    const s = med()
    expect(tegn(createElement(Samlingsoversikt, { s }))).toContain(`0 av ${UNIKLISTE.length} · fra auksjonene`)
    s.auksjon = { nesteDag: 0, eide: { polarklokka: { kostpris: 3e8, dag: 1 } }, borte: {} }
    const html = tegn(createElement(Samlingsoversikt, { s }))
    expect(html).toContain('1 av 12')
    expect(html.match(/samling-ting unik eid/g)).toHaveLength(1)
    expect(html).toContain('1 unik')
  })
})

describe('Samling på skjermen', () => {
  const luksus = kilde('../screens/Luksus.tsx')

  it('«til salgs»-listene er borte; oversikten står øverst, under auksjonen', () => {
    expect(luksus).not.toContain('function TilSalgs')
    expect(luksus).not.toContain('luksus-salg-')
    expect(luksus.indexOf('<Auksjonskort s={s} />')).toBeLessThan(luksus.indexOf('<Samlingsoversikt s={s} />'))
  })

  it('overskriften på et sted åpner det i full størrelse, to plasser i bredden', () => {
    expect(luksus).toContain('onClick={() => aapneLager(lager)}')
    expect(luksus).toContain('<Lagerkort s={s} lager={lager} stor />')
    const css = kilde('../../styles/luksus.css')
    expect(css).toMatch(/\.lagerkort\.stor \.lagerscene \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/\.lager-apne \{[^}]*min-height: 44px/)
    expect(css).toMatch(/\.samling-ting \{[^}]*width: 44px;[^}]*height: 44px/)
  })
})
