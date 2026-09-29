/**
 * Uke-, måneds- og årsoppgjør. Ved starten av hver periode tas tellerstanden;
 * ved slutten er oppgjøret differansen mellom tellerne nå og da.
 *
 * Uka går fra søndag til søndag, så oppgjøret står i søndagsavisa. Måneden
 * og året gjøres opp den første dagen i den nye perioden.
 */

import { nettoformue } from './formler'
import { dagnummer, dato, MÅNEDER, ukedag, ukenummer } from './kalender'
import { AKSJER } from './marked'
import type { Oppgjor, PapirId, Periodestart, Spilltilstand } from './types'

const BEHOLD: Record<Oppgjor['periode'], number> = { uke: 8, maaned: 12, aar: 10 }

export function periodestart(s: Spilltilstand): Periodestart {
  const kurser = {} as Record<PapirId, number>
  for (const id of Object.keys(s.marked.kurser) as PapirId[]) kurser[id] = s.marked.kurser[id].kurs
  return {
    dag: dagnummer(s.sek),
    formue: nettoformue(s),
    tjent: s.totaltTjent,
    leie: s.totaltLeie,
    utbytte: s.totaltUtbytte,
    sparerente: s.totaltSparerente,
    rentebetalt: s.totaltRentebetalt,
    forbruk: s.totaltForbruk,
    bedrifter: Object.fromEntries(s.bedrifter.map((b) => [b.id, b.tjent])),
    kurser,
  }
}

function lagOppgjor(s: Spilltilstand, start: Periodestart, periode: Oppgjor['periode'], navn: string): Oppgjor {
  // Beste bedrift: den som har tjent mest i perioden. En bedrift kjøpt underveis teller fra null.
  let beste: Oppgjor['besteBedrift'] = null
  for (const b of s.bedrifter) {
    const tjent = b.tjent - (start.bedrifter[b.id] ?? 0)
    if (tjent > 0 && (!beste || tjent > beste.tjent)) beste = { type: b.type, tjent }
  }
  const o: Oppgjor = {
    periode,
    navn,
    fraDag: start.dag,
    tilDag: dagnummer(s.sek),
    bedrifter: s.totaltTjent - start.tjent,
    leie: s.totaltLeie - start.leie,
    utbytte: s.totaltUtbytte - start.utbytte,
    sparerente: s.totaltSparerente - start.sparerente,
    renter: s.totaltRentebetalt - start.rentebetalt,
    forbruk: s.totaltForbruk - start.forbruk,
    formueFor: start.formue,
    formueEtter: nettoformue(s),
    besteBedrift: beste,
  }
  if (periode === 'uke') {
    const endring = (id: PapirId) => s.marked.kurser[id].kurs / start.kurser[id] - 1
    // Et papir som ble børsnotert midt i uka, har ingen startkurs og er ikke med.
    const sortert = AKSJER.filter((id) => start.kurser[id] !== undefined).sort((a, b) => endring(b) - endring(a))
    o.vinner = { id: sortert[0], endring: endring(sortert[0]) }
    o.taper = { id: sortert[sortert.length - 1], endring: endring(sortert[sortert.length - 1]) }
  }
  return o
}

function arkiver(s: Spilltilstand, o: Oppgjor): void {
  s.oppgjor.push(o)
  const avSammeSlag = s.oppgjor.filter((x) => x.periode === o.periode)
  if (avSammeSlag.length > BEHOLD[o.periode]) {
    const eldste = avSammeSlag[0]
    s.oppgjor = s.oppgjor.filter((x) => x !== eldste)
  }
}

/**
 * Kalles ved hvert dagsskifte. Gjør opp de periodene som er slutt, starter
 * nye, og returnerer oppgjørene som skal i dagens avis. Muterer — brukes på kopier.
 */
export function dagsskifteOppgjor(s: Spilltilstand): Oppgjor[] {
  const idag = dagnummer(s.sek)
  const nye: Oppgjor[] = []
  const d = dato(idag)
  const igår = dato(idag - 1)

  if (ukedag(s.sek) === 6) {
    nye.push(lagOppgjor(s, s.ukestart, 'uke', `uke ${ukenummer(idag - 1)}`))
    s.ukestart = periodestart(s)
  }
  if (d.dag === 1) {
    nye.push(lagOppgjor(s, s.maanedstart, 'maaned', `${MÅNEDER[igår.maaned]} ${igår.aar}`))
    s.maanedstart = periodestart(s)
  }
  if (d.dag === 1 && d.maaned === 0) {
    nye.push(lagOppgjor(s, s.aarstart, 'aar', String(igår.aar)))
    s.aarstart = periodestart(s)
  }
  for (const o of nye) arkiver(s, o)
  return nye
}
