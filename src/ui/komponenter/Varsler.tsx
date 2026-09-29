import { useEffect, useMemo } from 'react'
import type { Feiringsniva } from '../hendelsesstrom'
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

const FARGER = ['#d4af37', '#ecd07a', '#f4efe4', '#5cd68a', '#f27474', '#38bdf8']
const GULL = ['#d4af37', '#ecd07a', '#f7e3a1', '#b8912a']

/**
 * Hvor mye som skjer for hver størrelse. Den lille slipper trykk gjennom, så
 * du kan spille videre mens den drysser; de store kan lukkes med et trykk.
 */
const VARIANT: Record<Feiringsniva, { biter: number; ms: number; blink: boolean }> = {
  liten: { biter: 26, ms: 2000, blink: false },
  stor: { biter: 60, ms: 3000, blink: true },
  milliard: { biter: 150, ms: 5500, blink: true },
}

/**
 * Konfetti og en stor tekst for en formuemilepæl. Konfettien er vanlige
 * elementer med tilfeldig start, fart og farge — tilfeldigheten her er bare
 * pynt, ikke spill. Milliarden får gullmynter, stråler og en krone.
 */
export function Feiring() {
  const f = useFeiring()
  const v = f ? VARIANT[f.niva] : null
  const milliard = f?.niva === 'milliard'
  const biter = useMemo(
    () =>
      Array.from({ length: v?.biter ?? 0 }, (_, i) => ({
        venstre: Math.random() * 100,
        forsinkelse: Math.random() * (milliard ? 2.2 : 0.6),
        varighet: (f?.niva === 'liten' ? 1.2 : 1.6) + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 160,
        rotasjon: Math.random() * 720,
        farge: milliard ? GULL[i % GULL.length] : FARGER[i % FARGER.length],
        form: milliard && i % 3 === 0 ? 'mynt' : Math.random() < 0.5 ? 'bred' : '',
      })),
    // Ny konfetti for hver feiring.
    [f],
  )

  useEffect(() => {
    if (!f || !v) return
    const t = setTimeout(avsluttFeiring, v.ms)
    return () => clearTimeout(t)
  }, [f])

  if (!f || !v) return null
  return (
    <div className={`feiring ${f.niva}`} onClick={avsluttFeiring} aria-live="assertive" style={{ '--feiring-ms': `${v.ms}ms` } as React.CSSProperties}>
      {v.blink && <div className="feiring-blink" />}
      {milliard && <div className="feiring-straaler" aria-hidden="true" />}
      {biter.map((b, i) => (
        <span
          key={i}
          className={`konfetti ${b.form}`}
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
      <div className="feiring-midt">
        {milliard && (
          <span className="feiring-krone" aria-hidden="true">
            👑
          </span>
        )}
        <div className="feiring-tekst">{f.tekst}</div>
        {milliard && <div className="feiring-under">Du nådde målet.</div>}
      </div>
    </div>
  )
}
