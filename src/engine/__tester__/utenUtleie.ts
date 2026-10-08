/**
 * For tester av leie og eiendomspriser (grunnmekanikken): ledigheten og
 * forvalterne fra Pakke 54 skrus av, så leien er det den var. Brukes slik øverst
 * i en testfil:
 *
 *     vi.mock('../utleie', async (ekte) => (await import('./utenUtleie')).utenUtleie(ekte))
 *
 * Utleien selv testes i pakke54.test.ts.
 */

import type * as Utleie from '../utleie'

export async function utenUtleie(importOriginal: () => Promise<unknown>) {
  const ekte = (await importOriginal()) as typeof Utleie
  return { ...ekte, leiefaktorBy: () => 1, ledighet: () => 0 }
}
