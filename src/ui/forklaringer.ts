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
import { BYTTE_ANDEL, FORVALTER_ANDEL, LEDIGHET_MAKS, UFLAKS_SJANSE } from '../engine/utleie'
import { ANSATT_BONUS, BEDRIFTSSALG_RABATT, BORTE_TAK_SEK, LAANETAK_TIMER, MAKS_BELAANING, MARGIN_MAAL, MARGINKRAV, MILEPAELER, MILEPAELFAKTORER, TOPP_FRA_NIVAA, TOPPMILEPAEL, TOPPMILEPAEL_FAKTOR } from '../engine/innhold'
import { GARDSTRINN, JORDPRIS_VEKST, KORNSVINN, LAAVE_UKER, MAKS_JORDER, PRIS_MIN, PRIS_SPENN, SILO_UKER, START_JORDER, TOMMER_DAGER } from '../engine/jord'
import { DYR_PER_UKE, FJOSPLASSER, SLAKT_DAGER, TILSKUDD_DYR, TILSKUDD_JORD } from '../engine/dyr'
import { KJOPSSALAER, SALGSSALAER } from '../engine/kunst'
import { RIVAL_KJOPER_VED } from '../engine/landemerker'
import { KURTASJE } from '../engine/marked'
import { BLOKK, BLOKKPREMIE, OPPKJOPSPREMIE } from '../engine/rivaler'
import { REVISJONSSJANSE, SKATTETRINN } from '../engine/skatt'
import { DIN_DEL_AV_RUNDEN, RUNDEANDEL } from '../engine/startups'
import { CUP_PREMIE, CUP_RUNDEPREMIE, EUROPA_PREMIER, KLUBBSALG_HONORAR, RUNDER_PER_SESONG, STADIONKRAV, STADIONTRINN } from '../engine/klubb'
import { kortKroner, tall } from './format'
import { AUKSJON_DAGER, BUDSTIGNING, PASSER_ANDEL, TILBAKE_DAGER, TILBAKE_PREMIE } from '../engine/auksjon'
import { CHARTER_I_SESONG, CHARTER_UTENFOR } from '../engine/charter'
import { UNIK_RESTVERDI } from '../engine/unike'
import { DAGER_MELLOM, DELTRINN_PRIS, LOP_PER_SESONG, MESTERPREMIE, PREMIE_PER_POENG, RACING_TROFE_STATUS, SALG_ANDEL, STRATEGIER, TEAMPRIS } from '../engine/racing'

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
  | 'auksjon'
  | 'racing'

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
      `Fra hotellet og opp ${TOPPMILEPAEL_FAKTOR === 2 ? 'dobles' : 'øker'} den også på nivå ${TOPPMILEPAEL}, og filialer og retning kommer alt på nivå ${TOPP_FRA_NIVAA}. ` +
      `En erfaren ansatt gir ${pst(ANSATT_BONUS)} mer, en junior ${pst(GRADER.junior.bonus)} for halv lønn, og fra nivå ${RETNING_NIVAA} en stjerne ${pst(GRADER.stjerne.bonus)} for tredobbel lønn. ` +
      'Lønnen er fast: i en liten bedrift koster de ansatte mer enn de gir, og da står ansettelsen i rødt. ' +
      `En stjerne gir mest per plass, men en erfaren gir mer per krone: stjernen koster ${tall(GRADER.stjerne.pris)} ganger så mye for ${tall(GRADER.stjerne.bonus / ANSATT_BONUS, 1)} ganger så mye. Den er for den som vil ha mest ut av hver plass — kortet sier når en erfaren er det bedre kjøpet. ` +
      'Forbedringene og oppgraderingene sier hvor fort de tjener seg inn, som ansettelsene. ' +
      'Kalenderen betyr noe: restauranter og hoteller tjener mest i helgen, bankene og kafeene på hverdager, saftbodene i sola og skisentrene i snøen. ' +
      `Hver uke kan én bransje være het (+${pst(TREND)}) og én kald (−${pst(TREND)}). Over tid jevner det seg ut — helligdagene er rene bonuser, som 17. mai for pølsebodene. ` +
      `På nivå ${RETNING_NIVAA} (${TOPP_FRA_NIVAA} fra hotellet og opp) velger hver bedrift retning for godt: volum gir ${pst(RETNINGER.volum.inntekt - 1)} mer inntekt; premium ${pst(RETNINGER.premium.inntekt - 1)} mer, ingen dårlige dager og ${pst(RETNINGER.premium.verdi - 1)} mer verdi og status — best der dagene svinger mest. ` +
      'Ansatte og ledere er driftskostnader — de øker ikke det bedriften er verdt. ' +
      `Selger du en bedrift, får du det den er verdt minus ${pst(BEDRIFTSSALG_RABATT)}. ` +
      `Uten leder står bedriften stille når spillet har vært lukket i mer enn ett minutt. Med leder går den videre mens du er borte, i opptil ${tall(BORTE_TAK_SEK / 3600)} timer.`,
  },
  aksjer: {
    tittel: 'Aksjer',
    tekst:
      'En aksje er en bit av et børsnotert selskap. Kursen går opp og ned, og selskapet betaler utbytte hver børsdag — de trygge betaler mest. ' +
      `Hver handel koster ${pst(KURTASJE, 1)} i kurtasje, og store handler flytter kursen. Børsen er stengt i helgene. ` +
      'Én gang i måneden legger hvert selskap frem tall; analytikernes estimat kommer noen dager før. Det er et hint, ikke et løfte: et sterkt estimat slår til litt oftere enn det skuffer, et svakt omvendt. ' +
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
      `til du er nede på ${pst(MARGIN_MAAL)} igjen, og holder ikke det, tar den bedrifter.`,
  },
  skatt: {
    tittel: 'Skatt og offshore',
    tekst:
      `Hver måned kommer en regning på månedens overskudd — inntektene, klubbens resultat og gevinsten på det du har solgt, minus tap og lånerenter — med trinnskatt: ${trinn.map((t) => `${pst(t.sats)} over ${kortKroner(t.fra)}`).join(', ').replace(/, (?=[^,]*$)/, ' og ')}. ` +
      `Du har en uke på å betale — etter det kommer gebyr på det som ikke er betalt, og skatten kreves inn. Mangler du kontanter, kan du betale det du har; skattekortet, Bank og Oversikt viser hva måneden har gitt i skatt så langt. ` +
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
      'Etter serie C børsnoteres det, og du får betalt. Teamet er det som teller: et sterkt team lønner seg i snitt, et svakt taper — men inntrykket lyver ofte ved start, og blir skarpere for hver runde. En gransking viser det sanne teamet.',
  },
  eiendom: {
    tittel: 'Eiendom',
    tekst:
      'Eiendom gir leie hvert sekund, også mens du er borte — den trenger ingen leder. Prisene følger landet og byens region, så samme bygg kan stige i én by og falle i en annen. ' +
      `Eier du alle enhetene i en by, får du en krone på kartet og +${pst(BYEIER_BONUS)} leie der. ` +
      'Ferieboligene i Marbella og Zermatt har sesong: Spania gir mest om sommeren, Alpene om vinteren, og over et år blir det det samme som en vanlig eiendom. ' +
      'Været betyr noe for hyttene (snø), Lofoten (sol), Zermatt (snø i Alpene) og Marbella (sol i Syden) — i snitt jevner det seg ut. ' +
      `Noe står alltid tomt: opptil ${pst(LEDIGHET_MAKS)} av leien i en by, ny hver uke — dobbelt så mye i lavkonjunktur — og hver mandag kan en dårlig leietaker koste en ukes leie (${pst(UFLAKS_SJANSE)} sjanse). ` +
      `En forvalter i byen holder det nede og koster ${pst(FORVALTER_ANDEL)} av det du eier der, én gang. Hver er best i sin fase: forsiktig i lavkonjunktur, lokalkjent i normale tider, pågående i høykonjunktur — og et bytte koster bare ${pst(BYTTE_ANDEL)}. ` +
      'Oppussing gir mer leie for godt, men så lenge håndverkerne holder på, kommer det ingen leie. ' +
      `Selger du, tar megleren ${pst(MEGLERHONORAR)}. Noen eiendommer krever status eller et fly for å komme dit.`,
  },
  jord: {
    tittel: 'Jord og skog',
    tekst:
      'Jord stiger sakte i verdi. En gård gir avling hver mandag morgen, stor eller liten etter ukas vær. ' +
      `En skog gir ingenting mens den vokser, men tømmeret blir verdt mer for hver dag — raskest de første ${TOMMER_DAGER} dagene. ` +
      'Du bestemmer selv når du hogger; da får du betalt, og ny skog plantes. ' +
      `En gård starter med ${START_JORDER} jorder og kan dyrke opptil ${MAKS_JORDER}: den fjerde koster halve jordverdien, hver neste ${tall(JORDPRIS_VEKST, 1)} ganger så mye, og hver jord gir like mye avling. ` +
      'En traktor gir +10 % avling, en skurtresker +15 %, og en sprøyte gjør at en dårlig uke faller 30 % mindre — hver kjøpt én gang, priset etter gårdens verdi. ' +
      `Med ${GARDSTRINN[1].fra} jorder blir småbruket en gård, med ${GARDSTRINN[2].fra} en storgård og med ${GARDSTRINN[3].fra} et gods: +${GARDSTRINN[1].status}, +${GARDSTRINN[2].status} og +${GARDSTRINN[3].status} status. ` +
      'Jordene, maskinene og byggene teller i gårdens verdi til det de kostet, og følger med når du selger. ' +
      `Korn, grønnsaker og frukt har hver sin pris, ny hver mandag, fra ×${tall(PRIS_MIN, 2)} til ×${tall(PRIS_MIN + PRIS_SPENN, 2)} — i snitt 1; avlingen betales til prisen den uka den vokste. ` +
      'Drenering gjør at regndager teller som overskyet, og frostdekke at snødager teller som regn. Drivhuset er en ellevte jord under glass som alltid gir ×0,9 av en vanlig uke, uansett vær. ' +
      `En silo lagrer ukas korn i stedet for å selge det mandag — ${SILO_UKER} uker, ${LAAVE_UKER} med låve — og du selger når prisen er god. Kornet taper ${tall(KORNSVINN * 100)} % i uka. ` +
      `I et fjøs er det plass til ${FJOSPLASSER.join(', ').replace(/, (?=[^,]*$)/, ' og ')} dyr etter gårdens trinn. Hvert dyr gir rundt ${pst(DYR_PER_UKE)} av prisen i uka: kua og hønene hver dag, sauene ved klippingen 1. mai og 1. september, grisene ved slakt hver ${SLAKT_DAGER / 7}. uke — opptjent fra dagen du kjøpte dem. ` +
      `Ved hvert månedsskifte kommer produksjonstilskudd: ${pst(TILSKUDD_JORD, 1)} av jordverdien per jord og ${pst(TILSKUDD_DYR)} av prisen per dyr. Gårdens side viser regnskapet de siste åtte ukene.`,
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
  auksjon: {
    tittel: 'Auksjoner og utleie',
    tekst:
      `Omtrent én gang i timen byr auksjonshuset fram én unik ting — det finnes bare én av hver. Det som bys fram, koster høyst ${pst(PASSER_ANDEL)} av formuen din. ` +
      `Det kan bys i ${AUKSJON_DAGER} dager, og budet stiger ${pst(BUDSTIGNING)} for hver dag: den som kommer først, betaler minst. ` +
      'Kjøper du den ikke, går den til en rival som har råd, og avisa skriver om det. ' +
      `Den kan komme tilbake, men tidligst om ${TILBAKE_DAGER / 12} timer og ${tall(TILBAKE_PREMIE, 1)} gang så dyr. ` +
      `En unik ting tar en plass som resten av samlingen, gir status og holder seg: den teller og selges for ${pst(UNIK_RESTVERDI)} av det du betalte. ` +
      `Yachtene og jetene kan leies ut de ukene du ikke bruker dem: ${pst(CHARTER_I_SESONG)} av nyprisen i timen i sesongen — yachtene mai–september, jetene november–mars — og ${pst(CHARTER_UTENFOR)} utenfor. ` +
      'De gir statusen som før mens de er ute, men kan ikke selges før de er hjemme, og det tar til neste dag.',
  },
  racing: {
    tittel: 'Racingteamet',
    tekst:
      `Med Formel 1-bilen kan du starte et team for ${kortKroner(TEAMPRIS)}. En sesong er ${LOP_PER_SESONG} løp, ett hver ${DAGER_MELLOM}. spilldag, mot ni team med to førere hver; løpet avgjøres ved dagsskiftet. ` +
      `Farten kommer fra bilen og førerne, og litt flaks. Bilen har fire deler i fem trinn, fra ${kortKroner(DELTRINN_PRIS[0])} til ${kortKroner(DELTRINN_PRIS[DELTRINN_PRIS.length - 1])}; førerne ansetter du fra markedet, som fornyes hver sesong, og de koster lønn hver dag. ` +
      `Strategien gjelder begge førerne: ${STRATEGIER.forsiktig.navn.toLowerCase()} kommer nesten alltid i mål, ${STRATEGIER.aggressiv.navn.toLowerCase()} er raskere, men kjører av omtrent én gang av åtte — best når du jager, verre når du leder. ` +
      `De ti første får poeng (25, 18, 15 … 1), og teamet får ${kortKroner(PREMIE_PER_POENG)} per poeng. Førermesterskapet og konstruktørmesterskapet gir hvert et trofé med ${RACING_TROFE_STATUS} i status og ${kortKroner(MESTERPREMIE)}. ` +
      `Teamet teller i formuen med det delene har kostet; selger du, får du ${pst(SALG_ANDEL)} av det, og bilen og trofeene beholder du.`,
  },
  klubb: {
    tittel: 'Fotballklubben',
    tekst:
      `Klubben starter i 4. divisjon og spiller én kamp hver spilldag. En sesong er ${RUNDER_PER_SESONG} runder; de to beste rykker opp og de to dårligste ned. ` +
      'Hver spiller har en posisjon, et angrep og et forsvar. Du velger formasjon; den beste som er igjen tar hver plass, og utenfor sin posisjon teller en spiller 70 % — en utespiller i mål 40 %. ' +
      'Lagets angrep gir målene du scorer, forsvaret målene du slipper inn. Forsvar er best når motstanderen er klart sterkere, Balansert i en jevn kamp, Angrep når du er klart sterkere. ' +
      'Akademiet sender juniorer på 16–17 år opp hver sesong; de vokser raskt til de er 23, mot et tak du bare ser et spenn av. ' +
      'Hver kamp får en rapport: hvert mål et minutt og en scorer, hver av de elleve en vurdering fra 4 til 10, og en banens beste. Målene og vurderingene samles for sesongen, og ved sesongslutt kåres toppscoreren og årets spiller. ' +
      `Cupen spilles ved siden av serien, alle femti lagene, på faste dager i sesongen; de fjorten beste står over første runde, og uavgjort avgjøres på straffer. Hver runde du vinner, gir ${tall(CUP_RUNDEPREMIE * 100)} % av TV-pengene, og cupmesteren får ${kortKroner(CUP_PREMIE)} og et trofé. ` +
      `Seriegull i Eliteserien gir plass i Europa neste sesong: åtte lag, tre runder, ${og(EUROPA_PREMIER.map((p) => p / 1_000_000))} mill for hver runde du vinner, og et trofé som gir mer status enn de andre. ` +
      `Selger du klubben, tar megler og advokater ${tall(KLUBBSALG_HONORAR * 100)} %; trofeene beholder du. ` +
      'TV-pengene kommer med sponsoren ved sesongstart, premier etter plassering og for hver runde du vinner i cupene. ' +
      'Spillerne koster lønn hver dag, og opprykk og trofeer gir status. ' +
      `Billettene gir publikum ganger billettpris, men stadion tar ikke flere enn det har plass til — fra ${tall(STADIONTRINN[0].plasser)} til ${tall(STADIONTRINN[STADIONTRINN.length - 1].plasser)} plasser. ` +
      `For å rykke opp må stadion holde kravet i divisjonen over: ${tall(STADIONTRINN[STADIONKRAV[4].trinn].plasser)} plasser og flomlys i Eliteserien. Det du bygger, teller i klubbverdien. ` +
      'Lagene går igjen fra sesong til sesong: alle fem divisjonene spiller, og de som rykker opp eller ned, møter du igjen.',
  },
}
