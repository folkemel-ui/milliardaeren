import { describe, expect, it } from 'vitest'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { BEDRIFTSTYPER } from '../../engine/innhold'
import { JORD } from '../../engine/jord'
import { LANDEMERKER } from '../../engine/landemerker'
import { BEDRIFTSTEGNINGER, ILLUSTRASJONSIDER, trinnFor } from '../komponenter/Illustrasjoner'

describe('illustrasjonene', () => {
  it('har en tegning for alt som kan kjøpes', () => {
    const alle = [BEDRIFTSTYPER, EIENDOMSTYPER, LUKSUS, JORD, LANDEMERKER].flatMap((k) => Object.keys(k))
    expect(alle.filter((id) => !ILLUSTRASJONSIDER.includes(id))).toEqual([])
  })

  it('lar alle bedriftene vokse', () => {
    expect([...BEDRIFTSTEGNINGER].sort()).toEqual(Object.keys(BEDRIFTSTYPER).sort())
  })

  it('vokser ved nivå 25, 50 og 100', () => {
    expect([undefined, 1, 24, 25, 49, 50, 99, 100, 250].map(trinnFor)).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3])
  })
})
