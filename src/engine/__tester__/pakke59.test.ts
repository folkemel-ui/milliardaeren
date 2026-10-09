/**
 * Pakke 59 — et større imperium: filialer i norske byer, og valuta for
 * eiendommen i utlandet, med Amsterdam, Roma og Paris i tillegg.
 */

import { describe, expect, it } from 'vitest'
import { aapneFilial, selgBedrift } from '../handlinger'
import { bedriftInntektIDag, bedriftInntektPerSek, bedriftsfaktor, dagensFaktor, statusfaktor } from '../formler'
import { bedriftssalgspris } from '../handlinger'
import { FILIAL_FRA_NIVAA, FILIALANDEL, filialbidrag, filialfaktor, filialpris, FILIALPRIS, HJEMME_BONUS, hjemby, MAKS_FILIALER } from '../filialer'
import { byfaktor, eiendomskurs } from '../regioner'
import { EIENDOMSTYPER, eiendomspris, leieHverPerSek, UTENLANDSBYER } from '../eiendom'
import { VALUTA_FOR, valutafaktor, valutalogg, VALUTALISTE } from '../valuta'
import { sjekkPrestasjoner } from '../prestasjoner'
import { DAG_SEK } from '../kalender'
import { MIGRERINGER } from '../../state/migrering'
import { nyttSpill } from '../start'
import type { Bedrift, Spilltilstand } from '../types'


const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill der saftboden har nådd nivå 50. */
function medSaftbod(nivaa = FILIAL_FRA_NIVAA): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  s.bedrifter[0] = { ...s.bedrifter[0], nivaa, investert: 1_000_000 }
  return s
}

describe('filialer', () => {
  it('åpner fra nivå 50, koster en andel av det som er investert, og går inn i verdien', () => {
    expect(aapneFilial(medSaftbod(49), 'b0', 'Oslo').ok).toBe(false)
    const s = medSaftbod()
    const id = s.bedrifter[0].id
    expect(filialpris(s.bedrifter[0])).toBe(Math.round(FILIALPRIS * FILIALANDEL[0] * 1_000_000))
    const n = ok(aapneFilial(s, id, 'Oslo'))
    expect(s.kontanter - n.kontanter).toBe(filialpris(s.bedrifter[0]))
    expect(n.bedrifter[0].investert).toBe(1_000_000 + filialpris(s.bedrifter[0])!)
    // Salgsprisen følger verdien, filialen med.
    expect(bedriftssalgspris(n.bedrifter[0])).toBeGreaterThan(bedriftssalgspris(s.bedrifter[0]))
  })

  it('gir en fallende andel av inntekten før lønn, 25 % mer i hjemregionen', () => {
    let s = medSaftbod()
    const id = s.bedrifter[0].id
    const før = bedriftInntektIDag(s, s.bedrifter[0])
    expect(hjemby('saftbod')).toBe('Oslo')
    s = ok(aapneFilial(s, id, 'Oslo'))
    const b = s.bedrifter[0]
    expect(filialbidrag(s, 'saftbod', 'Oslo', 0)).toBeCloseTo(FILIALANDEL[0] * HJEMME_BONUS * byfaktor(s, 'Oslo'))
    const brutto = (bedriftInntektPerSek(b, dagensFaktor(s, b.type)) - bedriftInntektPerSek(b, 0)) * statusfaktor(s)
    expect(bedriftInntektIDag(s, b) - før).toBeCloseTo(brutto * filialbidrag(s, 'saftbod', 'Oslo', 0), 6)
    s = ok(aapneFilial(s, id, 'Bergen'))
    s = ok(aapneFilial(s, id, 'Lofoten'))
    expect(filialfaktor(s, s.bedrifter[0])).toBeCloseTo(
      1 + FILIALANDEL[0] * HJEMME_BONUS * byfaktor(s, 'Oslo') + FILIALANDEL[1] * byfaktor(s, 'Bergen') + FILIALANDEL[2] * byfaktor(s, 'Lofoten'),
    )
    // Tre er nok, og to i samme by går ikke.
    expect(aapneFilial(s, id, 'Geilo').ok).toBe(false)
    expect(MAKS_FILIALER).toBe(3)
    expect(aapneFilial(medSaftbod(), id, 'Tromsø' as never).ok).toBe(false)
    const enIOslo = ok(aapneFilial(medSaftbod(), id, 'Oslo'))
    expect(aapneFilial(enIOslo, id, 'Oslo').ok).toBe(false)
  })

  it('uten filialer er inntekten nøyaktig som før', () => {
    const s = medSaftbod()
    const b: Bedrift = s.bedrifter[0]
    expect(filialfaktor(s, b)).toBe(1)
    expect(bedriftsfaktor(s, b)).toBe(dagensFaktor(s, b.type))
  })

  it('følger bedriften når den selges, og gir prestasjoner', () => {
    let s = medSaftbod()
    s = ok(aapneFilial(s, s.bedrifter[0].id, 'Oslo'))
    sjekkPrestasjoner(s)
    expect(s.prestasjoner['forste-filial']).toBeDefined()
    expect(s.prestasjoner.landsdekkende).toBeUndefined()
    s.kontanter = 1e12
    const solgt = ok(selgBedrift({ ...s, bedrifter: [...s.bedrifter, { ...s.bedrifter[0], id: 'b99', type: 'kiosk', filialer: [] }] }, s.bedrifter[0].id))
    expect(solgt.bedrifter.some((b) => b.filialer?.length)).toBe(false)
  })
})

describe('valuta', () => {
  it('starter på 1, svinger glatt og holder seg innenfor rundt ±11 %', () => {
    const s = nyttSpill()
    for (const v of VALUTALISTE) {
      expect(valutafaktor(s, v)).toBe(1)
      let forrige = 0
      for (let sek = 0; sek < 60 * DAG_SEK; sek += 60) {
        const l = valutalogg(v, sek)
        expect(Math.abs(l), v).toBeLessThan(0.115)
        // Ingen hopp: høyst én prosent per spillminutt (én spilldag er fem).
        if (sek > 0) expect(Math.abs(l - forrige), v).toBeLessThan(0.01)
        forrige = l
      }
    }
  })

  it('danske kroner følger euroen og dirham dollaren', () => {
    for (const sek of [1000, 50_000, 400_000]) {
      expect(valutalogg('DKK', sek)).toBe(valutalogg('EUR', sek))
      expect(valutalogg('AED', sek)).toBe(valutalogg('USD', sek))
    }
    expect(valutalogg('GBP', 50_000)).not.toBe(valutalogg('EUR', 50_000))
  })

  it('pris, verdi og leie i utlandet følger kursen — Norge gjør det ikke', () => {
    const s = nyttSpill()
    s.sek = 9 * DAG_SEK + 123
    const f = valutafaktor(s, 'EUR')
    expect(f).not.toBe(1)
    expect(eiendomskurs(s, 'Berlin')).toBeCloseTo(s.marked.eiendom.kurs * f)
    expect(eiendomspris(s, 'berlin')).toBeCloseTo(EIENDOMSTYPER.berlin.pris * s.marked.eiendom.kurs * f)
    const uten = { ...s, valutaanker: { EUR: valutalogg('EUR', s.sek) } }
    expect(leieHverPerSek(s, 'berlin') / leieHverPerSek(uten, 'berlin')).toBeCloseTo(f)
    expect(eiendomskurs(s, 'Oslo')).toBe(s.marked.eiendom.kurs * byfaktor(s, 'Oslo'))
  })

  it('en lagring fra versjon 21 ankres: ingen eiendom endrer verdi av oppdateringen', () => {
    const s = nyttSpill() as unknown as Record<string, unknown>
    s.sek = 40 * DAG_SEK + 77
    delete s.valutaanker
    const etter = MIGRERINGER[21](s) as unknown as Spilltilstand
    for (const v of VALUTALISTE) expect(valutafaktor(etter, v)).toBeCloseTo(1, 12)
    // Det samme som før valutaen fantes: katalogprisen ganger landsindeksen.
    expect(eiendomspris(etter, 'london')).toBeCloseTo(EIENDOMSTYPER.london.pris * etter.marked.eiendom.kurs, 3)
  })
})

describe('flere land', () => {
  it('Amsterdam, Roma og Paris med forretningsjet, i euro', () => {
    expect(UTENLANDSBYER).toEqual(expect.arrayContaining(['Amsterdam', 'Roma', 'Paris']))
    for (const id of ['amsterdam', 'roma', 'paris'] as const) {
      expect(EIENDOMSTYPER[id].reise).toBe(2)
      expect(VALUTA_FOR[EIENDOMSTYPER[id].by as 'Paris']).toBe('EUR')
    }
    expect(Object.keys(VALUTA_FOR).sort()).toEqual([...UTENLANDSBYER].sort())
  })
})
