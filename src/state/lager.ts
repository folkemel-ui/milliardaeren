/**
 * Tilstandslageret og spilløkken. Ett enkelt abonnementslager i stedet for et
 * rammeverk — spillet har én tilstand, og alle endringer går gjennom motoren.
 *
 * Klokken bor her, ikke i motoren: lageret måler ekte tid og ber motoren
 * simulere hele sekunder. Når spillet er lukket eller skjult, regnes tiden
 * borte ut når du kommer tilbake (se borte.ts).
 *
 * Bare én fane eier lagringen om gangen: den som sist ble åpnet. En eldre fane
 * som oppdager det, stopper og lagrer ikke mer, så den aldri skriver over
 * fremgangen i den nye.
 */

import { useSyncExternalStore } from 'react'
import { nyttSpill } from '../engine/start'
import { simuler } from '../engine/simulering'
import { nettoformue } from '../engine/formler'
import type { Utfall } from '../engine/handlinger'
import { migrer } from './migrering'
import { pakk, pakkUt } from './overforing'
import { sjekkTilstand } from './sjekk'
import { tilLagring } from './lagringsformat'
import { taIgjen } from './borte'
import { maalBorte, maalLagring, maalSekund } from './maaling'
import { hentFraSpeil, slippSpeil, speil } from './speil'
import { VELKOMST_ETTER_SEK } from '../ui/velkomst'
import { visVarsel } from '../ui/varsler'
import type { Spilltilstand } from '../engine/types'

const LAGERNOKKEL = 'milliardaer.lagring'
/* «Start på nytt» og import sletter aldri: det forrige spillet legges her. */
const ANGRENOKKEL = 'milliardaer.lagring.angre'
/* En lagring som ikke kunne lastes. Bare feil skriver hit, så kopien står til neste feil. */
const BERGENOKKEL = 'milliardaer.lagring.korrupt'
/* Lagringen slik den var før den sist ble løftet til en ny versjon. */
const FOR_MIGRERING_NOKKEL = 'milliardaer.lagring.formigrering'
/* Veggklokken spillet i lagringen hører til. Holdes utenfor spilltilstanden,
   så motoren aldri ser ekte tid. */
const SIST_AKTIV_NOKKEL = 'milliardaer.sistAktiv'
/* Fanen som eier lagringen nå. */
const EIERNOKKEL = 'milliardaer.eier'

/** Lengre pauser enn dette (f.eks. en nettleser som har strupet fanen) teller ikke. */
const MAKS_SEK_PER_STEG = 5
/**
 * Spillet lagres så ofte mens du spiller (Pakke 69: før hvert 5. sekund — en
 * lagring koster ~7,5 ms her og ~37 ms på en treg telefon, to tapte bilder).
 * Å skjule eller lukke appen lagrer med en gang, og en handling etter et sekund.
 */
const LAGRE_HVERT_MS = 15_000
/** Hvor lenge en lagring kan vente på et ledig øyeblikk før den tas likevel. */
const LEDIG_FRIST_MS = 2_000

const faneId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// ─────────────────────────────────────────────── Avbrudd

/**
 * Når spillet ikke kan fortsette her: en annen fane har tatt over, eller noe
 * gikk galt. Da stopper klokken og lagringen, og appen viser en egen skjerm.
 */
export type Avbrudd = { type: 'annen-fane' } | { type: 'feil'; melding: string; stakk?: string }

let avbrudd: Avbrudd | null = null
const avbruddLyttere = new Set<() => void>()

function settAvbrudd(a: Avbrudd): void {
  avbrudd = a
  for (const l of avbruddLyttere) l()
}

export function useAvbrudd(): Avbrudd | null {
  return useSyncExternalStore(
    (fn) => {
      avbruddLyttere.add(fn)
      return () => {
        avbruddLyttere.delete(fn)
      }
    },
    () => avbrudd,
  )
}

/** Avbruddet nå, uten å abonnere. */
export function aktivtAvbrudd(): Avbrudd | null {
  return avbrudd
}

/** Stopper spillet med en feil. Den første feilen er den som vises. */
export function meldFeil(e: unknown): void {
  if (avbrudd?.type === 'feil') return
  settAvbrudd({ type: 'feil', melding: e instanceof Error ? e.message : String(e), stakk: e instanceof Error ? e.stack : undefined })
}

function kravEierskap(): void {
  try {
    localStorage.setItem(EIERNOKKEL, faneId)
  } catch {
    /* privat modus — da lagres ingenting uansett */
  }
}

/** Om denne fanen fortsatt eier lagringen. Uten tilgang til lagringen: ja. */
function eierFortsatt(): boolean {
  try {
    const eier = localStorage.getItem(EIERNOKKEL)
    return eier === null || eier === faneId
  } catch {
    return true
  }
}

// ─────────────────────────────────────────────── Disk

/* En lagring som ikke kan brukes skal aldri forkastes stille: legg råteksten
   i en bergingsnøkkel før et nytt spill får skrive over posten. */
function bergLagring(rå: string, nøkkel = BERGENOKKEL): void {
  try {
    localStorage.setItem(nøkkel, rå)
  } catch {
    /* full disk — da står i det minste originalen til den overskrives */
  }
}

type Tolket = { ok: true; tilstand: Spilltilstand; migrert: boolean } | { ok: false; feil: string }

/** Leser en lagret tekst: parser, migrerer og sjekker at den kan spilles. */
function tolk(rå: string): Tolket {
  let data: unknown
  try {
    data = JSON.parse(rå)
  } catch {
    return { ok: false, feil: 'Lagringen er ødelagt og kan ikke leses.' }
  }
  const r = migrer(data)
  if (!r.ok) return r
  const feil = sjekkTilstand(r.tilstand)
  return feil ? { ok: false, feil } : r
}

function lastFraDisk(): { type: 'tom' } | { type: 'ok'; tilstand: Spilltilstand } | { type: 'feil'; feil: string } {
  let rå: string | null = null
  try {
    rå = localStorage.getItem(LAGERNOKKEL)
  } catch {
    return { type: 'tom' }
  }
  if (!rå) return { type: 'tom' }
  const r = tolk(rå)
  if (!r.ok) {
    bergLagring(rå)
    return { type: 'feil', feil: r.feil }
  }
  if (r.migrert) {
    bergLagring(rå, FOR_MIGRERING_NOKKEL)
    // Bare spillet: klokken står, så tiden borte fortsatt regnes fra sist det ble spilt.
    try {
      localStorage.setItem(LAGERNOKKEL, tilLagring(r.tilstand))
    } catch {
      /* full disk — det migreres på nytt neste gang */
    }
  }
  return { type: 'ok', tilstand: r.tilstand }
}

/*
 * Veggklokken spillet i minnet hører til: settes når tiden er regnet frem, og
 * står stille mens appen er skjult. Lagringen stempler denne, ikke klokka nå,
 * så en skjult fane som lukkes timer senere ikke stjeler tiden imellom.
 */
let klokke = Date.now()

/** Om en feil fra localStorage betyr at lagringen er full (ikke privat modus eller sperret). */
function erFull(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false
  return e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014
}

/** Bergingskopiene som kan slettes når lagringen er full (Pakke 95): de er gamle og sjelden i bruk. */
const BERGINGSKOPIER = [FOR_MIGRERING_NOKKEL, BERGENOKKEL]

let fullVarslet = false

/**
 * Skriver spillet. Er lagringen full (Pakke 95), slettes bergingskopiene — kopien fra før
 * siste oppdatering og kopien av en ødelagt lagring — og det prøves igjen; reservekopien du
 * ser i Innstillinger, står. Går det fortsatt ikke, kommer ett varsel per besøk. Før ble en
 * full lagring svelget uten et ord.
 */
function skrivTilDisk(s: Spilltilstand): void {
  const fra = performance.now()
  let tekst: string
  try {
    tekst = tilLagring(s)
  } catch {
    return
  }
  try {
    try {
      localStorage.setItem(LAGERNOKKEL, tekst)
    } catch (e) {
      if (!erFull(e)) throw e
      for (const k of BERGINGSKOPIER) localStorage.removeItem(k)
      localStorage.setItem(LAGERNOKKEL, tekst)
    }
    maalLagring(performance.now() - fra, tekst.length)
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(klokke))
    // Pakke 97: i appen fra App Store/Google Play også til en fil (state/speil.ts).
    speil(tekst, klokke)
  } catch (e) {
    // Privat modus eller sperret lagring: spillet fungerer, det lagres bare ikke.
    if (!erFull(e) || fullVarslet) return
    fullVarslet = true
    visVarsel({
      type: 'advarsel',
      tittel: 'Lagringen er full',
      tekst: 'Spillet lagres ikke på denne enheten. Kopier koden under Profil → Innstillinger → Flytt spillet, så mister du ingenting.',
      mål: 'profil',
    })
  }
}

/** Sekunder siden spillet sist ble lagret, eller 0 hvis det ikke vites. */
function sekunderBorte(): number {
  try {
    const sist = Number(localStorage.getItem(SIST_AKTIV_NOKKEL))
    if (!sist) return 0
    return Math.max(0, Math.floor((Date.now() - sist) / 1000))
  } catch {
    return 0
  }
}

// ─────────────────────────────────────────────── Velkomst

/**
 * Velkomsten etter lengre tid borte: tilstanden før og etter at tiden ble
 * regnet ut. Holdes bare i minnet — appen viser den og glemmer den.
 */
export interface Velkomst {
  borteSek: number
  før: Spilltilstand
  etter: Spilltilstand
}

let velkomst: Velkomst | null = null
const velkomstLyttere = new Set<() => void>()

export function useVelkomst(): Velkomst | null {
  return useSyncExternalStore(
    (fn) => {
      velkomstLyttere.add(fn)
      return () => {
        velkomstLyttere.delete(fn)
      }
    },
    () => velkomst,
  )
}

/** Velkomsten som vises nå, uten å abonnere — til sammenligninger i effekter. */
export function aktivVelkomst(): Velkomst | null {
  return velkomst
}

export function lukkVelkomst(): void {
  velkomst = null
  for (const l of velkomstLyttere) l()
}

/** Regner ut tiden borte, og viser velkomsten etter en lengre pause. */
function taIgjenBorteTid(s: Spilltilstand, borte: number): Spilltilstand {
  const fra = performance.now()
  const etter = taIgjen(s, borte)
  maalBorte(performance.now() - fra, borte)
  klokke = Date.now()
  if (borte >= VELKOMST_ETTER_SEK) {
    velkomst = { borteSek: borte, før: s, etter }
    for (const l of velkomstLyttere) l()
  }
  return etter
}

// ─────────────────────────────────────────────── Tilstanden

kravEierskap()

/** Startet spillet uten lagring? Da kan den ligge i speilfila (Pakke 97). */
let startetTom = false

let tilstand: Spilltilstand = (() => {
  const lagret = lastFraDisk()
  if (lagret.type === 'tom') {
    startetTom = true
    return nyttSpill()
  }
  if (lagret.type === 'feil') {
    // Vises på feilskjermen; spillet under blir aldri lagret.
    avbrudd = { type: 'feil', melding: lagret.feil }
    return nyttSpill()
  }
  try {
    return taIgjenBorteTid(lagret.tilstand, sekunderBorte())
  } catch (e) {
    avbrudd = { type: 'feil', melding: e instanceof Error ? e.message : String(e) }
    return lagret.tilstand
  }
})()
const lyttere = new Set<() => void>()

function sett(neste: Spilltilstand): void {
  tilstand = neste
  for (const l of lyttere) l()
}

function abonner(fn: () => void): () => void {
  lyttere.add(fn)
  return () => {
    lyttere.delete(fn)
  }
}

export function useSpill(): Spilltilstand {
  return useSyncExternalStore(abonner, () => tilstand)
}

/*
 * En handling lagres litt etterpå, ikke med en gang: ti raske trykk på
 * «oppgrader» gir én lagring, ikke ti. Å skjule eller lukke appen lagrer
 * alltid med en gang, så ingenting går tapt.
 */
const LAGRE_ETTER_HANDLING_MS = 1000
let ventendeLagring: ReturnType<typeof setTimeout> | null = null

function lagreSnart(): void {
  if (ventendeLagring) return
  ventendeLagring = setTimeout(lagre, LAGRE_ETTER_HANDLING_MS)
}

/** Lagrer — men bare så lenge spillet går her og denne fanen eier lagringen. */
export function lagre(): void {
  if (ventendeLagring) {
    clearTimeout(ventendeLagring)
    ventendeLagring = null
  }
  if (avbrudd) return
  if (!eierFortsatt()) {
    settAvbrudd({ type: 'annen-fane' })
    return
  }
  skrivTilDisk(tilstand)
}

/**
 * Utfører et utfall: lykkes det, blir det den nye tilstanden. Mislykkes det,
 * vises feilen som et grått varsel — med mindre `stille` er satt, fordi
 * stedet viser feilen selv.
 */
export function utfor(u: Utfall, stille = false): string | null {
  if (!u.ok) {
    if (!stille) visVarsel({ type: 'feil', tittel: u.feil })
    return u.feil
  }
  sett(u.tilstand)
  lagreSnart()
  return null
}

/**
 * Som utfor, men handlingen får spillet slik det er akkurat nå. Til gjentatte
 * trykk — å holde en knapp inne — der kortet ikke rekker å tegnes mellom hvert.
 */
export function utforMed(handling: (s: Spilltilstand) => Utfall, stille = false): string | null {
  return utfor(handling(tilstand), stille)
}

// ─────────────────────────────────────────────── Spilløkken

let sisteMaaling: number | null = null
let restMs = 0
let sistLagret = 0

function steg(): void {
  const naa = performance.now()
  if (document.hidden || avbrudd) {
    sisteMaaling = null
    return
  }
  if (sisteMaaling === null) {
    sisteMaaling = naa
    return
  }
  restMs += naa - sisteMaaling
  sisteMaaling = naa
  const hele = Math.floor(restMs / 1000)
  if (hele <= 0) return
  restMs -= hele * 1000
  try {
    const antall = Math.min(hele, MAKS_SEK_PER_STEG)
    const fra = performance.now()
    const neste = simuler(tilstand, antall)
    maalSekund(performance.now() - fra, antall)
    sett(neste)
  } catch (e) {
    meldFeil(e)
    return
  }
  klokke = Date.now()
  if (naa - sistLagret >= LAGRE_HVERT_MS) {
    sistLagret = naa
    lagreNaarLedig()
  }
}

let ventendeLedig: number | null = null

/**
 * Lagrer i et ledig øyeblikk mellom bildene der nettleseren gir beskjed om det
 * (Chrome, Firefox), ellers med en gang (Safari har ikke requestIdleCallback).
 */
function lagreNaarLedig(): void {
  const ledig = (window as { requestIdleCallback?: (f: () => void, o: { timeout: number }) => number }).requestIdleCallback
  if (!ledig) {
    lagre()
    return
  }
  if (ventendeLedig !== null) return
  ventendeLedig = ledig(() => {
    ventendeLedig = null
    lagre()
  }, { timeout: LEDIG_FRIST_MS })
}

function vedSynlighet(): void {
  if (avbrudd) return
  if (document.hidden) {
    lagre()
    return
  }
  // En annen fane kan ha tatt over mens denne lå i bakgrunnen.
  if (!eierFortsatt()) {
    settAvbrudd({ type: 'annen-fane' })
    return
  }
  try {
    // Fra klokken i minnet, ikke disken: feilet lagringen da appen ble skjult, regnes tiden likevel bare én gang.
    sett(taIgjenBorteTid(tilstand, Math.max(0, Math.floor((Date.now() - klokke) / 1000))))
  } catch (e) {
    meldFeil(e)
    return
  }
  restMs = 0
  sisteMaaling = null
  lagre()
}

let startet = false
let klokkeslag: ReturnType<typeof setInterval> | null = null

function vedLagring(e: StorageEvent): void {
  if (e.key === EIERNOKKEL && e.newValue && e.newValue !== faneId) settAvbrudd({ type: 'annen-fane' })
}

/** Starter klokken. Trygg å kalle flere ganger. */
export function startSpillokke(): void {
  if (startet) return
  startet = true
  // Før første lagring: den sperrer speilfila til den er lest, så et tomt spill aldri skriver over den.
  if (startetTom) void gjenopprettFraSpeil()
  // Lagre med en gang, så klokken for tid borte alltid er satt.
  lagre()
  klokkeslag = setInterval(steg, 200)
  document.addEventListener('visibilitychange', vedSynlighet)
  window.addEventListener('pagehide', lagre)
  // En ny fane har åpnet spillet: denne stopper, så den ikke skriver over.
  window.addEventListener('storage', vedLagring)
  // Pakke 95: be om at lagringen ikke slettes (Safari sletter ellers etter sju dager uten besøk).
  if (typeof navigator !== 'undefined') void navigator.storage?.persist?.().catch(() => false)
  window.addEventListener('error', vedUfanget)
  window.addEventListener('unhandledrejection', vedUfanget)
}

/**
 * I appen: startet spillet uten lagring, men speilfila har et spill (iOS tømte lagringen),
 * legges det tilbake og siden lastes på nytt. Tiden borte regnes fra da fila ble skrevet.
 * En fil lageret ikke kan bruke, blir liggende urørt til neste lagring skriver over den.
 */
async function gjenopprettFraSpeil(): Promise<void> {
  startetTom = false
  const fra = await hentFraSpeil()
  if (!fra) return
  if (!tolk(fra.lagring).ok) return slippSpeil()
  stoppSpillokke()
  try {
    localStorage.setItem(LAGERNOKKEL, fra.lagring)
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(fra.sistAktiv))
  } catch {
    // Kan ikke lagringen skrives, ville en ny innlasting starte tomt igjen: spill videre her.
    slippSpeil()
    return startSpillokke()
  }
  location.reload()
}

const varsledeFeil = new Set<string>()

/**
 * En feil som ikke stoppet spillet — typisk i et trykk (Pakke 95): før skjedde ingenting
 * synlig. Nå kommer et grått varsel, én gang per feiltekst.
 */
function vedUfanget(e: ErrorEvent | PromiseRejectionEvent): void {
  const grunn = 'reason' in e ? e.reason : e.error ?? e.message
  const tekst = grunn instanceof Error ? grunn.message : String(grunn ?? '')
  if (!tekst || /ResizeObserver/.test(tekst) || varsledeFeil.has(tekst)) return
  varsledeFeil.add(tekst)
  visVarsel({ type: 'feil', tittel: 'Noe gikk galt', tekst })
}

/**
 * Stopper klokken og lytterne igjen. Appen selv stopper aldri — klikktestene
 * gjør det når de lukker appen, så klokken ikke tikker videre etter at testens
 * dokument er revet ned.
 */
export function stoppSpillokke(): void {
  if (!startet) return
  startet = false
  if (klokkeslag) clearInterval(klokkeslag)
  klokkeslag = null
  if (ventendeLagring) clearTimeout(ventendeLagring)
  ventendeLagring = null
  if (ventendeLedig !== null) (window as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(ventendeLedig)
  ventendeLedig = null
  document.removeEventListener('visibilitychange', vedSynlighet)
  window.removeEventListener('pagehide', lagre)
  window.removeEventListener('storage', vedLagring)
  window.removeEventListener('error', vedUfanget)
  window.removeEventListener('unhandledrejection', vedUfanget)
}

// ─────────────────────────────────────────────── Feilrapporten og kopien fra før oppdateringen (Pakke 95)

/**
 * Lagringen som den ligger på disken (eller kopien av en ødelagt lagring), pakket som en
 * kode — til feilrapporten. Null når det ikke finnes noen.
 */
export async function lagringSomKode(): Promise<string | null> {
  let rå: string | null = null
  try {
    rå = localStorage.getItem(BERGENOKKEL) ?? localStorage.getItem(LAGERNOKKEL)
  } catch {
    return null
  }
  if (!rå) return null
  try {
    return await pakk(JSON.parse(rå) as Spilltilstand)
  } catch {
    return null
  }
}

/** Kopien fra før siste oppdatering: nøkkeltall, eller null når den mangler eller ikke kan leses. */
export function lesFoerOppdatering(): { formue: number; sek: number } | null {
  try {
    const rå = localStorage.getItem(FOR_MIGRERING_NOKKEL)
    if (!rå) return null
    const r = tolk(rå)
    return r.ok ? { formue: nettoformue(r.tilstand), sek: r.tilstand.sek } : null
  } catch {
    return null
  }
}

/**
 * Tar i bruk spillet fra før siste oppdatering: det du har nå, blir reservekopien, og siden
 * lastes på nytt, så kopien løftes til denne versjonen som ved en vanlig oppdatering.
 */
export function hentFoerOppdatering(): string | null {
  try {
    const gammel = localStorage.getItem(FOR_MIGRERING_NOKKEL)
    if (!gammel) return 'Det finnes ingen kopi fra før siste oppdatering.'
    if (!tolk(gammel).ok) return 'Kopien kan ikke leses.'
    lagre()
    const naa = localStorage.getItem(LAGERNOKKEL)
    if (naa) localStorage.setItem(ANGRENOKKEL, naa)
    localStorage.setItem(LAGERNOKKEL, gammel)
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(Date.now()))
  } catch {
    return 'Kunne ikke bytte — lagringen er utilgjengelig.'
  }
  stoppSpillokke()
  location.reload()
  return null
}

/** «Fra en nyere spillversjon»: hent den nye versjonen og last inn på nytt. */
export async function oppdaterOgLastInn(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    await reg?.update()
  } catch {
    /* uten service worker: en vanlig ny innlasting henter siden fra nettet */
  }
  location.reload()
}

// ─────────────────────────────────────────────── Reservekopien

/* Øker hver gang reservekopien endres, så visningen vet når den må leses på nytt. */
let reserveEndret = 0

export function reservekopiEndret(): number {
  return reserveEndret
}

function leggIReserve(s: Spilltilstand): void {
  try {
    localStorage.setItem(ANGRENOKKEL, tilLagring(s))
  } catch {
    // Privat modus — da finnes det heller ingen reservekopi.
  }
  reserveEndret++
}

function lesReserve(): Tolket | null {
  try {
    const rå = localStorage.getItem(ANGRENOKKEL)
    return rå ? tolk(rå) : null
  } catch {
    return null
  }
}

/* Øker hver gang spillet byttes ut med et annet, så appen ikke feirer det andre spillets fortid. */
let spillnr = 0

export function spillnummer(): number {
  return spillnr
}

/** Bytter ut spillet: det gamle blir reservekopi, og tiden begynner på nytt fra nå. */
function byttSpill(ny: Spilltilstand): void {
  leggIReserve(tilstand)
  lukkVelkomst()
  spillnr++
  restMs = 0
  sisteMaaling = null
  klokke = Date.now()
  sett(ny)
  lagre()
}

/** Nøkkeltall for reservekopien, eller null når det ikke finnes noen som kan brukes. */
export function lesReservekopi(): { formue: number; sek: number } | null {
  const r = lesReserve()
  return r?.ok ? { formue: nettoformue(r.tilstand), sek: r.tilstand.sek } : null
}

/**
 * Bytter spillet med reservekopien. Spillet du har nå blir den nye
 * reservekopien, så du kan bytte tilbake. Tiden reservekopien lå der, regnes
 * ikke som tid borte. Gir en feilmelding, eller null når det gikk.
 */
export function byttTilReservekopi(): string | null {
  const r = lesReserve()
  if (!r) return 'Det finnes ingen reservekopi.'
  if (!r.ok) return r.feil
  byttSpill(r.tilstand)
  return null
}

/**
 * Fra feilskjermen: tar i bruk reservekopien eller et nytt spill og laster
 * siden på nytt. Den ødelagte lagringen legges i bergingsnøkkelen først.
 */
export function gjenopprettEtterFeil(hva: 'reservekopi' | 'nytt'): void {
  try {
    const nå = localStorage.getItem(LAGERNOKKEL)
    if (nå) bergLagring(nå)
    const ny = hva === 'reservekopi' ? localStorage.getItem(ANGRENOKKEL) : JSON.stringify(nyttSpill(Date.now() % 1_000_000))
    if (ny) localStorage.setItem(LAGERNOKKEL, ny)
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(Date.now()))
  } catch {
    /* privat modus — siden lastes likevel på nytt */
  }
  location.reload()
}

// ─────────────────────────────────────────────── Flytte spillet

/** Koden for spillet slik det står nå. */
export function eksporter(): Promise<string> {
  return pakk(tilstand)
}

/**
 * Bytter ut spillet med det i koden. Det gamle legges i reservekopien, som ved
 * «Start på nytt». Tiden mellom eksport og import regnes ikke som tid borte.
 * Gir en feilmelding, eller null når det gikk.
 */
/* En import tar et øyeblikk (pakke ut, migrere, prøvespille). Et trykk til i
   mellomtiden ville lagt det importerte spillet i reservekopien over det gamle. */
let importerer = false

export async function importer(kode: string): Promise<string | null> {
  if (importerer) return 'Spillet hentes alt inn.'
  importerer = true
  try {
    const r = await pakkUt(kode)
    if (!r.ok) return r.feil
    byttSpill(r.tilstand)
    return null
  } finally {
    importerer = false
  }
}

// ─────────────────────────────────────────────── Nytt spill

export function startPaaNytt(): void {
  byttSpill(nyttSpill(Date.now() % 1_000_000))
}
