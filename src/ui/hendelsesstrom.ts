/**
 * Hendelsesstrømmen: sammenligner forrige og ny spilltilstand og finner det
 * som er nytt — hendelser (trofeer og opprykk er også hendelser),
 * prestasjoner og avisutgaver. Ren
 * funksjon, så den kan testes uten nettleser. Appen gjør funnene om til
 * varsler.
 */

import { EIENDOMSTYPER, LUKSUS } from '../engine/eiendom'
import { hjemFor, ROM, ROMLISTE, romtrinn } from '../engine/hjemmene'
import { romkodeFor } from './romkode'
import { BEDRIFTSTYPER } from '../engine/innhold'
import { PRESTASJONER } from '../engine/prestasjoner'
import { FUSJONSFAKTOR } from '../engine/fusjon'
import { JORD } from '../engine/jord'
import { LANDEMERKER } from '../engine/landemerker'
import { MALERIER } from '../engine/kunst'
import { ide } from '../engine/startups'
import type { BedriftstypeId, EiendomId, Hendelse, JordId, LandemerkeId, MaleriId, Spilltilstand } from '../engine/types'
import { FANE_AAPNER, faneAapen } from './progresjon'
import type { Fane } from './komponenter/Fanemeny'
import { dagnummer } from '../engine/kalender'
import type { Kamp, Klubb, Maalhendelse } from '../engine/types'
import { kampminutt, stilling } from './klubblive'

/**
 * Et kjøp som fortjener et øyeblikk: første bedrift av en type, første
 * eiendom av en type, en luksusting, en gård eller skog, et landemerke, et
 * maleri, fotballklubben, første andel i en startup — eller en fusjon med en
 * rivals bedrift. For klubben er `id` klubbens navn (våpenet tegnes fra
 * det), for en startup selskapets navn (logoen er nøklet på det).
 */
export type Kjopsart = 'bedrift' | 'eiendom' | 'luksus' | 'jord' | 'landemerke' | 'maleri' | 'klubb' | 'startup' | 'fusjon' | 'hjem'

export type Nytt =
  | { type: 'hendelse'; hendelse: Hendelse }
  | { type: 'prestasjon'; id: string; navn: string; skjult?: boolean }
  | { type: 'avis'; dag: number }
  | { type: 'kjop'; art: Kjopsart; id: string; navn: string }
  | { type: 'fusjon'; id: BedriftstypeId; navn: string; faktor: number }
  | { type: 'fane'; fane: Fane }
  /** Pakke 86: et mål i kampen som spilles nå, og fløyta. */
  | { type: 'maal'; tittel: string; tekst: string; egne: boolean }
  | { type: 'slutt'; tittel: string; tekst: string }

/** Hvor stor feiringen er: et lite drys, gullblink og konfetti, eller milliarden. */
export type Feiringsniva = 'liten' | 'stor' | 'milliard'

export interface Feiringsdata {
  tekst: string
  niva: Feiringsniva
}

/**
 * Formuemilepælene som feires. Millionen er den store; nullene mellom får et
 * lite drys, og milliarden — målet — får sin egen.
 */
export const FEIRES: Record<string, Feiringsdata> = {
  'fem-sifre': { tekst: 'kr 10 000', niva: 'liten' },
  sekssifret: { tekst: 'kr 100 000', niva: 'liten' },
  millionaer: { tekst: 'Millionær', niva: 'stor' },
  'ti-mill': { tekst: 'kr 10 mill', niva: 'liten' },
  'hundre-mill': { tekst: 'kr 100 mill', niva: 'liten' },
  milliardaer: { tekst: 'MILLIARDÆR!', niva: 'milliard' },
  'ti-mrd': { tekst: 'kr 10 mrd', niva: 'liten' },
  'hundre-mrd': { tekst: 'kr 100 mrd', niva: 'liten' },
  billionaer: { tekst: 'BILLIONÆR!', niva: 'milliard' },
}

const RANG: Record<Feiringsniva, number> = { liten: 0, stor: 1, milliard: 2 }

/** Kommer flere milepæler på en gang (etter tid borte), feires bare den største. */
export function stoersteFeiring(funn: Nytt[]): Feiringsdata | null {
  let beste: Feiringsdata | null = null
  for (const f of funn) {
    const d = f.type === 'prestasjon' ? FEIRES[f.id] : undefined
    if (d && (!beste || RANG[d.niva] >= RANG[beste.niva])) beste = d
  }
  return beste
}

const nokkel = (h: Hendelse) => `${h.sek}|${h.tittel}|${h.tekst}`

export function nytt(før: Spilltilstand, etter: Spilltilstand): Nytt[] {
  const funn: Nytt[] = []
  const kjente = new Set((før.hendelser ?? []).map(nokkel))
  for (const h of etter.hendelser ?? []) {
    if (!kjente.has(nokkel(h))) funn.push({ type: 'hendelse', hendelse: h })
  }
  for (const p of PRESTASJONER) {
    if (etter.prestasjoner[p.id] !== undefined && før.prestasjoner[p.id] === undefined) {
      funn.push({ type: 'prestasjon', id: p.id, navn: p.navn, skjult: p.skjult })
    }
  }
  const hadde = new Set(før.bedrifter.map((b) => b.type))
  for (const b of etter.bedrifter) {
    if (!hadde.has(b.type)) {
      hadde.add(b.type)
      funn.push({ type: 'kjop', art: 'bedrift', id: b.type, navn: BEDRIFTSTYPER[b.type].navn })
    }
  }
  for (const id of Object.keys(etter.eiendommer) as EiendomId[]) {
    if ((etter.eiendommer[id] ?? 0) > 0 && (før.eiendommer[id] ?? 0) === 0) {
      funn.push({ type: 'kjop', art: 'eiendom', id, navn: EIENDOMSTYPER[id].navn })
    }
  }
  // En bedrift som har fått flere fusjoner — ved bud, motbud eller oppkjøp av rivalen.
  for (const b of etter.bedrifter) {
    const f = før.bedrifter.find((x) => x.id === b.id)
    const nye = (b.fusjoner ?? 0) - (f?.fusjoner ?? 0)
    if (f && nye > 0) funn.push({ type: 'fusjon', id: b.type, navn: BEDRIFTSTYPER[b.type].navn, faktor: FUSJONSFAKTOR ** nye })
  }
  for (const id of etter.luksus) {
    if (!før.luksus.includes(id)) funn.push({ type: 'kjop', art: 'luksus', id, navn: LUKSUS[id].navn })
  }
  // Grafikkpakke G11: alt annet du kjøper, får også et øyeblikk.
  for (const id of Object.keys(etter.jord ?? {}) as JordId[]) {
    if (etter.jord[id] && !før.jord?.[id]) funn.push({ type: 'kjop', art: 'jord', id, navn: JORD[id].navn })
  }
  for (const id of Object.keys(etter.landemerker ?? {}) as LandemerkeId[]) {
    if (etter.landemerker[id]?.eier === 'deg' && før.landemerker?.[id]?.eier !== 'deg') {
      funn.push({ type: 'kjop', art: 'landemerke', id, navn: LANDEMERKER[id].navn })
    }
  }
  for (const id of Object.keys(etter.kunst?.eide ?? {}) as MaleriId[]) {
    if (etter.kunst.eide[id] && !før.kunst?.eide[id]) funn.push({ type: 'kjop', art: 'maleri', id, navn: MALERIER[id].navn })
  }
  if (etter.klubb && etter.klubb.navn !== før.klubb?.navn) funn.push({ type: 'kjop', art: 'klubb', id: etter.klubb.navn, navn: etter.klubb.navn })
  for (const st of etter.startups ?? []) {
    const fra = før.startups?.find((x) => x.id === st.id)
    if (st.andel > 0 && !(fra && fra.andel > 0)) funn.push({ type: 'kjop', art: 'startup', id: ide(st).navn, navn: ide(st).navn })
  }
  // Grafikkpakke G16: et rom som er innredet et trinn til. `id` er hjemmet, rommet og
  // hvordan hjemmet står nå (`romkode`), så øyeblikket viser hjemmet slik det ble.
  for (const rom of ROMLISTE) {
    const til = romtrinn(etter, rom)
    if (til > romtrinn(før, rom)) {
      const hjem = hjemFor(rom)
      funn.push({ type: 'kjop', art: 'hjem', id: `${hjem}:${rom}:${romkodeFor(etter, hjem)}`, navn: ROM[rom].trinn[til - 1].navn })
    }
  }
  // En fane som har åpnet seg (Pakke 40).
  for (const f of Object.keys(FANE_AAPNER) as Fane[]) {
    if (FANE_AAPNER[f] > 0 && faneAapen(etter, f) && !faneAapen(før, f)) funn.push({ type: 'fane', fane: f })
  }
  const forrigeUtgave = før.avis.at(-1)?.dag ?? -1
  const nyUtgave = etter.avis.at(-1)?.dag ?? -1
  if (nyUtgave > forrigeUtgave) funn.push({ type: 'avis', dag: nyUtgave })
  funn.push(...kampfunn(før, etter))
  return funn
}

/** Så lang tid kan gå mellom to tilstander før målene ikke meldes ett for ett (tid borte har velkomsten). */
const LEVENDE_SEK = 10

/** «Fjordby IL 2–1 Øyrane IL» etter `minutt`. */
function stillingstekst(k: Klubb, m: Kamp, minutt: number): string {
  const st = stilling(m, minutt)
  return m.hjemme ? `${k.navn} ${st.for}–${st.mot} ${m.motstander}` : `${m.motstander} ${st.mot}–${st.for} ${k.navn}`
}

function maalfunn(k: Klubb, m: Kamp, x: Maalhendelse): Nytt {
  const navn = x.navn.split(' ').at(-1)
  return {
    type: 'maal',
    egne: !x.mot,
    tittel: x.mot ? `Mål mot: ${navn}, ${x.minutt}. min` : `MÅL! ${navn}, ${x.minutt}. min`,
    tekst: stillingstekst(k, m, x.minutt),
  }
}

/**
 * Pakke 86: målene i kampen som spilles nå, i sitt minutt, og fløyta ved dagsskiftet.
 * Målene meldes bare i levende spill; fløyta alltid.
 */
function kampfunn(før: Spilltilstand, etter: Spilltilstand): Nytt[] {
  const k = etter.klubb
  if (!k || !før.klubb || før.klubb.navn !== k.navn) return []
  const ut: Nytt[] = []
  const levende = etter.sek - før.sek <= LEVENDE_SEK
  const dagF = dagnummer(før.sek)
  const dagE = dagnummer(etter.sek)
  const fra = kampminutt(før.sek)
  // Kampene som var i gang, og som er ferdige nå: resten av målene, så fløyta.
  if (dagE > dagF) {
    for (const m of k.kamper.filter((x) => x.dag === dagF)) {
      if (levende) for (const x of m.maal ?? []) if (x.minutt > fra) ut.push(maalfunn(k, m, x))
      const utfall = m.maalFor > m.maalMot || m.straffer === 'deg' ? 'Seier' : m.maalFor < m.maalMot || m.straffer === 'dem' ? 'Tap' : 'Uavgjort'
      ut.push({ type: 'slutt', tittel: `Slutt: ${utfall}${m.straffer ? ' på straffer' : ''}`, tekst: stillingstekst(k, m, 90) })
    }
  }
  if (levende) {
    const start = dagE > dagF ? 0 : fra
    const til = kampminutt(etter.sek)
    for (const m of k.kamper.filter((x) => x.dag === dagE)) for (const x of m.maal ?? []) if (x.minutt > start && x.minutt <= til) ut.push(maalfunn(k, m, x))
  }
  return ut
}

/** Flere funn enn dette på én gang (typisk etter tid borte) blir til ett oppsummeringsvarsel. */
export const MAKS_ENKELTVARSLER = 4
