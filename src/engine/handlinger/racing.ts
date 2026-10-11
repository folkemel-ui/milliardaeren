/**
 * Racingteamet (Pakke 90): starte det, bygge ut bilen, ansette førere, velge
 * strategi og selge. Hver er en ren funksjon: tilstand inn, ny tilstand (eller
 * en feilmelding) ut.
 */

import { utforRacingsalg } from '../handel'
import { BILDELER, nesteDelpris, nyttRacingteam, STRATEGIER, TEAMPRIS } from '../racing'
import type { Bildel, Lopsstrategi, Spilltilstand } from '../types'
import { feil, type Utfall } from './felles'

/** Melder Formel 1-bilen på som et team. Påmeldingen er forbruk, som luksus. */
export function startRacingteam(s: Spilltilstand): Utfall {
  if (s.racing) return feil('Du har allerede et racingteam.')
  if (!s.luksus.includes('formelbil')) return feil('Du trenger en Formel 1-bil først.')
  if (s.kontanter < TEAMPRIS) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= TEAMPRIS
  n.totaltForbruk += TEAMPRIS
  n.racing = nyttRacingteam(n)
  return { ok: true, tilstand: n }
}

/** Bygger ut én del på bilen ett trinn. Det delene koster, teller i teamets verdi. */
export function oppgraderDel(s: Spilltilstand, del: Bildel): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  if (!BILDELER[del]) return feil('Ukjent del.')
  const pris = nesteDelpris(r, del)
  if (pris === null) return feil(`${BILDELER[del].navn} er bygd helt ut.`)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = n.racing!
  n.kontanter -= pris
  nr.investert += pris
  nr.deler[del] = (nr.deler[del] ?? 0) + 1
  return { ok: true, tilstand: n }
}

/** Ansetter en fører fra markedet i et sete. Den som satt der, går. */
export function ansettForer(s: Spilltilstand, id: number, sete: number): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  if (sete !== 0 && sete !== 1) return feil('Ukjent sete.')
  const f = r.marked.find((x) => x.id === id)
  if (!f) return feil('Føreren er ikke på markedet.')
  const n = structuredClone(s)
  const nr = n.racing!
  nr.forere[sete] = { ...f }
  nr.marked = nr.marked.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

export function settStrategi(s: Spilltilstand, strategi: Lopsstrategi): Utfall {
  if (!s.racing) return feil('Du har ikke et racingteam.')
  if (!STRATEGIER[strategi]) return feil('Ukjent strategi.')
  const n = structuredClone(s)
  n.racing!.strategi = strategi
  return { ok: true, tilstand: n }
}

/** Selger teamet: 85 % av det delene kostet. Bilen og trofeene beholder du. */
export function selgRacingteam(s: Spilltilstand): Utfall {
  if (!s.racing) return feil('Du har ikke et racingteam.')
  const n = structuredClone(s)
  utforRacingsalg(n)
  return { ok: true, tilstand: n }
}
