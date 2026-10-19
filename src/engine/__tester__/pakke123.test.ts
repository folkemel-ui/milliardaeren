/** Pakke 123: skogens gode navn — status, odelsskog, avisa om skogen, og tre prestasjoner. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { hoggBestand, kjopBestand, kjopJord, kjopNaboskog, type Utfall } from '../handlinger'
import { DAG_SEK, dagnummer } from '../kalender'
import { simuler } from '../simulering'
import { PRESTASJONER } from '../prestasjoner'
import {
  besteHogstdag,
  GAMMELSKOG_DAGER,
  jordstatus,
  jordstatusFor,
  MAKS_BESTAND,
  NABOSKOG_STATUS,
  ODEL_DAGER,
  ODEL_STATUS,
  odelVedDagsskifte,
  SKOG_STATUS,
  skogrisiko,
  skogVedDagsskifte,
  TOMMERPRIS_SNITT,
} from '../jord'
import type { JordId, Oppgjor, Spilltilstand } from '../types'
import { UkaDi } from '../../ui/komponenter/UkaDi'
import { FORKLARINGER } from '../../ui/forklaringer'


const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const ID: JordId = 'skog-namdalen'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medSkog(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e14
  s.hoyesteFormue = 1e14
  s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT)
  return ok(kjopJord(s, ID))
}

const klart = (id: string, s: Spilltilstand) => PRESTASJONER.find((p) => p.id === id)!.klart(s, {} as never)

function forsteDag(hva: 'storm' | 'brann', fra = 40): number {
  for (let d = fra; d < fra + 365 * 20; d++) if (skogrisiko(ID, d) === hva) return d
  throw new Error(hva)
}

describe('status fra skogene', () => {
  it('en skog gir +5, hver naboskog +10 og odel +15; gårdene som før', () => {
    let s = medSkog()
    expect(jordstatus(s)).toBe(SKOG_STATUS)
    while (s.jord[ID]!.bestand?.length !== MAKS_BESTAND) s = ok(kjopBestand(s, ID))
    s = ok(kjopNaboskog(s, ID))
    s = ok(kjopNaboskog(s, ID))
    expect(jordstatusFor(s.jord[ID], ID)).toBe(SKOG_STATUS + 2 * NABOSKOG_STATUS)
    s.jord[ID]!.odel = true
    expect(jordstatus(s)).toBe(SKOG_STATUS + 2 * NABOSKOG_STATUS + ODEL_STATUS)
    // En nykjøpt gård gir 0, som før.
    s = ok(kjopJord(s, 'gard-lista'))
    expect(jordstatusFor(s.jord['gard-lista'], 'gard-lista')).toBe(0)
  })
})

describe('odelsskog', () => {
  it('en skog eid i 90 dager blir odelsskog, med en sak og en linje i loggen', () => {
    const s = medSkog()
    s.sek += (ODEL_DAGER - 1) * DAG_SEK
    expect(odelVedDagsskifte(s)).toEqual([])
    s.sek += DAG_SEK
    const saker = odelVedDagsskifte(s)
    expect(s.jord[ID]!.odel).toBe(true)
    expect(saker[0].tittel).toBe('Skog i Namdalen er en odelsskog')
    expect(s.hendelser.at(-1)?.tittel).toBe('Skogen')
    // Odelsbonde er for gårdene.
    expect(klart('odelsgard', s)).toBe(false)
  })
})

describe('avisa om skogen', () => {
  it('storm og brann gir en sak', () => {
    const s = medSkog()
    const storm = forsteDag('storm')
    s.jord[ID]!.bestand = [(storm - 40) * DAG_SEK, (storm - 20) * DAG_SEK, (storm - 5) * DAG_SEK]
    s.sek = storm * DAG_SEK
    expect(skogVedDagsskifte(s).map((x) => x.tittel)).toEqual(['Stormen feller tømmer i Namdalen'])
    const brann = forsteDag('brann')
    s.jord[ID]!.bestand = [(brann - 40) * DAG_SEK, (brann - 30) * DAG_SEK, (brann - 20) * DAG_SEK]
    s.sek = brann * DAG_SEK
    expect(skogVedDagsskifte(s).map((x) => x.tittel)).toEqual(['Skogbrann i Namdalen'])
  })

  it('en hogst som gir mer per dag enn noen før, blir en rekordhogst dagen etter', () => {
    let s = medSkog()
    const plantet = s.sek
    s.jord[ID]!.bestand = [plantet, plantet, plantet]
    s.sek = plantet + 20 * DAG_SEK
    // Første hogst: ingenting å slå.
    s = ok(hoggBestand(s, ID, 0))
    expect(s.jord[ID]!.nyRekord).toBeUndefined()
    s.sek = plantet + 49 * DAG_SEK
    s = ok(hoggBestand(s, ID, 1))
    expect(s.jord[ID]!.nyRekord?.bestand).toBe(1)
    // Et dårligere snitt slår den ikke.
    s.sek = plantet + 120 * DAG_SEK
    s = ok(hoggBestand(s, ID, 2))
    expect(s.jord[ID]!.nyRekord?.bestand).toBe(1)
    const saker = skogVedDagsskifte(s).filter((x) => x.tittel.startsWith('Rekordhogst'))
    expect(saker).toHaveLength(1)
    expect(saker[0].tekst).toContain('Bestand 2 ga')
    expect(s.jord[ID]!.nyRekord).toBeUndefined()
    expect(skogVedDagsskifte(s).filter((x) => x.tittel.startsWith('Rekordhogst'))).toHaveLength(0)
  })

  it('et bestand som fyller 300 dager, får én sak', () => {
    const s = medSkog()
    // En dag uten storm og brann.
    let dag = 400
    while (skogrisiko(ID, dag)) dag++
    s.sek = dag * DAG_SEK
    s.jord[ID]!.bestand = [s.sek - GAMMELSKOG_DAGER * DAG_SEK, s.sek - 10 * DAG_SEK, s.sek - 20 * DAG_SEK]
    expect(skogVedDagsskifte(s).map((x) => x.tittel)).toEqual(['Gammelskog i Namdalen'])
    s.sek += DAG_SEK
    while (skogrisiko(ID, dagnummer(s.sek))) s.sek += DAG_SEK
    expect(skogVedDagsskifte(s).filter((x) => x.tittel.startsWith('Gammelskog'))).toHaveLength(0)
  })

  it('søndagsavisa har skogene: tømmeret fra hogstene i uka', () => {
    let s = medSkog()
    s.sek += 45 * DAG_SEK
    s = ok(hoggBestand(s, ID, 0))
    const t = simuler(s, 8 * DAG_SEK)
    const uke = [...t.oppgjor].reverse().find((o) => o.periode === 'uke' && o.skogene)
    expect(uke?.skogene?.hogster).toBe(1)
    expect(uke?.skogene?.tommer).toBeGreaterThan(0)
    const html = tekst(createElement(UkaDi, { o: { ...uke!, formuekurve: undefined, skogene: { tommer: 5e7, hogster: 2, stormer: 1, branner: 0 } } as Oppgjor }))
    expect(html).toMatch(/Skogene ga\s+kr 50 mill\s+i tømmer fra 2 hogster, og en storm\./)
  })
})

describe('prestasjonene', () => {
  it('Perfekt omløp: et bestand hogd innen to dager fra den beste dagen', () => {
    let s = medSkog()
    const plantet = s.sek
    s.sek = plantet + 30 * DAG_SEK
    s = ok(hoggBestand(s, ID, 0))
    expect(klart('perfekt-omlop', s)).toBe(false)
    s.sek = plantet + (besteHogstdag(s.jord[ID], 1) + 1) * DAG_SEK
    s = ok(hoggBestand(s, ID, 1))
    expect(klart('perfekt-omlop', s)).toBe(true)
  })

  it('Gammelskog: et bestand som har stått i 360 dager', () => {
    const s = medSkog()
    s.sek += 359 * DAG_SEK
    expect(klart('gammelskog', s)).toBe(false)
    s.sek += DAG_SEK
    expect(klart('gammelskog', s)).toBe(true)
  })

  it('Tømmerbaron: 1 mrd fra tømmer i alt', () => {
    const s = medSkog()
    s.jord[ID]!.tommerTotalt = 9.9e8
    expect(klart('tommerbaron', s)).toBe(false)
    s.jord[ID]!.tommerTotalt = 1e9
    expect(klart('tommerbaron', s)).toBe(true)
  })

  it('hjelpeteksten nevner status og odel for skogene', () => {
    expect(FORKLARINGER.jord.tekst).toContain('En skog gir +5 status og hver naboskog +10')
    expect(FORKLARINGER.jord.tekst).toContain('odelsskog')
  })
})
