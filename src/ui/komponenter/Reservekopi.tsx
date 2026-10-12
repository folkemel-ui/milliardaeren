import { useMemo, useState } from 'react'
import { byttTilReservekopi, hentFoerOppdatering, lesFoerOppdatering, lesReservekopi, reservekopiEndret } from '../../state/lager'
import { kortKroner, varighet } from '../format'

/**
 * Spillet slik det var før siste oppdatering av spillet (Pakke 95). Lagres hver gang en
 * oppdatering løfter lagringen til en ny versjon. Byttet laster siden på nytt; spillet du
 * har nå, blir reservekopien.
 */
export function FoerOppdatering() {
  const [kopi] = useState(lesFoerOppdatering)
  const [bekreft, settBekreft] = useState(false)
  const [melding, settMelding] = useState<string | null>(null)
  if (!kopi) return null
  return (
    <div className="kort">
      <h2 className="kort-tittel">Fra før siste oppdatering</h2>
      <p className="dempet liten">
        Spillet slik det var før spillet sist ble oppdatert: nettoformue {kortKroner(kopi.formue)}, spilletid {varighet(kopi.sek)}. Bruk det hvis
        noe gikk galt med oppdateringen.
      </p>
      {bekreft ? (
        <div className="bekreft">
          <p>Bytte til spillet fra før oppdateringen? Spillet du har nå, blir reservekopien.</p>
          <div className="knapperad">
            <button className="knapp" onClick={() => settBekreft(false)}>
              Avbryt
            </button>
            <button className="knapp knapp-gull" onClick={() => settMelding(hentFoerOppdatering())}>
              Ja, bytt
            </button>
          </div>
        </div>
      ) : (
        <button className="knapp" onClick={() => settBekreft(true)}>
          Hent det
        </button>
      )}
      {melding && <p className="rival-melding">{melding}</p>}
    </div>
  )
}

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
