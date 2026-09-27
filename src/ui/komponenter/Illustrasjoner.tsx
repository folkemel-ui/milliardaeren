/**
 * Illustrasjonene for bedrifter, eiendom og luksus. Alle er bygget av enkle
 * former (rektangler, sirkler, ellipser, polygoner) på et 48×48-rutenett,
 * med faste farger, så de ser like ut i mørkt og lyst tema.
 *
 * Se dem store på ?galleri.
 */

import type { ReactNode } from 'react'
import { IkonSaftbod } from './Ikoner'

function Svg({ størrelse, children }: { størrelse: number; children: ReactNode }) {
  return (
    <svg width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  )
}

type P = { størrelse?: number }

// ─────────────────────────────────────────────── Bedrifter

function Polsebod({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="6" y="18" width="36" height="14" rx="7" fill="#d99a4e" />
      <rect x="2.5" y="19" width="43" height="9" rx="4.5" fill="#c0452b" />
      <rect x="7" y="20.5" width="30" height="2" rx="1" fill="#e2735a" />
      <polyline points="9,23 12.5,20.5 16,23 19.5,20.5 23,23 26.5,20.5 30,23 33.5,20.5 37,23 39.5,21" fill="none" stroke="#f5d000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="25" width="36" height="12" rx="6" fill="#f0b865" />
      <rect x="10" y="27" width="22" height="1.6" rx="0.8" fill="#f8d39a" />
    </Svg>
  )
}

function Kiosk({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="7" y="16" width="34" height="27" fill="#ece6d8" />
      <rect x="4" y="12" width="40" height="5" fill="#2f5d8a" />
      <polygon points="5,17 43,17 45,23 3,23" fill="#3b82c4" />
      <polygon points="11.3,17 17.6,17 18,23 10.7,23" fill="#ffffff" />
      <polygon points="23.9,17 30.2,17 31.2,23 23.8,23" fill="#ffffff" />
      <polygon points="36.5,17 42.8,17 44.3,23 37.2,23" fill="#ffffff" />
      <rect x="10" y="26" width="16" height="12" fill="#a8d8f0" stroke="#5b8fb0" strokeWidth="1" />
      <rect x="12" y="32" width="3" height="5" fill="#e76f51" />
      <rect x="16" y="30" width="3" height="7" fill="#f4a261" />
      <rect x="20" y="33" width="4" height="4" fill="#2a9d8f" />
      <rect x="30" y="26" width="8" height="17" fill="#7a5230" />
      <circle cx="36" cy="35" r="0.9" fill="#f5d000" />
      <rect x="16" y="5" width="16" height="7" rx="1.5" fill="#d64545" />
      <text x="24" y="10.6" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#ffffff" fontFamily="Inter, sans-serif">
        24
      </text>
    </Svg>
  )
}

function Kafe({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <path d="M17 15 q-2 -3 0 -6 q2 -3 0 -6" fill="none" stroke="#bfb6a8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M23 15 q-2 -3 0 -6 q2 -3 0 -6" fill="none" stroke="#bfb6a8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M29 15 q-2 -3 0 -6 q2 -3 0 -6" fill="none" stroke="#bfb6a8" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="24" cy="40.5" rx="19" ry="4" fill="#e7e0d4" />
      <ellipse cx="24" cy="40" rx="12" ry="2.4" fill="#d4cabb" />
      <circle cx="38" cy="26.5" r="5" fill="none" stroke="#cfc6b8" strokeWidth="5" />
      <circle cx="38" cy="26.5" r="5" fill="none" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 19 H37 V30 A9 9 0 0 1 28 39 H19 A9 9 0 0 1 10 30 Z" fill="#ffffff" stroke="#cfc6b8" strokeWidth="1" />
      <rect x="10.5" y="26" width="26" height="3" fill="#d4af37" />
      <ellipse cx="23.5" cy="19" rx="13.5" ry="2.6" fill="#6b3e1f" />
      <ellipse cx="21" cy="18.6" rx="4" ry="0.9" fill="#8a5530" />
    </Svg>
  )
}

function Restaurant({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <circle cx="24" cy="25" r="15.5" fill="#ffffff" stroke="#d8d2c6" strokeWidth="1.5" />
      <circle cx="24" cy="25" r="10.5" fill="none" stroke="#ece7dd" strokeWidth="1.5" />
      <ellipse cx="27" cy="27.5" rx="5.5" ry="3.4" fill="#a8432b" />
      <ellipse cx="26" cy="26.6" rx="3" ry="1.2" fill="#c65a3d" />
      <circle cx="20" cy="22.5" r="3.4" fill="#6fb33f" />
      <circle cx="22.5" cy="21" r="2.2" fill="#8fce5a" />
      <circle cx="19" cy="25" r="1.2" fill="#e63946" />
      <rect x="2.6" y="9" width="1.2" height="7" rx="0.6" fill="#9aa3ad" />
      <rect x="4.6" y="9" width="1.2" height="7" rx="0.6" fill="#9aa3ad" />
      <rect x="6.6" y="9" width="1.2" height="7" rx="0.6" fill="#9aa3ad" />
      <rect x="2.6" y="15" width="5.2" height="2.4" rx="1.2" fill="#9aa3ad" />
      <rect x="4.2" y="16" width="2" height="24" rx="1" fill="#9aa3ad" />
      <path d="M41 9 C44.5 12 44.5 20 42.4 23 L42.4 39 A1.2 1.2 0 0 1 40 39 L40 9 Z" fill="#9aa3ad" />
    </Svg>
  )
}

function Hotell({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (let rad = 0; rad < 6; rad++) {
    for (let kol = 0; kol < 3; kol++) {
      const tent = (rad * 3 + kol) % 4 !== 1
      vinduer.push(<rect key={`${rad}-${kol}`} x={15 + kol * 6} y={9 + rad * 4.4} width="4" height="2.8" fill={tent ? '#fde68a' : '#8fb3cc'} />)
    }
  }
  return (
    <Svg størrelse={størrelse}>
      <rect x="12" y="6" width="24" height="37" fill="#c9a26b" />
      <rect x="31" y="6" width="5" height="37" fill="#b38d58" />
      <rect x="10" y="3.5" width="28" height="3.5" fill="#7a5230" />
      {vinduer}
      <rect x="6" y="12" width="5" height="14" rx="1" fill="#b91c1c" />
      <text x="8.5" y="21.3" textAnchor="middle" fontSize="6" fontWeight="800" fill="#ffffff" fontFamily="Inter, sans-serif">
        H
      </text>
      <rect x="16" y="36" width="16" height="2.6" rx="0.8" fill="#b91c1c" />
      <rect x="20" y="38.4" width="8" height="4.6" fill="#3a2a1a" />
      <rect x="5" y="43" width="38" height="2" fill="#9ca3af" />
    </Svg>
  )
}

function Bank({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="4,16 24,4.5 44,16" fill="#cfcbc6" />
      <polygon points="11,14.6 24,7.8 37,14.6" fill="#e7e5e4" />
      <circle cx="24" cy="12" r="2.6" fill="#d4af37" />
      <rect x="6" y="16" width="36" height="3" fill="#e7e5e4" />
      {[9, 17, 27, 35].map((x) => (
        <g key={x}>
          <rect x={x} y="19" width="4" height="17" fill="#f5f5f4" />
          <rect x={x + 3} y="19" width="1" height="17" fill="#d6d3d1" />
        </g>
      ))}
      <rect x="6" y="36" width="36" height="3" fill="#d6d3d1" />
      <rect x="4" y="39" width="40" height="3.5" fill="#a8a29e" />
    </Svg>
  )
}

function Oljeselskap({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="0" y="37" width="48" height="11" fill="#1e5a8a" />
      <polyline points="2,41 6,40 10,41 14,40 18,41" fill="none" stroke="#6fa8d6" strokeWidth="1" strokeLinecap="round" />
      <polyline points="28,44 32,43 36,44 40,43 44,44" fill="none" stroke="#6fa8d6" strokeWidth="1" strokeLinecap="round" />
      <rect x="11" y="27" width="3" height="16" fill="#6b7280" />
      <rect x="34" y="27" width="3" height="16" fill="#6b7280" />
      <line x1="14" y1="30" x2="34" y2="38" stroke="#6b7280" strokeWidth="1.2" />
      <line x1="34" y1="30" x2="14" y2="38" stroke="#6b7280" strokeWidth="1.2" />
      <rect x="7" y="23.5" width="34" height="4" fill="#f59e0b" />
      <polygon points="15,23.5 20.5,6 23.5,6 29,23.5" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="17.2" y1="17" x2="26.8" y2="17" stroke="#9ca3af" strokeWidth="1.2" />
      <line x1="19" y1="11" x2="25" y2="11" stroke="#9ca3af" strokeWidth="1.2" />
      <rect x="36" y="11" width="2" height="12.5" fill="#6b7280" />
      <polygon points="37,2.5 40.5,8.5 37,11 33.5,8.5" fill="#f97316" />
      <polygon points="37,5.5 38.8,8.6 37,10 35.2,8.6" fill="#fde047" />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Eiendom

function Hybel({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="5" y="15" width="5" height="22" rx="1" fill="#8b5e34" />
      <rect x="5" y="30" width="38" height="5" rx="1" fill="#8b5e34" />
      <rect x="7" y="35" width="2.5" height="5" fill="#6b4526" />
      <rect x="38.5" y="35" width="2.5" height="5" fill="#6b4526" />
      <rect x="9" y="25" width="33" height="5.5" rx="1.5" fill="#f5f5f4" />
      <rect x="10.5" y="20" width="9" height="6" rx="3" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="18" y="23" width="24" height="7.5" rx="2" fill="#d64545" />
      <rect x="18" y="26" width="24" height="1.4" fill="#b83333" />
    </Svg>
  )
}

function Leilighet({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (let rad = 0; rad < 5; rad++) {
    for (let kol = 0; kol < 3; kol++) vinduer.push(<rect key={`${rad}-${kol}`} x={13.5 + kol * 8} y={11 + rad * 5.8} width="5" height="3.8" fill="#cfe7f5" />)
  }
  return (
    <Svg størrelse={størrelse}>
      <rect x="10" y="7" width="28" height="36" fill="#b5563c" />
      <rect x="9" y="5" width="30" height="3" fill="#7f3a28" />
      {vinduer}
      <rect x="21" y="37" width="6" height="6" fill="#4a2a1c" />
      <rect x="6" y="43" width="36" height="2" fill="#9ca3af" />
    </Svg>
  )
}

function Rekkehus({ størrelse = 48 }: P) {
  const hus = [
    { x: 3, farge: '#e9c46a', tak: '#9c6b30' },
    { x: 17, farge: '#f4a261', tak: '#8a4b2a' },
    { x: 31, farge: '#2a9d8f', tak: '#1f5f57' },
  ]
  return (
    <Svg størrelse={størrelse}>
      {hus.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y="22" width="14" height="20" fill={h.farge} />
          <polygon points={`${h.x - 1},23 ${h.x + 7},13 ${h.x + 15},23`} fill={h.tak} />
          <rect x={h.x + 2.5} y="26" width="4" height="4" fill="#ffffff" />
          <rect x={h.x + 8} y="33" width="4" height="9" fill="#5a3b24" />
        </g>
      ))}
      <rect x="2" y="42" width="44" height="2" fill="#9ca3af" />
    </Svg>
  )
}

function Hytte({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="0,30 14,8 24,22 32,12 48,30" fill="#94a3b8" />
      <polygon points="11,12.7 14,8 17,12.6 15,12 13,13" fill="#ffffff" />
      <polygon points="29.5,15.5 32,12 34.6,15.4 32.8,14.8 31,16" fill="#ffffff" />
      <rect x="0" y="36" width="48" height="12" fill="#f1f5f9" />
      <rect x="11" y="25" width="26" height="15" fill="#7c4a2d" />
      {[28, 31, 34, 37].map((y) => (
        <rect key={y} x="11" y={y} width="26" height="0.8" fill="#5e3620" />
      ))}
      <polygon points="8,26 24,15 40,26" fill="#3f2a1a" />
      <polygon points="8,26 24,15 40,26 38,26 24,17.3 10,26" fill="#ffffff" />
      <rect x="31" y="15" width="3" height="6" fill="#5e3620" />
      <rect x="14" y="29" width="6" height="5" fill="#fde68a" />
      <rect x="25" y="31" width="6" height="9" fill="#3a2414" />
    </Svg>
  )
}

function Kontorbygg({ størrelse = 48 }: P) {
  const linjer: ReactNode[] = []
  for (let y = 8; y < 44; y += 4) linjer.push(<rect key={y} x="14" y={y} width="20" height="0.8" fill="#9dd0ef" />)
  return (
    <Svg størrelse={størrelse}>
      <rect x="4" y="20" width="11" height="24" fill="#3d7fae" />
      <rect x="6" y="23" width="7" height="0.8" fill="#6aa6d0" />
      <rect x="6" y="28" width="7" height="0.8" fill="#6aa6d0" />
      <rect x="6" y="33" width="7" height="0.8" fill="#6aa6d0" />
      <polygon points="13,44 13,6 35,3 35,44" fill="#5aa6d6" />
      {linjer}
      <rect x="23.5" y="4" width="0.8" height="40" fill="#9dd0ef" />
      <polygon points="17,44 30,4 34,3.5 21,44" fill="#ffffff" opacity="0.25" />
      <rect x="3" y="44" width="42" height="2" fill="#9ca3af" />
    </Svg>
  )
}

function Kjopesenter({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="4" y="18" width="40" height="24" fill="#e5e7eb" />
      <rect x="3" y="15" width="42" height="4" fill="#6b7280" />
      <rect x="8" y="27" width="32" height="15" fill="#9fd3f0" />
      <rect x="23.5" y="27" width="1" height="15" fill="#6b7280" />
      <rect x="15.5" y="27" width="1" height="15" fill="#c9e6f6" />
      <rect x="31.5" y="27" width="1" height="15" fill="#c9e6f6" />
      <rect x="13" y="20.5" width="22" height="5" rx="1" fill="#db2777" />
      <rect x="21.5" y="21.6" width="5" height="3.4" rx="0.5" fill="#ffffff" />
      <path d="M22.6 21.8 V21 A1.4 1.4 0 0 1 25.4 21 V21.8" fill="none" stroke="#ffffff" strokeWidth="0.7" />
      <rect x="3" y="42" width="42" height="2" fill="#9ca3af" />
    </Svg>
  )
}

function Naeringsbygg({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="0" y="38" width="48" height="10" fill="#2563eb" />
      <polyline points="4,42 8,41 12,42 16,41" fill="none" stroke="#93c5fd" strokeWidth="1" strokeLinecap="round" />
      <polyline points="30,45 34,44 38,45 42,44" fill="none" stroke="#93c5fd" strokeWidth="1" strokeLinecap="round" />
      <rect x="5" y="14" width="16" height="24" fill="#b0b7c0" />
      {[17, 22, 27, 32].map((y) => (
        <rect key={y} x="6.5" y={y} width="13" height="2.2" fill="#4b5563" />
      ))}
      <polygon points="21,38 21,8 43,4 43,38" fill="#e5e7eb" />
      {[11, 16, 21, 26, 31].map((y) => (
        <polygon key={y} points={`23,${y + 2.5} 23,${y} 41,${y - 2.2} 41,${y + 0.3}`} fill="#1f2937" />
      ))}
      <rect x="3" y="37" width="42" height="1.6" fill="#78716c" />
    </Svg>
  )
}

function Oy({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <rect x="0" y="30" width="48" height="18" fill="#1e6fa8" />
      <polygon points="3,33 13,11 19,21 26,6 36,24 45,33" fill="#4b5563" />
      <polygon points="10.6,16.2 13,11 15.7,15.6 13.6,14.6 12,16.8" fill="#ffffff" />
      <polygon points="23.4,11.6 26,6 29.2,11.8 27,10.6 25,12.6" fill="#ffffff" />
      <polygon points="1,34 8,28 20,31 32,28 44,30 47,34" fill="#4d8b3a" />
      <rect x="30" y="27" width="8" height="5" fill="#b91c1c" />
      <polygon points="29,27.5 34,23.5 39,27.5" fill="#7f1d1d" />
      <rect x="33" y="29" width="2" height="3" fill="#ffffff" />
      <rect x="30.5" y="32" width="0.8" height="3" fill="#78350f" />
      <rect x="36.7" y="32" width="0.8" height="3" fill="#78350f" />
      <polyline points="6,40 10,39 14,40" fill="none" stroke="#7fb8e0" strokeWidth="1" strokeLinecap="round" />
      <polyline points="24,43 28,42 32,43 36,42" fill="none" stroke="#7fb8e0" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Luksus: biler

function Hjul({ x, r = 4.5, felg = '#9ca3af' }: { x: number; r?: number; felg?: string }) {
  return (
    <g>
      <circle cx={x} cy={36} r={r} fill="#1f2937" />
      <circle cx={x} cy={36} r={r * 0.45} fill={felg} />
    </g>
  )
}

function Stasjonsvogn({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="9,24 13,15 40,15 42,24" fill="#6b8fb3" />
      <rect x="3" y="23" width="42" height="11" rx="2.5" fill="#6b8fb3" />
      <polygon points="14.5,23 17,17 26,17 26,23" fill="#cfe7f5" />
      <polygon points="28,23 28,17 38.5,17 40,23" fill="#cfe7f5" />
      <rect x="3" y="27" width="42" height="1.2" fill="#56779a" />
      <rect x="42" y="25" width="3" height="2" rx="0.6" fill="#fde68a" />
      <rect x="14" y="13.5" width="24" height="1.6" rx="0.8" fill="#374151" />
      <Hjul x={13} />
      <Hjul x={36} />
    </Svg>
  )
}

function Elbil({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="3,33 4,27 14,24.5 20,17.5 33,17 41,23.5 45,26 45.5,33" fill="#e5e7eb" stroke="#94a3b8" strokeWidth="0.7" strokeLinejoin="round" />
      <polygon points="21,23.5 23.5,19.4 32.5,19.2 38.5,23.5" fill="#1f2937" />
      <rect x="28.5" y="19.3" width="1" height="4.2" fill="#e5e7eb" />
      <polygon points="24,25 21.5,30 23.8,30 22.5,33.5 27,28.3 24.6,28.3 26.4,25" fill="#22c55e" />
      <rect x="42" y="26.5" width="3.5" height="1.3" rx="0.6" fill="#93c5fd" />
      <Hjul x={12.5} felg="#e5e7eb" />
      <Hjul x={36.5} felg="#e5e7eb" />
    </Svg>
  )
}

/*
 * Sportsbilene tegnes med snuten mot venstre og speiles, så den lange, lave
 * panseret vender fremover (mot høyre, som de andre bilene) og kabinen og
 * spoileren havner bak.
 */
function Speilet({ children }: { children: ReactNode }) {
  return <g transform="translate(48 0) scale(-1 1)">{children}</g>
}

function Superbil({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Speilet>
        <polygon points="2,33 3,28.5 16,25.5 24,20 33,19.5 44,26 46,33" fill="#dc2626" />
        <polygon points="25,24.8 27.5,21.5 32.5,21.3 38.5,25.3" fill="#111827" />
        <polygon points="30,27 36,27 35,29.5 31,29.5" fill="#111827" />
        <rect x="3" y="30.5" width="43" height="1" fill="#991b1b" />
        <rect x="2.2" y="28.6" width="3" height="1.2" rx="0.5" fill="#fde68a" />
        <Hjul x={12} r={5} felg="#d4d4d4" />
        <Hjul x={37} r={5} felg="#d4d4d4" />
      </Speilet>
    </Svg>
  )
}

function Hyperbil({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Speilet>
        <rect x="37" y="20" width="9" height="1.8" rx="0.6" fill="#111827" stroke="#6b7280" strokeWidth="0.5" />
        <rect x="40" y="21.5" width="1.4" height="4" fill="#111827" />
        <polygon points="2,33.5 4,30 18,27.5 26,21.5 34,21.3 45,28 46,33.5" fill="#111827" stroke="#6b7280" strokeWidth="0.7" strokeLinejoin="round" />
        <polygon points="27,26 29,23.2 33.5,23 39,26.5" fill="#374151" />
        <polyline points="4,30.5 18,28.3 26,23 34,22.8 44.5,28.6" fill="none" stroke="#d4af37" strokeWidth="0.9" />
        <rect x="3" y="31.5" width="43" height="0.9" fill="#d4af37" />
        <rect x="2.6" y="30.2" width="3" height="1" rx="0.5" fill="#e0f2fe" />
        <Hjul x={12} r={5} felg="#d4af37" />
        <Hjul x={37} r={5} felg="#d4af37" />
      </Speilet>
    </Svg>
  )
}

// ─────────────────────────────────────────────── Luksus: klokker

function Klokke({ størrelse, rem, kasse, skive, visere, ekstra }: { størrelse: number; rem: string; kasse: string; skive: string; visere: string; ekstra?: ReactNode }) {
  const markører: ReactNode[] = []
  for (let i = 0; i < 12; i++) {
    const v = (i / 12) * Math.PI * 2
    markører.push(<circle key={i} cx={24 + Math.sin(v) * 7.6} cy={24 - Math.cos(v) * 7.6} r={i % 3 === 0 ? 0.9 : 0.5} fill={visere} />)
  }
  return (
    <Svg størrelse={størrelse}>
      <rect x="18.5" y="1.5" width="11" height="12" rx="2" fill={rem} />
      <rect x="18.5" y="34.5" width="11" height="12" rx="2" fill={rem} />
      <rect x="35" y="22.3" width="3.4" height="3.4" rx="0.8" fill={kasse} />
      <circle cx="24" cy="24" r="12.5" fill={kasse} />
      <circle cx="24" cy="24" r="10" fill={skive} />
      {markører}
      {ekstra}
      <line x1="24" y1="24" x2="24" y2="17.5" stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="24" y1="24" x2="29" y2="26.5" stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="24" cy="24" r="1" fill={visere} />
    </Svg>
  )
}

function Gullklokke({ størrelse = 48 }: P) {
  return <Klokke størrelse={størrelse} rem="#7c4a2d" kasse="#d4af37" skive="#fffbeb" visere="#3a2a1a" />
}

function Mesterverk({ størrelse = 48 }: P) {
  return (
    <Klokke
      størrelse={størrelse}
      rem="#9ca3af"
      kasse="#d1d5db"
      skive="#1e3a5f"
      visere="#f8fafc"
      ekstra={<circle cx="24" cy="29" r="2.6" fill="none" stroke="#93c5fd" strokeWidth="0.8" />}
    />
  )
}

function Diamantklokke({ størrelse = 48 }: P) {
  const steiner: ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    const v = (i / 16) * Math.PI * 2
    steiner.push(<circle key={i} cx={24 + Math.sin(v) * 11.3} cy={24 - Math.cos(v) * 11.3} r="1.1" fill={i % 2 ? '#e0f2fe' : '#ffffff'} />)
  }
  return (
    <Klokke
      størrelse={størrelse}
      rem="#111827"
      kasse="#d4af37"
      skive="#0b0b0f"
      visere="#d4af37"
      ekstra={
        <>
          {steiner}
          <polygon points="24,14.5 25.6,16.3 24,18.4 22.4,16.3" fill="#bae6fd" />
        </>
      }
    />
  )
}

// ─────────────────────────────────────────────── Luksus: båter

function Sjo() {
  return (
    <>
      <rect x="0" y="36" width="48" height="12" fill="#1e6fa8" />
      <polyline points="3,41 7,40 11,41 15,40" fill="none" stroke="#7fb8e0" strokeWidth="1" strokeLinecap="round" />
      <polyline points="31,44 35,43 39,44 43,43" fill="none" stroke="#7fb8e0" strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

function Snekke({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Sjo />
      <rect x="18" y="22" width="9" height="8" fill="#f5f5f4" />
      <rect x="19.5" y="24" width="6" height="3" fill="#93c5fd" />
      <rect x="17" y="20.5" width="11" height="2" fill="#b91c1c" />
      <polygon points="5,29 43,29 38,38 10,38" fill="#b45309" />
      <rect x="7" y="32" width="33" height="1" fill="#92400e" />
      <rect x="5" y="28.5" width="38" height="1.5" fill="#f5f5f4" />
    </Svg>
  )
}

function Motorbaat({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Sjo />
      <polyline points="2,37 6,35.5 2,34" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <polygon points="20,27 28,21 34,21 32,27" fill="#1f2937" opacity="0.85" />
      <polygon points="5,28 45,26 39,37 9,37" fill="#ffffff" />
      <polygon points="7,31 43,29.5 41.5,32 8,33" fill="#1d4ed8" />
      <rect x="10" y="26" width="10" height="2.3" rx="1" fill="#e5e7eb" />
    </Svg>
  )
}

function Superyacht({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Sjo />
      <rect x="27" y="8" width="1" height="7" fill="#9ca3af" />
      <circle cx="27.5" cy="8" r="1.6" fill="#e5e7eb" />
      <polygon points="17,19 32,19 34,15 19,15" fill="#ffffff" />
      <polygon points="12,24 38,24 40,19 14,19" fill="#ffffff" />
      <polygon points="8,29 44,29 46,24 10,24" fill="#f8fafc" />
      <rect x="20" y="16.3" width="11" height="1.4" fill="#111827" />
      <rect x="15" y="20.8" width="22" height="1.6" fill="#111827" />
      <rect x="11" y="25.8" width="31" height="1.6" fill="#111827" />
      <polygon points="3,30 47,28.5 42,38 7,38" fill="#ffffff" />
      <polygon points="5,33 45,32 44,33.8 6,34.8" fill="#0f172a" />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Luksus: fly (sett ovenfra)

function Propellfly({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="4,21 44,21 44,27 4,27" fill="#dc2626" />
      <rect x="4" y="21" width="5" height="6" fill="#ffffff" />
      <rect x="39" y="21" width="5" height="6" fill="#ffffff" />
      <polygon points="15,40 33,40 33,43.5 15,43.5" fill="#dc2626" />
      <rect x="21" y="6" width="6" height="38" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="22.2" y="11" width="3.6" height="4" rx="1.4" fill="#60a5fa" />
      <circle cx="24" cy="5.5" r="1.4" fill="#374151" />
      <rect x="16" y="4.6" width="16" height="1.8" rx="0.9" fill="#374151" />
    </Svg>
  )
}

function Forretningsjet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="24,15 44,30 44,33 24,27 4,33 4,30" fill="#b6bec9" stroke="#8a95a5" strokeWidth="0.7" strokeLinejoin="round" />
      <polygon points="24,38 34,43.5 34,45 24,42.5 14,45 14,43.5" fill="#b6bec9" stroke="#8a95a5" strokeWidth="0.7" strokeLinejoin="round" />
      <rect x="21.5" y="3" width="5" height="42" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="18" y="31" width="3" height="7" rx="1.5" fill="#9ca3af" />
      <rect x="27" y="31" width="3" height="7" rx="1.5" fill="#9ca3af" />
      <rect x="22.6" y="6.5" width="2.8" height="3.5" rx="1.2" fill="#1e3a5f" />
      <rect x="23.4" y="12" width="1.2" height="22" fill="#d4af37" />
    </Svg>
  )
}

function Langdistansejet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="24,14 46,30 46,33.5 24,26 2,33.5 2,30" fill="#aeb9c7" stroke="#8494a8" strokeWidth="0.7" strokeLinejoin="round" />
      <polygon points="24,37 35,43 35,45 24,41.5 13,45 13,43" fill="#aeb9c7" stroke="#8494a8" strokeWidth="0.7" strokeLinejoin="round" />
      <rect x="20" y="2" width="8" height="44" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
      {[
        [11, 25],
        [16.5, 21.2],
        [31.5, 21.2],
        [37, 25],
      ].map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx="1.6" ry="3" fill="#64748b" />
      ))}
      <rect x="21.8" y="5.5" width="4.4" height="3" rx="1.4" fill="#1e3a5f" />
      <rect x="20" y="40" width="8" height="6" rx="3" fill="#1d4ed8" />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Oppslag

const ILLUSTRASJONER: Record<string, (p: P) => ReactNode> = {
  saftbod: ({ størrelse }) => <IkonSaftbod størrelse={størrelse} />,
  polsebod: Polsebod,
  kiosk: Kiosk,
  kafe: Kafe,
  restaurant: Restaurant,
  hotell: Hotell,
  bank: Bank,
  oljeselskap: Oljeselskap,
  hybel: Hybel,
  leilighet: Leilighet,
  rekkehus: Rekkehus,
  hytte: Hytte,
  kontorbygg: Kontorbygg,
  kjopesenter: Kjopesenter,
  naeringsbygg: Naeringsbygg,
  oy: Oy,
  stasjonsvogn: Stasjonsvogn,
  elbil: Elbil,
  superbil: Superbil,
  hyperbil: Hyperbil,
  gullklokke: Gullklokke,
  mesterverk: Mesterverk,
  diamantklokke: Diamantklokke,
  snekke: Snekke,
  motorbaat: Motorbaat,
  superyacht: Superyacht,
  propellfly: Propellfly,
  forretningsjet: Forretningsjet,
  langdistansejet: Langdistansejet,
}

export const ILLUSTRASJONSIDER = Object.keys(ILLUSTRASJONER)

/** Illustrasjonen for en bedrift, eiendom eller luksusgjenstand, etter id. */
export function Illustrasjon({ id, størrelse = 44 }: { id: string; størrelse?: number }) {
  const Tegning = ILLUSTRASJONER[id]
  return Tegning ? <>{Tegning({ størrelse })}</> : null
}
