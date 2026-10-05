/**
 * Ytelse: tiden du var borte (opptil to timer) regnes ut når appen åpnes.
 * Det må gå fort nok til at ingen merker det — også på en treg telefon.
 *
 * Testen måler CPU-tiden prosessen selv bruker, ikke klokketid. Vitest kjører
 * hver testfil i sin egen prosess, så de andre filene som kjører samtidig,
 * stjeler ikke tid fra målingen. Med klokketid feilet testen ofte i hele
 * suiten (rundt 600 ms) selv om den brukte under 400 ms alene.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { BORTE_TAK_SEK } from '../innhold'

/** CPU-tid (bruker + system) i millisekunder for det `arbeid` gjør i denne prosessen. */
function cpuMs(arbeid: () => void): number {
  const før = process.cpuUsage()
  arbeid()
  const brukt = process.cpuUsage(før)
  return (brukt.user + brukt.system) / 1000
}

describe('ytelse', () => {
  it('to timer borte simuleres på under et halvt sekund', () => {
    const s = nyttSpill()
    simuler(s, 600, true) // oppvarming av JIT
    // Beste av tre: også CPU-tiden blir litt høyere når maskinen er travel (delte hurtigminner).
    let ms = Infinity
    for (let i = 0; i < 3 && ms >= 500; i++) ms = Math.min(ms, cpuMs(() => simuler(s, BORTE_TAK_SEK, true)))
    if (process.env.BENK) console.log(`${BORTE_TAK_SEK} s borte: ${ms.toFixed(0)} ms CPU`)
    expect(ms).toBeLessThan(500)
  })
})
