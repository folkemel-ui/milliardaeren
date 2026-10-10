/**
 * Forklaringene bak «?» på hvert system: hva det er, og hvorfor du vil ha det.
 * Tonen er som i en næringslivsavis — tørr, med et glimt i øyet. Tallene
 * hentes fra motoren, så teksten alltid stemmer med spillet.
 */

import { MEGLERHONORAR, BYEIER_BONUS } from '../engine/eiendom'
import { FOND_GEBYR } from '../engine/fond'
import { FUSJON_FRA_NIVAA, FUSJONSFAKTOR } from '../engine/fusjon'
import { GRADER, RETNING_NIVAA, RETNINGER } from '../engine/ansatte'
import { BINDING_DAGER, FAST_PAASLAG, FASER, NORMAL_STYRINGSRENTE, TREND } from '../engine/verden'
import { OBLIGASJON_GEBYR, OBLIGASJONER } from '../engine/obligasjoner'
import { NYHET_DAGER, NYHET_VIRKNING } from '../engine/bransjer'
import { FORVALTER_ANDEL, LEDIGHET_MAKS, UFLAKS_SJANSE } from '../engine/utleie'
import { ANSATT_BONUS, BEDRIFTSSALG_RABATT, BORTE_TAK_SEK, LAANETAK_TIMER, MAKS_BELAANING, MARGINKRAV, MILEPAELER, MILEPAELFAKTORER } from '../engine/innhold'
import { TOMMER_DAGER } from '../engine/jord'
import { KJOPSSALAER, SALGSSALAER } from '../engine/kunst'
import { RIVAL_KJOPER_VED } from '../engine/landemerker'
import { KURTASJE } from '../engine/marked'
import { BLOKK, BLOKKPREMIE, OPPKJOPSPREMIE } from '../engine/rivaler'
import { REVISJONSSJANSE, SKATTETRINN } from '../engine/skatt'
import { DIN_DEL_AV_RUNDEN, RUNDEANDEL } from '../engine/startups'
import { RUNDER_PER_SESONG, STADIONKRAV, STADIONTRINN } from '../engine/klubb'
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
  | 'obligasjoner'

const trinn = SKATTETRINN.slice(1)

/** «25, 50 og 100». */
const og = (liste: number[]) => liste.join(', ').replace(/, (?=[^,]*$)/, ' og ')

export const FORKLARINGER: Record<Tema, { tittel: string; tekst: string }> = {
  obligasjoner: {
    tittel: 'Statsobligasjoner',
    tekst:
      'En obligasjon er et lån til staten. Kupongen låses til markedsrenten den dagen du kjøper og betales hvert sekund, litt over sparerenten — mer for den lange. ' +
      'Markedsrenten ser fremover: styringsrenten gjelder bare resten av fasen, og etter den ventes snittet over tid. Et faseskifte flytter derfor markedsrenten mindre, jo lengre løpetiden er. ' +
      `Prisen går motsatt vei av markedsrenten: stiger den ett prosentpoeng, faller den korte rundt ${tall(OBLIGASJONER.kort.varighet)} % og den lange rundt ${tall(OBLIGASJONER.lang.varighet)} %. ` +
      `Et salg koster ${pst(OBLIGASJON_GEBYR, 1)}, og kupongene regnes som utbytte i regnskapet.`,
  },
  bedrifter: {
    tittel: 'Bedriftene',
    tekst:
      `Hver oppgradering gir litt mer inntekt; på nivå ${og(MILEPAELER.filter((_, i) => MILEPAELFAKTORER[i] === 2))} dobles den, og på nivå ${og(MILEPAELER.filter((_, i) => MILEPAELFAKTORER[i] !== 2))} ganges den med 1,5. ` +
      `En erfaren ansatt gir ${pst(ANSATT_BONUS)} mer, en junior ${pst(GRADER.junior.bonus)} for halv lønn, og fra nivå ${RETNING_NIVAA} en stjerne ${pst(GRADER.stjerne.bonus)} for tredobbel lønn. ` +
      'Lønnen er fast: i en liten bedrift koster de ansatte mer enn de gir. Stjernene er dyre, men gir mest per plass — de lønner seg når plassene er fulle. ' +
      'Kalenderen betyr noe: restauranter og hoteller tjener mest i helgen, bankene og kafeene på hverdager, saftbodene i sola og skisentrene i snøen. ' +
      `Hver uke kan én bransje være het (+${pst(TREND)}) og én kald (−${pst(TREND)}). Over tid jevner det seg ut — helligdagene er rene bonuser, som 17. mai for pølsebodene. ` +
      `På nivå ${RETNING_NIVAA} velger hver bedrift retning for godt: volum gir ${pst(RETNINGER.volum.inntekt - 1)} mer inntekt, premium ${pst(RETNINGER.premium.verdi - 1)} mer verdi og status. ` +
      'Ansatte og ledere er driftskostnader — de øker ikke det bedriften er verdt. ' +
      `Selger du en bedrift, får du det den er verdt minus ${pst(BEDRIFTSSALG_RABATT)}. ` +
      `Uten leder står bedriften stille når spillet har vært lukket i mer enn ett minutt. Med leder går den videre mens du er borte, i opptil ${tall(BORTE_TAK_SEK / 3600)} timer.`,
  },
  aksjer: {
    tittel: 'Aksjer',
    tekst:
      'En aksje er en bit av et børsnotert selskap. Kursen går opp og ned, og selskapet betaler utbytte hver børsdag — de trygge betaler mest. ' +
      `Hver handel koster ${pst(KURTASJE, 1)} i kurtasje, og store handler flytter kursen. Børsen er stengt i helgene. ` +
      'Én gang i måneden legger hvert selskap frem tall; analytikernes estimat kommer noen dager før. ' +
      `Seks selskaper hører til en bransje du kan eie: ukas trend flytter kursen, og en nyhet om selskapet gir bedriften din i bransjen ${pst(NYHET_VIRKNING)} mer eller mindre i ${NYHET_DAGER} dager.`,
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
      `Du kan låne til gjelden er ${pst(MAKS_BELAANING)} av alt du eier — og aldri mer enn ${LAANETAK_TIMER === 1 ? 'én time' : `${tall(LAANETAK_TIMER)} timer`} av inntekten din. ` +
      'Renten trekkes hvert sekund og er høy nok til at et lån bare lønner seg for de beste kjøpene. Jo høyere status, jo lavere rente. ' +
      `Den flytende renten følger styringsrenten: ${FASER.lav.styringsrente} % i lavkonjunktur, ${NORMAL_STYRINGSRENTE} % i normale tider og ${FASER.hoy.styringsrente} % i høykonjunktur. ` +
      `Du kan binde den i ${BINDING_DAGER} dager for ${tall(FAST_PAASLAG, 1)} prosentpoeng ekstra. Sparerenten følger styringsrenten den også. ` +
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
      `ganger inntekten med ${tall(FUSJONSFAKTOR, 1)}. Din bedrift må ha nådd nivå ${FUSJON_FRA_NIVAA}, og en fusjon koster minst det den er verdt — et oppkjøp minst det fusjonene det gir, ville kostet.`,
  },
  startups: {
    tittel: 'Startups',
    tekst:
      `Oppstartsselskaper henter penger i runder, fra pre-seed til serie C. Hver runde varer én spilldag, og du kan ta opptil ${pst(DIN_DEL_AV_RUNDEN)} av den. ` +
      `Ved dagsskiftet går selskapet videre, går konkurs eller blir kjøpt opp, og nye penger i hver runde gjør andelen du hadde fra før, ${pst(RUNDEANDEL)} mindre — det du satte inn i selve runden, vannes ikke ut. ` +
      'Etter serie C børsnoteres det, og du får betalt. Teamet er det som teller: et sterkt team lønner seg i snitt, et svakt taper — men inntrykket lyver av og til.',
  },
  eiendom: {
    tittel: 'Eiendom',
    tekst:
      'Eiendom gir leie hvert sekund, også mens du er borte — den trenger ingen leder. Prisene følger landet og byens region, så samme bygg kan stige i én by og falle i en annen. ' +
      `Eier du alle enhetene i en by, får du en krone på kartet og +${pst(BYEIER_BONUS)} leie der. ` +
      'Ferieboligene i Marbella og Zermatt har sesong: Spania gir mest om sommeren, Alpene om vinteren, og over et år blir det det samme som en vanlig eiendom. ' +
      'Været betyr noe for hyttene (snø), Lofoten (sol), Zermatt (snø i Alpene) og Marbella (sol i Syden) — i snitt jevner det seg ut. ' +
      `Noe står alltid tomt: opptil ${pst(LEDIGHET_MAKS)} av leien i en by, ny hver uke, og hver mandag kan en dårlig leietaker koste en dags leie (${pst(UFLAKS_SJANSE)} sjanse). ` +
      `En forvalter i byen holder det nede — forsiktig, pågående eller lokalkjent — og koster ${pst(FORVALTER_ANDEL)} av det du eier der, én gang. ` +
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
      'Hvert maleri har en verdi som følger kunstnerens trend, og prisen svinger rundt den og trekkes tilbake mot den. Av og til åpner en utstilling, og alt kunstneren har laget, stiger — men løftet ebber ut. ' +
      `Auksjonshuset tar ${pst(KJOPSSALAER)} når du kjøper og ${pst(SALGSSALAER)} når du selger. ` +
      'Et maleri gir status — dobbelt så mye på museum, men da kan det ikke selges, og det tar en dag å hente det hjem.',
  },
  klubb: {
    tittel: 'Fotballklubben',
    tekst:
      `Klubben starter i 4. divisjon og spiller én kamp hver spilldag. En sesong er ${RUNDER_PER_SESONG} runder; de to beste rykker opp og de to dårligste ned. ` +
      'Hver spiller har en posisjon, et angrep og et forsvar. Du velger formasjon; den beste som er igjen tar hver plass, og utenfor sin posisjon teller en spiller 70 % — en utespiller i mål 40 %. ' +
      'Lagets angrep gir målene du scorer, forsvaret målene du slipper inn. Forsvar er best når motstanderen er klart sterkere, Balansert i en jevn kamp, Angrep når du er klart sterkere. ' +
      'Akademiet sender juniorer på 16–17 år opp hver sesong; de vokser raskt til de er 23, mot et tak du bare ser et spenn av. ' +
      'Hver kamp får en rapport: hvert mål et minutt og en scorer, hver av de elleve en vurdering fra 4 til 10, og en banens beste. Målene og vurderingene samles for sesongen, og ved sesongslutt kåres toppscoreren og årets spiller. ' +
      'Cupen spilles ved siden av serien, alle femti lagene, på faste dager i sesongen; de fjorten beste står over første runde, og uavgjort avgjøres på straffer. Seriegull i Eliteserien gir plass i Europa neste sesong: åtte lag, tre runder. ' +
      'TV-pengene kommer med sponsoren ved sesongstart, premier etter plassering og for hver runde du vinner i cupene. ' +
      'Spillerne koster lønn hver dag, og opprykk og trofeer gir status. ' +
      `Billettene gir publikum ganger billettpris, men stadion tar ikke flere enn det har plass til — fra ${tall(STADIONTRINN[0].plasser)} til ${tall(STADIONTRINN[STADIONTRINN.length - 1].plasser)} plasser. ` +
      `For å rykke opp må stadion holde kravet i divisjonen over: ${tall(STADIONTRINN[STADIONKRAV[4].trinn].plasser)} plasser og flomlys i Eliteserien. Det du bygger, teller i klubbverdien. ` +
      'Lagene går igjen fra sesong til sesong: alle fem divisjonene spiller, og de som rykker opp eller ned, møter du igjen.',
  },
}
