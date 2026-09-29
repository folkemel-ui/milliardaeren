import { memo } from 'react'
import { Illustrasjon } from './Illustrasjoner'

/**
 * Illustrasjonen i en rund flis — for bedrifter, eiendom og luksus.
 * Memoisert: tegningene er store SVG-er som aldri endrer seg, og kortene
 * rundt dem tegnes på nytt hvert sekund.
 */
export const BedriftIkon = memo(function BedriftIkon({ type, dempet = false }: { type: string; dempet?: boolean }) {
  return (
    <div className={dempet ? 'bedrift-ikon dempet-ikon' : 'bedrift-ikon'} aria-hidden="true">
      <Illustrasjon id={type} størrelse={44} />
    </div>
  )
})
