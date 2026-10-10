/**
 * Spiller `sek` sekunder i biter, med en pause mellom hver (Pakke 78). Lange
 * simuleringer i ett kall sultet testkjøreren i den tunge gruppen («Timeout
 * calling onTaskUpdate»), så ytelsestesten aldri ble kjørt. `simuler(s, n)` er
 * det samme som n enkeltsekunder, så bitene gir nøyaktig samme tilstand.
 */

import { simuler } from '../../engine/simulering'
import type { Spilltilstand } from '../../engine/types'

export async function simulerMedPauser(s: Spilltilstand, sek: number, bit = 300): Promise<Spilltilstand> {
  let t = s
  for (let gjort = 0; gjort < sek; gjort += bit) {
    t = simuler(t, Math.min(bit, sek - gjort))
    await new Promise((r) => setTimeout(r, 0))
  }
  return t
}
