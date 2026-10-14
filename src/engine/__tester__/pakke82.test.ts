/** Pakke 82: Avisa om deg — dine egne papirer først, og stemningssaken bare når stemningen snur. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { gisUtAvis, lagDagsbilde, omMarkedet, stemningssone } from '../avis'
import { kjopPapir } from '../handlinger'
import { AKSJER, KRYPTO } from '../marked'
import { Terning } from '../rng'
import { MALER, malTekst } from '../selskapsnyheter'
import type { Overskrift, PapirId, Spilltilstand } from '../types'

/**
 * Et spill der dagen akkurat har startet: i går = nå, og ingenting har beveget seg. Hver post er
 * kr 10 mill, så 2 % er over kronegulvet fra Pakke 101 (0,1 % av formuen, minst kr 10 000).
 */
function spill(eier: PapirId[] = []): Spilltilstand {
  let s = nyttSpill(82)
  s.kontanter = 1e8
  for (const id of eier) {
    const u = kjopPapir(s, id, Math.floor(1e7 / s.marked.kurser[id].kurs))
    if (!u.ok) throw new Error(u.feil)
    s = u.tilstand
  }
  s.forrigeDag = lagDagsbilde(s)
  return s
}

/** Dagens markedssaker, alle — uten at forsiden kapper dem. */
function marked(s: Spilltilstand): Overskrift[] {
  const m = omMarkedet(s, s.forrigeDag)
  return [...m.dine, ...m.andre]
}

/** Neste dag: i dag blir i går, slik dagsskiftet gjør det. */
function nesteDag(s: Spilltilstand): void {
  s.forrigeDag = lagDagsbilde(s)
}

/** Gir ut dagens avis og returnerer sakene. */
function avis(s: Spilltilstand): Overskrift[] {
  gisUtAvis(s, new Terning(1))
  return s.avis[s.avis.length - 1].saker
}

const flytt = (s: Spilltilstand, id: PapirId, faktor: number) => {
  s.marked.kurser[id].kurs *= faktor
}

describe('dine egne papirer først', () => {
  it('en aksje du eier, kommer i avisa ved 2 % — med kronene', () => {
    const id = AKSJER[2]
    const s = spill([id])
    flytt(s, id, 1.02)
    const sak = avis(s).find((x) => x.tittel.startsWith('Din post'))
    expect(sak?.tittel).toMatch(/^Din post i .+ steg 2 %$/)
    expect(sak?.tekst).toMatch(/mer enn i går for posten din\.$/)
  })

  it('den samme bevegelsen i en aksje du ikke eier, er ikke en sak', () => {
    const s = spill()
    flytt(s, AKSJER[2], 1.02)
    expect(avis(s).some((x) => x.type === 'marked' && /stiger|faller/.test(x.tittel))).toBe(false)
  })

  it('beveger din seg for lite, skriver avisa om dagens største som før', () => {
    const s = spill([AKSJER[2]])
    flytt(s, AKSJER[2], 1.01)
    flytt(s, AKSJER[5], 0.94)
    const saker = marked(s)
    expect(saker.some((x) => x.tittel.startsWith('Din post'))).toBe(false)
    expect(saker.some((x) => x.tittel.includes('faller 6 %'))).toBe(true)
  })

  it('en mynt du eier, ved 5 %, kommer på forsiden foran ukas trender', () => {
    const s = spill([KRYPTO[0]])
    flytt(s, KRYPTO[0], 0.95)
    const saker = avis(s)
    const i = saker.findIndex((x) => x.tittel.startsWith('Din '))
    expect(i).toBeGreaterThanOrEqual(0)
    expect(saker[i].tittel).toContain('stuper')
    expect(saker[i].tekst).toContain('mindre enn i går')
  })
})

describe('stemningen bare når den snur', () => {
  it('blir feber over 0,6, roer seg først under 0,4', () => {
    expect(stemningssone(0, 0.65)).toBe(1)
    expect(stemningssone(0, 0.5)).toBe(0)
    expect(stemningssone(1, 0.5)).toBe(1)
    expect(stemningssone(1, 0.3)).toBe(0)
    expect(stemningssone(-1, -0.5)).toBe(-1)
    expect(stemningssone(-1, -0.3)).toBe(0)
    expect(stemningssone(1, -0.7)).toBe(-1)
  })

  it('skriver én gang når feberen kommer, ikke dagen etter, og én gang når den går', () => {
    const s = spill()
    const titler = () => {
      const t = marked(s).map((x) => x.tittel)
      nesteDag(s)
      return t
    }
    s.marked.stemning = 0.7
    expect(titler()).toContain('Kryptofeber')
    s.marked.stemning = 0.75
    expect(titler()).not.toContain('Kryptofeber')
    s.marked.stemning = 0.5
    expect(titler().some((t) => /Kryptofeber|Roen/.test(t))).toBe(false)
    s.marked.stemning = 0.2
    expect(titler()).toContain('Roen senker seg over kryptomarkedet')
  })

  it('har du krypto, står det hva den er verdt', () => {
    const s = spill([KRYPTO[0]])
    s.marked.stemning = -0.8
    const sak = marked(s).find((x) => x.tittel === 'Panikk i kryptomarkedet')
    expect(sak?.tekst).toMatch(/Kryptoen din er verdt kr .+ — \+0 % siden i går\.$/)
  })

  it('en lagring fra før har ingen sone i går, og får saken én gang', () => {
    const s = spill()
    delete s.forrigeDag.stemningssone
    s.marked.stemning = -0.8
    expect(marked(s).some((x) => x.tittel === 'Panikk i kryptomarkedet')).toBe(true)
    nesteDag(s)
    expect(s.forrigeDag.stemningssone).toBe(-1)
    expect(marked(s).some((x) => x.tittel === 'Panikk i kryptomarkedet')).toBe(false)
  })
})

describe('selskapsnyhetene', () => {
  it('har tre eller fire tekster per mal', () => {
    for (const m of MALER) {
      expect(m.tekster.length).toBeGreaterThanOrEqual(3)
      expect(m.tekster.length).toBeLessThanOrEqual(4)
      expect(new Set(m.tekster).size).toBe(m.tekster.length)
    }
  })

  it('velger teksten med en hash: den samme hver gang, og alle brukes', () => {
    const m = MALER[0]
    expect(malTekst(m, 3000, 'NHY')).toBe(malTekst(m, 3000, 'NHY'))
    const brukt = new Set<string>()
    for (let dag = 0; dag < 200; dag++) brukt.add(malTekst(m, dag * 300, AKSJER[dag % AKSJER.length]))
    expect(brukt.size).toBe(m.tekster.length)
  })
})
