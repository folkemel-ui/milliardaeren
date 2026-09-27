/**
 * Selve handelen, som mutasjoner på en tilstand den som kaller eier (en kopi).
 * Delt mellom spillerens handlinger og bankens tvangssalg, så begge betaler
 * samme kurtasje og flytter kursen likt. Ingen sjekker her — det gjør de som kaller.
 */

import { flyttKurs, handelskurs, KURTASJE } from './marked'
import type { PapirId, Spilltilstand } from './types'

/** Kjøper `antall` og returnerer hva det kostet, kurtasje inkludert. */
export function utforKjop(n: Spilltilstand, id: PapirId, antall: number): number {
  const kostnad = antall * handelskurs(n, id, antall) * (1 + KURTASJE)
  n.kontanter -= kostnad
  const b = n.beholdning[id] ?? { antall: 0, kostpris: 0 }
  n.beholdning[id] = { antall: b.antall + antall, kostpris: b.kostpris + kostnad }
  flyttKurs(n.marked, id, antall)
  return kostnad
}

/** Selger `antall` og returnerer hva du fikk, etter kurtasje. */
export function utforSalg(n: Spilltilstand, id: PapirId, antall: number): number {
  const b = n.beholdning[id]!
  const inntekt = antall * handelskurs(n, id, -antall) * (1 - KURTASJE)
  n.kontanter += inntekt
  const igjen = b.antall - antall
  if (igjen <= 1e-9) {
    delete n.beholdning[id]
  } else {
    // Snittprisen står fast: kostprisen krymper i takt med antallet.
    n.beholdning[id] = { antall: igjen, kostpris: b.kostpris * (igjen / b.antall) }
  }
  flyttKurs(n.marked, id, -antall)
  return inntekt
}
