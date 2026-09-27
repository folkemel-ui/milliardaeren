import { useId } from 'react'
import { varighet } from '../format'

const B = 320
const H = 140

/**
 * Linjegraf over tid med y-aksen i egen kolonne. Punktene må være sortert i
 * tid; siste punkt regnes som «nå».
 */
export function Linjegraf({
  punkter,
  format,
  farge = 'var(--gull)',
  etikett,
}: {
  punkter: { sek: number; verdi: number }[]
  format: (n: number) => string
  farge?: string
  etikett: string
}) {
  const id = useId()
  if (punkter.length < 2) {
    return <p className="graf-tom">Grafen fylles ut etter hvert som tiden går.</p>
  }

  const førsteSek = punkter[0].sek
  const spenn = Math.max(1, punkter[punkter.length - 1].sek - førsteSek)
  let min = Math.min(...punkter.map((p) => p.verdi))
  let maks = Math.max(...punkter.map((p) => p.verdi))
  if (maks - min < Math.abs(maks) * 1e-6 + 1e-9) {
    maks += Math.abs(maks) * 0.01 + 1
    min -= Math.abs(min) * 0.01 + 1
  }
  const luft = (maks - min) * 0.08
  const bunn = min - luft
  const topp = maks + luft

  const x = (sek: number) => ((sek - førsteSek) / spenn) * B
  const y = (v: number) => H - ((v - bunn) / (topp - bunn)) * H
  const linje = punkter.map((p) => `${x(p.sek).toFixed(1)},${y(p.verdi).toFixed(1)}`).join(' ')
  const flate = `0,${H} ${linje} ${B},${H}`

  return (
    <figure className="graf">
      <div className="graf-akse-y">
        <span>{format(maks)}</span>
        <span>{format(min)}</span>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" role="img" aria-label={etikett}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={farge} stopOpacity="0.35" />
            <stop offset="1" stopColor={farge} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={H / 2} x2={B} y2={H / 2} className="graf-rutenett" />
        <polygon points={flate} fill={`url(#${CSS.escape(id)})`} />
        <polyline points={linje} fill="none" className="graf-linje" style={{ stroke: farge }} />
      </svg>
      <figcaption className="graf-akse-x">
        <span>for {varighet(spenn)} siden</span>
        <span>nå</span>
      </figcaption>
    </figure>
  )
}

/** Liten trendlinje uten akser, farget etter retning. */
export function Minigraf({ verdier }: { verdier: number[] }) {
  if (verdier.length < 2) return null
  const min = Math.min(...verdier)
  const maks = Math.max(...verdier)
  const spenn = maks - min || 1
  const punkter = verdier
    .map((v, i) => `${((i / (verdier.length - 1)) * 60).toFixed(1)},${(22 - ((v - min) / spenn) * 20).toFixed(1)}`)
    .join(' ')
  const opp = verdier[verdier.length - 1] >= verdier[0]
  return (
    <svg className="minigraf" viewBox="0 0 60 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={punkter} fill="none" stroke={opp ? 'var(--pluss)' : 'var(--minus)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
