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
}
