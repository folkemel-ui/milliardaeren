/**
 * Tilbake går tilbake (Pakke 61). Det som ligger over spillet — en annen fane
 * enn Bedrifter, en detaljside, et vindu som avisa eller gatebildet — er et
 * lag. Hvert åpent lag har sitt eget steg i nettleserhistorikken, så
 * telefonens tilbakeknapp og tilbakesveipet lukker det øverste laget i stedet
 * for å forlate spillet.
 *
 * Stegene er like og bærer bare dybden sin (`{ milliardaer: n }`). Ved
 * `popstate` lukkes lag til stabelen er like dyp som steget vi landet på.
 * Lukkes et lag med en knapp, går historikken ett steg tilbake selv — samlet
 * til ett `history.go(-n)` når flere lag lukkes på en gang (bytter du fane,
 * lukkes fanen og detaljsiden samtidig). Siden stegene er like, spiller det
 * ingen rolle hvilket steg som forsvinner, bare at antallet stemmer.
 */

import { useEffect, useRef } from 'react'

type Lag = { lukk: () => void }

const stabel: Lag[] = []
let ventende = 0
let klar = false

function dybde(tilstand: unknown): number {
  const d = (tilstand as { milliardaer?: unknown } | null)?.milliardaer
  return typeof d === 'number' && d >= 0 ? d : 0
}

/** Steget spillet startet på er bunnen. Etter en omlasting kan det bære en gammel dybde. */
function forbered(): void {
  if (klar) return
  klar = true
  try {
    history.replaceState({ milliardaer: 0 }, '')
  } catch {
    // Uten historikk virker spillet som før, bare uten tilbakesteg.
  }
}

export function aapneLag(lukk: () => void): Lag {
  forbered()
  const lag = { lukk }
  stabel.push(lag)
  try {
    history.pushState({ milliardaer: stabel.length }, '')
  } catch {
    // Se over.
  }
  return lag
}

/** Laget ble lukket i spillet (en knapp, et fanebytte): ta bort steget det hadde. */
export function lukkLag(lag: Lag): void {
  const i = stabel.indexOf(lag)
  // Allerede lukket av tilbakeknappen.
  if (i < 0) return
  stabel.splice(i, 1)
  ventende++
  if (ventende > 1) return
  queueMicrotask(() => {
    const n = ventende
    ventende = 0
    try {
      history.go(-n)
    } catch {
      // Se over.
    }
  })
}

/** Hvor mange lag som er åpne — for testene. */
export function antallLag(): number {
  return stabel.length
}

function vedTilbake(e: PopStateEvent): void {
  const maal = dybde(e.state)
  // Fremover inn i et steg uten lag: steget teller som det vi står på.
  if (maal > stabel.length) {
    try {
      history.replaceState({ milliardaer: stabel.length }, '')
    } catch {
      // Se over.
    }
    return
  }
  while (stabel.length > maal) stabel.pop()!.lukk()
}

/** Startes av App. Gir tilbake en funksjon som slutter å lytte. */
export function lyttEtterTilbake(): () => void {
  forbered()
  window.addEventListener('popstate', vedTilbake)
  return () => window.removeEventListener('popstate', vedTilbake)
}

/**
 * Et lag som er åpent så lenge `aapen` er sann. Tilbake kaller `lukk`, som må
 * gjøre `aapen` usann (eller fjerne komponenten). `lukk` kan være en ny
 * funksjon hver gang.
 */
export function useTilbake(aapen: boolean, lukk: () => void): void {
  const lukkRef = useRef(lukk)
  lukkRef.current = lukk
  useEffect(() => {
    if (!aapen) return
    const lag = aapneLag(() => lukkRef.current())
    return () => lukkLag(lag)
  }, [aapen])
}
