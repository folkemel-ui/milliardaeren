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
import { utforKjop, utforSalg } from './handel'
import { BEDRIFTSTYPER } from './innhold'
import { PAPIRER, rundAntall } from './marked'
import type { Bedrift, BedriftstypeId, PapirId, Spilltilstand } from './types'

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
  n.bedrifter.push({ id: `b${n.nesteId}`, type, nivaa: 1, startetSek: n.sek, ansatte: 0, leder: false, investert: t.pris })
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

export function kjopPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  if (!PAPIRER[id]) return feil('Ukjent papir.')
  const a = rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil kjøpe.')
  if (a > maksKjop(s, id)) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  utforKjop(n, id, a)
  return { ok: true, tilstand: n }
}

export function selgPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  const b = s.beholdning[id]
  if (!b) return feil('Du eier ingen.')
  // Et salg av (nesten) alt selger alt, så det ikke blir liggende støv igjen.
  const a = antall >= b.antall - 1e-9 ? b.antall : rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  utforSalg(n, id, a)
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
