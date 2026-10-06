import { memo, useId, type ReactNode } from 'react'
import { PAPIRER } from '../../engine/marked'
import type { PapirId } from '../../engine/types'
import { MONOGRAMMER, ORDMERKER } from '../ordmerker'

/**
 * Logoene til aksjene og kryptovalutaene (Grafikkpakke G4): ekte selskapsmerker,
 * ikke app-ikoner.
 *
 * - **Aksjer** har hver sin form — rederiet et klassisk skjold, kraftselskapet en
 *   fjelltopp med lyn, flyselskapet et halefinne — uten flis bak.
 * - **Krypto** er mynter: egen farge, preget kant og et preget symbol.
 * - **Ordmerket** (`ordmerke`) setter navnet ved siden av merket, i en skrift som
 *   passer selskapet. Bokstavene er stier fra `ui/ordmerker.ts`, aldri SVG-tekst.
 *
 * Merkene tegnes på et 24×24-rutenett i selskapets farge. Fargene er mellomtoner
 * som står med minst 3:1 kontrast på både mørkt og lyst kort (testet).
 */

/** Blander en farge mot en annen; t = 0 gir `fra`, t = 1 gir `mot`. */
export function bland(fra: string, mot: string, t: number): string {
  const tall = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const a = tall(fra)
  const b = tall(mot)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

interface Farger {
  /** Merkefargen. */
  m: string
  /** En lysere tone av samme farge. */
  lys: string
}

interface Logo {
  farge: string
  /** Aksje: hele merket. Krypto: symbolet som preges i mynten (`m` = flaten, `lys` = skyggesiden). */
  merke: (f: Farger) => ReactNode
}

const strek = (farge: string, bredde: number) =>
  ({ fill: 'none', stroke: farge, strokeWidth: bredde, strokeLinecap: 'round', strokeLinejoin: 'round' }) as const

/** Laksen som hopper (Nordfjord Sjømat og Laksecoin). */
const laks = (m: string) => (
  <path
    fillRule="evenodd"
    fill={m}
    d="M2 13.8C4.6 9.6 9.4 7.4 15.4 7.6l.6-2.3 1.4 2.5 1.8-2.8 3.3-.6-2.2 3.8 2.6 3.4-3.2-.5-2-1.6C12.2 13 7.4 14.3 2 13.8zM5.2 11.7a.95 .95 0 1 0 1.9 0a.95 .95 0 1 0-1.9 0z"
  />
)

/** Et monogram fra ordmerkene, sentrert i (cx, cy). */
function monogram(id: PapirId, cx: number, cy: number, farge: string) {
  const g = MONOGRAMMER[id]
  if (!g) return null
  return <path d={g.d} fill={farge} transform={`translate(${+(cx - g.bredde / 2).toFixed(2)} ${+(cy - g.hoyde / 2).toFixed(2)})`} />
}

const LOGOER: Record<PapirId, Logo> = {
  // Nordfjord Sjømat: laksen som hopper over bølgene.
  NFS: {
    farge: '#2f7894',
    merke: ({ m, lys }) => (
      <>
        <g transform="rotate(-14 12 10)">{laks(m)}</g>
        <path d="M2.5 18.6q2.4-2.2 4.8 0t4.8 0t4.8 0t4.8 0" {...strek(m, 1.7)} />
        <path d="M5 22.2q2.4-2 4.8 0t4.8 0t4.8 0" {...strek(lys, 1.4)} />
      </>
    ),
  },
  // Fjellkraft: fjelltoppen med lynet skåret ut.
  FJK: {
    farge: '#3a8a7e',
    merke: ({ m }) => (
      <path fillRule="evenodd" fill={m} d="M12 2.5L22.5 21.5H1.5zM13.6 7.5L8.8 14.6h3.1l-1.3 5 5-7.3h-3.1l1.1-4.8z" />
    ),
  },
  // Vikingtelekom: V-en, med signalet som går ut fra midten.
  VTK: {
    farge: '#9a5a95',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M2 4.5h5.4L12 15.2l4.6-10.7H22L13.6 22h-3.2z" />
        <circle cx="12" cy="7.6" r="1.35" fill={lys} />
        <path d="M9.4 5.9A3.1 3.1 0 0 1 14.6 5.9" {...strek(lys, 1.3)} />
      </>
    ),
  },
  // Bergen Shipping: et klassisk skjold med krone og anker.
  BSH: {
    farge: '#9a7632',
    merke: ({ m }) => (
      <>
        <path fill={m} d="M7 4.6L8.1 1.9 10 3.3 12 1 14 3.3 15.9 1.9 17 4.6z" />
        <path
          fillRule="evenodd"
          fill={m}
          d="M4 5.2h16v6.8c0 5.2-3.4 8.6-8 10.5-4.6-1.9-8-5.3-8-10.5zM5.5 6.7h13v5.3c0 4.3-2.7 7.1-6.5 8.8-3.8-1.7-6.5-4.5-6.5-8.8z"
        />
        <circle cx="12" cy="9" r="1.15" {...strek(m, 1)} />
        <path d="M12 10.2v7.6M9.6 11.6h4.8M8.2 14.6a3.8 3.8 0 0 0 7.6 0" {...strek(m, 1.3)} />
      </>
    ),
  },
  // Polaris Olje: nordstjernen i en ring.
  POL: {
    farge: '#b85f18',
    merke: ({ m, lys }) => (
      <>
        <circle cx="12" cy="11.5" r="7.4" {...strek(lys, 1.1)} />
        <path
          fill={m}
          d="M12 1.5L12.77 9.65 15.54 7.96 13.85 10.73 22 11.5 13.85 12.27 15.54 15.04 12.77 13.35 12 21.5 11.23 13.35 8.46 15.04 10.15 12.27 2 11.5 10.15 10.73 8.46 7.96 11.23 9.65z"
        />
      </>
    ),
  },
  // Nordlys Tech: nordlyset som tre bånd over horisonten.
  NLT: {
    farge: '#368a65',
    merke: ({ m, lys }) => (
      <>
        <path d="M4 19.5c1-6 3-10 6.2-13.5" {...strek(m, 2.6)} />
        <path d="M9.6 19.5c1-6.4 3.4-11 7.2-14.5" {...strek(lys, 2.6)} />
        <path d="M15.2 19.5c.8-5 2.6-8.6 5.2-11.2" {...strek(m, 2.6)} />
        <path d="M2.5 22.5h19" {...strek(m, 1.3)} />
      </>
    ),
  },
  // Aurora Bioteknologi: et molekyl.
  AUB: {
    farge: '#a0508a',
    merke: ({ m, lys }) => (
      <>
        <path d="M12 3.5l7.36 4.25v8.5L12 20.5l-7.36-4.25v-8.5z" {...strek(m, 1.9)} />
        <path d="M12 12V3.5M12 12l7.36 4.25M12 12l-7.36 4.25" {...strek(m, 1.3)} />
        <circle cx="12" cy="3.5" r="2.3" fill={m} />
        <circle cx="19.36" cy="16.25" r="2.3" fill={m} />
        <circle cx="4.64" cy="16.25" r="2.3" fill={m} />
        <circle cx="12" cy="12" r="2.7" fill={lys} />
      </>
    ),
  },
  // Trollspill: trollet i profil, med lang nese og en dott på hodet.
  TRS: {
    farge: '#b0466e',
    merke: ({ m, lys }) => (
      <>
        <path
          fillRule="evenodd"
          fill={m}
          d="M5 22v-6.4C3.2 13.6 3.2 9 6.2 6.4 7.6 5.2 9.4 4.6 11 4.6L10.4 1.6l2 2.4.9-3 .8 3.4 2-1.8-.6 3c1.6 1 2.4 2.6 2.4 4.2v.6l-3.2.8c0 4.2-1.4 6.2-3.6 6.6V22zM12.4 9a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0z"
        />
        <path fill={m} d="M14.4 10.8c2.4-.6 4.6 0 5.8 1.4 1.4 1.6 1 3.8-.8 4.2-1.6.4-2.6-.6-3.4-1.8-.6-.9-1.2-1.4-2-1.6z" />
        <path d="M7.6 12.4c.5 1.5 1.7 2.3 3.2 2.3" {...strek(lys, 1.1)} />
      </>
    ),
  },
  // Nordre Bank: en buet portal med N.
  NRB: {
    farge: '#3b6ea8',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M3.5 22.5V10.5a8.5 8.5 0 0 1 17 0v12z" />
        <path d="M5.6 20.4V10.8a6.4 6.4 0 0 1 12.8 0v9.6z" {...strek(lys, 0.7)} />
        {monogram('NRB', 12, 14.6, lys)}
      </>
    ),
  },
  // Kurv Dagligvare: handlekurven.
  KRV: {
    farge: '#c6443c',
    merke: ({ m }) => (
      <>
        <path d="M7 10.5a5 5 0 0 1 10 0" {...strek(m, 1.8)} />
        <path
          fillRule="evenodd"
          fill={m}
          d="M2.5 9.5h19l-2.4 12H4.9zM7.6 12.6h1.6v6h-1.6zM11.2 12.6h1.6v6h-1.6zM14.8 12.6h1.6v6h-1.6z"
        />
      </>
    ),
  },
  // Fjellfly: halepartiet på flyet, med en fjelltopp på finnen.
  FJF: {
    farge: '#3f86b8',
    merke: ({ m, lys }) => (
      <>
        <path fillRule="evenodd" fill={m} d="M8 16.4L13.6 2.5h5L17.4 16.4zM11.4 14.6l3-4.6 1.5 2 1-1.3.7 3.9z" />
        <path fill={m} d="M1.5 17.4H15.6l6.9-3.8-1.4 3.4c-1.6 3-3.8 4.4-7.4 4.4H1.5z" />
        <path fill={lys} d="M13.6 17.8l6.4-2.6-.9 2.2z" />
        <path d="M3.2 19.2h.6M5.6 19.2h.6M8 19.2h.6M10.4 19.2h.6" {...strek(lys, 1.1)} />
      </>
    ),
  },
  // Romfart Nord: en planet med bane og satellitt.
  ROM: {
    farge: '#6a6fb8',
    merke: ({ m, lys }) => (
      <>
        <ellipse cx="12" cy="12.5" rx="10.6" ry="3.6" transform="rotate(-24 12 12.5)" {...strek(lys, 1.3)} />
        <circle cx="12" cy="12.5" r="6" fill={m} />
        {/* Banens forreste halvdel går foran planeten. */}
        <path d="M2.32 16.81A10.6 3.6 -24 0 0 21.68 8.19" {...strek(lys, 1.3)} />
        <circle cx="21.2" cy="8.2" r="1.6" fill={m} />
      </>
    ),
  },

  // ----- Krypto: symbolet som preges i mynten.

  // Bitmynt: B med to streker.
  BMT: {
    farge: '#a86f20',
    merke: ({ m }) => (
      <>
        {monogram('BMT', 12.4, 12, m)}
        <path d="M10.4 5.4v2.2M13 5.4v2.2M10.4 16.4v2.2M13 16.4v2.2" {...strek(m, 1.3)} />
      </>
    ),
  },
  // Fjordium: en krystall.
  FJD: {
    farge: '#7a68b0',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M12 2.5L5.5 12.5 12 16z" />
        <path fill={lys} d="M12 2.5l6.5 10L12 16z" />
        <path fill={m} d="M5.5 14L12 21.5V17.6z" />
        <path fill={lys} d="M18.5 14L12 21.5V17.6z" />
      </>
    ),
  },
  // Nordsol: sola.
  NSL: {
    farge: '#c4583a',
    merke: ({ m }) => (
      <>
        <circle cx="12" cy="12" r="4.6" fill={m} />
        <path
          d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
          {...strek(m, 1.9)}
        />
      </>
    ),
  },
  // Trollmynt: trollfjellet med to øyne.
  TRM: {
    farge: '#5d8a5a',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M2.5 19.5l5.4-9 2.8 3.6 3.4-8.6 7.4 14z" />
        <circle cx="12.6" cy="13.6" r="1.1" fill={lys} />
        <circle cx="15.6" cy="13.6" r="1.1" fill={lys} />
      </>
    ),
  },
  // Vikingtoken: vikinghjelmen.
  VKT: {
    farge: '#8a6a4a',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M6 14a6 6 0 0 1 12 0z" />
        <path fill={lys} d="M5 13.6h14v2.4H5zM11 16h2v5.2h-2z" />
        <path fill={m} d="M6.2 11.6C3.6 10.6 2.4 8.2 2.6 5.4c1.4 2 2.8 3 5 3.4zM17.8 11.6c2.6-1 3.8-3.4 3.6-6.2-1.4 2-2.8 3-5 3.4z" />
      </>
    ),
  },
  // Laksecoin: laksen.
  LKS: {
    farge: '#b8634e',
    merke: ({ m }) => <g transform="translate(0 3.8)">{laks(m)}</g>,
  },
  // Stabilkrone: en krone.
  STK: {
    farge: '#6f7f8f',
    merke: ({ m, lys }) => (
      <>
        <path fill={m} d="M4 17l1.2-9.5 4 4L12 5.5l2.8 6 4-4L20 17z" />
        <path fill={lys} d="M4 18.4h16v2.4H4z" />
      </>
    ),
  },
  // Elgcoin: elgen forfra.
  ELG: {
    farge: '#8a6438',
    merke: ({ m }) => (
      <>
        {[1, -1].map((s) => (
          <path key={s} fill={m} transform={s < 0 ? 'matrix(-1 0 0 1 24 0)' : undefined} d="M10.4 9.8C7.2 10.2 3.6 9.2 1.8 6.2l1.4-.2-.6-2.6 1.9 1.4.4-2.9 1.6 2.4.9-2.2 1 2.8 1.4-1.2.3 3c.6.7 1 1.6.9 2.6z" />
        ))}
        <path fill={m} d="M9.4 9h5.2l-.7 9.4c0 1.8-.8 3.3-1.9 3.3s-1.9-1.5-1.9-3.3z" />
        <path fill={m} d="M9.6 9.6L7 11.4l2.8.4zM14.4 9.6l2.6 1.8-2.8.4z" />
      </>
    ),
  },
  // Brunostcoin: brunostblokken.
  BRN: {
    farge: '#a8642e',
    merke: ({ m, lys }) => (
      <>
        <path fill={lys} d="M5 9l7-3.5L19 9l-7 3.5z" />
        <path fill={m} d="M5 9l7 3.5V20l-7-3.5zM19 9l-7 3.5V20l7-3.5z" />
        <path d="M12 12.5V20" {...strek(lys, 0.6)} />
      </>
    ),
  },
}

export const PAPIRLOGOER = Object.keys(LOGOER) as PapirId[]

/** Merkefargen til et papir (ordmerket og grafer kan bruke den). */
export const papirfarge = (id: PapirId) => LOGOER[id]?.farge

/** Luft mellom merket og ordmerket, i rutenettets enheter. */
const LUFT = 5

/** Merket alene: aksjens form eller kryptoens mynt, i 24×24. */
function Merke({ id, l }: { id: PapirId; l: Logo }) {
  const glans = 'p' + useId().replace(/[^a-zA-Z0-9]/g, '')
  if (PAPIRER[id].klasse !== 'krypto') return <>{l.merke({ m: l.farge, lys: bland(l.farge, '#ffffff', 0.45) })}</>
  const lys = bland(l.farge, '#ffffff', 0.6)
  const mork = bland(l.farge, '#000000', 0.38)
  return (
    <>
      <defs>
        <radialGradient id={glans} cx="0.32" cy="0.26" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={l.farge} />
      <circle cx="12" cy="12" r="11.1" fill="none" stroke={lys} strokeOpacity="0.6" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="9.7" fill="none" stroke={mork} strokeOpacity="0.55" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="12" fill={`url(#${glans})`} />
      {/* Preget: symbolet i skyggetone litt ned til høyre, så i lys tone. */}
      <g transform="translate(12 12) scale(0.64) translate(-12 -12)">
        <g transform="translate(0.8 0.9)">{l.merke({ m: mork, lys: mork })}</g>
        {l.merke({ m: lys, lys: bland(l.farge, '#ffffff', 0.35) })}
      </g>
    </>
  )
}

/**
 * Logoen til et papir. `størrelse` er høyden i piksler. Med `ordmerke` står navnet
 * ved siden av merket, og logoen blir bredere.
 */
export const Papirlogo = memo(function Papirlogo({ id, størrelse = 32, ordmerke = false }: { id: PapirId; størrelse?: number; ordmerke?: boolean }) {
  const l = LOGOER[id]
  if (!l) return null
  const o = ordmerke ? ORDMERKER[id] : undefined
  const bredde = o ? +(24 + LUFT + o.bredde).toFixed(2) : 24
  return (
    <svg
      className={o ? 'papirlogo ordmerke' : 'papirlogo'}
      width={Math.round((størrelse * bredde) / 24)}
      height={størrelse}
      viewBox={`0 0 ${bredde} 24`}
      aria-hidden="true"
    >
      <Merke id={id} l={l} />
      {o && <path d={o.d} fill={l.farge} transform={`translate(${24 + LUFT} ${+((24 - o.hoyde) / 2).toFixed(2)})`} />}
    </svg>
  )
})
