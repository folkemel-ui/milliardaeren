/**
 * Racingteamet (Pakke 90): starte det, bygge ut bilen, ansette førere, velge
 * strategi og selge. Hver er en ren funksjon: tilstand inn, ny tilstand (eller
 * en feilmelding) ut.
 */

import { utforJuniorsalg, utforRacingsalg } from '../handel'
import { ANLEGG, BILDELER, nesteAkademi, nesteAnleggspris, nesteDelpris, nySponsor, nyttRacingteam, SPONSORAVTALER, STRATEGIER, TEAMPRIS } from '../racing'
import type { Bildel, Lopsstrategi, Racinganlegg, Spilltilstand, Sponsoravtale } from '../types'
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

// ─────────────────────────────────────────────── Juniorer, anlegg og sponsorer (Pakke 111)

/** Bygger juniorakademiet ett trinn. Pengene teller i teamets verdi, som delene. */
export function byggRacingakademi(s: Spilltilstand): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  const neste = nesteAkademi(r)
  if (!neste) return feil('Akademiet er bygd helt ut.')
  if (s.kontanter < neste.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = n.racing!
  n.kontanter -= neste.pris
  nr.investert += neste.pris
  nr.akademi = (nr.akademi ?? 0) + 1
  nr.juniorer ??= []
  return { ok: true, tilstand: n }
}

/** Bygger et anlegg ett trinn. Pengene teller i teamets verdi. */
export function byggAnlegg(s: Spilltilstand, anlegg: Racinganlegg): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  if (!ANLEGG[anlegg]) return feil('Ukjent anlegg.')
  const pris = nesteAnleggspris(r, anlegg)
  if (pris === null) return feil(`${ANLEGG[anlegg].navn} er bygd helt ut.`)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = n.racing!
  n.kontanter -= pris
  nr.investert += pris
  nr.anlegg = { ...nr.anlegg, [anlegg]: (nr.anlegg?.[anlegg] ?? 0) + 1 }
  return { ok: true, tilstand: n }
}

/** Setter en junior i et sete. Den som satt der, går — som når du ansetter fra markedet. */
export function juniorISete(s: Spilltilstand, id: number, sete: number): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  if (sete !== 0 && sete !== 1) return feil('Ukjent sete.')
  const f = r.juniorer?.find((x) => x.id === id)
  if (!f) return feil('Junioren er ikke i akademiet.')
  const n = structuredClone(s)
  const nr = n.racing!
  nr.forere[sete] = { ...f }
  nr.juniorer = nr.juniorer!.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

/** Selger en junior til et annet team for 40 dagers lønn. Hele salget er gevinst. */
export function selgJunior(s: Spilltilstand, id: number): Utfall {
  if (!s.racing?.juniorer?.some((x) => x.id === id)) return feil('Junioren er ikke i akademiet.')
  const n = structuredClone(s)
  utforJuniorsalg(n, id)
  return { ok: true, tilstand: n }
}

/** Velger sponsoravtalen for sesongen — bare før første løp. */
export function velgSponsor(s: Spilltilstand, avtale: Sponsoravtale): Utfall {
  const r = s.racing
  if (!r) return feil('Du har ikke et racingteam.')
  if (!SPONSORAVTALER[avtale]) return feil('Ukjent avtale.')
  if (r.runde > 0) return feil('Avtalen for i år er alt skrevet under. Du kan velge igjen før neste sesong.')
  const n = structuredClone(s)
  const nr = n.racing!
  nr.sponsor = nr.sponsor ? { ...nr.sponsor, avtale } : nySponsor(nr, avtale)
  return { ok: true, tilstand: n }
}
