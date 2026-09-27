/**
 * Børstidende — avisen som kommer ut hver spilldag. Sakene bygges av det som
 * har skjedd siden forrige utgave: hva du har gjort, hvordan markedet har gått,
 * og — når det er stille — litt lokalstoff. Alt er deterministisk: tilfeldige
 * valg går gjennom simuleringens terning.
 */

import { BEDRIFTSTYPER } from './innhold'
import { EIENDOMSSTIGEN, LUKSUS } from './eiendom'
import { AKSJER, KRYPTO, PAPIRER } from './marked'
import { PRESTASJONER } from './prestasjoner'
import type { Terning } from './rng'
import type { Avisutgave, Dagsbilde, Overskrift, PapirId, Spilltilstand } from './types'
import { dagnummer } from './kalender'

export const MAKS_UTGAVER = 7
const MAKS_SAKER = 4
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
  }
}

const prosent = (andel: number) => `${Math.round(Math.abs(andel) * 100)} %`

/** Sakene om deg selv: nye bedrifter, eiendom, luksus og prestasjoner. */
function omDeg(s: Spilltilstand, før: Dagsbilde): Overskrift[] {
  const saker: Overskrift[] = []
  for (const p of PRESTASJONER) {
    const når = s.prestasjoner[p.id]
    if (når === undefined || når <= før.sek) continue
    if (p.id === 'millionaer') saker.push({ type: 'deg', tittel: 'Ny millionær i byen!', tekst: 'Den unge gründeren som startet med en saftbod, har passert sin første million.' })
    else if (p.id === 'milliardaer') saker.push({ type: 'deg', tittel: 'MILLIARDÆR', tekst: 'Fra saftbod til milliard. Landets nyeste milliardær har nådd målet — og markedet holder pusten.' })
    else if (p.id === 'marginkrav') saker.push({ type: 'deg', tittel: 'Banken tvangsselger for kjent investor', tekst: 'Etter en tøff dag i markedet måtte banken selge unna for å dekke et lån.' })
  }
  for (const type of s.bedrifter.map((b) => b.type)) {
    if (!før.bedrifter.includes(type)) {
      const navn = BEDRIFTSTYPER[type].navn.toLowerCase()
      saker.push({ type: 'deg', tittel: `Lokal gründer åpner ${navn}`, tekst: `Den ekspansive forretningspersonen satser videre med en ny ${navn}.` })
    }
  }
  const nyeEiendommer = Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0) - før.eiendommer
  if (nyeEiendommer > 0) {
    const dyreste = [...EIENDOMSSTIGEN].reverse().find((id) => (s.eiendommer[id] ?? 0) > 0)
    saker.push({
      type: 'deg',
      tittel: nyeEiendommer === 1 ? 'Eiendomsinvestor slår til igjen' : `Investor kjøper ${nyeEiendommer} eiendommer på én dag`,
      tekst: dyreste ? `Porteføljen strekker seg nå helt til ${dyreste === 'oy' ? 'Lofoten' : 'nye bydeler'}.` : '',
    })
  }
  for (const id of s.luksus) {
    if (!før.luksus.includes(id)) {
      saker.push({ type: 'deg', tittel: `Spottet: ${LUKSUS[id].navn.toLowerCase()} i sentrum`, tekst: 'Naboene lurer på hvem den tilhører. Vi har våre mistanker.' })
      break
    }
  }
  return saker
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

/** Lager dagens utgave og legger den i avisen. Muterer — brukes på kopier. */
export function gisUtAvis(s: Spilltilstand, t: Terning): void {
  const før = s.forrigeDag
  const saker = [...omDeg(s, før), ...omMarkedet(s, før)].slice(0, MAKS_SAKER)
  const brukt = new Set(saker.map((x) => x.tittel))
  while (saker.length < MIN_SAKER) {
    const sak = t.velg(LOKALT)
    if (brukt.has(sak.tittel)) continue
    brukt.add(sak.tittel)
    saker.push(sak)
  }
  const utgave: Avisutgave = { dag: dagnummer(s.sek), saker }
  s.avis.push(utgave)
  if (s.avis.length > MAKS_UTGAVER) s.avis.splice(0, s.avis.length - MAKS_UTGAVER)
  s.forrigeDag = lagDagsbilde(s)
}
