/** Pakke 40: faner som åpner seg etter hvert, og det neste målet. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { BEDRIFTSTYPER, STIGEN } from '../../engine/innhold'
import { PRESTASJONER } from '../../engine/prestasjoner'
import * as h from '../../engine/handlinger'
import { alleMaal, FANE_AAPNER, faneAapen, kommendeMaal, MILEPAELER, nesteMaal } from '../progresjon'
import { nytt } from '../hendelsesstrom'
import { FANER } from '../komponenter/Fanemeny'
import type { Spilltilstand } from '../../engine/types'

function med(hoyeste: number): Spilltilstand {
  const s = nyttSpill()
  s.hoyesteFormue = hoyeste
  return s
}

const aapne = (s: Spilltilstand) => FANER.filter((f) => faneAapen(s, f.id)).map((f) => f.id)

describe('fanene', () => {
  it('et nytt spill har bare Bedrifter og Profil', () => {
    expect(aapne(nyttSpill())).toEqual(['bedrifter', 'profil'])
  })

  it('åpner ved kr 10 000, kr 50 000 og kr 200 000 — etter høyeste formue, så de aldri låses igjen', () => {
    expect(FANE_AAPNER).toMatchObject({ investeringer: 10_000, luksus: 50_000, eiendom: 200_000 })
    expect(aapne(med(9_999))).toEqual(['bedrifter', 'profil'])
    expect(aapne(med(10_000))).toEqual(['bedrifter', 'investeringer', 'profil'])
    expect(aapne(med(50_000))).toEqual(['bedrifter', 'investeringer', 'luksus', 'profil'])
    expect(aapne(med(200_000))).toHaveLength(5)
    const fattig = med(1e6)
    fattig.kontanter = 0
    expect(aapne(fattig)).toHaveLength(5)
  })

  it('en fane med noe du eier, er åpen uansett', () => {
    const s = { ...med(1e9), kontanter: 1e9 }
    let n = h.kjopPapir(s, Object.keys(s.marked.kurser)[0] as never, 1)
    if (!n.ok) throw new Error(n.feil)
    const aksje = { ...n.tilstand, hoyesteFormue: 1_000 }
    expect(faneAapen(aksje, 'investeringer')).toBe(true)
    n = h.kjopLuksus(s, 'dykkerklokke')
    if (!n.ok) throw new Error(n.feil)
    expect(faneAapen({ ...n.tilstand, hoyesteFormue: 1_000 }, 'luksus')).toBe(true)
    expect(faneAapen({ ...med(1_000), sparing: 5 }, 'investeringer')).toBe(true)
    expect(faneAapen({ ...med(1_000), gjeld: 5 }, 'investeringer')).toBe(true)
    expect(faneAapen({ ...med(1_000), eiendommer: { hybel: 1 } }, 'eiendom')).toBe(true)
  })

  it('hendelsesstrømmen melder en fane som åpner — bare én gang', () => {
    const før = med(9_900)
    const etter = med(10_100)
    expect(nytt(før, etter).filter((f) => f.type === 'fane')).toEqual([{ type: 'fane', fane: 'investeringer' }])
    expect(nytt(etter, med(10_200)).filter((f) => f.type === 'fane')).toEqual([])
    // Etter lang tid borte kan flere åpne på en gang.
    expect(nytt(med(1_000), med(300_000)).filter((f) => f.type === 'fane')).toHaveLength(3)
  })
})

describe('det neste målet', () => {
  it('starter med Pølseboden, og fem sifre åpner Investeringer', () => {
    const start = nesteMaal(nyttSpill())!
    expect(start.belop).toBe(BEDRIFTSTYPER.polsebod.laasesOppVed)
    expect(start.maal[0].tekst).toBe('Pølsebod')
    const n = nesteMaal(med(9_500))!
    expect(n.belop).toBe(10_000)
    expect(n.maal.map((m) => m.tekst)).toEqual(['Investeringer åpner', 'Fem sifre'])
  })

  it('fremdriften går fra forrige mål til neste, 0–1', () => {
    expect(nesteMaal(med(10_000))!.andel).toBeCloseTo(0)
    const midt = nesteMaal(med(Math.sqrt(10_000 * 50_000)))!
    expect(midt.belop).toBe(50_000)
    expect(midt.andel).toBeCloseTo(0.5)
  })

  it('hver låst bransje, fane og formuemilepæl er et mål, i stigende rekkefølge', () => {
    const maal = alleMaal()
    for (const id of STIGEN.filter((x) => BEDRIFTSTYPER[x].laasesOppVed > 0)) {
      expect(maal.some((m) => m.art === 'bedrift' && m.belop === BEDRIFTSTYPER[id].laasesOppVed)).toBe(true)
    }
    expect(maal.filter((m) => m.art === 'fane')).toHaveLength(3)
    expect(maal.every((m, i) => i === 0 || m.belop >= maal[i - 1].belop)).toBe(true)
  })

  it('milepælene heter det samme som prestasjonene', () => {
    for (const m of MILEPAELER.filter((x) => x.belop <= 1e9)) {
      expect(PRESTASJONER.some((p) => p.navn === m.navn)).toBe(true)
    }
  })

  it('går videre etter milliarden og slutter når alt er nådd', () => {
    expect(nesteMaal(med(2e9))!.belop).toBeGreaterThan(2e9)
    const sist = Math.max(...alleMaal().map((m) => m.belop))
    expect(nesteMaal(med(sist))).toBeNull()
    expect(kommendeMaal(med(sist))).toEqual([])
  })

  it('lista på Profil samler mål med samme beløp', () => {
    const liste = kommendeMaal(med(5_000), 3)
    expect(liste).toHaveLength(3)
    expect(liste[0].belop).toBe(9_000)
    expect(liste[1]).toMatchObject({ belop: 10_000 })
    expect(liste[1].maal).toHaveLength(2)
  })
})
