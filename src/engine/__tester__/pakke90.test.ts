/** Pakke 90: racingteamet — bilen, førerne, strategien, løpene, sesongen og mesterskapene. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { ansettForer, kjopLuksus, oppgraderDel, selgLuksus, selgRacingteam, settStrategi, startRacingteam, type Utfall } from '../handlinger'
import { simuler } from '../simulering'
import { luksusverdi, statuspoeng } from '../eiendom'
import { dagnummer, DAG_SEK } from '../kalender'
import {
  BIL_GRUNN,
  bilfart,
  BILDELLISTE,
  DAGER_MELLOM,
  DELTRINN_PRIS,
  FORERMESTER,
  kjorLop,
  konstruktortabell,
  LOP_PER_SESONG,
  lonnFor,
  lonnPerDag,
  MESTERPREMIE,
  nyttRacingteam,
  POENG,
  PREMIE_PER_POENG,
  RACING_TROFE_STATUS,
  racingVedDagsskifte,
  SALG_ANDEL,
  STRATEGIER,
  TEAMPRIS,
  TRINN_FART,
} from '../racing'
import type { Lopsstrategi, Racingteam, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medBil(kontanter = 1e11): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return ok(kjopLuksus(s, 'formelbil'))
}

function medTeam(kontanter = 1e11): Spilltilstand {
  return ok(startRacingteam(medBil(kontanter)))
}

/** Et team med alle delene på `steg` og to førere med `ferdighet`. */
function lag(steg: number, ferdighet: number, strategi: Lopsstrategi = 'normal'): Racingteam {
  const r = nyttRacingteam(nyttSpill())
  r.deler = { motor: steg, aero: steg, chassis: steg, depot: steg }
  r.forere = [0, 1].map((i) => ({ id: i, navn: `Fører ${i}`, ferdighet, lonn: 0 }))
  r.strategi = strategi
  return r
}

/** Snittplassen blant teamene over mange sesonger. */
function snittplass(steg: number, ferdighet: number, strategi: Lopsstrategi = 'normal', n = 60): number {
  let sum = 0
  for (let k = 0; k < n; k++) {
    const r = lag(steg, ferdighet, strategi)
    r.frø = k * 7919 + 13
    r.sesong = k + 1
    for (let i = 0; i < LOP_PER_SESONG; i++) kjorLop(r, i)
    sum += konstruktortabell(r).findIndex((x) => x.deg) + 1
  }
  return sum / n
}

describe('å starte et team', () => {
  it('krever Formel 1-bilen og 25 mill, som er forbruk', () => {
    const s = nyttSpill()
    s.kontanter = 1e9
    expect(startRacingteam(s).ok).toBe(false)
    const b = medBil(1e9)
    const t = ok(startRacingteam(b))
    expect(b.kontanter - t.kontanter).toBe(TEAMPRIS)
    expect(t.totaltForbruk - b.totaltForbruk).toBe(TEAMPRIS)
    expect(startRacingteam(t).ok).toBe(false)
  })

  it('to nykommere i setene, et marked med fire førere fra hvert lag av feltet, første løp om tre dager', () => {
    const s = medTeam()
    const r = s.racing!
    expect(r.forere.every((f) => f && f.ferdighet >= 48 && f.ferdighet <= 52)).toBe(true)
    expect(r.marked).toHaveLength(4)
    const f = r.marked.map((x) => x.ferdighet)
    expect([...f].sort((a, b) => a - b)).toEqual(f)
    expect(f[0]).toBeLessThanOrEqual(58)
    expect(f[3]).toBeGreaterThanOrEqual(82)
    expect(r.nesteDag).toBe(dagnummer(s.sek) + DAGER_MELLOM)
    expect(bilfart(r)).toBe(BIL_GRUNN)
  })

  it('bilen kan ikke selges mens den kjører for teamet', () => {
    const s = medTeam()
    expect(selgLuksus(s, 'formelbil').ok).toBe(false)
    expect(selgLuksus(medBil(), 'formelbil').ok).toBe(true)
  })
})

describe('bilen og førerne', () => {
  it('hver del har fem trinn fra 10 mill til 5 mrd, hvert +2,5 fart; det teller i formuen', () => {
    expect([...DELTRINN_PRIS]).toEqual([10e6, 50e6, 220e6, 1e9, 5e9])
    let s = medTeam()
    const kontanter = s.kontanter
    const samling = luksusverdi(s)
    for (const d of BILDELLISTE) for (let i = 0; i < 5; i++) s = ok(oppgraderDel(s, d))
    expect(oppgraderDel(s, 'motor').ok).toBe(false)
    expect(bilfart(s.racing!)).toBe(BIL_GRUNN + 20 * TRINN_FART)
    expect(bilfart(s.racing!)).toBe(90)
    const alt = 4 * DELTRINN_PRIS.reduce((a, b) => a + b, 0)
    expect(kontanter - s.kontanter).toBe(alt)
    expect(luksusverdi(s) - samling).toBe(alt)
  })

  it('lønnen går fra 100 000 kr til 5 mill om dagen etter ferdighet', () => {
    expect(lonnFor(45)).toBe(100_000)
    expect(lonnFor(95)).toBe(5_000_000)
    expect(lonnFor(70)).toBeGreaterThan(lonnFor(60))
  })

  it('en fører fra markedet tar setet, og den som satt der, går', () => {
    let s = medTeam()
    const ny = s.racing!.marked[3]
    s = ok(ansettForer(s, ny.id, 1))
    expect(s.racing!.forere[1]!.navn).toBe(ny.navn)
    expect(s.racing!.marked.some((x) => x.id === ny.id)).toBe(false)
    expect(ansettForer(s, ny.id, 0).ok).toBe(false)
    expect(lonnPerDag(s.racing!)).toBe(s.racing!.forere[0]!.lonn + ny.lonn)
  })

  it('strategien kan byttes, og «Aggressiv» krasjer oftere enn «Forsiktig»', () => {
    const s = ok(settStrategi(medTeam(), 'aggressiv'))
    expect(s.racing!.strategi).toBe('aggressiv')
    const krasj = (st: Lopsstrategi) => {
      const r = lag(3, 76, st)
      let ute = 0
      for (let i = 0; i < 400; i++) ute += kjorLop(r, i).plasser.filter((p) => p === 0).length
      return ute / 800
    }
    expect(krasj('aggressiv')).toBeGreaterThan(0.08)
    expect(krasj('forsiktig')).toBeLessThan(0.03)
    expect(STRATEGIER.aggressiv.fart).toBeGreaterThan(0)
  })
})

describe('løpene', () => {
  it('et løp deler ut 101 poeng til ti førere, og premien er 500 000 kr per poeng', () => {
    const r = lag(3, 76)
    const lop = kjorLop(r, 0)
    const sum = Object.values(r.forerpoeng).reduce((a, b) => a + b, 0)
    expect(sum).toBe(POENG.reduce((a, b) => a + b, 0))
    expect(Object.values(r.lagpoeng).reduce((a, b) => a + b, 0)).toBe(101)
    expect(lop.premie).toBe(lop.poeng * PREMIE_PER_POENG)
    expect(lop.pall).toHaveLength(3)
  })

  it('samme team og terning gir samme løp', () => {
    expect(kjorLop(lag(2, 65), 0)).toEqual(kjorLop(lag(2, 65), 0))
  })

  it('ett løp hver tredje dag, ved dagsskiftet; lønnen hver dag; alt i klubbens regnskap', () => {
    let s = medTeam()
    const start = s.racing!.nesteDag
    const lonn = lonnPerDag(s.racing!)
    const klubb = s.totaltKlubb ?? 0
    s = simuler(s, start * DAG_SEK + 1 - s.sek)
    const r = s.racing!
    expect(r.runde).toBe(1)
    expect(r.lop[0].dag).toBe(start)
    expect(r.nesteDag).toBe(start + DAGER_MELLOM)
    expect(r.lonn).toBe(lonn * DAGER_MELLOM)
    expect((s.totaltKlubb ?? 0) - klubb).toBeCloseTo(r.premier - r.lonn, 2)
    expect(s.hendelser.some((h) => h.tittel === 'Racing')).toBe(true)
  })

  it('åtte løp er en sesong: et sammendrag, poengene nullstilles og markedet fornyes', () => {
    let s = medTeam()
    const marked = s.racing!.marked.map((f) => f.navn)
    s = simuler(s, (s.racing!.nesteDag + DAGER_MELLOM * (LOP_PER_SESONG - 1) + 1) * DAG_SEK - s.sek)
    const r = s.racing!
    expect(r.sesong).toBe(2)
    expect(r.runde).toBe(0)
    expect(r.sesonger).toHaveLength(1)
    expect(r.sesonger[0].plass).toBeGreaterThanOrEqual(1)
    expect(r.lagpoeng).toEqual({})
    expect(r.marked.map((f) => f.navn)).not.toEqual(marked)
  })
})

describe('mesterskapene', () => {
  it('et mesterskap gir et trofé med status 3 og 50 mill; trofeet står igjen når teamet selges', () => {
    const s = medTeam()
    const r = s.racing!
    r.deler = { motor: 5, aero: 5, chassis: 5, depot: 5 }
    r.forere = [0, 1].map((i) => ({ id: i, navn: `Mester ${i}`, ferdighet: 95, lonn: 0 }))
    r.runde = LOP_PER_SESONG - 1
    r.lagpoeng = { [r.navn]: 500 }
    r.forerpoeng = { [`Mester 0|${r.navn}`]: 500 }
    const status = statuspoeng(s)
    const kontanter = s.kontanter
    s.sek = r.nesteDag * DAG_SEK
    const saker = racingVedDagsskifte(s, 'Rikmannen')
    expect(s.racingtrofeer?.map((t) => t.navn).sort()).toEqual(['Førermester', 'Konstruktørmester'])
    expect(statuspoeng(s) - status).toBe(2 * RACING_TROFE_STATUS)
    expect(s.kontanter - kontanter).toBeGreaterThanOrEqual(2 * MESTERPREMIE - 2 * 0)
    expect(saker.some((x) => x.type === 'deg' && x.tittel.includes('verdensmester'))).toBe(true)
    expect(s.racingtrofeer!.some((t) => t.navn === FORERMESTER)).toBe(true)
    const solgt = ok(selgRacingteam(s))
    expect(solgt.racing).toBeUndefined()
    expect(solgt.racingtrofeer).toHaveLength(2)
    expect(statuspoeng(solgt)).toBe(statuspoeng(s))
  })

  it('salget gir 85 % av delene og bokfører resten som tap', () => {
    let s = medTeam()
    for (const d of BILDELLISTE) s = ok(oppgraderDel(s, d))
    const investert = s.racing!.investert
    const solgt = ok(selgRacingteam(s))
    expect(solgt.kontanter - s.kontanter).toBeCloseTo(investert * SALG_ANDEL, 2)
    expect((solgt.totaltGevinst ?? 0) - (s.totaltGevinst ?? 0)).toBeCloseTo(-investert * (1 - SALG_ANDEL), 2)
    expect(selgLuksus(solgt, 'formelbil').ok).toBe(true)
  })
})

describe('balansen: bilen vokser med deg', () => {
  it('grunnbilen er sist, trinn 3 (1,1 mrd) rundt fjerde plass, alt bygd ut med en toppfører vinner', () => {
    expect(snittplass(0, 50)).toBeGreaterThan(9)
    const midt = snittplass(3, 76)
    expect(midt).toBeGreaterThan(3)
    expect(midt).toBeLessThan(6)
    expect(snittplass(5, 95)).toBeLessThan(1.3)
  })
})

it('et spill uten racingteam (fra før Pakke 90) går som før', () => {
  const s = nyttSpill()
  expect(s.racing).toBeUndefined()
  expect(racingVedDagsskifte(s, 'Den unge gründeren')).toEqual([])
})
