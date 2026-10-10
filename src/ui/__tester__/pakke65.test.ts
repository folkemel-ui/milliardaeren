// @vitest-environment happy-dom
/**
 * Pakke 65 — Kortere lister: Norge/Verden filtrerer eiendomslista, fondene står
 * i Børs, bedriftene kan sorteres etter fast inntekt, og de to største filene er
 * delt per område.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopBedrift, oppgraderFlere } from '../../engine/handlinger'
import * as handlinger from '../../engine/handlinger'
import { EIENDOMSTYPER } from '../../engine/eiendom'
import { BEDRIFTSTYPER } from '../../engine/innhold'
import type { EiendomId, Spilltilstand } from '../../engine/types'
import { fastInntekt } from '../sortering'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

function rikt(): Spilltilstand {
  let s = nyttSpill(4242)
  s.kontanter = 5e12
  s.hoyesteFormue = 5e12
  for (const t of ['polsebod', 'gatekjokken', 'kiosk'] as const) {
    const u = kjopBedrift(s, t)
    if (!u.ok) throw new Error(u.feil)
    s = u.tilstand
  }
  // Kiosken får flest nivåer, så den tjener mest — men den ble kjøpt sist.
  const kiosk = s.bedrifter.find((b) => b.type === 'kiosk')!
  const u = oppgraderFlere(s, kiosk.id, 60)
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const ute = (id: string) => !!EIENDOMSTYPER[id as EiendomId].reise
const delKnapp = (a: App, liste: string, navn: string) => a.knapp(navn, a.rot.querySelector(`[role="tablist"][aria-label="${liste}"]`)!)

/** Bygg-seksjonen er sammenfoldet når du ikke eier noe der: fold den ut. */
async function foldUtBygg(a: App) {
  const seksjon = [...a.rot.querySelectorAll('.seksjon')].find((el) => el.querySelector('.seksjon-tittel')?.textContent?.startsWith('Boliger og bygg'))!
  if (!seksjon.classList.contains('åpen')) await a.trykk(seksjon.querySelector('.seksjon-hode')!)
}

describe('eiendomslista følger Norge/Verden', () => {
  it('Norge viser bare norske bygg, og gårder og landemerker', async () => {
    app = await startApp(rikt())
    await app.fane('Eiendom')
    await app.trykk(delKnapp(app, 'Kart', 'Norge'))
    await foldUtBygg(app)
    const ider = [...app.rot.querySelectorAll('main .bedriftskort[data-ny]')].map((el) => el.getAttribute('data-ny')!)
    expect(ider.length).toBeGreaterThan(5)
    expect(ider.some(ute)).toBe(false)
    expect(app.tekst()).toContain('Jord og skog')
    expect(app.tekst()).toContain('Landemerker')
  })

  it('Verden viser bare eiendom ute, uten gårder og landemerker', async () => {
    app = await startApp(rikt())
    await app.fane('Eiendom')
    await app.trykk(delKnapp(app, 'Kart', 'Verden'))
    await foldUtBygg(app)
    const ider = [...app.rot.querySelectorAll('main .bedriftskort[data-ny]')].map((el) => el.getAttribute('data-ny')!)
    expect(ider.length).toBeGreaterThan(0)
    expect(ider.every(ute)).toBe(true)
    expect(app.tekst()).toContain('Boliger og bygg ute')
    expect(app.tekst()).not.toContain('Jord og skog')
  })
})

describe('fondene står i Børs', () => {
  it('Børs har Aksjer · Krypto · Fond, og Fond viser de to fondene', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(delKnapp(app, 'Investeringer', 'Børs'))
    const fliser = [...app.rot.querySelectorAll('.dashbord .flis .etikett')].map((el) => el.textContent)
    expect(fliser).toEqual(['Aksjer', 'Krypto', 'Fond'])
    await app.trykk(app.rot.querySelectorAll<HTMLElement>('.dashbord .flis')[2])
    expect(app.rot.querySelectorAll('.fondkort')).toHaveLength(2)
  })

  it('Bank har ikke fondene lenger', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(delKnapp(app, 'Investeringer', 'Bank'))
    expect(app.rot.querySelectorAll('.fondkort')).toHaveLength(0)
  })

  it('Indeksfond på Oversikt åpner Børs på Fond', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(delKnapp(app, 'Investeringer', 'Oversikt'))
    await app.trykk([...app.rot.querySelectorAll<HTMLElement>('.klasserad')].find((el) => el.textContent?.includes('Indeksfond'))!)
    expect(app.rot.querySelector('[role="tablist"][aria-label="Investeringer"] [aria-selected="true"]')!.textContent).toBe('Børs')
    expect(app.rot.querySelectorAll('.fondkort')).toHaveLength(2)
  })
})

describe('bedriftene etter inntekt', () => {
  it('fast inntekt endrer seg ikke med tida — bare med det du investerer', () => {
    const s = rikt()
    const kiosk = s.bedrifter.find((b) => b.type === 'kiosk')!
    const før = fastInntekt(kiosk)
    // Samme bedrift, men en annen dag og et annet vær: samme tall.
    const senere = structuredClone(s)
    senere.sek += 3 * 86_400
    expect(fastInntekt(senere.bedrifter.find((b) => b.type === 'kiosk')!)).toBe(før)
  })

  it('Inntekt setter den som tjener mest øverst, og valget huskes', async () => {
    const s = rikt()
    app = await startApp(s)
    const rekkefolge = () => [...app!.rot.querySelectorAll('main .bedriftskort h2')].map((el) => el.textContent ?? '')
    // Kjøpt (standard): saftboden først.
    expect(rekkefolge()[0]).toContain(BEDRIFTSTYPER.saftbod.navn)
    await app.trykk(app.knapp('Inntekt', app.rot.querySelector('[aria-label="Rekkefølge på bedriftene"]')!))
    const forventet = [...s.bedrifter].sort((a, b) => fastInntekt(b) - fastInntekt(a))[0]
    expect(rekkefolge()[0]).toContain(BEDRIFTSTYPER[forventet.type].navn)
    expect(forventet.type).toBe('kiosk')
    expect(localStorage.getItem('milliardaer.bedriftsrekkefolge')).toBe('inntekt')
  })
})

describe('filene er delt per område', () => {
  it('handlinger.ts bare samler delene, og hjelperne i felles er ikke en del av APIet', () => {
    const kilde = readFileSync('src/engine/handlinger.ts', 'utf8')
    expect(kilde).not.toMatch(/function /)
    expect(Object.keys(handlinger)).not.toContain('investerI')
    expect(Object.keys(handlinger)).not.toContain('feil')
    for (const f of readdirSync('src/engine/handlinger')) expect(readFileSync(`src/engine/handlinger/${f}`, 'utf8').split('\n').length, f).toBeLessThan(300)
  })

  it('Investeringer.tsx er rammen, og hver del har sin fil', () => {
    expect(readFileSync('src/ui/screens/Investeringer.tsx', 'utf8').split('\n').length).toBeLessThan(120)
    expect(readdirSync('src/ui/screens/investeringer').sort()).toEqual(['Bank.tsx', 'Bors.tsx', 'Oversikt.tsx', 'Selskaper.tsx', 'felles.tsx'])
  })
})
