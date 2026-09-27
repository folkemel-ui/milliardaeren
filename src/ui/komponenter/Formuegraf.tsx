import type { Formuepunkt } from '../../engine/types'
import { kortKroner, varighet } from '../format'

const B = 320
const H = 140

/** Nettoformuen over tid. Siste punkt er alltid «nå», så grafen følger med. */
export function Formuegraf({ punkter, naa }: { punkter: Formuepunkt[]; naa: Formuepunkt }) {
  const alle = punkter.length && punkter[punkter.length - 1].sek === naa.sek ? punkter : [...punkter, naa]
  if (alle.length < 2) {
    return <p className="graf-tom">Grafen fylles ut etter hvert som tiden går.</p>
  }

  const førsteSek = alle[0].sek
  const spenn = Math.max(1, naa.sek - førsteSek)
  let min = Math.min(...alle.map((p) => p.verdi))
  let maks = Math.max(...alle.map((p) => p.verdi))
  if (maks - min < 1) {
    maks += 1
    min -= 1
  }
  const luft = (maks - min) * 0.08
  const bunn = min - luft
  const topp = maks + luft

  const x = (sek: number) => ((sek - førsteSek) / spenn) * B
  const y = (v: number) => H - ((v - bunn) / (topp - bunn)) * H
  const linje = alle.map((p) => `${x(p.sek).toFixed(1)},${y(p.verdi).toFixed(1)}`).join(' ')
  const flate = `0,${H} ${linje} ${B},${H}`

  return (
    <figure className="graf">
      <div className="graf-akse-y">
        <span>{kortKroner(maks)}</span>
        <span>{kortKroner(min)}</span>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" role="img" aria-label="Nettoformue over tid">
        <defs>
          <linearGradient id="graf-fyll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--gull)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--gull)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={H / 2} x2={B} y2={H / 2} className="graf-rutenett" />
        <polygon points={flate} fill="url(#graf-fyll)" />
        <polyline points={linje} fill="none" className="graf-linje" />
      </svg>
      <figcaption className="graf-akse-x">
        <span>for {varighet(spenn)} siden</span>
        <span>nå</span>
      </figcaption>
    </figure>
  )
}
