/**
 * Luksus: ting du eier, lagerplass, innredning av hjemmene og kunst.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { utforLuksussalg, utforMalerisalg } from '../handel'
import { brukteplasser, LAGER, LAGER_FOR, LUKSUS, utvidelsespris } from '../eiendom'
import { HJEM, hjemAapent, hjemFor, nesteTrinn, ROM, romtrinn } from '../hjemmene'
import { kjopsprisMaleri, MALERIER } from '../kunst'
import type { LagerId, LuksusId, MaleriId, Spilltilstand, RomId } from '../types'
import { feil, type Utfall } from './felles'

/**
 * Innreder neste trinn i et rom (Pakke 60). Pengene går som luksus: halvparten
 * teller i formuen (hjemverdi), og rommet kan ikke selges for seg.
 */
export function innred(s: Spilltilstand, rom: RomId): Utfall {
  const r = ROM[rom]
  if (!r) return feil('Ukjent rom.')
  const hjem = hjemFor(rom)
  if (!hjemAapent(s, hjem)) return feil(`${HJEM[hjem].navn} er ikke ditt ennå.`)
  const trinn = nesteTrinn(s, rom)
  if (!trinn) return feil(`${r.navn} er ferdig innredet.`)
  if (s.kontanter < trinn.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= trinn.pris
  n.totaltForbruk += trinn.pris
  n.hjem = { ...(n.hjem ?? {}), [rom]: romtrinn(s, rom) + 1 }
  return { ok: true, tilstand: n }
}

export function kjopLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  const g = LUKSUS[id]
  if (!g) return feil('Ukjent gjenstand.')
  if (s.luksus.includes(id)) return feil(`Du eier allerede ${g.navn.toLowerCase()}.`)
  const lager = LAGER_FOR[g.kategori]
  if (lager && brukteplasser(s, lager) >= s.lager[lager]) {
    return feil(`Du har ikke plass. Bygg ut ${LAGER[lager].bestemt} først.`)
  }
  if (s.kontanter < g.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= g.pris
  n.totaltForbruk += g.pris
  n.luksus.push(id)
  return { ok: true, tilstand: n }
}

export function selgLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  if (!s.luksus.includes(id)) return feil('Du eier den ikke.')
  const n = structuredClone(s)
  utforLuksussalg(n, id)
  return { ok: true, tilstand: n }
}

export function utvidLager(s: Spilltilstand, lager: LagerId): Utfall {
  if (!LAGER[lager]) return feil('Ukjent lager.')
  const pris = utvidelsespris(s, lager)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris
  n.lager[lager] += 1
  return { ok: true, tilstand: n }
}

export function kjopMaleri(s: Spilltilstand, id: MaleriId): Utfall {
  if (!MALERIER[id]) return feil('Ukjent maleri.')
  if (s.kunst.eide[id]) return feil('Du eier det allerede.')
  const pris = kjopsprisMaleri(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris - n.kunst.kurser[id]
  n.kunst.eide[id] = { kostpris: pris, utlant: false, hentes: false }
  return { ok: true, tilstand: n }
}

export function selgMaleri(s: Spilltilstand, id: MaleriId): Utfall {
  const v = s.kunst.eide[id]
  if (!v) return feil('Du eier det ikke.')
  if (v.utlant) return feil('Maleriet henger på museum. Hent det hjem først.')
  const n = structuredClone(s)
  utforMalerisalg(n, id)
  return { ok: true, tilstand: n }
}

/** Låner ut til museet, eller ber om å få det hjem — det kommer ved neste dagsskifte. */
export function museum(s: Spilltilstand, id: MaleriId): Utfall {
  const v = s.kunst.eide[id]
  if (!v) return feil('Du eier det ikke.')
  if (v.hentes) return feil('Maleriet er allerede på vei hjem.')
  const n = structuredClone(s)
  const nv = n.kunst.eide[id]!
  if (nv.utlant) nv.hentes = true
  else nv.utlant = true
  return { ok: true, tilstand: n }
}
