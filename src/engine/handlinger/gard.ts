/**
 * Gården du bygger (Pakker 92–94): jorder, maskiner, bygg, kornlageret og dyrene.
 * Skilt ut fra eiendom.ts da den passerte 300 linjer (Pakke 65s regel). Hver er en
 * ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { antallDyr, bokforDyr, DYR, dyrpris, fjosplasser } from '../dyr'
import { dagnummer } from '../kalender'
import {
  bokforGard,
  bokforOpptjent,
  byggpris,
  byggSperre,
  GARDSBYGG,
  GARDSTRINN,
  gardstrinn,
  JORD,
  jorder,
  KRAFTVERK,
  kraftpris,
  kraftSperre,
  kraftverkFor,
  lagerverdi,
  MAKS_JORDER,
  MAKS_MASKINTRINN,
  MAKS_NABOER,
  MASKINER,
  maskinpris,
  maskintrinn,
  NABO_FAKTOR,
  NABO_STATUS,
  nabopris,
  naboer,
  nesteJordpris,
  ukeFor,
} from '../jord'
import { leggTilHendelse } from '../bank'
import { flyt } from '../portefolje'
import type { Gardsbygg, Gardsdyr, Gardsmaskin, JordId, Kraftverk, Lagring, Spilltilstand } from '../types'
import { feil, type Utfall } from './felles'

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
  bokforGard(j, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  const nytt = gardstrinn(j)
  if (nytt > trinn) {
    const g = GARDSTRINN[nytt]
    leggTilHendelse(n, { tittel: 'Gården', tekst: `${JORD[id].navn.replace(/^Gård/, 'Gården')} er nå ${g.navn === 'Gods' ? 'et gods' : `en ${g.navn.toLowerCase()}`}: +${g.status} status.`, alvor: 'info' })
  }
  return { ok: true, tilstand: n }
}

/** Kjøper en maskin til gården (Pakke 92), eller (Pakke 114) neste trinn på den: høyst tre. */
export function kjopMaskin(s: Spilltilstand, id: JordId, m: Gardsmaskin): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog trenger ingen maskiner.')
  if (!MASKINER[m]) return feil('Ukjent maskin.')
  if (maskintrinn(s.jord[id], m) >= MAKS_MASKINTRINN) return feil(`${MASKINER[m].navn} er på høyeste trinn.`)
  const pris = maskinpris(s, id, m)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforOpptjent(n, id)
  const j = n.jord[id]!
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  j.maskintrinn = { ...(j.maskintrinn ?? {}), [m]: maskintrinn(j, m) + 1 }
  j.maskiner = { ...(j.maskiner ?? {}), [m]: true }
  flyt(n, 'eiendom', pris)
  bokforGard(j, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  return { ok: true, tilstand: n }
}

/**
 * Bygger et kraftverk (Pakke 115): vindturbiner på Lista, solcellepanel på en gård med låve,
 * småkraft i Namdalen. Prisen teller i jordas verdi; kraften betales hvert sekund, som leia.
 */
export function byggKraftverk(s: Spilltilstand, id: JordId, verk: Kraftverk): Utfall {
  const j = s.jord[id]
  if (!j) return feil('Du eier ikke jorda.')
  if (!KRAFTVERK[verk] || !kraftverkFor(id).includes(verk)) return feil(`${KRAFTVERK[verk]?.navn ?? 'Det'} kan ikke stå her.`)
  if (j.kraftverk?.[verk] !== undefined) return feil(`${KRAFTVERK[verk].navn} står alt her.`)
  const sperre = kraftSperre(j, verk)
  if (sperre) return feil(`${sperre}.`)
  const pris = kraftpris(s, id, verk)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nj = n.jord[id]!
  n.kontanter -= pris
  nj.kostpris += pris
  nj.investert = (nj.investert ?? 0) + pris
  nj.kraftverk = { ...(nj.kraftverk ?? {}), [verk]: 0 }
  flyt(n, 'eiendom', pris)
  bokforGard(nj, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  return { ok: true, tilstand: n }
}

/**
 * Kjøper nabogården (Pakke 114): bare et gods, høyst tre. Hver tredobler jorda avlingen, jordene
 * og maskinene regnes på; prisen teller i gårdens verdi som jordene. Ukas avling så langt bokføres
 * først med gården slik den var.
 */
export function kjopNabogard(s: Spilltilstand, id: JordId): Utfall {
  const j = s.jord[id]
  if (!j) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog har ingen nabogård.')
  if (naboer(j) >= MAKS_NABOER) return feil(`Gården har alt ${MAKS_NABOER} nabogårder.`)
  const pris = nabopris(s, id)
  if (pris === null) return feil('Først når gården er et gods.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforOpptjent(n, id)
  const nj = n.jord[id]!
  n.kontanter -= pris
  nj.kostpris += pris
  nj.investert = (nj.investert ?? 0) + pris
  nj.naboer = naboer(nj) + 1
  flyt(n, 'eiendom', pris)
  bokforGard(nj, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  const navn = JORD[id].navn.replace(/^Gård/, 'Gården')
  leggTilHendelse(n, { tittel: 'Gården', tekst: `${navn} har kjøpt nabogården: avlingen ×${NABO_FAKTOR}, +${NABO_STATUS} status.`, alvor: 'info' })
  return { ok: true, tilstand: n }
}

/**
 * Bygger på gården (Pakke 93): drenering, frostdekke, drivhus, silo eller låve. Teller i
 * gårdens verdi til det det kostet. Ukas avling så langt bokføres først, siden været og
 * drivhuset endrer den. En silo slår på lagringen: fra Pakke 105 «lagre billig, selg dyrt».
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
  if (b === 'silo') nj.lagring = 'smart'
  flyt(n, 'eiendom', pris)
  bokforGard(nj, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  return { ok: true, tilstand: n }
}

/**
 * Selger alt på lager — kornet, og (Pakke 105) grønnsakene og frukten i låven — til denne
 * ukas priser. Det er avling, som høsten mandag.
 */
export function selgKorn(s: Spilltilstand, id: JordId): Utfall {
  const j = s.jord[id]
  if (!j?.lager && !j?.lagerAnnet?.gronnsaker && !j?.lagerAnnet?.frukt) return feil('Det er ikke noe på lager å selge.')
  const n = structuredClone(s)
  const verdi = lagerverdi(n, id)
  n.kontanter += verdi
  n.totaltHost += verdi
  n.totaltLeie += verdi
  n.jord[id]!.lager = 0
  delete n.jord[id]!.lagerAnnet
  bokforGard(n.jord[id]!, ukeFor(dagnummer(n.sek)), 'korn', verdi)
  return { ok: true, tilstand: n }
}

/**
 * Kjøper et dyr til fjøset (Pakke 94). Prisen følger jordverdien; dyret teller i gårdens
 * verdi til det det kostet og følger med når gården selges. Utbyttet så langt i dag
 * bokføres først med dyrene som var.
 */
export function kjopDyr(s: Spilltilstand, id: JordId, d: Gardsdyr): Utfall {
  const j = s.jord[id]
  if (!j) return feil('Du eier ikke gården.')
  if (JORD[id].type !== 'gard') return feil('En skog har ingen dyr.')
  if (!DYR[d]) return feil('Ukjent dyr.')
  if (!j.bygg?.fjos) return feil('Bygg et fjøs først.')
  if (antallDyr(j) >= fjosplasser(j)) return feil('Fjøset er fullt. Flere jorder gir et større fjøs.')
  const pris = dyrpris(s, id, d)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  bokforDyr(n, id)
  const nj = n.jord[id]!
  n.kontanter -= pris
  nj.kostpris += pris
  nj.investert = (nj.investert ?? 0) + pris
  nj.dyr = { ...(nj.dyr ?? {}), [d]: (nj.dyr?.[d] ?? 0) + 1 }
  flyt(n, 'eiendom', pris)
  bokforGard(nj, ukeFor(dagnummer(n.sek)), 'bygd', pris)
  return { ok: true, tilstand: n }
}

/** Velger hva lageret gjør mandag (Pakke 105): selger avlingen, lagrer den, eller lagrer billig og selger dyrt. */
export function settLagring(s: Spilltilstand, id: JordId, valg: Lagring): Utfall {
  if (!s.jord[id]?.bygg?.silo) return feil('Gården har ingen silo.')
  if (valg !== 'selg' && valg !== 'lagre' && valg !== 'smart') return feil('Ukjent valg.')
  const n = structuredClone(s)
  n.jord[id]!.lagring = valg
  return { ok: true, tilstand: n }
}
