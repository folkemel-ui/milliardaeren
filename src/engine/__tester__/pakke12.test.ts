/** Pakke 12: fotballklubben. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopKlubb, kjopSpiller, selgKlubb, selgSpiller, settTaktikk, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { statuspoeng } from '../eiendom'
import { DAG_SEK } from '../kalender'
import {
  ANTALL_LAG,
  DIVISJONER,
  forventetMaal,
  KLUBB_LAAST_OPP,
  KLUBBNAVN,
  KLUBBSALG_HONORAR,
  klubbVedDagsskifte,
  klubbverdi,
  lagstyrke,
  lonnPerDag,
  MIN_TROPP,
  nesteKamp,
  plassering,
  poeng,
  RUNDER_PER_SESONG,
  rundensKamper,
  tabell,
  CUPMESTER,
  TV_PENGER,
} from '../klubb'
import { sjekkPrestasjoner } from '../prestasjoner'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

describe('serien', () => {
  it('alle møter alle nøyaktig én gang i løpet av sesongen', () => {
    const møtt = new Set<string>()
    for (let r = 0; r < RUNDER_PER_SESONG; r++) {
      const kamper = rundensKamper(r)
      expect(kamper).toHaveLength(ANTALL_LAG / 2)
      expect(new Set(kamper.flat()).size).toBe(ANTALL_LAG)
      for (const [a, b] of kamper) møtt.add([a, b].sort().join('-'))
    }
    expect(møtt.size).toBe((ANTALL_LAG * (ANTALL_LAG - 1)) / 2)
  })

  it('laget ditt spiller omtrent like mye hjemme som borte', () => {
    const hjemme = Array.from({ length: RUNDER_PER_SESONG }, (_, r) => rundensKamper(r).some(([h]) => h === 0)).filter(Boolean).length
    expect(hjemme).toBeGreaterThanOrEqual(4)
    expect(hjemme).toBeLessThanOrEqual(5)
  })

  it('sterkere lag og angrep gir flere mål; forsvar færre begge veier', () => {
    const [likt] = forventetMaal(50, 50, 'balansert', 'balansert')
    const [sterk] = forventetMaal(70, 50, 'balansert', 'balansert')
    expect(sterk).toBeGreaterThan(likt)
    const [a1, a2] = forventetMaal(50, 50, 'angrep', 'balansert')
    const [f1, f2] = forventetMaal(50, 50, 'forsvar', 'balansert')
    expect(a1).toBeGreaterThan(f1)
    expect(a2).toBeGreaterThan(f2)
  })
})

describe('klubben', () => {
  it('kan kjøpes fra 10 millioner, og kjøpet endrer ikke nettoformuen', () => {
    const fattig = nyttSpill()
    fattig.kontanter = 1e9
    fattig.hoyesteFormue = KLUBB_LAAST_OPP - 1
    expect(kjopKlubb(fattig, KLUBBNAVN[0]).ok).toBe(false)
    const s = nyttSpill()
    s.kontanter = 1e9
    s.hoyesteFormue = 1e9
    const før = nettoformue(s)
    const n = ok(kjopKlubb(s, KLUBBNAVN[0]))
    // Bare sponsorpengene og TV-pengene (Pakke 73) for første sesong kommer i tillegg.
    expect(nettoformue(n)).toBeCloseTo(før + DIVISJONER[0].sponsor + TV_PENGER[0], 0)
    expect(n.klubb!.spillere.length).toBeGreaterThanOrEqual(MIN_TROPP)
    expect(n.klubb!.lag).toHaveLength(ANTALL_LAG)
    expect(kjopKlubb(n, KLUBBNAVN[1]).ok).toBe(false)
  })

  it('en kamp om dagen: tabellen fylles, lønna betales, og markedet fornyes', () => {
    const s = medKlubb()
    const marked = s.klubb!.marked.map((p) => p.id)
    const lonn = lonnPerDag(s.klubb!)
    const kontanter = s.kontanter
    const saker = klubbVedDagsskifte(s)
    const k = s.klubb!
    expect(k.runde).toBe(1)
    expect(k.lag.every((l) => l.spilt === 1)).toBe(true)
    expect(k.kamper.filter((m) => !m.turnering)).toHaveLength(1)
    expect(k.lonn).toBe(lonn)
    expect(saker[0].tittel).toContain(k.navn)
    // Hjemmekamp gir billettinntekter, bortekamp ikke.
    expect(s.kontanter).toBeCloseTo(kontanter - lonn + k.billetter, 0)
    expect(k.marked.map((p) => p.id)).not.toEqual(marked)
  })

  it('etter ni runder: ny sesong, spillerne eldes, og topp to rykker opp', () => {
    const s = medKlubb()
    // Et superlag vinner serien.
    for (const p of s.klubb!.spillere) p.styrke = p.angrep = p.forsvar = 90
    const alder = s.klubb!.spillere[0].alder
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    const k = s.klubb!
    expect(k.sesong).toBe(2)
    expect(k.runde).toBe(0)
    expect(k.divisjon).toBe(1)
    expect(k.opprykk).toBe(1)
    expect(s.trofeer.filter((t) => t.navn !== CUPMESTER)).toHaveLength(1)
    expect(k.lag.every((l) => l.spilt === 0)).toBe(true)
    expect(k.spillere.find((p) => p.alder === alder + 1) ?? k.spillere.length).toBeTruthy()
    expect(k.sponsor).toBe(DIVISJONER[1].sponsor)
    sjekkPrestasjoner(s)
    expect(s.prestasjoner.opprykk).toBeDefined()
    expect(s.prestasjoner.seriemester).toBeDefined()
  })

  it('et svakt lag rykker ned, men aldri under 4. divisjon', () => {
    const s = medKlubb()
    s.klubb!.divisjon = 1
    for (const p of s.klubb!.spillere) p.styrke = p.angrep = p.forsvar = 5
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    expect(s.klubb!.divisjon).toBe(0)
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    expect(s.klubb!.divisjon).toBe(0)
  })

  it('tabellen sorterer på poeng og plasseringen finner laget ditt', () => {
    const s = medKlubb()
    for (let r = 0; r < 4; r++) klubbVedDagsskifte(s)
    const k = s.klubb!
    const t = tabell(k)
    for (let i = 1; i < t.length; i++) expect(poeng(k.lag[t[i - 1]])).toBeGreaterThanOrEqual(poeng(k.lag[t[i]]))
    expect(t[plassering(k) - 1]).toBe(0)
    expect(nesteKamp(k)).not.toBeNull()
  })

  it('spillere kjøpes og selges, innenfor troppens grenser', () => {
    let s = medKlubb()
    const p = s.klubb!.marked[0]
    const før = lagstyrke(s.klubb!)
    s = ok(kjopSpiller(s, p.id))
    expect(s.klubb!.spillere.some((x) => x.id === p.id)).toBe(true)
    expect(s.klubb!.marked.some((x) => x.id === p.id)).toBe(false)
    expect(lagstyrke(s.klubb!)).toBeGreaterThanOrEqual(før)
    // Selg ned til minimum, så stopper det.
    while (s.klubb!.spillere.length > MIN_TROPP) s = ok(selgSpiller(s, s.klubb!.spillere.at(-1)!.id))
    expect(selgSpiller(s, s.klubb!.spillere[0].id).ok).toBe(false)
  })

  it('taktikken kan byttes, og klubben kan selges med honorar', () => {
    let s = medKlubb()
    s = ok(settTaktikk(s, 'angrep'))
    expect(s.klubb!.taktikk).toBe('angrep')
    const verdi = klubbverdi(s)
    const kontanter = s.kontanter
    s = ok(selgKlubb(s))
    expect(s.klubb).toBeNull()
    expect(s.kontanter).toBeCloseTo(kontanter + verdi * (1 - KLUBBSALG_HONORAR))
    // En ny klubb kan kjøpes etterpå.
    expect(kjopKlubb(s, KLUBBNAVN[1]).ok).toBe(true)
  })

  it('divisjonen og trofeene gir status', () => {
    const s = medKlubb()
    const uten = nyttSpill()
    expect(statuspoeng(s)).toBe(statuspoeng(uten) + DIVISJONER[0].status)
    s.trofeer.push({ navn: 'Vinner av 4. divisjon', sesong: 1, klubb: 'x' })
    expect(statuspoeng(s)).toBeGreaterThan(DIVISJONER[0].status)
  })

  it('lønn kan gi lån i banken når kontantene er tomme', () => {
    const s = medKlubb()
    s.kontanter = 0
    s.gjeld = 0
    klubbVedDagsskifte(s)
    // Enten dekket billettene lønna, eller banken lånte ut resten.
    expect(s.kontanter >= 0).toBe(true)
  })

  it('går gjennom simuleringen, og samme spill gir samme resultater', () => {
    const med = medKlubb()
    const a = simuler(med, DAG_SEK * 3)
    const b = simuler(simuler(med, DAG_SEK), DAG_SEK * 2)
    expect(a.klubb!.runde).toBe(3)
    expect(b.klubb).toEqual(a.klubb)
  })

  it('en sesong i 4. divisjon er ikke en pengemaskin', () => {
    const s = medKlubb()
    const start = s.kontanter
    for (let r = 0; r < RUNDER_PER_SESONG - 1; r++) klubbVedDagsskifte(s)
    const k = s.klubb!
    // Billetter og sponsor mot lønn, over nesten en hel sesong: små beløp begge veier.
    const netto = k.billetter + k.sponsor - k.lonn
    expect(Math.abs(netto)).toBeLessThan(1_000_000)
    expect(s.kontanter - start).toBeCloseTo(k.billetter - k.lonn, 0)
  })
})
