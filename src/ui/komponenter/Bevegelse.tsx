import { useEffect, useRef, useState, type ReactNode } from 'react'
import { redusertBevegelse, useBevegelse } from '../innstillinger'
import { F } from './Illustrasjoner'

/**
 * Bevegelse på kartene (Pakke 46): et fly eller en båt som følger en sti
 * fram og tilbake. Posisjonen settes rett på elementet hver ramme, så kartet
 * rundt ikke tegnes på nytt. Ved redusert bevegelse tegnes ingenting.
 *
 * `snu`: fly roteres etter retningen; båter speiles bare, så de aldri
 * seiler opp ned.
 */
export function Reisende({
  d,
  periode,
  forsinkelse = 0,
  snu = 'roter',
  children,
}: {
  d: string
  /** Millisekunder for én vei. */
  periode: number
  forsinkelse?: number
  snu?: 'roter' | 'speil'
  children: ReactNode
}) {
  const sti = useRef<SVGPathElement>(null)
  const ting = useRef<SVGGElement>(null)
  // Leses for at komponenten tegnes på nytt når valget i Innstillinger endres.
  useBevegelse()
  const stille = redusertBevegelse()

  useEffect(() => {
    if (stille) return
    let ramme = 0
    const start = performance.now() - forsinkelse
    const steg = (naa: number) => {
      const p = sti.current
      const g = ting.current
      if (p && g) {
        const lengde = p.getTotalLength()
        const t = (((naa - start) / periode) % 2 + 2) % 2
        const fram = t < 1
        const u = fram ? t : 2 - t
        // Myk start og landing.
        const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
        const pos = e * lengde
        const a = p.getPointAtLength(Math.max(0, pos - 0.6))
        const b = p.getPointAtLength(Math.min(lengde, pos + 0.6))
        const her = p.getPointAtLength(pos)
        let vinkel = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
        if (!fram) vinkel += 180
        const vend = snu === 'roter' ? `rotate(${vinkel.toFixed(1)})` : Math.cos((vinkel * Math.PI) / 180) < 0 ? 'scale(-1 1)' : ''
        g.setAttribute('transform', `translate(${her.x.toFixed(2)} ${her.y.toFixed(2)}) ${vend}`)
      }
      ramme = requestAnimationFrame(steg)
    }
    ramme = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(ramme)
  }, [d, periode, forsinkelse, snu, stille])

  if (stille) return null
  return (
    <g className="reisende" aria-hidden="true">
      <path ref={sti} d={d} fill="none" stroke="none" />
      <g ref={ting}>{children}</g>
    </g>
  )
}

/** Et lite fly sett ovenfra, med nesa mot høyre. */
export function Flysymbol({ storrelse = 1 }: { storrelse?: number }) {
  return (
    <path
      transform={`scale(${storrelse})`}
      d="M4.2 0 L-0.8 -0.8 L-1.4 -3.6 L-2.4 -3.6 L-2.4 -0.9 L-3.6 -0.6 L-4.1 -1.7 L-4.7 -1.7 L-4.5 0 L-4.7 1.7 L-4.1 1.7 L-3.6 0.6 L-2.4 0.9 L-2.4 3.6 L-1.4 3.6 L-0.8 0.8 Z"
      fill={F.hvit}
      stroke={F.mork}
      strokeWidth={0.5}
      strokeLinejoin="round"
    />
  )
}

/** Et lite kystskip sett fra siden, med baugen mot høyre. */
export function Skipsymbol() {
  return (
    <>
      <path d="M-4.4 0 L4.6 0 L3.4 1.8 L-3.6 1.8 Z" fill={F.rod} />
      <rect x="-2.6" y="-1.7" width="4.2" height="1.7" fill={F.hvit} />
      <rect x="0.2" y="-3" width="1" height="1.3" fill={F.mork} />
    </>
  )
}

/**
 * Et teller som går opp når antallet i en by øker — til en ring som brer seg
 * ut fra byen når du kjøper der. Første tegning teller ikke.
 */
export function usePuls(antall: number): number {
  const [puls, settPuls] = useState(0)
  const forrige = useRef(antall)
  useEffect(() => {
    if (antall > forrige.current) settPuls((p) => p + 1)
    forrige.current = antall
  }, [antall])
  return puls
}
