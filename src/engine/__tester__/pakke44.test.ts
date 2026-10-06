/** Pakke 44: byggene i flere byer, en region for hver norske by, og bonus for å eie hele byen. */

import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { BYEIER_BONUS, byggI, EIENDOMSSTIGEN, EIENDOMSTYPER, eierHeleByen, enheterI, leieHverPerSek, leiePerSek } from '../eiendom'
import { byfaktor, REGIONLISTE, regionFor } from '../regioner'
import { simuler } from '../simulering'
import { DAG_SEK } from '../kalender'
import { migrer } from '../../state/migrering'
import type { By, EiendomId, NorskBy, Spilltilstand } from '../types'

const NORSKE: NorskBy[] = ['Bergen', 'Oslo', 'Stavanger', 'Geilo', 'Trondheim', 'Lofoten', 'Hedmarken', 'Lista', 'Trysil', 'Namdalen']

/** Alle enhetene av hvert bygg i en by. */
function fyllByen(s: Spilltilstand, by: By): Spilltilstand {
  const eiendommer = { ...s.eiendommer }
  for (const id of byggI(by)) eiendommer[id] = EIENDOMSTYPER[id].maksAntall
  return { ...s, eiendommer }
}

describe('byggene i flere byer', () => {
  it('fem bygg finnes i mer enn én by, med samme avkastning men byens egen pris', () => {
    const etterNavn = new Map<string, EiendomId[]>()
    for (const id of EIENDOMSSTIGEN.filter((x) => !EIENDOMSTYPER[x].reise)) {
      const t = EIENDOMSTYPER[id]
      // Rorbua er en hytte i Lofoten.
      const navn = t.navn === 'Rorbu' ? 'Hytte' : t.navn
      etterNavn.set(navn, [...(etterNavn.get(navn) ?? []), id])
    }
    const spredte = [...etterNavn].filter(([, ider]) => ider.length > 1)
    expect(spredte.map(([n]) => n).sort()).toEqual(['Hybel', 'Hytte', 'Kontorbygg', 'Leilighet', 'Rekkehus'])
    for (const [, ider] of spredte) {
      const byer = ider.map((id) => EIENDOMSTYPER[id].by)
      expect(new Set(byer).size).toBe(ider.length)
      expect(new Set(ider.map((id) => EIENDOMSTYPER[id].avkastning)).size).toBe(1)
      expect(new Set(ider.map((id) => EIENDOMSTYPER[id].pris)).size).toBe(ider.length)
    }
  })

  it('Oslo er dyrere enn Bergen, og Trondheim billigere', () => {
    expect(EIENDOMSTYPER['hybel-oslo'].pris).toBeGreaterThan(EIENDOMSTYPER.hybel.pris)
    expect(EIENDOMSTYPER['hybel-trondheim'].pris).toBeLessThan(EIENDOMSTYPER.hybel.pris)
    expect(EIENDOMSTYPER.leilighet.pris).toBeGreaterThan(EIENDOMSTYPER['leilighet-bergen'].pris)
  })

  it('lista står i stigende pris, så de dukker opp etter hvert som formuen vokser', () => {
    const priser = EIENDOMSSTIGEN.map((id) => EIENDOMSTYPER[id].pris)
    expect(priser.every((p, i) => i === 0 || p >= priser[i - 1])).toBe(true)
  })
})

describe('regionene', () => {
  it('hver norske by har en region; utlandet følger landet', () => {
    for (const by of NORSKE) expect(regionFor(by)).not.toBeNull()
    expect(regionFor('Trondheim')).toBe('trondelag')
    expect(regionFor('Lofoten')).toBe('nord')
    expect(regionFor('London')).toBeNull()
    expect(REGIONLISTE).toHaveLength(6)
  })

  it('de nye regionene går sin egen vei', () => {
    const s = simuler(nyttSpill(), 2 * DAG_SEK)
    expect(byfaktor(s, 'Trondheim')).not.toBe(1)
    expect(byfaktor(s, 'Lofoten')).not.toBe(byfaktor(s, 'Trondheim'))
  })
})

describe('migrering 19 → 20', () => {
  it('gir Trøndelag og Nord historikk og avvik null — prisene står der de sto', () => {
    const s = simuler(nyttSpill(), DAG_SEK)
    const gammel = structuredClone(s) as unknown as Record<string, unknown>
    gammel.versjon = 19
    const regioner = (gammel.marked as { regioner: { indekser: Record<string, unknown> } }).regioner
    delete regioner.indekser.trondelag
    delete regioner.indekser.nord
    const r = migrer(gammel)
    if (!r.ok) throw new Error(r.feil)
    expect(r.tilstand.versjon).toBe(SPILLVERSJON)
    const lengde = s.marked.eiendom.historikk.length
    for (const id of ['trondelag', 'nord'] as const) {
      const i = r.tilstand.marked.regioner.indekser[id]
      expect(i.avvik).toBe(0)
      expect(i.historikk).toHaveLength(lengde)
    }
    expect(byfaktor(r.tilstand, 'Trondheim')).toBe(1)
    // De gamle regionene er urørt.
    expect(r.tilstand.marked.regioner.indekser.oslo).toEqual(s.marked.regioner.indekser.oslo)
    // Og spillet går videre derfra.
    expect(() => simuler(r.tilstand, 60)).not.toThrow()
  })
})

describe('å eie hele byen', () => {
  it('krever alle enhetene av hvert bygg i byen', () => {
    const s = nyttSpill()
    expect(eierHeleByen(s, 'Bergen')).toBe(false)
    const nesten = fyllByen(s, 'Bergen')
    nesten.eiendommer.hybel = EIENDOMSTYPER.hybel.maksAntall - 1
    expect(eierHeleByen(nesten, 'Bergen')).toBe(false)
    const full = fyllByen(s, 'Bergen')
    expect(eierHeleByen(full, 'Bergen')).toBe(true)
    expect(enheterI(full, 'Bergen').eid).toBe(enheterI(full, 'Bergen').av)
    // En by med bare jord kan ikke eies slik.
    expect(eierHeleByen(s, 'Hedmarken')).toBe(false)
  })

  it('gir +10 % leie i den byen, og bare der', () => {
    const s = fyllByen(nyttSpill(), 'Trondheim')
    s.eiendommer.hybel = 1
    const uten = { ...s, eiendommer: { ...s.eiendommer, 'hybel-trondheim': 7 } }
    expect(BYEIER_BONUS).toBe(0.1)
    expect(leieHverPerSek(s, 'hybel-trondheim')).toBeCloseTo(leieHverPerSek(uten, 'hybel-trondheim') * 1.1)
    expect(leieHverPerSek(s, 'hybel')).toBeCloseTo(leieHverPerSek(uten, 'hybel'))
    expect(leiePerSek(s)).toBeGreaterThan(leiePerSek(uten))
  })
})
