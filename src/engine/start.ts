/** Et nytt spill: 1 000 kr og en saftbod. */

import { nettoformue } from './formler'
import { STARTKAPITAL } from './innhold'
import type { Spilltilstand } from './types'

/** Lagringens skjemaversjon. Bumpes når tilstandens form endres — se migrering.ts. */
export const SPILLVERSJON = 1

/** Sekunder mellom punktene i formuehistorikken ved start. */
export const HISTORIKK_INTERVALL = 10

export function nyttSpill(frø = 20260927): Spilltilstand {
  const s: Spilltilstand = {
    versjon: SPILLVERSJON,
    frø,
    sek: 0,
    kontanter: STARTKAPITAL,
    bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 1, startetSek: 0 }],
    nesteId: 2,
    historikk: { intervall: HISTORIKK_INTERVALL, punkter: [] },
    totaltTjent: 0,
  }
  s.historikk.punkter.push({ sek: 0, verdi: nettoformue(s) })
  return s
}
