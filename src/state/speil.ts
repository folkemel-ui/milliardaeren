/**
 * Lagringen speilet i en fil (Pakke 97), for appen i App Store og Google Play.
 *
 * I en nettleser bor spillet i localStorage, og Pakke 95 ber om at det ikke slettes.
 * I en innebygd app (et Capacitor-skall rundt det samme bygget) kan iOS likevel tømme
 * webvisningens lagring når telefonen er full. Der skrives derfor hver lagring også til
 * en fil i appens egen mappe, og starter spillet uten lagring, hentes den derfra.
 *
 * Ingen avhengighet: skallet har programtillegget `@capacitor/filesystem`, og spillet
 * finner det på `window.Capacitor` mens det kjører. I nettleseren finnes det ikke, og
 * alt her er en tom operasjon.
 */

/** Den delen av Capacitors Filesystem som brukes her. */
export interface Filsystem {
  readFile(o: { path: string; directory: string; encoding: string }): Promise<{ data: string | Blob }>
  writeFile(o: { path: string; data: string; directory: string; encoding: string; recursive?: boolean }): Promise<unknown>
}

interface Capacitor {
  isNativePlatform?: () => boolean
  Plugins?: { Filesystem?: Filsystem }
  registerPlugin?: (navn: string) => unknown
}

/** Fila, i appens datamappe (Capacitors `Directory.Data`), som ikke er synlig for brukeren. */
export const SPEILFIL = { path: 'milliardaer/lagring.json', directory: 'DATA', encoding: 'utf8' }

/** Det fila holder: lagringen slik den står i localStorage, og når den ble skrevet. */
export interface Speilet {
  versjon: 1
  lagring: string
  sistAktiv: number
}

/** Filsystemet når spillet kjører i en innebygd app, ellers null. */
export function filsystem(): Filsystem | null {
  const c = (globalThis as { Capacitor?: Capacitor }).Capacitor
  if (!c?.isNativePlatform?.()) return null
  return c.Plugins?.Filesystem ?? ((c.registerPlugin?.('Filesystem') as Filsystem | undefined) ?? null)
}

/*
 * Skrivingen er sperret til lesingen ved start er ferdig: et spill som starter tomt
 * (iOS har tømt lagringen) skal aldri skrive det nye, tomme spillet over fila før vi
 * har lest den. Én skriving om gangen; kommer det flere mens én pågår, skrives bare den siste.
 */
let sperret = false
let skriver = false
let neste: string | null = null

function skriv(fs: Filsystem, data: string): void {
  if (skriver) {
    neste = data
    return
  }
  skriver = true
  fs.writeFile({ ...SPEILFIL, data, recursive: true })
    .catch(() => {
      /* full disk eller ingen tilgang: localStorage har spillet uansett */
    })
    .finally(() => {
      skriver = false
      const d = neste
      neste = null
      if (d !== null && !sperret) skriv(fs, d)
    })
}

/** Speiler lagringen til fila. Kalles etter hver vellykket lagring; gjør ingenting i nettleseren. */
export function speil(lagring: string, sistAktiv: number): void {
  const fs = filsystem()
  if (!fs || sperret) return
  const innhold: Speilet = { versjon: 1, lagring, sistAktiv }
  skriv(fs, JSON.stringify(innhold))
}

/**
 * Leser fila når spillet startet uten lagring. Gir det som sto der, eller null (i nettleseren,
 * uten fil, eller en fil som ikke kan leses). Sperrer skrivingen fra kallet og til svaret er
 * her; gir den noe, forblir den sperret, for da lastes siden på nytt med lagringen fra fila.
 */
export async function hentFraSpeil(): Promise<Speilet | null> {
  const fs = filsystem()
  if (!fs) return null
  sperret = true
  try {
    const { data } = await fs.readFile(SPEILFIL)
    const tekst = typeof data === 'string' ? data : await data.text()
    const s = JSON.parse(tekst) as Partial<Speilet>
    if (s.versjon !== 1 || typeof s.lagring !== 'string' || typeof s.sistAktiv !== 'number') throw new Error('ukjent fil')
    return s as Speilet
  } catch {
    sperret = false
    return null
  }
}

/** Slipper sperren uten å laste på nytt (fila var ikke et spill lageret kan bruke). */
export function slippSpeil(): void {
  sperret = false
}
