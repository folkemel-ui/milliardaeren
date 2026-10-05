/**
 * Versjonsnummeret og endringsloggen. VERSJON må være lik "version" i
 * package.json (en test passer på det). En ny versjon får en ny oppføring
 * øverst i ENDRINGER — den vises én gang som «Nytt i …» for spillere som
 * kommer tilbake, og ligger i loggen under Innstillinger.
 */

export const VERSJON = '1.0.0'

export interface Versjonsoppforing {
  versjon: string
  /** Visningsnavnet: «1.0», «0.5». */
  navn: string
  dato: string
  /** Én setning om hva versjonen handler om. */
  ingress: string
  punkter: string[]
}

export const ENDRINGER: Versjonsoppforing[] = [
  {
    versjon: '1.0.0',
    navn: '1.0',
    dato: 'Oktober 2026',
    ingress: 'Fra saftbod til milliard — nå ferdig.',
    punkter: [
      'Faner som åpner seg etter hvert, og det neste målet alltid øverst.',
      'Statistikk på Profil: hvor inntekten kommer fra, dag for dag.',
      'Finansgrafer med rutenett, datoer og verdien i hver ende.',
      'Børstidende i ny drakt, med logoer for alle aksjer og portretter av rivalene.',
      'Garasje, havn og hangar du kan se, og et stadion som vokser med divisjonen.',
      'Innstillingene samlet, valg for varsler og bevegelse, og bredt oppsett på PC.',
      'Ærligere regnskap: klubbens resultat skattes, og tvangssalg gir tap.',
    ],
  },
  {
    versjon: '0.5.0',
    navn: '0.5',
    dato: 'September 2026',
    ingress: 'Spillet før versjonsnummeret: alt det store var på plass.',
    punkter: [
      'Tretten bransjer fra saftbod til skisenter, med ansatte, ledere, forbedringer og fusjoner.',
      'Aksjer, krypto og indeksfond med kvartalsrapporter, lån og sparekonto.',
      'Eiendom i norske og utenlandske byer, regioner med egne priser, gårder, skog og landemerker.',
      'Luksus og status, en fotballklubb, kunst og oppstartsselskaper.',
      'Fire rivaler på Forbes-lista som kjøper, selger og kan kjøpes opp.',
      'Skatt hver måned, Børstidende hver dag, og tiden du er borte regnes med.',
    ],
  },
]

const NOKKEL = 'milliardaer.versjon'

/** Versjonen du sist så «Nytt i» for, eller null. */
export function settVersjon(): string | null {
  try {
    return localStorage.getItem(NOKKEL)
  } catch {
    return null
  }
}

export function merkVersjonSett(): void {
  try {
    localStorage.setItem(NOKKEL, VERSJON)
  } catch {
    /* uten lagring kommer den bare igjen neste gang */
  }
}

/**
 * Skal «Nytt i»-skjermen vises? Bare for en spiller som har spilt før
 * (minst ti minutter) og ikke har sett denne versjonen. En helt ny spiller
 * får ingen nyheter — alt er nytt — og merkes som oppdatert med en gang.
 */
export function visNyheter(spilletid: number, sett: string | null = settVersjon()): boolean {
  if (sett === VERSJON) return false
  return spilletid >= 600
}
