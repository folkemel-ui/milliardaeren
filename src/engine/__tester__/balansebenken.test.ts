/**
 * Balansebenken: hvor lang tid tar det boten å nå hver milepæl i formue?
 * Asserter bare grove grenser — tallene skrives ut for å stille balansen:
 *
 *     $env:BENK=1; npx vitest run balansebenken
 *
 * Benken spiller med den smarte boten, som kjøper seg helt opp til neste
 * dobling når den har råd — slik en spiller gjør (Pakke 47).
 *
 * Til vanlig stopper benken ved milliarden, så `npm test` går fort. Med BENK
 * spiller boten videre helt til billionen (eller til taket på en uke spilletid)
 * og skriver ut tiden til hver milepæl og hva den eide da.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { nettoformue } from '../formler'
import { varighet } from '../../ui/format'
import { botSpill } from './bot'
import type { Spilltilstand } from '../types'

const LANG = Boolean(process.env.BENK)
const MAAL = [10_000, 100_000, 1e6, 1e7, 1e8, 1e9, ...(LANG ? [1e10, 1e11, 1e12] : [])]
const MAKS_SEK = (LANG ? 7 : 3) * 24 * 60 * 60

const bedrifter = (s: Spilltilstand) => s.bedrifter.map((b) => `${b.type}:${b.nivaa}/${b.ansatte}${b.fusjoner ? `+${b.fusjoner}f` : ''}`).join(' ')

describe('balansebenken', () => {
  it('boten når milliarden, men ikke altfor fort', { timeout: LANG ? 3_600_000 : 120_000 }, async () => {
    const naadd: Record<number, number> = {}
    const eide: Record<number, string> = {}
    const siste = MAAL[MAAL.length - 1]
    let s = nyttSpill()
    // Én spilltime om gangen, med en pause imellom: et langt kall uten pause
    // får testkjøreren til å gi opp å vente på svar (og avslutte med feil selv
    // om testen består). Boten trekker hvert 10. sekund, og timene deler seg
    // likt, så spillet blir nøyaktig det samme. Ferdig når siste mål er nådd.
    while (s.sek < MAKS_SEK && naadd[siste] === undefined) {
      s = botSpill(s, 3600, 10, (x) => {
        const f = nettoformue(x)
        for (const m of MAAL) {
          if (naadd[m] !== undefined || f < m) continue
          naadd[m] = x.sek
          if (LANG) eide[m] = bedrifter(x)
        }
      }, true)
      await new Promise((r) => setTimeout(r, 0))
    }

    if (LANG) {
      console.table(
        MAAL.map((m, i) => ({
          formue: m.toLocaleString('nb-NO'),
          tid: naadd[m] ? varighet(naadd[m]) : '—',
          'siden forrige': naadd[m] && i > 0 && naadd[MAAL[i - 1]] ? varighet(naadd[m] - naadd[MAAL[i - 1]]) : '',
        })),
      )
      for (const m of MAAL.slice(5)) if (eide[m]) console.log(`${m.toLocaleString('nb-NO')}: ${eide[m]}`)
      console.log(`slutt (${varighet(s.sek)}): ${bedrifter(s)}`)
    }

    // Første million skal ta minst en halvtime aktiv spilling, og milliarden skal kunne nås.
    expect(naadd[1e6]).toBeGreaterThan(30 * 60)
    expect(naadd[1e9]).toBeDefined()
  })
})
