import { useState, type PointerEvent } from 'react'
import { avlingspris, GRUPPELISTE, GRUPPENAVN, PRIS_MIN, PRIS_SPENN, snittpris, ukeFor } from '../../engine/jord'
import { dagnummer, ukenummer } from '../../engine/kalender'
import type { Avlingsgruppe } from '../../engine/jord'
import { tall } from '../format'

const B = 320
const H = 110
const UKER = 8
/** Fast akse: hele prisspennet, så en uke kan sammenlignes med en annen uke på en annen dag. */
const BUNN = PRIS_MIN - 0.03
const TOPP = PRIS_MIN + PRIS_SPENN + 0.03
const MERKER = [0.8, 1, 1.2]
/** Fargen følger gruppen, aldri plassen (dataviz): korn, grønnsaker, frukt og bær. */
const FARGE: Record<Avlingsgruppe, string> = { korn: 'var(--kilde-1)', gronnsaker: 'var(--kilde-2)', frukt: 'var(--kilde-3)' }

const pris = (p: number) => `×${tall(p, 2)}`
const pst = (n: number, av: number) => `${(n / av) * 100}%`

/**
 * Avlingsprisene de åtte siste ukene (Pakke 113): én linje per gruppe, ×1,00 stiplet, og
 * denne uka mot snittet for de åtte i lista under — tallene står skrevet ut, så grafen
 * leses uten farger også. Hold over (eller trykk på) grafen for å lese av en uke.
 */
export function Avlingspriser({ sek }: { sek: number }) {
  const [valgt, settValgt] = useState<number | null>(null)
  const naa = ukeFor(dagnummer(sek))
  const uker = Array.from({ length: UKER }, (_, i) => naa - UKER + 1 + i)
  const x = (i: number) => (i / (UKER - 1)) * B
  const y = (p: number) => H - ((p - BUNN) / (TOPP - BUNN)) * H
  const lesAv = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    settValgt(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (UKER - 1)))
  }
  const uketekst = (u: number) => `uke ${ukenummer(u * 7 + 3)}`
  return (
    <div className="avlingspriser">
      <figure className="graf avlingsgraf">
        <div className="graf-akse-y" aria-hidden="true">
          {MERKER.map((v) => (
            <span key={v} style={{ top: pst(y(v), H) }}>
              {pris(v)}
            </span>
          ))}
        </div>
        <div
          className="graf-flate"
          role="img"
          aria-label={`Avlingsprisene de åtte siste ukene. ${GRUPPELISTE.map((g) => `${GRUPPENAVN[g]} ${pris(avlingspris(g, naa))} nå`).join(', ')}.`}
          onPointerDown={lesAv}
          onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && lesAv(e)}
          onPointerUp={(e) => e.pointerType !== 'mouse' && settValgt(null)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && settValgt(null)}
          onPointerCancel={() => settValgt(null)}
        >
          <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {MERKER.map((v) => (
              <line key={v} x1="0" y1={y(v)} x2={B} y2={y(v)} className={v === 1 ? 'graf-snitt' : 'graf-rutenett'} />
            ))}
            {GRUPPELISTE.map((g) => (
              <polyline
                key={g}
                points={uker.map((u, i) => `${x(i).toFixed(1)},${y(avlingspris(g, u)).toFixed(1)}`).join(' ')}
                fill="none"
                className="graf-linje"
                style={{ stroke: FARGE[g] }}
              />
            ))}
          </svg>
          {/* Denne ukas punkter, og den valgte ukas, som runde HTML-prikker over grafen. */}
          {GRUPPELISTE.map((g) => {
            const i = valgt ?? UKER - 1
            return <span key={g} className="graf-punkt" style={{ left: pst(x(i), B), top: pst(y(avlingspris(g, uker[i])), H), background: FARGE[g] }} aria-hidden="true" />
          })}
          {valgt !== null && (
            <>
              <span className="graf-sikte" style={{ left: pst(x(valgt), B) }} aria-hidden="true" />
              <span className="graf-boble" style={{ left: `${Math.min(75, Math.max(25, (valgt / (UKER - 1)) * 100))}%` }} role="status">
                <strong>{valgt === UKER - 1 ? 'Denne uka' : uketekst(uker[valgt])}</strong>
                {GRUPPELISTE.map((g) => (
                  <span key={g}>
                    {GRUPPENAVN[g].toLowerCase()} {pris(avlingspris(g, uker[valgt]))}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
        <figcaption className="graf-akse-x" aria-hidden="true">
          <span className="venstre" style={{ left: '0%' }}>
            {uketekst(uker[0])}
          </span>
          <span className="hoyre" style={{ left: '100%' }}>
            denne uka
          </span>
        </figcaption>
      </figure>
      <ul className="avlingspriser-liste">
        {GRUPPELISTE.map((g) => {
          const p = avlingspris(g, naa)
          const avvik = p / snittpris(g, naa) - 1
          const prosent = Math.round(Math.abs(avvik) * 100)
          return (
            <li key={g} className="liten">
              <span className="avlingspriser-farge" style={{ background: FARGE[g] }} aria-hidden="true" />
              <span>{GRUPPENAVN[g]}</span>
              <strong className={p >= 1.1 ? 'pluss' : p <= 0.9 ? 'minus' : undefined}>{pris(p)}</strong>
              <span className="dempet">{prosent === 0 ? 'som snittet' : `${prosent} % ${avvik > 0 ? 'over' : 'under'} snittet`}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
