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
import { taIgjen } from './borte'
import { VELKOMST_ETTER_SEK } from '../ui/velkomst'
import { visVarsel } from '../ui/varsler'
import type { Spilltilstand } from '../engine/types'

const LAGERNOKKEL = 'milliardaer.lagring'
/* «Start på nytt» og import sletter aldri: det forrige spillet legges her. */
const ANGRENOKKEL = 'milliardaer.lagring.angre'
const BERGENOKKEL = 'milliardaer.lagring.korrupt'
/* Veggklokken da spillet sist ble lagret. Holdes utenfor spilltilstanden, så
   motoren aldri ser ekte tid. */
const SIST_AKTIV_NOKKEL = 'milliardaer.sistAktiv'
/* Fanen som eier lagringen nå. */
const EIERNOKKEL = 'milliardaer.eier'

/** Lengre pauser enn dette (f.eks. en nettleser som har strupet fanen) teller ikke. */
const MAKS_SEK_PER_STEG = 5
const LAGRE_HVERT_MS = 5_000

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
function bergLagring(rå: string): void {
  try {
    localStorage.setItem(BERGENOKKEL, rå)
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
    bergLagring(rå)
    skrivTilDisk(r.tilstand)
  }
  return { type: 'ok', tilstand: r.tilstand }
}

function skrivTilDisk(s: Spilltilstand): void {
  try {
    localStorage.setItem(LAGERNOKKEL, JSON.stringify(s))
    localStorage.setItem(SIST_AKTIV_NOKKEL, String(Date.now()))
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

/** Regner ut tiden siden sist lagring, og viser velkomsten etter en lengre pause. */
function taIgjenBorteTid(s: Spilltilstand): Spilltilstand {
  const borte = sekunderBorte()
  const etter = taIgjen(s, borte)
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
    return taIgjenBorteTid(lagret.tilstand)
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

/** Lagrer — men bare så lenge spillet går her og denne fanen eier lagringen. */
export function lagre(): void {
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
  lagre()
  return null
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
  if (naa - sistLagret >= LAGRE_HVERT_MS) {
    sistLagret = naa
    lagre()
  }
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
    sett(taIgjenBorteTid(tilstand))
  } catch (e) {
    meldFeil(e)
    return
  }
  restMs = 0
  sisteMaaling = null
  lagre()
}

let startet = false

/** Starter klokken. Trygg å kalle flere ganger. */
export function startSpillokke(): void {
  if (startet) return
  startet = true
  // Lagre med en gang, så klokken for tid borte alltid er satt.
  lagre()
  setInterval(steg, 200)
  document.addEventListener('visibilitychange', vedSynlighet)
  window.addEventListener('pagehide', lagre)
  // En ny fane har åpnet spillet: denne stopper, så den ikke skriver over.
  window.addEventListener('storage', (e) => {
    if (e.key === EIERNOKKEL && e.newValue && e.newValue !== faneId) settAvbrudd({ type: 'annen-fane' })
  })
}

// ─────────────────────────────────────────────── Reservekopien

/* Øker hver gang reservekopien endres, så visningen vet når den må leses på nytt. */
let reserveEndret = 0

export function reservekopiEndret(): number {
  return reserveEndret
}

function leggIReserve(s: Spilltilstand): void {
  try {
    localStorage.setItem(ANGRENOKKEL, JSON.stringify(s))
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
  leggIReserve(tilstand)
  lukkVelkomst()
  restMs = 0
  sisteMaaling = null
  sett(r.tilstand)
  lagre()
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
export async function importer(kode: string): Promise<string | null> {
  const r = await pakkUt(kode)
  if (!r.ok) return r.feil
  leggIReserve(tilstand)
  restMs = 0
  sisteMaaling = null
  sett(r.tilstand)
  lagre()
  return null
}

// ─────────────────────────────────────────────── Nytt spill

export function startPaaNytt(): void {
  leggIReserve(tilstand)
  restMs = 0
  sett(nyttSpill(Date.now() % 1_000_000))
  lagre()
}
