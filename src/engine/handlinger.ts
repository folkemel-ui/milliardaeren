/**
 * Spillerens handlinger. Hver er en ren funksjon: tilstand inn, ny tilstand
 * (eller en feilmelding) ut. Inndataene røres aldri.
 */

import {
  ansettelsespris,
  eierType,
  erLaastOpp,
  lederpris,
  maksAnsatte,
  maksKjop,
  maksNyttLaan,
  forbedringspris,
  nesteForbedring,
  oppgraderingspris,
} from './formler'
import { utforEiendomssalg, utforKjop, utforLuksussalg, utforRivalsalg, utforSalg } from './handel'
import { BLOKK, blokkpris, oppkjopspris } from './rivaler'
import {
  brukteplasser,
  EIENDOM_SYNLIG_VED,
  eiendomspris,
  EIENDOMSTYPER,
  LAGER,
  LAGER_FOR,
  LUKSUS,
  oppussingspris,
  standard,
  STANDARDER,
  statusnivaa,
  utvidelsespris,
} from './eiendom'
import { BEDRIFTSTYPER } from './innhold'
import { DAG_SEK, erHelg } from './kalender'
import { flyt } from './portefolje'
import { PAPIRER, rundAntall } from './marked'
import type { Bedrift, BedriftstypeId, EiendomId, LagerId, LuksusId, Ordretype, PapirId, Spilltilstand } from './types'

export type Utfall = { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }

const feil = (tekst: string): Utfall => ({ ok: false, feil: tekst })

function finn(s: Spilltilstand, id: string): Bedrift | undefined {
  return s.bedrifter.find((b) => b.id === id)
}

/**
 * Betaler for noe i en bedrift: trekker prisen, kjører endringen på en kopi,
 * og legger beløpet til bedriftens investerte verdi.
 */
function investerI(s: Spilltilstand, id: string, pris: number, endring: (b: Bedrift) => void): Utfall {
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const b = finn(n, id)!
  n.kontanter -= pris
  b.investert += pris
  endring(b)
  return { ok: true, tilstand: n }
}

export function kjopBedrift(s: Spilltilstand, type: BedriftstypeId): Utfall {
  const t = BEDRIFTSTYPER[type]
  if (!t) return feil('Ukjent bransje.')
  if (eierType(s, type)) return feil(`Du eier allerede en ${t.navn.toLowerCase()}.`)
  if (!erLaastOpp(s, type)) return feil(`${t.navn} er ikke låst opp ennå.`)
  if (s.kontanter < t.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= t.pris
  n.bedrifter.push({
    id: `b${n.nesteId}`,
    type,
    nivaa: 1,
    startetSek: n.sek,
    ansatte: 0,
    leder: false,
    investert: t.pris,
    tjent: 0,
    inntektHistorikk: [],
    forbedringer: 0,
  })
  n.nesteId += 1
  return { ok: true, tilstand: n }
}

export function oppgrader(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  return investerI(s, id, oppgraderingspris(b), (n) => {
    n.nivaa += 1
  })
}

export function kjopForbedring(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  const f = nesteForbedring(b)
  if (!f) return feil('Alle forbedringene er kjøpt.')
  if (b.nivaa < f.nivaa) return feil(`${f.navn} krever nivå ${f.nivaa}.`)
  return investerI(s, id, forbedringspris(b, f), (n) => {
    n.forbedringer += 1
  })
}

export function ansett(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (b.ansatte >= maksAnsatte(b)) return feil('Det er ikke plass til flere ansatte. Oppgrader bedriften først.')
  return investerI(s, id, ansettelsespris(b), (n) => {
    n.ansatte += 1
  })
}

// ─────────────────────────────────────────────── Aksjer og krypto

/** Aksjer kan ikke handles i helgen; krypto kan. */
export function borsenStengt(s: Spilltilstand, id: PapirId): boolean {
  return PAPIRER[id].klasse === 'aksje' && erHelg(s.sek)
}

const STENGT = 'Børsen er stengt i helgen. Den åpner mandag morgen.'

export function kjopPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  if (!PAPIRER[id]) return feil('Ukjent papir.')
  if (borsenStengt(s, id)) return feil(STENGT)
  const a = rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil kjøpe.')
  if (a > maksKjop(s, id)) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const kostnad = utforKjop(n, id, a)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, kostnad)
  return { ok: true, tilstand: n }
}

export function selgPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  const b = s.beholdning[id]
  if (!b) return feil('Du eier ingen.')
  if (borsenStengt(s, id)) return feil(STENGT)
  // Et salg av (nesten) alt selger alt, så det ikke blir liggende støv igjen.
  const a = antall >= b.antall - 1e-9 ? b.antall : rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  const inntekt = utforSalg(n, id, a)
  const gevinst = inntekt - b.kostpris * (a / b.antall)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  n.rekorder.storsteGevinst = Math.max(n.rekorder.storsteGevinst, gevinst)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Eiendom

export function eiendomSynlig(s: Spilltilstand, id: EiendomId): boolean {
  return s.hoyesteFormue >= EIENDOMSTYPER[id].pris * EIENDOM_SYNLIG_VED
}

export function kjopEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  const t = EIENDOMSTYPER[id]
  if (!t) return feil('Ukjent eiendom.')
  if (!eiendomSynlig(s, id)) return feil(`${t.navn} er ikke til salgs for deg ennå.`)
  if (statusnivaa(s) < t.statuskrav) return feil(`Du trenger statusnivå ${t.statuskrav} for å kjøpe ${t.navn.toLowerCase()}.`)
  if ((s.eiendommer[id] ?? 0) >= t.maksAntall) return feil(`Du eier allerede alle ${t.maksAntall} som er til salgs.`)
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const pris = eiendomspris(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.eiendommer[id] = (n.eiendommer[id] ?? 0) + 1
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

export function selgEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen.')
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const n = structuredClone(s)
  utforEiendomssalg(n, id)
  return { ok: true, tilstand: n }
}

/**
 * Pusser opp alle enhetene av en type ett trinn. Pengene går ut nå, standarden
 * kommer når håndverkerne er ferdige — og så lenge står enhetene tomme.
 * Kostnaden legges til kostprisen, så avkastningen regnes riktig.
 */
export function pussOpp(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen å pusse opp.')
  if (s.oppussing[id]) return feil('Oppussingen er allerede i gang.')
  const pris = oppussingspris(s, id)
  if (pris === null) return feil('Høyeste standard er allerede nådd.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const neste = standard(s, id) + 1
  const n = structuredClone(s)
  n.kontanter -= pris
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  n.oppussing[id] = { standard: neste, ferdigSek: n.sek + STANDARDER[neste].dager * DAG_SEK }
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Luksus og lager

export function kjopLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  const g = LUKSUS[id]
  if (!g) return feil('Ukjent gjenstand.')
  if (s.luksus.includes(id)) return feil(`Du eier allerede ${g.navn.toLowerCase()}.`)
  const lager = LAGER_FOR[g.kategori]
  if (lager && brukteplasser(s, lager) >= s.lager[lager]) {
    return feil(`Du har ikke plass. Bygg ut ${LAGER[lager].bestemt} først.`)
  }
  if (s.kontanter < g.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= g.pris
  n.totaltForbruk += g.pris
  n.luksus.push(id)
  return { ok: true, tilstand: n }
}

export function selgLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  if (!s.luksus.includes(id)) return feil('Du eier den ikke.')
  const n = structuredClone(s)
  utforLuksussalg(n, id)
  return { ok: true, tilstand: n }
}

export function utvidLager(s: Spilltilstand, lager: LagerId): Utfall {
  if (!LAGER[lager]) return feil('Ukjent lager.')
  const pris = utvidelsespris(s, lager)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris
  n.lager[lager] += 1
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Skatt

export function betalSkatt(s: Spilltilstand, id: number): Utfall {
  const r = s.skatt.regninger.find((x) => x.id === id)
  if (!r) return feil('Fant ikke regningen.')
  if (s.kontanter < r.belop) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= r.belop
  n.skatt.totaltBetalt += r.belop
  n.skatt.regninger = n.skatt.regninger.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

export function settOffshore(s: Spilltilstand, på: boolean): Utfall {
  if (s.skatt.offshore === på) return feil(på ? 'Offshore er allerede i bruk.' : 'Offshore er allerede av.')
  const n = structuredClone(s)
  n.skatt.offshore = på
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Rivaler

function finnRival(s: Spilltilstand, id: string) {
  return s.rivaler.find((r) => r.id === id)
}

/** Kjøper en blokk på 10 % i en rivals selskap, opp til halvparten. */
export function kjopRivalblokk(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r) return feil('Fant ikke rivalen.')
  if (r.overtatt) return feil('Du eier allerede hele selskapet.')
  if (r.andel >= 0.5 - 1e-9) return feil('Over 50 % krever et fiendtlig oppkjøp av resten.')
  const pris = blokkpris(r)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = finnRival(n, id)!
  n.kontanter -= pris
  nr.andel = Math.round((nr.andel + BLOKK) * 10) / 10
  nr.kostpris += pris
  flyt(n, 'rival', pris)
  return { ok: true, tilstand: n }
}

/** Fiendtlig oppkjøp: med minst 50 % kan du kjøpe resten med premie og eie hele selskapet. */
export function overtaRival(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r) return feil('Fant ikke rivalen.')
  if (r.overtatt) return feil('Du eier allerede hele selskapet.')
  if (r.andel < 0.5 - 1e-9) return feil('Du må eie minst 50 % før du kan kjøpe resten.')
  const pris = oppkjopspris(r)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = finnRival(n, id)!
  n.kontanter -= pris
  nr.andel = 1
  nr.kostpris += pris
  nr.overtatt = true
  flyt(n, 'rival', pris)
  return { ok: true, tilstand: n }
}

export function selgRivalandel(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r || r.andel <= 0) return feil('Du eier ingen andel.')
  const n = structuredClone(s)
  utforRivalsalg(n, id)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Automatiske ordre

export const MAKS_ORDRE = 20

export function nyOrdre(s: Spilltilstand, papir: PapirId, type: Ordretype, grense: number, antall: number): Utfall {
  if (!PAPIRER[papir]) return feil('Ukjent papir.')
  if (!(grense > 0)) return feil('Sett en grense over null.')
  const a = rundAntall(papir, antall)
  if (a <= 0) return feil('Velg hvor mange ordren gjelder.')
  if (type !== 'kjop' && !s.beholdning[papir]) return feil('Du eier ingen å selge.')
  if (s.ordre.length >= MAKS_ORDRE) return feil(`Du kan ha høyst ${MAKS_ORDRE} aktive ordre.`)
  const n = structuredClone(s)
  n.ordre.push({ id: n.nesteOrdreId++, papir, type, grense, antall: a })
  return { ok: true, tilstand: n }
}

export function slettOrdre(s: Spilltilstand, id: number): Utfall {
  if (!s.ordre.some((o) => o.id === id)) return feil('Fant ikke ordren.')
  const n = structuredClone(s)
  n.ordre = n.ordre.filter((o) => o.id !== id)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Avisen

export function lesAvis(s: Spilltilstand): Utfall {
  const siste = s.avis[s.avis.length - 1]
  if (!siste || s.avisLest >= siste.dag) return feil('Ingen nye utgaver.')
  const n = structuredClone(s)
  n.avisLest = siste.dag
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Sparekontoen

export function settInn(s: Spilltilstand, belop: number): Utfall {
  const b = Math.min(belop, s.kontanter)
  if (b <= 0) return feil('Du har ingen kontanter å sette inn.')
  const n = structuredClone(s)
  n.kontanter -= b
  n.sparing += b
  flyt(n, 'sparing', b)
  return { ok: true, tilstand: n }
}

export function taUt(s: Spilltilstand, belop: number): Utfall {
  const b = Math.min(belop, s.sparing)
  if (b <= 0) return feil('Sparekontoen er tom.')
  const n = structuredClone(s)
  n.sparing -= b
  n.kontanter += b
  flyt(n, 'sparing', -b)
  // Restbeløp under én krone føres over, så kontoen faktisk blir tom.
  if (n.sparing < 1) {
    flyt(n, 'sparing', -n.sparing)
    n.kontanter += n.sparing
    n.sparing = 0
  }
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Banken

export function laan(s: Spilltilstand, belop: number): Utfall {
  const b = Math.floor(belop)
  if (b <= 0) return feil('Velg hvor mye du vil låne.')
  if (b > maksNyttLaan(s)) return feil('Banken låner deg ikke så mye.')
  const n = structuredClone(s)
  n.kontanter += b
  n.gjeld += b
  return { ok: true, tilstand: n }
}

export function nedbetal(s: Spilltilstand, belop: number): Utfall {
  const b = Math.min(belop, s.gjeld)
  if (b <= 0) return feil('Du har ingen gjeld å betale.')
  if (b > s.kontanter) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= b
  n.gjeld -= b
  // Restgjeld under én krone strykes, så lånet faktisk blir borte.
  if (n.gjeld < 1) n.gjeld = 0
  return { ok: true, tilstand: n }
}

export function ansettLeder(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (b.leder) return feil('Bedriften har allerede en leder.')
  return investerI(s, id, lederpris(b.type), (n) => {
    n.leder = true
  })
}
