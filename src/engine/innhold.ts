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
    // 4 500 fra Pakke 68: med 3 600 tjente hotellet seg inn på 37 500 s mot naboenes ~30 000, og boten kjøpte det ikke før time 58.
    pris: 135_000_000, grunninntekt: 4_500, oppgraderingspris: 67_500_000, vekst: 1.1, laasesOppVed: 170_000_000,
  },
  bank: {
    id: 'bank', navn: 'Bank',
    pris: 600_000_000, grunninntekt: 20_000, oppgraderingspris: 270_000_000, vekst: 1.1, laasesOppVed: 750_000_000,
  },
  oljeselskap: {
    id: 'oljeselskap', navn: 'Oljeselskap',
    pris: 5_000_000_000, grunninntekt: 170_000, oppgraderingspris: 1_375_000_000, vekst: 1.1, laasesOppVed: 6_300_000_000,
  },
  // Sluttspillet etter milliarden (Pakke 47): hvert trinn er tre–fire ganger det
  // forrige, og hele stigen er nådd før billionen. Kjøpet tjener seg inn på rundt
  // 30 000 sekunder, som banken, og oppgraderingene koster halvparten av det den
  // tidlige stigen ville gitt — ellers blir hvert tiende-steg dobbelt så langt
  // som det forrige. Målt med balansebenken: jevnt rundt 15 timer per tiende-steg.
  rederi: {
    id: 'rederi', navn: 'Rederi',
    pris: 20_000_000_000, grunninntekt: 680_000, oppgraderingspris: 8_000_000_000, vekst: 1.1, laasesOppVed: 25_000_000_000,
  },
  fiskeoppdrett: {
    id: 'fiskeoppdrett', navn: 'Fiskeoppdrett',
    pris: 60_000_000_000, grunninntekt: 2_000_000, oppgraderingspris: 24_000_000_000, vekst: 1.1, laasesOppVed: 75_000_000_000,
  },
  flyselskap: {
    id: 'flyselskap', navn: 'Flyselskap',
    pris: 200_000_000_000, grunninntekt: 6_700_000, oppgraderingspris: 80_000_000_000, vekst: 1.1, laasesOppVed: 250_000_000_000,
  },
  skisenter: {
    id: 'skisenter', navn: 'Skisenter',
    pris: 600_000_000_000, grunninntekt: 20_000_000, oppgraderingspris: 240_000_000_000, vekst: 1.1, laasesOppVed: 750_000_000_000,
  },
}

/** Stigen i rekkefølge. */
export const STIGEN: BedriftstypeId[] = [
  'saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap',
  'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter',
]

/**
 * Nivåene der inntekten gjør et hopp: dobles på 25, 50 og 100, og halvannen
 * gang på 150, 200 og 250 (Pakke 70 — så gamle bedrifter ikke står stille).
 */
export const MILEPAELER = [25, 50, 100, 150, 200, 250]
/** Hva hver milepæl ganger inntekten med, i samme rekkefølge. */
export const MILEPAELFAKTORER = [2, 2, 2, 1.5, 1.5, 1.5]

/**
 * Toppbedriftene, fra hotellet og opp (Pakke 80). De betaler seg tilbake så
 * sakte at nivå 25–50 var en lang ørken: neste nivå ga 5,8 %/t, og filialer,
 * retning og stjerner kom først på 50. Derfor får de en ekstra dobling på 35,
 * og filialer og retning åpner på 25.
 */
export const TOPPBEDRIFTER: ReadonlySet<BedriftstypeId> = new Set(STIGEN.slice(STIGEN.indexOf('hotell')))
/** Den ekstra milepælen for toppbedriftene, og hva den ganger inntekten med. */
export const TOPPMILEPAEL = 35
export const TOPPMILEPAEL_FAKTOR = 2
/** Toppbedriftene kan åpne filialer og velge retning fra dette nivået. */
export const TOPP_FRA_NIVAA = 25

export function erToppbedrift(type: BedriftstypeId): boolean {
  return TOPPBEDRIFTER.has(type)
}

const TOPPMILEPAELER = [...MILEPAELER, TOPPMILEPAEL].sort((a, b) => a - b)

/** Milepælene for en bransje, i stigende rekkefølge: toppbedriftene har én til, på 35. */
export function milepaelerFor(type: BedriftstypeId): readonly number[] {
  return erToppbedrift(type) ? TOPPMILEPAELER : MILEPAELER
}

// ─────────────────────────────────────────────── Unike forbedringer

/** Nivåene forbedringene låses opp på, og hvor mye hver ganger inntekten med. */
const FORBEDRING_NIVAA = [10, 40, 80]
const FORBEDRING_FAKTOR = [1.5, 1.5, 2]
/**
 * En forbedring koster så mange vanlige oppgraderinger på nivået den låses opp (Pakke 100). Før
 * kostet alle tre 30: den første (×1,5 på nivå 10) tjente seg inn seks ganger saktere enn neste
 * nivå og gikk i null først på nivå 22, den andre halvannen gang saktere, mens den tredje (×2 på
 * nivå 80) var 2,7 ganger bedre. Med 10, 24 og 48 tjener de seg inn på 2, 1,2 og 0,6 ganger tiden
 * neste nivå tar der de låses opp (før 6, 1,5 og 0,37) — den første er ikke lenger en felle.
 * Benken: 1 mrd 5 t 07 → 5 t 01, 1 000 mrd 34 t 03 → 32 t 56 (alene).
 */
export const FORBEDRING_PRISFAKTOR = [10, 24, 48] as const

function forbedringer(liste: [string, string][]): Forbedring[] {
  return liste.map(([navn, beskrivelse], i) => ({ navn, beskrivelse, nivaa: FORBEDRING_NIVAA[i], faktor: FORBEDRING_FAKTOR[i], prisfaktor: FORBEDRING_PRISFAKTOR[i] }))
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
/**
 * Du kan låne til gjelden er så stor andel av alt du eier … 0,2 fra Pakke 81: med 0,5
 * nådde en spiller som lånte maks før hvert kjøp milliarden på 3 t 28 og 1 000 mrd på
 * 27 t (uten lån 5 t 07 og 34 t); med 0,2 tar det 4 t 32 og 30 t.
 */
export const MAKS_BELAANING = 0.2
/**
 * Et marginkrav selger til gjelden er nede på så stor andel igjen. Står på 0,5 som
 * før Pakke 81, så ingen lagring får et hardere tvangssalg av at lånegrensen ble lavere.
 */
export const MARGIN_MAAL = 0.5
/**
 * … og aldri mer enn så mange timer av inntekten din (1 fra Pakke 67: med 2
 * lønte det seg alltid å låne til taket). Et lån over taket står; du kan bare
 * ikke låne mer.
 */
export const LAANETAK_TIMER = 1
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
