import { memo } from 'react'
import { Illustrasjon, trinnFor } from './Illustrasjoner'

/**
 * Illustrasjonen i en rund flis — for bedrifter, eiendom og luksus. `stor`
 * brukes på kort der bildet er det viktigste (eiendom, jord, luksus).
 * Memoisert: tegningene er store SVG-er som sjelden endrer seg, og kortene
 * rundt dem tegnes på nytt hvert sekund. Med `nivaa` vokser en bedrift
 * (nivå 25, 50 og 100) — tegningen byttes bare når trinnet endrer seg.
 */
export const BedriftIkon = memo(function BedriftIkon({
  type,
  dempet = false,
  nivaa,
  stor = false,
}: {
  type: string
  dempet?: boolean
  nivaa?: number
  stor?: boolean
}) {
  return (
    <div className={`bedrift-ikon${stor ? ' stor' : ''}${dempet ? ' dempet-ikon' : ''}`} aria-hidden="true">
      <Illustrasjon id={type} størrelse={stor ? 60 : 44} trinn={trinnFor(nivaa)} />
    </div>
  )
})

/** Tegningen stor, på en egen scene øverst i en detaljvisning. */
export const Scene = memo(function Scene({ type, nivaa }: { type: string; nivaa?: number }) {
  return (
    <div className="scene" aria-hidden="true">
      <Illustrasjon id={type} størrelse={150} trinn={trinnFor(nivaa)} />
    </div>
  )
})
