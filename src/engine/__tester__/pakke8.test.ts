/** Pakke 8: unike forbedringer og oppussing av eiendom. */

import { describe, expect, it, vi } from 'vitest'

// Leie testes uten ledighet og forvaltere fra Pakke 54 (de testes i pakke54.test.ts).
vi.mock('../utleie', async (ekte) => (await import('./utenUtleie')).utenUtleie(ekte))
import { eiendomskurs } from '../regioner'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopEiendom as kjopEiendomU, kjopForbedring, pussOpp, selgEiendom as selgEiendomU } from '../handlinger'
import { bedriftInntektPerSek, forbedringsfaktor, forbedringspris, nesteForbedring, nettoformue } from '../formler'
import { FORBEDRINGER } from '../innhold'
import { EIENDOMSTYPER, eiendomspris, leiePerSek, oppussingspris, STANDARDER } from '../eiendom'
import { DAG_SEK } from '../kalender'
import { kjopEiendom, selgEiendom } from './hjelp'
import type { Spilltilstand } from '../types'

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  return s
}

function ok<T extends { ok: boolean }>(u: T): Spilltilstand {
  if (!u.ok) throw new Error((u as unknown as { feil: string }).feil)
  return (u as unknown as { tilstand: Spilltilstand }).tilstand
}

describe('unike forbedringer', () => {
  it('hver bransje har tre, i stigende nivå', () => {
    for (const liste of Object.values(FORBEDRINGER)) {
      expect(liste).toHaveLength(3)
      expect(liste.map((f) => f.nivaa)).toEqual([10, 40, 80])
    }
  })

  it('er låst til bedriften har nådd nivået', () => {
    const s = rik()
    const u = kjopForbedring(s, 'b1')
    expect(u.ok).toBe(false)
    if (!u.ok) expect(u.feil).toMatch(/nivå 10/)
  })

  it('ganger inntekten, kjøpes i rekkefølge og bokføres som investering', () => {
    const s = rik()
    s.bedrifter[0].nivaa = 40
    const før = bedriftInntektPerSek(s.bedrifter[0])
    const f = nesteForbedring(s.bedrifter[0])!
    expect(f.navn).toBe('Saftpresse')
    const pris = forbedringspris(s.bedrifter[0], f)
    const etter = ok(kjopForbedring(s, 'b1'))
    expect(bedriftInntektPerSek(etter.bedrifter[0])).toBeCloseTo(før * 1.5)
    expect(etter.bedrifter[0].investert).toBe(s.bedrifter[0].investert + pris)
    expect(nettoformue(etter)).toBeCloseTo(nettoformue(s))
    const to = ok(kjopForbedring(etter, 'b1'))
    expect(forbedringsfaktor(to.bedrifter[0])).toBeCloseTo(2.25)
    // Den tredje krever nivå 80.
    expect(kjopForbedring(to, 'b1').ok).toBe(false)
  })
})

describe('oppussing', () => {
  it('koster en andel av prisen per enhet, og enhetene står tomme mens det pågår', () => {
    let s = kjopEiendom(rik(), 'hybel')
    s = kjopEiendom(s, 'hybel')
    const leieFør = leiePerSek(s)
    const pris = oppussingspris(s, 'hybel')!
    expect(pris).toBeCloseTo(2 * EIENDOMSTYPER.hybel.pris * eiendomskurs(s, EIENDOMSTYPER.hybel.by) * STANDARDER[1].kostnad)
    const kostFør = s.eiendomKostpris.hybel!
    s = ok(pussOpp(s, 'hybel'))
    expect(s.eiendomKostpris.hybel).toBeCloseTo(kostFør + pris)
    expect(leiePerSek(s)).toBe(0)
    expect(leieFør).toBeGreaterThan(0)
    // Ingen handel med typen mens håndverkerne holder på.
    expect(kjopEiendomU(s, 'hybel').ok).toBe(false)
    expect(selgEiendomU(s, 'hybel').ok).toBe(false)
    expect(pussOpp(s, 'hybel').ok).toBe(false)
  })

  it('gir mer leie og høyere verdi når den er ferdig', () => {
    let s = kjopEiendom(rik(), 'leilighet')
    const verdiFør = eiendomspris(s, 'leilighet') / eiendomskurs(s, EIENDOMSTYPER.leilighet.by)
    s = ok(pussOpp(s, 'leilighet'))
    const ferdig = simuler(s, STANDARDER[1].dager * DAG_SEK)
    expect(ferdig.eiendomStandard.leilighet).toBe(1)
    expect(ferdig.oppussing.leilighet).toBeUndefined()
    expect(eiendomspris(ferdig, 'leilighet') / eiendomskurs(ferdig, EIENDOMSTYPER.leilighet.by)).toBeCloseTo(verdiFør * STANDARDER[1].verdi)
    const leieHver = leiePerSek(ferdig)
    const forventet = (EIENDOMSTYPER.leilighet.pris * eiendomskurs(ferdig, EIENDOMSTYPER.leilighet.by) * EIENDOMSTYPER.leilighet.avkastning * 1.3) / 3600
    expect(leieHver).toBeCloseTo(forventet)
  })

  it('nye enheter av en oppusset type kjøpes ferdig oppusset — og koster deretter', () => {
    let s = kjopEiendom(rik(), 'hytte')
    s = simuler(ok(pussOpp(s, 'hytte')), STANDARDER[1].dager * DAG_SEK)
    const pris = eiendomspris(s, 'hytte')
    expect(pris).toBeCloseTo(EIENDOMSTYPER.hytte.pris * eiendomskurs(s, EIENDOMSTYPER.hytte.by) * STANDARDER[1].verdi)
    const kontanterFør = s.kontanter
    s = kjopEiendom(s, 'hytte')
    expect(kontanterFør - s.kontanter).toBeCloseTo(pris)
  })

  it('selger du alle enhetene, forsvinner standarden', () => {
    let s = kjopEiendom(rik(), 'rekkehus')
    s = simuler(ok(pussOpp(s, 'rekkehus')), STANDARDER[1].dager * DAG_SEK)
    s = selgEiendom(s, 'rekkehus')
    expect(s.eiendomStandard.rekkehus).toBeUndefined()
  })

  it('luksus er toppen', () => {
    let s = kjopEiendom(rik(), 'hybel')
    s = simuler(ok(pussOpp(s, 'hybel')), STANDARDER[1].dager * DAG_SEK)
    s = simuler(ok(pussOpp(s, 'hybel')), STANDARDER[2].dager * DAG_SEK)
    expect(s.eiendomStandard.hybel).toBe(2)
    expect(oppussingspris(s, 'hybel')).toBeNull()
  })
})
