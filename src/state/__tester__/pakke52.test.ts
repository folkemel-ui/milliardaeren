/**
 * Pakke 52 — en lagring som holder seg liten: historikkene lagres med sju
 * gjeldende sifre, alt annet nøyaktig, og ingen liste i tilstanden vokser
 * uten tak.
 */

import { describe, expect, it } from 'vitest'
import { HISTORIKK_SIFRE, tilLagring } from '../lagringsformat'
import { migrer } from '../migrering'
import { simuler } from '../../engine/simulering'
import { nettoformue } from '../../engine/formler'
import { nyttSpill } from '../../engine/start'
import { DAG_SEK } from '../../engine/kalender'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import type { Spilltilstand } from '../../engine/types'

/** Tilstanden uten historikkene — det som skal lagres nøyaktig. */
function utenHistorikk(s: Spilltilstand): unknown {
  return JSON.parse(JSON.stringify(s), (nøkkel, verdi) =>
    nøkkel === 'historikk' || nøkkel === 'inntektHistorikk' || nøkkel === 'punkter' ? undefined : verdi,
  )
}

const fraLagring = (tekst: string): Spilltilstand => {
  const r = migrer(JSON.parse(tekst))
  if (!r.ok) throw new Error(r.feil)
  return r.tilstand
}

/** Et sent spill som har levd en stund, så alle historikkene er fulle. */
const SENT = simuler(fulltSpill(), 2 * DAG_SEK)

describe('lagringen', () => {
  it('runder bare historikkene, til sju gjeldende sifre', () => {
    const tilbake = fraLagring(tilLagring(SENT))
    expect(utenHistorikk(tilbake)).toEqual(utenHistorikk(SENT))
    const før = SENT.marked.kurser.NFS.historikk
    const etter = tilbake.marked.kurser.NFS.historikk
    expect(etter).toHaveLength(før.length)
    for (let i = 0; i < før.length; i++) expect(etter[i]).toBe(Number(før[i].toPrecision(HISTORIKK_SIFRE)))
    expect(tilbake.historikk.punkter.map((p) => p.sek)).toEqual(SENT.historikk.punkter.map((p) => p.sek))
  })

  it('ingen spilleregel merker rundingen: en time videre blir nøyaktig lik', () => {
    const a = simuler(SENT, 3600)
    const b = simuler(fraLagring(tilLagring(SENT)), 3600)
    expect(b.kontanter).toBe(a.kontanter)
    expect(b.frø).toBe(a.frø)
    expect(nettoformue(b)).toBe(nettoformue(a))
    expect(b.marked.kurser).toEqual(expect.objectContaining({ NFS: expect.objectContaining({ kurs: a.marked.kurser.NFS.kurs }) }))
  })

  it('det tyngste spillet tar under 300 kB tidlig, og et nytt under 200 kB', () => {
    const tung = tilLagring(SENT).length / 1024
    expect(tung).toBeLessThan(300)
    expect(tilLagring(simuler(nyttSpill(), 2 * DAG_SEK)).length / 1024).toBeLessThan(200)
    // Og rundingen sparer en god del mot vanlig JSON.
    expect(tung).toBeLessThan((JSON.stringify(SENT).length / 1024) * 0.85)
  })

  it('vokser ikke uten tak: når historikkene er fulle, gir tretti spilldager til nesten ingenting', { timeout: 60_000 }, async () => {
    // Historikkene fylles opp de første rundt 120 spilldagene (målt etter Pakke 52:
    // 137 kB på dag 32, 178 kB på dag 122; etter Pakke 66, med hele ligaen: 192 kB på
    // dag 122, 197 kB på dag 365). Etter det står lagringen.
    // Én spilldag om gangen med en pause imellom (Pakke 69): ett kall på 13–14 s sultet
    // testløperen («Timeout calling onTaskUpdate»). simuler(s, n) er n enkeltsekunder,
    // så resultatet er det samme.
    const fram = async (s: typeof SENT, dager: number) => {
      for (let d = 0; d < dager; d++) {
        s = simuler(s, DAG_SEK)
        await new Promise((r) => setTimeout(r, 0))
      }
      return s
    }
    const fyllt = await fram(SENT, 120)
    const senere = await fram(fyllt, 30)
    expect(tilLagring(senere).length).toBeLessThan(tilLagring(fyllt).length * 1.03)
    expect(tilLagring(senere).length / 1024).toBeLessThan(300)
  })
})
