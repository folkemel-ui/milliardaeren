/**
 * Kvartalsrapporter: hvert selskap legger frem tall én gang i måneden, på en
 * fast dag — eller første børsdag etter, hvis den faller på en helg. Noen
 * dager før kommer analytikernes estimat: svakt, som i fjor, eller sterkt.
 *
 * Resultatet ligger rundt estimatet, men med overraskelser begge veier. Det
 * er overraskelsen som flytter kursen: bedre enn ventet løfter den, svakere
 * enn ventet senker den, og utbyttet følger med. Bevegelsen prises inn de
 * første minuttene børsen er åpen, som selskapsnyhetene.
 *
 * Estimater og resultater trekkes fra selskapet og datoen, ikke fra
 * terningen — så kalenderen kan vise dem på forhånd, og de er like hver gang.
 */

import { dagFra, dato, erHelg, DAG_SEK, dagnummer } from './kalender'
import { AKSJER, MARKED_TIKK_SEK, PAPIRER } from './marked'
import { hashTekst, tilfeldig } from './rng'
import type { Estimat, Kvartal, Overskrift, PapirId, Rapport, Spilltilstand } from './types'

/**
 * Dagen i måneden hvert selskap legger frem tall — spredt, så det skjer noe
 * hver tredje dag. De som ble børsnotert i versjon 17, fyller hullene; alle
 * dagene finnes også i februar. Hver aksje må ha en dag her.
 */
export const RAPPORTDAG: Partial<Record<PapirId, number>> = {
  NFS: 4, FJK: 7, VTK: 10, BSH: 13, POL: 16, NLT: 19, AUB: 22, TRS: 25,
  NRB: 2, KRV: 11, FJF: 17, ROM: 26,
}
/** Estimatet kommer så mange dager før. */
export const ESTIMAT_DAGER = 3
/** Overraskelsen (−0,4 til 0,4) ganger dette er kursbevegelsen. */
const KURSVIRKNING = 0.3
/** Overraskelser mindre enn dette regnes som «som ventet». */
const GRENSE = 0.08
/** Bevegelsen prises inn over like lang tid som en selskapsnyhet. */
const INNPRISING_TIKK = 180 / MARKED_TIKK_SEK

export const ESTIMATTEKST = ['Svakt', 'Som i fjor', 'Sterkt'] as const
/** Estimatet i en setning: «Analytikerne venter …». */
const ESTIMATSETNING = ['et svakt kvartal', 'et kvartal på linje med i fjor', 'et sterkt kvartal'] as const
export const UTFALLTEKST = { bedre: 'Bedre enn ventet', ventet: 'Som ventet', svakere: 'Svakere enn ventet' } as const

/** Rapportdagen i en måned: den faste datoen, eller første børsdag etter. */
export function rapportdagI(id: PapirId, aar: number, maaned: number): number {
  let d = dagFra(aar, maaned, RAPPORTDAG[id]!)
  while (erHelg(d * DAG_SEK)) d++
  return d
}

/** Første rapportdag på eller etter en dag. */
export function nesteRapport(id: PapirId, fra: number): number {
  const { aar, maaned } = dato(fra)
  const denne = rapportdagI(id, aar, maaned)
  if (denne >= fra) return denne
  return rapportdagI(id, maaned === 11 ? aar + 1 : aar, (maaned + 1) % 12)
}

export function estimat(id: PapirId, rapportdag: number): Estimat {
  return Math.min(2, Math.floor(tilfeldig(hashTekst(`estimat:${id}:${rapportdag}`)) * 3)) as Estimat
}

/** Resultatet og hvor mye det overrasket, for en rapportdag. */
export function resultat(id: PapirId, rapportdag: number): { overraskelse: number; utfall: Rapport['utfall'] } {
  const forventet = (estimat(id, rapportdag) + 0.5) / 3
  const faktisk = Math.max(0, Math.min(1, forventet + (tilfeldig(hashTekst(`resultat:${id}:${rapportdag}`)) - 0.5) * 0.8))
  const overraskelse = faktisk - forventet
  return { overraskelse, utfall: overraskelse > GRENSE ? 'bedre' : overraskelse < -GRENSE ? 'svakere' : 'ventet' }
}

/** Utgangspunktet: vanlig utbytte og ingen rapport ennå, for hver aksje. */
export function nyeKvartal(): Partial<Record<PapirId, Kvartal>> {
  return Object.fromEntries(AKSJER.map((id) => [id, { utbytteFaktor: 1, siste: null }]))
}

export function kvartalFor(s: Spilltilstand, id: PapirId): Kvartal {
  return s.kvartal?.[id] ?? { utbytteFaktor: 1, siste: null }
}

/** Utbyttet per børsdag for en aksje, med kvartalsjusteringen. */
export function utbytteFor(s: Spilltilstand, id: PapirId): number {
  return PAPIRER[id].utbytte * kvartalFor(s, id).utbytteFaktor
}

/**
 * Rapportene de neste dagene, sortert på dato — til kalenderen. Dagens
 * rapporter kom ved dagsskiftet, så kalenderen starter i morgen.
 */
export function rapportkalender(s: Spilltilstand, dager = 14): { id: PapirId; dag: number; estimat: Estimat | null }[] {
  const i_dag = dagnummer(s.sek)
  return AKSJER.map((id) => {
    const dag = nesteRapport(id, i_dag + 1)
    return { id, dag, estimat: dag - i_dag <= ESTIMAT_DAGER ? estimat(id, dag) : null }
  })
    .filter((r) => r.dag - i_dag <= dager)
    .sort((a, b) => a.dag - b.dag)
}

/**
 * Dagsskiftet: selskaper som har rapportdag i dag, legger frem tall, og
 * estimatene for dem som rapporterer om ESTIMAT_DAGER dager, kommer i avisa.
 * Muterer — brukes på kopier.
 */
export function kvartalVedDagsskifte(s: Spilltilstand): Overskrift[] {
  if (!s.kvartal) return []
  const d = dagnummer(s.sek)
  const saker: Overskrift[] = []
  for (const id of AKSJER) {
    const navn = PAPIRER[id].navn
    if (nesteRapport(id, d) === d) {
      const est = estimat(id, d)
      const { overraskelse, utfall } = resultat(id, d)
      const endring = Math.exp(overraskelse * KURSVIRKNING) - 1
      const k = s.marked.kurser[id]
      k.nyhet = { igjen: (k.nyhet?.igjen ?? 0) + overraskelse * KURSVIRKNING, tikk: INNPRISING_TIKK }
      const kv = kvartalFor(s, id)
      s.kvartal[id] = { utbytteFaktor: Math.max(0.5, Math.min(2, kv.utbytteFaktor * (1 + overraskelse))), siste: { dag: d, estimat: est, utfall, endring } }
      saker.push({
        type: 'marked',
        tittel: `${navn}: ${UTFALLTEKST[utfall].toLowerCase()}`,
        tekst:
          utfall === 'bedre'
            ? 'Kvartalstallene slo analytikernes estimat. Kursen ventes å stige, og utbyttet økes.'
            : utfall === 'svakere'
              ? 'Kvartalstallene skuffet. Kursen ventes å falle, og utbyttet kuttes.'
              : 'Kvartalstallene var omtrent som ventet. Markedet trekker på skuldrene.',
      })
    }
    const kommende = nesteRapport(id, d + 1)
    if (kommende - d === ESTIMAT_DAGER) {
      saker.push({ type: 'marked', tittel: `${navn} legger frem tall om ${ESTIMAT_DAGER} dager`, tekst: `Analytikerne venter ${ESTIMATSETNING[estimat(id, kommende)]}.` })
    }
  }
  return saker
}
