/**
 * Det du gjør med hendene: selge saft selv før du har ansatte, og kø ved
 * bedriftene som du kan betjene for en bonus.
 *
 * Køen trekkes fra en hash av sekundet, ikke fra terningen — så den endrer
 * aldri markedet eller noe annet som kommer fra samme frø. Boten betjener
 * ingen kø, så balansen er den samme; køen er en bonus for den som følger med.
 */

import { bedriftInntektIDag } from './formler'
import { hashTekst, tilfeldig } from './rng'
import type { Utfall } from './handlinger'
import type { Spilltilstand } from './types'

const feil = (tekst: string): Utfall => ({ ok: false, feil: tekst })

// ─────────────────────────────────────────────── Selge selv

/** Det du får for én kopp saft du selger selv. */
export const KOPPEPRIS = 2
/** Så mange kopper rekker du å selge i sekundet. */
export const MAKS_KOPPER_PER_SEK = 5

/** Du selger selv til saftboden har fått sin første ansatte. */
export function kanSelgeSelv(s: Spilltilstand): boolean {
  const saft = s.bedrifter.find((b) => b.type === 'saftbod')
  return !!saft && saft.ansatte === 0
}

export function selgKopp(s: Spilltilstand): Utfall {
  const saft = s.bedrifter.find((b) => b.type === 'saftbod')
  if (!saft) return feil('Du har ingen saftbod.')
  if (saft.ansatte > 0) return feil('De ansatte tar seg av salget nå.')
  const solgt = s.handsalg?.sek === s.sek ? s.handsalg.antall : 0
  if (solgt >= MAKS_KOPPER_PER_SEK) return feil('Én kunde om gangen!')
  const n = structuredClone(s)
  n.kontanter += KOPPEPRIS
  n.totaltTjent += KOPPEPRIS
  n.bedrifter.find((b) => b.type === 'saftbod')!.tjent += KOPPEPRIS
  n.handsalg = { sek: n.sek, antall: solgt + 1 }
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Kø

/** Sjansen per sekund for at det dannes kø et sted, når appen er åpen. Omtrent hvert tredje minutt. */
export const KO_SJANSE = 1 / 180
/** Så lenge køen står før kundene går. */
export const KO_VARER_SEK = 10
/** Bonusen er så mange sekunder av bedriftens inntekt. */
export const KO_BONUS_SEK = 30

const KO_FRØ = hashTekst('kø')

/** Den aktive køen, eller null når den ikke finnes eller har gått. */
export function aktivKo(s: Spilltilstand): NonNullable<Spilltilstand['ko']> | null {
  return s.ko && s.sek < s.ko.slutterSek && s.bedrifter.some((b) => b.id === s.ko!.bedriftId) ? s.ko : null
}

/** Hvert sekund: en gammel kø går, og en ny kan dannes — men aldri mens du er borte. Muterer. */
export function kotikk(s: Spilltilstand, borte: boolean): void {
  // Borte går hvert sekund i timevis — da gjøres det minst mulig.
  if (borte) {
    if (s.ko && s.sek >= s.ko.slutterSek) s.ko = null
    return
  }
  if (s.ko && !aktivKo(s)) s.ko = null
  if (s.ko || s.bedrifter.length === 0) return
  if (tilfeldig(KO_FRØ + s.sek) >= KO_SJANSE) return
  const b = s.bedrifter[Math.floor(tilfeldig(KO_FRØ + s.sek + 1) * s.bedrifter.length)]
  // Tretti sekunder av det bedriften tjener i dag — med helligdag, vær og nyheter (Pakke 58).
  const bonus = bedriftInntektIDag(s, b) * KO_BONUS_SEK
  if (bonus <= 0) return
  s.ko = { bedriftId: b.id, slutterSek: s.sek + KO_VARER_SEK, bonus }
}

export function betjenKo(s: Spilltilstand): Utfall {
  const ko = aktivKo(s)
  if (!ko) return feil('Kundene har gått.')
  const n = structuredClone(s)
  n.kontanter += ko.bonus
  n.totaltTjent += ko.bonus
  n.bedrifter.find((b) => b.id === ko.bedriftId)!.tjent += ko.bonus
  n.ko = null
  return { ok: true, tilstand: n }
}
