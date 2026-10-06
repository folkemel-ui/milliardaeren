/**
 * Geometrien til Norgeskartet, uten React, så den kan testes: projeksjonen,
 * innfeltet for Nord-Norge, hvor hver by står og hvilken side navnet står på.
 *
 * Hovedkartet viser Sør-Norge fra Lista til Namdalen, der nesten alt skjer.
 * Nord-Norge (Trondheim til Nordkapp) står som et innfelt nederst til høyre,
 * over Sverige, og Lofoten står i innfeltet (Grafikkpakke G3).
 *
 * Kystlinjene og fjellområdene står i kartdata.ts (Natural Earth). Her står
 * projeksjonene, hvor byene står, og hvor navn, antall og trendpil står.
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

/** Innfeltet: Nord-Norge fra Trondheim til Nordkapp, nederst til høyre over Sverige. */
export const INNFELT = { x: 149, y: 184, bredde: 99, hoyde: 112 }
/** Området innfeltet viser, i grader: vest, øst, sør, nord. */
export const NORDOMRAADE = { vest: 9.6, ost: 31.4, sor: 63.1, nord: 71.3 }
/** Lengdegradene krympes med cos(67°) ≈ 0,39, så formen holder seg så langt nord. */
const NORD_KOS = 0.39
const NORD_SKALA = Math.min((INNFELT.bredde - 6) / ((NORDOMRAADE.ost - NORDOMRAADE.vest) * NORD_KOS), (INNFELT.hoyde - 6) / (NORDOMRAADE.nord - NORDOMRAADE.sor))
export function innfeltpunkt([lon, lat]: Punkt): Punkt {
  const b = (NORDOMRAADE.ost - NORDOMRAADE.vest) * NORD_KOS * NORD_SKALA
  const h = (NORDOMRAADE.nord - NORDOMRAADE.sor) * NORD_SKALA
  return [INNFELT.x + (INNFELT.bredde - b) / 2 + (lon - NORDOMRAADE.vest) * NORD_KOS * NORD_SKALA, INNFELT.y + (INNFELT.hoyde - h) / 2 + (NORDOMRAADE.nord - lat) * NORD_SKALA]
}

/** Kystruta skipet går (Pakke 46): fra Bergen langs kysten rundt Lindesnes og inn Oslofjorden — litt ute på sjøen. */
export const KYSTRUTA: [number, number][] = [
  [4.6, 60.45], [4.6, 59.6], [4.95, 59.05], [5.3, 58.5], [6.0, 57.98], [6.9, 57.8], [8.0, 57.92], [8.9, 58.25], [9.6, 58.72], [10.35, 59.0], [10.55, 59.35],
]
/** Navnene på havet og nabolandet, i små bokstaver over kartet. */
export const KARTNAVN: { navn: string; pos: Punkt; hav: boolean }[] = [
  { navn: 'Nordsjøen', pos: [2.4, 59.4], hav: true },
  { navn: 'Skagerrak', pos: [8.3, 57.75], hav: true },
  { navn: 'Norskehavet', pos: [4.6, 63.6], hav: true },
  { navn: 'SVERIGE', pos: [14.6, 62.6], hav: false },
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
  Oslo: { pos: [10.75, 59.91], side: 'venstre' },
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

/**
 * En liten, rolig prikk (G3): alle byer like store, så de rikeste ikke
 * dekker naboene. Antallet står i et lite merke ved siden av (`merkeboks`).
 */
export function radius(by: NorskBy, eid: boolean): number {
  if (eid) return 3.2
  return KUN_JORD.has(by) ? 2 : 2.6
}

/** Høyden på antallsmerket, og bredden for et antall med n sifre. */
export const MERKE_HOYDE = 9
export const merkebredde = (sifre: number) => 3.6 + sifre * 4.4
/** Plassen kronen tar inne i merket når du eier hele byen. */
export const KRONEPLASS = 6

/**
 * Hvor antallsmerket står: på skrå ved prikken, på motsatt side av navnet, så
 * det aldri dekker navnet — oppe til venstre når navnet står til høyre, oppe
 * til høyre når det står til venstre eller under, og nede til høyre når det
 * står over. Gir boksen (øvre venstre hjørne, bredde, høyde).
 */
export function merkeboks(by: NorskBy, r: number, sifre: number, krone = false) {
  const [x, y] = byPunkt(by)
  const b = merkebredde(sifre) + (krone ? KRONEPLASS : 0)
  const side = BYPLAN[by].side
  const mx = side === 'hoyre' ? x - r * 0.6 - b : x + r * 0.6
  const my = side === 'over' ? y + r * 0.6 : y - r * 0.6 - MERKE_HOYDE
  return { x: mx, y: my, b, h: MERKE_HOYDE }
}

/** Plassen trendpila (▲ eller ▼ etter navnet, i samme tekst) tar. */
export const TRENDPIL = 6

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
  // Navnet får plass til trendpila ved siden av seg (G3), så den aldri kolliderer.
  const navnB = tekstbredde(by, NAVN_HOYDE) + TRENDPIL
  const leieB = leietekst ? tekstbredde(leietekst, LEIE_STORRELSE) : 0
  const avstand = r + (BYPLAN[by].innfelt ? 2.5 : 3.5)
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
