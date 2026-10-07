/**
 * For tester av grunnmekanikken (inntekt, lønn, leder borte): kalenderen fra
 * Pakke 49 skrus av, så hver bransje får faktor 1 hver dag. Brukes slik øverst
 * i en testfil:
 *
 *     vi.mock('../verden', async (ekte) => (await import('./utenKalender')).utenKalender(ekte))
 *
 * (vi.mock løftes over importene, så hjelperen må hentes inne i fabrikken.)
 *
 * Kalenderen selv testes i pakke49.test.ts.
 */

import type * as Verden from '../verden'
import type { BedriftstypeId, Spilltilstand } from '../types'

export async function utenKalender(importOriginal: () => Promise<unknown>) {
  const ekte = (await importOriginal()) as typeof Verden
  const nøytral = new Proxy({} as Record<BedriftstypeId, number>, { get: () => 1 })
  return {
    ...ekte,
    dagsbilde: (s: Spilltilstand, dag?: number) => ({ ...ekte.dagsbilde(s, dag), faktor: nøytral }),
    dagsfaktor: () => 1,
  }
}
