import { useMemo, useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import type { Velkomst } from '../../state/lager'
import { oppsummer, tapt, TURNERINGSNAVN, vunnet } from '../velkomst'
import { UTFALLTEKST } from '../../engine/kvartal'
import { fortegnKroner, kortKroner, varighet } from '../format'
import type { Mål } from '../varsler'
import { RulleTall } from './RulleTall'
import { Ikon } from './Ikoner'

/** «Velkommen tilbake»: hva som kom inn og hva som skjedde mens du var borte. */
export function Velkomstskjerm({
  v,
  lukk,
  lesAvis,
  seHendelser,
  gåTil,
}: {
  v: Velkomst
  lukk: () => void
  lesAvis: () => void
  seHendelser: () => void
  gåTil: (m: Mål) => void
}) {
  const o = useMemo(() => oppsummer(v.før, v.etter, v.borteSek), [v])
  const kappet = o.borteSek > o.telteSek
  const endring = o.formueEtter - o.formueFor
  // Pakke 98: en kamp vunnet på straffer er en seier, som i cupen.
  const seire = o.kamper.filter(vunnet).length
  const tap = o.kamper.filter(tapt).length
  const uavgjort = o.kamper.length - seire - tap

  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)

  const rad = (navn: string, belop: number) =>
    Math.abs(belop) >= 1 && (
      <div>
        <dt>{navn}</dt>
        <dd className={belop >= 0 ? 'pluss' : 'minus'}>
          <RulleTall verdi={belop} fra={0} format={fortegnKroner} />
        </dd>
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
          <span className="tall-stort">
            <RulleTall verdi={o.formueEtter} fra={o.formueFor} format={kortKroner} />
          </span>
          <span className={endring >= 0 ? 'pluss' : 'minus'}>
            <RulleTall verdi={endring} fra={0} format={fortegnKroner} /> mens du var borte
          </span>
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
                <Ikon navn="avis" størrelse={16} /> {o.nyeAviser} {o.nyeAviser === 1 ? 'ny utgave' : 'nye utgaver'} av Børstidende
              </span>
              <button className="knapp knapp-liten" onClick={lesAvis}>
                Les
              </button>
            </li>
          )}
          {o.kamper.length > 0 && (
            <li className="velkomst-kamper">
              <span>
                <Ikon navn="ball" størrelse={16} /> {o.kamper.length} {o.kamper.length === 1 ? 'kamp' : 'kamper'}: {seire} {seire === 1 ? 'seier' : 'seire'}, {uavgjort} uavgjort, {tap} tap
              </span>
              <button className="knapp knapp-liten" onClick={() => (gåTil('klubb'), lukk())}>
                Klubben
              </button>
              {o.turneringer.length > 1 && (
                <span className="dempet liten velkomst-under">{o.turneringer.map((t) => `${TURNERINGSNAVN[t.turnering]} ${t.antall}`).join(' · ')}</span>
              )}
            </li>
          )}
          {o.racing && (
            <li>
              <span>
                <Ikon navn="trofe" størrelse={16} /> {o.racing.lop} løp: {o.racing.seire} {o.racing.seire === 1 ? 'seier' : 'seire'}, {o.racing.poeng} poeng
              </span>
              <button className="knapp knapp-liten" onClick={() => (gåTil('samling'), lukk())}>
                Racing
              </button>
            </li>
          )}
          {o.tapteAuksjoner.length > 0 && (
            <li className="velkomst-rapporter">
              <span>
                <Ikon navn="diamant" størrelse={16} /> {o.tapteAuksjoner.length === 1 ? 'Tapt på auksjon' : `${o.tapteAuksjoner.length} tapt på auksjon`}
              </span>
              <span className="dempet liten">{o.tapteAuksjoner.map((a) => `${a.navn} gikk til ${a.rival} for ${kortKroner(a.pris)}`).join(' · ')}</span>
            </li>
          )}
          {o.rapporter.length > 0 && (
            <li className="velkomst-rapporter">
              <span>
                <Ikon navn="stolper" størrelse={16} /> Kvartalstall
              </span>
              <span className="dempet liten">{o.rapporter.map((r) => `${r.navn}: ${UTFALLTEKST[r.utfall].toLowerCase()}`).join(' · ')}</span>
            </li>
          )}
          {o.prestasjoner.length > 0 && (
            <li>
              <span>
                <Ikon navn="medalje" størrelse={16} /> {o.prestasjoner.map((p) => p.navn).join(', ')}
              </span>
            </li>
          )}
          {o.hendelser > 0 && (
            <li>
              <span>
                <Ikon navn="bjelle" størrelse={16} /> {o.hendelser} {o.hendelser === 1 ? 'hendelse' : 'hendelser'}
              </span>
              <button className="knapp knapp-liten" onClick={seHendelser}>
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
