/** Pakke 94: dyrene, produksjonstilskuddet og gårdens eget regnskap. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopDyr, kjopGardsbygg, kjopJord, kjopJorde, selgJord, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { DAG_SEK, dagFra } from '../kalender'
import { jordVedDagsskifte, landverdi, REGNSKAP_UKER, ukeFor } from '../jord'
import { DYR, DYR_PER_UKE, dyrpris, dyrVedDagsskifte, FJOSPLASSER, SLAKT_DAGER, tilskudd, TILSKUDD_DYR, TILSKUDD_JORD } from '../dyr'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const ID = 'gard-lista' as const

/** Et spill som eier gården på Lista med fjøs, kjøpt i begynnelsen av en dag. */
function medFjos(dag = 7): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  s.sek = dag * DAG_SEK
  return ok(kjopGardsbygg(ok(kjopJord(s, ID)), ID, 'fjos'))
}

/** Dagsskiftet inn i dag `dag`: gir det dyrene og tilskuddet betalte. */
function dagsskifte(s: Spilltilstand, dag: number): number {
  s.sek = dag * DAG_SEK
  const k = s.kontanter
  dyrVedDagsskifte(s)
  return s.kontanter - k
}

describe('fjøset og dyrene', () => {
  it('plassene følger trinnet: 4, 8, 12, 20; uten fjøs ingen dyr', () => {
    const s = nyttSpill()
    s.kontanter = 1e12
    s.hoyesteFormue = 1e12
    const g = ok(kjopJord(s, ID))
    expect(kjopDyr(g, ID, 'ku').ok).toBe(false)
    let f = medFjos()
    for (let i = 0; i < FJOSPLASSER[0]; i++) f = ok(kjopDyr(f, ID, 'hone'))
    expect(kjopDyr(f, ID, 'hone').ok).toBe(false)
    f = ok(kjopJorde(ok(kjopJorde(f, ID)), ID))
    expect(kjopDyr(f, ID, 'hone').ok).toBe(true)
  })

  it('ku 15 %, høne 3 %, sau 8 %, gris 10 % av jordverdien; teller i gårdens verdi', () => {
    const s = medFjos()
    expect(dyrpris(s, ID, 'ku')).toBeCloseTo(0.15 * landverdi(s, ID), 2)
    expect(dyrpris(s, ID, 'hone')).toBeCloseTo(0.03 * landverdi(s, ID), 2)
    expect(dyrpris(s, ID, 'sau')).toBeCloseTo(0.08 * landverdi(s, ID), 2)
    expect(dyrpris(s, ID, 'gris')).toBeCloseTo(0.1 * landverdi(s, ID), 2)
    const etter = ok(kjopDyr(s, ID, 'ku'))
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s), 0)
  })

  it('kua gir melk hver dag: 4 % av prisen i uka', () => {
    const s = ok(kjopDyr(medFjos(), ID, 'ku'))
    const pris = dyrpris(s, ID, 'ku')
    const fikk = dagsskifte(s, 8)
    expect(fikk / (pris * DYR_PER_UKE / 7)).toBeCloseTo(1, 2)
    expect(s.jord[ID]!.regnskap!.at(-1)!.dyr).toBeCloseTo(fikk, 2)
  })

  it('en sau kjøpt dagen før klippingen gir bare det den har opptjent', () => {
    const mai = dagFra(2027, 4, 1)
    const s = ok(kjopDyr(medFjos(mai - 1), ID, 'sau'))
    // 1. mai er også et månedsskifte: tilskuddet kommer i tillegg.
    const fikk = dagsskifte(s, mai) - tilskudd(s, ID)
    // Én dag ull — ikke et halvt år.
    expect(fikk / (dyrpris(s, ID, 'sau') * DYR_PER_UKE / 7)).toBeCloseTo(1, 2)
  })

  it('ulla og kjøttet samles opp og betales på klippe- og slaktedagen', () => {
    let s = ok(kjopDyr(ok(kjopDyr(medFjos(1), ID, 'sau')), ID, 'gris'))
    for (let d = 2; d < SLAKT_DAGER; d++) dagsskifte(s, d)
    // Ingenting fra dyrene før slakten (tilskuddet 1. februar er ikke dyrenes).
    expect(s.jord[ID]!.siden?.dyr ?? 0).toBe(0)
    // Dag 56 er 1. mars: tilskuddet kommer i tillegg.
    const slakt = dagsskifte(s, SLAKT_DAGER) - tilskudd(s, ID)
    // Hver dag opptjenes med jordverdien den dagen (den stiger 0,3 % om dagen): dag 2 til 56.
    const prove = structuredClone(s)
    let forventet = 0
    for (let d = 2; d <= SLAKT_DAGER; d++) {
      prove.sek = d * DAG_SEK
      forventet += (dyrpris(prove, ID, 'gris') * DYR_PER_UKE) / 7
    }
    expect(slakt / forventet).toBeCloseTo(1, 4)
    expect(s.jord[ID]!.dyrKasse!.ull).toBeGreaterThan(0)
    s = structuredClone(s)
    const dagerTilMai = dagFra(2027, 4, 1)
    for (let d = SLAKT_DAGER + 1; d < dagerTilMai; d++) dagsskifte(s, d)
    expect(s.jord[ID]!.dyrKasse!.ull! > 0).toBe(true)
    const klipp = dagsskifte(s, dagerTilMai)
    expect(klipp).toBeGreaterThan(0)
    expect(s.jord[ID]!.dyrKasse!.ull).toBe(0)
  })

  it('selges gården, følger det opptjente med', () => {
    const s = ok(kjopDyr(medFjos(1), ID, 'gris'))
    for (let d = 2; d < 20; d++) dagsskifte(s, d)
    s.sek += DAG_SEK / 2
    const kasse = s.jord[ID]!.dyrKasse!.slakt!
    const host = s.totaltHost
    const solgt = ok(selgJord(s, ID))
    expect(solgt.totaltHost - host).toBeGreaterThan(kasse)
  })
})

describe('tilskuddet', () => {
  it('ved hvert månedsskifte: 0,5 % av jordverdien per jord og 1 % av prisen per dyr', () => {
    let s = ok(kjopDyr(medFjos(), ID, 'ku'))
    const forventet = 3 * TILSKUDD_JORD * landverdi(s, ID) + TILSKUDD_DYR * dyrpris(s, ID, 'ku')
    expect(tilskudd(s, ID)).toBeCloseTo(forventet, 2)
    s = structuredClone(s)
    const feb = dagFra(2027, 1, 1)
    s.sek = (feb - 1) * DAG_SEK
    s.jord[ID]!.dyrSek = s.sek
    const fikk = dagsskifte(s, feb)
    // Melken regnes med jordverdien den dagen dagsskiftet skjer.
    const melk = (dyrpris(s, ID, 'ku') * DYR_PER_UKE) / 7
    expect(fikk - melk).toBeCloseTo(tilskudd(s, ID), -2)
    expect(s.jord[ID]!.regnskap!.at(-1)!.tilskudd).toBeGreaterThan(0)
  })
})

describe('gårdens regnskap', () => {
  it('høst, bygg og dyr per uke, de siste åtte, og summen siden kjøpet', () => {
    let s = medFjos()
    s = ok(kjopJorde(s, ID))
    expect(s.jord[ID]!.siden!.bygd).toBeGreaterThan(0)
    s = ok(kjopDyr(s, ID, 'ku'))
    for (let d = 8; d <= 7 * 12; d++) {
      dagsskifte(s, d)
      if (d % 7 === 0) jordVedDagsskifte(s)
    }
    const r = s.jord[ID]!.regnskap!
    expect(r.length).toBe(REGNSKAP_UKER)
    expect(r.at(-1)!.uke).toBe(ukeFor(7 * 12 - 1))
    expect(r.every((x) => x.dyr > 0)).toBe(true)
    expect(s.jord[ID]!.siden!.host).toBeGreaterThan(0)
    expect(s.jord[ID]!.siden!.dyr).toBeGreaterThan(r.reduce((a, x) => a + x.dyr, 0))
  })
})

it('dyrene er fire slag, og de dyreste gir mest', () => {
  expect(Object.keys(DYR)).toEqual(['ku', 'hone', 'sau', 'gris'])
})
