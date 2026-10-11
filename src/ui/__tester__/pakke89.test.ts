/** Pakke 89: auksjonen øverst i Samling, de unike tingene og utleien på kortene. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { dagFra, DAG_SEK } from '../../engine/kalender'
import { hentHjem, leiUt, type Utfall } from '../../engine/handlinger'
import { UNIKE } from '../../engine/unike'
import { brukteplasser } from '../../engine/eiendom'
import type { Spilltilstand } from '../../engine/types'
import { Auksjonskort, Unikkort } from '../komponenter/Auksjon'
import { charterlinje, Luksuskort } from '../screens/Luksus'
import { FORKLARINGER } from '../forklaringer'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

let rik: Spilltilstand
beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
  rik.sek = dagFra(2027, 6, 10) * DAG_SEK + 30
})

/** Et rikt spill med en auksjon som står åpen sin første dag. */
function medAuksjon(): Spilltilstand {
  const s = structuredClone(rik)
  const dag = Math.floor(s.sek / DAG_SEK)
  s.auksjon = { nesteDag: 0, eide: {}, borte: {}, aktiv: { id: 'le-mans-1971', fraDag: dag, tilDag: dag + 2, startpris: 160_000_000 } }
  return s
}

describe('auksjonen i Samling', () => {
  it('viser tingen, linjen, dagens bud og budet i morgen, og en kjøpsknapp', () => {
    const html = tegn(createElement(Auksjonskort, { s: medAuksjon() }))
    expect(html).toContain('Le Mans-vinneren fra 1971')
    expect(html).toContain(UNIKE['le-mans-1971'].linje)
    expect(html).toContain('3 dager igjen')
    expect(html).toMatch(/Budet står i <strong>kr 160 mill<\/strong>, i morgen kr 176 mill/)
    expect(html).toMatch(/Kjøp · kr 160 mill/)
  })

  it('siste dag sier at hammeren faller i morgen', () => {
    const s = medAuksjon()
    s.sek += 2 * DAG_SEK
    const html = tegn(createElement(Auksjonskort, { s }))
    expect(html).toContain('Siste dag')
    expect(html).toContain('I morgen faller hammeren')
  })

  it('uten plass i garasjen sier knappen det', () => {
    const s = medAuksjon()
    s.lager.garasje = brukteplasser(s, 'garasje')
    expect(tegn(createElement(Auksjonskort, { s }))).toContain('Ingen plass i garasjen')
  })

  it('vises ikke uten auksjon, eller når du har kjøpt den', () => {
    expect(tegn(createElement(Auksjonskort, { s: rik }))).toBe('')
    const s = medAuksjon()
    s.auksjon!.aktiv!.kjopt = true
    expect(tegn(createElement(Auksjonskort, { s }))).toBe('')
  })

  it('en unik ting du eier har merket «Unik», linjen og salg for 90 %', () => {
    const s = medAuksjon()
    s.auksjon!.eide.polarklokka = { kostpris: 300_000_000, dag: 1 }
    const html = tegn(createElement(Unikkort, { s, id: 'polarklokka' }))
    expect(html).toContain('Unik')
    expect(html).toContain('Polarklokka fra Sydpolen')
    expect(html).toMatch(/Selg · kr 270 mill/)
  })

  it('forklaringen har tallene fra motoren', () => {
    const t = FORKLARINGER.auksjon.tekst
    expect(t).toContain('3 dager')
    expect(t).toContain('10 %')
    expect(t).toContain('10 timer')
    expect(t).toContain('3 % av nyprisen')
  })
})

describe('utleie på kortet', () => {
  it('hjemme: hva den kan gi nå, og «Lei ut»; ute: leien og «Hent hjem», og salget er sperret', () => {
    const hjemme = tegn(createElement(Luksuskort, { s: rik, id: 'megayacht' }))
    expect(hjemme).toContain('Kan leies ut for kr 450 mill i timen nå, høysesong')
    expect(hjemme).toContain('>Lei ut<')
    const s = ok(leiUt(rik, 'megayacht'))
    const ute = tegn(createElement(Luksuskort, { s, id: 'megayacht' }))
    expect(ute).toContain('Leid ut · kr 450 mill i timen, høysesong')
    expect(ute).toContain('>Hent hjem<')
    expect(ute).toMatch(/disabled=""[^>]*>Selg/)
    expect(charterlinje(ok(hentHjem(s, 'megayacht')), 'megayacht')).toBe('Kommer hjem i morgen')
  })

  it('jeten er i lavsesong om sommeren', () => {
    expect(charterlinje(rik, 'widebodyjet')).toBe('Kan leies ut for kr 400 mill i timen nå, lavsesong')
  })

  it('det som ikke kan leies ut, har bare salget', () => {
    const html = tegn(createElement(Luksuskort, { s: rik, id: 'ubaat' }))
    expect(html).not.toContain('Lei ut')
    expect(html).toMatch(/Selg ·/)
  })
})
