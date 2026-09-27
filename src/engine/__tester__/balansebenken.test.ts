/**
 * Balansebenken: hvor lang tid tar det boten å nå hver milepæl i formue?
 * Asserter bare grove grenser — tallene skrives ut for å stille balansen:
 *
 *     $env:BENK=1; npx vitest run balansebenken
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { nettoformue } from '../formler'
import { varighet } from '../../ui/format'
import { botSpill } from './bot'

const MAAL = [10_000, 100_000, 1e6, 1e7, 1e8, 1e9]
const MAKS_SEK = 3 * 24 * 60 * 60

describe('balansebenken', () => {
  it('boten når milliarden, men ikke altfor fort', { timeout: 120_000 }, () => {
    const naadd: Record<number, number> = {}
    const sluttBedrifter = botSpill(nyttSpill(), MAKS_SEK, 10, (s) => {
      const f = nettoformue(s)
      for (const m of MAAL) if (naadd[m] === undefined && f >= m) naadd[m] = s.sek
    }).bedrifter

    if (process.env.BENK) {
      console.table(MAAL.map((m) => ({ formue: m.toLocaleString('nb-NO'), tid: naadd[m] ? varighet(naadd[m]) : '—' })))
      console.log(sluttBedrifter.map((b) => `${b.type}:${b.nivaa}/${b.ansatte}`).join(' '))
    }

    // Første million skal ta minst en halvtime aktiv spilling, og milliarden skal kunne nås.
    expect(naadd[1e6]).toBeGreaterThan(30 * 60)
    expect(naadd[1e9]).toBeDefined()
  })
})
