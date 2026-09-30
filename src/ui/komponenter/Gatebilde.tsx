import { useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, standard, STANDARDER } from '../../engine/eiendom'
import { eiendomSynlig } from '../../engine/handlinger'
import { JORD, JORDLISTE } from '../../engine/jord'
import { LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { REGIONER, regionFor } from '../../engine/regioner'
import type { By, Spilltilstand } from '../../engine/types'
import { endring, perSek } from '../format'
import { LANDEMERKESYMBOL, leieIBy, trendFor } from '../kart'
import { Illustrasjon } from './Illustrasjoner'
import { Ikon } from './Ikoner'

/**
 * Gatebildet: byen på nært hold. Hver enhet du eier er et hus som ser ut
 * etter standarden — oppusset, luksus, eller med stillas mens håndverkerne
 * er der. Ledige tomter viser hva du kan kjøpe, og jord og landemerker står
 * i utkanten.
 */
export function Gatebilde({ s, by, lukk }: { s: Spilltilstand; by: By; lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)

  const typer = EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by)
  const hus = typer.flatMap((id) => Array.from({ length: s.eiendommer[id] ?? 0 }, (_, i) => ({ id, i })))
  const ledige = typer.filter((id) => (s.eiendommer[id] ?? 0) < EIENDOMSTYPER[id].maksAntall && eiendomSynlig(s, id))
  const jord = JORDLISTE.filter((id) => JORD[id].by === by)
  const merker = LANDEMERKELISTE.filter((id) => LANDEMERKER[id].by === by && s.hoyesteFormue >= LANDEMERKER.fyret.pris * 0.25)
  const region = regionFor(by)
  const e = trendFor(s, by)
  const leie = leieIBy(s, by)
  const tom = hus.length === 0 && ledige.length === 0 && jord.length === 0 && merker.length === 0

  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div ref={boks} tabIndex={-1} className="velkomst gatebilde" role="dialog" aria-modal="true" aria-labelledby="gate-tittel" onClick={(ev) => ev.stopPropagation()}>
        <h1 id="gate-tittel" className="velkomst-tittel">
          {by}
        </h1>
        <p className="dempet liten">
          {region ? `Regionen ${REGIONER[region].navn}` : 'Følger landet'}:{' '}
          <span className={e >= 0 ? 'pluss' : 'minus'}>{endring(e)}</span> siste 2 t
          {leie > 0 && (
            <>
              {' '}
              · leie <span className="pluss">{perSek(leie)}</span>
            </>
          )}
        </p>

        {tom ? (
          <p className="dempet">Ingenting her ennå. Byen åpner seg når formuen vokser.</p>
        ) : (
          <div className="gate" role="list">
            {hus.map(({ id, i }) => {
              const st = standard(s, id)
              const pusses = !!s.oppussing[id]
              return (
                <div
                  key={`${id}-${i}`}
                  role="listitem"
                  className={`hus s${st}${pusses ? ' stillas' : ''}`}
                  aria-label={`${EIENDOMSTYPER[id].navn}${st > 0 ? `, ${STANDARDER[st].navn.toLowerCase()}` : ''}${pusses ? ', pusses opp' : ''}`}
                >
                  <Illustrasjon id={id} størrelse={52} />
                  <span className="hus-navn">{EIENDOMSTYPER[id].navn}</span>
                  {pusses ? (
                    <span className="hus-merke">
                      <Ikon navn="kran" størrelse={13} /> Pusses opp
                    </span>
                  ) : (
                    st > 0 && <span className={`merke-standard s${st}`}>{STANDARDER[st].navn}</span>
                  )}
                </div>
              )
            })}
            {ledige.map((id) => (
              <div key={`ledig-${id}`} role="listitem" className="hus ledig" aria-label={`Ledig tomt: ${EIENDOMSTYPER[id].navn}`}>
                <span className="hus-pluss" aria-hidden="true">
                  +
                </span>
                <span className="hus-navn">{EIENDOMSTYPER[id].navn}</span>
                <span className="dempet liten">Ledig tomt</span>
              </div>
            ))}
            {jord.map((id) => (
              <div key={id} role="listitem" className={`hus utkant${s.jord?.[id] ? ' din' : ''}`}>
                <span className="hus-symbol" aria-hidden="true">
                  {JORD[id].type === 'gard' ? '🌾' : '🌲'}
                </span>
                <span className="hus-navn">{JORD[id].navn}</span>
                <span className="dempet liten">{s.jord?.[id] ? 'Din' : 'Til salgs'}</span>
              </div>
            ))}
            {merker.map((id) => {
              const eier = s.landemerker?.[id]?.eier
              return (
                <div key={id} role="listitem" className={`hus utkant${eier === 'deg' ? ' din' : ''}`}>
                  <span className="hus-symbol" aria-hidden="true">
                    {LANDEMERKESYMBOL[id]}
                  </span>
                  <span className="hus-navn">{LANDEMERKER[id].navn}</span>
                  <span className="dempet liten">{eier === 'deg' ? 'Ditt' : eier ? 'Eies av en rival' : 'Til salgs'}</span>
                </div>
              )
            })}
          </div>
        )}

        <button className="knapp" onClick={lukk}>
          Lukk
        </button>
      </div>
    </div>
  )
}
