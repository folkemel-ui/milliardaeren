/**
 * Pakke 79 — reparasjoner: de sene byggene fra Pakke 76 teller ikke når du eier
 * hele byen, og et spillersalg skattes som alle andre salg.
 */

import { describe, expect, it } from 'vitest'
import { BYEIER_BONUS, byggForHeleByen, byggI, EIENDOMSTYPER, eierHeleByen, enheterI, leieHverPerSek } from '../eiendom'
import { kjopKlubb, kjopSpiller, selgEiendom, selgSpiller } from '../handlinger'
import { KLUBBNAVN, kjopspris, salgspris } from '../klubb'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import type { EiendomId, Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const SENE: EiendomId[] = ['canary-wharf', 'kjopesenterkjede', 'downtown-dubai', 'manhattan-skyskraper']

/** Et spill som eier alt vanlig i Oslo, men ikke kjøpesenterkjeden. */
function heleOslo(): Spilltilstand {
  const s = nyttSpill()
  for (const id of byggForHeleByen('Oslo')) s.eiendommer[id] = EIENDOMSTYPER[id].maksAntall
  return s
}

describe('hele byen', () => {
  it('de fire sene byggene teller ikke, men står fortsatt i byen', () => {
    for (const id of SENE) {
      const by = EIENDOMSTYPER[id].by
      expect(byggI(by), id).toContain(id)
      expect(byggForHeleByen(by), id).not.toContain(id)
    }
  })

  it('hele Oslo koster 3,34 mrd igjen (katalogpris), og gir bonusen uten kjøpesenterkjeden', () => {
    const pris = byggForHeleByen('Oslo').reduce((sum, id) => sum + EIENDOMSTYPER[id].pris * EIENDOMSTYPER[id].maksAntall, 0)
    expect(pris / 1e9).toBeCloseTo(3.3374, 4)
    const s = heleOslo()
    expect(s.eiendommer.kjopesenterkjede ?? 0).toBe(0)
    expect(eierHeleByen(s, 'Oslo')).toBe(true)
    const { eid, av } = enheterI(s, 'Oslo')
    expect(eid).toBe(av)
  })

  it('bonusen gir +10 % leie, som før Pakke 76', () => {
    const s = heleOslo()
    const med = leieHverPerSek(s, 'leilighet')
    s.eiendommer['hybel-oslo'] = (s.eiendommer['hybel-oslo'] ?? 1) - 1
    expect(eierHeleByen(s, 'Oslo')).toBe(false)
    expect(med / leieHverPerSek(s, 'leilighet')).toBeCloseTo(1 + BYEIER_BONUS, 6)
  })

  it('selger du det siste vanlige bygget, men eier kjeden, blir forvalteren', () => {
    let s = nyttSpill()
    s.eiendommer.hybel = 0
    s.eiendommer['hybel-oslo'] = 1
    s.eiendommer.kjopesenterkjede = 1
    s.forvaltere = { Oslo: 'lokal' }
    s = ok(selgEiendom(s, 'hybel-oslo'))
    expect(s.forvaltere?.Oslo).toBe('lokal')
    // Uten noe igjen i byen slutter forvalteren, som før.
    s = ok(selgEiendom(s, 'kjopesenterkjede'))
    expect(s.forvaltere?.Oslo).toBeUndefined()
  })
})

function medKlubb(): Spilltilstand {
  const s = nyttSpill(4242)
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

describe('skatt på spillersalg', () => {
  it('en kjøpt spiller: gevinsten er salgsprisen minus det du betalte, og klubbens kostpris er tilbake', () => {
    let s = medKlubb()
    const kostFør = s.klubb!.kostpris!
    const p = s.klubb!.marked[0]
    const pris = kjopspris(p)
    s = ok(kjopSpiller(s, p.id))
    const kjopt = s.klubb!.spillere.find((x) => x.id === p.id)!
    expect(kjopt.kostpris).toBe(pris)
    const gevinstFør = s.totaltGevinst ?? 0
    s = ok(selgSpiller(s, p.id))
    expect((s.totaltGevinst ?? 0) - gevinstFør).toBeCloseTo(salgspris(kjopt) - pris, 2)
    expect(s.klubb!.kostpris).toBeCloseTo(kostFør, 2)
  })

  it('en spiller fra før (uten kostpris) selges som før: klubbens kostpris går ned, ingen gevinst nå', () => {
    let s = medKlubb()
    const p = s.klubb!.spillere[0]
    expect(p.kostpris).toBeUndefined()
    const kostFør = s.klubb!.kostpris!
    const gevinstFør = s.totaltGevinst ?? 0
    s = ok(selgSpiller(s, p.id))
    expect(s.totaltGevinst ?? 0).toBe(gevinstFør)
    expect(s.klubb!.kostpris).toBeCloseTo(kostFør - salgspris(p), 2)
  })

  it('juniorene fra akademiet kostet ingenting: hele salget er gevinst', () => {
    let s = medKlubb()
    s.klubb!.akademi = { trinn: 3, investert: 74_000_000 }
    s = simuler(s, 2700 + 10)
    const junior = s.klubb!.spillere.find((p) => p.potensial !== undefined)!
    expect(junior).toBeDefined()
    expect(junior.kostpris).toBe(0)
    const gevinstFør = s.totaltGevinst ?? 0
    s = ok(selgSpiller(s, junior.id))
    expect((s.totaltGevinst ?? 0) - gevinstFør).toBeCloseTo(salgspris(junior), 2)
  })
})
