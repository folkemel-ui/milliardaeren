/**
 * Testhjelpere: handlingene som kaster ved feil i stedet for å returnere et
 * utfall, så testene kan lenke dem uten å sjekke ok hver gang.
 */

import * as h from '../handlinger'
import { maksNyttLaan } from '../formler'
import type { Bedrift, BedriftstypeId, EiendomId, LagerId, LuksusId, Spilltilstand } from '../types'

function ok(u: h.Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

export const kjopEiendom = (s: Spilltilstand, id: EiendomId) => ok(h.kjopEiendom(s, id))
export const selgEiendom = (s: Spilltilstand, id: EiendomId) => ok(h.selgEiendom(s, id))
export const kjopLuksus = (s: Spilltilstand, id: LuksusId) => ok(h.kjopLuksus(s, id))
export const selgLuksus = (s: Spilltilstand, id: LuksusId) => ok(h.selgLuksus(s, id))
export const utvidLager = (s: Spilltilstand, id: LagerId) => ok(h.utvidLager(s, id))
export const laan = (s: Spilltilstand, belop: number) => ok(h.laan(s, belop))
export const maksNyttLaanFor = maksNyttLaan

/** En bedrift til tester, med fornuftige standardverdier for alt som ikke er gitt. */
export function bedrift(type: BedriftstypeId, felt: Partial<Bedrift> = {}): Bedrift {
  return {
    id: `t-${type}`,
    type,
    nivaa: 1,
    startetSek: 0,
    ansatte: 0,
    leder: false,
    investert: 0,
    tjent: 0,
    inntektHistorikk: [],
    forbedringer: 0,
    fusjoner: 0,
    ...felt,
  }
}
