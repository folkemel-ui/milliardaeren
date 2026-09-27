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
  oppgraderingspris,
} from './formler'
import { BEDRIFTSTYPER } from './innhold'
import type { Bedrift, BedriftstypeId, Spilltilstand } from './types'

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

export function ansettLeder(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (b.leder) return feil('Bedriften har allerede en leder.')
  return investerI(s, id, lederpris(b.type), (n) => {
    n.leder = true
  })
}
