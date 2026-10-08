/**
 * Selve handelen, som mutasjoner på en tilstand den som kaller eier (en kopi).
 * Delt mellom spillerens handlinger og bankens tvangssalg, så begge betaler
 * samme kurtasje og flytter kursen likt. Ingen sjekker her — det gjør de som kaller.
 */

import { eiendomspris, EIENDOMSTYPER, enheterI, MEGLERHONORAR, restverdi } from './eiendom'
import { flyttKurs, handelskurs, KURTASJE, PAPIRER } from './marked'
import { flyt } from './portefolje'
import { SALGSHONORAR, selskapsverdi } from './rivaler'
import type { EiendomId, FondId, JordId, LandemerkeId, LuksusId, MaleriId, ObligasjonId, PapirId, Spilltilstand } from './types'
import { FOND_GEBYR, fondskurs } from './fond'
import { gardHost, landverdi, tommerverdi } from './jord'
import { dagnummer } from './kalender'
import { LANDEMERKE_HONORAR, landemerkepris } from './landemerker'
import { salgsprisMaleri } from './kunst'
import { KLUBBSALG_HONORAR, klubbverdi } from './klubb'
import { OBLIGASJON_GEBYR, obligasjonsverdiFor } from './obligasjoner'

/**
 * Bokfører gevinst (eller tap, negativt) på et salg: det du fikk, minus det du
 * betalte. Månedens sum skattes sammen med inntekten — se skatt.ts.
 */
export function bokforGevinst(n: Spilltilstand, belop: number): void {
  n.totaltGevinst = (n.totaltGevinst ?? 0) + belop
}

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
  bokforGevinst(n, inntekt - (n.eiendomKostpris[id] ?? 0) / Math.max(1, antall))
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
    // Er det ingenting igjen i byen, slutter forvalteren der (Pakke 57).
    const by = EIENDOMSTYPER[id].by
    if (n.forvaltere?.[by] && enheterI(n, by).eid === 0) delete n.forvaltere[by]
  }
  return inntekt
}

/** Selger hele eierandelen i et rivalselskap, minus honorar. Returnerer hva du fikk. */
export function utforRivalsalg(n: Spilltilstand, id: string): number {
  const r = n.rivaler.find((x) => x.id === id)!
  const inntekt = r.andel * selskapsverdi(r) * (1 - SALGSHONORAR)
  n.kontanter += inntekt
  flyt(n, 'rival', -inntekt)
  bokforGevinst(n, inntekt - r.kostpris)
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

/** Selger en gård eller skog med tømmeret som står, minus meglerhonorar. */
export function utforJordsalg(n: Spilltilstand, id: JordId): number {
  // Avlingen så langt denne uka følger med salget (Pakke 57), som om det var mandag.
  const host = gardHost(n, id, dagnummer(n.sek), n.sek)
  n.kontanter += host
  n.totaltHost += host
  n.totaltLeie += host
  const inntekt = (landverdi(n, id) + tommerverdi(n, id)) * (1 - MEGLERHONORAR)
  n.kontanter += inntekt
  bokforGevinst(n, inntekt - (n.jord[id]?.kostpris ?? 0))
  delete n.jord[id]
  flyt(n, 'eiendom', -inntekt)
  return inntekt
}

export function utforLandemerkesalg(n: Spilltilstand, id: LandemerkeId): number {
  const inntekt = landemerkepris(n, id) * (1 - LANDEMERKE_HONORAR)
  n.kontanter += inntekt
  bokforGevinst(n, inntekt - (n.landemerker[id]?.kostpris ?? 0))
  delete n.landemerker[id]
  flyt(n, 'eiendom', -inntekt)
  return inntekt
}

/** Selger et maleri — også et som henger på museum; da tar lånet slutt. */
export function utforMalerisalg(n: Spilltilstand, id: MaleriId): number {
  const inntekt = salgsprisMaleri(n, id)
  n.kontanter += inntekt
  bokforGevinst(n, inntekt - (n.kunst.eide[id]?.kostpris ?? 0))
  delete n.kunst.eide[id]
  return inntekt
}

export function utforKlubbsalg(n: Spilltilstand): number {
  const inntekt = klubbverdi(n) * (1 - KLUBBSALG_HONORAR)
  n.kontanter += inntekt
  bokforGevinst(n, inntekt - (n.klubb?.kostpris ?? 0))
  n.klubb = null
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
  bokforGevinst(n, inntekt - b.kostpris * (antall / b.antall))
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
/**
 * Selger `andel` (0–1) av en obligasjonspost til dagens pris, minus gebyret.
 * Gevinsten eller tapet mot kostprisen bokføres. Gir det du fikk.
 */
export function utforObligasjonssalg(n: Spilltilstand, id: ObligasjonId, andel = 1): number {
  const p = n.obligasjoner![id]!
  const a = Math.min(1, Math.max(0, andel))
  const inntekt = obligasjonsverdiFor(n, id) * a * (1 - OBLIGASJON_GEBYR)
  n.kontanter += inntekt
  flyt(n, 'obligasjon', -inntekt)
  bokforGevinst(n, inntekt - p.kostpris * a)
  if (a >= 1 || p.palydende * (1 - a) < 1) delete n.obligasjoner![id]
  else n.obligasjoner![id] = { ...p, palydende: p.palydende * (1 - a), kostpris: p.kostpris * (1 - a) }
  return inntekt
}

export function utforFondssalg(n: Spilltilstand, id: FondId, belop = Infinity): number {
  const b = n.fond[id]!
  const kurs = fondskurs(n, id)
  const andeler = Math.min(b.antall, belop / kurs)
  const inntekt = andeler * kurs * (1 - FOND_GEBYR)
  n.kontanter += inntekt
  flyt(n, 'fond', -inntekt)
  bokforGevinst(n, inntekt - b.kostpris * (andeler / b.antall))
  const igjen = b.antall - andeler
  if (igjen * kurs < 1) delete n.fond[id]
  else n.fond[id] = { antall: igjen, kostpris: b.kostpris * (igjen / b.antall) }
  return inntekt
}
