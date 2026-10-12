/**
 * Pakke 95: en lagring du kan stole på — full lagring, feilrapporten med lagringen, og
 * kopien fra før siste oppdatering. Samme falske globaler som lager.test.ts.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nyttSpill } from '../../engine/start'
import type { Spilltilstand } from '../../engine/types'
import { iSafariFane } from '../../ui/komponenter/Hjemskjerm'

const LAGRING = 'milliardaer.lagring'
const ANGRE = 'milliardaer.lagring.angre'
const KORRUPT = 'milliardaer.lagring.korrupt'
const FOR_MIGRERING = 'milliardaer.lagring.formigrering'
const SIST_AKTIV = 'milliardaer.sistAktiv'

let disk: Map<string, string>
let reload: ReturnType<typeof vi.fn>
/** Så mange tegn får plass på disken; null = ingen grense. */
let plass: number | null

const brukt = () => [...disk.values()].reduce((sum, v) => sum + v.length, 0)

/** En ekte lagring fra versjon 19, som må løftes når den lastes. */
const gammelLagring = (): string =>
  JSON.stringify(JSON.parse(gunzipSync(readFileSync(join(__dirname, 'gamle-lagringer', 'v19.json.gz'))).toString('utf8')).tilstand)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'setTimeout', 'Date', 'performance'] })
  vi.setSystemTime(new Date('2026-10-12T12:00:00Z'))
  disk = new Map()
  plass = null
  reload = vi.fn()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => disk.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const tekst = String(v)
      if (plass !== null && brukt() - (disk.get(k)?.length ?? 0) + tekst.length > plass) throw new DOMException('full', 'QuotaExceededError')
      disk.set(k, tekst)
    },
    removeItem: (k: string) => void disk.delete(k),
  })
  vi.stubGlobal('document', { hidden: false, addEventListener: () => {}, removeEventListener: () => {} })
  vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} })
  vi.stubGlobal('location', { reload })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function åpne() {
  vi.resetModules()
  return import('../lager')
}

describe('full lagring', () => {
  it('sletter bergingskopiene, prøver igjen, og reservekopien står', async () => {
    const s = nyttSpill()
    disk.set(LAGRING, JSON.stringify(s))
    disk.set(ANGRE, JSON.stringify(s))
    disk.set(KORRUPT, 'x'.repeat(5000))
    disk.set(FOR_MIGRERING, 'y'.repeat(5000))
    const l = await åpne()
    l.startSpillokke()
    // Først en vanlig lagring (den lagrede formen er mindre enn rå JSON), så stram inn: bare plass
    // til det som ligger nå minus bergingskopiene (10 000 tegn), pluss litt.
    plass = brukt() - 9000
    vi.advanceTimersByTime(3000)
    l.lagre()
    expect(disk.has(KORRUPT)).toBe(false)
    expect(disk.has(FOR_MIGRERING)).toBe(false)
    expect(disk.has(ANGRE)).toBe(true)
    expect(JSON.parse(disk.get(LAGRING)!).sek).toBeGreaterThanOrEqual(0)
    l.stoppSpillokke()
  })

  it('går det fortsatt ikke, kommer ett varsel per besøk', async () => {
    const l = await åpne()
    // Varslene fra den samme modulen som lageret nettopp lastet.
    const varsler = await import('../../ui/varsler')
    const vis = vi.spyOn(varsler, 'visVarsel')
    plass = 10
    l.lagre()
    l.lagre()
    const full = vis.mock.calls.filter(([v]) => v.tittel === 'Lagringen er full')
    expect(full).toHaveLength(1)
  })
})

describe('feilrapporten og kopien fra før oppdateringen', () => {
  it('lagringen som en kode, til feilrapporten', async () => {
    disk.set(LAGRING, JSON.stringify(nyttSpill()))
    const l = await åpne()
    const kode = await l.lagringSomKode()
    expect(kode).toMatch(/^MLD/)
  })

  it('en lagring som løftes ved oppstart, gir en kopi fra før oppdateringen som kan hentes tilbake', async () => {
    disk.set(LAGRING, gammelLagring())
    disk.set(SIST_AKTIV, String(Date.now()))
    const l = await åpne()
    expect(disk.has(FOR_MIGRERING)).toBe(true)
    const kopi = l.lesFoerOppdatering()
    expect(kopi).not.toBeNull()
    expect(kopi!.formue).toBeGreaterThan(0)
    const naa = disk.get(LAGRING)
    expect(l.hentFoerOppdatering()).toBeNull()
    expect(disk.get(ANGRE)).toBe(naa)
    expect(disk.get(LAGRING)).toBe(disk.get(FOR_MIGRERING))
    expect(reload).toHaveBeenCalled()
  })

  it('uten kopi sier den det', async () => {
    const l = await åpne()
    expect(l.lesFoerOppdatering()).toBeNull()
    expect(l.hentFoerOppdatering()).toMatch(/ingen kopi/)
  })
})

describe('Hjem-skjermen', () => {
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  it('Safari på iPhone og iPad, ikke Chrome på iOS eller en Mac uten berøring', () => {
    vi.stubGlobal('navigator', { userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 })
    expect(iSafariFane(IPHONE, 'iPhone', 5)).toBe(true)
    expect(iSafariFane(IPHONE.replace('Version/18.0', 'CriOS/129.0'), 'iPhone', 5)).toBe(false)
    expect(iSafariFane('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 'MacIntel', 5)).toBe(true)
    expect(iSafariFane('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 'MacIntel', 0)).toBe(false)
  })

  it('ikke fra Hjem-skjermen', () => {
    vi.stubGlobal('navigator', { userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5, standalone: true })
    expect(iSafariFane(IPHONE, 'iPhone', 5)).toBe(false)
  })
})

it('lagringen er ikke rørt av en vanlig lagring uten full disk', async () => {
  const s: Spilltilstand = nyttSpill()
  disk.set(LAGRING, JSON.stringify(s))
  disk.set(KORRUPT, 'k')
  const l = await åpne()
  l.lagre()
  expect(disk.get(KORRUPT)).toBe('k')
})
