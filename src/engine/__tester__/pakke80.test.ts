/** Pakke 80: toppbedriftene — ansettelser som viser hva de gir, filialer og retning fra nivå 25, og en milepæl på 35. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { aapneFilial, ansett, velgRetning, type Utfall } from '../handlinger'
import { ansattGir, ansettelseGir, basisinntekt, bedriftInntektIDag, milepaelboost, milepaelfaktor, nesteMilepael } from '../formler'
import { FILIAL_FRA_NIVAA, filialFraNivaa, filialpris, FILIALANDEL, FILIALPRIS, HJEMME_BONUS } from '../filialer'
import { verdiVedNivaa } from '../fusjon'
import { kanVelgeRetning, RETNING_NIVAA, retningNivaa } from '../ansatte'
import { BEDRIFTSTYPER, erToppbedrift, MILEPAELER, milepaelerFor, STIGEN, TOPP_FRA_NIVAA, TOPPMILEPAEL } from '../innhold'
import { bedrift } from './hjelp'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const TOPP = STIGEN.slice(STIGEN.indexOf('hotell'))
const UNDER = STIGEN.slice(0, STIGEN.indexOf('hotell'))

function spillMed(type: (typeof STIGEN)[number], nivaa: number): Spilltilstand {
  const s = nyttSpill(80)
  s.kontanter = 1e16
  s.hoyesteFormue = 1e16
  s.bedrifter = [bedrift(type, { id: 'b0', nivaa, investert: verdiVedNivaa(BEDRIFTSTYPER[type], nivaa) })]
  return s
}

describe('toppbedriftene', () => {
  it('er de fra hotellet og opp — sju, og brikkefabrikken fra Pakke 117', () => {
    expect(TOPP).toEqual(['hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter', 'brikkefabrikk'])
    for (const t of TOPP) expect(erToppbedrift(t)).toBe(true)
    for (const t of UNDER) expect(erToppbedrift(t)).toBe(false)
  })
})

describe('en milepæl på 35', () => {
  it('dobler inntekten fra hotellet og opp, og bare der', () => {
    for (const t of TOPP) {
      expect(milepaelfaktor(34, t)).toBe(4 / 2)
      expect(milepaelfaktor(35, t)).toBe(4)
      expect(milepaelboost(TOPPMILEPAEL, t)).toBe(2)
      expect(nesteMilepael(25, t)).toBe(35)
      expect(nesteMilepael(35, t)).toBe(50)
      expect(milepaelerFor(t)).toEqual([25, 35, 50, 100, 150, 200, 250])
      const b = bedrift(t, { nivaa: 35 })
      expect(basisinntekt(b) / basisinntekt({ ...b, nivaa: 34 })).toBeCloseTo((35 / 34) * 2, 12)
    }
    for (const t of UNDER) {
      expect(milepaelfaktor(35, t)).toBe(2)
      expect(milepaelboost(35, t)).toBe(1)
      expect(nesteMilepael(25, t)).toBe(50)
      expect(milepaelerFor(t)).toBe(MILEPAELER)
    }
  })

  it('ganger hele veien opp: nivå 250 er ×27 for de små og ×54 for toppen', () => {
    expect(milepaelfaktor(250, 'saftbod')).toBe(27)
    expect(milepaelfaktor(250, 'hotell')).toBe(54)
    // Uten bransje: de felles milepælene, som før.
    expect(milepaelfaktor(250)).toBe(27)
  })
})

describe('filialer og retning fra nivå 25', () => {
  it('åpner på 25 fra hotellet og opp, på 50 under', () => {
    for (const t of TOPP) {
      expect(filialFraNivaa(t)).toBe(TOPP_FRA_NIVAA)
      expect(retningNivaa(t)).toBe(TOPP_FRA_NIVAA)
    }
    for (const t of UNDER) {
      expect(filialFraNivaa(t)).toBe(FILIAL_FRA_NIVAA)
      expect(retningNivaa(t)).toBe(RETNING_NIVAA)
    }
  })

  it('en bank på nivå 25 kan åpne filial og velge retning; på 24 kan den ikke', () => {
    const s24 = spillMed('bank', 24)
    expect(filialpris(s24.bedrifter[0])).toBeNull()
    expect(aapneFilial(s24, 'b0', 'Oslo').ok).toBe(false)
    expect(kanVelgeRetning(s24.bedrifter[0])).toBe(false)
    const s = spillMed('bank', 25)
    const etter = ok(aapneFilial(s, 'b0', 'Oslo'))
    expect(etter.bedrifter[0].filialer).toHaveLength(1)
    expect(ok(velgRetning(etter, 'b0', 'volum')).bedrifter[0].retning).toBe('volum')
  })

  it('en restaurant på 25 må fortsatt vente til 50', () => {
    const s = spillMed('restaurant', 25)
    expect(aapneFilial(s, 'b0', 'Oslo').ok).toBe(false)
    expect(velgRetning(s, 'b0', 'volum').ok).toBe(false)
  })

  it('prisen er av verdien på nivå 25, og står fast oppover', () => {
    for (const t of TOPP) {
      const pris = filialpris(bedrift(t, { nivaa: 25 }))
      expect(pris).toBe(Math.round(FILIALPRIS * FILIALANDEL[0] * verdiVedNivaa(BEDRIFTSTYPER[t], 25)))
      expect(filialpris(bedrift(t, { nivaa: 120 }))).toBe(pris)
    }
  })

  it('den første filialen i hjembyen gir 6–11 %/t ved nivå 25, og over 15 %/t ved nivå 35 (før: 2–3 %/t ved 50)', () => {
    for (const t of TOPP) {
      const pris = filialpris(bedrift(t, { nivaa: 25 }))!
      const paa = (nivaa: number) => (basisinntekt(bedrift(t, { nivaa })) * FILIALANDEL[0] * HJEMME_BONUS * 3600) / pris
      expect(paa(25)).toBeGreaterThan(0.05)
      expect(paa(25)).toBeLessThan(0.12)
      expect(paa(35)).toBeGreaterThan(0.15)
    }
  })
})

describe('ansettelser som viser hva de gir', () => {
  it('et flyselskap på nivå 5 taper på en ansatt, et hotell på nivå 25 tjener', () => {
    const fly = spillMed('flyselskap', 5)
    expect(ansettelseGir(fly, fly.bedrifter[0], 'erfaren')).toBeLessThan(0)
    const hotell = spillMed('hotell', 25)
    expect(ansettelseGir(hotell, hotell.bedrifter[0], 'erfaren')).toBeGreaterThan(0)
  })

  it('er nøyaktig det inntekten i dag endrer seg med, med filialene', () => {
    let s = spillMed('hotell', 30)
    s = ok(aapneFilial(s, 'b0', 'Geilo'))
    const før = bedriftInntektIDag(s, s.bedrifter[0])
    const gir = ansettelseGir(s, s.bedrifter[0], 'erfaren')
    const etter = ok(ansett(s, 'b0', 'erfaren'))
    expect(bedriftInntektIDag(etter, etter.bedrifter[0]) - før).toBeCloseTo(gir, 6)
    // Og den ansatte gir det samme når hen er der.
    expect(ansattGir(etter, etter.bedrifter[0], 0)).toBeCloseTo(gir, 6)
  })

  it('en ansettelse som taper penger stoppes ikke — den står bare i rødt', () => {
    const s = spillMed('flyselskap', 5)
    expect(ansettelseGir(s, s.bedrifter[0], 'erfaren')).toBeLessThan(0)
    expect(ansett(s, 'b0', 'erfaren').ok).toBe(true)
  })
})
