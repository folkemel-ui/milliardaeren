import { useEffect } from 'react'
import { lesAvis } from '../../engine/handlinger'
import type { Avisutgave, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { datotekst } from '../kalender'

/** Børstidende: dagens utgave øverst, de forrige under. Å åpne avisen merker den som lest. */
export function Avis({ s, lukk }: { s: Spilltilstand; lukk: () => void }) {
  const utgaver = [...s.avis].reverse()
  const siste = utgaver[0]

  useEffect(() => {
    if (siste && siste.dag > s.avisLest) utfor(lesAvis(s))
  }, [siste, s])

  useEffect(() => {
    const vedTast = (e: KeyboardEvent) => e.key === 'Escape' && lukk()
    window.addEventListener('keydown', vedTast)
    return () => window.removeEventListener('keydown', vedTast)
  }, [lukk])

  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <article className="avis" role="dialog" aria-modal="true" aria-label="Børstidende" onClick={(e) => e.stopPropagation()}>
        <header className="avis-hode">
          <button className="avis-lukk" onClick={lukk} aria-label="Lukk avisen">
            ✕
          </button>
          <h1 className="avis-navn">Børstidende</h1>
          <p className="avis-under">{siste ? datotekst(siste.dag, true) : 'Første utgave kommer i morgen tidlig'}</p>
        </header>

        {!siste && <p className="avis-tom">Trykkeriet går i natt. Kom tilbake i morgen for dagens nyheter.</p>}
        {siste && <Utgave utgave={siste} forside />}

        {utgaver.length > 1 && (
          <>
            <h2 className="avis-tidligere">Tidligere utgaver</h2>
            {utgaver.slice(1).map((u) => (
              <Utgave key={u.dag} utgave={u} />
            ))}
          </>
        )}
      </article>
    </div>
  )
}

function Utgave({ utgave, forside = false }: { utgave: Avisutgave; forside?: boolean }) {
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
        </>
      ) : (
        <ul className="overskrifter">
          {utgave.saker.map((sak, i) => (
            <li key={i} className={sak.type}>
              {sak.tittel}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
