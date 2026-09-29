import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { DAG_SEK } from '../../engine/kalender'
import { leggTilHendelse } from '../../engine/bank'
import { FEIRES, nytt } from '../hendelsesstrom'

describe('hendelsesstrømmen', () => {
  it('finner ingenting når ingenting har skjedd', () => {
    const s = nyttSpill()
    expect(nytt(s, s)).toEqual([])
    expect(nytt(s, structuredClone(s))).toEqual([])
  })

  it('finner nye hendelser, men ikke dem som alt fantes', () => {
    const før = nyttSpill()
    leggTilHendelse(før, { tittel: 'Gammel', tekst: 'x', alvor: 'info' })
    const etter = structuredClone(før)
    etter.sek += 10
    leggTilHendelse(etter, { tittel: 'Hogst', tekst: 'Skogen er hogd.', alvor: 'info' })
    const funn = nytt(før, etter)
    expect(funn).toHaveLength(1)
    expect(funn[0]).toMatchObject({ type: 'hendelse', hendelse: { tittel: 'Hogst' } })
  })

  it('finner nye prestasjoner, med navn og emoji', () => {
    const før = nyttSpill()
    const etter = structuredClone(før)
    etter.prestasjoner.millionaer = etter.sek
    const funn = nytt(før, etter)
    expect(funn).toEqual([{ type: 'prestasjon', id: 'millionaer', navn: 'Millionær', emoji: '🥂' }])
    expect(FEIRES.millionaer).toBeDefined()
    expect(FEIRES.milliardaer).toBeDefined()
  })

  it('melder en ny avisutgave ved dagsskiftet', () => {
    const før = nyttSpill()
    const etter = simuler(før, DAG_SEK)
    expect(nytt(før, etter).some((f) => f.type === 'avis')).toBe(true)
    // Neste sekund er utgaven ikke ny lenger.
    expect(nytt(etter, simuler(etter, 1)).some((f) => f.type === 'avis')).toBe(false)
  })

  it('tåler at hendelseslista er kappet: de eldste forsvinner, bare de nye meldes', () => {
    const før = nyttSpill()
    for (let i = 0; i < 30; i++) leggTilHendelse(før, { tittel: `H${i}`, tekst: '', alvor: 'info' })
    const etter = structuredClone(før)
    etter.sek += 1
    leggTilHendelse(etter, { tittel: 'Ny', tekst: '', alvor: 'info' })
    const funn = nytt(før, etter)
    expect(funn.map((f) => (f.type === 'hendelse' ? f.hendelse.tittel : f.type))).toEqual(['Ny'])
  })
})
