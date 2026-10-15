/**
 * Pakke 110: løpet direkte og den fulle rapporten — rundene, stillingen, depotstoppene,
 * utforkjøringene med årsak, avstandene, raskeste runde, tabellene som venter, og varslene.
 */

import { describe, expect, it } from 'vitest'
import { kjopLuksus, startRacingteam, type Utfall } from '../../engine/handlinger'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import { DELTALL, deltall, kjorLop, LOP_PER_SESONG, nyttRacingteam, POENG, racingVedDagsskifte } from '../../engine/racing'
import { nyttSpill } from '../../engine/start'
import type { Racingteam, Spilltilstand } from '../../engine/types'
import { nytt } from '../hendelsesstrom'
import { vises } from '../innstillinger'
import { aarsak, forlop, liveLop, lopsrunde, raskesteRunde, rundetidTekst, RUNDER, stillingIRunde, visRacing } from '../racinglive'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill med et team som er godt nok til å ta poeng, rett før løpsdagen. */
function medTeam(): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  s = ok(startRacingteam(ok(kjopLuksus(s, 'formelbil'))))
  const r = s.racing!
  r.deler = { motor: 4, aero: 4, chassis: 4, depot: 4 }
  r.forere = [0, 1].map((i) => ({ id: 100 + i, navn: `Fører ${i}`, ferdighet: 88, lonn: 0 }))
  return s
}

/** Dagsskiftet inn i løpsdagen: løpet avgjøres, og spillet står ved starten av dagen. */
function tilLopsdagen(s: Spilltilstand): Racingteam {
  const r = s.racing!
  s.sek = r.nesteDag * DAG_SEK
  racingVedDagsskifte(s, 'Rikmannen')
  return r
}

describe('runder og stilling', () => {
  it('50 runder over spilldagen, én hvert sjette sekund', () => {
    expect(RUNDER).toBe(50)
    expect(lopsrunde(10 * DAG_SEK)).toBe(0)
    expect(lopsrunde(10 * DAG_SEK + 6)).toBe(1)
    expect(lopsrunde(10 * DAG_SEK + 299)).toBe(49)
  })

  it('runde 0 er startrekkefølgen, runde 50 er resultatet, og ute-bilene står sist fra sin runde', () => {
    const s = medTeam()
    const r = tilLopsdagen(s)
    const lop = liveLop(s)!
    expect(lop).toBeTruthy()
    const start = stillingIRunde(r, lop, 0)
    const etterStart = [...lop.felt!].sort((a, b) => a.start - b.start).map((b) => b.forer)
    expect(start.filter((x) => !x.ute).map((x) => x.forer)).toEqual(etterStart.filter((n) => start.some((x) => x.forer === n && !x.ute)))
    const slutt = stillingIRunde(r, lop, RUNDER)
    const resultat = lop.felt!.filter((b) => b.plass > 0).sort((a, b) => a.plass - b.plass).map((b) => b.forer)
    expect(slutt.filter((x) => !x.ute).map((x) => x.forer)).toEqual(resultat)
    for (const b of forlop(r, lop).filter((x) => x.plass === 0)) {
      expect(stillingIRunde(r, lop, b.uteRunde! - 1).find((x) => x.forer === b.forer)!.ute).toBe(false)
      expect(stillingIRunde(r, lop, b.uteRunde!).find((x) => x.forer === b.forer)!.ute).toBe(true)
    }
  })
})

describe('rapporten', () => {
  it('avstandene stiger fra vinneren; depotstoppet ditt følger mannskapet; raskeste runde er en av de åtte første', () => {
    const s = medTeam()
    const r = tilLopsdagen(s)
    const lop = liveLop(s)!
    const imaal = forlop(r, lop).filter((b) => b.plass > 0).sort((a, b) => a.plass - b.plass)
    expect(imaal[0].gap).toBe(0)
    for (let i = 1; i < imaal.length; i++) expect(imaal[i].gap!).toBeGreaterThan(imaal[i - 1].gap!)
    for (const b of forlop(r, lop).filter((x) => x.deg)) {
      expect(Math.abs(b.stopptid - deltall(DELTALL.depot[0], 4))).toBeLessThanOrEqual(0.25)
      expect(b.stoppRunde).toBeGreaterThanOrEqual(15)
      expect(b.stoppRunde).toBeLessThanOrEqual(35)
    }
    for (const b of forlop(r, lop)) expect(!!b.aarsak).toBe(b.plass === 0)
    const raskest = raskesteRunde(r, lop)!
    expect(imaal.slice(0, 8).some((b) => b.forer === raskest.forer)).toBe(true)
    expect(rundetidTekst(81.345)).toBe('1:21,345')
    // Samme løp gir samme rapport hver gang.
    expect(forlop(r, lop)).toBe(forlop(r, lop))
  })

  it('årsaken følger strategien, regnet og motoren', () => {
    const tell = (aggressiv: boolean, regn: boolean, topp: boolean) => {
      const n: Record<string, number> = {}
      for (let i = 0; i < 1000; i++) {
        const a = aarsak((i + 0.5) / 1000, aggressiv, regn, topp)
        n[a] = (n[a] ?? 0) + 1
      }
      return n
    }
    const torr = tell(false, false, false)
    const vill = tell(true, true, false)
    expect(torr.Vannplaning ?? 0).toBe(0)
    expect((vill.Vannplaning ?? 0) + (vill.Kollisjon ?? 0)).toBeGreaterThan(600)
    expect((torr.Krasj ?? 0) + (torr.Kollisjon ?? 0)).toBeLessThan(450)
    expect(tell(false, false, true).Motorfeil).toBeGreaterThan(torr.Motorfeil)
  })

  it('bare de to siste løpene beholder hele feltet', () => {
    const r = nyttRacingteam(nyttSpill())
    for (let i = 0; i < LOP_PER_SESONG; i++) kjorLop(r, i)
    expect(r.lop.filter((x) => x.felt)).toHaveLength(2)
    expect(r.lop.at(-1)!.felt).toHaveLength(20)
  })
})

describe('tabellene og avisa venter til målflagget', () => {
  it('siden viser poengene som før løpet hele dagen; etter dagsskiftet er det teamet selv', () => {
    const s = medTeam()
    const r = tilLopsdagen(s)
    const lop = liveLop(s)!
    const v = visRacing(s, r)
    for (const b of lop.felt!.filter((x) => x.plass > 0 && x.plass <= POENG.length)) {
      expect((v.lagpoeng[b.lag] ?? 0) + 0).toBeLessThan(r.lagpoeng[b.lag])
    }
    expect(v.lop).toHaveLength(r.lop.length - 1)
    s.sek += DAG_SEK
    expect(visRacing(s, r)).toBe(r)
  })

  it('avisa og hendelsen om løpet kommer ved målflagget', () => {
    const s = medTeam()
    const r = s.racing!
    s.sek = r.nesteDag * DAG_SEK
    expect(racingVedDagsskifte(s, 'Rikmannen')).toEqual([])
    const hendelser = s.hendelser.length
    s.sek += DAG_SEK
    racingVedDagsskifte(s, 'Rikmannen')
    expect(s.hendelser.length).toBe(hendelser + 1)
    expect(s.hendelser.at(-1)!.tittel).toBe('Racing')
  })

  it('siste løp i sesongen: siden viser fjorårets tabell, og den nye sesongen venter', () => {
    const s = medTeam()
    const r = s.racing!
    r.runde = LOP_PER_SESONG - 1
    const sesong = r.sesong
    tilLopsdagen(s)
    expect(r.sesong).toBe(sesong + 1)
    expect(r.sisteTabell?.sesong).toBe(sesong)
    const v = visRacing(s, r)
    expect(v.sesong).toBe(sesong)
    expect(v.tabellVenter).toBeUndefined()
  })
})

describe('varslene', () => {
  it('målflagget ved dagsskiftet sier vinneren og dine, og vises på «Viktige»', () => {
    const s = medTeam()
    tilLopsdagen(s)
    const før = structuredClone(s)
    før.sek = dagnummer(s.sek) * DAG_SEK + DAG_SEK - 1
    const etter = structuredClone(s)
    etter.sek = før.sek + 1
    const flagg = nytt(før, etter).find((f) => f.type === 'slutt')
    expect(flagg).toBeTruthy()
    if (flagg?.type !== 'slutt') return
    expect(flagg.tittel).toMatch(/^Målflagg i /)
    expect(flagg.tekst).toMatch(/vant for/)
    expect(flagg.mål).toBe('samling')
    expect(vises(flagg, 'viktige')).toBe(true)
  })

  it('din fører som kjører av, meldes i sin runde — bare med «Alle»', () => {
    let funnet = false
    for (let k = 0; k < 40 && !funnet; k++) {
      const s = medTeam()
      const r = s.racing!
      r.frø = k * 7919 + 3
      r.strategi = 'aggressiv'
      tilLopsdagen(s)
      const lop = liveLop(s)!
      const ute = forlop(r, lop).find((b) => b.deg && b.uteRunde !== null)
      if (!ute) continue
      const før = structuredClone(s)
      før.sek = dagnummer(s.sek) * DAG_SEK + (ute.uteRunde! - 1) * 6
      const etter = structuredClone(før)
      etter.sek = før.sek + 6
      const v = nytt(før, etter).find((f) => f.type === 'lop')
      expect(v).toBeTruthy()
      if (v?.type === 'lop') expect(v.tekst).toContain(`runde ${ute.uteRunde}`)
      expect(vises(v!, 'viktige')).toBe(false)
      expect(vises(v!, 'alle')).toBe(true)
      funnet = true
    }
    expect(funnet).toBe(true)
  })
})
