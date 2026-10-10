/**
 * Markedet i dag (Pakke 75): det som gjør at bedriftene tjener mer eller
 * mindre i dag, som linjer til arket bak «Markedet i dag ›» — og hvor mange
 * av dem som er noe utenom det vanlige (en helligdag, en het eller kald
 * bransje, høy- eller lavkonjunktur). Rent, så det kan testes.
 */

import { BEDRIFTSTYPER } from '../engine/innhold'
import { dagnummer } from '../engine/kalender'
import { dagsbilde, fase, FASER, styringsrente, VAERTYPER } from '../engine/verden'
import type { Spilltilstand } from '../engine/types'
import { tall } from './format'
import { datotekst } from './kalender'

export interface Markedslinje {
  navn: string
  verdi: string
  /** Merkets farge: gull for det gode, fare for det kalde, varsel for lavkonjunktur. */
  merke?: 'gull' | 'ok' | 'fare' | 'varsel'
  /** Noe utenom det vanlige — teller i tallet på linja. */
  spesiell: boolean
}

const stor = (t: string) => t[0].toUpperCase() + t.slice(1)

export function markedetIDag(s: Spilltilstand): { dato: string; linjer: Markedslinje[]; spesielle: number } {
  const d = dagsbilde(s)
  const f = fase(s)
  const linjer: Markedslinje[] = [{ navn: 'Været', verdi: VAERTYPER[d.vaer].navn, spesiell: false }]
  if (d.helligdag) linjer.push({ navn: 'Helligdag', verdi: d.helligdag.navn, merke: 'gull', spesiell: true })
  if (d.trend.het) linjer.push({ navn: 'Het bransje', verdi: BEDRIFTSTYPER[d.trend.het].navn, merke: 'ok', spesiell: true })
  if (d.trend.kald) linjer.push({ navn: 'Kald bransje', verdi: BEDRIFTSTYPER[d.trend.kald].navn, merke: 'fare', spesiell: true })
  linjer.push({
    navn: 'Konjunktur',
    verdi: `${FASER[f].navn} · rente ${tall(styringsrente(s), 1).replace(/,0$/, '')} %`,
    merke: f === 'hoy' ? 'ok' : f === 'lav' ? 'varsel' : undefined,
    spesiell: f !== 'normal',
  })
  return { dato: stor(datotekst(dagnummer(s.sek))), linjer, spesielle: linjer.filter((l) => l.spesiell).length }
}
