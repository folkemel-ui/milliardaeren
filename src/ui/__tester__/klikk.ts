/**
 * Klikktester (Pakke 52): hele appen tegnes i happy-dom, og testen trykker seg
 * gjennom den som en spiller. Hver test får sin egen lagring og et ferskt
 * lager — modulene lastes på nytt, så ingenting henger igjen mellom testene.
 *
 * Bruk i en testfil med `// @vitest-environment happy-dom` øverst:
 *
 *     const app = await startApp(spill)
 *     await app.trykk(app.knapp(/Oppgrader/))
 *     expect(app.tekst()).toContain('Nivå 2')
 *     app.lukk()
 */

import { vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Spilltilstand } from '../../engine/types'
import { VERSJON } from '../versjon'

/** React vil vite at testene venter på oppdateringer med act(). */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export interface App {
  rot: HTMLElement
  /** All synlig tekst i appen, med mellomrom mellom delene. */
  tekst(): string
  /** Den første knappen (eller lenken) med teksten eller aria-label, ellers en feil. */
  knapp(tekst: string | RegExp, innenfor?: Element): HTMLElement
  /** Alle knapper med teksten eller aria-label. */
  knapper(tekst: string | RegExp, innenfor?: Element): HTMLElement[]
  /** Trykker og venter til React har tegnet ferdig. */
  trykk(el: Element): Promise<void>
  /** Bytter fane i menyen nederst. */
  fane(navn: string): Promise<void>
  /** Spillet slik lageret har det nå, lagret og lest tilbake. */
  spill(): Spilltilstand
  /** Venter litt ekte tid, så animasjoner og forsinkede tegninger blir ferdige. */
  vent(ms?: number): Promise<void>
  lukk(): void
}

const passer = (el: Element, tekst: string | RegExp) => {
  const navn = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`.trim()
  return typeof tekst === 'string' ? navn.includes(tekst) : tekst.test(navn)
}

/** Starter appen med en lagring. Uten lagring starter et nytt spill. */
export async function startApp(spill?: Spilltilstand): Promise<App> {
  // En del som forrige test begynte å hente (G12, ui/vedBehov.ts), må bli ferdig før
  // modulene nullstilles — ellers stopper modullasteren, og denne testen henger.
  await (await import('../vedBehov')).ventPaaHenting()
  vi.resetModules()
  localStorage.clear()
  if (spill) localStorage.setItem('milliardaer.lagring', JSON.stringify(spill))
  // Spillet har vært åpent nettopp, så det kommer ingen velkomst etter tid borte.
  localStorage.setItem('milliardaer.sistAktiv', String(Date.now()))
  // Ingen «Nytt i versjonen»-vindu midt i testen.
  localStorage.setItem('milliardaer.versjon', VERSJON)

  const { default: App } = await import('../../App')
  const lager = await import('../../state/lager')
  const rot = document.createElement('div')
  rot.id = 'root'
  document.body.replaceChildren(rot)
  let react: Root
  await act(async () => {
    react = createRoot(rot)
    react.render(createElement(App))
  })

  const app: App = {
    rot,
    tekst: () => rot.textContent ?? '',
    knapper: (tekst, innenfor = rot) => [...innenfor.querySelectorAll<HTMLElement>('button, a, [role="button"]')].filter((el) => passer(el, tekst)),
    knapp(tekst, innenfor = rot) {
      const el = app.knapper(tekst, innenfor)[0]
      if (!el) throw new Error(`Fant ingen knapp «${tekst}». Knappene er: ${app.knapper(/./, innenfor).map((k) => k.textContent?.trim()).join(' | ')}`)
      return el
    },
    async trykk(el) {
      await act(async () => {
        ;(el as HTMLElement).click()
      })
    },
    async fane(navn) {
      const meny = rot.querySelector('nav') ?? rot
      await app.trykk(app.knapp(navn, meny))
      await app.vent(50)
    },
    spill() {
      lager.lagre()
      return JSON.parse(localStorage.getItem('milliardaer.lagring')!) as Spilltilstand
    },
    async vent(ms = 20) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, ms))
      })
    },
    lukk() {
      act(() => react.unmount())
      // Klokken tikker ellers videre etter at testens dokument er revet ned.
      lager.stoppSpillokke()
      document.body.replaceChildren()
    },
  }
  return app
}
