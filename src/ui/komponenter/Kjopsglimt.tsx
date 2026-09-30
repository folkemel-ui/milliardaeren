import { useEffect } from 'react'
import type { Kjopsart } from '../hendelsesstrom'
import { useNy } from '../nymerker'
import { avsluttKjop, useKjop } from '../varsler'
import { Illustrasjon } from './Illustrasjoner'

const OVERSKRIFT: Record<Kjopsart, string> = {
  bedrift: 'Ny bedrift',
  eiendom: 'Ny eiendom',
  luksus: 'Nytt kjøp',
}

/** Så lenge øyeblikket står. Kort nok til at du aldri venter på det. */
const VARIGHET_MS = 1800

/**
 * Kjøpsøyeblikket: tegningen av det du nettopp kjøpte vokser frem midt på
 * skjermen med et gullskjær, og forsvinner av seg selv. Trykk går rett
 * gjennom, så det aldri står i veien for neste kjøp.
 */
export function Kjopsglimt() {
  const k = useKjop()

  useEffect(() => {
    if (!k) return
    const t = setTimeout(() => avsluttKjop(k.nr), VARIGHET_MS)
    return () => clearTimeout(t)
  }, [k])

  if (!k) return null
  return (
    <div key={k.nr} className="kjopsglimt" role="status">
      <div className="kjopsglimt-glod" aria-hidden="true" />
      <div className="kjopsglimt-bilde">
        <Illustrasjon id={k.id} størrelse={132} />
        <span className="kjopsglimt-skjaer" aria-hidden="true" />
      </div>
      <span className="kjopsglimt-overskrift">{OVERSKRIFT[k.art]}</span>
      <strong className="kjopsglimt-navn">{k.navn}</strong>
    </div>
  )
}

/** «NY» ved navnet på et kort, til kortet trykkes på (se nymerker.ts). */
export function NyMerke({ id }: { id: string }) {
  return useNy(id) ? <span className="merke gull ny">Ny</span> : null
}
