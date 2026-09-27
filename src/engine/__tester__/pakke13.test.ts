/** Pakke 13: sluttspillsbedrifter, jord og skog, landemerker og kunst. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import {
  hoggSkog,
  kjopBedrift,
  kjopJord,
  kjopLandemerke,
  kjopMaleri,
  museum,
  selgJord,
  selgLandemerke,
  selgMaleri,
  type Utfall,
} from '../handlinger'
import { nettoformue } from '../formler'
import { leiePerSek, statuspoeng } from '../eiendom'
import { BEDRIFTSTYPER, FORBEDRINGER, STIGEN } from '../innhold'
import { DAG_SEK } from '../kalender'
import { HOST_ANDEL, JORD, jordVedDagsskifte, landverdi, TOMMER_DAGER, TOMMER_MAKS, tommerfaktor, tommerverdi, vaer } from '../jord'
import {
  kjopsprisLandemerke,
  LANDEMERKER,
  landemerkepris,
  landemerkerVedDagsskifte,
  RIVAL_KJOPER_VED,
  TILBAKEKJOP_PREMIE,
} from '../landemerker'
import { kunstVedDagsskifte, kunstverdi, MALERIER, MALERILISTE } from '../kunst'
import { FORMER } from '../fusjon'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(kontanter = 1e11): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return s
}

describe('sluttspillet', () => {
  it('fire nye bedrifter etter oljeselskapet, hver dyrere enn den forrige', () => {
    const slutt = STIGEN.slice(STIGEN.indexOf('oljeselskap'))
    expect(slutt).toEqual(['oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter'])
    for (let i = 1; i < slutt.length; i++) {
      expect(BEDRIFTSTYPER[slutt[i]].pris).toBeGreaterThan(BEDRIFTSTYPER[slutt[i - 1]].pris)
      expect(BEDRIFTSTYPER[slutt[i]].laasesOppVed).toBeGreaterThan(1e9)
    }
    for (const t of STIGEN) {
      expect(FORBEDRINGER[t]).toHaveLength(3)
      expect(FORMER[t]).toBeDefined()
    }
  })

  it('et rederi kan kjøpes når formuen har vært høy nok', () => {
    const s = rik(1e11)
    expect(ok(kjopBedrift(s, 'rederi')).bedrifter.some((b) => b.type === 'rederi')).toBe(true)
    const fattig = rik(1e10)
    expect(kjopBedrift(fattig, 'rederi').ok).toBe(false)
  })
})

describe('jord og skog', () => {
  it('jord stiger i verdi fra dag til dag', () => {
    const s = rik()
    const i_dag = landverdi(s, 'gard-hedmarken')
    s.sek += DAG_SEK * 10
    expect(landverdi(s, 'gard-hedmarken')).toBeGreaterThan(i_dag)
  })

  it('en gård kjøpes uten å endre nettoformuen, og høstes mandag morgen', () => {
    let s = rik()
    const før = nettoformue(s)
    s = ok(kjopJord(s, 'gard-hedmarken'))
    expect(nettoformue(s)).toBeCloseTo(før, 0)
    expect(kjopJord(s, 'gard-hedmarken').ok).toBe(false)
    // Ingen avling midt i uka.
    s.sek = DAG_SEK * 3
    expect(jordVedDagsskifte(s)).toEqual([])
    // Mandag: avling for uka som gikk, etter været den uka.
    s.sek = DAG_SEK * 7
    const kontanter = s.kontanter
    const forventet = landverdi(s, 'gard-hedmarken') * HOST_ANDEL * vaer(6).faktor
    const saker = jordVedDagsskifte(s)
    expect(saker).toHaveLength(1)
    expect(s.kontanter - kontanter).toBeCloseTo(forventet, 0)
    expect(s.totaltHost).toBeCloseTo(forventet, 0)
  })

  it('været er likt hele uka og varierer mellom ukene', () => {
    expect(vaer(7)).toBe(vaer(13))
    const ulike = new Set(Array.from({ length: 30 }, (_, u) => vaer(u * 7).navn))
    expect(ulike.size).toBeGreaterThan(2)
  })

  it('tømmeret vokser mot taket, og snittveksten er størst midt i', () => {
    expect(tommerfaktor(0)).toBe(0)
    expect(tommerfaktor(TOMMER_DAGER)).toBeCloseTo(TOMMER_MAKS / 4)
    expect(tommerfaktor(10_000)).toBeLessThan(TOMMER_MAKS)
    const snitt = (d: number) => tommerfaktor(d) / d
    expect(snitt(TOMMER_DAGER)).toBeGreaterThan(snitt(TOMMER_DAGER / 3))
    expect(snitt(TOMMER_DAGER)).toBeGreaterThan(snitt(TOMMER_DAGER * 3))
  })

  it('hogst betaler tømmeret og planter ny skog', () => {
    let s = ok(kjopJord(rik(), 'skog-trysil'))
    expect(hoggSkog(s, 'skog-trysil').ok).toBe(false)
    s.sek += DAG_SEK * TOMMER_DAGER
    const tommer = tommerverdi(s, 'skog-trysil')
    expect(tommer).toBeGreaterThan(0)
    const kontanter = s.kontanter
    s = ok(hoggSkog(s, 'skog-trysil'))
    expect(s.kontanter - kontanter).toBeCloseTo(tommer, 0)
    expect(tommerverdi(s, 'skog-trysil')).toBe(0)
    expect(hoggSkog(s, 'gard-hedmarken').ok).toBe(false)
  })

  it('jord selges med tømmeret som står, minus honorar', () => {
    let s = ok(kjopJord(rik(), 'skog-trysil'))
    s.sek += DAG_SEK * 20
    const verdi = landverdi(s, 'skog-trysil') + tommerverdi(s, 'skog-trysil')
    const kontanter = s.kontanter
    s = ok(selgJord(s, 'skog-trysil'))
    expect(s.kontanter - kontanter).toBeCloseTo(verdi * 0.97, 0)
    expect(s.jord['skog-trysil']).toBeUndefined()
    expect(JORD['skog-trysil'].type).toBe('skog')
  })
})

describe('landemerker', () => {
  it('et landemerke gir status og leie, og kan selges igjen', () => {
    let s = rik()
    const status = statuspoeng(s)
    const leie = leiePerSek(s)
    s = ok(kjopLandemerke(s, 'fyret'))
    expect(statuspoeng(s)).toBe(status + LANDEMERKER.fyret.status)
    expect(leiePerSek(s)).toBeGreaterThan(leie)
    expect(kjopLandemerke(s, 'fyret').ok).toBe(false)
    s = ok(selgLandemerke(s, 'fyret'))
    expect(s.landemerker.fyret).toBeUndefined()
  })

  it('en rik rival kjøper et ledig landemerke før eller siden, og du kan kjøpe det tilbake med premie', () => {
    const s = rik()
    s.rivaler[3].formue = LANDEMERKER.tarnet.pris * RIVAL_KJOPER_VED * 2
    for (let dag = 1; dag < 200 && !s.landemerker.tarnet; dag++) {
      s.sek = dag * DAG_SEK
      landemerkerVedDagsskifte(s)
    }
    expect(s.landemerker.tarnet?.eier).toBe(s.rivaler[3].id)
    expect(kjopsprisLandemerke(s, 'tarnet')).toBeCloseTo(landemerkepris(s, 'tarnet') * TILBAKEKJOP_PREMIE)
    const formue = s.rivaler[3].formue
    const n = ok(kjopLandemerke(s, 'tarnet'))
    expect(n.landemerker.tarnet?.eier).toBe('deg')
    expect(n.rivaler[3].formue).toBeGreaterThan(formue)
  })

  it('fattige rivaler kjøper ingenting', () => {
    const s = rik()
    for (const r of s.rivaler) r.formue = 1e6
    for (let dag = 1; dag < 100; dag++) {
      s.sek = dag * DAG_SEK
      landemerkerVedDagsskifte(s)
    }
    expect(s.landemerker).toEqual({})
  })
})

describe('kunst', () => {
  it('prisene endrer seg hver dag, med egen terning', () => {
    const s = rik()
    const før = { ...s.kunst.kurser }
    const frø = s.frø
    kunstVedDagsskifte(s)
    expect(s.kunst.kurser).not.toEqual(før)
    expect(s.frø).toBe(frø)
    for (const id of MALERILISTE) expect(s.kunst.kurser[id]).toBeGreaterThan(0)
  })

  it('kjøp, museum og salg', () => {
    let s = rik()
    const status = statuspoeng(s)
    s = ok(kjopMaleri(s, 'blaatimen'))
    expect(kunstverdi(s)).toBeCloseTo(s.kunst.kurser.blaatimen)
    expect(statuspoeng(s)).toBe(status + MALERIER.blaatimen.status)
    s = ok(museum(s, 'blaatimen'))
    expect(statuspoeng(s)).toBe(status + MALERIER.blaatimen.status * 2)
    expect(selgMaleri(s, 'blaatimen').ok).toBe(false)
    // Be om å få det hjem: det kommer ved neste dagsskifte.
    s = ok(museum(s, 'blaatimen'))
    expect(selgMaleri(s, 'blaatimen').ok).toBe(false)
    kunstVedDagsskifte(s)
    expect(s.kunst.eide.blaatimen?.utlant).toBe(false)
    s = ok(selgMaleri(s, 'blaatimen'))
    expect(s.kunst.eide.blaatimen).toBeUndefined()
  })

  it('kunst teller i nettoformuen', () => {
    const s = rik()
    const før = nettoformue(s)
    const n = ok(kjopMaleri(s, 'morgenlys'))
    // Bare auksjonssalæret forsvinner.
    expect(nettoformue(n)).toBeCloseTo(før - s.kunst.kurser.morgenlys * 0.05, 0)
  })
})
