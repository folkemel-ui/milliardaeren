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
import { jordVedDagsskifte, odelVedDagsskifte, skogVedDagsskifte } from './jord'
import { dyrVedDagsskifte } from './dyr'
import { landemerkerVedDagsskifte } from './landemerker'
import { kunstVedDagsskifte } from './kunst'
import { kvartalssaker } from './kvartal'
import { forbesliste } from './rivaler'
import { FORMER, fusjonsnokler } from './fusjon'
import { nettoformue } from './formler'
import type { Terning } from './rng'
import { kortKroner } from './tall'
import type { Avisutgave, Dagsbilde, LuksusId, Overskrift, PapirId, Spilltilstand } from './types'
import { dagnummer } from './kalender'
import { verdenssaker } from './verden'
import { utleieVedDagsskifte } from './utleie'
import { byerMedEiendom, leieIByen } from './eiendom'
import { auksjonVedDagsskifte } from './auksjon'
import { racingVedDagsskifte } from './racing'
import { romfartVedDagsskifte } from './romfart'
import { charterVedDagsskifte } from './charter'

/**
 * Utgavene avisa tar vare på: like mange som to timer borte trykker (BORTE_TAK_SEK / DAG_SEK = 24).
 * Før 7, så 17 av utgavene fra et langt fravær kunne aldri leses — rentemøter, titler, tapte
 * auksjoner — og velkomsten sa «7 nye utgaver». Hver utgave er under 1 kB i lagringen.
 */
export const MAKS_UTGAVER = 24
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
    stemningssone: stemningssone(s.forrigeDag?.stemningssone ?? 0, s.marked.stemning),
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
 * avisa om deg — og jo mindre anonymt. Én per nivå i STATUSNIVAAER (en test passer på).
 */
export const TITLER = [
  'Den unge gründeren',
  'Lokalkjendisen',
  'Den lovende gründeren',
  'Forretningsprofilen',
  'Rikmannen',
  'Magnaten',
  'Tycoonen',
  'Legenden',
  'Næringslivsikonet',
  'Finansmonarken',
  'Den udødelige',
  'Dynastigrunnleggeren',
  'Den mytiske',
  'Titanen',
  'Den evige',
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
    else if (p.id === 'billionaer') saker.push({ type: 'deg', tittel: 'BILLIONÆR', tekst: 'Tusen milliarder. Statistisk sentralbyrå vurderer å føre formuen som egen næring.' })
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

/** Så mye en aksje må bevege seg for å komme i avisa — og en mynt. */
const AKSJE_TERSKEL = 0.03
const KRYPTO_TERSKEL = 0.1
/**
 * En post du eier, kommer i avisa ved halve terskelen (Pakke 82): avisa skriver heller
 * om din aksje som steg 2 % enn om dagens største bevegelse i et papir du ikke har.
 */
export const EGEN_TERSKEL = 0.5
/**
 * … og flytter seg minst så mye i kroner (Pakke 101): 0,1 % av nettoformuen, og aldri under
 * kr 10 000. Før valgte avisa den største bevegelsen i prosent: kr 10 000 i Elgcoin fikk 66 saker
 * og kr 100 mill i Bitmynt 4 på 360 dager, og noen sa «Det er kr 0 mer enn i går».
 */
export const EGEN_FORMUE_ANDEL = 0.001
export const EGEN_KRONER_MIN = 10_000
/**
 * Kryptostemningen blir «feber» over denne og «panikk» under minus den, og roer seg
 * først innenfor ROLIG_GRENSE — ellers vippet den fram og tilbake over 0,6 og avisa
 * skrev om det annenhver dag.
 */
const STEMNINGSGRENSE = 0.6
const ROLIG_GRENSE = 0.4

/** Sonen i dag, gitt sonen i går: 1 feber, −1 panikk, 0 rolig. */
export function stemningssone(igaar: number, x: number): number {
  if (x > STEMNINGSGRENSE) return 1
  if (x < -STEMNINGSGRENSE) return -1
  if (igaar === 1 && x > ROLIG_GRENSE) return 1
  if (igaar === -1 && x < -ROLIG_GRENSE) return -1
  return 0
}

const antallAv = (s: Spilltilstand, id: PapirId) => s.beholdning[id]?.antall ?? 0

/** «Din post i Romfart Nord steg 6 %» — med hva det betydde i kroner for posten du har nå. */
function egenSak(s: Spilltilstand, før: Dagsbilde, id: PapirId, e: number): Overskrift {
  const p = PAPIRER[id]
  const kroner = antallAv(s, id) * (s.marked.kurser[id].kurs - før.kurser[id])
  const opp = e > 0
  const tittel = p.klasse === 'krypto'
    ? `Din ${p.navn} ${opp ? 'skyter i været' : 'stuper'}: ${opp ? '+' : '−'}${prosent(e)}`
    : `Din post i ${p.navn} ${opp ? 'steg' : 'falt'} ${prosent(e)}`
  return { type: 'marked', tittel, tekst: `Det er ${kortKroner(Math.abs(kroner))} ${opp ? 'mer' : 'mindre'} enn i går for posten din.` }
}

/**
 * Stemningssaken (Pakke 82): bare den dagen stemningen krysser grensen, og én gang når
 * den faller tilbake — før sto «Panikk i kryptomarkedet» på trykk hver dag den varte.
 * Har du krypto, står det hva den er verdt og hvor mye kursene flyttet den siden i går.
 */
function stemningssak(s: Spilltilstand, før: Dagsbilde): Overskrift | null {
  const forrige = før.stemningssone ?? 0
  const naa = stemningssone(forrige, s.marked.stemning)
  if (naa === forrige) return null
  let sak: Overskrift
  if (naa === 1) sak = { type: 'marked', tittel: 'Kryptofeber', tekst: 'Grådigheten rår i kryptomarkedet. Selv bestemor spør om Bitmynt.' }
  else if (naa === -1) sak = { type: 'marked', tittel: 'Panikk i kryptomarkedet', tekst: 'Frykten rår, og mange selger for å redde det som reddes kan.' }
  else sak = { type: 'marked', tittel: 'Roen senker seg over kryptomarkedet', tekst: `Etter dager med ${forrige === 1 ? 'feber' : 'panikk'} er stemningen tilbake på jorda.` }
  let verdi = 0
  let igaar = 0
  for (const id of KRYPTO) {
    const n = antallAv(s, id)
    verdi += n * s.marked.kurser[id].kurs
    igaar += n * før.kurser[id]
  }
  if (verdi > 0 && igaar > 0) {
    const e = verdi / igaar - 1
    sak.tekst += ` Kryptoen din er verdt ${kortKroner(verdi)} — ${e >= 0 ? '+' : '−'}${prosent(e)} siden i går.`
  }
  return sak
}

/**
 * Sakene om markedet: dagens største bevegelser. Eier du aksjer eller krypto, skriver
 * avisa om den av dine som beveget seg mest, ved halve terskelen (Pakke 82). Disse
 * kommer i `dine`, som står foran rivalene og verden; resten i `andre`.
 */
export function omMarkedet(s: Spilltilstand, før: Dagsbilde): { dine: Overskrift[]; andre: Overskrift[] } {
  const dine: Overskrift[] = []
  const saker: Overskrift[] = []
  const endring = (id: PapirId) => s.marked.kurser[id].kurs / før.kurser[id] - 1
  const størst = (ider: PapirId[]) => [...ider].sort((a, b) => Math.abs(endring(b)) - Math.abs(endring(a)))[0]
  // Pakke 101: den av dine som flyttet seg mest i kroner, blant dem som når terskelen i prosent og i kroner.
  const kroner = (id: PapirId) => Math.abs(antallAv(s, id) * (s.marked.kurser[id].kurs - før.kurser[id]))
  const gulv = Math.max(EGEN_KRONER_MIN, EGEN_FORMUE_ANDEL * nettoformue(s))
  const egen = (ider: PapirId[], terskel: number): boolean => {
    const mine = ider.filter((id) => antallAv(s, id) > 0 && Math.abs(endring(id)) >= terskel * EGEN_TERSKEL - 1e-9 && kroner(id) >= gulv)
    if (!mine.length) return false
    const id = mine.reduce((a, b) => (kroner(b) > kroner(a) ? b : a))
    dine.push(egenSak(s, før, id, endring(id)))
    return true
  }

  const aksje = størst(AKSJER)
  const ea = endring(aksje)
  if (!egen(AKSJER, AKSJE_TERSKEL) && Math.abs(ea) >= AKSJE_TERSKEL) {
    saker.push({
      type: 'marked',
      tittel: `${PAPIRER[aksje].navn} ${ea > 0 ? 'stiger' : 'faller'} ${prosent(ea)}`,
      tekst: ea > 0 ? 'Analytikerne peker på sterke tall og optimisme på børsen.' : 'Investorene flykter etter en dag med dårlige nyheter.',
    })
  }
  const mynt = størst(KRYPTO)
  const ek = endring(mynt)
  if (!egen(KRYPTO, KRYPTO_TERSKEL) && Math.abs(ek) >= KRYPTO_TERSKEL) {
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
  const stemning = stemningssak(s, før)
  if (stemning) saker.push(stemning)
  return { dine, andre: saker }
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
  // Pakke 101: rapportene står med selskapsnyhetene; estimatene for om tre dager under markedet.
  const kvartal = kvartalssaker(s)
  const nyheter = [...kvartal.rapporter, ...selskapsnyheter(s, t)]
  const oppgjor = dagsskifteOppgjor(s)
  const skattesaker = skattVedDagsskifte(s, oppgjor, t, tittel(s))
  const startupsaker = startupsVedDagsskifte(s, t)
  const klubbsaker = klubbVedDagsskifte(s)
  // Pakke 89: det som var leid ut og bedt hjem, er hjemme; auksjonshuset slår av og byr fram.
  charterVedDagsskifte(s)
  const auksjonssaker = auksjonVedDagsskifte(s, tittel(s))
  // Pakke 90: racingteamets lønn, og løpet på løpsdagen.
  const racingsaker = racingVedDagsskifte(s, tittel(s))
  // Pakke 118: dagens oppskyting fra romfartsfabrikken, og morgendagens kontrakter.
  const romfartsaker = romfartVedDagsskifte(s, tittel(s))
  // Pakke 122: storm og brann i skogene, og skogforsikringen som fornyes. Ingen saker i avisa ennå.
  skogVedDagsskifte(s)
  const andre = [
    // Pakke 94: dyrene og tilskuddet hver dag, før mandagens høst.
    ...dyrVedDagsskifte(s),
    ...jordVedDagsskifte(s),
    // Pakke 114: en gård eid i 90 dager blir odelsgård.
    ...odelVedDagsskifte(s),
    ...landemerkerVedDagsskifte(s),
    ...kunstVedDagsskifte(s),
    // Mandagens leietakere (Pakke 54): en dårlig leietaker koster en ukes leie i byen (Pakke 83).
    ...utleieVedDagsskifte(s, byerMedEiendom(s), (by) => leieIByen(s, by)),
  ]
  // Verden (Pakke 49): rentemøtet, ukas trender, helligdagen og været. Fra hasher, ikke terningen.
  const verden = verdenssaker(s)
  const marked = omMarkedet(s, før)
  // Rekkefølgen er viktigheten: deg selv og skatten først, så nyheter som
  // flytter kurser, kappløpet, dagens bevegelser og sladder. Lokalstoff fyller
  // på når det er stille.
  const saker = [
    ...omDeg(s, før),
    ...skattesaker,
    ...klubbsaker,
    ...racingsaker.filter((x) => x.type === 'deg'),
    ...romfartsaker,
    ...andre.filter((x) => x.type === 'deg'),
    ...auksjonssaker.filter((x) => x.type === 'deg'),
    ...startupsaker.filter((x) => x.type === 'deg'),
    ...nyheter,
    ...marked.dine,
    ...omRivalene(s, før),
    // Auksjonen (Pakke 89) etter kappløpet — en fusjon med en rival er viktigere — men foran verden og kursene.
    ...auksjonssaker.filter((x) => x.type !== 'deg'),
    ...racingsaker.filter((x) => x.type !== 'deg'),
    ...verden.marked.filter((x) => x !== verden.rente),
    ...marked.andre,
    ...kvartal.estimater,
    ...startupsaker.filter((x) => x.type !== 'deg'),
    ...andre.filter((x) => x.type !== 'deg'),
    ...verden.lokalt,
    ...sosietet(s, t),
  ].slice(0, verden.rente ? MAKS_SAKER - 1 : MAKS_SAKER)
  // Pakke 101: rentemøtet flytter lån, sparing, obligasjoner og aksjer, så det har fast plass —
  // nest øverst, under dagens største sak om deg. Før kom 7 av 8 aldri på trykk sent i spillet.
  if (verden.rente) saker.splice(Math.min(1, saker.length), 0, verden.rente)
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
