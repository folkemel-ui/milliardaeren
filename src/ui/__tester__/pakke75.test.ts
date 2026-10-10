/**
 * Pakke 75 — roligere lister: «Markedet i dag ›» på én linje, én linje for
 * bedriftene som venter på retning, stedet i eiendomstittelen og sortering
 * av eiendomslista. Ingen motor.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import { fase, dagsbilde } from '../../engine/verden'
import { DAG_SEK } from '../../engine/kalender'
import { markedetIDag } from '../markedet'
import { sorterEiendom } from '../sortering'
import { EIENDOMSREKKEFOLGER, eiendomsrekkefolge } from '../deler'

describe('markedet i dag', () => {
  it('teller det som er utenom det vanlige — aldri været alene', () => {
    const s = nyttSpill()
    let sett = 0
    for (let dag = 0; dag < 120; dag++) {
      s.sek = dag * DAG_SEK
      const m = markedetIDag(s)
      const d = dagsbilde(s)
      const ventet = (d.helligdag ? 1 : 0) + (d.trend.het ? 1 : 0) + (d.trend.kald ? 1 : 0) + (fase(s) !== 'normal' ? 1 : 0)
      expect(m.spesielle, `dag ${dag}`).toBe(ventet)
      expect(m.linjer[0].navn).toBe('Været')
      expect(m.linjer[0].spesiell).toBe(false)
      expect(m.linjer.at(-1)!.navn).toBe('Konjunktur')
      expect(m.dato.length).toBeGreaterThan(3)
      if (ventet > 0) sett++
    }
    // Nesten hver dag har noe: en het eller kald bransje de fleste uker, og konjunkturen er sjelden normal.
    expect(sett).toBeGreaterThan(100)
  })
})

describe('eiendomslista', () => {
  it('sorteres etter pris (stigen), avkastning eller leie per enhet, på katalogens tall', () => {
    const ider = EIENDOMSSTIGEN
    expect(sorterEiendom(ider, 'pris')).toEqual([...ider])
    const avk = sorterEiendom(ider, 'avkastning')
    expect(avk.every((id, i) => i === 0 || EIENDOMSTYPER[id].avkastning <= EIENDOMSTYPES_AVK(avk[i - 1]))).toBe(true)
    const leie = sorterEiendom(ider, 'leie')
    const perEnhet = (id: (typeof ider)[number]) => EIENDOMSTYPER[id].pris * EIENDOMSTYPER[id].avkastning
    expect(leie.every((id, i) => i === 0 || perEnhet(id) <= perEnhet(leie[i - 1]))).toBe(true)
    // Lista er den samme, bare i annen rekkefølge.
    expect([...avk].sort()).toEqual([...ider].sort())
    // Hybelen gir best avkastning, så den ligger først der; dyrest ligger sist i prisrekkefølgen.
    expect(avk[0]).toBe('hybel-trondheim')
  })

  it('valget huskes som bedriftenes, og starter på pris', () => {
    expect(EIENDOMSREKKEFOLGER.map((r) => r.id)).toEqual(['pris', 'avkastning', 'leie'])
    expect(eiendomsrekkefolge.les()).toBe('pris')
    eiendomsrekkefolge.sett('leie')
    expect(eiendomsrekkefolge.les()).toBe('leie')
    eiendomsrekkefolge.sett('pris')
  })

  it('hvert sted har et navn å sette i tittelen', () => {
    for (const id of EIENDOMSSTIGEN) expect(EIENDOMSTYPER[id].sted.split(',')[0].trim().length).toBeGreaterThan(1)
  })
})

const EIENDOMSTYPES_AVK = (id: (typeof EIENDOMSSTIGEN)[number]) => EIENDOMSTYPER[id].avkastning
