// @vitest-environment happy-dom
/**
 * Pakke 62 — Luksus i deler: Samling · Hjem · Kunst · Klubb, hver bil, båt og
 * fly vises én gang, klubben har sin egen del, og Profil → Meg viser hva hele
 * formuen består av, med en vei til hver fane.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { fulltSpill } from '../../engine/__tester__/hjelp'
import { kjopLuksus } from '../../engine/handlinger'
import { nettoformue } from '../../engine/formler'
import { LUKSUS, LUKSUSLISTE } from '../../engine/eiendom'
import type { Spilltilstand } from '../../engine/types'
import { formuedeler } from '../formuedeler'
import { LUKSUSDELER } from '../deler'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

function rikt(): Spilltilstand {
  const s = nyttSpill(4242)
  s.kontanter = 50_000_000
  s.hoyesteFormue = 50_000_000
  // Den billigste bilen: den står i garasjen (én plass fra start).
  const bil = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === 'bil').sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)[0]
  const u = kjopLuksus(s, bil)
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const del = (a: App) => a.rot.querySelector('[role="tablist"][aria-label="Luksus"] [aria-selected="true"]')?.textContent

describe('Luksus i deler', () => {
  it('har fire deler, i denne rekkefølgen', () => {
    expect(LUKSUSDELER.map((d) => d.navn)).toEqual(['Samling', 'Hjem', 'Kunst', 'Klubb'])
  })

  it('åpner på Samling, med statusen over delene', async () => {
    app = await startApp(rikt())
    await app.fane('Luksus')
    expect(del(app)).toBe('Samling')
    const status = app.rot.querySelector('.status')!
    const deler = app.rot.querySelector('[aria-label="Luksus"]')!
    expect(status.compareDocumentPosition(deler) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await app.trykk(app.knapp('Kunst', deler))
    // Statusen står der på hver del.
    expect(app.rot.querySelector('.status')).not.toBeNull()
  })

  it('en bil du eier, står i garasjen og ikke i noen liste — hver ting vises én gang', async () => {
    const s = rikt()
    app = await startApp(s)
    await app.fane('Luksus')
    const bil = s.luksus[0]
    const navn = LUKSUS[bil].navn
    // I scenen, ikke som kort i en liste.
    expect([...app.rot.querySelectorAll('.lagerscene .plass-navn')].some((el) => el.textContent === navn)).toBe(true)
    expect([...app.rot.querySelectorAll('.luksuskort h2')].some((el) => el.textContent?.startsWith(navn))).toBe(false)
    // Lista over biler til salgs: bare de du ikke eier.
    const seksjon = [...app.rot.querySelectorAll('.seksjon')].find((el) => el.textContent?.includes('Biler til salgs'))!
    await app.trykk(seksjon.querySelector('.seksjon-hode')!)
    const tilSalgs = [...app.rot.querySelectorAll('.seksjon.åpen .luksuskort h2')].map((el) => el.textContent ?? '')
    const biler = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === 'bil')
    expect(tilSalgs).toHaveLength(biler.length - 1)
    expect(tilSalgs.some((t) => t.startsWith(navn))).toBe(false)
  })

  it('klubben åpner rett i sin del, uten egen side og tilbakeknapp', async () => {
    app = await startApp(rikt())
    await app.fane('Luksus')
    await app.trykk(app.knapp('Klubb', app.rot.querySelector('[aria-label="Luksus"]')!))
    expect(app.tekst()).toContain('Kjøp en fotballklubb')
    expect(app.rot.querySelector('.tilbake')).toBeNull()
    expect(app.rot.querySelector('.klubbkort')).toBeNull()
  })

  it('Hjem og Kunst åpner på innholdet, ikke på en sammenfoldet seksjon', async () => {
    app = await startApp(rikt())
    await app.fane('Luksus')
    const deler = app.rot.querySelector('[aria-label="Luksus"]')!
    await app.trykk(app.knapp('Hjem', deler))
    expect(app.rot.querySelector('main .seksjon-hode')).toBeNull()
    expect(app.tekst()).toContain('Hjemmene')
    await app.trykk(app.knapp('Kunst', deler))
    expect(app.rot.querySelectorAll('main .luksuskort, main .malerikort, main .kortliste li').length).toBeGreaterThan(0)
  })
})

describe('hva formuen består av', () => {
  it('radene summerer til nettoformuen, også når du eier alt', () => {
    for (const s of [nyttSpill(1), fulltSpill()]) {
      const f = formuedeler(s)
      expect(f.netto).toBeCloseTo(nettoformue(s), -1)
      const toppnivaa = f.rader.filter((r) => !r.under).reduce((sum, r) => sum + r.verdi, 0)
      expect(toppnivaa - f.gjeld).toBeCloseTo(nettoformue(s), -1)
      // Underradene i Luksus summerer til Luksus.
      const luksus = f.rader.find((r) => r.id === 'luksus')?.verdi ?? 0
      expect(f.rader.filter((r) => r.under).reduce((sum, r) => sum + r.verdi, 0)).toBeCloseTo(luksus, -1)
    }
  })

  it('en som eier alt, får en rad for hver slags ting', () => {
    const ider = formuedeler(fulltSpill()).rader.map((r) => r.id)
    expect(ider).toEqual(expect.arrayContaining(['bedrifter', 'investeringer', 'eiendom', 'luksus', 'samling', 'kunst', 'klubb']))
  })

  it('står på Profil → Meg, og en rad tar deg til fanen og delen', async () => {
    app = await startApp(rikt())
    await app.fane('Profil')
    const kort = app.rot.querySelector('.formuedeler')!
    expect(kort.textContent).toContain('Bedrifter')
    expect(kort.textContent).toContain('Samling')
    await app.trykk(app.knapp('Samling', kort))
    await app.vent(50)
    expect(app.tekst()).toContain('Luksus')
    expect(del(app)).toBe('Samling')
  })

  it('Investeringer-oversikten teller ikke eiendom lenger', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(app.knapp('Oversikt'))
    const rader = [...app.rot.querySelectorAll('.klasserad strong')].map((el) => el.textContent)
    expect(rader).not.toContain('Eiendom')
    expect(rader).toContain('Aksjer')
  })
})
