/**
 * Pakke 73 — cup og Europa: en utslagsturnering med alle femti lagene ved
 * siden av serien, Europa for Eliteserie-mesteren, og TV- og premiepenger.
 * Alt nytt er valgfrie felt; ingen lagringsversjon.
 */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopKlubb, type Utfall } from '../handlinger'
import {
  ANTALL_LAG,
  CUP_PREMIE,
  CUP_RUNDEPREMIE,
  CUPDAGER,
  CUPMESTER,
  CUPRUNDER,
  CUPSEEDER,
  DIVISJONER,
  EUROPA_PREMIER,
  EUROPA_STATUS,
  EUROPADAGER,
  EUROPAKLUBBER,
  EUROPAMESTER,
  EUROPARUNDER,
  KLUBBNAVN,
  klubbstatus,
  klubbVedDagsskifte,
  naaddTekst,
  nesteUtslagskamp,
  nyCup,
  PLASSPREMIE,
  RUNDER_PER_SESONG,
  TROFE_STATUS,
  TV_PENGER,
  tvpenger,
} from '../klubb'
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

/** Flytter klubben til en annen divisjon og bytter ett lag med den (som i pakke66.test.ts). */
function iDivisjon(k: Klubb, d: number): void {
  const gamle = k.lag.slice(1).map(({ navn, styrke }) => ({ navn, styrke }))
  const nye = k.serier[d]
  k.serier[k.divisjon] = [...gamle, nye.pop()!]
  k.serier[d] = []
  k.divisjon = d
  k.lag = [k.lag[0], ...nye.map((m) => ({ ...m, spilt: 0, vunnet: 0, uavgjort: 0, tapt: 0, maalFor: 0, maalMot: 0 }))]
}

const superlag = (k: Klubb) => {
  for (const p of k.spillere) p.styrke = p.angrep = p.forsvar = 99
}

const spillSesong = (s: Spilltilstand) => {
  for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
}

describe('cupen', () => {
  it('trekkes med alle femti lagene på dag 1, de fjorten beste står over første runde', () => {
    const s = medKlubb()
    const k = s.klubb!
    expect(k.cup).toBeUndefined()
    const cup = nyCup(k)
    expect(cup.lag).toHaveLength(ANTALL_LAG * DIVISJONER.length)
    expect(new Set(cup.lag.map((l) => l.navn)).size).toBe(50)
    expect(cup.lag.filter((l) => l.deg)).toHaveLength(1)
    // Seedene bakerst: Eliteseriens ti og fire fra 1. divisjon.
    const seeder = cup.lag.slice(-CUPSEEDER).map((l) => l.navn)
    for (const m of k.serier[4]) expect(seeder).toContain(m.navn)
    expect(seeder.filter((n) => k.serier[3].some((m) => m.navn === n))).toHaveLength(CUPSEEDER - ANTALL_LAG)
    expect(CUPDAGER).toHaveLength(CUPRUNDER.length)
  })

  it('spilles på faste dager ved siden av serien, med rapport, og uavgjort avgjøres på straffer', () => {
    const s = medKlubb()
    const k = s.klubb!
    spillSesong(s)
    const cup = k.kamper.filter((m) => m.turnering === 'cup')
    expect(cup.length).toBeGreaterThanOrEqual(1)
    for (const m of cup) {
      expect(m.maal).toBeDefined()
      expect(m.vurderinger).toHaveLength(11)
      if (m.maalFor === m.maalMot) expect(['deg', 'dem']).toContain(m.straffer)
      else expect(m.straffer).toBeUndefined()
    }
    // Serien gikk som den skulle: sesongen er over, cupen kom i tillegg.
    expect(k.sesong).toBe(2)
    expect(k.sesonger![0].cup).toBeDefined()
    expect(k.cup).toBeUndefined()
  })

  it('et superlag vinner cupen: seks runder, premie per runde pluss 40 mill, og et trofé', () => {
    const s = medKlubb()
    const k = s.klubb!
    superlag(k)
    spillSesong(s)
    const cup = k.kamper.filter((m) => m.turnering === 'cup')
    // De siste ti kampene huskes: cupfinalen er med, og trofeet står.
    expect(cup.some((m) => m.runde === CUPRUNDER.length - 1)).toBe(true)
    expect(s.trofeer.filter((t) => t.navn === CUPMESTER)).toHaveLength(1)
    expect(k.sesonger![0].cup).toBe(CUPMESTER)
    // Pengene: seks runder vunnet i 4. divisjon (300 000 × 2 % hver) + 40 mill + plasspremien, i tillegg til billetter og sponsor.
    const premier = k.sesonger![0].premier!
    expect(premier).toBe(Math.round(TV_PENGER[0] * CUP_RUNDEPREMIE) * CUPRUNDER.length + CUP_PREMIE + Math.round(TV_PENGER[0] * PLASSPREMIE[0]))
  })

  it('neste motstander er paret ditt i lista — ingen for en seed i første runde', () => {
    const s = medKlubb()
    const k = s.klubb!
    iDivisjon(k, 4)
    const cup = nyCup(k)
    expect(cup.lag.slice(-CUPSEEDER).some((l) => l.deg)).toBe(true)
    expect(nesteUtslagskamp(cup)).toBeNull()
    expect(naaddTekst(cup, 'cup')).toContain('1. runde')
    expect(nesteUtslagskamp(undefined)).toBeNull()
  })
})

describe('Europa', () => {
  it('seriegull i Eliteserien gir Europa neste sesong: åtte lag, tre runder på dag 2, 4 og 6', () => {
    const s = medKlubb()
    const k = s.klubb!
    iDivisjon(k, 4)
    k.stadion = { trinn: 4, flomlys: true, vip: true, investert: 0 }
    superlag(k)
    spillSesong(s)
    expect(s.trofeer.some((t) => t.navn.includes('Eliteserien'))).toBe(true)
    const e = k.europa!
    expect(e).toBeDefined()
    expect(e.sesong).toBe(k.sesong)
    expect(e.lag).toHaveLength(8)
    for (const l of e.lag) if (!l.deg) expect(EUROPAKLUBBER).toContain(l.navn)
    expect(EUROPADAGER).toHaveLength(EUROPARUNDER.length)
    // Neste sesong: tre kamper, og med 99 i alt vinner laget som regel — men ikke alltid, så vi sjekker rundene.
    spillSesong(s)
    const europa = k.kamper.filter((m) => m.turnering === 'europa')
    expect(europa.length).toBeGreaterThanOrEqual(1)
    expect(k.sesonger![1].europa).toBeDefined()
    if (k.sesonger![1].europa === EUROPAMESTER) {
      expect(s.trofeer.filter((t) => t.navn === EUROPAMESTER)).toHaveLength(1)
      expect(k.sesonger![1].premier!).toBeGreaterThanOrEqual(EUROPA_PREMIER[0] + EUROPA_PREMIER[1] + EUROPA_PREMIER[2])
    }
  })

  it('et europeisk trofé gir mer status enn de andre', () => {
    const s = medKlubb()
    const før = klubbstatus(s)
    s.trofeer.push({ navn: CUPMESTER, sesong: 1, klubb: s.klubb!.navn })
    expect(klubbstatus(s)).toBe(før + TROFE_STATUS)
    s.trofeer.push({ navn: EUROPAMESTER, sesong: 1, klubb: s.klubb!.navn })
    expect(klubbstatus(s)).toBe(før + TROFE_STATUS + EUROPA_STATUS)
  })
})

describe('klubbens regnskap', () => {
  it('TV-pengene kommer med sponsoren ved sesongstart, premien etter plassering, og alt står i oppsummeringen', () => {
    const s = medKlubb()
    const k = s.klubb!
    expect(k.tv).toBe(tvpenger(k))
    expect(tvpenger(k)).toBe(TV_PENGER[0])
    superlag(k)
    spillSesong(s)
    const o = k.sesonger![0]
    expect(o.tv).toBe(TV_PENGER[0])
    expect(o.premier).toBeGreaterThanOrEqual(Math.round(TV_PENGER[0] * PLASSPREMIE[0]))
    // Ny sesong: TV for den nye divisjonen (opprykk), tellerne nullstilt.
    expect(k.tv).toBe(TV_PENGER[k.divisjon])
    expect(k.premier).toBeUndefined()
    expect(TV_PENGER.every((v, i) => i === 0 || v > TV_PENGER[i - 1])).toBe(true)
  })
})
