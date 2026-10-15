/**
 * Løpet direkte (Pakke 110). Et løp avgjøres ved dagsskiftet, men kjøres på skjermen gjennom
 * spilldagen som følger: 300 s blir 50 runder, én hvert sjette sekund. Plassene går fra
 * startrekkefølgen mot resultatet, depotstoppene kommer i sin runde, og de som kjørte av, går
 * ut i sin. Til målflagget viser siden tabellene slik de var før løpet.
 *
 * Alt her er pynt etter resultatet: rundene, depotstoppene, avstandene, raskeste runde og
 * årsaken til at noen kjørte av kommer fra hasher av løpet, som kamprapporten (Pakke 72), så
 * teamets terning og hvert resultat står. Ren, så den kan testes.
 */

import { DAG_SEK, dagnummer } from '../engine/kalender'
import { DELTALL, deltall, POENG, RIVALLAG, rivalbil, rivaltrinn } from '../engine/racing'
import { hashTekst, tilfeldig } from '../engine/rng'
import type { Racinglop, Racingteam, Spilltilstand } from '../engine/types'

/** Runder i et løp på skjermen: én hvert sjette sekund av spilldagen. */
export const RUNDER = 50

/** Et tall i [0, 1) fra løpet, bilen og hva det gjelder — samme svar hver gang. */
const h = (r: Racingteam, lop: Racinglop, forer: string, hva: string) => tilfeldig(hashTekst(`racinglive:${r.navn}:${lop.sesong}:${lop.runde}:${forer}:${hva}`))

/** Løpet som kjøres nå: avgjort ved dagsskiftet som startet dagen, med hele feltet. */
export function liveLop(s: Spilltilstand): Racinglop | null {
  const r = s.racing
  const lop = r?.lop.at(-1)
  return lop && lop.felt && lop.dag === dagnummer(s.sek) ? lop : null
}

/** Runden nå: 0 ved start, 50 ved målflagget (dagsskiftet). */
export function lopsrunde(sek: number): number {
  return Math.min(RUNDER, Math.floor(((sek % DAG_SEK) * RUNDER) / DAG_SEK))
}

export interface Bilforlop {
  forer: string
  lag: string
  deg: boolean
  start: number
  /** Plassen i mål, eller 0 for ute. */
  plass: number
  /** Runden bilen kjørte av, og hvorfor; null når den kom i mål. */
  uteRunde: number | null
  aarsak: string | null
  /** Runden og tiden for depotstoppet (kjørte den av før, ble det ikke noe stopp). */
  stoppRunde: number
  stopptid: number
  /** Sekunder bak vinneren, for dem som kom i mål. */
  gap: number | null
}

/** Grunnlaget for årsakene: tekniske feil og uhell, i vekter. */
const AARSAKER = [
  { navn: 'Motorfeil', vekt: 2.5, slag: 'motor' },
  { navn: 'Girkasse', vekt: 2, slag: 'teknisk' },
  { navn: 'Punktering', vekt: 1.5, slag: 'teknisk' },
  { navn: 'Krasj', vekt: 2.5, slag: 'uhell' },
  { navn: 'Kollisjon', vekt: 1.5, slag: 'uhell' },
] as const

/**
 * Hvorfor en bil kjørte av. Aggressiv kjøring og regn gir flere uhell (i regn heter krasjet
 * vannplaning), og en motor på siste trinn ryker litt oftere. Hvem som kjørte av, står som løpet
 * bestemte; det er bare årsaken som velges her.
 */
export function aarsak(u: number, aggressiv: boolean, regn: boolean, motorTopp: boolean): string {
  const vekter = AARSAKER.map((a) => a.vekt * (a.slag === 'uhell' ? (aggressiv ? 2 : 1) * (regn ? 2 : 1) : a.slag === 'motor' && motorTopp ? 1.5 : 1))
  const sum = vekter.reduce((x, y) => x + y, 0)
  let igjen = u * sum
  for (let i = 0; i < AARSAKER.length; i++) {
    igjen -= vekter[i]
    if (igjen < 0) return regn && AARSAKER[i].navn === 'Krasj' ? 'Vannplaning' : AARSAKER[i].navn
  }
  return AARSAKER[AARSAKER.length - 1].navn
}

const HUSKET = new WeakMap<Racinglop, Bilforlop[]>()

/** Hver bils løp: plass, utforkjøring med årsak, depotstopp og avstand. Husket per løp. */
export function forlop(r: Racingteam, lop: Racinglop): Bilforlop[] {
  const husket = HUSKET.get(lop)
  if (husket) return husket
  const felt = lop.felt ?? []
  const depottid = (trinn: number, forer: string) => deltall(DELTALL.depot[0], trinn) + (h(r, lop, forer, 'stopptid') - 0.5) * 0.5
  const ut: Bilforlop[] = felt.map((b) => {
    const deg = b.lag === r.navn
    const rival = deg ? null : RIVALLAG.find((l) => l.navn === b.lag)
    const bil = rival ? rivalbil(rival.navn, rival.bil, lop.sesong) : 0
    const motorTopp = deg ? (lop.motor ?? r.deler.motor) >= 5 : rivaltrinn(bil) >= 4.75
    const ute = b.plass === 0
    return {
      forer: b.forer,
      lag: b.lag,
      deg,
      start: b.start,
      plass: b.plass,
      uteRunde: ute ? 3 + Math.floor(h(r, lop, b.forer, 'ute') * 45) : null,
      aarsak: ute ? aarsak(h(r, lop, b.forer, 'aarsak'), deg && lop.strategi === 'aggressiv', !!lop.regn, motorTopp) : null,
      stoppRunde: 15 + Math.floor(h(r, lop, b.forer, 'stopp') * 21),
      stopptid: depottid(deg ? (lop.depot ?? r.deler.depot) : rivaltrinn(bil), b.forer),
      gap: null,
    }
  })
  // Avstanden til vinneren: et stykke for hver plass bak, lengre i regn.
  const imaal = ut.filter((b) => b.plass > 0).sort((a, b) => a.plass - b.plass)
  let gap = 0
  imaal.forEach((b, i) => {
    if (i > 0) gap += (0.3 + 3.7 * h(r, lop, b.forer, 'gap')) * (lop.regn ? 1.6 : 1)
    b.gap = gap
  })
  HUSKET.set(lop, ut)
  return ut
}

/** Rundetiden et raskt løp ligger på per bane, i sekunder, tørt. */
const RUNDETID: Record<string, number> = { Melbourne: 80.2, Monaco: 72.9, Silverstone: 88.5, Spa: 106.3, Monza: 81, Suzuka: 91.5, Interlagos: 71.5, 'Abu Dhabi': 86 }

/** Raskeste runde: en av de åtte første i mål, og tiden. */
export function raskesteRunde(r: Racingteam, lop: Racinglop): { forer: string; lag: string; tid: number } | null {
  const kandidater = forlop(r, lop)
    .filter((b) => b.plass > 0 && b.plass <= 8)
    .sort((a, b) => a.plass - b.plass)
  if (kandidater.length === 0) return null
  const b = kandidater[Math.floor(tilfeldig(hashTekst(`racinglive:${r.navn}:${lop.sesong}:${lop.runde}:raskest`)) * kandidater.length)]
  const tid = (RUNDETID[lop.bane] ?? 85) + (lop.regn ? 9 : 0) + h(r, lop, b.forer, 'rundetid') * 1.5
  return { forer: b.forer, lag: b.lag, tid }
}

/** «1:21,345» */
export function rundetidTekst(sek: number): string {
  const m = Math.floor(sek / 60)
  const rest = sek - m * 60
  return `${m}:${rest.toFixed(3).padStart(6, '0').replace('.', ',')}`
}

export interface Stillingsrad {
  forer: string
  lag: string
  deg: boolean
  /** 1–20 i løpet; ute-bilene står sist med plass 0. */
  plass: number
  ute: boolean
  aarsak: string | null
  iDepot: boolean
}

/**
 * Stillingen etter en runde: fra startrekkefølgen mot resultatet, med litt rot underveis,
 * et lite fall i depotrunden og bilene som har kjørt av, sist. Etter siste runde er det
 * nøyaktig resultatet.
 */
export function stillingIRunde(r: Racingteam, lop: Racinglop, runde: number): Stillingsrad[] {
  const biler = forlop(r, lop)
  const andel = Math.max(0, Math.min(1, runde / RUNDER))
  const kjorer = biler.filter((b) => b.uteRunde === null || b.uteRunde > runde)
  // Rotet glir over fem runder (et nytt mål hver femte runde), så plassene skifter som i et løp,
  // ikke hulter til bulter hver runde.
  const glatt = (b: Bilforlop) => {
    const k = Math.floor(runde / 5)
    const x = (runde % 5) / 5
    const a = h(r, lop, b.forer, `rot:${k}`)
    const c = h(r, lop, b.forer, `rot:${k + 1}`)
    return (a + (c - a) * x - 0.5) * 2
  }
  const poeng = (b: Bilforlop) => {
    if (andel >= 1) return b.plass
    const maal = b.plass > 0 ? b.plass : b.start
    const rot = 2.2 * Math.sin(Math.PI * andel) * glatt(b)
    const depot = runde === b.stoppRunde ? 3 + b.stopptid : 0
    return b.start + (maal - b.start) * andel + rot + depot
  }
  const rader: Stillingsrad[] = [...kjorer]
    .sort((a, b) => poeng(a) - poeng(b))
    .map((b, i) => ({ forer: b.forer, lag: b.lag, deg: b.deg, plass: i + 1, ute: false, aarsak: null, iDepot: runde === b.stoppRunde }))
  for (const b of biler.filter((x) => x.uteRunde !== null && x.uteRunde <= runde).sort((a, b) => a.uteRunde! - b.uteRunde!)) {
    rader.push({ forer: b.forer, lag: b.lag, deg: b.deg, plass: 0, ute: true, aarsak: b.aarsak, iDepot: false })
  }
  return rader
}

/** Teamet slik siden viser det mens løpet kjøres, med `tabellVenter` når sesongen alt er snudd. */
export type Visningsteam = Racingteam & { tabellVenter?: boolean }

/**
 * Teamet som siden skal vise mens dagens løp kjøres: uten løpet — poengene, tabellene og «Siste
 * løp» som før det. Har sesongen snudd med dette løpet, vises den gamle sesongens tabell.
 * Handlinger går fortsatt mot det ekte teamet.
 */
export function visRacing(s: Spilltilstand, r: Racingteam): Visningsteam {
  const lop = liveLop(s)
  if (!lop || !lop.felt) return r
  const snudd = lop.sesong < r.sesong
  const grunn = snudd ? (r.sisteTabell?.sesong === lop.sesong ? r.sisteTabell : null) : { lagpoeng: r.lagpoeng, forerpoeng: r.forerpoeng }
  const c: Visningsteam = { ...r, lop: r.lop.slice(0, -1) }
  if (!grunn) return { ...c, tabellVenter: true }
  const lagpoeng = { ...grunn.lagpoeng }
  const forerpoeng = { ...grunn.forerpoeng }
  for (const b of lop.felt) {
    const p = b.plass > 0 ? (POENG[b.plass - 1] ?? 0) : 0
    if (p === 0) continue
    lagpoeng[b.lag] = (lagpoeng[b.lag] ?? 0) - p
    const n = `${b.forer}|${b.lag}`
    forerpoeng[n] = (forerpoeng[n] ?? 0) - p
    if (lagpoeng[b.lag] <= 0) delete lagpoeng[b.lag]
    if (forerpoeng[n] <= 0) delete forerpoeng[n]
  }
  c.lagpoeng = lagpoeng
  c.forerpoeng = forerpoeng
  if (snudd) {
    c.sesong = lop.sesong
    c.runde = lop.runde - 1
    c.sesonger = r.sesonger.filter((x) => x.sesong !== lop.sesong)
  }
  return c
}
