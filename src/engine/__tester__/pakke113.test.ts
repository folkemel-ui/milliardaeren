/** Pakke 113: gårdens uke — været så langt, det byggene redder, prisene mot snittet, og færre mandagssaker. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopGardsbygg, kjopJord, type Utfall } from '../handlinger'
import { DAG_SEK, ukedag } from '../kalender'
import { simuler } from '../simulering'
import {
  avlingspris,
  jordVedDagsskifte,
  reddetSaLangt,
  snittpris,
  ukeAvAtte,
  ukefaktor,
  ukefaktorSaLangt,
  UKE_SEK,
  vaer,
} from '../jord'
import type { Spilltilstand } from '../types'

const ID = 'gard-lista'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return ok(kjopJord(s, ID))
}

/** Første mandag fra dag `fra`. */
function mandag(fra = 14): number {
  let d = fra
  while (ukedag(d * DAG_SEK) !== 0) d++
  return d
}

describe('været så langt', () => {
  it('søndag er været så langt hele ukas vær; mandag bare dagen', () => {
    for (let k = 0; k < 20; k++) {
      const m = mandag(14 + 7 * k)
      expect(ukefaktorSaLangt(m + 6, false, false)).toBeCloseTo(vaer(m).faktor, 10)
      expect(ukefaktorSaLangt(m + 6, true, true)).toBeCloseTo(ukefaktor(m, true, true), 10)
    }
  })

  it('drenering og frostdekke redder noe bare de ukene været rammer, og aldri uten byggene', () => {
    let s = medGard()
    expect(reddetSaLangt(s, ID)).toBe(0)
    s = ok(kjopGardsbygg(ok(kjopGardsbygg(s, ID, 'drenering')), ID, 'frostdekke'))
    let medRedning = 0
    for (let k = 0; k < 30; k++) {
      const m = mandag(14 + 7 * k)
      s.jord[ID]!.plantetSek = m * DAG_SEK
      s.sek = m * DAG_SEK + UKE_SEK - 1
      const r = reddetSaLangt(s, ID)
      expect(r).toBeGreaterThanOrEqual(0)
      if (ukefaktor(m, true, true) > vaer(m).faktor) {
        expect(r).toBeGreaterThan(0)
        medRedning++
      } else expect(r).toBe(0)
    }
    expect(medRedning).toBeGreaterThan(5)
  })
})

describe('prisene mot snittet', () => {
  it('snittet er de åtte siste ukenes pris, denne med', () => {
    const uke = 40
    let sum = 0
    for (let u = 33; u <= 40; u++) sum += avlingspris('korn', u)
    expect(snittpris('korn', uke)).toBeCloseTo(sum / 8, 12)
  })
})

describe('færre mandagssaker', () => {
  it('den beste eller verste uka av åtte: om lag hver niende uke hver, målt over 520 uker', () => {
    let beste = 0
    let verste = 0
    for (let u = 8; u < 528; u++) {
      const h = ukeAvAtte(u * 7)
      if (h === 'beste') beste++
      if (h === 'verste') verste++
    }
    for (const n of [beste, verste]) {
      expect(n / 520).toBeGreaterThan(0.08)
      expect(n / 520).toBeLessThan(0.15)
    }
  })

  it('avisa skriver bare de ukene; høsten betales uansett', () => {
    let saker = 0
    let stille = 0
    for (let k = 0; k < 40; k++) {
      const s = medGard()
      const m = mandag(56 + 7 * k)
      s.jord[ID]!.plantetSek = (m - 7) * DAG_SEK
      s.sek = m * DAG_SEK
      const for_ = s.kontanter
      const ut = jordVedDagsskifte(s)
      expect(s.kontanter).toBeGreaterThan(for_)
      const hvilken = ukeAvAtte(m - 1)
      if (hvilken) {
        expect(ut).toHaveLength(1)
        expect(ut[0].tittel).toBe(`${hvilken === 'beste' ? 'Beste' : 'Verste'} uke på gårdene på to måneder`)
        expect(ut[0].tekst.startsWith(`${vaer(m - 1).navn}: `)).toBe(true)
        saker++
      } else {
        expect(ut).toEqual([])
        stille++
      }
    }
    expect(saker).toBeGreaterThan(0)
    expect(stille).toBeGreaterThan(saker)
  })

  it('søndagsavisas «Uka di» har det gårdene ga, hver uke', () => {
    let s = medGard()
    s = simuler(s, 16 * DAG_SEK)
    const uker = s.oppgjor.filter((o) => o.periode === 'uke' && o.gardene)
    expect(uker.length).toBeGreaterThan(0)
    const o = uker[uker.length - 1]
    expect(o.gardene!.host).toBeGreaterThan(0)
    expect(['Rekorduke', 'God uke', 'Normal uke', 'Svak uke', 'Elendig uke']).toContain(o.gardene!.vaer)
  })
})
