import { describe, expect, it } from 'vitest'
import { BEDRIFTSTYPER, FORBEDRINGER, STIGEN } from '../innhold'
import { FORMER } from '../fusjon'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, LUKSUSLISTE, STATUSNIVAAER, statusnivaa, statuspoeng } from '../eiendom'
import { LANDEMERKELISTE, LANDEMERKER } from '../landemerker'
import { BEDRIFTSTEGNINGER } from '../../ui/komponenter/Illustrasjoner'
import { nyttSpill } from '../start'
import { erLaastOpp } from '../formler'

describe('bransjestigen', () => {
  const typer = STIGEN.map((id) => BEDRIFTSTYPER[id])

  it('ingen trinn er mer enn 16 ganger det forrige', () => {
    for (let i = 1; i < typer.length; i++) {
      expect(typer[i].pris / typer[i - 1].pris, `${typer[i - 1].navn} → ${typer[i].navn}`).toBeLessThanOrEqual(16)
    }
  })

  it('alt etter saftboden låses opp ved rundt 1,25 ganger prisen', () => {
    for (const t of typer.slice(1)) {
      const faktor = t.laasesOppVed / t.pris
      expect(faktor, t.navn).toBeGreaterThanOrEqual(1.2)
      expect(faktor, t.navn).toBeLessThanOrEqual(1.3)
    }
  })

  it('første oppgradering koster en jevnt stigende andel av prisen fra kiosken til banken', () => {
    const andeler = typer.slice(STIGEN.indexOf('kiosk'), STIGEN.indexOf('bank') + 1).map((t) => t.oppgraderingspris / t.pris)
    for (let i = 1; i < andeler.length; i++) expect(andeler[i]).toBeGreaterThanOrEqual(andeler[i - 1] - 1e-9)
    expect(andeler[0]).toBeCloseTo(0.25)
    expect(andeler.at(-1)).toBeLessThanOrEqual(0.8)
  })

  it('i sluttspillet stiger andelen igjen, fra halvparten (Pakke 47)', () => {
    const andeler = typer.slice(STIGEN.indexOf('oljeselskap')).map((t) => t.oppgraderingspris / t.pris)
    for (let i = 1; i < andeler.length; i++) expect(andeler[i]).toBeGreaterThanOrEqual(andeler[i - 1] - 1e-9)
    expect(andeler[0]).toBeCloseTo(0.275)
    expect(andeler.at(-1)).toBeLessThanOrEqual(0.4)
  })

  it('hver bransje har tegning, tre forbedringer og navn til avisa', () => {
    for (const id of STIGEN) {
      expect(BEDRIFTSTEGNINGER, id).toContain(id)
      expect(FORBEDRINGER[id], id).toHaveLength(3)
      expect(FORMER[id], id).toBeDefined()
    }
  })

  it('gatekjøkkenet ligger mellom pølseboden og kiosken', () => {
    expect(STIGEN.indexOf('gatekjokken')).toBe(STIGEN.indexOf('polsebod') + 1)
    const s = nyttSpill()
    s.hoyesteFormue = 8_999
    expect(erLaastOpp(s, 'gatekjokken')).toBe(false)
    s.hoyesteFormue = 9_000
    expect(erLaastOpp(s, 'gatekjokken')).toBe(true)
  })
})

describe('eiendom følger stigen', () => {
  it('avkastningen faller med prisen — bortsett fra øya, som er for status', () => {
    const vanlige = EIENDOMSSTIGEN.filter((id) => id !== 'oy').sort((a, b) => EIENDOMSTYPER[a].pris - EIENDOMSTYPER[b].pris)
    for (let i = 1; i < vanlige.length; i++) {
      expect(EIENDOMSTYPER[vanlige[i]].avkastning, vanlige[i]).toBeLessThanOrEqual(EIENDOMSTYPER[vanlige[i - 1]].avkastning)
    }
    expect(EIENDOMSTYPER.hybel.avkastning).toBe(0.3)
    expect(EIENDOMSTYPER.newyork.avkastning).toBe(0.08)
  })

  it('landemerkene gir mindre leie enn eiendom til samme pris — de er for status', () => {
    for (const id of LANDEMERKELISTE) {
      const l = LANDEMERKER[id]
      const nærmest = EIENDOMSSTIGEN.filter((e) => e !== 'oy').reduce((best, e) =>
        Math.abs(Math.log(EIENDOMSTYPER[e].pris / l.pris)) < Math.abs(Math.log(EIENDOMSTYPER[best].pris / l.pris)) ? e : best,
      )
      expect(l.avkastning, id).toBeLessThan(EIENDOMSTYPER[nærmest].avkastning)
    }
  })
})

describe('status', () => {
  it('har nivåer etter Legende, opp til 1 000 poeng', () => {
    const navn = STATUSNIVAAER.map((n) => n.navn)
    expect(navn.slice(-4)).toEqual(['Legende', 'Ikon', 'Monark', 'Udødelig'])
    expect(STATUSNIVAAER.at(-1)!.poeng).toBe(1000)
  })

  it('all luksusen gir et høyere nivå enn Legende', () => {
    const s = nyttSpill()
    s.luksus = [...LUKSUSLISTE]
    expect(statuspoeng(s)).toBeGreaterThan(500)
    expect(statusnivaa(s)).toBeGreaterThan(STATUSNIVAAER.findIndex((n) => n.navn === 'Legende'))
  })
})
