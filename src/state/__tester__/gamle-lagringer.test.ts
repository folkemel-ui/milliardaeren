/**
 * Ekte lagringer fra hver lagringsversjon spillet har hatt, laget av den gamle
 * motoren selv (`scripts/lag-gamle-lagringer.mjs`). Hver av dem skal løftes til
 * gjeldende versjon, bestå lastesjekken, beholde det spilleren eide og kunne
 * spilles videre i et døgn uten at et eneste tall blir NaN.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { migrer } from '../migrering'
import { sjekkTilstand } from '../sjekk'
import { SPILLVERSJON } from '../../engine/start'
import { lederpris, nettoformue } from '../../engine/formler'
import { simuler } from '../../engine/simulering'
import { botSpill } from '../../engine/__tester__/bot'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import type { BedriftstypeId, Spilltilstand } from '../../engine/types'

const MAPPE = join(__dirname, 'gamle-lagringer')

interface GammelLagring {
  versjon: number
  commit: string
  /** Nettoformuen slik den gamle motoren regnet den ut. */
  formue: number
  tilstand: Record<string, unknown>
}

const LAGRINGER: GammelLagring[] = readdirSync(MAPPE)
  .filter((f) => f.endsWith('.json.gz'))
  .map((f) => JSON.parse(gunzipSync(readFileSync(join(MAPPE, f))).toString('utf8')) as GammelLagring)
  .sort((a, b) => a.versjon - b.versjon)

/** Første tall i et objekt-tre som ikke er endelig, med stien dit. */
function ikkeEndelig(x: unknown, sti = ''): string | null {
  if (typeof x === 'number') return Number.isFinite(x) ? null : sti
  if (typeof x !== 'object' || x === null) return null
  for (const [k, v] of Object.entries(x)) {
    const funn = ikkeEndelig(v, `${sti}.${k}`)
    if (funn) return funn
  }
  return null
}

const nøkler = (o: unknown) => Object.keys((o as object | undefined) ?? {}).sort()

describe('lagringer fra alle gamle versjoner', () => {
  it('har en lagring fra hver versjon som har vært i en commit', () => {
    // 6 og 11 ble aldri commitet: Pakke 6 og Pakke 11 bumpet to ganger hver.
    const forventet = Array.from({ length: SPILLVERSJON - 1 }, (_, i) => i + 1).filter((v) => v !== 6 && v !== 11)
    expect(LAGRINGER.map((l) => l.versjon)).toEqual(forventet)
  })

  for (const l of LAGRINGER) {
    describe(`versjon ${l.versjon} (${l.commit})`, () => {
      const r = migrer(structuredClone(l.tilstand))
      const s = r.ok ? r.tilstand : (null as unknown as Spilltilstand)

      it('løftes til gjeldende versjon og består lastesjekken', () => {
        expect(r.ok, r.ok ? '' : r.feil).toBe(true)
        expect(s.versjon).toBe(SPILLVERSJON)
        expect(sjekkTilstand(s)).toBeNull()
        expect(ikkeEndelig(s)).toBeNull()
      })

      it('beholder det spilleren eide', () => {
        const g = l.tilstand as Record<string, never>
        expect(s.bedrifter.map((b) => [b.type, b.nivaa])).toEqual((g.bedrifter as { type: string; nivaa: number }[]).map((b) => [b.type, b.nivaa]))
        expect(s.kontanter).toBe(g.kontanter)
        if (g.luksus) expect(s.luksus).toEqual(g.luksus)
        if (g.eiendommer) expect(nøkler(s.eiendommer)).toEqual(nøkler(g.eiendommer))
        if (g.beholdning) expect(nøkler(s.beholdning)).toEqual(nøkler(g.beholdning))
        if (g.jord) expect(nøkler(s.jord)).toEqual(nøkler(g.jord))
        if (g.landemerker) expect(s.landemerker).toEqual(g.landemerker)
        if (g.klubb) expect(s.klubb?.navn).toBe((g.klubb as { navn: string }).navn)
        if (g.fond) expect(nøkler(s.fond)).toEqual(nøkler(g.fond))
      })

      it('har den samme formuen som den gamle motoren regnet ut', () => {
        // Den eneste migreringen som flytter verdi med vilje er 18 → 19, som tok
        // lederens pris ut av bedriftens verdi. Alt annet skal stemme på kronen.
        const g = l.tilstand as { bedrifter: { type: BedriftstypeId; leder?: boolean }[] }
        const ledere = l.versjon < 19 ? g.bedrifter.filter((b) => b.leder).reduce((sum, b) => sum + lederpris(b.type), 0) : 0
        expect(Math.abs(nettoformue(s) - (l.formue - ledere))).toBeLessThan(2)
      })

      it('kan spilles videre en måned, også med boten', () => {
        // Boten handler i to spilldager, så går resten av måneden: aviser,
        // ukeoppgjør, månedsoppgjør og skatt på den migrerte lagringen.
        let t = botSpill(s, 2 * DAG_SEK, 10)
        t = simuler(t, 31 * DAG_SEK)
        expect(sjekkTilstand(t)).toBeNull()
        expect(ikkeEndelig(t)).toBeNull()
        expect(t.avis.at(-1)?.dag).toBe(dagnummer(t.sek))
        const sisteMaaned = (x: Spilltilstand) => Math.max(-1, ...x.oppgjor.filter((o) => o.periode === 'maaned').map((o) => o.tilDag))
        expect(sisteMaaned(t)).toBeGreaterThan(sisteMaaned(s))
        // Og lagringen tåler en tur gjennom JSON igjen.
        expect(migrer(JSON.parse(JSON.stringify(t)))).toMatchObject({ ok: true, migrert: false })
      })
    })
  }
})
