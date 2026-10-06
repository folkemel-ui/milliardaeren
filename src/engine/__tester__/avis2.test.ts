/** Pakke 7: selskapsnyheter, statustitler, sosietetsstoff og oppgjør. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { DAG_SEK, erHelg } from '../kalender'
import { TITLER, tittel } from '../avis'
import { LUKSUSLISTE, STATUSNIVAAER, statusnivaa } from '../eiendom'
import { NYHET_SEK } from '../selskapsnyheter'
import { AKSJER, PAPIRER } from '../marked'
import { kjopLuksus } from './hjelp'
import type { PapirId, Spilltilstand } from '../types'

const NYHETSORD = ['knuser forventningene', 'skuffer', 'milliardkontrakt', 'Skandale i', 'Oppkjøpsrykter']
const erNyhet = (tittel: string) => NYHETSORD.some((o) => tittel.includes(o))

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  return s
}

describe('selskapsnyheter', () => {
  it('kommer på børsdager, aldri i helgen', () => {
    const s = simuler(nyttSpill(), 21 * DAG_SEK)
    // Avisa husker sju utgaver; se på alle som finnes.
    let nyheter = 0
    for (const u of s.avis) {
      const antall = u.saker.filter((x) => erNyhet(x.tittel)).length
      if (erHelg(u.dag * DAG_SEK)) expect(antall).toBe(0)
      nyheter += antall
    }
    expect(nyheter).toBeGreaterThan(0)
  })

  it('prises inn gradvis de første minuttene, og flytter selskapets verdi varig', () => {
    // Finn en morgen med en nyhet.
    let s = nyttSpill(3)
    let id: PapirId | undefined
    for (let dag = 0; dag < 40 && !id; dag++) {
      s = simuler(s, DAG_SEK)
      id = AKSJER.find((a) => s.marked.kurser[a].nyhet)
    }
    expect(id).toBeDefined()
    if (!id) return
    const nyhet = { ...s.marked.kurser[id].nyhet! }
    const avis = s.avis[s.avis.length - 1]
    expect(avis.saker.some((x) => erNyhet(x.tittel) && x.tittel.includes(PAPIRER[id!].navn))).toBe(true)

    const før = s.marked.kurser[id].fundament
    const halvveis = simuler(s, NYHET_SEK / 2)
    expect(halvveis.marked.kurser[id].nyhet).toBeDefined()
    const ferdig = simuler(s, NYHET_SEK)
    expect(ferdig.marked.kurser[id].nyhet).toBeUndefined()
    // Fundamentet har flyttet seg med nyheten (pluss litt vanlig drift).
    const flytt = Math.log(ferdig.marked.kurser[id].fundament / før)
    expect(flytt).toBeCloseTo(nyhet.igjen, 2)
  })
})

describe('statustitler og sosietet', () => {
  it('avisa kaller deg noe finere jo høyere status du har', () => {
    let s = rik()
    expect(tittel(s)).toBe('Den unge gründeren')
    for (const id of ['gullklokke', 'mesterverk', 'diamantklokke'] as const) s = kjopLuksus(s, id)
    expect(tittel(s)).toBe('Forretningsprofilen')
  })

  it('har én tittel for hvert statusnivå', () => {
    expect(TITLER).toHaveLength(STATUSNIVAAER.length)
    STATUSNIVAAER.forEach((n, i) => expect(TITLER[i], n.navn).toMatch(/^\p{Lu}/u))
    expect(new Set(TITLER).size).toBe(TITLER.length)
  })

  it('tåler et dagsskifte på de høyeste nivåene', () => {
    // Fra nivå 8 og opp manglet tittelen, og dagsskiftet krasjet på ny luksus.
    let s = simuler(rik(), 60)
    s.luksus = [...LUKSUSLISTE]
    expect(statusnivaa(s)).toBeGreaterThanOrEqual(8)
    s = simuler(s, DAG_SEK)
    const saker = s.avis.flatMap((u) => u.saker)
    expect(saker.some((x) => x.tekst.endsWith(`${tittel(s).toLowerCase()}.`))).toBe(true)
    for (const x of saker) expect(`${x.tittel} ${x.tekst}`).not.toContain('undefined')
  })

  it('skriver om livet ditt når statusen er høy nok', () => {
    let s = rik()
    for (const id of ['gullklokke', 'mesterverk', 'diamantklokke', 'stasjonsvogn'] as const) s = kjopLuksus(s, id)
    const etter = simuler(s, 7 * DAG_SEK)
    const saker = etter.avis.flatMap((u) => u.saker)
    expect(saker.some((x) => x.type === 'deg' && x.tittel.startsWith('Forretningsprofilen'))).toBe(true)
  })
})

describe('oppgjør', () => {
  it('uka gjøres opp i søndagsavisa, med ukas tall', () => {
    const s = simuler(nyttSpill(), 6 * DAG_SEK)
    const uke = s.oppgjor.find((o) => o.periode === 'uke')
    expect(uke).toBeDefined()
    if (!uke) return
    expect(uke.navn).toBe('uke 1')
    expect(uke.bedrifter).toBeCloseTo(s.totaltTjent, 6)
    expect(uke.vinner && uke.taper).toBeTruthy()
    expect(s.avis[s.avis.length - 1].oppgjor?.[0].periode).toBe('uke')
  })

  it('måneden gjøres opp den første i neste måned', () => {
    // 4. januar + 28 dager = 1. februar.
    const s = simuler(nyttSpill(), 28 * DAG_SEK)
    const mnd = s.oppgjor.find((o) => o.periode === 'maaned')
    expect(mnd?.navn).toBe('januar 2027')
    expect(mnd?.besteBedrift?.type).toBe('saftbod')
    expect(mnd?.formueEtter).toBeGreaterThan(mnd!.formueFor)
  })

  it('året gjøres opp 1. januar', () => {
    // Hopp rett til nyttårsaften 2027 (dag 361) og kjør over midnatt.
    const s = nyttSpill()
    s.sek = 361 * DAG_SEK
    const etter = simuler(s, DAG_SEK)
    const aar = etter.oppgjor.find((o) => o.periode === 'aar')
    expect(aar?.navn).toBe('2027')
    expect(etter.oppgjor.some((o) => o.periode === 'maaned' && o.navn === 'desember 2027')).toBe(true)
  })

  it('renter og luksus føres som utgifter', () => {
    let s = rik()
    s = kjopLuksus(s, 'gullklokke')
    s.gjeld = 3_600_000
    const etter = simuler(s, 6 * DAG_SEK)
    const uke = etter.oppgjor.find((o) => o.periode === 'uke')!
    // Klokka ble kjøpt etter at uka startet, så den er ukas forbruk.
    expect(uke.forbruk).toBe(200_000)
    expect(uke.renter).toBeGreaterThan(0)
    expect(etter.totaltForbruk).toBe(200_000)
  })
})
