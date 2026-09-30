/** Spillets innhold: tall som beskriver verden, ikke tilstand. */

import type { Bedriftstype, BedriftstypeId, Forbedring } from './types'

export const STARTKAPITAL = 1_000

/** Målet: fra nesten ingenting til en milliard. */
export const MAAL = 1_000_000_000

/**
 * Bransjestigen. Starten går fort — trinn på fem–seks ganger prisen — så
 * rundt femten ganger gjennom midten, og tettere mot milliarden. Hvert trinn
 * tar lenger tid å tjene inn igjen, så tempoet roer seg jo rikere du blir.
 * Oljeselskapet ligger bak milliarden — det er for dem som vil videre.
 *
 * Reglene, så nye bransjer passer inn:
 * - Låses opp når formuen har vært LAAS_OPP_VED × prisen (avrundet pent).
 * - Første oppgradering koster 25 % av prisen fra kiosken til hotellet, og
 *   så en jevnt stigende andel: 40 % for banken og opp til 80 % på toppen.
 */
export const BEDRIFTSTYPER: Record<BedriftstypeId, Bedriftstype> = {
  saftbod: {
    id: 'saftbod', navn: 'Saftbod',
    pris: 250, grunninntekt: 1, oppgraderingspris: 100, vekst: 1.1, laasesOppVed: 0,
  },
  polsebod: {
    id: 'polsebod', navn: 'Pølsebod',
    pris: 1_200, grunninntekt: 2.5, oppgraderingspris: 600, vekst: 1.1, laasesOppVed: 1_500,
  },
  gatekjokken: {
    id: 'gatekjokken', navn: 'Gatekjøkken',
    pris: 7_000, grunninntekt: 4.5, oppgraderingspris: 1_750, vekst: 1.1, laasesOppVed: 9_000,
  },
  kiosk: {
    id: 'kiosk', navn: 'Kiosk',
    pris: 40_000, grunninntekt: 16, oppgraderingspris: 10_000, vekst: 1.1, laasesOppVed: 50_000,
  },
  kafe: {
    id: 'kafe', navn: 'Kafé',
    pris: 600_000, grunninntekt: 100, oppgraderingspris: 150_000, vekst: 1.1, laasesOppVed: 750_000,
  },
  restaurant: {
    id: 'restaurant', navn: 'Restaurant',
    pris: 9_000_000, grunninntekt: 600, oppgraderingspris: 2_250_000, vekst: 1.1, laasesOppVed: 11_000_000,
  },
  hotell: {
    id: 'hotell', navn: 'Hotell',
    pris: 135_000_000, grunninntekt: 3_600, oppgraderingspris: 33_750_000, vekst: 1.1, laasesOppVed: 170_000_000,
  },
  bank: {
    id: 'bank', navn: 'Bank',
    pris: 600_000_000, grunninntekt: 20_000, oppgraderingspris: 240_000_000, vekst: 1.1, laasesOppVed: 750_000_000,
  },
  oljeselskap: {
    id: 'oljeselskap', navn: 'Oljeselskap',
    pris: 5_000_000_000, grunninntekt: 100_000, oppgraderingspris: 2_750_000_000, vekst: 1.1, laasesOppVed: 6_300_000_000,
  },
  // Sluttspillet etter milliarden: hvert trinn er rundt fire–fem ganger det forrige.
  rederi: {
    id: 'rederi', navn: 'Rederi',
    pris: 25_000_000_000, grunninntekt: 400_000, oppgraderingspris: 16_250_000_000, vekst: 1.1, laasesOppVed: 31_000_000_000,
  },
  fiskeoppdrett: {
    id: 'fiskeoppdrett', navn: 'Fiskeoppdrett',
    pris: 100_000_000_000, grunninntekt: 1_400_000, oppgraderingspris: 70_000_000_000, vekst: 1.1, laasesOppVed: 125_000_000_000,
  },
  flyselskap: {
    id: 'flyselskap', navn: 'Flyselskap',
    pris: 400_000_000_000, grunninntekt: 5_000_000, oppgraderingspris: 300_000_000_000, vekst: 1.1, laasesOppVed: 500_000_000_000,
  },
  skisenter: {
    id: 'skisenter', navn: 'Skisenter',
    pris: 1_500_000_000_000, grunninntekt: 17_000_000, oppgraderingspris: 1_200_000_000_000, vekst: 1.1, laasesOppVed: 1_900_000_000_000,
  },
}

/** Stigen i rekkefølge. */
export const STIGEN: BedriftstypeId[] = [
  'saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap',
  'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter',
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
  gatekjokken: forbedringer([
    ['Ny frityrgryte', 'Sprøere pommes frites, dobbelt så fort.'],
    ['Hjemmelaget burgerdressing', 'Oppskriften står bare i kokkens hode.'],
    ['Drive-in-luke', 'Bilistene handler uten å gå ut av bilen.'],
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
    ['Vinkjeller', 'Vinlista er lengre enn menyen.'],
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
  rederi: forbedringer([
    ['LNG-skip', 'Nye skip på flytende gass — billigere drivstoff, strengere krav oppfylt.'],
    ['Egen containerhavn', 'Ingen venter på kaiplass lenger.'],
    ['Flåte med vindseil', 'Skipene seiler på vinden over Atlanteren.'],
  ]),
  fiskeoppdrett: forbedringer([
    ['Lukkede merder', 'Ingen lakselus, ingen rømming, fornøyde myndigheter.'],
    ['Havmerd på dypt vann', 'Plass til millioner av fisk langt til havs.'],
    ['Eget slakteri og eksport', 'Fra merd til sushibar i Tokyo på to døgn.'],
  ]),
  flyselskap: forbedringer([
    ['Nye langdistansefly', 'Mindre drivstoff per passasjer, flere ruter.'],
    ['Lounge på Gardermoen', 'Forretningsreisende betaler godt for roen.'],
    ['Direkteruter til Asia', 'Seter solgt ut måneder i forveien.'],
  ]),
  skisenter: forbedringer([
    ['Ny gondolbane', 'Fra dalen til toppen på seks minutter.'],
    ['Snøkanoner', 'Sesongen starter i oktober, uansett vær.'],
    ['Vinter-OL-arena', 'Verden ser på — og bestiller hytte.'],
  ]),
}

// ─────────────────────────────────────────────── Ansatte og ledere

/** Hver ansatt øker inntekten med så stor andel av bedriftens basisinntekt … */
export const ANSATT_BONUS = 0.1
/**
 * … og koster en fast lønn per sekund: så mange ganger bransjens grunninntekt.
 * Lønnen vokser ikke med nivået, så en ansatt taper penger i en liten bedrift
 * og lønner seg først rundt nivå 20.
 */
export const LONN_PER_ANSATT = 3
/** Plass til én ansatt, pluss én for hvert femte nivå — opp til taket. */
export const ANSATTE_PER_NIVAA = 5
export const MAKS_ANSATTE = 10
/**
 * En ansettelse koster så mange av bedriftens neste oppgradering, og blir
 * dyrere per ansatt. Den egentlige kostnaden er lønnen.
 */
export const ANSETTELSE_FAKTOR = 2
export const ANSETTELSE_VEKST = 1.5

/** En leder koster en engangssum: det dobbelte av typens pris, minst 500 kr. */
export const LEDER_MINSTEPRIS = 500

/** Bedrifter med leder tjener penger mens du er borte — opp til så mange sekunder. */
export const BORTE_TAK_SEK = 2 * 60 * 60

// ─────────────────────────────────────────────── Banken

/**
 * Rente på lån, per time spilltid. Trekkes hvert sekund. Høy nok til at et lån
 * bare lønner seg for de beste kjøpene — ikke for alt.
 */
export const RENTE_PER_TIME = 0.08
/** Du kan låne til gjelden er så stor andel av alt du eier … */
export const MAKS_BELAANING = 0.5
/** … og aldri mer enn så mange timer av inntekten din. */
export const LAANETAK_TIMER = 2
/** Over denne andelen selger banken investeringene dine … */
export const MARGINKRAV = 0.75
/** … og tar over bedrifter til 50 % av det du investerte, hvis det ikke holder. */
export const TVANGSSALG_ANDEL = 0.5

/** Selger du en bedrift selv, får du det som er investert i den, minus så stor andel. */
export const BEDRIFTSSALG_RABATT = 0.3

/** Sparekontoen: lav, risikofri rente per time, lagt til hvert sekund. Lavere enn lånerenten, så lån-for-å-spare taper alltid. */
export const SPARERENTE_PER_TIME = 0.01

/** Så mange hendelser huskes. */
export const MAKS_HENDELSER = 30
