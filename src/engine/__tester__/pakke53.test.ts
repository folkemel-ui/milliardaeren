/**
 * Pakke 53 — penger som henger sammen: aksjer knyttet til bransjene dine, og
 * statsobligasjoner som følger styringsrenten.
 */

import { describe, expect, it } from 'vitest'
import { AKSJE_FOR, bransjenyhet, NYHET_DAGER, nyhetsfaktor, TRENDDRIFT, trenddrift } from '../bransjer'
import { kupongPerSek, kupongsats, obligasjonsverdi, obligasjonsverdiFor } from '../obligasjoner'
import { FASE_DAGER, faseI, styringsrente, ukensTrend } from '../verden'
import { DAG_SEK } from '../kalender'
import { markedstikk, MARKED_TIKK_SEK, PAPIRER } from '../marked'
import { bedriftInntektIDag, bedriftInntektPerSek, dagensFaktor, nettoformue, statusfaktor } from '../formler'
import { kjopBedrift, kjopObligasjon, selgObligasjon } from '../handlinger'
import { simuler } from '../simulering'
import { sjekkMargin } from '../bank'
import { Terning } from '../rng'
import { nyttSpill } from '../start'
import { SPARERENTE_PER_TIME } from '../innhold'
import { laanUtenTak } from './hjelp'
import type { Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill på første dag i en periode med en gitt fase. */
function iFase(fase: 'hoy' | 'normal' | 'lav'): Spilltilstand {
  const s = nyttSpill()
  const p = Array.from({ length: 60 }, (_, i) => i).find((i) => faseI(s, i) === fase)!
  s.sek = p * FASE_DAGER * DAG_SEK
  s.kontanter = 1e9
  return s
}

describe('aksjene og bransjene', () => {
  it('seks aksjer hører til en bransje du kan eie', () => {
    expect(AKSJE_FOR).toEqual({ fiskeoppdrett: 'NFS', rederi: 'BSH', oljeselskap: 'POL', bank: 'NRB', kiosk: 'KRV', flyselskap: 'FJF' })
    for (const id of Object.values(AKSJE_FOR)) expect(PAPIRER[id!].klasse).toBe('aksje')
  })

  it('ukas hete bransje gir aksjen +4 %/t og den kalde −4 %/t', () => {
    const s = nyttSpill()
    // Finn en uke der en bransje med aksje er het.
    const dag = Array.from({ length: 400 }, (_, i) => i * 7).find((d) => {
      const t = ukensTrend(s, d)
      return t.het !== null && AKSJE_FOR[t.het] !== undefined
    })!
    s.sek = dag * DAG_SEK
    const het = AKSJE_FOR[ukensTrend(s).het!]!
    expect(trenddrift(s)[het]).toBe(TRENDDRIFT)
    // Samme terning, med og uten trenden: bare fundamentet til aksjen skiller seg.
    const med = structuredClone(s.marked)
    const uten = structuredClone(s.marked)
    markedstikk(med, new Terning(7), false, { aksjer: 0, eiendom: 0, papirer: { [het]: TRENDDRIFT } })
    markedstikk(uten, new Terning(7), false, { aksjer: 0, eiendom: 0 })
    expect(med.kurser[het].fundament / uten.kurser[het].fundament).toBeCloseTo(Math.exp((TRENDDRIFT * MARKED_TIKK_SEK) / 3600), 12)
    const annen = (Object.keys(PAPIRER) as (keyof typeof PAPIRER)[]).find((x) => x !== het)!
    expect(med.kurser[annen].kurs).toBe(uten.kurser[annen].kurs)
  })

  it('en god nyhet gir bedriften i bransjen +10 % i tre dager — bare når du eier den', () => {
    let s = nyttSpill()
    s.kontanter = 1e7
    s.hoyesteFormue = 1e7
    expect(bransjenyhet(structuredClone(s), 'KRV', true)).toBeNull()
    s = ok(kjopBedrift(s, 'kiosk'))
    const n = structuredClone(s)
    expect(bransjenyhet(n, 'KRV', true)).toMatch(/\+10 %/)
    expect(nyhetsfaktor(n, 'kiosk')).toBeCloseTo(1.1)
    expect(nyhetsfaktor(n, 'saftbod')).toBe(1)
    const kiosk = n.bedrifter.find((b) => b.type === 'kiosk')!
    expect(bedriftInntektIDag(n, kiosk)).toBeCloseTo(bedriftInntektPerSek(kiosk, dagensFaktor(n, 'kiosk')) * statusfaktor(n))
    expect(dagensFaktor(n, 'kiosk') / dagensFaktor(s, 'kiosk')).toBeCloseTo(1.1)
    // Etter tre dager er den borte.
    const senere = { ...n, sek: n.sek + NYHET_DAGER * DAG_SEK }
    expect(nyhetsfaktor(senere, 'kiosk')).toBe(1)
  })

  it('en dårlig nyhet gir −10 %', () => {
    let s = nyttSpill()
    s.kontanter = 1e7
    s.hoyesteFormue = 1e7
    s = ok(kjopBedrift(s, 'kiosk'))
    bransjenyhet(s, 'KRV', false)
    expect(nyhetsfaktor(s, 'kiosk')).toBeCloseTo(0.9)
  })
})

describe('statsobligasjoner', () => {
  it('kjøpes til pålydende, og den lange faller rundt 8 % når renten stiger ett poeng', () => {
    const normal = iFase('normal')
    const s = ok(kjopObligasjon(normal, 'lang', 1_000_000))
    expect(obligasjonsverdiFor(s, 'lang')).toBeCloseTo(1_000_000)
    expect(nettoformue(s)).toBeCloseTo(nettoformue(normal))
    // Samme post i en høykonjunktur: styringsrenten er 5 %.
    const hoy = { ...s, sek: iFase('hoy').sek }
    expect(styringsrente(hoy)).toBe(5)
    expect(obligasjonsverdiFor(hoy, 'lang') / 1_000_000).toBeCloseTo(1 - 0.08)
    // Og i en lavkonjunktur (2,5 %) stiger den.
    const lav = { ...s, sek: iFase('lav').sek }
    expect(obligasjonsverdiFor(lav, 'lang') / 1_000_000).toBeCloseTo(1 + 0.12)
    // Den korte svinger fire ganger mindre.
    const kort = ok(kjopObligasjon(normal, 'kort', 1_000_000))
    expect(obligasjonsverdiFor({ ...kort, sek: hoy.sek }, 'kort') / 1_000_000).toBeCloseTo(0.98)
  })

  it('kupongen er låst til renten ved kjøp og betales hvert sekund som utbytte', () => {
    const s = ok(kjopObligasjon(iFase('hoy'), 'lang', 3_600_000))
    expect(kupongsats('lang', 5)).toBeCloseTo(SPARERENTE_PER_TIME * (5 / 4) * 1.25)
    expect(kupongPerSek(s)).toBeCloseTo(3_600_000 * kupongsats('lang', 5) / 3600)
    // Låst: samme kupong selv om renten senere faller.
    expect(kupongPerSek({ ...s, sek: iFase('lav').sek })).toBeCloseTo(kupongPerSek(s))
    const etter = simuler(s, 10)
    expect(etter.totaltUtbytte - s.totaltUtbytte).toBeGreaterThanOrEqual(kupongPerSek(s) * 10 * 0.999)
  })

  it('to kjøp til ulik rente er verdt det samme som to poster hver for seg', () => {
    const a = ok(kjopObligasjon(iFase('hoy'), 'lang', 1_000_000))
    const b = ok(kjopObligasjon({ ...a, sek: iFase('lav').sek }, 'lang', 2_000_000))
    const post = b.obligasjoner!.lang!
    expect(post.palydende).toBe(3_000_000)
    expect(post.rente).toBeCloseTo((1_000_000 * 5 + 2_000_000 * 2.5) / 3_000_000)
    // I normale tider: den første (låst 5 %) er verdt 1,08 mill, den andre (2,5 %) 2 mill · 0,88.
    const normal = { ...b, sek: iFase('normal').sek }
    expect(obligasjonsverdiFor(normal, 'lang')).toBeCloseTo(1_000_000 * 1.08 + 2_000_000 * 0.88)
  })

  it('salg gir verdien minus gebyret og bokfører gevinsten', () => {
    const s = ok(kjopObligasjon(iFase('hoy'), 'lang', 1_000_000))
    const lav = { ...s, sek: iFase('lav').sek }
    const solgt = ok(selgObligasjon(lav, 'lang', 1))
    const verdi = 1_000_000 * (1 + 0.08 * 2.5)
    expect(solgt.kontanter - lav.kontanter).toBeCloseTo(verdi * 0.999)
    expect(solgt.totaltGevinst - lav.totaltGevinst).toBeCloseTo(verdi * 0.999 - 1_000_000)
    expect(solgt.obligasjoner?.lang).toBeUndefined()
    expect(obligasjonsverdi(solgt)).toBe(0)
  })

  it('marginkravet selger obligasjonene', () => {
    let s = ok(kjopObligasjon(iFase('normal'), 'kort', 1_000_000))
    s.kontanter = 0
    s = laanUtenTak(s, 2_000_000)
    s.kontanter = 0
    sjekkMargin(s)
    expect(s.obligasjoner?.kort).toBeUndefined()
  })
})
