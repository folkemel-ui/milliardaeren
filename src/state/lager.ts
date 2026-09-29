/**
 * Tilstandslageret og spilløkken. Ett enkelt abonnementslager i stedet for et
 * rammeverk — spillet har én tilstand, og alle endringer går gjennom motoren.
 *
 * Klokken bor her, ikke i motoren: lageret måler ekte tid og ber motoren
 * simulere hele sekunder. Når spillet er lukket eller skjult, regnes tiden
 * borte ut når du kommer tilbake — da går bare bedriftene med leder, og bare
 * opp til taket.
 */

import { useSyncExternalStore } from 'react'
import { nyttSpill } from '../engine/start'
import { simuler } from '../engine/simulering'
import { BORTE_TAK_SEK } from '../engine/innhold'
import type { Utfall } from '../engine/handlinger'
import { migrer } from './migrering'
import { pakk, pakkUt } from './overforing'
import { VELKOMST_ETTER_SEK } from '../ui/velkomst'
import { visVarsel } from '../ui/varsler'
import type { Spilltilstand } from '../engine/types'

const LAGERNOKKEL = 'milliardaer.lagring'
/* «Start på nytt» sletter aldri: det forrige spillet legges her. */
const ANGRENOKKEL = 'milliardaer.lagring.angre'
const BERGENOKKEL = 'milliardaer.lagring.korrupt'
/* Veggklokken da spillet sist ble lagret. Holdes utenfor spilltilstanden, så
   motoren aldri ser ekte tid. */
const SIST_AKTIV_NOKKEL = 'milliardaer.sistAktiv'

/** Lengre pauser enn dette (f.eks. en nettleser som har strupet fanen) teller ikke. */
const MAKS_SEK_PER_STEG = 5
const LAGRE_HVERT_MS = 5_000

/* En lagring som ikke kan brukes skal aldri forkastes stille: legg råteksten
   i en bergingsnøkkel før et nytt spill får skrive over posten. */
function bergLagring(rå: string): void {
  try {
    localStorage.setItem(BERGENOKKEL, rå)
  } catch {
    /* full disk — da står i det minste originalen til den overskrives */
  }
}

function lastFraDisk(): Spilltilstand | null {
  let rå: string | null = null
  try {
    rå = localStorage.getItem(LAGERNOKKEL)
    if (!rå) return null
    const r = migrer(JSON.parse(rå))
    if (!r.ok) {
      bergLagring(rå)
      return null
    }
    if (r.migrert) {
      bergLagring(rå)
      skrivTilDisk(r.tilstand)
    }
    return r.tilstand
  } catch {
    if (rå) bergLagring(rå)
    return null
  }
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

/** Kjører tiden du var borte: bare bedrifter med leder, og aldri mer enn taket. */
function taIgjenBorteTid(s: Spilltilstand): Spilltilstand {
  const borte = sekunderBorte()
  const etter = simuler(s, Math.min(borte, BORTE_TAK_SEK), true)
  if (borte >= VELKOMST_ETTER_SEK) {
    velkomst = { borteSek: borte, før: s, etter }
    for (const l of velkomstLyttere) l()
  }
  return etter
}

let tilstand: Spilltilstand = (() => {
  const lagret = lastFraDisk()
  return lagret ? taIgjenBorteTid(lagret) : nyttSpill()
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

export function lagre(): void {
  skrivTilDisk(tilstand)
}

/** Kjører en handling fra motoren. Returnerer feilmeldingen hvis den ble avvist. */
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
  if (document.hidden) {
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
  sett(simuler(tilstand, Math.min(hele, MAKS_SEK_PER_STEG)))
  if (naa - sistLagret >= LAGRE_HVERT_MS) {
    sistLagret = naa
    lagre()
  }
}

let startet = false

/** Starter klokken. Trygg å kalle flere ganger. */
export function startSpillokke(): void {
  if (startet) return
  startet = true
  // Lagre med en gang, så klokken for tid borte alltid er satt.
  lagre()
  setInterval(steg, 200)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lagre()
    } else {
      sett(taIgjenBorteTid(tilstand))
      restMs = 0
      sisteMaaling = null
      lagre()
    }
  })
  window.addEventListener('pagehide', lagre)
}

// ─────────────────────────────────────────────── Flytte spillet

/** Koden for spillet slik det står nå. */
export function eksporter(): Promise<string> {
  return pakk(tilstand)
}

/**
 * Bytter ut spillet med det i koden. Det gamle legges i angre-posten, som ved
 * «Start på nytt». Tiden mellom eksport og import regnes ikke som tid borte.
 * Gir en feilmelding, eller null når det gikk.
 */
export async function importer(kode: string): Promise<string | null> {
  const r = await pakkUt(kode)
  if (!r.ok) return r.feil
  try {
    localStorage.setItem(ANGRENOKKEL, JSON.stringify(tilstand))
  } catch {
    // Privat modus — da finnes det heller ingen angre-post.
  }
  restMs = 0
  sisteMaaling = null
  sett(r.tilstand)
  lagre()
  return null
}

// ─────────────────────────────────────────────── Nytt spill

export function startPaaNytt(): void {
  try {
    localStorage.setItem(ANGRENOKKEL, JSON.stringify(tilstand))
  } catch {
    // Privat modus — da finnes det heller ingen angre-post.
  }
  restMs = 0
  sett(nyttSpill(Date.now() % 1_000_000))
  lagre()
}
