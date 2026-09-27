import type { ReactNode } from 'react'
import { IkonBedrifter, IkonEiendom, IkonInvesteringer, IkonLuksus, IkonProfil } from './Ikoner'

export type Fane = 'bedrifter' | 'investeringer' | 'eiendom' | 'luksus' | 'profil'

export const FANER: { id: Fane; navn: string; ikon: ReactNode }[] = [
  { id: 'bedrifter', navn: 'Bedrifter', ikon: <IkonBedrifter /> },
  { id: 'investeringer', navn: 'Investeringer', ikon: <IkonInvesteringer /> },
  { id: 'eiendom', navn: 'Eiendom', ikon: <IkonEiendom /> },
  { id: 'luksus', navn: 'Luksus', ikon: <IkonLuksus /> },
  { id: 'profil', navn: 'Profil', ikon: <IkonProfil /> },
]

export function Fanemeny({ aktiv, velg }: { aktiv: Fane; velg: (f: Fane) => void }) {
  return (
    <nav className="fanemeny" aria-label="Hovedmeny">
      {FANER.map((f) => (
        <button
          key={f.id}
          className={f.id === aktiv ? 'fane aktiv' : 'fane'}
          aria-current={f.id === aktiv ? 'page' : undefined}
          onClick={() => velg(f.id)}
        >
          {f.ikon}
          <span>{f.navn}</span>
        </button>
      ))}
    </nav>
  )
}
