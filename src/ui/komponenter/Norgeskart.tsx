import type { ComponentProps } from 'react'
import { morke } from '../dagognatt'
import { VISNING } from '../norgeskartet'
import { useDel, vedBehov } from '../vedBehov'
import type { Norgeskart as Kartet } from './ved-behov/Norgeskart'

/**
 * Norgeskartet (G3) står i ved-behov/Norgeskart.tsx, utenfor startskriptet
 * (Grafikkpakke G12): kystlinjene er det meste av kartdataene, og spillet starter
 * på Bedrifter. Kartet hentes første gang Eiendom viser det, og i ro like etter
 * start (`forvarm` i ui/vedBehov.ts). Til da står havet alene, i samme størrelse og
 * med samme kveldsmørke, så ingenting under kartet hopper.
 */
const kartet = vedBehov('norgeskartet', () => import('./ved-behov/Norgeskart').then((m) => m.Norgeskart))

export function Norgeskart(p: ComponentProps<typeof Kartet>) {
  const Kartet = useDel(kartet)
  if (Kartet) return <Kartet {...p} />
  return (
    <div className="kart-ramme norgeskart-ramme">
      <svg
        className="norgeskart kart-natt"
        style={{ ['--natt' as string]: morke(p.s.sek).toFixed(3) }}
        viewBox={`${VISNING.x} ${VISNING.y} ${VISNING.bredde} ${VISNING.hoyde}`}
        aria-hidden="true"
      >
        <rect x={VISNING.x} y={VISNING.y} width={VISNING.bredde} height={VISNING.hoyde} rx="10" className="kart-hav" />
      </svg>
    </div>
  )
}
