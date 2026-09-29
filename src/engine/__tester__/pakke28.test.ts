/**
 * Pakke 28: flere papirer på børsen og flere luksusting. De nye papirene
 * trekker fra en hash, ikke fra terningen, i markedstikkene. (Avisa skriver
 * om dem, så fra første dagsskifte kan avisas fyllsaker trekkes annerledes.)
 */

import { describe, expect, it } from 'vitest'
import { migrer } from '../../state/migrering'
import { KATEGORINAVN, LUKSUS, LUKSUSLISTE } from '../eiendom'
import { DAG_SEK, dato } from '../kalender'
import { rapportdagI } from '../kvartal'
import { AKSJER, NYE_PAPIRER, PAPIRER } from '../marked'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import type { PapirId, Spilltilstand } from '../types'

/** En lagring slik den så ut i versjon 16: uten de nye papirene. */
function versjon16(): Spilltilstand {
  const s = structuredClone(nyttSpill())
  for (const id of NYE_PAPIRER) delete (s.marked.kurser as Partial<Record<PapirId, unknown>>)[id]
  delete s.marked.nyeFrø
  s.versjon = 16
  return s
}

const gamle = (Object.keys(PAPIRER) as PapirId[]).filter((id) => !NYE_PAPIRER.includes(id))

describe('nye papirer', () => {
  it('en lagring fra versjon 16 får de nye papirene med historikk, og de gamle kursene er urørt', () => {
    const før = versjon16()
    const r = migrer(structuredClone(før))
    if (!r.ok) throw new Error(r.feil)
    const s = r.tilstand
    for (const id of NYE_PAPIRER) {
      const k = s.marked.kurser[id]
      expect(k.kurs).toBe(PAPIRER[id].startkurs)
      expect(k.historikk.length).toBe(før.marked.kurser.NFS.historikk.length)
      expect(k.historikk.every((v) => Number.isFinite(v) && v > 0)).toBe(true)
    }
    for (const id of gamle) expect(s.marked.kurser[id]).toEqual(før.marked.kurser[id])
    expect(s.frø).toBe(før.frø)
  })

  it('markedstikkene for de nye papirene rører verken terningen eller de gamle kursene', () => {
    // To spill som bare skiller seg i de nye papirenes frø: trakk de fra
    // terningen (hopp gir ulikt antall trekk), ville alt annet sklidd fra
    // hverandre. Innenfor én spilldag, før avisa skriver om dem.
    const a0 = nyttSpill()
    const b0 = structuredClone(a0)
    b0.marked.nyeFrø = (a0.marked.nyeFrø ?? 0) + 12345
    const a = simuler(a0, DAG_SEK - 1)
    const b = simuler(b0, DAG_SEK - 1)
    expect(a.frø).toBe(b.frø)
    for (const id of gamle) expect(a.marked.kurser[id].kurs).toBe(b.marked.kurser[id].kurs)
    expect(a.marked.kurser.ROM.kurs).not.toBe(b.marked.kurser.ROM.kurs)
  })

  it('de nye papirene beveger seg, og stabilkronen holder seg nær 10 kr', () => {
    const s = simuler(nyttSpill(), 6 * 3600)
    for (const id of NYE_PAPIRER) expect(s.marked.kurser[id].kurs).not.toBe(PAPIRER[id].startkurs)
    const stk = s.marked.kurser.STK
    expect(Math.min(...stk.historikk, stk.kurs)).toBeGreaterThan(9.5)
    expect(Math.max(...stk.historikk, stk.kurs)).toBeLessThan(10.5)
  })

  it('hver aksje legger frem tall én gang i måneden, på en børsdag i riktig måned', () => {
    for (const id of AKSJER) {
      for (let m = 0; m < 12; m++) {
        const d = rapportdagI(id, 2027, m)
        expect(Number.isFinite(d)).toBe(true)
        expect(dato(d).maaned).toBe(m)
      }
    }
  })
})

describe('nye luksusting', () => {
  it('hver kategori har en ting i hver prisklasse, og status stiger med prisen', () => {
    for (const k of Object.keys(KATEGORINAVN)) {
      const ting = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === k).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)
      expect(ting.length).toBeGreaterThanOrEqual(3)
      for (let i = 1; i < ting.length; i++) expect(LUKSUS[ting[i]].status).toBeGreaterThan(LUKSUS[ting[i - 1]].status)
    }
  })
})
