import { BEDRIFTSTYPER } from '../../engine/innhold'
import { PAPIRER } from '../../engine/marked'
import type { Oppgjor, Spilltilstand } from '../../engine/types'
import { endring, fortegnKroner, kroner } from '../format'
import { kortDato } from '../kalender'

export function oppgjorTittel(o: Oppgjor): string {
  if (o.periode === 'uke') return `Uka som gikk — ${o.navn}`
  if (o.periode === 'maaned') return `Månedsoppgjøret — ${o.navn}`
  return `Årsoppgjøret ${o.navn}`
}

export function nettoInn(o: Oppgjor): number {
  return o.bedrifter + o.leie + o.utbytte + o.sparerente
}

export function nettoUt(o: Oppgjor): number {
  return o.renter + o.forbruk
}

/**
 * Et oppgjør: inntekter, utgifter, formuen før og etter, beste bedrift — og
 * for uker ukas vinner og taper, for år en sammenligning med året før.
 * Brukes både i avisa og i regnskapet på Profil; utseendet styres av hvor den står.
 */
export function OppgjorBlokk({ o, s, medTittel = true }: { o: Oppgjor; s: Spilltilstand; medTittel?: boolean }) {
  const inn = nettoInn(o)
  const ut = nettoUt(o)
  const formueEndring = o.formueEtter - o.formueFor
  const ifjor = o.periode === 'aar' ? s.oppgjor.filter((x) => x.periode === 'aar' && x.tilDag < o.tilDag).at(-1) : undefined

  const rader: [string, number][] = [
    ['Bedriftene', o.bedrifter],
    ['Leie og avlinger', o.leie],
    ['Utbytte', o.utbytte],
    ['Sparerente', o.sparerente],
    ['Lånerenter', -o.renter],
    ['Luksus og lager', -o.forbruk],
  ]

  return (
    <div className="oppgjor">
      {medTittel && <h3 className="oppgjor-tittel">{oppgjorTittel(o)}</h3>}
      <p className="oppgjor-periode">
        {kortDato(o.fraDag)} – {kortDato(o.tilDag)}
      </p>
      <dl className="oppgjor-tall">
        {rader
          .filter(([, v]) => Math.abs(v) >= 1)
          .map(([navn, v]) => (
            <div key={navn}>
              <dt>{navn}</dt>
              <dd className={v >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(v)}</dd>
            </div>
          ))}
        <div className="sum">
          <dt>Netto</dt>
          <dd className={inn - ut >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(inn - ut)}</dd>
        </div>
        <div className="sum">
          <dt>Nettoformue</dt>
          <dd>
            {kroner(o.formueFor)} → {kroner(o.formueEtter)}{' '}
            <span className={formueEndring >= 0 ? 'pluss' : 'minus'}>
              ({endring(o.formueFor > 0 ? formueEndring / o.formueFor : 0)})
            </span>
          </dd>
        </div>
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
