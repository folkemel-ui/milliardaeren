/**
 * Pakke 76 — den siste strekningen: fire eiendommer for det sene spillet (25 til
 * 500 mrd), et fjerde trinn i hvert rom i hjemmene, og tallene fra telefonen
 * selv (målepanelet bak «?maal»).
 */

import { describe, expect, it } from 'vitest'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, flyFor, leieHverPerSek } from '../eiendom'
import { innred, kjopEiendom } from '../handlinger'
import { HJEMLISTE, ROM, ROMLISTE, hjemstatus } from '../hjemmene'
import { nyttSpill } from '../start'
import { VALUTA_FOR } from '../valuta'
import type { EiendomId, Spilltilstand, Utenlandsby } from '../types'
import { alleMaal } from '../../ui/progresjon'
import { romFraKode, romkode } from '../../ui/romkode'
import { hentMaalinger, maalBorte, maalSekund, nullstillMaalinger, SEKUNDER_HUSKET, sekundtall } from '../../state/maaling'
import { maalerader, tid } from '../../ui/komponenter/Maalepanel'

const NYE: EiendomId[] = ['canary-wharf', 'kjopesenterkjede', 'downtown-dubai', 'manhattan-skyskraper']

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('eiendom for det sene spillet', () => {
  it('fire nye trinn over Manhattan-toppleiligheten: 25, 75, 200 og 500 mrd, med fallende leie', () => {
    expect(NYE.map((id) => EIENDOMSTYPER[id].pris)).toEqual([25e9, 75e9, 200e9, 500e9])
    expect(NYE.map((id) => EIENDOMSTYPER[id].avkastning)).toEqual([0.07, 0.065, 0.06, 0.055])
    // De står sist i stigen, etter New York, og er dyrere enn alt som fantes.
    expect(EIENDOMSSTIGEN.slice(-4)).toEqual(NYE)
    const gamle = EIENDOMSSTIGEN.filter((id) => !NYE.includes(id))
    for (const id of NYE) expect(EIENDOMSTYPER[id].pris).toBeGreaterThan(Math.max(...gamle.map((g) => EIENDOMSTYPER[g].pris)))
    // Alt kan kjøpes før 1 000 mrd-streken.
    expect(Math.max(...NYE.map((id) => EIENDOMSTYPER[id].pris))).toBeLessThan(1e12)
  })

  it('i byer som har valuta, og med flyet du alt trenger dit; kjøpesenterkjeden er i Norge', () => {
    for (const id of NYE) {
      const t = EIENDOMSTYPER[id]
      if (t.reise) expect(VALUTA_FOR[t.by as Utenlandsby], id).toBeDefined()
    }
    expect(flyFor('canary-wharf')).toBe('forretningsjet')
    expect(flyFor('downtown-dubai')).toBe('langdistansejet')
    expect(flyFor('manhattan-skyskraper')).toBe('langdistansejet')
    expect(flyFor('kjopesenterkjede')).toBeNull()
  })

  it('alle fire eid gir rundt 48 mrd i timen ved indeks 1 — omtrent halvparten av bedriftenes avkastning per krone', () => {
    const leie = NYE.reduce((sum, id) => sum + EIENDOMSTYPER[id].pris * EIENDOMSTYPER[id].maksAntall * EIENDOMSTYPER[id].avkastning, 0)
    expect(leie / 1e9).toBeCloseTo(47.875, 2)
  })

  it('skyskraperen på Manhattan kan kjøpes med langdistansejet og nok penger, og gir leie', () => {
    let s = nyttSpill()
    s.kontanter = 2e12
    s.hoyesteFormue = 2e12
    expect(kjopEiendom(s, 'manhattan-skyskraper').ok).toBe(false)
    s.luksus = [...s.luksus, 'propellfly', 'forretningsjet', 'langdistansejet']
    s = ok(kjopEiendom(s, 'manhattan-skyskraper'))
    expect(s.eiendommer['manhattan-skyskraper']).toBe(1)
    expect(leieHverPerSek(s, 'manhattan-skyskraper')).toBeGreaterThan(0)
  })

  it('ikke synlig før formuen har vært 80 % av prisen', () => {
    const s = nyttSpill()
    s.kontanter = 1e12
    s.hoyesteFormue = 0.79 * 75e9
    expect(kjopEiendom(s, 'kjopesenterkjede').ok).toBe(false)
    s.hoyesteFormue = 0.8 * 75e9
    expect(kjopEiendom(s, 'kjopesenterkjede').ok).toBe(true)
  })

  it('skyskraperen er det siste målet i målstripa, etter New York', () => {
    const maal = alleMaal()
    const ny = maal.findIndex((m) => m.tekst === 'New York')
    const sky = maal.findIndex((m) => m.tekst === 'Skyskraper på Manhattan')
    expect(ny).toBeGreaterThanOrEqual(0)
    expect(sky).toBeGreaterThan(ny)
    expect(maal[sky].belop).toBe(500e9)
  })
})

describe('hjem som varer: det fjerde trinnet', () => {
  it('hvert rom har fire trinn; det fjerde koster ti ganger det tredje og gir halvannen gang statusen', () => {
    for (const r of ROMLISTE) {
      const t = ROM[r].trinn
      expect(t, r).toHaveLength(4)
      expect(t[3].pris, r).toBe(t[2].pris * 10)
      expect(t[3].status, r).toBe(Math.round(t[2].status * 1.5))
    }
    // Det fjerde trinnet koster 36,4 mrd i alt, fra 80 mill (kjøkkenet) til 15 mrd (gjestefløyen).
    const fjerde = ROMLISTE.map((r) => ROM[r].trinn[3].pris)
    expect(fjerde.reduce((a, b) => a + b, 0)).toBe(36_400_000_000)
    expect(Math.min(...fjerde)).toBe(80_000_000)
    expect(Math.max(...fjerde)).toBe(15_000_000_000)
  })

  it('et rom med tre trinn fra en gammel lagring kan ta det fjerde, og statusen øker', () => {
    let s = nyttSpill()
    s.kontanter = 1e11
    s.hoyesteFormue = 1e11
    s.hjem = { kjokken: 3 }
    const før = hjemstatus(s)
    s = ok(innred(s, 'kjokken'))
    expect(s.hjem?.kjokken).toBe(4)
    expect(hjemstatus(s) - før).toBe(ROM.kjokken.trinn[3].status)
    expect(innred(s, 'kjokken').ok).toBe(false)
  })

  it('romkoden har plass til fire trinn i hvert av de tre rommene', () => {
    for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) for (let c = 0; c <= 4; c++) expect(romFraKode(romkode(a, b, c))).toEqual([a, b, c])
    expect(HJEMLISTE).toHaveLength(3)
  })
})

describe('tallene fra telefonen', () => {
  it('husker de siste sekundene, og gir snitt og topp per spillsekund', () => {
    nullstillMaalinger()
    expect(sekundtall(hentMaalinger())).toBeNull()
    maalSekund(8, 2)
    maalSekund(3, 1)
    const t = sekundtall(hentMaalinger())!
    expect(t.snitt).toBeCloseTo(3.5)
    expect(t.topp).toBe(4)
    for (let i = 0; i < SEKUNDER_HUSKET + 10; i++) maalSekund(1, 1)
    expect(hentMaalinger().sekunder).toHaveLength(SEKUNDER_HUSKET)
  })

  it('panelet viser tiden borte med spilltiden, og millisekunder under ett sekund', () => {
    nullstillMaalinger()
    maalBorte(612, 7200)
    const rader = Object.fromEntries(maalerader(hentMaalinger()))
    expect(rader['Lengste tid borte']).toMatch(/^612 ms for 2 t/)
    // Et kort fanebytte etterpå skriver ikke over de to timene.
    maalBorte(3, 21)
    expect(hentMaalinger().borte).toEqual({ ms: 612, sek: 7200 })
    expect(rader['Ett sekund i spillet']).toBe('ikke målt ennå')
    expect(tid(3.72)).toBe('3,7 ms')
    expect(tid(1500)).toBe('1,5 s')
  })
})
