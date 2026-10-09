import { memo, useEffect, useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import { lesAvis } from '../../engine/handlinger'
import type { Avisutgave, MaleriId, Overskrift, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { datotekst } from '../kalender'
import { tall } from '../format'
import { OppgjorBlokk, oppgjorTittel } from './Oppgjor'
import { UkaDi } from './UkaDi'
import { Ikon } from './Ikoner'
import { Illustrasjon } from './Illustrasjoner'
import { Papirlogo } from './Papirlogo'
import { Rivalportrett } from './Rivalportrett'
import { Klubbvaapen } from './Klubbvaapen'
import { Maleribilde } from './Malerier'
import { StartupLogo } from './StartupLogo'
import { avisbilde, borslinje, seksjon, type Avisbakgrunn } from '../avisbilde'

/**
 * Børstidende: et avishode med nummer og dato, børslinja, dagens utgave med
 * hovedsak, seksjoner, spalter og små tegninger — og de forrige utgavene
 * under. Å åpne avisen merker den som lest.
 */
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
          <button className="avis-lukk" onClick={lukk} aria-label="Lukk avisa">
            ✕
          </button>
          <div className="avis-topplinje">
            <span>{siste ? `Nr. ${siste.dag + 1}` : 'Nr. 0'}</span>
            <span>{siste ? datotekst(siste.dag, true) : 'Første utgave kommer i morgen tidlig'}</span>
            <span>Kr 45</span>
          </div>
          <h1 className="avis-navn">Børstidende</h1>
          <p className="avis-under">Næringsliv · Børs · Eiendom · Folk</p>
        </header>

        {siste && <Borslinje s={s} />}
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

/** Aksjene som beveget seg mest ved siste sluttkurs, som kurslista i en finansavis. */
function Borslinje({ s }: { s: Spilltilstand }) {
  const linje = borslinje(s)
  if (linje.length === 0) return null
  return (
    <ul className="borslinje" aria-label="Børsen i går">
      <li className="borslinje-tittel">Børsen</li>
      {linje.map((b) => (
        <li key={b.id}>
          <strong>{b.id}</strong> <span className={b.endring >= 0 ? 'opp' : 'ned'}>{b.endring >= 0 ? '▲' : '▼'} {tall(Math.abs(b.endring) * 100, 1)} %</span>
        </li>
      ))}
    </ul>
  )
}

/** Den lille tegningen til en sak, i en trykt ramme. */
function Bilde({ sak, stor = false, bakgrunn }: { sak: Overskrift; stor?: boolean; bakgrunn: Avisbakgrunn }) {
  const b = avisbilde(sak, bakgrunn)
  if (!b) return null
  const px = stor ? 88 : 44
  return (
    <figure className={`avisbilde ${b.art}${stor ? ' stor' : ''}${b.art === 'startup' && b.konkurs ? ' konkurs' : ''}`} aria-hidden="true">
      {b.art === 'rival' && <Rivalportrett id={b.id} størrelse={stor ? 104 : 52} form="omslag" />}
      {b.art === 'papir' && (stor ? <Papirlogo id={b.id} størrelse={32} ordmerke /> : <Papirlogo id={b.id} størrelse={Math.round(px * 0.7)} />)}
      {b.art === 'tegning' && <Illustrasjon id={b.id} størrelse={px} trinn={1} />}
      {b.art === 'ikon' && <Ikon navn={b.navn} størrelse={Math.round(px * 0.55)} />}
      {/* G11: kampen med begge våpnene, klubben, maleriet og startupens logo. */}
      {b.art === 'kamp' && (
        <>
          <Klubbvaapen navn={b.hjemme} størrelse={stor ? 64 : 32} />
          <Klubbvaapen navn={b.borte} størrelse={stor ? 64 : 32} />
        </>
      )}
      {b.art === 'klubb' && (
        <>
          <Klubbvaapen navn={b.navn} størrelse={stor ? 80 : 40} />
          {b.pokal && (
            <span className="avisbilde-pokal">
              <Ikon navn="trofe" størrelse={stor ? 26 : 15} />
            </span>
          )}
        </>
      )}
      {b.art === 'maleri' && <Maleribilde id={b.id} størrelse={px} />}
      {b.art === 'startup' && <StartupLogo navn={b.navn} størrelse={Math.round(px * 0.7)} />}
    </figure>
  )
}

function Sak({ sak, hoved = false, bakgrunn }: { sak: Overskrift; hoved?: boolean; bakgrunn: Avisbakgrunn }) {
  const Tittel = hoved ? 'h2' : 'h3'
  return (
    // Forbokstaven passer bare når hovedsaken har noen linjer tekst.
    <div className={`sak ${hoved ? 'hovedsak ' : ''}${hoved && sak.tekst.length > 90 ? 'forbokstav ' : ''}${sak.type}`}>
      <Bilde sak={sak} stor={hoved} bakgrunn={bakgrunn} />
      <span className="sak-seksjon">{seksjon(sak)}</span>
      <Tittel>{sak.tittel}</Tittel>
      {sak.tekst && <p>{sak.tekst}</p>}
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
    const bakgrunn: Avisbakgrunn = { klubb: s.klubb?.navn, malerier: Object.keys(s.kunst?.eide ?? {}) as MaleriId[] }
    return (
      <section className={forside ? 'utgave forside' : 'utgave'}>
        {!forside && <h3 className="utgave-dato">{datotekst(utgave.dag)}</h3>}
        {forside ? (
          <>
            <Sak sak={hoved} hoved bakgrunn={bakgrunn} />
            <div className="saker">
              {resten.map((sak, i) => (
                <Sak key={i} sak={sak} bakgrunn={bakgrunn} />
              ))}
            </div>
            {utgave.oppgjor?.map((o) => (
              <OppgjorBlokk key={o.periode} o={o} s={s} />
            ))}
            {/* Søndagsavisa (Pakke 60): «Uka di» etter ukeoppgjøret. */}
            {utgave.oppgjor
              ?.filter((o) => o.periode === 'uke' && o.formuekurve)
              .map((o) => (
                <UkaDi key="uka-di" o={o} />
              ))}
          </>
        ) : (
          <>
            <ul className="overskrifter">
              {utgave.saker.map((sak, i) => (
                <li key={i} className={sak.type}>
                  <span className="sak-seksjon">{seksjon(sak)}</span> {sak.tittel}
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
