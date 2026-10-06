import { kronesti } from '../kart'
import { KRONEPLASS } from '../norgeskartet'

/** En boks i kartets enheter: øvre venstre hjørne, bredde og høyde. */
export type Boks = { x: number; y: number; b: number; h: number }

/**
 * Markøren for en by på kartene (Grafikkpakke G3): en liten, rolig prikk, og
 * antallet du eier i et lite merke ved siden av. Gull bare når du eier hele
 * byen — da med en liten krone i merket. Om kvelden lyser byene du eier, og en
 * ring brer seg ut når du kjøper noe der.
 */
export function Kartmerke({
  x,
  y,
  r,
  n,
  hel,
  natt,
  puls,
  glod,
  merke,
}: {
  x: number
  y: number
  r: number
  n: number
  hel: boolean
  /** Hvor mørkt det er på kartet, 0–1. */
  natt: number
  /** Teller som øker når du kjøper noe her; ny verdi gir en ny ring. */
  puls: number
  /** Id-en til gløden (radialgradienten) i kartets defs. */
  glod: string
  merke: Boks | null
}) {
  return (
    <>
      {n > 0 && natt > 0 && <circle cx={x} cy={y} r={r + 9} fill={`url(#${glod})`} className="kart-lys" style={{ opacity: natt }} />}
      {puls > 0 && <circle key={puls} cx={x} cy={y} r={r + 2} className="kart-puls" />}
      <circle cx={x} cy={y} r={r} className="kart-prikk" />
      {merke && n > 0 && (
        <g className="kart-merke">
          <rect x={merke.x} y={merke.y} width={merke.b} height={merke.h} rx={merke.h / 2} />
          {hel && <path d={kronesti(merke.x + 4.2, merke.y + merke.h - 2, 5)} className="kart-merke-krone" />}
          <text x={merke.x + (hel ? KRONEPLASS : 0) + (merke.b - (hel ? KRONEPLASS : 0)) / 2} y={merke.y + merke.h * 0.76} textAnchor="middle" className="kart-antall">
            {n}
          </text>
        </g>
      )}
    </>
  )
}

