import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopEiendom, kjopLuksus, laan, maksNyttLaanFor, selgEiendom, selgLuksus, utvidLager } from './hjelp'
import { belaaningsgrad, inntektPerSek, nettoformue, rentesats } from '../formler'
import {
  EIENDOMSTYPER,
  eiendomspris,
  leiePerSek,
  LUKSUS,
  MEGLERHONORAR,
  restverdi,
  statusnivaa,
  statuspoeng,
  utvidelsespris,
} from '../eiendom'
import { MAKS_BELAANING, RENTE_PER_TIME } from '../innhold'
import type { Spilltilstand } from '../types'

function rik(kontanter = 1e10): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return s
}

describe('eiendom', () => {
  it('kan ikke kjøpes før formuen har nådd i nærheten av prisen', () => {
    const s = nyttSpill()
    s.kontanter = 300_000
    expect(() => kjopEiendom(s, 'hybel')).toThrow(/ikke til salgs/)
    s.hoyesteFormue = 300_000
    expect(kjopEiendom(s, 'hybel').eiendommer.hybel).toBe(1)
  })

  it('gir leie hvert sekund — også mens du er borte, uten leder', () => {
    const s = kjopEiendom(rik(), 'hybel')
    const før = s.kontanter
    const forventet = leiePerSek(s) * 600
    expect(forventet).toBeCloseTo((EIENDOMSTYPER.hybel.pris * EIENDOMSTYPER.hybel.avkastning) / 6, -2)
    const etter = simuler(s, 600, true)
    // Borte, uten leder: saftboden står stille, men leien kommer. Indeksen
    // beveger seg litt underveis, så leien treffer innenfor noen prosent.
    expect((etter.kontanter - før) / forventet).toBeGreaterThan(0.95)
    expect((etter.kontanter - før) / forventet).toBeLessThan(1.05)
    expect(etter.totaltLeie).toBeGreaterThan(0)
  })

  it('teller med i nettoformuen til dagens pris, og et kjøp endrer den ikke', () => {
    const s = rik()
    const etter = kjopEiendom(s, 'leilighet')
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s))
  })

  it('salg koster meglerhonorar', () => {
    const s = kjopEiendom(rik(), 'hytte')
    const pris = eiendomspris(s, 'hytte')
    const etter = selgEiendom(s, 'hytte')
    expect(etter.kontanter - s.kontanter).toBeCloseTo(pris * (1 - MEGLERHONORAR))
    expect(etter.eiendommer.hytte).toBeUndefined()
  })

  it('du kan eie flere av samme type, opp til taket', () => {
    let s = rik()
    for (let i = 0; i < EIENDOMSTYPER.kjopesenter.maksAntall; i++) s = kjopEiendom(s, 'kjopesenter')
    expect(s.eiendommer.kjopesenter).toBe(EIENDOMSTYPER.kjopesenter.maksAntall)
    expect(() => kjopEiendom(s, 'kjopesenter')).toThrow()
  })

  it('den private øya krever statusnivå 5', () => {
    const s = rik(1e11)
    expect(() => kjopEiendom(s, 'oy')).toThrow(/statusnivå 5/)
  })

  it('eiendomsindeksen holder seg fornuftig over et døgn', () => {
    const s = simuler(nyttSpill(), 24 * 3600)
    expect(s.marked.eiendom.kurs).toBeGreaterThan(0.5)
    expect(s.marked.eiendom.kurs).toBeLessThan(2)
  })
})

describe('luksus og lager', () => {
  it('koster mer enn den er verdt: formuen synker med det du ikke får igjen', () => {
    const s = rik()
    const etter = kjopLuksus(s, 'superbil')
    expect(nettoformue(s) - nettoformue(etter)).toBeCloseTo(LUKSUS.superbil.pris - restverdi('superbil'))
    const solgt = selgLuksus(etter, 'superbil')
    expect(solgt.kontanter - etter.kontanter).toBeCloseTo(restverdi('superbil'))
  })

  it('bil nummer to trenger en ny garasjeplass', () => {
    let s = kjopLuksus(rik(), 'stasjonsvogn')
    expect(() => kjopLuksus(s, 'elbil')).toThrow(/garasjen/)
    const pris = utvidelsespris(s, 'garasje')
    s = utvidLager(s, 'garasje')
    expect(utvidelsespris(s, 'garasje')).toBeGreaterThan(pris)
    s = kjopLuksus(s, 'elbil')
    expect(s.luksus).toEqual(['stasjonsvogn', 'elbil'])
  })

  it('båter og fly trenger havn og hangar; klokker trenger ingenting', () => {
    const s = rik()
    expect(() => kjopLuksus(s, 'snekke')).toThrow(/havna/)
    expect(() => kjopLuksus(s, 'propellfly')).toThrow(/hangaren/)
    expect(kjopLuksus(s, 'gullklokke').luksus).toEqual(['gullklokke'])
  })

  it('du kan bare eie én av hver', () => {
    const s = kjopLuksus(rik(), 'gullklokke')
    expect(() => kjopLuksus(s, 'gullklokke')).toThrow()
  })
})

describe('status', () => {
  it('stiger med luksusen du eier, og gir mer inntekt og lavere rente', () => {
    let s = rik()
    const inntektFør = inntektPerSek(s)
    for (const id of ['gullklokke', 'mesterverk', 'diamantklokke'] as const) s = kjopLuksus(s, id)
    expect(statuspoeng(s)).toBe(28)
    expect(statusnivaa(s)).toBe(3)
    expect(inntektPerSek(s)).toBeCloseTo(inntektFør * 1.06)
    expect(rentesats(s)).toBeCloseTo(RENTE_PER_TIME - 0.006)
  })
})

describe('marginkrav med eiendom', () => {
  it('banken selger eiendom — én og én — før den tar bedrifter', () => {
    const s = nyttSpill()
    s.kontanter = 0
    s.bedrifter.push({ id: 'b2', type: 'polsebod', nivaa: 1, startetSek: 0, ansatte: 0, leder: false, investert: 3_000 })
    s.eiendommer = { hybel: 4 }
    // Uten gjeld er maks lån lik eiendelene; halvparten av det gir belåning på grensen.
    s.gjeld = Math.floor(maksNyttLaanFor(s) * MAKS_BELAANING)
    expect(belaaningsgrad(s)).toBeCloseTo(MAKS_BELAANING, 1)
    // Boligkrakk: prisene faller 40 %, og belåningen går over marginkravet.
    s.marked.eiendom.avvik += Math.log(0.6)
    s.marked.eiendom.kurs *= 0.6
    const etter = simuler(s, 1)
    expect(etter.eiendommer.hybel).toBeGreaterThan(0)
    expect(etter.eiendommer.hybel).toBeLessThan(4)
    expect(etter.bedrifter).toHaveLength(2)
    expect(belaaningsgrad(etter)).toBeLessThanOrEqual(MAKS_BELAANING)
  })

  it('et lån endrer ikke nettoformuen, heller ikke med eiendom', () => {
    const s = kjopEiendom(rik(1e6), 'hybel')
    const etter = laan(s, maksNyttLaanFor(s))
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s))
  })
})
