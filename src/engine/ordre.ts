/**
 * Automatiske ordre: kjøp når kursen faller til en grense, selg når den
 * stiger til en grense (gevinstsikring), eller selg når den faller til en
 * grense (stopp-tap). Sjekkes ved hvert markedstikk — også mens du er borte.
 */

import { leggTilHendelse } from './bank'
import { maksKjop } from './formler'
import { utforKjop, utforSalg } from './handel'
import { erHelg } from './kalender'
import { maksPerOrdre, PAPIRER, rundAntall } from './marked'
import type { Ordre, Spilltilstand } from './types'
import { kortKroner } from './tall'

export const ORDRETYPER: Record<Ordre['type'], { navn: string; forklaring: string }> = {
  kjop: { navn: 'Kjøp på vei ned', forklaring: 'Kjøper når kursen har falt til grensen' },
  'selg-over': { navn: 'Sikre gevinst', forklaring: 'Selger når kursen har steget til grensen' },
  'selg-under': { navn: 'Stopp tap', forklaring: 'Selger når kursen har falt til grensen' },
}

function utløst(o: Ordre, kurs: number): boolean {
  return o.type === 'selg-over' ? kurs >= o.grense : kurs <= o.grense
}

/** Utfører ordre som er utløst. Muterer — brukes på kopier. */
export function sjekkOrdre(s: Spilltilstand): void {
  if (!s.ordre?.length) return
  const igjen: Ordre[] = []
  for (const o of s.ordre) {
    const p = PAPIRER[o.papir]
    const kurs = s.marked.kurser[o.papir].kurs
    // Aksjeordre venter når børsen er stengt.
    if (!utløst(o, kurs) || (p.klasse === 'aksje' && erHelg(s.sek))) {
      igjen.push(o)
      continue
    }
    if (o.type === 'kjop') {
      // En ordre som ville mer enn doblet kursen, tas i biter: resten venter til kursen er nede igjen.
      const antall = Math.min(o.antall, maksPerOrdre(s, o.papir, 'kjop'))
      // Har du ikke råd til biten, venter ordren til du har det.
      if (antall <= 0 || antall > maksKjop(s, o.papir)) {
        igjen.push(o)
        continue
      }
      const kostnad = utforKjop(s, o.papir, antall)
      const rest = rundAntall(o.papir, o.antall - antall + 1e-9)
      if (rest > 0) igjen.push({ ...o, antall: rest })
      leggTilHendelse(s, { tittel: 'Ordre utført', tekst: `Kjøpte ${antall} ${p.navn} for ${kortKroner(kostnad)}.`, alvor: 'info' })
    } else {
      const eier = s.beholdning[o.papir]?.antall ?? 0
      // Eier du ingenting lenger, er ordren meningsløs og fjernes.
      if (eier <= 0) continue
      const ønsket = Math.min(o.antall, eier)
      // Et salg som ville mer enn halvert kursen, tas i biter som et kjøp.
      const antall = Math.min(ønsket, maksPerOrdre(s, o.papir, 'selg'))
      if (antall <= 0) {
        igjen.push(o)
        continue
      }
      const inntekt = utforSalg(s, o.papir, antall)
      const rest = rundAntall(o.papir, ønsket - antall + 1e-9)
      if (rest > 0) igjen.push({ ...o, antall: rest })
      leggTilHendelse(s, {
        tittel: o.type === 'selg-over' ? 'Gevinst sikret' : 'Stopp tap utløst',
        tekst: `Solgte ${antall} ${p.navn} for ${kortKroner(inntekt)}.`,
        alvor: o.type === 'selg-over' ? 'info' : 'advarsel',
      })
    }
  }
  s.ordre = igjen
}
