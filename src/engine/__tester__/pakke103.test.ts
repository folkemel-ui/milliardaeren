/** Pakke 103: skatt du ser komme, et Forbes-kappløp avgjort av spillet, og startups verdt å se på. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { ansettLeder, betalDelAvSkatt, type Utfall } from '../handlinger'
import { DAG_SEK } from '../kalender'
import { FORSINKELSESGEBYR, skattSaLangt, skattVedDagsskifte } from '../skatt'
import { RIVALLOFT, rivaltikk, START_RIVALER } from '../rivaler'
import { Terning } from '../rng'
import { INNTRYKK_STOY, STARTVERDI_ANDEL, startupsVedDagsskifte } from '../startups'
import { MARKED_TIKK_SEK } from '../marked'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('skatt du ser komme', () => {
  it('«skatt så langt» er regningen som kommer den 1.', () => {
    let s = nyttSpill()
    s.kontanter = 1e7
    s.bedrifter[0].nivaa = 100
    s = ok(ansettLeder(s, s.bedrifter[0].id))
    // 1. februar 2027 er spilldag 28: like før dagsskiftet er måneden nesten ferdig.
    s = simuler(s, 28 * DAG_SEK - 1 - s.sek, true)
    const anslag = skattSaLangt(s)
    expect(anslag).toBeGreaterThan(0)
    s = simuler(s, 2, true)
    const regning = s.skatt.regninger.find((r) => r.type === 'skatt')!
    expect(regning.belop / anslag).toBeCloseTo(1, 2)
  })

  it('offshore halverer anslaget, som regningen', () => {
    let s = nyttSpill()
    s.kontanter = 1e7
    s.bedrifter[0].nivaa = 100
    s = ok(ansettLeder(s, s.bedrifter[0].id))
    s = simuler(s, 10 * DAG_SEK, true)
    const full = skattSaLangt(s)
    s.skatt.offshore = true
    expect(skattSaLangt(s)).toBeCloseTo(full / 2)
  })

  it('du kan betale det du har; gebyret ved forfall gjelder bare resten', () => {
    const s = nyttSpill()
    s.kontanter = 300
    s.skatt.regninger = [{ id: 1, navn: 'Skatt for januar 2027', belop: 1000, forfallSek: s.sek + DAG_SEK, type: 'skatt' }]
    const n = ok(betalDelAvSkatt(s, 1))
    expect(n.kontanter).toBe(0)
    expect(n.skatt.regninger[0].belop).toBe(700)
    expect(n.skatt.totaltBetalt).toBe(300)
    expect(betalDelAvSkatt(n, 1).ok).toBe(false)
    // Ved forfall: 700 × 1,1 krevd inn, ikke 1 000 × 1,1.
    n.sek = n.skatt.regninger[0].forfallSek
    n.kontanter = 10_000
    skattVedDagsskifte(n, [], new Terning(1), 'Du')
    expect(n.kontanter).toBeCloseTo(10_000 - 700 * (1 + FORSINKELSESGEBYR))
    expect(n.skatt.regninger).toEqual([])
  })

  it('har du nok, betaler den hele regningen', () => {
    const s = nyttSpill()
    s.kontanter = 5000
    s.skatt.regninger = [{ id: 1, navn: 'Skatt', belop: 1000, forfallSek: s.sek + DAG_SEK, type: 'skatt' }]
    const n = ok(betalDelAvSkatt(s, 1))
    expect(n.skatt.regninger).toEqual([])
    expect(n.kontanter).toBe(4000)
  })
})

describe('Marit Aas holder jevn fart', () => {
  it('ved 34 t ligger hun mellom ~500 og ~950 mrd i ni av ti spill (før 270–1 710)', () => {
    expect(RIVALLOFT.aas?.svingning).toBe(0.04)
    const sluttverdier: number[] = []
    const dt = MARKED_TIKK_SEK / 3600
    for (let frø = 1; frø <= 40; frø++) {
      const s = nyttSpill()
      s.rivaler = [structuredClone(START_RIVALER.find((r) => r.id === 'aas')!)]
      const t = new Terning(frø * 101)
      for (let i = 0; i < (34 * 3600) / MARKED_TIKK_SEK; i++) rivaltikk(s, t, dt)
      sluttverdier.push(s.rivaler[0].formue)
    }
    sluttverdier.sort((a, b) => a - b)
    expect(sluttverdier[4]).toBeGreaterThan(450e9)
    expect(sluttverdier[35]).toBeLessThan(1000e9)
  })
})

describe('startups verdt å se på', () => {
  it('inntrykket er dobbelt så støyete, så granskingen betaler seg', () => {
    expect(INNTRYKK_STOY[0]).toBe(0.5)
  })

  it('et nytt selskap starter på rundt 5 % av den høyeste formuen din', () => {
    expect(STARTVERDI_ANDEL).toBe(0.05)
    const s = nyttSpill()
    s.hoyesteFormue = 1e10
    s.startups = []
    const t = new Terning(7)
    for (let i = 0; i < 40 && (s.startups ?? []).length === 0; i++) startupsVedDagsskifte(s, t)
    const st = s.startups![0]
    expect(st.verdi).toBeGreaterThanOrEqual(0.5 * 0.05 * 1e10 * 0.95)
    expect(st.verdi).toBeLessThanOrEqual(1.5 * 0.05 * 1e10 * 1.05)
  })
})
