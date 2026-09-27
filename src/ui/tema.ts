/**
 * Utseendet: mørkt «luksus»-tema (standard) eller lyst «ren finans»-tema.
 * Et valg per nettleser, ikke en del av spillet — derfor localStorage og ikke
 * lagringen. Settes på <html> før første tegning, så siden ikke blinker.
 */

export type Tema = 'mork' | 'lys'

const NOKKEL = 'milliardaer.tema'
const TEMAFARGE: Record<Tema, string> = { mork: '#0d0c0a', lys: '#f4f5f7' }

export function lesTema(): Tema {
  try {
    return localStorage.getItem(NOKKEL) === 'lys' ? 'lys' : 'mork'
  } catch {
    return 'mork'
  }
}

export function brukTema(tema: Tema): void {
  const rot = document.documentElement
  if (tema === 'lys') rot.dataset.theme = 'light'
  else delete rot.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TEMAFARGE[tema])
}

export function settTema(tema: Tema): void {
  brukTema(tema)
  try {
    localStorage.setItem(NOKKEL, tema)
  } catch {
    /* bare en bekvemmelighet */
  }
}
