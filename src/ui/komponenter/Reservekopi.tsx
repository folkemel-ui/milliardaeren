import { useMemo, useState } from 'react'
import { byttTilReservekopi, lesReservekopi, reservekopiEndret } from '../../state/lager'
import { kortKroner, varighet } from '../format'

/**
 * Spillet slik det var før du sist startet på nytt eller hentet inn et annet.
 * Byttet går begge veier: spillet du har nå, blir den nye reservekopien.
 */
export function Reservekopi() {
  const endret = reservekopiEndret()
  const kopi = useMemo(lesReservekopi, [endret])
  const [bekreft, settBekreft] = useState(false)
  const [melding, settMelding] = useState<string | null>(null)

  if (!kopi && !melding) return null

  function bytt() {
    const feil = byttTilReservekopi()
    settBekreft(false)
    settMelding(feil ?? 'Byttet. Spillet du hadde, ligger nå i reservekopien.')
  }

  return (
    <div className="kort">
      <h2 className="kort-tittel">Reservekopi</h2>
      {kopi && (
        <>
          <p className="dempet liten">
            Spillet du hadde før du sist startet på nytt, hentet inn et spill eller byttet: nettoformue {kortKroner(kopi.formue)}, spilletid{' '}
            {varighet(kopi.sek)}.
          </p>
          {bekreft ? (
            <div className="bekreft">
              <p>Bytte til reservekopien? Spillet du har nå, blir den nye reservekopien, så du kan bytte tilbake.</p>
              <div className="knapperad">
                <button className="knapp" onClick={() => settBekreft(false)}>
                  Avbryt
                </button>
                <button className="knapp knapp-gull" onClick={bytt}>
                  Ja, bytt
                </button>
              </div>
            </div>
          ) : (
            <button className="knapp" onClick={() => settBekreft(true)}>
              Bytt til reservekopien …
            </button>
          )}
        </>
      )}
      {melding && <p className="rival-melding">{melding}</p>}
    </div>
  )
}
