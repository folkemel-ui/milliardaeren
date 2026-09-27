/** Spillets innhold: tall som beskriver verden, ikke tilstand. */

import type { Bedriftstype, BedriftstypeId, Forbedring } from './types'

export const STARTKAPITAL = 1_000

/** Målet: fra nesten ingenting til en milliard. */
export const MAAL = 1_000_000_000

/**
 * Bransjestigen. Hvert trinn koster ti ganger det forrige og tar lenger tid å
 * tjene inn igjen, så tempoet roer seg jo rikere du blir. Oljeselskapet ligger
 * bak milliarden — det er for dem som vil videre.
 */
export const BEDRIFTSTYPER: Record<BedriftstypeId, Bedriftstype> = {
  saftbod: {
    id: 'saftbod', navn: 'Saftbod', emoji: '🍋',
    pris: 250, grunninntekt: 1, oppgraderingspris: 100, vekst: 1.1, laasesOppVed: 0,
  },
  polsebod: {
    id: 'polsebod', navn: 'Pølsebod', emoji: '🌭',
    pris: 3_000, grunninntekt: 2.5, oppgraderingspris: 600, vekst: 1.1, laasesOppVed: 4_000,
  },
  kiosk: {
    id: 'kiosk', navn: 'Kiosk', emoji: '🏪',
    pris: 40_000, grunninntekt: 16, oppgraderingspris: 10_000, vekst: 1.1, laasesOppVed: 50_000,
  },
  kafe: {
    id: 'kafe', navn: 'Kafé', emoji: '☕',
    pris: 600_000, grunninntekt: 100, oppgraderingspris: 150_000, vekst: 1.1, laasesOppVed: 750_000,
  },
  restaurant: {
    id: 'restaurant', navn: 'Restaurant', emoji: '🍽️',
    pris: 9_000_000, grunninntekt: 600, oppgraderingspris: 2_250_000, vekst: 1.1, laasesOppVed: 12_000_000,
  },
  hotell: {
    id: 'hotell', navn: 'Hotell', emoji: '🏨',
    pris: 135_000_000, grunninntekt: 3_600, oppgraderingspris: 32_400_000, vekst: 1.1, laasesOppVed: 150_000_000,
  },
  bank: {
    id: 'bank', navn: 'Bank', emoji: '🏦',
    pris: 600_000_000, grunninntekt: 20_000, oppgraderingspris: 450_000_000, vekst: 1.1, laasesOppVed: 700_000_000,
  },
  oljeselskap: {
    id: 'oljeselskap', navn: 'Oljeselskap', emoji: '🛢️',
    pris: 5_000_000_000, grunninntekt: 100_000, oppgraderingspris: 5_000_000_000, vekst: 1.1, laasesOppVed: 2_500_000_000,
  },
}

/** Stigen i rekkefølge. */
export const STIGEN: BedriftstypeId[] = [
  'saftbod', 'polsebod', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap',
]

/** Nivåene der inntekten dobles. */
export const MILEPAELER = [25, 50, 100]

// ─────────────────────────────────────────────── Unike forbedringer

/** Nivåene forbedringene låses opp på, og hvor mye hver ganger inntekten med. */
const FORBEDRING_NIVAA = [10, 40, 80]
const FORBEDRING_FAKTOR = [1.5, 1.5, 2]
/** En forbedring koster så mange vanlige oppgraderinger på nivået den låses opp. */
export const FORBEDRING_PRISFAKTOR = 30

function forbedringer(liste: [string, string][]): Forbedring[] {
  return liste.map(([navn, beskrivelse], i) => ({ navn, beskrivelse, nivaa: FORBEDRING_NIVAA[i], faktor: FORBEDRING_FAKTOR[i] }))
}

/** Tre forbedringer per bransje, i rekkefølge. Hver ganger inntekten. */
export const FORBEDRINGER: Record<BedriftstypeId, Forbedring[]> = {
  saftbod: forbedringer([
    ['Saftpresse', 'Ferskpresset i stedet for fra kartong. Kundene merker forskjellen.'],
    ['Isbitmaskin', 'Iskald saft selv i juli.'],
    ['Egen sukkerfri linje', 'Et helt nytt kundesegment står i kø.'],
  ]),
  polsebod: forbedringer([
    ['Grillplate i stål', 'Dobbelt så mange pølser i timen.'],
    ['Hjemmelaget sennep', 'Oppskriften er hemmelig. Køen er det ikke.'],
    ['Food truck', 'Boden ruller dit folket er.'],
  ]),
  kiosk: forbedringer([
    ['Kaffeautomat', 'Morgenkunder på vei til jobb.'],
    ['Pakkeutlevering', 'Alle som henter pakker, kjøper noe på veien ut.'],
    ['Døgnåpent', 'Nattravnene betaler godt.'],
  ]),
  kafe: forbedringer([
    ['Espressomaskin', 'Italiensk, skinnende og dyr — som kaffen.'],
    ['Eget bakeri', 'Kanelbollene selger seg selv.'],
    ['Takterrasse', 'Utsikten er med i prisen.'],
  ]),
  restaurant: forbedringer([
    ['Kjendiskokk', 'Kokken har vært på TV. Bordene er fullbooket.'],
    ['Vinkjeller', 'Vinlisten er lengre enn menyen.'],
    ['Michelinstjerne', 'Guiden har vært på besøk. Prisene har steget.'],
  ]),
  hotell: forbedringer([
    ['Spa', 'Gjestene blir en natt ekstra.'],
    ['Konferansesenter', 'Næringslivet leier hele etasjer.'],
    ['Takbar', 'Byens mest populære utsikt.'],
  ]),
  bank: forbedringer([
    ['Nettbank', 'Kundene slipper kø — og filialene er billigere å drive.'],
    ['Formuesforvaltning', 'De rikeste kundene betaler for råd.'],
    ['Investeringsbank', 'Børsnoteringer og oppkjøp gir de største honorarene.'],
  ]),
  oljeselskap: forbedringer([
    ['Nye borerigger', 'Mer olje fra de samme feltene.'],
    ['Undervannsroboter', 'Vedlikehold uten å stenge produksjonen.'],
    ['Nytt felt i Nordsjøen', 'Et av de største funnene på tiår.'],
  ]),
}

// ─────────────────────────────────────────────── Ansatte og ledere

/** Hver ansatt øker inntekten med så stor andel av bedriftens basisinntekt … */
export const ANSATT_BONUS = 0.1
/** … og koster så stor andel i lønn, hvert sekund. */
export const ANSATT_LONN = 0.03
/** Plass til én ansatt, pluss én for hvert femte nivå — opp til taket. */
export const ANSATTE_PER_NIVAA = 5
export const MAKS_ANSATTE = 10
/**
 * En ansettelse koster så mange av bedriftens neste oppgradering, og blir
 * dyrere per ansatt. Da lønner ansatte seg først når bedriften er stor.
 */
export const ANSETTELSE_FAKTOR = 2
export const ANSETTELSE_VEKST = 1.5

/** En leder koster en engangssum: det dobbelte av typens pris, minst 500 kr. */
export const LEDER_MINSTEPRIS = 500

/** Bedrifter med leder tjener penger mens du er borte — opp til så mange sekunder. */
export const BORTE_TAK_SEK = 2 * 60 * 60

// ─────────────────────────────────────────────── Banken

/** Rente på lån, per time spilltid. Trekkes hvert sekund. */
export const RENTE_PER_TIME = 0.03
/** Du kan låne til gjelden er så stor andel av alt du eier. */
export const MAKS_BELAANING = 0.5
/** Over denne andelen selger banken investeringene dine … */
export const MARGINKRAV = 0.75
/** … og tar over bedrifter til 50 % av det du investerte, hvis det ikke holder. */
export const TVANGSSALG_ANDEL = 0.5

/** Sparekontoen: lav, risikofri rente per time, lagt til hvert sekund. Lavere enn lånerenten, så lån-for-å-spare taper alltid. */
export const SPARERENTE_PER_TIME = 0.01

/** Så mange hendelser huskes. */
export const MAKS_HENDELSER = 30
