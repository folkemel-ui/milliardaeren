import { memo, useEffect, useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import { lesAvis } from '../../engine/handlinger'
import type { Avisutgave, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { datotekst } from '../kalender'
import { OppgjorBlokk, oppgjorTittel } from './Oppgjor'
import { Ikon } from './Ikoner'

/** Børstidende: dagens utgave øverst, de forrige under. Å åpne avisen merker den som lest. */
export function Avis({ s, lukk }: { s: Spilltilstand; lukk: () => void }) {
  const utgaver = [...s.avis].reverse()
  const siste = utgaver[0]

  useEffect(() => {
    if (siste && siste.dag > s.avisLest) utfor(lesAvis(s), true)
  }, [siste, s])

  const boks = useRef<HTMLElement>(null)
  useFokusfelle(boks, lukk)

  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <article ref={boks} tabIndex={-1} className="avis" role="dialog" aria-modal="true" aria-label="Børstidende" onClick={(e) => e.stopPropagation()}>
        <header className="avis-hode">
          <button className="avis-lukk" onClick={lukk} aria-label="Lukk avisen">
            ✕
          </button>
          <h1 className="avis-navn">Børstidende</h1>
          <p className="avis-under">{siste ? datotekst(siste.dag, true) : 'Første utgave kommer i morgen tidlig'}</p>
        </header>

        {!siste && <p className="avis-tom">Trykkeriet går i natt. Kom tilbake i morgen for dagens nyheter.</p>}
        {siste && <Utgave utgave={siste} s={s} forside />}

        {utgaver.length > 1 && (
          <>
            <h2 className="avis-tidligere">Tidligere utgaver</h2>
            {utgaver.slice(1).map((u) => (
              <Utgave key={u.dag} utgave={u} s={s} />
            ))}
          </>
        )}
      </article>
    </div>
  )
}

/**
 * Én utgave. En trykket utgave endrer seg aldri, og oppgjørene i den ser bare
 * på eldre oppgjør — så den tegnes bare på nytt når det er en annen utgave.
 */
const Utgave = memo(
  function Utgave({ utgave, s, forside = false }: { utgave: Avisutgave; s: Spilltilstand; forside?: boolean }) {
  const [hoved, ...resten] = utgave.saker
  return (
    <section className={forside ? 'utgave forside' : 'utgave'}>
      {!forside && <h3 className="utgave-dato">{datotekst(utgave.dag)}</h3>}
      {forside ? (
        <>
          <div className={`sak hovedsak ${hoved.type}`}>
            <h2>{hoved.tittel}</h2>
            {hoved.tekst && <p>{hoved.tekst}</p>}
          </div>
          <div className="saker">
            {resten.map((sak, i) => (
              <div key={i} className={`sak ${sak.type}`}>
                <h3>{sak.tittel}</h3>
                {sak.tekst && <p>{sak.tekst}</p>}
              </div>
            ))}
          </div>
          {utgave.oppgjor?.map((o) => (
            <OppgjorBlokk key={o.periode} o={o} s={s} />
          ))}
        </>
      ) : (
        <>
          <ul className="overskrifter">
            {utgave.saker.map((sak, i) => (
              <li key={i} className={sak.type}>
                {sak.tittel}
              </li>
            ))}
          </ul>
          {utgave.oppgjor?.map((o) => (
            <p key={o.periode} className="utgave-oppgjor">
              <Ikon navn="stolper" størrelse={14} /> {oppgjorTittel(o)} — se Regnskap på Profil
            </p>
          ))}
        </>
      )}
    </section>
  )
  },
  (a, b) => a.utgave.dag === b.utgave.dag && a.forside === b.forside,
)
