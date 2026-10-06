import { describe, expect, it } from 'vitest'
import { formuetrinn } from '../komponenter/Toppfelt'
import { byerMedInnhold, iByen } from '../komponenter/Byvisning'
import { settProfildel, PROFILDELER } from '../profilfane'
import { nyttSpill } from '../../engine/start'

describe('formuetrinn', () => {
  it('skifter ved en million, en milliard og tusen milliarder', () => {
    expect(formuetrinn(999_999)).toBe(0)
    expect(formuetrinn(1e6)).toBe(1)
    expect(formuetrinn(1e9)).toBe(2)
    expect(formuetrinn(1e12)).toBe(3)
  })
})

describe('byvisningen', () => {
  it('en ny spiller har ingen byer å vise', () => {
    expect(byerMedInnhold(nyttSpill(), ['Oslo', 'Bergen', 'Trondheim'])).toEqual([])
  })

  it('en by med noe til salgs eller eid vises, med byggene, jorda og landemerkene der', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 5e9
    expect(byerMedInnhold(s, ['Oslo', 'Hedmarken', 'New York'])).toEqual(['Oslo', 'Hedmarken'])
    const oslo = iByen(s, 'Oslo')
    // Hybelen på Blindern kom i Pakke 44.
    expect(oslo.bygg).toEqual(['hybel-oslo', 'leilighet', 'kontorbygg', 'naeringsbygg'])
    expect(oslo.merker).toEqual(['hoppbakken', 'tarnet'])
    expect(iByen(s, 'Hedmarken').jord).toEqual(['gard-hedmarken'])
  })

  it('noe du eier, vises selv om det ikke er til salgs for deg lenger', () => {
    const s = nyttSpill()
    s.eiendommer = { kjopesenter: 1 }
    expect(iByen(s, 'Trondheim').bygg).toEqual(['kjopesenter'])
  })
})

describe('profildelene', () => {
  it('er Meg, Regnskap, Statistikk (Pakke 39) og Innstillinger, og kan settes utenfra uten lagring', () => {
    expect(PROFILDELER.map((d) => d.id)).toEqual(['meg', 'regnskap', 'statistikk', 'innstillinger'])
    expect(() => settProfildel('regnskap')).not.toThrow()
  })
})
