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
  oppgraderingspris,
} from './formler'
import { utforEiendomssalg, utforKjop, utforLuksussalg, utforSalg } from './handel'
import {
  brukteplasser,
  EIENDOM_SYNLIG_VED,
  eiendomspris,
  EIENDOMSTYPER,
  LAGER,
  LAGER_FOR,
  LUKSUS,
  statusnivaa,
  utvidelsespris,
} from './eiendom'
import { BEDRIFTSTYPER } from './innhold'
import { erHelg } from './kalender'
import { flyt } from './portefolje'
import { PAPIRER, rundAntall } from './marked'
import type { Bedrift, BedriftstypeId, EiendomId, LagerId, LuksusId, PapirId, Spilltilstand } from './types'

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
  const n = structuredClone(s)
  utforEiendomssalg(n, id)
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
  n.lager[lager] += 1
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
