/** Pakke 9: skatt, rivaler og automatiske ordre. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import {
  betalSkatt,
  kjopPapir,
  kjopRivalblokk,
  nyOrdre,
  overtaRival,
  selgRivalandel,
  settOffshore,
  slettOrdre,
  type Utfall,
} from '../handlinger'
import { nettoformue, nettoPerSek } from '../formler'
import { DAG_SEK } from '../kalender'
import { beregnSkatt, FORFALL_DAGER, FORSINKELSESGEBYR, skattVedDagsskifte } from '../skatt'
import { blokkpris, forbesliste, oppkjopspris, rivalverdi, selskapsverdi } from '../rivaler'
import type { Terning } from '../rng'
import type { Oppgjor, Spilltilstand } from '../types'
import { bedrift } from './hjelp'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(kontanter = 1e10): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return s
}

/** En terning som alltid sier ja — for å teste bokettersyn uten flaks. */
const alltid = { sjanse: () => true, neste: () => 0, velg: <T,>(l: readonly T[]) => l[0], mellom: (a: number) => a } as unknown as Terning
const aldri = { sjanse: () => false, neste: () => 0.99, velg: <T,>(l: readonly T[]) => l[0], mellom: (a: number) => a } as unknown as Terning

function maaned(inntekt: number): Oppgjor {
  return {
    periode: 'maaned', navn: 'januar 2027', fraDag: 0, tilDag: 28,
    bedrifter: inntekt, leie: 0, utbytte: 0, sparerente: 0, renter: 0, forbruk: 0,
    formueFor: 0, formueEtter: 0, besteBedrift: null,
  }
}

describe('skatt', () => {
  it('er progressiv: ingenting under 50 000, så 15, 22 og 28 %', () => {
    expect(beregnSkatt(50_000)).toBe(0)
    expect(beregnSkatt(100_000)).toBeCloseTo(7_500)
    expect(beregnSkatt(1_000_000)).toBeCloseTo(142_500)
    expect(beregnSkatt(21_000_000)).toBeCloseTo(142_500 + 19_000_000 * 0.22 + 1_000_000 * 0.28)
  })

  it('månedsslutt gir en regning med forfall om en uke', () => {
    const s = rik()
    const saker = skattVedDagsskifte(s, [maaned(1_000_000)], aldri, 'Deg')
    expect(s.skatt.regninger).toHaveLength(1)
    expect(s.skatt.regninger[0].belop).toBeCloseTo(142_500)
    expect(s.skatt.regninger[0].forfallSek).toBe(s.sek + FORFALL_DAGER * DAG_SEK)
    expect(saker[0].tittel).toMatch(/Skatteoppgjøret/)
  })

  it('betaler du i tide, slipper du gebyret', () => {
    const s = rik()
    skattVedDagsskifte(s, [maaned(1_000_000)], aldri, 'Deg')
    const etter = ok(betalSkatt(s, s.skatt.regninger[0].id))
    expect(s.kontanter - etter.kontanter).toBeCloseTo(142_500)
    expect(etter.skatt.regninger).toHaveLength(0)
  })

  it('forfalte regninger krever skattemyndighetene inn med gebyr', () => {
    const s = rik()
    skattVedDagsskifte(s, [maaned(1_000_000)], aldri, 'Deg')
    s.sek += FORFALL_DAGER * DAG_SEK
    const før = s.kontanter
    skattVedDagsskifte(s, [], aldri, 'Deg')
    expect(før - s.kontanter).toBeCloseTo(142_500 * (1 + FORSINKELSESGEBYR))
    expect(s.hendelser.some((h) => h.tittel === 'Skatt innkrevd')).toBe(true)
  })

  it('har du ikke penger, blir skatten gjeld', () => {
    const s = rik(0)
    skattVedDagsskifte(s, [maaned(1_000_000)], aldri, 'Deg')
    s.sek += FORFALL_DAGER * DAG_SEK
    skattVedDagsskifte(s, [], aldri, 'Deg')
    expect(s.gjeld).toBeCloseTo(142_500 * (1 + FORSINKELSESGEBYR))
  })

  it('offshore halverer skatten — men bokettersyn koster dobbelt tilbake', () => {
    let s = rik()
    s = ok(settOffshore(s, true))
    skattVedDagsskifte(s, [maaned(1_000_000)], aldri, 'Deg')
    expect(s.skatt.regninger[0].belop).toBeCloseTo(71_250)
    expect(s.skatt.unndratt).toBeCloseTo(71_250)
    const saker = skattVedDagsskifte(s, [maaned(0)], alltid, 'Deg')
    const etterskatt = s.skatt.regninger.find((r) => r.type === 'etterskatt')
    expect(etterskatt?.belop).toBeCloseTo(142_500)
    expect(s.skatt.unndratt).toBe(0)
    expect(saker.some((x) => x.tittel.includes('Skattejakt'))).toBe(true)
  })

  it('i et ekte spill kommer regningen den første i måneden', () => {
    const s = nyttSpill()
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 60 }))
    const etter = simuler(s, 28 * DAG_SEK)
    expect(etter.skatt.regninger.some((r) => r.navn === 'Skatt for januar 2027')).toBe(true)
  })
})

describe('rivaler', () => {
  it('vokser av seg selv og står på Forbes-lista sammen med deg', () => {
    const s = nyttSpill()
    const etter = simuler(s, 3600)
    for (let i = 0; i < s.rivaler.length; i++) expect(etter.rivaler[i].formue).not.toBe(s.rivaler[i].formue)
    const liste = forbesliste(etter, nettoformue(etter))
    expect(liste).toHaveLength(5)
    expect(liste.some((p) => p.deg)).toBe(true)
    for (let i = 1; i < liste.length; i++) expect(liste[i - 1].formue).toBeGreaterThanOrEqual(liste[i].formue)
  })

  it('blokker på 10 % blir dyrere, stopper på 50 %, og oppkjøpet gir hele selskapet', () => {
    let s = rik()
    const første = blokkpris(s.rivaler[0])
    s = ok(kjopRivalblokk(s, 'gronn'))
    expect(s.rivaler[0].andel).toBe(0.1)
    expect(blokkpris(s.rivaler[0])).toBeGreaterThan(første)
    for (let i = 0; i < 4; i++) s = ok(kjopRivalblokk(s, 'gronn'))
    expect(s.rivaler[0].andel).toBe(0.5)
    expect(kjopRivalblokk(s, 'gronn').ok).toBe(false)
    const pris = oppkjopspris(s.rivaler[0])
    expect(pris).toBeCloseTo(0.5 * selskapsverdi(s.rivaler[0]) * 1.2)
    s = ok(overtaRival(s, 'gronn'))
    expect(s.rivaler[0]).toMatchObject({ andel: 1, overtatt: true })
    expect(forbesliste(s, nettoformue(s)).some((p) => p.rivalId === 'gronn')).toBe(false)
  })

  it('eierandeler teller i formuen og gir utbytte', () => {
    let s = rik()
    const inntektFør = nettoPerSek(s)
    s = ok(kjopRivalblokk(s, 'aas'))
    expect(rivalverdi(s)).toBeCloseTo(0.1 * selskapsverdi(s.rivaler[3]))
    expect(nettoPerSek(s)).toBeGreaterThan(inntektFør)
    const solgt = ok(selgRivalandel(s, 'aas'))
    expect(solgt.rivaler[3].andel).toBe(0)
  })
})

describe('automatiske ordre', () => {
  it('kjøper når kursen faller til grensen', () => {
    let s = rik()
    const kurs = s.marked.kurser.BMT.kurs
    s = ok(nyOrdre(s, 'BMT', 'kjop', kurs * 0.9, 0.5))
    s.marked.kurser.BMT.avvik += Math.log(0.85)
    s.marked.kurser.BMT.fundament *= 1
    // La markedet tikke: ordren sjekkes ved neste markedstikk.
    const k = s.marked.kurser.BMT
    k.kurs = k.fundament * Math.exp(k.avvik)
    const etter = simuler(s, 5)
    expect(etter.ordre).toHaveLength(0)
    expect(etter.beholdning.BMT?.antall).toBe(0.5)
    expect(etter.hendelser.some((h) => h.tittel === 'Ordre utført')).toBe(true)
  })

  it('stopp-tap selger når kursen faller, gevinstsikring når den stiger', () => {
    let s = ok(kjopPapir(rik(), 'FJD', 2))
    const kurs = s.marked.kurser.FJD.kurs
    s = ok(nyOrdre(s, 'FJD', 'selg-over', kurs * 1.5, 1))
    s = ok(nyOrdre(s, 'FJD', 'selg-under', kurs * 0.5, 1))
    const k = s.marked.kurser.FJD
    k.avvik += Math.log(2)
    k.kurs = k.fundament * Math.exp(k.avvik)
    const etter = simuler(s, 5)
    expect(etter.beholdning.FJD?.antall).toBe(1)
    expect(etter.ordre.map((o) => o.type)).toEqual(['selg-under'])
  })

  it('aksjeordre venter mens børsen er stengt', () => {
    let s = rik()
    s.sek = 5 * DAG_SEK // lørdag
    const kurs = s.marked.kurser.NFS.kurs
    s = ok(nyOrdre(s, 'NFS', 'kjop', kurs * 2, 10))
    const etter = simuler(s, 5)
    expect(etter.ordre).toHaveLength(1)
  })

  it('kan slettes', () => {
    let s = ok(nyOrdre(rik(), 'BMT', 'kjop', 1, 1))
    s = ok(slettOrdre(s, s.ordre[0].id))
    expect(s.ordre).toHaveLength(0)
  })
})
