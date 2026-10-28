// @vitest-environment happy-dom
/**
 * Pakke 77 — en roligere klubb: Klubb-delen er et nav (toppen, neste kamp,
 * formen, fem rader av tabellen og radene til fire sider), statusen er én
 * linje på Klubb, og resten står på sidene Troppen og marked, Kamper og
 * tabell, Anlegg og økonomi og Sesongene — hver et lag med tilbake.
 */

import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopKlubb } from '../../engine/handlinger'
import { KLUBBNAVN, MAKS_TROPP, tabell } from '../../engine/klubb'
import { simulerMedPauser } from './simulerMedPauser'
import type { Spilltilstand } from '../../engine/types'
import { aapenKlubbside } from '../klubbsider'
import { visKlubb } from '../klubblive'

let app: App | null = null
afterEach(() => {
  app?.lukk()
  app = null
})

function medKlubb(fro = 4242): Spilltilstand {
  const s = nyttSpill(fro)
  s.kontanter = 100_000_000
  s.hoyesteFormue = 100_000_000
  const u = kjopKlubb(s, KLUBBNAVN[0])
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** En klubb som har spilt en hel sesong og fire runder til. */
let erfaren: Spilltilstand | null = null
async function medSesong(): Promise<Spilltilstand> {
  erfaren ??= await simulerMedPauser(medKlubb(), 2700 + 4 * 300 + 10)
  return structuredClone(erfaren)
}

async function tilKlubben(s: Spilltilstand): Promise<App> {
  const a = await startApp(s)
  await a.fane('Luksus')
  await a.trykk(a.knapp('Klubb', a.rot.querySelector('[aria-label="Luksus"]')!))
  return a
}

async function tilbake(a: App) {
  await act(async () => {
    history.back()
    await new Promise((r) => setTimeout(r, 30))
  })
  await a.vent(0)
}

const titler = (a: App) => [...a.rot.querySelectorAll('.kort-tittel')].map((e) => e.textContent)
const rader = (a: App) => [...a.rot.querySelectorAll('.klubbside-rad')]

describe('klubben som nav', () => {
  it('toppen, neste kamp rett under, formen, tabellen og radene — troppen og markedet står ikke på navet', async () => {
    app = await tilKlubben(await medSesong())
    const topp = app.rot.querySelector('.klubbtopp')!
    // Pakke 86: spilles en kamp nå, står den mellom toppen og neste kamp.
    let under = topp.nextElementSibling!
    if (under.classList.contains('livekamp')) under = under.nextElementSibling!
    expect(under.classList.contains('nestekamp')).toBe(true)
    expect(titler(app)).toEqual(expect.arrayContaining(['Formen', 'Tabell']))
    for (const borte of ['Troppen', 'Overgangsmarkedet', 'Akademiet', 'Kamprapport', 'Toppscorere', 'Sesongen som var', 'Stadion', 'Bygg']) {
      expect(titler(app), borte).not.toContain(borte)
    }
    expect(app.tekst()).not.toContain('Selg klubben')
    // Stadion er en stripe i toppen som åpner anlegget.
    expect(topp.querySelector('.klubbtopp-stadion svg.stadion')).not.toBeNull()
  })

  it('fire rader med én linje hver: antall spillere, plassen, stadion og nettoen, forrige sesong', async () => {
    const s = await medSesong()
    app = await tilKlubben(s)
    const tekster = rader(app).map((r) => r.textContent!)
    expect(tekster).toHaveLength(4)
    expect(tekster[0]).toContain('Troppen og marked')
    expect(tekster[0]).toContain(`${s.klubb!.spillere.length} / ${MAKS_TROPP} spillere`)
    expect(tekster[1]).toMatch(/Kamper og tabell\d+\. plass/)
    expect(tekster[2]).toMatch(/Anlegg og økonomi.*netto i år/)
    expect(tekster[3]).toMatch(/Sesongene.*Forrige: \d+\. plass/)
  })

  it('uten en ferdig sesong er det tre rader', async () => {
    app = await tilKlubben(medKlubb())
    expect(rader(app).map((r) => r.querySelector('strong')!.textContent)).toEqual(['Troppen og marked', 'Kamper og tabell', 'Anlegg og økonomi'])
  })

  it('fem rader av tabellen, med deg — øverst og nederst så nær som det går', async () => {
    const s = await medSesong()
    app = await tilKlubben(s)
    const mini = [...app.rot.querySelectorAll('.tabell')][0]
    const rad = mini.querySelectorAll('tbody tr')
    expect(rad).toHaveLength(5)
    expect(mini.querySelector('tr.deg')).not.toBeNull()
    // Siden viser tabellen slik den var før kampen som spilles nå (Pakke 86).
    const vist = visKlubb(s, s.klubb!)
    const din = tabell(vist).indexOf(0)
    const forste = Math.max(0, Math.min(din - 2, vist.lag.length - 5))
    expect(rad[0].querySelector('td')!.textContent).toBe(String(forste + 1))
  })

  it('formen er de fem siste kampene som S, U og T', async () => {
    app = await tilKlubben(await medSesong())
    const brikker = [...app.rot.querySelectorAll('.formrekke .brikke')].map((b) => b.textContent)
    expect(brikker).toHaveLength(5)
    for (const b of brikker) expect(['S', 'U', 'T']).toContain(b)
  })
})

describe('sidene', () => {
  it('hver rad åpner sin side i stedet for skjermen, og tilbake lukker den', async () => {
    app = await tilKlubben(await medSesong())
    const forventet: Record<string, string[]> = {
      'Troppen og marked': ['Troppen', 'Akademiet', 'Overgangsmarkedet'],
      'Kamper og tabell': ['Kamprapport', 'Siste kamper', 'Tabell', 'Toppscorere'],
      'Anlegg og økonomi': ['Stadion', 'Bygg'],
      Sesongene: ['Sesongen som var'],
    }
    for (const [navn, kort] of Object.entries(forventet)) {
      await app.trykk(app.knapp(navn, app.rot.querySelector('.klubbsider')!))
      expect(app.rot.querySelector('.klubbdetalj h1')!.textContent).toBe(navn)
      // Luksus' deler og statusen er borte mens siden er åpen.
      expect(app.rot.querySelector('[aria-label="Luksus"]')).toBeNull()
      expect(titler(app)).toEqual(expect.arrayContaining(kort))
      await tilbake(app)
      expect(app.rot.querySelector('.klubbdetalj')).toBeNull()
      expect(app.rot.querySelector('.klubbsider')).not.toBeNull()
    }
    // Og «‹ Klubb» gjør det samme.
    await app.trykk(app.knapp('Sesongene', app.rot.querySelector('.klubbsider')!))
    await app.trykk(app.knapp('‹ Klubb'))
    expect(app.rot.querySelector('.klubbdetalj')).toBeNull()
    expect(aapenKlubbside()).toBeNull()
  })

  it('«Kamprapport ›», «Hele tabellen ›» og stadionstripen åpner sine sider', async () => {
    app = await tilKlubben(await medSesong())
    await app.trykk(app.knapp(/Kamprapport/, app.rot.querySelector('.formkort')!))
    expect(app.rot.querySelector('.klubbdetalj h1')!.textContent).toBe('Kamper og tabell')
    await tilbake(app)
    await app.trykk(app.knapp(/Hele tabellen/))
    expect(app.rot.querySelector('.klubbdetalj h1')!.textContent).toBe('Kamper og tabell')
    // Hele tabellen: alle ti lagene.
    expect(app.rot.querySelectorAll('.tabell tbody tr')).toHaveLength(10)
    await tilbake(app)
    await app.trykk(app.rot.querySelector('.klubbtopp-stadion')!)
    expect(app.rot.querySelector('.klubbdetalj h1')!.textContent).toBe('Anlegg og økonomi')
  })

  it('toppscorerne: tre navn, resten bak «Vis alle»', async () => {
    const s = await medSesong()
    app = await tilKlubben(s)
    await app.trykk(app.knapp('Kamper og tabell', app.rot.querySelector('.klubbsider')!))
    const kort = [...app.rot.querySelectorAll('.kort')].find((k) => k.querySelector('.kort-tittel')?.textContent === 'Toppscorere')!
    expect(kort.querySelectorAll('li')).toHaveLength(3)
    const knapp = app.knapp(/Vis alle \d+/, kort)
    const alle = Number(knapp.textContent!.match(/\d+/)![0])
    await app.trykk(knapp)
    expect(kort.querySelectorAll('li')).toHaveLength(alle)
  })

  it('sesongene: den siste i sin helhet og de før som rader, uten en knapp å trykke', async () => {
    let s = await medSesong()
    s = await simulerMedPauser(s, 2700)
    app = await tilKlubben(s)
    await app.trykk(app.knapp('Sesongene', app.rot.querySelector('.klubbsider')!))
    // Trofeskapet står øverst (Pakke 87).
    expect(titler(app)).toEqual(['Trofeskapet', 'Sesongen som var', 'Tidligere sesonger'])
    expect(app.rot.querySelectorAll('.sesongliste li')).toHaveLength(s.klubb!.sesonger!.length - 1)
    expect(app.knapper(/tidligere sesong/i)).toHaveLength(0)
  })

  it('salget står nederst i Anlegg og økonomi bak en bekreftelse, og lukker siden', async () => {
    app = await tilKlubben(medKlubb())
    await app.trykk(app.knapp('Anlegg og økonomi', app.rot.querySelector('.klubbsider')!))
    const side = app.rot.querySelector('.klubbdetalj')!
    expect(side.lastElementChild!.textContent).toContain('Selg klubben')
    await app.trykk(app.knapp(/Selg klubben/))
    expect(app.spill().klubb).not.toBeNull()
    await app.trykk(app.knapp(/Ja, selg for/))
    expect(app.spill().klubb).toBeNull()
    expect(app.rot.querySelector('.klubbdetalj')).toBeNull()
    expect(aapenKlubbside()).toBeNull()
    expect(app.tekst()).toContain('Kjøp en fotballklubb')
  })
})

describe('cupen i neste kamp', () => {
  it('en linje med runden, motstanderen og dagen når du er med', async () => {
    // Et ferskt lag i 4. divisjon ryker i første runde, så troppen gjøres sterk.
    // Etter første dag: finn et frø der laget ikke er slått ut av cupen.
    let s: Spilltilstand | null = null
    for (let fro = 1; fro < 40 && !s; fro++) {
      const start = medKlubb(fro)
      for (const p of start.klubb!.spillere) p.styrke = p.angrep = p.forsvar = 95
      const t = await simulerMedPauser(start, 300 + 10)
      if (t.klubb!.cup && !t.klubb!.cup.ute) s = t
    }
    expect(s).not.toBeNull()
    app = await tilKlubben(s!)
    const linje = app.rot.querySelector('.nestekamp .turneringslinjer')!
    // Pakke 86: like etter dagsskiftet kan cupkampen spilles nå.
    expect(linje.textContent).toMatch(/^Cupen.+ mot .+(, (dag \d|samme dag)| spilles nå)/)
  })
})

describe('statusen på Klubb', () => {
  it('er én linje som åpner hele kortet — fra Pakke 132 også på Samling', async () => {
    app = await tilKlubben(medKlubb())
    expect(app.rot.querySelector('.kort.status')).toBeNull()
    const stripe = app.rot.querySelector<HTMLElement>('.statusstripe')!
    expect(stripe.getAttribute('aria-expanded')).toBe('false')
    await app.trykk(stripe)
    expect(app.rot.querySelector('.kort.status')).not.toBeNull()
    // Pakke 132: stripa står på alle delene, også på Samling.
    await app.trykk(app.knapp('Samling', app.rot.querySelector('[aria-label="Luksus"]')!))
    expect(app.rot.querySelector('.statusstripe')).not.toBeNull()
  })
})
