/**
 * Grafikkpakke G8: lettere tegninger, kort som synker når du trykker, målstripa
 * som glir bort under toppfeltet, og det vi fant da gatebildet og kjøpsøyeblikket
 * endelig ble sjekket i det lyse temaet.
 */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { Bedriftskort } from '../komponenter/Bedriftskort'
import { Illustrasjon, NY_STIL } from '../komponenter/Illustrasjoner'
import { Toppfelt } from '../komponenter/Toppfelt'

const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const tegn = (id: string, utklipp = false) => renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 96, utklipp }))

/** Id-ene en tegning definerer, og id-ene den peker til med url(#…). */
function ider(svg: string) {
  const definert = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
  const brukt = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])
  return { definert, brukt }
}

describe('lettere tegninger (G8)', () => {
  it('hver tegning definerer bare det den bruker, og alt den bruker finnes', () => {
    for (const id of NY_STIL) {
      for (const utklipp of [false, true]) {
        const { definert, brukt } = ider(tegn(id, utklipp))
        for (const ref of brukt) expect(definert, `${id}${utklipp ? ' (utklipp)' : ''} mangler ${ref}`).toContain(ref)
        for (const def of definert) expect(brukt, `${id}${utklipp ? ' (utklipp)' : ''} definerer ${def} uten å bruke den`).toContain(def)
      }
    }
  })

  it('et utklipp har ingen himmel og ingen bakke å definere', () => {
    const { definert } = ider(tegn('superbil', true))
    expect(definert.some((d) => /(h|v|vm|bm|km|nm|rm)$/.test(d))).toBe(false)
  })

  it('i snitt under 30 skjulte elementer per tegning (før G8: rundt 54)', () => {
    const tall = NY_STIL.map((id) => (tegn(id).match(/<defs>[\s\S]*?<\/defs>/)?.[0].match(/<[a-zA-Z]/g) ?? []).length)
    const snitt = tall.reduce((a, b) => a + b, 0) / tall.length
    expect(snitt).toBeLessThan(30)
  })

})

describe('kort som åpner en side (G8)', () => {
  it('bedriftskortet åpnes med et trykk på kortet, som kortene fra G7', () => {
    const s = nyttSpill()
    const html = renderToStaticMarkup(createElement(Bedriftskort, { s, b: s.bedrifter[0], mengde: '1', åpne: () => {} }))
    expect(html).toMatch(/<li class="[^"]*kan-aapnes/)
  })

  it('kortet synker litt mens du trykker, men ikke når det er en knapp i det du trykker på', () => {
    expect(css).toMatch(/\.kan-aapnes:active:not\(:has\(button:active, a:active, input:active\)\) \{[^}]*transform: scale\(0\.985\)/)
  })
})

describe('målstripa (G8)', () => {
  it('står etter det faste toppfeltet, ikke i det', () => {
    const html = renderToStaticMarkup(createElement(Toppfelt, { s: nyttSpill(), tilProfil: () => {}, åpneAvis: () => {}, gåTil: () => {} }))
    const header = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''
    expect(header).not.toContain('maalstripe')
    expect(html).toMatch(/<\/header><div class="maalfelt">/)
  })

  it('er ikke fast, og har sin egen rad i det brede oppsettet', () => {
    const maalfelt = css.match(/\n\.maalfelt \{[^}]*\}/)?.[0] ?? ''
    expect(maalfelt).not.toContain('sticky')
    expect(css).toMatch(/'meny topp'\s*'meny maal'\s*'meny innhold'/)
  })
})

describe('sjekket i det lyse temaet (G8)', () => {
  it('kjøpsøyeblikket har en lys flekk bak navnet i det lyse temaet', () => {
    expect(css).toMatch(/:root\[data-theme='light'\] \.kjopsglimt \{[^}]*rgba\(255, 255, 255/)
  })

  it('gata blekner i kanten der det står mer', () => {
    for (const k of ['mer-hoyre', 'mer-venstre']) expect(css).toMatch(new RegExp(`\\.gate\\.${k} \\{[^}]*mask-image`))
  })
})
