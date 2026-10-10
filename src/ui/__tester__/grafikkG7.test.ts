/**
 * Grafikkpakke G7: de sju norske tegningene i den nye stilen, detaljsidene med
 * den store scenen, oppgjøret som en årsrapport og lasteskjermen.
 */

import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { kjopEiendom, kjopJord, kjopLuksus, kjopMaleri } from '../../engine/handlinger'
import { nyttSpill } from '../../engine/start'
import type { Oppgjor, Spilltilstand } from '../../engine/types'
import { aapenTing, aapneTing, trykkApner } from '../detaljvisning'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { ILLUSTRASJONSIDER, Illustrasjon, NY_STIL } from '../komponenter/Illustrasjoner'
import { Jordkort, Landemerkekort } from '../komponenter/JordOgLandemerker'
import { Malerikort } from '../komponenter/Kunst'
import { nettoInn, nettoUt, OppgjorBlokk } from '../komponenter/Oppgjor'
import { Luksuskort } from '../screens/Luksus'
import { lastAlle } from '../vedBehov'
import { alleStiler } from './stiler'

const SJU = ['kjopesenter', 'naeringsbygg', 'oy', 'fyret', 'hoppbakken', 'borgen', 'tarnet']

const tegning = (id: string) => renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 96 }))

function stierErGyldige(svg: string, hva: string) {
  const ARITET: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
  for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
    for (const [, k, args] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
      const n = (args.match(/-?(\d*\.\d+|\d+)(e-?\d+)?/g) ?? []).length
      const a = ARITET[k.toLowerCase()]
      expect(a === 0 ? n === 0 : n > 0 && n % a === 0, `${hva}: ${k}${args}`).toBe(true)
    }
  }
}

/** En rik test-tilstand som eier litt av alt. */
function rik(): Spilltilstand {
  let s: Spilltilstand = { ...nyttSpill(), kontanter: 1e13, hoyesteFormue: 1e13 }
  for (const u of [kjopEiendom(s, 'kjopesenter'), kjopJord(s, 'skog-trysil'), kjopLuksus(s, 'gullklokke'), kjopMaleri(s, 'morgenlys')]) {
    expect(u.ok).toBe(true)
    if (u.ok) s = u.tilstand
    // Hver handling bygger videre på forrige tilstand.
    s = { ...s }
  }
  return s
}

// Eiendoms- og luksustegningene lastes ved behov (G12); testene tegner dem ferdig hentet.
beforeAll(lastAlle)

describe('de sju norske tegningene (G7)', () => {
  it('er tegnet i den nye stilen på et 96-lerret', () => {
    for (const id of SJU) {
      expect(NY_STIL, id).toContain(id)
      expect(tegning(id), id).toContain('viewBox="0 0 96 96"')
    }
  })

  it('er alle ulike, med gyldige stier og uten flyttallsrester', () => {
    const alle = SJU.map(tegning)
    expect(new Set(alle).size).toBe(SJU.length)
    alle.forEach((svg, i) => {
      stierErGyldige(svg, SJU[i])
      expect(svg.match(/\d\.\d{8,}/g), SJU[i]).toBeNull()
    })
  })

  it('ingen står igjen i den gamle stilen (de ti utenlandske ble tegnet om i G9)', () => {
    expect(ILLUSTRASJONSIDER.filter((id) => !NY_STIL.includes(id))).toEqual([])
  })
})

describe('detaljsidene (G7)', () => {
  it('kortet i lista åpner detaljsiden; på detaljsiden står den store scenen i stedet for bildet', () => {
    const s = rik()
    const kort = [
      (d: boolean) => createElement(Eiendomskort, { s, id: 'kjopesenter', iDetalj: d }),
      (d: boolean) => createElement(Jordkort, { s, id: 'skog-trysil', iDetalj: d }),
      (d: boolean) => createElement(Landemerkekort, { s, id: 'fyret', iDetalj: d }),
      (d: boolean) => createElement(Luksuskort, { s, id: 'gullklokke', iDetalj: d }),
      (d: boolean) => createElement(Malerikort, { s, id: 'morgenlys', iDetalj: d }),
    ]
    for (const lag of kort) {
      const liste = renderToStaticMarkup(lag(false))
      const detalj = renderToStaticMarkup(lag(true))
      expect(liste).toContain('aapne-bilde')
      expect(liste).toContain('kan-aapnes')
      expect(liste).not.toContain('class="scene')
      expect(detalj).toContain('class="scene')
      expect(detalj).not.toContain('aapne-bilde')
    }
  })

  it('et trykk på en knapp i kortet åpner ikke detaljsiden, et trykk ellers på kortet gjør', () => {
    aapneTing(null)
    const knapp = { closest: (sel: string) => (sel.includes('button') ? {} : null) }
    const tekst = { closest: () => null }
    const trykk = trykkApner({ slag: 'luksus', id: 'gullklokke' })
    trykk({ target: knapp } as never)
    expect(aapenTing()).toBeNull()
    trykk({ target: tekst } as never)
    expect(aapenTing()).toEqual({ slag: 'luksus', id: 'gullklokke' })
    aapneTing(null)
  })

  it('detaljkortet tar hele bredden i det brede oppsettet', () => {
    const css = alleStiler()
    expect(css).toMatch(/\.kortliste:not\([^)]*\.tingkort[^)]*\)/)
  })
})

describe('oppgjøret som en årsrapport (G7)', () => {
  const o: Oppgjor = {
    periode: 'uke',
    navn: 'uke 3',
    fraDag: 7,
    tilDag: 14,
    bedrifter: 800,
    leie: 200,
    utbytte: 0,
    sparerente: 0,
    renter: 100,
    forbruk: 300,
    formueFor: 10_000,
    formueEtter: 11_000,
    besteBedrift: null,
  }
  const html = renderToStaticMarkup(createElement(OppgjorBlokk, { o, s: nyttSpill() }))

  it('én stolpe per linje: inn til høyre, ut til venstre, fra samme nullinje', () => {
    expect(html.match(/class="inn"/g)).toHaveLength(2)
    expect(html.match(/class="ut"/g)).toHaveLength(2)
    // Største ut er 300 og største inn 800: nullinja står ved 300 / 1100.
    expect(html).toContain(`--null:${(300 / 1100) * 100}%`)
  })

  it('kursene står på egen linje, så netto og formueendringen går opp', () => {
    const netto = nettoInn(o) - nettoUt(o)
    expect(netto).toBe(600)
    expect(html).toContain('Kurser, verdier og annet')
    expect(html).toContain('+kr 400')
  })

  it('formuen før og etter som to stolper på samme skala', () => {
    expect(html).toContain('class="for"')
    expect(html).toContain('class="etter"')
    expect(html).toContain(`width:${(10_000 / 11_000) * 100}%`)
    expect(html).toContain('width:100%')
  })
})

describe('lasteskjermen (G7)', () => {
  const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8')

  it('M-en tegner seg selv, glansen går over mynten og stjerna glimter', () => {
    expect(html).toMatch(/<polyline class="m" pathLength="1"/)
    expect(html).toContain('class="glans"')
    expect(html).toContain('class="stjerne"')
    for (const a of ['laster-tegn', 'laster-glans', 'laster-glimt']) expect(html).toContain(`@keyframes ${a}`)
  })

  it('står stille ved redusert bevegelse, både fra systemet og fra spillet', () => {
    expect(html).toContain('prefers-reduced-motion: reduce')
    expect(html).toContain("html[data-bevegelse='redusert'] .laster")
    expect(html).toContain("localStorage.getItem('milliardaer.bevegelse') === 'redusert'")
  })

  it('logoen har samme form som i Logo.tsx og ikon.svg', () => {
    const m = '178,336 178,236 254,300 334,178 334,336'
    const stjerne = '382,104 390,132 418,140 390,148 382,176 374,148 346,140 374,132'
    for (const fil of ['../komponenter/Logo.tsx', '../../../public/ikon.svg']) {
      const kilde = readFileSync(new URL(fil, import.meta.url), 'utf8')
      expect(kilde).toContain(m)
      expect(kilde).toContain(stjerne)
    }
    expect(html).toContain(m)
    expect(html).toContain(stjerne)
  })

  it('det første bildet glir fram', () => {
    const css = alleStiler()
    expect(css).toMatch(/\.app \{[^}]*animation: forste-bilde/)
  })
})
