/**
 * Banken: sparekonto, obligasjoner, lån, rentebinding, nedbetaling og skatt.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { fastrente, flytendeRente, maksNyttLaan } from '../formler'
import { utforObligasjonssalg } from '../handel'
import { RENTE_PER_TIME } from '../innhold'
import { dagnummer } from '../kalender'
import { flyt, settInnSparing, trekkFraSparing } from '../portefolje'
import { BINDING_DAGER, FAST_PAASLAG, NORMAL_STYRINGSRENTE } from '../verden'
import { markedsrente, OBLIGASJONER } from '../obligasjoner'
import type { ObligasjonId, Spilltilstand } from '../types'
import { feil, ikkeTall, UGYLDIG, type Utfall } from './felles'

/** Selger andeler for et beløp (før gebyr), eller alt. */
/**
 * Kjøper statsobligasjoner for `belop` (Pakke 53). Kupongen låses til
 * styringsrenten i dag; har du fra før, blir renten snittet vektet med
 * pålydende — det samme som å eie postene hver for seg.
 */
export function kjopObligasjon(s: Spilltilstand, id: ObligasjonId, belop: number): Utfall {
  if (!OBLIGASJONER[id]) return feil('Ukjent obligasjon.')
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.floor(Math.min(belop, s.kontanter))
  if (b <= 0) return feil('Velg hvor mye du vil kjøpe for.')
  const n = structuredClone(s)
  n.obligasjoner ??= {}
  const fra = n.obligasjoner[id]
  // Den nye kjøpes til kurs 1, med kupongen låst til markedsrenten i dag (Pakke 56).
  const rente = markedsrente(n, id)
  const palydende = (fra?.palydende ?? 0) + b
  // Kursen er lineær i ankeret, så et vektet snitt holder verdien av den gamle posten der den var.
  const snitt = (gammel: number) => (fra ? (fra.palydende * gammel + b * rente) / palydende : rente)
  n.obligasjoner[id] = {
    palydende,
    rente: snitt(fra?.rente ?? 0),
    anker: snitt(fra?.anker ?? 0),
    kostpris: (fra?.kostpris ?? 0) + b,
  }
  n.kontanter -= b
  flyt(n, 'obligasjon', b)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, b)
  return { ok: true, tilstand: n }
}

/** Selger en andel (0–1) av en obligasjonspost. */
export function selgObligasjon(s: Spilltilstand, id: ObligasjonId, andel = 1): Utfall {
  if (!s.obligasjoner?.[id]) return feil('Du eier ingen slike obligasjoner.')
  if (ikkeTall(andel) || andel <= 0) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  const inntekt = utforObligasjonssalg(n, id, andel)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  return { ok: true, tilstand: n }
}

export function betalSkatt(s: Spilltilstand, id: number): Utfall {
  const r = s.skatt.regninger.find((x) => x.id === id)
  if (!r) return feil('Fant ikke regningen.')
  if (s.kontanter < r.belop) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= r.belop
  n.skatt.totaltBetalt += r.belop
  n.skatt.regninger = n.skatt.regninger.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

export function settOffshore(s: Spilltilstand, på: boolean): Utfall {
  if (s.skatt.offshore === på) return feil(på ? 'Offshore er allerede i bruk.' : 'Offshore er allerede av.')
  const n = structuredClone(s)
  n.skatt.offshore = på
  return { ok: true, tilstand: n }
}

export function settInn(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.kontanter)
  if (b <= 0) return feil('Du har ingen kontanter å sette inn.')
  const n = structuredClone(s)
  n.kontanter -= b
  settInnSparing(n, b)
  flyt(n, 'sparing', b)
  return { ok: true, tilstand: n }
}

export function taUt(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.sparing)
  if (b <= 0) return feil('Sparekontoen er tom.')
  const n = structuredClone(s)
  trekkFraSparing(n, b)
  n.kontanter += b
  flyt(n, 'sparing', -b)
  // Restbeløp under én krone føres over, så kontoen faktisk blir tom.
  if (n.sparing < 1) {
    flyt(n, 'sparing', -n.sparing)
    n.kontanter += n.sparing
    trekkFraSparing(n, n.sparing)
  }
  return { ok: true, tilstand: n }
}

export function laan(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.floor(belop)
  if (b <= 0) return feil('Velg hvor mye du vil låne.')
  if (b > maksNyttLaan(s)) return feil('Banken låner deg ikke så mye.')
  const n = structuredClone(s)
  n.kontanter += b
  n.gjeld += b
  n.harLaant = true
  return { ok: true, tilstand: n }
}

/**
 * Binder lånerenten (Pakke 49): dagens flytende rente pluss et påslag, låst i
 * én fase. Bindingen kan ikke løses opp før den går ut — så kan du binde igjen
 * eller la renten flyte.
 */
export function bindRente(s: Spilltilstand): Utfall {
  if (fastrente(s) !== null) return feil('Renten er allerede bundet.')
  const n = structuredClone(s)
  n.rentebinding = {
    sats: flytendeRente(s) + (RENTE_PER_TIME * FAST_PAASLAG) / NORMAL_STYRINGSRENTE,
    tilDag: dagnummer(s.sek) + BINDING_DAGER,
  }
  return { ok: true, tilstand: n }
}

export function nedbetal(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.gjeld)
  if (b <= 0) return feil('Du har ingen gjeld å betale.')
  if (b > s.kontanter) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= b
  n.gjeld -= b
  // Restgjeld under én krone strykes, så lånet faktisk blir borte.
  if (n.gjeld < 1) n.gjeld = 0
  return { ok: true, tilstand: n }
}
