/**
 * Selve handelen, som mutasjoner på en tilstand den som kaller eier (en kopi).
 * Delt mellom spillerens handlinger og bankens tvangssalg, så begge betaler
 * samme kurtasje og flytter kursen likt. Ingen sjekker her — det gjør de som kaller.
 */

import { eiendomspris, MEGLERHONORAR, restverdi } from './eiendom'
import { flyttKurs, handelskurs, KURTASJE, PAPIRER } from './marked'
import { flyt } from './portefolje'
import { SALGSHONORAR, selskapsverdi } from './rivaler'
import type { EiendomId, FondId, LuksusId, PapirId, Spilltilstand } from './types'
import { FOND_GEBYR, fondskurs } from './fond'

/** Så mange handler huskes til merkene på grafen. */
export const MAKS_HANDLER = 60

function loggHandel(n: Spilltilstand, id: PapirId, antall: number, kurs: number): void {
  if (!n.handler) return
  n.handler.push({ papir: id, sek: n.sek, kurs, antall })
  if (n.handler.length > MAKS_HANDLER) n.handler.shift()
}

/** Selger én eiendom til dagens pris, minus meglerhonorar. Returnerer hva du fikk. */
export function utforEiendomssalg(n: Spilltilstand, id: EiendomId): number {
  const inntekt = eiendomspris(n, id) * (1 - MEGLERHONORAR)
  n.kontanter += inntekt
  flyt(n, 'eiendom', -inntekt)
  const antall = n.eiendommer[id] ?? 0
  const igjen = antall - 1
  if (igjen > 0) {
    n.eiendommer[id] = igjen
    // Snittprisen står fast: kostprisen krymper i takt med antallet.
    n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) * (igjen / antall)
  } else {
    // Den siste enheten er solgt: standarden og en eventuell oppussing følger med.
    delete n.eiendommer[id]
    delete n.eiendomKostpris[id]
    delete n.eiendomStandard[id]
    delete n.oppussing[id]
  }
  return inntekt
}

/** Selger hele eierandelen i et rivalselskap, minus honorar. Returnerer hva du fikk. */
export function utforRivalsalg(n: Spilltilstand, id: string): number {
  const r = n.rivaler.find((x) => x.id === id)!
  const inntekt = r.andel * selskapsverdi(r) * (1 - SALGSHONORAR)
  n.kontanter += inntekt
  flyt(n, 'rival', -inntekt)
  r.andel = 0
  r.kostpris = 0
  r.overtatt = false
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
  const kurs = handelskurs(n, id, antall)
  const kostnad = antall * kurs * (1 + KURTASJE)
  loggHandel(n, id, antall, kurs)
  n.kontanter -= kostnad
  flyt(n, PAPIRER[id].klasse, kostnad)
  const b = n.beholdning[id] ?? { antall: 0, kostpris: 0 }
  n.beholdning[id] = { antall: b.antall + antall, kostpris: b.kostpris + kostnad }
  flyttKurs(n.marked, id, antall)
  return kostnad
}

/** Selger `antall` og returnerer hva du fikk, etter kurtasje. */
export function utforSalg(n: Spilltilstand, id: PapirId, antall: number): number {
  const b = n.beholdning[id]!
  const kurs = handelskurs(n, id, -antall)
  const inntekt = antall * kurs * (1 - KURTASJE)
  loggHandel(n, id, -antall, kurs)
  n.kontanter += inntekt
  flyt(n, PAPIRER[id].klasse, -inntekt)
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

/** Selger et helt fond, eller et beløp av det, etter gebyr. Returnerer hva du fikk. */
export function utforFondssalg(n: Spilltilstand, id: FondId, belop = Infinity): number {
  const b = n.fond[id]!
  const kurs = fondskurs(n, id)
  const andeler = Math.min(b.antall, belop / kurs)
  const inntekt = andeler * kurs * (1 - FOND_GEBYR)
  n.kontanter += inntekt
  flyt(n, 'fond', -inntekt)
  const igjen = b.antall - andeler
  if (igjen * kurs < 1) delete n.fond[id]
  else n.fond[id] = { antall: igjen, kostpris: b.kostpris * (igjen / b.antall) }
  return inntekt
}
