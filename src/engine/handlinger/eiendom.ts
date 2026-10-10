/**
 * Eiendom: bygg, oppussing, forvaltere, gårder og skog, og landemerker.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { utforEiendomssalg, utforJordsalg, utforLandemerkesalg } from '../handel'
import { byverdi, EIENDOM_SYNLIG_VED, forvalterpaaslag, kjopsprisEiendom, EIENDOMSTYPER, flyFor, kanReiseTil, LUKSUS, oppussingspris, standard, STANDARDER, statusnivaa } from '../eiendom'
import { DAG_SEK } from '../kalender'
import { leggTilHendelse } from '../bank'
import { flyt } from '../portefolje'
import { FORVALTERE, forvalterpris } from '../utleie'
import { JORD, JORD_SYNLIG_VED, landverdi, tommerverdi } from '../jord'
import { eierDu, kjopsprisLandemerke, landemerkepris, LANDEMERKER } from '../landemerker'
import type { EiendomId, JordId, LandemerkeId, Spilltilstand, By, ForvalterId } from '../types'
import { kortKroner } from '../tall'
import { feil, type Utfall } from './felles'

export function eiendomSynlig(s: Spilltilstand, id: EiendomId): boolean {
  return s.hoyesteFormue >= EIENDOMSTYPER[id].pris * EIENDOM_SYNLIG_VED
}

export function kjopEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  const t = EIENDOMSTYPER[id]
  if (!t) return feil('Ukjent eiendom.')
  if (!eiendomSynlig(s, id)) return feil(`${t.navn} er ikke til salgs for deg ennå.`)
  if (statusnivaa(s) < t.statuskrav) return feil(`Du trenger statusnivå ${t.statuskrav} for å kjøpe ${t.navn.toLowerCase()}.`)
  if (!kanReiseTil(s, id)) return feil(`Du må ha ${LUKSUS[flyFor(id)!].navn.toLowerCase()} for å komme deg til ${t.by}.`)
  if ((s.eiendommer[id] ?? 0) >= t.maksAntall) return feil(`Du eier allerede alle ${t.maksAntall} som er til salgs.`)
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const pris = kjopsprisEiendom(s, id)
  const paaslag = forvalterpaaslag(s, id)
  if (s.kontanter < pris + paaslag) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris + paaslag
  n.eiendommer[id] = (n.eiendommer[id] ?? 0) + 1
  // Oppussingen enheten hopper over, går i kostprisen som en oppussing gjør.
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  flyt(n, 'eiendom', pris)
  // Forvalteren tar sitt av det nye, som han tok av det du eide da han ble ansatt.
  n.totaltForbruk += paaslag
  return { ok: true, tilstand: n }
}

export function selgEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen.')
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const n = structuredClone(s)
  utforEiendomssalg(n, id)
  return { ok: true, tilstand: n }
}

/**
 * Pusser opp alle enhetene av en type ett trinn. Pengene går ut nå, standarden
 * kommer når håndverkerne er ferdige — og så lenge står enhetene tomme.
 * Kostnaden legges til kostprisen, så avkastningen regnes riktig.
 */
export function pussOpp(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen å pusse opp.')
  if (s.oppussing[id]) return feil('Oppussingen er allerede i gang.')
  const pris = oppussingspris(s, id)
  if (pris === null) return feil('Høyeste standard er allerede nådd.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const neste = standard(s, id) + 1
  const n = structuredClone(s)
  n.kontanter -= pris
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  n.oppussing[id] = { standard: neste, ferdigSek: n.sek + STANDARDER[neste].dager * DAG_SEK }
  return { ok: true, tilstand: n }
}

export function jordSynlig(s: Spilltilstand, id: JordId): boolean {
  return s.hoyesteFormue >= JORD[id].pris * JORD_SYNLIG_VED
}

/** Kjøper en gård eller en skog. En skog kjøpes nyplantet — tømmeret vokser fra nå. */
export function kjopJord(s: Spilltilstand, id: JordId): Utfall {
  const t = JORD[id]
  if (!t) return feil('Ukjent jord.')
  if (s.jord[id]) return feil(`Du eier allerede ${t.navn.toLowerCase()}.`)
  if (!jordSynlig(s, id)) return feil(`${t.navn} er ikke til salgs for deg ennå.`)
  const pris = landverdi(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.jord[id] = { kostpris: pris, plantetSek: n.sek }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Selger jorda, med tømmeret som står, minus meglerhonorar. */
export function selgJord(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier den ikke.')
  const n = structuredClone(s)
  utforJordsalg(n, id)
  return { ok: true, tilstand: n }
}

/** Hogger skogen: tømmeret selges, og ny skog plantes. */
export function hoggSkog(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Det er ingen skog å hogge der.')
  const n = structuredClone(s)
  const tommer = tommerverdi(n, id)
  if (tommer < 1) return feil('Skogen er nyplantet — det er ingenting å hogge ennå.')
  n.kontanter += tommer
  n.totaltHost += tommer
  n.totaltLeie += tommer
  n.jord[id]!.plantetSek = n.sek
  flyt(n, 'eiendom', -tommer)
  leggTilHendelse(n, { tittel: 'Hogst', tekst: `${JORD[id].navn} er hogd. Tømmeret ga ${kortKroner(tommer)}, og ny skog er plantet.`, alvor: 'info' })
  return { ok: true, tilstand: n }
}

/** Kjøper et landemerke — fra markedet, eller fra rivalen som eier det, med premie. */
export function kjopLandemerke(s: Spilltilstand, id: LandemerkeId): Utfall {
  const l = LANDEMERKER[id]
  if (!l) return feil('Ukjent landemerke.')
  if (eierDu(s, id)) return feil(`Du eier allerede ${l.navn}.`)
  const pris = kjopsprisLandemerke(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const eier = n.landemerker[id]?.eier
  const rival = eier ? n.rivaler.find((r) => r.id === eier) : undefined
  // Rivalen bytter bygget mot pengene — og tjener premien.
  if (rival) rival.formue += pris - landemerkepris(n, id)
  n.kontanter -= pris
  n.landemerker[id] = { eier: 'deg', kostpris: pris }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

export function selgLandemerke(s: Spilltilstand, id: LandemerkeId): Utfall {
  if (!eierDu(s, id)) return feil('Du eier det ikke.')
  const n = structuredClone(s)
  utforLandemerkesalg(n, id)
  return { ok: true, tilstand: n }
}

/**
 * Ansetter en eiendomsforvalter i en by (Pakke 54): en engangssum etter det du
 * eier der, og en stil. Bytter du stil, sier du opp den gamle først.
 */
export function ansettForvalter(s: Spilltilstand, by: By, id: ForvalterId): Utfall {
  if (!FORVALTERE[id]) return feil('Ukjent forvalter.')
  if (s.forvaltere?.[by]) return feil('Byen har allerede en forvalter.')
  const verdi = byverdi(s, by)
  if (verdi <= 0) return feil('Du eier ingen eiendom i byen.')
  const pris = forvalterpris(verdi)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris
  n.forvaltere = { ...(n.forvaltere ?? {}), [by]: id }
  return { ok: true, tilstand: n }
}

export function sigOppForvalter(s: Spilltilstand, by: By): Utfall {
  if (!s.forvaltere?.[by]) return feil('Byen har ingen forvalter.')
  const n = structuredClone(s)
  delete n.forvaltere![by]
  return { ok: true, tilstand: n }
}
