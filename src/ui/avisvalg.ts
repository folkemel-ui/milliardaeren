/**
 * Hva som skjer når en ny avis kommer: den åpner seg selv, et varsel med
 * «Les»-knapp (standard), eller ingenting — den røde prikken på «Avisen» er
 * der uansett. Lagres i nettleseren, ikke i spillet.
 */

export type Avisvalg = 'apne' | 'varsel' | 'av'

const NOKKEL = 'milliardaer.avisvalg'

export function lesAvisvalg(): Avisvalg {
  try {
    const v = localStorage.getItem(NOKKEL)
    return v === 'apne' || v === 'av' ? v : 'varsel'
  } catch {
    return 'varsel'
  }
}

export function settAvisvalg(v: Avisvalg): void {
  try {
    localStorage.setItem(NOKKEL, v)
  } catch {
    /* bare en bekvemmelighet */
  }
}
