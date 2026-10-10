/**
 * Sorteringen av bedriftene etter inntekt (Pakke 65). «Fast inntekt» er det
 * bedriften tjener uten dagens vær og kalender og uten byenes kurs for
 * filialene: den endrer seg bare når du oppgraderer, ansetter eller åpner en
 * filial — så kortene aldri bytter plass under fingeren din. Statusen gjelder
 * alle bedrifter likt og er utelatt; den endrer ikke rekkefølgen.
 */

import { bedriftInntektPerSek } from '../engine/formler'
import { fastFilialfaktor } from '../engine/filialer'
import type { Bedrift } from '../engine/types'

export function fastInntekt(b: Bedrift): number {
  return bedriftInntektPerSek(b, fastFilialfaktor(b))
}
