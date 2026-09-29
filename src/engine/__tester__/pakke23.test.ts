/** Pakke 23: selge selv og kø ved disken. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { aktivKo, betjenKo, kanSelgeSelv, KO_VARER_SEK, KOPPEPRIS, kotikk, MAKS_KOPPER_PER_SEK, selgKopp } from '../hender'
import { bedriftInntektPerSek } from '../formler'
import type { Utfall } from '../handlinger'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('selge selv', () => {
  it('en kopp gir penger, bokført på saftboden', () => {
    const s = nyttSpill()
    const n = ok(selgKopp(s))
    expect(n.kontanter).toBe(s.kontanter + KOPPEPRIS)
    expect(n.totaltTjent).toBe(s.totaltTjent + KOPPEPRIS)
    expect(n.bedrifter[0].tjent).toBe(s.bedrifter[0].tjent + KOPPEPRIS)
  })

  it('har et tak per sekund, som åpner igjen neste sekund', () => {
    let s = nyttSpill()
    for (let i = 0; i < MAKS_KOPPER_PER_SEK; i++) s = ok(selgKopp(s))
    expect(selgKopp(s).ok).toBe(false)
    s = simuler(s, 1)
    expect(selgKopp(s).ok).toBe(true)
  })

  it('slutter når saftboden har fått en ansatt', () => {
    const s = nyttSpill()
    expect(kanSelgeSelv(s)).toBe(true)
    s.bedrifter[0].ansatte = 1
    expect(kanSelgeSelv(s)).toBe(false)
    expect(selgKopp(s).ok).toBe(false)
  })
})

/** Første sekund i et spill der det dannes kø. */
function medKo(): Spilltilstand {
  let s = nyttSpill()
  for (let i = 0; i < 5000; i++) {
    s = simuler(s, 1)
    if (aktivKo(s)) return s
  }
  throw new Error('Ingen kø på 5000 sekunder')
}

describe('kø ved disken', () => {
  it('dannes av og til mens appen er åpen, og gir en halvt minutts inntekt', () => {
    const s = medKo()
    const ko = aktivKo(s)!
    const b = s.bedrifter.find((x) => x.id === ko.bedriftId)!
    expect(ko.bonus).toBeCloseTo(bedriftInntektPerSek(b) * 30, 5)
    const n = ok(betjenKo(s))
    expect(n.kontanter).toBeCloseTo(s.kontanter + ko.bonus)
    expect(aktivKo(n)).toBeNull()
    expect(betjenKo(n).ok).toBe(false)
  })

  it('går hvis ingen betjener den', () => {
    const s = simuler(medKo(), KO_VARER_SEK)
    expect(aktivKo(s)).toBeNull()
    expect(betjenKo(s).ok).toBe(false)
  })

  it('dannes aldri mens du er borte', () => {
    const s = nyttSpill()
    for (let i = 0; i < 20_000; i++) {
      s.sek++
      kotikk(s, true)
      expect(s.ko ?? null).toBeNull()
    }
  })

  it('kommer omtrent hvert tredje minutt', () => {
    const s = nyttSpill()
    let antall = 0
    for (let i = 0; i < 180 * 200; i++) {
      s.sek++
      kotikk(s, false)
      if (s.ko && s.ko.slutterSek === s.sek + KO_VARER_SEK) antall++
      // Betjen med en gang, så neste kan komme.
      s.ko = null
    }
    expect(antall).toBeGreaterThan(150)
    expect(antall).toBeLessThan(250)
  })

  it('rører ikke terningen: markedet blir det samme med og uten kø', () => {
    const a = simuler(nyttSpill(), 3600)
    const b = nyttSpill()
    b.ko = { bedriftId: b.bedrifter[0].id, slutterSek: 1e9, bonus: 1 }
    const c = simuler(b, 3600)
    expect(c.frø).toBe(a.frø)
    expect(c.marked.kurser).toEqual(a.marked.kurser)
  })
})
