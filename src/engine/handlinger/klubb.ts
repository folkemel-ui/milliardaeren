/**
 * Fotballklubben: kjøpe og selge klubben, spillere og taktikk.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { utforKlubbsalg } from '../handel'
import { bygg, KLUBB_LAAST_OPP, KLUBBNAVN, kjopspris, klubbTilSalgs, MAKS_TROPP, MIN_TROPP, nesteUtbygging, salgspris, startKlubb, TAKTIKKER, type Stadiondel } from '../klubb'
import type { Spilltilstand, Taktikk } from '../types'
import { feil, type Utfall } from './felles'

/**
 * Kjøper en klubb i 4. divisjon. Prisen er det klubben er verdt, så kjøpet
 * bare flytter penger.
 */
export function kjopKlubb(s: Spilltilstand, navn: string): Utfall {
  if (s.klubb) return feil('Du eier allerede en klubb.')
  if (s.hoyesteFormue < KLUBB_LAAST_OPP) return feil('Ingen klubb vil selge til deg ennå.')
  if (!KLUBBNAVN.includes(navn)) return feil('Velg en av klubbene som er til salgs.')
  const { klubb, pris } = klubbTilSalgs(s, navn)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  startKlubb(n, klubb)
  return { ok: true, tilstand: n }
}

export function selgKlubb(s: Spilltilstand): Utfall {
  if (!s.klubb) return feil('Du eier ingen klubb.')
  const n = structuredClone(s)
  utforKlubbsalg(n)
  return { ok: true, tilstand: n }
}

export function kjopSpiller(s: Spilltilstand, id: number): Utfall {
  const k = s.klubb
  if (!k) return feil('Du eier ingen klubb.')
  const p = k.marked.find((x) => x.id === id)
  if (!p) return feil('Spilleren er ikke til salgs lenger.')
  if (k.spillere.length >= MAKS_TROPP) return feil(`Troppen er full — høyst ${MAKS_TROPP} spillere.`)
  const pris = kjopspris(p)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nk = n.klubb!
  n.kontanter -= pris
  nk.kostpris = (nk.kostpris ?? 0) + pris
  nk.marked = nk.marked.filter((x) => x.id !== id)
  nk.spillere = [...nk.spillere, { ...p }].sort((a, b) => b.styrke - a.styrke)
  return { ok: true, tilstand: n }
}

export function selgSpiller(s: Spilltilstand, id: number): Utfall {
  const k = s.klubb
  if (!k) return feil('Du eier ingen klubb.')
  const p = k.spillere.find((x) => x.id === id)
  if (!p) return feil('Fant ikke spilleren.')
  if (k.spillere.length <= MIN_TROPP) return feil(`Du må ha minst ${MIN_TROPP} spillere.`)
  const n = structuredClone(s)
  n.kontanter += salgspris(p)
  n.klubb!.kostpris = (n.klubb!.kostpris ?? 0) - salgspris(p)
  n.klubb!.spillere = n.klubb!.spillere.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

/** Bygger ut stadion (Pakke 66): neste tribunetrinn, flomlys eller VIP-losje. */
export function byggStadion(s: Spilltilstand, del: Stadiondel): Utfall {
  const k = s.klubb
  if (!k) return feil('Du eier ingen klubb.')
  if (del !== 'tribune' && del !== 'flomlys' && del !== 'vip') return feil('Ukjent utbygging.')
  const neste = nesteUtbygging(k, del)
  if (!neste) return feil('Det er allerede bygd.')
  if (s.kontanter < neste.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bygg(n, n.klubb!, del, neste.pris)
  return { ok: true, tilstand: n }
}

export function settTaktikk(s: Spilltilstand, taktikk: Taktikk): Utfall {
  if (!s.klubb) return feil('Du eier ingen klubb.')
  if (!TAKTIKKER[taktikk]) return feil('Ukjent taktikk.')
  if (s.klubb.taktikk === taktikk) return feil('Den taktikken er allerede valgt.')
  const n = structuredClone(s)
  n.klubb!.taktikk = taktikk
  return { ok: true, tilstand: n }
}
