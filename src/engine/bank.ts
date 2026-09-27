/**
 * Banken i simuleringen: renter hvert sekund, og marginkrav når gjelden blir
 * for stor. Mutasjoner på en tilstand simuleringen eier.
 */

import { bedriftsverdi, belaaningsgrad, rentePerSek } from './formler'
import { utforSalg } from './handel'
import { BEDRIFTSTYPER, MAKS_BELAANING, MAKS_HENDELSER, MARGINKRAV, TVANGSSALG_ANDEL } from './innhold'
import { PAPIRER } from './marked'
import type { Hendelse, PapirId, Spilltilstand } from './types'

export function leggTilHendelse(s: Spilltilstand, h: Omit<Hendelse, 'sek'>): void {
  s.hendelser.push({ sek: s.sek, ...h })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}

/** Renten trekkes fra kontantene. Har du ikke nok, legges resten til gjelden. */
export function betalRente(s: Spilltilstand): void {
  const rente = rentePerSek(s)
  if (rente <= 0) return
  const betalt = Math.min(rente, Math.max(0, s.kontanter))
  s.kontanter -= betalt
  s.gjeld += rente - betalt
}

/** Bruker kontanter til å nedbetale, men aldri mer enn gjelden. */
function nedbetalMed(s: Spilltilstand, belop: number): void {
  const b = Math.min(belop, s.gjeld, Math.max(0, s.kontanter))
  s.kontanter -= b
  s.gjeld -= b
}

/**
 * Marginkravet: er gjelden over grensen, tar banken først kontantene dine,
 * så investeringene — de største postene først — til belåningen er tilbake
 * på det du fikk låne. Holder ikke det, tar banken over bedrifter (den mest
 * verdifulle først) for halvparten av det du investerte. Den siste bedriften
 * får du alltid beholde.
 */
export function sjekkMargin(s: Spilltilstand): void {
  if (s.gjeld <= 0 || belaaningsgrad(s) <= MARGINKRAV) return

  nedbetalMed(s, s.kontanter)
  const solgt: string[] = []
  const poster = (Object.keys(s.beholdning) as PapirId[]).sort(
    (a, b) => s.beholdning[b]!.antall * s.marked.kurser[b].kurs - s.beholdning[a]!.antall * s.marked.kurser[a].kurs,
  )
  for (const id of poster) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforSalg(s, id, s.beholdning[id]!.antall)
    nedbetalMed(s, s.kontanter)
    solgt.push(PAPIRER[id].navn)
  }
  if (solgt.length > 0) {
    leggTilHendelse(s, {
      tittel: 'Marginkrav',
      tekst: `Gjelden ble for stor, og banken solgte ${solgt.join(', ')} for å nedbetale lånet.`,
      alvor: 'advarsel',
    })
  }

  const overtatt: string[] = []
  while (belaaningsgrad(s) > MARGINKRAV && s.bedrifter.length > 1) {
    const storst = [...s.bedrifter].sort((a, b) => bedriftsverdi(b) - bedriftsverdi(a))[0]
    s.bedrifter = s.bedrifter.filter((b) => b.id !== storst.id)
    s.kontanter += bedriftsverdi(storst) * TVANGSSALG_ANDEL
    nedbetalMed(s, s.kontanter)
    overtatt.push(BEDRIFTSTYPER[storst.type].navn)
  }
  if (overtatt.length > 0) {
    leggTilHendelse(s, {
      tittel: 'Konkursbo',
      tekst: `Banken tok over ${overtatt.join(', ')} for halvparten av det du investerte. Resten av gjelden står igjen.`,
      alvor: 'kritisk',
    })
  }
}
