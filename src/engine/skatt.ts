/**
 * Skatt: hver måned kommer en skatteregning på månedens overskudd, med
 * progressive satser. Du har en uke på å betale; etter det legges det på et
 * gebyr, og skattemyndighetene krever inn selv.
 *
 * Offshore halverer skatten — men hver måned kan det bli bokettersyn, og da
 * må alt som er unndratt betales dobbelt tilbake.
 */

import { leggTilHendelse, meldBankenDekket } from './bank'
import { DAG_SEK } from './kalender'
import { flyt, trekkFraSparing } from './portefolje'
import type { Terning } from './rng'
import type { Oppgjor, Overskrift, Spilltilstand } from './types'
import { kortKroner } from './tall'

/** Trinnskatt på månedens overskudd: satsen gjelder beløpet over grensen. */
export const SKATTETRINN = [
  { fra: 0, sats: 0 },
  { fra: 50_000, sats: 0.15 },
  { fra: 1_000_000, sats: 0.22 },
  { fra: 20_000_000, sats: 0.28 },
]
export const FORFALL_DAGER = 7
export const FORSINKELSESGEBYR = 0.1
export const REVISJONSSJANSE = 0.15
/** Tatt for unndragelse: det unndratte betales tilbake, pluss like mye i tilleggsskatt. */
export const TILLEGGSSKATT = 1

/**
 * Skattegrunnlaget i et oppgjør: inntektene, klubbens resultat og gevinstene
 * ved salg, minus tap og lånerenter, aldri under null. Tap — også klubbens
 * underskudd — trekkes bare fra i samme måned.
 */
export function skattegrunnlag(o: Oppgjor): number {
  return Math.max(0, o.bedrifter + o.leie + o.utbytte + o.sparerente + (o.gevinster ?? 0) + (o.klubb ?? 0) - o.renter)
}

export function beregnSkatt(grunnlag: number): number {
  let skatt = 0
  for (let i = 0; i < SKATTETRINN.length; i++) {
    const fra = SKATTETRINN[i].fra
    const til = SKATTETRINN[i + 1]?.fra ?? Infinity
    if (grunnlag > fra) skatt += (Math.min(grunnlag, til) - fra) * SKATTETRINN[i].sats
  }
  return skatt
}

function nyRegning(s: Spilltilstand, navn: string, belop: number, type: 'skatt' | 'etterskatt'): void {
  s.skatt.regninger.push({ id: s.skatt.nesteId++, navn, belop, forfallSek: s.sek + FORFALL_DAGER * DAG_SEK, type })
}

/** Betaler en regning: kontanter først, så sparekontoen, resten blir gjeld. Muterer. */
export function trekkRegning(s: Spilltilstand, belop: number): void {
  const fraKontanter = Math.min(belop, Math.max(0, s.kontanter))
  s.kontanter -= fraKontanter
  const fraSparing = Math.min(belop - fraKontanter, s.sparing)
  trekkFraSparing(s, fraSparing)
  flyt(s, 'sparing', -fraSparing)
  const rest = belop - fraKontanter - fraSparing
  s.gjeld += rest
  if (rest > 0) meldBankenDekket(s, `Skatteregningen var større enn kontantene og sparekontoen. Banken la ${kortKroner(rest)} på gjelden — med rente.`)
  s.skatt.totaltBetalt += belop
}

/**
 * Kalles ved hvert dagsskifte med dagens oppgjør. Lager skatteregningen for
 * måneden som er slutt, sjekker for bokettersyn, og krever inn regninger som
 * har forfalt. Returnerer saker til avisa. Muterer — brukes på kopier.
 */
export function skattVedDagsskifte(s: Spilltilstand, oppgjor: Oppgjor[], t: Terning, hvem: string): Overskrift[] {
  const saker: Overskrift[] = []
  const maaned = oppgjor.find((o) => o.periode === 'maaned')
  if (maaned) {
    // Bokettersyn gjelder det som alt er unndratt, før månedens nye regning.
    if (s.skatt.unndratt > 0 && t.sjanse(REVISJONSSJANSE)) {
      const krav = s.skatt.unndratt * (1 + TILLEGGSSKATT)
      nyRegning(s, 'Etterskatt og tilleggsskatt', krav, 'etterskatt')
      s.skatt.unndratt = 0
      leggTilHendelse(s, { tittel: 'Bokettersyn', tekst: `Skattemyndighetene fant pengene i skatteparadiset. Kravet er ${kortKroner(krav)}.`, alvor: 'kritisk' })
      saker.push({ type: 'deg', tittel: `Skattejakt: ${hvem} tatt for unndragelse`, tekst: 'Et selskap i et skatteparadis ble avslørt ved bokettersyn. Tilleggsskatten er på 100 %.' })
    }
    const full = beregnSkatt(skattegrunnlag(maaned))
    if (full >= 1) {
      const skatt = s.skatt.offshore ? full / 2 : full
      if (s.skatt.offshore) s.skatt.unndratt += full - skatt
      nyRegning(s, `Skatt for ${maaned.navn}`, skatt, 'skatt')
      saker.push({ type: 'deg', tittel: 'Skatteoppgjøret er klart', tekst: `Skatten for ${maaned.navn} er ${kortKroner(skatt)}, med forfall om ${FORFALL_DAGER} dager.` })
    }
  }
  // Forfalte regninger krever skattemyndighetene inn selv — med gebyr.
  for (const r of [...s.skatt.regninger]) {
    if (s.sek < r.forfallSek) continue
    const belop = r.belop * (1 + FORSINKELSESGEBYR)
    trekkRegning(s, belop)
    s.skatt.regninger = s.skatt.regninger.filter((x) => x.id !== r.id)
    leggTilHendelse(s, { tittel: 'Skatt innkrevd', tekst: `${r.navn} var ikke betalt i tide og ble krevd inn med ${FORSINKELSESGEBYR * 100} % gebyr.`, alvor: 'advarsel' })
    saker.push({ type: 'deg', tittel: `Skattefogden banker på hos ${hvem.toLowerCase()}`, tekst: 'Regningen var ikke betalt i tide. Nå kommer gebyret i tillegg.' })
  }
  return saker
}
