import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { gjenopprettEtterFeil, lesReservekopi, meldFeil, type Avbrudd } from '../../state/lager'
import { kortKroner, varighet } from '../format'

/**
 * Skjermen når spillet ikke kan fortsette her: en annen fane har tatt over,
 * eller noe gikk galt. Spillet vises ikke bak — det som står der, er ikke
 * det som er lagret.
 */
export function Avbruddskjerm({ a }: { a: Avbrudd }) {
  const tittel = useRef<HTMLHeadingElement>(null)
  useEffect(() => tittel.current?.focus(), [a.type])

  return (
    <div className="avbrudd-side">
      <div className="velkomst" role="alertdialog" aria-modal="true" aria-labelledby="avbrudd-tittel">
        {a.type === 'annen-fane' ? (
          <>
            <h1 id="avbrudd-tittel" className="velkomst-tittel" ref={tittel} tabIndex={-1}>
              Spillet er åpent et annet sted
            </h1>
            <p className="dempet">
              Du har åpnet Milliardær i en annen fane eller i appen. Spillet er satt på pause her, så ingenting blir skrevet over.
            </p>
            <button className="knapp knapp-gull" onClick={() => location.reload()}>
              Spill her i stedet
            </button>
          </>
        ) : (
          <Feilinnhold melding={a.melding} tittel={tittel} />
        )}
      </div>
    </div>
  )
}

function Feilinnhold({ melding, tittel }: { melding: string; tittel: RefObject<HTMLHeadingElement | null> }) {
  const [kopi] = useState(lesReservekopi)
  const [bekreftNytt, settBekreftNytt] = useState(false)

  return (
    <>
      <h1 id="avbrudd-tittel" className="velkomst-tittel" ref={tittel} tabIndex={-1}>
        Noe gikk galt
      </h1>
      <p className="dempet">Spillet kunne ikke fortsette. Lagringen din er ikke slettet.</p>
      <details className="avbrudd-detaljer">
        <summary>Hva som skjedde</summary>
        <p className="liten">{melding}</p>
      </details>
      <button className="knapp knapp-gull" onClick={() => location.reload()}>
        Prøv igjen
      </button>
      {kopi && (
        <div className="bekreft">
          <p className="dempet liten">
            Reservekopien: nettoformue {kortKroner(kopi.formue)}, spilletid {varighet(kopi.sek)}.
          </p>
          <button className="knapp" onClick={() => gjenopprettEtterFeil('reservekopi')}>
            Hent reservekopien
          </button>
        </div>
      )}
      {bekreftNytt ? (
        <div className="bekreft">
          <p>Starte et nytt spill med kr 1 000? Den ødelagte lagringen tas vare på.</p>
          <div className="knapperad">
            <button className="knapp" onClick={() => settBekreftNytt(false)}>
              Avbryt
            </button>
            <button className="knapp knapp-fare" onClick={() => gjenopprettEtterFeil('nytt')}>
              Start nytt spill
            </button>
          </div>
        </div>
      ) : (
        <button className="knapp knapp-sekundær" onClick={() => settBekreftNytt(true)}>
          Start et nytt spill …
        </button>
      )}
    </>
  )
}

/** Fanger feil under tegningen, så en krasj gir feilskjermen i stedet for en hvit side. */
export class Feilgrense extends Component<{ children: ReactNode }, { feil: string | null }> {
  state = { feil: null as string | null }

  static getDerivedStateFromError(e: unknown) {
    return { feil: e instanceof Error ? e.message : String(e) }
  }

  componentDidCatch(e: unknown) {
    // Stopper klokken og lagringen, så den ødelagte tilstanden ikke lagres.
    meldFeil(e)
  }

  render() {
    return this.state.feil ? <Avbruddskjerm a={{ type: 'feil', melding: this.state.feil }} /> : this.props.children
  }
}
