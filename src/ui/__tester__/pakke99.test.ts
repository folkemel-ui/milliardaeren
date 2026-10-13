/** Pakke 99: bedrifter som viser tallene sine — køen, inntjeningen, fusjonene, retningen og milepælen. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { bedriftInntektIDag, nesteMilepael, prisForNivaaer } from '../../engine/formler'
import { fusjonstilbud, FUSJON_FRA_NIVAA, prisantydning, rivalbedrifter } from '../../engine/fusjon'
import { kobonus, KO_BONUS_SEK } from '../../engine/hender'
import { FORBEDRINGER } from '../../engine/innhold'
import { nyttSpill } from '../../engine/start'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { Bedriftskort, erFerdig } from '../komponenter/Bedriftskort'
import { Bedriftdetalj } from '../screens/Bedriftdetalj'
import { kjop } from '../kjopsmengde'
import { forbedringGir, oppgraderingGir, tilbakeTekst } from '../inntjening'
import { lastAlle } from '../vedBehov'

const tegn = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)
const tom = () => {}
let rik: Spilltilstand

beforeAll(async () => {
  await lastAlle()
  rik = fulltSpill()
})

describe('køen', () => {
  it('gir tretti sekunder av bedriftens inntekt, men aldri under snittet for bedriftene dine', () => {
    const inntekter = rik.bedrifter.map((b) => Math.max(0, bedriftInntektIDag(rik, b)))
    const snitt = inntekter.reduce((a, x) => a + x, 0) / inntekter.length
    const minst = rik.bedrifter.reduce((a, b) => (bedriftInntektIDag(rik, b) < bedriftInntektIDag(rik, a) ? b : a))
    const storst = rik.bedrifter.reduce((a, b) => (bedriftInntektIDag(rik, b) > bedriftInntektIDag(rik, a) ? b : a))
    expect(kobonus(rik, minst)).toBeCloseTo(KO_BONUS_SEK * snitt)
    expect(kobonus(rik, storst)).toBeCloseTo(KO_BONUS_SEK * bedriftInntektIDag(rik, storst))
    // Før: 30 s av den minste bedriftens egen inntekt — en brøkdel av snittet.
    expect(bedriftInntektIDag(rik, minst)).toBeLessThan(snitt / 10)
  })

  it('står også på det korte kortet til en ferdig bedrift, og på detaljsiden', () => {
    const s = structuredClone(rik)
    const b = s.bedrifter[0]
    b.forbedringer = FORBEDRINGER[b.type].length
    b.retning = 'volum'
    expect(erFerdig(b)).toBe(true)
    s.ko = { bedriftId: b.id, slutterSek: s.sek + 5, bonus: 1e9 }
    expect(tegn(createElement(Bedriftskort, { b, s, mengde: '1', åpne: tom }))).toContain('ko-knapp')
    expect(tegn(createElement(Bedriftdetalj, { s, b, mengde: '1', tilbake: tom, tilRival: tom }))).toContain('ko-knapp')
  })
})

describe('inntjeningen på hver kjøpsknapp', () => {
  it('oppgraderingen: det neste kjøpet legger til mot prisen, på en linje under knappen', () => {
    const s = nyttSpill()
    s.kontanter = 1e6
    const b = s.bedrifter[0]
    const { antall, pris } = kjop(b, '10', s.kontanter)
    const gir = oppgraderingGir(s, b, antall)
    expect(gir).toBeCloseTo(bedriftInntektIDag(s, { ...b, nivaa: b.nivaa + antall }) - bedriftInntektIDag(s, b))
    const html = tegn(createElement(Bedriftskort, { b, s, mengde: '10', åpne: tom }))
    expect(html).toContain('tilbake-linje')
    expect(html).toContain(tilbakeTekst(pris, gir))
  })

  it('forbedringen og filialene sier også hvor fort de tjener seg inn', () => {
    const s = structuredClone(rik)
    const b = s.bedrifter.find((x) => x.forbedringer === 0 && x.nivaa >= 10) ?? s.bedrifter[0]
    if (b.forbedringer > 0) b.forbedringer = 0
    expect(forbedringGir(s, b)).toBeGreaterThan(0)
    const side = tegn(createElement(Bedriftdetalj, { s, b, mengde: '1', tilbake: tom, tilRival: tom }))
    expect(side).toMatch(/Tilbake på/)
    expect(side).toContain('forbedring-kjop')
  })

  it('et kjøp som ikke tjener seg inn i dag, sier det', () => {
    expect(tilbakeTekst(100, 0)).toBe('Tjener seg ikke inn i dag')
    expect(tilbakeTekst(3600, 1)).toBe('Tilbake på 1 t')
  })
})

describe('milepælen', () => {
  it('«Milepæl» kjøper akkurat opp til neste milepæl, og linja sier hva det koster', () => {
    const s = nyttSpill()
    const b: Bedrift = { ...s.bedrifter[0], nivaa: 7 }
    const neste = nesteMilepael(b.nivaa, b.type)!
    expect(kjop(b, 'milepael', 0)).toEqual({ antall: neste - 7, pris: prisForNivaaer(b, neste - 7) })
    const html = tegn(createElement(Bedriftskort, { b, s, mengde: 'milepael', åpne: tom }))
    expect(html).toContain(`ved nivå ${neste} · `)
    expect(html).toContain(`→ nivå ${neste}`)
  })

  it('etter den siste milepælen kjøper den ingenting', () => {
    const s = nyttSpill()
    const b: Bedrift = { ...s.bedrifter[0], nivaa: 400 }
    expect(nesteMilepael(b.nivaa, b.type)).toBeNull()
    expect(kjop(b, 'milepael', 1e30).antall).toBe(0)
    expect(tegn(createElement(Bedriftskort, { b, s, mengde: 'milepael', åpne: tom }))).toContain('Alle milepæler nådd')
  })
})

describe('fusjonene på bedriftens side', () => {
  it('rivalene som eier samme bransje, billigst først', () => {
    const b = rik.bedrifter.find((x) => fusjonstilbud(rik, x).length > 1)!
    const t = fusjonstilbud(rik, b)
    for (const x of t) expect(rivalbedrifter(x.rival).some((rb) => rb.type === b.type)).toBe(true)
    expect(t.map((x) => x.antydning)).toEqual([...t.map((x) => x.antydning)].sort((a, c) => a - c))
    const rb = rivalbedrifter(t[0].rival).find((x) => x.type === b.type)!
    expect(t[0].antydning).toBe(prisantydning(rik, rb))
  })

  it('fra nivå 100: en rad under toppen som åpner rivalen; før det en linje i milepælene', () => {
    const s = structuredClone(rik)
    const b = s.bedrifter.find((x) => fusjonstilbud(s, x).length > 0)!
    b.nivaa = Math.max(b.nivaa, FUSJON_FRA_NIVAA)
    let apnet: string | null = null
    const side = tegn(createElement(Bedriftdetalj, { s, b, mengde: '1', tilbake: tom, tilRival: (id) => (apnet = id) }))
    expect(side).toContain('fusjonsrad')
    expect(side).toMatch(/×1,5 inntekt/)
    expect(apnet).toBeNull()
    // Raden står før forbedringene.
    expect(side.indexOf('fusjonsrad')).toBeLessThan(side.indexOf('Forbedringer'))
    const lav = { ...b, nivaa: 50 }
    const tidlig = tegn(createElement(Bedriftdetalj, { s, b: lav, mengde: '1', tilbake: tom, tilRival: tom }))
    expect(tidlig).not.toContain('fusjonsrad')
    expect(tidlig).toContain(`Fusjoner åpner ved nivå ${FUSJON_FRA_NIVAA}`)
  })
})

describe('retningen først når den venter', () => {
  it('står rett under toppen mens valget venter, og nede ved personalet etterpå', () => {
    const s = nyttSpill()
    s.kontanter = 1e6
    const b: Bedrift = { ...s.bedrifter[0], nivaa: 60 }
    const venter = tegn(createElement(Bedriftdetalj, { s, b, mengde: '1', tilbake: tom, tilRival: tom }))
    expect(venter.indexOf('Velg volum')).toBeGreaterThan(0)
    expect(venter.indexOf('Velg volum')).toBeLessThan(venter.indexOf('Forbedringer'))
    const valgt = tegn(createElement(Bedriftdetalj, { s, b: { ...b, retning: 'volum' }, mengde: '1', tilbake: tom, tilRival: tom }))
    expect(valgt.indexOf('class="retning"')).toBeGreaterThan(valgt.indexOf('Milepæler'))
  })
})
