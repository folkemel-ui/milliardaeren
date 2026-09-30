/**
 * Ikonene: enkle strektegninger på et 24×24-rutenett, i currentColor, så de
 * følger temaet og fargen på teksten rundt. Spillet bruker ikke emoji — trenger
 * du et symbol, tegn det her i samme stil (strek 1,8, runde ender, ingen fyll
 * utenom små prikker).
 *
 * Bruk <Ikon navn="…" />. Inne i en annen SVG (kartet) kan x og y plassere det.
 */

import type { ReactNode } from 'react'

type Props = { størrelse?: number }

function Svg({ størrelse = 24, x, y, children }: Props & { x?: number; y?: number; children: ReactNode }) {
  return (
    <svg
      width={størrelse}
      height={størrelse}
      x={x}
      y={y}
      viewBox="0 0 24 24"
      className="ikon"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** En liten fylt prikk, til utropstegn og lignende. */
const Prikk = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r="1.1" fill="currentColor" stroke="none" />

const TEGNINGER = {
  // ── Fanene
  bedrift: (
    <>
      <rect x="3" y="9" width="7" height="12" />
      <rect x="10" y="3" width="11" height="18" />
      <line x1="13.5" y1="7" x2="13.5" y2="7.01" />
      <line x1="17.5" y1="7" x2="17.5" y2="7.01" />
      <line x1="13.5" y1="11" x2="13.5" y2="11.01" />
      <line x1="17.5" y1="11" x2="17.5" y2="11.01" />
      <rect x="14" y="16" width="3" height="5" />
    </>
  ),
  graf: (
    <>
      <polyline points="3,17 9,11 13,14 21,6" />
      <polyline points="16,6 21,6 21,11" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </>
  ),
  hus: (
    <>
      <polygon points="3,11 12,3 21,11" />
      <rect x="5" y="11" width="14" height="10" />
      <rect x="10" y="15" width="4" height="6" />
    </>
  ),
  diamant: (
    <>
      <polygon points="6,4 18,4 22,9 12,21 2,9" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <polyline points="9,4 12,9 15,4" />
      <polyline points="7.5,9 12,21 16.5,9" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 A8 8 0 0 1 20 21" />
    </>
  ),

  // ── Beskjeder og tilstand
  gnist: <path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z" />,
  advarsel: (
    <>
      <path d="M12 3.5 L21.5 20 H2.5 Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <Prikk x={12} y={17} />
    </>
  ),
  alarm: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="7.5" x2="12" y2="13" />
      <Prikk x={12} y={16.3} />
    </>
  ),
  bjelle: (
    <>
      <path d="M6 16.5 V11 A6 6 0 0 1 18 11 V16.5 L20 18.5 H4 Z" />
      <path d="M10 21 A2 2 0 0 0 14 21" />
    </>
  ),
  las: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
    </>
  ),
  sok: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </>
  ),
  kran: (
    <>
      <polyline points="6,21 6,4 20,4" />
      <line x1="6" y1="8.5" x2="10.5" y2="4" />
      <line x1="17" y1="4" x2="17" y2="10" />
      <rect x="15" y="10" width="4" height="3" />
      <line x1="3" y1="21" x2="10" y2="21" />
    </>
  ),
  pil: (
    <>
      <polyline points="5,11 12,4 19,11" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </>
  ),
  lyn: <polygon points="13,2 4.5,14 11,14 10,22 19.5,9.5 13,9.5" />,
  stjerne: <polygon points="12,3 14.6,9 21,9.6 16.1,13.8 17.6,20.2 12,16.8 6.4,20.2 7.9,13.8 3,9.6 9.4,9" />,
  mane: <path d="M20 14.5 A8.5 8.5 0 1 1 9.5 4 A6.5 6.5 0 0 0 20 14.5 Z" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((v) => {
        const r = (v * Math.PI) / 180
        return <line key={v} x1={12 + Math.cos(r) * 7} y1={12 + Math.sin(r) * 7} x2={12 + Math.cos(r) * 9.5} y2={12 + Math.sin(r) * 9.5} />
      })}
    </>
  ),

  // ── Penger og handel
  mynt: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
    </>
  ),
  kvittering: (
    <>
      <path d="M6 3 H18 V21 L15 19 L12 21 L9 19 L6 21 Z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </>
  ),
  bank: (
    <>
      <polygon points="3,9 12,3.5 21,9" />
      {[6, 10, 14, 18].map((x) => (
        <line key={x} x1={x} y1="11" x2={x} y2="17.5" />
      ))}
      <line x1="3" y1="20.5" x2="21" y2="20.5" />
    </>
  ),
  stolper: (
    <>
      <rect x="4" y="12" width="4" height="8" />
      <rect x="10" y="7" width="4" height="13" />
      <rect x="16" y="10" width="4" height="10" />
    </>
  ),
  avis: (
    <>
      <rect x="3" y="5" width="15" height="14" rx="1.5" />
      <path d="M18 9 H21 V17 A2 2 0 0 1 17 19" />
      <line x1="6.5" y1="9" x2="14.5" y2="9" />
      <line x1="6.5" y1="12.5" x2="14.5" y2="12.5" />
      <line x1="6.5" y1="16" x2="11" y2="16" />
    </>
  ),
  kopp: (
    <>
      <path d="M6 8 H17 L15.5 20.5 H7.5 Z" />
      <line x1="13.5" y1="8" x2="16.5" y2="2.5" />
    </>
  ),
  folk: (
    <>
      {[5.5, 12, 18.5].map((x) => (
        <g key={x}>
          <circle cx={x} cy="8" r="2.2" />
          <path d={`M${x - 3} 19.5 V16 A3 3 0 0 1 ${x + 3} 16 V19.5`} />
        </g>
      ))}
    </>
  ),
  personer: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20 A6.5 6.5 0 0 1 15.5 20" />
      <path d="M15.5 4.8 A3.4 3.4 0 0 1 15.5 11.2" />
      <path d="M17.5 13.8 A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  nokkel: (
    <>
      <circle cx="8" cy="16" r="4" />
      <line x1="11" y1="13" x2="20" y2="4" />
      <line x1="16.5" y1="7.5" x2="19" y2="10" />
      <line x1="14" y1="10" x2="16" y2="12" />
    </>
  ),
  fusjon: (
    <>
      <rect x="3" y="3" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="11" height="11" rx="2" />
    </>
  ),
  drape: <path d="M12 3 Q6 11 6 15 A6 6 0 0 0 18 15 Q18 11 12 3 Z" />,

  // ── Utmerkelser
  krone: (
    <>
      <polygon points="3,18 3,8 8,12 12,5 16,12 21,8 21,18" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </>
  ),
  trofe: (
    <>
      <path d="M7 4 H17 V9 A5 5 0 0 1 7 9 Z" />
      <path d="M7 6 H4.5 A2.5 2.5 0 0 0 7 11" />
      <path d="M17 6 H19.5 A2.5 2.5 0 0 1 17 11" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <rect x="8" y="18" width="8" height="3" />
    </>
  ),
  medalje: (
    <>
      <circle cx="12" cy="15" r="6" />
      <polyline points="7.5,3 10.5,9.5" />
      <polyline points="16.5,3 13.5,9.5" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,8.3 15.4,10.8 14.1,14.8 9.9,14.8 8.6,10.8" />
      <line x1="12" y1="8.3" x2="12" y2="3" />
      <line x1="15.4" y1="10.8" x2="20.5" y2="9" />
      <line x1="14.1" y1="14.8" x2="17.3" y2="19.3" />
      <line x1="9.9" y1="14.8" x2="6.7" y2="19.3" />
      <line x1="8.6" y1="10.8" x2="3.5" y2="9" />
    </>
  ),
  ramme: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <polyline points="3,16 9,11 14,15 17,12 21,15" />
      <circle cx="16" cy="9" r="1.4" />
    </>
  ),

  // ── Steder og reise
  fly: <path d="M12 2.5 Q13.5 2.5 13.5 5 V9.5 L21 14 V16 L13.5 13.5 V19 L16 21 V22 L12 21 L8 22 V21 L10.5 19 V13.5 L3 16 V14 L10.5 9.5 V5 Q10.5 2.5 12 2.5 Z" />,
  globus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  fjell: (
    <>
      <polygon points="2,20 9,8 13,14 16,10 22,20" />
      <polyline points="7,11.4 9,13 10.8,11" />
    </>
  ),
  aks: (
    <>
      <line x1="12" y1="21" x2="12" y2="6" />
      <line x1="12" y1="15" x2="8.5" y2="11.5" />
      <line x1="12" y1="15" x2="15.5" y2="11.5" />
      <line x1="12" y1="10.5" x2="9" y2="7.5" />
      <line x1="12" y1="10.5" x2="15" y2="7.5" />
      <line x1="12" y1="6" x2="12" y2="3" />
    </>
  ),
  gran: (
    <>
      <polygon points="12,3 17.5,10.5 15,10.5 19,17 5,17 9,10.5 6.5,10.5" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </>
  ),
  fyr: (
    <>
      <polygon points="9,21 10.5,9 13.5,9 15,21" />
      <rect x="9.5" y="4.5" width="5" height="4.5" />
      <line x1="16.5" y1="5.5" x2="21" y2="3.5" />
      <line x1="16.5" y1="8" x2="21" y2="8" />
      <line x1="5" y1="21" x2="19" y2="21" />
    </>
  ),
  hoppbakke: (
    <>
      <path d="M3 5 Q8 17 21 19.5" />
      <circle cx="16.5" cy="5.5" r="1.6" />
      <line x1="12" y1="10.5" x2="20" y2="8" />
    </>
  ),
  borg: (
    <>
      <path d="M3 21 V8 H6 V10.5 H9 V8 H12 V10.5 H15 V8 H18 V10.5 H21 V21 Z" />
      <path d="M10 21 V17 A2 2 0 0 1 14 17 V21" />
    </>
  ),
  tarn: (
    <>
      <polygon points="10,21 11,8.6 13,8.6 14,21" />
      <circle cx="12" cy="7" r="2.4" />
      <line x1="12" y1="2" x2="12" y2="4.6" />
      <line x1="6" y1="21" x2="18" y2="21" />
    </>
  ),
  garasje: (
    <>
      <path d="M3 21 V9 L12 4 L21 9 V21" />
      <rect x="6.5" y="12" width="11" height="9" />
      <line x1="6.5" y1="15" x2="17.5" y2="15" />
      <line x1="6.5" y1="18" x2="17.5" y2="18" />
    </>
  ),
  anker: (
    <>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="21" />
      <line x1="8" y1="10.5" x2="16" y2="10.5" />
      <path d="M4.5 14 A7.5 7.5 0 0 0 19.5 14" />
    </>
  ),
  hangar: (
    <>
      <path d="M2.5 21 V12.5 A9.5 8 0 0 1 21.5 12.5 V21" />
      <rect x="7" y="14" width="10" height="7" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type Ikonnavn = keyof typeof TEGNINGER

export function Ikon({ navn, størrelse = 20, x, y }: { navn: Ikonnavn; størrelse?: number; x?: number; y?: number }) {
  return (
    <Svg størrelse={størrelse} x={x} y={y}>
      {TEGNINGER[navn]}
    </Svg>
  )
}

export const IKONNAVN = Object.keys(TEGNINGER) as Ikonnavn[]

// Fanemenyen og toppfeltet bruker disse direkte.
export const IkonBedrifter = (p: Props) => <Ikon navn="bedrift" størrelse={p.størrelse ?? 24} />
export const IkonInvesteringer = (p: Props) => <Ikon navn="graf" størrelse={p.størrelse ?? 24} />
export const IkonEiendom = (p: Props) => <Ikon navn="hus" størrelse={p.størrelse ?? 24} />
export const IkonLuksus = (p: Props) => <Ikon navn="diamant" størrelse={p.størrelse ?? 24} />
export const IkonProfil = (p: Props) => <Ikon navn="person" størrelse={p.størrelse ?? 24} />
