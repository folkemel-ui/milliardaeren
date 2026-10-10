/**
 * Deler av spillet som lastes når de trengs (Grafikkpakke G12).
 *
 * Startskriptet skal bare ha med det første skjermbilde trenger. Eiendoms- og
 * luksustegningene og kartene ligger i hver sin bit (`ui/komponenter/ved-behov/`)
 * som hentes første gang noe viser dem — og i ro like etter start (`forvarm`), så
 * et fanebytte nesten aldri venter, og så service workeren har alt lagret før
 * spilleren går uten nett (den lagrer bare det som er hentet).
 *
 * Komponentene som bruker en del, heter det samme som før og tar de samme
 * argumentene (`Illustrasjon`, `Norgeskart`, `Verdenskart`): skjermene merker
 * ingenting. Til delen er her, viser de en tom flate i samme størrelse, så ingenting
 * hopper når tegningen kommer.
 */

import { useSyncExternalStore } from 'react'

export interface Del<T> {
  /** Navnet, til feilmeldinger og testene. */
  navn: string
  /** Henter delen (én gang); løftet gir verdien. */
  last: () => Promise<T>
  /** Verdien hvis delen er hentet, ellers undefined. */
  verdi: () => T | undefined
  /** Melder fra når delen kommer (useSyncExternalStore), og henter den om den mangler. */
  abonner: (lytter: () => void) => () => void
}

const ALLE: Del<unknown>[] = []

/** En del som hentes med `hent` (en dynamisk `import()`) første gang den trengs. */
export function vedBehov<T>(navn: string, hent: () => Promise<T>): Del<T> {
  let verdi: T | undefined
  let løfte: Promise<T> | undefined
  const lyttere = new Set<() => void>()
  const del: Del<T> = {
    navn,
    verdi: () => verdi,
    last: () =>
      (løfte ??= hent().then(
        (v) => {
          verdi = v
          for (const l of lyttere) l()
          return v
        },
        (feil: unknown) => {
          // Uten nett, eller en ny utgivelse har fjernet den gamle biten: prøv igjen
          // neste gang noe viser delen. Til da står den tomme flaten.
          løfte = undefined
          throw feil
        },
      )),
    abonner: (lytter) => {
      lyttere.add(lytter)
      if (verdi === undefined) del.last().catch(() => {})
      return () => lyttere.delete(lytter)
    },
  }
  ALLE.push(del as Del<unknown>)
  return del
}

const ingen = () => () => {}

/**
 * Verdien til en del, og en ny tegning når den kommer. Henter delen om den
 * mangler. `null` betyr «ingen del» (det som vises, ligger alt i startskriptet).
 */
export function useDel<T>(del: Del<T> | null): T | undefined {
  const abonner = del ? del.abonner : ingen
  const les = () => del?.verdi()
  return useSyncExternalStore(abonner, les, les)
}

/** Alle delene som er laget så langt. */
export function alleDeler(): readonly Del<unknown>[] {
  return ALLE
}

/** Henter alle delene, én etter én. Galleriet og testene venter på dette. */
export async function lastAlle(): Promise<void> {
  for (const del of ALLE) await del.last()
}

/**
 * Henter resten i ro etter at første skjermbilde er tegnet: når nettleseren har
 * ledig tid, men senest etter to sekunder. Én del om gangen, så spillet ikke
 * hakker. En del som ikke kommer, hentes igjen når den vises.
 */
export function forvarm(): void {
  const ro: (f: () => void) => void =
    typeof requestIdleCallback === 'function' ? (f) => requestIdleCallback(f, { timeout: 2000 }) : (f) => setTimeout(f, 1000)
  const neste = (i: number) => {
    const del = ALLE[i]
    if (!del) return
    ro(() =>
      del
        .last()
        .catch(() => {})
        .then(() => neste(i + 1)),
    )
  }
  neste(0)
}
