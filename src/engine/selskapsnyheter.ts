/**
 * Selskapsnyheter: resultater, kontrakter, skandaler og oppkjøpsrykter for
 * de børsnoterte selskapene. En nyhet kommer i morgenavisa, og kursen prises
 * gradvis inn de første minuttene børsen er åpen — den som leser avisa tidlig,
 * rekker å handle før hele bevegelsen har skjedd.
 *
 * Nyheten flytter selskapets «riktige verdi», så den varer.
 */

import { erHelg } from './kalender'
import { AKSJER, MARKED_TIKK_SEK, PAPIRER } from './marked'
import type { Terning } from './rng'
import type { Overskrift, Spilltilstand } from './types'

/** Sjansen for at en børsdag har en selskapsnyhet. */
export const NYHET_SJANSE = 0.5
/** Nyheten prises inn over så mange sekunder med åpen børs. */
export const NYHET_SEK = 180
const NYHET_TIKK = NYHET_SEK / MARKED_TIKK_SEK

interface Mal {
  vekt: number
  min: number
  maks: number
  opp: boolean
  tittel: (navn: string) => string
  tekst: string
}

const MALER: Mal[] = [
  { vekt: 3, min: 0.05, maks: 0.12, opp: true, tittel: (n) => `${n} knuser forventningene`, tekst: 'Resultatet ble langt bedre enn analytikerne trodde. Kursen ventes å stige når børsen åpner.' },
  { vekt: 3, min: 0.05, maks: 0.12, opp: false, tittel: (n) => `${n} skuffer`, tekst: 'Resultatet kom inn under forventningene, og ledelsen nedjusterer utsiktene.' },
  { vekt: 2, min: 0.04, maks: 0.08, opp: true, tittel: (n) => `${n} sikrer milliardkontrakt`, tekst: 'Avtalen gir ordrebøkene et solid løft i årene som kommer.' },
  { vekt: 1, min: 0.1, maks: 0.2, opp: false, tittel: (n) => `Skandale i ${n}`, tekst: 'Avsløringer om kritikkverdige forhold ryster ledelsen. Investorene er nervøse.' },
  { vekt: 1, min: 0.1, maks: 0.18, opp: true, tittel: (n) => `Oppkjøpsrykter rundt ${n}`, tekst: 'Flere kilder melder om en utenlandsk kjøper som vurderer et bud.' },
]

function velgMal(t: Terning): Mal {
  const total = MALER.reduce((a, m) => a + m.vekt, 0)
  let r = t.neste() * total
  for (const m of MALER) {
    r -= m.vekt
    if (r < 0) return m
  }
  return MALER[MALER.length - 1]
}

/**
 * Kalles ved dagsskiftet. På børsdager kan ett selskap få en nyhet: kursen
 * får en bevegelse som prises inn fremover, og avisa får en sak. Muterer.
 */
export function selskapsnyheter(s: Spilltilstand, t: Terning): Overskrift[] {
  if (erHelg(s.sek) || !t.sjanse(NYHET_SJANSE)) return []
  const id = t.velg(AKSJER)
  const mal = velgMal(t)
  const storrelse = t.mellom(mal.min, mal.maks)
  const bevegelse = Math.log(mal.opp ? 1 + storrelse : 1 - storrelse)
  const k = s.marked.kurser[id]
  k.nyhet = { igjen: (k.nyhet?.igjen ?? 0) + bevegelse, tikk: NYHET_TIKK }
  return [{ type: 'marked', tittel: mal.tittel(PAPIRER[id].navn), tekst: mal.tekst }]
}
