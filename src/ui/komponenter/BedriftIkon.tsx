import { memo, type ReactNode } from 'react'
import { aapneTing, type Ting } from '../detaljvisning'
import { FULL_RAMME, Illustrasjon, stegFor, trinnFor } from './Illustrasjoner'
import { Bredt, IScenen } from './Tegnestil'

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
/**
 * Bedrifter som vises som nærbilde (`NAERBILDER`) også på kortet, fordi
 * motivet ellers blir for lite på 44–60 px: saftboden (nær avstand, mye himmel
 * rundt) og pølseboden (en liten bu på gateavstand). Nærbildet gjør dem omtrent
 * halvannen til to ganger så store.
 */
const NAER_PAA_KORTET = new Set(['saftbod', 'polsebod'])

/**
 * Tegningene med full ramme (G13) fyller hele flisa: nærbildet går helt ut i de
 * runde hjørnene (52 px, 68 px stor), uten den runde masken og uten luft rundt.
 */
const fyllerFlisa = (type: string) => FULL_RAMME.includes(type)

// Faste mål, så memo-tegningen ikke får en ny liste hvert sekund (Pakke 64).
const NAER = [44, 44] as const
const NAER_STOR = [60, 60] as const
const FLIS = [52, 52] as const
const FLIS_STOR = [68, 68] as const

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
  if (fyllerFlisa(type)) {
    const px = stor ? 68 : 52
    return (
      <div className={`bedrift-ikon fylt${stor ? ' stor' : ''}${dempet ? ' dempet-ikon' : ''}`} aria-hidden="true">
        <Illustrasjon id={type} størrelse={px} trinn={trinnFor(nivaa)} forbedringer={forbedringer} naerbilde={stor ? FLIS_STOR : FLIS} />
      </div>
    )
  }
  return (
    <div className={`bedrift-ikon${stor ? ' stor' : ''}${dempet ? ' dempet-ikon' : ''}${NAER_PAA_KORTET.has(type) ? ' naer' : ''}`} aria-hidden="true">
      <Illustrasjon
        id={type}
        størrelse={stor ? 60 : 44}
        trinn={trinnFor(nivaa)}
        forbedringer={forbedringer}
        naerbilde={NAER_PAA_KORTET.has(type) ? (stor ? NAER_STOR : NAER) : undefined}
      />
    </div>
  )
})

/**
 * Tegningen stor, på en egen scene øverst i en detaljvisning. Bare her beveger
 * tegningene seg, og bare her følger de klokka (G10): natt når siden rundt
 * setter `--natt`, og klokkene viser ekte tid. Tegningene har himmel og luft
 * rundt seg, så de fyller hele scenens høyde.
 */
export const Scene = memo(function Scene({ type, nivaa, forbedringer = 0 }: { type: string; nivaa?: number; forbedringer?: number }) {
  // Full ramme (G13): scenen får tegningens form, 11:6, og tegningen fyller den helt.
  const full = FULL_RAMME.includes(type)
  return (
    <div className={full ? 'scene full' : 'scene'} aria-hidden="true">
      <IScenen.Provider value={true}>
        <Bredt.Provider value={true}>
          <Illustrasjon id={type} størrelse={172} trinn={trinnFor(nivaa)} forbedringer={forbedringer} steg={stegFor(nivaa)} />
        </Bredt.Provider>
      </IScenen.Provider>
    </div>
  )
})
