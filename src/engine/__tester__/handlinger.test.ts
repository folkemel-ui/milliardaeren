import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { ansett, ansettLeder, kjopBedrift, oppgrader } from '../handlinger'
import {
  bedriftInntektPerSek,
  inntektPerSek,
  maksAnsatte,
  milepaelfaktor,
  nesteMilepael,
  nettoformue,
  oppgraderingspris,
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
  it('en ansatt gir mer enn lønnen koster', () => {
    const s = med((t) => {
      t.kontanter = 10_000
    })
    const u = ansett(s, 'b1')
    expect(u.ok).toBe(true)
    if (u.ok) expect(inntektPerSek(u.tilstand)).toBeCloseTo(1.07)
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
