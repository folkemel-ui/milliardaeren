import { useState } from 'react'
import { betalSkatt, settOffshore } from '../../engine/handlinger'
import { FORSINKELSESGEBYR, REVISJONSSJANSE, SKATTETRINN } from '../../engine/skatt'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, kroner, tall, varighet } from '../format'

/** Skattekortet: åpne regninger, offshore-valget og hva du har betalt. */
export function Skattekort({ s }: { s: Spilltilstand }) {
  const [bekreft, settBekreft] = useState(false)
  const k = s.skatt

  return (
    <div className="kort skattekort" id="skatt">
      <div className="maal-topp">
        <h2 className="kort-tittel">Skatt</h2>
        <span className="dempet liten">Betalt totalt {kortKroner(k.totaltBetalt)}</span>
      </div>

      {k.regninger.length === 0 ? (
        <p className="dempet liten">Ingen ubetalte regninger. Neste skatteoppgjør kommer den 1. i neste måned.</p>
      ) : (
        <ul className="regninger">
          {k.regninger.map((r) => {
            const igjen = r.forfallSek - s.sek
            return (
              <li key={r.id} className={r.type === 'etterskatt' ? 'etterskatt' : ''}>
                <div>
                  <strong>{r.navn}</strong>
                  <span className={igjen < 600 ? 'minus liten' : 'dempet liten'}>
                    {kroner(r.belop)} · forfaller om {varighet(Math.max(0, igjen))}
                  </span>
                </div>
                <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < r.belop} onClick={() => utfor(betalSkatt(s, r.id))}>
                  Betal
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="dempet liten">
        Ikke betalt i tide: +{tall(FORSINKELSESGEBYR * 100)} % gebyr, og skattemyndighetene krever inn selv — fra
        sparekontoen eller som gjeld om det trengs. Satser per måned:{' '}
        {SKATTETRINN.map((t) => `${tall(t.sats * 100)} % over ${kortKroner(t.fra)}`).join(', ')}.
      </p>

      <div className="offshore">
        <div>
          <strong>Offshore-selskap</strong>
          <p className="dempet liten">
            Halverer skatten. Men hver måned er det {tall(REVISJONSSJANSE * 100)} % sjanse for bokettersyn — og da må alt
            du har spart, betales dobbelt tilbake.
            {k.unndratt > 0 && (
              <>
                {' '}
                <span className="minus">Uoppdaget: {kroner(k.unndratt)}.</span>
              </>
            )}
          </p>
        </div>
        {k.offshore ? (
          <button className="knapp knapp-liten" onClick={() => utfor(settOffshore(s, false))}>
            Avslutt
          </button>
        ) : bekreft ? (
          <button
            className="knapp knapp-fare knapp-liten"
            onClick={() => {
              utfor(settOffshore(s, true))
              settBekreft(false)
            }}
          >
            Ja, flytt
          </button>
        ) : (
          <button className="knapp knapp-liten" onClick={() => settBekreft(true)}>
            Flytt …
          </button>
        )}
      </div>
    </div>
  )
}
