/**
 * Banken i simuleringen: renter hvert sekund, og marginkrav når gjelden blir
 * for stor. Mutasjoner på en tilstand simuleringen eier.
 */

import { bedriftsverdi, belaaningsgrad, rentePerSek } from './formler'
import {
  utforEiendomssalg,
  utforFondssalg,
  utforJordsalg,
  utforKlubbsalg,
  utforLandemerkesalg,
  utforLuksussalg,
  utforMalerisalg,
  utforRivalsalg,
  utforSalg,
} from './handel'
import { JORD, JORDLISTE, landverdi, tommerverdi } from './jord'
import { eierDu, landemerkepris, LANDEMERKELISTE, LANDEMERKER } from './landemerker'
import { maleripris, MALERIER, mineMalerier } from './kunst'
import { aktive, ide, utforStartupovertakelse } from './startups'
import { FOND, FONDLISTE } from './fond'
import { selskapsverdi } from './rivaler'
import { flyt } from './portefolje'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, LUKSUS, restverdi } from './eiendom'
import { BEDRIFTSTYPER, MAKS_BELAANING, MAKS_HENDELSER, MARGINKRAV, TVANGSSALG_ANDEL } from './innhold'
import { PAPIRER } from './marked'
import type { Hendelse, PapirId, Spilltilstand } from './types'

export function leggTilHendelse(s: Spilltilstand, h: Omit<Hendelse, 'sek'>): void {
  s.hendelser.push({ sek: s.sek, ...h })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}

/**
 * Renten trekkes fra kontantene, så fra sparekontoen. Har du ikke nok,
 * legges resten til gjelden.
 */
export function betalRente(s: Spilltilstand): void {
  const rente = rentePerSek(s)
  if (rente <= 0) return
  // Påløpt rente er en utgift, enten den betales nå eller legges til gjelden.
  s.totaltRentebetalt += rente
  const fraKontanter = Math.min(rente, Math.max(0, s.kontanter))
  s.kontanter -= fraKontanter
  const fraSparing = Math.min(rente - fraKontanter, s.sparing)
  s.sparing -= fraSparing
  flyt(s, 'sparing', -fraSparing)
  s.gjeld += rente - fraKontanter - fraSparing
}

/** Bruker kontanter til å nedbetale, men aldri mer enn gjelden. */
function nedbetalMed(s: Spilltilstand, belop: number): void {
  const b = Math.min(belop, s.gjeld, Math.max(0, s.kontanter))
  s.kontanter -= b
  s.gjeld -= b
}

/**
 * Marginkravet: er gjelden over grensen, tar banken først kontantene og sparepengene dine,
 * så investeringene — de største postene først — og deretter eiendom, jord,
 * landemerker, luksus, kunst og klubben, til belåningen er tilbake på det du
 * fikk låne. Så tar banken over andelene i startups for halvparten av verdien.
 * Holder ikke det heller, tar banken over bedrifter (den mest verdifulle
 * først) for halvparten av det du investerte. Den siste bedriften får du
 * alltid beholde.
 */
export function sjekkMargin(s: Spilltilstand): void {
  if (s.gjeld <= 0 || belaaningsgrad(s) <= MARGINKRAV) return

  // Sparekontoen tømmes inn på brukskontoen først.
  flyt(s, 'sparing', -s.sparing)
  s.kontanter += s.sparing
  s.sparing = 0
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
  // Så fondene.
  for (const id of FONDLISTE) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    if (!s.fond?.[id]) continue
    utforFondssalg(s, id)
    nedbetalMed(s, s.kontanter)
    solgt.push(FOND[id].navn)
  }
  // Så eierandeler i rivalselskaper, den største først.
  for (const r of [...(s.rivaler ?? [])].filter((x) => x.andel > 0).sort((a, b) => b.andel * selskapsverdi(b) - a.andel * selskapsverdi(a))) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforRivalsalg(s, r.id)
    nedbetalMed(s, s.kontanter)
    solgt.push(`andelen i ${r.selskap}`)
  }
  // Så eiendom, den dyreste først, én og én.
  for (const id of [...EIENDOMSSTIGEN].reverse()) {
    while ((s.eiendommer[id] ?? 0) > 0 && belaaningsgrad(s) > MAKS_BELAANING) {
      utforEiendomssalg(s, id)
      nedbetalMed(s, s.kontanter)
      solgt.push(EIENDOMSTYPER[id].navn.toLowerCase())
    }
  }
  // Så luksus, den mest verdifulle først.
  for (const id of [...s.luksus].sort((a, b) => restverdi(b) - restverdi(a))) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforLuksussalg(s, id)
    nedbetalMed(s, s.kontanter)
    solgt.push(LUKSUS[id].navn.toLowerCase())
  }
  // Så gårder og skoger, den mest verdifulle først.
  for (const id of [...JORDLISTE].filter((x) => s.jord?.[x]).sort((a, b) => landverdi(s, b) + tommerverdi(s, b) - landverdi(s, a) - tommerverdi(s, a))) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforJordsalg(s, id)
    nedbetalMed(s, s.kontanter)
    solgt.push(JORD[id].navn)
  }
  // Så landemerkene.
  for (const id of LANDEMERKELISTE.filter((x) => eierDu(s, x)).sort((a, b) => landemerkepris(s, b) - landemerkepris(s, a))) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforLandemerkesalg(s, id)
    nedbetalMed(s, s.kontanter)
    solgt.push(LANDEMERKER[id].navn)
  }
  // Så kunsten — også maleriene som henger på museum.
  for (const id of mineMalerier(s).sort((a, b) => maleripris(s, b) - maleripris(s, a))) {
    if (belaaningsgrad(s) <= MAKS_BELAANING) break
    utforMalerisalg(s, id)
    nedbetalMed(s, s.kontanter)
    solgt.push(`«${MALERIER[id].navn}»`)
  }
  // Så klubben.
  if (s.klubb && belaaningsgrad(s) > MAKS_BELAANING) {
    const navn = s.klubb.navn
    utforKlubbsalg(s)
    nedbetalMed(s, s.kontanter)
    solgt.push(navn)
  }
  if (solgt.length > 0) {
    leggTilHendelse(s, {
      tittel: 'Marginkrav',
      tekst: `Gjelden ble for stor, og banken solgte ${solgt.join(', ')} for å nedbetale lånet.`,
      alvor: 'advarsel',
    })
  }

  const overtatt: string[] = []
  // Andelene i startups kan ikke selges på dagen: banken tar dem for halv verdi, den største først.
  for (const st of aktive(s).filter((x) => x.andel > 0).sort((a, b) => b.andel * b.verdi - a.andel * a.verdi)) {
    if (belaaningsgrad(s) <= MARGINKRAV) break
    utforStartupovertakelse(s, st, TVANGSSALG_ANDEL)
    nedbetalMed(s, s.kontanter)
    overtatt.push(`andelen i ${ide(st).navn}`)
  }
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
