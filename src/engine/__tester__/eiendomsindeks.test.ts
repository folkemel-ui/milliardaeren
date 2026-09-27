import { describe, expect, it } from 'vitest'
import { lagEiendomsindeks } from '../marked'

describe('eiendomsindeksen', () => {
  it('starter på 1 etter oppvarmingen, og historikken ender der den starter', () => {
    for (const frø of [1, 777, 20260927, 414673]) {
      const { indeks } = lagEiendomsindeks(frø)
      expect(indeks.kurs).toBe(1)
      expect(indeks.fundament * Math.exp(indeks.avvik)).toBeCloseTo(1, 10)
      // Siste historikkpunkt er tatt ved siste oppvarmingstikk — altså nå.
      expect(indeks.historikk[indeks.historikk.length - 1]).toBeCloseTo(1, 10)
    }
  })
})
