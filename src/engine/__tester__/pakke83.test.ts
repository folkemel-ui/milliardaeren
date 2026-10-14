/** Pakke 83: valg som betyr noe — premium som betaler, startups du kan lese, forvaltere for hver fase. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { ansettForvalter, byttForvalter, granskStartup, investerIStartup, kjopEiendom, velgRetning, type Utfall } from '../handlinger'
import { bedriftInntektIDag, bedriftsfaktor, dagensFaktor } from '../formler'
import { dagForBedrift, RETNINGER } from '../ansatte'
import { byttepris, FORVALTERE, FORVALTERLISTE, UFLAKS_DAGER, ventetLeie } from '../utleie'
import { byverdi } from '../eiendom'
import { fase, type Fase } from '../verden'
import { DAG_SEK } from '../kalender'
import { DIN_DEL_AV_RUNDEN, granskingspris, INNTRYKK_STOY, ledigIRunde, RUNDEANDEL, sanntInntrykk, STARTUP_IDEER } from '../startups'
import { bedrift } from './hjelp'
import type { BedriftstypeId, ForvalterId, Spilltilstand, Startup } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('premium som betaler', () => {
  it('+10 % inntekt, og dagen kan bare løfte den', () => {
    expect(RETNINGER.premium.inntekt).toBe(1.1)
    expect(RETNINGER.volum.inntekt).toBe(1.15)
    const p = bedrift('hotell', { retning: 'premium' })
    const v = bedrift('hotell', { retning: 'volum' })
    expect(dagForBedrift(p, 0.7)).toBe(1)
    expect(dagForBedrift(p, 1.3)).toBe(1.3)
    expect(dagForBedrift(v, 0.7)).toBe(0.7)
  })

  /** Snittet over to år av det retningen gir, med kalenderen og nyhetene. */
  function snitt(type: BedriftstypeId, retning: 'premium' | 'volum'): number {
    const s = nyttSpill(5)
    const b = bedrift(type, { retning })
    let sum = 0
    for (let d = 0; d < 730; d++) {
      s.sek = d * DAG_SEK + 100
      sum += RETNINGER[retning].inntekt * dagForBedrift(b, dagensFaktor(s, type))
    }
    return sum / 730
  }

  it('et reelt valg per bransje: premium der dagene svinger mest, volum der de er jevne', () => {
    for (const type of ['saftbod', 'hotell', 'restaurant', 'bank', 'skisenter'] as const) expect(snitt(type, 'premium'), type).toBeGreaterThan(snitt(type, 'volum'))
    for (const type of ['oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'polsebod', 'kiosk'] as const) expect(snitt(type, 'volum'), type).toBeGreaterThan(snitt(type, 'premium'))
  })

  it('simuleringen betaler det kortet viser, også på en dårlig dag', () => {
    let s = nyttSpill(5)
    s.kontanter = 1e9
    s.bedrifter = [bedrift('hotell', { id: 'b0', nivaa: 60, investert: 1e9 })]
    s = ok(velgRetning(s, 'b0', 'premium'))
    // Finn en dag der hotellet har en dårlig dag.
    let d = 0
    while (dagensFaktor({ ...s, sek: d * DAG_SEK + 100 }, 'hotell') >= 0.95) d++
    s.sek = d * DAG_SEK + 100
    const b = s.bedrifter[0]
    expect(bedriftsfaktor(s, b)).toBe(1)
    const vist = bedriftInntektIDag(s, b)
    const etter = simuler(s, 1)
    expect(etter.bedrifter[0].tjent - b.tjent).toBeCloseTo(vist, 6)
  })
})

describe('forvaltere for hver fase', () => {
  /** Et spill med eiendom i Bergen. */
  function iBergen(): Spilltilstand {
    const s = nyttSpill(54)
    s.kontanter = 1e10
    s.hoyesteFormue = 1e10
    return ok(kjopEiendom(s, 'hybel'))
  }

  /** Snittet av ventet leie per forvalter i hver fase, over mange uker. */
  function perFase(): Record<Fase, Record<string, number>> {
    const s = iBergen()
    const sum: Record<Fase, Record<string, number[]>> = { hoy: {}, normal: {}, lav: {} }
    for (let uke = 1; uke < 400; uke++) {
      s.sek = uke * 7 * DAG_SEK
      const f = fase(s)
      for (const id of [...FORVALTERLISTE, 'ingen']) (sum[f][id] ??= []).push(ventetLeie(s, 'Bergen', id === 'ingen' ? undefined : (id as ForvalterId)))
    }
    const ut = { hoy: {}, normal: {}, lav: {} } as Record<Fase, Record<string, number>>
    for (const f of ['hoy', 'normal', 'lav'] as Fase[]) for (const [id, l] of Object.entries(sum[f])) ut[f][id] = l.reduce((a, b) => a + b, 0) / l.length
    return ut
  }

  it('hver er best i sin fase: forsiktig i lavkonjunktur, lokalkjent i normale tider, pågående i høykonjunktur', () => {
    const p = perFase()
    const best = (f: Fase) => FORVALTERLISTE.reduce((a, b) => (p[f][b] > p[f][a] ? b : a))
    expect(best('lav')).toBe('forsiktig')
    expect(best('normal')).toBe('lokal')
    expect(best('hoy')).toBe('paagaende')
    // Uten forvalter: rundt 0,80, og lavere i lavkonjunktur.
    expect(p.normal.ingen).toBeCloseTo(0.8, 1)
    expect(p.lav.ingen).toBeLessThan(p.normal.ingen)
  })

  it('forsiktig har ingen tomme leiligheter i lavkonjunktur', () => {
    expect(FORVALTERE.forsiktig.ingenLedighetILav).toBe(true)
    expect(UFLAKS_DAGER).toBe(7)
  })

  it('et bytte koster 1 % av det du eier i byen, ikke en ny ansettelse', () => {
    let s = iBergen()
    s = ok(ansettForvalter(s, 'Bergen', 'lokal'))
    const pris = byttepris(byverdi(s, 'Bergen'))
    const før = s.kontanter
    const etter = ok(byttForvalter(s, 'Bergen', 'forsiktig'))
    expect(etter.forvaltere?.Bergen).toBe('forsiktig')
    expect(før - etter.kontanter).toBe(pris)
    expect(byttForvalter(etter, 'Bergen', 'forsiktig').ok).toBe(false)
    expect(byttForvalter(nyttSpill(), 'Bergen', 'forsiktig').ok).toBe(false)
  })
})

describe('startups du kan lese', () => {
  /** Et spill med én aktiv startup med kvalitet \`k\`. */
  function medStartup(k: number, inntrykk = 1): Spilltilstand {
    const s = nyttSpill(83)
    s.kontanter = 1e12
    s.hoyesteFormue = 1e9
    const st: Startup = { id: 1, ide: 20, runde: 0, verdi: 1e8, andel: 0, investert: 0, investertIRunde: 0, kvalitet: k, inntrykk, status: 'aktiv', startetSek: 0 }
    s.startups = [st]
    s.nesteStartupId = 2
    return s
  }

  it('du kan lede runden: hele runden, 20 % av verdien', () => {
    expect(DIN_DEL_AV_RUNDEN).toBe(1)
    const s = medStartup(0.5)
    expect(ledigIRunde(s.startups[0])).toBe(1e8 * RUNDEANDEL)
    const etter = ok(investerIStartup(s, 1, 1e12))
    expect(etter.startups[0].andel).toBeCloseTo(RUNDEANDEL, 12)
  })

  it('granskingen koster 1 % av verdien og viser det sanne teamet, én gang', () => {
    const s = medStartup(0.9, 0)
    expect(granskingspris(s.startups[0])).toBe(1e6)
    const etter = ok(granskStartup(s, 1))
    expect(s.kontanter - etter.kontanter).toBe(1e6)
    expect(etter.startups[0].gransket).toBe(true)
    expect(sanntInntrykk(etter.startups[0])).toBe(2)
    expect(granskStartup(etter, 1).ok).toBe(false)
  })

  it('inntrykket leses på nytt etter hver runde, med mindre støy, fra en hash', () => {
    // Pakke 103 doblet støyen, så granskingen betaler seg: ±0,5 ved start, ±0,1 i siste runde.
    expect(INNTRYKK_STOY).toEqual([0.5, 0.4, 0.3, 0.2, 0.1])
    // Et sterkt team (0,95) leses som «Erfarent» så snart støyen er under 0,28 — fra runde 3.
    let s = medStartup(0.95, 0)
    for (let d = 0; d < 8 && s.startups.some((st) => st.status === 'aktiv' && st.runde < 3); d++) s = simuler(s, DAG_SEK)
    const st = s.startups.find((x) => x.id === 1)!
    if (st.status === 'aktiv') expect(st.inntrykk).toBe(2)
  })

  it('32 ideer, alle ulike', () => {
    expect(STARTUP_IDEER).toHaveLength(32)
    expect(new Set(STARTUP_IDEER.map((i) => i.navn)).size).toBe(32)
  })
})
