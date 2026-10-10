/**
 * Pakke 72 — kampdag: kamprapporten, spillerstatistikk og sesongpriser, og
 * sesongen som var. Ingen lagringsversjon: alt nytt er valgfrie felt.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopKlubb, type Utfall } from '../handlinger'
import { KAMPER_FOR_PRIS, KLUBBNAVN, klubbVedDagsskifte, RUNDER_PER_SESONG, scorertekst, sesongpriser, SESONGER_HUSKET, snittvurdering, startellever, toppscorere } from '../klubb'
import type { Klubb, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

const spillSesong = (s: Spilltilstand) => {
  for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
}

describe('kamprapporten', () => {
  it('hvert mål får minutt og scorer, de elleve en vurdering, og en er banens beste', () => {
    const s = medKlubb()
    const k = s.klubb!
    const elleve = startellever(k).map((p) => p.spiller!.id)
    klubbVedDagsskifte(s)
    const kamp = k.kamper[0]
    expect(kamp.maal).toBeDefined()
    expect(kamp.maal!.filter((m) => !m.mot)).toHaveLength(kamp.maalFor)
    expect(kamp.maal!.filter((m) => m.mot)).toHaveLength(kamp.maalMot)
    for (const m of kamp.maal!) {
      expect(m.minutt).toBeGreaterThanOrEqual(1)
      expect(m.minutt).toBeLessThanOrEqual(90)
      if (!m.mot) {
        expect(elleve).toContain(m.id)
        expect(k.spillere.find((p) => p.id === m.id)!.posisjon).not.toBe('keeper')
        if (m.assist) expect(m.assist).not.toBe(m.navn)
      }
    }
    expect(kamp.maal!.every((m, i) => i === 0 || m.minutt >= kamp.maal![i - 1].minutt)).toBe(true)
    expect(kamp.vurderinger!.map((v) => v.id).sort()).toEqual([...elleve].sort())
    for (const v of kamp.vurderinger!) {
      expect(v.vurdering).toBeGreaterThanOrEqual(4)
      expect(v.vurdering).toBeLessThanOrEqual(10)
    }
    const beste = kamp.vurderinger!.find((v) => v.id === kamp.beste)!
    expect(kamp.vurderinger!.every((v) => v.vurdering <= beste.vurdering)).toBe(true)
  })

  it('rapporten rører ikke resultatet eller klubbens terning: samme sesong uansett', () => {
    // Samme klubb spilt to ganger gir samme tabell — og samme rapport, for den har sin egen terning.
    const a = medKlubb()
    const b = structuredClone(a)
    spillSesong(a)
    spillSesong(b)
    expect(a.klubb!.lag).toEqual(b.klubb!.lag)
    expect(a.klubb!.frø).toBe(b.klubb!.frø)
    expect(a.klubb!.kamper).toEqual(b.klubb!.kamper)
  })

  it('scorerteksten til avisa er «Etternavn (minutt)», og motstanderens scorere teller i toppscorerlista', () => {
    const s = medKlubb()
    const k = s.klubb!
    // Åtte runder: ved sesongslutt nullstilles lista.
    for (let r = 0; r < RUNDER_PER_SESONG - 1; r++) klubbVedDagsskifte(s)
    const medMaal = k.kamper.find((m) => m.maalFor > 0)!
    expect(scorertekst(medMaal)).toMatch(/^\S+ \(\d+\)(, \S+ \(\d+\))*$/)
    const liste = toppscorere(k, 50)
    const sluppet = k.kamper.reduce((sum, m) => sum + m.maalMot, 0)
    expect(liste.filter((p) => !p.deg).reduce((sum, p) => sum + p.maal, 0)).toBe(sluppet)
    expect(liste.every((p, i) => i === 0 || p.maal <= liste[i - 1].maal)).toBe(true)
  })
})

describe('statistikk og priser', () => {
  it('kamper, mål, assist og snitt samles for sesongen og karrieren; sesongen nullstilles, karrieren står', () => {
    const s = medKlubb()
    const k = s.klubb!
    for (let r = 0; r < RUNDER_PER_SESONG - 1; r++) klubbVedDagsskifte(s)
    const maal = k.kamper.reduce((sum, m) => sum + m.maalFor, 0)
    const spilt = k.spillere.filter((p) => p.sesong)
    expect(spilt.length).toBeGreaterThanOrEqual(11)
    expect(spilt.reduce((sum, p) => sum + p.sesong!.maal, 0)).toBe(maal)
    for (const p of spilt) {
      expect(p.karriere).toEqual(p.sesong)
      expect(snittvurdering(p.sesong)).toBeGreaterThanOrEqual(4)
    }
    const { toppscorer, aaretsSpiller } = sesongpriser(k)
    expect(toppscorer!.maal).toBe(Math.max(...spilt.map((p) => p.sesong!.maal)))
    expect(aaretsSpiller).not.toBeNull()
    // Navn kan gå igjen i troppen: finn den med sesongtall.
    expect(spilt.find((p) => p.navn === aaretsSpiller!.navn)!.sesong!.kamper).toBeGreaterThanOrEqual(KAMPER_FOR_PRIS)
    const karriere = new Map(k.spillere.filter((p) => p.karriere).map((p) => [p.id, { ...p.karriere! }]))
    klubbVedDagsskifte(s) // siste runde: sesongslutt
    for (const p of k.spillere) {
      expect(p.sesong).toBeUndefined()
      if (karriere.has(p.id)) expect(p.karriere!.kamper).toBeGreaterThanOrEqual(karriere.get(p.id)!.kamper)
    }
    expect(k.toppscorere).toBeUndefined()
  })
})

describe('sesongen som var', () => {
  it('skrives ved sesongslutt med plass, poeng, priser, penger og utfall — og huskes i høyst 20', () => {
    const s = medKlubb()
    const k = s.klubb!
    expect(k.sesonger).toBeUndefined()
    spillSesong(s)
    expect(k.sesonger).toHaveLength(1)
    const o = k.sesonger![0]
    expect(o.sesong).toBe(1)
    expect(o.divisjon).toBe(0)
    expect(o.plass).toBeGreaterThanOrEqual(1)
    expect(o.plass).toBeLessThanOrEqual(10)
    expect(o.poeng).toBeGreaterThanOrEqual(0)
    expect(o.aaretsSpiller).not.toBeNull()
    expect(o.billetter + o.sponsor).toBeGreaterThan(0)
    expect(o.lonn).toBeGreaterThan(0)
    expect(['opp', 'ned', 'nektet', 'samme']).toContain(o.utfall)
    expect(o.neste).toBe(k.divisjon)
    if (o.utfall === 'opp') expect(o.neste).toBe(1)
    if (o.plass === 1) expect(o.trofe).toBeDefined()
    for (let i = 0; i < SESONGER_HUSKET + 3; i++) spillSesong(s)
    expect(k.sesonger).toHaveLength(SESONGER_HUSKET)
    expect(k.sesonger![SESONGER_HUSKET - 1].sesong).toBe(SESONGER_HUSKET + 4)
  })

  it('en gammel kamp uten rapport leses fortsatt', () => {
    const s = medKlubb()
    const k = s.klubb!
    klubbVedDagsskifte(s)
    const gammel: Klubb['kamper'][number] = { sesong: 1, runde: 0, motstander: 'Skogly FK', hjemme: true, maalFor: 2, maalMot: 1 }
    expect(scorertekst(gammel)).toBe('')
    expect(toppscorere({ ...k, toppscorere: undefined, spillere: k.spillere.map((p) => ({ ...p, sesong: undefined })) })).toEqual([])
  })
})
