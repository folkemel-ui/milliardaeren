/** Pakke 68: rettferdige avtaler — fusjonsgulv og port, gulv på oppkjøp, faste filialpriser og et hotell som lønner seg. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { aapneFilial, byPaaBedrift, kjopRivalblokk, overtaRival, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { filialpris, FILIAL_FRA_NIVAA, FILIALANDEL, FILIALPRIS } from '../filialer'
import { FUSJON_FRA_NIVAA, fulltOppkjop, oppkjopsgulv, prisantydning, PRIS_MOT_DIN, rivalbedrifter, verdiVedNivaa } from '../fusjon'
import { oppkjopspris, OPPKJOPSPREMIE, selskapsverdi } from '../rivaler'
import { BEDRIFTSTYPER } from '../innhold'
import { bedrift } from './hjelp'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill der den første rivalen er rik nok til å eie en saftbod, og du eier en saftbod på `nivaa`. */
function medRival(nivaa: number, investert = 5_000_000): Spilltilstand {
  const s = nyttSpill(4711)
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  const r = s.rivaler[0]
  r.formue = 1e6
  r.tak = 1e7
  s.bedrifter = [bedrift('saftbod', { id: 'b0', nivaa, investert })]
  return s
}

describe('fusjoner', () => {
  it('gulvet er det din egen bedrift er verdt (1,0 — før 1,5)', () => {
    expect(PRIS_MOT_DIN).toBe(1)
    const s = medRival(120)
    const rb = rivalbedrifter(s.rivaler[0]).find((x) => x.type === 'saftbod')!
    expect(prisantydning(s, rb)).toBe(Math.round(Math.max(rb.verdi, 5_000_000)))
  })

  it('åpner først når din bedrift har nådd nivå 100', () => {
    expect(FUSJON_FRA_NIVAA).toBe(100)
    const under = byPaaBedrift(medRival(99), medRival(99).rivaler[0].id, 'saftbod', 'sjenerost')
    expect(under.ok).toBe(false)
    if (!under.ok) expect(under.feil).toContain('nivå 100')
    const s = medRival(100)
    expect(byPaaBedrift(s, s.rivaler[0].id, 'saftbod', 'sjenerost').ok).toBe(true)
  })
})

describe('fiendtlig oppkjøp', () => {
  /** Kjøper deg opp til halvparten og tar resten. Gir tilstanden rett før og etter oppkjøpet. */
  function taOver(nivaa: number) {
    let s = medRival(nivaa)
    const id = s.rivaler[0].id
    while (s.rivaler[0].andel < 0.5 - 1e-9) s = ok(kjopRivalblokk(s, id))
    return { før: s, etter: ok(overtaRival(s, id)) }
  }

  it('koster aldri mindre enn fusjonene det gir — før kostet to oppkjøp kr 0,79 mill og doblet inntekten', () => {
    const { før } = taOver(120)
    const r = før.rivaler[0]
    expect(oppkjopsgulv(før, r)).toBe(5_000_000)
    expect(fulltOppkjop(før, r)).toBe(Math.max(oppkjopspris(r), 5_000_000))
    expect(fulltOppkjop(før, r)).toBeGreaterThan(oppkjopspris(r))
  })

  it('det som betales over selskapets pris, går inn i bedriften — nettoformuen taper bare premien', () => {
    const { før, etter } = taOver(120)
    const r = før.rivaler[0]
    const pris = fulltOppkjop(før, r)
    expect(før.kontanter - etter.kontanter).toBeCloseTo(pris, 0)
    expect(etter.bedrifter[0].fusjoner).toBe(1)
    // Premien er det eneste som forsvinner: (1 − andel) · selskapsverdi · 20 %.
    const premie = (1 - r.andel) * selskapsverdi(r) * OPPKJOPSPREMIE
    expect(nettoformue(før) - nettoformue(etter)).toBeCloseTo(premie, -1)
  })

  it('en bedrift under nivå 100 slås ikke sammen ved oppkjøp, og teller ikke i gulvet', () => {
    const { før, etter } = taOver(80)
    expect(oppkjopsgulv(før, før.rivaler[0])).toBe(0)
    expect(fulltOppkjop(før, før.rivaler[0])).toBe(oppkjopspris(før.rivaler[0]))
    expect(etter.bedrifter[0].fusjoner).toBe(0)
  })
})

describe('filialer til fast pris', () => {
  it('koster det samme ved nivå 50 og 150 — før ×118 ved nivå 100', () => {
    const base = verdiVedNivaa(BEDRIFTSTYPER.oljeselskap, FILIAL_FRA_NIVAA)
    const tidlig = bedrift('oljeselskap', { nivaa: 50, investert: base })
    const sent = bedrift('oljeselskap', { nivaa: 150, investert: base * 5_000 })
    expect(filialpris(tidlig)).toBe(Math.round(FILIALPRIS * FILIALANDEL[0] * base))
    expect(filialpris(sent)).toBe(filialpris(tidlig))
  })

  it('andre og tredje filial er billigere etter andelen, uansett når de åpnes', () => {
    let s = medRival(50)
    s.bedrifter[0].investert = 1
    const pris1 = filialpris(s.bedrifter[0])!
    s = ok(aapneFilial(s, 'b0', 'Oslo'))
    s.bedrifter[0].nivaa = 140
    const pris2 = filialpris(s.bedrifter[0])!
    expect(pris2 / pris1).toBeCloseTo(FILIALANDEL[1] / FILIALANDEL[0], 5)
  })
})

describe('hotellet', () => {
  it('tjener seg inn på 30 000 s, som naboene — før 37 500', () => {
    const t = BEDRIFTSTYPER
    expect(t.hotell.pris / t.hotell.grunninntekt).toBe(30_000)
    expect(t.bank.pris / t.bank.grunninntekt).toBe(30_000)
  })
})
