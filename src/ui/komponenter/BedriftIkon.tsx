import { memo, type ReactNode } from 'react'
import { aapneTing, type Ting } from '../detaljvisning'
import { Illustrasjon, NY_STIL, trinnFor } from './Illustrasjoner'

/**
 * Bildet på kortet for noe du kan eie, som en knapp: den åpner detaljsiden
 * med den store scenen (G7). Hele kortet åpner den også (`trykkApner`); knappen
 * er for tastaturet og skjermlesere.
 */
export function Apneknapp({ ting, navn, children }: { ting: Ting; navn: string; children: ReactNode }) {
  return (
    <button className="aapne-bilde" aria-label={`Vis ${navn} stort`} onClick={() => aapneTing(ting)}>
      {children}
    </button>
  )
}

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
  forbedringer = 0,
  stor = false,
}: {
  type: string
  dempet?: boolean
  nivaa?: number
  forbedringer?: number
  stor?: boolean
}) {
  return (
    <div className={`bedrift-ikon${stor ? ' stor' : ''}${dempet ? ' dempet-ikon' : ''}`} aria-hidden="true">
      <Illustrasjon id={type} størrelse={stor ? 60 : 44} trinn={trinnFor(nivaa)} forbedringer={forbedringer} />
    </div>
  )
})

/**
 * Tegningen stor, på en egen scene øverst i en detaljvisning. Bare her beveger
 * tegningene seg. Tegningene i den nye stilen har himmel og luft rundt seg, så
 * de fyller hele scenens høyde.
 */
export const Scene = memo(function Scene({ type, nivaa, forbedringer = 0 }: { type: string; nivaa?: number; forbedringer?: number }) {
  return (
    <div className="scene" aria-hidden="true">
      <Illustrasjon id={type} størrelse={NY_STIL.includes(type) ? 172 : 150} trinn={trinnFor(nivaa)} forbedringer={forbedringer} />
    </div>
  )
})
