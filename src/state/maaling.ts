/**
 * Tall fra telefonen selv (Pakke 76). Alt om hvor raskt spillet går på en
 * telefon var anslått fra en PC: en treg telefon antatt fem ganger tregere.
 * Her måles det som teller der spillet faktisk kjører — tiden borte som regnes
 * ut når du kommer tilbake, ett sekund med spill, lagringen og oppstarten — og
 * Innstillinger viser det når spillet er åpnet med «?maal» i adressen.
 *
 * Målingen koster nesten ingenting (to `performance.now()` per sekund) og
 * huskes bare til siden lastes på nytt; ingenting går i lagringen. Bare
 * målepanelet lytter, så ingenting annet tegnes på nytt av den.
 */

import { useSyncExternalStore } from 'react'

export interface Maalinger {
  /**
   * Den lengste tiden borte som er regnet ut siden siden ble lastet: hvor lang tid det tok, og hvor
   * mye spilltid det var. Den lengste, så et kort fanebytte ikke skriver over de to timene du testet.
   */
  borte: { ms: number; sek: number } | null
  /** De siste sekundene med spill, i millisekunder per spillsekund. */
  sekunder: number[]
  /** Siste lagring: hvor lang tid den tok, og hvor stor den er. */
  lagring: { ms: number; byte: number } | null
  /** Fra siden begynte å laste til spillet var tegnet første gang. */
  oppstartMs: number | null
}

/** Så mange spillsekunder snittet og toppen regnes over. */
export const SEKUNDER_HUSKET = 60

let maalinger: Maalinger = { borte: null, sekunder: [], lagring: null, oppstartMs: null }
const lyttere = new Set<() => void>()

function endre(m: Partial<Maalinger>): void {
  maalinger = { ...maalinger, ...m }
  for (const l of lyttere) l()
}

export function maalBorte(ms: number, sek: number): void {
  if (maalinger.borte && maalinger.borte.sek > sek) return
  endre({ borte: { ms, sek } })
}

/** `ms` for `antall` spillsekunder i ett steg av spilløkken. */
export function maalSekund(ms: number, antall: number): void {
  if (antall <= 0) return
  const per = ms / antall
  const liste = maalinger.sekunder.length >= SEKUNDER_HUSKET ? maalinger.sekunder.slice(1) : maalinger.sekunder.slice()
  liste.push(per)
  // Bare målepanelet lytter, og det står bare der når «?maal» er slått på.
  endre({ sekunder: liste })
}

export function maalLagring(ms: number, byte: number): void {
  endre({ lagring: { ms, byte } })
}

export function maalOppstart(ms: number): void {
  if (maalinger.oppstartMs === null) endre({ oppstartMs: ms })
}

export function hentMaalinger(): Maalinger {
  return maalinger
}

export function useMaalinger(): Maalinger {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l)
      return () => {
        lyttere.delete(l)
      }
    },
    () => maalinger,
    () => maalinger,
  )
}

/** Snitt og topp for de siste spillsekundene, eller null før det finnes noen. */
export function sekundtall(m: Maalinger): { snitt: number; topp: number; antall: number } | null {
  if (m.sekunder.length === 0) return null
  let sum = 0
  let topp = 0
  for (const x of m.sekunder) {
    sum += x
    if (x > topp) topp = x
  }
  return { snitt: sum / m.sekunder.length, topp, antall: m.sekunder.length }
}

const NOKKEL = 'milliardaer.maal'

/**
 * Om målepanelet skal vises: «?maal» i adressen slår det på og husker det, så
 * det står der også når spillet åpnes fra hjemskjermen; «?maal=av» slår det av.
 */
export function visMaaling(): boolean {
  try {
    const sok = new URLSearchParams(location.search)
    if (sok.has('maal')) {
      if (sok.get('maal') === 'av') localStorage.removeItem(NOKKEL)
      else localStorage.setItem(NOKKEL, '1')
    }
    return localStorage.getItem(NOKKEL) === '1'
  } catch {
    return false
  }
}

export function skjulMaaling(): void {
  try {
    localStorage.removeItem(NOKKEL)
  } catch {
    // Da forsvinner det ved neste omlasting uansett.
  }
}

/** Til testene. */
export function nullstillMaalinger(): void {
  maalinger = { borte: null, sekunder: [], lagring: null, oppstartMs: null }
}
