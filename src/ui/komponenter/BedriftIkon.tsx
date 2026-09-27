import { BEDRIFTSTYPER } from '../../engine/innhold'
import type { BedriftstypeId } from '../../engine/types'
import { IkonSaftbod } from './Ikoner'

/** Bedriftens ikon i en rund flis. Emoji er plassholdere til SVG-ikonene kommer. */
export function BedriftIkon({ type, dempet = false }: { type: BedriftstypeId; dempet?: boolean }) {
  return (
    <div className={dempet ? 'bedrift-ikon dempet-ikon' : 'bedrift-ikon'} aria-hidden="true">
      {type === 'saftbod' ? <IkonSaftbod størrelse={44} /> : <span className="bedrift-emoji">{BEDRIFTSTYPER[type].emoji}</span>}
    </div>
  )
}
