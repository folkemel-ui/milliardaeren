/** Pakke 116: tall som leses riktig — én telling av prestasjonene, korte beløp, ingen brudd i tallene, små andeler og tomme slag. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopPapir, type Utfall } from '../../engine/handlinger'
import { PRESTASJONER, synligePrestasjoner } from '../../engine/prestasjoner'
import type { Spilltilstand } from '../../engine/types'
import { andelTekst } from '../format'
import { nesteMaal, prestasjonstall, profilmaal } from '../progresjon'
import { Prestasjonsliste } from '../screens/Profil'
import { Bedriftdetalj } from '../screens/Bedriftdetalj'
import { Oversikt } from '../screens/investeringer/Oversikt'
import { Endring } from '../screens/investeringer/felles'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const tom = () => {}
/** Teksten uten tagger, med harde mellomrom som vanlige. */
const tekst = (html: string) => html.replace(/<[^>]+>/g, '').replace(/ |&nbsp;/g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

describe('én telling av prestasjonene', () => {
  it('kortet, stripa og målet på Profil teller alle, de skjulte også', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 1e16
    const skjult = PRESTASJONER.find((p) => p.skjult)!
    s.prestasjoner = { millionaer: 1, [skjult.id]: 2 }
    const { klart, totalt } = prestasjonstall(s)
    expect([klart, totalt]).toEqual([2, PRESTASJONER.length])
    expect(nesteMaal(s)!.visning).toBe(`2 / ${PRESTASJONER.length}`)
    expect(profilmaal(s, 1e16).prestasjoner).toEqual({ klart: 2, totalt: PRESTASJONER.length })
    const kort = tekst(tegn(createElement(Prestasjonsliste, { s })))
    expect(kort).toContain(`2 / ${PRESTASJONER.length}`)
    // Før sto det synlige som nevner: «2 / 57».
    expect(kort).not.toContain(`2 / ${synligePrestasjoner(s).length}`)
    expect(kort).toContain('4 skjulte prestasjoner venter')
  })

  it('tallet hopper ikke når en skjult blir funnet', () => {
    const s = nyttSpill()
    const før = prestasjonstall(s).totalt
    s.prestasjoner = { [PRESTASJONER.find((p) => p.skjult)!.id]: 1 }
    expect(prestasjonstall(s).totalt).toBe(før)
  })
})

describe('korte beløp i tallfeltene', () => {
  it('«Tjent totalt» og «Investert» på en bedrift står i kort form', () => {
    const s = nyttSpill()
    const b = s.bedrifter[0]
    b.tjent = -2_209_642_914
    b.investert = 12_345_678
    const side = tekst(tegn(createElement(Bedriftdetalj, { s, b, mengde: '1', tilbake: tom, tilRival: tom })))
    expect(side).toContain('Tjent totalt')
    expect(side).toContain('kr −2,21 mrd')
    expect(side).toContain('kr 12,3 mill')
    expect(side).not.toContain('2 209 642 914')
  })
})

describe('tall som ikke brytes', () => {
  it('beløpet og prosenten holdes samlet hver for seg, bruddet kan bare komme ved «·»', () => {
    const html = tegn(createElement(Endring, { kroner: 8_550_000, andel: 0.003 }))
    expect(html.match(/class="samlet"/g)).toHaveLength(2)
    expect(tekst(html)).toBe('+kr 8,55 mill · +0,3 %')
  })
})

describe('små andeler', () => {
  it('samme regel som Profil: «< 0,1 %», én desimal under 1 %, hele over', () => {
    const t = (a: number) => andelTekst(a).replace(/ /g, ' ')
    expect(t(0.00001)).toBe('< 0,1 %')
    expect(t(0.003)).toBe('0,3 %')
    expect(t(0.0096)).toBe('1 %')
    expect(t(0.123)).toBe('12 %')
    expect(t(0)).toBe('0 %')
    // Hardt mellomrom før %, så tegnet ikke står alene.
    expect(andelTekst(0.5)).toBe('50 %')
  })
})

describe('tomme slag på én linje', () => {
  function medAksjer(): Spilltilstand {
    const s = nyttSpill()
    s.kontanter = 1e9
    s.hoyesteFormue = 1e9
    return ok(kjopPapir(s, 'NFS', 10))
  }

  it('slagene i bruk har rader; resten står på én linje som er lukket', () => {
    const html = tegn(createElement(Oversikt, { s: medAksjer(), velg: tom }))
    expect(html.match(/klasserad"/g)).toHaveLength(1)
    const t = tekst(html)
    expect(t).toContain('Aksjer')
    expect(t).toContain('100 % av porteføljen')
    expect(t).toContain('Ikke i bruk: Krypto · Indeksfond · Obligasjoner · Rivalselskaper · Startups · Sparekonto')
    expect(html).toContain('aria-expanded="false"')
    expect(t).not.toMatch(/(^|[^,\d])0 % av porteføljen/)
  })

  it('en liten post skriver «< 0,1 %», ikke «0 %»', () => {
    const s = medAksjer()
    s.sparing = 1e10
    const t = tekst(tegn(createElement(Oversikt, { s, velg: tom })))
    expect(t).toMatch(/< 0,1 % av porteføljen|0,\d % av porteføljen/)
    expect(t).not.toMatch(/(^|[^,\d])0 % av porteføljen/)
    expect(t).toContain('Ikke i bruk: Krypto · Indeksfond · Obligasjoner · Rivalselskaper · Startups')
  })

  it('uten noe i bruk står bare linja', () => {
    const html = tegn(createElement(Oversikt, { s: nyttSpill(), velg: tom }))
    expect(html).not.toContain('klasserad"')
    expect(tekst(html)).toContain('Ikke i bruk: Aksjer · Krypto')
  })
})
