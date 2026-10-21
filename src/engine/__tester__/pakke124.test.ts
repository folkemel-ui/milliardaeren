/** Pakke 124: markeder med innhold — råvarer, formuesforvalter og sparing av inntekten. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { simuler } from '../simulering'
import { forvalterBelop, kjopPapir, settSparandel, startForvalter, stoppForvalter, type Utfall } from '../handlinger'
import { bedriftInntektIDag, dagensFaktor } from '../formler'
import { DAG_SEK, erHelg, ukedag } from '../kalender'
import { markedstikk, NYE_PAPIRER, PAPIRER, RAVARER, rundAntall } from '../marked'
import { FOND } from '../fond'
import { RAVARE_TRENDDRIFT, trenddrift } from '../bransjer'
import { dagsbilde, ukensTrend } from '../verden'
import { RAVARE_FOR, ravarefaktor, ravarenivaa, RAVARESNITT } from '../ravarer'
import { blanding, erPapirpost, FORVALTER_GEBYR, forvalterVedDagsskifte, forvaltetVerdi, PROFILER, PROFILLISTE } from '../forvalter'
import { MIGRERINGER } from '../../state/migrering'
import { Terning } from '../rng'
import { bedrift } from './hjelp'
import type { PapirId, Spilltilstand } from '../types'
import { Papirliste } from '../../ui/screens/investeringer/Bors'
import { Formuesforvalter } from '../../ui/komponenter/Formuesforvalter'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill på en hverdag (spillet starter mandag). */
function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e10
  s.hoyesteFormue = 1e10
  return s
}

/** Første sekund i en uke der olje er het eller kald, fra dag `fra`. */
function oljeuke(fra = 0): { dag: number; het: boolean } {
  const s = nyttSpill()
  for (let d = fra; d < fra + 7 * 400; d += 7) {
    s.sek = d * DAG_SEK
    const t = ukensTrend(s)
    if (t.het === 'oljeselskap') return { dag: d, het: true }
    if (t.kald === 'oljeselskap') return { dag: d, het: false }
  }
  throw new Error('ingen oljeuke')
}

describe('råvarene', () => {
  it('olje, laks og gull er en egen klasse, nye papirer fra en hash, uten bransje og utenfor fondene', () => {
    expect(RAVARER).toEqual(['OLJ', 'LAK', 'GLD'])
    for (const id of RAVARER) {
      expect(PAPIRER[id].klasse).toBe('ravare')
      expect(NYE_PAPIRER).toContain(id)
      expect(PAPIRER[id].bransje).toBeUndefined()
      expect(PAPIRER[id].utbytte).toBe(0)
      expect(rundAntall(id, 2.7)).toBe(2)
    }
    for (const f of Object.values(FOND)) for (const id of RAVARER) expect(f.medlemmer).not.toContain(id)
  })

  it('står stille i helgen, som aksjene, og kan da ikke handles', () => {
    const s = rik()
    s.sek = 5 * DAG_SEK
    expect(erHelg(s.sek)).toBe(true)
    expect(kjopPapir(s, 'OLJ', 1).ok).toBe(false)
    s.sek = 7 * DAG_SEK
    expect(kjopPapir(s, 'OLJ', 1).ok).toBe(true)
  })

  it('gullet går mot konjunkturen: i en lavkonjunktur stiger det mens aksjene faller', () => {
    const s = nyttSpill()
    const m = structuredClone(s.marked)
    const gull = m.kurser.GLD.fundament
    const aksje = m.kurser.NFS.fundament
    markedstikk(m, new Terning(1), false, { aksjer: -0.04, eiendom: 0 })
    const dt = 5 / 3600
    expect(m.kurser.GLD.fundament / gull).toBeCloseTo(Math.exp((PAPIRER.GLD.drift + 0.04) * dt), 12)
    expect(m.kurser.NFS.fundament / aksje).toBeCloseTo(Math.exp((PAPIRER.NFS.drift - 0.04) * dt), 12)
  })
})

describe('oljeselskapet og fiskeoppdrettet følger prisen', () => {
  it('faktoren er e^avvik delt på snittet, uten ditt kurstrykk, og holdt mellom 0,5 og 1,6', () => {
    const s = rik()
    s.marked.kurser.OLJ.avvik = Math.log(RAVARESNITT.OLJ! * 1.2)
    expect(ravarefaktor(s, 'oljeselskap')).toBeCloseTo(1.2, 10)
    expect(ravarefaktor(s, 'kiosk')).toBe(1)
    // Ditt eget kjøp løfter kursen, men ikke inntekten.
    const t = ok(kjopPapir(s, 'OLJ', 1_000_000))
    expect(t.marked.kurser.OLJ.kurs).toBeGreaterThan(s.marked.kurser.OLJ.kurs)
    expect(ravarefaktor(t, 'oljeselskap')).toBeCloseTo(1.2, 10)
    s.marked.kurser.LAK.avvik = 3
    expect(ravarenivaa(s, 'LAK')).toBe(1.6)
    expect(RAVARE_FOR).toEqual({ oljeselskap: 'OLJ', fiskeoppdrett: 'LAK' })
  })

  it('kortet og kassen er enige: ett sekund betaler det kortet viser, med oljeprisen', () => {
    const s = rik()
    s.bedrifter = [bedrift('oljeselskap', { nivaa: 20, leder: true })]
    s.marked.kurser.OLJ.avvik = Math.log(RAVARESNITT.OLJ! * 1.3)
    const vist = bedriftInntektIDag(s, s.bedrifter[0])
    const før = s.kontanter
    const etter = simuler(s, 1)
    expect((etter.kontanter - før) / vist).toBeCloseTo(1, 3)
    s.marked.kurser.OLJ.avvik = Math.log(RAVARESNITT.OLJ!)
    expect(vist / bedriftInntektIDag(s, s.bedrifter[0])).toBeCloseTo(1.3, 6)
  })

  it('en het eller kald oljeuke drar oljeprisen, ikke inntekten direkte', () => {
    const { dag, het } = oljeuke()
    const s = nyttSpill()
    s.sek = dag * DAG_SEK
    expect(dagsbilde(s).faktor.oljeselskap).toBeCloseTo(dagsbilde(s).faktor.oljeselskap, 10)
    expect(trenddrift(s).OLJ).toBe(het ? RAVARE_TRENDDRIFT : -RAVARE_TRENDDRIFT)
    // Dagens faktor for oljeselskapet har ingen ±20 % fra trenden, bare oljeprisen.
    s.marked.kurser.OLJ.avvik = Math.log(RAVARESNITT.OLJ!)
    const uten = dagensFaktor(s, 'oljeselskap')
    expect(Math.abs(uten - 1.2)).toBeGreaterThan(0.01)
    expect(Math.abs(uten - 0.8)).toBeGreaterThan(0.01)
  })
})

describe('lagringsversjon 28', () => {
  it('versjon 27 → 28 legger til råvarene og lar terningen og de andre kursene stå', () => {
    expect(SPILLVERSJON).toBeGreaterThanOrEqual(28)
    const s = simuler(nyttSpill(), DAG_SEK)
    const gammel = structuredClone(s) as unknown as Record<string, unknown>
    const kurser = { ...(s.marked.kurser as Record<string, unknown>) }
    for (const id of RAVARER) delete kurser[id]
    gammel.marked = { ...s.marked, kurser }
    const m = MIGRERINGER[27](gammel) as unknown as Spilltilstand
    expect(m.frø).toBe(s.frø)
    for (const id of RAVARER) {
      expect(m.marked.kurser[id].kurs).toBe(PAPIRER[id].startkurs)
      expect(m.marked.kurser[id].historikk.length).toBeGreaterThan(100)
    }
    for (const id of Object.keys(s.marked.kurser).filter((x) => !RAVARER.includes(x as PapirId))) expect(m.marked.kurser[id as PapirId], id).toEqual(s.marked.kurser[id as PapirId])
  })
})

describe('formuesforvalteren', () => {
  it('hver profil summerer til 1, og ingen tar krypto', () => {
    for (const p of PROFILLISTE) {
      const b = blanding(p)
      expect([...b.values()].reduce((a, x) => a + x, 0), p).toBeCloseTo(1, 10)
      for (const k of b.keys()) if (erPapirpost(k)) expect(PAPIRER[k].klasse).not.toBe('krypto')
    }
    expect(PROFILER.offensiv.obligasjon).toBe(0)
  })

  it('start tar første ukes gebyr; et innskudd fordeles etter profilen; kryptoen står', () => {
    let s = rik()
    s = ok(kjopPapir(s, 'VKT', 1000))
    const krypto = s.beholdning.VKT!.antall
    s = ok(startForvalter(s, 'balansert'))
    expect(s.forvalter?.gebyrBetalt).toBe(0)
    s = ok(forvalterBelop(s, 1e9))
    const v = forvaltetVerdi(s)
    // Kurtasje og fondsgebyr tar litt, ditt eget kurstrykk løfter litt; resten står i blandingen.
    expect(v).toBeGreaterThan(0.97e9)
    expect(v).toBeLessThan(1.01e9)
    const obl = (s.obligasjoner?.kort?.palydende ?? 0) / v
    expect(obl).toBeGreaterThan(0.22)
    expect(obl).toBeLessThan(0.28)
    expect(s.fond.BORSFOND).toBeDefined()
    expect(s.beholdning.GLD).toBeDefined()
    expect(s.beholdning.VKT!.antall).toBe(krypto)
  })

  it('hver mandag: gebyret er 0,2 % av det den forvalter, og blandingen bringes tilbake', () => {
    let s = rik()
    s = ok(startForvalter(s, 'forsiktig'))
    s = ok(forvalterBelop(s, 5e8))
    // Skyv blandingen: selg obligasjonene utenom forvalteren.
    s.obligasjoner = {}
    s.sek = 7 * DAG_SEK
    expect(ukedag(s.sek)).toBe(0)
    const v = forvaltetVerdi(s)
    const før = s.forvalter!.gebyrBetalt
    forvalterVedDagsskifte(s)
    expect(s.forvalter!.gebyrBetalt - før).toBeCloseTo(FORVALTER_GEBYR * v, 0)
    expect(s.forvalter!.siste?.kjopt).toBeGreaterThan(0)
    expect((s.obligasjoner?.kort?.palydende ?? 0) / forvaltetVerdi(s)).toBeGreaterThan(0.3)
    expect(s.hendelser.at(-1)?.tittel).toBe('Formuesforvalteren')
    // Tirsdag gjør den ingenting.
    const g = s.forvalter!.gebyrBetalt
    s.sek += DAG_SEK
    forvalterVedDagsskifte(s)
    expect(s.forvalter!.gebyrBetalt).toBe(g)
  })

  it('tar ut til kontantene, handler ikke i helgen, og etter oppsigelsen står alt som ditt', () => {
    let s = rik()
    s = ok(startForvalter(s, 'offensiv'))
    s = ok(forvalterBelop(s, 1e9))
    const kontanter = s.kontanter
    s = ok(forvalterBelop(s, -5e8))
    expect(s.kontanter - kontanter).toBeGreaterThan(4.8e8)
    const helg = structuredClone(s)
    helg.sek = 5 * DAG_SEK
    expect(forvalterBelop(helg, 1e8).ok).toBe(false)
    expect(startForvalter(helg, 'balansert').ok).toBe(false)
    const v = forvaltetVerdi(s)
    s = ok(stoppForvalter(s))
    expect(s.forvalter).toBeUndefined()
    expect(forvaltetVerdi(s)).toBeCloseTo(v, 0)
  })
})

describe('sparing av inntekten', () => {
  it('en andel av inntekten går rett på sparekontoen hvert sekund', () => {
    let s = rik()
    s.bedrifter = [bedrift('kiosk', { nivaa: 30, leder: true })]
    s = ok(settSparandel(s, 0.25))
    expect(settSparandel(s, 0.3).ok).toBe(false)
    const inntekt = bedriftInntektIDag(s, s.bedrifter[0])
    const spart = s.sparing
    const t = simuler(s, 1)
    expect((t.sparing - spart) / inntekt).toBeCloseTo(0.25, 2)
    expect(ok(settSparandel(t, 0)).sparandel).toBeUndefined()
  })
})

describe('skjermene', () => {
  it('råvarelista viser nivået mot vanlig og enhetene; forvalteren har tre profiler', () => {
    const s = rik()
    const liste = tekst(createElement(Papirliste, { s, klasse: 'ravare', velg: () => {} }))
    expect(liste).toContain('Alle råvarer')
    expect(liste).toContain('Nordsjøolje')
    expect(liste).toContain('Per fat')
    expect(liste).toContain('Oljeselskapet og fiskeoppdrettet tjener i takt med prisen')
    const f = tekst(createElement(Formuesforvalter, { s }))
    for (const p of PROFILLISTE) expect(f).toContain(PROFILER[p].navn)
    expect(f).toContain('0,2 %')
  })
})
