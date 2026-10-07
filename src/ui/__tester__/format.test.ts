import { describe, expect, it } from 'vitest'
import { kortKroner } from '../format'

// Intl bruker hardt mellomrom som tusenskille; sammenlign med vanlige mellomrom.
const k = (n: number) => kortKroner(n).replace(/\s/g, ' ')

describe('kortKroner', () => {
  it('viser tre gjeldende sifre uten nuller på slutten', () => {
    expect(k(12_000_000)).toBe('kr 12 mill')
    expect(k(150_000_000)).toBe('kr 150 mill')
    expect(k(1_250_000)).toBe('kr 1,25 mill')
    expect(k(1_500_000)).toBe('kr 1,5 mill')
    expect(k(12_500_000)).toBe('kr 12,5 mill')
    expect(k(2_500_000_000)).toBe('kr 2,5 mrd')
    expect(k(1_000_000_000_000)).toBe('kr 1 bill') // Pakke 47: billioner over tusen milliarder
  })

  it('går over til neste enhet uten å vise «1 000 mill»', () => {
    expect(k(999_600_000)).toBe('kr 1 mrd')
    expect(k(99_960_000)).toBe('kr 100 mill')
  })

  it('viser hele kroner under en million og fortegn på negative beløp', () => {
    expect(k(4_000)).toBe('kr 4 000')
    expect(k(-3_400_000)).toBe('kr −3,4 mill')
  })
})
