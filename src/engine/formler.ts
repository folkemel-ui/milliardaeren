/** Rene utregninger over tilstanden. Ingen av dem endrer noe. */

import {
  ANSATT_BONUS,
  ANSATTE_PER_NIVAA,
  ANSETTELSE_FAKTOR,
  ANSETTELSE_VEKST,
  BEDRIFTSTYPER,
  FORBEDRING_PRISFAKTOR,
  FORBEDRINGER,
  LAANETAK_TIMER,
  LEDER_MINSTEPRIS,
  LONN_PER_ANSATT,
  MAKS_ANSATTE,
  MAKS_BELAANING,
  MILEPAELER,
  MILEPAELFAKTORER,
  RENTE_PER_TIME,
  SPARERENTE_PER_TIME,
} from './innhold'
import { handelskurs, KURTASJE, maksPerOrdre, PAPIRER, rundAntall } from './marked'
import {
  eiendomsverdi,
  leiePerSek,
  luksusverdi,
  STATUS_INNTEKT,
  STATUS_RENTEKUTT,
  statusnivaa,
} from './eiendom'
import { rivalutbyttePerSek, rivalverdi } from './rivaler'
import { fusjonsfaktor } from './fusjon'
import { GRADER, retningsfaktor, teller, verdifaktor } from './ansatte'
import { dagsfaktor, NORMAL_STYRINGSRENTE, styringsrente } from './verden'
import { nyhetsfaktor } from './bransjer'
import { filialfaktor } from './filialer'
import { hjemverdi } from './hjemmene'
import { kupongPerSek, obligasjonsverdi } from './obligasjoner'
import { dagnummer } from './kalender'
import { startupverdi } from './startups'
import { klubbverdi } from './klubb'
import { kunstverdi } from './kunst'
import { fondverdi } from './fond'
import type { Ansattgrad, Bedrift, BedriftstypeId, Beholdning, Forbedring, PapirId, Spilltilstand } from './types'

// ─────────────────────────────────────────────── Nivåer

/** Inntektsmultiplikatoren fra milepælene: ×2 for 25, 50 og 100, ×1,5 for 150, 200 og 250 (Pakke 70). */
export function milepaelfaktor(nivaa: number): number {
  // Uten filter og nye lister: dette regnes for hver bedrift hvert sekund.
  // Til og med nivå 149 er produktet bit for bit det samme som 2 ** n var.
  let f = 1
  for (let i = 0; i < MILEPAELER.length; i++) if (nivaa >= MILEPAELER[i]) f *= MILEPAELFAKTORER[i]
  return f
}

/** Hva milepælen på `nivaa` ganger inntekten med — 1 når nivået ikke er en milepæl. */
export function milepaelboost(nivaa: number): number {
  return MILEPAELFAKTORER[MILEPAELER.indexOf(nivaa)] ?? 1
}

/** Neste nivå som dobler inntekten, eller null når alle er nådd. */
export function nesteMilepael(nivaa: number): number | null {
  return MILEPAELER.find((m) => m > nivaa) ?? null
}

export function oppgraderingspris(b: Bedrift): number {
  return nivaapris(b, b.nivaa)
}

/** Prisen for å gå fra `nivaa` til neste — samme regning som oppgraderingspris, uten å kopiere bedriften. */
function nivaapris(b: Bedrift, nivaa: number): number {
  const t = BEDRIFTSTYPER[b.type]
  return Math.round(t.oppgraderingspris * t.vekst ** (nivaa - 1))
}

/** Så mange nivåer kan kjøpes i én handling — et tak så «Maks» aldri løper løpsk. */
export const MAKS_NIVAAER_PER_KJOP = 1000

/** Hva `antall` nivåer koster samlet: summen av prisene for hvert nivå, avrundet likt som ett og ett. */
export function prisForNivaaer(b: Bedrift, antall: number): number {
  let sum = 0
  for (let i = 0; i < antall; i++) sum += nivaapris(b, b.nivaa + i)
  return sum
}

/** Hvor mange nivåer du har råd til med `kontanter`, høyst MAKS_NIVAAER_PER_KJOP. */
export function nivaaerDuHarRaadTil(b: Bedrift, kontanter: number): number {
  return raadTil(b, kontanter).antall
}

/** Hvor mange nivåer du har råd til, og hva de koster samlet — i én runde. */
export function raadTil(b: Bedrift, kontanter: number): { antall: number; pris: number } {
  let sum = 0
  let n = 0
  while (n < MAKS_NIVAAER_PER_KJOP) {
    const neste = nivaapris(b, b.nivaa + n)
    if (sum + neste > kontanter) break
    sum += neste
    n++
  }
  return { antall: n, pris: sum }
}

// ─────────────────────────────────────────────── Inntekt

/** Produktet av forbedringene som er kjøpt. */
export function forbedringsfaktor(b: Bedrift): number {
  const liste = FORBEDRINGER[b.type]
  let f = 1
  for (let i = 0; i < b.forbedringer && i < liste.length; i++) f *= liste[i].faktor
  return f
}

/** Neste forbedring som kan kjøpes (kanskje ikke låst opp ennå), eller null når alle er kjøpt. */
export function nesteForbedring(b: Bedrift): Forbedring | null {
  return FORBEDRINGER[b.type][b.forbedringer] ?? null
}

export function forbedringspris(b: Bedrift, f: Forbedring): number {
  const t = BEDRIFTSTYPER[b.type]
  return Math.round(t.oppgraderingspris * t.vekst ** (f.nivaa - 1) * FORBEDRING_PRISFAKTOR)
}

/** Inntekten fra nivået, forbedringene, fusjonene og retningen, før ansatte og lønn. */
export function basisinntekt(b: Bedrift): number {
  return BEDRIFTSTYPER[b.type].grunninntekt * b.nivaa * milepaelfaktor(b.nivaa) * forbedringsfaktor(b) * fusjonsfaktor(b) * retningsfaktor(b)
}

/**
 * Lønnen til de ansatte per sekund: fast per ansatt, uansett nivå. En erfaren
 * koster LONN_PER_ANSATT ganger grunninntekten, en junior halvparten og en
 * stjerne det tredobbelte (Pakke 48). Med bare erfarne er regnestykket det
 * samme som før juniorene og stjernene fantes.
 */
export function bedriftLonn(b: Bedrift): number {
  const erfaren = BEDRIFTSTYPER[b.type].grunninntekt * LONN_PER_ANSATT
  const n = teller(b)
  return erfaren * n.erfaren + erfaren * GRADER.junior.lonn * n.junior + erfaren * GRADER.stjerne.lonn * n.stjerne
}

/**
 * Nettoinntekt per sekund: basis, pluss det de ansatte gir, minus lønnen deres.
 * Kan bli negativ. `dag` er dagens faktor fra kalenderen (ukedag, vær, trend,
 * helligdag — Pakke 49); den virker på salget, ikke på lønnen.
 */
export function bedriftInntektPerSek(b: Bedrift, dag = 1): number {
  const n = teller(b)
  const bonus = 1 + ANSATT_BONUS * n.erfaren + GRADER.junior.bonus * n.junior + GRADER.stjerne.bonus * n.stjerne
  return basisinntekt(b) * bonus * dag - bedriftLonn(b)
}

/** Alt som endrer en bransjes inntekt i dag: kalenderen (Pakke 49) og nyhetene i bransjen (Pakke 53). */
export function dagensFaktor(s: Spilltilstand, type: BedriftstypeId): number {
  return dagsfaktor(s, type) * nyhetsfaktor(s, type)
}

/**
 * Alt inntekten (før lønn) ganges med for én bedrift i dag: kalenderen og
 * nyhetene i bransjen, og filialene (Pakke 59). Uten filialer er det dagensFaktor.
 */
export function bedriftsfaktor(s: Spilltilstand, b: Bedrift): number {
  return dagensFaktor(s, b.type) * filialfaktor(s, b)
}

/** Det bedriften tjener per sekund i dag: med dagens kalenderfaktor, filialene og statusbonusen. */
export function bedriftInntektIDag(s: Spilltilstand, b: Bedrift): number {
  return bedriftInntektPerSek(b, bedriftsfaktor(s, b)) * statusfaktor(s)
}

/**
 * En bedrift er verdt det du har investert i den: kjøpet, oppgraderingene,
 * forbedringene og fusjonene — og 30 % mer når den har valgt premium. Ansatte
 * og ledere er driftskostnader og bokføres ikke — de koster nettoformue.
 */
export function bedriftsverdi(b: Bedrift): number {
  return b.investert * verdifaktor(b)
}

/**
 * Samlet inntekt per sekund fra bedriftene. Når du er borte, går bare de med
 * leder — de andre er stengt, og da betales heller ingen lønn.
 */
export function inntektPerSek(s: Spilltilstand, borte = false): number {
  const sum = s.bedrifter.reduce((sum, b) => (borte && !b.leder ? sum : sum + bedriftInntektPerSek(b, bedriftsfaktor(s, b))), 0)
  return sum * statusfaktor(s)
}

/** Statusen din gir bedriftene litt mer inntekt. */
export function statusfaktor(s: Spilltilstand): number {
  return 1 + STATUS_INNTEKT * statusnivaa(s)
}

/**
 * Flytende rente per time før statusrabatt: følger styringsrenten (Pakke 49).
 * I normale tider (4 %) er den RENTE_PER_TIME, som før.
 */
export function flytendeRente(s: Spilltilstand): number {
  return RENTE_PER_TIME * (styringsrente(s) / NORMAL_STYRINGSRENTE)
}

/** Fastrenten som gjelder nå, eller null når lånet har flytende rente (eller bindingen er ute). */
export function fastrente(s: Spilltilstand): number | null {
  const b = s.rentebinding
  return b && dagnummer(s.sek) < b.tilDag ? b.sats : null
}

/** Renten per time, etter statusrabatt: fast hvis du har bundet den, ellers flytende. */
export function rentesats(s: Spilltilstand): number {
  return (fastrente(s) ?? flytendeRente(s)) - STATUS_RENTEKUTT * statusnivaa(s)
}

export function rentePerSek(s: Spilltilstand): number {
  return (s.gjeld * rentesats(s)) / 3600
}

/** Sparerenten per time følger styringsrenten, som lånerenten (Pakke 49). */
export function sparerente(s: Spilltilstand): number {
  return SPARERENTE_PER_TIME * (styringsrente(s) / NORMAL_STYRINGSRENTE)
}

export function sparerentePerSek(s: Spilltilstand): number {
  return (s.sparing * sparerente(s)) / 3600
}

/** Det som faktisk kommer inn hvert sekund: bedriftene, leien, sparerenten og rivalutbyttet, minus lånerenter. */
export function nettoPerSek(s: Spilltilstand): number {
  return inntektPerSek(s) + leiePerSek(s) + sparerentePerSek(s) + rivalutbyttePerSek(s) + kupongPerSek(s) - rentePerSek(s)
}

// ─────────────────────────────────────────────── Formue

export function papirverdi(s: Spilltilstand, klasse?: 'aksje' | 'krypto'): number {
  let sum = 0
  for (const [id, b] of Object.entries(s.beholdning) as [PapirId, Beholdning][]) {
    if (klasse && PAPIRER[id].klasse !== klasse) continue
    sum += b.antall * s.marked.kurser[id].kurs
  }
  return sum
}

/** Alt du eier, før gjeld. */
export function eiendeler(s: Spilltilstand): number {
  // Bedriftene summert i en vanlig løkke, i samme rekkefølge som før (Pakke 64): regnes hvert sekund.
  let bedrifter = 0
  for (let i = 0; i < s.bedrifter.length; i++) bedrifter += bedriftsverdi(s.bedrifter[i])
  return (
    s.kontanter +
    s.sparing +
    bedrifter +
    papirverdi(s) +
    fondverdi(s) +
    eiendomsverdi(s) +
    luksusverdi(s) +
    rivalverdi(s) +
    startupverdi(s) +
    klubbverdi(s) +
    kunstverdi(s) +
    obligasjonsverdi(s) +
    // Innredningen i hjemmene (Pakke 60) til halv pris. Lagt til sist, så summene ellers står helt likt.
    hjemverdi(s)
  )
}

/** Nettoformuen er spillets poengsum: alt du eier minus det du skylder. */
export function nettoformue(s: Spilltilstand): number {
  return eiendeler(s) - s.gjeld
}

// ─────────────────────────────────────────────── Banken

/** Gjeld som andel av eiendelene. */
export function belaaningsgrad(s: Spilltilstand): number {
  const e = eiendeler(s)
  return e > 0 ? s.gjeld / e : s.gjeld > 0 ? Infinity : 0
}

/** Alt som kommer inn per sekund før lånerentene: bedriftene, leien, sparerenten og rivalutbyttet. */
export function bruttoPerSek(s: Spilltilstand): number {
  return inntektPerSek(s) + leiePerSek(s) + sparerentePerSek(s) + rivalutbyttePerSek(s) + kupongPerSek(s)
}

/** Så stor kan gjelden bli etter inntekten: LAANETAK_TIMER timer av det som kommer inn. */
export function laanetak(s: Spilltilstand): number {
  return Math.max(0, bruttoPerSek(s) * LAANETAK_TIMER * 3600)
}

/**
 * Hvor mye du kan låne nå: det minste av to grenser. Et lån øker både
 * eiendeler og gjeld, så sikkerheten (gjeld ≤ andel · eiendeler) gir
 * nytt lån ≤ (andel · E − G) / (1 − andel). Inntekten gir nytt lån ≤ tak − G.
 */
export function maksNyttLaan(s: Spilltilstand): number {
  return Math.max(0, Math.floor(Math.min(maksLaanMotSikkerhet(s), laanetak(s) - s.gjeld)))
}

/** Grensen fra sikkerheten alene — det du kunne lånt hvis inntekten ikke satte tak. */
export function maksLaanMotSikkerhet(s: Spilltilstand): number {
  return Math.max(0, Math.floor((MAKS_BELAANING * eiendeler(s) - s.gjeld) / (1 - MAKS_BELAANING)))
}

// ─────────────────────────────────────────────── Handel

/** Hvor mange du har råd til å kjøpe i én ordre, med kurtasje og kurstrykk regnet med. */
export function maksKjop(s: Spilltilstand, id: PapirId): number {
  if (s.kontanter <= 0) return 0
  // Et kjøp koster dybde · −ln(1 − x) (Pakke 56), så x kan regnes ut direkte.
  const dybde = PAPIRER[id].dybde
  const x = -Math.expm1(-s.kontanter / (dybde * (1 + KURTASJE)))
  // Med mye penger ville kursen gått mot uendelig; én ordre stopper der kursen dobles.
  let antall = Math.min(rundAntall(id, (x * dybde) / s.marked.kurser[id].kurs), maksPerOrdre(s, id, 'kjop'))
  // Kappingen er konservativ, men sjekk likevel — avrunding skal aldri gi en avvist ordre.
  const har = (a: number) => a * handelskurs(s, id, a) * (1 + KURTASJE) <= s.kontanter
  if (antall <= 0 || har(antall)) return Math.max(0, antall)
  // For mye: finn det største antallet du har råd til ved halvering, i hele
  // enheter (én aksje, 1/10 000 mynt). Før gikk dette ned én enhet om gangen —
  // med milliarder på konto kunne det ta minutter og fryse spillet (Pakke 47).
  const perEnhet = PAPIRER[id].klasse === 'aksje' ? 1 : 10_000
  let lav = 0
  let hoy = Math.round(antall * perEnhet)
  for (let i = 0; i < 100 && hoy - lav > 1; i++) {
    const midt = Math.floor((lav + hoy) / 2)
    if (har(midt / perEnhet)) lav = midt
    else hoy = midt
  }
  return lav / perEnhet
}

// ─────────────────────────────────────────────── Kjøp

export function eierType(s: Spilltilstand, type: BedriftstypeId): boolean {
  return s.bedrifter.some((b) => b.type === type)
}

export function erLaastOpp(s: Spilltilstand, type: BedriftstypeId): boolean {
  return s.hoyesteFormue >= BEDRIFTSTYPER[type].laasesOppVed
}

// ─────────────────────────────────────────────── Ansatte og leder

export function maksAnsatte(b: Bedrift): number {
  return Math.min(MAKS_ANSATTE, 1 + Math.floor(b.nivaa / ANSATTE_PER_NIVAA))
}

/** Prisen for neste ansettelse: dyrere for hver ansatt bedriften har, og etter nivået på den nye. */
export function ansettelsespris(b: Bedrift, grad: Ansattgrad = 'erfaren'): number {
  return Math.round(oppgraderingspris(b) * ANSETTELSE_FAKTOR * ANSETTELSE_VEKST ** b.ansatte * GRADER[grad].pris)
}

/** Lønnen for én ansatt av et nivå, per sekund. */
export function lonnFor(b: Bedrift, grad: Ansattgrad): number {
  return BEDRIFTSTYPER[b.type].grunninntekt * LONN_PER_ANSATT * GRADER[grad].lonn
}

export function lederpris(type: BedriftstypeId): number {
  return Math.max(LEDER_MINSTEPRIS, BEDRIFTSTYPER[type].pris * 2)
}
