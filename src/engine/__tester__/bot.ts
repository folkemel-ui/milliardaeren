/**
 * En enkel, grådig spiller for tester og balansering. Den ser på alle kjøp
 * (oppgradering, ansettelse, ny bedrift, fusjon), velger det som tjener seg inn
 * raskest — og sparer til det hvis den ikke har råd ennå.
 */

import { aapneFilial, ansett, betalSkatt, byPaaBedrift, godtaMotbud, innred, kjopBedrift, kjopForbedring, kjopLandemerke, kjopLuksus, oppgrader, oppgraderFlere, utvidLager, velgRetning, type Utfall } from '../handlinger'
import { brukteplasser, LAGER, LAGER_FOR, LUKSUS, LUKSUSLISTE, START_LAGER, STATUS_INNTEKT, STATUSNIVAAER, statusnivaa, statuspoeng } from '../eiendom'
import { HJEM, HJEMLISTE, hjemAapent, nesteTrinn } from '../hjemmene'
import { eierDu, kjopsprisLandemerke, LANDEMERKELISTE, LANDEMERKER } from '../landemerker'
import { besteFilialby, filialbidrag, filialer, filialfaktor, filialpris } from '../filialer'
import { BUD, dagensForhandling, FUSJON_FRA_NIVAA, FUSJONSFAKTOR, prisantydning, rivalbedrifter } from '../fusjon'
import {
  ansettelsespris,
  bedriftInntektPerSek,
  eierType,
  inntektPerSek,
  statusfaktor,
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
import type { Bedrift, LagerId, Spilltilstand } from '../types'

interface Kandidat {
  pris: number
  gevinst: number
  utfor: (s: Spilltilstand) => Utfall
}

/** Statusnivået så mange poeng gir. */
function nivaaFor(poeng: number): number {
  let n = 0
  for (let i = 0; i < STATUSNIVAAER.length; i++) if (poeng >= STATUSNIVAAER[i].poeng) n = i
  return n
}

/** Én ting som gir status: hva den koster (med lagerplassen den trenger), hva den gir, og hvordan den kjøpes. */
interface Statuskjop {
  pris: number
  poeng: number
  utfor: (s: Spilltilstand) => Utfall
}

/**
 * Status som ett kjøp (Pakke 70): det billigste settet av luksus, rom og
 * landemerker — regnet i kroner per statuspoeng — som løfter statusen minst
 * ett nivå. Gevinsten er det nivåene gir i inntekt. Kunst og klubb holdes
 * utenfor: kunsten svinger, og klubben gir status først gjennom trofeer.
 * Bare den smarte boten ser dette, så gullmesteren står.
 */
function statuskandidat(s: Spilltilstand): Kandidat | null {
  const nivaa = statusnivaa(s)
  if (nivaa >= STATUSNIVAAER.length - 1) return null
  const har = statuspoeng(s)
  const trenger = STATUSNIVAAER[nivaa + 1].poeng - har
  const valg: Statuskjop[] = []
  // Hver ny bil, båt og fly utover ledig plass koster en utvidelse til, dyrere for hver.
  const ledig: Record<LagerId, number> = { garasje: 0, havn: 0, hangar: 0 }
  const utvidelser: Record<LagerId, number> = { garasje: 0, havn: 0, hangar: 0 }
  for (const l of Object.keys(ledig) as LagerId[]) ledig[l] = s.lager[l] - brukteplasser(s, l)
  for (const id of LUKSUSLISTE) {
    if (s.luksus.includes(id)) continue
    const g = LUKSUS[id]
    const lager = LAGER_FOR[g.kategori]
    let pris = g.pris
    if (lager && ledig[lager] <= 0) {
      const kjopt = s.lager[lager] - START_LAGER[lager] + utvidelser[lager]
      pris += Math.round(LAGER[lager].startpris * LAGER[lager].vekst ** kjopt)
      utvidelser[lager] += 1
    } else if (lager) ledig[lager] -= 1
    valg.push({
      pris,
      poeng: g.status,
      utfor: (t) => {
        if (lager && brukteplasser(t, lager) >= t.lager[lager]) {
          const u = utvidLager(t, lager)
          if (!u.ok) return u
          t = u.tilstand
        }
        return kjopLuksus(t, id)
      },
    })
  }
  for (const hjem of HJEMLISTE) {
    if (!hjemAapent(s, hjem)) continue
    for (const rom of HJEM[hjem].rom) {
      const trinn = nesteTrinn(s, rom)
      if (trinn) valg.push({ pris: trinn.pris, poeng: trinn.status, utfor: (t) => innred(t, rom) })
    }
  }
  for (const id of LANDEMERKELISTE) {
    if (eierDu(s, id)) continue
    valg.push({ pris: kjopsprisLandemerke(s, id), poeng: LANDEMERKER[id].status, utfor: (t) => kjopLandemerke(t, id) })
  }
  valg.sort((a, b) => a.pris / a.poeng - b.pris / b.poeng)
  const sett: Statuskjop[] = []
  let poeng = 0
  let pris = 0
  for (const v of valg) {
    if (poeng >= trenger) break
    sett.push(v)
    poeng += v.poeng
    pris += v.pris
  }
  if (poeng < trenger) return null
  const grunn = inntektPerSek(s) / statusfaktor(s)
  return {
    pris,
    gevinst: grunn * STATUS_INNTEKT * (nivaaFor(har + poeng) - nivaa),
    utfor: (t) => {
      let u: Utfall = { ok: true, tilstand: t }
      for (const v of sett) {
        u = v.utfor(u.tilstand)
        if (!u.ok) return u
      }
      return u
    },
  }
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
      if (!din || din.nivaa < FUSJON_FRA_NIVAA || (f && f.motbud === null)) continue
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
  if (smart) {
    const status = statuskandidat(s)
    if (status) liste.push(status)
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
