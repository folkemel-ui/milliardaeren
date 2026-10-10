/**
 * Pakke 64 — Tid med budsjett: målingen av sekundet endrer ingenting i spillet,
 * hurtigminnet for ledigheten gir de samme tallene, og ingen tung tegning får nye
 * props hvert sekund (det tegnet Selskaper på nytt for 161 ms hvert sekund).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { maalDeler, simuler, type Delmaaler } from '../simulering'
import { nyttSpill } from '../start'
import { ledighet, LEDIGHET_MAKS } from '../utleie'
import { Hashkilde, hashTekst } from '../rng'
import { spilluke } from '../verden'
import { dagnummer, DAG_SEK } from '../kalender'
import type { By } from '../types'
import { BUDSJETT } from './budsjett'

describe('målingen av sekundet', () => {
  it('gir nøyaktig samme spill med og uten måler', () => {
    const uten = simuler(nyttSpill(77), 2_000)
    const m: Delmaaler = {}
    maalDeler(m)
    let med
    try {
      med = simuler(nyttSpill(77), 2_000)
    } finally {
      maalDeler(null)
    }
    expect(med).toEqual(uten)
    // Og den målte noe i hver del som har et budsjett.
    expect(Object.keys(m).sort()).toEqual(Object.keys(BUDSJETT).sort())
  })
})

describe('ledigheten', () => {
  const fasit = (by: By, uke: number) => new Hashkilde(hashTekst(`ledighet:${by}|${uke}`)).neste() * LEDIGHET_MAKS
  it('er den samme som regnestykket, også når ukene veksler', () => {
    const s = nyttSpill()
    const byer: By[] = ['Oslo', 'Bergen', 'Marbella']
    // Fram og tilbake mellom uker, så hurtigminnet må tømmes og fylles igjen.
    for (const dag of [0, 7, 0, 21, 22, 7, 70]) {
      s.sek = dag * DAG_SEK + 5
      for (const by of byer) expect(ledighet(s, by)).toBe(fasit(by, spilluke(dagnummer(s.sek))))
    }
  })
})

describe('tegningene tegnes ikke på nytt hvert sekund', () => {
  /** Komponentene som er memo: en ny tabell eller et nytt objekt som prop hvert sekund slår memo av. */
  const MEMO = ['Illustrasjon', 'BedriftIkon', 'Scene', 'Rivalportrett', 'Papirlogo', 'Klubbvaapen', 'Stadion', 'Maleribilde']
  const filer = (mappe: string): string[] =>
    readdirSync(mappe).flatMap((f) => {
      const sti = join(mappe, f)
      if (statSync(sti).isDirectory()) return f === '__tester__' ? [] : filer(sti)
      return f.endsWith('.tsx') ? [sti] : []
    })

  it('ingen memo-tegning får en tabell eller et objekt skrevet rett i propen', () => {
    const feil: string[] = []
    for (const fil of filer(join(__dirname, '..', '..', 'ui'))) {
      const tekst = readFileSync(fil, 'utf8')
      for (const m of tekst.matchAll(new RegExp(`<(${MEMO.join('|')})\\b[^>]*?\\w+=\\{\\s*[\\[{]`, 'g'))) feil.push(`${fil.split(/[\\/]/).pop()}: ${m[0].slice(0, 80)}`)
    }
    expect(feil).toEqual([])
  })
})
