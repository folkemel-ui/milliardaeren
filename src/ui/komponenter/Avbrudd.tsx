import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { gjenopprettEtterFeil, lagringSomKode, lesReservekopi, meldFeil, oppdaterOgLastInn, type Avbrudd } from '../../state/lager'
import { VERSJON } from '../versjon'
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
          <Feilinnhold melding={a.melding} stakk={a.stakk} tittel={tittel} />
        )}
      </div>
    </div>
  )
}

/**
 * Feilrapporten (Pakke 95): versjon, tid, nettleser, feilen og stakken, og lagringen som en
 * kode, så spillet feilen skjedde i kan lastes og feilen gjenskapes. Bygges når skjermen
 * åpnes, så kopieringen skjer inne i trykket — det Safari krever.
 */
function lagRapport(melding: string, stakk: string | undefined, kode: string | null): string {
  return [
    'Milliardær – feilrapport',
    `Versjon: ${VERSJON}`,
    `Tid: ${new Date().toISOString()}`,
    `Nettleser: ${navigator.userAgent}`,
    `Feil: ${melding}`,
    stakk ? `Stakk:\n${stakk}` : 'Stakk: ingen',
    `Lagring: ${kode ?? 'ingen'}`,
  ].join('\n')
}

function Feilinnhold({ melding, stakk, tittel }: { melding: string; stakk?: string; tittel: RefObject<HTMLHeadingElement | null> }) {
  const [kopi] = useState(lesReservekopi)
  const [bekreftNytt, settBekreftNytt] = useState(false)
  const [rapport, settRapport] = useState(() => lagRapport(melding, stakk, null))
  const [kopiert, settKopiert] = useState<'ja' | 'nei' | null>(null)
  useEffect(() => {
    let aktiv = true
    void lagringSomKode().then((kode) => aktiv && settRapport(lagRapport(melding, stakk, kode)))
    return () => {
      aktiv = false
    }
  }, [melding, stakk])
  // Lagringen er fra en nyere versjon av spillet: svaret er å hente den nye, ikke et nytt spill.
  const nyere = /nyere spillversjon/.test(melding)

  function kopierRapport() {
    navigator.clipboard
      ?.writeText(rapport)
      .then(() => settKopiert('ja'))
      .catch(() => settKopiert('nei'))
    if (!navigator.clipboard) settKopiert('nei')
  }

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
      {nyere ? (
        <button className="knapp knapp-gull" onClick={() => void oppdaterOgLastInn()}>
          Oppdater og last inn
        </button>
      ) : (
        <button className="knapp knapp-gull" onClick={() => location.reload()}>
          Prøv igjen
        </button>
      )}
      <button className="knapp" onClick={kopierRapport}>
        Kopier feilrapport
      </button>
      {kopiert === 'ja' && <p className="dempet liten">Rapporten er kopiert. Lim den inn i en e-post eller melding til den som lager spillet.</p>}
      {kopiert === 'nei' && (
        <>
          <p className="dempet liten">Kunne ikke kopiere automatisk. Merk alt i feltet og kopier.</p>
          <textarea className="flytt-kode" rows={4} readOnly value={rapport} onFocus={(e) => e.currentTarget.select()} />
        </>
      )}
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
      ) : nyere ? null : (
        <button className="knapp knapp-sekundær" onClick={() => settBekreftNytt(true)}>
          Start et nytt spill …
        </button>
      )}
    </>
  )
}

/** Fanger feil under tegningen, så en krasj gir feilskjermen i stedet for en hvit side. */
export class Feilgrense extends Component<{ children: ReactNode }, { feil: string | null; stakk?: string }> {
  state = { feil: null as string | null, stakk: undefined as string | undefined }

  static getDerivedStateFromError(e: unknown) {
    return { feil: e instanceof Error ? e.message : String(e), stakk: e instanceof Error ? e.stack : undefined }
  }

  componentDidCatch(e: unknown) {
    // Stopper klokken og lagringen, så den ødelagte tilstanden ikke lagres.
    meldFeil(e)
  }

  render() {
    return this.state.feil ? <Avbruddskjerm a={{ type: 'feil', melding: this.state.feil, stakk: this.state.stakk }} /> : this.props.children
  }
}
