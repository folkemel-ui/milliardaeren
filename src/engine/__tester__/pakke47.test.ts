/**
 * Pakke 47 — solid grunn: et ekte sluttspill etter milliarden, og et spill
 * som tåler år med lagringer. (Lagringene fra alle gamle versjoner testes i
 * state/__tester__/gamle-lagringer.test.ts, ytelsen i ytelse.test.ts og
 * tempoet helt til billionen i balansebenken med BENK=1.)
 */

import { describe, expect, it } from 'vitest'
import { BEDRIFTSTYPER, STIGEN } from '../innhold'
import { maksKjop, milepaelfaktor, forbedringsfaktor } from '../formler'
import { handelskurs, KURTASJE, PAPIRER } from '../marked'
import { PRESTASJONER } from '../prestasjoner'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { MERKER } from '../../ui/merker'
import { FEIRES } from '../../ui/hendelsesstrom'
import { MILEPAELER as MAALMILEPAELER } from '../../ui/progresjon'
import { FORBEDRINGER } from '../innhold'
import { bedrift } from './hjelp'
import { kortKroner } from '../tall'
import { kompakt } from '../../ui/format'
import type { PapirId } from '../types'

describe('sluttspillet etter milliarden', () => {
  it('hele stigen låses opp før billionen', () => {
    for (const id of STIGEN) expect(BEDRIFTSTYPER[id].laasesOppVed, id).toBeLessThan(1e12)
    expect(BEDRIFTSTYPER.skisenter.laasesOppVed).toBe(750e9)
  })

  it('bransjene fra oljeselskapet tjener seg inn på rundt 30 000 sekunder, som banken', () => {
    for (const id of STIGEN.slice(STIGEN.indexOf('oljeselskap'))) {
      const t = BEDRIFTSTYPER[id]
      expect(t.pris / t.grunninntekt, id).toBeGreaterThan(28_000)
      expect(t.pris / t.grunninntekt, id).toBeLessThan(31_000)
    }
  })

  it('har prestasjoner for 10 mrd, 100 mrd og en billion, med medalje og feiring', () => {
    const nye = { 'ti-mrd': 1e10, 'hundre-mrd': 1e11, billionaer: 1e12 }
    for (const [id, belop] of Object.entries(nye)) {
      const p = PRESTASJONER.find((x) => x.id === id)!
      expect(p, id).toBeDefined()
      expect(MERKER[id], id).toBeDefined()
      expect(FEIRES[id], id).toBeDefined()
      // Samme navn som målet på målstripa.
      expect(MAALMILEPAELER.find((m) => m.belop === belop)?.navn).toBe(p.navn)
    }
    expect(FEIRES.billionaer.niva).toBe('milliard')
  })

  it('billionen stemples når formuen når den', () => {
    const s = nyttSpill()
    s.kontanter = 1e12
    const t = simuler(s, 1)
    expect(t.prestasjoner.billionaer).toBe(1)
    expect(t.prestasjoner['ti-mrd']).toBe(1)
  })
})

describe('raskere sekund', () => {
  it('milepæl- og forbedringsfaktoren er de samme som før', () => {
    for (const nivaa of [1, 24, 25, 49, 50, 99, 100, 300]) expect(milepaelfaktor(nivaa)).toBe(2 ** [25, 50, 100].filter((m) => nivaa >= m).length)
    for (const id of STIGEN) {
      for (let n = 0; n <= 3; n++) {
        const gammel = FORBEDRINGER[id].slice(0, n).reduce((f, x) => f * x.faktor, 1)
        expect(forbedringsfaktor(bedrift(id, { forbedringer: n })), `${id} ${n}`).toBe(gammel)
      }
    }
  })
})

describe('maks kjøp med svært mye penger', () => {
  it('finner det største antallet du har råd til, raskt, også med billioner på konto', () => {
    const s = nyttSpill()
    for (const kontanter of [1e6, 1e12, 6e12, 1e15]) {
      s.kontanter = kontanter
      for (const id of Object.keys(PAPIRER) as PapirId[]) {
        const start = performance.now()
        const maks = maksKjop(s, id)
        expect(performance.now() - start, `${id} ${kontanter}`).toBeLessThan(50)
        const kost = (a: number) => a * handelskurs(s, id, a) * (1 + KURTASJE)
        expect(kost(maks), id).toBeLessThanOrEqual(kontanter)
        // Og det bruker så godt som alle pengene: høyst én enhet (eller 0,1 promille) igjen.
        // (Med billioner er én 1/10 000 mynt mindre enn tallets nøyaktighet, så «én til» kan ikke sjekkes.)
        const enhet = PAPIRER[id].klasse === 'aksje' ? 1 : 0.0001
        const rest = kontanter - kost(maks)
        expect(rest <= kost(enhet) * 1.01 || rest <= kontanter * 1e-4, `${id} ${kontanter}`).toBe(true)
      }
    }
  })
})

describe('billioner i kort form', () => {
  it('går over fra mrd til bill ved tusen milliarder', () => {
    expect(kortKroner(999e9)).toBe('kr 999 mrd')
    expect(kortKroner(1e12)).toBe('kr 1 bill')
    expect(kortKroner(1.5e12)).toBe('kr 1,5 bill')
    expect(kortKroner(2.002e12)).toBe('kr 2 bill')
    expect(kompakt(2.002e12)).toBe('kr 2,00 bill')
    expect(kompakt(250e12)).toBe('kr 250 bill')
  })
})
