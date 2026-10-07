import { memo, useId, type ReactNode } from 'react'
import type { MaleriId } from '../../engine/types'

/**
 * Maleriene (Grafikkpakke G6): hvert er sitt eget lille verk i kunstnerens stil,
 * i en ramme som passer tiden.
 *
 * - **Einar Solheim** (1911–1933): nasjonalromantisk fjord i morgenlys,
 *   nordlys over Vågen — og i 1933 ekspresjonismen i «Skrik i byen».
 *   Forgylt, utskåret ramme.
 * - **Tor Aske** (1950–60-tallet): realisme fra kysten, fiskebruket og stormen.
 *   Enkel ramme i eik.
 * - **Maja Lind** (1998–2004): fargefelt og modernistisk figur. Tynn svart ramme.
 * - **Ragnhild Vik** (2019–2021): flate, samtidige former. Tynn hvit ramme.
 *
 * Maleriene har egne farger, som ekte kunst; de er ikke tegninger og følger ikke
 * paletten. Lerretet er W × H enheter; rammen legges utenpå.
 */

type Ramme = 'gull' | 'tre' | 'svart' | 'hvit'

interface Verk {
  b: number
  h: number
  ramme: Ramme
  motiv: ReactNode
}

const RAMMEBREDDE: Record<Ramme, number> = { gull: 5, tre: 3.6, svart: 1.8, hvit: 1.8 }

/** En bølgete linje tvers over lerretet, til ekspresjonistiske himler og hav. */
const bolge = (y: number, a: number, b: number, n = 4) =>
  `M0 ${y} ` + Array.from({ length: n }, (_, i) => `Q${+((i + 0.5) * (b / n)).toFixed(2)} ${+(y + (i % 2 ? a : -a)).toFixed(2)} ${+((i + 1) * (b / n)).toFixed(2)} ${y}`).join(' ')

const VERK: Record<MaleriId, Verk> = {
  // Solheim 1911: fjorden i morgenlys, med seilbåt og solgløtt.
  morgenlys: {
    b: 60,
    h: 44,
    ramme: 'gull',
    motiv: (
      <>
        <rect width="60" height="10" fill="#b8a3ae" />
        <rect y="10" width="60" height="8" fill="#e2b8a4" />
        <rect y="18" width="60" height="10" fill="#f2d8b6" />
        <circle cx="40" cy="22" r="6" fill="#fbe9c6" opacity="0.85" />
        <polygon points="24,24 32,17 40,23 34,28 24,28" fill="#8e9fac" />
        <polygon points="0,12 14,7 22,18 30,28 0,29" fill="#4f6475" />
        <polygon points="0,12 14,7 12,14 4,22 0,24" fill="#647a8b" />
        <polygon points="60,9 47,13 39,23 34,28 60,29" fill="#5b7184" />
        <rect y="28" width="60" height="16" fill="#6f8ea3" />
        <polygon points="0,28 30,28 22,34 0,38" fill="#3f5263" opacity="0.6" />
        <polygon points="60,28 34,28 42,33 60,37" fill="#4a5f71" opacity="0.6" />
        {[30, 32.4, 35, 38].map((y, i) => (
          <ellipse key={y} cx="40" cy={y} rx={4 - i * 0.6} ry="0.5" fill="#f3d9b8" opacity={0.9 - i * 0.15} />
        ))}
        <path d="M17 34 h7 l-1.2 1.6 h-4.6 z" fill="#2c2420" />
        <polygon points="20.4,33.8 20.4,27.6 24,33.8" fill="#efe2c8" />
        <polygon points="0,40 12,37 22,44 0,44" fill="#3d4f3a" />
      </>
    ),
  },
  // Solheim 1924: nordlys over Vågen, med husrekka og lys i vinduene.
  'nordlys-over-vaagen': {
    b: 60,
    h: 44,
    ramme: 'gull',
    motiv: (
      <>
        <rect width="60" height="44" fill="#13292d" />
        <rect y="16" width="60" height="14" fill="#1b3a3b" />
        {[[6, 0.55], [14, 0.4], [22, 0.6], [32, 0.45], [42, 0.55], [52, 0.35]].map(([x, o]) => (
          <path key={x} d={`M${x} 4 Q${x + 4} 12 ${x - 1} 20 Q${x + 3} 24 ${x + 1} 28`} fill="none" stroke="#7fd09c" strokeWidth="3.2" opacity={o} />
        ))}
        <path d="M2 8 Q20 2 36 9 T60 6" fill="none" stroke="#b6ecc4" strokeWidth="1.4" opacity="0.6" />
        {[[4, 3], [12, 5], [28, 2], [46, 4], [56, 9], [38, 6]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.35" fill="#e8f2e6" />
        ))}
        <polygon points="0,26 10,18 20,22 32,16 44,22 60,19 60,30 0,30" fill="#0d1a1c" />
        {[2, 9, 16, 23, 30, 37, 44, 51].map((x, i) => (
          <g key={x}>
            <polygon points={`${x},31 ${x},26 ${x + 3},23 ${x + 6},26 ${x + 6},31`} fill="#1b2527" />
            {i % 2 === 0 && <rect x={x + 2.2} y="27" width="1.4" height="1.6" fill="#e9c46a" />}
          </g>
        ))}
        <rect y="31" width="60" height="13" fill="#0f2326" />
        {[8, 24, 40, 52].map((x) => (
          <rect key={x} x={x} y="32" width="1.2" height="6" fill="#e9c46a" opacity="0.35" />
        ))}
        {[6, 22, 42].map((x) => (
          <path key={x} d={`M${x} 33 q2 4 0 9`} fill="none" stroke="#7fd09c" strokeWidth="1.6" opacity="0.25" />
        ))}
      </>
    ),
  },
  // Solheim 1933: skrik i byen — glødende, bølgete himmel, rekkverket på skrå og en skikkelse.
  'skrik-i-byen': {
    b: 60,
    h: 44,
    ramme: 'gull',
    motiv: (
      <>
        <rect width="60" height="44" fill="#d26a2c" />
        <path d={`${bolge(6, 2.4, 60)} L60 0 L0 0 Z`} fill="#b3452c" />
        <path d={`${bolge(12, 2, 60, 5)} L60 6 Q30 9 0 6 Z`} fill="#e3a04a" opacity="0.8" />
        <path d={bolge(16, 1.8, 60, 3)} fill="none" stroke="#e9c24f" strokeWidth="1.6" />
        <path d={`${bolge(22, 2.6, 60, 4)} L60 30 L0 30 Z`} fill="#23285a" />
        <path d={`${bolge(26, 2, 60, 6)} L60 34 L0 34 Z`} fill="#2f3570" />
        {[[10, 24], [26, 27], [44, 23], [52, 28]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="0.7" fill="#f2d24b" />
        ))}
        <polygon points="0,44 0,36 60,22 60,30 22,44" fill="#7d5034" />
        {[6, 14, 22, 30, 38, 46, 54].map((x) => (
          <line key={x} x1={x} y1={36 - x * 0.233} x2={x} y2={40 - x * 0.233} stroke="#3a241a" strokeWidth="0.5" />
        ))}
        <line x1="0" y1="36" x2="60" y2="22" stroke="#3a241a" strokeWidth="0.7" />
        <path d="M14 44 Q15 37 17 34 Q19 37 20 44 Z" fill="#2a2440" />
        <ellipse cx="17" cy="31" rx="2.6" ry="3.4" fill="#e8dcc0" />
        <path d="M14.4 31 q-1 2 0 4 M19.6 31 q1 2 0 4" stroke="#e8dcc0" strokeWidth="0.8" fill="none" />
        <circle cx="16.1" cy="30.4" r="0.45" fill="#2a2440" />
        <circle cx="17.9" cy="30.4" r="0.45" fill="#2a2440" />
        <ellipse cx="17" cy="32.6" rx="0.5" ry="0.8" fill="#2a2440" />
      </>
    ),
  },
  // Aske 1952: fiskebruket på kaia, overskyet himmel, sjarken ved siden av.
  fiskeverket: {
    b: 60,
    h: 44,
    ramme: 'tre',
    motiv: (
      <>
        <rect width="60" height="28" fill="#a3b3bf" />
        <path d="M0 10 Q12 6 24 10 T48 9 T60 11 V0 H0 Z" fill="#8e9eab" />
        <path d="M30 6 l1.2 -1 l1.2 1 M38 9 l1 -0.8 l1 0.8" stroke="#40484f" strokeWidth="0.4" fill="none" />
        <rect y="28" width="60" height="16" fill="#4d6273" />
        <rect x="4" y="25" width="34" height="5" fill="#5b4a3c" />
        {[6, 14, 22, 30, 36].map((x) => (
          <rect key={x} x={x} y="30" width="1" height="6" fill="#3b2f26" />
        ))}
        <rect x="6" y="13" width="22" height="12" fill="#7a3b2e" />
        <polygon points="5,13 17,6 29,13" fill="#3e3a38" />
        <rect x="28" y="16" width="9" height="9" fill="#b38a3c" />
        <polygon points="27.4,16 32.5,12 37.6,16" fill="#3e3a38" />
        {[9, 14, 19, 24].map((x) => (
          <rect key={x} x={x} y="16" width="2.4" height="2.6" fill="#e9e3d6" />
        ))}
        <rect x="15" y="20" width="4" height="5" fill="#3b2a24" />
        <path d="M40 31 h15 l-2 3.2 h-11.4 z" fill="#e6e1d6" />
        <rect x="46" y="27" width="4.6" height="4" fill="#3e3a38" />
        <line x1="48" y1="27" x2="48" y2="20" stroke="#3e3a38" strokeWidth="0.5" />
        {[34, 37, 40].map((y, i) => (
          <rect key={y} x={8 + i * 6} y={y} width={30 - i * 4} height="0.6" fill="#7a3b2e" opacity="0.3" />
        ))}
      </>
    ),
  },
  // Aske 1961: stormen — sjarken på en bølgetopp under en mørk himmel.
  stormen: {
    b: 60,
    h: 44,
    ramme: 'tre',
    motiv: (
      <>
        <rect width="60" height="44" fill="#3c4650" />
        <path d="M0 6 Q20 0 36 8 T60 4 V0 H0 Z" fill="#2c343c" />
        {[4, 12, 20, 28, 36, 44, 52].map((x) => (
          <line key={x} x1={x} y1="0" x2={x - 6} y2="20" stroke="#7a8794" strokeWidth="0.4" opacity="0.5" />
        ))}
        <path d="M0 26 Q10 16 22 24 Q32 30 40 20 Q50 12 60 22 V44 H0 Z" fill="#2c4055" />
        <path d="M0 26 Q10 16 22 24 M40 20 Q50 12 60 22" fill="none" stroke="#dfe5e8" strokeWidth="1.4" />
        <path d="M0 36 Q14 28 28 36 T60 34 V44 H0 Z" fill="#203245" />
        <path d="M0 36 Q14 28 28 36 T60 34" fill="none" stroke="#c9d3d9" strokeWidth="1" />
        <g transform="rotate(-14 31 22)">
          <path d="M24 23 h15 l-2 3.4 h-11.2 z" fill="#2a2624" />
          <rect x="29" y="18.4" width="5" height="4.6" fill="#d9d2c2" />
          <line x1="31.5" y1="18.4" x2="31.5" y2="13" stroke="#2a2624" strokeWidth="0.5" />
        </g>
        <path d="M36 21 q3 -3 6 -1" fill="none" stroke="#dfe5e8" strokeWidth="0.8" />
      </>
    ),
  },
  // Lind 1998: blåtimen — fargefelt i dypt blått med et glødende bånd.
  blaatimen: {
    b: 40,
    h: 52,
    ramme: 'svart',
    motiv: (
      <>
        <rect width="40" height="52" fill="#1e3374" />
        <rect x="4" y="4" width="32" height="22" rx="1.6" fill="#2c4aa3" opacity="0.9" />
        <rect x="4" y="27.4" width="32" height="2.6" rx="1" fill="#e2b84c" opacity="0.9" />
        <rect x="4" y="31.6" width="32" height="16" rx="1.6" fill="#141f4f" />
        <rect x="4" y="27" width="32" height="3.4" rx="1.4" fill="#f3d27a" opacity="0.25" />
      </>
    ),
  },
  // Lind 2004: kvinne i rødt — en modernistisk figur i geometriske former.
  'kvinne-i-roedt': {
    b: 40,
    h: 52,
    ramme: 'svart',
    motiv: (
      <>
        <rect width="40" height="52" fill="#eee1c3" />
        <rect x="24" y="6" width="12" height="20" fill="#d8a64b" />
        <rect x="3" y="30" width="10" height="10" fill="#33539c" />
        <circle cx="20" cy="13" r="4.6" fill="#d9a27f" />
        <path d="M15 13 Q15 6 20 6 Q26 6 25.6 14 L24 11 Q20 9 16.4 11 Z" fill="#3a2622" />
        <path d="M18.6 17.4 h2.8 v2.6 h-2.8 z" fill="#c98f6c" />
        <polygon points="20,19 9,48 31,48" fill="#b8322a" />
        <polygon points="20,19 20,48 31,48" fill="#9a2722" />
        <path d="M16 23 L11 33 M24 23 L29 31 L25 34" fill="none" stroke="#d9a27f" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="18.6" cy="12.6" r="0.5" fill="#3a2622" />
        <circle cx="21.6" cy="12.6" r="0.5" fill="#3a2622" />
      </>
    ),
  },
  // Vik 2019: byen sover — flate kvartaler om natta, et par vinduer med lys og månen.
  'byen-sover': {
    b: 60,
    h: 44,
    ramme: 'hvit',
    motiv: (
      <>
        <rect width="60" height="44" fill="#272b53" />
        <circle cx="46" cy="10" r="4.4" fill="#f1e3b5" />
        <rect x="2" y="22" width="12" height="22" fill="#1b1f3a" />
        <rect x="14" y="16" width="10" height="28" fill="#2f3561" />
        <rect x="24" y="26" width="14" height="18" fill="#1b1f3a" />
        <rect x="38" y="19" width="9" height="25" fill="#353b6c" />
        <rect x="47" y="28" width="12" height="16" fill="#1b1f3a" />
        {[[17, 20], [28, 30], [41, 24], [50, 33], [6, 27]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="2.2" height="2.4" fill="#e3a33b" />
        ))}
      </>
    ),
  },
  // Vik 2021: sommernatt — rosa himmel, sol ved horisonten, flate grønne åser og en som ligger i gresset.
  sommernatt: {
    b: 60,
    h: 44,
    ramme: 'hvit',
    motiv: (
      <>
        <rect width="60" height="44" fill="#f2c6d3" />
        <rect y="14" width="60" height="12" fill="#f7dbe2" />
        <circle cx="38" cy="26" r="5" fill="#f6e7a1" />
        <rect y="26" width="60" height="4" fill="#c9d9e6" />
        <path d="M0 30 Q16 24 32 30 T60 28 V44 H0 Z" fill="#3f8458" />
        <path d="M0 36 Q20 30 40 36 T60 35 V44 H0 Z" fill="#2f6b45" />
        <path d="M14 39 h10 q2 0 2 1.2 h-12 z" fill="#f2c6d3" />
        <circle cx="12.6" cy="39.4" r="1.4" fill="#f6e7a1" />
      </>
    ),
  },
}

/** Rammen rundt lerretet: forgylt og utskåret, eik, tynn svart eller tynn hvit. */
function Rammeverk({ ramme, b, h }: { ramme: Ramme; b: number; h: number }) {
  const r = RAMMEBREDDE[ramme]
  const B = b + 2 * r
  const H = h + 2 * r
  if (ramme === 'gull') {
    return (
      <g>
        <rect width={B} height={H} fill="#b8892f" />
        <rect x="1" y="1" width={B - 2} height={H - 2} fill="none" stroke="#e2c27a" strokeWidth="1" />
        <rect x={r - 1.2} y={r - 1.2} width={b + 2.4} height={h + 2.4} fill="#8a6420" />
        {[[2.6, 2.6], [B - 2.6, 2.6], [2.6, H - 2.6], [B - 2.6, H - 2.6]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#efd58f" />
        ))}
        {[B / 2].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="2.5" rx="3" ry="1.2" fill="#efd58f" />
            <ellipse cx={x} cy={H - 2.5} rx="3" ry="1.2" fill="#efd58f" />
          </g>
        ))}
      </g>
    )
  }
  if (ramme === 'tre') {
    return (
      <g>
        <rect width={B} height={H} fill="#6b4a32" />
        <rect x="0.8" y="0.8" width={B - 1.6} height={H - 1.6} fill="none" stroke="#8a6446" strokeWidth="1" />
        <rect x={r - 0.6} y={r - 0.6} width={b + 1.2} height={h + 1.2} fill="#4a3322" />
      </g>
    )
  }
  return (
    <g>
      <rect width={B} height={H} fill={ramme === 'svart' ? '#1c1c1c' : '#efece6'} />
      <rect x={r - 0.5} y={r - 0.5} width={b + 1} height={h + 1} fill={ramme === 'svart' ? '#0c0c0c' : '#cfcac0'} />
    </g>
  )
}

/** Hvor stort maleriet er med ramme, i lerretets enheter. */
export function maleriformat(id: MaleriId): { b: number; h: number } {
  const v = VERK[id]
  const r = RAMMEBREDDE[v.ramme]
  return { b: v.b + 2 * r, h: v.h + 2 * r }
}

export const MALERIVERK = Object.keys(VERK) as MaleriId[]

/**
 * Maleriet med ramme. `størrelse` er siden i en kvadratisk boks som maleriet
 * passer inn i (lista), eller med `hoyde` den faste høyden (veggen).
 */
export const Maleribilde = memo(function Maleribilde({ id, størrelse = 44, hoyde }: { id: MaleriId; størrelse?: number; hoyde?: number }) {
  const klipp = 'm' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const v = VERK[id]
  if (!v) return null
  const r = RAMMEBREDDE[v.ramme]
  const { b: B, h: H } = maleriformat(id)
  const skala = hoyde ? hoyde / H : størrelse / Math.max(B, H)
  return (
    <svg className="maleri-bilde illustrasjon" width={Math.round(B * skala)} height={Math.round(H * skala)} viewBox={`0 0 ${B} ${H}`} aria-hidden="true">
      <defs>
        <clipPath id={klipp}>
          <rect width={v.b} height={v.h} />
        </clipPath>
      </defs>
      <Rammeverk ramme={v.ramme} b={v.b} h={v.h} />
      <g transform={`translate(${r} ${r})`} clipPath={`url(#${klipp})`}>
        {v.motiv}
      </g>
    </svg>
  )
})
