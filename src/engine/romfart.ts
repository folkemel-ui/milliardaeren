/**
 * Romfartsfabrikken (Pakke 118): den siste bedriften, som Folke beskrev — «It will
 * operate differently from the rest of the businesses.» Ingen nivåer, ingen ansatte,
 * ingen retning. Fabrikken bygger raketter av delene som er forsket fram, og skyter
 * opp én kontrakt for andre selskaper ved hvert dagsskifte (hvert femte minutt).
 *
 * Pengene er satt som en bedrift til samme pris (Folkes valg): stigen betaler prisen
 * tilbake på ~30 000 s, så kr 5,4 bill skal gi ~180 mill/s — ~54 mrd per spilldag.
 * Med de første delene løfter raketten 8 tonn, holder 80 % av gangene og koster en
 * firedel av honoraret for en full rakett: snittet er (0,80 − 0,25) · 8 t · 13,5 mrd
 * = 59 mrd for en full rakett; tavlas kontrakter er i snitt litt mindre, så målt ~53 mrd. Ferdig forsket løfter den 48,5 tonn, holder 99 % og koster 5 %:
 * ~600 mrd per dag (~2 bill/s), rundt ti ganger — som nivåene gir en vanlig bedrift.
 *
 * Seks deler i seks trinn (Folkes valg): tre løfter (motorer, tanker, øvre trinn), to
 * gjør raketten sikrere (styring, varmeskjold), og gjenbruk gjør den billigere.
 * Forskningen trenger en forskningsavdeling; hvert trinn av avdelingen etter det
 * første kutter tiden 20 %. Første trinn av en del tar én spilldag, det sjette 16.
 *
 * Oppskytingene trekker fra fabrikkens egen terning (`r.frø`), kontraktene fra hasher,
 * så ingen andre terninger flytter seg. Boten kjøper aldri fabrikken: gullmesteren og
 * benken ser den ikke.
 */

import { DAG_SEK, dagnummer } from './kalender'
import { MAKS_HENDELSER } from './innhold'
import { hashTekst, tilfeldig, Terning } from './rng'
import { kortKroner, tall } from './tall'
import type { Forskningsdel, Oppskyting, Overskrift, Rakettdel, Romfart, Romkontrakt, Romkontraktbane, Satellittdel, Spilltilstand } from './types'

/** Hva fabrikken koster: ×3 over brikkefabrikken, som stigen. */
export const ROMFART_PRIS = 5_400_000_000_000
/** Fabrikken kan kjøpes fra denne formuen (høyeste du har hatt): 1,25 × prisen, som stigen. */
export const ROMFART_LAASES_OPP = 6_750_000_000_000

export const RAKETTDELER: Record<Rakettdel, { navn: string; tekst: string; gir: 'loft' | 'sikkerhet' | 'pris' }> = {
  motorer: { navn: 'Motorer', tekst: 'Mer skyvekraft i første trinn.', gir: 'loft' },
  tanker: { navn: 'Tanker', tekst: 'Lettere tanker i kompositt, mer drivstoff.', gir: 'loft' },
  ovretrinn: { navn: 'Øvre trinn', tekst: 'Et sterkere andretrinn — og fra trinn 2 geostasjonær bane.', gir: 'loft' },
  styring: { navn: 'Styring', tekst: 'Bedre sensorer og programvare i ferden opp.', gir: 'sikkerhet' },
  varmeskjold: { navn: 'Varmeskjold', tekst: 'Raketten tåler mer på vei opp og ned igjen.', gir: 'sikkerhet' },
  gjenbruk: { navn: 'Gjenbruk', tekst: 'Første trinn lander og flys igjen.', gir: 'pris' },
}
export const RAKETTDELLISTE = Object.keys(RAKETTDELER) as Rakettdel[]
export const DELTRINN = 6

/** Forskningen av hvert trinn: en andel av fabrikkens pris, og spilldager (Folkes valg: 1 → 16). */
export const FORSKNINGSPRIS = [0.01, 0.02, 0.04, 0.08, 0.16, 0.32].map((a) => a * ROMFART_PRIS)
export const FORSKNINGSDAGER = [1, 2, 3, 5, 9, 16] as const

/** Forskningsavdelingen: trinn 1 åpner forskningen, hvert trinn etter det kutter tiden 20 %. */
export const AVDELINGSPRIS = [0.02, 0.05, 0.1, 0.2, 0.4, 0.8].map((a) => a * ROMFART_PRIS)
export const AVDELING_KUTT = 0.2

export const LOFT_GRUNN = 8
export const LOFT_PER_TRINN = 2.25
export const SIKKERHET_GRUNN = 0.8
export const SIKKERHET_TOPP = 0.99
/** Honoraret per tonn i lav bane. */
export const PRIS_PER_TONN = 13_500_000_000
/** Raketten koster så stor del av honoraret for en full rakett — før gjenbruken. */
export const RAKETT_ANDEL = 0.25
/** Ferdig gjenbruk tar så mye av rakettprisen bort. */
export const GJENBRUK_KUTT = 0.8
/** Geostasjonær bane: dobbelt så mye løft per tonn, 2,5 ganger honoraret — og øvre trinn på minst 2. */
export const GEO_LOFT = 2
export const GEO_PRIS = 2.5
export const GEO_FRA_TRINN = 2
/** Så mange oppskytinger huskes. */
export const OPPSKYTINGER_HUSKET = 20
export const KONTRAKTER_PER_DAG = 3

const KUNDER = ['Nordsat', 'Polarkom', 'Meteo Nord', 'Arktisk Romsenter', 'Fjordnett', 'EuroGeo', 'Andøy Forskning', 'Baltisk Telekom', 'Svalbard Bredbånd', 'Kongsfjord Data', 'Atlas Orbital', 'Hav og Klima']
const LASTER: Record<Romkontraktbane, string[]> = {
  lav: ['en værsatellitt', 'jordobservasjon', 'forsyninger til romstasjonen', 'et forskningsinstrument', 'en klynge småsatellitter', 'et romteleskop'],
  geo: ['en kommunikasjonssatellitt', 'en TV-satellitt', 'en navigasjonssatellitt'],
}

export const harRomfart = (s: Spilltilstand) => s.romfart !== undefined
export const romfartAapen = (s: Spilltilstand) => s.hoyesteFormue >= ROMFART_LAASES_OPP

export function nyRomfart(s: Spilltilstand): Romfart {
  const r: Romfart = {
    frø: hashTekst(`romfart:${s.frø}:${s.sek}`),
    startetSek: s.sek,
    investert: ROMFART_PRIS,
    avdeling: 0,
    deler: { motorer: 0, tanker: 0, ovretrinn: 0, styring: 0, varmeskjold: 0, gjenbruk: 0 },
    tavle: [],
    tavleDag: -1,
    nesteKontraktId: 1,
    oppskytinger: [],
    antall: 0,
    vellykket: 0,
    inntekt: 0,
    kostnad: 0,
  }
  r.tavle = lagTavle(r, dagnummer(s.sek))
  r.tavleDag = dagnummer(s.sek)
  return r
}

/** Hvor mange tonn raketten løfter til lav bane. */
export function loft(r: Romfart): number {
  return LOFT_GRUNN + LOFT_PER_TRINN * (r.deler.motorer + r.deler.tanker + r.deler.ovretrinn)
}

/** Sjansen for at en oppskyting går bra: 80 % til 99 %. */
export function sikkerhet(r: Romfart): number {
  return SIKKERHET_GRUNN + ((SIKKERHET_TOPP - SIKKERHET_GRUNN) * (r.deler.styring + r.deler.varmeskjold)) / (2 * DELTRINN)
}

/** Hva det koster å bygge en rakett nå: en firedel av en full rakett i lav bane, mindre med gjenbruk. */
export function rakettpris(r: Romfart): number {
  return RAKETT_ANDEL * loft(r) * PRIS_PER_TONN * (1 - (GJENBRUK_KUTT * r.deler.gjenbruk) / DELTRINN)
}

/** Løftet en kontrakt trenger: tonnene, dobbelt i geostasjonær bane. */
export const trengerLoft = (k: Pick<Romkontrakt, 'tonn' | 'bane'>) => k.tonn * (k.bane === 'geo' ? GEO_LOFT : 1)
export const kanLofte = (r: Romfart, k: Romkontrakt) => trengerLoft(k) <= loft(r) + 1e-9 && (k.bane !== 'geo' || r.deler.ovretrinn >= GEO_FRA_TRINN)

/** Hva en kontrakt gir i snitt: honoraret ganger sjansen, minus raketten. */
export function forventet(r: Romfart, k: Romkontrakt): number {
  return sikkerhet(r) * k.honorar - rakettpris(r)
}

/** Kontrakten fabrikken tar når du ikke har valgt: den som gir mest i snitt av dem raketten løfter. */
export function besteKontrakt(r: Romfart): Romkontrakt | null {
  const mulige = r.tavle.filter((k) => kanLofte(r, k))
  if (mulige.length === 0) return null
  return mulige.reduce((a, b) => (forventet(r, b) > forventet(r, a) ? b : a))
}

export function valgtKontrakt(r: Romfart): Romkontrakt | null {
  const k = r.valgt !== undefined ? r.tavle.find((x) => x.id === r.valgt) : undefined
  return k && kanLofte(r, k) ? k : besteKontrakt(r)
}

/**
 * Dagens tavle: tre kontrakter fra en hash av fabrikken og dagen. Den første kan raketten
 * alltid løfte (60–100 % av løftet), den andre ligger rundt grensen (85–115 %), den
 * tredje over (110–160 %) — den trenger bedre deler. Med øvre trinn 2 er hver tredje i
 * geostasjonær bane.
 */
export function lagTavle(r: Romfart, dag: number): Romkontrakt[] {
  const spenn: [number, number][] = [[0.6, 1], [0.85, 1.15], [1.1, 1.6]]
  const ut: Romkontrakt[] = []
  for (let i = 0; i < KONTRAKTER_PER_DAG; i++) {
    const h = (n: number) => tilfeldig(hashTekst(`romkontrakt:${r.frø}:${dag}:${i}:${n}`))
    const geo = r.deler.ovretrinn >= GEO_FRA_TRINN && h(1) < 1 / 3
    const bane: Romkontraktbane = geo ? 'geo' : 'lav'
    const [fra, til] = spenn[i]
    const loftet = loft(r) * (fra + (til - fra) * h(2))
    const tonn = Math.max(1, Math.round((loftet / (geo ? GEO_LOFT : 1)) * 2) / 2)
    const kunde = KUNDER[Math.floor(h(3) * KUNDER.length)]
    const last = LASTER[bane][Math.floor(h(4) * LASTER[bane].length)]
    // Kunden betaler 85–120 % av listeprisen.
    const honorar = Math.round(tonn * PRIS_PER_TONN * (geo ? GEO_PRIS : 1) * (0.85 + 0.35 * h(5)))
    ut.push({ id: r.nesteKontraktId + i, kunde, last, tonn, bane, honorar })
  }
  r.nesteKontraktId += KONTRAKTER_PER_DAG
  return ut
}

// ─────────────────────────────────────────────── Satellittnettet (Pakke 119)

/*
 * Folke: «the satellites are used for world covering cell service. The more satellites
 * launched, the more coverage, the more profit.» Egne satellitter går opp med fabrikkens
 * egen rakett — den dagen er det ingen kontrakt — så mange som raketten løfter, ett tonn
 * hver. Dekningen er 1 − e^(−enheter/20): 20 satellitter gir 63 %, 60 gir 95 %. Et fullt
 * dekket nett tjener ~525 mill/s med de første delene — rundt tre ganger kontraktene i
 * starten (Folkes valg: nettet er målet) — og opptil seks ganger det med kapasiteten
 * forsket fram, mer enn kontraktenes ~2 bill/s. Pengene kommer hvert sekund, som leie,
 * også mens du er borte. En lisens for 100 satellitter gjør at gamle tas ned for å gi
 * plass til bedre. Satellittene står ikke i formuen: de slites ut.
 */

export const SATELLITTDELER: Record<Satellittdel, { navn: string; tekst: string }> = {
  solpaneler: { navn: 'Solpaneler', tekst: 'Mer strøm og lengre liv: 30 spilldager med de første, +15 per trinn.' },
  antenner: { navn: 'Antenner', tekst: 'Hver satellitt dekker mer, så færre gir full dekning.' },
  kapasitet: { navn: 'Kapasitet', tekst: 'Flere samtaler og mer data gjennom hver satellitt: full dekning tjener mer.' },
}
export const SATELLITTDELLISTE = Object.keys(SATELLITTDELER) as Satellittdel[]
export const FORSKNINGSDELER: Forskningsdel[] = [...RAKETTDELLISTE, ...SATELLITTDELLISTE]

/** En satellitt veier ett tonn og koster dette å bygge, i tillegg til raketten. */
export const SATELLITT_TONN = 1
export const SATELLITT_PRIS = 5_000_000_000
/** Lisensen: så mange satellitter kan være i bane samtidig. */
export const MAKS_SATELLITTER = 100
/** Dekningen er 1 − e^(−enheter / DEKNING_SKALA). */
export const DEKNING_SKALA = 20
/** Det et fullt dekket nett tjener per sekund med de første delene. */
export const NETT_FULL = 525_000_000
export const LEVETID_GRUNN = 30
export const LEVETID_PER_TRINN = 15
export const ANTENNE_PER_TRINN = 0.25
/** Kapasiteten ganger det nettet tjener: ×1 → ×6 over seks trinn. */
export const KAPASITET_PER_TRINN = 5 / 6
export const EGNE_SATELLITTER = 'Egne satellitter'

const TOMME_SATDELER: Record<Satellittdel, number> = { solpaneler: 0, antenner: 0, kapasitet: 0 }
export const satdeler = (r: Romfart): Record<Satellittdel, number> => r.satdeler ?? TOMME_SATDELER
export const erRakettdel = (d: Forskningsdel): d is Rakettdel => d in RAKETTDELER
export const delnavn = (d: Forskningsdel) => (erRakettdel(d) ? RAKETTDELER[d].navn : SATELLITTDELER[d].navn)

/** Trinnet en del er forsket fram til, rakett eller satellitt. */
export function trinnFor(r: Romfart, d: Forskningsdel): number {
  return erRakettdel(d) ? r.deler[d] : satdeler(r)[d]
}

/** Hvor mange spilldager en satellitt bygget nå er i drift. */
export const levetid = (r: Romfart) => LEVETID_GRUNN + LEVETID_PER_TRINN * satdeler(r).solpaneler
/** Dekningen én satellitt bygget nå gir, i enheter. */
export const satDekning = (r: Romfart) => 1 + ANTENNE_PER_TRINN * satdeler(r).antenner
export const kapasitetsfaktor = (r: Romfart) => 1 + KAPASITET_PER_TRINN * satdeler(r).kapasitet

export const iBane = (r: Romfart) => (r.kull ?? []).reduce((sum, k) => sum + k.antall, 0)
export const ledigePlasser = (r: Romfart) => Math.max(0, MAKS_SATELLITTER - iBane(r))
/** Så mange satellitter neste oppskyting tar med: det raketten løfter, innenfor lisensen. */
export const satellitterPerOppskyting = (r: Romfart) => Math.min(Math.floor(loft(r) / SATELLITT_TONN), ledigePlasser(r))

/** Dekningen nå, 0–1. */
export function dekning(r: Romfart): number {
  const enheter = (r.kull ?? []).reduce((sum, k) => sum + k.antall * k.dekning, 0)
  return 1 - Math.exp(-enheter / DEKNING_SKALA)
}

/** Hva nettet tjener per sekund med satellittene som er i bane nå. */
export function nettInntekt(r: Romfart): number {
  return NETT_FULL * kapasitetsfaktor(r) * dekning(r)
}

/** Hva en satellittoppskyting koster: raketten og satellittene. */
export const satellittoppskytingPris = (r: Romfart) => rakettpris(r) + satellitterPerOppskyting(r) * SATELLITT_PRIS

/** Hvor lang tid neste trinn av en del tar å forske fram nå, i sekunder. */
export function forskningstid(r: Romfart, del: Forskningsdel): number | null {
  const trinn = trinnFor(r, del)
  if (trinn >= DELTRINN) return null
  return FORSKNINGSDAGER[trinn] * DAG_SEK * (1 - AVDELING_KUTT) ** Math.max(0, r.avdeling - 1)
}

export const forskningspris = (r: Romfart, del: Forskningsdel): number | null => (trinnFor(r, del) >= DELTRINN ? null : FORSKNINGSPRIS[trinnFor(r, del)])
export const nesteAvdelingspris = (r: Romfart): number | null => AVDELINGSPRIS[r.avdeling] ?? null
export const alleForsket = (r: Romfart) => RAKETTDELLISTE.every((d) => r.deler[d] >= DELTRINN)

/** Fabrikken står i formuen til det som er bygget og forsket fram. */
export function romfartsverdi(s: Spilltilstand): number {
  return s.romfart?.investert ?? 0
}

function hendelse(s: Spilltilstand, tekst: string): void {
  s.hendelser.push({ sek: s.sek, tittel: 'Romfart', tekst, alvor: 'info' })
  if (s.hendelser.length > MAKS_HENDELSER) s.hendelser.splice(0, s.hendelser.length - MAKS_HENDELSER)
}

/**
 * Hvert sekund: nettets inntekt (Pakke 119), regnet ut på forhånd så sekundet bare legger
 * den til, og forskning som blir ferdig. Muterer.
 */
export function romfartSekund(s: Spilltilstand): void {
  const r = s.romfart
  if (!r) return
  const nett = r.nettPerSek ?? 0
  if (nett > 0) {
    s.kontanter += nett
    // Nettet tjener som en bedrift: i «tjent», skattet som bedriftsinntekt.
    s.totaltTjent += nett
    r.nettTjent = (r.nettTjent ?? 0) + nett
  }
  const f = r.forskning
  if (!f || s.sek < f.ferdigSek) return
  if (erRakettdel(f.del)) r.deler[f.del] = Math.min(DELTRINN, r.deler[f.del] + 1)
  else r.satdeler = { ...satdeler(r), [f.del]: Math.min(DELTRINN, satdeler(r)[f.del] + 1) }
  delete r.forskning
  hendelse(s, `Forskningen er ferdig: ${delnavn(f.del)} trinn ${trinnFor(r, f.del)}.`)
}

export const baneTekst = (b: Romkontraktbane) => (b === 'geo' ? 'geostasjonær bane' : 'lav bane')

/** Tar et kull satellitter ut av bane før tiden (Pakke 119). Muterer. */
export function taNedKull(r: Romfart, id: number): boolean {
  const før = (r.kull ?? []).length
  r.kull = (r.kull ?? []).filter((k) => k.id !== id)
  r.nettPerSek = nettInntekt(r)
  return r.kull.length < før
}

/** Kullene som har gått ut av drift, ut av lista. Muterer. Gir antallet. */
function utAvDrift(r: Romfart, dag: number): number {
  const ute = (r.kull ?? []).filter((k) => k.sluttDag < dag)
  if (ute.length === 0) return 0
  r.kull = (r.kull ?? []).filter((k) => k.sluttDag >= dag)
  return ute.reduce((sum, k) => sum + k.antall, 0)
}

/**
 * Dagsskiftet for fabrikken: satellittene som har gått ut av drift, tas ut av nettet; så
 * skytes dagens rakett opp — med egne satellitter når du har valgt det, ellers kontrakten
 * du valgte (eller den beste raketten løfter) — og tavla fylles med dagens kontrakter.
 * `hvem` er det avisa kaller deg. Returnerer sakene til avisa. Muterer.
 */
export function romfartVedDagsskifte(s: Spilltilstand, hvem: string): Overskrift[] {
  const r = s.romfart
  if (!r) return []
  const dag = dagnummer(s.sek)
  const saker: Overskrift[] = []
  const ute = utAvDrift(r, dag)
  if (ute > 0) hendelse(s, `${ute} satellitter gikk ut av drift. Dekningen er ${Math.round(dekning(r) * 100)} %.`)
  const antallSat = r.valgtSatellitter ? satellitterPerOppskyting(r) : 0
  const k = antallSat > 0 ? null : valgtKontrakt(r)
  if (antallSat > 0 || k) {
    const t = new Terning(r.frø)
    const ok = t.neste() < sikkerhet(r)
    r.frø = t.fro
    const rakett = rakettpris(r)
    const satellitter = antallSat * SATELLITT_PRIS
    const kostnad = rakett + satellitter
    const honorar = ok && k ? k.honorar : 0
    s.kontanter += honorar - kostnad
    // Fabrikken tjener som en bedrift: netto går i «tjent» og skattes som bedriftsinntekt.
    s.totaltTjent += honorar - kostnad
    r.inntekt += honorar
    r.kostnad += rakett
    if (satellitter > 0) r.satellittkostnad = (r.satellittkostnad ?? 0) + satellitter
    r.antall += 1
    if (ok) r.vellykket += 1
    const o: Oppskyting = k
      ? { dag, kunde: k.kunde, tonn: k.tonn, bane: k.bane, honorar, kostnad, ok }
      : { dag, kunde: EGNE_SATELLITTER, tonn: antallSat * SATELLITT_TONN, bane: 'lav', honorar: 0, kostnad, ok }
    r.oppskytinger.push(o)
    if (r.oppskytinger.length > OPPSKYTINGER_HUSKET) r.oppskytinger.splice(0, r.oppskytinger.length - OPPSKYTINGER_HUSKET)
    const forsteNett = !k && ok && !(r.kull ?? []).length && !r.oppskytinger.slice(0, -1).some((x) => x.ok && x.kunde === EGNE_SATELLITTER)
    if (!k && ok) {
      const nesteId = r.nesteKullId ?? 1
      r.kull = [...(r.kull ?? []), { id: nesteId, antall: antallSat, dekning: satDekning(r), dag, sluttDag: dag + levetid(r) - 1 }]
      r.nesteKullId = nesteId + 1
    }
    if (k) {
      hendelse(s, `${k.kunde}: ${tall(k.tonn, k.tonn % 1 ? 1 : 0)} t i ${baneTekst(k.bane)} — ${ok ? `vellykket, ${kortKroner(honorar - kostnad)} etter raketten` : `raketten gikk tapt, ${kortKroner(-kostnad)}`}.`)
    } else {
      hendelse(s, ok ? `${antallSat} egne satellitter i bane, i drift i ${levetid(r)} dager. Dekningen er ${Math.round(dekning(r) * 100)} %.` : `${antallSat} egne satellitter gikk tapt med raketten, ${kortKroner(-kostnad)}.`)
    }
    if (!ok) {
      const hva = k ? `${k.last[0].toUpperCase()}${k.last.slice(1)}` : `${antallSat} av dine egne satellitter`
      saker.push({ type: 'deg', tittel: `Rakett tapt for ${hvem}`, tekst: `Oppskytingen for ${k ? k.kunde : 'satellittnettet'} endte i en ildkule minutter etter start. ${hva} og ${kortKroner(kostnad)} gikk med.` })
    } else if (r.vellykket === 1 && k) {
      saker.push({ type: 'deg', tittel: `${hvem} er i bane`, tekst: `Den første raketten fra romfartsfabrikken løftet ${k.last} for ${k.kunde}. Honoraret: ${kortKroner(honorar)}.` })
    } else if (forsteNett) {
      saker.push({ type: 'deg', tittel: `${hvem} bygger mobilnett fra verdensrommet`, tekst: `De første ${antallSat} satellittene er i bane. Dekningen er ${Math.round(dekning(r) * 100)} %, og hver ny oppskyting gir mer.` })
    } else if (k && k.bane === 'geo' && !r.oppskytinger.slice(0, -1).some((x) => x.ok && x.bane === 'geo')) {
      saker.push({ type: 'deg', tittel: `Til geostasjonær bane`, tekst: `${hvem} sendte ${k.last} 36 000 kilometer opp for ${k.kunde} — fabrikkens første i den høye banen.` })
    }
  }
  delete r.valgt
  delete r.valgtSatellitter
  r.nettPerSek = nettInntekt(r)
  r.tavle = lagTavle(r, dag)
  r.tavleDag = dag
  return saker
}
