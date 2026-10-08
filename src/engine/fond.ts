/**
 * Indeksfondene: Børsfondet følger alle aksjene, Kryptofondet alle myntene,
 * med lik vekt. Kursen regnes ut av medlemmenes kurser — snittet av hvor mye
 * hver har steget siden start, ganget med 100 — så fondet trenger ingen egen
 * kurs å lagre, og svinger mindre enn hvert enkelt papir.
 *
 * Fond kjøpes for et beløp, ikke et antall, har lavt gebyr og flytter ikke
 * kursene — og ser bort fra trykket dine egne handler gir medlemmene.
 * Børsfondet handles bare når børsen er åpen.
 */

import { AKSJER, KRYPTO, markedskurs, NYE_PAPIRER, PAPIRER } from './marked'
import { erHelg } from './kalender'
import type { FondId, PapirId, Spilltilstand } from './types'

export interface Fond {
  id: FondId
  navn: string
  beskrivelse: string
  klasse: 'aksje' | 'krypto'
  medlemmer: PapirId[]
}

/*
 * Fondene har de papirene som fantes da de kom. Fondskursen er snittet av hvor
 * mye medlemmene har steget siden start, så et nytt medlem ville flyttet kursen
 * — og verdien av fond folk alt eier — i ett hopp.
 */
const FONDSAKSJER = AKSJER.filter((id) => !NYE_PAPIRER.includes(id))
const FONDSMYNTER = KRYPTO.filter((id) => !NYE_PAPIRER.includes(id))

export const FOND: Record<FondId, Fond> = {
  BORSFOND: { id: 'BORSFOND', navn: 'Børsfondet', beskrivelse: 'De åtte eldste aksjene med lik vekt. Tryggere enn én aksje, og gir snittet av utbyttet.', klasse: 'aksje', medlemmer: FONDSAKSJER },
  KRYPTOFOND: { id: 'KRYPTOFOND', navn: 'Kryptofondet', beskrivelse: 'De seks eldste myntene med lik vekt. Fortsatt vilt, men ingen enkeltmynt kan ta deg helt ned.', klasse: 'krypto', medlemmer: FONDSMYNTER },
}

export const FONDLISTE = Object.keys(FOND) as FondId[]

/** Gebyr på hvert kjøp og salg — en femtedel av kurtasjen på enkeltpapirer. */
export const FOND_GEBYR = 0.001

/** Fondskursen av en rekke kurser, én per medlem. */
function kursAv(f: Fond, kurs: (id: PapirId) => number): number {
  return (100 * f.medlemmer.reduce((sum, id) => sum + kurs(id) / PAPIRER[id].startkurs, 0)) / f.medlemmer.length
}

/** Fondskursen ser bort fra ditt eget kurstrykk, så et fond ikke kan pumpes ved å kjøpe medlemmene (Pakke 56). */
export function fondskurs(s: Spilltilstand, id: FondId): number {
  return kursAv(FOND[id], (p) => markedskurs(s.marked.kurser[p]))
}

/** Fondets historikk, regnet ut av medlemmenes. Like lang som den korteste. */
export function fondshistorikk(s: Spilltilstand, id: FondId): number[] {
  const f = FOND[id]
  const lengde = Math.min(...f.medlemmer.map((p) => s.marked.kurser[p].historikk.length))
  return Array.from({ length: lengde }, (_, i) =>
    kursAv(f, (p) => {
      const h = s.marked.kurser[p].historikk
      return h[h.length - lengde + i]
    }),
  )
}

/** Utbytte per børsdag, som andel av verdien: snittet av medlemmene, med kvartalsjusteringene. */
export function fondsutbytte(s: Spilltilstand, id: FondId): number {
  const f = FOND[id]
  return f.medlemmer.reduce((sum, p) => sum + PAPIRER[p].utbytte * (s.kvartal?.[p]?.utbytteFaktor ?? 1), 0) / f.medlemmer.length
}

export function fondStengt(s: Spilltilstand, id: FondId): boolean {
  return FOND[id].klasse === 'aksje' && erHelg(s.sek)
}

export function fondverdi(s: Spilltilstand, klasse?: 'aksje' | 'krypto'): number {
  let sum = 0
  for (const id of FONDLISTE) {
    const b = s.fond?.[id]
    if (b && (!klasse || FOND[id].klasse === klasse)) sum += b.antall * fondskurs(s, id)
  }
  return sum
}

export function fondKostpris(s: Spilltilstand): number {
  return FONDLISTE.reduce((sum, id) => sum + (s.fond?.[id]?.kostpris ?? 0), 0)
}

/** Utbyttet fondene gir ved en børsåpning. */
export function fondsutbytteIDag(s: Spilltilstand): number {
  return FONDLISTE.reduce((sum, id) => sum + (s.fond?.[id]?.antall ?? 0) * fondskurs(s, id) * fondsutbytte(s, id), 0)
}
