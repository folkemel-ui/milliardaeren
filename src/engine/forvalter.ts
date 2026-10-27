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
 *
 * Pakke 126: en forvalter for hvert formål. En fjerde profil, Utbytte, for jevne kontanter; en
 * rebalansering som tenker på skatten (tapere selges før vinnere, og en vinner først når den er langt
 * unna); en andel av inntekten hvert sekund, samlet på forvalterkontoen og investert mandag; og et
 * sparemål som blir tryggere jo nærmere det kommer, og betales ut når det er nådd.
 *
 * Pakke 127: en forvalter du kan se. Et regnskap fra start (eller, for en forvalter fra før, fra
 * oppdateringen): det som gikk inn og ut, utbyttet, gebyret, og en skyggekonto — sparekontoen med de
 * samme pengene til de samme tidene — så kortet og søndagsavisa kan si om den lønner seg.
 */

import { AKSJER, handelskurs, KURTASJE, maksPerOrdre, PAPIRER, rundAntall } from './marked'
import { utforFondskjop, utforFondssalg, utforKjop, utforObligasjonskjop, utforObligasjonssalg, utforSalg } from './handel'
import { fondskurs, fondsutbytte } from './fond'
import { kupongPerSek, obligasjonsverdiFor } from './obligasjoner'
import { DAG_SEK, dagnummer, erHelg, ukedag } from './kalender'
import { utbytteFor } from './kvartal'
import { BEDRIFTSTYPER, MAKS_HENDELSER, STIGEN } from './innhold'
import { eierType, nettoformue } from './formler'
import { flyt, sparingKostpris } from './portefolje'
import { fase, type Fase } from './verden'
import { kortKroner } from './tall'
import type { BedriftstypeId, Forvalterprofil, Forvalterstand, ObligasjonId, PapirId, Risiko, Spilltilstand } from './types'

/** Gebyret hver uke, av det forvalteren har … */
export const FORVALTER_GEBYR = 0.002
/** … med første trinn … */
export const FORVALTER_GEBYR_LAV = 0.0015
/** Forvalteren lar en post være til den er mer enn 3 % fra målet, så den ikke handler for småpenger. */
const SLINGRING = 0.03
/*
 * … men en post med gevinst først når den er 20 % over (Pakke 126): gevinsten skattes med måneden, med opptil
 * 28 %, så et salg som bare pynter på blandingen koster mer enn det gir. Målt med 1 mrd i 24 t i fire spill,
 * etter skatt: Forsiktig 22,8 → 25,5 %, Balansert 30,9 → 33,6, Offensiv 50,5 → 52,9 (10 % ga 24,9, 33,4 og
 * 52,5). Et uttak selger likevel det som trengs.
 */
export const VINNER_SLINGRING = 0.2

export const PROFILER: Record<Forvalterprofil, { navn: string; tekst: string; obligasjon: number; fond: number; aksjer: number; risiko: Risiko[]; gull: number; energi: number }> = {
  forsiktig: { navn: 'Forsiktig', tekst: 'Halvparten i obligasjoner, resten i Børsfondet, gull og trygge aksjer.', obligasjon: 0.5, fond: 0.25, aksjer: 0.1, risiko: ['lav'], gull: 0.15, energi: 0 },
  balansert: { navn: 'Balansert', tekst: 'En firedel i obligasjoner, Børsfondet, aksjer med lav og middels risiko, litt gull, olje og laks.', obligasjon: 0.25, fond: 0.35, aksjer: 0.25, risiko: ['lav', 'middels'], gull: 0.1, energi: 0.05 },
  offensiv: { navn: 'Offensiv', tekst: 'Ingen obligasjoner: Børsfondet, aksjer med middels og høy risiko, olje og laks.', obligasjon: 0, fond: 0.3, aksjer: 0.5, risiko: ['middels', 'høy'], gull: 0.05, energi: 0.15 },
  // Pakke 126: de trygge aksjene betaler 0,07–0,085 % om dagen. Målt med 1 mrd i 24 t, etter skatt: +32,6 % og
  // 196 mill i utbytte og kuponger, mot Balansert +30,9 % og 145 mill (80 % aksjer ga 29,4 % og 208 mill).
  utbytte: { navn: 'Utbytte', tekst: 'Trygge aksjer som betaler utbytte, Børsfondet og obligasjoner — jevne kontanter hver hverdag.', obligasjon: 0.2, fond: 0.2, aksjer: 0.6, risiko: ['lav'], gull: 0, energi: 0 },
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

/** Sparemålet (Pakke 126) blir tryggere fra halvveis: blandingen glir mot Forsiktig, og er helt der ved målet. */
export const GLIR_FRA = 0.5

/** Hvor langt mot Forsiktig blandingen har glidd for sparemålet, 0–1. */
export function maalvekt(s: Spilltilstand, verdi = forvaltetVerdi(s)): number {
  const m = s.forvalter?.maal
  if (!m || m.belop <= 0) return 0
  return Math.min(1, Math.max(0, (verdi / m.belop - GLIR_FRA) / (1 - GLIR_FRA)))
}

/** Blandingen forvalteren følger nå: med konjunkturen (trinn 2), renten (trinn 3) og sparemålet. */
export function blandingNaa(s: Spilltilstand, verdi?: number): Map<Post, number> {
  const f = s.forvalter
  if (!f) return new Map()
  const t = forvaltertrinn(s)
  const marked = t >= 2 ? fase(s) : undefined
  const egen = blanding(f.profil, marked, t >= 3)
  const v = f.maal ? maalvekt(s, verdi) : 0
  if (v <= 0 || f.profil === 'forsiktig') return egen
  const trygg = blanding('forsiktig', marked, t >= 3)
  const m = new Map<Post, number>()
  for (const [post, andel] of egen) m.set(post, andel * (1 - v))
  for (const [post, andel] of trygg) m.set(post, (m.get(post) ?? 0) + andel * v)
  return m
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

/** Gevinsten i en post om den selges nå, mot kostprisen — kontoen har ingen; renten er alt skattet. */
function gevinstAv(s: Spilltilstand, post: Post): number {
  if (post === 'konto') return 0
  const kost = post === 'fond' ? s.fond.BORSFOND?.kostpris : post === 'kort' || post === 'lang' ? s.obligasjoner?.[post]?.kostpris : s.beholdning[post]?.kostpris
  return verdiAv(s, post) - (kost ?? 0)
}

/** Det forvalteren har nå: aksjene, råvarene, Børsfondet, obligasjonene og forvalterkontoen. */
export function forvaltetVerdi(s: Spilltilstand): number {
  let sum = verdiAv(s, 'fond') + verdiAv(s, 'kort') + verdiAv(s, 'lang') + verdiAv(s, 'konto')
  for (const id of Object.keys(s.beholdning) as PapirId[]) if (forvaltes(id)) sum += verdiAv(s, id)
  return sum
}

/**
 * Utbyttet og kupongene det forvalteren har gir på en hverdag (Pakke 126), som kontanter til deg:
 * aksjene og Børsfondet hver hverdag morgen, kupongene sekund for sekund.
 */
export function utbyttePerDag(s: Spilltilstand): number {
  return utbytteIDag(s) + kupongPerSek(s) * DAG_SEK
}

/** Utbyttet aksjene, råvarene og Børsfondet forvalteren har, betaler en hverdag morgen — ikke andre fond (Pakke 127). */
export function utbytteIDag(s: Spilltilstand): number {
  let sum = verdiAv(s, 'fond') * fondsutbytte(s, 'BORSFOND')
  for (const id of Object.keys(s.beholdning) as PapirId[]) if (forvaltes(id)) sum += verdiAv(s, id) * utbytteFor(s, id)
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
    flyt(n, 'sparing', -ut)
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
    flyt(n, 'sparing', belop)
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
 * fra kontantene) eller mindre (et uttak til kontantene). Selger det som er for mye først — tapere
 * før vinnere, og en vinner først når den er langt unna (Pakke 126) — og kjøper så for det som kom
 * inn, det som mangler mest først. Gir hva den solgte og kjøpte for. Muterer.
 */
export function rebalanser(n: Spilltilstand, ekstra = 0): { solgt: number; kjopt: number } {
  const f = n.forvalter
  if (!f) return { solgt: 0, kjopt: 0 }
  const verdi = forvaltetVerdi(n)
  const maal = blandingNaa(n, verdi)
  const total = Math.max(0, verdi + ekstra)
  const poster = new Set<Post>([...maal.keys(), 'fond', 'kort', 'lang', 'konto', ...(Object.keys(n.beholdning) as PapirId[]).filter(forvaltes)])
  // Tapene først: et salg med tap trekkes fra månedens skatt, et med gevinst legges til.
  const gevinst = new Map<Post, number>()
  for (const post of poster) gevinst.set(post, gevinstAv(n, post))
  const rekke = [...poster].sort((a, b) => gevinst.get(a)! - gevinst.get(b)!)
  let solgt = 0
  const selgNed = (post: Post, slakk: number) => {
    const naa = verdiAv(n, post)
    const mal = (maal.get(post) ?? 0) * total
    if (naa > mal * (1 + slakk) + 1) solgt += selg(n, post, mal > 0 ? naa - mal : Infinity)
  }
  for (const post of rekke) selgNed(post, gevinst.get(post)! > 0 ? VINNER_SLINGRING : SLINGRING)
  // Et uttak skal fram: kom det ikke inn nok, selges vinnerne også, den minste gevinsten først.
  if (ekstra < 0) for (const post of rekke) if (solgt + ekstra < 0 && gevinst.get(post)! > 0) selgNed(post, SLINGRING)
  // Det som kom inn, pluss et innskudd eller minus et uttak, er det forvalteren kan kjøpe for.
  let budsjett = Math.min(n.kontanter, solgt + ekstra)
  let kjopt = 0
  const mangel = (post: Post, andel: number) => andel * total - verdiAv(n, post)
  for (const [post, andel] of [...maal].sort((a, b) => mangel(b[0], b[1]) - mangel(a[0], a[1]))) {
    const mangler = mangel(post, andel)
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

// ─────────────────────────────────────────────── Innskudd og sparemål (Pakke 126)

/** Andelene av inntekten forvalteren kan få, som sparingen av inntekten (Pakke 124). */
export const INNSKUDDSANDELER = [0, 0.1, 0.25, 0.5]

/**
 * En andel av inntekten eller leia til forvalterkontoen, hvert sekund (Pakke 126). Den står med
 * sparekontoens rente til mandag, da rebalanseringen kjøper for den — kurtasjen tas én gang i uka,
 * ikke hvert sekund. Muterer.
 */
export function forvalterInnskudd(s: Spilltilstand, belop: number): void {
  const f = s.forvalter!
  // Sparekontoens kostpris låses før forvalterkontoens renter regnes med i totaltSparerente.
  if (s.sparingKostpris === undefined) s.sparingKostpris = sparingKostpris(s)
  s.kontanter -= belop
  f.konto = (f.konto ?? 0) + belop
  f.kontoKostpris = (f.kontoKostpris ?? 0) + belop
  flyt(s, 'sparing', belop)
  bokforInn(s, belop)
}

/**
 * Den billigste bedriften på stigen du ikke eier og forvalteren ikke alt har nok til, som sparemål — eller
 * null. En bedrift den alt kan betale, ville vært nådd med en gang; da er et uttak det du vil.
 */
export function nesteBedriftsmaal(s: Spilltilstand, verdi = forvaltetVerdi(s)): { belop: number; navn: string; bedrift: BedriftstypeId } | null {
  for (const id of STIGEN) if (!eierType(s, id) && BEDRIFTSTYPER[id].pris > verdi) return { belop: BEDRIFTSTYPER[id].pris, navn: BEDRIFTSTYPER[id].navn, bedrift: id }
  return null
}

/** Sparemålene du kan velge: neste bedrift, eller to, fem eller ti ganger det forvalteren har. */
export const MAALGANGER = [2, 5, 10]

/**
 * Hver hverdag morgen: er sparemålet nådd, betales beløpet ut som kontanter, og forvalteren holder
 * resten i profilen sin som før. Gir det som ble betalt ut, eller 0. Muterer.
 */
export function betalUtMaal(s: Spilltilstand): number {
  const f = s.forvalter
  const m = f?.maal
  if (!f || !m || erHelg(s.sek) || forvaltetVerdi(s) < m.belop) return 0
  const for_ = s.kontanter
  delete f.maal
  // Uten målet følger blandingen profilen igjen; uttaket selger det som trengs, tapene først.
  rebalanser(s, -m.belop)
  const ut = s.kontanter - for_
  bokforUt(s, ut)
  s.hendelser.push({
    sek: s.sek,
    tittel: 'Sparemålet er nådd',
    tekst: m.bedrift
      ? `Forvalteren betalte ut ${kortKroner(ut)} — nok til ${m.navn.toLowerCase()}. Resten forvalter den som før.`
      : `Forvalteren betalte ut ${kortKroner(ut)}, målet ${m.navn}. Resten forvalter den som før.`,
    alvor: 'info',
  })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
  return ut
}

// ─────────────────────────────────────────────── Regnskapet (Pakke 127)

/** Så mange dager kurven på kortet husker: åtte uker. */
export const KURVE_DAGER = 56

/** Starter regnskapet: det forvalteren har nå regnes som gitt den, og skyggekontoen får like mye. Muterer. */
export function startRegnskap(s: Spilltilstand): void {
  const f = s.forvalter
  if (!f) return
  const verdi = forvaltetVerdi(s)
  f.regnskap = { fra: s.sek, inn: verdi, ut: 0, utbytte: 0, gebyr0: f.gebyrBetalt, skygge: verdi, kurve: [] }
}

/** Penger til forvalteren — knappene og andelen av inntekten. Skyggekontoen får det samme. Muterer. */
export function bokforInn(s: Spilltilstand, belop: number): void {
  const r = s.forvalter?.regnskap
  if (!r || !(belop > 0)) return
  r.inn += belop
  r.skygge += belop
}

/** Penger fra forvalteren — uttak og sparemålet. Skyggekontoen gir det samme. Muterer. */
export function bokforUt(s: Spilltilstand, belop: number): void {
  const r = s.forvalter?.regnskap
  if (!r || !(belop > 0)) return
  r.ut += belop
  r.skygge -= belop
}

/**
 * Hvert sekund: skyggekontoen får sparekontoens rente, og kupongene fra obligasjonene den har føres som
 * utbytte. En forvalter fra før Pakke 127 begynner å telle her. Muterer.
 */
export function forvalterSekund(s: Spilltilstand, sats: number, kupong: number): void {
  if (!s.forvalter!.regnskap) startRegnskap(s)
  const r = s.forvalter!.regnskap!
  r.skygge += (r.skygge * sats) / 3600
  r.utbytte += kupong
}

/** Hverdag morgen: aksjeutbyttet og fondsutbyttet til det forvalteren har, før det betales ut. Muterer. */
export function bokforUtbytte(s: Spilltilstand): void {
  const r = s.forvalter?.regnskap
  if (r) r.utbytte += utbytteIDag(s)
}

/**
 * Hva forvalteren har gitt siden regnskapet startet, før skatt: det den har og det den har betalt ut og
 * gitt i utbytte, minus det den fikk og gebyrene. Og det samme for sparekontoen med de samme pengene.
 */
export function forvalterResultat(s: Spilltilstand): { fra: number; gevinst: number; gebyr: number; spar: number; mer: number } | null {
  const f = s.forvalter
  const r = f?.regnskap
  if (!f || !r) return null
  const gebyr = f.gebyrBetalt - r.gebyr0
  const gevinst = forvaltetVerdi(s) + r.ut + r.utbytte - r.inn - gebyr
  const spar = r.skygge + r.ut - r.inn
  return { fra: r.fra, gevinst, gebyr, spar, mer: gevinst - spar }
}

/** Tellerne ved ukas start, til søndagsavisa. */
export function forvalterstand(s: Spilltilstand): Forvalterstand | undefined {
  const f = s.forvalter
  const r = f?.regnskap
  if (!f || !r) return undefined
  return { fra: r.fra, verdi: forvaltetVerdi(s), inn: r.inn, ut: r.ut, utbytte: r.utbytte, gebyr: f.gebyrBetalt - r.gebyr0, skygge: r.skygge }
}

/**
 * Ukas avkastning for forvalteren, etter gebyr og med utbyttet, og for skyggekontoen — begge mot det de
 * hadde ved ukas start og halvparten av pengene inn og ut i uka, som er trukket fra gevinsten. Null når
 * regnskapet startet i uka.
 */
export function ukeresultat(s: Spilltilstand, start: Forvalterstand | undefined): { endring: number; spar: number } | null {
  const naa = forvalterstand(s)
  if (!start || !naa || naa.fra !== start.fra || start.verdi <= 0 || start.skygge <= 0) return null
  const inn = naa.inn - start.inn
  const ut = naa.ut - start.ut
  const gevinst = naa.verdi + ut + (naa.utbytte - start.utbytte) - inn - (naa.gebyr - start.gebyr) - start.verdi
  // Penger som kom inn i uka, har bare stått en del av den: halvparten regnes med i grunnlaget, for begge.
  const midt = (inn - ut) / 2
  return { endring: gevinst / Math.max(1, start.verdi + midt), spar: (naa.skygge + ut - inn - start.skygge) / Math.max(1, start.skygge + midt) }
}

/** Hver mandag morgen — også dagen konjunkturen skifter: ukas gebyr, og blandingen bringes tilbake. Muterer. */
export function forvalterVedDagsskifte(s: Spilltilstand): void {
  const f = s.forvalter
  // Pakke 127: kurven får dagens sluttverdi.
  const bok = f?.regnskap
  if (bok) {
    bok.kurve.push(forvaltetVerdi(s))
    if (bok.kurve.length > KURVE_DAGER) bok.kurve.splice(0, bok.kurve.length - KURVE_DAGER)
  }
  if (f?.maal) betalUtMaal(s)
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
