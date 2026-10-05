import { memo, useId, type ReactNode } from 'react'
import { F } from './Illustrasjoner'

/**
 * Portrettene av de fire rivalene: en enkel byste i samme stil som de andre
 * tegningene — flate former fra paletten F, ingen omriss — på en rund
 * medaljong med rivalens faste farge i kanten. Fargen går igjen på
 * Forbes-lista og i avisa, så du kjenner dem igjen.
 */

export type RivalId = 'gronn' | 'lunde' | 'fjeld' | 'aas'

/** Rivalens faste farge: kanten rundt portrettet og merket på lista. */
export const RIVALFARGE: Record<RivalId, string> = {
  gronn: F.gronn,
  lunde: F.blaa,
  fjeld: F.rod,
  aas: F.oransje,
}

interface Byste {
  jakke: string
  /** Skjorte eller bluse i V-en. */
  skjorte: string
  /** Bak hodet (langt hår, knute) — tegnes før ansiktet. */
  bak?: ReactNode
  /** Håret over ansiktet, skjegg, briller og smykker. */
  foran: ReactNode
  slips?: string
}

const BYSTER: Record<RivalId, Byste> = {
  // Harald Grønn: den eldste, grått hår og skjegg, grønn dress.
  gronn: {
    jakke: F.gronnMork,
    skjorte: F.hvit,
    slips: F.vin,
    foran: (
      <>
        <path d="M16.5 21c0-6.2 3.1-10 7.5-10s7.5 3.8 7.5 10c-1-3-2-4.6-3-5.1-1.6 1-6.2 1-9 0-1 .5-2 2.1-3 5.1z" fill={F.graa} />
        <path d="M16.8 24c0 6 3 9.6 7.2 9.6s7.2-3.6 7.2-9.6c-1 2.6-2.5 4-4 4.5-1.6-1-4.8-1-6.4 0-1.5-.5-3-1.9-4-4.5z" fill={F.graa} />
      </>
    ),
  },
  // Ingrid Lunde: lys hårknute, perleøredobber, blå dress.
  lunde: {
    jakke: F.blaaMork,
    skjorte: F.hvit,
    bak: <circle cx="24" cy="11.2" r="3.8" fill={F.brod} />,
    foran: (
      <>
        <path d="M16.3 23c-.5-7.6 3-12.2 7.7-12.2s8.2 4.6 7.7 12.2c-1.2-4-3.5-6.6-7.7-6.9-4.2.3-6.5 2.9-7.7 6.9z" fill={F.brod} />
        <circle cx="16.6" cy="25.6" r="0.9" fill={F.hvit} />
        <circle cx="31.4" cy="25.6" r="0.9" fill={F.hvit} />
      </>
    ),
  },
  // Sverre Fjeld: mørkt hår med skill, briller, vinrød dress.
  fjeld: {
    jakke: F.vin,
    skjorte: F.hvit,
    slips: F.marine,
    foran: (
      <>
        <path d="M16.4 21.5c-.3-6.6 3.2-10.6 7.6-10.6 4.6 0 8 3.6 7.6 10.1-1.5-3.5-4-5.2-8.5-5-2.2.1-4.2 1.3-5.5 3.2-.5.7-.9 1.5-1.2 2.3z" fill={F.treDyp} />
        <rect x="18.7" y="20.2" width="4.8" height="3.6" rx="1.3" fill="none" stroke={F.mork} strokeWidth="0.9" />
        <rect x="24.5" y="20.2" width="4.8" height="3.6" rx="1.3" fill="none" stroke={F.mork} strokeWidth="0.9" />
        <path d="M23.5 21.8h1" stroke={F.mork} strokeWidth="0.9" />
      </>
    ),
  },
  // Marit Aas: sølvgrå pageklipp, gullkjede og mørk dress.
  aas: {
    jakke: F.mork,
    skjorte: F.hvit,
    foran: (
      <>
        <path d="M15.8 26c-1-9 2.6-15 8.2-15s9.2 6 8.2 15h-2.6c.4-4-.6-7.5-2.6-8.6-2.2 1.4-5.6 1.4-8 0-2 1.1-3 4.6-2.6 8.6z" fill={F.lysgraa} />
        <path d="M19.6 36q4.4 4.2 8.8 0" fill="none" stroke={F.gull} strokeWidth="1" />
        <circle cx="24" cy="40.3" r="1.1" fill={F.gull} />
      </>
    ),
  },
}

export const RIVALPORTRETTER = Object.keys(BYSTER) as RivalId[]

/** Portrettet av en rival. Ukjent id gir ingenting. */
export const Rivalportrett = memo(function Rivalportrett({ id, størrelse = 40 }: { id: string; størrelse?: number }) {
  const klipp = useId()
  const b = BYSTER[id as RivalId]
  if (!b) return null
  return (
    <svg className="rivalportrett" width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <clipPath id={klipp}>
          <circle cx="24" cy="24" r="22" />
        </clipPath>
      </defs>
      <circle cx="24" cy="24" r="22" fill={F.krem} />
      <g clipPath={`url(#${CSS.escape(klipp)})`}>
        {b.bak}
        {/* Skuldrene og jakken, med skjorta i V-en. */}
        <path d="M7 48c0-9.5 7.5-14.5 17-14.5S41 38.5 41 48z" fill={b.jakke} />
        <path d="M19.8 34.4L24 42l4.2-7.6z" fill={b.skjorte} />
        {b.slips && <path d="M23.2 36.4h1.6l.9 6-1.7 2.1-1.7-2.1z" fill={b.slips} />}
        <rect x="21" y="28.5" width="6" height="6.5" rx="2" fill={F.hud} />
        <ellipse cx="16.8" cy="23" rx="1.6" ry="2.1" fill={F.hud} />
        <ellipse cx="31.2" cy="23" rx="1.6" ry="2.1" fill={F.hud} />
        <ellipse cx="24" cy="22" rx="7.4" ry="9" fill={F.hud} />
        <circle cx="21" cy="22" r="0.95" fill={F.mork} />
        <circle cx="27" cy="22" r="0.95" fill={F.mork} />
        {b.foran}
        <path d="M22 27.4q2 1.1 4 0" fill="none" stroke={F.murMork} strokeWidth="0.9" strokeLinecap="round" />
      </g>
      <circle cx="24" cy="24" r="22.6" fill="none" stroke={RIVALFARGE[id as RivalId]} strokeWidth="2.2" />
    </svg>
  )
})
