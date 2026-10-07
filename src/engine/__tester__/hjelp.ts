/**
 * Testhjelpere: handlingene som kaster ved feil i stedet for å returnere et
 * utfall, så testene kan lenke dem uten å sjekke ok hver gang.
 */

import * as h from '../handlinger'
import { maksLaanMotSikkerhet, maksNyttLaan } from '../formler'
import { nyttSpill } from '../start'
import { STIGEN } from '../innhold'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, LAGERLISTE, LUKSUSLISTE } from '../eiendom'
import { MALERILISTE } from '../kunst'
import { LANDEMERKELISTE } from '../landemerker'
import { JORDLISTE } from '../jord'
import { KLUBBNAVN } from '../klubb'
import { PAPIRER } from '../marked'
import { FONDLISTE } from '../fond'
import type { Bedrift, BedriftstypeId, EiendomId, LagerId, LuksusId, PapirId, Spilltilstand } from '../types'

function ok(u: h.Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

export const kjopEiendom = (s: Spilltilstand, id: EiendomId) => ok(h.kjopEiendom(s, id))
export const selgEiendom = (s: Spilltilstand, id: EiendomId) => ok(h.selgEiendom(s, id))
export const kjopLuksus = (s: Spilltilstand, id: LuksusId) => ok(h.kjopLuksus(s, id))
export const selgLuksus = (s: Spilltilstand, id: LuksusId) => ok(h.selgLuksus(s, id))
export const utvidLager = (s: Spilltilstand, id: LagerId) => ok(h.utvidLager(s, id))
export const laan = (s: Spilltilstand, belop: number) => ok(h.laan(s, belop))
export const maksNyttLaanFor = maksNyttLaan

/**
 * Et lån uten inntektstaket, for tester av marginkrav og renter der
 * spilleren ikke har inntekt nok til å låne så mye på vanlig vis.
 */
export function laanUtenTak(s: Spilltilstand, belop = maksLaanMotSikkerhet(s)): Spilltilstand {
  const n = structuredClone(s)
  n.kontanter += belop
  n.gjeld += belop
  return n
}

/** En bedrift til tester, med fornuftige standardverdier for alt som ikke er gitt. */
export function bedrift(type: BedriftstypeId, felt: Partial<Bedrift> = {}): Bedrift {
  return {
    id: `t-${type}`,
    type,
    nivaa: 1,
    startetSek: 0,
    ansatte: 0,
    leder: false,
    investert: 0,
    tjent: 0,
    inntektHistorikk: [],
    forbedringer: 0,
    fusjoner: 0,
    ...felt,
  }
}

/**
 * Et sent spill der du eier alt: alle bransjene på høye nivåer med ansatte og
 * leder, all eiendom, all jord, alle landemerker, all luksus, alle maleriene,
 * en klubb, alle papirene og fondene og en andel i hver rival. Det tyngste en
 * lagring kan bli — til ytelsestesten. Kjøp som ikke går, hoppes over.
 */
export function fulltSpill(): Spilltilstand {
  let s = nyttSpill()
  s.kontanter = 1e15
  s.hoyesteFormue = 1e15
  const prov = (u: h.Utfall) => {
    if (u.ok) s = u.tilstand
  }
  for (const type of STIGEN) if (!s.bedrifter.some((b) => b.type === type)) prov(h.kjopBedrift(s, type))
  for (const b of s.bedrifter) {
    prov(h.oppgraderFlere(s, b.id, 120))
    for (let i = 0; i < 10; i++) prov(h.ansett(s, b.id))
    prov(h.ansettLeder(s, b.id))
  }
  for (const l of LAGERLISTE) for (let i = 0; i < 12; i++) prov(h.utvidLager(s, l))
  for (const id of LUKSUSLISTE) prov(h.kjopLuksus(s, id))
  for (const id of MALERILISTE) prov(h.kjopMaleri(s, id))
  for (const id of LANDEMERKELISTE) prov(h.kjopLandemerke(s, id))
  for (const id of EIENDOMSSTIGEN) for (let i = 0; i < EIENDOMSTYPER[id].maksAntall; i++) prov(h.kjopEiendom(s, id))
  for (const id of JORDLISTE) prov(h.kjopJord(s, id))
  prov(h.kjopKlubb(s, KLUBBNAVN[0]))
  for (const id of Object.keys(PAPIRER) as PapirId[]) prov(h.kjopPapir(s, id, 1000))
  for (const id of FONDLISTE) prov(h.kjopFond(s, id, 1e9))
  for (const r of s.rivaler) prov(h.kjopRivalblokk(s, r.id))
  return s
}
