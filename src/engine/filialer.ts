/**
 * Pakke 59 — filialer. En bedrift kan åpne filialer i opptil tre norske byer,
 * én per by. Hver filial legger en andel av bedriftens inntekt til: den første
 * mest, de neste mindre (en fallende avkastning). Kopier av bedrifter ble tatt
 * bort i Pakke 2 fordi de sprengte økonomien — en filial er derfor en del av
 * bedriften, ikke en ny: den deler nivå, ansatte, leder og fusjoner, og prisen
 * følger det du har investert i bedriften, så den vokser med den.
 *
 * Byen betyr noe: hver bransje har en hjemregion der en filial tjener 25 % mer,
 * og regionens eiendomsindeks (regioner.ts) drar inntekten litt opp eller ned —
 * rundt ±6 %. Ingen terning: indeksen går som før.
 */

import { byfaktor, regionFor } from './regioner'
import type { Bedrift, BedriftstypeId, NorskBy, Region, Spilltilstand } from './types'

/** Hver filial gir så stor andel av bedriftens inntekt, i den rekkefølgen de åpnes. */
export const FILIALANDEL = [0.5, 0.35, 0.25]
export const MAKS_FILIALER = FILIALANDEL.length

/** En bedrift må ha nådd så langt før den kan åpne filialer: den må stå på egne bein først. */
export const FILIAL_FRA_NIVAA = 50

/** Byene du kan åpne filial i: én per region. */
export const FILIALBYER: NorskBy[] = ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Geilo', 'Lofoten']

/** En filial i bransjens hjemregion tjener så mye mer. */
export const HJEMME_BONUS = 1.25

/**
 * Hvor bransjen hører hjemme: der en filial gir mest. Fisken i nord, oljen i
 * Stavanger, rederiene i Bergen, pengene i Oslo og skiene på fjellet.
 */
export const HJEMREGION: Record<BedriftstypeId, Region> = {
  saftbod: 'oslo',
  polsebod: 'trondelag',
  gatekjokken: 'bergen',
  kiosk: 'nord',
  kafe: 'bergen',
  restaurant: 'oslo',
  hotell: 'fjellet',
  bank: 'oslo',
  oljeselskap: 'stavanger',
  rederi: 'bergen',
  fiskeoppdrett: 'nord',
  flyselskap: 'trondelag',
  skisenter: 'fjellet',
}

/**
 * En filial koster så mange ganger andelen av det du har investert i
 * bedriften. Satt på balansebenken (Pakke 59) sammen med nivåkravet: uten
 * filialer 1 mrd på 6 t 36 min og 10 mrd på 15 t 28 min, med dem 6 t 12 min og
 * 13 t 47 min. Billigere (×2,5) eller uten nivåkrav ga 8–13 % raskere milliard
 * og 13–17 % raskere ti milliarder; boten kjøpte filialer til de små bedriftene
 * tidlig og løp fra. Dyrere (×4) gjorde den tregere enn uten filialer.
 */
export const FILIALPRIS = 2.75

export function filialer(b: Bedrift): NonNullable<Bedrift['filialer']> {
  return b.filialer ?? []
}

export function erHjemme(type: BedriftstypeId, by: NorskBy): boolean {
  return regionFor(by) === HJEMREGION[type]
}

/** Hvor mye en filial i `by` legger til inntekten, som andel, når den er filial nummer `nr` (0, 1, 2). */
export function filialbidrag(s: Spilltilstand, type: BedriftstypeId, by: NorskBy, nr: number): number {
  return (FILIALANDEL[nr] ?? 0) * (erHjemme(type, by) ? HJEMME_BONUS : 1) * byfaktor(s, by)
}

/** Bedriftens inntekt (før lønn) ganges med dette. Nøyaktig 1 uten filialer, så ingenting annet flytter seg. */
export function filialfaktor(s: Spilltilstand, b: Bedrift): number {
  const f = b.filialer
  if (!f?.length) return 1
  let sum = 1
  for (let i = 0; i < f.length; i++) sum += filialbidrag(s, b.type, f[i].by, i)
  return sum
}

/** Hva neste filial koster, eller null når bedriften ikke kan åpne flere: for lavt nivå, eller så mange den kan få. */
export function filialpris(b: Bedrift): number | null {
  const nr = filialer(b).length
  if (nr >= MAKS_FILIALER || b.nivaa < FILIAL_FRA_NIVAA) return null
  return Math.round(FILIALPRIS * FILIALANDEL[nr] * b.investert)
}

/** Byene bedriften ennå ikke har filial i. */
export function ledigeFilialbyer(b: Bedrift): NorskBy[] {
  const har = new Set(filialer(b).map((f) => f.by))
  return FILIALBYER.filter((by) => !har.has(by))
}

/** Den byen der neste filial gir mest nå — hjemregionen, eller den sterkeste regionen. */
export function besteFilialby(s: Spilltilstand, b: Bedrift): NorskBy | null {
  const nr = filialer(b).length
  let beste: NorskBy | null = null
  let mest = 0
  for (const by of ledigeFilialbyer(b)) {
    const bidrag = filialbidrag(s, b.type, by, nr)
    if (bidrag > mest) {
      mest = bidrag
      beste = by
    }
  }
  return beste
}

/** Byen i bransjens hjemregion. */
export function hjemby(type: BedriftstypeId): NorskBy {
  return FILIALBYER.find((by) => erHjemme(type, by))!
}
