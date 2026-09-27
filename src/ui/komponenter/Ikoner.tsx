/**
 * Ikoner bygget av enkle former (rektangler, sirkler, polygoner) på et
 * 24×24-rutenett. Fanene bruker currentColor, så de følger temaet.
 */

import type { ReactNode } from 'react'

type Props = { størrelse?: number }

function Svg({ størrelse = 24, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={størrelse}
      height={størrelse}
      viewBox="0 0 24 24"
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

export function IkonBedrifter(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3" y="9" width="7" height="12" />
      <rect x="10" y="3" width="11" height="18" />
      <line x1="13.5" y1="7" x2="13.5" y2="7.01" />
      <line x1="17.5" y1="7" x2="17.5" y2="7.01" />
      <line x1="13.5" y1="11" x2="13.5" y2="11.01" />
      <line x1="17.5" y1="11" x2="17.5" y2="11.01" />
      <rect x="14" y="16" width="3" height="5" />
    </Svg>
  )
}

export function IkonInvesteringer(p: Props) {
  return (
    <Svg {...p}>
      <polyline points="3,17 9,11 13,14 21,6" />
      <polyline points="16,6 21,6 21,11" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </Svg>
  )
}

export function IkonEiendom(p: Props) {
  return (
    <Svg {...p}>
      <polygon points="3,11 12,3 21,11" />
      <rect x="5" y="11" width="14" height="10" />
      <rect x="10" y="15" width="4" height="6" />
    </Svg>
  )
}

export function IkonLuksus(p: Props) {
  return (
    <Svg {...p}>
      <polygon points="6,4 18,4 22,9 12,21 2,9" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <polyline points="9,4 12,9 15,4" />
      <polyline points="7.5,9 12,21 16.5,9" />
    </Svg>
  )
}

export function IkonProfil(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 A8 8 0 0 1 20 21" />
    </Svg>
  )
}

/** Saftboden: markise, disk og en kanne. Farget — ikke currentColor. */
export function IkonSaftbod({ størrelse = 48 }: Props) {
  return (
    <svg width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
      {/* stolper */}
      <rect x="9" y="16" width="2.5" height="22" fill="#8a6a3a" />
      <rect x="36.5" y="16" width="2.5" height="22" fill="#8a6a3a" />
      {/* markise: gule og hvite striper */}
      <polygon points="6,10 42,10 44,18 4,18" fill="#f4d35e" />
      <polygon points="13.2,10 20.4,10 20.8,18 12.4,18" fill="#fff7dc" />
      <polygon points="27.6,10 34.8,10 35.6,18 27.2,18" fill="#fff7dc" />
      <rect x="4" y="18" width="40" height="2" fill="#c9a227" />
      {/* disk */}
      <rect x="6" y="30" width="36" height="10" rx="1" fill="#b5835a" />
      <rect x="6" y="30" width="36" height="2.5" fill="#d19e6e" />
      {/* kanne og glass */}
      <rect x="16" y="22" width="7" height="8" rx="1.5" fill="#ffe066" stroke="#e0b400" strokeWidth="0.8" />
      <rect x="23" y="24" width="2" height="4" rx="1" fill="none" stroke="#e0b400" strokeWidth="1" />
      <rect x="28" y="25.5" width="3.5" height="4.5" rx="0.6" fill="#ffe066" stroke="#e0b400" strokeWidth="0.8" />
      <circle cx="19.5" cy="21.2" r="1.3" fill="#7bc043" />
    </svg>
  )
}
