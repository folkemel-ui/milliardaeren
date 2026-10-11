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
import { byttepris, FORVALTERE, forvalterpris } from '../utleie'
import { bokforOpptjent, byggpris, byggSperre, GARDSBYGG, lagerverdi, GARDSTRINN, gardstrinn, JORD, JORD_SYNLIG_VED, jorder, landverdi, MASKINER, MAKS_JORDER, maskinpris, nesteJordpris, tommerverdi } from '../jord'
import { eierDu, kjopsprisLandemerke, landemerkepris, LANDEMERKER } from '../landemerker'
import type { EiendomId, Gardsbygg, Gardsmaskin, JordId, LandemerkeId, Spilltilstand, By, ForvalterId } from '../types'
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

/**
 * Legger en jord til gården (Pakke 92). Prisen følger jordverdien; jorda teller i
 * gårdens verdi til det den kostet. Avlingen så langt denne uka bokføres først med
 * gårdens gamle størrelse. Når gården når et nytt trinn, sier et varsel det.
 */
export function kjopJorde(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog har ingen jorder.')
  const pris = nesteJordpris(s, id)
  if (pris === null) return feil(`Gården er full: ${MAKS_JORDER} jorder.`)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforOpptjent(n, id)
  const j = n.jord[id]!
  const trinn = gardstrinn(j)
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  j.jorder = jorder(j) + 1
  flyt(n, 'eiendom', pris)
  const nytt = gardstrinn(j)
  if (nytt > trinn) {
    const g = GARDSTRINN[nytt]
    leggTilHendelse(n, { tittel: 'Gården', tekst: `${JORD[id].navn.replace(/^Gård/, 'Gården')} er nå ${g.navn === 'Gods' ? 'et gods' : `en ${g.navn.toLowerCase()}`}: +${g.status} status.`, alvor: 'info' })
  }
  return { ok: true, tilstand: n }
}

/** Kjøper en maskin til gården (Pakke 92): én av hver, priset etter gårdens verdi. */
export function kjopMaskin(s: Spilltilstand, id: JordId, m: Gardsmaskin): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog trenger ingen maskiner.')
  if (!MASKINER[m]) return feil('Ukjent maskin.')
  if (s.jord[id]!.maskiner?.[m]) return feil(`Gården har alt ${MASKINER[m].navn.toLowerCase()}.`)
  const pris = maskinpris(s, id, m)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforOpptjent(n, id)
  const j = n.jord[id]!
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  j.maskiner = { ...(j.maskiner ?? {}), [m]: true }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/**
 * Bygger på gården (Pakke 93): drenering, frostdekke, drivhus, silo eller låve. Teller i
 * gårdens verdi til det det kostet. Ukas avling så langt bokføres først, siden været og
 * drivhuset endrer den. En silo slår på lagringen av kornet.
 */
export function kjopGardsbygg(s: Spilltilstand, id: JordId, b: Gardsbygg): Utfall {
  const j = s.jord[id]
  if (!j) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog trenger ingen bygg.')
  if (!GARDSBYGG[b]) return feil('Ukjent bygg.')
  if (j.bygg?.[b]) return feil(`Gården har alt ${GARDSBYGG[b].navn.toLowerCase()}.`)
  const sperre = byggSperre(j, b)
  if (sperre) return feil(`${sperre}.`)
  const pris = byggpris(s, id, b)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforOpptjent(n, id)
  const nj = n.jord[id]!
  n.kontanter -= pris
  nj.kostpris += pris
  nj.investert = (nj.investert ?? 0) + pris
  nj.bygg = { ...(nj.bygg ?? {}), [b]: true }
  if (b === 'silo') nj.lagre = true
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Selger alt kornet i silo og låve til denne ukas pris. Det er avling, som høsten mandag. */
export function selgKorn(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]?.lager) return feil('Det er ikke noe korn å selge.')
  const n = structuredClone(s)
  const verdi = lagerverdi(n, id)
  n.kontanter += verdi
  n.totaltHost += verdi
  n.totaltLeie += verdi
  n.jord[id]!.lager = 0
  return { ok: true, tilstand: n }
}

/** Slår av eller på at kornet går i silo mandag. */
export function settLagring(s: Spilltilstand, id: JordId, lagre: boolean): Utfall {
  if (!s.jord[id]?.bygg?.silo) return feil('Gården har ingen silo.')
  const n = structuredClone(s)
  n.jord[id]!.lagre = lagre
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

/**
 * Bytter forvalteren i en by (Pakke 83): koster BYTTE_ANDEL av det du eier der, ikke en
 * ny ansettelse — så det lønner seg å bytte når konjunkturen snur.
 */
export function byttForvalter(s: Spilltilstand, by: By, id: ForvalterId): Utfall {
  if (!FORVALTERE[id]) return feil('Ukjent forvalter.')
  const naa = s.forvaltere?.[by]
  if (!naa) return feil('Byen har ingen forvalter å bytte.')
  if (naa === id) return feil(`${FORVALTERE[id].navn} forvalter allerede ${by}.`)
  const pris = byttepris(byverdi(s, by))
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
