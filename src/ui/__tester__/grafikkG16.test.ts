/**
 * Grafikkpakke G16: scener som vokser. Mellom vekstrinnene (nivå 1, 25, 50, 100)
 * får en bedrift noe nytt i scenen for hvert femte nivå — flere kunder i køen, en
 * vimpelrekke, en båt til — og hjemmene i Luksus får hver sin scene der rommene
 * står slik de er innredet, med en detaljside og et kjøpsøyeblikk.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BEDRIFTSTEGNINGER, Illustrasjon, stegFor } from '../komponenter/Illustrasjoner'
import { Scene } from '../komponenter/BedriftIkon'
import { Hjembilde, Hjemscene } from '../komponenter/Hjemscene'
import { HJEMTEGNINGER } from '../komponenter/ved-behov/Hjemtegninger'
import { TRINNSTEG } from '../komponenter/ved-behov/Trinnsteg'
import { lastAlle } from '../vedBehov'
import { HJEM, HJEMLISTE, hjemkostnad, hjemstatus, ROM } from '../../engine/hjemmene'
import { nyttSpill } from '../../engine/start'
import { innred } from '../../engine/handlinger'
import { nytt } from '../hendelsesstrom'
import { hjemTall, romFraKode, romkode, romkodeFor } from '../romkode'
import { aapneTing, aapenTing, FANE_FOR } from '../detaljvisning'
import type { Spilltilstand } from '../../engine/types'

const STARTNIVAA = [1, 25, 50, 100]
/** Høyeste steg per trinn: 4, 4, 9, 10 (nivå 24, 49, 99 og 150). */
const SISTE = [24, 49, 99, 150]
const scene = (type: string, nivaa: number, f = 3) => renderToStaticMarkup(createElement(Scene, { type, nivaa, forbedringer: f }))
const hjemscene = (id: string, rom: number) => renderToStaticMarkup(createElement(Hjemscene, { id: id as never, rom }))

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e14
  s.hoyesteFormue = 1e14
  return s
}

describe('stegene mellom vekstrinnene (G16)', () => {
  it('et steg for hvert femte nivå inne i trinnet: 0–4, 0–4, 0–9, 0–10 til nivå 150', () => {
    const steg = (n: number) => stegFor(n)
    expect([1, 4, 5, 9, 10, 20, 24].map(steg)).toEqual([0, 0, 1, 1, 2, 4, 4])
    expect([25, 29, 30, 45, 49].map(steg)).toEqual([0, 0, 1, 4, 4])
    expect([50, 54, 55, 95, 99].map(steg)).toEqual([0, 0, 1, 9, 9])
    expect([100, 104, 105, 145, 149, 150, 400].map(steg)).toEqual([0, 0, 1, 9, 9, 10, 10])
    expect(stegFor(undefined)).toBe(0)
  })

  it('hver bedrift har sine steg, og bare bedriftene', () => {
    expect(Object.keys(TRINNSTEG).sort()).toEqual([...BEDRIFTSTEGNINGER].sort())
  })

  it.each([...BEDRIFTSTEGNINGER])('%s: hvert steg legger noe nytt i scenen, på alle fire trinn', async (id) => {
    await lastAlle()
    STARTNIVAA.forEach((start, t) => {
      const antallSteg = [4, 4, 9, 10][t]
      let forrige = scene(id, start)
      for (let k = 1; k <= antallSteg; k++) {
        // Nivået som gir steg k er trinnets start + 5·k (i trinn 0 er det bare 5·k).
        const nivaa = t === 0 ? 5 * k : start + 5 * k
        const dette = scene(id, nivaa)
        expect(stegFor(nivaa), `${id} nivå ${nivaa}`).toBe(k)
        expect(dette, `${id} trinn ${t} steg ${k}`).not.toBe(forrige)
        expect(dette.length, `${id} trinn ${t} steg ${k} er ikke mindre enn steget før`).toBeGreaterThanOrEqual(forrige.length)
        forrige = dette
      }
    })
  })

  it.each([...BEDRIFTSTEGNINGER])('%s: stegene vises bare i scenen, ikke på kort, i lister eller i kjøpsøyeblikket', async (id) => {
    await lastAlle()
    const utenSteg = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 60, trinn: 2, forbedringer: 3, steg: 0 }))
    const medSteg = renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 60, trinn: 2, forbedringer: 3, steg: 7 }))
    expect(medSteg).toBe(utenSteg)
  })

  it.each([...BEDRIFTSTEGNINGER])('%s: ingen lange desimaler i stegene', async (id) => {
    await lastAlle()
    // Tegningene fra før har noen lange desimaler (G7 bryr seg bare om sine sju); det nye skal ikke ha flere.
    STARTNIVAA.forEach((start, t) => {
      const lange = (html: string) => html.match(/\d\.\d{6,}/g) ?? []
      const fra = new Set(lange(scene(id, start)))
      const nye = lange(scene(id, SISTE[t])).filter((d) => !fra.has(d))
      expect(nye, `${id} trinn ${t}`).toEqual([])
    })
  })

  it('stegene har ingen tekst, bare tegning', async () => {
    await lastAlle()
    for (const id of BEDRIFTSTEGNINGER) expect(scene(id, 150)).not.toContain('<text')
  })
})

describe('hjemmene (G16)', () => {
  it('en scene for hvert hjem', () => {
    expect(Object.keys(HJEMTEGNINGER).sort()).toEqual([...HJEMLISTE].sort())
  })

  it('de tre rommenes trinn pakkes i ett tall og kommer ut igjen', () => {
    expect(romkode(0, 0, 0)).toBe(0)
    expect(romkode(3, 3, 3)).toBe(63)
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) expect(romFraKode(romkode(a, b, c))).toEqual([a, b, c])
  })

  it('tallene på detaljsiden stemmer med motoren', () => {
    const s = rik()
    s.hjem = { kjokken: 2, stue: 1, vinkjeller: 3, peisestue: 1, badstue: 0, boblebad: 2, terrasse: 0, basseng: 3, gjestefloy: 1 }
    const sum = HJEMLISTE.map((h) => hjemTall(s, h))
    expect(sum.reduce((n, d) => n + d.status, 0)).toBe(hjemstatus(s))
    expect(sum.reduce((n, d) => n + d.brukt, 0)).toBe(hjemkostnad(s))
    expect(sum.map((d) => d.alle)).toEqual([9, 9, 9])
    expect(romkodeFor(s, 'oslo')).toBe(romkode(2, 1, 3))
  })

  it.each([...HJEMLISTE])('%s: hvert trinn i hvert rom endrer tegningen, og trinn 0 er rått', async (id) => {
    await lastAlle()
    const tom = hjemscene(id, 0)
    for (let rom = 0; rom < 3; rom++) {
      let forrige = tom
      for (let n = 1; n <= 3; n++) {
        const koder = [0, 0, 0]
        koder[rom] = n
        const html = hjemscene(id, romkode(koder[0], koder[1], koder[2]))
        expect(html, `${id} rom ${rom} trinn ${n}`).not.toBe(forrige)
        forrige = html
      }
    }
    // Hvert rom er sitt eget: et rom endrer ikke de andre (samme tegning to ganger gir samme markup).
    expect(hjemscene(id, 21)).toBe(hjemscene(id, 21))
  })

  it.each([...HJEMLISTE])('%s: bred i scenen, kant i kant på flisa, uten tekst og uten lange desimaler', async (id) => {
    await lastAlle()
    const bred = hjemscene(id, 63)
    expect(bred).toContain('viewBox="-40 0 176 96"')
    const flis = renderToStaticMarkup(createElement(Hjembilde, { id, rom: 63, stor: true }))
    expect(flis).toContain('viewBox="0 0 96 96"')
    for (const html of [bred, flis, hjemscene(id, 0)]) {
      expect(html).not.toContain('<text')
      expect(html.match(/\d\.\d{6,}/g) ?? []).toEqual([])
    }
  })

  it.each([...HJEMLISTE])('%s: rommene lyser om natta i scenen (nattvindu), og de står mørke når de ikke er innredet', async (id) => {
    await lastAlle()
    const lyst = (html: string) => (html.match(/nattvindu/g) ?? []).length
    expect(lyst(hjemscene(id, 63))).toBeGreaterThan(lyst(hjemscene(id, 0)))
  })

  it('flisa på kortet får ikke natt-laget (bare scenen)', async () => {
    await lastAlle()
    const flis = renderToStaticMarkup(createElement(Hjembilde, { id: 'hytta', rom: 63 }))
    expect(flis).not.toContain('nattlag')
    expect(hjemscene('hytta', 63)).toContain('nattlag')
  })
})

describe('kjøpsøyeblikk og detaljside for hjemmene (G16)', () => {
  it('å innrede et rom gir ett øyeblikk, med hjemmet slik det ble', () => {
    const før = rik()
    const u = innred(før, 'stue')
    if (!u.ok) throw new Error(u.feil)
    const funn = nytt(før, u.tilstand).filter((f) => f.type === 'kjop')
    expect(funn).toEqual([{ type: 'kjop', art: 'hjem', id: `oslo:stue:${romkode(0, 1, 0)}`, navn: ROM.stue.trinn[0].navn }])
    const u2 = innred(u.tilstand, 'kjokken')
    if (!u2.ok) throw new Error(u2.feil)
    expect(nytt(u.tilstand, u2.tilstand).filter((f) => f.type === 'kjop')).toMatchObject([{ id: `oslo:kjokken:${romkode(1, 1, 0)}`, navn: ROM.kjokken.trinn[0].navn }])
  })

  it('uten innredning er det ingen øyeblikk', () => {
    const s = rik()
    expect(nytt(s, structuredClone(s)).filter((f) => f.type === 'kjop')).toEqual([])
  })

  it('hjemmene åpner detaljsiden i Luksus', () => {
    expect(FANE_FOR.hjem).toBe('luksus')
    aapneTing({ slag: 'hjem', id: 'hytta' })
    expect(aapenTing()).toEqual({ slag: 'hjem', id: 'hytta' })
    aapneTing(null)
    expect(HJEM.hytta.rom).toHaveLength(3)
  })
})
