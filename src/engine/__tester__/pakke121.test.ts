/** Pakke 121: tømmer verdt å vente på — en tømmerpris som følger boligmarkedet, klimakreditter og et sagbruk. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { hoggBestand, kjopJord, kjopSagbruk, type Utfall } from '../handlinger'
import { DAG_SEK } from '../kalender'
import { lagMarked, markedstikk } from '../marked'
import { Terning } from '../rng'
import { simuler } from '../simulering'
import { nettoformue } from '../formler'
import {
  bestandsverdi,
  besteHogstdag,
  betalKarbon,
  KARBON_PER_DAG,
  karbonPerDag,
  landverdi,
  omlopPerDag,
  SAGBRUK_LOFT,
  sagbrukPerDag,
  sagbrukpris,
  START_BESTAND,
  tommerfaktor,
  tommerpris,
  TOMMERPRIS_MAKS,
  TOMMERPRIS_MIN,
  TOMMERPRIS_SNITT,
  tommerverdi,
} from '../jord'
import type { Spilltilstand } from '../types'
import { Bestandkort, Skogdrift, Skogregnskap, Tommerkurve } from '../../ui/komponenter/Skog'
import { FORKLARINGER } from '../../ui/forklaringer'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const ID = 'skog-namdalen'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** En skog i Namdalen til vanlig tømmerpris. */
function medSkog(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT)
  return ok(kjopJord(s, ID))
}

describe('en tømmerpris som følger boligmarkedet', () => {
  it('er 1 i et vanlig marked, følger avviket og holder seg mellom 0,5 og 1,5', () => {
    const s = medSkog()
    expect(tommerpris(s)).toBeCloseTo(1, 10)
    s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT * 1.1)
    expect(tommerpris(s)).toBeCloseTo(1.1, 10)
    s.marked.eiendom.avvik = -2
    expect(tommerpris(s)).toBe(TOMMERPRIS_MIN)
    s.marked.eiendom.avvik = 2
    expect(tommerpris(s)).toBe(TOMMERPRIS_MAKS)
  })

  it('en hogst og skogens verdi følger prisen', () => {
    let s = medSkog()
    s.sek += 40 * DAG_SEK
    const vanlig = bestandsverdi(s, ID, 0)
    const verdiVanlig = tommerverdi(s, ID)
    s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT * 1.2)
    expect(bestandsverdi(s, ID, 0) / vanlig).toBeCloseTo(1.2, 10)
    expect(tommerverdi(s, ID) / verdiVanlig).toBeCloseTo(1.2, 10)
    const før = s.kontanter
    s = ok(hoggBestand(s, ID, 0))
    expect(s.kontanter - før).toBeCloseTo(vanlig * 1.2, 2)
  })

  it('er i snitt rundt 1 over mange timer av det ekte markedet', () => {
    const priser: number[] = []
    for (const frø of [11, 4242]) {
      const { marked, frø: f } = lagMarked(frø)
      const t = new Terning(f)
      const s = { marked } as Spilltilstand
      for (let i = 0; i < 720 * 60; i++) {
        marked.tikk++
        markedstikk(marked, t)
        if (i % 60 === 0) priser.push(tommerpris(s))
      }
    }
    const snitt = priser.reduce((a, b) => a + b, 0) / priser.length
    expect(snitt).toBeGreaterThan(0.85)
    expect(snitt).toBeLessThan(1.15)
    // Den svinger: ikke alltid 1.
    expect(Math.max(...priser) - Math.min(...priser)).toBeGreaterThan(0.1)
  })
})

describe('klimakreditter for den stående skogen', () => {
  it('et nyplantet bestand gir ingenting; et gammelt gir 0,6 % av tømmeret om dagen, uten prisen', () => {
    const s = medSkog()
    expect(karbonPerDag(s, ID)).toBe(0)
    s.sek += 60 * DAG_SEK
    s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT * 1.3)
    expect(karbonPerDag(s, ID)).toBeCloseTo(landverdi(s, ID) * tommerfaktor(60) * KARBON_PER_DAG, 2)
  })

  it('betales hvert sekund som leia, også borte: en time samlet er en time sekund for sekund', () => {
    const a = medSkog()
    a.sek += 30 * DAG_SEK
    const b = structuredClone(a)
    const start = a.kontanter
    const n = 3600
    for (let i = 0; i < n; i++) {
      a.sek += 1
      betalKarbon(a, 1)
    }
    b.sek += n
    const samlet = betalKarbon(b, n)
    // Jorda stiger 3,6 % i løpet av timen; samlet regnes den midt i timen, så det blir nesten likt.
    expect(samlet / (a.kontanter - start)).toBeCloseTo(1, 2)
    expect(b.jord[ID]!.karbon).toBeCloseTo(samlet, 6)
    // Ett sekund er dagsbeløpet delt på dagens sekunder.
    const c = structuredClone(b)
    expect(betalKarbon(c, 1) / (karbonPerDag(c, ID) / DAG_SEK)).toBeCloseTo(1, 4)
  })

  it('kommer i kassen, avlingen og leia når spillet går', () => {
    const s = medSkog()
    s.sek += 30 * DAG_SEK
    const leie = s.totaltLeie
    const host = s.totaltHost
    const n = simuler(s, 60)
    expect(n.jord[ID]!.karbon).toBeGreaterThan(0)
    expect(n.totaltHost - host).toBeGreaterThanOrEqual(n.jord[ID]!.karbon! - 1e-6)
    expect(n.totaltLeie - leie).toBeGreaterThanOrEqual(n.jord[ID]!.karbon! - 1e-6)
  })

  it('flytter den beste dagen fra 36 til 49, uten å slå hogsten', () => {
    const s = medSkog()
    expect(besteHogstdag(undefined)).toBe(49)
    const best = omlopPerDag(s, ID, 49)
    expect(best).toBeGreaterThan(omlopPerDag(s, ID, 48))
    expect(best).toBeGreaterThan(omlopPerDag(s, ID, 50))
    // Hogst ved dag 36 gir fortsatt 98 %.
    expect(omlopPerDag(s, ID, 36) / best).toBeGreaterThan(0.97)
    // Et bestand som aldri hogges, gir bare kredittene for fullt tømmer: under fire femdeler.
    const aldri = (landverdi(s, ID) / START_BESTAND) * 3 * KARBON_PER_DAG
    expect(aldri / best).toBeGreaterThan(0.7)
    expect(aldri / best).toBeLessThan(0.8)
  })
})

describe('et sagbruk', () => {
  it('koster en tredel av jorda, står i verdien og gir 20 % mer for hver hogst', () => {
    let s = medSkog()
    s.sek += 49 * DAG_SEK
    const pris = sagbrukpris(s, ID)
    expect(pris).toBeCloseTo(landverdi(s, ID) / 3, 2)
    const uten = bestandsverdi(s, ID, 0)
    const formue = nettoformue(s)
    s = ok(kjopSagbruk(s, ID))
    expect(s.jord[ID]!.sagbruk).toBe(true)
    expect(s.jord[ID]!.investert).toBeCloseTo(pris, 2)
    // Kjøpet senker ikke formuen; tømmeret som står, er nå verdt 20 % mer.
    expect(nettoformue(s)).toBeGreaterThanOrEqual(formue - 1)
    expect(bestandsverdi(s, ID, 0) / uten).toBeCloseTo(1 + SAGBRUK_LOFT, 10)
    expect(kjopSagbruk(s, ID).ok).toBe(false)
    const før = s.kontanter
    s = ok(hoggBestand(s, ID, 0))
    expect(s.kontanter - før).toBeCloseTo(uten * (1 + SAGBRUK_LOFT), 2)
    // Med sagbruket lønner det seg å hogge litt før.
    expect(besteHogstdag(s.jord[ID])).toBe(46)
  })

  it('tjener seg inn på rundt sju timer med tre bestand', () => {
    const s = medSkog()
    const timer = (sagbrukpris(s, ID) / sagbrukPerDag(s, ID)) * (DAG_SEK / 3600)
    expect(timer).toBeGreaterThan(6)
    expect(timer).toBeLessThan(8)
  })

  it('bygges bare ved en skog du eier, og når du har råd', () => {
    const s = medSkog()
    expect(kjopSagbruk(s, 'gard-lista').ok).toBe(false)
    s.kontanter = 0
    expect(kjopSagbruk(s, ID).ok).toBe(false)
  })
})

describe('siden', () => {
  it('tømmerprisen, kredittene og sagbruket står på skogens side', () => {
    const s = medSkog()
    s.sek += 20 * DAG_SEK
    const kort = tekst(createElement(Bestandkort, { s, id: ID }))
    expect(kort).toContain('Tømmerprisen i dag ×1,00')
    expect(kort).toContain('Vanlig')
    expect(kort).toContain('mest per dag ved 49 dager')
    s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT * 1.12)
    expect(tekst(createElement(Bestandkort, { s, id: ID }))).toContain('Høy')
    s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT * 0.8)
    expect(tekst(createElement(Bestandkort, { s, id: ID }))).toContain('Lav')
    const drift = tekst(createElement(Skogdrift, { s, id: ID }))
    expect(drift).toContain('Klimakreditter:')
    expect(drift).toContain('Bygg sagbruk')
    expect(drift).toMatch(/tilbake på \d/)
    const med = ok(kjopSagbruk(s, ID))
    expect(tekst(createElement(Skogdrift, { s: med, id: ID }))).toContain('Hver hogst gir 20 % mer.')
    expect(tekst(createElement(Tommerkurve, { s, id: ID }))).toContain('Med klimakredittene gir et omløp mest per dag ved dag 49')
  })

  it('regnskapet nevner kredittene når de har gitt noe', () => {
    let s = medSkog()
    s.sek += 40 * DAG_SEK
    betalKarbon(s, 3600)
    s = ok(hoggBestand(s, ID, 0))
    expect(tekst(createElement(Skogregnskap, { s, id: ID }))).toContain('og klimakredittene kr')
  })

  it('hjelpeteksten forklarer prisen, kredittene og sagbruket', () => {
    const t = FORKLARINGER.jord.tekst
    expect(t).toContain('Tømmerprisen følger boligmarkedet')
    expect(t).toContain('klimakreditter')
    expect(t).toContain('rundt dag 49')
    expect(t).toContain('sagbruk')
  })
})
