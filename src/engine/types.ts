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
  // Pakke 117: et trinn over skisenteret.
  | 'brikkefabrikk'

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
  /** Prisen, i vanlige oppgraderinger på nivået den låses opp (Pakke 100). */
  prisfaktor: number
}

// ─────────────────────────────────────────────── Markedet

export type PapirId =
  | 'NFS' | 'FJK' | 'VTK' | 'BSH' | 'POL' | 'NLT' | 'AUB' | 'TRS'
  | 'BMT' | 'FJD' | 'NSL' | 'TRM' | 'VKT' | 'LKS'
  // Børsnotert i versjon 17 (se NYE_PAPIRER i marked.ts).
  | 'NRB' | 'KRV' | 'FJF' | 'ROM'
  | 'STK' | 'ELG' | 'BRN'
  // Børsnotert i Pakke 104: en aksje for hver bransje som manglet, og et eiendomsselskap.
  | 'SOL' | 'NPL' | 'GMN' | 'KBN' | 'BRD' | 'FJH' | 'TOP' | 'NBE'
  // Børsnotert i Pakke 117, med brikkefabrikken.
  | 'NLH'
  // Råvarene i Pakke 124: olje, laks og gull.
  | 'OLJ' | 'LAK' | 'GLD'

export type Risiko = 'lav' | 'middels' | 'høy'

/** Formuesforvalterens profil (Pakke 124). */
export type Forvalterprofil = 'forsiktig' | 'balansert' | 'offensiv' | 'utbytte'
export interface Forvalter {
  profil: Forvalterprofil
  /** Sekundet forvalteren startet. */
  fra: number
  /** Alle gebyrene så langt. */
  gebyrBetalt: number
  /** Den siste mandagen: hva den solgte, kjøpte og tok i gebyr. */
  siste?: { dag: number; solgt: number; kjopt: number; gebyr: number }
  /** Pakke 125: forvalterkontoen, der renteposten står når renten er lav — med sparekontoens rente — og det den kostet. */
  konto?: number
  kontoKostpris?: number
  /** Pakke 126: andelen av inntekten og leia som går til forvalterkontoen hvert sekund, og investeres mandag. Mangler: ingen. */
  innskudd?: number
  /** Pakke 126: sparemålet — beløpet den betaler ut som kontanter når den har det, og hva det er til. */
  maal?: { belop: number; navn: string; bedrift?: BedriftstypeId }
  /** Pakke 127: regnskapet som viser om den lønner seg. Mangler hos en forvalter fra før: telles fra første sekund etter. */
  regnskap?: Forvalterregnskap
}

/**
 * Forvalterens regnskap (Pakke 127), fra sekundet `fra`: det som gikk inn (det den overtok, knappene, andelen
 * av inntekten) og ut (uttak, sparemålet), utbyttet og kupongene det den har ga deg, gebyrstanden da tellingen
 * startet, og en skyggekonto — sparekontoen med de samme pengene til de samme tidene. Alt før skatt.
 */
export interface Forvalterregnskap {
  fra: number
  inn: number
  ut: number
  utbytte: number
  gebyr0: number
  skygge: number
  /** Det den forvalter ved hvert dagsskifte, de siste 56 dagene. */
  kurve: number[]
}

/** Forvalterens tellere ved ukas start (Pakke 127), til linja i søndagsavisa. */
export interface Forvalterstand {
  fra: number
  verdi: number
  inn: number
  ut: number
  utbytte: number
  gebyr: number
  skygge: number
}

/** En aksje eller en kryptomynt. Rater er per time spilltid. */
export interface Papir {
  id: PapirId
  navn: string
  klasse: 'aksje' | 'krypto' | 'ravare'
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
  /** Pakke 124: gullet går mot konjunkturen — det stiger når aksjene faller. Ganges med konjunkturdriften. */
  motKonjunktur?: number
  /** Pakke 124: enheten en råvare handles i («fat», «kg», «gram»). */
  enhet?: string
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
  // Pakke 76: eiendom for det sene spillet.
  | 'canary-wharf' | 'kjopesenterkjede' | 'downtown-dubai' | 'manhattan-skyskraper'

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
  /** Teller ikke når du eier hele byen (Pakke 79): de sene byggene fra Pakke 76. */
  utenforByen?: boolean
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
  // Pakke 88: det sene sjiktet, fra 5 til 60 mrd.
  | 'unikhyperbil' | 'skreddersyddklokke' | 'megayacht' | 'widebodyjet' | 'ubaat'

export interface Luksusgjenstand {
  id: LuksusId
  navn: string
  kategori: LuksusKategori
  pris: number
  /** Statuspoeng gjenstanden gir så lenge du eier den. */
  status: number
  /** Én linje om tingen (Pakke 91), på kortet og detaljsiden. */
  linje: string
}

export type LagerId = 'garasje' | 'havn' | 'hangar'

/** Racingteamet (Pakke 90): delene på bilen, førerne og sesongen. */
export type Bildel = 'motor' | 'aero' | 'chassis' | 'depot'
export type Lopsstrategi = 'forsiktig' | 'normal' | 'aggressiv'

export interface Forer {
  id: number
  navn: string
  /** 0–100: hvor mye fører en legger til bilens fart. */
  ferdighet: number
  /** Lønn per spilldag. */
  lonn: number
  /**
   * Pakke 111: alderen og taket føreren kan vokse til. Mangler på førere fra før; de får dem fra
   * en hash ved neste sesongslutt.
   */
  alder?: number
  potensial?: number
}

/** Anleggene (Pakke 111): vindtunnelen og fabrikken gjør delene billigere, simulatoren førerne bedre. */
export type Racinganlegg = 'vindtunnel' | 'fabrikk' | 'simulator'
export type Sponsoravtale = 'trygg' | 'resultat'

/** Sesongens tittelsponsor (Pakke 111): en trygg sum fordelt på løpene, eller etter plassen til slutt. */
export interface Racingsponsor {
  navn: string
  avtale: Sponsoravtale
  /** Det den trygge avtalen gir hele sesongen. */
  trygg: number
}

/** Ett løp, sett fra ditt team: hvor førerne kom (0 = ute), poengene, premien og pallen. */
export interface Racinglop {
  sesong: number
  runde: number
  dag: number
  bane: string
  strategi: Lopsstrategi
  /** Plassen til fører 1 og 2, 1–20; 0 er ute av løpet (krasj), null er et tomt sete. */
  plasser: (number | null)[]
  poeng: number
  premie: number
  /** De tre på pallen: fører og team. */
  pall: { forer: string; lag: string }[]
  /** Pakke 109: om det regnet, startplassen til fører 1 og 2 (1–20), og hvem som tok pole. */
  regn?: boolean
  start?: (number | null)[]
  pole?: { forer: string; lag: string }
  /**
   * Pakke 110: hele feltet — startplass og plass (0 = ute) — til løpet direkte og den fulle
   * rapporten. Står bare på de to siste løpene. Og motor- og depottrinnet ditt den dagen.
   */
  felt?: { forer: string; lag: string; start: number; plass: number }[]
  motor?: number
  depot?: number
}

export interface Racingsesong {
  sesong: number
  /** Plassen i konstruktørmesterskapet. */
  plass: number
  poeng: number
  /** Beste fører i førermesterskapet. */
  forerplass: number
  seire: number
  titler: string[]
}

// ─────────────────────────────────────────────── Romfarten (Pakke 118)

/** Rakettens seks deler, som forskes fram i seks trinn hver. */
export type Rakettdel = 'motorer' | 'tanker' | 'ovretrinn' | 'styring' | 'varmeskjold' | 'gjenbruk'
/** Satellittenes tre deler (Pakke 119), forsket fram i samme avdeling som rakettdelene. */
export type Satellittdel = 'solpaneler' | 'antenner' | 'kapasitet'
export type Forskningsdel = Rakettdel | Satellittdel

/** Satellittene fra én oppskyting (Pakke 119): de er like, og går ut av drift samme dag. */
export interface Satellittkull {
  id: number
  antall: number
  /** Dekningen hver satellitt gir, i enheter (1 med de første antennene, 2,5 ferdig forsket). */
  dekning: number
  /** Dagen de ble skutt opp, og den siste dagen de er i drift. */
  dag: number
  sluttDag: number
}

/** Lav bane eller geostasjonær: den høye banen krever mer løft og betaler mer per tonn. */
export type Romkontraktbane = 'lav' | 'geo'

/** En oppskyting et annet selskap vil betale for. */
export interface Romkontrakt {
  id: number
  kunde: string
  /** Hva som skal opp: «en værsatellitt», «forsyninger til romstasjonen». */
  last: string
  tonn: number
  bane: Romkontraktbane
  honorar: number
}

/** En oppskyting som er gjort. */
export interface Oppskyting {
  dag: number
  /** Kunden — eller «Egne satellitter» (Pakke 119). */
  kunde: string
  tonn: number
  bane: Romkontraktbane
  honorar: number
  /** Hva raketten kostet å bygge. */
  kostnad: number
  ok: boolean
}

/**
 * Romfartsfabrikken (Pakke 118): den siste bedriften, som ikke har nivåer. Den
 * bygger raketter av delene som er forsket fram og skyter opp en kontrakt hver
 * spilldag. Mangler i lagringer uten fabrikk.
 */
export interface Romfart {
  /** Fabrikkens egen terning: bare oppskytingene trekker fra den. */
  frø: number
  startetSek: number
  /** Fabrikken, forskningsavdelingen og forskningen — det fabrikken står til i formuen. */
  investert: number
  /** Forskningsavdelingens trinn: 0 = ingen, 1–6. */
  avdeling: number
  deler: Record<Rakettdel, number>
  /** Forskningen som pågår. */
  forskning?: { del: Forskningsdel; ferdigSek: number }
  /** Satellittdelene (Pakke 119). Mangler i fabrikker fra Pakke 118: da er alle på trinn 0. */
  satdeler?: Record<Satellittdel, number>
  /** Satellittene i bane, kull for kull (Pakke 119). */
  kull?: Satellittkull[]
  nesteKullId?: number
  /** Du har valgt å skyte opp egne satellitter ved neste dagsskifte. */
  valgtSatellitter?: boolean
  /** Hva nettet tjener per sekund nå — regnet ut når kullene endrer seg, lagt til hvert sekund. */
  nettPerSek?: number
  /** Det nettet har tjent, og det satellittene har kostet, siden start. */
  nettTjent?: number
  satellittkostnad?: number
  /** Kontraktene på tavla i dag, og dagen de gjelder. */
  tavle: Romkontrakt[]
  tavleDag: number
  /** Kontrakten du har valgt for neste dagsskifte. Uten valg tar fabrikken den beste raketten løfter. */
  valgt?: number
  nesteKontraktId: number
  /** De siste oppskytingene, nyeste sist. */
  oppskytinger: Oppskyting[]
  antall: number
  vellykket: number
  /** Honorarene og hva rakettene kostet, siden start. */
  inntekt: number
  kostnad: number
}

export interface Racingteam {
  navn: string
  sesong: number
  /** Teamets egen terning: løpene trekker bare fra den. */
  frø: number
  /** Dagen neste løp avgjøres (ved dagsskiftet inn i den). */
  nesteDag: number
  /** Løp kjørt denne sesongen, 0–8. */
  runde: number
  deler: Record<Bildel, number>
  /** Det delene (og fra Pakke 111 anleggene og akademiet) har kostet — teamets verdi. */
  investert: number
  /** To seter; null er tomt. */
  forere: (Forer | null)[]
  /** Førerne som kan ansettes, nye hver sesong. */
  marked: Forer[]
  nesteForerId: number
  strategi: Lopsstrategi
  /** Poengene i år: konstruktører per team, førere per «navn|team». */
  lagpoeng: Record<string, number>
  forerpoeng: Record<string, number>
  /** Løpene i år og i fjor, nyeste sist (høyst 16). */
  lop: Racinglop[]
  sesonger: Racingsesong[]
  /** Premier og lønn så langt, til siden. */
  premier: number
  lonn: number
  /**
   * Pakke 110: løpet spilles direkte dagen etter at det er avgjort, og avisa og hendelsene om det
   * venter til målflagget (neste dagsskifte). Tabellen fra sesongen som nettopp ble avsluttet,
   * så siden kan vise den mens siste løp kjøres.
   */
  ventendeSaker?: Overskrift[]
  ventendeHendelser?: string[]
  sisteTabell?: { sesong: number; lagpoeng: Record<string, number>; forerpoeng: Record<string, number> }
  /**
   * Pakke 111: juniorakademiet (trinn 0–3) og juniorene det har sendt opp, anleggene (trinn 0–3
   * hver), sesongens sponsor og det sponsorene har betalt. Alt mangler i team fra før.
   */
  akademi?: number
  juniorer?: Forer[]
  anlegg?: Partial<Record<Racinganlegg, number>>
  sponsor?: Racingsponsor
  sponsorpenger?: number
}

/** Utleie av yachten eller jeten (Pakke 89). Står den i lista, er den ute hos noen andre. */
export interface Charter {
  /** Det den har tjent på denne utleien. */
  tjent: number
  /** Du har bedt om den hjem — den kommer ved neste dagsskifte. */
  hentes?: boolean
}

/** De unike tingene som går under hammeren (Pakke 89). Én av hver i hele verden. */
export type UnikId =
  | 'urmakerens-forste' | 'kongelimousin' | 'sjoflyet' | 'regattavinneren'
  | 'le-mans-1971' | 'polarklokka' | 'kongeyachten' | 'regjeringsflyet'
  | 'prototypen' | 'store-komplikasjon' | 'overlydsflyet' | 'isbryteren'

/** Auksjonen som pågår: hva, fra hvilken dag, og om du har kjøpt den. */
export interface Auksjon {
  id: UnikId
  fraDag: number
  /** Siste dag det kan bys — ved dagsskiftet etter den faller hammeren. */
  tilDag: number
  /** Prisen den startet på (estimatet ganget med dagens auksjonsfaktor). */
  startpris: number
  /** Du kjøpte den: saken kommer i avisa ved neste dagsskifte. */
  kjopt?: boolean
}

export interface Auksjonshus {
  aktiv?: Auksjon
  /** Ingen ny auksjon før denne dagen. */
  nesteDag: number
  /** De unike tingene du eier, med det du betalte. */
  eide: Partial<Record<UnikId, { kostpris: number; dag: number }>>
  /**
   * Det som gikk til en rival (eller ble trukket uten bud): det kommer tilbake fra
   * `tilbakeDag`, dyrere for hver gang det har gått fra deg (`ganger`).
   */
  borte: Partial<Record<UnikId, { tilbakeDag: number; ganger: number; rival?: string; pris?: number }>>
}

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
  /** Racingteamets del av klubben (Pakke 98). Mangler i tellerstander fra før. */
  racing?: number
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
  /** Pakke 127: forvalterens tellere, når du har en. */
  forvalter?: Forvalterstand
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
  /** Delen av `klubb` som kom fra racingteamet (Pakke 98). Mangler i oppgjør fra før. */
  racing?: number
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
  /**
   * Pakke 113: det gårdene ga for uka som ble høstet mandag — avling og salg fra lageret —
   * og ukas vær. Avisa skriver om gårdene bare den beste og verste uka av åtte; dette står alltid.
   */
  gardene?: { host: number; vaer: string }
  /** Pakke 123: skogene denne uka — tømmeret fra hogstene, hvor mange, og storm og brann. */
  skogene?: { tommer: number; hogster: number; stormer: number; branner: number }
  /** Pakke 127: hva forvalteren ga denne uka, etter gebyr og med utbyttet, og hva sparekontoen ville gitt. */
  forvalter?: { endring: number; spar: number }
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
  /** Kryptostemningen ved dagens start (Pakke 82): 1 feber, −1 panikk, 0 rolig. Avisa skriver når den snur. */
  stemningssone?: number
}

export type Aktivaklasse = 'aksje' | 'krypto' | 'fond' | 'obligasjon' | 'eiendom' | 'sparing' | 'rival' | 'startup' | 'ravare'

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
  /** Etasjene i hovedkontoret (Pakke 117), 0–10. Valgfritt: gamle lagringer har ingen. */
  hovedkontor?: number
  /** Penger på sparekontoen. */
  sparing: number
  /** Pakke 124: andelen av inntekten og leia som går rett på sparekontoen hvert sekund (0, 0,1, 0,25 eller 0,5). */
  sparandel?: number
  /** Pakke 124: formuesforvalteren, når du har en. */
  forvalter?: Forvalter
  /** Pakke 125: trinnene du har kjøpt til forvalteren, 0–3. Blir stående om du sier den opp. */
  forvaltertrinn?: number
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
   * Når du første gang kjøpte en aksje eller mynt minst 20 % under toppen de
   * siste to timene (Pakke 70, den skjulte prestasjonen «Kontrær»).
   */
  kontraerKjop?: number
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
  /**
   * Delen av `totaltKlubb` som kom fra racingteamet (Pakke 98): premier minus lønn. Statistikken
   * viser den som egen kilde, som avlingene i leia. Mangler før Pakke 98 — det som kom før, står i klubben.
   */
  totaltRacing?: number
  /** Tellerstanden ved starten av dagen, til statistikken. Mangler før Pakke 39. */
  dagstart?: Periodestart
  /** Oppgjør for hver av de siste dagene, nyeste sist — bare til statistikken. */
  dagsoppgjor?: Oppgjor[]
  /** Luksusgjenstandene du eier. Én av hver. */
  luksus: LuksusId[]
  /** Plasser i garasjen, havna og hangaren. */
  lager: Record<LagerId, number>
  /** Hvor langt hvert sted er bygd ut (Pakke 88): 0 er det vanlige, 1 og 2 de to trinnene. */
  lagerTrinn?: Partial<Record<LagerId, number>>
  /** Yachtene og jetene som er leid ut (Pakke 89). Mangler i eldre lagringer. */
  charter?: Partial<Record<LuksusId, Charter>>
  /** Auksjonshuset (Pakke 89): auksjonen som pågår, og de unike tingene. Mangler i eldre lagringer. */
  auksjon?: Auksjonshus
  /** Racingteamet (Pakke 90), om du har startet ett. */
  racing?: Racingteam
  /** Romfartsfabrikken (Pakke 118), om du har kjøpt den. */
  romfart?: Romfart
  /** Mesterskapene teamet har vunnet — de står igjen om teamet selges. */
  racingtrofeer?: Trofe[]
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

/** En hogst i skogen (Pakke 120), til skogens regnskap. */
export interface Hogst {
  dag: number
  /** Bestandet som ble hogd, fra 0. */
  bestand: number
  /** Hvor mange dager bestandet hadde vokst. */
  alder: number
  belop: number
}

export interface Jordstykke {
  kostpris: number
  /**
   * Når skogen sist ble plantet (kjøpt eller hogd). Tømmeret vokser fra da. For en
   * gård: fra når ukas avling regnes med gårdens størrelse nå (kjøpet, eller sist
   * du bygde ut — Pakke 92).
   */
  plantetSek: number
  /**
   * Bestandene i skogen (Pakke 120): når hvert ble plantet. 3 fra start, opptil 5. Mangler den,
   * er skogen tre bestand plantet `plantetSek` — les den gjennom `bestand`, så trengs ingen migrering.
   */
  bestand?: number[]
  /** De siste hogstene i skogen (Pakke 120), nyeste sist, og alt tømmeret har gitt. */
  hogster?: Hogst[]
  tommerTotalt?: number
  /** Skogens eget sagbruk (Pakke 121): hver hogst gir mer. Prisen står i `investert`. */
  sagbruk?: boolean
  /** Klimakredittene skogen har gitt (Pakke 121), betalt hvert sekund for det stående tømmeret. */
  karbon?: number
  /** Trinnene på skogsmaskinene (Pakke 122): vei, hogstmaskin og bedre planter, 0–3. */
  skogmaskiner?: Partial<Record<Skogmaskin, number>>
  /** Plantetrinnet hvert bestand ble plantet med (Pakke 122), i samme rekkefølge som `bestand`. Mangler = 0. */
  planter?: number[]
  /** Skogforsikringen (Pakke 122) løper til dette sekundet, og fornyes av seg selv når `fornyForsikring` står. */
  forsikretTil?: number
  fornyForsikring?: boolean
  /** Alt forsikringen har kostet. */
  forsikringBetalt?: number
  /** Storm og brann i skogen (Pakke 122), de siste åtte. */
  skader?: Skogskade[]
  /** Den beste hogsten per dag skogen har hatt (Pakke 123), og en ny rekord som venter på avisa. */
  rekordPerDag?: number
  nyRekord?: { bestand: number; belop: number; alder: number }
  /** Et bestand er hogd innen to dager fra den beste dagen (Pakke 123, «Perfekt omløp»). */
  perfektOmlop?: boolean
  /** Jordene på gården (Pakke 92): 3 fra start, opptil 10. Mangler i eldre lagringer. */
  jorder?: number
  /** Maskinene du har kjøpt til gården. */
  maskiner?: Partial<Record<Gardsmaskin, boolean>>
  /**
   * Pakke 114: trinnet på hver maskin, 1–3. Mangler den, er en kjøpt maskin (`maskiner`) trinn 1 —
   * les den gjennom `maskintrinn`, så trengs ingen migrering.
   */
  maskintrinn?: Partial<Record<Gardsmaskin, number>>
  /** Nabogårdene du har kjøpt (Pakke 114), 0–3: hver tredobler jorda avlingen regnes på. */
  naboer?: number
  /** Spilldagen gården ble din (Pakke 114). En gård fra før får dagen den først ble sett etter oppdateringen. */
  eidFra?: number
  /** Gården er en odelsgård (Pakke 114): eid i 90 spilldager. */
  odel?: boolean
  /** Kraftverkene på jorda (Pakke 115) og hva hvert har tjent så langt. Et verk står her fra det er bygd. */
  kraftverk?: Partial<Record<Kraftverk, number>>
  /** Det jordene og maskinene kostet: teller i gårdens verdi. */
  investert?: number
  /** Avlingen så langt denne uka før du sist bygde ut — betales mandag med resten. */
  opptjent?: number
  /** Kornets del av `opptjent` (Pakke 93), så det kan gå i silo. */
  opptjentKorn?: number
  /** Grønnsakenes og fruktens del av `opptjent` (Pakke 105), så det kan gå i låven. */
  opptjentAnnet?: Partial<Record<'gronnsaker' | 'frukt', number>>
  /** Drenering, frostdekke, drivhus, silo og låve (Pakke 93). */
  bygg?: Partial<Record<Gardsbygg, boolean>>
  /** Korn i silo og låve, målt i kroner til pris 1 (Pakke 93). */
  lager?: number
  /** Kornet går i silo mandag i stedet for å selges. Fra før Pakke 105; nå leses `lagring` først. */
  lagre?: boolean
  /**
   * Hva lageret gjør mandag (Pakke 105): selger ukas avling, lagrer den, eller lagrer når
   * prisen er lav og selger alt når den er høy. Mangler den, er `lagre` «smart» og ellers «selg».
   */
  lagring?: Lagring
  /** Grønnsaker og frukt i låven (Pakke 105), målt i kroner til pris 1 som kornet. */
  lagerAnnet?: Partial<Record<'gronnsaker' | 'frukt', number>>
  /**
   * Pakke 112: lageret rant over sist mandag, og det er sagt fra. Settes når avling selges fordi
   * lageret er fullt, og fjernes en mandag det ikke skjer — så neste gang det fylles, sies det igjen.
   */
  lagerFullt?: boolean
  /** Dyrene i fjøset (Pakke 94), antall per slag. */
  dyr?: Partial<Record<Gardsdyr, number>>
  /** Fra når dyrenes utbytte i dag regnes med antallet nå (kjøpet av det siste dyret). */
  dyrSek?: number
  /**
   * Hvor langt kassene er ført (Pakke 106): kjøpet av et dyr eller sist dagsskifte. Formuen
   * regnes før dagsskiftet i samme sekund, så uten den manglet gårsdagens siste del da.
   */
  dyrBokfort?: number
  /** Opptjent av dyrene, ikke betalt ennå: melk og egg (neste dagsskifte), ull (klippingen) og kjøtt (slakten). */
  dyrKasse?: Partial<Record<'daglig' | 'ull' | 'slakt', number>>
  /** Gårdens eget regnskap (Pakke 94): de siste åtte ukene, og alt siden du kjøpte den. */
  regnskap?: Gardsuke[]
  siden?: Gardstall
}

export type Gardsdyr = 'ku' | 'hone' | 'sau' | 'gris'

/** Lagerets valg mandag (Pakke 105). */
export type Lagring = 'selg' | 'lagre' | 'smart'

/** Det gården har gitt og kostet, per slag (Pakke 94). */
export interface Gardstall {
  /** Avlingen som ble solgt mandag. */
  host: number
  /** Solgt fra silo og låve: for hånd, og (Pakke 105) mandag når prisen var god. */
  korn: number
  /** Melk, egg, ull og kjøtt. */
  dyr: number
  /** Produksjonstilskuddet ved hvert månedsskifte. */
  tilskudd: number
  /** Det du har bygd og kjøpt: jorder, maskiner, bygg og dyr. */
  bygd: number
}

export interface Gardsuke extends Gardstall {
  uke: number
}

export type Gardsmaskin = 'traktor' | 'tresker' | 'sproyte'
/** Skogsmaskinene (Pakke 122). */
export type Skogmaskin = 'vei' | 'hogstmaskin' | 'planter'
/** En storm eller brann i skogen (Pakke 122): hva som gikk tapt, og hva som kom inn (salget eller forsikringen). */
export interface Skogskade {
  dag: number
  type: 'storm' | 'brann'
  tapt: number
  betalt: number
}
export type Gardsbygg = 'drenering' | 'frostdekke' | 'drivhus' | 'silo' | 'laave' | 'fjos'
/** Kraftverkene på jorda (Pakke 115): vindturbiner på Lista, solcellepanel på låvetaket, småkraft i Namdalen. */
export type Kraftverk = 'vind' | 'sol' | 'vann'

export type LandemerkeId = 'fyret' | 'hoppbakken' | 'borgen' | 'tarnet'

export interface Landemerkeeie {
  /** «deg», eller id-en til rivalen som eier det. */
  eier: string
  kostpris: number
}

export type MaleriId =
  | 'morgenlys' | 'fiskeverket' | 'blaatimen' | 'byen-sover' | 'nordlys-over-vaagen'
  | 'kvinne-i-roedt' | 'stormen' | 'sommernatt' | 'skrik-i-byen'
  // Pakke 107: de tre sene verkene.
  | 'tausheten' | 'byen-vaakner' | 'fjorden-brenner'

export interface Kunstverk {
  kostpris: number
  /** Henger på museum: mer status, men kan ikke selges. */
  utlant: boolean
  /** Hentes hjem ved neste dagsskifte. */
  hentes: boolean
}

export interface Kunstmarked {
  kurser: Record<MaleriId, number>
  /** Verdien hvert maleri trekkes mot (Pakke 67). Ankret i prisen da spillet fikk den. */
  verdier: Record<MaleriId, number>
  eide: Partial<Record<MaleriId, Kunstverk>>
  /** Kunstmarkedets egen terning. */
  frø: number
}

// ─────────────────────────────────────────────── Fotballklubb

export type Taktikk = 'forsvar' | 'balansert' | 'angrep'
/** Pakke 71: hver spiller har en posisjon, og laget en formasjon. */
export type Posisjon = 'keeper' | 'forsvar' | 'midtbane' | 'angrep'
export type Formasjon = '4-4-2' | '4-3-3' | '5-3-2'

export interface Spiller {
  id: number
  navn: string
  /**
   * 1–99: det spilleren er verdt og koster i lønn — angrep og forsvar veid
   * etter posisjonen (Pakke 71, `styrkeAv`). Lagret, så en gammel spiller
   * beholder verdien sin til neste sesong.
   */
  styrke: number
  alder: number
  posisjon: Posisjon
  /** 1–99: angrepet gir målene du scorer, forsvaret målene du slipper inn (Pakke 71). */
  angrep: number
  forsvar: number
  /** Juniorer fra akademiet (Pakke 71): taket de vokser mot til de er 23. Spilleren ser bare et spenn. */
  potensial?: number
  /**
   * Det du betalte for spilleren (Pakke 79): kjøpsprisen, eller 0 for en junior fra
   * akademiet. Skatten på et salg er salgsprisen minus dette. Mangler for spillere
   * fra før Pakke 79 og troppen som fulgte med klubben — da venter gevinsten til
   * klubben selges, som før.
   */
  kostpris?: number
  /** Denne sesongen og karrieren (Pakke 72). Mangler til første kamp. */
  sesong?: Spillerstatistikk
  karriere?: Spillerstatistikk
}

/** Akademiet (Pakke 71): trinnet og det du har satt inn. */
export interface Akademi {
  trinn: number
  investert: number
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
  /** Divisjonen laget kom fra før sesongen (Pakke 66). Mangler for lag som var der fra før. */
  fra?: number
}

/** Et lag i en av de andre divisjonene (Pakke 66): bare navn og styrke — de spiller ikke kamp for kamp. */
export interface Motlag {
  navn: string
  styrke: number
}

/** Stadion (Pakke 66): tribunetrinn, flomlys og VIP-losje. */
export interface Stadionstand {
  /** 0–4, se `STADIONTRINN`. */
  trinn: number
  flomlys: boolean
  vip: boolean
  /** Det du har betalt for utbyggingen. Teller i klubbverdien, så å bygge bare flytter penger. */
  investert: number
}

/** Et mål i kamprapporten (Pakke 72). */
export interface Maalhendelse {
  minutt: number
  /** Scorerens navn — etternavnet for motstanderens spillere, som ikke finnes. */
  navn: string
  /** Din spiller, når målet er ditt. */
  id?: number
  assist?: string
  /** true når motstanderen scoret. */
  mot: boolean
}

/** En spillers kamp i rapporten (Pakke 72). */
export interface Spillervurdering {
  id: number
  navn: string
  plass: Posisjon
  /** 4,0–10,0. */
  vurdering: number
}

export interface Kamp {
  sesong: number
  runde: number
  motstander: string
  hjemme: boolean
  maalFor: number
  maalMot: number
  /** Publikum på hjemmekamper (Pakke 66). */
  tilskuere?: number
  /** Kamprapporten (Pakke 72): målene i rekkefølge, startelleverens vurderinger og banens beste. Mangler i gamle kamper. */
  maal?: Maalhendelse[]
  vurderinger?: Spillervurdering[]
  beste?: number
  /** Cupen eller Europa (Pakke 73); seriekamper har ingen. `runde` er da runden i turneringen. */
  turnering?: Turnering
  /** Avgjort på straffer: hvem som gikk videre. */
  straffer?: 'deg' | 'dem'
  /**
   * Spilldagen kampen spilles i (Pakke 86): avgjort ved dagsskiftet som starter den,
   * vist direkte gjennom dagen, ferdig ved neste dagsskifte. Mangler i gamle kamper.
   */
  dag?: number
  /** Motstanderens beste spiller og vurderingen (Pakke 86), så rapporten forteller begge halvdeler. */
  motBeste?: { navn: string; vurdering: number }
}

/** Et resultat i runden, til tabellen som vises før din kamp er ferdig (Pakke 86). */
export interface Runderesultat {
  hjemme: string
  borte: string
  mh: number
  mb: number
}

/** Cupen og Europa (Pakke 73), kvalik og supercupen (Pakke 87). */
export type Turnering = 'cup' | 'europa' | 'kvalik' | 'supercup'

/** En utslagsturnering (Pakke 73): lagene som er igjen, neste runde, og din egen terning. */
export interface Utslag {
  sesong: number
  /** Neste runde som skal spilles. */
  runde: number
  /** Lagene som er igjen; ditt eget som { navn, styrke: 0, deg: true }. */
  lag: (Motlag & { deg?: boolean })[]
  /** Du er slått ut — eller har vunnet (da er `lag` bare deg). */
  ute: boolean
  /** Runden du gikk ut i, eller antall runder når du vant. */
  naadd: number
  frø: number
}

/** En spillers tall denne sesongen og gjennom karrieren (Pakke 72). */
export interface Spillerstatistikk {
  kamper: number
  maal: number
  assist: number
  /** Summen av vurderingene; snittet er sum / kamper. */
  sum: number
  /** Hver kamps vurdering denne sesongen, i rekkefølge (Pakke 86) — til kurven. Bare på `sesong`. */
  vurderinger?: number[]
}

/** Sesongen som var (Pakke 72), skrevet ved sesongslutt. */
export interface Sesongoppsummering {
  sesong: number
  divisjon: number
  plass: number
  poeng: number
  maalFor: number
  maalMot: number
  toppscorer: { navn: string; maal: number } | null
  aaretsSpiller: { navn: string; snitt: number } | null
  billetter: number
  sponsor: number
  lonn: number
  /** TV-penger og premier (Pakke 73). Mangler i oppsummeringer fra Pakke 72. */
  tv?: number
  premier?: number
  /** Hvor langt det gikk i cupen og i Europa: «Kvartfinale», «Cupmester». */
  cup?: string
  europa?: string
  /** Kvalikkampen, når du spilte den (Pakke 87): «Kvalik mot Ramsøy SK: 2–1, opp til 2. divisjon». */
  kvalik?: string
  /** Hva som skjedde: opp, ned, nektet opprykk eller ingenting. */
  utfall: 'opp' | 'ned' | 'nektet' | 'samme'
  /** Divisjonen neste sesong spilles i. */
  neste: number
  trofe?: string
}

export interface Trofe {
  navn: string
  sesong: number
  klubb: string
  /** Statusen trofeet gir, når den er en annen enn slagets (Pakke 108: en ny supercup gir 1). */
  status?: number
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
  formasjon: Formasjon
  akademi: Akademi
  /** Motstandernes scorere denne sesongen, «Berg (Skogly FK)» → mål (Pakke 72). Mangler i gamle lagringer. */
  toppscorere?: Record<string, number>
  /** Sesongene som var, nyeste sist, høyst 20 (Pakke 72). */
  sesonger?: Sesongoppsummering[]
  /** Cupen denne sesongen og Europa, når du er med (Pakke 73). */
  cup?: Utslag
  europa?: Utslag
  /** TV-penger og premier denne sesongen (Pakke 73). Mangler i gamle lagringer. */
  tv?: number
  premier?: number
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
  /**
   * Pakke 86: kampen spilles direkte gjennom dagen etter at den er avgjort. Rundens
   * resultater (så tabellen kan vises som før runden), det du har sett av tellerne til
   * prestasjonene, og klubbens saker og hendelser som venter til kampen er ferdig.
   */
  sisteRunde?: { dag: number; kamper: Runderesultat[] }
  synlig?: { seire: number; opprykk: number; trofeer: number; europa: boolean }
  ventendeSaker?: Overskrift[]
  /** Supercupen (Pakke 87): seriemesteren mot cupmesteren på dag 1 i sesongen, når du er en av dem. */
  supercup?: { sesong: number; mot: Motlag; hjemme: boolean }
  ventendeHendelser?: Omit<Hendelse, 'sek'>[]
  stadion: Stadionstand
  /**
   * Lagene i hver divisjon, 0–4 (Pakke 66). Din egen divisjon står tom — de
   * lagene er i `lag`, med tabellen. Navnene går igjen fra sesong til sesong.
   */
  serier: Motlag[][]
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
  /** Det du får se: et støyete inntrykk av teamet, 0–2. Blir skarpere for hver runde (Pakke 83). */
  inntrykk: number
  /** Du har betalt for en gransking og ser det sanne teamet og den sanne risikoen (Pakke 83). */
  gransket?: boolean
  status: Startupstatus
  startetSek: number
  /** Når selskapet ble avsluttet, og hva du fikk utbetalt. */
  sluttSek?: number
  utbetalt?: number
}
