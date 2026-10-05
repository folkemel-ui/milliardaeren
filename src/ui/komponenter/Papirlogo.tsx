import { memo, type ReactNode } from 'react'
import { PAPIRER } from '../../engine/marked'
import type { PapirId } from '../../engine/types'
import { F } from './Illustrasjoner'

/**
 * Logoene til aksjene og kryptovalutaene: et eget merke på en farget flis,
 * som ekte selskapslogoer. Aksjer har en avrundet firkant, krypto en mynt.
 * Merkene er streker og flater på et 24×24-rutenett, i samme hvite eller
 * mørke farge, aldri tekst (SVG-tekst lekker inn i sidens tekst).
 */

const S = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

interface Logo {
  flis: string
  /** Merket tegnes i denne fargen. Hvit som standard; mørk på lyse fliser. */
  merke?: string
  tegning: (m: string, flis: string) => ReactNode
}

const LOGOER: Record<PapirId, Logo> = {
  // Nordfjord Sjømat: en fisk.
  NFS: {
    flis: F.marine,
    tegning: (m, flis) => (
      <>
        <path d="M4.5 12c2.6-3.6 7.2-4.6 10.8-2l3.2-2.6v9.2l-3.2-2.6C11.7 16.6 7.1 15.6 4.5 12z" fill={m} />
        <circle cx="8.6" cy="11.3" r="1" fill={flis} />
      </>
    ),
  },
  // Fjellkraft: bølger under en fjelltopp.
  FJK: {
    flis: F.tyrkisMork,
    tegning: (m) => (
      <>
        <path d="M7 10.5l5-5.5 5 5.5" {...S} stroke={m} />
        <path d="M4.5 14.5q2.5-2.4 5 0t5 0t5 0M4.5 18.5q2.5-2.4 5 0t5 0t5 0" {...S} stroke={m} />
      </>
    ),
  },
  // Vikingtelekom: signal.
  VTK: {
    flis: '#7a3e5a',
    tegning: (m) => (
      <>
        <circle cx="7.5" cy="16.5" r="1.8" fill={m} />
        <path d="M7.5 11a5.5 5.5 0 0 1 5.5 5.5M7.5 6a10.5 10.5 0 0 1 10.5 10.5" {...S} stroke={m} />
      </>
    ),
  },
  // Bergen Shipping: et anker.
  BSH: {
    flis: '#3f4f6b',
    tegning: (m) => (
      <>
        <circle cx="12" cy="6.3" r="1.7" {...S} stroke={m} />
        <path d="M12 8v10.5M8.5 10.5h7M6 13.5a6 6 0 0 0 12 0" {...S} stroke={m} />
      </>
    ),
  },
  // Polaris Olje: en oljedråpe under nordstjernen.
  POL: {
    flis: F.mork,
    tegning: (m) => (
      <>
        <path d="M12 7c2.8 3.6 4.6 6.1 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-2.3 1.8-4.8 4.6-8.4z" fill={m} />
        <path d="M17.6 2.6l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8z" fill={F.gull} />
      </>
    ),
  },
  // Nordlys Tech: nordlyset.
  NLT: {
    flis: F.gronnMork,
    tegning: (m) => (
      <>
        {/* Nordlyset som gardiner over horisonten. */}
        <path d="M6.5 16c-.3-4 .4-7.6 2.4-10.5M11 16c-.3-4.3.6-8 2.8-11M15.5 16c-.3-3.6.4-6.8 2.3-9.3" {...S} stroke={m} />
        <path d="M4.5 18.8h15" {...S} stroke={m} />
      </>
    ),
  },
  // Aurora Bioteknologi: en DNA-spiral.
  AUB: {
    flis: F.vin,
    tegning: (m) => <path d="M8.5 4.5c0 4 7 4 7 7.5s-7 3.5-7 7.5M15.5 4.5c0 4-7 4-7 7.5s7 3.5 7 7.5M9.6 7.2h4.8M9.6 16.8h4.8" {...S} stroke={m} />,
  },
  // Trollspill: en terning.
  TRS: {
    flis: F.murMork,
    tegning: (m) => (
      <>
        <rect x="5.5" y="5.5" width="13" height="13" rx="3" {...S} stroke={m} />
        <circle cx="9.3" cy="9.3" r="1.3" fill={m} />
        <circle cx="12" cy="12" r="1.3" fill={m} />
        <circle cx="14.7" cy="14.7" r="1.3" fill={m} />
      </>
    ),
  },
  // Nordre Bank: et banktempel.
  NRB: {
    flis: F.skifer,
    tegning: (m) => (
      <>
        <path d="M4.5 9.5L12 5l7.5 4.5z" fill={m} />
        <path d="M7 11.5v5M10.3 11.5v5M13.7 11.5v5M17 11.5v5M4.5 19h15" {...S} stroke={m} />
      </>
    ),
  },
  // Kurv Dagligvare: en handlekurv.
  KRV: {
    flis: F.gronnMork,
    tegning: (m) => (
      <>
        <path d="M8 10.5a4 4 0 0 1 8 0" {...S} stroke={m} />
        <path d="M4.5 10.5h15l-1.9 8H6.4z" fill={m} />
      </>
    ),
  },
  // Fjellfly: et fly sett ovenfra.
  FJF: {
    flis: F.blaa,
    tegning: (m) => (
      <path
        d="M12 4c.9 0 1.3 1 1.3 2.2v3.6l5.9 3.4v1.8l-5.9-1.8v3.5l2 1.5v1.4L12 18.8l-3.3.8v-1.4l2-1.5v-3.5l-5.9 1.8v-1.8l5.9-3.4V6.2C10.7 5 11.1 4 12 4z"
        fill={m}
      />
    ),
  },
  // Romfart Nord: en rakett.
  ROM: {
    flis: '#6b4e9c',
    tegning: (m, flis) => (
      <>
        <path d="M12 4c2.6 2.1 3.6 5.1 3.6 8.6v3.4H8.4v-3.4C8.4 9.1 9.4 6.1 12 4z" fill={m} />
        <circle cx="12" cy="10" r="1.4" fill={flis} />
        <path d="M8.4 12.5l-2.2 3.3v2.4l2.2-1.6M15.6 12.5l2.2 3.3v2.4l-2.2-1.6M10.5 18.5v1.5M13.5 18.5v1.5" {...S} strokeWidth={1.5} stroke={m} />
      </>
    ),
  },
  // Bitmynt: en blokk i kjeden.
  BMT: {
    flis: F.gullMork,
    tegning: (m) => (
      <>
        <path d="M12 5.5l5.6 3.2v6.6L12 18.5l-5.6-3.2V8.7z" {...S} stroke={m} />
        <path d="M6.4 8.7L12 12l5.6-3.3M12 12v6.5" {...S} strokeWidth={1.4} stroke={m} />
      </>
    ),
  },
  // Fjordium: en fjord mellom fjellene.
  FJD: {
    flis: F.sjoMork,
    tegning: (m) => <path d="M5 7.5l4.5 8 2.5-4 2.5 4 4.5-8M8.5 18.5h7" {...S} stroke={m} />,
  },
  // Nordsol: en sol.
  NSL: {
    flis: F.gulMork,
    merke: F.mork,
    tegning: (m) => (
      <>
        <circle cx="12" cy="12" r="3.4" fill={m} />
        <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M6.7 17.3l1.4-1.4M15.9 8.1l1.4-1.4" {...S} stroke={m} />
      </>
    ),
  },
  // Trollmynt: et troll — et fjell med øyne.
  TRM: {
    flis: F.skifer,
    tegning: (m, flis) => (
      <>
        <path d="M12 5l7 13H5z" fill={m} />
        <circle cx="10.4" cy="13.2" r="1" fill={flis} />
        <circle cx="13.6" cy="13.2" r="1" fill={flis} />
      </>
    ),
  },
  // Vikingtoken: et vikingskip.
  VKT: {
    flis: F.vinMork,
    tegning: (m) => (
      <>
        <path d="M4.5 13h15c-1 3.2-3.6 4.8-7.5 4.8S5.5 16.2 4.5 13z" fill={m} />
        <path d="M9 6h6v5.5H9z" fill={m} />
        <path d="M12 5v8" {...S} strokeWidth={1.4} stroke={m} />
      </>
    ),
  },
  // Laksecoin: en laks i sprang.
  LKS: {
    flis: F.rod,
    tegning: (m, flis) => (
      <g transform="rotate(-28 12 12)">
        <path d="M4.5 12c2.6-3.6 7.2-4.6 10.8-2l3.2-2.6v9.2l-3.2-2.6C11.7 16.6 7.1 15.6 4.5 12z" fill={m} />
        <circle cx="8.6" cy="11.3" r="1" fill={flis} />
      </g>
    ),
  },
  // Stabilkrone: en krone.
  STK: {
    flis: F.blaaMork,
    tegning: (m) => (
      <>
        <path d="M5 16l1-8 3.5 3.5L12 6.5l2.5 5L18 8l1 8z" fill={m} />
        <path d="M5.5 18.5h13" {...S} stroke={m} />
      </>
    ),
  },
  // Elgcoin: et elggevir.
  ELG: {
    flis: F.treDyp,
    tegning: (m) => (
      <>
        {/* Elgens skovlformede gevir over et smalt hode. */}
        <path d="M11 12.2L6.3 11 4.4 7.7l1.6.5.2-1.9 1.4 1.3.6-2 1.1 1.8 1.2-1.3.5 3.2z" fill={m} />
        <path d="M13 12.2l4.7-1.2 1.9-3.3-1.6.5-.2-1.9-1.4 1.3-.6-2-1.1 1.8-1.2-1.3-.5 3.2z" fill={m} />
        <path d="M10.1 11.6h3.8l-.5 5.6c0 1-.6 1.7-1.4 1.7s-1.4-.7-1.4-1.7z" fill={m} />
      </>
    ),
  },
  // Brunostcoin: en brunostblokk.
  BRN: {
    flis: F.treMork,
    tegning: (m) => <path d="M5 10l7-3.5 7 3.5v6.5l-7 3.5-7-3.5zM5 10l7 3.5 7-3.5M12 13.5V20" {...S} stroke={m} />,
  },
}

export const PAPIRLOGOER = Object.keys(LOGOER) as PapirId[]

/** Logoen til et papir. `størrelse` er sidelengden i piksler. */
export const Papirlogo = memo(function Papirlogo({ id, størrelse = 32 }: { id: PapirId; størrelse?: number }) {
  const l = LOGOER[id]
  if (!l) return null
  const mynt = PAPIRER[id].klasse === 'krypto'
  const merke = l.merke ?? F.hvit
  return (
    <svg className="papirlogo" width={størrelse} height={størrelse} viewBox="0 0 24 24" aria-hidden="true">
      {mynt ? (
        <>
          <circle cx="12" cy="12" r="12" fill={l.flis} />
          {/* Kanten på mynten. */}
          <circle cx="12" cy="12" r="10.6" fill="none" stroke={merke} strokeOpacity="0.28" strokeWidth="0.8" />
        </>
      ) : (
        <rect width="24" height="24" rx="6" fill={l.flis} />
      )}
      <g transform="translate(12 12) scale(0.82) translate(-12 -12)">{l.tegning(merke, l.flis)}</g>
    </svg>
  )
})
