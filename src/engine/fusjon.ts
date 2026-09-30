/**
 * Fusjoner: rivalene eier bedrifter i de samme bransjene som deg, og du kan by
 * på dem. En bedrift du kjøper, slås sammen med din egen av samme type og
 * ganger inntekten med FUSJONSFAKTOR — høyst én gang per rival og bransje.
 *
 * Hva rivalen eier, regnes ut fra formuen, så listen vokser av seg selv.
 * Prisen rivalen vil ha, varierer fra dag til dag, men står fast hele dagen,
 * og du får gi ett bud per bransje per dag.
 */

import { BEDRIFTSTYPER, STIGEN } from './innhold'
import { dagnummer } from './kalender'
import { hashTekst, tilfeldig } from './rng'
import { SELSKAPSANDEL } from './rivaler'
import type { Bedrift, BedriftstypeId, Bedriftstype, Rival, Spilltilstand } from './types'

/** Hver fusjon ganger bedriftens inntekt med dette. */
export const FUSJONSFAKTOR = 1.5
/** Rivalen eier en bransje når formuen er minst så mange ganger startprisen. */
export const EIER_VED = 5
/** Hver av rivalens bedrifter er verdt høyst så stor andel av formuen. */
const BEDRIFTSANDEL = 0.1
const MAKS_NIVAA = 150
/**
 * Prisantydningen er aldri under så mange ganger det du selv har investert i
 * bransjen — ellers ville en fusjon vært det billigste kjøpet i spillet.
 */
export const PRIS_MOT_DIN = 1.5
/** Budene du kan gi, som andel av prisantydningen. */
export const BUD = [
  { id: 'lavt', navn: 'Lavt', faktor: 0.9 },
  { id: 'rettferdig', navn: 'Rettferdig', faktor: 1.1 },
  { id: 'sjenerost', navn: 'Sjenerøst', faktor: 1.3 },
] as const
export type BudId = (typeof BUD)[number]['id']
/** Rivalens pris er prisantydningen ganget med et tall mellom disse — nytt hver dag. */
const PRIS_MIN = 0.85
const PRIS_MAKS = 1.4
/** Et bud som når så nær prisen, gir et motbud i stedet for et nei. */
export const MOTBUD_VED = 0.85

/** Bransjenavnene i ubestemt og bestemt form, til tekstene. */
export const FORMER: Record<BedriftstypeId, { en: string; den: string }> = {
  saftbod: { en: 'en saftbod', den: 'saftboden' },
  polsebod: { en: 'en pølsebod', den: 'pølseboden' },
  kiosk: { en: 'en kiosk', den: 'kiosken' },
  kafe: { en: 'en kafé', den: 'kafeen' },
  restaurant: { en: 'en restaurant', den: 'restauranten' },
  hotell: { en: 'et hotell', den: 'hotellet' },
  bank: { en: 'en bank', den: 'banken' },
  oljeselskap: { en: 'et oljeselskap', den: 'oljeselskapet' },
  rederi: { en: 'et rederi', den: 'rederiet' },
  fiskeoppdrett: { en: 'et fiskeoppdrett', den: 'fiskeoppdrettet' },
  flyselskap: { en: 'et flyselskap', den: 'flyselskapet' },
  skisenter: { en: 'et skisenter', den: 'skisenteret' },
}

export interface Rivalbedrift {
  type: BedriftstypeId
  nivaa: number
  /** Hva bedriften ville kostet å bygge opp: startpris pluss alle nivåene. */
  verdi: number
}

/** Hva det koster å bygge en bedrift opp til et nivå. */
export function verdiVedNivaa(t: Bedriftstype, nivaa: number): number {
  return t.pris + (t.oppgraderingspris * (t.vekst ** (nivaa - 1) - 1)) / (t.vekst - 1)
}

/** Bedriftene en rival eier nå: hver bransje formuen rekker til, og som ikke er solgt til deg. */
export function rivalbedrifter(r: Rival): Rivalbedrift[] {
  if (r.overtatt) return []
  const liste: Rivalbedrift[] = []
  for (const type of STIGEN) {
    const t = BEDRIFTSTYPER[type]
    if (r.formue < t.pris * EIER_VED || (r.solgt ?? []).includes(type)) continue
    const budsjett = r.formue * BEDRIFTSANDEL
    const ekstra = Math.max(0, budsjett - t.pris)
    const nivaa = Math.min(MAKS_NIVAA, 1 + Math.floor(Math.log((ekstra * (t.vekst - 1)) / t.oppgraderingspris + 1) / Math.log(t.vekst)))
    liste.push({ type, nivaa, verdi: verdiVedNivaa(t, nivaa) })
  }
  return liste
}

export function fusjonsfaktor(b: Bedrift): number {
  return FUSJONSFAKTOR ** (b.fusjoner ?? 0)
}

/** Prisantydningen: rivalbedriftens verdi, men aldri under det din egen er verdt ganger PRIS_MOT_DIN. */
export function prisantydning(s: Spilltilstand, rb: Rivalbedrift): number {
  const din = s.bedrifter.find((b) => b.type === rb.type)
  return Math.round(Math.max(rb.verdi, (din?.investert ?? 0) * PRIS_MOT_DIN))
}

/** Prisen rivalen egentlig vil ha i dag. Den er skjult for spilleren. */
export function rivalensPris(s: Spilltilstand, r: Rival, rb: Rivalbedrift): number {
  const u = tilfeldig(hashTekst(`${r.id}:${rb.type}:${dagnummer(s.sek)}`))
  return Math.round(prisantydning(s, rb) * (PRIS_MIN + u * (PRIS_MAKS - PRIS_MIN)))
}

/** Dagens forhandling om en bransje, eller null når ingen bud er gitt i dag. */
export function dagensForhandling(s: Spilltilstand, r: Rival, type: BedriftstypeId) {
  const f = r.bud?.[type]
  return f && f.dag === dagnummer(s.sek) ? f : null
}

/**
 * Gjennomfører en fusjon: betaler, slår sammen og tar bedriften fra rivalen.
 * Rivalen bytter bedriften mot pengene, som ved et landemerke: formuen mister
 * bedriftens verdi og får betalingen. Taket står fast — rivalen er like
 * sulten, bare med kontanter i stedet for en bedrift.
 * Muterer — brukes på kopier. Ingen sjekker her.
 */
export function utforFusjon(n: Spilltilstand, rivalId: string, type: BedriftstypeId, pris: number): void {
  const r = n.rivaler.find((x) => x.id === rivalId)!
  const rb = rivalbedrifter(r).find((x) => x.type === type)!
  const din = n.bedrifter.find((b) => b.type === type)!
  n.kontanter -= pris
  din.investert += pris
  din.fusjoner = (din.fusjoner ?? 0) + 1
  const andel = Math.min(0.5, rb.verdi / r.formue)
  r.formue = r.formue * (1 - andel) + pris
  r.solgt = [...(r.solgt ?? []), type]
  if (r.bud) delete r.bud[type]
}

/**
 * Et fiendtlig oppkjøp tar med seg alle bedriftene rivalen eier: de som er i
 * bransjer du selv har, slås sammen med dine. Som ved en vanlig fusjon
 * forlater bedriften rivalen, så selskapet krymper — og verdien flyttes fra
 * andelen din over i din egen bedrift, så nettoformuen står stille. Selger du
 * andelen igjen, får du bare betalt for det som er igjen. Muterer — kalles
 * når du eier hele selskapet, før rivalen merkes som overtatt.
 */
export function fusjonerVedOppkjop(n: Spilltilstand, r: Rival): BedriftstypeId[] {
  const fusjonert: BedriftstypeId[] = []
  for (const rb of rivalbedrifter(r)) {
    const din = n.bedrifter.find((b) => b.type === rb.type)
    if (!din) continue
    din.fusjoner = (din.fusjoner ?? 0) + 1
    const verdiFør = r.formue * SELSKAPSANDEL
    const andel = Math.min(0.5, rb.verdi / r.formue)
    r.formue *= 1 - andel
    r.tak *= 1 - andel
    const flyttet = (verdiFør - r.formue * SELSKAPSANDEL) * r.andel
    din.investert += flyttet
    r.kostpris = Math.max(0, r.kostpris - flyttet)
    r.solgt = [...(r.solgt ?? []), rb.type]
    fusjonert.push(rb.type)
  }
  r.bud = {}
  return fusjonert
}

/** Alle fusjonene som er gjort, som «rivalId:bransje» — til avisens dagsbilde. */
export function fusjonsnokler(s: Spilltilstand): string[] {
  return (s.rivaler ?? []).flatMap((r) => (r.solgt ?? []).map((type) => `${r.id}:${type}`))
}
