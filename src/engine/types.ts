/**
 * Spilltilstanden. Alt som lagres, bor her — og alt her må kunne gå gjennom
 * JSON uten tap. Endres formen, bumpes SPILLVERSJON og en migrering skrives.
 */

export type BedriftstypeId =
  | 'saftbod'
  | 'polsebod'
  | 'gatekjokken'
  | 'kiosk'
  | 'kafe'
  | 'restaurant'
  | 'hotell'
  | 'bank'
  | 'oljeselskap'
  | 'rederi'
  | 'fiskeoppdrett'
  | 'flyselskap'
  | 'skisenter'

export interface Bedriftstype {
  id: BedriftstypeId
  navn: string
  /** Hva det koster å starte bedriften. Du kan eie én av hver type. */
  pris: number
  /** Inntekt per sekund på nivå 1, uten ansatte. */
  grunninntekt: number
  /** Pris for å gå fra nivå 1 til 2. */
  oppgraderingspris: number
  /** Hvor mye dyrere hvert nivå blir enn det forrige. */
  vekst: number
  /** Høyeste nettoformue du må ha nådd for å kunne kjøpe typen. */
  laasesOppVed: number
}

export interface Bedrift {
  id: string
  type: BedriftstypeId
  nivaa: number
  /** Spillsekundet bedriften ble startet eller kjøpt. */
  startetSek: number
  ansatte: number
  /** En leder holder bedriften i gang mens du er borte. */
  leder: boolean
  /** Alt du har brukt på bedriften: kjøp, nivåer, ansettelser og leder. Er bedriftens bokførte verdi. */
  investert: number
  /** Alt bedriften har tjent (etter lønn og statusbonus). */
  tjent: number
  /** Inntekt per sekund, målt hvert minutt — de siste to timene. */
  inntektHistorikk: number[]
  /** Hvor mange av bransjens unike forbedringer som er kjøpt (de kjøpes i rekkefølge). */
  forbedringer: number
  /** Hvor mange rivalbedrifter som er slått sammen med denne. Hver ganger inntekten. */
  fusjoner: number
  /**
   * De ansatte, med navn og nivå (Pakke 48). Like mange som `ansatte`. Mangler
   * i eldre lagringer — da er alle erfarne, med navn regnet ut fra bedriften.
   */
  stab?: Ansatt[]
  /** Retningen bedriften tok på nivå 50 (Pakke 48). Valget er for godt. */
  retning?: Retning
  /** Filialene (Pakke 59), i den rekkefølgen de ble åpnet. Mangler i eldre lagringer. */
  filialer?: { by: NorskBy; aapnetSek: number }[]
}

export type Ansattgrad = 'junior' | 'erfaren' | 'stjerne'

export interface Ansatt {
  navn: string
  grad: Ansattgrad
}

export type Retning = 'volum' | 'premium'

export interface Forbedring {
  navn: string
  beskrivelse: string
  /** Nivået bedriften må ha nådd. */
  nivaa: number
  /** Inntekten ganges med dette. */
  faktor: number
}

// ─────────────────────────────────────────────── Markedet

export type PapirId =
  | 'NFS' | 'FJK' | 'VTK' | 'BSH' | 'POL' | 'NLT' | 'AUB' | 'TRS'
  | 'BMT' | 'FJD' | 'NSL' | 'TRM' | 'VKT' | 'LKS'
  // Børsnotert i versjon 17 (se NYE_PAPIRER i marked.ts).
  | 'NRB' | 'KRV' | 'FJF' | 'ROM'
  | 'STK' | 'ELG' | 'BRN'

export type Risiko = 'lav' | 'middels' | 'høy'

/** En aksje eller en kryptomynt. Rater er per time spilltid. */
export interface Papir {
  id: PapirId
  navn: string
  klasse: 'aksje' | 'krypto'
  risiko: Risiko
  /** Bransjen selskapet hører til (Pakke 53): ukas trend flytter kursen, og nyhetene treffer bedriftene dine i bransjen. */
  bransje?: BedriftstypeId
  startkurs: number
  /** Hvor fort den «riktige verdien» vokser. */
  drift: number
  /** Hvor mye kursen svinger rundt den. */
  volatilitet: number
  /** Hvor fort avviket trekkes tilbake mot riktig verdi. */
  reversjon: number
  /** Andel av kursen som betales i utbytte hver utbetaling. */
  utbytte: number
  /** Kroner som skal til for å flytte kursen ~100 % (logaritmisk). */
  dybde: number
  /** Sjanse per markedstikk for et plutselig hopp. */
  hopp: number
  /** Hvor mye kryptostemningen drar i kursen (1 om ikke satt). 0 for en stabil mynt. */
  stemning?: number
}

export interface Kurs {
  kurs: number
  fundament: number
  /** Logaritmisk avvik fra fundamentet: kurs = fundament · e^(avvik + trykk). */
  avvik: number
  /**
   * Ditt eget kurstrykk, logaritmisk (Pakke 56): trekkes tilbake som avviket,
   * men holdes for seg så fondene kan se bort fra det. Mangler i gamle lagringer,
   * der trykket står i avviket.
   */
  trykk?: number
  /** Kursen hvert 30. sekund, de siste to timene. */
  historikk: number[]
  /** En selskapsnyhet som ennå ikke er ferdig priset inn: logaritmisk bevegelse igjen, fordelt på tikk. */
  nyhet?: { igjen: number; tikk: number }
  /** Høyeste og laveste kurs siden spillet (eller målingen) startet. */
  topp?: number
  bunn?: number
  /** Sluttkursen hver spilldag, de siste DAGSLUTT_MAKS dagene. */
  dagslutt?: number[]
}

export interface Marked {
  tikk: number
  /** Kryptostemningen, fra −1 (frykt) til 1 (grådighet). */
  stemning: number
  kurser: Record<PapirId, Kurs>
  /** Eiendomsindeksen: starter på 1, og alle eiendomsverdier og leier ganges med den. */
  eiendom: Kurs
  /** Regionenes avvik fra landsindeksen (se regioner.ts). Trekkes fra en hash av frøet, ikke terningen. */
  regioner: { frø: number; indekser: Record<Region, Regionindeks> }
  /** Frøet til papirene som kom i versjon 17. De trekker fra en hash av det, ikke fra terningen. */
  nyeFrø?: number
}

export type Region = 'oslo' | 'bergen' | 'stavanger' | 'fjellet' | 'trondelag' | 'nord'

export interface Regionindeks {
  /** Logaritmisk avvik fra landsindeksen nå: regionens pris = landets · e^avvik. */
  avvik: number
  /** Avviket hver gang landsindeksen fikk et historikkpunkt, i samme takt. */
  historikk: number[]
}

export interface Beholdning {
  antall: number
  /** Samlet kostpris, inkludert kurtasje. Gir snittpris og gevinst. */
  kostpris: number
}

// ─────────────────────────────────────────────── Eiendom og luksus

export type EiendomId =
  | 'hybel' | 'leilighet' | 'rekkehus' | 'hytte'
  // Pakke 44: de samme byggene i flere byer.
  | 'hybel-trondheim' | 'hybel-oslo' | 'leilighet-bergen' | 'leilighet-trondheim'
  | 'rekkehus-bergen' | 'hytte-trysil' | 'hytte-lofoten' | 'kontorbygg-stavanger'
  // Pakke 45: ferieboliger og hoteller med sesong.
  | 'marbella-leilighet' | 'marbella-hotell' | 'zermatt-leilighet' | 'zermatt-hotell'
  | 'kontorbygg' | 'kjopesenter' | 'naeringsbygg' | 'oy'
  | 'stockholm' | 'kobenhavn' | 'berlin' | 'london' | 'dubai' | 'newyork'
  // Pakke 59: flere land.
  | 'amsterdam' | 'roma' | 'paris'

export type NorskBy = 'Bergen' | 'Oslo' | 'Stavanger' | 'Geilo' | 'Trondheim' | 'Lofoten' | 'Hedmarken' | 'Lista' | 'Trysil' | 'Namdalen'
export type Utenlandsby = 'Stockholm' | 'København' | 'Berlin' | 'London' | 'Marbella' | 'Zermatt' | 'Dubai' | 'New York' | 'Amsterdam' | 'Roma' | 'Paris'

/** Valutaene eiendom i utlandet handles i (Pakke 59). */
export type Valuta = 'SEK' | 'DKK' | 'EUR' | 'GBP' | 'CHF' | 'USD' | 'AED'
export type By = NorskBy | Utenlandsby

export interface Eiendomstype {
  id: EiendomId
  /** Ferieboliger og hoteller har sesong: leien følger måneden (eiendom.ts, SESONGER). */
  sesong?: 'sommer' | 'vinter'
  navn: string
  sted: string
  by: By
  /** Pris når eiendomsindeksen står på 1. */
  pris: number
  /** Leie per time, som andel av prisen. Følger indeksen. */
  avkastning: number
  /** Så mange kan du eie av typen. */
  maksAntall: number
  /** Statusnivået som kreves for å få kjøpe. */
  statuskrav: number
  /** Utenlands: flyet du må eie for å komme dit og kjøpe (1 propellfly, 2 forretningsjet, 3 langdistansejet). */
  reise?: number
}

export type LuksusKategori = 'bil' | 'klokke' | 'baat' | 'fly'

export type LuksusId =
  | 'stasjonsvogn' | 'elbil' | 'superbil' | 'hyperbil'
  | 'gullklokke' | 'mesterverk' | 'diamantklokke'
  | 'snekke' | 'motorbaat' | 'superyacht'
  | 'propellfly' | 'forretningsjet' | 'langdistansejet'
  | 'veteranbil' | 'limousin' | 'formelbil'
  | 'dykkerklokke' | 'lommeur'
  | 'seilbaat' | 'seilyacht'
  | 'helikopter'

export interface Luksusgjenstand {
  id: LuksusId
  navn: string
  kategori: LuksusKategori
  pris: number
  /** Statuspoeng gjenstanden gir så lenge du eier den. */
  status: number
}

export type LagerId = 'garasje' | 'havn' | 'hangar'

// ─────────────────────────────────────────────── Avis, prestasjoner og rekorder

export interface Overskrift {
  tittel: string
  tekst: string
  /** Hva saken handler om — styrer plassering og utseende. */
  type: 'deg' | 'marked' | 'lokalt'
}

export interface Avisutgave {
  /** Spilldagen utgaven kom ut (0 = første dag). */
  dag: number
  saker: Overskrift[]
  /** Uke-, måneds- og årsoppgjør som ble gjort opp denne dagen. */
  oppgjor?: Oppgjor[]
}

/** Tellerstanden ved starten av en periode (uke, måned, år). Oppgjøret er differansen. */
export interface Periodestart {
  dag: number
  formue: number
  tjent: number
  leie: number
  utbytte: number
  sparerente: number
  rentebetalt: number
  forbruk: number
  gevinst: number
  /** Klubbens resultat og jordas avling. Mangler i tellerstander fra før Pakke 39. */
  klubb?: number
  host?: number
  /** Hva hver bedrift hadde tjent totalt ved periodens start, etter id. */
  bedrifter: Record<string, number>
  kurser: Record<PapirId, number>
  /**
   * Bare ved ukestart (Pakke 60): prisen per enhet på det du eide, etter nøkkel
   * («papir:NFS», «eiendom:berlin» …), og kjøpt og solgt så langt — så
   * søndagsavisa kan finne ukas beste og verste investering og ukas handel.
   */
  enhetspriser?: Record<string, number>
  handel?: Handelstotal
}

export interface Oppgjor {
  /** 'dag' brukes bare i statistikken (`dagsoppgjor`), aldri i avisa. */
  periode: 'dag' | 'uke' | 'maaned' | 'aar'
  /** «uke 7», «januar 2027», «2027». */
  navn: string
  fraDag: number
  tilDag: number
  bedrifter: number
  leie: number
  utbytte: number
  sparerente: number
  renter: number
  forbruk: number
  /** Gevinst minus tap på det som ble solgt. Mangler i oppgjør fra før versjon 18. */
  gevinster?: number
  /** Klubbens resultat: billetter og sponsor minus lønn. Mangler i oppgjør fra før Pakke 39. */
  klubb?: number
  /** Delen av `leie` som kom fra jorda: avlinger og tømmer. Mangler i oppgjør fra før Pakke 39. */
  host?: number
  formueFor: number
  formueEtter: number
  besteBedrift: { type: BedriftstypeId; tjent: number } | null
  /** Ukas beste og verste aksje (bare for uker). */
  vinner?: { id: PapirId; endring: number }
  taper?: { id: PapirId; endring: number }
  /** «Uka di» i søndagsavisa (Pakke 60), bare for uker: formuen ved hver dags start og ved slutten. */
  formuekurve?: number[]
  /** Forbes-lista den søndagen: de fem øverste, og deg om du ikke er blant dem. */
  forbes?: { plass: number; navn: string; formue: number; deg: boolean }[]
  /** Kjøpt og solgt i uka, per aktivaklasse (uten sparekontoen). */
  handel?: { klasse: Aktivaklasse; kjopt: number; solgt: number }[]
  /** Ukas beste og verste investering blant det du eide hele uka. */
  besteInvestering?: { navn: string; endring: number }
  versteInvestering?: { navn: string; endring: number }
}

/** Et øyeblikksbilde ved forrige dagsskifte, så avisen kan melde hva som har endret seg. */
export interface Dagsbilde {
  kurser: Record<PapirId, number>
  eiendomsindeks: number
  bedrifter: BedriftstypeId[]
  eiendommer: number
  luksus: LuksusId[]
  sek: number
  /** Porteføljens verdi per klasse ved dagens start. */
  verdier: Record<Aktivaklasse, number>
  /** Din plass på Forbes-lista (1 = rikest). Mangler i lagringer fra før rivalene. */
  rang?: number
  /** Rivalene du hadde kjøpt opp ved dagens start. */
  overtatte?: string[]
  /** Fusjonene du hadde gjort ved dagens start, som «rivalId:bransje». */
  fusjoner?: string[]
}

export type Aktivaklasse = 'aksje' | 'krypto' | 'fond' | 'obligasjon' | 'eiendom' | 'sparing' | 'rival' | 'startup'

/** Rommene i hjemmene (Pakke 60). */
export type RomId = 'kjokken' | 'stue' | 'vinkjeller' | 'peisestue' | 'badstue' | 'boblebad' | 'terrasse' | 'basseng' | 'gjestefloy'

/** Alt du har kjøpt og solgt per aktivaklasse, totalt (Pakke 60). Ukeavisa ser på differansen. */
export interface Handelstotal {
  kjopt: Partial<Record<Aktivaklasse, number>>
  solgt: Partial<Record<Aktivaklasse, number>>
}

export type ObligasjonId = 'kort' | 'lang'

/** En eiendomsforvalters stil (Pakke 54). */
export type ForvalterId = 'forsiktig' | 'paagaende' | 'lokal'

/**
 * Det du eier av én obligasjon. Kjøper du flere ganger, slås postene sammen:
 * renten blir snittet vektet med pålydende — verdien og kupongen er lineære i
 * renten, så det blir nøyaktig det samme som å holde postene hver for seg.
 */
export interface Obligasjonspost {
  palydende: number
  /** Renten (i prosent) kupongen ble låst til. */
  rente: number
  /**
   * Markedsrenten prisen måles mot (Pakke 56): posten er verdt pålydende når
   * markedsrenten står her. Et snitt vektet med pålydende når du kjøper mer.
   */
  anker: number
  kostpris: number
}

export interface Bransjenyhet {
  type: BedriftstypeId
  /** Inntekten ganges med dette, til og med dagen før tilDag. */
  faktor: number
  tilDag: number
}

export interface Rekorder {
  hoyesteInntekt: number
  storsteHandel: number
  storsteGevinst: number
}

// ─────────────────────────────────────────────── Skatt, rivaler og ordre

export interface Skatteregning {
  id: number
  navn: string
  belop: number
  forfallSek: number
  type: 'skatt' | 'etterskatt'
}

export interface Skatt {
  regninger: Skatteregning[]
  /** Overskuddet føres via et selskap i et skatteparadis: halv skatt, men risiko for bokettersyn. */
  offshore: boolean
  /** Skatt spart via offshore som skattemyndighetene ennå ikke har funnet. */
  unndratt: number
  totaltBetalt: number
  nesteId: number
}

export interface Rival {
  id: string
  navn: string
  selskap: string
  formue: number
  /** Formuen rivalen vokser mot, men aldri helt når. */
  tak: number
  /** Vekst per time når rivalen er liten. */
  vekst: number
  /** Din eierandel i rivalens selskap (0–1). */
  andel: number
  /** Det du har betalt for andelen. */
  kostpris: number
  /** Du eier hele selskapet. */
  overtatt: boolean
  /** Bransjene rivalen har mistet til deg — de kommer aldri tilbake. */
  solgt: BedriftstypeId[]
  /** Dagens forhandlinger per bransje: ett bud per dag. */
  bud: Partial<Record<BedriftstypeId, Forhandling>>
}

export interface Forhandling {
  /** Spilldagen budet ble gitt. */
  dag: number
  /** Prisen rivalen vil ha i stedet, eller null når rivalen sa blankt nei. */
  motbud: number | null
}

export type Ordretype = 'kjop' | 'selg-over' | 'selg-under'

export interface Ordre {
  id: number
  papir: PapirId
  type: Ordretype
  /** Kursen ordren utløses på. */
  grense: number
  antall: number
}

export interface Hendelse {
  sek: number
  tittel: string
  tekst: string
  alvor: 'info' | 'advarsel' | 'kritisk'
}

export interface Formuepunkt {
  sek: number
  verdi: number
}

export interface Formuehistorikk {
  /** Sekunder mellom punktene. Dobles hver gang listen tynnes ut. */
  intervall: number
  punkter: Formuepunkt[]
}

export interface Spilltilstand {
  versjon: number
  frø: number
  /** Spilletid i hele sekunder: tid med appen åpen, pluss tid borte (med tak). */
  sek: number
  kontanter: number
  bedrifter: Bedrift[]
  /** Teller for id-er, så to kjøringer fra samme frø gir samme id-er. */
  nesteId: number
  historikk: Formuehistorikk
  totaltTjent: number
  /** Den høyeste nettoformuen du har hatt. Låser opp bransjer — og låser aldri igjen. */
  hoyesteFormue: number
  /** Innredningen i hjemmene (Pakke 60): hvor mange trinn som er kjøpt i hvert rom. */
  hjem?: Partial<Record<RomId, number>>
  /** Alt kjøpt og solgt per aktivaklasse (Pakke 60). Mangler i eldre lagringer til første handel. */
  handelTotalt?: Handelstotal
  marked: Marked
  beholdning: Partial<Record<PapirId, Beholdning>>
  gjeld: number
  /** Fastrente (Pakke 49): satsen per time og dagen bindingen går ut. Mangler: flytende rente. */
  rentebinding?: { sats: number; tilDag: number }
  /** Statsobligasjoner (Pakke 53). Mangler i eldre lagringer: ingen. */
  obligasjoner?: Partial<Record<ObligasjonId, Obligasjonspost>>
  /** Forvalterne for eiendommen, én per by (Pakke 54). Mangler: ingen. */
  forvaltere?: Partial<Record<By, ForvalterId>>
  /**
   * Valutakursene der spillet var da valutaene kom (Pakke 59, versjon 22),
   * logaritmisk. Mangler i nye spill: der starter kursene på 1.
   */
  valutaanker?: Partial<Record<Valuta, number>>
  /** Selskapsnyheter som treffer bedriftene dine i samme bransje en stund (Pakke 53). */
  bransjenyheter?: Bransjenyhet[]
  totaltUtbytte: number
  /** Siste hendelser, nyeste sist. Kappet i lengde. */
  hendelser: Hendelse[]
  /** Antall eiendommer du eier av hver type. */
  eiendommer: Partial<Record<EiendomId, number>>
  /** Hva du har betalt for eiendommene du eier, per type. Gir avkastningen. */
  eiendomKostpris: Partial<Record<EiendomId, number>>
  /** Standarden per eiendomstype: 0 normal, 1 oppusset, 2 luksus. Gjelder alle enhetene av typen. */
  eiendomStandard: Partial<Record<EiendomId, number>>
  /** Pågående oppussinger: hvilken standard det pusses opp til, og når det er ferdig. */
  oppussing: Partial<Record<EiendomId, { standard: number; ferdigSek: number }>>
  /** Leie, avlinger og tømmer, totalt. `totaltHost` er delen som kom fra jorda. */
  totaltLeie: number
  /** Penger på sparekontoen. */
  sparing: number
  totaltSparerente: number
  /**
   * Kostprisen for sparekontoen (Pakke 58): det du har satt inn og ikke tatt
   * ut igjen. Mangler i gamle lagringer til første innskudd eller uttak.
   */
  sparingKostpris?: number
  /**
   * Om du noen gang har tatt opp et lån selv (Pakke 58). Gjeld banken legger
   * på når pengene tar slutt, teller ikke.
   */
  harLaant?: boolean
  /**
   * Gevinst minus tap på alt som er solgt: papirer, fond, eiendom, jord,
   * landemerker, kunst, rivalandeler, startups og klubben. Skattes med inntekten.
   */
  totaltGevinst: number
  /**
   * Klubbens resultat, totalt: billetter og sponsor minus lønn. Skattes med
   * inntekten. Kjøp og salg av spillere er kostpris, ikke resultat.
   * Mangler i lagringer fra før Pakke 39.
   */
  totaltKlubb?: number
  /** Tellerstanden ved starten av dagen, til statistikken. Mangler før Pakke 39. */
  dagstart?: Periodestart
  /** Oppgjør for hver av de siste dagene, nyeste sist — bare til statistikken. */
  dagsoppgjor?: Oppgjor[]
  /** Luksusgjenstandene du eier. Én av hver. */
  luksus: LuksusId[]
  /** Plasser i garasjen, havna og hangaren. */
  lager: Record<LagerId, number>
  /** De siste utgavene av avisen, nyeste sist. */
  avis: Avisutgave[]
  /** Dagen i den nyeste utgaven du har lest. */
  avisLest: number
  forrigeDag: Dagsbilde
  /** Penger flyttet inn i (+) eller ut av (−) hver klasse i dag: kjøp, salg, innskudd og uttak. */
  dagensFlyt: Record<Aktivaklasse, number>
  /** Prestasjonene du har klart, med spillsekundet de kom. */
  prestasjoner: Record<string, number>
  rekorder: Rekorder
  /** Renter betalt på lån, totalt. */
  totaltRentebetalt: number
  /** Brukt på luksus og lagerplass, totalt. */
  totaltForbruk: number
  ukestart: Periodestart
  maanedstart: Periodestart
  aarstart: Periodestart
  /** Oppgjørene som er gjort, nyeste sist. */
  oppgjor: Oppgjor[]
  skatt: Skatt
  rivaler: Rival[]
  ordre: Ordre[]
  nesteOrdreId: number
  /** Oppstartsselskapene: de som søker penger nå, og de som nylig er avsluttet. */
  startups: Startup[]
  nesteStartupId: number
  /** Fotballklubben du eier, eller null. */
  klubb: Klubb | null
  /** Trofeene du har vunnet — de blir i skapet selv om du selger klubben. */
  trofeer: Trofe[]
  /** Gårder og skoger du eier. */
  jord: Partial<Record<JordId, Jordstykke>>
  /** Alt gårdene og skogene har gitt: avlinger og tømmer. */
  totaltHost: number
  /** Landemerkene som er solgt — til deg eller til en rival. Mangler de, er de til salgs. */
  landemerker: Partial<Record<LandemerkeId, Landemerkeeie>>
  kunst: Kunstmarked
  /** Andeler i indeksfondene. */
  fond: Partial<Record<FondId, Beholdning>>
  /** Dine siste handler i aksjer og krypto, nyeste sist — til merkene på grafen. */
  handler: Handelslogg[]
  /** Kvartalsrapportene per aksje: siste resultat og hvordan utbyttet har endret seg. */
  kvartal: Partial<Record<PapirId, Kvartal>>
  /** Koppene du har solgt selv i dette sekundet — et tak på hvor fort du rekker. Mangler i eldre lagringer. */
  handsalg?: { sek: number; antall: number }
  /** Kø ved en av bedriftene, som du kan betjene for en bonus før kundene går. */
  ko?: { bedriftId: string; slutterSek: number; bonus: number } | null
}

// ─────────────────────────────────────────────── Fond, handler og kvartalsrapporter

export type FondId = 'BORSFOND' | 'KRYPTOFOND'

export interface Handelslogg {
  papir: PapirId
  sek: number
  kurs: number
  /** Positivt for kjøp, negativt for salg. */
  antall: number
}

/** 0 svakt, 1 som i fjor, 2 sterkt. */
export type Estimat = 0 | 1 | 2

export interface Rapport {
  dag: number
  estimat: Estimat
  utfall: 'bedre' | 'ventet' | 'svakere'
  /** Kursbevegelsen resultatet ga, som andel. */
  endring: number
}

export interface Kvartal {
  /** Utbyttet ganges med dette. Gode resultater hever det, dårlige senker det. */
  utbytteFaktor: number
  siste: Rapport | null
}

// ─────────────────────────────────────────────── Jord, landemerker og kunst

export type JordId = 'gard-hedmarken' | 'gard-lista' | 'skog-trysil' | 'skog-namdalen'

export interface Jordstykke {
  kostpris: number
  /** Når skogen sist ble plantet (kjøpt eller hogd). Tømmeret vokser fra da. */
  plantetSek: number
}

export type LandemerkeId = 'fyret' | 'hoppbakken' | 'borgen' | 'tarnet'

export interface Landemerkeeie {
  /** «deg», eller id-en til rivalen som eier det. */
  eier: string
  kostpris: number
}

export type MaleriId =
  | 'morgenlys' | 'fiskeverket' | 'blaatimen' | 'byen-sover' | 'nordlys-over-vaagen'
  | 'kvinne-i-roedt' | 'stormen' | 'sommernatt' | 'skrik-i-byen'

export interface Kunstverk {
  kostpris: number
  /** Henger på museum: mer status, men kan ikke selges. */
  utlant: boolean
  /** Hentes hjem ved neste dagsskifte. */
  hentes: boolean
}

export interface Kunstmarked {
  kurser: Record<MaleriId, number>
  eide: Partial<Record<MaleriId, Kunstverk>>
  /** Kunstmarkedets egen terning. */
  frø: number
}

// ─────────────────────────────────────────────── Fotballklubb

export type Taktikk = 'forsvar' | 'balansert' | 'angrep'

export interface Spiller {
  id: number
  navn: string
  /** 1–99. */
  styrke: number
  alder: number
}

/** Et lag i serien, med tabellen sin. Lag nummer 0 er alltid ditt. */
export interface Lag {
  navn: string
  /** Styrken til de andre lagene. Ditt regnes ut fra troppen. */
  styrke: number
  spilt: number
  vunnet: number
  uavgjort: number
  tapt: number
  maalFor: number
  maalMot: number
}

export interface Kamp {
  sesong: number
  runde: number
  motstander: string
  hjemme: boolean
  maalFor: number
  maalMot: number
}

export interface Trofe {
  navn: string
  sesong: number
  klubb: string
}

export interface Klubb {
  navn: string
  /** 0 = 4. divisjon … 4 = Eliteserien. */
  divisjon: number
  sesong: number
  /** Neste runde som skal spilles (0–8). */
  runde: number
  lag: Lag[]
  spillere: Spiller[]
  /** Spillerne som er til salgs i dag. */
  marked: Spiller[]
  taktikk: Taktikk
  /** Klubbens egen terning, så en klubb ikke endrer resten av spillet. */
  frø: number
  nesteSpillerId: number
  kamper: Kamp[]
  /** Pengene denne sesongen. */
  billetter: number
  sponsor: number
  lonn: number
  /** Det du har satt inn i klubben: kjøpet og spillerkjøpene, minus spillersalgene. Gir gevinsten ved salg. */
  kostpris: number
  /** Tellere til prestasjonene. */
  seire: number
  opprykk: number
}

// ─────────────────────────────────────────────── Startups

export type Startupstatus = 'aktiv' | 'konkurs' | 'solgt' | 'bors'

export interface Startup {
  id: number
  /** Indeks i STARTUP_IDEER — navn og beskrivelse. */
  ide: number
  /** Indeks i RUNDER: 0 pre-seed … 4 serie C. */
  runde: number
  /** Selskapets verdi etter pengene i denne runden. */
  verdi: number
  /** Din eierandel (0–1). */
  andel: number
  /** Alt du har betalt inn. */
  investert: number
  /** Det du har betalt inn i runden som pågår — det er et tak per runde. */
  investertIRunde: number
  /** Skjult: 0–1. Et godt team går sjeldnere konkurs. */
  kvalitet: number
  /** Det du får se: et støyete inntrykk av teamet, 0–2. */
  inntrykk: number
  status: Startupstatus
  startetSek: number
  /** Når selskapet ble avsluttet, og hva du fikk utbetalt. */
  sluttSek?: number
  utbetalt?: number
}
