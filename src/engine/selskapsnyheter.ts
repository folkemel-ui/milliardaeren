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
import { hashTekst, type Terning } from './rng'
import type { Overskrift, Spilltilstand } from './types'
import { bransjenyhet } from './bransjer'

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
  /** Flere tekster per mal (Pakke 82), valgt med en hash av dagen og selskapet — ikke med terningen. */
  tekster: string[]
}

export const MALER: Mal[] = [
  {
    vekt: 3, min: 0.05, maks: 0.12, opp: true, tittel: (n) => `${n} knuser forventningene`,
    tekster: [
      'Resultatet ble langt bedre enn analytikerne trodde. Kursen ventes å stige når børsen åpner.',
      'Kvartalet slo alle anslag. Meglerne skriver om kursmålene før frokost.',
      'Tallene fikk selv de mest skeptiske analytikerne til å nikke. Børsen åpner med kjøpere i kø.',
      'Overskuddet doblet seg mot fjoråret. «Vi er ikke overrasket», sier konsernsjefen, som var det.',
    ],
  },
  {
    vekt: 3, min: 0.05, maks: 0.12, opp: false, tittel: (n) => `${n} skuffer`,
    tekster: [
      'Resultatet kom inn under forventningene, og ledelsen nedjusterer utsiktene.',
      'Kvartalet ble svakere enn ventet, og ledelsen snakker om «krevende markedsforhold».',
      'Analytikerne hadde ventet mer. Ledelsen ba om tålmodighet; aksjonærene ba om ordet.',
      'Marginene krympet, og prognosen for året er tatt ned. Børsen åpner med selgere.',
    ],
  },
  {
    vekt: 2, min: 0.04, maks: 0.08, opp: true, tittel: (n) => `${n} sikrer milliardkontrakt`,
    tekster: [
      'Avtalen gir ordrebøkene et solid løft i årene som kommer.',
      'Kontrakten er den største i selskapets historie og sikrer arbeid i flere år framover.',
      'Etter måneder med forhandlinger er avtalen signert. Ordreboka har aldri vært tykkere.',
    ],
  },
  {
    vekt: 1, min: 0.1, maks: 0.2, opp: false, tittel: (n) => `Skandale i ${n}`,
    tekster: [
      'Avsløringer om kritikkverdige forhold ryster ledelsen. Investorene er nervøse.',
      'Et internt varsel har nådd pressen. Styret kaller inn til ekstraordinært møte.',
      'Tilsynet har innledet gransking. Selskapet «samarbeider fullt ut», som det heter.',
    ],
  },
  {
    vekt: 1, min: 0.1, maks: 0.18, opp: true, tittel: (n) => `Oppkjøpsrykter rundt ${n}`,
    tekster: [
      'Flere kilder melder om en utenlandsk kjøper som vurderer et bud.',
      'Et utenlandsk fond skal ha bygget seg opp i det stille. Aksjen er dagens samtaleemne i Oslo.',
      'Rådgivere er hentet inn, ifølge kilder nær selskapet. Ingen vil kommentere — som regel et godt tegn.',
    ],
  },
]

/** Teksten for en mal på en dag: fra en hash, så terningen ikke flytter seg (Pakke 82). */
export function malTekst(mal: Mal, sek: number, id: string): string {
  return mal.tekster[(hashTekst(`${Math.floor(sek)}:${id}`) >>> 0) % mal.tekster.length]
}

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
  // Eier du en bedrift i selskapets bransje, merker den nyheten også (Pakke 53).
  const bransje = bransjenyhet(s, id, mal.opp)
  const tekst = malTekst(mal, s.sek, id)
  return [{ type: 'marked', tittel: mal.tittel(PAPIRER[id].navn), tekst: bransje ? `${tekst} ${bransje}` : tekst }]
}
