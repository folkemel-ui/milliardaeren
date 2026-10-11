/**
 * Utleie av yachtene og jetene (Pakke 89). De dyreste tingene i samlingen ga bare
 * status; nå kan de leies ut de ukene du ikke bruker dem. Yachtene leies best om
 * sommeren og jetene om vinteren — utenfor sesongen går det tregere.
 *
 * Avkastningen er en andel av nyprisen per time, lavere enn eiendom (5,5–7 % på
 * toppen): 3 % i sesongen og 1 % utenfor, rundt 1,8 % over året. En ting som er
 * leid ut, gir statusen som før — og jetene åpner fortsatt verden — men den kan
 * ikke selges før den er hjemme igjen, og det tar til neste dagsskifte.
 *
 * Ingen terning: leien følger kalenderen alene, så ingenting annet i spillet flytter seg.
 */

import { LUKSUS, maanedFor } from './eiendom'
import { dagnummer } from './kalender'
import type { LuksusId, Spilltilstand } from './types'

/** Tingene som kan leies ut, og sesongen de leies best i. */
export const CHARTERBAR: Partial<Record<LuksusId, 'sommer' | 'vinter'>> = {
  superyacht: 'sommer',
  megayacht: 'sommer',
  langdistansejet: 'vinter',
  widebodyjet: 'vinter',
}

export const CHARTERLISTE = Object.keys(CHARTERBAR) as LuksusId[]

/** Leie per time som andel av nyprisen: i sesongen og utenfor. */
export const CHARTER_I_SESONG = 0.03
export const CHARTER_UTENFOR = 0.01

/** Månedene som er sesong (0 = januar): yachtene mai–september, jetene november–mars. */
export const SESONGMAANEDER: Record<'sommer' | 'vinter', number[]> = {
  sommer: [4, 5, 6, 7, 8],
  vinter: [10, 11, 0, 1, 2],
}

export const kanLeiesUt = (id: LuksusId) => CHARTERBAR[id] !== undefined

export const erUtleid = (s: Spilltilstand, id: LuksusId) => !!s.charter?.[id]

/** Om det er sesong for tingen på en dag. */
export function iSesong(id: LuksusId, dag: number): boolean {
  const sesong = CHARTERBAR[id]
  return !!sesong && SESONGMAANEDER[sesong].includes(maanedFor(dag))
}

/** Leien per time akkurat nå, som andel av nyprisen. 0 for det som ikke kan leies ut. */
export function chartersats(s: Spilltilstand, id: LuksusId): number {
  if (!kanLeiesUt(id)) return 0
  return iSesong(id, dagnummer(s.sek)) ? CHARTER_I_SESONG : CHARTER_UTENFOR
}

/** Det tingen gir per sekund når den er leid ut nå. */
export function charterPerSekFor(s: Spilltilstand, id: LuksusId): number {
  return (LUKSUS[id].pris * chartersats(s, id)) / 3600
}

/** All utleie per sekund akkurat nå. */
export function charterPerSek(s: Spilltilstand): number {
  const c = s.charter
  if (!c) return 0
  let sum = 0
  for (const id of CHARTERLISTE) if (c[id]) sum += charterPerSekFor(s, id)
  return sum
}

/**
 * Betaler `sek` sekunder utleie (1 når du spiller, en blokk når du er borte — som leia).
 * Pengene teller som leie i regnskapet og skatten. Muterer.
 */
export function betalCharter(s: Spilltilstand, sek: number): void {
  const c = s.charter
  if (!c) return
  for (const id of CHARTERLISTE) {
    const u = c[id]
    if (!u) continue
    const belop = charterPerSekFor(s, id) * sek
    u.tjent += belop
    s.kontanter += belop
    s.totaltLeie += belop
  }
}

/** Det du har bedt om hjem, kommer hjem ved dagsskiftet. Muterer. */
export function charterVedDagsskifte(s: Spilltilstand): void {
  const c = s.charter
  if (!c) return
  for (const id of CHARTERLISTE) if (c[id]?.hentes) delete c[id]
}
