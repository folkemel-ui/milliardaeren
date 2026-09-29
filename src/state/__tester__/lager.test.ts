/**
 * Lageret og spilløkken, testet gjennom det de gjør med lagringen: en falsk
 * localStorage, et falskt dokument og falske klokker. Hver test laster
 * modulen på nytt, som en ny side.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { nettoformue } from '../../engine/formler'
import type { Spilltilstand } from '../../engine/types'
import { pakk } from '../overforing'

const LAGRING = 'milliardaer.lagring'
const ANGRE = 'milliardaer.lagring.angre'
const KORRUPT = 'milliardaer.lagring.korrupt'
const SIST_AKTIV = 'milliardaer.sistAktiv'
const EIER = 'milliardaer.eier'

let disk: Map<string, string>
let dokLyttere: Record<string, (() => void)[]>
let vinduLyttere: Record<string, ((e: unknown) => void)[]>
let dok: { hidden: boolean }
let reload: ReturnType<typeof vi.fn>

const lest = (): Spilltilstand => JSON.parse(disk.get(LAGRING)!)

function falskeGlobaler() {
  disk = new Map()
  dokLyttere = {}
  vinduLyttere = {}
  reload = vi.fn()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => disk.get(k) ?? null,
    setItem: (k: string, v: string) => void disk.set(k, String(v)),
    removeItem: (k: string) => void disk.delete(k),
  })
  dok = {
    hidden: false,
    addEventListener: (t: string, fn: () => void) => (dokLyttere[t] ??= []).push(fn),
  } as unknown as { hidden: boolean }
  vi.stubGlobal('document', dok)
  vi.stubGlobal('window', { addEventListener: (t: string, fn: (e: unknown) => void) => (vinduLyttere[t] ??= []).push(fn) })
  vi.stubGlobal('location', { reload })
}

/** Laster lageret som en ny side, med det som ligger på disken nå. */
async function åpne() {
  vi.resetModules()
  return import('../lager')
}

const synlighet = (hidden: boolean) => {
  dok.hidden = hidden
  for (const fn of dokLyttere.visibilitychange ?? []) fn()
}

function lagreSpill(s: Spilltilstand, borteSek = 0) {
  disk.set(LAGRING, JSON.stringify(s))
  disk.set(SIST_AKTIV, String(Date.now() - borteSek * 1000))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'setTimeout', 'Date', 'performance'] })
  vi.setSystemTime(new Date('2026-09-29T12:00:00Z'))
  falskeGlobaler()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('oppstart', () => {
  it('uten lagring starter et nytt spill, som lagres og eies av fanen', async () => {
    const l = await åpne()
    l.startSpillokke()
    expect(lest().kontanter).toBe(nyttSpill().kontanter)
    expect(disk.get(EIER)).toBeTruthy()
    expect(l.aktivtAvbrudd()).toBeNull()
  })

  it('et lagret spill lastes', async () => {
    const s = simuler(nyttSpill(), 500)
    lagreSpill(s)
    const l = await åpne()
    l.lagre()
    expect(lest().sek).toBe(500)
    expect(lest().kontanter).toBeCloseTo(s.kontanter)
  })

  it('en ødelagt lagring gir feilskjerm og blir aldri overskrevet', async () => {
    disk.set(LAGRING, '{"versjon":15}')
    const l = await åpne()
    l.startSpillokke()
    expect(l.aktivtAvbrudd()?.type).toBe('feil')
    expect(disk.get(LAGRING)).toBe('{"versjon":15}')
    expect(disk.get(KORRUPT)).toBe('{"versjon":15}')
  })

  it('tekst som ikke er JSON gir også feilskjerm', async () => {
    disk.set(LAGRING, 'ikke json')
    const l = await åpne()
    expect(l.aktivtAvbrudd()?.type).toBe('feil')
    expect(disk.get(KORRUPT)).toBe('ikke json')
  })
})

describe('tid borte', () => {
  it('en kort pause regnes som vanlig spilletid', async () => {
    const s = nyttSpill()
    lagreSpill(s, 30)
    const l = await åpne()
    l.lagre()
    expect(lest().sek).toBe(30)
    expect(lest().kontanter).toBeCloseTo(simuler(s, 30).kontanter)
  })

  it('etter en lengre pause står bedrifter uten leder stille', async () => {
    const s = nyttSpill()
    lagreSpill(s, 120)
    const l = await åpne()
    l.lagre()
    expect(lest().sek).toBe(120)
    expect(lest().kontanter).toBeCloseTo(s.kontanter)
  })

  it('velkomsten vises først etter fem minutter', async () => {
    lagreSpill(nyttSpill(), 4 * 60)
    expect((await åpne()).aktivVelkomst()).toBeNull()
    lagreSpill(nyttSpill(), 10 * 60)
    expect((await åpne()).aktivVelkomst()?.borteSek).toBe(600)
  })

  it('en app som skjules og vises igjen, regner ut tiden imellom', async () => {
    lagreSpill(nyttSpill())
    const l = await åpne()
    l.startSpillokke()
    synlighet(true)
    vi.setSystemTime(Date.now() + 20_000)
    synlighet(false)
    expect(lest().sek).toBe(20)
  })
})

describe('spilløkken', () => {
  it('teller sekunder mens appen er åpen, og lagrer jevnlig', async () => {
    const l = await åpne()
    l.startSpillokke()
    vi.advanceTimersByTime(10_200)
    l.lagre()
    expect(lest().sek).toBeGreaterThanOrEqual(9)
    expect(lest().sek).toBeLessThanOrEqual(10)
  })

  it('står stille mens appen er skjult', async () => {
    const l = await åpne()
    l.startSpillokke()
    dok.hidden = true
    vi.advanceTimersByTime(10_000)
    dok.hidden = false
    l.lagre()
    expect(lest().sek).toBe(0)
  })
})

describe('to faner', () => {
  it('en ny fane tar over, og den gamle slutter å lagre', async () => {
    lagreSpill(nyttSpill())
    const gammel = await åpne()
    gammel.startSpillokke()
    const før = disk.get(LAGRING)
    // En annen fane åpner spillet.
    disk.set(EIER, 'en-annen-fane')
    for (const fn of vinduLyttere.storage ?? []) fn({ key: EIER, newValue: 'en-annen-fane' })
    expect(gammel.aktivtAvbrudd()?.type).toBe('annen-fane')
    vi.advanceTimersByTime(10_000)
    gammel.lagre()
    expect(disk.get(LAGRING)).toBe(før)
  })

  it('uten storage-hendelse oppdages det ved neste lagring', async () => {
    const gammel = await åpne()
    gammel.startSpillokke()
    disk.set(EIER, 'en-annen-fane')
    const før = disk.get(LAGRING)
    synlighet(true)
    expect(gammel.aktivtAvbrudd()?.type).toBe('annen-fane')
    expect(disk.get(LAGRING)).toBe(før)
  })

  it('en fane som kommer tilbake fra bakgrunnen, sjekker hvem som eier', async () => {
    const gammel = await åpne()
    gammel.startSpillokke()
    synlighet(true)
    disk.set(EIER, 'en-annen-fane')
    synlighet(false)
    expect(gammel.aktivtAvbrudd()?.type).toBe('annen-fane')
  })
})

describe('reservekopien', () => {
  it('start på nytt legger det gamle spillet i reservekopien', async () => {
    const s = simuler(nyttSpill(), 300)
    lagreSpill(s)
    const l = await åpne()
    expect(l.lesReservekopi()).toBeNull()
    l.startPaaNytt()
    expect(lest().sek).toBe(0)
    expect(l.lesReservekopi()).toEqual({ formue: nettoformue(s), sek: 300 })
  })

  it('byttet går begge veier', async () => {
    lagreSpill(simuler(nyttSpill(), 300))
    const l = await åpne()
    l.startPaaNytt()
    expect(l.byttTilReservekopi()).toBeNull()
    expect(lest().sek).toBe(300)
    expect(l.lesReservekopi()?.sek).toBe(0)
    expect(l.byttTilReservekopi()).toBeNull()
    expect(lest().sek).toBe(0)
  })

  it('uten reservekopi gir byttet en melding', async () => {
    const l = await åpne()
    expect(l.byttTilReservekopi()).toMatch(/ingen reservekopi/)
  })

  it('en ødelagt reservekopi tilbys ikke', async () => {
    disk.set(ANGRE, '{"versjon":15}')
    const l = await åpne()
    expect(l.lesReservekopi()).toBeNull()
    expect(l.byttTilReservekopi()).toMatch(/ødelagt/)
  })

  it('fra feilskjermen hentes reservekopien, og den ødelagte tas vare på', async () => {
    const god = JSON.stringify(simuler(nyttSpill(), 300))
    disk.set(LAGRING, '{"versjon":15}')
    disk.set(ANGRE, god)
    const l = await åpne()
    l.gjenopprettEtterFeil('reservekopi')
    expect(disk.get(LAGRING)).toBe(god)
    expect(disk.get(KORRUPT)).toBe('{"versjon":15}')
    expect(reload).toHaveBeenCalled()
  })

  it('fra feilskjermen kan et nytt spill startes', async () => {
    disk.set(LAGRING, '{"versjon":15}')
    const l = await åpne()
    l.gjenopprettEtterFeil('nytt')
    expect(lest().sek).toBe(0)
    expect(disk.get(KORRUPT)).toBe('{"versjon":15}')
  })
})

describe('import', () => {
  it('en god kode erstatter spillet, og det gamle blir reservekopi', async () => {
    lagreSpill(simuler(nyttSpill(), 100))
    const l = await åpne()
    const kode = await pakk(simuler(nyttSpill(), 700))
    expect(await l.importer(kode)).toBeNull()
    expect(lest().sek).toBe(700)
    expect(l.lesReservekopi()?.sek).toBe(100)
  })

  it('en ødelagt kode endrer ingenting', async () => {
    lagreSpill(simuler(nyttSpill(), 100))
    const l = await åpne()
    l.lagre()
    const før = disk.get(LAGRING)
    expect(await l.importer(await pakk({ versjon: 15 } as unknown as Spilltilstand))).toMatch(/ødelagt/)
    expect(await l.importer('tull')).not.toBeNull()
    expect(disk.get(LAGRING)).toBe(før)
    expect(disk.get(ANGRE)).toBeUndefined()
  })
})
