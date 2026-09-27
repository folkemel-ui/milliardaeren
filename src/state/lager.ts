/**
 * Tilstandslageret og spilløkken. Ett enkelt abonnementslager i stedet for et
 * rammeverk — spillet har én tilstand, og alle endringer går gjennom motoren.
 *
 * Klokken bor her, ikke i motoren: lageret måler ekte tid og ber motoren
 * simulere hele sekunder. Tiden står stille når spillet er lukket eller
 * skjult — inntekt mens du er borte kommer med ledere senere.
 */

import { useSyncExternalStore } from 'react'
import { nyttSpill } from '../engine/start'
import { simuler } from '../engine/simulering'
import { migrer } from './migrering'
import type { Spilltilstand } from '../engine/types'

const LAGERNOKKEL = 'milliardaer.lagring'
/* «Start på nytt» sletter aldri: det forrige spillet legges her. */
const ANGRENOKKEL = 'milliardaer.lagring.angre'
const BERGENOKKEL = 'milliardaer.lagring.korrupt'

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
  } catch {
    // Full disk eller privat modus — spillet fungerer, det lagres bare ikke.
  }
}

let tilstand: Spilltilstand = lastFraDisk() ?? nyttSpill()
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
  setInterval(steg, 200)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) lagre()
  })
  window.addEventListener('pagehide', lagre)
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
