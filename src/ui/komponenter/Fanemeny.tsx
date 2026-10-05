import type { ReactNode } from 'react'
import { Ikon, IkonBedrifter, IkonEiendom, IkonInvesteringer, IkonLuksus, IkonProfil } from './Ikoner'
import { useNy } from '../nymerker'
import { Logo } from './Logo'

export type Fane = 'bedrifter' | 'investeringer' | 'eiendom' | 'luksus' | 'profil'

export const FANER: { id: Fane; navn: string; ikon: ReactNode }[] = [
  { id: 'bedrifter', navn: 'Bedrifter', ikon: <IkonBedrifter /> },
  { id: 'investeringer', navn: 'Investeringer', ikon: <IkonInvesteringer /> },
  { id: 'eiendom', navn: 'Eiendom', ikon: <IkonEiendom /> },
  { id: 'luksus', navn: 'Luksus', ikon: <IkonLuksus /> },
  { id: 'profil', navn: 'Profil', ikon: <IkonProfil /> },
]

/** Hva en fane som nettopp har åpnet, inneholder — til varselet. */
export const FANE_INNHOLD: Record<Fane, string> = {
  bedrifter: 'Bedriftene dine.',
  investeringer: 'Aksjer, krypto, fond og banken.',
  luksus: 'Biler, klokker, båter og fly — status gir mer inntekt.',
  eiendom: 'Hybler, leiligheter og hus som gir leie.',
  profil: 'Formuen, regnskapet og innstillingene.',
}

/**
 * Menyen nederst. En låst fane står grå med en hengelås; et trykk på den
 * forteller når den åpner. En fane som nettopp har åpnet, har en prikk til
 * du har vært innom.
 */
export function Fanemeny({ aktiv, velg, aapen }: { aktiv: Fane; velg: (f: Fane) => void; aapen: (f: Fane) => boolean }) {
  return (
    <nav className="fanemeny" aria-label="Hovedmeny">
      {/* Logoen står bare øverst i sidemenyen på en bred skjerm. */}
      <div className="fanemeny-logo" aria-hidden="true">
        <Logo størrelse={32} />
      </div>
      {FANER.map((f) => (
        <Faneknapp key={f.id} f={f} aktiv={f.id === aktiv} laast={!aapen(f.id)} velg={velg} />
      ))}
    </nav>
  )
}

function Faneknapp({ f, aktiv, laast, velg }: { f: (typeof FANER)[number]; aktiv: boolean; laast: boolean; velg: (f: Fane) => void }) {
  const ny = useNy(`fane:${f.id}`)
  return (
    <button
      className={`fane${aktiv ? ' aktiv' : ''}${laast ? ' laast' : ''}`}
      aria-current={aktiv ? 'page' : undefined}
      aria-disabled={laast || undefined}
      aria-label={laast ? `${f.navn}, låst` : ny ? `${f.navn}, ny` : undefined}
      onClick={() => velg(f.id)}
    >
      <span className="fane-ikon">
        {f.ikon}
        {laast && (
          <span className="fane-laas" aria-hidden="true">
            <Ikon navn="las" størrelse={11} />
          </span>
        )}
        {ny && !laast && <span className="fane-ny" aria-hidden="true" />}
      </span>
      <span>{f.navn}</span>
    </button>
  )
}
