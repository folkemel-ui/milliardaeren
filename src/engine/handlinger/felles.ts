/**
 * Det handlingene deler: utfallet, feilmeldingene, tallsjekken og investering i en bedrift.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import type { Bedrift, Spilltilstand } from '../types'

export type Utfall = { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }

export const feil = (tekst: string): Utfall => ({ ok: false, feil: tekst })

/*
 * NaN slipper gjennom sammenligninger som «n < 1» (de er alltid usanne), og
 * blir null i lagringen. Alle antall og beløp sjekkes derfor først. Uendelig
 * er lov der det betyr «alt» — Math.min og taket tar seg av det.
 */
export const ikkeTall = (x: number) => typeof x !== 'number' || Number.isNaN(x)

export const UGYLDIG = 'Skriv inn et gyldig tall.'

export function finn(s: Spilltilstand, id: string): Bedrift | undefined {
  return s.bedrifter.find((b) => b.id === id)
}

/**
 * Betaler for noe i en bedrift: trekker prisen og kjører endringen på en kopi.
 * Er det en investering (oppgradering, forbedring), legges beløpet til
 * bedriftens verdi; er det drift (ansatte, leder), er pengene brukt.
 */
export function investerI(s: Spilltilstand, id: string, pris: number, endring: (b: Bedrift) => void, bokfor = true): Utfall {
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const b = finn(n, id)!
  n.kontanter -= pris
  if (bokfor) b.investert += pris
  else n.totaltForbruk += pris
  endring(b)
  return { ok: true, tilstand: n }
}
