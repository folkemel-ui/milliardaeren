import { useEffect } from 'react'
import type { Kjopsart } from '../hendelsesstrom'
import { useNy } from '../nymerker'
import { avsluttKjop, useKjop } from '../varsler'
import { Illustrasjon } from './Illustrasjoner'

const OVERSKRIFT: Record<Kjopsart, string> = {
  bedrift: 'Ny bedrift',
  eiendom: 'Ny eiendom',
  luksus: 'Nytt kjøp',
  fusjon: 'Fusjon',
}

/** Så lenge øyeblikket står. Kort nok til at du aldri venter på det; en fusjon får litt lenger. */
const VARIGHET_MS = 1800
const FUSJON_MS = 2600

/**
 * Kjøpsøyeblikket: tegningen av det du nettopp kjøpte vokser frem midt på
 * skjermen med et gullskjær, og forsvinner av seg selv. Trykk går rett
 * gjennom, så det aldri står i veien for neste kjøp.
 */
export function Kjopsglimt() {
  const k = useKjop()

  useEffect(() => {
    if (!k) return
    const t = setTimeout(() => avsluttKjop(k.nr), k.art === 'fusjon' ? FUSJON_MS : VARIGHET_MS)
    return () => clearTimeout(t)
  }, [k])

  if (!k) return null
  return (
    <div key={k.nr} className={k.art === 'fusjon' ? 'kjopsglimt fusjon' : 'kjopsglimt'} role="status">
      <div className="kjopsglimt-glod" aria-hidden="true" />
      <div className="kjopsglimt-bilde">
        {/* Ved en fusjon glir rivalens bedrift inn i din og blir borte i den. */}
        {k.art === 'fusjon' && (
          <span className="fusjon-inn" aria-hidden="true">
            <Illustrasjon id={k.id} størrelse={96} />
          </span>
        )}
        <Illustrasjon id={k.id} størrelse={132} />
        <span className="kjopsglimt-skjaer" aria-hidden="true" />
      </div>
      <span className="kjopsglimt-overskrift">{OVERSKRIFT[k.art]}</span>
      <strong className="kjopsglimt-navn">{k.navn}</strong>
      {k.under && <span className="kjopsglimt-under">{k.under}</span>}
    </div>
  )
}

/** «NY» ved navnet på et kort, til kortet trykkes på (se nymerker.ts). */
export function NyMerke({ id }: { id: string }) {
  return useNy(id) ? <span className="merke gull ny">Ny</span> : null
}
