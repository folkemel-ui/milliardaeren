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
/** Hentinger som ikke er ferdige ennå (se `ventPaaHenting`). */
const UNDERVEIS = new Set<Promise<unknown>>()

/** En del som hentes med `hent` (en dynamisk `import()`) første gang den trengs. */
export function vedBehov<T>(navn: string, hent: () => Promise<T>): Del<T> {
  let verdi: T | undefined
  let løfte: Promise<T> | undefined
  const lyttere = new Set<() => void>()
  const del: Del<T> = {
    navn,
    verdi: () => verdi,
    last: () => {
      if (løfte) return løfte
      løfte = hent().then(
        (v) => {
          verdi = v
          for (const l of lyttere) l()
          return v
        },
        (feil: unknown) => {
          // Uten nett, eller en ny utgivelse har fjernet den gamle biten: prøv igjen
          // neste gang noe viser delen. Til da står den tomme flaten — men er det en
          // ny utgivelse, lastes siden på nytt, så delene finnes igjen.
          løfte = undefined
          lastNyUtgave()
          throw feil
        },
      )
      const denne = løfte
      UNDERVEIS.add(denne)
      denne.then(
        () => UNDERVEIS.delete(denne),
        () => UNDERVEIS.delete(denne),
      )
      return denne
    },
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

/** Når siden sist ble lastet på nytt for en ny utgivelse (sessionStorage). */
const NY_UTGAVE = 'milliardaer.ny-utgave'

/**
 * En del som ikke kommer, betyr nesten alltid at en ny utgivelse er lagt ut
 * mens spillet sto åpent: hver utgivelse gir delene nye navn, og GitHub Pages
 * har bare den nyeste. Telefonen holder appen i minnet i timevis, og bitene den
 * spør etter, finnes ikke lenger. Da sjekker vi om index.html peker på et annet
 * startskript enn det som kjører, og laster i så fall siden på nytt (spillet
 * lagres på vei ut). Bare i bygget, og høyst én gang hvert halve minutt, så en
 * side uten nett aldri går i ring.
 */
function lastNyUtgave(): void {
  if (!import.meta.env.PROD || typeof document === 'undefined') return
  try {
    if (Date.now() - Number(sessionStorage.getItem(NY_UTGAVE) ?? 0) < 30_000) return
  } catch {
    return
  }
  const kjorer = [...document.scripts].map((s) => s.src).find((src) => /\/assets\/index-[\w-]+\.js$/.test(src))
  if (!kjorer) return
  // Med en egen søkestreng: service workeren svarer skallet («./») fra hurtiglageret.
  fetch(`./index.html?utgave=${Date.now()}`, { cache: 'no-store' })
    .then((svar) => (svar.ok ? svar.text() : ''))
    .then((html) => {
      const nytt = html.match(/assets\/index-[\w-]+\.js/)?.[0]
      if (!nytt || kjorer.endsWith(nytt)) return
      try {
        sessionStorage.setItem(NY_UTGAVE, String(Date.now()))
      } catch {
        return
      }
      location.reload()
    })
    .catch(() => {})
}

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

/**
 * Venter til hentinger som er i gang, er ferdige (eller feilet). Klikktestene kaller
 * den før `vi.resetModules()`: nullstilles modulene midt i en henting, stopper
 * Vitests modullaster, og neste test henger til tidsavbruddet.
 */
export async function ventPaaHenting(): Promise<void> {
  while (UNDERVEIS.size) await Promise.allSettled([...UNDERVEIS])
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
