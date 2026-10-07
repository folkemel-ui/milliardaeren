/**
 * Pakke 49 — verden går rundt: konjunkturer og styringsrente, fast og flytende
 * rente, og kalenderen (ukedager, vær, bransjetrender, helligdager).
 */

import { describe, expect, it } from 'vitest'
import {
  dagsbilde,
  FASE_DAGER,
  faseI,
  FASER,
  helligdag,
  paaskedag,
  verdenssaker,
  type Fase,
} from '../verden'
import { DAG_SEK, dagFra } from '../kalender'
import { STIGEN, RENTE_PER_TIME, SPARERENTE_PER_TIME } from '../innhold'
import { bedriftInntektIDag, bedriftInntektPerSek, fastrente, flytendeRente, rentesats, sparerente, statusfaktor } from '../formler'
import { bindRente } from '../handlinger'
import { nyttSpill } from '../start'
import { bedrift } from './hjelp'
import type { Spilltilstand } from '../types'

/** Et nytt spill på en gitt spilldag. */
function paaDag(dag: number): Spilltilstand {
  const s = nyttSpill()
  s.sek = dag * DAG_SEK
  return s
}

describe('konjunkturen', () => {
  it('starter i normale tider, og fasene fordeler seg rundt 25/50/25', () => {
    const s = nyttSpill()
    expect(faseI(s, 0)).toBe('normal')
    const antall: Record<Fase, number> = { hoy: 0, normal: 0, lav: 0 }
    for (let p = 1; p <= 2000; p++) antall[faseI(s, p)]++
    expect(antall.hoy / 2000).toBeGreaterThan(0.2)
    expect(antall.hoy / 2000).toBeLessThan(0.3)
    expect(antall.lav / 2000).toBeGreaterThan(0.2)
    expect(antall.lav / 2000).toBeLessThan(0.3)
  })

  it('den flytende renten og sparerenten følger styringsrenten — som før i normale tider', () => {
    expect(rentesats(nyttSpill())).toBe(RENTE_PER_TIME)
    expect(sparerente(nyttSpill())).toBe(SPARERENTE_PER_TIME)
    const s = nyttSpill()
    // Finn en periode med høykonjunktur og en med lav.
    const hoy = Array.from({ length: 50 }, (_, p) => p).find((p) => faseI(s, p) === 'hoy')!
    const lav = Array.from({ length: 50 }, (_, p) => p).find((p) => faseI(s, p) === 'lav')!
    expect(flytendeRente(paaDag(hoy * FASE_DAGER))).toBeCloseTo((RENTE_PER_TIME * FASER.hoy.styringsrente) / 4)
    expect(flytendeRente(paaDag(lav * FASE_DAGER))).toBeCloseTo((RENTE_PER_TIME * FASER.lav.styringsrente) / 4)
    expect(sparerente(paaDag(lav * FASE_DAGER))).toBeCloseTo((SPARERENTE_PER_TIME * FASER.lav.styringsrente) / 4)
  })

  it('rentemøtet havner i avisa når fasen skifter', () => {
    const s = nyttSpill()
    const p = Array.from({ length: 50 }, (_, i) => i + 1).find((i) => faseI(s, i) !== faseI(s, i - 1))!
    const saker = verdenssaker(paaDag(p * FASE_DAGER)).marked
    expect(saker.some((x) => x.tittel.startsWith('Sentralbanken'))).toBe(true)
  })
})

describe('fastrente', () => {
  it('låser dagens rente pluss et påslag i én fase, og kan ikke bindes på nytt før den går ut', () => {
    const s = nyttSpill()
    const u = bindRente(s)
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(fastrente(u.tilstand)).toBeCloseTo(RENTE_PER_TIME + (RENTE_PER_TIME * 0.5) / 4)
    expect(rentesats(u.tilstand)).toBeCloseTo(RENTE_PER_TIME * 1.125)
    expect(bindRente(u.tilstand).ok).toBe(false)
    // Når bindingen er ute, flyter renten igjen.
    const senere = { ...u.tilstand, sek: (FASE_DAGER + 1) * DAG_SEK }
    expect(fastrente(senere)).toBeNull()
    expect(bindRente(senere).ok).toBe(true)
  })
})

describe('kalenderen', () => {
  it('ukedagene, været og trendene jevner seg ut over to år', () => {
    const s = nyttSpill()
    const sum = Object.fromEntries(STIGEN.map((t) => [t, 0])) as Record<string, number>
    let dager = 0
    for (let dag = 0; dag < 2 * 364; dag++) {
      const d = dagsbilde(s, dag)
      if (d.helligdag) continue
      dager++
      for (const t of STIGEN) sum[t] += d.faktor[t]
    }
    for (const t of STIGEN) expect(sum[t] / dager, t).toBeGreaterThan(0.93)
    for (const t of STIGEN) expect(sum[t] / dager, t).toBeLessThan(1.07)
  })

  it('restauranter tjener mer i helgen, bankene mindre', () => {
    const s = nyttSpill()
    // Dag 5 er lørdag 9. januar 2027. Sammenlign uten vær og trend: forholdet mellom dagene.
    const lor = dagsbilde(s, 5)
    const man = dagsbilde(s, 7)
    const ren = (d: typeof lor, t: 'restaurant' | 'bank') => d.faktor[t] / ((d.trend.het === t ? 1.2 : 1) * (d.trend.kald === t ? 0.8 : 1))
    expect(ren(lor, 'restaurant')).toBeCloseTo(1.3)
    expect(ren(man, 'restaurant')).toBeCloseTo(0.88)
    expect(ren(lor, 'bank')).toBeCloseTo(0.75)
  })

  it('påsken regnes riktig', () => {
    expect(paaskedag(2027)).toEqual({ maaned: 2, dag: 28 })
    expect(paaskedag(2028)).toEqual({ maaned: 3, dag: 16 })
    expect(paaskedag(2030)).toEqual({ maaned: 3, dag: 21 })
    const forste = dagFra(2027, 2, 28)
    expect(helligdag(forste - 3)?.navn).toBe('Påske')
    expect(helligdag(forste + 1)?.navn).toBe('Påske')
    expect(helligdag(forste + 2)).toBeNull()
  })

  it('17. mai selger pølsebodene tre ganger så mye — og avisa gratulerer', () => {
    const dag = dagFra(2027, 4, 17)
    const s = paaDag(dag)
    expect(helligdag(dag)?.navn).toBe('17. mai')
    const d = dagsbilde(s, dag)
    const uten = d.faktor.polsebod / 3
    const b = bedrift('polsebod', { nivaa: 30 })
    expect(bedriftInntektIDag(s, b)).toBeCloseTo(bedriftInntektPerSek(b, uten * 3) * statusfaktor(s))
    expect(verdenssaker(s).lokalt.some((x) => x.tittel === 'Gratulerer med dagen!')).toBe(true)
  })

  it('helligdagene er bonuser: ingen faktor under 1', () => {
    for (const dag of [dagFra(2027, 2, 25), dagFra(2027, 4, 17), dagFra(2027, 11, 24), dagFra(2027, 11, 31)]) {
      const h = helligdag(dag)!
      for (const f of Object.values(h.virkning)) expect(f).toBeGreaterThan(1)
    }
  })

  it('ukas trend står i avisa på mandag', () => {
    const s = nyttSpill()
    const mandag = Array.from({ length: 30 }, (_, i) => (i + 1) * 7).find((dag) => dagsbilde(s, dag).trend.het)!
    const saker = verdenssaker(paaDag(mandag)).marked
    expect(saker.some((x) => /mer enn vanlig/.test(x.tekst))).toBe(true)
  })
})
