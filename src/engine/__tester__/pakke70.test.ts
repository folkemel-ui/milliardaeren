/**
 * Pakke 70 — en lengre klatring: milepæler etter nivå 100, status i benken,
 * mål etter siste opplåsing og skjulte prestasjoner.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { BEDRIFTSTYPER, MILEPAELER, MILEPAELFAKTORER, STIGEN } from '../innhold'
import { milepaelboost, milepaelfaktor, nesteMilepael } from '../formler'
import { LANDEMERKELISTE, LANDEMERKER } from '../landemerker'
import { EIENDOMSTYPER, LUKSUS, LUKSUSLISTE, statusnivaa } from '../eiendom'
import { KONTRAER_ANDEL, PRESTASJONER, sjekkPrestasjoner, synligePrestasjoner } from '../prestasjoner'
import { DAG_SEK } from '../kalender'
import { kjopBedrift, kjopPapir, laan, nedbetal, oppgraderFlere, selgLuksus } from '../handlinger'
import { alleMaal, nesteMaal } from '../../ui/progresjon'
import { FORKLARINGER } from '../../ui/forklaringer'
import { botTrekk } from './bot'
import { fulltSpill } from './hjelp'
import type { Spilltilstand } from '../types'

const klart = (s: Spilltilstand, id: string) => {
  const t = structuredClone(s)
  sjekkPrestasjoner(t)
  return t.prestasjoner[id] !== undefined
}

describe('milepæler etter nivå 100', () => {
  it('150, 200 og 250 ganger inntekten med 1,5 — de tre første dobler som før', () => {
    expect(MILEPAELER).toEqual([25, 50, 100, 150, 200, 250])
    expect(MILEPAELFAKTORER).toHaveLength(MILEPAELER.length)
    expect([100, 149, 150, 199, 200, 250, 1000].map(milepaelfaktor)).toEqual([8, 8, 12, 12, 18, 27, 27])
    expect([25, 100, 150, 250].map(milepaelboost)).toEqual([2, 2, 1.5, 1.5])
    expect(milepaelboost(112)).toBe(1)
  })

  it('under 150 er faktoren bit for bit 2 ** n, så gullmesteren står', () => {
    for (let nivaa = 1; nivaa < 150; nivaa++) expect(milepaelfaktor(nivaa)).toBe(2 ** [25, 50, 100].filter((m) => nivaa >= m).length)
  })

  it('neste milepæl går videre etter 100 og tar slutt etter 250', () => {
    expect([100, 112, 150, 249, 250].map(nesteMilepael)).toEqual([150, 150, 200, 250, null])
  })

  it('forklaringen nevner begge settene', () => {
    expect(FORKLARINGER.bedrifter.tekst).toContain('25, 50 og 100 dobles den')
    expect(FORKLARINGER.bedrifter.tekst).toContain('150, 200 og 250 ganges den med 1,5')
  })
})

describe('tempoet etter milliarden', () => {
  it('første oppgradering fra hotellet og opp koster mer — det som holder ~15 t per tidobling', () => {
    // Målt på benken: 1 mrd 5 t 07, så 6 t 20, 10 t 46 og 14 t 01 per tidobling (uten: 6 t 09, 10 t 10, 12 t 30).
    const andel = (id: keyof typeof BEDRIFTSTYPER) => BEDRIFTSTYPER[id].oppgraderingspris / BEDRIFTSTYPER[id].pris
    expect(andel('hotell')).toBeCloseTo(0.5)
    expect(andel('bank')).toBeCloseTo(0.5)
    expect(andel('oljeselskap')).toBeCloseTo(0.275)
    expect(andel('rederi')).toBeCloseTo(0.4)
    expect(andel('fiskeoppdrett')).toBeCloseTo(0.4)
    expect(andel('flyselskap')).toBeCloseTo(0.4)
    expect(andel('skisenter')).toBeCloseTo(0.4)
  })
})

describe('status i benken', () => {
  /** Tretten bedrifter på nivå 120, uten luksus: inntekten er stor, så status lønner seg. */
  function rikt(): Spilltilstand {
    let s = nyttSpill()
    s.kontanter = 1e13
    s.hoyesteFormue = 1e13
    for (const type of STIGEN) {
      const u = kjopBedrift(s, type)
      if (u.ok) s = u.tilstand
    }
    for (const b of s.bedrifter) {
      const u = oppgraderFlere(s, b.id, 119)
      if (u.ok) s = u.tilstand
    }
    s.kontanter = 3_000_000
    return s
  }

  it('den smarte boten kjøper status når det lønner seg', () => {
    const s = rikt()
    expect(statusnivaa(s)).toBe(0)
    const t = botTrekk(s, true)
    expect(statusnivaa(t)).toBeGreaterThanOrEqual(1)
    expect(t.luksus.length).toBeGreaterThan(0)
  })

  it('den enkle boten (gullmesteren) rører ikke status', () => {
    const t = botTrekk(rikt(), false)
    expect(t.luksus).toEqual([])
    expect(statusnivaa(t)).toBe(0)
  })
})

describe('mål etter siste opplåsing', () => {
  const med = (formue: number) => ({ ...nyttSpill(), hoyesteFormue: formue })

  it('landemerkene, langdistansejeten og New York er mål', () => {
    const maal = alleMaal()
    for (const id of LANDEMERKELISTE) expect(maal.some((m) => m.tekst === LANDEMERKER[id].navn && m.belop === LANDEMERKER[id].pris && m.fane === 'eiendom')).toBe(true)
    expect(maal.some((m) => m.tekst === LUKSUS.langdistansejet.navn && m.belop === LUKSUS.langdistansejet.pris && m.fane === 'luksus')).toBe(true)
    expect(maal.some((m) => m.tekst === 'New York' && m.belop === EIENDOMSTYPER.newyork.pris)).toBe(true)
    expect(maal.every((m, i) => i === 0 || m.belop >= maal[i - 1].belop)).toBe(true)
  })

  it('etter billionen står prestasjonene igjen, og stripa forsvinner først når alle er nådd', () => {
    const s = med(1e12)
    const n = nesteMaal(s)!
    expect(n.maal[0].art).toBe('prestasjon')
    expect(n.maal[0].fane).toBe('profil')
    expect(n.maal[0].tekst).toBe(`${PRESTASJONER.length} prestasjoner igjen`)
    expect(n.visning).toBe(`0 / ${PRESTASJONER.length}`)
    expect(n.andel).toBe(0)
    for (const p of PRESTASJONER) s.prestasjoner[p.id] = 1
    expect(nesteMaal(s)).toBeNull()
    s.prestasjoner = { ...s.prestasjoner }
    delete s.prestasjoner.kontraer
    expect(nesteMaal(s)!.maal[0].tekst).toBe('Én prestasjon igjen')
  })
})

describe('skjulte prestasjoner', () => {
  it('er fem, og vises først når de er nådd', () => {
    const skjulte = PRESTASJONER.filter((p) => p.skjult)
    expect(skjulte.map((p) => p.id)).toEqual(['gjeldfri', 'kontraer', 'hele-stigen', 'helt-aar', 'samleren'])
    const s = nyttSpill()
    expect(synligePrestasjoner(s)).toHaveLength(PRESTASJONER.length - 5)
    s.prestasjoner.gjeldfri = 1
    expect(synligePrestasjoner(s).map((p) => p.id)).toContain('gjeldfri')
    expect(synligePrestasjoner(s).map((p) => p.id)).not.toContain('kontraer')
  })

  it('Gjeldfri: etter at et lån er betalt helt tilbake', () => {
    let s = nyttSpill()
    s.kontanter = 1_000_000
    expect(klart(s, 'gjeldfri')).toBe(false)
    const l = laan(s, 100)
    expect(l.ok).toBe(true)
    if (l.ok) s = l.tilstand
    expect(klart(s, 'gjeldfri')).toBe(false)
    const n = nedbetal(s, s.gjeld)
    if (n.ok) s = n.tilstand
    expect(s.gjeld).toBe(0)
    expect(klart(s, 'gjeldfri')).toBe(true)
  })

  it('Kontrær: et kjøp minst 20 % under toppen de siste to timene', () => {
    const s = nyttSpill()
    s.kontanter = 1e6
    const k = s.marked.kurser.NFS
    // 10 % under toppen er ikke nok …
    k.historikk = [k.kurs * 1.1, k.kurs]
    const topp = kjopPapir(s, 'NFS', 10)
    expect(topp.ok && topp.tilstand.kontraerKjop).toBeUndefined()
    // … 20 % er.
    k.historikk = [k.kurs, k.kurs / KONTRAER_ANDEL + 1]
    const bunn = kjopPapir(s, 'NFS', 10)
    expect(bunn.ok && bunn.tilstand.kontraerKjop).toBe(s.sek)
    if (bunn.ok) expect(klart(bunn.tilstand, 'kontraer')).toBe(true)
  })

  it('Hele stigen og Samleren: alle tretten bedriftene, alt i samlingen', () => {
    const s = fulltSpill()
    expect(s.bedrifter).toHaveLength(STIGEN.length)
    expect(s.luksus).toHaveLength(LUKSUSLISTE.length)
    expect(klart(s, 'hele-stigen')).toBe(true)
    expect(klart(s, 'samleren')).toBe(true)
    const u = selgLuksus(s, s.luksus[0])
    if (u.ok) expect(klart(u.tilstand, 'samleren')).toBe(false)
    expect(klart(nyttSpill(), 'hele-stigen')).toBe(false)
  })

  it('Et helt år: 365 spilldager', () => {
    const s = nyttSpill()
    s.sek = 365 * DAG_SEK - 1
    expect(klart(s, 'helt-aar')).toBe(false)
    s.sek = 365 * DAG_SEK
    expect(klart(s, 'helt-aar')).toBe(true)
  })
})
