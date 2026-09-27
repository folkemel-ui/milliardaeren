/** Spillets innhold: tall som beskriver verden, ikke tilstand. */

import type { Bedriftstype, BedriftstypeId } from './types'

export const STARTKAPITAL = 1_000

/** Målet: fra nesten ingenting til en milliard. */
export const MAAL = 1_000_000_000

export const BEDRIFTSTYPER: Record<BedriftstypeId, Bedriftstype> = {
  saftbod: { id: 'saftbod', navn: 'Saftbod', inntektPerSek: 1, grunnverdi: 250 },
}
