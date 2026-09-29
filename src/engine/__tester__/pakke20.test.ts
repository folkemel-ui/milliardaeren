/** Pakke 20: tall som ikke er tall slipper aldri inn i spillet. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import * as h from '../handlinger'
import { KRYPTO } from '../marked'
import type { Spilltilstand } from '../types'

function ok(u: h.Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

// Krypto og kryptofondet handles også i helgen, så dagen spiller ingen rolle.
const MYNT = KRYPTO[0]

function rikt(): Spilltilstand {
  let s = nyttSpill()
  s = { ...s, kontanter: 1_000_000 }
  s = ok(h.settInn(s, 100_000))
  s = ok(h.kjopPapir(s, MYNT, 1))
  s = ok(h.kjopFond(s, 'KRYPTOFOND', 50_000))
  s = ok(h.laan(s, 1000))
  return s
}

describe('ugyldige tall avvises', () => {
  const s = rikt()
  const handlinger: [string, (x: number) => h.Utfall][] = [
    ['oppgraderFlere', (x) => h.oppgraderFlere(s, s.bedrifter[0].id, x)],
    ['kjopPapir', (x) => h.kjopPapir(s, MYNT, x)],
    ['selgPapir', (x) => h.selgPapir(s, MYNT, x)],
    ['kjopFond', (x) => h.kjopFond(s, 'KRYPTOFOND', x)],
    ['selgFond', (x) => h.selgFond(s, 'KRYPTOFOND', x)],
    ['settInn', (x) => h.settInn(s, x)],
    ['taUt', (x) => h.taUt(s, x)],
    ['laan', (x) => h.laan(s, x)],
    ['nedbetal', (x) => h.nedbetal(s, x)],
    ['nyOrdre (antall)', (x) => h.nyOrdre(s, MYNT, 'kjop', 100, x)],
    ['nyOrdre (grense)', (x) => h.nyOrdre(s, MYNT, 'kjop', x, 1)],
  ]

  for (const [navn, kjør] of handlinger) {
    it(`${navn} avviser NaN`, () => {
      const før = JSON.stringify(s)
      expect(kjør(NaN).ok).toBe(false)
      // selgFond uten beløp betyr «selg alt» — det er standardverdien, ikke en feil.
      if (navn !== 'selgFond') expect(kjør(undefined as unknown as number).ok).toBe(false)
      // Tilstanden er urørt.
      expect(JSON.stringify(s)).toBe(før)
    })
  }

  it('en ordre kan ikke ha uendelig grense eller antall', () => {
    expect(h.nyOrdre(s, MYNT, 'kjop', Infinity, 1).ok).toBe(false)
    expect(h.nyOrdre(s, MYNT, 'kjop', 100, Infinity).ok).toBe(false)
  })
})

describe('«alt» virker fortsatt', () => {
  it('uendelig betyr alt der det gir mening', () => {
    const s = rikt()
    expect(ok(h.taUt(s, Infinity)).sparing).toBe(0)
    expect(ok(h.nedbetal(s, Infinity)).gjeld).toBe(0)
    expect(ok(h.selgFond(s, 'KRYPTOFOND', Infinity)).fond.KRYPTOFOND).toBeUndefined()
    expect(ok(h.settInn(s, Infinity)).kontanter).toBe(0)
  })

  it('vanlige tall går som før', () => {
    const s = rikt()
    expect(ok(h.oppgraderFlere(s, s.bedrifter[0].id, 3)).bedrifter[0].nivaa).toBe(4)
    expect(ok(h.laan(s, 500)).gjeld).toBe(1500)
  })
})
