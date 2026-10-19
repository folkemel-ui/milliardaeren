/** Romfartsfabrikken (Pakke 118): kjøpet, forskningsavdelingen, forskningen og valget av kontrakt. */

import { DELTRINN, forskningspris, forskningstid, nesteAvdelingspris, nyRomfart, RAKETTDELER, ROMFART_PRIS, romfartAapen, kanLofte } from '../romfart'
import type { Rakettdel, Spilltilstand } from '../types'
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

/** Starter forskningen på neste trinn av en del. Én om gangen. */
export function startForskning(s: Spilltilstand, del: Rakettdel): Utfall {
  const r = s.romfart
  if (!r) return feil('Du har ingen romfartsfabrikk.')
  if (!RAKETTDELER[del]) return feil('Ukjent del.')
  if (r.avdeling < 1) return feil('Bygg en forskningsavdeling først.')
  if (r.forskning) return feil('Avdelingen forsker allerede.')
  if (r.deler[del] >= DELTRINN) return feil(`${RAKETTDELER[del].navn} er forsket ferdig.`)
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
  return { ok: true, tilstand: n }
}
