import { BEDRIFTSTYPER } from '../../engine/innhold'
import { PAPIRER } from '../../engine/marked'
import type { Oppgjor, Spilltilstand } from '../../engine/types'
import { endring, fortegnKroner, kortKroner, kroner } from '../format'
import { kortDato } from '../kalender'
import { RulleTall } from './RulleTall'
import type { CSSProperties } from 'react'

export function oppgjorTittel(o: Oppgjor): string {
  if (o.periode === 'uke') return `Uka som gikk — ${o.navn}`
  if (o.periode === 'maaned') return `Månedsoppgjøret — ${o.navn}`
  return `Årsoppgjøret ${o.navn}`
}

export function nettoInn(o: Oppgjor): number {
  return o.bedrifter + o.leie + o.utbytte + o.sparerente + (o.gevinster ?? 0) + (o.klubb ?? 0)
}

export function nettoUt(o: Oppgjor): number {
  return o.renter + o.forbruk
}

/** Bredden på en stolpe i prosent, men aldri så smal at den forsvinner. */
const andel = (v: number, maks: number) => (maks > 0 ? Math.max(1.5, (Math.abs(v) / maks) * 100) : 0)

/**
 * Et oppgjør, satt opp som en årsrapport (G7): én stolpe per inntekt og
 * utgift fra samme nullinje — inn til høyre, ut til venstre — og formuen før
 * og etter som to stolper. Det som ikke er kontantstrøm (kurser på aksjer,
 * eiendom og kunst) står på egen linje, så tallene går opp. Pluss beste
 * bedrift, for uker ukas vinner og taper, og for år en sammenligning med året før.
 * Brukes både i avisa og i regnskapet på Profil; utseendet styres av hvor den står.
 * Hvert tall står skrevet ved stolpen, så tabellen og grafen er det samme.
 */
export function OppgjorBlokk({ o, s, medTittel = true }: { o: Oppgjor; s: Spilltilstand; medTittel?: boolean }) {
  const inn = nettoInn(o)
  const ut = nettoUt(o)
  const formueEndring = o.formueEtter - o.formueFor
  const ifjor = o.periode === 'aar' ? s.oppgjor.filter((x) => x.periode === 'aar' && x.tilDag < o.tilDag).at(-1) : undefined

  const rader = (
    [
      ['Bedriftene', o.bedrifter],
      ['Leie og avlinger', o.leie],
      ['Utbytte', o.utbytte],
      ['Sparerente', o.sparerente],
      ['Klubben', o.klubb ?? 0],
      ['Gevinst og tap ved salg', o.gevinster ?? 0],
      ['Lånerenter', -o.renter],
      ['Luksus, lager og ansettelser', -o.forbruk],
    ] as [string, number][]
  ).filter(([, v]) => Math.abs(v) >= 1)
  // Nullinja står der den deler det største inn fra det største ut.
  const størstInn = Math.max(0, ...rader.map(([, v]) => v))
  const størstUt = Math.max(0, ...rader.map(([, v]) => -v))
  const spenn = størstInn + størstUt
  const null_ = spenn > 0 ? (størstUt / spenn) * 100 : 0
  const kurser = formueEndring - (inn - ut)
  const størstFormue = Math.max(Math.abs(o.formueFor), Math.abs(o.formueEtter))

  return (
    <div className="oppgjor">
      {medTittel && <h3 className="oppgjor-tittel">{oppgjorTittel(o)}</h3>}
      <p className="oppgjor-periode">
        {kortDato(o.fraDag)} – {kortDato(o.tilDag)}
      </p>
      <dl className="oppgjor-tall">
        {rader.map(([navn, v]) => (
          <div key={navn} className="med-stolpe">
            <dt>{navn}</dt>
            <dd className={v >= 0 ? 'pluss' : 'minus'}>
              <span>
                <RulleTall verdi={v} fra={0} format={fortegnKroner} />
              </span>
              <span className="oppgjor-stolpe" aria-hidden="true" style={{ '--null': `${null_}%` } as CSSProperties}>
                <span
                  className={v >= 0 ? 'inn' : 'ut'}
                  style={{ left: `${v >= 0 ? null_ : null_ - andel(v, spenn)}%`, width: `${andel(v, spenn)}%` }}
                />
              </span>
            </dd>
          </div>
        ))}
        <div className="sum">
          <dt>Netto</dt>
          <dd className={inn - ut >= 0 ? 'pluss' : 'minus'}>
            <RulleTall verdi={inn - ut} fra={0} format={fortegnKroner} />
          </dd>
        </div>
        {Math.abs(kurser) >= 1 && (
          <div>
            <dt>Kurser, verdier og annet</dt>
            <dd className={kurser >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(kurser)}</dd>
          </div>
        )}
      </dl>
      <dl className="oppgjor-formue">
        <dt>Formue før</dt>
        <dd className="oppgjor-stolpe" aria-hidden="true">
          <span className={o.formueFor >= 0 ? 'for' : 'ut'} style={{ width: `${andel(o.formueFor, størstFormue)}%` }} />
        </dd>
        <dd>{kortKroner(o.formueFor)}</dd>
        <dt>Formue etter</dt>
        <dd className="oppgjor-stolpe" aria-hidden="true">
          <span className={o.formueEtter >= 0 ? 'etter' : 'ut'} style={{ width: `${andel(o.formueEtter, størstFormue)}%` }} />
        </dd>
        <dd>
          <RulleTall verdi={o.formueEtter} fra={o.formueFor} format={kortKroner} />
        </dd>
        <dt>Endring</dt>
        <dd className={`oppgjor-endring ${formueEndring >= 0 ? 'pluss' : 'minus'}`}>
          {fortegnKroner(formueEndring)} ({endring(o.formueFor > 0 ? formueEndring / o.formueFor : 0)})
        </dd>
      </dl>
      {o.besteBedrift && (
        <p className="oppgjor-merknad">
          Beste bedrift: <strong>{BEDRIFTSTYPER[o.besteBedrift.type].navn}</strong> med {kroner(o.besteBedrift.tjent)}.
        </p>
      )}
      {o.vinner && o.taper && (
        <p className="oppgjor-merknad">
          Ukas vinner på børsen: <strong>{PAPIRER[o.vinner.id].navn}</strong> ({endring(o.vinner.endring)}). Ukas taper:{' '}
          <strong>{PAPIRER[o.taper.id].navn}</strong> ({endring(o.taper.endring)}).
        </p>
      )}
      {ifjor && (
        <p className="oppgjor-merknad">
          Året før ga netto {fortegnKroner(nettoInn(ifjor) - nettoUt(ifjor))} — i år{' '}
          {inn - ut >= nettoInn(ifjor) - nettoUt(ifjor) ? 'bedre' : 'svakere'}.
        </p>
      )}
    </div>
  )
}
