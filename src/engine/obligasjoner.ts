/**
 * Statsobligasjoner (Pakke 53): et sted mellom sparekontoen og aksjene.
 *
 * Kupongen låses til markedsrenten den dagen du kjøper, og betales hvert
 * sekund som sparerenten — litt høyere, mer jo lengre løpetid. Prisen følger
 * markedsrenten den andre veien: stiger den ett prosentpoeng, faller den lange
 * obligasjonen rundt 8 % og den korte rundt 2 %.
 *
 * Markedsrenten ser fremover (Pakke 56). Konjunkturene trekkes hver for seg, så
 * etter fasen som går nå, ventes styringsrenten å bli snittet (3,875 %). En
 * obligasjon løper lenger enn én fase, så markedsrenten er dagens styringsrente
 * bare for den delen av løpetiden fasen har igjen, og snittet for resten. Før
 * fulgte prisen styringsrenten alene — og i en høykonjunktur, med renten på
 * topp, kunne den bare stige: +9 % i snitt ved hvert faseskifte.
 *
 * Kupongene regnes som utbytte i regnskapet, og en gevinst eller et tap ved
 * salg beskattes som andre gevinster.
 */

import { SPARERENTE_PER_TIME } from './innhold'
import { DAG_SEK } from './kalender'
import { FASE_DAGER, LANGSIKTIG_STYRINGSRENTE, NORMAL_STYRINGSRENTE, sekIgjenAvFasen, styringsrente } from './verden'
import type { ObligasjonId, Obligasjonspost, Spilltilstand } from './types'

export const OBLIGASJONER: Record<ObligasjonId, { navn: string; kortnavn: string; varighet: number; paaslag: number }> = {
  kort: { navn: 'Statsobligasjon, 2 år', kortnavn: '2 år', varighet: 2, paaslag: 0.1 },
  lang: { navn: 'Statsobligasjon, 10 år', kortnavn: '10 år', varighet: 8, paaslag: 0.25 },
}

export const OBLIGASJONSLISTE = Object.keys(OBLIGASJONER) as ObligasjonId[]

/** Salget koster så stor andel. */
export const OBLIGASJON_GEBYR = 0.001

/** Prisen aldri under dette per krone pålydende — en obligasjon blir ikke verdiløs. */
const LAVESTE_KURS = 0.05

/**
 * Markedsrenten for en løpetid, i prosent: styringsrenten for den delen av
 * løpetiden fasen har igjen, snittet over tid for resten. Løpetiden regnes som
 * `varighet` faser.
 */
export function markedsrente(s: Spilltilstand, id: ObligasjonId): number {
  const vekt = Math.min(1, sekIgjenAvFasen(s) / (OBLIGASJONER[id].varighet * FASE_DAGER * DAG_SEK))
  return LANGSIKTIG_STYRINGSRENTE + (styringsrente(s) - LANGSIKTIG_STYRINGSRENTE) * vekt
}

/** Prisen per krone pålydende for en post, ved markedsrenten nå. */
export function obligasjonskurs(s: Spilltilstand, id: ObligasjonId, post: Pick<Obligasjonspost, 'anker'>): number {
  return Math.max(LAVESTE_KURS, 1 - (OBLIGASJONER[id].varighet * (markedsrente(s, id) - post.anker)) / 100)
}

/** Det posten er verdt nå. */
export function obligasjonsverdiFor(s: Spilltilstand, id: ObligasjonId): number {
  const p = s.obligasjoner?.[id]
  return p ? p.palydende * obligasjonskurs(s, id, p) : 0
}

export function obligasjonsverdi(s: Spilltilstand): number {
  if (!s.obligasjoner) return 0
  let sum = 0
  for (const id of OBLIGASJONSLISTE) sum += obligasjonsverdiFor(s, id)
  return sum
}

export function obligasjonKostpris(s: Spilltilstand): number {
  let sum = 0
  for (const id of OBLIGASJONSLISTE) sum += s.obligasjoner?.[id]?.kostpris ?? 0
  return sum
}

/** Kupongrenten per time for en rente (i prosent): sparerenten ved den renten, pluss obligasjonens påslag. */
export function kupongsats(id: ObligasjonId, rente: number): number {
  return SPARERENTE_PER_TIME * (rente / NORMAL_STYRINGSRENTE) * (1 + OBLIGASJONER[id].paaslag)
}

/** Kupongene per sekund fra alle obligasjonene. */
export function kupongPerSek(s: Spilltilstand): number {
  if (!s.obligasjoner) return 0
  let sum = 0
  for (const id of OBLIGASJONSLISTE) {
    const p = s.obligasjoner[id]
    if (p) sum += (p.palydende * kupongsats(id, p.rente)) / 3600
  }
  return sum
}
