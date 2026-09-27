/**
 * Spilltilstanden. Alt som lagres, bor her — og alt her må kunne gå gjennom
 * JSON uten tap. Endres formen, bumpes SPILLVERSJON og en migrering skrives.
 */

export type BedriftstypeId =
  | 'saftbod'
  | 'polsebod'
  | 'kiosk'
  | 'kafe'
  | 'restaurant'
  | 'hotell'
  | 'bank'
  | 'oljeselskap'

export interface Bedriftstype {
  id: BedriftstypeId
  navn: string
  /** Midlertidig ikon til SVG-ikonene kommer. */
  emoji: string
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
}

// ─────────────────────────────────────────────── Markedet

export type PapirId =
  | 'NFS' | 'FJK' | 'VTK' | 'BSH' | 'POL' | 'NLT' | 'AUB' | 'TRS'
  | 'BMT' | 'FJD' | 'NSL' | 'TRM' | 'VKT' | 'LKS'

export type Risiko = 'lav' | 'middels' | 'høy'

/** En aksje eller en kryptomynt. Rater er per time spilltid. */
export interface Papir {
  id: PapirId
  navn: string
  klasse: 'aksje' | 'krypto'
  risiko: Risiko
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
}

export interface Kurs {
  kurs: number
  fundament: number
  /** Logaritmisk avvik fra fundamentet: kurs = fundament · e^avvik. */
  avvik: number
  /** Kursen hvert 30. sekund, de siste to timene. */
  historikk: number[]
}

export interface Marked {
  tikk: number
  /** Kryptostemningen, fra −1 (frykt) til 1 (grådighet). */
  stemning: number
  kurser: Record<PapirId, Kurs>
  /** Eiendomsindeksen: starter på 1, og alle eiendomsverdier og leier ganges med den. */
  eiendom: Kurs
}

export interface Beholdning {
  antall: number
  /** Samlet kostpris, inkludert kurtasje. Gir snittpris og gevinst. */
  kostpris: number
}

// ─────────────────────────────────────────────── Eiendom og luksus

export type EiendomId =
  | 'hybel' | 'leilighet' | 'rekkehus' | 'hytte'
  | 'kontorbygg' | 'kjopesenter' | 'naeringsbygg' | 'oy'

export interface Eiendomstype {
  id: EiendomId
  navn: string
  sted: string
  emoji: string
  /** Pris når eiendomsindeksen står på 1. */
  pris: number
  /** Leie per time, som andel av prisen. Følger indeksen. */
  avkastning: number
  /** Så mange kan du eie av typen. */
  maksAntall: number
  /** Statusnivået som kreves for å få kjøpe. */
  statuskrav: number
}

export type LuksusKategori = 'bil' | 'klokke' | 'baat' | 'fly'

export type LuksusId =
  | 'stasjonsvogn' | 'elbil' | 'superbil' | 'hyperbil'
  | 'gullklokke' | 'mesterverk' | 'diamantklokke'
  | 'snekke' | 'motorbaat' | 'superyacht'
  | 'propellfly' | 'forretningsjet' | 'langdistansejet'

export interface Luksusgjenstand {
  id: LuksusId
  navn: string
  kategori: LuksusKategori
  emoji: string
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
}

/** Et øyeblikksbilde ved forrige dagsskifte, så avisen kan melde hva som har endret seg. */
export interface Dagsbilde {
  kurser: Record<PapirId, number>
  eiendomsindeks: number
  bedrifter: BedriftstypeId[]
  eiendommer: number
  luksus: LuksusId[]
  sek: number
}

export interface Rekorder {
  hoyesteInntekt: number
  storsteHandel: number
  storsteGevinst: number
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
  marked: Marked
  beholdning: Partial<Record<PapirId, Beholdning>>
  gjeld: number
  totaltUtbytte: number
  /** Siste hendelser, nyeste sist. Kappet i lengde. */
  hendelser: Hendelse[]
  /** Antall eiendommer du eier av hver type. */
  eiendommer: Partial<Record<EiendomId, number>>
  totaltLeie: number
  /** Luksusgjenstandene du eier. Én av hver. */
  luksus: LuksusId[]
  /** Plasser i garasjen, havna og hangaren. */
  lager: Record<LagerId, number>
  /** De siste utgavene av avisen, nyeste sist. */
  avis: Avisutgave[]
  /** Dagen i den nyeste utgaven du har lest. */
  avisLest: number
  forrigeDag: Dagsbilde
  /** Prestasjonene du har klart, med spillsekundet de kom. */
  prestasjoner: Record<string, number>
  rekorder: Rekorder
}
