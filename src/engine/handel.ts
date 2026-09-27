/**
 * Selve handelen, som mutasjoner på en tilstand den som kaller eier (en kopi).
 * Delt mellom spillerens handlinger og bankens tvangssalg, så begge betaler
 * samme kurtasje og flytter kursen likt. Ingen sjekker her — det gjør de som kaller.
 */

import { eiendomspris, MEGLERHONORAR, restverdi } from './eiendom'
import { flyttKurs, handelskurs, KURTASJE } from './marked'
import type { EiendomId, LuksusId, PapirId, Spilltilstand } from './types'

/** Selger én eiendom til dagens pris, minus meglerhonorar. Returnerer hva du fikk. */
export function utforEiendomssalg(n: Spilltilstand, id: EiendomId): number {
  const inntekt = eiendomspris(n, id) * (1 - MEGLERHONORAR)
  n.kontanter += inntekt
  const igjen = (n.eiendommer[id] ?? 0) - 1
  if (igjen > 0) n.eiendommer[id] = igjen
  else delete n.eiendommer[id]
  return inntekt
}

/** Selger en luksusgjenstand til restverdien. */
export function utforLuksussalg(n: Spilltilstand, id: LuksusId): number {
  const inntekt = restverdi(id)
  n.kontanter += inntekt
  n.luksus = n.luksus.filter((l) => l !== id)
  return inntekt
}

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
