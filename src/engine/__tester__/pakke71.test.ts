/**
 * Pakke 71 — troppen: posisjoner og formasjoner, angrep og forsvar, taktikker
 * som hver passer sin kamp, og akademiet. Lagringsversjon 24 → 25.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { byggAkademi, kjopKlubb, settFormasjon, type Utfall } from '../handlinger'
import {
  AKADEMITRINN,
  delStyrke,
  FORMASJONER,
  FORMASJONSLISTE,
  forventetMaal,
  JUNIOR_TIL,
  KLUBBNAVN,
  klubbVedDagsskifte,
  klubbverdi,
  lagprofil,
  lagstyrke,
  MAKS_TROPP,
  POSISJONER,
  potensialspenn,
  RUNDER_PER_SESONG,
  STARTPOSISJONER,
  startellever,
  styrkeAv,
  TAKTIKKER,
  UTE_AV_POSISJON,
  UTEN_KEEPER,
} from '../klubb'
import { MIGRERINGER } from '../../state/migrering'
import type { Klubb, Posisjon, Spiller, Spilltilstand, Taktikk } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

/** Elleve like spillere i én posisjon. */
function enslagsTropp(k: Klubb, posisjon: Posisjon, styrke = 60): void {
  k.spillere = Array.from({ length: 11 }, (_, i) => ({ id: i + 1, navn: `Spiller ${i + 1}`, alder: 25, posisjon, angrep: styrke, forsvar: styrke, styrke }))
}

/** Forventede poeng med eksakte Poisson-sannsynligheter (høyst ni mål, som motoren). */
function poeng(xe: number, xm: number): number {
  const p = (l: number) => {
    const ut: number[] = []
    let sum = 0
    let f = 1
    for (let k = 0; k < 9; k++) {
      if (k > 0) f *= k
      ut[k] = (Math.exp(-l) * l ** k) / f
      sum += ut[k]
    }
    ut[9] = Math.max(0, 1 - sum)
    return ut
  }
  const a = p(xe)
  const b = p(xm)
  let v = 0
  let u = 0
  for (let i = 0; i <= 9; i++) for (let j = 0; j <= 9; j++) (i > j ? (v += a[i] * b[j]) : i === j ? (u += a[i] * b[j]) : 0)
  return 3 * v + u
}

function besteTaktikk(gap: number, hjemme: boolean): Taktikk {
  const liste = Object.keys(TAKTIKKER) as Taktikk[]
  const score = (t: Taktikk) => {
    const [xh, xb] = hjemme ? forventetMaal(50 + gap, 50, t, 'balansert') : forventetMaal(50, 50 + gap, 'balansert', t)
    return hjemme ? poeng(xh, xb) : poeng(xb, xh)
  }
  return liste.sort((a, b) => score(b) - score(a))[0]
}

describe('posisjoner og formasjoner', () => {
  it('en ny klubb kan stille 4-4-2 med alle i egen posisjon', () => {
    const k = medKlubb().klubb!
    expect(k.formasjon).toBe('4-4-2')
    expect(k.spillere).toHaveLength(14)
    const elleve = startellever(k)
    expect(elleve).toHaveLength(11)
    expect(elleve.every((p) => p.spiller && p.spiller.posisjon === p.plass)).toBe(true)
    for (const f of FORMASJONSLISTE) expect(Object.values(FORMASJONER[f]).reduce((a, b) => a + b, 0)).toBe(11)
    expect(STARTPOSISJONER.slice(0, 14).filter((p) => p === 'keeper')).toHaveLength(2)
  })

  it('elleve spisser er et dårligere lag enn en balansert tropp — og et lag uten keeper slipper inn', () => {
    const s = medKlubb()
    const k = s.klubb!
    const spisser = structuredClone(k)
    enslagsTropp(spisser, 'angrep')
    const balansert = structuredClone(k)
    const fireFireTo: Posisjon[] = ['keeper', 'forsvar', 'forsvar', 'forsvar', 'forsvar', 'midtbane', 'midtbane', 'midtbane', 'midtbane', 'angrep', 'angrep']
    balansert.spillere = fireFireTo.map((posisjon, i) => ({ id: i + 1, navn: `S${i}`, alder: 25, posisjon, angrep: 60, forsvar: 60, styrke: 60 }))
    const a = lagprofil(spisser)
    const b = lagprofil(balansert)
    expect(b.angrep).toBeCloseTo(60)
    expect(b.forsvar).toBeCloseTo(60)
    expect(a.forsvar).toBeLessThan(b.forsvar - 15)
    expect(a.angrep).toBeLessThan(b.angrep)
    expect(lagstyrke(spisser)).toBeLessThan(lagstyrke(balansert))
    // Keeperplassen tas av en utespiller som teller 40 %.
    expect(startellever(spisser)[0].spiller!.posisjon).toBe('angrep')
    expect(UTEN_KEEPER).toBeLessThan(UTE_AV_POSISJON)
  })

  it('formasjonen kan byttes, og 4-3-3 bruker tre spisser', () => {
    let s = medKlubb()
    expect(settFormasjon(s, '4-4-2').ok).toBe(false)
    s = ok(settFormasjon(s, '4-3-3'))
    expect(s.klubb!.formasjon).toBe('4-3-3')
    expect(startellever(s.klubb!).filter((p) => p.plass === 'angrep')).toHaveLength(3)
  })
})

describe('angrep og forsvar', () => {
  it('delingen holder styrken: en spiss over i angrep, en stopper over i forsvar, keeperen bare forsvar', () => {
    for (const posisjon of Object.keys(POSISJONER) as Posisjon[]) {
      for (const x of [0, 0.37, 0.99]) {
        const { angrep, forsvar } = delStyrke(60, posisjon, x)
        expect(Math.abs(styrkeAv(posisjon, angrep, forsvar) - 60)).toBeLessThanOrEqual(1)
        if (posisjon === 'angrep') expect(angrep).toBeGreaterThan(forsvar)
        if (posisjon === 'forsvar') expect(forsvar).toBeGreaterThan(angrep)
        if (posisjon === 'keeper') expect(forsvar).toBe(60)
      }
    }
  })

  it('et bedre angrep gir flere mål for, et bedre forsvar færre mot — og ett tall gir det gamle regnestykket', () => {
    const [a1, b1] = forventetMaal({ angrep: 60, forsvar: 50 }, 50, 'balansert', 'balansert')
    const [a2, b2] = forventetMaal({ angrep: 50, forsvar: 60 }, 50, 'balansert', 'balansert')
    const [a0, b0] = forventetMaal(50, 50, 'balansert', 'balansert')
    expect(a1).toBeGreaterThan(a0)
    expect(b1).toBeCloseTo(b0)
    expect(a2).toBeCloseTo(a0)
    expect(b2).toBeLessThan(b0)
    expect(forventetMaal(70, 50, 'balansert', 'balansert')).toEqual(forventetMaal({ angrep: 70, forsvar: 70 }, { angrep: 50, forsvar: 50 }, 'balansert', 'balansert'))
  })

  it('nye spillere og juniorer eldes i både angrep og forsvar, og styrken følger', () => {
    const s = medKlubb()
    const k = s.klubb!
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    for (const p of k.spillere) expect(p.styrke).toBe(styrkeAv(p.posisjon, p.angrep, p.forsvar))
  })
})

describe('taktikkene passer hver sin kamp', () => {
  it('Forsvar når klart svakere, Balansert jevnt, Angrep når klart sterkere — hjemme og borte', () => {
    expect(besteTaktikk(-20, true)).toBe('forsvar')
    expect(besteTaktikk(-12, true)).toBe('forsvar')
    expect(besteTaktikk(-4, true)).toBe('balansert')
    expect(besteTaktikk(0, true)).toBe('balansert')
    expect(besteTaktikk(10, true)).toBe('angrep')
    expect(besteTaktikk(20, true)).toBe('angrep')
    expect(besteTaktikk(-12, false)).toBe('forsvar')
    expect(besteTaktikk(4, false)).toBe('balansert')
    expect(besteTaktikk(14, false)).toBe('angrep')
  })

  it('beskrivelsene sier det', () => {
    expect(TAKTIKKER.forsvar.beskrivelse).toContain('klart sterkere')
    expect(TAKTIKKER.balansert.beskrivelse).toContain('jevn')
    expect(TAKTIKKER.angrep.beskrivelse).toContain('du er klart sterkere')
  })
})

describe('akademiet', () => {
  it('bygges i tre trinn som teller i klubbverdien, og sender juniorer opp ved sesongslutt', () => {
    let s = medKlubb()
    expect(s.klubb!.akademi).toEqual({ trinn: 0, investert: 0 })
    const før = klubbverdi(s)
    const formue = s.kontanter + klubbverdi(s)
    s = ok(byggAkademi(s))
    s = ok(byggAkademi(s))
    s = ok(byggAkademi(s))
    expect(byggAkademi(s).ok).toBe(false)
    expect(s.klubb!.akademi.trinn).toBe(3)
    expect(klubbverdi(s) - før).toBe(AKADEMITRINN[1].pris + AKADEMITRINN[2].pris + AKADEMITRINN[3].pris)
    expect(s.kontanter + klubbverdi(s)).toBe(formue)
    // En sesong: tre juniorer på 16–17 kommer opp, med et tak over dagens nivå.
    const k = s.klubb!
    const antall = k.spillere.length
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    const juniorer = k.spillere.filter((p) => p.potensial !== undefined)
    expect(juniorer).toHaveLength(3)
    expect(k.spillere).toHaveLength(antall + 3)
    for (const p of juniorer) {
      expect(p.alder).toBeGreaterThanOrEqual(16)
      expect(p.alder).toBeLessThanOrEqual(17)
      expect(p.potensial!).toBeGreaterThan(p.styrke)
      const spenn = potensialspenn(p)!
      expect(spenn[0]).toBeLessThanOrEqual(p.potensial!)
      expect(spenn[1]).toBeGreaterThanOrEqual(p.potensial!)
    }
  })

  it('en junior vokser mot taket og aldri over det, og troppen fylles ikke over MAKS_TROPP', () => {
    let s = medKlubb()
    for (let i = 0; i < 3; i++) s = ok(byggAkademi(s))
    const k = s.klubb!
    for (let sesong = 0; sesong < 8; sesong++) {
      for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
      expect(k.spillere.length).toBeLessThanOrEqual(MAKS_TROPP)
      for (const p of k.spillere) if (p.potensial !== undefined && p.alder <= JUNIOR_TIL) expect(p.styrke).toBeLessThanOrEqual(p.potensial)
    }
    expect(k.spillere.length).toBe(MAKS_TROPP)
  })
})

describe('lagringsversjon 24 → 25', () => {
  it('spillerne får posisjon, angrep og forsvar; styrken og klubbverdien står til kronen', () => {
    expect(SPILLVERSJON).toBe(25)
    const s = medKlubb()
    const gammel = structuredClone(s.klubb!) as Record<string, unknown>
    delete gammel.formasjon
    delete gammel.akademi
    for (const p of [...(gammel.spillere as Spiller[]), ...(gammel.marked as Spiller[])]) {
      delete (p as Partial<Spiller>).posisjon
      delete (p as Partial<Spiller>).angrep
      delete (p as Partial<Spiller>).forsvar
    }
    const m = MIGRERINGER[24]({ ...s, klubb: gammel } as unknown as Record<string, unknown>) as unknown as Spilltilstand
    const nk = m.klubb!
    expect(nk.formasjon).toBe('4-4-2')
    expect(nk.akademi).toEqual({ trinn: 0, investert: 0 })
    expect(klubbverdi(m)).toBe(klubbverdi(s))
    for (const p of [...nk.spillere, ...nk.marked]) {
      expect(POSISJONER[p.posisjon]).toBeDefined()
      expect(Math.abs(styrkeAv(p.posisjon, p.angrep, p.forsvar) - p.styrke)).toBeLessThanOrEqual(1)
    }
    expect(startellever(nk).every((p) => p.spiller && p.spiller.posisjon === p.plass)).toBe(true)
    expect(nk.spillere.filter((p) => p.posisjon === 'keeper')).toHaveLength(2)
  })

  it('uten klubb endres ingenting', () => {
    const s = { klubb: null }
    expect(MIGRERINGER[24](s)).toBe(s)
  })
})
