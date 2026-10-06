/**
 * Regionale eiendomspriser. Landsindeksen (marked.eiendom) er grunnen; hver
 * region har i tillegg et eget avvik som svinger rundt null — så Oslo kan
 * stige mens Bergen faller, men over tid følger alle landet.
 *
 * Avvikene trekkes fra en hash av regionen og tikket, ikke fra terningen,
 * så aksjer, krypto og alt annet fra samme frø blir nøyaktig som før.
 * Alle norske byer har en region; utlandet følger landsindeksen. Trøndelag
 * og Nord kom i Pakke 44 (lagringsversjon 20), med egen hash per region, så
 * de gamle regionene og alt annet er som før.
 */

import { hashNormal, hashTekst } from './rng'
import type { By, Marked, Region, Regionindeks, Spilltilstand } from './types'

export const REGIONER: Record<Region, { navn: string; byer: By[] }> = {
  oslo: { navn: 'Oslo', byer: ['Oslo', 'Hedmarken'] },
  bergen: { navn: 'Bergen', byer: ['Bergen'] },
  stavanger: { navn: 'Stavanger', byer: ['Stavanger', 'Lista'] },
  fjellet: { navn: 'Fjellet', byer: ['Geilo', 'Trysil'] },
  trondelag: { navn: 'Trøndelag', byer: ['Trondheim', 'Namdalen'] },
  nord: { navn: 'Nord', byer: ['Lofoten'] },
}

export const REGIONLISTE = Object.keys(REGIONER) as Region[]

/** Regionen en by hører til, eller null når den følger landsindeksen. */
export function regionFor(by: By): Region | null {
  return REGIONLISTE.find((r) => REGIONER[r].byer.includes(by)) ?? null
}

/*
 * Samme tikk og tidssteg som landsindeksen (5 s, historikk hvert 6. tikk).
 * Likevektsavviket er volatilitet / √(2 · reversjon) ≈ 6 %: regionene skiller
 * seg merkbart, men aldri langt fra landet.
 */
const DT = 5 / 3600
const HISTORIKK_TIKK = 6
const MAKS_HISTORIKK = 240
const REGION = { volatilitet: 0.05, reversjon: 0.35 }

function steg(i: Regionindeks, frø: number, region: Region, tikk: number): void {
  const z = hashNormal(frø + hashTekst(region) + tikk * 2)
  i.avvik += -REGION.reversjon * i.avvik * DT + REGION.volatilitet * Math.sqrt(DT) * z
  if (tikk % HISTORIKK_TIKK === 0) {
    i.historikk.push(i.avvik)
    if (i.historikk.length > MAKS_HISTORIKK) i.historikk.shift()
  }
}

/** Ett tikk for alle regionene. Kalles rett etter landsindeksen, med samme tikknummer. Muterer. */
export function regiontikk(m: Marked): void {
  if (!m.regioner) return
  for (const r of REGIONLISTE) {
    const i = m.regioner.indekser[r]
    // En region som mangler (en lagring som ikke er migrert ennå), står på null.
    if (i) steg(i, m.regioner.frø, r, m.tikk)
  }
}

/**
 * Ferske regioner med historikk like lang som landsindeksens, så grafene og
 * fargene har noe å vise fra start. Avvikene flyttes så de står på null nå:
 * prisene i dag er de samme som før regionene fantes.
 */
export function lagRegioner(frø: number, historikkLengde: number): NonNullable<Marked['regioner']> {
  const indekser = {} as Record<Region, Regionindeks>
  for (const r of REGIONLISTE) indekser[r] = nyRegion(frø, r, historikkLengde)
  return { frø, indekser }
}

/** Én fersk region: historikk bakover i tid, og avviket på null nå, så prisene står der de sto. */
export function nyRegion(frø: number, r: Region, historikkLengde: number): Regionindeks {
  const i: Regionindeks = { avvik: 0, historikk: [] }
  for (let t = 1; t <= historikkLengde * HISTORIKK_TIKK; t++) steg(i, frø, r, -t)
  // Oppvarmingen gikk bakover i tikk; snu historikken så den eldste står først.
  i.historikk.reverse()
  const nå = i.avvik
  i.historikk = i.historikk.map((a) => a - nå).slice(-historikkLengde)
  i.avvik = 0
  return i
}

/** Hvor mye dyrere (eller billigere) en by er enn landet akkurat nå: e^avvik. */
export function byfaktor(s: Spilltilstand, by: By): number {
  const r = regionFor(by)
  const i = r ? s.marked.regioner?.indekser[r] : undefined
  return i ? Math.exp(i.avvik) : 1
}

/** Eiendomsindeksen for en by: landet ganger regionens avvik. */
export function eiendomskurs(s: Spilltilstand, by: By): number {
  return s.marked.eiendom.kurs * byfaktor(s, by)
}

/** Prisendringen i en region (eller hele landet med null) over historikken som vises — de siste to timene. */
export function regionEndring(s: Spilltilstand, region: Region | null): number {
  const land = s.marked.eiendom
  if (!land.historikk.length) return 0
  const i = region ? s.marked.regioner?.indekser[region] : undefined
  const før = land.historikk[0] * (i?.historikk.length ? Math.exp(i.historikk[0]) : 1)
  const nå = land.kurs * (i ? Math.exp(i.avvik) : 1)
  return nå / før - 1
}
