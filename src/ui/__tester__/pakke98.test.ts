/** Pakke 98: velkomsten teller hver kamp, målet etter milliarden og portene i Luksus i stripa. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { kjopKlubb, kjopLuksus, startRacingteam, type Utfall } from '../../engine/handlinger'
import { BORTE_TAK_SEK, MAKS_HENDELSER } from '../../engine/innhold'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import { KAMPER_HUSKET, KLUBBNAVN, leggTilKamp, RAPPORTER_HUSKET } from '../../engine/klubb'
import { racingVedDagsskifte } from '../../engine/racing'
import { periodestart } from '../../engine/oppgjor'
import type { Kamp, Spilltilstand } from '../../engine/types'
import { kampnokkel, oppsummer, tapt, vunnet } from '../velkomst'
import { kildeverdier, paagaende } from '../statistikk'
import { alleMaal, nesteMaal, profilmaal } from '../progresjon'
import { PRESTASJONER } from '../../engine/prestasjoner'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e11
  s.hoyesteFormue = 1e11
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

const kamp = (runde: number, turnering?: Kamp['turnering'], ekstra: Partial<Kamp> = {}): Kamp => ({
  sesong: 1,
  runde,
  motstander: 'Rival',
  hjemme: true,
  maalFor: 2,
  maalMot: 1,
  turnering,
  dag: 1,
  ...ekstra,
})

describe('velkomsten teller hver kamp', () => {
  it('en cupkamp gjemmer seg ikke lenger bak seriekampen med samme runde', () => {
    const før = medKlubb()
    før.klubb!.kamper = []
    const etter = structuredClone(før)
    etter.klubb!.kamper = [kamp(2), kamp(2, 'cup'), kamp(2, 'europa')]
    const o = oppsummer(før, etter, 600)
    expect(o.kamper).toHaveLength(3)
    expect(o.turneringer).toEqual([
      { turnering: 'serie', antall: 1 },
      { turnering: 'cup', antall: 1 },
      { turnering: 'europa', antall: 1 },
    ])
    expect(new Set([kamp(2), kamp(2, 'cup')].map(kampnokkel)).size).toBe(2)
  })

  it('to timer borte: alle kampene kommer med, ikke bare de ti siste', () => {
    const før = medKlubb()
    const etter = simuler(før, BORTE_TAK_SEK, true)
    const o = oppsummer(før, etter, BORTE_TAK_SEK)
    const fra = dagnummer(før.sek)
    const til = dagnummer(etter.sek)
    // Kampene som ble avgjort mens du var borte: fra i morgen til i går (den som spilles nå, venter).
    const spilt = etter.klubb!.kamper.filter((k) => k.dag! > fra && k.dag! < til)
    expect(spilt.length).toBeGreaterThan(10)
    expect(o.kamper).toHaveLength(spilt.length)
    expect(o.kamper.some((k) => k.turnering === 'cup')).toBe(true)
  })

  it('klubben husker 40 kamper, og bare de ti siste har rapporten', () => {
    const s = medKlubb()
    const k = s.klubb!
    k.kamper = []
    for (let i = 0; i < 55; i++) leggTilKamp(k, kamp(i, undefined, { maal: [{ minutt: 10, navn: 'A', mot: false }], vurderinger: [] }))
    expect(k.kamper).toHaveLength(KAMPER_HUSKET)
    expect(k.kamper[0].runde).toBe(15)
    const medRapport = k.kamper.filter((m) => m.maal !== undefined || m.vurderinger !== undefined)
    expect(medRapport).toHaveLength(RAPPORTER_HUSKET)
    expect(medRapport[0]).toBe(k.kamper[KAMPER_HUSKET - RAPPORTER_HUSKET])
  })

  it('en seier på straffer er en seier, et tap på straffer et tap', () => {
    expect(vunnet(kamp(1, 'cup', { maalFor: 1, maalMot: 1, straffer: 'deg' }))).toBe(true)
    expect(tapt(kamp(1, 'cup', { maalFor: 1, maalMot: 1, straffer: 'dem' }))).toBe(true)
    const uavgjort = kamp(1, undefined, { maalFor: 1, maalMot: 1 })
    expect(vunnet(uavgjort) || tapt(uavgjort)).toBe(false)
  })

  it('løpene racingteamet kjørte, med seire og poeng', () => {
    let s = medKlubb()
    s = ok(kjopLuksus(s, 'formelbil'))
    s = ok(startRacingteam(s))
    const etter = simuler(s, 24 * DAG_SEK, true)
    const o = oppsummer(s, etter, 24 * DAG_SEK)
    const lop = etter.racing!.lop
    expect(o.racing).not.toBeNull()
    expect(o.racing!.lop).toBe(lop.length)
    expect(o.racing!.poeng).toBe(lop.reduce((sum, l) => sum + l.poeng, 0))
    expect(o.racing!.seire).toBe(lop.filter((l) => l.plasser.includes(1)).length)
    expect(oppsummer(etter, etter, 600).racing).toBeNull()
  })

  it('en unik ting som gikk til en rival, står på velkomsten; en som ble trukket, gjør ikke', () => {
    const før = nyttSpill()
    før.auksjon = { nesteDag: 0, eide: {}, borte: { kongelimousin: { tilbakeDag: 99, ganger: 1, rival: 'Marit Aas', pris: 50e6 } } }
    const etter = structuredClone(før)
    etter.auksjon!.borte['le-mans-1971'] = { tilbakeDag: 200, ganger: 1, rival: 'Ola Berg', pris: 180e6 }
    etter.auksjon!.borte.sjoflyet = { tilbakeDag: 150, ganger: 0 }
    const o = oppsummer(før, etter, 600)
    expect(o.tapteAuksjoner).toEqual([{ navn: 'Le Mans-vinneren fra 1971', rival: 'Ola Berg', pris: 180e6 }])
  })
})

describe('racingen i regnskapet og loggen', () => {
  function vedLop(): Spilltilstand {
    let s = medKlubb()
    s = ok(kjopLuksus(s, 'formelbil'))
    s = ok(startRacingteam(s))
    s.sek = s.racing!.nesteDag * DAG_SEK
    return s
  }

  it('racinghendelsene holder seg innenfor loggens tak', () => {
    const s = vedLop()
    s.hendelser = Array.from({ length: MAKS_HENDELSER }, (_, i) => ({ sek: i, tittel: 'Fyll', tekst: `${i}`, alvor: 'info' as const }))
    racingVedDagsskifte(s, 'Du')
    expect(s.hendelser).toHaveLength(MAKS_HENDELSER)
    expect(s.hendelser.at(-1)!.tittel).toBe('Racing')
  })

  it('racingpengene står i klubben som før, og i sin egen del som statistikken viser for seg', () => {
    const s = vedLop()
    const start = periodestart(s)
    const klubbFor = s.totaltKlubb ?? 0
    racingVedDagsskifte(s, 'Du')
    const racing = s.totaltRacing ?? 0
    expect(racing).not.toBe(0)
    expect((s.totaltKlubb ?? 0) - klubbFor).toBeCloseTo(racing)
    const naa = paagaende(s, start)
    expect(naa.racing).toBeCloseTo(racing)
    expect(naa.klubb).toBeCloseTo(0)
    const v = kildeverdier({ bedrifter: 0, leie: 0, utbytte: 0, sparerente: 0, gevinster: 0, klubb: 100, host: 0, racing: 30 })
    expect(v.klubb).toBe(70)
    expect(v.racing).toBe(30)
    // En tellerstand fra før Pakke 98 har ingen racing: da står den i klubben, som før.
    const gammel = { ...start, racing: undefined }
    expect(paagaende(s, gammel).racing).toBe(0)
  })
})

describe('målet etter milliarden', () => {
  it('milliarden først, fra kr 1', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 5e8
    const m = profilmaal(s, 1e6)
    expect(m.belop).toBe(1e9)
    expect(m.andel).toBeCloseTo(6 / 9)
  })

  it('så 10, 100 og 1 000 mrd, hver fra den forrige', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 2e9
    const m = profilmaal(s, Math.sqrt(1e9 * 1e10))
    expect(m.belop).toBe(1e10)
    expect(m.fra).toBe(1e9)
    expect(m.andel).toBeCloseTo(0.5)
    s.hoyesteFormue = 5e11
    expect(profilmaal(s, 5e11)).toMatchObject({ belop: 1e12, fra: 1e11 })
  })

  it('etter billionen: prestasjonene som er igjen', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 2e12
    const m = profilmaal(s, 2e12)
    expect(m.belop).toBeNull()
    expect(m.prestasjoner).toEqual({ klart: 0, totalt: PRESTASJONER.length })
  })
})

describe('stripa nevner portene i Luksus', () => {
  it('auksjonshuset ved 120 mill, Formel 1-bilen og teamet ved 105 mill, ubåten ved 60 mrd', () => {
    const maal = alleMaal()
    const finn = (tekst: string) => maal.find((m) => m.tekst === tekst)
    expect(finn('Auksjonshuset')).toMatchObject({ belop: 120e6, fane: 'luksus' })
    expect(finn('Formel 1-bil og racingteam')).toMatchObject({ belop: 105e6, fane: 'luksus' })
    expect(finn('Ubåt')).toMatchObject({ belop: 60e9, fane: 'luksus' })
  })

  it('etter milepælen på 100 mill er neste mål racingteamet', () => {
    const s = nyttSpill()
    s.hoyesteFormue = 100e6
    expect(nesteMaal(s)!.maal.map((m) => m.tekst)).toEqual(['Formel 1-bil og racingteam'])
  })
})
