import type { ReactNode } from 'react'
import { STARTUP_IDEER } from '../../engine/startups'
import { bland } from './Papirlogo'

/**
 * Logoene til startupene (Grafikkpakke G4): et merke med et symbol for bransjen,
 * i samme stil som aksjelogoene — en egen form i en egen farge, ingen flis bak.
 * Merkene tegnes på et 24×24-rutenett; `m` er merkefargen, `lys` en lysere tone.
 */

interface Merke {
  farge: string
  tegning: (m: string, lys: string) => ReactNode
}

const strek = (farge: string, bredde: number) =>
  ({ fill: 'none', stroke: farge, strokeWidth: bredde, strokeLinecap: 'round', strokeLinejoin: 'round' }) as const

export const STARTUPMERKER: Record<string, Merke> = {
  // Matbudet: en serveringsklokke i fart.
  Matbudet: {
    farge: '#c0602f',
    tegning: (m) => (
      <>
        <path fill={m} d="M6 16.5a8 8 0 0 1 16 0z" />
        <circle cx="14" cy="7.4" r="1.4" fill={m} />
        <path d="M4.5 18.5h19M1 10.5h3.4M1.6 13.6h2.4" {...strek(m, 1.6)} />
      </>
    ),
  },
  // Batterikraft: batteriet med lyn.
  Batterikraft: {
    farge: '#3a8a5e',
    tegning: (m) => (
      <>
        <path fillRule="evenodd" fill={m} d="M2.5 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2zM12.6 8.6L8.2 13.4h2.8l-1 3.9 4.4-4.9h-2.8z" />
        <path fill={m} d="M21.4 10.2h1.6v5.6h-1.6z" />
      </>
    ),
  },
  // Laksegen: en dråpe med en fisk i.
  Laksegen: {
    farge: '#2f8094',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M12 1.8c4.2 5.2 6.8 8.8 6.8 12.4a6.8 6.8 0 0 1-13.6 0c0-3.6 2.6-7.2 6.8-12.4z" />
        <path fill={lys} d="M8 15c1.4-2.2 4.2-2.6 6-1l1.8-1.4-.5 2.6.5 2.6-1.8-1.4c-1.8 1.6-4.6 1.2-6-1.4z" />
      </>
    ),
  },
  // Hyttebooking: en A-hytte med lys i vinduet.
  Hyttebooking: {
    farge: '#a0603a',
    tegning: (m, lys) => (
      <>
        <path fillRule="evenodd" fill={m} d="M2 21.5L12 2.5l10 19zM10.2 21.5v-5h3.6v5z" />
        <path fill={lys} d="M12 8.6l1.9 3.6h-3.8z" />
        <path d="M1 21.5h22" {...strek(m, 1.4)} />
      </>
    ),
  },
  // Nordrobot: en robotarm som griper.
  Nordrobot: {
    farge: '#5a6f8a',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M3 21.5h10v-2.2a5 5 0 0 0-10 0z" />
        <path d="M8 17.5l3-8.5 8.2-2.6" {...strek(m, 2.6)} />
        <path d="M19.2 6.4l2.4-2.2M19.2 6.4l2.8 1.4" {...strek(m, 1.6)} />
        <circle cx="11" cy="9" r="1.7" fill={lys} />
        <circle cx="8" cy="17.5" r="1.4" fill={lys} />
      </>
    ),
  },
  // Skygge AI: en form og skyggen dens, med en gnist.
  'Skygge AI': {
    farge: '#6a5a9a',
    tegning: (m, lys) => (
      <>
        <circle cx="14.2" cy="14.2" r="7" fill={lys} />
        <circle cx="10" cy="10" r="7" fill={m} />
        <path fill={m} d="M19.5 1.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </>
    ),
  },
  // Tareskog: tre tarestilker som svaier.
  Tareskog: {
    farge: '#5a7a3a',
    tegning: (m, lys) => (
      <>
        <path d="M7 22c-2-4 1.5-7-.5-11S7 4 8.5 2.5" {...strek(m, 2)} />
        <path d="M12.5 22c-1.6-3.4 1.6-6 0-9.5s.6-5.5 2-7" {...strek(lys, 2)} />
        <path d="M18 22c-1.8-3.6 1.4-6.4-.4-10s.4-6 2-7.5" {...strek(m, 2)} />
      </>
    ),
  },
  // Havvind Flyt: vindmølla på en flåte.
  'Havvind Flyt': {
    farge: '#3a7aa0',
    tegning: (m) => (
      <>
        <path d="M12 8.5v10.5" {...strek(m, 1.6)} />
        <path fill={m} d="M12 8.5L11 1.5 13.2 7.6zM12 8.5l6.6 2.6-6.4-.4zM12 8.5l-5.6 4.4 4.6-3.6z" />
        <circle cx="12" cy="8.5" r="1.3" fill={m} />
        <path fill={m} d="M7.5 19h9l-1 1.8h-7z" />
        <path d="M2 22.5q2.5-2 5 0t5 0t5 0t5 0" {...strek(m, 1.3)} />
      </>
    ),
  },
  // Snøfonn Spill: et snøkrystall med en spillknapp i midten.
  'Snøfonn Spill': {
    farge: '#4f86a8',
    tegning: (m, lys) => (
      <>
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10" {...strek(m, 1.6)} />
        <path d="M10 3.6l2 1.8 2-1.8M10 20.4l2-1.8 2 1.8M4.2 9.4l2.6-.6-.8-2.6M19.8 14.6l-2.6.6.8 2.6M4.2 14.6l2.6.6-.8 2.6M19.8 9.4l-2.6-.6.8-2.6" {...strek(m, 1.3)} />
        <circle cx="12" cy="12" r="4.4" fill={m} />
        <path fill={lys} d="M10.8 9.8l3.6 2.2-3.6 2.2z" />
      </>
    ),
  },
  // Karbonfangst: røyken fra pipa bøyes ned under havbunnen.
  Karbonfangst: {
    farge: '#5f6a6f',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M3.5 18V8.5h4V18z" />
        <path d="M5.5 6.5c0-3.4 3.4-4.6 6-3.4 3 1.4 3.6 4.8 3.6 7.6v6" {...strek(m, 2)} />
        <path d="M12.4 14.2l2.7 3 2.7-3" {...strek(m, 2)} />
        <path d="M1.5 18.8h21" {...strek(m, 1.6)} />
        <path d="M5 22h14" {...strek(lys, 1.6)} />
      </>
    ),
  },
  // Lommebanken: lommeboka med en mynt.
  Lommebanken: {
    farge: '#2f7a68',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M3 8.5a2.5 2.5 0 0 1 2.5-2.5h12a2 2 0 0 1 2 2v1h.5a1.5 1.5 0 0 1 1.5 1.5v8a2 2 0 0 1-2 2h-14A2.5 2.5 0 0 1 3 18z" />
        <path fill={lys} d="M15 12.5h6v4h-6a2 2 0 0 1 0-4z" />
        <path d="M3.4 8.2a2.2 2.2 0 0 0 2.2 2.2h14.2" {...strek(lys, 0.9)} />
      </>
    ),
  },
  // Helsesjekk: hjertet med pulsen.
  Helsesjekk: {
    farge: '#c04a5a',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M12 21.5C5.5 17 2.5 13.4 2.5 9.4a4.9 4.9 0 0 1 9.5-1.8 4.9 4.9 0 0 1 9.5 1.8c0 4-3 7.6-9.5 12.1z" />
        <path d="M3.5 12.5h4.4l1.6-3 2.4 6 2-4.2 1.2 1.2h5.4" {...strek(lys, 1.4)} />
      </>
    ),
  },
  // Norsk Romfart: en satellitt med solpaneler.
  'Norsk Romfart': {
    farge: '#5a62b0',
    tegning: (m, lys) => (
      <g transform="rotate(-35 12 12)">
        <path fill={m} d="M9.5 9.5h5v5h-5z" />
        <path fill={lys} d="M1.5 10h6.5v4H1.5zM16 10h6.5v4H16z" />
        <path d="M8 12h1.5M14.5 12H16M12 14.5v3" {...strek(m, 1.2)} />
        <path d="M9.6 19.4a3 3 0 0 1 4.8 0" {...strek(m, 1.4)} />
      </g>
    ),
  },
  // Elferja: ferja med lynet.
  Elferja: {
    farge: '#2f7aa8',
    tegning: (m, lys) => (
      <>
        <path fill={m} d="M7 9h9.5l1.5 4H5.5z" />
        <path fill={m} d="M1.5 13.5h21l-2.4 5.5H4.2z" />
        <path fill={lys} d="M12.8 14.2l-2.6 2.6h1.8l-.8 1.8 2.6-2.6H12z" />
        <path d="M10 6v3" {...strek(m, 1.4)} />
        <path d="M2 22.5q2.5-1.8 5 0t5 0t5 0t5 0" {...strek(m, 1.2)} />
      </>
    ),
  },
  // Fjellgrip: en karabin.
  Fjellgrip: {
    farge: '#b0702a',
    tegning: (m, lys) => (
      <>
        <path d="M9 3.5h3.5a5.5 5.5 0 0 1 5.4 6.6l-1.9 8.6a4 4 0 0 1-3.9 3.1h-.6a4 4 0 0 1-3.9-4.8L9.5 6A3 3 0 0 0 9 3.5z" {...strek(m, 2.3)} />
        <path d="M12.6 7.4l-2.2 9.6" {...strek(lys, 1.5)} />
      </>
    ),
  },
  // Kvitre: en småfugl som kvitrer.
  Kvitre: {
    farge: '#3a8ab0',
    tegning: (m, lys) => (
      <>
        <path fillRule="evenodd" fill={m} d="M2.5 17.5l4.4-2.2C6 14 5.6 12.6 5.6 11.2a7.4 7.4 0 0 1 12.6-5.3l3.8-.4-2.4 3c.6 4.8-1.4 9.4-6.6 10.8-2.4.7-4.8.4-6.6-.7zM14.6 7.8a1 1 0 1 0 2 0a1 1 0 1 0-2 0z" />
        <path fill={lys} d="M8 11.4c2.2 1.4 5 1.6 7.4.6-.8 2.8-3.4 4.6-6.2 4.4-1-.9-1.4-2.6-1.2-5z" />
      </>
    ),
  },
}

/** Ukjent navn (skal ikke skje): en enkel gnist. */
const RESERVE: Merke = {
  farge: '#6f7f8f',
  tegning: (m) => <path fill={m} d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" />,
}

export const STARTUPNAVN = STARTUP_IDEER.map((i) => i.navn)

/** Logoen til en startup. `størrelse` overstyrer de to faste (kjøpsøyeblikket, Avisa). */
export function StartupLogo({ navn, liten = false, størrelse }: { navn: string; liten?: boolean; størrelse?: number }) {
  const s = STARTUPMERKER[navn] ?? RESERVE
  const px = størrelse ?? (liten ? 22 : 40)
  return (
    <svg className={liten ? 'startup-logo liten' : 'startup-logo'} width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
      {s.tegning(s.farge, bland(s.farge, '#ffffff', 0.45))}
    </svg>
  )
}
