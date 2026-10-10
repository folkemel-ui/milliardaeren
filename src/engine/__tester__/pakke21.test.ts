/** Pakke 21: marginkravet tar alt annet før bedriftene, og oppkjøp gir ikke gratis fusjoner. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { sjekkMargin } from '../bank'
import { eiendeler, nettoformue } from '../formler'
import * as h from '../handlinger'
import { JORDLISTE } from '../jord'
import { LANDEMERKELISTE } from '../landemerker'
import { MALERILISTE } from '../kunst'
import { KLUBBNAVN } from '../klubb'
import { MAKS_BELAANING } from '../innhold'
import { selskapsverdi } from '../rivaler'
import { bedrift } from './hjelp'
import type { Spilltilstand } from '../types'

function ok(u: h.Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** En rik spiller med to bedrifter og det `kjøp` gir, uten kontanter. */
function med(kjøp: (s: Spilltilstand) => Spilltilstand): Spilltilstand {
  let s = nyttSpill()
  s = { ...s, kontanter: 1e11, hoyesteFormue: 1e11 }
  s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 10, investert: 100_000 }))
  s = kjøp(s)
  s.kontanter = 0
  return s
}

/** Så mye gjeld at banken må ta alt og vel så det. */
function krise(s: Spilltilstand): Spilltilstand {
  s.gjeld = eiendeler(s) * 0.95
  sjekkMargin(s)
  // Tar banken en bedrift, skjer det først etter salget.
  const titler = s.hendelser.map((x) => x.tittel)
  if (titler.includes('Konkursbo')) expect(titler.indexOf('Marginkrav')).toBeLessThan(titler.indexOf('Konkursbo'))
  return s
}

describe('marginkravet', () => {
  it('selger gårder og skoger før bedriftene', () => {
    const s = krise(med((s) => ok(h.kjopJord(s, JORDLISTE[0]))))
    expect(Object.keys(s.jord)).toHaveLength(0)
  })

  it('selger landemerker før bedriftene', () => {
    const s = krise(med((s) => ok(h.kjopLandemerke(s, LANDEMERKELISTE[0]))))
    expect(Object.keys(s.landemerker)).toHaveLength(0)
  })

  it('selger kunst før bedriftene — også maleriet på museum', () => {
    expect(Object.keys(krise(med((s) => ok(h.kjopMaleri(s, MALERILISTE[0])))).kunst.eide)).toHaveLength(0)
    const utlant = med((s) => ok(h.museum(ok(h.kjopMaleri(s, MALERILISTE[0])), MALERILISTE[0])))
    expect(Object.keys(krise(utlant).kunst.eide)).toHaveLength(0)
  })

  it('selger klubben før bedriftene', () => {
    const s = krise(med((s) => ok(h.kjopKlubb(s, KLUBBNAVN[0]))))
    expect(s.klubb).toBeNull()
  })

  it('stopper når belåningen er nede igjen, og tar ikke mer enn nødvendig', () => {
    const s = med((s) => ok(h.kjopKlubb(ok(h.kjopMaleri(ok(h.kjopJord(s, JORDLISTE[0])), MALERILISTE[0])), KLUBBNAVN[0])))
    s.gjeld = eiendeler(s) * 0.76
    sjekkMargin(s)
    expect(s.gjeld / eiendeler(s)).toBeLessThanOrEqual(MAKS_BELAANING + 1e-9)
    expect(s.bedrifter).toHaveLength(2)
    // Den største posten (gården) holdt; resten står.
    expect(Object.keys(s.jord)).toHaveLength(0)
    expect(s.klubb).not.toBeNull()
  })

  it('andeler i startups tas for halv verdi før bedriftene', () => {
    const s = med((s) => {
      s.startups = [
        { id: 1, ide: 0, runde: 0, verdi: 1e9, andel: 0.5, investert: 1e8, investertIRunde: 0, kvalitet: 0.5, inntrykk: 1, status: 'aktiv', startetSek: 0 },
      ]
      return s
    })
    krise(s)
    expect(s.startups[0].andel).toBe(0)
    // Selskapet lever videre uten deg.
    expect(s.startups[0].status).toBe('aktiv')
    expect(s.hendelser.some((x) => x.tittel === 'Konkursbo' && x.tekst.includes('andelen i'))).toBe(true)
  })
})

describe('fiendtlig oppkjøp', () => {
  /** En rik spiller som eier kiosk og saftbod, og en rival som eier det samme. */
  function oppsett(): Spilltilstand {
    let s = nyttSpill()
    s = { ...s, kontanter: 1e12, hoyesteFormue: 1e12 }
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 100, investert: 100_000 }))
    s.rivaler[0].formue = 5e7
    s.rivaler[0].tak = 1e9
    const id = s.rivaler[0].id
    for (let i = 0; i < 5; i++) s = ok(h.kjopRivalblokk(s, id))
    return s
  }

  it('flytter verdien over i dine bedrifter, så nettoformuen står stille', () => {
    const s = oppsett()
    const før = nettoformue(s)
    const etter = ok(h.overtaRival(s, s.rivaler[0].id))
    const pris = h.overtaRival(s, s.rivaler[0].id).ok ? s.kontanter - etter.kontanter : 0
    // Det eneste som forsvinner er premien over verdien for resten av aksjene.
    const premie = pris - 0.5 * selskapsverdi(s.rivaler[0])
    expect(nettoformue(etter)).toBeCloseTo(før - premie, -2)
    expect(etter.rivaler[0].formue).toBeLessThan(s.rivaler[0].formue)
  })

  it('selges selskapet tilbake, får du bare betalt for det som er igjen', () => {
    const s = oppsett()
    const overtatt = ok(h.overtaRival(s, s.rivaler[0].id))
    const solgt = ok(h.selgRivalandel(overtatt, s.rivaler[0].id))
    const fikk = solgt.kontanter - overtatt.kontanter
    // Før ville salget gitt hele selskapsverdien tilbake.
    expect(fikk).toBeLessThan(selskapsverdi(s.rivaler[0]) * 0.97 - 1)
    // Fusjonene blir, men de er betalt for: verdien ligger i bedriftene dine.
    expect(solgt.bedrifter.find((b) => b.type === 'kiosk')!.fusjoner).toBe(1)
    expect(nettoformue(solgt)).toBeLessThan(nettoformue(s))
  })
})
