/**
 * Dag og natt på kartene (Pakke 46), etter klokka i spillet: et døgn går på
 * DAG_SEK sekunder. Mørket kommer gradvis fra kl. 18 til 21, står til kl. 5
 * og letter igjen til kl. 8. Ren funksjon, så den kan testes.
 */

import { DAG_SEK } from '../engine/kalender'

/** Klokka som desimaltime, 0–24. */
export function time(sek: number): number {
  return (((sek % DAG_SEK) + DAG_SEK) % DAG_SEK / DAG_SEK) * 24
}

/** Hvor mørkt det er: 0 midt på dagen, 1 om natta, glidende i skumringen og grålysningen. */
export function morke(sek: number): number {
  const t = time(sek)
  if (t >= 21 || t < 5) return 1
  if (t >= 18) return (t - 18) / 3
  if (t < 8) return 1 - (t - 5) / 3
  return 0
}

export type Dognet = 'morgen' | 'dag' | 'kveld' | 'natt'

/** Tiden på døgnet med ord, til skjermlesere og teksten under kartet. */
export function dognet(sek: number): Dognet {
  const t = time(sek)
  if (t >= 21 || t < 5) return 'natt'
  if (t >= 18) return 'kveld'
  if (t < 8) return 'morgen'
  return 'dag'
}

/**
 * Natta til den store scenen i en detaljvisning (G10): `--natt` på siden rundt,
 * så tegningen mørkner i CSS og ikke tegnes på nytt hvert sekund.
 */
export function nattstil(sek: number): Record<string, string> {
  return { '--natt': morke(sek).toFixed(2) }
}
