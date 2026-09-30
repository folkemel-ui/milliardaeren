import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopPapir, laan, nedbetal, selgPapir } from '../handlinger'
import { belaaningsgrad, maksKjop, maksNyttLaan, nettoformue, papirverdi } from '../formler'
import { AKSJER, KRYPTO, lagMarked, MAKS_KURSHISTORIKK, PAPIRER } from '../marked'
import { DAG_SEK } from '../kalender'
import { MAKS_BELAANING, MARGINKRAV, RENTE_PER_TIME } from '../innhold'
import type { PapirId, Spilltilstand } from '../types'
import { bedrift, laanUtenTak } from './hjelp'

function rik(kontanter = 1_000_000): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  return s
}

function kjøpt(s: Spilltilstand, id: PapirId, antall: number): Spilltilstand {
  const u = kjopPapir(s, id, antall)
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('markedet', () => {
  it('er deterministisk fra frøet, og varmet opp med to timers historikk', () => {
    expect(lagMarked(42)).toEqual(lagMarked(42))
    expect(lagMarked(42).marked.kurser.NFS.kurs).not.toBe(lagMarked(43).marked.kurser.NFS.kurs)
    for (const k of Object.values(nyttSpill().marked.kurser)) expect(k.historikk).toHaveLength(MAKS_KURSHISTORIKK)
  })

  it('kursene holder seg innenfor fornuftige grenser over et døgn', () => {
    const s = simuler(nyttSpill(), 24 * 3600)
    for (const id of AKSJER) {
      const forhold = s.marked.kurser[id].kurs / PAPIRER[id].startkurs
      expect(forhold).toBeGreaterThan(0.3)
      expect(forhold).toBeLessThan(10)
    }
    for (const id of KRYPTO) {
      expect(s.marked.kurser[id].kurs).toBeGreaterThan(0)
      expect(Number.isFinite(s.marked.kurser[id].kurs)).toBe(true)
    }
    expect(Math.abs(s.marked.stemning)).toBeLessThanOrEqual(1)
  })
})

describe('handel', () => {
  it('kjøp og salg med én gang taper penger (kurtasje og kurstrykk)', () => {
    const s = rik()
    const etter = kjøpt(s, 'NLT', 500)
    const u = selgPapir(etter, 'NLT', 500)
    expect(u.ok).toBe(true)
    if (u.ok) expect(u.tilstand.kontanter).toBeLessThan(s.kontanter)
  })

  it('et stort kjøp flytter kursen opp, et salg ned', () => {
    const s = rik(50_000_000)
    const før = s.marked.kurser.LKS.kurs
    const etter = kjøpt(s, 'LKS', 5_000_000)
    expect(etter.marked.kurser.LKS.kurs).toBeGreaterThan(før)
    const solgt = selgPapir(etter, 'LKS', 5_000_000)
    if (solgt.ok) expect(solgt.tilstand.marked.kurser.LKS.kurs).toBeLessThan(etter.marked.kurser.LKS.kurs)
  })

  it('maks kjøp går gjennom, og ett til er for mye', () => {
    const s = rik(10_000)
    const maks = maksKjop(s, 'FJK')
    expect(maks).toBeGreaterThan(0)
    expect(kjopPapir(s, 'FJK', maks).ok).toBe(true)
    expect(kjopPapir(s, 'FJK', maks + 1).ok).toBe(false)
  })

  it('krypto kan kjøpes i brøkdeler', () => {
    const s = rik(10_000)
    const etter = kjøpt(s, 'BMT', 0.01)
    expect(etter.beholdning.BMT?.antall).toBe(0.01)
  })

  it('aksjer betaler utbytte', () => {
    const s = kjøpt(rik(), 'FJK', 1_000)
    const etter = simuler(s, DAG_SEK)
    expect(etter.totaltUtbytte).toBeGreaterThan(0)
  })

  it('beholdningen teller med i nettoformuen', () => {
    const s = kjøpt(rik(), 'NFS', 100)
    expect(papirverdi(s)).toBeCloseTo(100 * s.marked.kurser.NFS.kurs)
    expect(nettoformue(s)).toBeCloseTo(s.kontanter + 250 + papirverdi(s))
  })
})

describe('banken', () => {
  it('lar deg låne til halvparten av eiendelene', () => {
    const s = nyttSpill()
    const maks = maksNyttLaan(s)
    const u = laan(s, maks)
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(belaaningsgrad(u.tilstand)).toBeCloseTo(MAKS_BELAANING, 2)
    expect(laan(u.tilstand, 10).ok).toBe(false)
    // Et lån endrer ikke nettoformuen.
    expect(nettoformue(u.tilstand)).toBeCloseTo(nettoformue(s))
  })

  it('krever renter hvert sekund', () => {
    const u = { tilstand: laanUtenTak(rik(100_000), 50_000) }
    const etter = simuler(u.tilstand, 3600)
    const rente = u.tilstand.kontanter + etter.totaltTjent - u.tilstand.totaltTjent - etter.kontanter
    expect(rente).toBeCloseTo(50_000 * RENTE_PER_TIME, 0)
  })

  it('nedbetaling fjerner gjelden', () => {
    const n = nedbetal(laanUtenTak(rik(100_000), 50_000), 1e12)
    expect(n.ok && n.tilstand.gjeld).toBe(0)
  })

  it('marginkrav: banken selger investeringene når gjelden blir for stor', () => {
    let s = laanUtenTak(rik(10_000))
    s = kjøpt(s, 'LKS', maksKjop(s, 'LKS'))
    // Kryptokrakk: kursen faller 40 %, og belåningen går over marginkravet.
    const k = s.marked.kurser.LKS
    k.avvik += Math.log(0.6)
    k.kurs *= 0.6
    expect(belaaningsgrad(s)).toBeGreaterThan(MARGINKRAV)
    const etter = simuler(s, 1)
    expect(etter.beholdning.LKS).toBeUndefined()
    expect(etter.hendelser.some((h) => h.tittel === 'Marginkrav')).toBe(true)
    expect(belaaningsgrad(etter)).toBeLessThanOrEqual(MAKS_BELAANING)
  })

  it('er du blakk etter salget, står gjelden igjen og du beholder bedriften', () => {
    let s = laanUtenTak(rik(10_000))
    s = kjøpt(s, 'LKS', maksKjop(s, 'LKS'))
    const k = s.marked.kurser.LKS
    k.avvik += Math.log(0.1)
    k.kurs *= 0.1
    const etter = simuler(s, 1)
    expect(etter.beholdning.LKS).toBeUndefined()
    expect(etter.bedrifter).toHaveLength(1)
    expect(etter.gjeld).toBeGreaterThan(0)
    expect(nettoformue(etter)).toBeLessThan(0)
  })

  it('konkurs: banken tar over bedrifter, men lar deg beholde én', () => {
    const s = rik(0)
    s.hoyesteFormue = 1e9
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 10, investert: 100_000 }))
    s.gjeld = 1_000_000
    const etter = simuler(s, 1)
    expect(etter.bedrifter.map((b) => b.type)).toEqual(['saftbod'])
    expect(etter.hendelser.some((h) => h.tittel === 'Konkursbo')).toBe(true)
    expect(etter.gjeld).toBeLessThan(1_000_000)
  })
})
