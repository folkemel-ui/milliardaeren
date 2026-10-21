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
 *
 * Pakke 125: en forvalter som lærer. Tre trinn kjøpes én gang, priset på nettoformuen (ikke på det
 * forvalteren har — ellers kunne du kjøpt trinnet billig og så gitt den milliarder): et lavere
 * gebyr, så en forvalter som følger konjunkturen (vipper blandingen), så en som følger renten
 * (renteposten). Trinnene blir stående om du sier den opp.
 */

import { AKSJER, handelskurs, KURTASJE, maksPerOrdre, PAPIRER, rundAntall } from './marked'
import { utforFondskjop, utforFondssalg, utforKjop, utforObligasjonskjop, utforObligasjonssalg, utforSalg } from './handel'
import { fondskurs } from './fond'
import { obligasjonsverdiFor } from './obligasjoner'
import { dagnummer, erHelg, ukedag } from './kalender'
import { MAKS_HENDELSER } from './innhold'
import { nettoformue } from './formler'
import { sparingKostpris } from './portefolje'
import { fase, type Fase } from './verden'
import { kortKroner } from './tall'
import type { Forvalterprofil, ObligasjonId, PapirId, Risiko, Spilltilstand } from './types'

/** Gebyret hver uke, av det forvalteren har … */
export const FORVALTER_GEBYR = 0.002
/** … med første trinn … */
export const FORVALTER_GEBYR_LAV = 0.0015
/** Forvalteren lar en post være til den er mer enn 3 % fra målet, så den ikke handler for småpenger. */
const SLINGRING = 0.03

export const PROFILER: Record<Forvalterprofil, { navn: string; tekst: string; obligasjon: number; fond: number; aksjer: number; risiko: Risiko[]; gull: number; energi: number }> = {
  forsiktig: { navn: 'Forsiktig', tekst: 'Halvparten i obligasjoner, resten i Børsfondet, gull og trygge aksjer.', obligasjon: 0.5, fond: 0.25, aksjer: 0.1, risiko: ['lav'], gull: 0.15, energi: 0 },
  balansert: { navn: 'Balansert', tekst: 'En firedel i obligasjoner, Børsfondet, aksjer med lav og middels risiko, litt gull, olje og laks.', obligasjon: 0.25, fond: 0.35, aksjer: 0.25, risiko: ['lav', 'middels'], gull: 0.1, energi: 0.05 },
  offensiv: { navn: 'Offensiv', tekst: 'Ingen obligasjoner: Børsfondet, aksjer med middels og høy risiko, olje og laks.', obligasjon: 0, fond: 0.3, aksjer: 0.5, risiko: ['middels', 'høy'], gull: 0.05, energi: 0.15 },
}
export const PROFILLISTE = Object.keys(PROFILER) as Forvalterprofil[]

// ─────────────────────────────────────────────── Trinnene (Pakke 125)

/*
 * Trinnene koster en andel av nettoformuen, én gang, og blir stående, priset etter hva de gir. Målt med
 * 1 mrd i 24 t i fire spill, i prosentpoeng av det forvalteren har: lavere gebyr +2,3 (Balansert) og
 * +1,7 (Forsiktig), konjunkturen +2,6 og +1,9, renten +0,4 og +0,8 — mot sparekontoens +19,0 % og uten
 * trinn +33,4 og +27,1 %. Med halve formuen hos forvalteren er hvert trinn tilbake på én til to
 * spilldager (0,5 %, 1,5 % og 0,5 % av formuen); 5 % for renten, som foreslått, ville tatt uker. Oftere
 * rebalansering ble prøvd og tatt ut: hver hverdag for 0,1 % mer i uka tapte 7,7 prosentpoeng på 24 t,
 * og bare ved store utslag (15 %) 0,6 — prisene trekkes tilbake, så hyppigere handel gir bare kurtasje.
 * Konjunkturen skifter dessuten alltid på en mandag (28 dager er fire uker), som mandagen alt tar.
 */
export const FORVALTERTRINN = [
  { navn: 'Lavere gebyr', tekst: '0,15 % i uka i stedet for 0,2 %.', andel: 0.005 },
  { navn: 'Følger konjunkturen', tekst: 'Flere aksjer i høykonjunktur, mer gull i lavkonjunktur.', andel: 0.015 },
  { navn: 'Følger renten', tekst: 'Låser høy rente i 10-årige obligasjoner, venter på kontoen når den er lav.', andel: 0.005 },
] as const

export const forvaltertrinn = (s: Spilltilstand) => s.forvaltertrinn ?? 0

/** Prisen for neste trinn, eller null når alle er kjøpt. */
export function forvaltertrinnpris(s: Spilltilstand): number | null {
  const t = forvaltertrinn(s)
  return t >= FORVALTERTRINN.length ? null : FORVALTERTRINN[t].andel * Math.max(0, nettoformue(s))
}

/** Ukas gebyr som andel av det forvalteren har. */
export function gebyrsats(s: Spilltilstand): number {
  return forvaltertrinn(s) >= 1 ? FORVALTER_GEBYR_LAV : FORVALTER_GEBYR
}

// ─────────────────────────────────────────────── Blandingen

/** En post forvalteren holder: et papir, Børsfondet, en obligasjon, eller forvalterkontoen. */
type Post = PapirId | 'fond' | ObligasjonId | 'konto'
const IKKE_PAPIR: ReadonlySet<string> = new Set(['fond', 'kort', 'lang', 'konto'])
/** Er posten et papir (en aksje eller råvare), ikke fondet, en obligasjon eller kontoen? */
export const erPapirpost = (post: Post): post is PapirId => !IKKE_PAPIR.has(post)

/** Konjunkturen flytter så stor andel mellom aksjene og gull, obligasjoner og fond (Pakke 125). */
export const VIPP: Record<Fase, number> = { hoy: 0.1, normal: 0, lav: -0.1 }

/**
 * Hvor renten bør stå (Pakke 125): en obligasjon låser dagens rente, sparekontoen og forvalterkontoen
 * følger den. Høy rente (5 %, høykonjunktur): de 10-årige låser den. Lav (2,5 %): kontoen, så den
 * stiger med renten igjen og ingen obligasjon taper verdi når renten går opp. Ellers de 2-årige.
 */
export const RENTEPOST: Record<Fase, 'kort' | 'lang' | 'konto'> = { hoy: 'lang', normal: 'kort', lav: 'konto' }

/**
 * Blandingen for en profil: andelen av det forvalteren har, per post. Summerer til 1. Uten
 * \`marked\` (eller i normale tider) som i Pakke 124, med de 2-årige obligasjonene; med en
 * konjunktur vippes aksjene ±10 prosentpoeng, og med `rente` følger renteposten styringsrenten.
 */
export function blanding(profil: Forvalterprofil, marked?: Fase, rente = false): Map<Post, number> {
  const p = PROFILER[profil]
  let aksjer = p.aksjer
  let gull = p.gull
  let obligasjon = p.obligasjon
  let fond = p.fond
  const vipp = marked ? VIPP[marked] : 0
  if (vipp > 0) {
    // Opp: hentes fra gullet, så obligasjonene, så fondet.
    let igjen = vipp
    for (const ta of ['gull', 'obligasjon', 'fond'] as const) {
      const fra = ta === 'gull' ? gull : ta === 'obligasjon' ? obligasjon : fond
      const tatt = Math.min(fra, igjen)
      if (ta === 'gull') gull -= tatt
      else if (ta === 'obligasjon') obligasjon -= tatt
      else fond -= tatt
      aksjer += tatt
      igjen -= tatt
    }
  } else if (vipp < 0) {
    // Ned: aksjene gir til gullet, som går mot konjunkturen.
    const tatt = Math.min(aksjer, -vipp)
    aksjer -= tatt
    gull += tatt
  }
  const m = new Map<Post, number>()
  if (obligasjon > 0) m.set(marked && rente ? RENTEPOST[marked] : 'kort', obligasjon)
  if (fond > 0) m.set('fond', fond)
  const liste = AKSJER.filter((id) => p.risiko.includes(PAPIRER[id].risiko))
  if (aksjer > 0) for (const id of liste) m.set(id, aksjer / liste.length)
  if (gull > 0) m.set('GLD', gull)
  if (p.energi) {
    m.set('OLJ', p.energi / 2)
    m.set('LAK', p.energi / 2)
  }
  return m
}

/** Blandingen forvalteren følger nå: med konjunkturen (trinn 2) og renten (trinn 3). */
export function blandingNaa(s: Spilltilstand): Map<Post, number> {
  const f = s.forvalter
  if (!f) return new Map()
  const t = forvaltertrinn(s)
  return blanding(f.profil, t >= 2 ? fase(s) : undefined, t >= 3)
}

/** Postene forvalteren kan holde: alle aksjer, råvarer, Børsfondet og obligasjonene. */
function forvaltes(id: PapirId): boolean {
  return PAPIRER[id].klasse !== 'krypto'
}

function verdiAv(s: Spilltilstand, post: Post): number {
  if (post === 'fond') return (s.fond.BORSFOND?.antall ?? 0) * fondskurs(s, 'BORSFOND')
  if (post === 'kort' || post === 'lang') return s.obligasjoner?.[post] ? obligasjonsverdiFor(s, post) : 0
  if (post === 'konto') return s.forvalter?.konto ?? 0
  const b = s.beholdning[post]
  return b ? b.antall * s.marked.kurser[post].kurs : 0
}

/** Det forvalteren har nå: aksjene, råvarene, Børsfondet, obligasjonene og forvalterkontoen. */
export function forvaltetVerdi(s: Spilltilstand): number {
  let sum = verdiAv(s, 'fond') + verdiAv(s, 'kort') + verdiAv(s, 'lang') + verdiAv(s, 'konto')
  for (const id of Object.keys(s.beholdning) as PapirId[]) if (forvaltes(id)) sum += verdiAv(s, id)
  return sum
}

/** Selger for omtrent \`belop\` av en post (alt med Infinity). Gir det som kom inn. Muterer. */
function selg(n: Spilltilstand, post: Post, belop: number): number {
  if (post === 'fond') return n.fond.BORSFOND ? utforFondssalg(n, 'BORSFOND', belop) : 0
  if (post === 'kort' || post === 'lang') {
    const verdi = verdiAv(n, post)
    return verdi > 0 ? utforObligasjonssalg(n, post, Math.min(1, belop / verdi)) : 0
  }
  if (post === 'konto') {
    const f = n.forvalter!
    const konto = f.konto ?? 0
    const ut = Math.min(konto, belop)
    if (ut <= 0) return 0
    f.kontoKostpris = konto > 0 ? (f.kontoKostpris ?? 0) * (1 - ut / konto) : 0
    f.konto = konto - ut
    n.kontanter += ut
    return ut
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
  if (post === 'kort' || post === 'lang') {
    utforObligasjonskjop(n, post, belop)
    return belop
  }
  if (post === 'konto') {
    // Sparekontoens kostpris låses før forvalterkontoens renter regnes med i totaltSparerente.
    n.sparingKostpris = sparingKostpris(n)
    const f = n.forvalter!
    f.konto = (f.konto ?? 0) + belop
    f.kontoKostpris = (f.kontoKostpris ?? 0) + belop
    n.kontanter -= belop
    return belop
  }
  const kost = (a: number) => a * handelskurs(n, post, a) * (1 + KURTASJE)
  let antall = Math.min(rundAntall(post, belop / (n.marked.kurser[post].kurs * (1 + KURTASJE))), maksPerOrdre(n, post, 'kjop'))
  // Kurstrykket gjør hver enhet litt dyrere: skru ned til det går opp i beløpet.
  for (let i = 0; i < 20 && antall > 0 && kost(antall) > belop; i++) antall = rundAntall(post, antall * (belop / kost(antall)) * 0.999)
  return antall > 0 ? utforKjop(n, post, antall) : 0
}

/**
 * Bringer det forvalteren har til blandingen den følger nå, med \`ekstra\` kroner mer (et innskudd
 * fra kontantene) eller mindre (et uttak til kontantene). Selger det som er for mye først, kjøper
 * så for det som kom inn. Gir hva den solgte og kjøpte for. Muterer.
 */
export function rebalanser(n: Spilltilstand, ekstra = 0): { solgt: number; kjopt: number } {
  const f = n.forvalter
  if (!f) return { solgt: 0, kjopt: 0 }
  const maal = blandingNaa(n)
  const total = Math.max(0, forvaltetVerdi(n) + ekstra)
  const poster = new Set<Post>([...maal.keys(), 'fond', 'kort', 'lang', 'konto', ...(Object.keys(n.beholdning) as PapirId[]).filter(forvaltes)])
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
  const gebyr = gebyrsats(n) * forvaltetVerdi(n)
  n.kontanter -= gebyr
  n.totaltForbruk += gebyr
  f.gebyrBetalt += gebyr
  return gebyr
}

/** Forvalterkontoens rente for \`sekunder\` sekunder, til sparekontoens sats (Pakke 125). Muterer. */
export function forvalterkontoRente(s: Spilltilstand, sats: number, sekunder = 1): void {
  const f = s.forvalter
  if (!f?.konto) return
  const r = (f.konto * sats * sekunder) / 3600
  f.konto += r
  s.totaltSparerente += r
}

/** Hver mandag morgen — også dagen konjunkturen skifter: ukas gebyr, og blandingen bringes tilbake. Muterer. */
export function forvalterVedDagsskifte(s: Spilltilstand): void {
  const f = s.forvalter
  if (!f || erHelg(s.sek) || ukedag(s.sek) !== 0) return
  const gebyr = trekkForvaltergebyr(s)
  const r = rebalanser(s)
  f.siste = { dag: dagnummer(s.sek), solgt: r.solgt, kjopt: r.kjopt, gebyr }
  s.hendelser.push({
    sek: s.sek,
    tittel: 'Formuesforvalteren',
    tekst:
      r.solgt + r.kjopt >= 1
        ? `Forvalteren solgte for ${kortKroner(r.solgt)} og kjøpte for ${kortKroner(r.kjopt)}. Ukas gebyr: ${kortKroner(gebyr)}.`
        : `Blandingen sto der den skulle. Ukas gebyr: ${kortKroner(gebyr)}.`,
    alvor: 'info',
  })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}
