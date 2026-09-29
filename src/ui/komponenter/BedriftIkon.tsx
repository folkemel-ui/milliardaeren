import { memo } from 'react'
import { Illustrasjon, trinnFor } from './Illustrasjoner'

/**
 * Illustrasjonen i en rund flis — for bedrifter, eiendom og luksus.
 * Memoisert: tegningene er store SVG-er som sjelden endrer seg, og kortene
 * rundt dem tegnes på nytt hvert sekund. Med `nivaa` vokser en bedrift
 * (nivå 25, 50 og 100) — tegningen byttes bare når trinnet endrer seg.
 */
export const BedriftIkon = memo(function BedriftIkon({ type, dempet = false, nivaa }: { type: string; dempet?: boolean; nivaa?: number }) {
  return (
    <div className={dempet ? 'bedrift-ikon dempet-ikon' : 'bedrift-ikon'} aria-hidden="true">
      <Illustrasjon id={type} størrelse={44} trinn={trinnFor(nivaa)} />
    </div>
  )
})
