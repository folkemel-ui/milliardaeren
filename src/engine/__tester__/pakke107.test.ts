/**
 * Pakke 107: status til slutten — to nivåer over Mytisk, en ubåt verdt å kjøpe, og kunst
 * som byttes på og varer.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { statusfaktor } from '../formler'
import { LUKSUS, STATUSNIVAAER, statusnivaa } from '../eiendom'
import { TITLER } from '../avis'
import { PRESTASJONER } from '../prestasjoner'
import { DAG_SEK } from '../kalender'
import {
  KUNSTNERE,
  kunstnertrend,
  kunstVedDagsskifte,
  lagKunst,
  MALERIER,
  MALERILISTE,
  nesteTrendbytte,
  SENE_MALERIER,
  TRENDER,
  TRENDPERIODE,
  trendrekkefolge,
  type KunstnerId,
} from '../kunst'
import type { MaleriId, Spilltilstand } from '../types'

const KUNSTNERLISTE = Object.keys(KUNSTNERE) as KunstnerId[]

describe('to statusnivåer over Mytisk', () => {
  it('Titan på 1 700 og Evig på 2 000, +2 % inntekt hver, og en tittel i avisa', () => {
    expect(STATUSNIVAAER.slice(-3)).toEqual([
      { poeng: 1400, navn: 'Mytisk' },
      { poeng: 1700, navn: 'Titan' },
      { poeng: 2000, navn: 'Evig' },
    ])
    expect(TITLER.slice(-2)).toEqual(['Titanen', 'Den evige'])
    const s = nyttSpill()
    // Status rett fra trofeer: hvert er verdt 3 poeng.
    s.trofeer = Array.from({ length: 667 }, (_, i) => ({ navn: 'Seriemester', sesong: i, divisjon: 0 })) as never
    expect(STATUSNIVAAER[statusnivaa(s)].navn).toBe('Evig')
    expect(statusfaktor(s)).toBeCloseTo(1 + 0.02 * 14, 12)
  })

  it('prestasjonen Mytisk står ved Mytisk, ikke ved det øverste nivået', () => {
    const mytisk = PRESTASJONER.find((p) => p.id === 'mytisk')!
    expect(mytisk.beskrivelse).toBe('Nå statusnivået Mytisk')
    const felles = (nivaa: number) => ({ status: () => nivaa }) as never
    const nivaa = STATUSNIVAAER.findIndex((n) => n.navn === 'Mytisk')
    expect(mytisk.klart(nyttSpill(), felles(nivaa - 1))).toBe(false)
    expect(mytisk.klart(nyttSpill(), felles(nivaa))).toBe(true)
    expect(nivaa).toBeLessThan(STATUSNIVAAER.length - 1)
  })
})

describe('en ubåt verdt å kjøpe', () => {
  it('200 status for 60 mrd: 300 mill per poeng, fortsatt dyrere per poeng enn megayachten', () => {
    expect(LUKSUS.ubaat.status).toBe(200)
    expect(LUKSUS.ubaat.pris / LUKSUS.ubaat.status).toBe(300e6)
    expect(LUKSUS.ubaat.pris / LUKSUS.ubaat.status).toBeGreaterThan(LUKSUS.megayacht.pris / LUKSUS.megayacht.status)
  })
})

describe('kunst som byttes på', () => {
  it('den første perioden har de gamle trendene; hver periode er de fire trendene i en ny rekkefølge', () => {
    for (const k of KUNSTNERLISTE) expect(kunstnertrend(k, 0)).toBe(KUNSTNERE[k].trend)
    for (const k of KUNSTNERLISTE) expect(kunstnertrend(k, TRENDPERIODE - 1)).toBe(KUNSTNERE[k].trend)
    for (let p = 1; p < 30; p++) {
      const trender = KUNSTNERLISTE.map((k) => kunstnertrend(k, p * TRENDPERIODE) * 12).sort((a, b) => b - a)
      expect(trender.map((t) => +t.toFixed(6))).toEqual([...TRENDER])
    }
    // Likt i alle spill, og samme svar hver gang.
    expect(trendrekkefolge(7)).toEqual(trendrekkefolge(7))
    expect(nesteTrendbytte(0)).toBe(TRENDPERIODE)
    expect(nesteTrendbytte(TRENDPERIODE)).toBe(2 * TRENDPERIODE)
  })

  it('over et langt spill får hver kunstner sin tur på toppen, og ingen taper for alltid', () => {
    const topp = Object.fromEntries(KUNSTNERLISTE.map((k) => [k, 0])) as Record<KunstnerId, number>
    const snitt = Object.fromEntries(KUNSTNERLISTE.map((k) => [k, 0])) as Record<KunstnerId, number>
    const N = 400
    for (let p = 1; p <= N; p++) {
      topp[trendrekkefolge(p)[0]]++
      for (const k of KUNSTNERLISTE) snitt[k] += (kunstnertrend(k, p * TRENDPERIODE) * 12) / N
    }
    for (const k of KUNSTNERLISTE) {
      expect(topp[k] / N, k).toBeGreaterThan(0.18)
      expect(topp[k] / N, k).toBeLessThan(0.32)
      // Snittet av de fire trendene er +0,8 % i timen.
      expect(snitt[k], k).toBeGreaterThan(0.006)
      expect(snitt[k], k).toBeLessThan(0.01)
    }
  })

  it('avisa sier hvem som er i vinden og hvem som går av moten på byttedagen — bare da', () => {
    const marked = (dag: number) => ({ kunst: lagKunst(17), sek: dag * DAG_SEK }) as unknown as Spilltilstand
    const saker = kunstVedDagsskifte(marked(3 * TRENDPERIODE)).filter((x) => x.tittel === 'Nye favoritter i kunstmarkedet')
    expect(saker).toHaveLength(1)
    const r = trendrekkefolge(3)
    expect(saker[0].tekst).toContain(`${KUNSTNERE[r[0]].navn} er i vinden`)
    expect(saker[0].tekst).toContain(`${KUNSTNERE[r[3]].navn} går av moten`)
    for (const dag of [3 * TRENDPERIODE - 1, 3 * TRENDPERIODE + 1, TRENDPERIODE - 1]) {
      expect(kunstVedDagsskifte(marked(dag)).some((x) => x.tittel === 'Nye favoritter i kunstmarkedet')).toBe(false)
    }
  })
})

describe('tre sene verk', () => {
  it('3, 10 og 30 mrd for 35, 50 og 70 status — 155 eid, 310 på museum', () => {
    expect(SENE_MALERIER.map((id) => [MALERIER[id].startpris, MALERIER[id].status])).toEqual([
      [3e9, 35],
      [10e9, 50],
      [30e9, 70],
    ])
    expect(SENE_MALERIER.reduce((sum, id) => sum + MALERIER[id].status, 0)).toBe(155)
    expect(MALERILISTE).toHaveLength(12)
  })

  it('en lagring uten dem får dem til katalogprisen ved første dagsskifte', () => {
    const s = { kunst: lagKunst(3), sek: 5 * DAG_SEK } as unknown as Spilltilstand
    for (const id of SENE_MALERIER) {
      delete (s.kunst.kurser as Partial<Record<MaleriId, number>>)[id]
      delete (s.kunst.verdier as Partial<Record<MaleriId, number>>)[id]
    }
    kunstVedDagsskifte(s)
    for (const id of SENE_MALERIER) {
      expect(s.kunst.kurser[id] / MALERIER[id].startpris).toBeGreaterThan(0.7)
      expect(s.kunst.kurser[id] / MALERIER[id].startpris).toBeLessThan(1.4)
      expect(s.kunst.verdier[id]).toBeGreaterThan(0)
    }
  })

  it('de ni gamle får nøyaktig de samme prisene med og uten de sene: terningen er urørt', () => {
    const spill = (medSene: boolean) => {
      const s = { kunst: lagKunst(99), sek: 0 } as unknown as Spilltilstand
      if (!medSene)
        for (const id of SENE_MALERIER) {
          delete (s.kunst.kurser as Partial<Record<MaleriId, number>>)[id]
          delete (s.kunst.verdier as Partial<Record<MaleriId, number>>)[id]
        }
      for (let d = 1; d <= 300; d++) {
        s.sek = d * DAG_SEK
        kunstVedDagsskifte(s)
      }
      return s
    }
    const med = spill(true)
    const uten = spill(false)
    for (const id of MALERILISTE.filter((x) => !SENE_MALERIER.includes(x))) expect(med.kunst.kurser[id]).toBe(uten.kunst.kurser[id])
    expect(med.kunst.frø).toBe(uten.kunst.frø)
  })
})
