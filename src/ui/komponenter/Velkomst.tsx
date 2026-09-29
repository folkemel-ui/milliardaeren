import { useMemo, useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import type { Velkomst } from '../../state/lager'
import { oppsummer } from '../velkomst'
import { UTFALLTEKST } from '../../engine/kvartal'
import { fortegnKroner, kortKroner, varighet } from '../format'
import type { Fane } from './Fanemeny'

/** «Velkommen tilbake»: hva som kom inn og hva som skjedde mens du var borte. */
export function Velkomstskjerm({
  v,
  lukk,
  lesAvis,
  gåTil,
}: {
  v: Velkomst
  lukk: () => void
  lesAvis: () => void
  gåTil: (f: Fane) => void
}) {
  const o = useMemo(() => oppsummer(v.før, v.etter, v.borteSek), [v])
  const kappet = o.borteSek > o.telteSek
  const endring = o.formueEtter - o.formueFor
  const seire = o.kamper.filter((k) => k.maalFor > k.maalMot).length
  const uavgjort = o.kamper.filter((k) => k.maalFor === k.maalMot).length
  const tap = o.kamper.length - seire - uavgjort

  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)

  const rad = (navn: string, belop: number) =>
    Math.abs(belop) >= 1 && (
      <div>
        <dt>{navn}</dt>
        <dd className={belop >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(belop)}</dd>
      </div>
    )

  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div ref={boks} tabIndex={-1} className="velkomst" role="dialog" aria-modal="true" aria-label="Velkommen tilbake" onClick={(e) => e.stopPropagation()}>
        <h1 className="velkomst-tittel">Velkommen tilbake!</h1>
        <p className="dempet">
          Du var borte i {varighet(o.borteSek)}.
          {kappet
            ? ` Tiden telles bare opp til ${varighet(o.telteSek)}, og bedrifter uten leder sto stille.`
            : ' Bedrifter uten leder sto stille så lenge.'}
        </p>

        <div className="velkomst-formue">
          <span className="etikett">Nettoformue</span>
          <span className="tall-stort">{kortKroner(o.formueEtter)}</span>
          <span className={endring >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(endring)} mens du var borte</span>
        </div>

        <dl className="velkomst-tall">
          {rad('Bedriftene', o.bedrifter)}
          {rad('Leie og avlinger', o.leie)}
          {rad('Utbytte', o.utbytte)}
          {rad('Lånerenter', -o.renter)}
          {rad('Kurser, lønn og annet', endring - o.bedrifter - o.leie - o.utbytte + o.renter)}
        </dl>

        <ul className="velkomst-liste">
          {o.nyeAviser > 0 && (
            <li>
              <span>
                📰 {o.nyeAviser} {o.nyeAviser === 1 ? 'ny utgave' : 'nye utgaver'} av Børstidende
              </span>
              <button className="knapp knapp-liten" onClick={lesAvis}>
                Les
              </button>
            </li>
          )}
          {o.kamper.length > 0 && (
            <li>
              <span>
                ⚽ {o.kamper.length} {o.kamper.length === 1 ? 'kamp' : 'kamper'}: {seire} {seire === 1 ? 'seier' : 'seire'}, {uavgjort} uavgjort, {tap} tap
              </span>
              <button className="knapp knapp-liten" onClick={() => (gåTil('luksus'), lukk())}>
                Klubben
              </button>
            </li>
          )}
          {o.rapporter.length > 0 && (
            <li className="velkomst-rapporter">
              <span>📊 Kvartalstall</span>
              <span className="dempet liten">{o.rapporter.map((r) => `${r.navn}: ${UTFALLTEKST[r.utfall].toLowerCase()}`).join(' · ')}</span>
            </li>
          )}
          {o.prestasjoner.length > 0 && (
            <li>
              <span>🏅 {o.prestasjoner.map((p) => `${p.emoji} ${p.navn}`).join(', ')}</span>
            </li>
          )}
          {o.hendelser > 0 && (
            <li>
              <span>
                🔔 {o.hendelser} {o.hendelser === 1 ? 'hendelse' : 'hendelser'}
              </span>
              <button className="knapp knapp-liten" onClick={() => (gåTil('investeringer'), lukk())}>
                Se
              </button>
            </li>
          )}
        </ul>

        <button className="knapp knapp-gull bred" onClick={lukk}>
          Fortsett
        </button>
      </div>
    </div>
  )
}
