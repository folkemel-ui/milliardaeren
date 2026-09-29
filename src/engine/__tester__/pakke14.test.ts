/** Pakke 14: indeksfond, kvartalsrapporter og kursdetaljer. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopFond, kjopPapir, laan, selgFond, selgPapir, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import { DAG_SEK, dato, erHelg } from '../kalender'
import { AKSJER, KRYPTO, PAPIRER, registrerDagslutt } from '../marked'
import { FOND, FOND_GEBYR, fondshistorikk, fondskurs, fondsutbytteIDag, fondverdi } from '../fond'
import { ESTIMAT_DAGER, estimat, kvartalVedDagsskifte, nesteRapport, RAPPORTDAG, rapportdagI, rapportkalender, resultat } from '../kvartal'
import { sjekkMargin } from '../bank'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e8
  s.hoyesteFormue = 1e8
  return s
}

describe('indeksfond', () => {
  it('fondskursen er snittet av medlemmenes stigning, ganger 100', () => {
    const s = rik()
    for (const id of AKSJER) s.marked.kurser[id].kurs = PAPIRER[id].startkurs
    expect(fondskurs(s, 'BORSFOND')).toBeCloseTo(100)
    s.marked.kurser.NFS.kurs = PAPIRER.NFS.startkurs * 2
    expect(fondskurs(s, 'BORSFOND')).toBeCloseTo(100 + 100 / AKSJER.length)
    expect(FOND.KRYPTOFOND.medlemmer).toEqual(KRYPTO)
  })

  it('kjøp koster bare gebyret og flytter ingen kurser', () => {
    let s = rik()
    const før = nettoformue(s)
    const kurser = AKSJER.map((id) => s.marked.kurser[id].kurs)
    s = ok(kjopFond(s, 'BORSFOND', 1e7))
    expect(nettoformue(s)).toBeCloseTo(før - 1e7 * (1 - 1 / (1 + FOND_GEBYR)), 0)
    expect(AKSJER.map((id) => s.marked.kurser[id].kurs)).toEqual(kurser)
    expect(fondverdi(s)).toBeCloseTo(1e7 / (1 + FOND_GEBYR), 0)
  })

  it('salg av halvparten og av resten', () => {
    let s = ok(kjopFond(rik(), 'KRYPTOFOND', 1e6))
    const verdi = fondverdi(s)
    s = ok(selgFond(s, 'KRYPTOFOND', verdi / 2))
    expect(fondverdi(s)).toBeCloseTo(verdi / 2, 0)
    s = ok(selgFond(s, 'KRYPTOFOND'))
    expect(s.fond.KRYPTOFOND).toBeUndefined()
    expect(selgFond(s, 'KRYPTOFOND').ok).toBe(false)
  })

  it('børsfondet er stengt i helgen, kryptofondet ikke', () => {
    const s = rik()
    s.sek = DAG_SEK * 5 + 10
    expect(erHelg(s.sek)).toBe(true)
    expect(kjopFond(s, 'BORSFOND', 1000).ok).toBe(false)
    expect(kjopFond(s, 'KRYPTOFOND', 1000).ok).toBe(true)
  })

  it('børsfondet gir utbytte, og svinger mindre enn aksjene hver for seg', () => {
    const s = ok(kjopFond(rik(), 'BORSFOND', 1e7))
    expect(fondsutbytteIDag(s)).toBeGreaterThan(0)
    const n = simuler(s, 3600)
    const endring = (h: number[]) => h.slice(1).map((v, i) => Math.abs(Math.log(v / h[i])))
    const snitt = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
    const fond = snitt(endring(fondshistorikk(n, 'BORSFOND')))
    const verste = Math.max(...AKSJER.map((id) => snitt(endring(n.marked.kurser[id].historikk))))
    expect(fond).toBeLessThan(verste)
  })

  it('marginkrav selger fondene når lånet blir for stort', () => {
    let s = rik()
    s = ok(laan(s, 5e7))
    s = ok(kjopFond(s, 'BORSFOND', s.kontanter))
    // Fondet halveres i verdi.
    for (const id of AKSJER) {
      const k = s.marked.kurser[id]
      k.kurs /= 4
    }
    sjekkMargin(s)
    expect(s.fond.BORSFOND).toBeUndefined()
  })
})

describe('kvartalsrapporter', () => {
  it('hvert selskap har én rapportdag i måneden, på en børsdag', () => {
    for (const id of AKSJER) {
      expect(RAPPORTDAG[id]).toBeDefined()
      for (let m = 0; m < 12; m++) {
        const d = rapportdagI(id, 2027, m)
        expect(erHelg(d * DAG_SEK)).toBe(false)
        expect(dato(d).maaned).toBe(m)
      }
    }
  })

  it('neste rapport er i dag eller senere, og ruller over til neste måned', () => {
    const d = rapportdagI('NFS', 2027, 0)
    expect(nesteRapport('NFS', d)).toBe(d)
    expect(nesteRapport('NFS', d + 1)).toBe(rapportdagI('NFS', 2027, 1))
    expect(nesteRapport('NFS', rapportdagI('NFS', 2027, 11) + 1)).toBe(rapportdagI('NFS', 2028, 0))
  })

  it('estimat og resultat er faste for en gitt dag, og resultatet ligger rundt estimatet', () => {
    const d = rapportdagI('POL', 2027, 3)
    expect(estimat('POL', d)).toBe(estimat('POL', d))
    expect(resultat('POL', d)).toEqual(resultat('POL', d))
    const utfall = new Set<string>()
    for (let m = 0; m < 12; m++) for (const id of AKSJER) utfall.add(resultat(id, rapportdagI(id, 2027, m)).utfall)
    expect(utfall).toEqual(new Set(['bedre', 'ventet', 'svakere']))
  })

  it('på rapportdagen kommer tallene: kursen prises om, utbyttet justeres, avisa melder', () => {
    const s = rik()
    const d = rapportdagI('FJK', 2027, 0)
    s.sek = d * DAG_SEK
    const saker = kvartalVedDagsskifte(s)
    const r = s.kvartal.FJK!.siste!
    expect(r.dag).toBe(d)
    expect(r.utfall).toBe(resultat('FJK', d).utfall)
    expect(saker.some((x) => x.tittel.startsWith('Fjellkraft:'))).toBe(true)
    expect(s.marked.kurser.FJK.nyhet).toBeDefined()
    if (r.utfall === 'bedre') expect(s.kvartal.FJK!.utbytteFaktor).toBeGreaterThan(1)
    if (r.utfall === 'svakere') expect(s.kvartal.FJK!.utbytteFaktor).toBeLessThan(1)
  })

  it('estimatet kommer i avisa noen dager før', () => {
    const s = rik()
    const d = rapportdagI('VTK', 2027, 1)
    s.sek = (d - ESTIMAT_DAGER) * DAG_SEK
    const saker = kvartalVedDagsskifte(s)
    expect(saker.some((x) => x.tittel.startsWith('Vikingtelekom legger frem tall'))).toBe(true)
  })

  it('kalenderen viser de neste rapportene i rekkefølge, med estimat bare når det er kjent', () => {
    const s = rik()
    const liste = rapportkalender(s, 31)
    expect(liste.length).toBe(AKSJER.length)
    for (let i = 1; i < liste.length; i++) expect(liste[i].dag).toBeGreaterThanOrEqual(liste[i - 1].dag)
    const i_dag = 0
    for (const r of liste) expect(r.estimat === null).toBe(r.dag - i_dag > ESTIMAT_DAGER)
  })
})

describe('kursdetaljer', () => {
  it('høyeste og laveste kurs følger med, og sluttkursene samles per dag', () => {
    let s = rik()
    const k = s.marked.kurser.NLT
    expect(k.topp).toBeGreaterThanOrEqual(k.kurs)
    expect(k.bunn).toBeLessThanOrEqual(k.kurs)
    s = simuler(s, DAG_SEK * 3)
    expect(s.marked.kurser.NLT.dagslutt).toHaveLength(3)
    registrerDagslutt(s.marked)
    expect(s.marked.kurser.NLT.dagslutt).toHaveLength(4)
  })

  it('handlene logges til merkene på grafen', () => {
    let s = rik()
    s = ok(kjopPapir(s, 'NFS', 10))
    s = ok(selgPapir(s, 'NFS', 4))
    expect(s.handler.map((h) => h.antall)).toEqual([10, -4])
    expect(s.handler[0].papir).toBe('NFS')
  })
})
