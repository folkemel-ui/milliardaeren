/**
 * Forklaringene bak «?» på hvert system: hva det er, og hvorfor du vil ha det.
 * Tonen er som i en næringslivsavis — tørr, med et glimt i øyet. Tallene
 * hentes fra motoren, så teksten alltid stemmer med spillet.
 */

import { MEGLERHONORAR } from '../engine/eiendom'
import { FOND_GEBYR } from '../engine/fond'
import { FUSJONSFAKTOR } from '../engine/fusjon'
import { ANSATT_BONUS, BEDRIFTSSALG_RABATT, BORTE_TAK_SEK, LAANETAK_TIMER, MAKS_BELAANING, MARGINKRAV, MILEPAELER } from '../engine/innhold'
import { TOMMER_DAGER } from '../engine/jord'
import { KJOPSSALAER, SALGSSALAER } from '../engine/kunst'
import { RIVAL_KJOPER_VED } from '../engine/landemerker'
import { KURTASJE } from '../engine/marked'
import { BLOKK, BLOKKPREMIE, OPPKJOPSPREMIE } from '../engine/rivaler'
import { REVISJONSSJANSE, SKATTETRINN } from '../engine/skatt'
import { DIN_DEL_AV_RUNDEN, RUNDEANDEL } from '../engine/startups'
import { RUNDER_PER_SESONG } from '../engine/klubb'
import { kortKroner, tall } from './format'

const pst = (andel: number, desimaler = 0) => `${tall(andel * 100, desimaler)} %`

export type Tema =
  | 'bedrifter'
  | 'aksjer'
  | 'krypto'
  | 'fond'
  | 'ordre'
  | 'laan'
  | 'skatt'
  | 'rivaler'
  | 'startups'
  | 'eiendom'
  | 'jord'
  | 'landemerker'
  | 'kunst'
  | 'klubb'

const trinn = SKATTETRINN.slice(1)

export const FORKLARINGER: Record<Tema, { tittel: string; tekst: string }> = {
  bedrifter: {
    tittel: 'Bedriftene',
    tekst:
      `Hver oppgradering gir litt mer inntekt, og på nivå ${MILEPAELER.join(', ').replace(/, (?=[^,]*$)/, ' og ')} dobles den. ` +
      `Ansatte gir ${pst(ANSATT_BONUS)} mer hver, men lønnen er fast: i en liten bedrift koster de mer enn de gir, og de lønner seg først rundt nivå 20. ` +
      'Ansatte og ledere er driftskostnader — de øker ikke det bedriften er verdt. ' +
      `Selger du en bedrift, får du det du har investert i den minus ${pst(BEDRIFTSSALG_RABATT)}. ` +
      `Uten leder står bedriften stille når spillet har vært lukket i mer enn ett minutt. Med leder går den videre mens du er borte, i opptil ${tall(BORTE_TAK_SEK / 3600)} timer.`,
  },
  aksjer: {
    tittel: 'Aksjer',
    tekst:
      'En aksje er en bit av et børsnotert selskap. Kursen går opp og ned, og selskapet betaler utbytte hver børsdag — de trygge betaler mest. ' +
      `Hver handel koster ${pst(KURTASJE, 1)} i kurtasje, og store handler flytter kursen. Børsen er stengt i helgene. ` +
      'Én gang i måneden legger hvert selskap frem tall; analytikernes estimat kommer noen dager før.',
  },
  krypto: {
    tittel: 'Krypto',
    tekst:
      'Kryptomynter handles hele døgnet, hele uka, og betaler ikke utbytte. Kursene følger en felles stemning — grådighet eller frykt — ' +
      'og kan hoppe 15–40 % på et blunk. Jo mindre mynten er, jo villere går det. Stabilkronen holder seg rundt 10 kr og er et sted å parkere penger.',
  },
  fond: {
    tittel: 'Indeksfond',
    tekst:
      'Et indeksfond eier litt av alle de eldste aksjene — eller myntene — med lik vekt. Du kjøper for et beløp, ikke et antall, ' +
      `gebyret er bare ${pst(FOND_GEBYR, 1)}, og kjøpet flytter ingen kurser. Fondet svinger mindre enn hver enkelt aksje og gir snittet av utbyttet. ` +
      'Børsfondet handles bare når børsen er åpen.',
  },
  ordre: {
    tittel: 'Automatiske ordrer',
    tekst:
      'En automatisk ordre handler for deg når kursen når en grense — også mens du er borte. «Kjøp på vei ned» kjøper når kursen har falt dit, ' +
      '«Sikre gevinst» selger når den har steget dit, og «Stopp tap» selger før et fall blir for dyrt. ' +
      'Aksjeordre venter til børsen åpner, og en kjøpsordre venter til du har råd.',
  },
  laan: {
    tittel: 'Lån og marginkrav',
    tekst:
      `Du kan låne til gjelden er ${pst(MAKS_BELAANING)} av alt du eier — og aldri mer enn ${tall(LAANETAK_TIMER)} timer av inntekten din. ` +
      'Renten trekkes hvert sekund og er høy nok til at et lån bare lønner seg for de beste kjøpene. Jo høyere status, jo lavere rente. ' +
      `Stiger gjelden til ${pst(MARGINKRAV)} — for eksempel fordi kursene faller — kommer et marginkrav: banken selger av det du eier ` +
      `til du er nede på ${pst(MAKS_BELAANING)} igjen, og holder ikke det, tar den bedrifter.`,
  },
  skatt: {
    tittel: 'Skatt og offshore',
    tekst:
      `Hver måned kommer en regning på månedens overskudd — inntektene, klubbens resultat og gevinsten på det du har solgt, minus tap og lånerenter — med trinnskatt: ${trinn.map((t) => `${pst(t.sats)} over ${kortKroner(t.fra)}`).join(', ').replace(/, (?=[^,]*$)/, ' og ')}. ` +
      `Du har en uke på å betale — etter det kommer gebyr, og skatten kreves inn. ` +
      `Offshore halverer skatten, men hver måned er det ${pst(REVISJONSSJANSE)} sjanse for bokettersyn. Da betales alt som er unndratt tilbake, pluss like mye i tillegg.`,
  },
  rivaler: {
    tittel: 'Rivaler, oppkjøp og fusjoner',
    tekst:
      'Fire rivaler bygger formue på egen hånd, og Forbes-lista viser hvem som leder. Hver eier et holdingselskap du kan kjøpe deg inn i, ' +
      `${pst(BLOKK)} om gangen — og hver blokk koster ${pst(BLOKKPREMIE)} mer enn den forrige. Eierandelene gir utbytte, og fra 50 % kan du ` +
      `kjøpe resten med ${pst(OPPKJOPSPREMIE)} premie. Rivalene eier også bedrifter i dine bransjer: kjøper du en, slås den sammen med din og ` +
      `ganger inntekten med ${tall(FUSJONSFAKTOR, 1)}.`,
  },
  startups: {
    tittel: 'Startups',
    tekst:
      `Oppstartsselskaper henter penger i runder, fra pre-seed til serie C. Hver runde varer én spilldag, og du kan ta opptil ${pst(DIN_DEL_AV_RUNDEN)} av den. ` +
      `Ved dagsskiftet går selskapet videre, går konkurs eller blir kjøpt opp, og nye penger i hver runde gjør andelen du hadde fra før, ${pst(RUNDEANDEL)} mindre — det du satte inn i selve runden, vannes ikke ut. ` +
      'Etter serie C børsnoteres det, og du får betalt. Inntrykket av teamet hjelper, men det lyver av og til.',
  },
  eiendom: {
    tittel: 'Eiendom',
    tekst:
      'Eiendom gir leie hvert sekund, også mens du er borte — den trenger ingen leder. Prisene følger landet og regionen. ' +
      'Oppussing gir mer leie for godt, men så lenge håndverkerne holder på, kommer det ingen leie. ' +
      `Selger du, tar megleren ${pst(MEGLERHONORAR)}. Noen eiendommer krever status eller et fly for å komme dit.`,
  },
  jord: {
    tittel: 'Jord og skog',
    tekst:
      'Jord stiger sakte i verdi. En gård gir avling hver mandag morgen, stor eller liten etter ukas vær. ' +
      `En skog gir ingenting mens den vokser, men tømmeret blir verdt mer for hver dag — raskest de første ${TOMMER_DAGER} dagene. ` +
      'Du bestemmer selv når du hogger; da får du betalt, og ny skog plantes.',
  },
  landemerker: {
    tittel: 'Landemerker',
    tekst:
      'Det finnes bare ett av hvert. De gir mye status og litt leie, og verdien følger eiendomsprisene. ' +
      `En rival med over ${RIVAL_KJOPER_VED} ganger prisen i formue kan kjøpe et landemerke hvilken dag som helst — da må du by over for å få det tilbake.`,
  },
  kunst: {
    tittel: 'Kunst',
    tekst:
      'Maleriene går opp og ned i verdi hver dag, og hver kunstner har sin egen trend. Av og til åpner en utstilling, og alt kunstneren har laget, stiger. ' +
      `Auksjonshuset tar ${pst(KJOPSSALAER)} når du kjøper og ${pst(SALGSSALAER)} når du selger. ` +
      'Et maleri gir status — dobbelt så mye på museum, men da kan det ikke selges, og det tar en dag å hente det hjem.',
  },
  klubb: {
    tittel: 'Fotballklubben',
    tekst:
      `Klubben starter i 4. divisjon og spiller én kamp hver spilldag. En sesong er ${RUNDER_PER_SESONG} runder; de to beste rykker opp og de to dårligste ned. ` +
      'Laget er så sterkt som snittet av de elleve beste spillerne. Angrep gir flere mål begge veier, forsvar færre. ' +
      'Spillerne koster lønn hver dag, og opprykk og trofeer gir status.',
  },
}
