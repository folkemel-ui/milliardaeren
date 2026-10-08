/**
 * Pakke 49 — verden går rundt: konjunkturer med styringsrente, og en kalender
 * som betyr noe for bedriftene (ukedager, vær, helligdager og bransjetrender).
 *
 * Alt trekkes fra hasher av dagen (eller perioden), aldri fra terningen:
 * svaret er det samme hver gang, kan vises på forhånd, og forskyver ikke noe
 * annet. Verden er den samme i alle spill, som været på gårdene — 17. mai er
 * 17. mai for alle. Faktorene for en dag regnes én gang og huskes.
 *
 * Ukedagene, været og trendene jevner seg ut: over en uke eller en sesong er
 * snittet ×1 for hver bransje. Helligdagene er rene bonuser.
 */

import { STIGEN } from './innhold'
import { dagFra, dagnummer, dato, ukedag } from './kalender'
import { Hashkilde, hashTekst } from './rng'
import type { BedriftstypeId, EiendomId, Overskrift, Spilltilstand } from './types'

/**
 * Frøet for verden. Det samme i alle spill: et frø fra spillet (regionene) ble
 * prøvd, men da endret konjunkturen seg når en test fjernet regionene. Står
 * her så verden kan gis et eget frø per spill senere uten å endre kallene.
 */
function grunnfrø(_s: Spilltilstand): number {
  return 0
}

function kilde(s: Spilltilstand, nøkkel: string): Hashkilde {
  return new Hashkilde((grunnfrø(s) + hashTekst(nøkkel)) | 0)
}

// ─────────────────────────────────────────────── Konjunkturen

export type Fase = 'hoy' | 'normal' | 'lav'

/** En fase varer så mange spilldager: fire spilluker, rundt to timer og tjue minutter. */
export const FASE_DAGER = 28

/** Styringsrenten i normale tider. Lånerenten i spillet (RENTE_PER_TIME) svarer til den. */
export const NORMAL_STYRINGSRENTE = 4

export const FASER: Record<Fase, { navn: string; aksjer: number; eiendom: number; styringsrente: number }> = {
  hoy: { navn: 'Høykonjunktur', aksjer: 0.03, eiendom: 0.01, styringsrente: 5 },
  normal: { navn: 'Normale tider', aksjer: 0, eiendom: 0, styringsrente: NORMAL_STYRINGSRENTE },
  lav: { navn: 'Lavkonjunktur', aksjer: -0.04, eiendom: -0.015, styringsrente: 2.5 },
}

/** Perioden en spilldag hører til. */
export const periode = (dag: number) => Math.floor(dag / FASE_DAGER)

/** Fasen i en periode: høy 25 %, normal 50 %, lav 25 %. Spillet starter i normale tider. */
export function faseI(s: Spilltilstand, p: number): Fase {
  if (p <= 0) return 'normal'
  const u = kilde(s, `konjunktur:${p}`).neste()
  return u < 0.25 ? 'hoy' : u >= 0.75 ? 'lav' : 'normal'
}

export function fase(s: Spilltilstand): Fase {
  // Renten spør hvert sekund; fasen skifter bare hver FASE_DAGER. Husk siste svar.
  const p = periode(dagnummer(s.sek))
  if (p !== sistePeriode) {
    sistePeriode = p
    sisteFase = faseI(s, p)
  }
  return sisteFase
}
let sistePeriode = NaN
let sisteFase: Fase = 'normal'

export function styringsrente(s: Spilltilstand): number {
  return FASER[fase(s)].styringsrente
}

/** Ekstra drift per time for aksjene og eiendomsprisene i fasen som gjelder nå. */
export function konjunkturdrift(s: Spilltilstand): { aksjer: number; eiendom: number } {
  const f = FASER[fase(s)]
  return { aksjer: f.aksjer, eiendom: f.eiendom }
}

/** Fastrenten koster så mange prosentpoeng (i styringsrente) mer enn den flytende … */
export const FAST_PAASLAG = 0.5
/** … og er bundet så mange spilldager: én fase. */
export const BINDING_DAGER = FASE_DAGER

/** Dager igjen av fasen som gjelder nå. */
export function dagerIgjenAvFasen(s: Spilltilstand): number {
  const dag = dagnummer(s.sek)
  return (periode(dag) + 1) * FASE_DAGER - dag
}

// ─────────────────────────────────────────────── Ukedagene

/**
 * Restauranter og hoteller tjener mest i helgen, bankene og kafeene på
 * hverdager. Fem hverdager og to helgedager gir snittet ×1.
 */
const UKEDAG: Partial<Record<BedriftstypeId, { hverdag: number; helg: number }>> = {
  restaurant: { hverdag: 0.88, helg: 1.3 },
  hotell: { hverdag: 0.88, helg: 1.3 },
  bank: { hverdag: 1.1, helg: 0.75 },
  kafe: { hverdag: 1.05, helg: 0.875 },
}

// ─────────────────────────────────────────────── Været

export type Vaertype = 'sol' | 'overskyet' | 'regn' | 'sno'

export const VAERTYPER: Record<Vaertype, { navn: string }> = {
  sol: { navn: 'Sol' },
  overskyet: { navn: 'Overskyet' },
  regn: { navn: 'Regn' },
  sno: { navn: 'Snø' },
}

type Sesong = 'vinter' | 'vaar' | 'sommer' | 'host'

/** Sesongen for en måned (0 = januar). */
function sesongFor(maaned: number): Sesong {
  if (maaned === 11 || maaned <= 1) return 'vinter'
  if (maaned <= 4) return 'vaar'
  if (maaned <= 7) return 'sommer'
  return 'host'
}

/** Sjansen for hver værtype i hver sesong. */
const VAERSJANSE: Record<Sesong, Record<Vaertype, number>> = {
  vinter: { sol: 0.2, overskyet: 0.3, regn: 0.1, sno: 0.4 },
  vaar: { sol: 0.35, overskyet: 0.35, regn: 0.25, sno: 0.05 },
  sommer: { sol: 0.5, overskyet: 0.3, regn: 0.2, sno: 0 },
  host: { sol: 0.2, overskyet: 0.4, regn: 0.35, sno: 0.05 },
}

/** Hvor mye været betyr for de bransjene som merker det — før snittet jevnes til ×1. */
const VAERVIRKNING: Partial<Record<BedriftstypeId, Record<Vaertype, number>>> = {
  saftbod: { sol: 1.4, overskyet: 1, regn: 0.6, sno: 0.5 },
  skisenter: { sol: 1.1, overskyet: 1, regn: 0.6, sno: 1.4 },
}

/** Snittet av virkningen i en sesong, så hver sesong i snitt gir ×1. */
function vaersnitt(type: BedriftstypeId, sesong: Sesong): number {
  const v = VAERVIRKNING[type]!
  let sum = 0
  for (const [vaer, p] of Object.entries(VAERSJANSE[sesong]) as [Vaertype, number][]) sum += p * v[vaer]
  return sum
}

/** Været en spilldag, for hele landet. */
export function dagensVaer(_s: Spilltilstand, dag = dagnummer(_s.sek)): Vaertype {
  return vaerPaaDag(dag, 'norge')
}

/**
 * Været et sted (Pakke 54): Norge, Alpene (Zermatt) eller Syden (Marbella),
 * hvert med sine sesonger. Norge bruker samme nøkkel som i Pakke 49, så
 * været der er det samme som før.
 */
export type Vaersted = 'norge' | 'alpene' | 'syden'

const STEDSJANSE: Record<Exclude<Vaersted, 'norge'>, Record<Sesong, Record<Vaertype, number>>> = {
  alpene: {
    vinter: { sol: 0.3, overskyet: 0.15, regn: 0, sno: 0.55 },
    vaar: { sol: 0.4, overskyet: 0.25, regn: 0.1, sno: 0.25 },
    sommer: { sol: 0.5, overskyet: 0.3, regn: 0.2, sno: 0 },
    host: { sol: 0.3, overskyet: 0.35, regn: 0.25, sno: 0.1 },
  },
  syden: {
    vinter: { sol: 0.55, overskyet: 0.3, regn: 0.15, sno: 0 },
    vaar: { sol: 0.65, overskyet: 0.25, regn: 0.1, sno: 0 },
    sommer: { sol: 0.9, overskyet: 0.1, regn: 0, sno: 0 },
    host: { sol: 0.6, overskyet: 0.25, regn: 0.15, sno: 0 },
  },
}

const sjanserFor = (sted: Vaersted, sesong: Sesong) => (sted === 'norge' ? VAERSJANSE[sesong] : STEDSJANSE[sted][sesong])

export function vaerPaaDag(dag: number, sted: Vaersted = 'norge'): Vaertype {
  const sjanser = sjanserFor(sted, sesongFor(dato(dag).maaned))
  const nøkkel = sted === 'norge' ? `dagsvær:${dag}` : `dagsvær:${sted}:${dag}`
  let u = new Hashkilde(hashTekst(nøkkel) | 0).neste()
  for (const [vaer, p] of Object.entries(sjanser) as [Vaertype, number][]) {
    if (u < p) return vaer
    u -= p
  }
  return 'overskyet'
}

/**
 * Virkningen av været, jevnet ut så hver sesong i snitt gir ×1 på stedet:
 * en solrik dag i Marbella om sommeren er vanlig og gir lite ekstra.
 */
export function jevnetVaer(virkning: Record<Vaertype, number>, sted: Vaersted, dag: number): number {
  const sjanser = sjanserFor(sted, sesongFor(dato(dag).maaned))
  let snitt = 0
  for (const [v, p] of Object.entries(sjanser) as [Vaertype, number][]) snitt += p * virkning[v]
  return virkning[vaerPaaDag(dag, sted)] / snitt
}

/**
 * Eiendom som merker været (Pakke 54): hyttene vil ha snø, rorbuene og øya i
 * Lofoten sol, Zermatt snø i Alpene og Marbella sol i Syden. Oppå sesongene
 * fra Pakke 45, og i snitt ×1 per sesong.
 */
const SNOHYTTE: Record<Vaertype, number> = { sno: 1.4, sol: 1.1, overskyet: 1, regn: 0.7 }
const SOLSTED: Record<Vaertype, number> = { sol: 1.3, overskyet: 1, regn: 0.7, sno: 0.8 }
export const EIENDOMSVAER: Partial<Record<EiendomId, { sted: Vaersted; virkning: Record<Vaertype, number> }>> = {
  hytte: { sted: 'norge', virkning: SNOHYTTE },
  'hytte-trysil': { sted: 'norge', virkning: SNOHYTTE },
  'hytte-lofoten': { sted: 'norge', virkning: SOLSTED },
  oy: { sted: 'norge', virkning: SOLSTED },
  'zermatt-leilighet': { sted: 'alpene', virkning: SNOHYTTE },
  'zermatt-hotell': { sted: 'alpene', virkning: SNOHYTTE },
  'marbella-leilighet': { sted: 'syden', virkning: SOLSTED },
  'marbella-hotell': { sted: 'syden', virkning: SOLSTED },
}

// ─────────────────────────────────────────────── Bransjetrender

/** Ukas trend: én bransje er het (+20 %) og én kald (−20 %), hver med sjanse 50 %. */
export const TREND = 0.2

export interface Trend {
  het: BedriftstypeId | null
  kald: BedriftstypeId | null
}

/** Spilluka en dag hører til (en uke er sju spilldager, fra mandag). */
export const spilluke = (dag: number) => Math.floor(dag / 7)

export function ukensTrend(s: Spilltilstand, dag = dagnummer(s.sek)): Trend {
  const h = kilde(s, `trend:${spilluke(dag)}`)
  const het = h.sjanse(0.5) ? STIGEN[Math.floor(h.neste() * STIGEN.length)] : null
  let kald: BedriftstypeId | null = h.sjanse(0.5) ? STIGEN[Math.floor(h.neste() * STIGEN.length)] : null
  if (kald === het) kald = null
  return { het, kald }
}

/** Overskriftene når en bransje er het eller kald. */
export const TRENDTEKST: Record<BedriftstypeId, { het: string; kald: string }> = {
  saftbod: { het: 'Saft er tilbake på menyen', kald: 'Barna vil heller ha brus' },
  polsebod: { het: 'Pølsa er årets comeback', kald: 'Veganbølgen når pølsebodene' },
  gatekjokken: { het: 'Køene vokser utenfor gatekjøkkenene', kald: 'Byen spiser hjemme denne uka' },
  kiosk: { het: 'Kioskene melder rekordsalg', kald: 'Dagligvarekjedene tar kioskkundene' },
  kafe: { het: 'Kaffe er det nye svarte', kald: 'Hjemmekontoret tømmer kafeene' },
  restaurant: { het: 'Alle vil ut og spise', kald: 'Restaurantene melder om tomme bord' },
  hotell: { het: 'Hotellene er fullbooket', kald: 'Turistene uteblir' },
  bank: { het: 'Bankene tjener på boligfesten', kald: 'Bankene strammer inn' },
  oljeselskap: { het: 'Oljeprisen stiger', kald: 'Oljeprisen faller' },
  rederi: { het: 'Fraktratene skyter i været', kald: 'Skipene ligger i opplag' },
  fiskeoppdrett: { het: 'Laksen gir rekordpris', kald: 'Lakseprisen stuper' },
  flyselskap: { het: 'Nordmenn flyr som aldri før', kald: 'Flyskam rammer setebelegget' },
  skisenter: { het: 'Skiferien er booket ut', kald: 'Skisesongen skuffer' },
}

// ─────────────────────────────────────────────── Helligdagene

export interface Helligdag {
  navn: string
  tekst: string
  /** Inntekten for disse bransjene ganges med dette. Alle over 1: helligdagene er bonuser. */
  virkning: Partial<Record<BedriftstypeId, number>>
}

const PAASKE: Helligdag = {
  navn: 'Påske',
  tekst: 'Halve landet er på fjellet. Skisentrene og hotellene har fullt hus.',
  virkning: { skisenter: 2, hotell: 1.3 },
}
const SYTTENDE_MAI: Helligdag = {
  navn: '17. mai',
  tekst: 'Hurra! Barnetog, is og pølser. Pølsebodene selger tre ganger så mye som en vanlig dag.',
  virkning: { polsebod: 3, saftbod: 1.5, kiosk: 1.5, restaurant: 1.2 },
}
const JUL: Helligdag = {
  navn: 'Jul',
  tekst: 'God jul! Restaurantene serverer ribbe, og hyttene i fjellet er fulle.',
  virkning: { restaurant: 1.5, hotell: 1.3, kiosk: 1.3, skisenter: 1.5 },
}
const NYTTAAR: Helligdag = {
  navn: 'Nyttårsaften',
  tekst: 'Raketter, champagne og bord for seks. Godt nytt år!',
  virkning: { restaurant: 1.5, kiosk: 1.3 },
}

/** Første påskedag (gregoriansk, «anonym» algoritme). Gir måned (0 = januar) og dag. */
export function paaskedag(aar: number): { maaned: number; dag: number } {
  const a = aar % 19
  const b = Math.floor(aar / 100)
  const c = aar % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const maaned = Math.floor((h + l - 7 * m + 114) / 31)
  const dag = ((h + l - 7 * m + 114) % 31) + 1
  return { maaned: maaned - 1, dag }
}

/** Helligdagen en spilldag er, eller null. Påsken er skjærtorsdag til andre påskedag. */
export function helligdag(dag: number): Helligdag | null {
  const d = dato(dag)
  if (d.maaned === 4 && d.dag === 17) return SYTTENDE_MAI
  if (d.maaned === 11 && d.dag >= 24 && d.dag <= 26) return JUL
  if (d.maaned === 11 && d.dag === 31) return NYTTAAR
  const p = paaskedag(d.aar)
  const forste = dagFra(d.aar, p.maaned, p.dag)
  if (dag >= forste - 3 && dag <= forste + 1) return PAASKE
  return null
}

// ─────────────────────────────────────────────── Dagens faktor per bransje

export interface Kalenderdag {
  dag: number
  vaer: Vaertype
  /** Været i Alpene og Syden (Pakke 54). */
  vaerUte: Record<Exclude<Vaersted, 'norge'>, Vaertype>
  /** Leien for eiendom som merker været, ganges med dette i dag. Mangler: ×1. */
  eiendom: Partial<Record<EiendomId, number>>
  helligdag: Helligdag | null
  trend: Trend
  /** Inntekten for hver bransje ganges med dette i dag. */
  faktor: Record<BedriftstypeId, number>
}

/** Hvorfor en bransje går bedre eller dårligere i dag — til et merke på kortet. */
export function grunner(d: Kalenderdag, type: BedriftstypeId, sek: number): string[] {
  const ut: string[] = []
  if (d.helligdag?.virkning[type]) ut.push(d.helligdag.navn)
  if (d.trend.het === type) ut.push('Het bransje')
  if (d.trend.kald === type) ut.push('Kald bransje')
  if (VAERVIRKNING[type] && Math.abs(vaerfaktor(type, d.vaer, d.dag) - 1) > 0.05) ut.push(VAERTYPER[d.vaer].navn)
  const u = UKEDAG[type]
  if (u) ut.push(ukedag(sek) >= 5 ? 'Helg' : 'Hverdag')
  return ut
}

function vaerfaktor(type: BedriftstypeId, vaer: Vaertype, dag: number): number {
  const v = VAERVIRKNING[type]
  if (!v) return 1
  return v[vaer] / vaersnitt(type, sesongFor(dato(dag).maaned))
}

const HUSKET = new Map<string, Kalenderdag>()

/** Alt som gjelder en spilldag, regnet én gang og husket. */
export function dagsbilde(s: Spilltilstand, dag = dagnummer(s.sek)): Kalenderdag {
  // Hvert sekund spør om samme dag som sist: svar uten å lage en nøkkel.
  const frø = grunnfrø(s)
  if (siste && siste.dag === dag && sisteFrø === frø) return siste
  const nøkkel = `${frø}:${dag}`
  const husket = HUSKET.get(nøkkel)
  if (husket) {
    siste = husket
    sisteFrø = frø
    return husket
  }
  const vaer = dagensVaer(s, dag)
  const hellig = helligdag(dag)
  const trend = ukensTrend(s, dag)
  const helg = dag % 7 >= 5
  const faktor = {} as Record<BedriftstypeId, number>
  for (const type of STIGEN) {
    let f = 1
    const u = UKEDAG[type]
    if (u) f *= helg ? u.helg : u.hverdag
    f *= vaerfaktor(type, vaer, dag)
    if (trend.het === type) f *= 1 + TREND
    if (trend.kald === type) f *= 1 - TREND
    f *= hellig?.virkning[type] ?? 1
    faktor[type] = f
  }
  const eiendom: Partial<Record<EiendomId, number>> = {}
  for (const [id, e] of Object.entries(EIENDOMSVAER) as [EiendomId, { sted: Vaersted; virkning: Record<Vaertype, number> }][]) {
    eiendom[id] = jevnetVaer(e.virkning, e.sted, dag)
  }
  const vaerUte = { alpene: vaerPaaDag(dag, 'alpene'), syden: vaerPaaDag(dag, 'syden') }
  const d: Kalenderdag = { dag, vaer, vaerUte, eiendom, helligdag: hellig, trend, faktor }
  // Et lite minne: dagene før og etter er de som spørres om.
  if (HUSKET.size > 64) HUSKET.clear()
  HUSKET.set(nøkkel, d)
  siste = d
  sisteFrø = frø
  return d
}
let siste: Kalenderdag | null = null
let sisteFrø = 0

/** Faktoren for én bransje i dag. */
export function dagsfaktor(s: Spilltilstand, type: BedriftstypeId): number {
  return dagsbilde(s).faktor[type]
}

// ─────────────────────────────────────────────── Avisa

const prosent = (n: number) => `${String(n).replace('.', ',')} %`

/**
 * Dagens saker fra verden, til avisa ved dagsskiftet: rentemøtet når fasen
 * skifter, helligdagen, ukas trender på mandag og været når det betyr noe.
 * \`marked\` er saker som flytter penger; \`lokalt\` er stoff fra landet.
 */
export function verdenssaker(s: Spilltilstand): { marked: Overskrift[]; lokalt: Overskrift[] } {
  const dag = dagnummer(s.sek)
  const marked: Overskrift[] = []
  const lokalt: Overskrift[] = []

  // Rentemøtet: første dag i en ny periode, når fasen er en annen enn sist.
  const p = periode(dag)
  if (dag % FASE_DAGER === 0 && p > 0) {
    const ny = faseI(s, p)
    const gammel = faseI(s, p - 1)
    if (ny !== gammel) {
      const rente = FASER[ny].styringsrente
      const opp = rente > FASER[gammel].styringsrente
      marked.push({
        type: 'marked',
        tittel: `Sentralbanken ${opp ? 'hever' : 'kutter'} renten til ${prosent(rente)}`,
        tekst:
          ny === 'hoy'
            ? 'Økonomien går for fullt. Børsen og boligprisene stiger, og lånene blir dyrere.'
            : ny === 'lav'
              ? 'Lavkonjunktur. Aksjene og boligprisene faller, men lån blir billigere — for den som tør.'
              : 'Normale tider igjen, ifølge sentralbanksjefen. Markedet puster ut.',
      })
    }
  }

  const d = dagsbilde(s, dag)
  const forrige = helligdag(dag - 1)
  if (d.helligdag && forrige?.navn !== d.helligdag.navn) {
    const tittel: Record<string, string> = { Påske: 'God påske!', '17. mai': 'Gratulerer med dagen!', Jul: 'God jul!', Nyttårsaften: 'Godt nytt år!' }
    lokalt.push({ type: 'lokalt', tittel: tittel[d.helligdag.navn] ?? d.helligdag.navn, tekst: d.helligdag.tekst })
  }

  // Ukas trender kommer på mandag, når de begynner.
  if (dag % 7 === 0) {
    if (d.trend.het) marked.push({ type: 'marked', tittel: TRENDTEKST[d.trend.het].het, tekst: `Denne uka tjener bransjen ${Math.round(TREND * 100)} % mer enn vanlig.` })
    if (d.trend.kald) marked.push({ type: 'marked', tittel: TRENDTEKST[d.trend.kald].kald, tekst: `Denne uka tjener bransjen ${Math.round(TREND * 100)} % mindre enn vanlig.` })
  }

  // Været bare når det merkes: saftbodene i sola, skisentrene i snøen — eller regnet.
  const saft = vaerfaktor('saftbod', d.vaer, dag)
  const ski = vaerfaktor('skisenter', d.vaer, dag)
  if (d.vaer === 'sol' && saft > 1.15) lokalt.push({ type: 'lokalt', tittel: 'Sol over hele landet', tekst: 'Det er kø ved saftbodene fra morgen til kveld.' })
  else if (d.vaer === 'sno' && ski > 1.15) lokalt.push({ type: 'lokalt', tittel: 'Nysnø i fjellet', tekst: 'Skisentrene melder om pudder og fulle heiser.' })
  else if (d.vaer === 'regn' && saft < 0.7) lokalt.push({ type: 'lokalt', tittel: 'Regnet høljer ned', tekst: 'Saftbodene står tomme. Paraplyselgerne gnir seg i hendene.' })

  return { marked, lokalt }
}
