/** Pakke 41: logoer, rivalportretter og avisas bilder og seksjoner. */

import { describe, expect, it } from 'vitest'
import { PAPIRER } from '../../engine/marked'
import { START_RIVALER } from '../../engine/rivaler'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { DAG_SEK } from '../../engine/kalender'
import { PAPIRLOGOER } from '../komponenter/Papirlogo'
import { RIVALFARGE, RIVALPORTRETTER } from '../komponenter/Rivalportrett'
import { avisbilde, borslinje, seksjon } from '../avisbilde'
import type { Overskrift } from '../../engine/types'

const sak = (tittel: string, type: Overskrift['type'] = 'deg', tekst = ''): Overskrift => ({ tittel, tekst, type })

describe('logoer og portretter', () => {
  it('hvert papir har en logo, og hver rival et portrett og en farge', () => {
    expect([...PAPIRLOGOER].sort()).toEqual(Object.keys(PAPIRER).sort())
    expect([...RIVALPORTRETTER].sort()).toEqual(START_RIVALER.map((r) => r.id).sort())
    expect(new Set(Object.values(RIVALFARGE)).size).toBe(4)
  })
})

describe('avisas bilder', () => {
  it('kjenner igjen rivalene på navn, selskap og etternavn', () => {
    expect(avisbilde(sak('Harald Grønn går forbi deg', 'marked'))).toEqual({ art: 'rival', id: 'gronn' })
    expect(avisbilde(sak('Du kjøper opp Lunde Invest'))).toEqual({ art: 'rival', id: 'lunde' })
    expect(avisbilde(sak('Fjeld selger restauranten til deg'))).toEqual({ art: 'rival', id: 'fjeld' })
    // Et ord som bare inneholder etternavnet, er ikke rivalen.
    expect(avisbilde(sak('Aasen-tunnelen åpner', 'lokalt'))).toBeNull()
  })

  it('papirer, bedrifter, luksus og landemerker får sin egen tegning', () => {
    expect(avisbilde(sak('Nordfjord Sjømat stiger 4 %', 'marked'))).toEqual({ art: 'papir', id: 'NFS' })
    expect(avisbilde(sak('Du åpner Kiosk'))).toEqual({ art: 'tegning', id: 'kiosk' })
    expect(avisbilde(sak('Spottet: superyacht i sentrum'))).toEqual({ art: 'tegning', id: 'superyacht' })
  })

  it('ellers et tema, børssaker en graf — og lokalsaker gjerne ingenting', () => {
    expect(avisbilde(sak('Skatteoppgjøret er klart'))).toEqual({ art: 'ikon', navn: 'kvittering' })
    expect(avisbilde(sak('Bølgen FK 2–1 Fjordby IL'))).toEqual({ art: 'ikon', navn: 'ball' })
    expect(avisbilde(sak('Kryptofeber', 'marked'))).toEqual({ art: 'ikon', navn: 'mynt' })
    expect(avisbilde(sak('Noe skjer på børsen', 'marked'))).toEqual({ art: 'ikon', navn: 'graf' })
    expect(avisbilde(sak('Bybanen forsinket', 'lokalt'))).toBeNull()
  })
})

describe('seksjonene', () => {
  it('Sport, Børs, Lokalt, Folk, Skatt og Næringsliv', () => {
    expect(seksjon(sak('OPPRYKK: Bølgen FK til 3. divisjon'))).toBe('Sport')
    expect(seksjon(sak('Kryptofeber', 'marked'))).toBe('Børs')
    expect(seksjon(sak('Regnrekord i Bergen', 'lokalt'))).toBe('Lokalt')
    expect(seksjon(sak('Deg på premiere i Operaen'))).toBe('Folk')
    expect(seksjon(sak('Skatteoppgjøret er klart'))).toBe('Skatt')
    expect(seksjon(sak('Ny millionær i byen!'))).toBe('Næringsliv')
  })
})

describe('børslinja', () => {
  it('er tom før to sluttkurser, og viser så de største bevegelsene blant aksjene', () => {
    expect(borslinje(nyttSpill())).toEqual([])
    const s = simuler(nyttSpill(), DAG_SEK * 3)
    const linje = borslinje(s)
    expect(linje.length).toBe(4)
    expect(linje.every((b) => PAPIRER[b.id].klasse === 'aksje')).toBe(true)
    expect(linje.every((b, i) => i === 0 || Math.abs(b.endring) <= Math.abs(linje[i - 1].endring))).toBe(true)
  })
})
