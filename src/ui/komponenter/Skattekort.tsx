import { useState } from 'react'
import { betalDelAvSkatt, betalSkatt, settOffshore } from '../../engine/handlinger'
import { FORSINKELSESGEBYR, REVISJONSSJANSE, SKATTETRINN, skattSaLangt } from '../../engine/skatt'
import { dato, MÅNEDER } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, kroner, tall, varighet } from '../format'
import { Forklaring } from './Forklaring'

/**
 * «Skatt så langt i oktober: ca. kr X» (Pakke 103) — på skattekortet, i Bank og på Oversikt,
 * så regningen den 1. ikke kommer som en overraskelse. Ingenting når måneden ikke har gitt skatt.
 */
export function SkattSaLangt({ s }: { s: Spilltilstand }) {
  const belop = skattSaLangt(s)
  if (belop < 1) return null
  return (
    <p className="liten skatt-saa-langt">
      Skatt så langt i {MÅNEDER[dato(s.maanedstart.dag).maaned]}: <strong>ca. {kortKroner(belop)}</strong>
      <span className="dempet"> · regningen kommer den 1.{s.kontanter < belop ? ', og kontantene dekker den ikke ennå' : ''}</span>
    </p>
  )
}

/** Skattekortet: åpne regninger, offshore-valget og hva du har betalt. */
export function Skattekort({ s }: { s: Spilltilstand }) {
  const [bekreft, settBekreft] = useState(false)
  const k = s.skatt

  return (
    <div className="kort skattekort" id="skatt">
      <div className="maal-topp">
        <h2 className="kort-tittel">
          Skatt <Forklaring tema="skatt" />
        </h2>
        <span className="dempet liten">Betalt totalt {kortKroner(k.totaltBetalt)}</span>
      </div>

      <SkattSaLangt s={s} />
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
                {/* Pakke 103: mangler kontantene, betaler knappen det du har — gebyret ved forfall gjelder bare resten. */}
                {s.kontanter >= r.belop ? (
                  <button className="knapp knapp-gull knapp-liten" onClick={() => utfor(betalSkatt(s, r.id))}>
                    Betal
                  </button>
                ) : (
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < 1} onClick={() => utfor(betalDelAvSkatt(s, r.id))}>
                    Betal {kortKroner(Math.max(0, s.kontanter))}
                  </button>
                )}
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
