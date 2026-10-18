/** Pakke 111: et team som vokser — juniorakademiet, førere som blir bedre, anleggene og sponsoren. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import {
  ansettForer,
  byggAnlegg,
  byggRacingakademi,
  juniorISete,
  kjopLuksus,
  oppgraderDel,
  selgJunior,
  selgRacingteam,
  startRacingteam,
  velgSponsor,
  type Utfall,
} from '../handlinger'
import { DAG_SEK } from '../kalender'
import {
  AKADEMI_TRINN,
  ANLEGG_PRIS,
  DELTRINN_PRIS,
  juniorpris,
  kjorLop,
  LOP_PER_SESONG,
  lonnFor,
  MAKS_JUNIORER,
  nesteDelpris,
  nyttRacingteam,
  potensialspenn,
  racingVedDagsskifte,
  racingverdi,
  SALG_ANDEL,
  SPONSOR_PLASS,
  SPONSOR_TRYGG,
} from '../racing'
import type { Forer, Racingteam, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medTeam(kontanter = 1e12): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return ok(startRacingteam(ok(kjopLuksus(s, 'formelbil'))))
}

/** Kjører resten av sesongen gjennom dagsskiftene, og ett til så avisa om siste løp slippes. */
function kjorSesong(s: Spilltilstand): void {
  const r = s.racing!
  const sesong = r.sesong
  while (r.sesong === sesong) {
    s.sek = r.nesteDag * DAG_SEK
    racingVedDagsskifte(s, 'Rikmannen')
  }
  s.sek += DAG_SEK
  racingVedDagsskifte(s, 'Rikmannen')
}

const forer = (id: number, ferdighet: number, alder: number, potensial: number): Forer => ({ id, navn: `Fører ${id}`, ferdighet, lonn: lonnFor(ferdighet), alder, potensial })

describe('juniorakademiet', () => {
  it('tre trinn til 20 mill, 150 mill og 1 mrd; pengene teller i teamets verdi', () => {
    let s = medTeam()
    expect(s.racing!.akademi).toBe(0)
    expect(s.racing!.juniorer).toEqual([])
    for (let i = 1; i <= 3; i++) {
      const før = s
      s = ok(byggRacingakademi(s))
      expect(før.kontanter - s.kontanter).toBe(AKADEMI_TRINN[i].pris)
      expect(s.racing!.akademi).toBe(i)
    }
    expect(byggRacingakademi(s).ok).toBe(false)
    expect(racingverdi(s)).toBe(20_000_000 + 150_000_000 + 1_000_000_000)
  })

  it('sender opp én junior per sesong (16–18 år, ferdighet og tak etter trinnet), høyst tre', () => {
    let s = ok(byggRacingakademi(medTeam()))
    kjorSesong(s)
    const j = s.racing!.juniorer!
    expect(j).toHaveLength(1)
    expect(j[0].alder).toBeGreaterThanOrEqual(16)
    expect(j[0].alder).toBeLessThanOrEqual(18)
    expect(j[0].ferdighet).toBeGreaterThanOrEqual(40)
    expect(j[0].ferdighet).toBeLessThanOrEqual(48)
    expect(j[0].potensial! - j[0].ferdighet).toBeGreaterThanOrEqual(15)
    expect(j[0].potensial! - j[0].ferdighet).toBeLessThanOrEqual(30)
    for (let i = 0; i < 4; i++) kjorSesong(s)
    expect(s.racing!.juniorer).toHaveLength(MAKS_JUNIORER)
    s = ok(byggRacingakademi(ok(byggRacingakademi(s))))
    expect(s.racing!.akademi).toBe(3)
  })

  it('taket går aldri over 99, og spennet du ser rommer taket', () => {
    const r = nyttRacingteam(nyttSpill())
    r.akademi = 3
    for (let sesong = 1; sesong <= 200; sesong++) {
      r.sesong = sesong
      const s = nyttSpill()
      s.racing = r
      r.juniorer = []
      r.runde = LOP_PER_SESONG - 1
      s.sek = r.nesteDag * DAG_SEK
      racingVedDagsskifte(s, 'Rikmannen')
      const j = r.juniorer![0]
      expect(j.potensial).toBeLessThanOrEqual(99)
      expect(j.ferdighet).toBeGreaterThanOrEqual(48)
      const spenn = potensialspenn(j)!
      expect(spenn[0]).toBeLessThanOrEqual(j.potensial!)
      expect(spenn[1]).toBeGreaterThanOrEqual(j.potensial!)
    }
  })

  it('en junior tar et sete (den som satt der, går), eller selges for 40 dagers lønn som gevinst', () => {
    let s = ok(byggRacingakademi(medTeam()))
    s.racing!.juniorer = [forer(90, 60, 17, 85), forer(91, 50, 16, 80)]
    const satt = ok(juniorISete(s, 90, 1))
    expect(satt.racing!.forere[1]!.navn).toBe('Fører 90')
    expect(satt.racing!.juniorer!.map((f) => f.id)).toEqual([91])
    const solgt = ok(selgJunior(s, 91))
    expect(solgt.kontanter - s.kontanter).toBe(40 * lonnFor(50))
    expect(juniorpris(forer(1, 60, 17, 85))).toBe(40 * lonnFor(60))
    expect((solgt.totaltGevinst ?? 0) - (s.totaltGevinst ?? 0)).toBe(40 * lonnFor(50))
    expect(selgJunior(solgt, 91).ok).toBe(false)
    expect(juniorISete(s, 90, 2).ok).toBe(false)
  })
})

describe('førere som vokser', () => {
  it('en ung fører vokser 3–7 i sesongen, aldri over taket; en eldre 0–1; lønnen følger', () => {
    const s = medTeam()
    const r = s.racing!
    r.forere = [forer(1, 60, 20, 90), forer(2, 80, 29, 99)]
    kjorSesong(s)
    const [ung, eldre] = r.forere as Forer[]
    expect(ung.ferdighet - 60).toBeGreaterThanOrEqual(3)
    expect(ung.ferdighet - 60).toBeLessThanOrEqual(7)
    expect(ung.alder).toBe(21)
    expect(ung.lonn).toBe(lonnFor(ung.ferdighet))
    expect(eldre.ferdighet - 80).toBeGreaterThanOrEqual(0)
    expect(eldre.ferdighet - 80).toBeLessThanOrEqual(1)
    r.forere = [forer(1, 70, 18, 72), null]
    kjorSesong(s)
    expect(r.forere[0]!.ferdighet).toBe(72)
  })

  it('simulatoren gir ett poeng til per trinn', () => {
    const uten = medTeam()
    uten.racing!.forere = [forer(1, 60, 30, 90), forer(2, 60, 31, 90)]
    const med = ok(byggAnlegg(ok(byggAnlegg(ok(byggAnlegg(uten, 'simulator')), 'simulator')), 'simulator'))
    kjorSesong(uten)
    kjorSesong(med)
    for (let i = 0; i < 2; i++) expect(med.racing!.forere[i]!.ferdighet - uten.racing!.forere[i]!.ferdighet).toBe(3)
  })

  it('førere fra før (uten alder og tak) får dem fra navnet ved sesongslutt', () => {
    const s = medTeam()
    const r = s.racing!
    r.forere = [{ id: 1, navn: 'Gammel Kjenning', ferdighet: 77, lonn: lonnFor(77) }, null]
    kjorSesong(s)
    const f = r.forere[0]!
    expect(f.alder).toBeGreaterThanOrEqual(23)
    expect(f.alder).toBeLessThanOrEqual(31)
    expect(f.potensial! - 77).toBeGreaterThanOrEqual(0)
    expect(f.potensial! - 77).toBeLessThanOrEqual(6)
    expect(f.ferdighet).toBeLessThanOrEqual(f.potensial!)
  })

  it('markedets førere har alder og tak; en på 28 eller eldre har ingenting å gå på', () => {
    const s = medTeam()
    for (let i = 0; i < 6; i++) kjorSesong(s)
    for (const f of s.racing!.marked) {
      expect(f.alder).toBeGreaterThanOrEqual(19)
      expect(f.alder).toBeLessThanOrEqual(32)
      if (f.alder! >= 28) expect(f.potensial).toBe(f.ferdighet)
      expect(ok(ansettForer(s, f.id, 0)).racing!.forere[0]!.potensial).toBe(f.potensial)
    }
  })
})

describe('anleggene', () => {
  it('vindtunnelen gjør aero og chassis 10 % billigere per trinn, fabrikken motor og depot', () => {
    let s = medTeam()
    s = ok(byggAnlegg(s, 'vindtunnel'))
    const r = s.racing!
    expect(nesteDelpris(r, 'aero')).toBe(DELTRINN_PRIS[0] * 0.9)
    expect(nesteDelpris(r, 'chassis')).toBe(DELTRINN_PRIS[0] * 0.9)
    expect(nesteDelpris(r, 'motor')).toBe(DELTRINN_PRIS[0])
    s = ok(byggAnlegg(ok(byggAnlegg(ok(byggAnlegg(s, 'fabrikk')), 'fabrikk')), 'fabrikk'))
    expect(nesteDelpris(s.racing!, 'motor')).toBe(DELTRINN_PRIS[0] * 0.7)
    expect(nesteDelpris(s.racing!, 'depot')).toBe(DELTRINN_PRIS[0] * 0.7)
    expect(byggAnlegg(s, 'fabrikk').ok).toBe(false)
    const før = s
    s = ok(oppgraderDel(s, 'motor'))
    expect(før.kontanter - s.kontanter).toBe(DELTRINN_PRIS[0] * 0.7)
  })

  it('50 mill, 300 mill og 1,5 mrd, i teamets verdi og i salget', () => {
    let s = medTeam()
    const kontanter = s.kontanter
    for (let i = 0; i < 3; i++) s = ok(byggAnlegg(s, 'simulator'))
    const sum = ANLEGG_PRIS.reduce((a, b) => a + b, 0)
    expect(kontanter - s.kontanter).toBe(sum)
    expect(racingverdi(s)).toBe(sum)
    expect(ok(selgRacingteam(s)).kontanter - s.kontanter).toBeCloseTo(sum * SALG_ANDEL, 2)
  })

  it('anleggene gir ingen fart: løpet er det samme med og uten', () => {
    const a = nyttRacingteam(nyttSpill())
    const b: Racingteam = structuredClone(a)
    b.anlegg = { vindtunnel: 3, fabrikk: 3, simulator: 3 }
    b.akademi = 3
    for (let i = 0; i < LOP_PER_SESONG; i++) expect(kjorLop(b, i).plasser).toEqual(kjorLop(a, i).plasser)
  })
})

describe('sponsoren', () => {
  it('et nytt team har den trygge avtalen: 70 % av det 10. plass gir, en åttendedel per løp', () => {
    const s = medTeam()
    const r = s.racing!
    expect(s.racing!.sponsor?.avtale).toBe('trygg')
    expect(r.sponsor?.trygg).toBe(SPONSOR_PLASS[9] * SPONSOR_TRYGG)
    kjorSesong(s)
    expect(r.sponsorpenger).toBe(LOP_PER_SESONG * Math.round((SPONSOR_PLASS[9] * SPONSOR_TRYGG) / LOP_PER_SESONG))
    // Neste sesong: 70 % av det fjorårets plass ville gitt.
    const plass = r.sesonger.at(-1)!.plass
    expect(r.sponsor?.trygg).toBe(Math.round(SPONSOR_PLASS[plass - 1] * SPONSOR_TRYGG))
  })

  it('resultatavtalen betaler etter plassen når sesongen er over, og avtalen står til neste sesong', () => {
    let s = medTeam()
    s.racing!.deler = { motor: 5, aero: 5, chassis: 5, depot: 5 }
    s.racing!.forere = [forer(1, 95, 30, 95), forer(2, 95, 30, 95)]
    s = ok(velgSponsor(s, 'resultat'))
    const r = s.racing!
    kjorSesong(s)
    const plass = r.sesonger.at(-1)!.plass
    expect(r.sponsorpenger).toBe(SPONSOR_PLASS[plass - 1])
    expect(r.sponsor?.avtale).toBe('resultat')
    expect(s.totaltRacing).toBeDefined()
  })

  it('avtalen kan bare velges før første løp', () => {
    const s = medTeam()
    const r = s.racing!
    s.sek = r.nesteDag * DAG_SEK
    racingVedDagsskifte(s, 'Rikmannen')
    expect(velgSponsor(s, 'resultat').ok).toBe(false)
  })

  it('et team fra før Pakke 111 får en trygg sponsor ved neste dagsskifte, og går ellers som før', () => {
    const s = medTeam()
    const r = s.racing!
    delete r.sponsor
    delete r.akademi
    delete r.juniorer
    delete r.anlegg
    delete r.sponsorpenger
    racingVedDagsskifte(s, 'Rikmannen')
    expect(s.racing!.sponsor?.avtale).toBe('trygg')
    kjorSesong(s)
    expect(s.racing!.juniorer).toBeUndefined()
    expect(nesteDelpris(r, 'aero')).toBe(DELTRINN_PRIS[0])
  })
})
