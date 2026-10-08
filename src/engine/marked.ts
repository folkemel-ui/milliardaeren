/**
 * Markedet: aksjer og krypto. Hver kurs er en seedet tilfeldig vandring rundt
 * en sakte stigende «riktig verdi» — avviket trekkes tilbake mot null over tid,
 * så kursene hverken dør ut eller løper løpsk. Kryptoen har i tillegg hopp og
 * en felles stemning som drar alle myntene samme vei.
 *
 * Alle parametre er per time spilltid; ett markedstikk er MARKED_TIKK_SEK.
 */

import { lagRegioner, regiontikk } from './regioner'
import { Hashkilde, hashTekst, Terning } from './rng'
import type { Kurs, Marked, Papir, PapirId, Spilltilstand } from './types'

export const MARKED_TIKK_SEK = 5
const DT = MARKED_TIKK_SEK / 3600
/** Et historikkpunkt hvert sjette tikk (30 s), og 240 av dem: to timer. */
export const HISTORIKK_TIKK = 6
export const MAKS_KURSHISTORIKK = 240
/** Kurtasje på hver handel. */
export const KURTASJE = 0.005
/** Én ordre kan høyst doble kursen, eller halvere den (Pakke 56). */
export const MAKS_KURSTRYKK = Math.LN2

export const PAPIRER: Record<PapirId, Papir> = {
  // ── Aksjer. Lav risiko betaler mest utbytte; høy risiko svinger mest.
  NFS: { id: 'NFS', navn: 'Nordfjord Sjømat', klasse: 'aksje', bransje: 'fiskeoppdrett', risiko: 'lav', startkurs: 180, drift: 0.02, volatilitet: 0.03, reversjon: 0.5, utbytte: 0.0007, dybde: 2e9, hopp: 0 },
  FJK: { id: 'FJK', navn: 'Fjellkraft', klasse: 'aksje', risiko: 'lav', startkurs: 95, drift: 0.015, volatilitet: 0.025, reversjon: 0.5, utbytte: 0.00085, dybde: 2e9, hopp: 0 },
  VTK: { id: 'VTK', navn: 'Vikingtelekom', klasse: 'aksje', risiko: 'lav', startkurs: 42, drift: 0.02, volatilitet: 0.035, reversjon: 0.5, utbytte: 0.0007, dybde: 1.5e9, hopp: 0 },
  BSH: { id: 'BSH', navn: 'Bergen Shipping', klasse: 'aksje', bransje: 'rederi', risiko: 'middels', startkurs: 260, drift: 0.03, volatilitet: 0.06, reversjon: 0.4, utbytte: 0.00035, dybde: 1e9, hopp: 0 },
  POL: { id: 'POL', navn: 'Polaris Olje', klasse: 'aksje', bransje: 'oljeselskap', risiko: 'middels', startkurs: 310, drift: 0.03, volatilitet: 0.07, reversjon: 0.4, utbytte: 0.0004, dybde: 1e9, hopp: 0 },
  NLT: { id: 'NLT', navn: 'Nordlys Tech', klasse: 'aksje', risiko: 'høy', startkurs: 520, drift: 0.05, volatilitet: 0.12, reversjon: 0.3, utbytte: 0, dybde: 4e8, hopp: 0.0005 },
  AUB: { id: 'AUB', navn: 'Aurora Bioteknologi', klasse: 'aksje', risiko: 'høy', startkurs: 75, drift: 0.04, volatilitet: 0.15, reversjon: 0.3, utbytte: 0, dybde: 3e8, hopp: 0.001 },
  TRS: { id: 'TRS', navn: 'Trollspill', klasse: 'aksje', risiko: 'høy', startkurs: 140, drift: 0.05, volatilitet: 0.13, reversjon: 0.3, utbytte: 0, dybde: 3e8, hopp: 0.0005 },
  // ── Krypto. Ingen utbytte, ingen drift av seg selv — stemningen bestemmer.
  BMT: { id: 'BMT', navn: 'Bitmynt', klasse: 'krypto', risiko: 'høy', startkurs: 412_000, drift: 0, volatilitet: 0.25, reversjon: 0.2, utbytte: 0, dybde: 5e9, hopp: 0.001 },
  FJD: { id: 'FJD', navn: 'Fjordium', klasse: 'krypto', risiko: 'høy', startkurs: 21_000, drift: 0, volatilitet: 0.3, reversjon: 0.2, utbytte: 0, dybde: 1e9, hopp: 0.0015 },
  NSL: { id: 'NSL', navn: 'Nordsol', klasse: 'krypto', risiko: 'høy', startkurs: 1_400, drift: 0, volatilitet: 0.4, reversjon: 0.2, utbytte: 0, dybde: 3e8, hopp: 0.002 },
  TRM: { id: 'TRM', navn: 'Trollmynt', klasse: 'krypto', risiko: 'høy', startkurs: 12.5, drift: 0, volatilitet: 0.45, reversjon: 0.2, utbytte: 0, dybde: 1e8, hopp: 0.002 },
  VKT: { id: 'VKT', navn: 'Vikingtoken', klasse: 'krypto', risiko: 'høy', startkurs: 3.2, drift: 0, volatilitet: 0.5, reversjon: 0.2, utbytte: 0, dybde: 8e7, hopp: 0.0025 },
  LKS: { id: 'LKS', navn: 'Laksecoin', klasse: 'krypto', risiko: 'høy', startkurs: 0.85, drift: 0, volatilitet: 0.6, reversjon: 0.2, utbytte: 0, dybde: 5e7, hopp: 0.003 },
  // ── Børsnotert i versjon 17: bransjer børsen manglet.
  NRB: { id: 'NRB', navn: 'Nordre Bank', klasse: 'aksje', bransje: 'bank', risiko: 'lav', startkurs: 120, drift: 0.02, volatilitet: 0.03, reversjon: 0.5, utbytte: 0.0008, dybde: 2e9, hopp: 0 },
  KRV: { id: 'KRV', navn: 'Kurv Dagligvare', klasse: 'aksje', bransje: 'kiosk', risiko: 'lav', startkurs: 64, drift: 0.015, volatilitet: 0.025, reversjon: 0.5, utbytte: 0.00075, dybde: 1.5e9, hopp: 0 },
  FJF: { id: 'FJF', navn: 'Fjellfly', klasse: 'aksje', bransje: 'flyselskap', risiko: 'middels', startkurs: 35, drift: 0.025, volatilitet: 0.08, reversjon: 0.4, utbytte: 0.0002, dybde: 6e8, hopp: 0.0005 },
  ROM: { id: 'ROM', navn: 'Romfart Nord', klasse: 'aksje', risiko: 'høy', startkurs: 900, drift: 0.06, volatilitet: 0.16, reversjon: 0.3, utbytte: 0, dybde: 2e8, hopp: 0.001 },
  // Stabilkronen følger ikke stemningen og holder seg rundt 10 kr — et sted å parkere kryptopenger.
  STK: { id: 'STK', navn: 'Stabilkrone', klasse: 'krypto', risiko: 'lav', startkurs: 10, drift: 0, volatilitet: 0.01, reversjon: 4, utbytte: 0, dybde: 5e9, hopp: 0, stemning: 0 },
  // Memecoins: bittesmå kurser, voldsomme svingninger og hyppige hopp.
  ELG: { id: 'ELG', navn: 'Elgcoin', klasse: 'krypto', risiko: 'høy', startkurs: 0.004, drift: 0, volatilitet: 0.8, reversjon: 0.2, utbytte: 0, dybde: 3e7, hopp: 0.004 },
  BRN: { id: 'BRN', navn: 'Brunostcoin', klasse: 'krypto', risiko: 'høy', startkurs: 0.02, drift: 0, volatilitet: 0.7, reversjon: 0.2, utbytte: 0, dybde: 4e7, hopp: 0.0035 },
}

/**
 * Papirene som kom i versjon 17. I markedstikkene trekker de tilfeldighet fra
 * en hash av markedets nyeFrø, ikke fra terningen, så de gamle papirenes
 * tikk trekker nøyaktig det samme som før. (Avisa skriver om de nye også, og
 * hvor mange fyllsaker den trekker avhenger av det — så en gammel lagring går
 * ikke tikk for tikk som den ville gjort uten dem, men like forutsigbart.)
 */
export const NYE_PAPIRER: PapirId[] = ['NRB', 'KRV', 'FJF', 'ROM', 'STK', 'ELG', 'BRN']

export const AKSJER = (Object.keys(PAPIRER) as PapirId[]).filter((id) => PAPIRER[id].klasse === 'aksje')
export const KRYPTO = (Object.keys(PAPIRER) as PapirId[]).filter((id) => PAPIRER[id].klasse === 'krypto')

/** Hvor mye stemningen (−1 til 1) drar kryptoens drift, per time. */
const STEMNINGSKRAFT = 0.3
const STEMNING_REVERSJON = 0.3
const STEMNING_VOLATILITET = 0.6
/** Et hopp flytter kursen mellom 15 og 40 %, opp eller ned. */
const HOPP_MIN = 0.15
const HOPP_MAKS = 0.4
/** Oppvarming før et nytt spill, så grafene har to timer å vise frem. */
const OPPVARMING_TIKK = MAKS_KURSHISTORIKK * HISTORIKK_TIKK

function normal(t: Pick<Terning, 'neste'>): number {
  // Box–Muller. 1 − u holder oss unna log(0).
  const u = 1 - t.neste()
  const v = t.neste()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function kursFra(fundament: number, avvik: number): number {
  return fundament * Math.exp(avvik)
}

/** Kursen uten spillerens eget kurstrykk — det fondene regner med (Pakke 56). */
export function markedskurs(k: Kurs): number {
  return k.trykk ? k.kurs * Math.exp(-k.trykk) : k.kurs
}

/**
 * Ett markedstikk på en tilstand simuleringen eier: papirene, så
 * eiendomsindeksen. I helgen er børsen stengt — aksjene står stille, mens
 * kryptoen og eiendomsprisene går som før.
 */
export function markedstikk(
  m: Marked,
  t: Terning,
  helg = false,
  konjunktur: { aksjer: number; eiendom: number; papirer?: Partial<Record<PapirId, number>> } = { aksjer: 0, eiendom: 0 },
): void {
  papirtikk(m, t, helg, konjunktur.aksjer, konjunktur.papirer)
  eiendomstikk(m.eiendom, m.tikk, t, konjunktur.eiendom)
  regiontikk(m)
}

/** Terningen eller en hashkilde — papirsteget spør bare om neste tall. */
type Kilde = Pick<Terning, 'neste' | 'sjanse' | 'mellom'>

/** Grunnlaget for hashen til et nytt papir i et gitt tikk. */
function hashgrunnlag(nyeFrø: number, id: PapirId, tikk: number): number {
  return (nyeFrø + Math.imul(hashTekst(id), 31) + Math.imul(tikk, 1009)) | 0
}

/**
 * Ett steg for ett papir: fundamentet driver, en selskapsnyhet prises inn,
 * avviket svinger og trekkes tilbake, og en sjelden gang et hopp. Trekkene
 * fra kilden kommer i samme rekkefølge som alltid, så terningen går likt.
 */
function papirsteg(p: Papir, k: Kurs, stemning: number, kilde: Kilde, konjunktur = 0): void {
  const drag = p.klasse === 'krypto' ? stemning * (p.stemning ?? 1) : 0
  // Konjunkturen (Pakke 49) gir aksjene ekstra drift: opp i høykonjunktur, ned i lav. Null i normale tider.
  k.fundament *= Math.exp((p.drift + STEMNINGSKRAFT * drag + (p.klasse === 'aksje' ? konjunktur : 0)) * DT)
  // En selskapsnyhet prises inn litt for hvert tikk, til den er ferdig.
  if (k.nyhet) {
    const steg = k.nyhet.igjen / k.nyhet.tikk
    k.fundament *= Math.exp(steg)
    k.nyhet.igjen -= steg
    k.nyhet.tikk -= 1
    if (k.nyhet.tikk <= 0) delete k.nyhet
  }
  k.avvik += -p.reversjon * k.avvik * DT + p.volatilitet * Math.sqrt(DT) * normal(kilde)
  if (p.hopp > 0 && kilde.sjanse(p.hopp)) {
    // Hopp i stemningens retning er litt mer sannsynlige.
    const opp = kilde.sjanse(0.5 + 0.2 * drag)
    k.avvik += (opp ? 1 : -1) * kilde.mellom(HOPP_MIN, HOPP_MAKS)
  }
  // Ditt eget kurstrykk trekkes tilbake like fort som avviket, uten terningen.
  if (k.trykk) k.trykk -= p.reversjon * k.trykk * DT
  k.kurs = kursFra(k.fundament, k.avvik + (k.trykk ?? 0))
  k.topp = Math.max(k.topp ?? k.kurs, k.kurs)
  k.bunn = Math.min(k.bunn ?? k.kurs, k.kurs)
}

function papirtikk(m: Marked, t: Terning, helg = false, konjunktur = 0, perPapir?: Partial<Record<PapirId, number>>): void {
  m.tikk += 1
  const st = m.stemning
  m.stemning = Math.max(-1, Math.min(1, st - STEMNING_REVERSJON * st * DT + STEMNING_VOLATILITET * Math.sqrt(DT) * normal(t)))

  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    const p = PAPIRER[id]
    const k = m.kurser[id]
    // Et nytt papir som ikke er børsnotert ennå (mens et nytt marked bygges).
    if (!k) continue
    // Stengt børs: kursen står, men historikken får fortsatt punkter, så grafen viser helgen som flat.
    if (!(helg && p.klasse === 'aksje')) {
      const kilde = NYE_PAPIRER.includes(id) ? new Hashkilde(hashgrunnlag(m.nyeFrø ?? 0, id, m.tikk)) : t
      // Ukas bransjetrend (Pakke 53) legges på konjunkturen for selskapene i bransjen.
      papirsteg(p, k, m.stemning, kilde, konjunktur + (perPapir?.[id] ?? 0))
    }
    if (m.tikk % HISTORIKK_TIKK === 0) {
      k.historikk.push(k.kurs)
      if (k.historikk.length > MAKS_KURSHISTORIKK) k.historikk.shift()
    }
  }
}

/**
 * Børsnoterer papirene fra versjon 17 som mangler i et marked, med to timers
 * historikk, så grafene har noe å vise fra første stund. Oppvarmingen bruker
 * negative tikknumre, så den aldri gjentar seg senere. Rører ikke terningen
 * eller de andre papirene. Muterer.
 */
export function leggTilNyePapirer(m: Marked, frø: number): void {
  const nyeFrø = (m.nyeFrø ??= hashTekst(`nye-papirer:${frø}`))
  const nye = NYE_PAPIRER.filter((id) => !m.kurser[id])
  for (const id of nye) {
    const s = PAPIRER[id].startkurs
    m.kurser[id] = { kurs: s, fundament: s, avvik: 0, historikk: [] }
  }
  for (let i = OPPVARMING_TIKK; i >= 1; i--) {
    for (const id of nye) {
      const k = m.kurser[id]
      papirsteg(PAPIRER[id], k, 0, new Hashkilde(hashgrunnlag(nyeFrø, id, -i)))
      if (i % HISTORIKK_TIKK === 0) k.historikk.push(k.kurs)
    }
  }
  for (const id of nye) {
    const k = m.kurser[id]
    // Start på katalogkursen, som eiendomsindeksen: oppvarmingen gir bare formen på grafen.
    const skala = PAPIRER[id].startkurs / k.kurs
    k.fundament *= skala
    k.kurs = PAPIRER[id].startkurs
    k.historikk = k.historikk.map((v) => v * skala)
    k.topp = Math.max(k.kurs, ...k.historikk)
    k.bunn = Math.min(k.kurs, ...k.historikk)
    k.dagslutt = []
  }
}

/** Sluttkursene huskes så mange spilldager (ti timer spilletid). */
export const DAGSLUTT_MAKS = 120

/** Legger dagens sluttkurs til hvert papir. Kalles ved dagsskiftet. Muterer. */
export function registrerDagslutt(m: Marked): void {
  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    const k = m.kurser[id]
    k.dagslutt = [...(k.dagslutt ?? []), k.kurs]
    if (k.dagslutt.length > DAGSLUTT_MAKS) k.dagslutt.shift()
  }
}

// ─────────────────────────────────────────────── Eiendomsindeksen

/**
 * Eiendomsprisene: en langsom indeks som starter på 1 og vokser svakt, med
 * små svingninger — og en sjelden gang et boligkrakk.
 */
const EIENDOM = { drift: 0.01, volatilitet: 0.03, reversjon: 0.15, krakk: 0.0003, krakkMin: 0.1, krakkMaks: 0.25 }

function eiendomstikk(k: Kurs, tikk: number, t: Terning, konjunktur = 0): void {
  k.fundament *= Math.exp((EIENDOM.drift + konjunktur) * DT)
  k.avvik += -EIENDOM.reversjon * k.avvik * DT + EIENDOM.volatilitet * Math.sqrt(DT) * normal(t)
  if (t.sjanse(EIENDOM.krakk)) k.avvik -= t.mellom(EIENDOM.krakkMin, EIENDOM.krakkMaks)
  k.kurs = kursFra(k.fundament, k.avvik)
  if (tikk % HISTORIKK_TIKK === 0) {
    k.historikk.push(k.kurs)
    if (k.historikk.length > MAKS_KURSHISTORIKK) k.historikk.shift()
  }
}

/**
 * En fersk, oppvarmet eiendomsindeks. Varmes opp for seg selv, så markedet
 * ellers blir helt likt det det var før indeksen fantes.
 */
export function lagEiendomsindeks(frø: number): { indeks: Kurs; frø: number } {
  const indeks: Kurs = { kurs: 1, fundament: 1, avvik: 0, historikk: [] }
  const t = new Terning(frø)
  for (let i = 1; i <= OPPVARMING_TIKK; i++) eiendomstikk(indeks, i, t)
  // Start på 1 etter oppvarmingen, så prisene i katalogen gjelder fra dag én.
  const skala = 1 / indeks.kurs
  indeks.fundament *= skala
  indeks.kurs = 1
  indeks.historikk = indeks.historikk.map((v) => v * skala)
  return { indeks, frø: t.fro }
}

/** Et ferskt marked, varmet opp så grafene har historikk fra start. Returnerer frøet etterpå. */
export function lagMarked(frø: number): { marked: Marked; frø: number } {
  const kurser = {} as Marked['kurser']
  // De nye papirene legges til etterpå, så de gamle varmes opp nøyaktig som før.
  for (const id of (Object.keys(PAPIRER) as PapirId[]).filter((p) => !NYE_PAPIRER.includes(p))) {
    const s = PAPIRER[id].startkurs
    kurser[id] = { kurs: s, fundament: s, avvik: 0, historikk: [] }
  }
  const { indeks, frø: etterIndeks } = lagEiendomsindeks(frø)
  const marked: Marked = { tikk: 0, stemning: 0, kurser, eiendom: indeks, regioner: lagRegioner(frø, indeks.historikk.length) }
  const t = new Terning(etterIndeks)
  for (let i = 0; i < OPPVARMING_TIKK; i++) papirtikk(marked, t)
  marked.tikk = 0
  // Høyeste og laveste regnes fra historikken som vises — likt med migreringen.
  for (const k of Object.values(kurser)) {
    const alle = [...k.historikk, k.kurs]
    k.topp = Math.max(...alle)
    k.bunn = Math.min(...alle)
    k.dagslutt = []
  }
  leggTilNyePapirer(marked, frø)
  return { marked, frø: t.fro }
}

// ─────────────────────────────────────────────── Handel

/*
 * Kurstrykket (Pakke 56). Hver krone flytter kursen like mye, uansett hvordan
 * ordren deles: kjøper du `q` til kursen p, går 1/p ned med q/dybde. Da koster
 * kjøpet nøyaktig dybde · ln(p₁/p₀), og å selge det samme antallet tilbake gir
 * nøyaktig det samme — mange små kjøp og ett stort salg går i null før kurtasjen.
 * Før hadde hver ordre et tak på trykket, så ti kjøp betalte ti trykk, men ett
 * salg bare ett: +113 % på Vikingtoken.
 */

/** Andelen av dybden en ordre på `antall` (positivt kjøp, negativt salg) tilsvarer. */
function dybdeandel(s: Spilltilstand, id: PapirId, antall: number): number {
  return (antall * s.marked.kurser[id].kurs) / PAPIRER[id].dybde
}

/**
 * Hvor mye en ordre på `antall` flytter kursen (logaritmisk): positiv for kjøp,
 * negativ for salg. Et kjøp nær hele dybden ville sendt kursen mot uendelig —
 * handlingene stopper det ved MAKS_KURSTRYKK, og her holdes det endelig.
 */
export function kurstrykk(s: Spilltilstand, id: PapirId, antall: number): number {
  return -Math.log1p(-Math.min(dybdeandel(s, id, antall), 0.999))
}

/** Snittprisen per stykk for en ordre på `antall` (positivt kjøp, negativt salg). */
export function handelskurs(s: Spilltilstand, id: PapirId, antall: number): number {
  const kurs = s.marked.kurser[id].kurs
  const x = dybdeandel(s, id, antall)
  if (Math.abs(x) < 1e-12) return kurs
  return (kurs * kurstrykk(s, id, antall)) / x
}

/** Det meste én ordre kan kjøpe eller selge, så kursen høyst dobles eller halveres. */
export function maksPerOrdre(s: Spilltilstand, id: PapirId, retning: 'kjop' | 'selg'): number {
  const enheter = PAPIRER[id].dybde / s.marked.kurser[id].kurs
  // Kjøp: 1 − x ≥ e^−MAKS. Salg: 1 + x ≤ e^MAKS.
  return rundAntall(id, retning === 'kjop' ? enheter * -Math.expm1(-MAKS_KURSTRYKK) : enheter * Math.expm1(MAKS_KURSTRYKK))
}

/** Flytter kursen etter en handel. Muterer — brukes bare på kopier. */
export function flyttKurs(m: Marked, id: PapirId, antall: number): void {
  const k = m.kurser[id]
  const x = Math.min((antall * k.kurs) / PAPIRER[id].dybde, 0.999)
  k.trykk = (k.trykk ?? 0) - Math.log1p(-x)
  k.kurs = kursFra(k.fundament, k.avvik + k.trykk)
}

/** Aksjer handles i hele stykk; krypto i brøkdeler ned til 1/10 000. */
export function rundAntall(id: PapirId, antall: number): number {
  return PAPIRER[id].klasse === 'aksje' ? Math.floor(antall) : Math.floor(antall * 10_000) / 10_000
}
