// @vitest-environment happy-dom
/**
 * Pakke 61 — Tilbake går tilbake: telefonens tilbakeknapp lukker det øverste
 * laget (detaljside, vindu, fane) i stedet for å forlate spillet; alle sett med
 * deler husker der du var; hendelsesloggen ligger bak bjella i toppfeltet.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopBedrift } from '../../engine/handlinger'
import { MAKS_HENDELSER } from '../../engine/innhold'
import type { Spilltilstand } from '../../engine/types'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

const dybde = () => (history.state as { milliardaer?: number } | null)?.milliardaer ?? 0

/** Som telefonens tilbakeknapp: ett steg tilbake i historikken — inne i act, så React ikke advarer (Pakke 69). */
async function tilbake(a: App) {
  await act(async () => {
    history.back()
    await new Promise((r) => setTimeout(r, 30))
  })
  await a.vent(0)
}

function rikt(): Spilltilstand {
  const s = nyttSpill(4242)
  s.kontanter = 50_000_000
  s.hoyesteFormue = 50_000_000
  const u = kjopBedrift(s, 'polsebod')
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const lukket = () => new Promise((r) => setTimeout(r, 0))

describe('lagene i historikken', () => {
  it('hvert åpent lag er ett steg; tilbake lukker det øverste', async () => {
    vi.resetModules()
    const t = await import('../tilbake')
    const stopp = t.lyttEtterTilbake()
    const lukk = { a: 0, b: 0 }
    t.aapneLag(() => lukk.a++)
    t.aapneLag(() => lukk.b++)
    expect(dybde()).toBe(2)
    history.back()
    await new Promise((r) => setTimeout(r, 30))
    expect(lukk).toEqual({ a: 0, b: 1 })
    expect(t.antallLag()).toBe(1)
    history.back()
    await new Promise((r) => setTimeout(r, 30))
    expect(lukk).toEqual({ a: 1, b: 1 })
    expect(t.antallLag()).toBe(0)
    stopp()
  })

  it('lag som lukkes i spillet, tar bort stegene sine med ett history.go', async () => {
    vi.resetModules()
    const t = await import('../tilbake')
    const stopp = t.lyttEtterTilbake()
    const go = vi.spyOn(history, 'go')
    const a = t.aapneLag(() => {})
    const b = t.aapneLag(() => {})
    t.lukkLag(b)
    t.lukkLag(a)
    // Et lag som alt er lukket, gjør ingenting.
    t.lukkLag(a)
    await lukket()
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(-2)
    go.mockRestore()
    stopp()
  })
})

describe('tilbake i spillet', () => {
  it('lukker bedriftens detaljside, og bare den', async () => {
    app = await startApp(rikt())
    const kort = [...app.rot.querySelectorAll('.bedriftskort')].find((k) => k.querySelector('h2')?.textContent?.includes('Pølsebod'))!
    await app.trykk(kort.querySelector('h2')!)
    expect(app.rot.querySelector('.tilbake')).not.toBeNull()
    expect(dybde()).toBe(1)
    await tilbake(app)
    expect(app.rot.querySelector('.tilbake')).toBeNull()
    expect(app.tekst()).toContain('Dine bedrifter')
  })

  it('går fra en annen fane hjem til Bedrifter, også når du har byttet fane flere ganger', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.fane('Profil')
    await app.fane('Luksus')
    // Ett steg for «ikke på Bedrifter», uansett hvor mange faner du har vært innom.
    expect(dybde()).toBe(1)
    await tilbake(app)
    expect(app.tekst()).toContain('Dine bedrifter')
    expect(dybde()).toBe(0)
  })

  it('en detaljside i en annen fane er to steg: først siden, så fanen', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(app.knapp('Børs'))
    await app.trykk(app.rot.querySelectorAll<HTMLElement>('.papirrad')[0])
    expect(app.rot.querySelector('.tilbake')).not.toBeNull()
    expect(dybde()).toBe(2)
    await tilbake(app)
    expect(app.rot.querySelector('.tilbake')).toBeNull()
    expect(app.tekst()).toContain('Alle aksjer')
    await tilbake(app)
    expect(app.tekst()).toContain('Dine bedrifter')
  })

  it('knappen «Tilbake» tar bort steget, så telefonens tilbake ikke må trykkes to ganger', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(app.knapp('Børs'))
    await app.trykk(app.rot.querySelectorAll<HTMLElement>('.papirrad')[0])
    await app.trykk(app.rot.querySelector('.tilbake')!)
    await app.vent(30)
    expect(dybde()).toBe(1)
    await tilbake(app)
    expect(app.tekst()).toContain('Dine bedrifter')
  })

  it('lukker avisa', async () => {
    app = await startApp(rikt())
    await app.trykk(app.knapp(/^Avisa/))
    expect(app.rot.querySelector('.avis')).not.toBeNull()
    await tilbake(app)
    expect(app.rot.querySelector('.avis')).toBeNull()
  })
})

describe('hendelsesloggen', () => {
  function medHendelser(n: number): Spilltilstand {
    const s = rikt()
    s.sek = 10_000
    s.hendelser = Array.from({ length: n }, (_, i) => ({ sek: 100 + i * 10, tittel: `Hendelse ${i + 1}`, tekst: 'Noe skjedde.', alvor: 'info' as const }))
    return s
  }

  it('åpnes fra bjella, viser alle som huskes, og tilbake lukker den', async () => {
    app = await startApp(medHendelser(MAKS_HENDELSER))
    const bjelle = app.knapp(/^Hendelser/)
    expect(bjelle.getAttribute('aria-label')).toBe(`Hendelser, ${MAKS_HENDELSER} nye`)
    await app.trykk(bjelle)
    const logg = app.rot.querySelector('.hendelseslogg')!
    expect(logg.querySelectorAll('.hendelse')).toHaveLength(MAKS_HENDELSER)
    // Nyeste først.
    expect(logg.querySelector('.hendelse strong')!.textContent).toBe(`Hendelse ${MAKS_HENDELSER}`)
    await tilbake(app)
    expect(app.rot.querySelector('.hendelseslogg')).toBeNull()
    // Lest: prikken på bjella er borte.
    expect(app.knapp(/^Hendelser/).getAttribute('aria-label')).toBe('Hendelser')
  })

  it('ligger ikke lenger nederst i Bank', async () => {
    app = await startApp(medHendelser(3))
    await app.fane('Investeringer')
    await app.trykk(app.knapp('Bank'))
    expect(app.rot.querySelector('main .hendelser')).toBeNull()
  })

  it('usette teller fra det du sist så, og et annet spill gjør alt usett', async () => {
    vi.resetModules()
    const { antallUsette, merkHendelserSett, settGrense } = await import('../hendelsessett')
    const s = medHendelser(5)
    expect(antallUsette(s)).toBe(5)
    merkHendelserSett(s.hendelser[2].sek)
    expect(antallUsette(s)).toBe(2)
    // Et nytt spill der klokka ikke har kommet dit.
    const nytt = { ...s, sek: 50 }
    expect(settGrense(nytt)).toBe(-1)
  })

  it('varselet etter tid borte og velkomsten peker dit, ikke til Investeringer', () => {
    const appKilde = readFileSync('src/App.tsx', 'utf8')
    expect(appKilde).toContain(`mål: 'hendelser'`)
    expect(appKilde).not.toContain('Se Bank → Hendelser')
    expect(readFileSync('src/ui/komponenter/Velkomst.tsx', 'utf8')).toContain('onClick={seHendelser}')
  })
})

describe('delene husker alle på samme måte', () => {
  it('hvert sett starter på første del og husker valget etter omlasting', async () => {
    localStorage.clear()
    vi.resetModules()
    const forst = await import('../deler')
    const sett = forst.ALLE_DELVALG
    expect([sett.investeringsdel.les(), sett.profildel.les(), sett.borsdel.les(), sett.kartdel.les()]).toEqual(['oversikt', 'meg', 'aksje', 'norge'])
    sett.investeringsdel.sett('bank')
    sett.profildel.sett('statistikk')
    sett.borsdel.sett('krypto')
    sett.kartdel.sett('verden')
    vi.resetModules()
    const igjen = (await import('../deler')).ALLE_DELVALG
    expect([igjen.investeringsdel.les(), igjen.profildel.les(), igjen.borsdel.les(), igjen.kartdel.les()]).toEqual(['bank', 'statistikk', 'krypto', 'verden'])
  })

  it('en ukjent lagret verdi gir første del', async () => {
    localStorage.clear()
    localStorage.setItem('milliardaer.investeringsdel', 'tull')
    vi.resetModules()
    expect((await import('../deler')).investeringsdel.les()).toBe('oversikt')
  })

  it('Investeringer åpner på delen du var på sist', async () => {
    app = await startApp(rikt())
    await app.fane('Investeringer')
    await app.trykk(app.knapp('Bank'))
    await app.fane('Bedrifter')
    await app.fane('Investeringer')
    expect(app.rot.querySelector('[role="tablist"][aria-label="Investeringer"] [aria-selected="true"]')!.textContent).toBe('Bank')
  })

  it('ingen skjerm holder egne delvalg i useState eller egen localStorage-nøkkel', () => {
    // Investeringer er delt per del siden Pakke 65: les rammen og alle delene.
    const inv = ['src/ui/screens/Investeringer.tsx', ...readdirSync('src/ui/screens/investeringer').map((f) => 'src/ui/screens/investeringer/' + f)].map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(inv).not.toContain('useState<Underfane>')
    expect(inv).not.toContain('milliardaer.borsvalg')
    expect(readFileSync('src/ui/screens/Eiendom.tsx', 'utf8')).not.toMatch(/useState<'norge' \| 'verden'>/)
  })
})
