import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { ansettLeder, kjopKlubb, kjopPapir, type Utfall } from '../../engine/handlinger'
import { BORTE_TAK_SEK } from '../../engine/innhold'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import { KLUBBNAVN } from '../../engine/klubb'
import { oppsummer } from '../velkomst'
import type { Kamp, Spilltilstand } from '../../engine/types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill med leder på saftboden, aksjer, og en fotballklubb. */
function oppsett(): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  s = ok(ansettLeder(s, s.bedrifter[0].id))
  s = ok(kjopPapir(s, 'NFS', 1000))
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

describe('velkomsten', () => {
  it('summerer det som kom inn, og formuen før og etter', () => {
    const før = oppsett()
    const etter = simuler(før, 3 * DAG_SEK, true)
    const o = oppsummer(før, etter, 3 * DAG_SEK)
    expect(o.bedrifter).toBeGreaterThan(0)
    expect(o.bedrifter).toBeCloseTo(etter.totaltTjent - før.totaltTjent)
    expect(o.utbytte).toBeGreaterThan(0)
    expect(o.formueEtter).not.toBe(o.formueFor)
    expect(o.telteSek).toBe(o.borteSek)
  })

  it('teller nye aviser, kamper og hendelser — og ikke de gamle', () => {
    const før = simuler(oppsett(), DAG_SEK)
    const etter = simuler(før, 2 * DAG_SEK, true)
    const o = oppsummer(før, etter, 2 * DAG_SEK)
    expect(o.nyeAviser).toBe(2)
    // Pakke 86: kampen som var i gang da du gikk, er ny; den som spilles nå, venter.
    const nokkel = (k: Kamp) => `${k.sesong}-${k.turnering ?? 'serie'}-${k.runde}`
    const iGang = før.klubb!.kamper.filter((k) => k.dag === dagnummer(før.sek)).map(nokkel)
    expect(iGang.length).toBeGreaterThan(0)
    for (const n of iGang) expect(o.kamper.map(nokkel)).toContain(n)
    expect(o.kamper.some((k) => k.dag === dagnummer(etter.sek))).toBe(false)
    expect(o.kamper.filter((k) => !k.turnering)).toHaveLength(2)
  })

  it('sier fra når tiden borte er lengre enn det som telles', () => {
    const før = oppsett()
    const o = oppsummer(før, før, BORTE_TAK_SEK * 3)
    expect(o.telteSek).toBe(BORTE_TAK_SEK)
    expect(o.borteSek).toBeGreaterThan(o.telteSek)
    expect(o.nyeAviser).toBe(0)
    expect(o.kamper).toEqual([])
    expect(o.prestasjoner).toEqual([])
  })

  it('finner nye prestasjoner', () => {
    const før = nyttSpill()
    const etter = structuredClone(før)
    etter.prestasjoner.millionaer = 1
    expect(oppsummer(før, etter, 600).prestasjoner).toEqual([{ navn: 'Millionær' }])
  })
})
