/**
 * Hvor fort et kjøp i en bedrift tjener seg inn (Pakke 99): det kjøpet legger til inntekten i dag
 * — med kalenderen, nyhetene, filialene og statusen — mot prisen, som ansettelsene viser siden
 * Pakke 80. Før sto det bare på ansettelsene, så forbedringer som tjente seg inn seks ganger
 * saktere enn neste nivå, så like gode ut som alt annet.
 */

import { bedriftInntektIDag } from '../engine/formler'
import { UKE_SEK } from '../engine/jord'
import type { Bedrift, Spilltilstand } from '../engine/types'
import { kortKroner, varighet } from './format'

/** Det bedriften tjener mer per sekund i dag med endringen. */
export function merinntekt(s: Spilltilstand, b: Bedrift, endret: Bedrift): number {
  return bedriftInntektIDag(s, endret) - bedriftInntektIDag(s, b)
}

export const oppgraderingGir = (s: Spilltilstand, b: Bedrift, antall: number) => merinntekt(s, b, { ...b, nivaa: b.nivaa + antall })
export const forbedringGir = (s: Spilltilstand, b: Bedrift) => merinntekt(s, b, { ...b, forbedringer: b.forbedringer + 1 })
export const fusjonGir = (s: Spilltilstand, b: Bedrift) => merinntekt(s, b, { ...b, fusjoner: (b.fusjoner ?? 0) + 1 })

/** «Tilbake på 2 t 10 min», som på ansettelsene — eller at kjøpet ikke tjener seg inn i dag. */
export function tilbakeTekst(pris: number, gir: number): string {
  return gir > 0 ? `Tilbake på ${varighet(pris / gir)}` : 'Tjener seg ikke inn i dag'
}

/**
 * Et kjøp på gården (Pakke 105): «≈ kr 2,1 mill i uka · tilbake på 14 t». Gården betaler
 * per uke og svinger med vær og priser, så det er snittuka, ikke dagen i dag.
 */
export function gardTekst(pris: number, perUke: number): string {
  if (perUke <= 0) return 'Gir ingenting mer på denne gården'
  return `≈ ${kortKroner(perUke)} i uka · tilbake på ${varighet(pris / (perUke / UKE_SEK))}`
}
