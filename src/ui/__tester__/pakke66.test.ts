// @vitest-environment happy-dom
/**
 * Pakke 66 — en klubb som betyr noe: regelen for nye områder (fem faner, høyst
 * fire deler) og stadionkortet i Klubb-delen, der du bygger ut.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopKlubb } from '../../engine/handlinger'
import { KLUBBNAVN, STADIONTRINN } from '../../engine/klubb'
import type { Spilltilstand } from '../../engine/types'
import { FANER } from '../komponenter/Fanemeny'
import { INVESTERINGSDELER, LUKSUSDELER, PROFILDELER } from '../deler'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

function medKlubb(): Spilltilstand {
  const s = nyttSpill(4242)
  s.kontanter = 100_000_000
  s.hoyesteFormue = 100_000_000
  const u = kjopKlubb(s, KLUBBNAVN[0])
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

async function tilKlubben(s: Spilltilstand): Promise<App> {
  const a = await startApp(s)
  await a.fane('Luksus')
  await a.trykk(a.knapp('Klubb', a.rot.querySelector('[aria-label="Luksus"]')!))
  return a
}

const stadionkort = (a: App) => [...a.rot.querySelectorAll('.kort')].find((el) => el.querySelector('.kort-tittel')?.textContent === 'Stadion')!

describe('plass til nye områder', () => {
  it('fem faner, og høyst fire deler i en fane', () => {
    expect(FANER).toHaveLength(5)
    for (const deler of [PROFILDELER, INVESTERINGSDELER, LUKSUSDELER]) expect(deler.length).toBeLessThanOrEqual(4)
  })
})

describe('stadionkortet', () => {
  it('står rett under klubbtoppen, med plasser, publikum, billettpris og kravet over', async () => {
    app = await tilKlubben(medKlubb())
    const kort = stadionkort(app)
    expect(kort).toBeDefined()
    expect(app.rot.querySelector('.klubbtopp')!.nextElementSibling).toBe(kort)
    expect(kort.textContent).toContain(STADIONTRINN[0].navn)
    expect(kort.textContent).toMatch(/Plasser\s*700/)
    expect(kort.textContent).toContain('3. divisjon krever')
    expect(kort.querySelector('.merke.ok')!.textContent).toBe('Holder')
    // Tre utbygginger, hver med en knapp.
    expect(kort.querySelectorAll('.stadionliste li')).toHaveLength(3)
    expect(app.knapper('Bygg', kort)).toHaveLength(3)
  })

  it('et trykk på Bygg gir neste tribune, og pengene går inn i klubben', async () => {
    const s = medKlubb()
    app = await tilKlubben(s)
    const kontanter = s.kontanter
    await app.trykk(app.knapp('Bygg', stadionkort(app)))
    const etter = app.spill()
    expect(etter.klubb!.stadion.trinn).toBe(1)
    expect(etter.klubb!.stadion.investert).toBe(STADIONTRINN[1].pris)
    expect(etter.kontanter).toBeLessThan(kontanter)
    expect(stadionkort(app).textContent).toMatch(/Plasser\s*2\s000/)
  })

  it('i 2. divisjon uten stadion viser kortet at kravet mangler, og tabellen sier det', async () => {
    const s = medKlubb()
    s.klubb!.divisjon = 2
    app = await tilKlubben(s)
    expect(stadionkort(app).querySelector('.merke.varsel')!.textContent).toBe('Mangler')
    expect(app.tekst()).toContain('men ikke du, før stadion holder kravet')
  })
})
