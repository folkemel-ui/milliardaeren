import { useEffect, useState, type ReactNode } from 'react'

/** Så lenge «Ja»-knappen står og venter før den går tilbake av seg selv. */
const ANGRE_MS = 6000

/**
 * En knapp for noe som ikke kan angres, som å selge. Første trykk spør;
 * så kommer «Ja» og «Avbryt» der knappen sto. Svarer du ikke, går den
 * tilbake av seg selv. Med `bekreft={false}` virker den som en vanlig knapp.
 */
export function Bekreftknapp({
  className = 'knapp',
  disabled,
  ja = 'Ja, selg',
  varsel,
  bekreft = true,
  onJa,
  children,
}: {
  className?: string
  disabled?: boolean
  ja?: string
  /** En linje om hva du mister, vist sammen med «Ja». */
  varsel?: string
  bekreft?: boolean
  onJa: () => void
  children: ReactNode
}) {
  const [spør, settSpør] = useState(false)

  useEffect(() => {
    if (!spør) return
    const t = setTimeout(() => settSpør(false), ANGRE_MS)
    return () => clearTimeout(t)
  }, [spør])

  if (!spør) {
    return (
      <button className={className} disabled={disabled} onClick={() => (bekreft ? settSpør(true) : onJa())}>
        {children}
      </button>
    )
  }

  const grunn = className.replace(/\bknapp-(gull|fare)\b/g, '').trim()
  const par = ['bekreft-par', /\bbred\b/.test(className) && 'bred', /\bknapp-liten\b/.test(className) && 'stablet'].filter(Boolean).join(' ')
  return (
    <span className={par} role="group" aria-label="Bekreft">
      {varsel && <span className="dempet liten bekreft-varsel">{varsel}</span>}
      <button
        className={`${grunn} knapp-fare`}
        autoFocus
        onClick={() => {
          settSpør(false)
          onJa()
        }}
      >
        {ja}
      </button>
      <button className={grunn} onClick={() => settSpør(false)}>
        Avbryt
      </button>
    </span>
  )
}
