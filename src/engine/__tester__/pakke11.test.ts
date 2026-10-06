/** Pakke 11: fusjoner med rivalenes bedrifter, startups og reiser. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { byPaaBedrift, godtaMotbud, investerIStartup, kjopEiendom as kjopEiendomH, kjopLuksus, kjopRivalblokk, overtaRival, selgLuksus, utvidLager, type Utfall } from '../handlinger'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, leiePerSek, reiseNivaa, UTENLANDSBYER } from '../eiendom'
import { sjekkPrestasjoner } from '../prestasjoner'
import { simuler } from '../simulering'
import { aktive, DIN_DEL_AV_RUNDEN, konkursrisiko, ledigIRunde, MAKS_AKTIVE, RUNDEANDEL, RUNDER, startupsVedDagsskifte, startupverdi } from '../startups'
import { bedriftInntektPerSek, nettoformue } from '../formler'
import { DAG_SEK } from '../kalender'
import {
  BUD,
  type BudId,
  EIER_VED,
  FUSJONSFAKTOR,
  MOTBUD_VED,
  PRIS_MOT_DIN,
  prisantydning,
  rivalbedrifter,
  rivalensPris,
} from '../fusjon'
import { gisUtAvis } from '../avis'
import { Terning } from '../rng'
import { BEDRIFTSTYPER } from '../innhold'
import type { BedriftstypeId, Spilltilstand } from '../types'
import { bedrift } from './hjelp'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill der du eier en kiosk og har god råd, og Grønn er rik nok til å eie en. */
function oppsett(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  s.bedrifter.push(bedrift('kiosk', { id: 'b9', nivaa: 10, investert: 100_000 }))
  s.rivaler[0].formue = 5e6
  return s
}

const faktor = (bud: BudId) => BUD.find((b) => b.id === bud)!.faktor

/** Første dag der rivalens pris gir ønsket utfall for et bud. */
function dagDer(s: Spilltilstand, type: BedriftstypeId, bud: BudId, utfall: 'ja' | 'motbud' | 'nei'): Spilltilstand {
  const r = s.rivaler[0]
  for (let dag = 0; dag < 500; dag++) {
    const n = structuredClone(s)
    n.sek = dag * DAG_SEK + 10
    const rb = rivalbedrifter(r).find((x) => x.type === type)!
    const tilbud = Math.round(prisantydning(n, rb) * faktor(bud))
    const pris = rivalensPris(n, r, rb)
    const svar = tilbud >= pris ? 'ja' : tilbud >= pris * MOTBUD_VED ? 'motbud' : 'nei'
    if (svar === utfall) return n
  }
  throw new Error(`Fant ingen dag med ${utfall}`)
}

describe('rivalenes bedrifter', () => {
  it('vokser med formuen: en fattig rival eier bare de minste', () => {
    const r = structuredClone(nyttSpill().rivaler[0])
    r.formue = 20_000
    expect(rivalbedrifter(r).map((b) => b.type)).toEqual(['saftbod', 'polsebod'])
    r.formue = 1e9
    const rike = rivalbedrifter(r)
    expect(rike.map((b) => b.type)).toContain('restaurant')
    for (const b of rike) expect(r.formue).toBeGreaterThanOrEqual(BEDRIFTSTYPER[b.type].pris * EIER_VED)
    // Mer penger gir høyere nivå i samme bransje.
    const lavere = rivalbedrifter({ ...r, formue: 1e8 }).find((b) => b.type === 'kafe')!
    expect(rike.find((b) => b.type === 'kafe')!.nivaa).toBeGreaterThan(lavere.nivaa)
  })

  it('tar ikke med solgte bransjer, og ingenting når selskapet er overtatt', () => {
    const r = structuredClone(nyttSpill().rivaler[0])
    r.formue = 1e9
    r.solgt = ['kiosk']
    expect(rivalbedrifter(r).map((b) => b.type)).not.toContain('kiosk')
    r.overtatt = true
    expect(rivalbedrifter(r)).toEqual([])
  })

  it('prisantydningen er aldri under det din egen er verdt ganger faktoren', () => {
    const s = oppsett()
    const rb = rivalbedrifter(s.rivaler[0]).find((x) => x.type === 'kiosk')!
    expect(prisantydning(s, rb)).toBeGreaterThanOrEqual(100_000 * PRIS_MOT_DIN)
    expect(prisantydning(s, rb)).toBeGreaterThanOrEqual(Math.round(rb.verdi))
  })

  it('rivalens pris står fast hele dagen, men skifter fra dag til dag', () => {
    const s = oppsett()
    const r = s.rivaler[0]
    const rb = rivalbedrifter(r).find((x) => x.type === 'kiosk')!
    const pris = (sek: number) => rivalensPris({ ...s, sek }, r, rb)
    expect(pris(DAG_SEK * 3 + 1)).toBe(pris(DAG_SEK * 4 - 1))
    const dager = new Set(Array.from({ length: 10 }, (_, d) => pris(d * DAG_SEK)))
    expect(dager.size).toBeGreaterThan(1)
  })
})

describe('bud og fusjon', () => {
  it('et bud som holder, slår bedriftene sammen uten å endre nettoformuen', () => {
    const s = dagDer(oppsett(), 'kiosk', 'sjenerost', 'ja')
    const før = nettoformue(s)
    const inntektFør = bedriftInntektPerSek(s.bedrifter.find((b) => b.type === 'kiosk')!)
    const formueFør = s.rivaler[0].formue
    const takFør = s.rivaler[0].tak
    const n = ok(byPaaBedrift(s, s.rivaler[0].id, 'kiosk', 'sjenerost'))
    const kiosk = n.bedrifter.find((b) => b.type === 'kiosk')!
    expect(kiosk.fusjoner).toBe(1)
    expect(bedriftInntektPerSek(kiosk)).toBeCloseTo(inntektFør * FUSJONSFAKTOR)
    // Pengene flyttes fra kontanter til bedriftens verdi.
    expect(nettoformue(n)).toBeCloseTo(før, 0)
    // Rivalen bytter bedriften mot pengene: mister verdien, får betalingen, og taket står.
    const rb = rivalbedrifter(s.rivaler[0]).find((b) => b.type === 'kiosk')!
    const betalt = s.kontanter - n.kontanter
    expect(n.rivaler[0].formue).toBeCloseTo(formueFør * (1 - Math.min(0.5, rb.verdi / formueFør)) + betalt)
    expect(n.rivaler[0].tak).toBe(takFør)
    expect(n.rivaler[0].solgt).toEqual(['kiosk'])
    expect(rivalbedrifter(n.rivaler[0]).map((b) => b.type)).not.toContain('kiosk')
    expect(n.hendelser.at(-1)?.tittel).toBe('Fusjon')
  })

  it('litt for lavt gir et motbud du kan godta samme dag', () => {
    const s = dagDer(oppsett(), 'kiosk', 'lavt', 'motbud')
    const n = ok(byPaaBedrift(s, s.rivaler[0].id, 'kiosk', 'lavt'))
    const motbud = n.rivaler[0].bud.kiosk!.motbud!
    expect(motbud).toBeGreaterThan(0)
    expect(n.bedrifter.find((b) => b.type === 'kiosk')!.fusjoner).toBe(0)
    // Ett bud per dag.
    expect(byPaaBedrift(n, n.rivaler[0].id, 'kiosk', 'sjenerost').ok).toBe(false)
    const kontanter = n.kontanter
    const g = ok(godtaMotbud(n, n.rivaler[0].id, 'kiosk'))
    expect(g.kontanter).toBeCloseTo(kontanter - motbud)
    expect(g.bedrifter.find((b) => b.type === 'kiosk')!.fusjoner).toBe(1)
  })

  it('for lavt gir nei, og motbudet gjelder ikke dagen etter', () => {
    const s = dagDer(oppsett(), 'kiosk', 'lavt', 'nei')
    const n = ok(byPaaBedrift(s, s.rivaler[0].id, 'kiosk', 'lavt'))
    expect(n.rivaler[0].bud.kiosk).toMatchObject({ motbud: null })
    expect(godtaMotbud(n, n.rivaler[0].id, 'kiosk').ok).toBe(false)
    // Neste dag kan du prøve igjen.
    const i_morgen = { ...n, sek: n.sek + DAG_SEK }
    expect(byPaaBedrift(i_morgen, n.rivaler[0].id, 'kiosk', 'sjenerost').ok).toBe(true)
  })

  it('krever at du eier bransjen selv, og at du har råd', () => {
    const s = oppsett()
    s.rivaler[0].formue = 1e9
    expect(byPaaBedrift(s, s.rivaler[0].id, 'kafe', 'sjenerost').ok).toBe(false)
    const fattig = { ...s, kontanter: 10 }
    expect(byPaaBedrift(fattig, s.rivaler[0].id, 'kiosk', 'sjenerost').ok).toBe(false)
    expect(byPaaBedrift(s, s.rivaler[0].id, 'oljeselskap', 'sjenerost').ok).toBe(false)
  })

  it('et fiendtlig oppkjøp slår sammen bedriftene i bransjer du eier', () => {
    let s = oppsett()
    const id = s.rivaler[0].id
    for (let i = 0; i < 5; i++) s = ok(kjopRivalblokk(s, id))
    s = ok(overtaRival(s, id))
    const typer = s.rivaler[0].solgt
    expect(typer).toEqual(expect.arrayContaining(['saftbod', 'kiosk']))
    expect(typer).not.toContain('kafe')
    expect(s.bedrifter.find((b) => b.type === 'kiosk')!.fusjoner).toBe(1)
    expect(s.bedrifter.find((b) => b.type === 'saftbod')!.fusjoner).toBe(1)
  })

  it('avisa melder fusjonen dagen etter', () => {
    const s = dagDer(oppsett(), 'kiosk', 'sjenerost', 'ja')
    s.forrigeDag.fusjoner = []
    const n = ok(byPaaBedrift(s, s.rivaler[0].id, 'kiosk', 'sjenerost'))
    gisUtAvis(n, new Terning(1))
    const titler = n.avis.at(-1)!.saker.map((x) => x.tittel)
    expect(titler.some((t) => t.startsWith('Grønn selger kiosken'))).toBe(true)
  })
})

describe('startups', () => {
  /** En rik spiller med ett ferskt selskap i pre-seed. */
  function medStartup(kvalitet = 0.5): Spilltilstand {
    const s = nyttSpill()
    s.kontanter = 1e9
    s.hoyesteFormue = 1e9
    s.startups.push({
      id: 1, ide: 0, runde: 0, verdi: 20e6, andel: 0, investert: 0, investertIRunde: 0,
      kvalitet, inntrykk: 1, status: 'aktiv', startetSek: 0,
    })
    s.nesteStartupId = 2
    return s
  }

  /** En terning som gir samme tall hver gang — styrer utfallet. */
  const fast = (u: number) => ({ neste: () => u, mellom: (a: number, b: number) => a + u * (b - a), sjanse: (p: number) => u < p, velg: <T,>(l: readonly T[]) => l[0], heltall: (a: number) => a }) as unknown as Terning

  it('en investering gir andel etter verdien, og taket per runde holder', () => {
    let s = medStartup()
    const tak = 20e6 * RUNDEANDEL * DIN_DEL_AV_RUNDEN
    expect(ledigIRunde(s.startups[0])).toBe(tak)
    const før = nettoformue(s)
    s = ok(investerIStartup(s, 1, 1e6))
    expect(s.startups[0].andel).toBeCloseTo(1e6 / 20e6)
    expect(nettoformue(s)).toBeCloseTo(før)
    s = ok(investerIStartup(s, 1, 1e12))
    expect(s.startups[0].investertIRunde).toBe(tak)
    expect(investerIStartup(s, 1, 1).ok).toBe(false)
  })

  it('en runde som går bra, øker verdien — men penger fra samme runde vannes ikke ut', () => {
    const s = ok(investerIStartup(medStartup(), 1, 1e6))
    startupsVedDagsskifte(s, fast(0.99))
    const st = s.startups[0]
    expect(st.status).toBe('aktiv')
    expect(st.runde).toBe(1)
    expect(st.verdi).toBeGreaterThan(20e6)
    expect(st.andel).toBeCloseTo(1e6 / 20e6)
    expect(ledigIRunde(st)).toBeGreaterThan(0)
  })

  it('andelen fra en tidligere runde vannes ut av neste', () => {
    const s = ok(investerIStartup(medStartup(), 1, 1e6))
    startupsVedDagsskifte(s, fast(0.99))
    const etterFørste = s.startups[0].andel
    startupsVedDagsskifte(s, fast(0.99))
    expect(s.startups[0].andel).toBeCloseTo(etterFørste * (1 - RUNDEANDEL))
  })

  it('konkurs gjør andelen verdiløs, og avisa og hendelsene melder det', () => {
    const s = ok(investerIStartup(medStartup(), 1, 1e6))
    const saker = startupsVedDagsskifte(s, fast(0.01))
    expect(s.startups[0].status).toBe('konkurs')
    expect(startupverdi(s)).toBe(0)
    expect(saker[0].tittel).toContain('konkurs')
    expect(s.hendelser.at(-1)?.tittel).toBe('Konkurs')
  })

  it('et svakt team går oftere konkurs enn et sterkt', () => {
    const svak = medStartup(0).startups[0]
    const sterk = medStartup(1).startups[0]
    expect(konkursrisiko(svak)).toBeGreaterThan(konkursrisiko(sterk))
  })

  it('etter serie C børsnoteres selskapet og du får andelen utbetalt', () => {
    let s = ok(investerIStartup(medStartup(), 1, 1e6))
    s.startups[0].runde = RUNDER.length - 1
    const verdi = s.startups[0].andel * s.startups[0].verdi
    const kontanter = s.kontanter
    startupsVedDagsskifte(s, fast(0.99))
    const st = s.startups[0]
    expect(st.status).toBe('bors')
    expect(st.utbetalt).toBeGreaterThan(verdi)
    expect(s.kontanter).toBeCloseTo(kontanter + st.utbetalt!)
  })

  it('nye selskaper dukker opp fra 1 million, og aldri flere enn taket', () => {
    const fattig = nyttSpill()
    for (let i = 0; i < 20; i++) startupsVedDagsskifte(fattig, fast(0.99))
    expect(fattig.startups).toHaveLength(0)
    const s = nyttSpill()
    s.hoyesteFormue = 5e6
    // 0.5 sier ja til nye, men nei til konkurs og oppkjøp for runder med lav risiko.
    for (let i = 0; i < 20; i++) startupsVedDagsskifte(s, new Terning(i))
    expect(aktive(s).length).toBeLessThanOrEqual(MAKS_AKTIVE)
    expect(s.startups.length).toBeGreaterThan(0)
  })

  it('går gjennom simuleringen: dagsskiftet avgjør rundene', () => {
    let s = medStartup()
    s = ok(investerIStartup(s, 1, 1e6))
    s = simuler(s, DAG_SEK * 6)
    expect(s.startups.find((x) => x.id === 1)!.status).not.toBe('aktiv')
  })
})

describe('reiser', () => {
  function rikUtenFly(): Spilltilstand {
    const s = nyttSpill()
    s.kontanter = 1e11
    s.hoyesteFormue = 1e11
    return s
  }

  it('utenlands krever flyet som når dit', () => {
    let s = rikUtenFly()
    expect(reiseNivaa(s)).toBe(0)
    const u = kjopEiendomH(s, 'stockholm')
    expect(u.ok).toBe(false)
    if (!u.ok) expect(u.feil).toContain('propellfly')
    s = ok(utvidLager(s, 'hangar'))
    s = ok(kjopLuksus(s, 'propellfly'))
    expect(reiseNivaa(s)).toBe(1)
    s = ok(kjopEiendomH(s, 'stockholm'))
    expect(s.eiendommer.stockholm).toBe(1)
    // Propellflyet når ikke London.
    expect(kjopEiendomH(s, 'london').ok).toBe(false)
  })

  it('et større fly når alt de mindre når', () => {
    let s = rikUtenFly()
    s = ok(utvidLager(s, 'hangar'))
    s = ok(kjopLuksus(s, 'langdistansejet'))
    expect(reiseNivaa(s)).toBe(3)
    for (const id of ['stockholm', 'london', 'newyork'] as const) s = ok(kjopEiendomH(s, id))
    expect(s.eiendommer.newyork).toBe(1)
  })

  it('eiendom du alt eier, beholder du om du selger flyet', () => {
    let s = rikUtenFly()
    s = ok(utvidLager(s, 'hangar'))
    s = ok(kjopLuksus(s, 'propellfly'))
    s = ok(kjopEiendomH(s, 'stockholm'))
    s = ok(selgLuksus(s, 'propellfly'))
    expect(s.eiendommer.stockholm).toBe(1)
    expect(leiePerSek(s)).toBeGreaterThan(0)
    expect(kjopEiendomH(s, 'stockholm').ok).toBe(false)
  })

  it('Verdensborger krever eiendom i alle byene utenlands', () => {
    const s = rikUtenFly()
    for (const id of EIENDOMSSTIGEN) if (EIENDOMSTYPER[id].reise) s.eiendommer[id] = 1
    sjekkPrestasjoner(s)
    expect(s.prestasjoner.utenlands).toBeDefined()
    expect(s.prestasjoner.verdensborger).toBeDefined()
    // Seks byer fra Pakke 11, pluss Marbella og Zermatt fra Pakke 45.
    expect(UTENLANDSBYER).toHaveLength(8)
  })
})
