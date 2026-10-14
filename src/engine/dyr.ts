/**
 * Dyrene på gården og produksjonstilskuddet (Pakke 94). Avlingen kommer én gang i
 * uka og svinger med været og prisene; dyrene gir jevnt. Kua og hønene betaler hver
 * dag (melk og egg), sauene klippes to ganger i året (1. mai og 1. september) og
 * grisene går til slakt hver åttende uke. Pakke 106: hvert slag gir sin andel av prisen i
 * uka — kua 4 %, grisen 5,5 %, sauen 6 % og høna 7 % — så de billige tjener seg inn fortere,
 * mens kua gir mest per plass i fjøset. Før ga alle 4 %, og kua vant hver plass.
 *
 * Utbyttet opptjenes sekund for sekund fra du kjøpte dyret (Pakke 57s regel: betal for
 * tiden du eide), og ligger i en kasse til betalingsdagen. Ellers ga en sau kjøpt dagen
 * før klippingen et halvt års ull.
 *
 * Ved hvert månedsskifte kommer produksjonstilskuddet: 0,5 % av jordverdien per jord og
 * 1 % av prisen per dyr. Alt regnes som avling i regnskapet og skatten.
 *
 * Ingen terning: dyrene og tilskuddet følger kalenderen alene.
 */

import { DAG_SEK, dagnummer, dato } from './kalender'
import { bokforGard, gardstrinn, JORD, JORDLISTE, jorder, landverdi, ukeFor } from './jord'
import { kortKroner } from './tall'
import type { Gardsdyr, JordId, Jordstykke, Overskrift, Spilltilstand } from './types'

/** `andel`: prisen som andel av jordverdien. `uke`: hva dyret gir i uka, som andel av prisen (Pakke 106). */
export const DYR: Record<Gardsdyr, { navn: string; flertall: string; vare: string; andel: number; uke: number; betaling: 'daglig' | 'ull' | 'slakt' }> = {
  ku: { navn: 'Ku', flertall: 'kyr', vare: 'melk', andel: 0.15, uke: 0.04, betaling: 'daglig' },
  hone: { navn: 'Høne', flertall: 'høner', vare: 'egg', andel: 0.03, uke: 0.07, betaling: 'daglig' },
  sau: { navn: 'Sau', flertall: 'sauer', vare: 'ull', andel: 0.08, uke: 0.06, betaling: 'ull' },
  gris: { navn: 'Gris', flertall: 'griser', vare: 'kjøtt', andel: 0.1, uke: 0.055, betaling: 'slakt' },
}
export const DYRLISTE = Object.keys(DYR) as Gardsdyr[]
/** Plassene i fjøset etter gårdens trinn: småbruk, gård, storgård, gods. */
export const FJOSPLASSER = [4, 8, 12, 20] as const
/** Grisene slaktes hver så mange spilldager (åtte uker). */
export const SLAKT_DAGER = 56
/** Sauene klippes den første dagen i disse månedene (0 = januar): mai og september. */
export const KLIPPEMAANEDER = [4, 8] as const
/** Tilskuddet ved hvert månedsskifte: per jord, som andel av jordverdien, og per dyr, som andel av prisen. */
export const TILSKUDD_JORD = 0.005
export const TILSKUDD_DYR = 0.01

export function dyrpris(s: Spilltilstand, id: JordId, d: Gardsdyr): number {
  return DYR[d].andel * landverdi(s, id)
}

export function antallDyr(j: Jordstykke | undefined): number {
  let n = 0
  for (const d of DYRLISTE) n += j?.dyr?.[d] ?? 0
  return n
}

export function fjosplasser(j: Jordstykke | undefined): number {
  return j?.bygg?.fjos ? FJOSPLASSER[gardstrinn(j)] : 0
}

/** Det dyrene på gården gir per sekund nå, per betaling. */
function perSek(s: Spilltilstand, id: JordId): Record<'daglig' | 'ull' | 'slakt', number> {
  const ut = { daglig: 0, ull: 0, slakt: 0 }
  const j = s.jord?.[id]
  if (!j?.dyr) return ut
  for (const d of DYRLISTE) {
    const n = j.dyr[d] ?? 0
    if (n > 0) ut[DYR[d].betaling] += (n * dyrpris(s, id, d) * DYR[d].uke) / (7 * DAG_SEK)
  }
  return ut
}

/** Det dyrene gir i uka nå, i snitt — til siden. */
export function dyrPerUke(s: Spilltilstand, id: JordId): number {
  const p = perSek(s, id)
  return (p.daglig + p.ull + p.slakt) * 7 * DAG_SEK
}

/**
 * Legger utbyttet fra `fra` til `til` i kassene, med antallet dyr nå. Før antallet endres,
 * kalles den med tiden så langt i dag, og starten flyttes til nå. Muterer.
 */
function opptjen(s: Spilltilstand, id: JordId, fra: number, til: number): void {
  const j = s.jord?.[id]
  if (!j || til <= fra) return
  const p = perSek(s, id)
  const k = (j.dyrKasse ??= {})
  for (const b of ['daglig', 'ull', 'slakt'] as const) if (p[b] > 0) k[b] = (k[b] ?? 0) + p[b] * (til - fra)
}

/** Før et dyr kjøpes: utbyttet så langt i dag med dyrene som var. Muterer. */
export function bokforDyr(s: Spilltilstand, id: JordId): void {
  const j = s.jord?.[id]
  if (!j) return
  const dagstart = dagnummer(s.sek) * DAG_SEK
  opptjen(s, id, Math.max(dagstart, j.dyrSek ?? 0), s.sek)
  j.dyrSek = s.sek
  j.dyrBokfort = s.sek
}

/** Fra når dyrene har tjent noe som ikke ligger i kassene ennå. */
function ufortFra(s: Spilltilstand, j: Jordstykke): number {
  // Eldre lagringer: kassene er ført til starten av dagen, eller til kjøpet i dag.
  return j.dyrBokfort ?? Math.max(dagnummer(s.sek) * DAG_SEK, j.dyrSek ?? 0)
}

/** Det dyrene har opptjent og ikke fått betalt, per betaling: kassen og dagen så langt. Muterer ikke. */
export function dyrKasseNaa(s: Spilltilstand, id: JordId): Record<'daglig' | 'ull' | 'slakt', number> {
  const j = s.jord?.[id]
  if (!j?.dyr) return { daglig: 0, ull: 0, slakt: 0 }
  const k = j.dyrKasse ?? {}
  const p = perSek(s, id)
  const tid = Math.max(0, s.sek - ufortFra(s, j))
  return { daglig: (k.daglig ?? 0) + p.daglig * tid, ull: (k.ull ?? 0) + p.ull * tid, slakt: (k.slakt ?? 0) + p.slakt * tid }
}

/** Alt dyrene har opptjent og ikke fått betalt — til salget av gården. Muterer ikke. */
export function dyrOpptjentNaa(s: Spilltilstand, id: JordId): number {
  const j = s.jord?.[id]
  if (!j?.dyr) return 0
  const k = j.dyrKasse ?? {}
  const p = perSek(s, id)
  const tid = Math.max(0, s.sek - ufortFra(s, j))
  return (k.daglig ?? 0) + (k.ull ?? 0) + (k.slakt ?? 0) + (p.daglig + p.ull + p.slakt) * tid
}

/**
 * Det dyrene på alle gårdene har opptjent og ikke fått betalt (Pakke 106): ulla som venter på
 * klippingen, kjøttet på slakten og dagens melk og egg. Teller i formuen fra dagen det vokser,
 * som salget av gården alltid har betalt det — før hoppet formuen på klippe- og slaktedagen.
 */
export function dyrOpptjent(s: Spilltilstand): number {
  let sum = 0
  if (!s.jord) return sum
  for (const id of JORDLISTE) if (s.jord[id]?.dyr) sum += dyrOpptjentNaa(s, id)
  return sum
}

/** Hva ett dyr til gir i en snittuke: sin andel av prisen, og tilskuddet fordelt over året. */
export function dyrGir(s: Spilltilstand, id: JordId, d: Gardsdyr): number {
  return dyrpris(s, id, d) * (DYR[d].uke + (TILSKUDD_DYR * 12 * 7) / 365)
}

/** Neste klippedag (1. mai eller 1. september) etter i dag, som spilldag. */
export function nesteKlipping(dag: number): number {
  let d = dag + 1
  while (!(dato(d).dag === 1 && (KLIPPEMAANEDER as readonly number[]).includes(dato(d).maaned))) d++
  return d
}

/** Neste slaktedag etter i dag, som spilldag. */
export function nesteSlakt(dag: number): number {
  return (Math.floor(dag / SLAKT_DAGER) + 1) * SLAKT_DAGER
}

/** Tilskuddet for en gård ved et månedsskifte. */
export function tilskudd(s: Spilltilstand, id: JordId): number {
  const j = s.jord?.[id]
  if (!j || JORD[id].type !== 'gard') return 0
  let sum = jorder(j) * TILSKUDD_JORD * landverdi(s, id)
  for (const d of DYRLISTE) sum += (j.dyr?.[d] ?? 0) * TILSKUDD_DYR * dyrpris(s, id, d)
  return sum
}

function betal(s: Spilltilstand, j: Jordstykke, uke: number, felt: 'dyr' | 'tilskudd', belop: number): void {
  if (belop <= 0) return
  s.kontanter += belop
  s.totaltHost += belop
  s.totaltLeie += belop
  bokforGard(j, uke, felt, belop)
}

/**
 * Dagsskiftet på gårdene: gårsdagens melk og egg betales; på klippedagen ulla og på
 * slaktedagen kjøttet; ved månedsskiftet tilskuddet. Gir en sak i avisa på klippe- og
 * slaktedagene. Muterer.
 */
export function dyrVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.jord) return []
  const dag = dagnummer(s.sek)
  const forrige = dag - 1
  const uke = ukeFor(forrige)
  const d = dato(dag)
  const klipp = d.dag === 1 && (KLIPPEMAANEDER as readonly number[]).includes(d.maaned)
  const slakt = dag > 0 && dag % SLAKT_DAGER === 0
  const maanedsskifte = d.dag === 1
  let ull = 0
  let kjott = 0
  for (const id of JORDLISTE) {
    const j = s.jord[id]
    if (!j || JORD[id].type !== 'gard') continue
    if (j.dyr) {
      opptjen(s, id, Math.max(forrige * DAG_SEK, j.dyrSek ?? 0), dag * DAG_SEK)
      j.dyrBokfort = dag * DAG_SEK
      const k = (j.dyrKasse ??= {})
      let dyr = k.daglig ?? 0
      k.daglig = 0
      if (klipp && k.ull) {
        ull += k.ull
        dyr += k.ull
        k.ull = 0
      }
      if (slakt && k.slakt) {
        kjott += k.slakt
        dyr += k.slakt
        k.slakt = 0
      }
      betal(s, j, uke, 'dyr', dyr)
    }
    if (maanedsskifte) betal(s, j, uke, 'tilskudd', tilskudd(s, id))
  }
  const saker: Overskrift[] = []
  if (ull > 0) saker.push({ type: 'deg', tittel: 'Klipping på gårdene', tekst: `Sauene er klippet, og ulla ga ${kortKroner(ull)}.` })
  if (kjott > 0) saker.push({ type: 'deg', tittel: 'Slaktedag på gårdene', tekst: `Grisene gikk til slakt og ga ${kortKroner(kjott)}.` })
  return saker
}
