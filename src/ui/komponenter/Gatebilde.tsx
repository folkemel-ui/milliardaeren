import { useRef, useState, type ReactNode } from 'react'
import { useFokusfelle } from './useFokusfelle'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, standard, STANDARDER } from '../../engine/eiendom'
import { eiendomSynlig, jordSynlig } from '../../engine/handlinger'
import { JORD, JORDLISTE } from '../../engine/jord'
import { LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { REGIONER, regionFor } from '../../engine/regioner'
import type { By, EiendomId, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { endring, perSek } from '../format'
import { leieIBy, trendFor } from '../kart'
import { Illustrasjon } from './Illustrasjoner'
import { Ikon } from './Ikoner'
import { Eiendomskort } from './Eiendomskort'
import { Jordkort, Landemerkekort } from './JordOgLandemerker'

type Valg = { slag: 'eiendom'; id: EiendomId } | { slag: 'jord'; id: JordId } | { slag: 'merke'; id: LandemerkeId }

/**
 * Gatebildet: byen på nært hold, som en gate. Hver eiendomstype står én gang,
 * tegnet stort, med antallet du eier — oppusset får en ramme, og stillas mens
 * håndverkerne er der. Ledige tomter er stiplet. Jord og landemerker står i
 * hver sin ende av gata.
 *
 * Trykk på noe i gata, og kortet med knappene for å kjøpe, selge og pusse
 * opp kommer under — det samme kortet som i lista.
 */
export function Gatebilde({ s, by, lukk }: { s: Spilltilstand; by: By; lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)
  const [valgt, velg] = useState<Valg | null>(null)

  // Typene du eier står som bygg; de du kan kjøpe men ikke eier ennå, som ledige tomter.
  const typer = EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by && ((s.eiendommer[id] ?? 0) > 0 || eiendomSynlig(s, id)))
  const jord = JORDLISTE.filter((id) => JORD[id].by === by && (s.jord?.[id] || jordSynlig(s, id)))
  const merker = LANDEMERKELISTE.filter((id) => LANDEMERKER[id].by === by && s.hoyesteFormue >= LANDEMERKER.fyret.pris * 0.25)
  const region = regionFor(by)
  const e = trendFor(s, by)
  const leie = leieIBy(s, by)
  const tom = typer.length === 0 && jord.length === 0 && merker.length === 0
  const erValgt = (v: Valg) => valgt?.slag === v.slag && valgt.id === v.id
  const trykk = (v: Valg) => velg(erValgt(v) ? null : v)

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
          <>
            <div className="gate" role="list" aria-label={`Gata i ${by}`}>
              {jord.map((id) => {
                const v: Valg = { slag: 'jord', id }
                return (
                  <Tomt key={id} valgt={erValgt(v)} trykk={() => trykk(v)} klasse={s.jord?.[id] ? 'utkant din' : 'utkant'} navn={JORD[id].navn} under={s.jord?.[id] ? 'Din' : 'Til salgs'}>
                    <Illustrasjon id={id} størrelse={64} />
                  </Tomt>
                )
              })}
              {typer.map((id) => {
                const antall = s.eiendommer[id] ?? 0
                const st = standard(s, id)
                const pusses = !!s.oppussing[id]
                const v: Valg = { slag: 'eiendom', id }
                if (antall === 0) {
                  return (
                    <Tomt key={id} valgt={erValgt(v)} trykk={() => trykk(v)} klasse="ledig" navn={EIENDOMSTYPER[id].navn} under="Ledig tomt">
                      <span className="hus-pluss" aria-hidden="true">
                        +
                      </span>
                    </Tomt>
                  )
                }
                return (
                  <Tomt
                    key={id}
                    valgt={erValgt(v)}
                    trykk={() => trykk(v)}
                    klasse={`s${st}${pusses ? ' stillas' : ''}`}
                    navn={EIENDOMSTYPER[id].navn}
                    under={pusses ? 'Pusses opp' : st > 0 ? STANDARDER[st].navn : `${antall} av ${EIENDOMSTYPER[id].maksAntall}`}
                    antall={antall}
                  >
                    <Illustrasjon id={id} størrelse={72} />
                    {pusses && (
                      <span className="hus-stillas" aria-hidden="true">
                        <Ikon navn="kran" størrelse={16} />
                      </span>
                    )}
                  </Tomt>
                )
              })}
              {merker.map((id) => {
                const eier = s.landemerker?.[id]?.eier
                const v: Valg = { slag: 'merke', id }
                return (
                  <Tomt key={id} valgt={erValgt(v)} trykk={() => trykk(v)} klasse={eier === 'deg' ? 'utkant din' : 'utkant'} navn={LANDEMERKER[id].navn} under={eier === 'deg' ? 'Ditt' : eier ? 'Eies av en rival' : 'Til salgs'}>
                    <Illustrasjon id={id} størrelse={64} />
                  </Tomt>
                )
              })}
            </div>

            {valgt ? (
              <ul className="kortliste gate-kort">
                {valgt.slag === 'eiendom' && <Eiendomskort s={s} id={valgt.id} />}
                {valgt.slag === 'jord' && <Jordkort s={s} id={valgt.id} />}
                {valgt.slag === 'merke' && <Landemerkekort s={s} id={valgt.id} />}
              </ul>
            ) : (
              <p className="dempet liten">Trykk på noe i gata for å kjøpe, selge eller pusse opp.</p>
            )}
          </>
        )}

        <button className="knapp" onClick={lukk}>
          Lukk
        </button>
      </div>
    </div>
  )
}

/** Én plass i gata: tegningen står på veien, med navnet og en linje under. */
function Tomt({
  valgt,
  trykk,
  klasse,
  navn,
  under,
  antall,
  children,
}: {
  valgt: boolean
  trykk: () => void
  klasse: string
  navn: string
  under: string
  antall?: number
  children: ReactNode
}) {
  return (
    <div role="listitem" className="tomt">
      <button className={`hus ${klasse}${valgt ? ' valgt' : ''}`} aria-pressed={valgt} onClick={trykk}>
        <span className="hus-bilde">
          {children}
          {antall !== undefined && antall > 1 && <span className="hus-antall brikke gull">×{antall}</span>}
        </span>
        <span className="hus-navn">{navn}</span>
        <span className="hus-under">{under}</span>
      </button>
    </div>
  )
}
