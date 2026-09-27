/**
 * En enkel, grådig spiller for tester og balansering. Den ser på alle kjøp
 * (oppgradering, ansettelse, ny bedrift), velger det som tjener seg inn
 * raskest — og sparer til det hvis den ikke har råd ennå.
 */

import { ansett, betalSkatt, kjopBedrift, kjopForbedring, oppgrader, type Utfall } from '../handlinger'
import {
  ansettelsespris,
  bedriftInntektPerSek,
  eierType,
  erLaastOpp,
  forbedringspris,
  maksAnsatte,
  nesteForbedring,
  oppgraderingspris,
} from '../formler'
import { BEDRIFTSTYPER, STIGEN } from '../innhold'
import { simuler } from '../simulering'
import type { Bedrift, Spilltilstand } from '../types'

interface Kandidat {
  pris: number
  gevinst: number
  utfor: (s: Spilltilstand) => Utfall
}

function kandidater(s: Spilltilstand): Kandidat[] {
  const liste: Kandidat[] = []
  for (const b of s.bedrifter) {
    const naa = bedriftInntektPerSek(b)
    const opp: Bedrift = { ...b, nivaa: b.nivaa + 1 }
    liste.push({ pris: oppgraderingspris(b), gevinst: bedriftInntektPerSek(opp) - naa, utfor: (t) => oppgrader(t, b.id) })
    const f = nesteForbedring(b)
    if (f && b.nivaa >= f.nivaa) {
      const med: Bedrift = { ...b, forbedringer: b.forbedringer + 1 }
      liste.push({ pris: forbedringspris(b, f), gevinst: bedriftInntektPerSek(med) - naa, utfor: (t) => kjopForbedring(t, b.id) })
    }
    if (b.ansatte < maksAnsatte(b)) {
      const ans: Bedrift = { ...b, ansatte: b.ansatte + 1 }
      liste.push({ pris: ansettelsespris(b), gevinst: bedriftInntektPerSek(ans) - naa, utfor: (t) => ansett(t, b.id) })
    }
  }
  for (const type of STIGEN) {
    if (eierType(s, type) || !erLaastOpp(s, type)) continue
    liste.push({
      pris: BEDRIFTSTYPER[type].pris,
      gevinst: BEDRIFTSTYPER[type].grunninntekt,
      utfor: (t) => kjopBedrift(t, type),
    })
  }
  return liste
}

/** Betaler skatten i tide, så gjør beste kjøp så lenge det er råd til det. */
export function botTrekk(s: Spilltilstand): Spilltilstand {
  for (const r of s.skatt.regninger) {
    const u = betalSkatt(s, r.id)
    if (u.ok) s = u.tilstand
  }
  for (let i = 0; i < 1_000; i++) {
    const beste = kandidater(s)
      .filter((k) => k.gevinst > 0)
      .sort((a, b) => a.pris / a.gevinst - b.pris / b.gevinst)[0]
    if (!beste || beste.pris > s.kontanter) return s
    const u = beste.utfor(s)
    if (!u.ok) return s
    s = u.tilstand
  }
  return s
}

/** Spiller `sekunder` sekunder, med et trekk hvert `hvert` sekund. */
export function botSpill(s: Spilltilstand, sekunder: number, hvert = 5, underveis?: (s: Spilltilstand) => void): Spilltilstand {
  for (let t = 0; t < sekunder; t += hvert) {
    s = simuler(botTrekk(s), Math.min(hvert, sekunder - t))
    underveis?.(s)
  }
  return s
}
