/** Pakke 66: en klubb som betyr noe — stadion, lisenskrav og faste lag i ligaen. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { byggStadion, kjopKlubb, selgKlubb, type Utfall } from '../handlinger'
import { nettoformue } from '../formler'
import {
  ANTALL_LAG,
  DIVISJONER,
  form,
  KLUBBNAVN,
  KLUBBSALG_HONORAR,
  klubbVedDagsskifte,
  klubbverdi,
  oppfyllerKrav,
  plassering,
  RUNDER_PER_SESONG,
  rykkerOpp,
  STADIONKRAV,
  STADIONTRINN,
  STADIONVARSEL_RUNDE,
  sponsorbelop,
  tabell,
  tilskuere,
  VIP,
} from '../klubb'
import { MIGRERINGER } from '../../state/migrering'
import type { Klubb, Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function medKlubb(navn = KLUBBNAVN[0]): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e12
  s.hoyesteFormue = 1e12
  return ok(kjopKlubb(s, navn))
}

/** Flytter klubben til en annen divisjon og bytter ett lag med den, så hver divisjon fortsatt har ti. */
function iDivisjon(k: Klubb, d: number): void {
  const gamle = k.lag.slice(1).map(({ navn, styrke }) => ({ navn, styrke }))
  const nye = k.serier[d]
  k.serier[k.divisjon] = [...gamle, nye.pop()!]
  k.serier[d] = []
  k.divisjon = d
  k.lag = [k.lag[0], ...nye.map((m) => ({ ...m, spilt: 0, vunnet: 0, uavgjort: 0, tapt: 0, maalFor: 0, maalMot: 0 }))]
}

/** Alle navnene i ligaen, ditt med. */
const ligaen = (k: Klubb) => [...k.lag.map((l) => l.navn), ...k.serier.flat().map((m) => m.navn)]

const spillSesong = (s: Spilltilstand) => {
  for (let r = 0; r < RUNDER_PER_SESONG; r++) klubbVedDagsskifte(s)
}

/** Billettene slik de var før Pakke 66: et fast beløp per divisjon ganger formen. */
const GAMMEL_BILLETT = [50_000, 200_000, 600_000, 2_000_000, 6_000_000]

describe('stadion', () => {
  it('en ny klubb starter med 700 plasser, uten flomlys og VIP, og ingenting bygd', () => {
    const k = medKlubb().klubb!
    expect(k.stadion).toEqual({ trinn: 0, flomlys: false, vip: false, investert: 0 })
    expect(STADIONTRINN[0].plasser).toBe(700)
  })

  it('med trinnet divisjonen fyller, gir billettene minst det de ga før — i all slags form', () => {
    const k = medKlubb().klubb!
    for (let d = 0; d < DIVISJONER.length; d++) {
      k.divisjon = d
      k.stadion.trinn = d
      for (const f of [0.8, 1, 1.2, 1.4]) {
        expect(tilskuere(k, f) * DIVISJONER[d].billettpris).toBeGreaterThanOrEqual(GAMMEL_BILLETT[d] * f - 1e-6)
      }
    }
  })

  it('et for lite stadion stenger publikum ute, og flomlys gir 20 % flere', () => {
    const k = medKlubb().klubb!
    k.divisjon = 2
    expect(tilskuere(k, 1)).toBe(700)
    k.stadion.trinn = 3
    expect(tilskuere(k, 1)).toBe(5_000)
    k.stadion.flomlys = true
    expect(tilskuere(k, 1)).toBe(6_000)
  })

  it('formen går fra ×0,8 uten seire til ×1,4 med bare seire', () => {
    const k = medKlubb().klubb!
    expect(form(k)).toBeCloseTo(0.8)
    k.lag[0].spilt = 4
    k.lag[0].vunnet = 4
    expect(form(k)).toBeCloseTo(1.4)
  })

  it('å bygge flytter bare penger: nettoformuen står stille, og kostprisen følger med', () => {
    let s = medKlubb()
    const før = nettoformue(s)
    const kostpris = s.klubb!.kostpris
    for (const del of ['tribune', 'tribune', 'flomlys', 'vip'] as const) s = ok(byggStadion(s, del))
    const k = s.klubb!
    const betalt = STADIONTRINN[1].pris + STADIONTRINN[2].pris + 3_000_000 + VIP.pris
    expect(k.stadion).toEqual({ trinn: 2, flomlys: true, vip: true, investert: betalt })
    expect(k.kostpris).toBe(kostpris + betalt)
    expect(nettoformue(s)).toBeCloseTo(før, 0)
  })

  it('kjøp, bygg og selg med en gang: du taper bare salæret', () => {
    let s = medKlubb()
    s = ok(byggStadion(s, 'tribune'))
    const verdi = klubbverdi(s)
    const før = nettoformue(s)
    s = ok(selgKlubb(s))
    expect(nettoformue(s)).toBeCloseTo(før - verdi * KLUBBSALG_HONORAR, 0)
  })

  it('kan ikke bygge det som er bygd, eller uten råd', () => {
    let s = medKlubb()
    s = ok(byggStadion(s, 'flomlys'))
    expect(byggStadion(s, 'flomlys').ok).toBe(false)
    for (let i = 1; i < STADIONTRINN.length; i++) s = ok(byggStadion(s, 'tribune'))
    expect(byggStadion(s, 'tribune').ok).toBe(false)
    s.kontanter = 0
    expect(byggStadion(s, 'vip').ok).toBe(false)
  })

  it('VIP-losjen gir 25 % mer i sponsor fra neste sesong', () => {
    let s = medKlubb()
    s = ok(byggStadion(s, 'vip'))
    expect(s.klubb!.sponsor).toBe(DIVISJONER[0].sponsor)
    spillSesong(s)
    expect(s.klubb!.sponsor).toBe(sponsorbelop(s.klubb!))
    expect(sponsorbelop(s.klubb!)).toBe(Math.round(DIVISJONER[s.klubb!.divisjon].sponsor * VIP.sponsor))
  })

  it('hjemmekampene viser publikum, og billettene er publikum ganger pris', () => {
    const s = medKlubb()
    spillSesong(s)
    const hjemme = s.klubb!.kamper.filter((m) => m.hjemme)
    expect(hjemme.length).toBeGreaterThan(0)
    for (const m of hjemme) expect(m.tilskuere).toBeLessThanOrEqual(STADIONTRINN[0].plasser)
    for (const m of s.klubb!.kamper.filter((x) => !x.hjemme)) expect(m.tilskuere).toBeUndefined()
  })
})

describe('lisenskravet', () => {
  it('kravet ligger ett trinn bak det divisjonen fyller, med flomlys fra 1. divisjon', () => {
    expect(STADIONKRAV.map((k) => k.trinn)).toEqual([0, 0, 1, 2, 3])
    expect(STADIONKRAV.map((k) => k.flomlys)).toEqual([false, false, false, true, true])
  })

  it('et superlag uten stadion blir i divisjonen, og nummer tre går opp i stedet', () => {
    const s = medKlubb()
    const k = s.klubb!
    iDivisjon(k, 1)
    for (const p of k.spillere) p.styrke = 95
    for (let r = 0; r < RUNDER_PER_SESONG - 1; r++) klubbVedDagsskifte(s)
    expect(plassering(k)).toBe(1)
    // Før siste runde: du står først, men de to neste er de som får gå opp.
    const opp = rykkerOpp(k).map((i) => k.lag[i].navn)
    expect(opp).not.toContain(k.navn)
    expect(opp).toEqual(tabell(k).slice(1, 3).map((i) => k.lag[i].navn))
    const gamle = k.lag.slice(1).map((l) => l.navn)
    klubbVedDagsskifte(s)
    expect(k.divisjon).toBe(1)
    expect(s.trofeer.at(-1)!.navn).toBe('Vinner av 3. divisjon')
    const nektet = s.hendelser.find((h) => h.tittel === 'Nektet opprykk')!
    const gikkOpp = k.serier[2].map((m) => m.navn).filter((n) => gamle.includes(n))
    expect(gikkOpp).toHaveLength(2)
    for (const navn of gikkOpp) expect(nektet.tekst).toContain(navn)
  })

  it('med stadion som holder, går superlaget opp', () => {
    let s = medKlubb()
    iDivisjon(s.klubb!, 1)
    s = ok(byggStadion(s, 'tribune'))
    for (const p of s.klubb!.spillere) p.styrke = 95
    spillSesong(s)
    expect(s.klubb!.divisjon).toBe(2)
  })

  it('midt i sesongen varsles et stadion som stenger for opprykk', () => {
    const s = medKlubb()
    const k = s.klubb!
    iDivisjon(k, 2)
    for (const p of k.spillere) p.styrke = 95
    for (let r = 0; r < STADIONVARSEL_RUNDE; r++) klubbVedDagsskifte(s)
    expect(plassering(k)).toBeLessThanOrEqual(2)
    expect(oppfyllerKrav(k, 3)).toBe(false)
    expect(s.hendelser.filter((h) => h.tittel === 'Stadionkrav')).toHaveLength(1)
  })
})

describe('faste lag', () => {
  it('ligaen har femti lag med hvert sitt navn: ti i hver divisjon', () => {
    const k = medKlubb().klubb!
    expect(k.serier).toHaveLength(DIVISJONER.length)
    expect(k.serier[0]).toHaveLength(0)
    for (let d = 1; d < DIVISJONER.length; d++) expect(k.serier[d]).toHaveLength(ANTALL_LAG)
    expect(new Set(ligaen(k)).size).toBe(ANTALL_LAG * DIVISJONER.length)
    expect(ligaen(k).filter((n) => KLUBBNAVN.includes(n))).toEqual([k.navn])
  })

  it('lagene går igjen: de som blir, de som rykker opp, og de som kommer ned', () => {
    // Laget ditt er svakest og blir i 4. divisjon, så de to dårligste motstanderne forsvinner.
    const s = medKlubb()
    const k = s.klubb!
    for (const p of k.spillere) p.styrke = 1
    const før = k.lag.slice(1).map((l) => l.navn)
    const fraOver = k.serier[1].map((m) => m.navn)
    spillSesong(s)
    expect(k.divisjon).toBe(0)
    const nå = k.lag.slice(1).map((l) => l.navn)
    // Ni motstandere: to gikk opp og to ut, fem ble, to kom ned og to nye kom opp nedenfra.
    expect(nå.filter((n) => før.includes(n))).toHaveLength(5)
    expect(nå.filter((n) => fraOver.includes(n))).toHaveLength(2)
    expect(k.lag.filter((l) => l.fra === 1)).toHaveLength(2)
    expect(k.lag.filter((l) => l.fra === -1)).toHaveLength(2)
    // De som falt ut, kommer ikke tilbake som nye lag med en gang.
    for (const l of k.lag.filter((x) => x.fra === -1)) expect(før).not.toContain(l.navn)
    expect(s.hendelser.some((h) => h.tittel.startsWith('Ny sesong'))).toBe(true)
  })

  it('tjue sesonger: ti lag i hver divisjon, femti navn, og styrken holder seg nær divisjonens nivå', () => {
    const s = medKlubb()
    const k = s.klubb!
    for (let sesong = 0; sesong < 20; sesong++) {
      // Et lag som er sterkt hver tredje sesong, går opp og ned gjennom ligaen.
      for (const p of k.spillere) p.styrke = sesong % 3 === 0 ? 95 : 30
      for (const p of k.spillere) p.alder = 25
      spillSesong(s)
      expect(k.lag).toHaveLength(ANTALL_LAG)
      for (let d = 0; d < DIVISJONER.length; d++) expect(k.serier[d]).toHaveLength(d === k.divisjon ? 0 : ANTALL_LAG)
      expect(new Set(ligaen(k)).size).toBe(ANTALL_LAG * DIVISJONER.length)
      k.serier.forEach((liste, d) => {
        for (const m of liste) expect(Math.abs(m.styrke - DIVISJONER[d].styrke)).toBeLessThanOrEqual(25)
      })
    }
    expect(k.opprykk).toBeGreaterThan(0)
  })
})

describe('migrering 22 → 23', () => {
  it('klubben får tribunene divisjonen fyller, gratis, og seriene — uten å røre klubbens terning', () => {
    const s = medKlubb()
    const k = s.klubb! as Partial<Klubb> & Klubb
    iDivisjon(k, 3)
    const frø = k.frø
    const lag = k.lag.map((l) => l.navn)
    const gammel = { ...k } as Partial<Klubb>
    delete gammel.stadion
    delete gammel.serier
    const verdiFør = klubbverdi(s)
    const m = MIGRERINGER[22]({ ...s, klubb: gammel } as unknown as Record<string, unknown>) as unknown as Spilltilstand
    const nk = m.klubb!
    expect(nk.stadion).toEqual({ trinn: 3, flomlys: true, vip: false, investert: 0 })
    expect(nk.frø).toBe(frø)
    expect(nk.lag.map((l) => l.navn)).toEqual(lag)
    expect(new Set(ligaen(nk)).size).toBe(ANTALL_LAG * DIVISJONER.length)
    expect(klubbverdi(m)).toBe(verdiFør)
    expect(oppfyllerKrav(nk, 3)).toBe(true)
  })

  it('uten klubb endres ingenting', () => {
    const s = { klubb: null }
    expect(MIGRERINGER[22](s)).toBe(s)
  })
})
