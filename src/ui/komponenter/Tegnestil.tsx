/**
 * Tegnestilen (Grafikkpakke G1): grunnmuren alle nye tegninger bygges på.
 * Reglene står i toppen av Illustrasjoner.tsx; her er verktøyene.
 *
 * - Lerretet er 96 × 96. Små ikoner er den samme tegningen skalert ned.
 * - Fargene kommer fra paletten S. Hvert materiale har tre toner: `lys`
 *   (flater som vender mot lyset), `flate` (fronten) og `skygge` (siden
 *   bort fra lyset). Lyset kommer alltid ovenfra til venstre.
 * - Dybde vises skrått: en kloss har front, en side mot høyre og et tak,
 *   og dybden går opp og til høyre (DYBDE).
 * - Alt står på GRUNNLINJE (y = 84) og på en Bakke som passer motivet.
 * - Tre avstander gir fast målestokk (METER): nær, gate og fjern.
 */

import { createContext, useContext, useId, type ReactNode } from 'react'

export type Materiale = { lys: string; flate: string; skygge: string }

/** Paletten: dempede nordiske toner. Gull er den eneste klare fargen. */
export const S = {
  puss: { lys: '#e4dccb', flate: '#d3c8b3', skygge: '#a99d87' },
  stein: { lys: '#bdb8ae', flate: '#a39e94', skygge: '#7d786f' },
  tegl: { lys: '#a8604b', flate: '#93503e', skygge: '#6f3b2f' },
  faluRod: { lys: '#9a4a3c', flate: '#823d32', skygge: '#5f2c25' },
  treverk: { lys: '#a88563', flate: '#8d6d4f', skygge: '#69503a' },
  treMork: { lys: '#6e5745', flate: '#574436', skygge: '#3d3027' },
  skifer: { lys: '#66717b', flate: '#505a64', skygge: '#3a424a' },
  metall: { lys: '#c6c9cb', flate: '#9ca1a5', skygge: '#6f7479' },
  glass: { lys: '#b4c5cc', flate: '#89a0ab', skygge: '#5f7784' },
  mork: { lys: '#4a4744', flate: '#353230', skygge: '#242120' },
  hvit: { lys: '#efece6', flate: '#ddd8ce', skygge: '#b7b0a3' },
  gran: { lys: '#5f7a58', flate: '#4a6345', skygge: '#344832' },
  gress: { lys: '#8b9a63', flate: '#738450', skygge: '#57663c' },
  sjo: { lys: '#7397a8', flate: '#4b7389', skygge: '#33566b' },
  sno: { lys: '#f2f3f1', flate: '#dfe3e3', skygge: '#b8c2c6' },
  fjell: { lys: '#9aa5ad', flate: '#7f8b94', skygge: '#626d77' },
  marine: { lys: '#506480', flate: '#3c4e69', skygge: '#2b3a50' },
  petrol: { lys: '#527f80', flate: '#3d6667', skygge: '#2b4c4d' },
  oker: { lys: '#d2ab5c', flate: '#b88f40', skygge: '#8b6b2d' },
  vin: { lys: '#934750', flate: '#77343c', skygge: '#55242b' },
  bjork: { lys: '#b7b45f', flate: '#9a9a4c', skygge: '#76783a' },
  lov: { lys: '#7c8f5c', flate: '#647748', skygge: '#4a5a35' },
  gull: { lys: '#e7cf88', flate: '#c9a54a', skygge: '#94782f' },
  hud: { lys: '#e2bd9b', flate: '#c99b77', skygge: '#a07858' },
  hudMork: { lys: '#a87a5c', flate: '#8a5f43', skygge: '#664532' },
  /** Varmt lys i et vindu. */
  vinduLys: { lys: '#f3dca4', flate: '#e8c98a', skygge: '#c9a66a' },
} as const satisfies Record<string, Materiale>

/**
 * Himmelen bak motivet, i mørkt tema. Himmelen er bakgrunn, ikke motiv, så
 * den følger temaet: det lyse temaet har egne, lysere farger i styles.css
 * (--himmel-dag-topp osv.). Selve motivet har faste farger i begge temaer.
 */
export const HIMMEL = {
  dag: ['#6f8798', '#d6c4a0'],
  inne: ['#4f4a45', '#7d756b'],
} as const

/** Fargen det som står langt unna blandes mot (`Dis`): midt i himmelen. */
export const DISFARGE = '#b3b2a5'

/** Grunnlinjen alt står på. */
export const GRUNNLINJE = 84

/** Dybden: én enhet inn i bildet flytter så langt til høyre og opp. */
export const DYBDE = { x: 0.5, y: -0.3 } as const

/**
 * Målestokken, i enheter per meter. Hvert motiv ses fra én av tre avstander,
 * og alt på samme avstand har samme mål: en person, en dør, en etasje.
 * - nær: ting du holder eller står ved — biler, klokker, boder.
 * - gate: hus og forretninger, sett fra fortauet.
 * - fjern: tårn, anlegg og store bygg, sett fra andre siden av byen.
 */
export const METER = { naer: 18, gate: 10, fjern: 2.5 } as const
export type Avstand = keyof typeof METER

/** Faste mål i meter, så en dør er like høy i hver tegning på samme avstand. */
export const MAAL = { person: 1.75, dor: 2.1, etasje: 3.2 } as const

export const maal = (avstand: Avstand, hva: keyof typeof MAAL) => MAAL[hva] * METER[avstand]

// ─────────────────────────────────────────────── Lerretet

const Ider = createContext('t')

/**
 * Utklipp: tegningen uten himmel, bakke og bakgrunn — bare motivet med
 * skyggen sin. Til steder som har sin egen scene rundt, som garasjen, havna
 * og hangaren i Luksus. Settes av `Illustrasjon` (`utklipp`).
 */
export const Utklipp = createContext(false)

/** Peker til en av lerretets felles gradienter, med lerretets egne id-er. */
function useUrl() {
  const id = useContext(Ider)
  return (navn: string) => `url(#${id}${navn})`
}

/**
 * Lerretet: 96 × 96, en myk himmel som blekner ut mot kantene (ingen hard
 * boks), og felles gradienter for skygger og glans. Id-ene er unike per
 * tegning, så skjulte tegninger andre steder på siden aldri tar dem med seg.
 */
export function Lerret({ størrelse, himmel = 'dag', children }: { størrelse: number; himmel?: keyof typeof HIMMEL | 'ingen'; children: ReactNode }) {
  const id = 't' + useId().replace(/[^a-zA-Z0-9]/g, '')
  if (useContext(Utklipp)) himmel = 'ingen'
  const tema = himmel === 'inne' ? 'inne' : 'dag'
  const [topp, horisont] = HIMMEL[tema]
  return (
    <svg className="illustrasjon lerret" width={størrelse} height={størrelse} viewBox="0 0 96 96" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: `var(--himmel-${tema}-topp, ${topp})` }} />
          <stop offset="0.85" style={{ stopColor: `var(--himmel-${tema}-horisont, ${horisont})` }} />
        </linearGradient>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.15" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}vm`}>
          <rect x="0" y="0" width="96" height="96" fill={`url(#${id}v)`} />
        </mask>
        {/* Bakken blekner ut mot sidene. */}
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#ffffff" />
          <stop offset="0.86" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}km`}>
          <rect x="0" y="0" width="96" height="96" fill={`url(#${id}k)`} />
        </mask>
        {/* Havet blekner ut nederst, så det ikke slutter i en hard kant. */}
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.84" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}nm`}>
          <rect x="0" y="0" width="96" height="96" fill={`url(#${id}n)`} />
        </mask>
        <radialGradient id={`${id}b`} gradientUnits="userSpaceOnUse" cx="48" cy={GRUNNLINJE - 3} r="58" gradientTransform={`translate(48 ${GRUNNLINJE - 3}) scale(1 0.3) translate(-48 -${GRUNNLINJE - 3})`}>
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}bm`}>
          <rect x="0" y="0" width="96" height="96" fill={`url(#${id}b)`} />
        </mask>
        {/* Slagskygge: mørkest inntil tingen, borte et stykke unna. */}
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.34" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        {/* Mørkere nederst på en vegg, der lyset ikke når. */}
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        {/* Glans på glass og lakk: lys streif ovenfra til venstre. */}
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Vann og blank flate: lysere inn mot horisonten. */}
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Speilbildet på et blankt gulv blekner nedover. */}
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}rm`} maskContentUnits="userSpaceOnUse">
          <rect x="0" y={GRUNNLINJE} width="96" height={96 - GRUNNLINJE} fill={`url(#${id}r)`} />
        </mask>
        {/* Dis: hver farge blandes halvveis mot DISFARGE (#b3b2a5). */}
        <filter id={`${id}dis`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.5 0 0 0 0.351  0 0.5 0 0 0.349  0 0 0.5 0 0.324  0 0 0 1 0" />
        </filter>
        {/* Et lyskjegle ovenfra, for utstillingsrommet. */}
        <radialGradient id={`${id}l`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
        </radialGradient>
      </defs>
      {himmel !== 'ingen' && <rect x="0" y="0" width="96" height="96" fill={`url(#${id}h)`} mask={`url(#${id}vm)`} />}
      {himmel === 'inne' && <ellipse cx="48" cy="62" rx="44" ry="30" fill={`url(#${id}l)`} />}
      <Ider.Provider value={id}>{children}</Ider.Provider>
    </svg>
  )
}

// ─────────────────────────────────────────────── Lys og skygge

/** Et punkt flyttet `d` enheter inn i bildet. */
export const inn = (x: number, y: number, d: number): [number, number] => [+(x + d * DYBDE.x).toFixed(2), +(y + d * DYBDE.y).toFixed(2)]

const pkt = (...p: [number, number][]) => p.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(' ')

/**
 * En kloss: fronten (b × h, nederste kant på y), siden mot høyre i skygge og
 * taket i lys. Grunnformen for hus, disker, kasser og tårn.
 */
export function Kloss({ x, y = GRUNNLINJE, b, h, d, m, front, tak = true }: { x: number; y?: number; b: number; h: number; d: number; m: Materiale; front?: string; tak?: boolean }) {
  const t = y - h
  return (
    <g>
      <polygon points={pkt([x + b, y], inn(x + b, y, d), inn(x + b, t, d), [x + b, t])} fill={m.skygge} />
      {tak && <polygon points={pkt([x, t], [x + b, t], inn(x + b, t, d), inn(x, t, d))} fill={m.lys} />}
      <rect x={x} y={t} width={b} height={h} fill={front ?? m.flate} />
    </g>
  )
}

/**
 * Saltak med mønet inn i bildet: gavlen vender mot oss. `x`, `b` og `y` er
 * veggens front (y = toppen av veggen), `h` takets høyde over veggen.
 */
export function Saltak({ x, y, b, d, h, m, gavl, overheng = 2 }: { x: number; y: number; b: number; d: number; h: number; m: Materiale; gavl: Materiale; overheng?: number }) {
  const v: [number, number] = [x - overheng, y + overheng * 0.6]
  const hoyre: [number, number] = [x + b + overheng, y + overheng * 0.6]
  const topp: [number, number] = [x + b / 2, y - h]
  return (
    <g>
      <polygon points={pkt(v, topp, inn(...topp, d + overheng), inn(...v, d + overheng))} fill={m.lys} />
      <polygon points={pkt(topp, hoyre, inn(...hoyre, d + overheng), inn(...topp, d + overheng))} fill={m.skygge} />
      <polygon points={pkt([x, y], [x + b / 2, y - h + overheng * 0.9], [x + b, y])} fill={gavl.lys} />
      <polygon points={pkt(v, topp, hoyre)} fill="none" stroke={m.flate} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  )
}

/**
 * Slagskyggen på bakken: fra tingens høyre kant, bort fra lyset og inn i
 * bildet. `x1`–`x2` er foten av tingen, `lengde` hvor langt skyggen når.
 */
export function Slagskygge({ x1, x2, y = GRUNNLINJE, lengde, d = 0 }: { x1: number; x2: number; y?: number; lengde: number; d?: number }) {
  const u = useUrl()
  const a: [number, number] = [x2, y]
  const b = inn(x2, y, d)
  return (
    <g>
      <ellipse cx={(x1 + x2) / 2} cy={y + 0.4} rx={(x2 - x1) / 2 + 2} ry="1.8" fill="#000000" opacity="0.28" />
      <polygon points={pkt([x1 + (x2 - x1) * 0.3, y], a, b, [b[0] + lengde, b[1]], [a[0] + lengde * 0.6, y])} fill={u('s')} />
    </g>
  )
}

/** Mørkere nederst på en flate, der lyset ikke når. */
export function Bunnskygge({ x, y, b, h }: { x: number; y: number; b: number; h: number }) {
  const u = useUrl()
  return <rect x={x} y={y} width={b} height={h} fill={u('a')} />
}

/** Glans over glass eller lakk, i formen du gir den. */
export function Glans({ points, d }: { points?: string; d?: string }) {
  const u = useUrl()
  return d ? <path d={d} fill={u('g')} /> : <polygon points={points} fill={u('g')} />
}

/**
 * Speilbildet på et blankt gulv: tegningen speilet om grunnlinjen, svakt og
 * blekende. Bare for `gulv`.
 */
export function Speiling({ children }: { children: ReactNode }) {
  const u = useUrl()
  if (useContext(Utklipp)) return null
  return (
    <g mask={u('rm')} opacity="0.8">
      <g transform={`translate(0 ${2 * GRUNNLINJE}) scale(1 -1)`}>{children}</g>
    </g>
  )
}

/** Dis over det som står langt unna: fargene blandes halvveis mot himmelen, og himmelen skinner litt gjennom. */
export function Dis({ children }: { children: ReactNode }) {
  const u = useUrl()
  return (
    <g filter={u('dis')} opacity="0.7">
      {children}
    </g>
  )
}

/**
 * Bakgrunnen (fjell, byen bak), som blekner ut mot kantene. Faller bort i et
 * utklipp, sammen med himmelen og bakken.
 */
export function Kantfade({ children }: { children: ReactNode }) {
  const u = useUrl()
  if (useContext(Utklipp)) return null
  return <g mask={u('km')}>{children}</g>
}

// ─────────────────────────────────────────────── Bakken

export type Bakketype = 'fortau' | 'gress' | 'kai' | 'gulv' | 'sno' | 'hav' | 'asfalt'

/** Horisonten over åpent hav (`hav`). */
export const HORISONT = 56

/**
 * Bakken, tilpasset motivet: fortau for forretninger, gress for hus, kai og
 * sjø for båter, blankt gulv for biler, snø i fjellet, åpent hav helt ut til
 * horisonten for det som ligger til havs, og asfalt for flyplassen. Den
 * blekner ut mot sidene, så tegningen ikke står på en grå strek.
 */
export function Bakke({ type }: { type: Bakketype }) {
  const u = useUrl()
  const utklipp = useContext(Utklipp)
  const g = GRUNNLINJE
  if (utklipp) return null
  let innhold: ReactNode
  switch (type) {
    case 'fortau':
      innhold = (
        <>
          <rect x="0" y={g - 16} width="96" height="28" fill={S.stein.lys} />
          {[-24, -8, 8, 24, 40, 56, 72, 88, 104].map((x) => (
            <line key={x} x1={x} y1={g + 6} x2={x + 6.6} y2={g - 16} stroke={S.stein.flate} strokeWidth="0.5" />
          ))}
          {[g - 9, g - 2].map((y) => (
            <line key={y} x1="0" y1={y} x2="96" y2={y} stroke={S.stein.flate} strokeWidth="0.5" />
          ))}
          <rect x="0" y={g + 6} width="96" height="1" fill={S.hvit.flate} />
        </>
      )
      break
    case 'gress':
      innhold = (
        <>
          <rect x="0" y={g - 16} width="96" height="26" fill={S.gress.flate} />
          <rect x="0" y={g - 16} width="96" height="8" fill={S.gress.skygge} opacity="0.45" />
          {[8, 21, 33, 58, 77, 89].map((x, i) => (
            <path key={x} d={`M${x} ${g + 3 + (i % 3)} l1 -2.6 l1 2.6 l1 -2 l0.8 2`} fill="none" stroke={S.gress.lys} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </>
      )
      break
    case 'sno':
      innhold = (
        <>
          <rect x="0" y={g - 16} width="96" height="26" fill={S.sno.flate} />
          <rect x="0" y={g - 16} width="96" height="7" fill={S.sno.skygge} opacity="0.5" />
        </>
      )
      break
    case 'gulv':
      innhold = (
        <>
          <rect x="0" y={g - 12} width="96" height="22" fill={S.mork.flate} />
          <rect x="0" y={g - 12} width="96" height="22" fill={u('d')} />
          <rect x="0" y={g - 12.6} width="96" height="0.8" fill={S.metall.skygge} />
          {[-20, 10, 40, 70, 100].map((x) => (
            <line key={x} x1={x} y1={g + 10} x2={x + 22} y2={g - 12} stroke={S.mork.lys} strokeWidth="0.4" />
          ))}
        </>
      )
      break
    case 'kai':
      innhold = (
        <>
          <rect x="0" y={g - 16} width="96" height="28" fill={S.sjo.flate} />
          <rect x="0" y={g - 16} width="96" height="28" fill={u('d')} />
          <polyline className="anim-boelge" points={`40,${g + 4} 44,${g + 2.8} 48,${g + 4}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.8" strokeLinecap="round" />
          <polyline className="anim-boelge sen" points={`70,${g + 8} 74,${g + 6.8} 78,${g + 8}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.8" strokeLinecap="round" />
          <polyline className="anim-boelge" points={`82,${g - 4} 85,${g - 5} 88,${g - 4}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.6" strokeLinecap="round" />
          {/* Kaia: steinkant med en planke på toppen og en pullert. */}
          <polygon points={pkt([0, g - 4], [26, g - 4], inn(26, g - 4, 20), [0, g - 10])} fill={S.stein.lys} />
          <rect x="0" y={g - 4} width="26" height="14" fill={S.stein.flate} />
          {[g, g + 4.5].map((y) => (
            <line key={y} x1="0" y1={y} x2="26" y2={y} stroke={S.stein.skygge} strokeWidth="0.6" />
          ))}
          {[6, 15, 22].map((x, i) => (
            <line key={x} x1={x - (i % 2) * 3} y1={g - 4 + (i % 2) * 4.5} x2={x - (i % 2) * 3} y2={g + (i % 2) * 4.5} stroke={S.stein.skygge} strokeWidth="0.6" />
          ))}
          <polygon points={pkt([26, g - 4], inn(26, g - 4, 20), inn(26, g + 10, 20), [26, g + 10])} fill={S.stein.skygge} />
          <rect x="0" y={g - 5.4} width="26.4" height="1.6" fill={S.treverk.flate} />
          <rect x="16" y={g - 9.5} width="3" height="4.4" rx="1" fill={S.mork.lys} />
          <rect x="15.4" y={g - 10.2} width="4.2" height="1.4" rx="0.7" fill={S.mork.flate} />
        </>
      )
      break
    case 'hav':
      innhold = (
        <>
          <rect x="0" y={HORISONT} width="96" height={96 - HORISONT} fill={S.sjo.flate} />
          <rect x="0" y={HORISONT} width="96" height={96 - HORISONT} fill={u('d')} />
          <rect x="0" y={HORISONT} width="96" height="3" fill={S.sjo.lys} opacity="0.55" />
          {[
            [12, 64, 0.5],
            [70, 62, 0.5],
            [30, 72, 0.7],
            [80, 76, 0.7],
            [8, 86, 0.9],
            [52, 91, 0.9],
          ].map(([x, y, w], i) => (
            <polyline key={i} className={i % 2 ? 'anim-boelge sen' : 'anim-boelge'} points={`${x},${y} ${x + 4 * w},${y - 1.2 * w} ${x + 8 * w},${y}`} fill="none" stroke={S.sjo.lys} strokeWidth={w} strokeLinecap="round" />
          ))}
        </>
      )
      return (
        <g mask={u('km')}>
          <g mask={u('nm')}>{innhold}</g>
        </g>
      )
    case 'asfalt':
      innhold = (
        <>
          <rect x="0" y={g - 16} width="96" height="28" fill={S.mork.lys} />
          <rect x="0" y={g - 16} width="96" height="6" fill={S.mork.flate} opacity="0.5" />
          <path d={`M-4 ${g + 6} Q40 ${g - 2} 100 ${g - 6}`} fill="none" stroke={S.oker.flate} strokeWidth="0.7" />
          {[6, 22, 38, 54, 70, 86].map((x) => (
            <rect key={x} x={x} y={g + 8} width="8" height="0.8" fill={S.hvit.flate} opacity="0.7" />
          ))}
        </>
      )
      break
  }
  return <g mask={u('bm')}>{innhold}</g>
}

// ─────────────────────────────────────────────── Trær og lys

/**
 * Et tre som står på (x, y), `h` enheter høyt: løvtre (`lov`, en krone av
 * runde klynger) eller gran (tre lag, lys venstre og skygge høyre side).
 */
export function Tre({ x, y = GRUNNLINJE, h, slag = 'lov' }: { x: number; y?: number; h: number; slag?: 'lov' | 'gran' }) {
  if (slag === 'gran') {
    const lag = [0, 1, 2].map((i) => {
      const topp = y - h + i * h * 0.24
      const b = h * (0.2 + i * 0.09)
      const bunn = topp + h * 0.42
      return (
        <g key={i}>
          <polygon points={pkt([x, topp], [x - b, bunn], [x + b, bunn])} fill={S.gran.flate} />
          <polygon points={pkt([x, topp], [x + b * 0.15, bunn], [x + b, bunn])} fill={S.gran.skygge} />
        </g>
      )
    })
    return (
      <g>
        <ellipse cx={x + h * 0.12} cy={y} rx={h * 0.3} ry={h * 0.04} fill="#000000" opacity="0.22" />
        <rect x={x - h * 0.03} y={y - h * 0.16} width={h * 0.06} height={h * 0.16} fill={S.treMork.flate} />
        {lag}
      </g>
    )
  }
  const r = h * 0.2
  const sentrum = y - h * 0.62
  const klynger: [number, number, number, string][] = [
    [-0.9, 0.35, 0.95, S.lov.flate],
    [0.9, 0.3, 0.9, S.lov.skygge],
    [0, 0.45, 1.05, S.lov.flate],
    [-0.45, -0.45, 1, S.lov.flate],
    [0.55, -0.3, 0.95, S.lov.skygge],
    [-0.6, -0.15, 0.7, S.lov.lys],
    [0, -0.95, 0.85, S.lov.lys],
  ]
  return (
    <g>
      <ellipse cx={x + h * 0.14} cy={y} rx={h * 0.32} ry={h * 0.045} fill="#000000" opacity="0.22" />
      <polygon points={pkt([x - h * 0.045, y], [x + h * 0.045, y], [x + h * 0.025, sentrum], [x - h * 0.025, sentrum])} fill={S.treMork.flate} />
      {klynger.map(([dx, dy, k, c], i) => (
        <circle key={i} cx={+(x + dx * r).toFixed(2)} cy={+(sentrum + dy * r).toFixed(2)} r={+(r * k).toFixed(2)} fill={c} />
      ))}
    </g>
  )
}

/** En lampe med varm glød rundt; (x, y) er midt på lampen, `r` gløden. */
export function Lampe({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={S.vinduLys.lys} opacity="0.32" />
      <rect x={+(x - r * 0.3).toFixed(2)} y={+(y - r * 0.55).toFixed(2)} width={+(r * 0.6).toFixed(2)} height={+(r * 1.1).toFixed(2)} rx={+(r * 0.2).toFixed(2)} fill={S.vinduLys.lys} />
    </g>
  )
}

/**
 * En rad vinduer: `antall` vinduer, `b` × `h` store med `mellom` mellom,
 * fra (x, y). Hvert `tent`-te vindu (fra `start`) lyser varmt.
 */
export function Vindusrad({ x, y, antall, b, h, mellom, tent = 0, start = 0, karm }: { x: number; y: number; antall: number; b: number; h: number; mellom: number; tent?: number; start?: number; karm?: string }) {
  return (
    <g>
      {Array.from({ length: antall }, (_, i) => {
        const vx = +(x + i * (b + mellom)).toFixed(2)
        const lyser = tent > 0 && (i + start) % tent === 0
        return (
          <g key={i}>
            {karm && <rect x={vx - 0.5} y={y - 0.5} width={b + 1} height={h + 1} fill={karm} />}
            <rect x={vx} y={y} width={b} height={h} fill={lyser ? S.vinduLys.flate : S.glass.skygge} />
            {!lyser && <rect x={vx} y={y} width={b * 0.45} height={h} fill={S.glass.flate} opacity="0.5" />}
          </g>
        )
      })}
    </g>
  )
}

// ─────────────────────────────────────────────── Mennesker

/**
 * En person i riktig målestokk for avstanden, med føttene på `y`.
 * Tegnet 20 enheter høy og skalert, så alle på samme avstand er like store.
 */
export function Person({ x, y = GRUNNLINJE, avstand, klaer, hud = S.hud, har = S.treMork.skygge, ben = S.mork.flate, vendt = 1 }: { x: number; y?: number; avstand: Avstand; klaer: Materiale; hud?: Materiale; har?: string; ben?: string; vendt?: 1 | -1 }) {
  const k = maal(avstand, 'person') / 20
  return (
    <g transform={`translate(${x} ${y}) scale(${k * vendt} ${k})`}>
      <ellipse cx="0.6" cy="0" rx="3.4" ry="0.7" fill="#000000" opacity="0.25" />
      <rect x="-2" y="-9" width="1.8" height="9" rx="0.8" fill={ben} />
      <rect x="0.3" y="-9" width="1.8" height="9" rx="0.8" fill={ben} />
      <path d="M-3 -9 L-2.6 -15.6 Q0 -17 2.6 -15.6 L3 -9 Z" fill={klaer.flate} />
      <path d="M0.8 -9 L1.1 -16.4 Q2.2 -16 2.6 -15.6 L3 -9 Z" fill={klaer.skygge} />
      <rect x="-3.8" y="-15.4" width="1.3" height="6.8" rx="0.65" fill={klaer.lys} />
      <rect x="2.6" y="-15.4" width="1.3" height="6.8" rx="0.65" fill={klaer.skygge} />
      <rect x="-0.7" y="-17.4" width="1.4" height="1.4" fill={hud.skygge} />
      <circle cx="0" cy="-18.4" r="1.75" fill={hud.flate} />
      <path d="M-1.8 -18.6 Q-1.6 -20.6 0.2 -20.4 Q1.9 -20.2 1.8 -18.4 Q0.9 -19.6 -0.2 -19.2 Q-1.1 -18.8 -1.8 -18.6 Z" fill={har} />
    </g>
  )
}

/**
 * Gullplaketten ved nivå 100 i den nye stilen: en mørk plate med gullramme
 * og en stjerne, 12 × 8.6 enheter, med øvre venstre hjørne i (x, y).
 */
export function Plakett({ x, y }: { x: number; y: number }) {
  const cx = x + 6
  const cy = y + 4.3
  const stjerne = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 1.25 : 2.9
    const v = (i / 10) * Math.PI * 2
    return `${+(cx + Math.sin(v) * r).toFixed(2)},${+(cy - Math.cos(v) * r).toFixed(2)}`
  }).join(' ')
  return (
    <g>
      <rect x={x + 0.6} y={y + 0.8} width="12" height="8.6" rx="1.4" fill="#000000" opacity="0.25" />
      <rect x={x} y={y} width="12" height="8.6" rx="1.4" fill={S.mork.skygge} stroke={S.gull.flate} strokeWidth="1" />
      <polygon points={stjerne} fill={S.gull.lys} />
    </g>
  )
}
