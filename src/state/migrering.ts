/**
 * Lagringsmigrering. Gamle lagringer løftes trinn for trinn i stedet for å
 * forkastes.
 *
 * Kontrakten når SPILLVERSJON bumpes fra N til N+1:
 *   1. Legg en funksjon under nøkkel N i MIGRERINGER som tar en versjon
 *      N-tilstand og returnerer feltene slik versjon N+1 forventer dem.
 *      Kjøreren stempler `versjon` selv — migreringen rører bare feltene.
 *   2. Skriv en test i migrering.test.ts som løfter en ekte N-lagring.
 * Hopp ALDRI over et trinn: en kjede 1→2→3 lar en hvilken som helst gammel
 * lagring nå frem, en direktehopp-migrering gjør det ikke.
 */

import { SPILLVERSJON } from '../engine/start'
import type { Spilltilstand } from '../engine/types'

export type Raatilstand = Record<string, unknown>

/** Nøkkel N løfter en lagring fra versjon N til N+1. Tom til første bump. */
export const MIGRERINGER: Record<number, (s: Raatilstand) => Raatilstand> = {}

export type MigreringsResultat =
  | { ok: true; tilstand: Spilltilstand; migrert: boolean }
  | { ok: false; feil: string }

/**
 * Løfter en parset lagring til gjeldende versjon. Ren funksjon — muterer aldri
 * inndataene. `migreringer` og `tilVersjon` kan byttes ut i tester.
 */
export function migrer(
  rå: unknown,
  tilVersjon: number = SPILLVERSJON,
  migreringer: Record<number, (s: Raatilstand) => Raatilstand> = MIGRERINGER,
): MigreringsResultat {
  if (typeof rå !== 'object' || rå === null || Array.isArray(rå)) {
    return { ok: false, feil: 'Lagringen er ikke en gyldig spilltilstand.' }
  }
  const versjon = (rå as Raatilstand).versjon
  if (typeof versjon !== 'number' || !Number.isInteger(versjon)) {
    return { ok: false, feil: 'Lagringen mangler gyldig versjonsnummer.' }
  }
  if (versjon > tilVersjon) {
    return {
      ok: false,
      feil: `Lagringen er fra en nyere spillversjon (${versjon} — denne er ${tilVersjon}).`,
    }
  }
  let s = rå as Raatilstand
  for (let v = versjon; v < tilVersjon; v++) {
    const steg = migreringer[v]
    if (!steg) {
      return {
        ok: false,
        feil: `Lagringen (versjon ${versjon}) er for gammel — ingen migrering fra versjon ${v}.`,
      }
    }
    s = { ...steg(s), versjon: v + 1 }
  }
  return { ok: true, tilstand: s as unknown as Spilltilstand, migrert: versjon < tilVersjon }
}
