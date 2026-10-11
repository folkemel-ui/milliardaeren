/** Pakke 86: kampen direkte — resultatet skjult til fløyta, motstandernes halvdel i rapporten og vurderingskurven. */

import { describe, expect, it } from 'vitest'
import { kjopKlubb, type Utfall } from '../../engine/handlinger'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import { klubbVedDagsskifte, KLUBBNAVN, RUNDER_PER_SESONG, tabell } from '../../engine/klubb'
import { sjekkPrestasjoner } from '../../engine/prestasjoner'
import { simuler } from '../../engine/simulering'
import { nyttSpill } from '../../engine/start'
import type { Spilltilstand } from '../../engine/types'
import { nytt } from '../hendelsesstrom'
import { vises } from '../innstillinger'
import { kampminutt, liveKamper, stilling, visKlubb } from '../klubblive'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(): Spilltilstand {
  const s = nyttSpill(86)
  s.kontanter = 1e9
  s.hoyesteFormue = 1e9
  return ok(kjopKlubb(s, KLUBBNAVN[0]))
}

/** Spiller fram til rett etter neste dagsskifte. */
function tilDagsskiftet(s: Spilltilstand): Spilltilstand {
  return simuler(s, DAG_SEK - (s.sek % DAG_SEK))
}

describe('kampen spilles gjennom dagen', () => {
  it('kampen får dagen den spilles, og minuttet går 0 → 90 over 300 s', () => {
    const s = tilDagsskiftet(medKlubb())
    const live = liveKamper(s)
    expect(live.length).toBeGreaterThan(0)
    expect(live.every((m) => m.dag === dagnummer(s.sek))).toBe(true)
    expect(kampminutt(s.sek)).toBe(0)
    expect(kampminutt(s.sek + DAG_SEK / 2)).toBe(45)
    expect(kampminutt(s.sek + DAG_SEK - 1)).toBe(89)
    // Stillingen etter 90 minutter er resultatet.
    const m = live[0]
    expect(stilling(m, 90)).toMatchObject({ for: m.maalFor, mot: m.maalMot })
    expect(stilling(m, 0).maal).toEqual([])
  })

  it('sidene viser klubben slik den var før runden: tabellen, formen og spillernes tall', () => {
    const før = medKlubb()
    // Rett før dagsskiftet, og rett etter.
    const s0 = simuler(før, DAG_SEK - 1)
    const s1 = simuler(s0, 1)
    const k0 = s0.klubb!
    const vist = visKlubb(s1, s1.klubb!)
    expect(vist.kamper).toHaveLength(k0.kamper.length)
    expect(vist.lag.map((l) => [l.navn, l.spilt, l.maalFor, l.maalMot])).toEqual(k0.lag.map((l) => [l.navn, l.spilt, l.maalFor, l.maalMot]))
    expect(tabell(vist)).toEqual(tabell(k0))
    expect(vist.seire).toBe(k0.seire)
    for (const p of vist.spillere) {
      const fra = k0.spillere.find((x) => x.id === p.id)
      if (fra) expect(p.sesong?.kamper ?? 0).toBe(fra.sesong?.kamper ?? 0)
    }
    // Ved neste dagsskifte er kampen ferdig og vises som den er.
    const s2 = tilDagsskiftet(s1)
    expect(visKlubb(s2, s2.klubb!).kamper.map((m) => m.runde)).toContain(0)
  })

  it('i siste serierunde, når sesongen alt er gjort opp, venter tabellen', () => {
    let s = medKlubb()
    for (let r = 0; r < RUNDER_PER_SESONG; r++) s = tilDagsskiftet(s)
    const vist = visKlubb(s, s.klubb!)
    expect(s.klubb!.sesong).toBe(2)
    expect(vist.sesong).toBe(1)
    expect(vist.tabellVenter).toBe(true)
    expect((vist.sesonger ?? []).some((x) => x.sesong === 1)).toBe(false)
  })
})

describe('det som forteller resultatet, venter til fløyta', () => {
  it('avisa skriver om kampen dagen etter', () => {
    const s = medKlubb()
    const første = klubbVedDagsskifte(s)
    expect(første).toEqual([])
    const andre = klubbVedDagsskifte(s)
    expect(andre[0].tittel).toContain(s.klubb!.navn)
  })

  it('«Tre poeng» kommer når seieren er spilt ferdig', () => {
    const s = medKlubb()
    for (const p of s.klubb!.spillere) p.styrke = p.angrep = p.forsvar = 99
    klubbVedDagsskifte(s)
    expect(s.klubb!.seire).toBeGreaterThan(0)
    sjekkPrestasjoner(s)
    expect(s.prestasjoner['forste-seier']).toBeUndefined()
    klubbVedDagsskifte(s)
    sjekkPrestasjoner(s)
    expect(s.prestasjoner['forste-seier']).toBeDefined()
  })
})

describe('varslene', () => {
  it('et mål meldes i sitt minutt, og fløyta ved dagsskiftet', () => {
    let s = tilDagsskiftet(medKlubb())
    const m = liveKamper(s)[0]
    const maal = m.maal ?? []
    let funnMaal = 0
    // Spill dagen sekund for sekund i biter på fem sekunder, som i levende spill.
    for (let t = 0; t < DAG_SEK; t += 5) {
      const neste = simuler(s, 5)
      funnMaal += nytt(s, neste).filter((f) => f.type === 'maal').length
      if (dagnummer(neste.sek) > dagnummer(s.sek)) {
        expect(nytt(s, neste).some((f) => f.type === 'slutt')).toBe(true)
      }
      s = neste
    }
    expect(funnMaal).toBeGreaterThanOrEqual(maal.length)
  })

  it('etter tid borte meldes ikke målene ett for ett, bare fløyta', () => {
    const s = tilDagsskiftet(medKlubb())
    const etter = simuler(s, DAG_SEK)
    const funn = nytt(s, etter)
    expect(funn.filter((f) => f.type === 'maal')).toEqual([])
    expect(funn.some((f) => f.type === 'slutt')).toBe(true)
  })

  it('fløyta er viktig; målene vises bare med «Alle»', () => {
    expect(vises({ type: 'slutt', tittel: 'Slutt', tekst: '' }, 'viktige')).toBe(true)
    expect(vises({ type: 'maal', tittel: 'MÅL!', tekst: '', egne: true }, 'viktige')).toBe(false)
    expect(vises({ type: 'maal', tittel: 'MÅL!', tekst: '', egne: true }, 'alle')).toBe(true)
  })
})

describe('rapporten og kurven', () => {
  it('rapporten har motstanderens beste, og hver spiller får sesongens vurderinger', () => {
    const s = medKlubb()
    for (let r = 0; r < 3; r++) klubbVedDagsskifte(s)
    const k = s.klubb!
    const m = k.kamper.filter((x) => !x.turnering).at(-1)!
    expect(m.motBeste?.navn).toBeTruthy()
    expect(m.motBeste!.vurdering).toBeGreaterThanOrEqual(4)
    expect(m.motBeste!.vurdering).toBeLessThanOrEqual(10)
    // Scoret de, er den beste deres en av scorerne.
    const deres = (m.maal ?? []).filter((x) => x.mot).map((x) => x.navn)
    if (deres.length > 0) expect(deres).toContain(m.motBeste!.navn)
    for (const p of k.spillere.filter((x) => x.sesong)) expect(p.sesong!.vurderinger).toHaveLength(p.sesong!.kamper)
  })
})
