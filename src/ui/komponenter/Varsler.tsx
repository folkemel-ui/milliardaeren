import { useEffect, useMemo } from 'react'
import { avsluttFeiring, fjernVarsel, useFeiring, useVarsler } from '../varsler'
import type { Fane } from './Fanemeny'

const IKON = { god: '✨', advarsel: '⚠️', kritisk: '🚨', feil: '', avis: '📰' } as const

/** Varslene, stablet over fanemenyen. Trykk går dit varselet gjelder; krysset lukker. */
export function Varselstabel({ gåTil }: { gåTil: (f: Fane) => void }) {
  const varsler = useVarsler()
  return (
    <div className="varsler" aria-live="polite">
      {varsler.map((v) => (
        <div
          key={v.id}
          className={`varsel varsel-${v.type}${v.mål ? ' klikkbar' : ''}`}
          role="status"
          onClick={() => {
            if (!v.mål) return
            gåTil(v.mål)
            fjernVarsel(v.id)
          }}
        >
          {IKON[v.type] && (
            <span className="varsel-ikon" aria-hidden="true">
              {IKON[v.type]}
            </span>
          )}
          <span className="varsel-tekst">
            <strong>{v.tittel}</strong>
            {v.tekst && <span>{v.tekst}</span>}
          </span>
          {v.handling && (
            <button
              className="knapp knapp-gull knapp-liten"
              onClick={(e) => {
                e.stopPropagation()
                v.handling!.utfør()
                fjernVarsel(v.id)
              }}
            >
              {v.handling.tekst}
            </button>
          )}
          <button
            className="varsel-lukk"
            aria-label="Lukk"
            onClick={(e) => {
              e.stopPropagation()
              fjernVarsel(v.id)
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

const KONFETTI = 60
const FARGER = ['#d4af37', '#ecd07a', '#f4efe4', '#5cd68a', '#f27474', '#38bdf8']

/**
 * Gullblink, konfetti og en stor tekst. Konfettien er vanlige elementer med
 * tilfeldig start, fart og farge — tilfeldigheten her er bare pynt, ikke spill.
 */
export function Feiring() {
  const tekst = useFeiring()
  const biter = useMemo(
    () =>
      Array.from({ length: KONFETTI }, (_, i) => ({
        venstre: Math.random() * 100,
        forsinkelse: Math.random() * 0.6,
        varighet: 1.6 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 160,
        rotasjon: Math.random() * 720,
        farge: FARGER[i % FARGER.length],
        bred: Math.random() < 0.5,
      })),
    // Ny konfetti for hver feiring.
    [tekst],
  )

  useEffect(() => {
    if (!tekst) return
    const t = setTimeout(avsluttFeiring, 3000)
    return () => clearTimeout(t)
  }, [tekst])

  if (!tekst) return null
  return (
    <div className="feiring" onClick={avsluttFeiring} aria-live="assertive">
      <div className="feiring-blink" />
      {biter.map((b, i) => (
        <span
          key={i}
          className={b.bred ? 'konfetti bred' : 'konfetti'}
          style={
            {
              left: `${b.venstre}%`,
              background: b.farge,
              animationDelay: `${b.forsinkelse}s`,
              animationDuration: `${b.varighet}s`,
              '--drift': `${b.drift}px`,
              '--rotasjon': `${b.rotasjon}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="feiring-tekst">{tekst}</div>
    </div>
  )
}
