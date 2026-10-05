/** Pakke 39: klubbens resultat skattes, tvangssalg gir tap, og hver dag gjøres opp til statistikken. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { sjekkMargin } from '../bank'
import { eiendeler } from '../formler'
import * as h from '../handlinger'
import { KLUBBNAVN, klubbVedDagsskifte } from '../klubb'
import { TVANGSSALG_ANDEL } from '../innhold'
import { skattegrunnlag } from '../skatt'
import { dagsskifteOppgjor, periodestart } from '../oppgjor'
import { DAG_SEK, dato } from '../kalender'
import { simuler } from '../simulering'
import { bedrift } from './hjelp'
import type { Oppgjor, Spilltilstand } from '../types'

function ok(u: h.Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e11
  s.hoyesteFormue = 1e11
  return s
}

/** Den første dagen i neste måned, så månedsoppgjøret gjøres. */
function forsteIMaaned(): number {
  let d = 1
  while (dato(d).dag !== 1) d++
  return d
}

const tomt: Oppgjor = {
  periode: 'maaned',
  navn: 'januar 2027',
  fraDag: 0,
  tilDag: 31,
  bedrifter: 0,
  leie: 0,
  utbytte: 0,
  sparerente: 0,
  renter: 0,
  forbruk: 0,
  formueFor: 0,
  formueEtter: 0,
  besteBedrift: null,
}

describe('klubbens resultat', () => {
  it('billetter, sponsor og lønn føres i totaltKlubb', () => {
    const s = ok(h.kjopKlubb(rik(), KLUBBNAVN[0]))
    const k = s.klubb!
    const forKlubb = s.totaltKlubb ?? 0
    const forRegnskap = k.billetter + k.sponsor - k.lonn
    // Noen runder, både hjemme og borte, men ikke sesongslutt (den nullstiller klubbens tellere).
    for (let i = 0; i < 4; i++) klubbVedDagsskifte(s)
    const etter = s.klubb!.billetter + s.klubb!.sponsor - s.klubb!.lonn
    expect((s.totaltKlubb ?? 0) - forKlubb).toBeCloseTo(etter - forRegnskap)
    expect(s.klubb!.lonn).toBeGreaterThan(0)
  })

  it('skattes med inntekten, og et underskudd trekkes fra samme måned', () => {
    expect(skattegrunnlag({ ...tomt, klubb: 100_000 })).toBe(100_000)
    expect(skattegrunnlag({ ...tomt, bedrifter: 300_000, klubb: -100_000 })).toBe(200_000)
    expect(skattegrunnlag({ ...tomt, klubb: -100_000 })).toBe(0)
    // Oppgjør fra før Pakke 39 har ikke feltet.
    expect(skattegrunnlag({ ...tomt, bedrifter: 50_000 })).toBe(50_000)
  })

  it('kommer med i måneden — men en tellerstand uten klubb teller fra null', () => {
    const s = nyttSpill()
    s.maanedstart = periodestart(s)
    s.totaltKlubb = 40_000
    s.totaltHost = 7_000
    s.sek = forsteIMaaned() * DAG_SEK
    const maaned = dagsskifteOppgjor(s).find((o) => o.periode === 'maaned')!
    expect(maaned.klubb).toBe(40_000)
    expect(maaned.host).toBe(7_000)

    const gammel = nyttSpill()
    const start = periodestart(gammel)
    delete start.klubb
    delete start.host
    gammel.maanedstart = start
    gammel.totaltKlubb = 40_000
    gammel.sek = forsteIMaaned() * DAG_SEK
    expect(dagsskifteOppgjor(gammel).find((o) => o.periode === 'maaned')!.klubb).toBe(0)
  })
})

describe('tvangssalg av en bedrift', () => {
  it('bokføres som tap: banken betaler bare en del av verdien', () => {
    const s = rik()
    s.bedrifter.push(bedrift('kiosk', { id: 'b2', nivaa: 10, investert: 1_000_000 }))
    s.kontanter = 0
    s.gjeld = eiendeler(s) * 0.95
    const for_ = s.totaltGevinst ?? 0
    sjekkMargin(s)
    expect(s.bedrifter).toHaveLength(1)
    expect((s.totaltGevinst ?? 0) - for_).toBeCloseTo(-1_000_000 * (1 - TVANGSSALG_ANDEL))
  })
})

describe('dagsoppgjør til statistikken', () => {
  it('et gammelt spill starter tellingen ved første dagsskifte', () => {
    const s = nyttSpill()
    delete s.dagstart
    s.sek = DAG_SEK
    dagsskifteOppgjor(s)
    expect(s.dagsoppgjor ?? []).toHaveLength(0)
    expect((s as Spilltilstand).dagstart?.dag).toBe(1)
  })

  it('hver dag får sitt oppgjør, og summen stemmer med tellerne', () => {
    const start = nyttSpill()
    start.bedrifter[0].nivaa = 40
    const s = simuler(start, DAG_SEK * 6)
    const dager = s.dagsoppgjor ?? []
    expect(dager.length).toBe(5)
    expect(dager.every((d) => d.periode === 'dag')).toBe(true)
    // Første dag startet tellingen; dagene etter summerer til tellerne siden da.
    const fraStart = s.dagstart!.tjent - dager.reduce((sum, d) => sum + d.bedrifter, 0)
    expect(fraStart).toBeGreaterThan(0)
    expect(dager[0].fraDag).toBe(1)
    expect(dager.at(-1)!.tilDag).toBe(6)
  })

  it('holder bare de siste 30 dagene', () => {
    const s = nyttSpill()
    for (let d = 1; d <= 40; d++) {
      s.sek = d * DAG_SEK
      dagsskifteOppgjor(s)
    }
    expect(s.dagsoppgjor).toHaveLength(30)
    expect(s.dagsoppgjor!.at(-1)!.tilDag).toBe(40)
  })
})
