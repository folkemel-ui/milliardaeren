/** Pakke 118: romfartsfabrikken — raketter, forskning og oppskytinger for andre selskaper. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { byggAvdeling, kjopRomfart, startForskning, velgKontrakt, type Utfall } from '../handlinger'
import { BEDRIFTSTYPER } from '../innhold'
import { nettoformue } from '../formler'
import { DAG_SEK } from '../kalender'
import {
  AVDELING_KUTT,
  besteKontrakt,
  DELTRINN,
  FORSKNINGSDAGER,
  GEO_FRA_TRINN,
  kanLofte,
  lagTavle,
  loft,
  nyRomfart,
  RAKETTDELLISTE,
  rakettpris,
  ROMFART_LAASES_OPP,
  ROMFART_PRIS,
  romfartsverdi,
  romfartVedDagsskifte,
  sikkerhet,
} from '../romfart'
import { sjekkPrestasjoner } from '../prestasjoner'
import type { Spilltilstand } from '../types'
import { Romfartkort, RomfartLaast, Romfartside } from '../../ui/komponenter/Romfart'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const tom = () => {}

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e14
  s.hoyesteFormue = 1e14
  return s
}

/** Snittet per spilldag over mange oppskytinger, med fabrikkens egne valg. */
function snittPerDag(ferdig: boolean, dager = 2000): { perDag: number; andel: number } {
  const s = nyttSpill()
  s.romfart = nyRomfart(s)
  if (ferdig) {
    for (const d of RAKETTDELLISTE) s.romfart.deler[d] = DELTRINN
    s.romfart.tavle = lagTavle(s.romfart, 0)
  }
  const start = s.kontanter
  for (let i = 0; i < dager; i++) {
    s.sek += DAG_SEK
    romfartVedDagsskifte(s, 'deg')
  }
  return { perDag: (s.kontanter - start) / dager, andel: s.romfart.vellykket / s.romfart.antall }
}

describe('fabrikken', () => {
  it('koster ×3 brikkefabrikken og låses opp ved 1,25 × prisen, som stigen', () => {
    expect(ROMFART_PRIS / BEDRIFTSTYPER.brikkefabrikk.pris).toBe(3)
    expect(ROMFART_LAASES_OPP / ROMFART_PRIS).toBe(1.25)
  })

  it('kan kjøpes når den er låst opp, og pengene blir fabrikk i formuen', () => {
    const s = nyttSpill()
    s.kontanter = 6e12
    expect(kjopRomfart(s).ok).toBe(false)
    s.hoyesteFormue = ROMFART_LAASES_OPP
    const før = nettoformue(s)
    const t = ok(kjopRomfart(s))
    expect(t.romfart).toBeDefined()
    expect(romfartsverdi(t)).toBe(ROMFART_PRIS)
    expect(nettoformue(t)).toBeCloseTo(før, -3)
    expect(t.romfart!.tavle).toHaveLength(3)
    expect(kjopRomfart(t).ok).toBe(false)
  })

  it('en lagring uten fabrikk merker ingenting', () => {
    const s = nyttSpill()
    expect(romfartsverdi(s)).toBe(0)
    expect(romfartVedDagsskifte(s, 'deg')).toEqual([])
  })
})

describe('raketten', () => {
  it('løfter 8 t, holder 80 % og koster en firedel med de første delene; 48,5 t og 99 % ferdig forsket', () => {
    const s = nyttSpill()
    const r = nyRomfart(s)
    expect(loft(r)).toBe(8)
    expect(sikkerhet(r)).toBeCloseTo(0.8)
    const forst = rakettpris(r)
    for (const d of RAKETTDELLISTE) r.deler[d] = DELTRINN
    expect(loft(r)).toBe(48.5)
    expect(sikkerhet(r)).toBeCloseTo(0.99)
    // Ferdig gjenbruk: en femdel av prisen for en rakett som løfter seks ganger så mye.
    expect(rakettpris(r) / forst).toBeCloseTo((48.5 / 8) * 0.2, 6)
  })

  it('tjener som en bedrift til samme pris i starten (~180 mill/s), og rundt ti ganger ferdig forsket', () => {
    const forst = snittPerDag(false)
    const ferdig = snittPerDag(true)
    expect(forst.perDag / DAG_SEK).toBeGreaterThan(150e6)
    expect(forst.perDag / DAG_SEK).toBeLessThan(210e6)
    expect(forst.andel).toBeGreaterThan(0.76)
    expect(forst.andel).toBeLessThan(0.84)
    expect(ferdig.perDag / forst.perDag).toBeGreaterThan(9)
    expect(ferdig.perDag / forst.perDag).toBeLessThan(13)
  })
})

describe('kontraktene', () => {
  it('tre på tavla: den første kan raketten alltid løfte, den tredje trenger bedre deler', () => {
    const r = nyRomfart(nyttSpill())
    for (let dag = 0; dag < 200; dag++) {
      const tavle = lagTavle(r, dag)
      expect(tavle).toHaveLength(3)
      expect(kanLofte(r, tavle[0])).toBe(true)
      expect(kanLofte(r, tavle[2])).toBe(false)
      expect(tavle.every((k) => k.bane === 'lav')).toBe(true)
    }
  })

  it('geostasjonær bane først med øvre trinn 2, med dobbelt løft per tonn', () => {
    const r = nyRomfart(nyttSpill())
    r.deler.ovretrinn = GEO_FRA_TRINN
    const geo = Array.from({ length: 100 }, (_, d) => lagTavle(r, d)).flat().filter((k) => k.bane === 'geo')
    expect(geo.length).toBeGreaterThan(50)
    for (const k of geo.filter((x) => kanLofte(r, x))) expect(k.tonn * 2).toBeLessThanOrEqual(loft(r))
  })

  it('du velger én; uten valg tar fabrikken den som gir mest i snitt; den skytes opp ved dagsskiftet', () => {
    let s = ok(kjopRomfart(rik()))
    const r = s.romfart!
    const beste = besteKontrakt(r)!
    const annen = r.tavle.find((k) => k.id !== beste.id && kanLofte(r, k))!
    expect(velgKontrakt(s, r.tavle[2].id).ok).toBe(false)
    s = ok(velgKontrakt(s, annen.id))
    const før = s.kontanter
    s.sek = (Math.floor(s.sek / DAG_SEK) + 1) * DAG_SEK
    romfartVedDagsskifte(s, 'deg')
    const o = s.romfart!.oppskytinger.at(-1)!
    expect(o.kunde).toBe(annen.kunde)
    expect(s.kontanter - før).toBeCloseTo(o.honorar - o.kostnad, 0)
    expect(s.romfart!.valgt).toBeUndefined()
    expect(s.romfart!.tavle.map((k) => k.id)).not.toContain(annen.id)
  })

  it('går også mens du er borte, på fabrikkens egen terning', () => {
    const s = ok(kjopRomfart(rik()))
    const t = simuler(s, 10 * DAG_SEK, true)
    expect(t.romfart!.antall).toBeGreaterThanOrEqual(9)
    expect(t.romfart!.frø).not.toBe(s.romfart!.frø)
  })
})

describe('forskningen', () => {
  it('trenger en avdeling, én om gangen, og avdelingen kutter tiden 20 % per trinn', () => {
    let s = ok(kjopRomfart(rik()))
    expect(startForskning(s, 'motorer').ok).toBe(false)
    s = ok(byggAvdeling(s))
    const a = ok(startForskning(s, 'motorer'))
    expect(a.romfart!.forskning!.ferdigSek - a.sek).toBe(FORSKNINGSDAGER[0] * DAG_SEK)
    expect(startForskning(a, 'tanker').ok).toBe(false)
    s = ok(byggAvdeling(ok(byggAvdeling(s))))
    const b = ok(startForskning(s, 'motorer'))
    expect(b.romfart!.forskning!.ferdigSek - b.sek).toBeCloseTo(FORSKNINGSDAGER[0] * DAG_SEK * (1 - AVDELING_KUTT) ** 2)
  })

  it('blir ferdig i sitt sekund og gjør raketten bedre; alt forsket gir Romfartspioner', () => {
    let s = ok(byggAvdeling(ok(kjopRomfart(rik()))))
    s = ok(startForskning(s, 'motorer'))
    s = simuler(s, DAG_SEK + 1)
    expect(s.romfart!.deler.motorer).toBe(1)
    expect(s.romfart!.forskning).toBeUndefined()
    expect(s.hendelser.at(-1)?.tekst ?? s.hendelser.some((h) => h.tekst.includes('Motorer trinn 1'))).toBeTruthy()
    for (const d of RAKETTDELLISTE) s.romfart!.deler[d] = DELTRINN
    expect(sjekkPrestasjoner(s)).toContain('romfartspioner')
  })
})

describe('avisa og prestasjonene', () => {
  it('den første vellykkede oppskytingen og et tap skrives om; I bane når en går bra', () => {
    const s = ok(kjopRomfart(rik()))
    const titler: string[] = []
    for (let i = 0; i < 40; i++) {
      s.sek += DAG_SEK
      titler.push(...romfartVedDagsskifte(s, 'Folke').map((x) => x.tittel))
    }
    expect(titler).toContain('Folke er i bane')
    expect(titler.some((t) => t.startsWith('Rakett tapt'))).toBe(true)
    expect(sjekkPrestasjoner(s)).toContain('i-bane')
  })
})

describe('skjermen', () => {
  it('låst, til salgs og eid på Bedrifter', () => {
    const s = nyttSpill()
    expect(tekst(createElement(RomfartLaast, { s, synlig: true }))).toContain('Låses opp ved kr 6,75 bill')
    const rikt = rik()
    rikt.hoyesteFormue = ROMFART_LAASES_OPP
    expect(tekst(createElement(Romfartkort, { s: rikt, åpne: tom }))).toContain('Kjøp · kr 5,4 bill')
    const eid = ok(kjopRomfart(rik()))
    expect(tekst(createElement(Romfartkort, { s: eid, åpne: tom }))).toContain('Neste:')
  })

  it('siden viser raketten, tavla med fabrikkens eget valg, og forskningen', () => {
    const s = ok(kjopRomfart(rik()))
    const side = tekst(createElement(Romfartside, { s, tilbake: tom }))
    expect(side).toContain('Raketten løfter 8 t til lav bane')
    expect(side).toContain('Tas uten valg')
    expect(side).toContain('Bygg forskningsavdeling')
    expect(side).toContain('Motorer')
    expect(side).toContain('Gjenbruk')
    const valgt = ok(velgKontrakt(s, besteKontrakt(s.romfart!)!.id))
    expect(tekst(createElement(Romfartside, { s: valgt, tilbake: tom }))).toContain('✓ Valgt')
  })
})
