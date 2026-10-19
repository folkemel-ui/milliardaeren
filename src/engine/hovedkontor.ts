/**
 * Hovedkontoret (Pakke 117): et kontortårn i Bjørvika som bygges etasje for
 * etasje. Hver etasje gir +1 % på alle bedriftene og 10 status, og koster tre
 * ganger den forrige: 2,5 mrd for den første, ~49 bill for den tiende (~74 bill
 * i alt). Den første tjener seg inn på ~10 timer ved 100 mrd (den smarte boten
 * tjener da ~6,4 mill/s på bedriftene), den tredje på ~8 timer ved 1 000 mrd
 * (~85 mill/s). Hovedkontoret står i formuen til det det kostet, som en bedrift
 * står til det som er investert i den.
 *
 * Et valgfritt felt i lagringen (`s.hovedkontor`, antall etasjer), så gamle
 * lagringer har null etasjer uten noen ny lagringsversjon.
 */

import type { Spilltilstand } from './types'

export const HK_ETASJER = 10
export const HK_FORSTE_PRIS = 2_500_000_000
export const HK_PRISVEKST = 3
/** Hva hver etasje gir på inntekten til alle bedriftene. */
export const HK_INNTEKT = 0.01
/** Status per etasje. */
export const HK_STATUS = 10
/** Hovedkontoret vises på Bedrifter fra denne formuen (høyeste du har hatt): ~40 % av første etasje. */
export const HK_SYNLIG_VED = 1_000_000_000

export function etasjer(s: Spilltilstand): number {
  return Math.max(0, Math.min(HK_ETASJER, s.hovedkontor ?? 0))
}

/** Prisen på etasje nr. `i + 1` (i = etasjene du har). */
export function etasjepris(i: number): number {
  return HK_FORSTE_PRIS * HK_PRISVEKST ** i
}

/** Prisen på neste etasje, eller null når tårnet er ferdig. */
export function nesteEtasjepris(s: Spilltilstand): number | null {
  const n = etasjer(s)
  return n >= HK_ETASJER ? null : etasjepris(n)
}

/** Alt bedriftene tjener ganges med dette: 1 + 1 % per etasje. */
export function hovedkontorfaktor(s: Spilltilstand): number {
  return 1 + HK_INNTEKT * etasjer(s)
}

/** Det etasjene kostet, som står i formuen. */
export function hovedkontorverdi(s: Spilltilstand): number {
  const n = etasjer(s)
  return n === 0 ? 0 : (HK_FORSTE_PRIS * (HK_PRISVEKST ** n - 1)) / (HK_PRISVEKST - 1)
}

export function hovedkontorstatus(s: Spilltilstand): number {
  return HK_STATUS * etasjer(s)
}
