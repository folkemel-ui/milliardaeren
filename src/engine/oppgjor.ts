/**
 * Uke-, måneds- og årsoppgjør. Ved starten av hver periode tas tellerstanden;
 * ved slutten er oppgjøret differansen mellom tellerne nå og da.
 *
 * Uka går fra søndag til søndag, så oppgjøret står i søndagsavisa. Måneden
 * og året gjøres opp den første dagen i den nye perioden.
 *
 * Ukeoppgjøret har fra Pakke 60 også «Uka di» til søndagsavisa: formuen dag
 * for dag, Forbes-lista, kjøpt og solgt, og ukas beste og verste investering.
 * Alt regnes av tall spillet alt har — ingen terning, så ingenting annet flytter seg.
 */

import { nettoformue } from './formler'
import { dagnummer, dato, MÅNEDER, ukedag, ukenummer } from './kalender'
import { AKSJER, PAPIRER } from './marked'
import { EIENDOMSSTIGEN, EIENDOMSTYPER } from './eiendom'
import { eiendomskurs } from './regioner'
import { FOND, FONDLISTE, fondskurs } from './fond'
import { JORD, JORDLISTE, landverdi } from './jord'
import { MALERIER, MALERILISTE, maleripris } from './kunst'
import { forbesliste } from './rivaler'
import type { Aktivaklasse, EiendomId, FondId, Handelstotal, JordId, MaleriId, Oppgjor, PapirId, Periodestart, Spilltilstand } from './types'

/**
 * Prisen per enhet på det du eier, til ukas beste og verste investering.
 * Eiendom måles på byens marked (katalogpris · indeks), ikke standarden, så en
 * oppussing midt i uka ikke ser ut som en gevinst. Obligasjonene er ikke med:
 * et kjøp midt i uka flytter prisen per krone pålydende.
 */
export function enhetspriser(s: Spilltilstand): Record<string, number> {
  const p: Record<string, number> = {}
  for (const id of Object.keys(s.beholdning) as PapirId[]) p[`papir:${id}`] = s.marked.kurser[id].kurs
  for (const id of FONDLISTE) if (s.fond[id]) p[`fond:${id}`] = fondskurs(s, id)
  for (const id of EIENDOMSSTIGEN) if ((s.eiendommer[id] ?? 0) > 0) p[`eiendom:${id}`] = EIENDOMSTYPER[id].pris * eiendomskurs(s, EIENDOMSTYPER[id].by)
  for (const id of JORDLISTE) if (s.jord[id]) p[`jord:${id}`] = landverdi(s, id)
  for (const id of MALERILISTE) if (s.kunst?.eide[id]) p[`maleri:${id}`] = maleripris(s, id)
  return p
}

/** Navnet på en investering fra nøkkelen i enhetspriser. */
export function investeringsnavn(nøkkel: string): string {
  const [slag, id] = nøkkel.split(':')
  if (slag === 'papir') return PAPIRER[id as PapirId].navn
  if (slag === 'fond') return FOND[id as FondId].navn
  if (slag === 'eiendom') return `${EIENDOMSTYPER[id as EiendomId].navn}, ${EIENDOMSTYPER[id as EiendomId].by}`
  if (slag === 'jord') return JORD[id as JordId].navn
  if (slag === 'maleri') return MALERIER[id as MaleriId].navn
  return nøkkel
}

/** Klassene ukeavisa viser handel for: alt unntatt sparekontoen. */
const HANDELSKLASSER: Aktivaklasse[] = ['aksje', 'krypto', 'fond', 'obligasjon', 'eiendom', 'rival', 'startup']

function kopiAvHandel(h: Handelstotal | undefined): Handelstotal {
  return { kjopt: { ...(h?.kjopt ?? {}) }, solgt: { ...(h?.solgt ?? {}) } }
}

const BEHOLD: Record<Oppgjor['periode'], number> = { dag: 30, uke: 8, maaned: 12, aar: 10 }

/** Tellerstanden nå. `uke` tar i tillegg med det søndagsavisa trenger (Pakke 60). */
export function periodestart(s: Spilltilstand, uke = false): Periodestart {
  const kurser = {} as Record<PapirId, number>
  for (const id of Object.keys(s.marked.kurser) as PapirId[]) kurser[id] = s.marked.kurser[id].kurs
  const ekstra = uke ? { enhetspriser: enhetspriser(s), handel: kopiAvHandel(s.handelTotalt) } : {}
  return {
    ...ekstra,
    dag: dagnummer(s.sek),
    formue: nettoformue(s),
    tjent: s.totaltTjent,
    leie: s.totaltLeie,
    utbytte: s.totaltUtbytte,
    sparerente: s.totaltSparerente,
    rentebetalt: s.totaltRentebetalt,
    forbruk: s.totaltForbruk,
    gevinst: s.totaltGevinst ?? 0,
    klubb: s.totaltKlubb ?? 0,
    host: s.totaltHost ?? 0,
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
    gevinster: (s.totaltGevinst ?? 0) - (start.gevinst ?? 0),
    // En tellerstand fra før Pakke 39 har ikke klubb og avling: da teller perioden fra nå.
    klubb: start.klubb === undefined ? 0 : (s.totaltKlubb ?? 0) - start.klubb,
    host: start.host === undefined ? 0 : (s.totaltHost ?? 0) - start.host,
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
    ukaDi(s, start, o)
  }
  return o
}

/** Søndagsavisas «Uka di» (Pakke 60). En ukestart fra før Pakke 60 mangler handel og priser: da står de over denne uka. */
function ukaDi(s: Spilltilstand, start: Periodestart, o: Oppgjor): void {
  // Formuen ved hver dags start i uka, fra dagsoppgjørene, og formuen nå.
  const dager = (s.dagsoppgjor ?? []).filter((d) => d.fraDag >= start.dag)
  o.formuekurve = [...dager.map((d) => d.formueFor), o.formueEtter]
  // Forbes-lista: de fem øverste, og deg om du ikke er blant dem.
  const liste = forbesliste(s, o.formueEtter).map((p, i) => ({ plass: i + 1, navn: p.navn, formue: p.formue, deg: p.deg }))
  o.forbes = [...liste.slice(0, 5), ...liste.slice(5).filter((p) => p.deg)]
  if (start.handel) {
    const nå = s.handelTotalt
    o.handel = HANDELSKLASSER.map((klasse) => ({
      klasse,
      kjopt: (nå?.kjopt[klasse] ?? 0) - (start.handel!.kjopt[klasse] ?? 0),
      solgt: (nå?.solgt[klasse] ?? 0) - (start.handel!.solgt[klasse] ?? 0),
    })).filter((h) => h.kjopt >= 1 || h.solgt >= 1)
  }
  if (start.enhetspriser) {
    const nå = enhetspriser(s)
    const endringer = Object.keys(start.enhetspriser)
      .filter((k) => nå[k] !== undefined && start.enhetspriser![k] > 0)
      .map((k) => ({ navn: investeringsnavn(k), endring: nå[k] / start.enhetspriser![k] - 1 }))
      .sort((a, b) => b.endring - a.endring)
    if (endringer.length) o.besteInvestering = endringer[0]
    if (endringer.length > 1) o.versteInvestering = endringer[endringer.length - 1]
  }
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

  // Dagens tall til statistikken. Et spill fra før Pakke 39 starter tellingen nå.
  if (s.dagstart) {
    const dag = lagOppgjor(s, s.dagstart, 'dag', String(idag - 1))
    s.dagsoppgjor = [...(s.dagsoppgjor ?? []), dag].slice(-BEHOLD.dag)
  }
  s.dagstart = periodestart(s)

  if (ukedag(s.sek) === 6) {
    nye.push(lagOppgjor(s, s.ukestart, 'uke', `uke ${ukenummer(idag - 1)}`))
    s.ukestart = periodestart(s, true)
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
