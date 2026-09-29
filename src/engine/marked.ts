/**
 * Markedet: aksjer og krypto. Hver kurs er en seedet tilfeldig vandring rundt
 * en sakte stigende «riktig verdi» — avviket trekkes tilbake mot null over tid,
 * så kursene hverken dør ut eller løper løpsk. Kryptoen har i tillegg hopp og
 * en felles stemning som drar alle myntene samme vei.
 *
 * Alle parametre er per time spilltid; ett markedstikk er MARKED_TIKK_SEK.
 */

import { Terning } from './rng'
import type { Kurs, Marked, Papir, PapirId, Spilltilstand } from './types'

export const MARKED_TIKK_SEK = 5
const DT = MARKED_TIKK_SEK / 3600
/** Et historikkpunkt hvert sjette tikk (30 s), og 240 av dem: to timer. */
export const HISTORIKK_TIKK = 6
export const MAKS_KURSHISTORIKK = 240
/** Kurtasje på hver handel. */
export const KURTASJE = 0.005
/** En enkelt handel kan flytte kursen høyst så mye (i logaritmisk avvik). */
export const MAKS_KURSTRYKK = 0.15

export const PAPIRER: Record<PapirId, Papir> = {
  // ── Aksjer. Lav risiko betaler mest utbytte; høy risiko svinger mest.
  NFS: { id: 'NFS', navn: 'Nordfjord Sjømat', klasse: 'aksje', risiko: 'lav', startkurs: 180, drift: 0.02, volatilitet: 0.03, reversjon: 0.5, utbytte: 0.0007, dybde: 2e9, hopp: 0 },
  FJK: { id: 'FJK', navn: 'Fjellkraft', klasse: 'aksje', risiko: 'lav', startkurs: 95, drift: 0.015, volatilitet: 0.025, reversjon: 0.5, utbytte: 0.00085, dybde: 2e9, hopp: 0 },
  VTK: { id: 'VTK', navn: 'Vikingtelekom', klasse: 'aksje', risiko: 'lav', startkurs: 42, drift: 0.02, volatilitet: 0.035, reversjon: 0.5, utbytte: 0.0007, dybde: 1.5e9, hopp: 0 },
  BSH: { id: 'BSH', navn: 'Bergen Shipping', klasse: 'aksje', risiko: 'middels', startkurs: 260, drift: 0.03, volatilitet: 0.06, reversjon: 0.4, utbytte: 0.00035, dybde: 1e9, hopp: 0 },
  POL: { id: 'POL', navn: 'Polaris Olje', klasse: 'aksje', risiko: 'middels', startkurs: 310, drift: 0.03, volatilitet: 0.07, reversjon: 0.4, utbytte: 0.0004, dybde: 1e9, hopp: 0 },
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
}

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

function normal(t: Terning): number {
  // Box–Muller. 1 − u holder oss unna log(0).
  const u = 1 - t.neste()
  const v = t.neste()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function kursFra(fundament: number, avvik: number): number {
  return fundament * Math.exp(avvik)
}

/**
 * Ett markedstikk på en tilstand simuleringen eier: papirene, så
 * eiendomsindeksen. I helgen er børsen stengt — aksjene står stille, mens
 * kryptoen og eiendomsprisene går som før.
 */
export function markedstikk(m: Marked, t: Terning, helg = false): void {
  papirtikk(m, t, helg)
  eiendomstikk(m.eiendom, m.tikk, t)
}

function papirtikk(m: Marked, t: Terning, helg = false): void {
  m.tikk += 1
  const st = m.stemning
  m.stemning = Math.max(-1, Math.min(1, st - STEMNING_REVERSJON * st * DT + STEMNING_VOLATILITET * Math.sqrt(DT) * normal(t)))

  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    const p = PAPIRER[id]
    const k = m.kurser[id]
    // Stengt børs: kursen står, men historikken får fortsatt punkter, så grafen viser helgen som flat.
    if (!(helg && p.klasse === 'aksje')) {
      const drift = p.drift + (p.klasse === 'krypto' ? STEMNINGSKRAFT * m.stemning : 0)
      k.fundament *= Math.exp(drift * DT)
      // En selskapsnyhet prises inn litt for hvert tikk, til den er ferdig.
      if (k.nyhet) {
        const steg = k.nyhet.igjen / k.nyhet.tikk
        k.fundament *= Math.exp(steg)
        k.nyhet.igjen -= steg
        k.nyhet.tikk -= 1
        if (k.nyhet.tikk <= 0) delete k.nyhet
      }
      k.avvik += -p.reversjon * k.avvik * DT + p.volatilitet * Math.sqrt(DT) * normal(t)
      if (p.hopp > 0 && t.sjanse(p.hopp)) {
        // Hopp i stemningens retning er litt mer sannsynlige.
        const opp = t.sjanse(0.5 + 0.2 * (p.klasse === 'krypto' ? m.stemning : 0))
        k.avvik += (opp ? 1 : -1) * t.mellom(HOPP_MIN, HOPP_MAKS)
      }
      k.kurs = kursFra(k.fundament, k.avvik)
      k.topp = Math.max(k.topp ?? k.kurs, k.kurs)
      k.bunn = Math.min(k.bunn ?? k.kurs, k.kurs)
    }
    if (m.tikk % HISTORIKK_TIKK === 0) {
      k.historikk.push(k.kurs)
      if (k.historikk.length > MAKS_KURSHISTORIKK) k.historikk.shift()
    }
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

function eiendomstikk(k: Kurs, tikk: number, t: Terning): void {
  k.fundament *= Math.exp(EIENDOM.drift * DT)
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
  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    const s = PAPIRER[id].startkurs
    kurser[id] = { kurs: s, fundament: s, avvik: 0, historikk: [] }
  }
  const { indeks, frø: etterIndeks } = lagEiendomsindeks(frø)
  const marked: Marked = { tikk: 0, stemning: 0, kurser, eiendom: indeks }
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
  return { marked, frø: t.fro }
}

// ─────────────────────────────────────────────── Handel

/**
 * Hvor mye en handel på `verdi` kroner flytter kursen (logaritmisk). Positiv
 * for kjøp, negativ for salg. Taket gjør at én ordre aldri flytter mer enn ~16 %.
 */
export function kurstrykk(id: PapirId, verdi: number): number {
  const t = Math.min(MAKS_KURSTRYKK, Math.abs(verdi) / PAPIRER[id].dybde)
  return Math.sign(verdi) * t
}

/** Snittprisen du får: halvveis mellom kursen før og etter trykket. */
export function handelskurs(s: Spilltilstand, id: PapirId, antall: number): number {
  const kurs = s.marked.kurser[id].kurs
  return kurs * Math.exp(kurstrykk(id, antall * kurs) / 2)
}

/** Flytter kursen etter en handel. Muterer — brukes bare på kopier. */
export function flyttKurs(m: Marked, id: PapirId, antall: number): void {
  const k = m.kurser[id]
  k.avvik += kurstrykk(id, antall * k.kurs)
  k.kurs = kursFra(k.fundament, k.avvik)
}

/** Aksjer handles i hele stykk; krypto i brøkdeler ned til 1/10 000. */
export function rundAntall(id: PapirId, antall: number): number {
  return PAPIRER[id].klasse === 'aksje' ? Math.floor(antall) : Math.floor(antall * 10_000) / 10_000
}
