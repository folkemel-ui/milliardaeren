/** Pakke 67: penger som holder — kunst som trekkes tilbake, startups som er et spill, og et lånetak på én time. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { laan, type Utfall } from '../handlinger'
import { laanetak, maksNyttLaan, bruttoPerSek } from '../formler'
import { simuler } from '../simulering'
import { LAANETAK_TIMER } from '../innhold'
import { HALVERING_DAGER, KUNSTNERE, kunstVedDagsskifte, kunstverdi, lagKunst, MALERIER, MALERILISTE, SVINGNING, TILBAKETREKK } from '../kunst'
import { BORS_MAKS, BORS_MIN, OPPKJOP_MAKS, OPPKJOP_MIN, RUNDEANDEL, RUNDER } from '../startups'
import { MIGRERINGER } from '../../state/migrering'
import type { MaleriId, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const marked = (frø: number) => ({ kunst: lagKunst(frø) }) as unknown as Spilltilstand

describe('kunst som trekkes tilbake', () => {
  it('hver kunstner vokser som aksjene: Vik +2 %, Lind +1,2 %, Solheim +0,6 %, Aske −0,6 % i timen', () => {
    const perTime = Object.fromEntries(Object.entries(KUNSTNERE).map(([id, k]) => [id, Math.exp(k.trend * 12) - 1]))
    expect(perTime.vik).toBeCloseTo(0.0202, 3)
    expect(perTime.lind).toBeCloseTo(0.0121, 3)
    expect(perTime.solheim).toBeCloseTo(0.006, 3)
    expect(perTime.aske).toBeCloseTo(-0.006, 3)
  })

  it('avstanden til verdien halveres på seks spilldager — en halvtime', () => {
    expect(HALVERING_DAGER).toBe(6)
    expect(TILBAKETREKK ** 6).toBeCloseTo(0.5, 10)
  })

  it('over 42 timer følger prisen verdien: ingen eksplosjon, svingninger rundt ±16 %', () => {
    // Før Pakke 67 ble Viks malerier i snitt ×81 000 på 42 timer.
    const dager = 504
    const forhold: number[] = []
    const avvik: number[] = []
    for (let frø = 1; frø <= 60; frø++) {
      const s = marked(frø * 7919)
      for (let d = 0; d < dager; d++) {
        kunstVedDagsskifte(s)
        if (d > 100) for (const id of MALERILISTE) avvik.push(Math.log(s.kunst.kurser[id] / s.kunst.verdier[id]))
      }
      for (const id of MALERILISTE) {
        const trend = KUNSTNERE[MALERIER[id].kunstner].trend
        expect(s.kunst.verdier[id] / MALERIER[id].startpris).toBeCloseTo(Math.exp(trend * dager), 6)
        forhold.push(s.kunst.kurser[id] / s.kunst.verdier[id])
      }
    }
    // Prisen står aldri langt fra verdien, og snittet ligger litt over (utstillingene løfter).
    for (const f of forhold) expect(f).toBeGreaterThan(0.4)
    for (const f of forhold) expect(f).toBeLessThan(2.5)
    const snitt = avvik.reduce((a, b) => a + b, 0) / avvik.length
    const sd = Math.sqrt(avvik.reduce((a, b) => a + (b - snitt) ** 2, 0) / avvik.length)
    expect(snitt).toBeGreaterThan(0.04)
    expect(snitt).toBeLessThan(0.14)
    expect(sd).toBeGreaterThan(0.12)
    expect(sd).toBeLessThan(0.2)
    // Støyen alene gir ±11 %; utstillingene legger til resten.
    expect(SVINGNING / Math.sqrt(1 - TILBAKETREKK ** 2)).toBeCloseTo(0.11, 2)
  })

  it('en pris som står dobbelt så høyt som verdien, er i snitt halvveis tilbake etter seks dager', () => {
    let sum = 0
    const n = 300
    for (let frø = 1; frø <= n; frø++) {
      const s = marked(frø * 104729)
      const id: MaleriId = 'morgenlys'
      s.kunst.kurser[id] = 2 * s.kunst.verdier[id]
      for (let d = 0; d < HALVERING_DAGER; d++) kunstVedDagsskifte(s)
      sum += Math.log(s.kunst.kurser[id] / s.kunst.verdier[id])
    }
    // ln 2 / 2 ≈ 0,35, pluss det utstillingene løfter i snitt på seks dager (≈ 0,05).
    expect(sum / n).toBeGreaterThan(0.3)
    expect(sum / n).toBeLessThan(0.46)
  })

  it('migreringen 23 → 24 ankrer verdien i dagens pris, så ingen maleri endrer verdi', () => {
    const s = nyttSpill(4711)
    const kunst = s.kunst as unknown as Record<string, unknown>
    const kurser = { ...s.kunst.kurser, sommernatt: 9.9e12 }
    const gammel = { ...s, kunst: { kurser, eide: { sommernatt: { kostpris: 1, utlant: false, hentes: false } }, frø: kunst.frø } }
    const m = MIGRERINGER[23](gammel as unknown as Record<string, unknown>) as unknown as Spilltilstand
    expect(m.kunst.verdier).toEqual(kurser)
    expect(kunstverdi(m)).toBe(9.9e12)
  })

  it('en lagring uten verdier (før migreringen) får dem ved første dagsskifte, i dagens pris', () => {
    const s = marked(5)
    delete (s.kunst as Partial<typeof s.kunst>).verdier
    const før = { ...s.kunst.kurser }
    kunstVedDagsskifte(s)
    for (const id of MALERILISTE) expect(s.kunst.verdier[id] / før[id]).toBeCloseTo(Math.exp(KUNSTNERE[MALERIER[id].kunstner].trend), 10)
  })
})

describe('startups som er et spill', () => {
  /** Hva en krone satt inn i runde r er verdt i snitt når selskapet er ute, for en gitt risikofaktor. */
  function forventet(risiko: number): number[] {
    const opp = (OPPKJOP_MIN + OPPKJOP_MAKS) / 2
    const bors = (BORS_MIN + BORS_MAKS) / 2
    const C: number[] = []
    const E: number[] = []
    for (let r = RUNDER.length - 1; r >= 0; r--) {
      const k = RUNDER[r].konkurs * risiko
      const o = RUNDER[r].oppkjop
      const g = (RUNDER[r].vekst[0] + RUNDER[r].vekst[1]) / 2
      const videre = r === RUNDER.length - 1 ? bors : g * C[r + 1]
      E[r] = (1 - k - o) * videre + o * opp
      C[r] = r === RUNDER.length - 1 ? E[r] : (1 - k - o) * (1 - RUNDEANDEL) * g * C[r + 1] + o * opp
    }
    return E
  }

  // Konstantene er stilt inn på en simulering av motoren (alt det er plass til i hver runde, 200 000 dager):
  // ×1,023 tilbake per krone, om lag 14 % i timen på pengene som står inne — før ×3,20.
  it('en krone satt inn gir om lag det samme tilbake i hver runde — ikke ×1,6–7,6 som før', () => {
    const E = forventet(1)
    E.forEach((e, r) => {
      const perDag = e ** (1 / (RUNDER.length - r)) - 1
      expect(perDag).toBeGreaterThan(-0.01)
      expect(perDag).toBeLessThan(0.015)
    })
  })

  it('teamet avgjør: et sterkt team (risiko ×0,6) lønner seg, et svakt (×1,4) taper', () => {
    for (const e of forventet(0.6)) expect(e).toBeGreaterThan(1.04)
    for (const e of forventet(1.4)) expect(e).toBeLessThan(0.98)
  })

  it('børsnoteringen og oppkjøpene betaler om lag det selskapet er verdt', () => {
    expect((BORS_MIN + BORS_MAKS) / 2).toBeCloseTo(1.11, 2)
    expect((OPPKJOP_MIN + OPPKJOP_MAKS) / 2).toBeCloseTo(1.3, 2)
    expect(RUNDER.at(-1)!.vekst).toEqual([1, 1])
  })
})

describe('lånetak på én time', () => {
  function medInntekt(): Spilltilstand {
    let s = nyttSpill(4711)
    s.kontanter = 1e9
    s.hoyesteFormue = 1e9
    s = simuler(s, 60)
    return s
  }

  it('du kan låne én time av det som kommer inn', () => {
    const s = medInntekt()
    expect(LAANETAK_TIMER).toBe(1)
    expect(laanetak(s)).toBeCloseTo(bruttoPerSek(s) * 3600, 0)
    expect(maksNyttLaan(s)).toBeLessThanOrEqual(laanetak(s))
  })

  it('et lån over taket står — ingen innkalling, bare ikke mer å låne', () => {
    const s = medInntekt()
    const tak = laanetak(s)
    s.gjeld = tak * 1.9
    const kontanter = s.kontanter
    expect(maksNyttLaan(s)).toBe(0)
    expect(laan(s, 1000).ok).toBe(false)
    const etter = simuler(s, 30)
    // Gjelden vokser bare med renta, og ingenting selges.
    expect(etter.gjeld).toBeGreaterThanOrEqual(s.gjeld)
    expect(etter.kontanter).toBeGreaterThan(kontanter)
    void ok
  })
})
