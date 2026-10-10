/**
 * Versjonsnummeret. VERSJON må være lik "version" i package.json (en test
 * passer på det). En ny versjon får en ny oppføring øverst i ENDRINGER i
 * `komponenter/ved-behov/Endringslogg.ts` — den vises én gang som «Nytt i …»
 * for spillere som kommer tilbake, og ligger i loggen under Innstillinger.
 * Loggen er tekst nok til å telle i startskriptet, så den hentes ved behov
 * (Pakke 70; budsjettet i startskript.test.ts).
 */

export const VERSJON = '2.6.0'

export interface Versjonsoppforing {
  versjon: string
  /** Visningsnavnet: «1.0», «0.5». */
  navn: string
  dato: string
  /** Én setning om hva versjonen handler om. */
  ingress: string
  punkter: string[]
}

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
