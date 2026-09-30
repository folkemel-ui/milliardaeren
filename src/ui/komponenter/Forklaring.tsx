import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { FORKLARINGER, type Tema } from '../forklaringer'

/**
 * «?» ved en overskrift: et trykk viser en kort forklaring av systemet i en
 * boble under. Lukkes med et nytt trykk, trykk utenfor eller Escape.
 * Står inne i overskriften, så boblen følger den.
 */
export function Forklaring({ tema }: { tema: Tema }) {
  const [åpen, settÅpen] = useState(false)
  const id = useId()
  const rot = useRef<HTMLSpanElement>(null)
  const boble = useRef<HTMLSpanElement>(null)
  const f = FORKLARINGER[tema]

  // Boblen skal aldri gå utenfor skjermen: flytt den inn igjen hvis den stikker ut på en side.
  useLayoutEffect(() => {
    const b = boble.current
    if (!åpen || !b) return
    b.style.transform = ''
    const r = b.getBoundingClientRect()
    const marg = 8
    // Sidens egen bredde, ikke innerWidth: en boble som stikker ut, gjør innerWidth større på mobil.
    const bredde = document.documentElement.clientWidth
    const ut = r.right > bredde - marg ? bredde - marg - r.right : r.left < marg ? marg - r.left : 0
    if (ut) b.style.transform = `translateX(${ut}px)`
  }, [åpen])

  useEffect(() => {
    if (!åpen) return
    const utenfor = (e: Event) => {
      if (!rot.current?.contains(e.target as Node)) settÅpen(false)
    }
    const tast = (e: KeyboardEvent) => e.key === 'Escape' && settÅpen(false)
    document.addEventListener('pointerdown', utenfor)
    document.addEventListener('keydown', tast)
    return () => {
      document.removeEventListener('pointerdown', utenfor)
      document.removeEventListener('keydown', tast)
    }
  }, [åpen])

  return (
    <span className="forklaring" ref={rot}>
      <button
        type="button"
        className="forklaring-knapp"
        aria-label={`Hva er ${f.tittel.toLowerCase()}?`}
        aria-expanded={åpen}
        aria-controls={id}
        onClick={(e) => {
          // Står den i en sammenleggbar overskrift, skal ikke seksjonen også felles sammen.
          e.stopPropagation()
          settÅpen(!åpen)
        }}
      >
        ?
      </button>
      {åpen && (
        <span id={id} ref={boble} className="forklaring-boble" role="note">
          <strong>{f.tittel}</strong>
          <span>{f.tekst}</span>
        </span>
      )}
    </span>
  )
}
