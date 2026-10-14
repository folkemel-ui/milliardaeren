/** Pakke 101: avisa — analytikere som betyr noe, din største post, rentemøtet på forsiden og flere tekster. */

import { describe, expect, it } from 'vitest'
import { fulltSpill } from './hjelp'
import { nyttSpill } from '../start'
import { gisUtAvis, lagDagsbilde, omMarkedet } from '../avis'
import { kjopPapir } from '../handlinger'
import { DAG_SEK } from '../kalender'
import { ESTIMAT_SKJEVHET, estimat, kvartalssaker, nesteRapport, resultat } from '../kvartal'
import { AKSJER } from '../marked'
import { Terning } from '../rng'
import { FASE_DAGER, faseI, verdenssaker } from '../verden'
import type { PapirId, Spilltilstand } from '../types'

describe('analytikernes estimater', () => {
  it('«Sterkt» slår estimatet oftere enn det skuffer, «Svakt» omvendt, «Som i fjor» likt — over 40 år og alle aksjene', () => {
    const telling = [0, 1, 2].map(() => ({ bedre: 0, svakere: 0, ventet: 0, n: 0, sum: 0 }))
    for (const id of AKSJER) {
      for (let d = nesteRapport(id, 0); d < 40 * 365; d = nesteRapport(id, d + 1)) {
        const e = estimat(id, d)
        const r = resultat(id, d)
        telling[e][r.utfall]++
        telling[e].n++
        telling[e].sum += r.overraskelse
      }
    }
    const andel = (e: number, u: 'bedre' | 'svakere') => telling[e][u] / telling[e].n
    // Teorien: (0,32 ± 0,06) / 0,8 = 47,5 % og 32,5 %; «Som i fjor» 40/40.
    expect(andel(2, 'bedre')).toBeGreaterThan(0.44)
    expect(andel(2, 'bedre')).toBeLessThan(0.51)
    expect(andel(2, 'svakere')).toBeGreaterThan(0.29)
    expect(andel(2, 'svakere')).toBeLessThan(0.36)
    expect(andel(0, 'svakere')).toBeGreaterThan(0.44)
    expect(andel(0, 'bedre')).toBeLessThan(0.36)
    expect(Math.abs(andel(1, 'bedre') - andel(1, 'svakere'))).toBeLessThan(0.05)
    // Snittoverraskelsen følger estimatet, og klemmen som dro mot det, er borte.
    expect(telling[2].sum / telling[2].n).toBeCloseTo(ESTIMAT_SKJEVHET[2], 1)
    expect(telling[0].sum / telling[0].n).toBeCloseTo(ESTIMAT_SKJEVHET[0], 1)
  })
})

/** Et spill der dagen akkurat har startet, med postene du sier — i kroner. */
function medPoster(poster: [PapirId, number][], kontanter = 1e9): Spilltilstand {
  let s = nyttSpill(101)
  s.kontanter = kontanter
  for (const [id, kr] of poster) {
    const u = kjopPapir(s, id, Math.max(1, Math.floor(kr / s.marked.kurser[id].kurs)))
    if (!u.ok) throw new Error(u.feil)
    s = u.tilstand
  }
  s.forrigeDag = lagDagsbilde(s)
  return s
}

describe('din største post', () => {
  it('avisa skriver om posten som flyttet seg mest i kroner, ikke i prosent', () => {
    const s = medPoster([['BMT', 1e8], ['ELG', 1e4]])
    s.marked.kurser.BMT.kurs *= 1.06
    s.marked.kurser.ELG.kurs *= 1.4
    const dine = omMarkedet(s, s.forrigeDag).dine
    expect(dine).toHaveLength(1)
    expect(dine[0].tittel).toContain('Bitmynt')
  })

  it('en bevegelse under 0,1 % av formuen (minst kr 10 000) er ingen sak om deg', () => {
    const s = medPoster([['ELG', 5e4]])
    s.marked.kurser.ELG.kurs *= 1.3
    expect(omMarkedet(s, s.forrigeDag).dine).toEqual([])
  })
})

describe('rentemøtet på forsiden', () => {
  it('står nest øverst den dagen fasen skifter, også i et travelt sent spill', () => {
    const s = fulltSpill()
    const p = Array.from({ length: 60 }, (_, i) => i + 1).find((i) => faseI(s, i) !== faseI(s, i - 1))!
    s.sek = p * FASE_DAGER * DAG_SEK
    s.forrigeDag = lagDagsbilde(s)
    const rente = verdenssaker(s).rente
    expect(rente).not.toBeNull()
    gisUtAvis(s, new Terning(1))
    const saker = s.avis.at(-1)!.saker
    expect(saker.length).toBeLessThanOrEqual(5)
    expect(saker.findIndex((x) => x.tittel === rente!.tittel)).toBe(saker.length > 1 ? 1 : 0)
  })

  it('estimatene står under markedet: de er ikke lenger blant selskapsnyhetene', () => {
    const s = nyttSpill()
    let d = 0
    while (kvartalssaker({ ...s, sek: d * DAG_SEK }).estimater.length === 0) d++
    const k = kvartalssaker({ ...s, sek: d * DAG_SEK })
    expect(k.estimater.every((x) => x.tittel.includes('legger frem tall om'))).toBe(true)
    expect(k.rapporter.some((x) => x.tittel.includes('legger frem tall om'))).toBe(false)
  })
})

describe('flere tekster', () => {
  it('rapportsakene og estimatene veksler mellom flere tekster, valgt med en hash', () => {
    const s = nyttSpill()
    const tekster = new Map<string, Set<string>>()
    for (let d = 0; d < 400; d++) {
      const k = kvartalssaker(structuredClone({ ...s, sek: d * DAG_SEK }))
      for (const x of [...k.rapporter, ...k.estimater]) {
        const nokkel = x.tittel.replace(/^.*?: /, '').replace(/^.* legger frem/, 'legger frem')
        if (!tekster.has(nokkel)) tekster.set(nokkel, new Set())
        tekster.get(nokkel)!.add(x.tekst.replace(/et svakt kvartal|et kvartal på linje med i fjor|et sterkt kvartal/, 'X'))
      }
    }
    for (const n of ['bedre enn ventet', 'svakere enn ventet', 'som ventet']) expect(tekster.get(n)!.size, n).toBeGreaterThanOrEqual(3)
    expect(tekster.get('legger frem tall om 3 dager')!.size).toBe(3)
  })

  it('været veksler mellom tekstene og er det samme for samme dag', () => {
    const s = nyttSpill()
    const sol = new Set<string>()
    for (let d = 0; d < 2000 && sol.size < 3; d++) {
      const x = verdenssaker({ ...s, sek: d * DAG_SEK }).lokalt.find((y) => y.tittel === 'Sol over hele landet')
      if (x) {
        sol.add(x.tekst)
        expect(verdenssaker({ ...s, sek: d * DAG_SEK }).lokalt.find((y) => y.tittel === 'Sol over hele landet')!.tekst).toBe(x.tekst)
      }
    }
    expect(sol.size).toBeGreaterThanOrEqual(3)
  })
})
