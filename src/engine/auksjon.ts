/**
 * Auksjonshuset (Pakke 89). Omtrent én gang i timen byr det fram én unik ting
 * (`unike.ts`) i tre spilldager — et kvarter. Budet stiger hver dag, så den som
 * kommer først, betaler minst. Kjøper du den ikke, går den til en rival som har råd,
 * og avisa skriver om det. Den kan komme tilbake, men tidligst etter 120 spilldager
 * (ti timer) og halvannen gang så dyr for hver gang den har gått fra deg.
 *
 * Det som bys fram, passer formuen din: blant tingene som koster høyst en firedel av
 * den, en av de tre dyreste. Alt annet — når, hvilken, prisen og hvilken rival — kommer
 * fra hasher av dagen og tingen, så auksjonene trekker ingenting fra terningen. Sakene
 * i avisa flytter den likevel, som alle nye saker.
 */

import { leggTilHendelse } from './bank'
import { nettoformue } from './formler'
import { dagnummer } from './kalender'
import { hashTekst, tilfeldig } from './rng'
import { kortKroner } from './tall'
import type { Auksjonshus, Overskrift, Spilltilstand, UnikId } from './types'
import { TILBAKE_DAGER, UNIKE, UNIKLISTE, unikISetning } from './unike'

export { TILBAKE_DAGER, unikISetning }

/** Dagene det kan bys: åpningsdagen og to til. */
export const AUKSJON_DAGER = 3
/** Budet stiger så mye av startprisen for hver dag auksjonen har stått. */
export const BUDSTIGNING = 0.1
/** Dager uten auksjon etter at hammeren har falt: 6–12, så det blir rundt én i timen. */
export const PAUSE_MIN = 6
export const PAUSE_MAKS = 12
/** … og koster da så mange ganger mer, for hver gang det har gått fra deg. */
export const TILBAKE_PREMIE = 1.5
/** En ting bys fram når estimatet er høyst så stor andel av formuen din. */
export const PASSER_ANDEL = 0.25
/** Blant de som passer, velges en av så mange av de dyreste. */
const UTVALG = 3
/** En rival byr bare når formuen er minst så mange ganger sluttprisen. */
export const RIVAL_RAD = 2
/** Startprisen er estimatet ganget med et tall mellom disse. */
const FAKTOR_MIN = 0.9
const FAKTOR_MAKS = 1.2


function hus(s: Spilltilstand): Auksjonshus {
  return (s.auksjon ??= { nesteDag: 0, eide: {}, borte: {} })
}

/** Estimatet nå: dyrere for hver gang tingen har gått fra deg. */
export function estimat(s: Spilltilstand, id: UnikId): number {
  return UNIKE[id].estimat * TILBAKE_PREMIE ** (s.auksjon?.borte[id]?.ganger ?? 0)
}

/** Det som kan bys fram på en dag: det ingen eier, og det som er tilbake fra rivalene. */
export function tilgjengelige(s: Spilltilstand, dag: number): UnikId[] {
  const h = s.auksjon
  return UNIKLISTE.filter((id) => !h?.eide[id] && !((h?.borte[id]?.tilbakeDag ?? 0) > dag))
}

/** Tingen som bys fram i dag, gitt formuen — eller null når ingenting passer. */
export function kandidat(s: Spilltilstand, dag: number, formue: number): UnikId | null {
  const passer = tilgjengelige(s, dag)
    .filter((id) => estimat(s, id) <= PASSER_ANDEL * formue)
    .sort((a, b) => estimat(s, b) - estimat(s, a))
    .slice(0, UTVALG)
  if (passer.length === 0) return null
  return passer[Math.floor(tilfeldig(hashTekst(`auksjon:${dag}`)) * passer.length)]
}

/** Et bud på tre gjeldende sifre, som auksjonshus byr: kr 66,4 mill, ikke kr 66 393 633. */
export function rundBud(x: number): number {
  if (x <= 0) return 0
  const steg = 10 ** (Math.floor(Math.log10(x)) - 2)
  return Math.round(x / steg) * steg
}

/** Dagen i auksjonen: 0 den første, 2 den siste. */
function auksjonsdag(s: Spilltilstand): number {
  const a = s.auksjon?.aktiv
  if (!a) return 0
  return Math.max(0, Math.min(AUKSJON_DAGER - 1, dagnummer(s.sek) - a.fraDag))
}

/** Budet i dag, eller null når ingen auksjon står åpen. */
export function auksjonspris(s: Spilltilstand): number | null {
  const a = s.auksjon?.aktiv
  if (!a || a.kjopt) return null
  return rundBud(a.startpris * (1 + BUDSTIGNING * auksjonsdag(s)))
}

/** Budet i morgen, eller null når i dag er siste dag. */
export function prisIMorgen(s: Spilltilstand): number | null {
  const a = s.auksjon?.aktiv
  if (!a || a.kjopt || auksjonsdag(s) >= AUKSJON_DAGER - 1) return null
  return rundBud(a.startpris * (1 + BUDSTIGNING * (auksjonsdag(s) + 1)))
}

/** Hvor mange dager det kan bys, med i dag. */
export function dagerIgjen(s: Spilltilstand): number {
  const a = s.auksjon?.aktiv
  return a ? a.tilDag - dagnummer(s.sek) + 1 : 0
}

/** Prisen en rival betaler når ingen andre byr: det siste budet. */
export const sluttpris = (startpris: number) => rundBud(startpris * (1 + BUDSTIGNING * (AUKSJON_DAGER - 1)))

/** Hvor mange dager det er pause etter en auksjon som slutter på `dag`. */
function pause(dag: number): number {
  return PAUSE_MIN + Math.floor(tilfeldig(hashTekst(`auksjon:pause:${dag}`)) * (PAUSE_MAKS - PAUSE_MIN + 1))
}

/**
 * Dagsskiftet i auksjonshuset: hammeren faller på det som var oppe (til deg, til en
 * rival eller uten bud), og etter pausen bys det neste fram. `hvem` er det avisa kaller
 * deg. Muterer, og gir sakene til avisa.
 */
export function auksjonVedDagsskifte(s: Spilltilstand, hvem: string): Overskrift[] {
  const dag = dagnummer(s.sek)
  const h = hus(s)
  const saker: Overskrift[] = []
  const a = h.aktiv
  if (a && (a.kjopt || dag > a.tilDag)) {
    const u = UNIKE[a.id]
    if (a.kjopt) {
      saker.push({ type: 'deg', tittel: `${hvem} kjøper ${unikISetning(a.id)}`, tekst: `Hammeren falt for ${kortKroner(h.eide[a.id]?.kostpris ?? a.startpris)}. ${u.linje}` })
    } else {
      const pris = sluttpris(a.startpris)
      const rike = (s.rivaler ?? []).filter((r) => !r.overtatt && r.formue >= RIVAL_RAD * pris)
      const ganger = h.borte[a.id]?.ganger ?? 0
      if (rike.length > 0) {
        const r = rike[Math.floor(tilfeldig(hashTekst(`auksjon:${a.id}:${a.fraDag}:rival`)) * rike.length)]
        h.borte[a.id] = { tilbakeDag: dag + TILBAKE_DAGER, ganger: ganger + 1, rival: r.navn, pris }
        saker.push({ type: 'marked', tittel: `${r.navn} kjøper ${unikISetning(a.id)}`, tekst: `Hammeren falt for ${kortKroner(pris)}. Den kan komme under hammeren igjen — men da koster den mer.` })
        leggTilHendelse(s, { tittel: 'Auksjon', tekst: `${r.navn} kjøpte ${unikISetning(a.id)} for ${kortKroner(pris)}. Den kan komme tilbake, men dyrere.`, alvor: 'info' })
      } else {
        // Ingen rival har råd: auksjonshuset trekker den og prøver igjen om halve tiden.
        h.borte[a.id] = { tilbakeDag: dag + TILBAKE_DAGER / 2, ganger }
        saker.push({ type: 'marked', tittel: `Ingen bud på ${unikISetning(a.id)}`, tekst: 'Auksjonshuset trekker den og prøver igjen senere.' })
      }
    }
    h.aktiv = undefined
    h.nesteDag = dag + pause(dag)
  }
  if (!h.aktiv && dag >= h.nesteDag) {
    const id = kandidat(s, dag, nettoformue(s))
    if (id) {
      const startpris = rundBud(estimat(s, id) * (FAKTOR_MIN + (FAKTOR_MAKS - FAKTOR_MIN) * tilfeldig(hashTekst(`auksjon:${id}:${dag}`))))
      h.aktiv = { id, fraDag: dag, tilDag: dag + AUKSJON_DAGER - 1, startpris }
      const u = UNIKE[id]
      saker.push({ type: 'marked', tittel: `Under hammeren: ${u.navn}`, tekst: `${u.linje} Budet står i ${kortKroner(startpris)}, og det kan bys i tre dager.` })
      leggTilHendelse(s, { tittel: 'Auksjon', tekst: `${u.navn} er under hammeren i tre dager. Budet står i ${kortKroner(startpris)} og stiger hver dag.`, alvor: 'info' })
    }
  }
  return saker
}
