/**
 * Sorteringen av bedriftene etter inntekt (Pakke 65). «Fast inntekt» er det
 * bedriften tjener uten dagens vær og kalender og uten byenes kurs for
 * filialene: den endrer seg bare når du oppgraderer, ansetter eller åpner en
 * filial — så kortene aldri bytter plass under fingeren din. Statusen gjelder
 * alle bedrifter likt og er utelatt; den endrer ikke rekkefølgen.
 */

import { bedriftInntektPerSek } from '../engine/formler'
import { fastFilialfaktor } from '../engine/filialer'
import { EIENDOMSTYPER } from '../engine/eiendom'
import type { Bedrift, EiendomId } from '../engine/types'
import type { Eiendomsrekkefolge } from './deler'

export function fastInntekt(b: Bedrift): number {
  return bedriftInntektPerSek(b, fastFilialfaktor(b))
}

/**
 * Eiendommene i valgt rekkefølge (Pakke 75): etter pris (stigen, som før),
 * avkastning (katalogens, høyest først) eller leie per enhet (katalogpris
 * ganger avkastning — uten indeks, vær, sesong og ledighet, så ingenting
 * flytter seg under fingeren). Like verdier beholder stigens rekkefølge.
 */
export function sorterEiendom(ider: readonly EiendomId[], rekkefolge: Eiendomsrekkefolge): EiendomId[] {
  if (rekkefolge === 'pris') return [...ider]
  const nokkel = (id: EiendomId) => (rekkefolge === 'avkastning' ? EIENDOMSTYPER[id].avkastning : EIENDOMSTYPER[id].pris * EIENDOMSTYPER[id].avkastning)
  return [...ider].sort((a, b) => nokkel(b) - nokkel(a))
}
