/** Pakke 117: toppen av stigen — brikkefabrikken og aksjen dens, synergiene og hovedkontoret. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { simuler } from '../simulering'
import { byggEtasje, kjopBedrift, type Utfall } from '../handlinger'
import { BEDRIFTSTYPER, FORBEDRINGER, STIGEN } from '../innhold'
import { bedriftInntektIDag, nettoformue, statusfaktor } from '../formler'
import { statuspoeng } from '../eiendom'
import { AKSJE_FOR } from '../bransjer'
import { NYE_PAPIRER, PAPIRER } from '../marked'
import { RAPPORTDAG } from '../kvartal'
import { DAG_SEK } from '../kalender'
import { SYNERGI_BONUS, SYNERGIER, synergifaktor } from '../synergi'
import { etasjepris, HK_ETASJER, HK_STATUS, hovedkontorfaktor, hovedkontorverdi } from '../hovedkontor'
import { PRESTASJONER, sjekkPrestasjoner } from '../prestasjoner'
import { MIGRERINGER } from '../../state/migrering'
import type { BedriftstypeId, Spilltilstand } from '../types'
import { Hovedkontorkort } from '../../ui/komponenter/Hovedkontor'
import { Synergikort } from '../../ui/komponenter/Synergier'
import { ILLUSTRASJONSIDER, BEDRIFTSTEGNINGER, FULL_RAMME } from '../../ui/komponenter/Illustrasjoner'
import { PAPIRLOGOER } from '../../ui/komponenter/Papirlogo'
import { lastAlle } from '../../ui/vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  return s
}

function med(...typer: BedriftstypeId[]): Spilltilstand {
  let s = rik()
  for (const t of typer) s = ok(kjopBedrift(s, t))
  return s
}

beforeAll(async () => {
  await lastAlle()
})

describe('brikkefabrikken', () => {
  it('står øverst på stigen, tre ganger skisenteret i pris og inntekt', () => {
    const b = BEDRIFTSTYPER.brikkefabrikk
    const ski = BEDRIFTSTYPER.skisenter
    expect(STIGEN.at(-1)).toBe('brikkefabrikk')
    expect(b.pris / ski.pris).toBe(3)
    expect(b.grunninntekt / ski.grunninntekt).toBe(3)
    expect(b.laasesOppVed / b.pris).toBe(1.25)
    expect(b.oppgraderingspris / b.pris).toBe(0.4)
    expect(FORBEDRINGER.brikkefabrikk.map((f) => f.navn)).toEqual(['Renrom', 'EUV-maskiner', 'Eget designlaboratorium'])
  })

  it('har en tegning i full ramme, med vekstrinn', () => {
    expect(ILLUSTRASJONSIDER).toContain('brikkefabrikk')
    expect(BEDRIFTSTEGNINGER).toContain('brikkefabrikk')
    expect(FULL_RAMME).toContain('brikkefabrikk')
  })

  it('Brikkebaron når du kjøper en; Hele stigen ber om alle fjorten', () => {
    const s = med('brikkefabrikk')
    expect(sjekkPrestasjoner(s)).toContain('brikkebaron')
    expect(PRESTASJONER.find((p) => p.id === 'hele-stigen')!.beskrivelse).toContain('fjorten')
    expect(STIGEN).toHaveLength(14)
  })
})

describe('Nordlys Halvleder', () => {
  it('er brikkefabrikkens aksje, med rapportdag og logo, og børsnotert som de nye papirene', () => {
    expect(AKSJE_FOR.brikkefabrikk).toBe('NLH')
    expect(PAPIRER.NLH.klasse).toBe('aksje')
    expect(RAPPORTDAG.NLH).toBe(12)
    expect(NYE_PAPIRER).toContain('NLH')
    expect(PAPIRLOGOER).toContain('NLH')
    const s = nyttSpill()
    expect(s.marked.kurser.NLH.kurs).toBe(PAPIRER.NLH.startkurs)
    expect(s.marked.kurser.NLH.historikk.length).toBeGreaterThan(100)
  })

  it('versjon 26 → 27 legger den til og lar terningen og de andre kursene stå', () => {
    expect(SPILLVERSJON).toBe(27)
    const s = simuler(nyttSpill(), DAG_SEK)
    const gammel = structuredClone(s) as unknown as Record<string, unknown>
    const kurser = { ...(s.marked.kurser as Record<string, unknown>) }
    delete kurser.NLH
    gammel.marked = { ...s.marked, kurser }
    const m = MIGRERINGER[26](gammel) as unknown as Spilltilstand
    expect(m.frø).toBe(s.frø)
    expect(m.marked.kurser.NLH.kurs).toBe(PAPIRER.NLH.startkurs)
    for (const id of Object.keys(s.marked.kurser).filter((x) => x !== 'NLH')) expect(m.marked.kurser[id as keyof typeof m.marked.kurser], id).toEqual(s.marked.kurser[id as keyof typeof s.marked.kurser])
  })
})

describe('synergiene', () => {
  it('fem par, +5 % på begge når du eier begge', () => {
    expect(SYNERGIER).toHaveLength(5)
    expect(SYNERGI_BONUS).toBe(0.05)
    const alene = med('hotell')
    expect(synergifaktor(alene, alene.bedrifter.find((b) => b.type === 'hotell')!)).toBe(1)
    const s = med('hotell', 'restaurant')
    for (const b of s.bedrifter.filter((x) => x.type !== 'saftbod')) expect(synergifaktor(s, b), b.type).toBeCloseTo(1.05)
  })

  it('oljeselskapet i to par får begge: +10 % med banken og rederiet', () => {
    const s = med('bank', 'oljeselskap', 'rederi')
    const olje = s.bedrifter.find((b) => b.type === 'oljeselskap')!
    expect(synergifaktor(s, olje)).toBeCloseTo(1.1)
  })

  it('virker på inntekten, både i dag-tallet og i sekundene som går', () => {
    const uten = med('hotell')
    const s = med('hotell', 'restaurant')
    const hotellUten = uten.bedrifter.find((b) => b.type === 'hotell')!
    const hotellMed = s.bedrifter.find((b) => b.type === 'hotell')!
    expect(bedriftInntektIDag(s, hotellMed) / bedriftInntektIDag(uten, hotellUten)).toBeCloseTo(1.05, 6)
    const a = simuler(structuredClone(uten), 1).bedrifter.find((x) => x.type === 'hotell')!.tjent
    const b = simuler(structuredClone(s), 1).bedrifter.find((x) => x.type === 'hotell')!.tjent
    expect(b / a).toBeCloseTo(1.05, 6)
  })

  it('kortet på bedriftens side sier hva paret gir og om du eier den andre', () => {
    const s = med('hotell', 'restaurant')
    const hotell = s.bedrifter.find((b) => b.type === 'hotell')!
    const kort = tegn(createElement(Synergikort, { s, b: hotell }))
    expect(kort).toContain('Hotellrestauranten')
    expect(kort).toContain('✓ Med restauranten')
    expect(kort).toContain('Krever et flyselskap')
    const kiosk = med('kiosk')
    expect(renderToStaticMarkup(createElement(Synergikort, { s: kiosk, b: kiosk.bedrifter.find((b) => b.type === 'kiosk')! }))).toBe('')
  })
})

describe('hovedkontoret', () => {
  it('ti etasjer fra 2,5 mrd, ×3 hver, +1 % og 10 status per etasje', () => {
    expect(etasjepris(0)).toBe(2.5e9)
    expect(etasjepris(1)).toBe(7.5e9)
    expect(etasjepris(9)).toBeCloseTo(2.5e9 * 3 ** 9)
    let s = rik()
    const før = { netto: nettoformue(s), status: statuspoeng(s), faktor: statusfaktor(s) }
    s = ok(byggEtasje(s))
    s = ok(byggEtasje(s))
    expect(s.hovedkontor).toBe(2)
    expect(hovedkontorfaktor(s)).toBeCloseTo(1.02)
    expect(statuspoeng(s) - før.status).toBe(2 * HK_STATUS)
    // Etasjene står i formuen til det de kostet: kontanter blir bygg.
    expect(hovedkontorverdi(s)).toBe(10e9)
    expect(nettoformue(s)).toBeCloseTo(før.netto, -2)
  })

  it('stopper på ti etasjer, og en lagring uten feltet har ingen', () => {
    let s = rik()
    for (let i = 0; i < HK_ETASJER; i++) s = ok(byggEtasje(s))
    expect(byggEtasje(s).ok).toBe(false)
    const gammel = nyttSpill()
    delete gammel.hovedkontor
    expect(hovedkontorfaktor(gammel)).toBe(1)
    expect(hovedkontorverdi(gammel)).toBe(0)
  })

  it('kortet på Bedrifter kommer ved 1 mrd og viser neste etasje med hva den tjener inn', () => {
    const fattig = nyttSpill()
    expect(renderToStaticMarkup(createElement(Hovedkontorkort, { s: fattig }))).toBe('')
    const s = med('bank')
    const kort = tegn(createElement(Hovedkontorkort, { s }))
    expect(kort).toContain('Hovedkontoret i Bjørvika')
    expect(kort).toContain('Etasje 1 · kr 2,5 mrd')
    expect(kort).toContain('Tilbake på')
    const bygd = ok(byggEtasje(s))
    expect(tegn(createElement(Hovedkontorkort, { s: bygd }))).toContain('1 av 10 etasjer · +1 % på alle bedriftene · 10 status')
  })
})
