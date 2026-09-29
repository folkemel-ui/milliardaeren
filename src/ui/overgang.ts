/**
 * Overgangen mellom en liste og en detaljside (bedrift, aksje, klubb):
 * detaljsiden vokser ut av kortet du trykket på, og når du går tilbake,
 * glir lista inn igjen der du var.
 *
 * Kortet huskes fra selve trykket (en lytter på hele dokumentet), så
 * skjermene trenger ikke sende det videre — de setter bare ref-en fra
 * useVoksUt på detaljsiden.
 */

import { useLayoutEffect, useRef } from 'react'

/** Et trykk eldre enn dette åpnet ikke detaljsiden (den kom av noe annet). */
const MAKS_ALDER_MS = 600
const VOKS_MS = 320
const TILBAKE_MS = 220

let sisteTrykk: { rect: DOMRect; tid: number; scrollY: number } | null = null

function redusertBevegelse(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Husker kortet ved hvert trykk. Kalles én gang fra appen; gir tilbake en opprydding. */
export function lyttEtterKorttrykk(): () => void {
  const vedTrykk = (e: Event) => {
    const kort = (e.target as Element | null)?.closest?.('.kort')
    sisteTrykk = kort ? { rect: kort.getBoundingClientRect(), tid: performance.now(), scrollY: window.scrollY } : null
  }
  document.addEventListener('click', vedTrykk, true)
  return () => document.removeEventListener('click', vedTrykk, true)
}

/**
 * For detaljsiden. Ved åpning: rull til toppen, og la siden vokse ut fra
 * kortet ved å klippe den til kortets ramme og åpne klippet. Ved lukking:
 * rull tilbake dit lista var, og la lista gli inn fra venstre.
 */
export function useVoksUt<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  // Trykket hentes én gang per side, så det overlever at effekten kjøres to ganger (StrictMode).
  const trykkRef = useRef<{ trykk: typeof sisteTrykk; scrollY: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!trykkRef.current) {
      const t = sisteTrykk && performance.now() - sisteTrykk.tid < MAKS_ALDER_MS ? sisteTrykk : null
      sisteTrykk = null
      trykkRef.current = { trykk: t, scrollY: t?.scrollY ?? window.scrollY }
    }
    const { trykk, scrollY: tilbakeTil } = trykkRef.current
    const main = el?.closest('.innhold')
    window.scrollTo({ top: 0 })

    if (el && trykk && !redusertBevegelse() && typeof el.animate === 'function') {
      const d = el.getBoundingClientRect()
      const k = trykk.rect
      const inn = (n: number) => `${Math.max(0, Math.round(n))}px`
      const fra = `inset(${inn(k.top - d.top)} ${inn(d.right - k.right)} ${inn(d.bottom - k.bottom)} ${inn(k.left - d.left)} round 16px)`
      // Gli-animasjonen fra CSS er reserven når det ikke finnes et kort å vokse fra.
      el.style.animation = 'none'
      el.animate([{ clipPath: fra, opacity: 0.7 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], {
        duration: VOKS_MS,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      })
    }

    return () => {
      // Den nye lista er på plass i neste bilde. Byttet du fane i stedet, er
      // hele innholdet nytt — da skal ingenting rulles eller gli.
      requestAnimationFrame(() => {
        // Står detaljsiden der ennå, ble den ikke lukket (effekten kjøres bare på nytt).
        if (el?.isConnected || !main?.isConnected) return
        window.scrollTo({ top: tilbakeTil })
        const liste = main.firstElementChild as HTMLElement | null
        if (!liste || liste.classList.contains('detalj') || redusertBevegelse() || typeof liste.animate !== 'function') return
        // Fanenes glideanimasjon fra CSS ville ellers spilt av igjen på den nye lista.
        liste.style.animation = 'none'
        liste.animate([{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], {
          duration: TILBAKE_MS,
          easing: 'ease-out',
        })
      })
    }
  }, [])

  return ref
}
