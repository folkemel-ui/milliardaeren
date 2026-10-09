/**
 * Delene i fanene (Pakke 61): Investeringer, Børs, Eiendomskartet og Profil
 * følger samme regel — de åpner der du var sist, også etter omlasting.
 * Valget huskes i nettleseren, ikke i lagringen, og kan settes utenfra
 * (skattemerket åpner Regnskap, Oversikt åpner Børs på krypto), så hvert
 * sett er en liten delt tilstand, ikke en useState i skjermen.
 */

import { useSyncExternalStore } from 'react'

export interface Delvalg<T extends string> {
  /** Delen som er valgt nå, utenfor React. */
  les(): T
  sett(del: T): void
  /** Delen som er valgt nå, i en komponent. */
  bruk(): T
}

/** Et sett med deler som huskes under `nokkel`. Den første delen er standard. */
export function lagDelvalg<T extends string>(nokkel: string, deler: readonly T[]): Delvalg<T> {
  const lyttere = new Set<() => void>()
  let naa: T = deler[0]
  try {
    const v = localStorage.getItem(nokkel)
    if (deler.includes(v as T)) naa = v as T
  } catch {
    // Uten lagring starter alle sett på første del.
  }
  const abonner = (l: () => void) => {
    lyttere.add(l)
    return () => {
      lyttere.delete(l)
    }
  }
  const les = () => naa
  return {
    les,
    sett(del) {
      if (del === naa) return
      naa = del
      try {
        localStorage.setItem(nokkel, del)
      } catch {
        // Da huskes valget bare til siden lastes på nytt.
      }
      for (const l of lyttere) l()
    },
    bruk: () => useSyncExternalStore(abonner, les, les),
  }
}

// ─────────────────────────────────────────────── Settene

export type Profildel = 'meg' | 'regnskap' | 'statistikk' | 'innstillinger'

export const PROFILDELER: { id: Profildel; navn: string }[] = [
  { id: 'meg', navn: 'Meg' },
  { id: 'regnskap', navn: 'Regnskap' },
  { id: 'statistikk', navn: 'Statistikk' },
  { id: 'innstillinger', navn: 'Innstillinger' },
]

export type Investeringsdel = 'oversikt' | 'bors' | 'selskaper' | 'bank'

export const INVESTERINGSDELER: { id: Investeringsdel; navn: string }[] = [
  { id: 'oversikt', navn: 'Oversikt' },
  { id: 'bors', navn: 'Børs' },
  { id: 'selskaper', navn: 'Selskaper' },
  { id: 'bank', navn: 'Bank' },
]

export type Borsdel = 'aksje' | 'krypto'
export type Kartdel = 'norge' | 'verden'

// Nøklene fra før Pakke 61 beholdes, så valgene spillerne har gjort, står.
export const profildel = lagDelvalg<Profildel>('milliardaer.profilfane', PROFILDELER.map((d) => d.id))
export const investeringsdel = lagDelvalg<Investeringsdel>('milliardaer.investeringsdel', INVESTERINGSDELER.map((d) => d.id))
export const borsdel = lagDelvalg<Borsdel>('milliardaer.borsvalg', ['aksje', 'krypto'])
export const kartdel = lagDelvalg<Kartdel>('milliardaer.eiendomskart', ['norge', 'verden'])

/** Alle settene, for testen som sjekker at de følger samme regel. */
export const ALLE_DELVALG = { profildel, investeringsdel, borsdel, kartdel }

export const settProfildel = profildel.sett
export const useProfildel = profildel.bruk
