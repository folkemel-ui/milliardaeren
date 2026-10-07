/** Pakke 42: stadion som vokser, lagrene som scener og tegningene i det lyse temaet. */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DIVISJONER, KLUBBNAVN } from '../../engine/klubb'
import { Stadion, STADIONTRINN } from '../komponenter/Stadion'
import { drakt } from '../komponenter/Klubbvaapen'
import { Illustrasjon } from '../komponenter/Illustrasjoner'

const tegn = (divisjon: number, navn = KLUBBNAVN[0]) => renderToStaticMarkup(createElement(Stadion, { divisjon, navn }))

describe('stadion', () => {
  it('har ett trinn per divisjon, og hvert trinn er en annen tegning', () => {
    expect(STADIONTRINN).toBe(DIVISJONER.length)
    const tegninger = Array.from({ length: STADIONTRINN }, (_, d) => tegn(d))
    expect(new Set(tegninger).size).toBe(STADIONTRINN)
  })

  it('vokser: flere tilskuere for hver divisjon', () => {
    // Hoder er små sirkler (G6: publikum som masse med hoder langs radene); spillerne og ballen er like på alle trinn.
    const hoder = Array.from({ length: STADIONTRINN }, (_, d) => (tegn(d).match(/<circle[^>]* r="0\.\d+"/g) ?? []).length)
    expect(hoder.every((n, i) => i === 0 || n > hoder[i - 1])).toBe(true)
  })

  it('bruker klubbens farger, og er lik hver gang', () => {
    const navn = KLUBBNAVN[1]
    expect(tegn(4, navn)).toContain(drakt(navn).farger[0])
    expect(tegn(2, navn)).toBe(tegn(2, navn))
  })

  it('tåler en divisjon utenfor lista', () => {
    expect(tegn(-1)).toBe(tegn(0))
    expect(tegn(9)).toBe(tegn(4))
  })

  it('har ingen <text> — tekst i SVG lekker inn i sidens tekst', () => {
    for (let d = 0; d < STADIONTRINN; d++) expect(tegn(d)).not.toContain('<text')
  })
})

describe('det lyse temaet', () => {
  const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8')

  it('tegningene har en klasse, og får en hårfin kant bare i det lyse temaet', () => {
    expect(renderToStaticMarkup(createElement(Illustrasjon, { id: 'stockholm' }))).toContain('class="illustrasjon"')
    expect(css).toMatch(/:root\[data-theme='light'\] \.illustrasjon:not\(\.lerret\),\s*:root\[data-theme='light'\] \.stadion \{\s*filter: drop-shadow/)
  })

  it('medaljene har et mørkt ikon i det lyse temaet', () => {
    expect(css).toMatch(/:root\[data-theme='light'\] \.merke-medalje \{\s*color: var\(--ring-mork\)/)
    for (const grad of ['solv', 'gull']) expect(css).toMatch(new RegExp(`\\.merke-medalje\\.${grad} \\{[^}]*--ring-mork`))
  })
})
