import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { DAG_SEK } from '../../engine/kalender'
import { leggTilHendelse } from '../../engine/bank'
import { kjopBedrift, kjopEiendom, kjopLuksus, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { FEIRES, nytt, stoersteFeiring, type Nytt } from '../hendelsesstrom'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

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

  it('feirer milepælene i tre størrelser, og bare den største når flere kommer samtidig', () => {
    expect(FEIRES['fem-sifre'].niva).toBe('liten')
    expect(FEIRES.millionaer.niva).toBe('stor')
    expect(FEIRES.milliardaer.niva).toBe('milliard')
    const p = (id: string): Nytt => ({ type: 'prestasjon', id, navn: id, emoji: '' })
    expect(stoersteFeiring([p('fem-sifre'), p('millionaer'), p('ti-mill')])?.tekst).toBe('MILLIONÆR!')
    expect(stoersteFeiring([p('forste-steg')])).toBeNull()
  })

  it('melder første bedrift, første eiendom av en type og nye luksusting som kjøp', () => {
    const før = nyttSpill()
    før.kontanter = 1e9
    før.hoyesteFormue = 1e9
    const medPolsebod = ok(kjopBedrift(før, 'polsebod'))
    expect(nytt(før, medPolsebod).filter((f) => f.type === 'kjop')).toEqual([{ type: 'kjop', art: 'bedrift', id: 'polsebod', navn: 'Pølsebod' }])

    const medHybel = ok(kjopEiendom(før, 'hybel'))
    expect(nytt(før, medHybel).find((f) => f.type === 'kjop')).toMatchObject({ art: 'eiendom', id: 'hybel' })
    // Hybel nummer to er ikke noe nytt.
    const toHybler = ok(kjopEiendom(medHybel, 'hybel'))
    expect(nytt(medHybel, toHybler).some((f) => f.type === 'kjop')).toBe(false)

    const medBil = ok(kjopLuksus(før, 'stasjonsvogn'))
    expect(nytt(før, medBil).find((f) => f.type === 'kjop')).toMatchObject({ art: 'luksus', id: 'stasjonsvogn', navn: 'Brukt stasjonsvogn' })
  })
})
