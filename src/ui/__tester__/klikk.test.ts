// @vitest-environment happy-dom
/**
 * Klikktester for de viktigste flytene (Pakke 52): kjøpe, oppgradere, ansette,
 * låne, åpne avisa og selge — trykket gjennom hele appen i happy-dom, slik en
 * spiller gjør det. Fanger knapper som ikke gjør noe, og sider som krasjer.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopBedrift } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

/** Et spill med penger nok til alt testene trenger, og alle fanene åpne. */
function rikt(): Spilltilstand {
  const s = nyttSpill(4242)
  s.kontanter = 50_000_000
  s.hoyesteFormue = 50_000_000
  return s
}

/** Det rike spillet med en kiosk i tillegg til saftboden. */
function medKiosk(): Spilltilstand {
  const u = kjopBedrift(rikt(), 'kiosk')
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

const kort = (a: App, navn: string) => [...a.rot.querySelectorAll('.bedriftskort')].find((k) => k.querySelector('h2')?.textContent?.includes(navn))!

describe('klikk gjennom appen', () => {
  it('starter og viser bedriftene', async () => {
    app = await startApp(rikt())
    expect(app.tekst()).toContain('Dine bedrifter')
    expect(kort(app, 'Saftbod')).toBeDefined()
  })

  it('kjøper en ny bedrift', async () => {
    app = await startApp(rikt())
    const før = app.spill().kontanter
    // Beløpene har hardt mellomrom («kr 1 200»), så \s, ikke vanlig mellomrom.
    await app.trykk(app.knapp(/Kjøp · kr\s1\s200/))
    expect(kort(app, 'Pølsebod')).toBeDefined()
    expect(app.spill().bedrifter.map((b) => b.type)).toContain('polsebod')
    expect(app.spill().kontanter).toBeLessThan(før)
  })

  it('oppgraderer saftboden fra kortet', async () => {
    app = await startApp(rikt())
    await app.trykk(app.knapp(/nivå 2/, kort(app, 'Saftbod')))
    expect(app.spill().bedrifter[0].nivaa).toBe(2)
    expect(kort(app, 'Saftbod').textContent).toContain('Nivå 2')
  })

  it('åpner bedriften og ansetter en navngitt medarbeider', async () => {
    app = await startApp(rikt())
    await app.trykk(app.knapp('Detaljer for Saftbod'))
    await app.vent(50)
    await app.trykk(app.knapp(/^Ansett erfaren/))
    const b = app.spill().bedrifter[0]
    expect(b.ansatte).toBe(1)
    expect(app.rot.querySelector('.stab')?.textContent).toContain(b.stab![0].navn)
  })

  it('låner penger i banken', async () => {
    app = await startApp(medKiosk())
    await app.fane('Investeringer')
    await app.trykk(app.knapp(/^Bank$/))
    await app.vent(50)
    const laan = [...app.rot.querySelectorAll('.kort')].find((k) => k.querySelector('h2')?.textContent === 'Lån')!
    await app.trykk(app.knapper(/^kr /, laan)[0])
    expect(app.spill().gjeld).toBeGreaterThan(0)
  })

  it('åpner avisa og lukker den igjen', async () => {
    app = await startApp(rikt())
    await app.trykk(app.knapp(/^Avisa/))
    expect(app.rot.querySelector('[role="dialog"][aria-label="Børstidende"]')).not.toBeNull()
    await app.trykk(app.knapp('Lukk avisa'))
    expect(app.rot.querySelector('[role="dialog"][aria-label="Børstidende"]')).toBeNull()
  })

  it('selger en bedrift etter å ha bekreftet', async () => {
    app = await startApp(medKiosk())
    await app.trykk(app.knapp('Detaljer for Kiosk'))
    await app.vent(50)
    await app.trykk(app.knapp(/^Selg · /))
    // Første trykk spør bare; bedriften er der fortsatt.
    expect(app.spill().bedrifter.map((b) => b.type)).toContain('kiosk')
    await app.trykk(app.knapp('Ja, selg'))
    expect(app.spill().bedrifter.map((b) => b.type)).not.toContain('kiosk')
  })

  it('hver fane tegnes uten å krasje', async () => {
    app = await startApp(medKiosk())
    for (const fane of ['Investeringer', 'Eiendom', 'Luksus', 'Profil', 'Bedrifter']) {
      await app.fane(fane)
      expect(app.rot.querySelector('.avbrudd'), fane).toBeNull()
      expect(app.rot.querySelector('.skjerm'), fane).not.toBeNull()
    }
  })

  it('å bytte til reservekopien feirer ikke det andre spillets fortid (Pakke 55)', async () => {
    app = await startApp(rikt())
    // Reservekopien er en milliardær med prestasjoner dette spillet ikke har.
    const annet = rikt()
    annet.kontanter = 2e10
    annet.hoyesteFormue = 2e10
    annet.prestasjoner = { ...annet.prestasjoner, milliardaer: 10, 'ti-mrd': 20 }
    localStorage.setItem('milliardaer.lagring.angre', JSON.stringify(annet))
    await app.fane('Profil')
    await app.trykk(app.knapp('Innstillinger'))
    await app.trykk(app.knapp(/Bytt til reservekopien/))
    await app.trykk(app.knapp(/^Ja, bytt$/))
    await app.vent(50)
    expect(app.spill().kontanter).toBeGreaterThanOrEqual(2e10)
    expect(document.querySelector('.feiring')).toBeNull()
    expect(document.querySelectorAll('.varsel')).toHaveLength(0)
  })
})
