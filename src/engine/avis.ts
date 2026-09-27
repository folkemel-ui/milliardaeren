/**
 * Børstidende — avisen som kommer ut hver spilldag. Sakene bygges av det som
 * har skjedd siden forrige utgave: hva du har gjort, hvordan markedet har gått,
 * og — når det er stille — litt lokalstoff. Alt er deterministisk: tilfeldige
 * valg går gjennom simuleringens terning.
 */

import { BEDRIFTSTYPER } from './innhold'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, LUKSUS, statusnivaa } from './eiendom'
import { AKSJER, KRYPTO, PAPIRER } from './marked'
import { PRESTASJONER } from './prestasjoner'
import { klasseverdier, nullPerKlasse } from './portefolje'
import { selskapsnyheter } from './selskapsnyheter'
import { dagsskifteOppgjor } from './oppgjor'
import { skattVedDagsskifte } from './skatt'
import { startupsVedDagsskifte } from './startups'
import { klubbVedDagsskifte } from './klubb'
import { jordVedDagsskifte } from './jord'
import { landemerkerVedDagsskifte } from './landemerker'
import { kunstVedDagsskifte } from './kunst'
import { forbesliste } from './rivaler'
import { FORMER, fusjonsnokler } from './fusjon'
import { nettoformue } from './formler'
import type { Terning } from './rng'
import type { Avisutgave, Dagsbilde, LuksusId, Overskrift, PapirId, Spilltilstand } from './types'
import { dagnummer } from './kalender'

export const MAKS_UTGAVER = 7
const MAKS_SAKER = 5
const MIN_SAKER = 3

export function lagDagsbilde(s: Spilltilstand): Dagsbilde {
  const kurser = {} as Record<PapirId, number>
  for (const id of Object.keys(s.marked.kurser) as PapirId[]) kurser[id] = s.marked.kurser[id].kurs
  return {
    kurser,
    eiendomsindeks: s.marked.eiendom.kurs,
    bedrifter: s.bedrifter.map((b) => b.type),
    eiendommer: Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0),
    luksus: [...s.luksus],
    sek: s.sek,
    verdier: klasseverdier(s),
    rang: forbesliste(s, nettoformue(s)).findIndex((p) => p.deg) + 1,
    overtatte: (s.rivaler ?? []).filter((r) => r.overtatt).map((r) => r.id),
    fusjoner: fusjonsnokler(s),
  }
}

/** Sakene om kappløpet: forbikjøringer på Forbes-lista og oppkjøp. */
function omRivalene(s: Spilltilstand, før: Dagsbilde): Overskrift[] {
  const saker: Overskrift[] = []
  const hvem = tittel(s)
  for (const r of s.rivaler) {
    if (r.overtatt && !(før.overtatte ?? []).includes(r.id)) {
      saker.push({ type: 'deg', tittel: `${hvem} kjøper opp ${r.selskap}`, tekst: `Et fiendtlig oppkjøp: ${r.navn} har mistet kontrollen over sitt eget selskap.` })
    }
  }
  // Fusjoner: bare de som ikke kom med et oppkjøp — det har alt fått sin sak.
  const kjente = new Set(før.fusjoner ?? fusjonsnokler(s))
  for (const r of s.rivaler) {
    if (r.overtatt) continue
    for (const type of r.solgt ?? []) {
      if (kjente.has(`${r.id}:${type}`)) continue
      saker.push({ type: 'deg', tittel: `${r.navn.split(' ')[1]} selger ${FORMER[type].den} til ${hvem.toLowerCase()}`, tekst: 'Bedriftene slås sammen. Konkurrentene frykter en ny gigant i bransjen.' })
    }
  }
  const liste = forbesliste(s, nettoformue(s))
  const rang = liste.findIndex((p) => p.deg) + 1
  if (før.rang && rang < før.rang) {
    const forbi = liste[rang]
    if (forbi) saker.push({ type: 'deg', tittel: `${hvem} forbi ${forbi.navn}`, tekst: `Ny plass ${rang} på Forbes-lista.` })
  } else if (før.rang && rang > før.rang) {
    const over = liste[rang - 2]
    if (over) saker.push({ type: 'marked', tittel: `${over.navn} går forbi ${hvem.toLowerCase()}`, tekst: `Kappløpet på Forbes-lista hardner til — du er nå nummer ${rang}.` })
  }
  return saker
}

const prosent = (andel: number) => `${Math.round(Math.abs(andel) * 100)} %`

/**
 * Hva avisa kaller deg, etter statusnivå. Jo høyere status, jo mer skriver
 * avisa om deg — og jo mindre anonymt.
 */
const TITLER = [
  'Den unge gründeren',
  'Lokalkjendisen',
  'Den lovende gründeren',
  'Forretningsprofilen',
  'Rikmannen',
  'Magnaten',
  'Tycoonen',
  'Legenden',
]

export function tittel(s: Spilltilstand): string {
  return TITLER[statusnivaa(s)]
}

/** Sakene om deg selv: nye bedrifter, eiendom, luksus og prestasjoner. */
function omDeg(s: Spilltilstand, før: Dagsbilde): Overskrift[] {
  const t = tittel(s)
  const saker: Overskrift[] = []
  for (const p of PRESTASJONER) {
    const når = s.prestasjoner[p.id]
    if (når === undefined || når <= før.sek) continue
    if (p.id === 'millionaer') saker.push({ type: 'deg', tittel: 'Ny millionær i byen!', tekst: `${t} som startet med en saftbod, har passert sin første million.` })
    else if (p.id === 'milliardaer') saker.push({ type: 'deg', tittel: 'MILLIARDÆR', tekst: 'Fra saftbod til milliard. Landets nyeste milliardær har nådd målet — og markedet holder pusten.' })
    else if (p.id === 'marginkrav') saker.push({ type: 'deg', tittel: 'Banken tvangsselger for kjent investor', tekst: `Etter en tøff dag i markedet måtte banken selge unna for ${t.toLowerCase()}.` })
  }
  for (const type of s.bedrifter.map((b) => b.type)) {
    if (!før.bedrifter.includes(type)) {
      const navn = BEDRIFTSTYPER[type].navn.toLowerCase()
      saker.push({ type: 'deg', tittel: `${t} åpner ${navn}`, tekst: `Imperiet vokser: nå med egen ${navn}.` })
    }
  }
  const nyeEiendommer = Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0) - før.eiendommer
  if (nyeEiendommer > 0) {
    const dyreste = [...EIENDOMSSTIGEN].reverse().find((id) => (s.eiendommer[id] ?? 0) > 0)
    saker.push({
      type: 'deg',
      tittel: nyeEiendommer === 1 ? `${t} kjøper eiendom igjen` : `${t} kjøper ${nyeEiendommer} eiendommer på én dag`,
      tekst: dyreste ? `Porteføljen strekker seg nå helt til ${EIENDOMSTYPER[dyreste].sted}.` : '',
    })
  }
  for (const id of s.luksus) {
    if (!før.luksus.includes(id)) {
      saker.push({ type: 'deg', tittel: `Spottet: ${LUKSUS[id].navn.toLowerCase()} i sentrum`, tekst: `Naboene lurer på hvem den tilhører. Vi tror det er ${t.toLowerCase()}.` })
      break
    }
  }
  return saker
}

/**
 * Sosietetsstoff: fra statusnivå 2 skriver avisa om livet ditt — oftere jo
 * høyere status, og om det du faktisk eier.
 */
function sosietet(s: Spilltilstand, t: Terning): Overskrift[] {
  const nivaa = statusnivaa(s)
  if (nivaa < 2 || !t.sjanse(Math.min(0.7, 0.1 * nivaa))) return []
  const hvem = tittel(s)
  const har = (id: LuksusId) => s.luksus.includes(id)
  const kandidater: Overskrift[] = [
    { type: 'deg', tittel: `${hvem} på premiere i Operaen`, tekst: 'Antrekket fikk mer oppmerksomhet enn forestillingen.' },
    { type: 'deg', tittel: `${hvem} sett på Aker Brygge`, tekst: 'Lunsjen skal ha kostet mer enn en gjennomsnittlig månedslønn.' },
    { type: 'deg', tittel: `${hvem} gir millionbeløp til barnesykehuset`, tekst: 'Gaven ble overrakt uten pressefolk — men vi fikk det med oss.' },
  ]
  if (har('superyacht') || har('motorbaat')) kandidater.push({ type: 'deg', tittel: `${hvem} på båttur i Oslofjorden`, tekst: 'Sommerens mest omtalte fartøy ble observert utenfor Hvaler.' })
  if (har('forretningsjet') || har('langdistansejet') || har('propellfly')) kandidater.push({ type: 'deg', tittel: `${hvem} fløy privatfly til Lofoten`, tekst: 'Flyplassen i Svolvær har sjelden hatt så fint besøk.' })
  if (har('superbil') || har('hyperbil')) kandidater.push({ type: 'deg', tittel: `${hvem} i superbil på Karl Johan`, tekst: 'Turistene trodde det var en filminnspilling.' })
  if (s.eiendommer.hytte) kandidater.push({ type: 'deg', tittel: `${hvem} tar helg på Geilo`, tekst: 'Hytta skal være pusset opp for en formue.' })
  if (s.eiendommer.oy) kandidater.push({ type: 'deg', tittel: 'Fest på privatøya i Lofoten', tekst: 'Gjestelista er hemmelig. Helikopterne var ikke.' })
  return [t.velg(kandidater)]
}

/** Sakene om markedet: dagens største bevegelser. */
function omMarkedet(s: Spilltilstand, før: Dagsbilde): Overskrift[] {
  const saker: Overskrift[] = []
  const endring = (id: PapirId) => s.marked.kurser[id].kurs / før.kurser[id] - 1
  const størst = (ider: PapirId[]) => [...ider].sort((a, b) => Math.abs(endring(b)) - Math.abs(endring(a)))[0]

  const aksje = størst(AKSJER)
  const ea = endring(aksje)
  if (Math.abs(ea) >= 0.03) {
    saker.push({
      type: 'marked',
      tittel: `${PAPIRER[aksje].navn} ${ea > 0 ? 'stiger' : 'faller'} ${prosent(ea)}`,
      tekst: ea > 0 ? 'Analytikerne peker på sterke tall og optimisme på børsen.' : 'Investorene flykter etter en dag med dårlige nyheter.',
    })
  }
  const mynt = størst(KRYPTO)
  const ek = endring(mynt)
  if (Math.abs(ek) >= 0.1) {
    saker.push({
      type: 'marked',
      tittel: `${PAPIRER[mynt].navn} ${ek > 0 ? 'skyter i været' : 'stuper'}: ${ek > 0 ? '+' : '−'}${prosent(ek)}`,
      tekst: ek > 0 ? 'Kryptoentusiastene jubler — skeptikerne advarer mot boble.' : 'Kryptomarkedet blør, og sosiale medier er fulle av anger.',
    })
  }
  const ei = s.marked.eiendom.kurs / før.eiendomsindeks - 1
  if (ei <= -0.08) {
    saker.push({ type: 'marked', tittel: 'BOLIGKRAKK', tekst: `Eiendomsprisene falt ${prosent(ei)} på ett døgn. Meglerne melder om tomme visninger.` })
  } else if (Math.abs(ei) >= 0.02) {
    saker.push({ type: 'marked', tittel: `Boligprisene ${ei > 0 ? 'stiger' : 'faller'} ${prosent(ei)}`, tekst: ei > 0 ? 'Budrundene er tilbake i Bergen og Oslo.' : 'Flere boliger blir liggende usolgt.' })
  }
  if (s.marked.stemning > 0.6) saker.push({ type: 'marked', tittel: 'Kryptofeber', tekst: 'Grådigheten rår i kryptomarkedet. Selv bestemor spør om Bitmynt.' })
  else if (s.marked.stemning < -0.6) saker.push({ type: 'marked', tittel: 'Panikk i kryptomarkedet', tekst: 'Frykten rår, og mange selger for å redde det som reddes kan.' })
  return saker
}

const LOKALT: Overskrift[] = [
  { type: 'lokalt', tittel: 'Regnrekord i Bergen', tekst: 'Førti dager på rad med nedbør. Paraplyselgerne gnir seg i hendene.' },
  { type: 'lokalt', tittel: 'Pølseprisen stiger igjen', tekst: 'Bransjen skylder på sennepen.' },
  { type: 'lokalt', tittel: 'Ny tunnel åpner etter tolv år', tekst: 'Kostnadene endte på det tredobbelte. Ingen er overrasket.' },
  { type: 'lokalt', tittel: 'Turistene strømmer til Geilo', tekst: 'Hyttene er utleid resten av sesongen.' },
  { type: 'lokalt', tittel: 'Sentralbanken holder renten i ro', tekst: 'Sentralbanken er «forsiktig optimistisk», uten å si hva optimismen gjelder.' },
  { type: 'lokalt', tittel: 'Kaffeprisen når ny topp', tekst: 'Kafeene tar grep: kannen på bordet er borte.' },
  { type: 'lokalt', tittel: 'Laksen er tilbake i elvene', tekst: 'Fiskerne melder om rekordfangst — og rekordhistorier.' },
  { type: 'lokalt', tittel: 'Nordlys over Lofoten', tekst: 'Fotografer fra hele verden fyller hotellene.' },
  { type: 'lokalt', tittel: 'Bybanen forsinket', tekst: 'Et løvblad på skinnene fikk skylda. Igjen.' },
  { type: 'lokalt', tittel: 'Gründerpris til ukjent saftbod', tekst: 'Juryen roste «en forfriskende forretningsmodell».' },
  { type: 'lokalt', tittel: 'Ny rekord i Holmenkollen', tekst: 'Hoppet var så langt at målebåndet måtte skjøtes.' },
  { type: 'lokalt', tittel: 'Sjømatprisene stiger', tekst: 'Fiskeoppdretterne på Vestlandet går et godt år i møte.' },
  { type: 'lokalt', tittel: 'Mangel på håndverkere', tekst: 'Ventetiden for en rørlegger er nå lengre enn for en superbil.' },
  { type: 'lokalt', tittel: 'Strømprisen faller', tekst: 'Det blåser godt i Nordsjøen, og vindmøllene går for fullt.' },
  { type: 'lokalt', tittel: 'Bergen vinner seriegull', tekst: 'Byen feiret til langt på natt — i regnet, selvfølgelig.' },
]

/**
 * Dagsskiftet i avisredaksjonen: dagens selskapsnyheter settes i gang,
 * perioder som er slutt gjøres opp, og utgaven settes sammen og legges i
 * avisen. Muterer — brukes på kopier.
 */
export function gisUtAvis(s: Spilltilstand, t: Terning): void {
  const før = s.forrigeDag
  const nyheter = selskapsnyheter(s, t)
  const oppgjor = dagsskifteOppgjor(s)
  const skattesaker = skattVedDagsskifte(s, oppgjor, t, tittel(s))
  const startupsaker = startupsVedDagsskifte(s, t)
  const klubbsaker = klubbVedDagsskifte(s)
  const andre = [...jordVedDagsskifte(s), ...landemerkerVedDagsskifte(s), ...kunstVedDagsskifte(s)]
  // Rekkefølgen er viktigheten: deg selv og skatten først, så nyheter som
  // flytter kurser, kappløpet, dagens bevegelser og sladder. Lokalstoff fyller
  // på når det er stille.
  const saker = [
    ...omDeg(s, før),
    ...skattesaker,
    ...klubbsaker,
    ...andre.filter((x) => x.type === 'deg'),
    ...startupsaker.filter((x) => x.type === 'deg'),
    ...nyheter,
    ...omRivalene(s, før),
    ...omMarkedet(s, før),
    ...startupsaker.filter((x) => x.type !== 'deg'),
    ...andre.filter((x) => x.type !== 'deg'),
    ...sosietet(s, t),
  ].slice(0, MAKS_SAKER)
  const brukt = new Set(saker.map((x) => x.tittel))
  while (saker.length < MIN_SAKER) {
    const sak = t.velg(LOKALT)
    if (brukt.has(sak.tittel)) continue
    brukt.add(sak.tittel)
    saker.push(sak)
  }
  const utgave: Avisutgave = { dag: dagnummer(s.sek), saker }
  if (oppgjor.length) utgave.oppgjor = oppgjor
  s.avis.push(utgave)
  if (s.avis.length > MAKS_UTGAVER) s.avis.splice(0, s.avis.length - MAKS_UTGAVER)
  // Ny dag: nytt utgangspunkt for avisen og for porteføljens «i dag».
  s.forrigeDag = lagDagsbilde(s)
  s.dagensFlyt = nullPerKlasse()
}
