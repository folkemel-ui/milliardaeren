import type { ComponentProps } from 'react'
import { FLY_REKKEFOLGE, LUKSUS, reiseNivaa } from '../../engine/eiendom'
import { morke } from '../dagognatt'
import { useDel, vedBehov } from '../vedBehov'
import type { Verdenskart as Kartet } from './ved-behov/Verdenskart'

/**
 * Verdenskartet (Pakke 45–46, G3) står i ved-behov/Verdenskart.tsx, utenfor
 * startskriptet (Grafikkpakke G12), sammen med kystlinjene til hele verden. Det
 * hentes første gang Eiendom viser det, og i ro like etter start (`forvarm` i
 * ui/vedBehov.ts). Til da står havet og teksten under kartet, i samme størrelse.
 */
const kartet = vedBehov('verdenskartet', () => import('./ved-behov/Verdenskart').then((m) => m.Verdenskart))

/** Kartets mål, som `BREDDE` og `HOYDE` i ui/verdenskartet.ts (som drar med seg kartdataene). */
export const VERDEN_BREDDE = 300
export const VERDEN_HOYDE = 200

/** Hva det neste flyet åpner, til teksten under kartet. */
const NESTE_STEG = ['Propellflyet åpner Norden.', 'Forretningsjeten åpner Europa: London, Berlin, Marbella og Zermatt.', 'Langdistansejeten åpner New York og Dubai.']

/** Teksten under kartet: hvor flyene dine tar deg, og hva det neste åpner. */
export function Verdenstekst({ nivaa }: { nivaa: number }) {
  return (
    <figcaption className="dempet liten">
      {nivaa === 0
        ? `Kjøp et fly under Luksus for å reise ut. ${NESTE_STEG[0]}`
        : nivaa < FLY_REKKEFOLGE.length
          ? `${LUKSUS[FLY_REKKEFOLGE[nivaa - 1]].navn} tar deg til byene på kartet. ${NESTE_STEG[nivaa]}`
          : 'Langdistansejeten tar deg hvor som helst.'}
    </figcaption>
  )
}

export function Verdenskart(p: ComponentProps<typeof Kartet>) {
  const Kartet = useDel(kartet)
  if (Kartet) return <Kartet {...p} />
  return (
    <figure className="verdenskart-ramme">
      <div className="kart-ramme">
        <svg
          className="verdenskart kart-natt"
          style={{ ['--natt' as string]: morke(p.s.sek).toFixed(3) }}
          viewBox={`0 0 ${VERDEN_BREDDE} ${VERDEN_HOYDE}`}
          aria-hidden="true"
        >
          <rect x="0" y="0" width={VERDEN_BREDDE} height={VERDEN_HOYDE} rx="8" className="kart-hav" />
        </svg>
      </div>
      <Verdenstekst nivaa={reiseNivaa(p.s)} />
    </figure>
  )
}
