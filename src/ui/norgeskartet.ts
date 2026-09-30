/**
 * Geometrien til Norgeskartet, uten React, så den kan testes: projeksjonen,
 * innfeltet for Nord-Norge, hvor hver by står og hvilken side navnet står på.
 *
 * Hovedkartet viser Sør-Norge fra Lista til Namdalen, der nesten alt skjer.
 * Hele landet står som et lite innfelt nederst til høyre (der Sverige ville
 * vært), og Lofoten står i innfeltet.
 */

import { EIENDOMSTYPER } from '../engine/eiendom'
import type { NorskBy } from '../engine/types'

type Punkt = [number, number]

/** Hovedkartet: x = (lengde − 4,4) · 0,5 · 40, y = (65 − bredde) · 40. 0,5 ≈ cos(60°). */
export function hovedpunkt([lon, lat]: Punkt): Punkt {
  return [(lon - 4.4) * 0.5 * 40, (65 - lat) * 40]
}

/** Utsnittet av hovedkartet. Luft til venstre, så «Bergen» og «Stavanger» får plass utenfor kysten. */
export const VISNING = { x: -64, y: 0, bredde: 314, hoyde: 300 }

/** Innfeltet: hele landet i liten skala, i en ramme nederst til høyre. */
export const INNFELT = { x: 170, y: 194, bredde: 78, hoyde: 76 }
const INNFELT_SKALA = 4.6
export function innfeltpunkt([lon, lat]: Punkt): Punkt {
  return [INNFELT.x + 6 + (lon - 4) * 0.46 * INNFELT_SKALA, INNFELT.y + 6 + (71.4 - lat) * INNFELT_SKALA]
}

/** Hjørnene av hovedkartets utsnitt i lengde og bredde, til rammen som viser det i innfeltet. */
export const HOVEDOMRAADE: [Punkt, Punkt] = [
  [VISNING.x / 20 + 4.4, 65 - VISNING.y / 40],
  [(VISNING.x + VISNING.bredde) / 20 + 4.4, 65 - (VISNING.y + VISNING.hoyde) / 40],
]

export type Side = 'hoyre' | 'venstre' | 'over' | 'under'

/**
 * Hver by: hvor den ligger og hvilken side navnet står på. Sidene er valgt så
 * ingen navn, leietall eller prikker overlapper når alle byene er fulle — en
 * test sjekker det.
 */
export const BYPLAN: Record<NorskBy, { pos: Punkt; side: Side; innfelt?: boolean }> = {
  Bergen: { pos: [5.32, 60.39], side: 'venstre' },
  Stavanger: { pos: [5.73, 58.97], side: 'venstre' },
  Lista: { pos: [6.7, 58.1], side: 'hoyre' },
  Geilo: { pos: [8.21, 60.53], side: 'over' },
  Oslo: { pos: [10.75, 59.91], side: 'under' },
  Hedmarken: { pos: [11.07, 60.79], side: 'hoyre' },
  Trysil: { pos: [12.27, 61.31], side: 'hoyre' },
  Trondheim: { pos: [10.4, 63.43], side: 'hoyre' },
  Namdalen: { pos: [11.5, 64.47], side: 'hoyre' },
  Lofoten: { pos: [14.56, 68.23], side: 'under', innfelt: true },
}

export const BYLISTE = Object.keys(BYPLAN) as NorskBy[]

/** Stedene som bare har gårder og skoger, ingen bygg. De vises små og uten navn til du eier noe der. */
export const KUN_JORD = new Set<NorskBy>(BYLISTE.filter((by) => !Object.values(EIENDOMSTYPER).some((t) => t.by === by)))

export function byPunkt(by: NorskBy): Punkt {
  const p = BYPLAN[by]
  return p.innfelt ? innfeltpunkt(p.pos) : hovedpunkt(p.pos)
}

/** Alle byer med bygg har samme prikk, så de rikeste ikke dekker naboene. Innfeltet har mindre prikker. */
export function radius(by: NorskBy, eid: boolean): number {
  if (BYPLAN[by].innfelt) return eid ? 5 : 3
  if (eid) return 7
  return KUN_JORD.has(by) ? 3 : 4.5
}

/** Skriftstørrelsen på navnet: mindre i innfeltet, så det ikke dekker landet. */
export function navnestorrelse(by: NorskBy): number {
  return BYPLAN[by].innfelt ? 7.5 : 10
}

export const LEIE_STORRELSE = 7.5

/** Omtrentlig bredde på en tekst i kartets skala. Litt romslig, så testen heller tar for mye enn for lite. */
export function tekstbredde(tekst: string, storrelse: number): number {
  return tekst.length * storrelse * 0.6
}

/**
 * Hvor navnet og leien står for en by med gitt radius: ankerpunkt og
 * tekstjustering, og boksene de fyller (til testen).
 */
export function etiketter(by: NorskBy, r: number, leietekst: string | null) {
  const [x, y] = byPunkt(by)
  const side = BYPLAN[by].side
  const NAVN_HOYDE = navnestorrelse(by)
  const LEIE_HOYDE = LEIE_STORRELSE + 0.5
  const navnB = tekstbredde(by, NAVN_HOYDE)
  const leieB = leietekst ? tekstbredde(leietekst, LEIE_STORRELSE) : 0
  const avstand = r + (BYPLAN[by].innfelt ? 2.5 : 4)
  // Navnet og leien står som en blokk: navnet først, leien under (over når blokken står over prikken).
  const blokkH = NAVN_HOYDE + (leietekst ? LEIE_HOYDE : 0)
  let topp: number
  let venstre: (b: number) => number
  let anker: 'start' | 'end' | 'middle'
  let ax: number
  if (side === 'hoyre' || side === 'venstre') {
    topp = y - NAVN_HOYDE / 2
    ax = side === 'hoyre' ? x + avstand : x - avstand
    anker = side === 'hoyre' ? 'start' : 'end'
    venstre = (b) => (side === 'hoyre' ? ax : ax - b)
  } else {
    topp = side === 'over' ? y - avstand - blokkH : y + avstand
    ax = x
    anker = 'middle'
    venstre = (b) => x - b / 2
  }
  // SVG-tekst plasseres ved grunnlinjen; 0,8 av høyden ned fra toppen.
  const navn = { x: ax, y: topp + NAVN_HOYDE * 0.8, anker, boks: { x: venstre(navnB), y: topp, b: navnB, h: NAVN_HOYDE } }
  const leie = leietekst
    ? { x: ax, y: topp + NAVN_HOYDE + LEIE_HOYDE * 0.8, anker, boks: { x: venstre(leieB), y: topp + NAVN_HOYDE, b: leieB, h: LEIE_HOYDE } }
    : null
  return { navn, leie }
}
