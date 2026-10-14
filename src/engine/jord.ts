/**
 * Gårder og skoger. Jorda stiger sakte i verdi, dag for dag.
 *
 * En gård gir avling hver mandag morgen — stor eller liten etter ukas vær, og
 * for de dagene av uka du eide den (Pakke 57). Selger du midt i uka, får du
 * avlingen så langt med salget.
 * En skog gir ingenting mens den vokser, men tømmeret blir verdt mer for hver
 * dag. Du bestemmer selv når du hogger: da får du betalt for tømmeret, og ny
 * skog plantes. Tømmeret vokser raskest i starten av midtfasen, så det lønner
 * seg å vente — men ikke for alltid.
 */

import { DAG_SEK, dagnummer, ukedag } from './kalender'
import { jevnetVaer, vaerPaaDag, type Vaertype } from './verden'
import { hashTekst, tilfeldig } from './rng'
import { byfaktor } from './regioner'
import type { Gardsbygg, Gardsmaskin, Gardstall, Gardsuke, JordId, Jordstykke, Lagring, NorskBy, Overskrift, Spilltilstand } from './types'
import { kortKroner } from './tall'

export interface Jordtype {
  id: JordId
  navn: string
  sted: string
  by: NorskBy
  type: 'gard' | 'skog'
  /** Pris for jorda den første spilldagen. */
  pris: number
}

export const JORD: Record<JordId, Jordtype> = {
  'gard-hedmarken': { id: 'gard-hedmarken', navn: 'Gård på Hedmarken', sted: 'Hamar, Innlandet', by: 'Hedmarken', type: 'gard', pris: 40_000_000 },
  'skog-trysil': { id: 'skog-trysil', navn: 'Skog i Trysil', sted: 'Trysil, Innlandet', by: 'Trysil', type: 'skog', pris: 60_000_000 },
  'gard-lista': { id: 'gard-lista', navn: 'Gård på Lista', sted: 'Farsund, Agder', by: 'Lista', type: 'gard', pris: 150_000_000 },
  'skog-namdalen': { id: 'skog-namdalen', navn: 'Skog i Namdalen', sted: 'Namsos, Trøndelag', by: 'Namdalen', type: 'skog', pris: 250_000_000 },
}

export const JORDLISTE = Object.keys(JORD) as JordId[]

/** Jord er til salgs når formuen din en gang har vært så stor andel av prisen. */
export const JORD_SYNLIG_VED = 0.8
/** Jordprisene stiger så mye per spilldag. */
const JORDVEKST_PER_DAG = 0.003
/** En gård gir så stor andel av jordverdien i avling per uke, i et normalt år. */
export const HOST_ANDEL = 0.08
/** Tømmeret nærmer seg så mange ganger jordverdien … */
export const TOMMER_MAKS = 3
/** … og har vokst til en firedel av det etter så mange dager. Snittveksten er størst da. */
export const TOMMER_DAGER = 36

/**
 * Ett vær (Pakke 54): avlingen følger været uka faktisk hadde — de sju dagene
 * med norsk vær fra Pakke 49 — i stedet for et eget ukevær. Sol er godt for
 * kornet, regn og snø mindre. Snittet for uka, jevnet ut per sesong, forsterkes
 * så avlingene svinger omtrent like mye som før (fra rundt 0,4 til 1,6).
 */
const AVLING: Record<Vaertype, number> = { sol: 1.5, overskyet: 1, regn: 0.8, sno: 0.3 }
const FORSTERKNING = 3

const UKER = [
  { fra: 1.35, navn: 'Rekorduke', tekst: 'Den beste avlingen i manns minne.' },
  { fra: 1.1, navn: 'God uke', tekst: 'Sol og regn i passe mengder. Kornet står høyt.' },
  { fra: 0.9, navn: 'Normal uke', tekst: 'En helt vanlig uke for norske bønder.' },
  { fra: 0.65, navn: 'Svak uke', tekst: 'For lite sol. Avlingene er magre.' },
  { fra: 0, navn: 'Elendig uke', tekst: 'Regn og kulde. Bøndene ber om sol.' },
] as const

export interface Ukevaer {
  navn: string
  tekst: string
  faktor: number
  /** Dagene med hvert vær den uka. */
  dager: Record<Vaertype, number>
}

const HUSKET_UKE = new Map<number, Ukevaer>()

/** Været uka en spilldag hører til, og hva det betyr for avlingen. Samme svar for alle dagene i uka. */
export function vaer(dag: number): Ukevaer {
  const uke = Math.floor(dag / 7)
  const husket = HUSKET_UKE.get(uke)
  if (husket) return husket
  const dager: Record<Vaertype, number> = { sol: 0, overskyet: 0, regn: 0, sno: 0 }
  let sum = 0
  for (let d = uke * 7; d < uke * 7 + 7; d++) {
    dager[vaerPaaDag(d)]++
    sum += jevnetVaer(AVLING, 'norge', d)
  }
  const faktor = Math.min(1.8, Math.max(0.3, 1 + FORSTERKNING * (sum / 7 - 1)))
  const u = UKER.find((x) => faktor >= x.fra)!
  const ut: Ukevaer = { navn: u.navn, tekst: `${u.tekst} ${uketekst(dager)}`, faktor, dager }
  if (HUSKET_UKE.size > 200) HUSKET_UKE.clear()
  HUSKET_UKE.set(uke, ut)
  return ut
}

/** «4 dager med sol, 2 med regn og 1 med snø.» */
function uketekst(d: Record<Vaertype, number>): string {
  const deler = ([['sol', 'sol'], ['regn', 'regn'], ['sno', 'snø'], ['overskyet', 'skyer']] as const)
    .filter(([v]) => d[v] > 0)
    .map(([v, navn], i) => `${d[v]}${i === 0 ? (d[v] === 1 ? ' dag' : ' dager') : ''} med ${navn}`)
  if (deler.length === 0) return ''
  const siste = deler.pop()!
  return `${deler.length ? `${deler.join(', ')} og ${siste}` : siste}.`.replace(/^./, (c) => c.toUpperCase())
}

// ─────────────────────────────────────────────── En gård du bygger (Pakke 92)

/** En gård starter med så mange jorder og kan vokse til så mange. */
export const START_JORDER = 3
export const MAKS_JORDER = 10
/**
 * Den fjerde jorda koster halve jordverdien; hver neste ×1,25 (Pakke 105). Med ×1,5 kostet
 * de sju 16,1 ganger jorda, og jord 8–10 tjente seg aldri inn i et spill på ~34 timer; nå
 * koster de 7,5 ganger jorda, og den tiende er tilbake på rundt 40 timer.
 */
export const JORDPRIS_ANDEL = 0.5
export const JORDPRIS_VEKST = 1.25

/**
 * Maskinene: én av hver per gård, priset som en andel av jorda ganger jordene ÷ 3 (Pakke 105).
 * Før fulgte prisen gårdens verdi med alt du hadde bygd, så en traktor på et gods kostet fem
 * ganger så mye for de samme prosentene; nå tjener den seg inn like fort på enhver gård.
 * Sprøyta gir +8 % avling i tillegg til å dempe de dårlige ukene (Pakke 105).
 */
export const MASKINER: Record<Gardsmaskin, { navn: string; tekst: string; andel: number; host: number; vaer: number }> = {
  traktor: { navn: 'Traktor', tekst: '+10 % avling', andel: 0.2, host: 1.1, vaer: 0 },
  tresker: { navn: 'Skurtresker', tekst: '+15 % avling', andel: 0.4, host: 1.15, vaer: 0 },
  sproyte: { navn: 'Sprøyte', tekst: '+8 % avling, og en dårlig uke faller 30 % mindre', andel: 0.3, host: 1.08, vaer: 0.3 },
}
export const MASKINLISTE = Object.keys(MASKINER) as Gardsmaskin[]

/** Trinnene en gård vokser i, etter jordene: status og et navn på kortet og i avisa. */
export const GARDSTRINN = [
  { navn: 'Småbruk', bestemt: 'småbruket', fra: 3, status: 0 },
  { navn: 'Gård', bestemt: 'gården', fra: 5, status: 3 },
  { navn: 'Storgård', bestemt: 'storgården', fra: 8, status: 6 },
  { navn: 'Gods', bestemt: 'godset', fra: 10, status: 10 },
] as const

/** Hvor mange jorder en gård har (3 for en gård fra før Pakke 92). */
export function jorder(j: Jordstykke | undefined): number {
  return j?.jorder ?? START_JORDER
}

/** Trinnet etter jordene: 0 småbruk … 3 gods. */
export function gardstrinn(j: Jordstykke | undefined): number {
  const n = jorder(j)
  let t = 0
  for (let i = 0; i < GARDSTRINN.length; i++) if (n >= GARDSTRINN[i].fra) t = i
  return t
}

/** Status fra gårdenes trinn. */
export function jordstatus(s: Spilltilstand): number {
  if (!s.jord) return 0
  let sum = 0
  for (const id of JORDLISTE) {
    const j = s.jord[id]
    if (j && JORD[id].type === 'gard') sum += GARDSTRINN[gardstrinn(j)].status
  }
  return sum
}

/** Prisen for neste jord, eller null når gården er full. Følger jordverdien, så den vokser med deg. */
export function nesteJordpris(s: Spilltilstand, id: JordId): number | null {
  const n = jorder(s.jord?.[id])
  if (n >= MAKS_JORDER) return null
  return landverdi(s, id) * JORDPRIS_ANDEL * JORDPRIS_VEKST ** (n - START_JORDER)
}

/**
 * Det maskinene og byggene prises etter (Pakke 105): jorda ganger jordene ÷ 3, så prisen
 * vokser med avlingen de gir mer av. På et småbruk er det jordverdien, som før.
 */
export function utbyggingsgrunnlag(s: Spilltilstand, id: JordId): number {
  return (landverdi(s, id) * jorder(s.jord?.[id])) / START_JORDER
}

export function maskinpris(s: Spilltilstand, id: JordId, m: Gardsmaskin): number {
  return MASKINER[m].andel * utbyggingsgrunnlag(s, id)
}

/** Ukas vær for en gård: sprøyta tar en del av fallet i en dårlig uke. */
export function gardsvaer(j: Jordstykke, faktor: number): number {
  if (faktor >= 1 || !j.maskiner?.sproyte) return faktor
  return faktor + MASKINER.sproyte.vaer * (1 - faktor)
}

/**
 * Før gården bygges ut, bokføres avlingen så langt denne uka med størrelsen den hadde,
 * og resten regnes med den nye fra nå. Ellers ga en jord kjøpt søndag kveld en hel ukes
 * avling (Pakke 57s regel: betal for tiden du eide). Muterer.
 */
export function bokforOpptjent(s: Spilltilstand, id: JordId): void {
  const j = s.jord?.[id]
  if (!j) return
  const d = gardHostDeler(s, id, dagnummer(s.sek), s.sek)
  j.opptjent = (j.opptjent ?? 0) + d.korn + d.annet
  j.opptjentKorn = (j.opptjentKorn ?? 0) + d.korn
  // Pakke 105: grønnsakene og frukten for seg, så låven kan ta dem mandag.
  if (d.gronnsaker > 0 || d.frukt > 0) {
    const a = (j.opptjentAnnet ??= {})
    a.gronnsaker = (a.gronnsaker ?? 0) + d.gronnsaker
    a.frukt = (a.frukt ?? 0) + d.frukt
  }
  j.plantetSek = s.sek
}

// ─────────────────────────────────────────────── Vær og marked (Pakke 93)

export type Avlingsgruppe = 'korn' | 'gronnsaker' | 'frukt'

export const GRUPPENAVN: Record<Avlingsgruppe, string> = { korn: 'Korn', gronnsaker: 'Grønnsaker', frukt: 'Frukt og bær' }
export const GRUPPELISTE = Object.keys(GRUPPENAVN) as Avlingsgruppe[]

/** Det som vokser på hver jord, i fast rekkefølge, og gruppen prisen følger. */
export const AVLINGER: readonly { navn: string; gruppe: Avlingsgruppe }[] = [
  { navn: 'Bygg', gruppe: 'korn' },
  { navn: 'Hvete', gruppe: 'korn' },
  { navn: 'Havre', gruppe: 'korn' },
  { navn: 'Poteter', gruppe: 'gronnsaker' },
  { navn: 'Rug', gruppe: 'korn' },
  { navn: 'Gulrøtter', gruppe: 'gronnsaker' },
  { navn: 'Jordbær', gruppe: 'frukt' },
  { navn: 'Raps', gruppe: 'korn' },
  { navn: 'Kål', gruppe: 'gronnsaker' },
  { navn: 'Epler', gruppe: 'frukt' },
]
/** Drivhuset (Pakke 93): tomater og agurk, som grønnsaker. */
export const DRIVHUSAVLING = { navn: 'Tomater', gruppe: 'gronnsaker' as Avlingsgruppe }

/**
 * Ukas pris per gruppe, fra en hash av gruppen og uka — den samme i alle spill.
 * Fra ×0,75 til ×1,30, i snitt nøyaktig 1 (0,75 + 0,55 · u^1,2 har snitt 0,75 + 0,55/2,2).
 */
export const PRIS_MIN = 0.75
export const PRIS_SPENN = 0.55
const PRIS_FORM = 1.2

export const ukeFor = (dag: number) => Math.floor(dag / 7)

export function avlingspris(gruppe: Avlingsgruppe, uke: number): number {
  return PRIS_MIN + PRIS_SPENN * tilfeldig(hashTekst(`avlingspris:${gruppe}:${uke}`)) ** PRIS_FORM
}

/**
 * Byggene på en gård: to mot været, drivhuset og lagrene. Priset som maskinene — drivhuset
 * etter jorda. Låven (Pakke 105) lagrer grønnsakene, frukten og drivhusets avling også, og
 * koster halvparten: med åtte uker korn alene ga den +1,9 poeng for 30 % av gården.
 */
export const GARDSBYGG: Record<Gardsbygg, { navn: string; tekst: string; andel: number }> = {
  drenering: { navn: 'Drenering', tekst: 'Regndager teller som overskyet', andel: 0.25 },
  frostdekke: { navn: 'Frostdekke', tekst: 'Snødager teller som regn', andel: 0.35 },
  drivhus: { navn: 'Drivhus', tekst: 'En ellevte jord under glass, alltid ×0,9 av en vanlig uke', andel: 0.6 },
  silo: { navn: 'Silo', tekst: 'Lagre opptil 4 uker korn og selg når prisen er god', andel: 0.3 },
  laave: { navn: 'Låve', tekst: 'Plass til 8 uker korn, og 4 uker grønnsaker og frukt', andel: 0.15 },
  // Pakke 94: fjøset dyrene står i. Plassene følger gårdens trinn.
  fjos: { navn: 'Fjøs', tekst: 'Plass til dyr: 4 på et småbruk, 20 på et gods', andel: 0.25 },
}
export const GARDSBYGGLISTE = Object.keys(GARDSBYGG) as Gardsbygg[]

export const DRIVHUS_FAKTOR = 0.9
/** Drivhuset krever en gård, ikke et småbruk. */
export const DRIVHUS_FRA_JORDER = 5
export const SILO_UKER = 4
export const LAAVE_UKER = 8
/** Grønnsaker og frukt låven har plass til (Pakke 105), i uker av hver. */
export const LAAVE_ANNET_UKER = 4
/** Korn i lager taper så mye per uke. Grønnsaker og frukt i låven like mye. */
export const KORNSVINN = 0.01
/**
 * «Lagre billig, selg dyrt» (Pakke 105): avlingen går på lager når ukas pris er under
 * dette, og hele lageret selges mandag den er her eller over. Målt over 312 uker av
 * prisene: +13,4 % på kornet med silo, mot −4,3 % for «lagre» som aldri selger.
 */
export const SELG_DYRT = 1.07

export function byggpris(s: Spilltilstand, id: JordId, b: Gardsbygg): number {
  return GARDSBYGG[b].andel * (b === 'drivhus' ? landverdi(s, id) : utbyggingsgrunnlag(s, id))
}

/** Lagerets valg: en silo fra før Pakke 105 som lagret, lagrer nå billig og selger dyrt. */
export function lagringsvalg(j: Jordstykke | undefined): Lagring {
  return j?.lagring ?? (j?.lagre ? 'smart' : 'selg')
}

/** Hvorfor et bygg ikke kan bygges ennå, eller null når det kan. */
export function byggSperre(j: Jordstykke | undefined, b: Gardsbygg): string | null {
  if (b === 'drivhus' && jorder(j) < DRIVHUS_FRA_JORDER) return `Krever ${DRIVHUS_FRA_JORDER} jorder`
  if (b === 'laave' && !j?.bygg?.silo) return 'Krever silo'
  return null
}

const DRENERT: Record<Vaertype, number> = { ...AVLING, regn: AVLING.overskyet }
const FROSTFRI: Record<Vaertype, number> = { ...AVLING, sno: AVLING.regn }
const BEGGE: Record<Vaertype, number> = { ...AVLING, regn: AVLING.overskyet, sno: AVLING.regn }
const HUSKET_GARD = new Map<string, number>()

/**
 * Ukas værfaktor for en gård med drenering og/eller frostdekke: dagene de hjelper på
 * teller som et bedre vær, mens sesongsnittet det jevnes mot står som før — ellers ville
 * utjevningen tatt fordelen bort. Uten dem: nøyaktig ukas vær fra før.
 */
export function ukefaktor(dag: number, drenering: boolean, frost: boolean): number {
  if (!drenering && !frost) return vaer(dag).faktor
  const uke = ukeFor(dag)
  const nokkel = `${uke}:${drenering ? 1 : 0}${frost ? 1 : 0}`
  const husket = HUSKET_GARD.get(nokkel)
  if (husket !== undefined) return husket
  const virkning = drenering && frost ? BEGGE : drenering ? DRENERT : FROSTFRI
  let sum = 0
  for (let d = uke * 7; d < uke * 7 + 7; d++) {
    const v = vaerPaaDag(d)
    sum += (jevnetVaer(AVLING, 'norge', d) * virkning[v]) / AVLING[v]
  }
  const faktor = Math.min(1.8, Math.max(0.3, 1 + FORSTERKNING * (sum / 7 - 1)))
  if (HUSKET_GARD.size > 400) HUSKET_GARD.clear()
  HUSKET_GARD.set(nokkel, faktor)
  return faktor
}

/** Traktoren og skurtreskeren ganget sammen. */
export function maskinfaktor(j: Jordstykke): number {
  let f = 1
  for (const m of MASKINLISTE) if (j.maskiner?.[m]) f *= MASKINER[m].host
  return f
}

/**
 * Hvor mange uker av en gruppe lagrene rommer: korn 4 med silo og 8 med låve; grønnsaker
 * og frukt 4 med låve (Pakke 105), ellers ingenting.
 */
export function lageruker(j: Jordstykke | undefined, gruppe: Avlingsgruppe = 'korn'): number {
  if (gruppe !== 'korn') return j?.bygg?.laave ? LAAVE_ANNET_UKER : 0
  return j?.bygg?.laave ? LAAVE_UKER : j?.bygg?.silo ? SILO_UKER : 0
}

/** Hvor mange jorder som gir en gruppe; drivhuset teller som 0,9 jord grønnsaker. */
export function felterMed(j: Jordstykke | undefined, gruppe: Avlingsgruppe): number {
  let felt = 0
  for (let i = 0; i < jorder(j); i++) if (AVLINGER[i].gruppe === gruppe) felt++
  if (gruppe === DRIVHUSAVLING.gruppe && j?.bygg?.drivhus) felt += DRIVHUS_FAKTOR
  return felt
}

/** En normal ukes avling av en gruppe fra gården nå (pris 1, vær 1), som lagrene måles i. */
export function gruppePerUke(s: Spilltilstand, id: JordId, gruppe: Avlingsgruppe): number {
  const j = s.jord?.[id]
  if (!j) return 0
  return ((landverdi(s, id) * HOST_ANDEL) / START_JORDER) * felterMed(j, gruppe) * maskinfaktor(j)
}

export function kornPerUke(s: Spilltilstand, id: JordId): number {
  return gruppePerUke(s, id, 'korn')
}

export function lagerkapasitet(s: Spilltilstand, id: JordId, gruppe: Avlingsgruppe): number {
  return lageruker(s.jord?.[id], gruppe) * gruppePerUke(s, id, gruppe)
}

export function kornkapasitet(s: Spilltilstand, id: JordId): number {
  return lagerkapasitet(s, id, 'korn')
}

/** Det som ligger på lager av en gruppe, i kroner til pris 1. */
export function lagerAv(j: Jordstykke | undefined, gruppe: Avlingsgruppe): number {
  return (gruppe === 'korn' ? j?.lager : j?.lagerAnnet?.[gruppe]) ?? 0
}

/** Lageret — kornet, og grønnsakene og frukten i låven — til denne ukas priser. */
export function lagerverdi(s: Spilltilstand, id: JordId): number {
  const j = s.jord?.[id]
  if (!j) return 0
  const uke = ukeFor(dagnummer(s.sek))
  let sum = 0
  for (const g of GRUPPELISTE) {
    const l = lagerAv(j, g)
    if (l > 0) sum += l * avlingspris(g, uke)
  }
  return sum
}

// ─────────────────────────────────────────────── Hva et kjøp på gården gir (Pakke 105)

/** Uker av spillets vær og priser snittene regnes over: to år for været, seks for lagrene. */
const SNITT_UKER = 104
const LAGER_UKER = 312
const HUSKET_SNITT = new Map<string, number>()

/** Ukas værfaktor for en gård i snitt over to år av spillets vær, med drenering, frostdekke og sprøyte som valgt. */
export function snittvaer(drenering: boolean, frost: boolean, sproyte: boolean): number {
  const nokkel = `vaer:${+drenering}${+frost}${+sproyte}`
  const husket = HUSKET_SNITT.get(nokkel)
  if (husket !== undefined) return husket
  let sum = 0
  for (let u = 0; u < SNITT_UKER; u++) {
    const f = ukefaktor(u * 7, drenering, frost)
    sum += sproyte && f < 1 ? f + MASKINER.sproyte.vaer * (1 - f) : f
  }
  HUSKET_SNITT.set(nokkel, sum / SNITT_UKER)
  return sum / SNITT_UKER
}

/**
 * Hva «lagre billig, selg dyrt» gir på en gruppe med plass til så mange uker: regelen
 * spilt over 312 uker av spillets egne priser og vær, mot å selge hver mandag. Korn med
 * silo +13,4 %, med låve +15,3 %; grønnsaker og frukt i låven +12,4 % og +13,2 %.
 */
export function lagringsgevinst(gruppe: Avlingsgruppe, uker: number): number {
  if (uker <= 0) return 0
  const nokkel = `lager:${gruppe}:${uker}`
  const husket = HUSKET_SNITT.get(nokkel)
  if (husket !== undefined) return husket
  let lager = 0
  let inn = 0
  let uten = 0
  for (let u = 0; u < LAGER_UKER; u++) {
    const p = avlingspris(gruppe, u)
    const h = vaer(u * 7).faktor
    uten += h * p
    lager *= 1 - KORNSVINN
    if (p >= SELG_DYRT) {
      inn += (h + lager) * p
      lager = 0
    } else {
      const l = Math.min(h, Math.max(0, uker - lager))
      lager += l
      inn += (h - l) * p
    }
  }
  // Det som ligger igjen, til snittprisen 1.
  const g = (inn + lager) / uten - 1
  HUSKET_SNITT.set(nokkel, g)
  return g
}

/**
 * Hva en gård gir i en snittuke (pris 1, snittvær) med maskinene og byggene den har —
 * og lagrene brukt med «lagre billig, selg dyrt». Dyrene er ikke med. Kjøpene på gårdens
 * side måles som forskjellen med og uten (`gardGir`).
 */
export function forventetUke(s: Spilltilstand, id: JordId, j: Jordstykke): number {
  const per = ((landverdi(s, id) * HOST_ANDEL) / START_JORDER) * maskinfaktor(j)
  const w = snittvaer(!!j.bygg?.drenering, !!j.bygg?.frostdekke, !!j.maskiner?.sproyte)
  const drivhus = j.bygg?.drivhus ? DRIVHUS_FAKTOR : 0
  const korn = per * w * felterMed(j, 'korn')
  const gronn = per * (w * (felterMed(j, 'gronnsaker') - drivhus) + drivhus)
  const frukt = per * w * felterMed(j, 'frukt')
  return (
    korn * (1 + lagringsgevinst('korn', lageruker(j, 'korn'))) +
    gronn * (1 + lagringsgevinst('gronnsaker', lageruker(j, 'gronnsaker'))) +
    frukt * (1 + lagringsgevinst('frukt', lageruker(j, 'frukt')))
  )
}

export type Gardskjop = { maskin: Gardsmaskin } | { bygg: Gardsbygg } | { jord: true }

/** Hva et kjøp legger til gårdens snittuke, i kroner (Pakke 105). */
export function gardGir(s: Spilltilstand, id: JordId, kjop: Gardskjop): number {
  const j = s.jord?.[id]
  if (!j) return 0
  const ny: Jordstykke =
    'maskin' in kjop
      ? { ...j, maskiner: { ...j.maskiner, [kjop.maskin]: true } }
      : 'bygg' in kjop
        ? { ...j, bygg: { ...j.bygg, [kjop.bygg]: true } }
        : { ...j, jorder: jorder(j) + 1 }
  return forventetUke(s, id, ny) - forventetUke(s, id, j)
}

// ─────────────────────────────────────────────── Gårdens regnskap (Pakke 94)

/** Så mange uker gården husker i sitt eget regnskap. */
export const REGNSKAP_UKER = 8

export const tomtGardstall = (): Gardstall => ({ host: 0, korn: 0, dyr: 0, tilskudd: 0, bygd: 0 })

/** Fører et beløp i gårdens regnskap: uka det hører til, og summen siden du kjøpte gården. Muterer. */
export function bokforGard(j: Jordstykke, uke: number, felt: keyof Gardstall, belop: number): void {
  if (belop === 0) return
  const liste = (j.regnskap ??= [])
  let rad: Gardsuke | undefined = liste.find((r) => r.uke === uke)
  if (!rad) {
    rad = { uke, ...tomtGardstall() }
    liste.push(rad)
    liste.sort((a, b) => a.uke - b.uke)
    while (liste.length > REGNSKAP_UKER) liste.shift()
  }
  rad[felt] += belop
  const sum = (j.siden ??= tomtGardstall())
  sum[felt] += belop
}

export function jordfaktor(s: Spilltilstand): number {
  return (1 + JORDVEKST_PER_DAG) ** dagnummer(s.sek)
}

/**
 * Jordas verdi nå: prisen, 0,3 % om dagen, og (Pakke 106) regionens prisfaktor — Hedmarken
 * følger Oslo, Lista Stavanger, Trysil Fjellet og Namdalen Trøndelag, som husene der gjør.
 * Faktoren svinger rundt 1 med omtrent ±6 % og trekkes tilbake i løpet av et par timer.
 * Avlingen, dyrene, jordene og maskinene prises etter den, så de følger med.
 */
export function landverdi(s: Spilltilstand, id: JordId): number {
  return JORD[id].pris * jordfaktor(s) * byfaktor(s, JORD[id].by)
}

/** Tømmeret som andel av jordverdien, etter hvor mange dager skogen har vokst. */
export function tommerfaktor(dager: number): number {
  const d = Math.max(0, dager)
  return TOMMER_MAKS * (d / (d + TOMMER_DAGER)) ** 2
}

/**
 * Tømmeret vokser raskest ved dag 18 (halve TOMMER_DAGER), men det som gir mest per dag
 * over en hel omgang — hogst og ny skog — er å hogge ved dag 36: tømmer(d)/d er størst der
 * (Pakke 106). Fra dag 28 til 46 er det under 2 % fra det beste, så det haster ikke.
 */
export const HOGST_BEST_DAG = TOMMER_DAGER

/** Hvor fort tømmeret i en skog vokser nå, i kroner per spilldag. */
export function tommervekst(s: Spilltilstand, id: JordId): number {
  if (JORD[id].type !== 'skog' || !s.jord?.[id]) return 0
  const d = Math.max(0, skogalder(s, id))
  return (landverdi(s, id) * TOMMER_MAKS * 2 * d * TOMMER_DAGER) / (d + TOMMER_DAGER) ** 3
}

/** Hvor mange dager til skogen er best å hogge; 0 når den er klar. */
export function dagerTilHogst(s: Spilltilstand, id: JordId): number {
  return Math.max(0, HOGST_BEST_DAG - skogalder(s, id))
}

export function skogalder(s: Spilltilstand, id: JordId): number {
  const j = s.jord?.[id]
  return j ? (s.sek - j.plantetSek) / DAG_SEK : 0
}

/** Hva tømmeret i en skog er verdt nå. */
export function tommerverdi(s: Spilltilstand, id: JordId): number {
  return JORD[id].type === 'skog' ? landverdi(s, id) * tommerfaktor(skogalder(s, id)) : 0
}

/** Jord og tømmer du eier, og det du har bygd på gårdene (Pakke 92). */
export function jordverdi(s: Spilltilstand): number {
  let sum = 0
  for (const id of JORDLISTE) {
    const j = s.jord?.[id]
    // Kornet i silo og låve (Pakke 93) teller til denne ukas pris.
    if (j) sum += landverdi(s, id) + tommerverdi(s, id) + (j.investert ?? 0) + lagerverdi(s, id)
  }
  return sum
}

export function jordKostpris(s: Spilltilstand): number {
  return JORDLISTE.reduce((sum, id) => sum + (s.jord?.[id]?.kostpris ?? 0), 0)
}

export const UKE_SEK = 7 * DAG_SEK

/**
 * Avlingen én gård gir for uka spilldagen `dag` hører til, frem til `til` (et
 * sekund): ukas vær ganget med andelen av uka du eide gården. Før fikk den som
 * eide gården mandag morgen hele uka — kjøp søndag, selg mandag: +4,5 til
 * +13 % av prisen etter meglerhonoraret.
 */
export function gardHost(s: Spilltilstand, id: JordId, dag: number, til: number): number {
  const d = gardHostDeler(s, id, dag, til)
  return d.korn + d.annet
}

/**
 * Avlingen delt i korn (som kan gå i silo) og resten (Pakke 93). Hver jord gir en
 * tredel av en normal ukes avling ganget med ukas vær for gården, maskinene og prisen
 * på det som vokser der. Drivhuset gir ×0,9 uansett vær, til grønnsakprisen.
 * `annet` er grønnsakene og frukten sammen, summert i jordenes rekkefølge som før Pakke 105.
 */
export function gardHostDeler(s: Spilltilstand, id: JordId, dag: number, til: number): { korn: number; annet: number; gronnsaker: number; frukt: number } {
  const j = s.jord?.[id]
  if (!j || JORD[id].type !== 'gard') return { korn: 0, annet: 0, gronnsaker: 0, frukt: 0 }
  const ukestart = Math.floor(dag / 7) * UKE_SEK
  // For en gård er plantetSek dagen du kjøpte den, eller sist du bygde ut: en gård hogges aldri.
  const andel = Math.min(1, Math.max(0, (til - Math.max(ukestart, j.plantetSek)) / UKE_SEK))
  if (andel <= 0) return { korn: 0, annet: 0, gronnsaker: 0, frukt: 0 }
  const uke = ukeFor(dag)
  const per = ((landverdi(s, id) * HOST_ANDEL) / START_JORDER) * andel * maskinfaktor(j)
  const w = gardsvaer(j, ukefaktor(dag, !!j.bygg?.drenering, !!j.bygg?.frostdekke))
  let korn = 0
  let annet = 0
  let gronnsaker = 0
  let frukt = 0
  for (let i = 0; i < jorder(j); i++) {
    const a = AVLINGER[i]
    const x = per * w * avlingspris(a.gruppe, uke)
    if (a.gruppe === 'korn') korn += x
    else {
      annet += x
      if (a.gruppe === 'gronnsaker') gronnsaker += x
      else frukt += x
    }
  }
  if (j.bygg?.drivhus) {
    const x = per * DRIVHUS_FAKTOR * avlingspris(DRIVHUSAVLING.gruppe, uke)
    annet += x
    gronnsaker += x
  }
  return { korn, annet, gronnsaker, frukt }
}

/** Avlingen en gård du eier, gir mandag for uka som går nå — for dagene du eier den. */
export function ukensGardHost(s: Spilltilstand, id: JordId): number {
  const dag = dagnummer(s.sek)
  return gardHost(s, id, dag, (Math.floor(dag / 7) + 1) * UKE_SEK) + (s.jord?.[id]?.opptjent ?? 0)
}

/** Mandag morgen høstes gårdene for uka som gikk. Gir avisens sak. Muterer. */
export function jordVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.jord || ukedag(s.sek) !== 0) return []
  const dag = dagnummer(s.sek)
  const forrige = dag - 1
  const uke = ukeFor(forrige)
  let host = 0
  let lagret = 0
  let fraLager = 0
  for (const id of JORDLISTE) {
    const j = s.jord[id]
    if (!j || JORD[id].type !== 'gard') continue
    const d = gardHostDeler(s, id, forrige, dag * DAG_SEK)
    const ok = j.opptjentKorn ?? 0
    const og = j.opptjentAnnet?.gronnsaker ?? 0
    const of = j.opptjentAnnet?.frukt ?? 0
    // Det som ble opptjent før Pakke 105 skilte grønnsaker og frukt, selges som før.
    let selges = (j.opptjent ?? 0) - ok - og - of
    const avling: Record<Avlingsgruppe, number> = { korn: d.korn + ok, gronnsaker: d.gronnsaker + og, frukt: d.frukt + of }
    j.opptjent = 0
    j.opptjentKorn = 0
    delete j.opptjentAnnet
    // Pakke 93: lageret taper litt hver uke. Pakke 105: låven tar grønnsakene og frukten
    // som siloen tar kornet, og «smart» lagrer når prisen er lav og selger alt når den er høy.
    if (j.lager) j.lager *= 1 - KORNSVINN
    if (j.lagerAnnet) for (const g of ['gronnsaker', 'frukt'] as const) if (j.lagerAnnet[g]) j.lagerAnnet[g]! *= 1 - KORNSVINN
    const valg = lagringsvalg(j)
    let solgt = 0
    for (const g of GRUPPELISTE) {
      const mengde = avling[g]
      const pris = avlingspris(g, uke)
      const kap = lagerkapasitet(s, id, g)
      if (kap <= 0 || valg === 'selg') {
        selges += mengde
        continue
      }
      if (valg === 'smart' && pris >= SELG_DYRT) {
        selges += mengde
        const l = lagerAv(j, g)
        if (l > 0) {
          solgt += l * pris
          settLager(j, g, 0)
        }
        continue
      }
      const inn = mengde > 0 ? Math.min(mengde / pris, Math.max(0, kap - lagerAv(j, g))) : 0
      if (inn > 0) settLager(j, g, lagerAv(j, g) + inn)
      selges += mengde - inn * pris
      lagret += inn * pris
    }
    host += selges
    bokforGard(j, uke, 'host', selges)
    if (solgt > 0) {
      fraLager += solgt
      bokforGard(j, uke, 'korn', solgt)
    }
  }
  if (host <= 0 && lagret <= 0 && fraLager <= 0) return []
  s.kontanter += host + fraLager
  s.totaltHost += host + fraLager
  s.totaltLeie += host + fraLager
  const v = vaer(forrige)
  // Pakke 92: avisa sier hva gårdene er blitt — «storgården på Lista og småbruket på Hedmarken».
  const garder = JORDLISTE.filter((id) => s.jord[id] && JORD[id].type === 'gard').map((id) => `${GARDSTRINN[gardstrinn(s.jord[id])].bestemt} på ${JORD[id].by}`)
  const fra = garder.length ? ` fra ${garder.length > 1 ? `${garder.slice(0, -1).join(', ')} og ${garder[garder.length - 1]}` : garder[0]}` : ''
  const silo = lagret > 0 ? ` Avling for ${kortKroner(lagret)} gikk på lager.` : ''
  const salg = fraLager > 0 ? ` Prisen var god, og lageret ble solgt for ${kortKroner(fraLager)}.` : ''
  return [{ type: 'deg', tittel: `${v.navn} på gårdene`, tekst: `${v.tekst} Ukas avling ga ${kortKroner(host)}${fra}.${silo}${salg}` }]
}

/** Setter lageret av en gruppe. Muterer. */
function settLager(j: Jordstykke, g: Avlingsgruppe, mengde: number): void {
  if (g === 'korn') j.lager = mengde
  else (j.lagerAnnet ??= {})[g] = mengde
}
