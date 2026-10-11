// @vitest-environment happy-dom
/**
 * Pakke 78 — en klubb du kan skumme: troppen på rader av 48 px som folder seg
 * ut, markedet med de tre beste, strekene i tabellen, kamprapporten og kampene
 * i trinn, slanke cupkort, knapper på én linje, én linje tekst per kort, det du
 * kan gjøre før det du leser, og «Ny» på det som har skjedd siden sist.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import { kjopKlubb } from '../../engine/handlinger'
import { kjopspris, KLUBBNAVN } from '../../engine/klubb'
import { simulerMedPauser } from './simulerMedPauser'
import type { Spilltilstand } from '../../engine/types'
import { FORKLARINGER } from '../forklaringer'
import { visKlubb } from '../klubblive'

let app: App | null = null
beforeEach(() => {
  merker = {}
})
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

/** En klubb som har spilt en hel sesong og fire runder til. */
let erfaren: Spilltilstand | null = null
async function medSesong(): Promise<Spilltilstand> {
  erfaren ??= await simulerMedPauser(medKlubb(), 2700 + 4 * 300 + 10)
  return structuredClone(erfaren)
}

async function tilSiden(s: Spilltilstand, side?: string): Promise<App> {
  const a = await startApp(s, merker)
  await a.fane('Luksus')
  await a.trykk(a.knapp('Klubb', a.rot.querySelector('[aria-label="Luksus"]')!))
  if (side) await a.trykk(a.knapp(side, a.rot.querySelector('.klubbsider')!))
  return a
}

/** Klubbens merker fra forrige app, så de overlever at startApp tømmer nettleseren. */
let merker: Record<string, string> = {}
const taVare = () => {
  const v = localStorage.getItem('milliardaer.klubbSett')
  merker = v ? { 'milliardaer.klubbSett': v } : {}
}

const kortMed = (a: App, tittel: string) => [...a.rot.querySelectorAll('.kort')].find((el) => el.querySelector('.kort-tittel')?.textContent?.startsWith(tittel))!

describe('troppen', () => {
  it('én rad per spiller, startelleven og innbytterne hver for seg, og ingen selgeknapp før du trykker', async () => {
    const s = await medSesong()
    app = await tilSiden(s, 'Troppen og marked')
    const kort = kortMed(app, 'Troppen')
    expect(kort.querySelectorAll('.spillerrad')).toHaveLength(s.klubb!.spillere.length)
    const grupper = [...kort.querySelectorAll('.troppgruppe')].map((h) => h.textContent)
    expect(grupper[0]).toBe(`Startelleven · ${s.klubb!.formasjon}`)
    expect(kort.querySelectorAll('ul.tropp')[0].children).toHaveLength(11)
    expect(app.knapper(/Selg/, kort)).toHaveLength(0)
    // Formasjonsregelen står bak «?», ikke i kortet.
    expect(kort.textContent).not.toContain('Utenfor sin posisjon')
  })

  it('et trykk folder ut alder, verdi og lønn og «Selg · kr X», som bekreftes der', async () => {
    const s = await medSesong()
    app = await tilSiden(s, 'Troppen og marked')
    const kort = kortMed(app, 'Troppen')
    const rad = kort.querySelectorAll<HTMLElement>('.spillerrad')[3]
    await app.trykk(rad)
    expect(rad.getAttribute('aria-expanded')).toBe('true')
    const detalj = kort.querySelector('.spillerdetalj')!
    expect(detalj.textContent).toMatch(/\d+ år · verdi .+ · lønn .+\/dag/)
    const antall = app.spill().klubb!.spillere.length
    await app.trykk(app.knapp(/^Selg · /, detalj))
    await app.trykk(app.knapp('Ja, selg', kort))
    expect(app.spill().klubb!.spillere).toHaveLength(antall - 1)
    expect(kort.querySelector('.spillerdetalj')).toBeNull()
  })
})

describe('markedet', () => {
  it('de tre med mest styrke per krone, resten bak «Se alle», og kjøpet er én knapp', async () => {
    const s = await medSesong()
    app = await tilSiden(s, 'Troppen og marked')
    const kort = kortMed(app, 'Overgangsmarkedet')
    const rader = () => [...kort.querySelectorAll('li')]
    expect(rader()).toHaveLength(3)
    const beste = [...s.klubb!.marked].sort((a, b) => b.styrke / kjopspris(b) - a.styrke / kjopspris(a))
    expect(rader()[0].textContent).toContain(beste[0].navn)
    for (const r of rader()) expect(r.querySelector('button')!.textContent).toBe('Kjøp')
    await app.trykk(app.knapp(`Se alle ${s.klubb!.marked.length}`, kort))
    expect(rader()).toHaveLength(s.klubb!.marked.length)
  })
})

describe('kamper og tabell', () => {
  it('tabellen har strek under opprykksplassene og én linje under', async () => {
    app = await tilSiden(await medSesong(), 'Kamper og tabell')
    const kort = kortMed(app, 'Tabell')
    // 4. divisjon: to opp, ingen ned.
    expect(kort.querySelectorAll('tr.strek-opp')).toHaveLength(1)
    expect(kort.querySelectorAll('tr.strek-ned')).toHaveLength(0)
    expect([...kort.querySelectorAll('tbody tr')].indexOf(kort.querySelector('tr.strek-opp')!)).toBe(2)
    expect(kort.querySelectorAll('p')).toHaveLength(1)
  })

  it('i en divisjon med nedrykk er det en rød strek over de to nederste', async () => {
    const s = await medSesong()
    s.klubb!.divisjon = 2
    app = await tilSiden(s, 'Kamper og tabell')
    const rader = [...kortMed(app, 'Tabell').querySelectorAll('tbody tr')]
    expect(rader.indexOf(rader.find((r) => r.classList.contains('strek-ned'))!)).toBe(rader.length - 2)
  })

  it('kamprapporten viser vurderingene først når du ber om dem', async () => {
    app = await tilSiden(await medSesong(), 'Kamper og tabell')
    const kort = kortMed(app, 'Kamprapport')
    expect(kort.querySelector('.rapport-vurderinger')).toBeNull()
    await app.trykk(app.knapp('Vis vurderinger', kort))
    expect(kort.querySelectorAll('.rapport-vurderinger li').length).toBeGreaterThanOrEqual(11)
  })

  it('kampene er brikker; et trykk viser den kampen', async () => {
    const s = await medSesong()
    app = await tilSiden(s, 'Kamper og tabell')
    const kort = kortMed(app, 'Siste kamper')
    const brikker = [...kort.querySelectorAll<HTMLElement>('[role=radio]')]
    // Pakke 86: kampen som spilles nå, er ikke en brikke før den er ferdig.
    expect(brikker).toHaveLength(Math.min(10, visKlubb(s, s.klubb!).kamper.length))
    expect(brikker[brikker.length - 1].getAttribute('aria-checked')).toBe('true')
    await app.trykk(brikker[0])
    expect(brikker[0].getAttribute('aria-checked')).toBe('true')
    expect(kort.querySelector('p')!.textContent).toContain(brikker[0].getAttribute('aria-label')!.split(',')[0])
  })

  it('cupkortet er én linje og brikker; premiene står i forklaringen', async () => {
    app = await tilSiden(await medSesong(), 'Kamper og tabell')
    const kort = kortMed(app, 'Cupen')
    expect(kort.querySelectorAll('p')).toHaveLength(1)
    expect(kort.textContent).not.toContain('kr 40 mill')
    expect(FORKLARINGER.klubb.tekst).toContain('kr 40 mill')
    expect(FORKLARINGER.klubb.tekst).toContain('10, 20 og 40 mill')
  })
})

describe('knapper og tekst', () => {
  it('ingen knapper på to linjer igjen i klubben, og Bygg står før stadion', async () => {
    app = await tilSiden(await medSesong())
    for (const side of ['Troppen og marked', 'Kamper og tabell', 'Anlegg og økonomi']) {
      await app.trykk(app.knapp(side, app.rot.querySelector('.klubbsider')!))
      expect(app.rot.querySelectorAll('.knapp-bud'), side).toHaveLength(0)
      if (side === 'Anlegg og økonomi') {
        const titler = [...app.rot.querySelectorAll('.kort-tittel')].map((t) => t.textContent)
        expect(titler.indexOf('Bygg')).toBeLessThan(titler.indexOf('Stadion'))
        for (const b of app.knapper(/^Bygg$/)) expect(b.textContent).toBe('Bygg')
      }
      await app.trykk(app.knapp('‹ Klubb'))
    }
  })

  it('akademiet er én linje, og markedet står før det', async () => {
    app = await tilSiden(await medSesong(), 'Troppen og marked')
    const titler = [...app.rot.querySelectorAll('.kort-tittel')].map((t) => t.textContent)
    expect(titler).toEqual(['Troppen', 'Overgangsmarkedet', 'Akademiet'])
    expect(kortMed(app, 'Akademiet').querySelectorAll('p')).toHaveLength(1)
  })
})

describe('«Ny» siden sist', () => {
  it('første gang er ingenting nytt; etter en dag har markedet nye spillere og det er en ny kamp', async () => {
    const s = await medSesong()
    app = await tilSiden(s)
    expect(app.rot.querySelectorAll('.klubbsider .merke.gull')).toHaveLength(0)
    taVare()
    app.lukk()

    const dagen = await simulerMedPauser(s, 300)
    app = await tilSiden(dagen)
    const radmerker = [...app.rot.querySelectorAll('.klubbside-rad')].map((r) => r.querySelector('.merke.gull')?.textContent ?? null)
    expect(radmerker[0]).toBe(`${dagen.klubb!.marked.length} nye`)
    expect(radmerker[1]).toBe('Ny kamp')

    // Inne på siden: «Ny» på spillerne; tilbake på navet er merket borte.
    await app.trykk(app.knapp('Troppen og marked', app.rot.querySelector('.klubbsider')!))
    expect(kortMed(app, 'Overgangsmarkedet').querySelectorAll('.merke.gull').length).toBeGreaterThan(0)
    await app.trykk(app.knapp('‹ Klubb'))
    const rad = app.rot.querySelectorAll('.klubbside-rad')
    expect(rad[0].querySelector('.merke.gull')).toBeNull()
    expect(rad[1].querySelector('.merke.gull')!.textContent).toBe('Ny kamp')

    await app.trykk(app.knapp('Kamper og tabell', app.rot.querySelector('.klubbsider')!))
    expect(kortMed(app, 'Kamprapport').querySelector('.merke.gull')!.textContent).toBe('Ny')
    await app.trykk(app.knapp('‹ Klubb'))
    expect(app.rot.querySelectorAll('.klubbsider .merke.gull')).toHaveLength(0)
  })

  it('en ferdig sesong får «Ny» på Sesongene', async () => {
    const s = await medSesong()
    app = await tilSiden(s)
    taVare()
    app.lukk()
    app = await tilSiden(await simulerMedPauser(s, 2700))
    const sesong = [...app.rot.querySelectorAll('.klubbside-rad')].find((r) => r.textContent!.includes('Sesongene'))!
    expect(sesong.querySelector('.merke.gull')!.textContent).toBe('Ny')
  })
})
