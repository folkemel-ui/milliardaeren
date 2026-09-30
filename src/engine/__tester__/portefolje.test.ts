import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopPapir, settInn, taUt } from '../handlinger'
import { belaaningsgrad, maksKjop, nettoformue, nettoPerSek } from '../formler'
import { SPARERENTE_PER_TIME, MARGINKRAV } from '../innhold'
import { portefolje, sum } from '../portefolje'
import { EIENDOMSTYPER, MEGLERHONORAR } from '../eiendom'
import { kjopEiendom, laanUtenTak, selgEiendom } from './hjelp'
import { DAG_SEK } from '../kalender'
import type { Spilltilstand } from '../types'

function rik(kontanter = 1e7): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  return s
}

function ok(u: ReturnType<typeof settInn>): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

describe('sparekontoen', () => {
  it('innskudd og uttak flytter penger uten å endre formuen', () => {
    const s = rik(100_000)
    const inne = ok(settInn(s, 60_000))
    expect(inne.kontanter).toBe(40_000)
    expect(inne.sparing).toBe(60_000)
    expect(nettoformue(inne)).toBe(nettoformue(s))
    const ute = ok(taUt(inne, 1e12))
    expect(ute.sparing).toBe(0)
    expect(ute.kontanter).toBe(100_000)
  })

  it('gir 1 % rente per time, lagt til hvert sekund', () => {
    const s = ok(settInn(rik(1_000_000), 1_000_000))
    const etter = simuler(s, 3600, true)
    // Renters rente sekund for sekund gir litt over 1 % (1,005 %).
    expect(etter.sparing / 1_000_000 - 1).toBeCloseTo(SPARERENTE_PER_TIME, 3)
    expect(etter.totaltSparerente).toBeCloseTo(etter.sparing - 1_000_000)
  })

  it('renten vises i inntekt per sekund', () => {
    const s = rik(1_000_000)
    const inne = ok(settInn(s, 360_000))
    expect(nettoPerSek(inne) - nettoPerSek(s)).toBeCloseTo((360_000 * SPARERENTE_PER_TIME) / 3600)
  })

  it('banken tar sparepengene først ved marginkrav', () => {
    let s = laanUtenTak(rik(10_000))
    // Halvparten i krypto, resten på sparekontoen.
    const u = kjopPapir(s, 'LKS', Math.floor(maksKjop(s, 'LKS') / 2))
    if (!u.ok) throw new Error(u.feil)
    s = ok(settInn(u.tilstand, u.tilstand.kontanter))
    // Krakk: kryptoen faller 80 %.
    const k = s.marked.kurser.LKS
    k.avvik += Math.log(0.2)
    k.kurs *= 0.2
    expect(belaaningsgrad(s)).toBeGreaterThan(MARGINKRAV)
    const etter = simuler(s, 1)
    expect(etter.sparing).toBe(0)
  })
})

describe('regnskap per bedrift', () => {
  it('bedriftene fører det de tjener, og summen stemmer med totalen', () => {
    const s = simuler(nyttSpill(), 600)
    const sumTjent = s.bedrifter.reduce((a, b) => a + b.tjent, 0)
    expect(sumTjent).toBeCloseTo(s.totaltTjent, 6)
  })

  it('måler inntekten hvert minutt', () => {
    const s = simuler(nyttSpill(), 600)
    expect(s.bedrifter[0].inntektHistorikk).toEqual(Array(10).fill(1))
  })

  it('uten leder står bedriften på null mens du er borte — også i historikken', () => {
    const s = simuler(nyttSpill(), 120, true)
    expect(s.bedrifter[0].tjent).toBe(0)
    expect(s.bedrifter[0].inntektHistorikk).toEqual([0, 0])
  })
})

describe('porteføljen', () => {
  it('følger verdi og kostpris for aksjer', () => {
    const u = kjopPapir(rik(), 'NFS', 1000)
    if (!u.ok) throw new Error(u.feil)
    const [aksjer] = portefolje(u.tilstand)
    expect(aksjer.verdi).toBeCloseTo(1000 * u.tilstand.marked.kurser.NFS.kurs)
    expect(aksjer.kostpris).toBeCloseTo(u.tilstand.beholdning.NFS!.kostpris)
  })

  it('et kjøp i dag teller ikke som gevinst i dag — bare kursen etter kjøpet gjør det', () => {
    const s = simuler(rik(), 60)
    // Kursen har steget 20 % siden dagens start før vi kjøper. Flyttes via
    // avviket, slik markedet gjør, så handelen regner fra samme kurs.
    const start = s.marked.kurser.NFS
    start.avvik += Math.log((s.forrigeDag.kurser.NFS * 1.2) / start.kurs)
    start.kurs = start.fundament * Math.exp(start.avvik)
    const u = kjopPapir(s, 'NFS', 1000)
    if (!u.ok) throw new Error(u.feil)
    const [etterKjøp] = portefolje(u.tilstand)
    // Bare kurtasje og kurstrykk: litt negativt, aldri +20 %.
    expect(etterKjøp.iDag).toBeLessThanOrEqual(0)
    expect(etterKjøp.iDag).toBeGreaterThan(-0.01 * etterKjøp.verdi)
    // Stiger kursen 10 % etter kjøpet, er det den gevinsten som vises.
    const k = u.tilstand.marked.kurser.NFS
    const før = portefolje(u.tilstand)[0]
    k.kurs *= 1.1
    expect(portefolje(u.tilstand)[0].iDag - før.iDag).toBeCloseTo(før.verdi * 0.1)
  })

  it('«i dag» nullstilles ved dagsskiftet', () => {
    const u = kjopPapir(rik(), 'NFS', 1000)
    if (!u.ok) throw new Error(u.feil)
    const neste = simuler(u.tilstand, DAG_SEK)
    expect(neste.dagensFlyt).toEqual({ aksje: 0, krypto: 0, eiendom: 0, rival: 0, startup: 0, sparing: 0, fond: 0 })
    expect(neste.forrigeDag.verdier.aksje).toBeGreaterThan(0)
  })

  it('sparerenten er dagens endring på sparekontoen, ikke innskuddet', () => {
    const s = ok(settInn(rik(1_000_000), 1_000_000))
    const etter = simuler(s, 60, true)
    const sparing = portefolje(etter).find((p) => p.klasse === 'sparing')!
    expect(sparing.iDag).toBeCloseTo(etter.totaltSparerente)
  })

  it('husker hva eiendommene kostet, også etter delvis salg', () => {
    let s = kjopEiendom(rik(), 'hybel')
    s = kjopEiendom(s, 'hybel')
    const pris = EIENDOMSTYPER.hybel.pris * s.marked.eiendom.kurs
    expect(s.eiendomKostpris.hybel).toBeCloseTo(2 * pris, 0)
    s = selgEiendom(s, 'hybel')
    expect(s.eiendomKostpris.hybel).toBeCloseTo(pris, 0)
    // Salg rett etter kjøp taper meglerhonoraret.
    expect(MEGLERHONORAR).toBeGreaterThan(0)
    s = selgEiendom(s, 'hybel')
    expect(s.eiendomKostpris.hybel).toBeUndefined()
  })

  it('summerer alle klassene', () => {
    let s = kjopEiendom(rik(), 'hybel')
    s = ok(settInn(s, 100_000))
    const total = sum(portefolje(s))
    expect(total.verdi).toBeCloseTo(s.sparing + EIENDOMSTYPER.hybel.pris * s.marked.eiendom.kurs)
  })
})
