import { describe, expect, it, vi } from 'vitest'


// Grunnmekanikken testes uten kalenderen fra Pakke 49 (den testes i pakke49.test.ts).
vi.mock('../verden', async (ekte) => (await import('./utenKalender')).utenKalender(ekte))
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { ansett, ansettLeder, kjopBedrift, oppgrader, oppgraderFlere } from '../handlinger'
import {
  bedriftInntektPerSek,
  inntektPerSek,
  maksAnsatte,
  milepaelfaktor,
  nesteMilepael,
  nettoformue,
  oppgraderingspris,
  nivaaerDuHarRaadTil,
  prisForNivaaer,
} from '../formler'
import { BEDRIFTSTYPER } from '../innhold'
import type { Spilltilstand } from '../types'
import { bedrift } from './hjelp'

function med(endring: (s: Spilltilstand) => void): Spilltilstand {
  const s = nyttSpill()
  endring(s)
  return s
}

describe('bransjestigen', () => {
  const PØLSE = BEDRIFTSTYPER.polsebod

  it('låser pølseboden til formuen har nådd grensen', () => {
    const s = med((t) => {
      t.kontanter = PØLSE.pris
      t.hoyesteFormue = PØLSE.laasesOppVed - 1
    })
    expect(kjopBedrift(s, 'polsebod').ok).toBe(false)
    const rik = med((t) => {
      t.kontanter = PØLSE.pris
      t.hoyesteFormue = PØLSE.laasesOppVed
    })
    const u = kjopBedrift(rik, 'polsebod')
    expect(u.ok).toBe(true)
    if (u.ok) expect(u.tilstand.bedrifter.map((b) => b.type)).toEqual(['saftbod', 'polsebod'])
  })

  it('låser aldri igjen når formuen faller', () => {
    const s = med((t) => {
      t.kontanter = PØLSE.pris
      t.hoyesteFormue = PØLSE.laasesOppVed + 1
    })
    expect(nettoformue(s)).toBeLessThan(PØLSE.laasesOppVed)
    expect(kjopBedrift(s, 'polsebod').ok).toBe(true)
  })

  it('du kan eie én av hver type', () => {
    const s = med((t) => {
      t.kontanter = 1e6
    })
    expect(kjopBedrift(s, 'saftbod').ok).toBe(false)
  })

  it('nekter kjøp du ikke har råd til, og rører ikke tilstanden', () => {
    const s = med((t) => {
      t.kontanter = 100
      t.hoyesteFormue = 1e6
    })
    const kopi = structuredClone(s)
    expect(kjopBedrift(s, 'polsebod').ok).toBe(false)
    expect(s).toEqual(kopi)
  })

  it('et kjøp flytter penger til bedriften uten å endre nettoformuen', () => {
    const s = med((t) => {
      t.kontanter = 10_000
      t.hoyesteFormue = 10_000
    })
    const u = kjopBedrift(s, 'polsebod')
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(nettoformue(u.tilstand)).toBe(nettoformue(s))
    const opp = oppgrader(u.tilstand, 'b2')
    expect(opp.ok && nettoformue(opp.tilstand)).toBe(nettoformue(s))
  })
})

describe('nivåer og oppgraderinger', () => {
  it('oppgradering trekker prisen og øker inntekten', () => {
    const s = nyttSpill()
    const pris = oppgraderingspris(s.bedrifter[0])
    const u = oppgrader(s, 'b1')
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.tilstand.kontanter).toBe(s.kontanter - pris)
    expect(u.tilstand.bedrifter[0].nivaa).toBe(2)
    expect(inntektPerSek(u.tilstand)).toBe(2)
  })

  it('hvert nivå koster mer enn det forrige', () => {
    const s = nyttSpill()
    const u = oppgrader(s, 'b1')
    if (u.ok) expect(oppgraderingspris(u.tilstand.bedrifter[0])).toBeGreaterThan(oppgraderingspris(s.bedrifter[0]))
  })

  it('dobler inntekten ved nivå 25, 50 og 100', () => {
    expect([1, 24, 25, 49, 50, 99, 100, 200].map(milepaelfaktor)).toEqual([1, 1, 2, 2, 4, 4, 8, 8])
    expect([1, 25, 60, 100].map(nesteMilepael)).toEqual([25, 50, 100, null])
    const b = bedrift('saftbod', { nivaa: 24 })
    expect(bedriftInntektPerSek({ ...b, nivaa: 25 })).toBe(50)
    expect(bedriftInntektPerSek(b)).toBe(24)
  })
})

describe('ansatte og ledere', () => {
  it('i en liten bedrift koster en ansatt mer enn den gir — lønnen er fast', () => {
    const s = med((t) => {
      t.kontanter = 10_000
    })
    const u = ansett(s, 'b1')
    expect(u.ok).toBe(true)
    // Saftboden på nivå 1: 1 kr/s + 10 % − 3 kr/s i lønn.
    if (u.ok) expect(inntektPerSek(u.tilstand)).toBeCloseTo(1.1 - 3)
  })

  it('plassen til ansatte vokser med nivået', () => {
    const s = med((t) => {
      t.kontanter = 1e9
    })
    expect(maksAnsatte(s.bedrifter[0])).toBe(1)
    const u = ansett(s, 'b1')
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(ansett(u.tilstand, 'b1').ok).toBe(false)
    const opp = med((t) => {
      t.kontanter = 1e9
      t.bedrifter[0].nivaa = 5
    })
    expect(maksAnsatte(opp.bedrifter[0])).toBe(2)
  })

  it('uten leder står bedriften stille mens du er borte', () => {
    const s = nyttSpill()
    expect(simuler(s, 600, true).kontanter).toBe(s.kontanter)
  })

  it('med leder tjener bedriften penger mens du er borte', () => {
    const s = nyttSpill()
    const u = ansettLeder(s, 'b1')
    expect(u.ok).toBe(true)
    if (!u.ok) return
    const etter = simuler(u.tilstand, 600, true)
    expect(etter.kontanter - u.tilstand.kontanter).toBe(600)
  })

  it('en bedrift kan bare ha én leder', () => {
    const u = ansettLeder(nyttSpill(), 'b1')
    expect(u.ok && ansettLeder(u.tilstand, 'b1').ok).toBe(false)
  })
})

describe('flere nivåer på en gang', () => {
  it('koster det samme som å kjøpe ett og ett', () => {
    const s = nyttSpill()
    s.kontanter = 1e7
    const id = s.bedrifter[0].id
    const samlet = prisForNivaaer(s.bedrifter[0], 10)
    const u = oppgraderFlere(s, id, 10)
    if (!u.ok) throw new Error(u.feil)
    let enkelt = s
    for (let i = 0; i < 10; i++) {
      const v = oppgrader(enkelt, id)
      if (!v.ok) throw new Error(v.feil)
      enkelt = v.tilstand
    }
    expect(u.tilstand.bedrifter[0].nivaa).toBe(11)
    expect(u.tilstand.kontanter).toBeCloseTo(enkelt.kontanter)
    expect(s.kontanter - u.tilstand.kontanter).toBe(samlet)
    expect(u.tilstand.bedrifter[0].investert).toBe(enkelt.bedrifter[0].investert)
  })

  it('«Maks» er så mange du har råd til, og alt eller ingenting', () => {
    const s = nyttSpill()
    s.kontanter = 5000
    const b = s.bedrifter[0]
    const n = nivaaerDuHarRaadTil(b, s.kontanter)
    expect(prisForNivaaer(b, n)).toBeLessThanOrEqual(5000)
    expect(prisForNivaaer(b, n + 1)).toBeGreaterThan(5000)
    expect(oppgraderFlere(s, b.id, n + 1).ok).toBe(false)
    expect(oppgraderFlere(s, b.id, n).ok).toBe(true)
    expect(oppgraderFlere(s, b.id, 0).ok).toBe(false)
  })
})
