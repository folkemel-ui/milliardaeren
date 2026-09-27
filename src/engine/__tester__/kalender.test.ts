import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { kjopPapir, selgPapir } from '../handlinger'
import { DAG_SEK, dagnummer, erHelg, ukedag } from '../kalender'
import { MAKS_UTGAVER } from '../avis'
import { PRESTASJONER } from '../prestasjoner'
import { kjopEiendom, kjopLuksus } from './hjelp'
import type { Spilltilstand } from '../types'

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  return s
}

/** Første sekund av en lørdag. */
const LØRDAG = 5 * DAG_SEK

describe('kalenderen', () => {
  it('starter på en mandag, og helgen er lørdag og søndag', () => {
    expect(ukedag(0)).toBe(0)
    expect(erHelg(4 * DAG_SEK)).toBe(false)
    expect(erHelg(LØRDAG)).toBe(true)
    expect(erHelg(7 * DAG_SEK - 1)).toBe(true)
    expect(erHelg(7 * DAG_SEK)).toBe(false)
    expect(dagnummer(7 * DAG_SEK)).toBe(7)
  })

  it('børsen er stengt i helgen: aksjene står stille og kan ikke handles, kryptoen går', () => {
    const fredag = simuler(rik(), LØRDAG - 1)
    const s = simuler(fredag, DAG_SEK)
    expect(erHelg(s.sek)).toBe(true)
    expect(s.marked.kurser.NLT.kurs).toBe(simuler(fredag, 1).marked.kurser.NLT.kurs)
    expect(s.marked.kurser.BMT.kurs).not.toBe(fredag.marked.kurser.BMT.kurs)
    const u = kjopPapir(s, 'NLT', 1)
    expect(u.ok).toBe(false)
    if (!u.ok) expect(u.feil).toMatch(/stengt/)
    expect(kjopPapir(s, 'BMT', 0.01).ok).toBe(true)
  })

  it('utbytte kommer bare på børsdager', () => {
    const u = kjopPapir(rik(), 'FJK', 10_000)
    if (!u.ok) throw new Error(u.feil)
    const fredag = simuler(u.tilstand, LØRDAG - 1)
    const mandag = simuler(fredag, 2 * DAG_SEK)
    expect(mandag.totaltUtbytte).toBe(fredag.totaltUtbytte)
    const tirsdag = simuler(mandag, 2)
    expect(tirsdag.totaltUtbytte).toBeGreaterThan(mandag.totaltUtbytte)
  })
})

describe('avisen', () => {
  it('kommer ut hver dag, med minst tre saker, og husker de siste sju', () => {
    const s = simuler(nyttSpill(), 10 * DAG_SEK)
    expect(s.avis).toHaveLength(MAKS_UTGAVER)
    expect(s.avis.map((u) => u.dag)).toEqual([4, 5, 6, 7, 8, 9, 10])
    for (const u of s.avis) expect(u.saker.length).toBeGreaterThanOrEqual(3)
  })

  it('skriver om det du har gjort siden forrige utgave', () => {
    let s = rik()
    s = kjopEiendom(s, 'leilighet')
    s = kjopLuksus(s, 'gullklokke')
    const etter = simuler(s, DAG_SEK)
    const titler = etter.avis[0].saker.map((x) => x.tittel)
    expect(titler.some((t) => t.includes('kjøper eiendom'))).toBe(true)
    expect(titler.some((t) => t.includes('gullklokke'))).toBe(true)
  })

  it('er deterministisk', () => {
    expect(simuler(nyttSpill(5), 3 * DAG_SEK).avis).toEqual(simuler(nyttSpill(5), 3 * DAG_SEK).avis)
  })
})

describe('prestasjoner og rekorder', () => {
  it('stemples én gang, med tidspunktet', () => {
    const s = simuler(rik(), 3)
    expect(s.prestasjoner['fem-sifre']).toBe(1)
    const senere = simuler(s, 10)
    expect(senere.prestasjoner['fem-sifre']).toBe(1)
  })

  it('alle prestasjonene har unike id-er', () => {
    const ider = PRESTASJONER.map((p) => p.id)
    expect(new Set(ider).size).toBe(ider.length)
  })

  it('rekordboka husker største handel og gevinst', () => {
    const s = rik()
    const kjøp = kjopPapir(s, 'NFS', 1000)
    if (!kjøp.ok) throw new Error(kjøp.feil)
    expect(kjøp.tilstand.rekorder.storsteHandel).toBeGreaterThan(180_000)
    // Pump kursen litt og selg med gevinst.
    kjøp.tilstand.marked.kurser.NFS.kurs *= 1.5
    const salg = selgPapir(kjøp.tilstand, 'NFS', 1000)
    if (!salg.ok) throw new Error(salg.feil)
    expect(salg.tilstand.rekorder.storsteGevinst).toBeGreaterThan(50_000)
  })
})
