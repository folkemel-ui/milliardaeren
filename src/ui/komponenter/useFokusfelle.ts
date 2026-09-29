import { useEffect, useRef, type RefObject } from 'react'

const FOKUSERBARE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Fokus for et vindu over spillet (avisen, velkomsten, gatebildet):
 * flytter fokus inn når vinduet åpnes, holder Tab inne i det, lukker på
 * Escape og gir fokus tilbake dit det var når vinduet lukkes.
 *
 * `boks` er selve vinduet og må ha tabIndex={-1}, så det kan ta imot
 * fokus selv. `lukk` kan være en ny funksjon hver gang — effekten kjører
 * bare når vinduet åpnes, ellers ville fokus hoppet tilbake hvert sekund.
 */
export function useFokusfelle(boks: RefObject<HTMLElement | null>, lukk: () => void) {
  const lukkRef = useRef(lukk)
  lukkRef.current = lukk

  useEffect(() => {
    const forrige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    boks.current?.focus({ preventScroll: true })

    const vedTast = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lukkRef.current()
        return
      }
      const b = boks.current
      if (e.key !== 'Tab' || !b) return
      const alle = [...b.querySelectorAll<HTMLElement>(FOKUSERBARE)].filter((el) => el.getClientRects().length > 0)
      if (alle.length === 0) {
        e.preventDefault()
        return
      }
      const forste = alle[0]
      const siste = alle[alle.length - 1]
      const aktiv = document.activeElement
      // Fokus utenfor vinduet (eller på selve vinduet) hentes inn igjen.
      if (!b.contains(aktiv) || aktiv === b) {
        e.preventDefault()
        ;(e.shiftKey ? siste : forste).focus()
      } else if (e.shiftKey && aktiv === forste) {
        e.preventDefault()
        siste.focus()
      } else if (!e.shiftKey && aktiv === siste) {
        e.preventDefault()
        forste.focus()
      }
    }
    window.addEventListener('keydown', vedTast)
    return () => {
      window.removeEventListener('keydown', vedTast)
      if (forrige?.isConnected) forrige.focus({ preventScroll: true })
    }
  }, [boks])
}
