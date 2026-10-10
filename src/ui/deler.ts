/**
 * Delene i fanene (Pakke 61): Investeringer, Børs, Eiendomskartet, Profil og
 * Luksus (Pakke 62) følger samme regel — de åpner der du var sist, også etter omlasting.
 * Valget huskes i nettleseren, ikke i lagringen, og kan settes utenfra
 * (skattemerket åpner Regnskap, Oversikt åpner Børs på krypto), så hvert
 * sett er en liten delt tilstand, ikke en useState i skjermen.
 *
 * Plass til nye områder (Pakke 66) — regelen før spillet vokser:
 *   1. Fanelinja har fem faner og får ikke flere (hver er ~75 px på en telefon).
 *   2. En fane har høyst fire deler (raden med fire får akkurat plass).
 *   3. Et nytt område blir en del i fanen hvis spørsmål det svarer på: det du
 *      eier for moro → Luksus, der pengene arbeider → Investeringer.
 *   4. Vokser et område ut av delen sin, får det en detaljside — et lag med
 *      tilbake, som en bedrifts side — aldri en femte del eller en sjette fane.
 * Klubben er en del i Luksus; stadion er et kort i den. pakke66.test.ts passer på tallene.
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

/** Luksus i deler (Pakke 62). Klubben har sin egen del; den er ikke luksus. */
export type Luksusdel = 'samling' | 'hjem' | 'kunst' | 'klubb'

export const LUKSUSDELER: { id: Luksusdel; navn: string }[] = [
  { id: 'samling', navn: 'Samling' },
  { id: 'hjem', navn: 'Hjem' },
  { id: 'kunst', navn: 'Kunst' },
  { id: 'klubb', navn: 'Klubb' },
]

/** Børs: aksjer, krypto — og indeksfondene, som kjøpes som aksjer (Pakke 65). */
/** Rekkefølgen på bedriftene (Pakke 65): slik du kjøpte dem, eller etter fast inntekt. */
export type Bedriftsrekkefolge = 'kjopt' | 'inntekt'

export const REKKEFOLGER: { id: Bedriftsrekkefolge; navn: string }[] = [
  { id: 'kjopt', navn: 'Kjøpt' },
  { id: 'inntekt', navn: 'Inntekt' },
]

export type Borsdel = 'aksje' | 'krypto' | 'fond'
export type Kartdel = 'norge' | 'verden'

// Nøklene fra før Pakke 61 beholdes, så valgene spillerne har gjort, står.
export const profildel = lagDelvalg<Profildel>('milliardaer.profilfane', PROFILDELER.map((d) => d.id))
export const investeringsdel = lagDelvalg<Investeringsdel>('milliardaer.investeringsdel', INVESTERINGSDELER.map((d) => d.id))
export const luksusdel = lagDelvalg<Luksusdel>('milliardaer.luksusdel', LUKSUSDELER.map((d) => d.id))
export const borsdel = lagDelvalg<Borsdel>('milliardaer.borsvalg', ['aksje', 'krypto', 'fond'])
export const kartdel = lagDelvalg<Kartdel>('milliardaer.eiendomskart', ['norge', 'verden'])
export const bedriftsrekkefolge = lagDelvalg<Bedriftsrekkefolge>('milliardaer.bedriftsrekkefolge', REKKEFOLGER.map((r) => r.id))

/** Alle settene, for testen som sjekker at de følger samme regel. */
export const ALLE_DELVALG = { profildel, investeringsdel, luksusdel, borsdel, kartdel, bedriftsrekkefolge }

/**
 * Hvilke deler en fane viser nå, som én nøkkel. Rullingen huskes bare for de
 * samme delene (Pakke 74): en annen del, eller en annen by i Eiendom, starter
 * øverst. Byvalget er en useState i skjermen og forsvinner med fanen, så det
 * leses fra knappen som er valgt.
 */
export function delnokkel(fane: string): string {
  switch (fane) {
    case 'bedrifter':
      return bedriftsrekkefolge.les()
    case 'investeringer':
      return `${investeringsdel.les()}/${borsdel.les()}`
    case 'eiendom':
      return `${kartdel.les()}/${(typeof document === 'undefined' ? '' : (document.querySelector('.byvalg button.aktiv')?.textContent?.trim() ?? ''))}`
    case 'luksus':
      return luksusdel.les()
    case 'profil':
      return profildel.les()
    default:
      return ''
  }
}

export const settProfildel = profildel.sett
export const useProfildel = profildel.bruk
