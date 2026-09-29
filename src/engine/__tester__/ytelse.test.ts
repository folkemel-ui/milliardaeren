/**
 * Ytelse: tiden du var borte (opptil to timer) regnes ut når appen åpnes.
 * Det må gå fort nok til at ingen merker det — også på en treg telefon.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { BORTE_TAK_SEK } from '../innhold'

describe('ytelse', () => {
  it('to timer borte simuleres på under et halvt sekund', () => {
    const s = nyttSpill()
    simuler(s, 600, true) // oppvarming av JIT
    // Beste av tre: testene kjører i parallell, og en travel maskin skal ikke gi rødt.
    let ms = Infinity
    for (let i = 0; i < 3 && ms >= 500; i++) {
      const start = performance.now()
      simuler(s, BORTE_TAK_SEK, true)
      ms = Math.min(ms, performance.now() - start)
    }
    if (process.env.BENK) console.log(`${BORTE_TAK_SEK} s borte: ${ms.toFixed(0)} ms`)
    expect(ms).toBeLessThan(500)
  })
})
