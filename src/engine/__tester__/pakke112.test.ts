/** Pakke 112: gården med ett blikk — nedtellingen til høsten, ukas høst så langt og «Silo full». */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopGardsbygg, kjopJord, settLagring, type Utfall } from '../handlinger'
import { DAG_SEK, ukedag } from '../kalender'
import { hostSaLangt, jordVedDagsskifte, lagerFullt, lagerkapasitet, tidTilHost, UKE_SEK, ukensGardHost } from '../jord'
import type { Spilltilstand } from '../types'

const ID = 'gard-lista'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Første mandag fra dag 14: der uka begynner. */
function mandag(): number {
  let d = 14
  while (ukedag(d * DAG_SEK) !== 0) d++
  return d
}

/** Lista med silo, satt til å lagre, eid en hel uke før mandag. */
function medSilo(): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  s = ok(kjopGardsbygg(ok(kjopJord(s, ID)), ID, 'silo'))
  s = ok(settLagring(s, ID, 'lagre'))
  const m = mandag()
  s.jord[ID]!.plantetSek = (m - 7) * DAG_SEK
  s.sek = m * DAG_SEK
  return s
}

const siloLinjer = (s: Spilltilstand) => s.hendelser.filter((h) => h.tittel === 'Silo full')

describe('nedtellingen og uka så langt', () => {
  it('uka begynner mandag: en hel uke igjen da, en halv midt i uka', () => {
    const m = mandag()
    expect(tidTilHost({ sek: m * DAG_SEK })).toBe(UKE_SEK)
    expect(tidTilHost({ sek: m * DAG_SEK + UKE_SEK / 2 })).toBe(UKE_SEK / 2)
    expect(tidTilHost({ sek: m * DAG_SEK + UKE_SEK - 1 })).toBe(1)
  })

  it('det uka har gitt så langt stiger fra null mandag til hele uka, og er halvparten midt i', () => {
    const s = medSilo()
    s.jord[ID]!.plantetSek = s.sek
    expect(hostSaLangt(s, ID)).toBe(0)
    s.sek += UKE_SEK / 2
    expect(hostSaLangt(s, ID)).toBeCloseTo(ukensGardHost(s, ID) / 2, 0)
    expect(hostSaLangt(s, ID)).toBeGreaterThan(0)
  })
})

describe('«Silo full»', () => {
  it('fullt lager som tar avlingen, men ikke med «Selg», og ikke tomt', () => {
    const s = medSilo()
    expect(lagerFullt(s, ID)).toBe(false)
    s.jord[ID]!.lager = lagerkapasitet(s, ID, 'korn')
    expect(lagerFullt(s, ID)).toBe(true)
    expect(lagerFullt(ok(settLagring(s, ID, 'selg')), ID)).toBe(false)
  })

  it('en linje i loggen den mandagen lageret renner over — så ikke igjen før det har hatt plass', () => {
    const s = medSilo()
    const kap = lagerkapasitet(s, ID, 'korn')
    s.jord[ID]!.lager = kap
    jordVedDagsskifte(s)
    const linjer = siloLinjer(s)
    expect(linjer).toHaveLength(1)
    expect(linjer[0].tekst).toMatch(/^Siloen på Lista er full: korn for kr .+ ble solgt til ukas pris \(×\d,\d\d\)\.$/)
    expect(linjer[0].alvor).toBe('advarsel')
    expect(s.jord[ID]!.lagerFullt).toBe(true)
    // Neste mandag er det fortsatt fullt: ingen ny linje.
    s.sek += UKE_SEK
    jordVedDagsskifte(s)
    expect(siloLinjer(s)).toHaveLength(1)
    // Tømt: avlingen får plass, og merket fjernes.
    s.jord[ID]!.lager = 0
    s.sek += UKE_SEK
    jordVedDagsskifte(s)
    expect(s.jord[ID]!.lagerFullt).toBeUndefined()
    // Fullt igjen: en ny linje.
    s.jord[ID]!.lager = lagerkapasitet(s, ID, 'korn')
    s.sek += UKE_SEK
    jordVedDagsskifte(s)
    expect(siloLinjer(s)).toHaveLength(2)
  })

  it('med låve heter det «Silo og låve», og med «Selg» sies ingenting', () => {
    let s = medSilo()
    s = ok(kjopGardsbygg(s, ID, 'laave'))
    // Et bygg fører uka så langt og flytter starten til nå (Pakke 92); en hel uke igjen.
    s.jord[ID]!.plantetSek = s.sek - UKE_SEK
    s.jord[ID]!.lager = lagerkapasitet(s, ID, 'korn')
    jordVedDagsskifte(s)
    expect(siloLinjer(s)[0]?.tekst).toMatch(/^Silo og låve på Lista er fulle: korn/)
    const selg = ok(settLagring(medSilo(), ID, 'selg'))
    selg.jord[ID]!.lager = lagerkapasitet(selg, ID, 'korn')
    jordVedDagsskifte(selg)
    expect(siloLinjer(selg)).toHaveLength(0)
  })
})
