/** Et nytt spill: 1 000 kr og en saftbod. */

import { nettoformue } from './formler'
import { BEDRIFTSTYPER, STARTKAPITAL } from './innhold'
import { lagMarked } from './marked'
import type { Spilltilstand } from './types'

/** Lagringens skjemaversjon. Bumpes når tilstandens form endres — se migrering.ts. */
export const SPILLVERSJON = 3

/** Sekunder mellom punktene i formuehistorikken ved start. */
export const HISTORIKK_INTERVALL = 10

export function nyttSpill(startfrø = 20260927): Spilltilstand {
  const { marked, frø } = lagMarked(startfrø)
  const s: Spilltilstand = {
    versjon: SPILLVERSJON,
    frø,
    sek: 0,
    kontanter: STARTKAPITAL,
    // Saftboden er gratis, men bokføres til det den er verdt.
    bedrifter: [
      { id: 'b1', type: 'saftbod', nivaa: 1, startetSek: 0, ansatte: 0, leder: false, investert: BEDRIFTSTYPER.saftbod.pris },
    ],
    nesteId: 2,
    historikk: { intervall: HISTORIKK_INTERVALL, punkter: [] },
    totaltTjent: 0,
    hoyesteFormue: 0,
    marked,
    beholdning: {},
    gjeld: 0,
    totaltUtbytte: 0,
    hendelser: [],
  }
  s.hoyesteFormue = nettoformue(s)
  s.historikk.punkter.push({ sek: 0, verdi: s.hoyesteFormue })
  return s
}
