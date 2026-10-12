/** Pakke 95: feilskjermen med feilrapport og oppdatering, og kortet om Hjem-skjermen. */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Avbruddskjerm } from '../komponenter/Avbrudd'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const kilde = (sti: string) => readFileSync(new URL(sti, import.meta.url), 'utf8')

describe('feilskjermen', () => {
  it('har «Kopier feilrapport» og «Prøv igjen»', () => {
    const html = tegn(createElement(Avbruddskjerm, { a: { type: 'feil', melding: 'Noe brakk', stakk: 'Error: Noe brakk\n  at x' } }))
    expect(html).toContain('Kopier feilrapport')
    expect(html).toContain('Prøv igjen')
    expect(html).toContain('Start et nytt spill')
  })

  it('en lagring fra en nyere versjon får «Oppdater og last inn», ikke et nytt spill', () => {
    const html = tegn(createElement(Avbruddskjerm, { a: { type: 'feil', melding: 'Lagringen er fra en nyere spillversjon (26 — denne er 25).' } }))
    expect(html).toContain('Oppdater og last inn')
    expect(html).not.toContain('Start et nytt spill')
    expect(html).not.toContain('Prøv igjen')
  })

  it('rapporten har versjon, tid, nettleser, feil, stakk og lagringen', () => {
    const avbrudd = kilde('../komponenter/Avbrudd.tsx')
    for (const del of ['Versjon:', 'Tid:', 'Nettleser:', 'Feil:', 'Stakk', 'Lagring:']) expect(avbrudd).toContain(del)
    expect(avbrudd).toContain('lagringSomKode')
  })
})

describe('kopien uten venting', () => {
  it('koden lages når panelet vises, og kopien skjer inne i trykket', () => {
    const flytt = kilde('../komponenter/FlyttSpillet.tsx')
    expect(flytt).toContain('const [ferdig, settFerdig]')
    expect(flytt).toContain('ClipboardItem')
    // Kopieringen venter ikke på eksporten før utklippstavlen kalles.
    expect(flytt).not.toMatch(/async function kopier\(\)/)
  })
})

describe('Hjem-skjermen', () => {
  it('kortet står øverst på Bedrifter, med «Ikke nå» og «Skjul»', () => {
    expect(kilde('../screens/Bedrifter.tsx')).toContain('<Hjemskjermkort />')
    const kort = kilde('../komponenter/Hjemskjerm.tsx')
    expect(kort).toContain('Ikke nå')
    expect(kort).toContain('Skjul')
    expect(kort).toContain('Legg til på Hjem-skjerm')
  })
})
