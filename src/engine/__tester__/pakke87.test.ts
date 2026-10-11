/** Pakke 87: mer å vinne — kvalik ved hver grense, supercupen og trofeskapet. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { kjopKlubb, type Utfall } from '../handlinger'
import { ANTALL_LAG, CUPMESTER, DIVISJONER, klubbVedDagsskifte, KLUBBNAVN, KVALIK, plassering, RUNDER_PER_SESONG, SUPERCUPMESTER } from '../klubb'
import type { Kamp, Klubb, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(fro = 87): Spilltilstand {
  const s = nyttSpill(fro)
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

const vant = (m: Kamp) => m.maalFor > m.maalMot || m.straffer === 'deg'

/** Flytter klubben til en annen divisjon og bytter ett lag med den, så hver divisjon fortsatt har ti (som i pakke66). */
function iDivisjon(k: Klubb, d: number): void {
  const gamle = k.lag.slice(1).map(({ navn, styrke }) => ({ navn, styrke }))
  const nye = k.serier[d]
  k.serier[k.divisjon] = [...gamle, nye.pop()!]
  k.serier[d] = []
  k.divisjon = d
  k.lag = [k.lag[0], ...nye.map((m) => ({ ...m, spilt: 0, vunnet: 0, uavgjort: 0, tapt: 0, maalFor: 0, maalMot: 0 }))]
}

/** Spiller åtte runder og låser tabellen så du står på `plass` (1–10) før siste runde. */
function førSisteRunde(s: Spilltilstand, plass: number): void {
  const k = s.klubb!
  for (let r = 0; r < RUNDER_PER_SESONG - 1; r++) klubbVedDagsskifte(s)
  // Store poengforskjeller, så siste runde ikke kan flytte noen.
  const rekke = [...k.lag.keys()].filter((i) => i !== 0)
  rekke.splice(plass - 1, 0, 0)
  rekke.forEach((i, n) => {
    const l = k.lag[i]
    l.vunnet = 100 - n * 10
    l.uavgjort = 0
    l.tapt = 0
  })
}

describe('kvalik', () => {
  it('nummer 3 og 4 nedenfra møter nummer 8 og 7 ovenfra', () => {
    expect(KVALIK).toEqual([
      [2, 7],
      [3, 6],
    ])
  })

  it('på tredjeplass spiller du kvalik borte mot nummer 8 i divisjonen over; vinner du, går du opp', () => {
    let funnet = 0
    for (let fro = 1; fro <= 6; fro++) {
      const s = medKlubb(fro)
      const k = s.klubb!
      k.stadion = { trinn: 4, flomlys: true, vip: true, investert: 0 }
      førSisteRunde(s, 3)
      klubbVedDagsskifte(s)
      const kamp = k.kamper.find((m) => m.turnering === 'kvalik')
      expect(kamp, `frø ${fro}`).toBeDefined()
      expect(kamp!.hjemme).toBe(false)
      expect(k.divisjon).toBe(vant(kamp!) ? 1 : 0)
      expect(k.sesonger!.at(-1)!.kvalik).toMatch(/^Kvalik mot /)
      // Alle divisjonene har fortsatt ti lag.
      expect(k.lag).toHaveLength(ANTALL_LAG)
      for (let d = 0; d < DIVISJONER.length; d++) if (d !== k.divisjon) expect(k.serier[d]).toHaveLength(ANTALL_LAG)
      funnet++
    }
    expect(funnet).toBe(6)
  })

  it('uten stadion for divisjonen over spiller du ikke kvalik — neste lag tar plassen', () => {
    // 3. divisjon: 2. divisjon krever et større stadion enn det en ny klubb har.
    const s = medKlubb()
    iDivisjon(s.klubb!, 1)
    førSisteRunde(s, 3)
    expect(plassering(s.klubb!)).toBe(3)
    klubbVedDagsskifte(s)
    expect(s.klubb!.kamper.some((m) => m.turnering === 'kvalik')).toBe(false)
    expect(s.klubb!.divisjon).toBe(1)
  })

  it('på femteplass er sesongen ferdig: ingen kvalik', () => {
    const s = medKlubb()
    s.klubb!.stadion = { trinn: 4, flomlys: true, vip: true, investert: 0 }
    førSisteRunde(s, 5)
    klubbVedDagsskifte(s)
    expect(s.klubb!.kamper.some((m) => m.turnering === 'kvalik')).toBe(false)
  })
})

describe('supercupen', () => {
  it('cupmesteren møter seriemesteren i Eliteserien på dag 1 neste sesong', () => {
    let testet = false
    for (let fro = 1; fro <= 10 && !testet; fro++) {
      const s = medKlubb(fro)
      const k = s.klubb!
      for (const p of k.spillere) p.styrke = p.angrep = p.forsvar = 99
      for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
      if (!s.trofeer.some((t) => t.navn === CUPMESTER)) continue
      expect(k.supercup).toBeDefined()
      expect(k.supercup!.sesong).toBe(k.sesong)
      expect(k.supercup!.hjemme).toBe(false)
      const trofeer = s.trofeer.length
      klubbVedDagsskifte(s)
      const kamp = k.kamper.find((m) => m.turnering === 'supercup')!
      expect(kamp).toBeDefined()
      expect(kamp.motstander).toBeTruthy()
      expect(k.supercup).toBeUndefined()
      expect(s.trofeer.length).toBe(trofeer + (vant(kamp) ? 1 : 0))
      if (vant(kamp)) expect(s.trofeer.at(-1)!.navn).toBe(SUPERCUPMESTER)
      testet = true
    }
    expect(testet).toBe(true)
  })

  it('uten seriegull i Eliteserien eller cupen: ingen supercup', () => {
    const s = medKlubb()
    for (const p of s.klubb!.spillere) p.styrke = p.angrep = p.forsvar = 1
    for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
    expect(s.klubb!.supercup).toBeUndefined()
  })
})
