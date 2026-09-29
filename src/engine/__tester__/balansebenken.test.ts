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
  it('boten når milliarden, men ikke altfor fort', { timeout: 120_000 }, async () => {
    const naadd: Record<number, number> = {}
    let s = nyttSpill()
    // Én spilltime om gangen, med en pause imellom: et langt kall uten pause
    // får testkjøreren til å gi opp å vente på svar (og avslutte med feil selv
    // om testen består). Boten trekker hvert 10. sekund, og timene deler seg
    // likt, så spillet blir nøyaktig det samme. Ferdig når milliarden er nådd.
    while (s.sek < MAKS_SEK && naadd[1e9] === undefined) {
      s = botSpill(s, 3600, 10, (x) => {
        const f = nettoformue(x)
        for (const m of MAAL) if (naadd[m] === undefined && f >= m) naadd[m] = x.sek
      })
      await new Promise((r) => setTimeout(r, 0))
    }
    const sluttBedrifter = s.bedrifter

    if (process.env.BENK) {
      console.table(MAAL.map((m) => ({ formue: m.toLocaleString('nb-NO'), tid: naadd[m] ? varighet(naadd[m]) : '—' })))
      console.log(sluttBedrifter.map((b) => `${b.type}:${b.nivaa}/${b.ansatte}${b.fusjoner ? `+${b.fusjoner}f` : ''}`).join(' '))
    }

    // Første million skal ta minst en halvtime aktiv spilling, og milliarden skal kunne nås.
    expect(naadd[1e6]).toBeGreaterThan(30 * 60)
    expect(naadd[1e9]).toBeDefined()
  })
})
