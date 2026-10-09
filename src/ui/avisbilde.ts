/**
 * Avisas bilder og seksjoner: hver sak får en liten tegning etter hva den
 * handler om — en rival, et papir, en bedrift, en luksusting, et landemerke,
 * en kamp, klubben, et maleri, en startup eller et tema — og en seksjon over
 * overskriften. Ut fra teksten i saken, så gamle utgaver får bilder også;
 * bare maleriet og spilleren som legger opp ser på hva du eier nå. Ren
 * funksjon, så den kan testes.
 */

import { START_RIVALER } from '../engine/rivaler'
import { PAPIRER } from '../engine/marked'
import { BEDRIFTSTYPER } from '../engine/innhold'
import { LUKSUS } from '../engine/eiendom'
import { LANDEMERKER } from '../engine/landemerker'
import { KUNSTNERE, MALERIER, MALERILISTE } from '../engine/kunst'
import { STARTUP_IDEER } from '../engine/startups'
import type { MaleriId, Overskrift, PapirId, Spilltilstand } from '../engine/types'
import type { Ikonnavn } from './komponenter/Ikoner'

export type Avisbilde =
  | { art: 'rival'; id: string }
  | { art: 'papir'; id: PapirId }
  | { art: 'tegning'; id: string }
  | { art: 'ikon'; navn: Ikonnavn }
  /** En kamp (G11): begge lagenes våpen, hjemmelaget til venstre. */
  | { art: 'kamp'; hjemme: string; borte: string }
  /** Klubbens våpen: opprykk, nedrykk, en spiller som legger opp — og med pokal når serien er vunnet. */
  | { art: 'klubb'; navn: string; pokal?: boolean }
  | { art: 'maleri'; id: MaleriId }
  /** Startupens logo; en konkurs trykkes i grått. */
  | { art: 'startup'; navn: string; konkurs?: boolean }

/** Det avisa trenger å vite om deg for to av bildene. */
export interface Avisbakgrunn {
  /** Klubben du eier nå — saken om en spiller som legger opp, nevner den ikke. */
  klubb?: string
  /** Maleriene du eier — en utstilling viser ditt dyreste av kunstnerens verk. */
  malerier?: readonly MaleriId[]
}

const KAMP = /^(.+) (\d+)–(\d+) (.+)$/
const STARTUPSAK = /^(.+) (søker penger|er konkurs|kjøpt opp|til børs)$/
const STARTUPNAVN = new Set(STARTUP_IDEER.map((i) => i.navn))

/** Kunstnerens dyreste verk blant dem du eier, ellers kunstnerens dyreste. */
function utstillingsbilde(kunstner: string, eide: readonly MaleriId[] = []): MaleriId | null {
  const verk = MALERILISTE.filter((id) => KUNSTNERE[MALERIER[id].kunstner].navn === kunstner).sort(
    (a, b) => MALERIER[b].startpris - MALERIER[a].startpris,
  )
  return verk.find((id) => eide.includes(id)) ?? verk[0] ?? null
}

/** Saker om klubben, kampene og kunsten — mønstrene er så presise at de går foran rivalenes etternavn. */
function egenSak(tittel: string, b: Avisbakgrunn): Avisbilde | null {
  const kamp = KAMP.exec(tittel)
  if (kamp) return { art: 'kamp', hjemme: kamp[1], borte: kamp[4] }
  const opp = /^OPPRYKK: (.+) til /.exec(tittel) ?? /^Nedrykk for (.+)$/.exec(tittel)
  if (opp) return { art: 'klubb', navn: opp[1] }
  const vinner = /^(.+) vinner .+!$/.exec(tittel)
  if (vinner) return { art: 'klubb', navn: vinner[1], pokal: true }
  if (/ legger opp$/.test(tittel)) return b.klubb ? { art: 'klubb', navn: b.klubb } : { art: 'ikon', navn: 'ball' }
  const utstilling = /^Stor utstilling for (.+)$/.exec(tittel)
  const verk = utstilling && utstillingsbilde(utstilling[1], b.malerier)
  if (verk) return { art: 'maleri', id: verk }
  const st = STARTUPSAK.exec(tittel)
  if (st && STARTUPNAVN.has(st[1])) return { art: 'startup', navn: st[1], konkurs: st[2] === 'er konkurs' || undefined }
  return null
}

/** Hele ordet, ikke en del av et annet («Aas» skal ikke treffe «Aasen»). */
function harOrd(tekst: string, ord: string): boolean {
  const i = tekst.indexOf(ord)
  if (i < 0) return false
  const før = tekst[i - 1]
  const etter = tekst[i + ord.length]
  const bokstav = /[\p{L}\p{N}]/u
  return !(før && bokstav.test(før)) && !(etter && bokstav.test(etter))
}

const SPORT = /OPPRYKK|Nedrykk|divisjon|Eliteserien|legger opp|\d+–\d+/
const FOLK = /^Spottet|premiere|sett på|Fest på|båttur|fløy privat|superbil på|tar helg|gir millionbeløp/

const TEMA: [RegExp, Ikonnavn][] = [
  [SPORT, 'ball'],
  [/vinner .*!|seriegull/, 'trofe'],
  [/[Ss]katt/, 'kvittering'],
  [/MILLIARDÆR|millionær/, 'krone'],
  [/Forbes|går forbi| forbi /, 'stolper'],
  [/[Bb]olig|BOLIGKRAKK/, 'hus'],
  [/[Kk]rypto/, 'mynt'],
  [/på gårdene|[Aa]vling/, 'aks'],
  [/[Uu]tstilling|[Mm]aleri/, 'ramme'],
  [/søker penger|er konkurs|til børs|kjøpt opp/, 'gnist'],
  [/legger frem tall|[Kk]vartal/, 'graf'],
  [/[Rr]enten|Sentralbanken|[Bb]anken/, 'bank'],
  [/tvangsselger/, 'advarsel'],
]

/** Bildet til en sak, eller null når ingenting passer (lokalsakene står gjerne uten). */
export function avisbilde(sak: Overskrift, bakgrunn: Avisbakgrunn = {}): Avisbilde | null {
  const egen = egenSak(sak.tittel, bakgrunn)
  if (egen) return egen
  const t = `${sak.tittel} ${sak.tekst}`
  for (const r of START_RIVALER) {
    const etternavn = r.navn.split(' ').at(-1)!
    if (t.includes(r.navn) || t.includes(r.selskap) || harOrd(sak.tittel, etternavn)) return { art: 'rival', id: r.id }
  }
  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    if (harOrd(sak.tittel, PAPIRER[id].navn)) return { art: 'papir', id }
  }
  for (const [id, b] of Object.entries(BEDRIFTSTYPER)) {
    if (harOrd(sak.tittel, b.navn)) return { art: 'tegning', id }
  }
  const liten = sak.tittel.toLowerCase()
  for (const [id, l] of Object.entries(LUKSUS)) {
    if (harOrd(liten, l.navn.toLowerCase())) return { art: 'tegning', id }
  }
  for (const [id, l] of Object.entries(LANDEMERKER)) {
    if (harOrd(sak.tittel, l.navn)) return { art: 'tegning', id }
  }
  for (const [mønster, navn] of TEMA) if (mønster.test(t)) return { art: 'ikon', navn }
  if (sak.type === 'marked') return { art: 'ikon', navn: 'graf' }
  return null
}

/** Seksjonen over overskriften, som i en ekte avis. */
export function seksjon(sak: Overskrift): string {
  if (SPORT.test(sak.tittel)) return 'Sport'
  if (sak.type === 'marked') return 'Børs'
  if (sak.type === 'lokalt') return 'Lokalt'
  if (FOLK.test(sak.tittel)) return 'Folk'
  if (/[Ss]katt/.test(sak.tittel)) return 'Skatt'
  return 'Næringsliv'
}

export interface Borsbevegelse {
  id: PapirId
  kurs: number
  endring: number
}

/**
 * Børslinja under avishodet: aksjene som beveget seg mest fra nest siste
 * til siste sluttkurs. Tom før det finnes to sluttkurser.
 */
export function borslinje(s: Spilltilstand, antall = 4): Borsbevegelse[] {
  const ut: Borsbevegelse[] = []
  for (const id of Object.keys(PAPIRER) as PapirId[]) {
    if (PAPIRER[id].klasse !== 'aksje') continue
    const d = s.marked.kurser[id]?.dagslutt ?? []
    if (d.length < 2) continue
    ut.push({ id, kurs: d[d.length - 1], endring: d[d.length - 1] / d[d.length - 2] - 1 })
  }
  return ut.sort((a, b) => Math.abs(b.endring) - Math.abs(a.endring)).slice(0, antall)
}
