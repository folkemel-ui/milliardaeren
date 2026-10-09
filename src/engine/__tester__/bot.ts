/**
 * En enkel, grådig spiller for tester og balansering. Den ser på alle kjøp
 * (oppgradering, ansettelse, ny bedrift, fusjon), velger det som tjener seg inn
 * raskest — og sparer til det hvis den ikke har råd ennå.
 */

import { aapneFilial, ansett, betalSkatt, byPaaBedrift, godtaMotbud, kjopBedrift, kjopForbedring, oppgrader, oppgraderFlere, velgRetning, type Utfall } from '../handlinger'
import { besteFilialby, filialbidrag, filialer, filialfaktor, filialpris } from '../filialer'
import { BUD, dagensForhandling, FUSJONSFAKTOR, prisantydning, rivalbedrifter } from '../fusjon'
import {
  ansettelsespris,
  bedriftInntektPerSek,
  eierType,
  erLaastOpp,
  forbedringspris,
  maksAnsatte,
  nesteForbedring,
  nesteMilepael,
  oppgraderingspris,
  prisForNivaaer,
} from '../formler'
import { BEDRIFTSTYPER, STIGEN } from '../innhold'
import { simuler } from '../simulering'
import { GRADER, GRADLISTE, kanVelgeRetning, medNyAnsatt } from '../ansatte'
import type { Bedrift, Spilltilstand } from '../types'

interface Kandidat {
  pris: number
  gevinst: number
  utfor: (s: Spilltilstand) => Utfall
}

function kandidater(s: Spilltilstand, smart: boolean): Kandidat[] {
  const liste: Kandidat[] = []
  for (const b of s.bedrifter) {
    // Filialene ganger inntekten før lønn (Pakke 59). Uten filialer er ff nøyaktig 1, som før.
    const ff = filialfaktor(s, b)
    const inntekt = (x: Bedrift) => bedriftInntektPerSek(x, ff)
    const naa = inntekt(b)
    const opp: Bedrift = { ...b, nivaa: b.nivaa + 1 }
    liste.push({ pris: oppgraderingspris(b), gevinst: inntekt(opp) - naa, utfor: (t) => oppgrader(t, b.id) })
    // En filial gir en andel av inntekten før lønn: inntekten ved faktor 1 minus ved faktor 0.
    const fpris = filialpris(b)
    const by = besteFilialby(s, b)
    if (smart && fpris !== null && by) {
      const brutto = bedriftInntektPerSek(b, 1) - bedriftInntektPerSek(b, 0)
      liste.push({ pris: fpris, gevinst: brutto * filialbidrag(s, b.type, by, filialer(b).length), utfor: (t) => aapneFilial(t, b.id, by) })
    }
    // Den smarte boten (balansebenken, Pakke 47) ser som en spiller: har du råd
    // til å gå helt opp til neste dobling, regnes det som ett kjøp. Den sparer
    // ikke til det — det gjør de færreste. Den enkle boten ser bare neste nivå;
    // gullmesteren spiller med den, så fasiten står fast når boten blir klokere.
    const m = nesteMilepael(b.nivaa)
    const tilDobling = m === null ? Infinity : prisForNivaaer(b, m - b.nivaa)
    if (smart && m !== null && m - b.nivaa > 1 && tilDobling <= s.kontanter) {
      const antall = m - b.nivaa
      liste.push({
        pris: tilDobling,
        gevinst: inntekt({ ...b, nivaa: m }) - naa,
        utfor: (t) => oppgraderFlere(t, b.id, antall),
      })
    }
    const f = nesteForbedring(b)
    if (f && b.nivaa >= f.nivaa) {
      const med: Bedrift = { ...b, forbedringer: b.forbedringer + 1 }
      liste.push({ pris: forbedringspris(b, f), gevinst: inntekt(med) - naa, utfor: (t) => kjopForbedring(t, b.id) })
    }
    if (b.ansatte < maksAnsatte(b)) {
      // Den enkle boten ansetter bare erfarne, som før Pakke 48; den smarte vurderer alle nivåene.
      for (const grad of smart ? GRADLISTE : (['erfaren'] as const)) {
        if (b.nivaa < GRADER[grad].fraNivaa) continue
        liste.push({ pris: ansettelsespris(b, grad), gevinst: inntekt(medNyAnsatt(b, grad)) - naa, utfor: (t) => ansett(t, b.id, grad) })
      }
    }
  }
  // Fusjoner: boten byr alltid sjenerøst, og godtar et motbud med én gang.
  const sjenerost = BUD.find((b) => b.id === 'sjenerost')!.faktor
  for (const r of s.rivaler) {
    for (const rb of rivalbedrifter(r)) {
      const din = s.bedrifter.find((b) => b.type === rb.type)
      const f = dagensForhandling(s, r, rb.type)
      if (!din || (f && f.motbud === null)) continue
      liste.push({
        pris: f?.motbud ?? Math.round(prisantydning(s, rb) * sjenerost),
        gevinst: bedriftInntektPerSek(din) * (FUSJONSFAKTOR - 1),
        utfor: (t) => {
          if (f) return godtaMotbud(t, r.id, rb.type)
          const u = byPaaBedrift(t, r.id, rb.type, 'sjenerost')
          if (!u.ok || !dagensForhandling(u.tilstand, u.tilstand.rivaler.find((x) => x.id === r.id)!, rb.type)) return u
          const g = godtaMotbud(u.tilstand, r.id, rb.type)
          return g.ok ? g : u
        },
      })
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
export function botTrekk(s: Spilltilstand, smart = false): Spilltilstand {
  for (const r of s.skatt.regninger) {
    const u = betalSkatt(s, r.id)
    if (u.ok) s = u.tilstand
  }
  // Den smarte boten velger volum på nivå 50: retningen er gratis, og volum gir inntekt.
  if (smart) {
    for (const b of s.bedrifter) {
      if (!kanVelgeRetning(b)) continue
      const u = velgRetning(s, b.id, 'volum')
      if (u.ok) s = u.tilstand
    }
  }
  for (let i = 0; i < 1_000; i++) {
    const beste = kandidater(s, smart)
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
export function botSpill(s: Spilltilstand, sekunder: number, hvert = 5, underveis?: (s: Spilltilstand) => void, smart = false): Spilltilstand {
  for (let t = 0; t < sekunder; t += hvert) {
    s = simuler(botTrekk(s, smart), Math.min(hvert, sekunder - t))
    underveis?.(s)
  }
  return s
}
