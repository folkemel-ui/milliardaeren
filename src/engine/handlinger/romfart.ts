/** Romfartsfabrikken (Pakke 118): kjøpet, forskningsavdelingen, forskningen og valget av kontrakt. */

import { DELTRINN, delnavn, FORSKNINGSDELER, forskningspris, forskningstid, kanLofte, nesteAvdelingspris, nyRomfart, ROMFART_PRIS, romfartAapen, satellitterPerOppskyting, satellittoppskytingPris, taNedKull, trinnFor } from '../romfart'
import type { Forskningsdel, Spilltilstand } from '../types'
import { feil, type Utfall } from './felles'

export function kjopRomfart(s: Spilltilstand): Utfall {
  if (s.romfart) return feil('Du eier allerede romfartsfabrikken.')
  if (!romfartAapen(s)) return feil('Romfartsfabrikken er ikke låst opp ennå.')
  if (s.kontanter < ROMFART_PRIS) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= ROMFART_PRIS
  n.romfart = nyRomfart(n)
  return { ok: true, tilstand: n }
}

/** Bygger neste trinn av forskningsavdelingen. Trinn 1 åpner forskningen. */
export function byggAvdeling(s: Spilltilstand): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  const pris = nesteAvdelingspris(r)
  if (pris === null) return feil('Avdelingen er bygget ferdig.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.romfart!.avdeling += 1
  n.romfart!.investert += pris
  return { ok: true, tilstand: n }
}

/** Starter forskningen på neste trinn av en del — i raketten eller satellittene (Pakke 119). Én om gangen. */
export function startForskning(s: Spilltilstand, del: Forskningsdel): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  if (!FORSKNINGSDELER.includes(del)) return feil('Ukjent del.')
  if (r.avdeling < 1) return feil('Bygg en forskningsavdeling først.')
  if (r.forskning) return feil('Avdelingen forsker allerede.')
  if (trinnFor(r, del) >= DELTRINN) return feil(`${delnavn(del)} er forsket ferdig.`)
  const pris = forskningspris(r, del)!
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.romfart!.investert += pris
  n.romfart!.forskning = { del, ferdigSek: s.sek + forskningstid(r, del)! }
  return { ok: true, tilstand: n }
}

/** Velger kontrakten som skytes opp ved neste dagsskifte. */
export function velgKontrakt(s: Spilltilstand, id: number): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  const k = r.tavle.find((x) => x.id === id)
  if (!k) return feil('Kontrakten finnes ikke lenger.')
  if (!kanLofte(r, k)) return feil('Raketten løfter ikke denne.')
  const n = structuredClone(s)
  n.romfart!.valgt = id
  delete n.romfart!.valgtSatellitter
  return { ok: true, tilstand: n }
}

/**
 * Velger egne satellitter for neste dagsskifte (Pakke 119): så mange som raketten løfter,
 * innenfor lisensen. Raketten og satellittene betales ved oppskytingen.
 */
export function velgSatellitter(s: Spilltilstand): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  if (satellitterPerOppskyting(r) < 1) return feil('Lisensen er full: ta ned gamle satellitter først.')
  if (s.kontanter < satellittoppskytingPris(r)) return feil('Du har ikke råd til raketten og satellittene.')
  const n = structuredClone(s)
  n.romfart!.valgtSatellitter = true
  delete n.romfart!.valgt
  return { ok: true, tilstand: n }
}

/** Tar et kull satellitter ned før tiden, for å gi plass til bedre (Pakke 119). */
export function taNedSatellitter(s: Spilltilstand, kullId: number): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  if (!(r.kull ?? []).some((k) => k.id === kullId)) return feil('Satellittene finnes ikke.')
  const n = structuredClone(s)
  taNedKull(n.romfart!, kullId)
  return { ok: true, tilstand: n }
}
