/**
 * Formuesforvalteren (Pakke 124): velg en risikoprofil, og forvalteren holder aksjene, Børsfondet,
 * obligasjonene og råvarene dine i den blandingen — hver mandag morgen, for et gebyr på 0,2 % av
 * det den forvalter. For deg som ikke vil handle selv.
 *
 * Gebyret følger det det dekker: det tas av verdien hver uke (og ved start), ikke én gang — den
 * gamle lekkasjen med forvalteren som tok 5 % én gang av det du eide den dagen. Handlene går
 * gjennom de vanlige funksjonene, med kurtasje, kurstrykk og skatt på gevinsten, og høyst så mye
 * av hvert papir at kursen dobles (\`maksPerOrdre\`); resten blir stående som kontanter. Krypto,
 * Kryptofondet og alt annet du eier, rører den ikke. Boten bruker den aldri.
 */

import { AKSJER, handelskurs, KURTASJE, maksPerOrdre, PAPIRER, rundAntall } from './marked'
import { utforFondskjop, utforFondssalg, utforKjop, utforObligasjonskjop, utforObligasjonssalg, utforSalg } from './handel'
import { fondskurs } from './fond'
import { OBLIGASJONSLISTE, obligasjonsverdiFor } from './obligasjoner'
import { dagnummer, ukedag } from './kalender'
import { MAKS_HENDELSER } from './innhold'
import { kortKroner } from './tall'
import type { Forvalterprofil, PapirId, Risiko, Spilltilstand } from './types'

/** Gebyret hver uke, av det forvalteren har. */
export const FORVALTER_GEBYR = 0.002
/** Forvalteren lar en post være til den er mer enn 3 % fra målet, så den ikke handler for småpenger. */
const SLINGRING = 0.03

export const PROFILER: Record<Forvalterprofil, { navn: string; tekst: string; obligasjon: number; fond: number; aksjer: number; risiko: Risiko[]; gull: number; energi: number }> = {
  forsiktig: { navn: 'Forsiktig', tekst: 'Halvparten i obligasjoner, resten i Børsfondet, gull og trygge aksjer.', obligasjon: 0.5, fond: 0.25, aksjer: 0.1, risiko: ['lav'], gull: 0.15, energi: 0 },
  balansert: { navn: 'Balansert', tekst: 'En firedel i obligasjoner, Børsfondet, aksjer med lav og middels risiko, litt gull, olje og laks.', obligasjon: 0.25, fond: 0.35, aksjer: 0.25, risiko: ['lav', 'middels'], gull: 0.1, energi: 0.05 },
  offensiv: { navn: 'Offensiv', tekst: 'Ingen obligasjoner: Børsfondet, aksjer med middels og høy risiko, olje og laks.', obligasjon: 0, fond: 0.3, aksjer: 0.5, risiko: ['middels', 'høy'], gull: 0.05, energi: 0.15 },
}
export const PROFILLISTE = Object.keys(PROFILER) as Forvalterprofil[]

/** En post forvalteren holder: et papir, Børsfondet eller obligasjonene samlet. */
type Post = PapirId | 'fond' | 'obligasjon'

/** Blandingen for en profil: andelen av det forvalteren har, per post. Summerer til 1. */
export function blanding(profil: Forvalterprofil): Map<Post, number> {
  const p = PROFILER[profil]
  const m = new Map<Post, number>()
  if (p.obligasjon) m.set('obligasjon', p.obligasjon)
  if (p.fond) m.set('fond', p.fond)
  const aksjer = AKSJER.filter((id) => p.risiko.includes(PAPIRER[id].risiko))
  for (const id of aksjer) m.set(id, p.aksjer / aksjer.length)
  if (p.gull) m.set('GLD', p.gull)
  if (p.energi) {
    m.set('OLJ', p.energi / 2)
    m.set('LAK', p.energi / 2)
  }
  return m
}

/** Postene forvalteren kan holde: alle aksjer, råvarer, Børsfondet og obligasjonene. */
function forvaltes(id: PapirId): boolean {
  return PAPIRER[id].klasse !== 'krypto'
}

function verdiAv(s: Spilltilstand, post: Post): number {
  if (post === 'fond') return (s.fond.BORSFOND?.antall ?? 0) * fondskurs(s, 'BORSFOND')
  if (post === 'obligasjon') return OBLIGASJONSLISTE.reduce((sum, id) => sum + (s.obligasjoner?.[id] ? obligasjonsverdiFor(s, id) : 0), 0)
  const b = s.beholdning[post]
  return b ? b.antall * s.marked.kurser[post].kurs : 0
}

/** Det forvalteren har nå: aksjene, råvarene, Børsfondet og obligasjonene dine. */
export function forvaltetVerdi(s: Spilltilstand): number {
  let sum = verdiAv(s, 'fond') + verdiAv(s, 'obligasjon')
  for (const id of Object.keys(s.beholdning) as PapirId[]) if (forvaltes(id)) sum += verdiAv(s, id)
  return sum
}

/** Selger for omtrent \`belop\` av en post (alt med Infinity). Gir det som kom inn. Muterer. */
function selg(n: Spilltilstand, post: Post, belop: number): number {
  if (post === 'fond') return n.fond.BORSFOND ? utforFondssalg(n, 'BORSFOND', belop) : 0
  if (post === 'obligasjon') {
    const verdi = verdiAv(n, 'obligasjon')
    if (verdi <= 0) return 0
    const andel = Math.min(1, belop / verdi)
    let inn = 0
    for (const id of OBLIGASJONSLISTE) if (n.obligasjoner?.[id]) inn += utforObligasjonssalg(n, id, andel)
    return inn
  }
  const b = n.beholdning[post]
  if (!b) return 0
  const kurs = n.marked.kurser[post].kurs
  const alt = belop >= b.antall * kurs * 0.999
  let antall = alt ? b.antall : rundAntall(post, belop / kurs)
  antall = Math.min(antall, maksPerOrdre(n, post, 'selg'))
  return antall > 0 ? utforSalg(n, post, antall) : 0
}

/** Kjøper for høyst \`belop\` av en post. Gir det det kostet. Muterer. */
function kjop(n: Spilltilstand, post: Post, belop: number): number {
  if (belop < 1) return 0
  if (post === 'fond') {
    utforFondskjop(n, 'BORSFOND', belop)
    return belop
  }
  if (post === 'obligasjon') {
    // De korte statsobligasjonene: renten låses til i dag, og de svinger lite.
    utforObligasjonskjop(n, 'kort', belop)
    return belop
  }
  const kost = (a: number) => a * handelskurs(n, post, a) * (1 + KURTASJE)
  let antall = Math.min(rundAntall(post, belop / (n.marked.kurser[post].kurs * (1 + KURTASJE))), maksPerOrdre(n, post, 'kjop'))
  // Kurstrykket gjør hver enhet litt dyrere: skru ned til det går opp i beløpet.
  for (let i = 0; i < 20 && antall > 0 && kost(antall) > belop; i++) antall = rundAntall(post, antall * (belop / kost(antall)) * 0.999)
  return antall > 0 ? utforKjop(n, post, antall) : 0
}

/**
 * Bringer det forvalteren har til profilens blanding, med \`ekstra\` kroner mer (et innskudd fra
 * kontantene) eller mindre (et uttak til kontantene). Selger det som er for mye først, kjøper så
 * for det som kom inn. Gir hva den solgte og kjøpte for. Muterer.
 */
export function rebalanser(n: Spilltilstand, ekstra = 0): { solgt: number; kjopt: number } {
  const f = n.forvalter
  if (!f) return { solgt: 0, kjopt: 0 }
  const maal = blanding(f.profil)
  const total = Math.max(0, forvaltetVerdi(n) + ekstra)
  const poster = new Set<Post>([...maal.keys(), 'fond', 'obligasjon', ...(Object.keys(n.beholdning) as PapirId[]).filter(forvaltes)])
  let solgt = 0
  for (const post of poster) {
    const naa = verdiAv(n, post)
    const mal = (maal.get(post) ?? 0) * total
    if (naa > mal * (1 + SLINGRING) + 1) solgt += selg(n, post, mal > 0 ? naa - mal : Infinity)
  }
  // Det som kom inn, pluss et innskudd eller minus et uttak, er det forvalteren kan kjøpe for.
  let budsjett = Math.min(n.kontanter, solgt + ekstra)
  let kjopt = 0
  for (const [post, andel] of maal) {
    const mangler = andel * total - verdiAv(n, post)
    if (mangler <= andel * total * SLINGRING || budsjett < 1) continue
    const brukt = kjop(n, post, Math.min(mangler, budsjett))
    kjopt += brukt
    budsjett -= brukt
  }
  return { solgt, kjopt }
}

/** Tar ukas gebyr av det forvalteren har. Gir gebyret. Muterer. */
export function trekkForvaltergebyr(n: Spilltilstand): number {
  const f = n.forvalter
  if (!f) return 0
  const gebyr = FORVALTER_GEBYR * forvaltetVerdi(n)
  n.kontanter -= gebyr
  n.totaltForbruk += gebyr
  f.gebyrBetalt += gebyr
  return gebyr
}

/** Hver mandag morgen: ukas gebyr, og blandingen bringes tilbake til profilen. Muterer. */
export function forvalterVedDagsskifte(s: Spilltilstand): void {
  const f = s.forvalter
  if (!f || ukedag(s.sek) !== 0) return
  const gebyr = trekkForvaltergebyr(s)
  const r = rebalanser(s)
  f.siste = { dag: dagnummer(s.sek), solgt: r.solgt, kjopt: r.kjopt, gebyr }
  s.hendelser.push({
    sek: s.sek,
    tittel: 'Formuesforvalteren',
    tekst: r.solgt + r.kjopt >= 1 ? `Forvalteren solgte for ${kortKroner(r.solgt)} og kjøpte for ${kortKroner(r.kjopt)}. Ukas gebyr: ${kortKroner(gebyr)}.` : `Blandingen sto der den skulle. Ukas gebyr: ${kortKroner(gebyr)}.`,
    alvor: 'info',
  })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}
