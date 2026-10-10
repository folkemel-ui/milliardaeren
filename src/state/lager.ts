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
export type Avbrudd = { type: 'annen-fane' } | { type: 'feil'; melding: string }

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
  settAvbrudd({ type: 'feil', melding: e instanceof Error ? e.message : String(e) })
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

function skrivTilDisk(s: Spilltilstand): void {
  try {
    localStorage.setItem(LAGERNOKKEL, tilLagring(s))
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(klokke))
  } catch {
    // Full disk eller privat modus — spillet fungerer, det lagres bare ikke.
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
  const etter = taIgjen(s, borte)
  klokke = Date.now()
  if (borte >= VELKOMST_ETTER_SEK) {
    velkomst = { borteSek: borte, før: s, etter }
    for (const l of velkomstLyttere) l()
  }
  return etter
}

// ─────────────────────────────────────────────── Tilstanden

kravEierskap()

let tilstand: Spilltilstand = (() => {
  const lagret = lastFraDisk()
  if (lagret.type === 'tom') return nyttSpill()
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
    sett(simuler(tilstand, Math.min(hele, MAKS_SEK_PER_STEG)))
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
  // Lagre med en gang, så klokken for tid borte alltid er satt.
  lagre()
  klokkeslag = setInterval(steg, 200)
  document.addEventListener('visibilitychange', vedSynlighet)
  window.addEventListener('pagehide', lagre)
  // En ny fane har åpnet spillet: denne stopper, så den ikke skriver over.
  window.addEventListener('storage', vedLagring)
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
