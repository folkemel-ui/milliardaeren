/** Pakke 119: satellittnettet — egne satellitter, dekning, inntekt hvert sekund, levetid og lisens. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { byggAvdeling, kjopRomfart, startForskning, taNedSatellitter, velgKontrakt, velgSatellitter, type Utfall } from '../handlinger'
import { DAG_SEK, dagnummer } from '../kalender'
import {
  DELTRINN,
  dekning,
  iBane,
  kapasitetsfaktor,
  levetid,
  MAKS_SATELLITTER,
  NETT_FULL,
  nettInntekt,
  nyRomfart,
  romfartVedDagsskifte,
  satDekning,
  satellitterPerOppskyting,
  SATELLITT_PRIS,
  rakettpris,
} from '../romfart'
import { sjekkPrestasjoner } from '../prestasjoner'
import type { Satellittkull, Spilltilstand } from '../types'
import { Romfartside } from '../../ui/komponenter/Romfart'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const tom = () => {}

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medFabrikk(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return ok(kjopRomfart(s))
}

const kull = (antall: number, sluttDag = 1000, dekningPer = 1): Satellittkull => ({ id: antall, antall, dekning: dekningPer, dag: 0, sluttDag })

/** Til neste dagsskifte, og kjør fabrikkens del av det. */
function dagsskifte(s: Spilltilstand) {
  s.sek = (Math.floor(s.sek / DAG_SEK) + 1) * DAG_SEK
  return romfartVedDagsskifte(s, 'Folke')
}

describe('dekningen og inntekten', () => {
  it('1 − e^(−n/20): 20 satellitter gir 63 %, 60 gir 95 %, og full dekning tjener ~525 mill/s', () => {
    const r = nyRomfart(nyttSpill())
    r.kull = [kull(20)]
    expect(dekning(r)).toBeCloseTo(1 - Math.exp(-1), 6)
    r.kull = [kull(60)]
    expect(dekning(r)).toBeGreaterThan(0.95)
    expect(nettInntekt(r) / NETT_FULL).toBeCloseTo(dekning(r), 6)
  })

  it('delene: solpaneler 30 → 120 dager, antenner 1 → 2,5 per satellitt, kapasitet ×1 → ×6', () => {
    const r = nyRomfart(nyttSpill())
    expect([levetid(r), satDekning(r), kapasitetsfaktor(r)]).toEqual([30, 1, 1])
    r.satdeler = { solpaneler: DELTRINN, antenner: DELTRINN, kapasitet: DELTRINN }
    expect([levetid(r), satDekning(r), kapasitetsfaktor(r)]).toEqual([120, 2.5, 6])
  })

  it('en fabrikk fra Pakke 118 uten satellittfeltene har ingen dekning og delene på trinn 0', () => {
    const r = nyRomfart(nyttSpill())
    delete r.satdeler
    delete r.kull
    expect(dekning(r)).toBe(0)
    expect(levetid(r)).toBe(30)
  })

  it('nettet tjener hvert sekund, også mens du er borte', () => {
    const s = medFabrikk()
    s.romfart!.kull = [kull(40)]
    s.romfart!.nettPerSek = nettInntekt(s.romfart!)
    const før = s.romfart!.nettTjent ?? 0
    const t = simuler(s, 100, true)
    expect((t.romfart!.nettTjent ?? 0) - før).toBeCloseTo(100 * nettInntekt(s.romfart!), -3)
  })
})

describe('oppskytingen', () => {
  it('så mange som raketten løfter, ett tonn hver: 8 med de første delene; ingen kontrakt den dagen', () => {
    let s = medFabrikk()
    expect(satellitterPerOppskyting(s.romfart!)).toBe(8)
    s = ok(velgSatellitter(s))
    expect(s.romfart!.valgt).toBeUndefined()
    const før = s.kontanter
    // Sørg for at oppskytingen går bra: en terning som slår lavt (sjekk heller flere dager under).
    let saker: { tittel: string }[] = []
    for (let i = 0; i < 20 && iBane(s.romfart!) === 0; i++) {
      s.romfart!.valgtSatellitter = true
      saker = dagsskifte(s)
    }
    expect(iBane(s.romfart!)).toBe(8)
    const o = s.romfart!.oppskytinger.at(-1)!
    expect(o.kunde).toBe('Egne satellitter')
    expect(o.honorar).toBe(0)
    expect(o.kostnad).toBeCloseTo(rakettpris(s.romfart!) + 8 * SATELLITT_PRIS, 0)
    expect(s.kontanter).toBeLessThan(før)
    expect(s.romfart!.nettPerSek).toBeCloseTo(nettInntekt(s.romfart!), 6)
    expect(saker.map((x) => x.tittel)).toContain('Folke bygger mobilnett fra verdensrommet')
    expect(s.romfart!.valgtSatellitter).toBeUndefined()
  })

  it('å velge en kontrakt etterpå tar satellittvalget bort, og omvendt', () => {
    let s = ok(velgSatellitter(medFabrikk()))
    s = ok(velgKontrakt(s, s.romfart!.tavle[0].id))
    expect(s.romfart!.valgtSatellitter).toBeUndefined()
    s = ok(velgSatellitter(s))
    expect(s.romfart!.valgt).toBeUndefined()
  })

  it('satellittene går ut av drift etter levetiden, og nettet tjener mindre', () => {
    const s = medFabrikk()
    const dag = dagnummer(s.sek)
    s.romfart!.kull = [{ ...kull(10), sluttDag: dag }, { ...kull(20), id: 99, sluttDag: dag + 5 }]
    dagsskifte(s)
    expect(iBane(s.romfart!)).toBe(20)
    expect(s.romfart!.nettPerSek).toBeCloseTo(nettInntekt(s.romfart!), 6)
  })
})

describe('lisensen og å ta ned', () => {
  it('høyst 100 i bane: neste oppskyting tar bare det som er ledig, og en full lisens kan ikke velges', () => {
    const s = medFabrikk()
    s.romfart!.kull = [kull(96)]
    expect(satellitterPerOppskyting(s.romfart!)).toBe(4)
    s.romfart!.kull = [kull(MAKS_SATELLITTER)]
    expect(velgSatellitter(s).ok).toBe(false)
  })

  it('et kull kan tas ned før tiden, og nettet regnes på nytt', () => {
    const s = medFabrikk()
    s.romfart!.kull = [kull(30), { ...kull(10), id: 7 }]
    const t = ok(taNedSatellitter(s, 7))
    expect(iBane(t.romfart!)).toBe(30)
    expect(t.romfart!.nettPerSek).toBeCloseTo(nettInntekt(t.romfart!), 6)
  })
})

describe('forskningen og prestasjonen', () => {
  it('satellittdelene forskes i samme avdeling og blir ferdige i sitt sekund', () => {
    let s = ok(byggAvdeling(medFabrikk()))
    s = ok(startForskning(s, 'solpaneler'))
    expect(startForskning(s, 'motorer').ok).toBe(false)
    s = simuler(s, DAG_SEK + 1)
    expect(s.romfart!.satdeler?.solpaneler).toBe(1)
    expect(levetid(s.romfart!)).toBe(45)
  })

  it('Hele verden dekket ved 95 %', () => {
    const s = medFabrikk()
    s.romfart!.kull = [kull(60)]
    expect(sjekkPrestasjoner(s)).toContain('verden-dekket')
  })
})

describe('skjermen', () => {
  it('siden har en rad for egne satellitter og et kort for nettet', () => {
    const s = medFabrikk()
    let side = tekst(createElement(Romfartside, { s, tilbake: tom }))
    expect(side).toContain('Egne satellitter')
    expect(side).toContain('8 stk · i drift i 30 dager')
    expect(side).toContain('Satellittnettet')
    expect(side).toContain('Solpaneler')
    s.romfart!.kull = [kull(40)]
    s.romfart!.nettPerSek = nettInntekt(s.romfart!)
    side = tekst(createElement(Romfartside, { s, tilbake: tom }))
    expect(side).toContain('40 av 100 i bane')
    expect(side).toContain('Ta ned')
  })
})
