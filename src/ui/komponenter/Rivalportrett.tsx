import { memo, useId, type ReactNode } from 'react'
import { S } from './Tegnestil'

/**
 * Portrettene av de fire rivalene (Grafikkpakke G4), malt som forsider på et
 * næringslivsmagasin: hode og skuldre med myke skygger, lyset fra venstre, og
 * en bakgrunn som passer personen og bærer rivalens farge.
 *
 * - **Harald Grønn**, rundt 60: grått hår som viker, tweedjakke og slips, granskog.
 * - **Ingrid Lunde**, rundt 40: mørk hårknute, marineblå blazer, kontorvindu i skumring.
 * - **Sverre Fjeld**, rundt 50: kort hår og gråsprengt skjegg, vattert vest, fjellrygg.
 * - **Marit Aas**, rundt 70: sølvgrå pageklipp, briller og perler, havn i solnedgang.
 *
 * Tegningen er 80 × 100. `form="rund"` (lister) beskjærer til ansiktet i en
 * tynn ring; `form="omslag"` (galleriet og avisa) viser hele bildet i en tynn ramme.
 * Under 33 px beskjæres ansiktet enda tettere, så det fortsatt leses.
 */

export type RivalId = 'gronn' | 'lunde' | 'fjeld' | 'aas'

/** Rivalens faste farge: bakgrunnen i portrettet og ringen rundt det. */
export const RIVALFARGE: Record<RivalId, string> = {
  gronn: S.gran.flate,
  lunde: S.marine.flate,
  fjeld: S.vin.flate,
  aas: S.oker.flate,
}

type Toner = { lys: string; flate: string; skygge: string }

/** Felles for alle ansiktene: hudtoner og fargen på leppene. */
interface Hud extends Toner {
  rodme: string
  lepper: string
}

const ruter = (u: string, navn: string) => `url(#${u}${navn})`

/** Lineær toning fra øverst til venstre (lyset) mot nederst til høyre. */
function Toning({ id, t, vinkel = 'skraa' }: { id: string; t: Toner; vinkel?: 'skraa' | 'loddrett' }) {
  const [x2, y2] = vinkel === 'skraa' ? ['1', '1'] : ['0', '1']
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={t.lys} />
      <stop offset="0.5" stopColor={t.flate} />
      <stop offset="1" stopColor={t.skygge} />
    </linearGradient>
  )
}

/** Huden: lyset fra øverst til venstre, skyggen mot høyre kjeve. */
function Hudtoning({ id, h }: { id: string; h: Hud }) {
  return (
    <radialGradient id={id} cx="0.36" cy="0.34" r="0.78">
      <stop offset="0" stopColor={h.lys} />
      <stop offset="0.55" stopColor={h.flate} />
      <stop offset="1" stopColor={h.skygge} />
    </radialGradient>
  )
}

/** Et øye med øyehvite, iris, glans og øyelokk. `alder` gir poser og rynker. */
function Oye({ x, y, b, iris, h, lokk = 1, alder = 0 }: { x: number; y: number; b: number; iris: string; h: Hud; lokk?: number; alder?: number }) {
  return (
    <g>
      <path d={`M${x - b} ${y}Q${x} ${y - 1.9} ${x + b} ${y}Q${x} ${y + 1.5} ${x - b} ${y}Z`} fill="#eee8de" />
      <circle cx={x + 0.15} cy={y - 0.1} r="1.3" fill={iris} />
      <circle cx={x + 0.15} cy={y - 0.1} r="0.6" fill="#1a1412" />
      <circle cx={x - 0.25} cy={y - 0.55} r="0.38" fill="#ffffff" opacity="0.9" />
      <path d={`M${x - b - 0.3} ${y + 0.1}Q${x} ${y - 2.5} ${x + b + 0.2} ${y - 0.1}`} fill="none" stroke="#2a201c" strokeWidth={0.75 * lokk} strokeLinecap="round" />
      <path d={`M${x - b + 0.5} ${y - 1.5}Q${x} ${y - 3.3} ${x + b - 0.2} ${y - 1.6}`} fill="none" stroke={h.skygge} strokeWidth="0.5" opacity="0.7" />
      <path d={`M${x - b + 0.6} ${y + 0.6}Q${x} ${y + 1.7} ${x + b - 0.4} ${y + 0.5}`} fill="none" stroke={h.skygge} strokeWidth="0.45" opacity="0.55" />
      {alder > 0 && <path d={`M${x - b + 0.8} ${y + 1.6}Q${x} ${y + 3} ${x + b - 0.6} ${y + 1.5}`} fill="none" stroke={h.skygge} strokeWidth="0.45" opacity="0.5" />}
      {alder > 1 && (
        <path
          d={x < 40 ? `M${x - b - 0.6} ${y - 0.2}l-1.6-.8M${x - b - 0.5} ${y + 0.7}l-1.6.4` : `M${x + b + 0.6} ${y - 0.2}l1.6-.8M${x + b + 0.5} ${y + 0.7}l1.6.4`}
          fill="none"
          stroke={h.skygge}
          strokeWidth="0.4"
          opacity="0.6"
        />
      )}
    </g>
  )
}

/** Nesa: skyggesiden til høyre, nesebor, glans på tuppen. */
function Nese({ x, y, l, b, h }: { x: number; y: number; l: number; b: number; h: Hud }) {
  const t = y + l
  return (
    <g>
      <path
        d={`M${x + 0.8} ${y}C${x + 1.4} ${y + l * 0.55} ${x + 2.8} ${y + l * 0.78} ${x + 2.6} ${t}C${x + 1.8} ${t + 0.9} ${x + 0.4} ${t + 1} ${x - 0.6} ${t + 0.7}C${x + 0.8} ${t + 0.2} ${x + 1.6} ${y + l * 0.7} ${x + 0.8} ${y}Z`}
        fill={h.skygge}
        opacity="0.55"
      />
      <path d={`M${x - b} ${t + 0.2}Q${x - b - 0.6} ${t + 1.6} ${x - b * 0.4} ${t + 1.4}M${x + b} ${t + 0.2}Q${x + b + 0.6} ${t + 1.6} ${x + b * 0.4} ${t + 1.4}`} fill="none" stroke={h.skygge} strokeWidth="0.7" strokeLinecap="round" />
      <ellipse cx={x - b * 0.42} cy={t + 1.2} rx="0.75" ry="0.4" fill="#2a1d18" opacity="0.5" />
      <ellipse cx={x + b * 0.42} cy={t + 1.2} rx="0.75" ry="0.4" fill="#2a1d18" opacity="0.5" />
      <ellipse cx={x - 0.3} cy={t - 0.4} rx="1" ry="0.8" fill={h.lys} opacity="0.55" />
      <path d={`M${x - 0.6} ${y + 2}L${x - 0.8} ${t - 2}`} stroke={h.lys} strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

/** Munnen: overleppe, underleppe med glans og skygge under. */
function Munn({ x, y, b, smil, h }: { x: number; y: number; b: number; smil: number; h: Hud }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 3.1} rx={b * 0.5} ry="0.6" fill={h.skygge} opacity="0.35" />
      <path d={`M${x - b} ${y}Q${x - b * 0.5} ${y - 1.4} ${x} ${y - 0.9}Q${x + b * 0.5} ${y - 1.4} ${x + b} ${y}Q${x} ${y + smil * 0.6} ${x - b} ${y}Z`} fill={h.lepper} opacity="0.85" />
      <path d={`M${x - b * 0.8} ${y + 0.3}Q${x} ${y + 2.7 + smil} ${x + b * 0.8} ${y + 0.3}Q${x} ${y + smil} ${x - b * 0.8} ${y + 0.3}Z`} fill={h.lepper} opacity="0.6" />
      <ellipse cx={x} cy={y + 1.3 + smil * 0.5} rx={b * 0.32} ry="0.35" fill="#ffffff" opacity="0.18" />
      <path d={`M${x - b} ${y}Q${x} ${y + smil} ${x + b} ${y}`} fill="none" stroke="#3a221e" strokeWidth="0.75" strokeLinecap="round" opacity="0.85" />
    </g>
  )
}

/** Øre med en skygge inni. */
function Ore({ x, y, h, u }: { x: number; y: number; h: Hud; u: string }) {
  const v = x < 40 ? -1 : 1
  return (
    <g>
      <ellipse cx={x} cy={y} rx="2.5" ry="4.5" fill={ruter(u, 'hud')} />
      <path d={`M${x + v * 0.2} ${y - 2.6}q${v * 1.4} 1.6 ${v * 0.2} 4.6`} fill="none" stroke={h.skygge} strokeWidth="0.8" opacity="0.7" />
    </g>
  )
}

/** Hals og nakkeskygge under haka. */
function Hals({ d, h, u }: { d: string; h: Hud; u: string }) {
  return (
    <g>
      <path d={d} fill={ruter(u, 'hud')} />
      <path d={d} fill={h.skygge} opacity="0.45" clipPath={ruter(u, 'halsklipp')} />
    </g>
  )
}

/** En gran i profil til bakgrunnen. */
const gran = (x: number, y: number, h: number, b: number) =>
  `M${x} ${y - h}L${x + b * 0.5} ${y - h * 0.55}H${x + b * 0.3}L${x + b * 0.68} ${y - h * 0.22}H${x + b * 0.38}L${x + b * 0.8} ${y}H${x - b * 0.8}L${x - b * 0.38} ${y - h * 0.22}H${x - b * 0.68}L${x - b * 0.3} ${y - h * 0.55}H${x - b * 0.5}Z`

/** Mørk kant i bakgrunnen, så personen trer fram. */
function Vignett({ u }: { u: string }) {
  return (
    <>
      <defs>
        <radialGradient id={u + 'vignett'} cx="0.5" cy="0.42" r="0.72">
          <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <rect width="80" height="100" fill={ruter(u, 'vignett')} />
    </>
  )
}

/**
 * Skuldrene og klærne. Strekkes oppover fra bildets nederkant, så halsen blir
 * kortere og hodet sitter på kroppen i stedet for å sveve over den.
 */
function Kropp({ children }: { children: ReactNode }) {
  return <g transform="translate(40 100) scale(1.08 1.12) translate(-40 -100)">{children}</g>
}

interface Portrett {
  bakgrunn: (u: string) => ReactNode
  figur: (u: string) => ReactNode
}

// ------------------------------------------------------------------ Harald Grønn

const GRONN_HUD: Hud = { lys: '#efcdb4', flate: '#dcab8c', skygge: '#b07f66', rodme: '#d48b7a', lepper: '#b06d66' }

const GRONN: Portrett = {
  bakgrunn: (u) => (
    <>
      <defs>
        <linearGradient id={u + 'himmel'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a4b2a0" />
          <stop offset="1" stopColor="#5f7a58" />
        </linearGradient>
      </defs>
      <rect width="80" height="100" fill={ruter(u, 'himmel')} />
      <g fill="#81977c" opacity="0.9">
        {[[8, 74, 34, 12], [20, 72, 42, 13], [34, 70, 30, 11], [48, 72, 40, 13], [61, 73, 34, 12], [72, 71, 44, 13]].map(([x, y, h, b]) => (
          <path key={x} d={gran(x, y, h, b)} />
        ))}
      </g>
      <g fill="#4a6345">
        {[[2, 100, 70, 22], [78, 100, 74, 22], [14, 100, 46, 15], [66, 100, 50, 15]].map(([x, y, h, b]) => (
          <path key={x} d={gran(x, y, h, b)} />
        ))}
      </g>
      <g fill="#344832">
        <path d={gran(-4, 100, 82, 22)} />
        <path d={gran(86, 100, 86, 22)} />
      </g>
    </>
  ),
  figur: (u) => {
    const h = GRONN_HUD
    const tweed: Toner = { lys: '#7a7656', flate: '#5f5c40', skygge: '#3f3d2b' }
    return (
      <>
        <defs>
          <Hudtoning id={u + 'hud'} h={h} />
          <Toning id={u + 'jakke'} t={tweed} />
          <Toning id={u + 'har'} t={{ lys: '#c9c6c0', flate: '#a3a09a', skygge: '#76736d' }} />
          <pattern id={u + 'tweed'} width="1.6" height="1.6" patternUnits="userSpaceOnUse">
            <path d="M0 0l1.6 1.6M1.6 0L0 1.6" stroke="#c8c2a0" strokeWidth="0.25" opacity="0.35" />
          </pattern>
          <clipPath id={u + 'halsklipp'}>
            <path d="M30 52h20v8.6q-10 4-20 0z" />
          </clipPath>
        </defs>
        {/* Jakka, skjorta og slipset. */}
        <Kropp>
        <path d="M3 100C4 84.5 12 76.6 25 73.2L33.6 70 40 86 46.4 70 55 73.2C68 76.6 76 84.5 77 100Z" fill={ruter(u, 'jakke')} />
        <path d="M3 100C4 84.5 12 76.6 25 73.2L33.6 70 40 86 46.4 70 55 73.2C68 76.6 76 84.5 77 100Z" fill={ruter(u, 'tweed')} />
        <Hals d="M34.4 52L34.6 68Q40 71.5 45.4 68L45.6 52Z" h={h} u={u} />
        <path d="M33.6 66.4L40 74.4 46.4 66.4 47.8 70.6 40 79.4 32.2 70.6Z" fill="#ebe6dc" />
        <path d="M40 74.4L46.4 66.4 47.8 70.6 40 79.4z" fill="#c9c2b4" />
        <path d="M38.4 72.8h3.2l-.6 2.6h-2z" fill="#5a2830" />
        <path d="M38.8 75.2h2.4l1.4 13-2.6 3.6-2.6-3.6z" fill={S.vin.flate} />
        <path d="M40 75.2h1.2l1.4 13-2.6 3.6z" fill={S.vin.skygge} />
        <path d="M33.6 70L26 75 31.4 80 29.4 83.4 40 96V86Z" fill={tweed.skygge} />
        <path d="M46.4 70L54 75 48.6 80 50.6 83.4 40 96V86Z" fill={tweed.flate} />
        <path d="M33.6 70L26 75 31.4 80 29.4 83.4 40 96" fill="none" stroke={tweed.lys} strokeWidth="0.5" />
        <path d="M56 84.6l3.8-1.6 1.4 2.8z" fill={S.oker.lys} />
        </Kropp>
        {/* Hodet. */}
        <Ore x={27.8} y={37.5} h={h} u={u} />
        <Ore x={52.2} y={37.5} h={h} u={u} />
        <path d="M28 33C28 22.5 33 17 40 17S52 22.5 52 33C52 40 51.6 45.6 50 49.6 48.2 54.6 44.6 58.4 40 58.4S31.8 54.6 30 49.6C28.4 45.6 28 40 28 33Z" fill={ruter(u, 'hud')} />
        <path d="M46.6 21.6C50.8 25.6 52 31.6 51.8 38 51.6 46 48.4 54 42 58.2 46 52.6 48 46 48.2 38 48.4 31 47.6 25.6 46.6 21.6Z" fill={h.skygge} opacity="0.45" />
        <ellipse cx="33" cy="44.6" rx="3.4" ry="2" fill={h.rodme} opacity="0.32" />
        <ellipse cx="47" cy="44.6" rx="3.4" ry="2" fill={h.rodme} opacity="0.26" />
        {/* Rynker: panne, smilefurer og kjake. */}
        <path d="M33.4 26.6Q40 25 46.6 26.6M34.6 29Q40 27.8 45.4 29" fill="none" stroke={h.skygge} strokeWidth="0.45" opacity="0.35" />
        <path d="M36 46.4Q34 49.2 35 53M44 46.4Q46 49.2 45 53" fill="none" stroke={h.skygge} strokeWidth="0.7" opacity="0.6" />
        <path d="M31.6 50.6Q33.4 55.4 37.4 57.2" fill="none" stroke={h.skygge} strokeWidth="0.5" opacity="0.45" />
        <ellipse cx="34.6" cy="36.4" rx="4" ry="2.4" fill={h.skygge} opacity="0.3" />
        <ellipse cx="45.4" cy="36.4" rx="4" ry="2.4" fill={h.skygge} opacity="0.35" />
        <Oye x={34.6} y={36.8} b={2.8} iris="#5f7a8a" h={h} alder={2} />
        <Oye x={45.4} y={36.8} b={2.8} iris="#5f7a8a" h={h} alder={2} />
        <path d="M30.6 33.4Q34 31 38 32.4L37.8 33.7Q34 32.7 30.8 34.4Z" fill="#8f8c86" />
        <path d="M49.4 33.4Q46 31 42 32.4L42.2 33.7Q46 32.7 49.2 34.4Z" fill="#7a7771" />
        <Nese x={40} y={37} l={9} b={2.6} h={h} />
        <Munn x={40} y={51.6} b={4.4} smil={0.7} h={h} />
        {/* Grått hår som viker i tinningene. */}
        {/* Fyldig over ørene, vikende i tinningene, strøket bakover. */}
        <path d="M27.6 38.6C26 30 27.4 21.6 33 17.6 37.4 14.6 44 14.8 48.2 17.8 53.2 21.6 54.4 30 52.4 38.6 51.6 35.4 51.2 32.4 50.2 29.6 49.4 27.6 48 26.4 46.6 26 45.6 23.4 43.2 22.2 40.6 22.4 38 22.2 35.6 22.8 34.2 24.4 33 23.6 31.4 24 30.6 25.6 29.4 28 28.6 31.6 28.4 35.6Z" fill={ruter(u, 'har')} />
        <path d="M27.8 34.6c-.8 1.8-.6 4.4.2 6M52.2 34.6c.8 1.8.6 4.4-.2 6" fill="none" stroke="#8f8c86" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M33.4 20Q39 17 46.4 19.2M31 24.4Q34.6 19.6 40.6 19M42 20.4Q47.6 21.4 50.4 26.2M29.4 30.4Q30 25.4 33.4 22.2M50.6 30.6Q51 27 49.2 23.8" fill="none" stroke="#e2dfd9" strokeWidth="0.55" opacity="0.75" strokeLinecap="round" />
        <path d="M35.6 21.6Q40 19.8 45 21.2M37 23.4Q41 22 44.4 23" fill="none" stroke="#6f6c66" strokeWidth="0.45" opacity="0.6" strokeLinecap="round" />
      </>
    )
  },
}

// ------------------------------------------------------------------ Ingrid Lunde

const LUNDE_HUD: Hud = { lys: '#b8825f', flate: '#966143', skygge: '#6c432c', rodme: '#a8574a', lepper: '#7d3f3c' }

const LUNDE: Portrett = {
  bakgrunn: (u) => (
    <>
      <defs>
        <linearGradient id={u + 'himmel'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3a50" />
          <stop offset="0.7" stopColor="#5f7784" />
          <stop offset="1" stopColor="#8a8f8a" />
        </linearGradient>
      </defs>
      <rect width="80" height="100" fill={ruter(u, 'himmel')} />
      {/* Byen i skumringen bak glasset. */}
      <path d="M0 76h7V60h6v8h5V52h7v24h6V64h5v12h12V56h6v6h5V48h6v28h5V62h5v38H0Z" fill="#26334a" opacity="0.85" />
      <g fill="#e8c98a">
        {[[6, 66, 2.4, 0.35], [15, 58, 1.6, 0.5], [22, 72, 3, 0.25], [30, 66, 1.4, 0.55], [58, 60, 2.2, 0.4], [64, 70, 1.6, 0.5], [70, 56, 2.8, 0.3], [75, 68, 1.4, 0.55], [52, 74, 2.6, 0.3]].map(([x, y, r, o]) => (
          <circle key={x} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </g>
      {/* Vindusposter. */}
      <path d="M17 0h2.6v100H17zM60.4 0H63v100h-2.6zM0 40h80v1.8H0z" fill="#1c2534" />
      <path d="M19.6 0h.6v100h-.6zM63 0h.6v100H63z" fill="#6f8798" opacity="0.5" />
    </>
  ),
  figur: (u) => {
    const h = LUNDE_HUD
    const blazer: Toner = { lys: '#3c4e69', flate: '#2b3a50', skygge: '#1b2536' }
    return (
      <>
        <defs>
          <Hudtoning id={u + 'hud'} h={h} />
          <Toning id={u + 'jakke'} t={blazer} />
          <Toning id={u + 'har'} t={{ lys: '#4a372c', flate: '#2e2019', skygge: '#1a120e' }} />
          <clipPath id={u + 'halsklipp'}>
            <path d="M30 52h20v7.6q-10 4-20 0z" />
          </clipPath>
        </defs>
        {/* Knuten bak hodet. */}
        <circle cx="51" cy="24" r="6.4" fill={ruter(u, 'har')} />
        <path d="M47 20.4q4-2.4 8 .4" fill="none" stroke="#6a5446" strokeWidth="0.6" opacity="0.7" />
        {/* Blazer og silkebluse. */}
        <Kropp>
        <path d="M4 100C4.6 85 11 77 24 73.6L33 69.6 40 84 47 69.6 56 73.6C69 77 75.4 85 76 100Z" fill={ruter(u, 'jakke')} />
        <Hals d="M35 52L35.2 68Q40 71 44.8 68L45 52Z" h={h} u={u} />
        <path d="M33 68.4Q40 75.6 47 68.4L48.2 73.6 40 82.6 31.8 73.6Z" fill="#e6ddcd" />
        <path d="M40 75.4Q44.6 72.6 47 68.4L48.2 73.6 40 82.6z" fill="#c9bea9" />
        <path d="M34.6 69.6Q40 75 45.4 69.6" fill="none" stroke={S.gull.flate} strokeWidth="0.35" />
        <path d="M33 69.6L25 74.6 30.6 79.6 28.6 83 40 97V84Z" fill={blazer.skygge} />
        <path d="M47 69.6L55 74.6 49.4 79.6 51.4 83 40 97V84Z" fill={blazer.flate} />
        <path d="M33 69.6L25 74.6 30.6 79.6 28.6 83 40 97" fill="none" stroke={blazer.lys} strokeWidth="0.6" />
        </Kropp>
        {/* Hodet. */}
        <ellipse cx="29.4" cy="41.6" rx="1.4" ry="2" fill={h.flate} />
        <ellipse cx="50.6" cy="41.6" rx="1.4" ry="2" fill={h.skygge} />
        <path d="M29 34C29 23 33.6 17.6 40 17.6S51 23 51 34C51 41.4 50 46.6 48 50.6 46 54.8 43.2 57.6 40 57.6S34 54.8 32 50.6C30 46.6 29 41.4 29 34Z" fill={ruter(u, 'hud')} />
        <path d="M46.2 22.4C50 26.4 50.8 32 50.6 38 50.4 45.4 47.6 52.6 42.4 57 45.8 51.6 47.6 45.6 47.8 38 48 31.6 47.4 26 46.2 22.4Z" fill={h.skygge} opacity="0.45" />
        <ellipse cx="33.4" cy="44" rx="3" ry="1.8" fill={h.rodme} opacity="0.3" />
        <ellipse cx="46.6" cy="44" rx="3" ry="1.8" fill={h.rodme} opacity="0.24" />
        <path d="M32.6 39.6Q34.6 41.4 37.4 40.8" fill="none" stroke={h.lys} strokeWidth="0.9" opacity="0.4" strokeLinecap="round" />
        <ellipse cx="34.8" cy="36.4" rx="4" ry="2.4" fill={h.skygge} opacity="0.28" />
        <ellipse cx="45.2" cy="36.4" rx="4" ry="2.4" fill={h.skygge} opacity="0.32" />
        <Oye x={34.8} y={36.8} b={3.1} iris="#3a2618" h={h} lokk={1.35} />
        <Oye x={45.2} y={36.8} b={3.1} iris="#3a2618" h={h} lokk={1.35} />
        <path d="M31 33.4Q34.4 31.2 38 32.8L37.9 33.5Q34.4 32.3 31.2 34Z" fill="#1f1511" />
        <path d="M49 33.4Q45.6 31.2 42 32.8L42.1 33.5Q45.6 32.3 48.8 34Z" fill="#1f1511" />
        <Nese x={40} y={37.2} l={8} b={2.9} h={h} />
        <Munn x={40} y={50.6} b={4.1} smil={1} h={h} />
        {/* Øredobber i gull. */}
        <circle cx="29.3" cy="44.2" r="0.9" fill={S.gull.lys} />
        <circle cx="50.7" cy="44.2" r="0.9" fill={S.gull.flate} />
        {/* Håret med skill, strøket bakover mot knuten. */}
        <path d="M29.2 38C28.2 25.6 32.6 16.6 40 16.2 47.8 16 52.4 24.6 51 38 50.4 31 48.4 25.8 45 23.4 42.6 21.8 40.4 21.2 38.2 20.8 35.8 23.2 32.4 25.4 30.4 30.4 29.8 33 29.4 35.6 29.2 38Z" fill={ruter(u, 'har')} />
        <path d="M31.4 30.4Q33.4 22.6 38.2 20.8M41.6 21.4Q47.6 22.6 49.6 29.6M43 19.4Q48.4 20.6 50.4 25" fill="none" stroke="#6a5446" strokeWidth="0.6" opacity="0.75" strokeLinecap="round" />
      </>
    )
  },
}

// ------------------------------------------------------------------ Sverre Fjeld

const FJELD_HUD: Hud = { lys: '#deb08b', flate: '#c18e69', skygge: '#94684a', rodme: '#c0705a', lepper: '#a0605a' }

const FJELD: Portrett = {
  bakgrunn: (u) => (
    <>
      <defs>
        <linearGradient id={u + 'himmel'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a2d36" />
          <stop offset="0.45" stopColor="#934750" />
          <stop offset="0.75" stopColor="#c27a55" />
          <stop offset="1" stopColor="#d2ab5c" />
        </linearGradient>
      </defs>
      <rect width="80" height="100" fill={ruter(u, 'himmel')} />
      <circle cx="63" cy="64" r="7" fill="#f3dca4" opacity="0.55" />
      <path d="M0 66L9 58 16 62 27 49 35 56 45 47 55 58 63 54 72 61 80 56V100H0Z" fill="#6a4552" opacity="0.85" />
      <path d="M27 49l3.4 3.8-2.2-.6-1.6 2.2-1.4-1.6zM45 47l3.6 4.2-2.4-.8-1.2 1.8-1.6-1.8z" fill="#e4d2c8" opacity="0.7" />
      <path d="M0 78L12 70 22 75 34 66 46 74 58 67 70 74 80 70V100H0Z" fill="#3a2a30" />
    </>
  ),
  figur: (u) => {
    const h = FJELD_HUD
    const vest: Toner = { lys: '#4a4f54', flate: '#363a3e', skygge: '#24272a' }
    const skjorte: Toner = { lys: '#6f8aa6', flate: '#56708c', skygge: '#3e536b' }
    return (
      <>
        <defs>
          <Hudtoning id={u + 'hud'} h={h} />
          <Toning id={u + 'skjorte'} t={skjorte} />
          <Toning id={u + 'jakke'} t={vest} />
          <Toning id={u + 'har'} t={{ lys: '#5e4836', flate: '#46352a', skygge: '#2c211a' }} />
          <Toning id={u + 'skjegg'} t={{ lys: '#7a6a5c', flate: '#5c4c40', skygge: '#3c3029' }} />
          <pattern id={u + 'rute'} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <path d="M0 0h3.2M0 0v3.2" stroke="#9fb3c6" strokeWidth="0.5" opacity="0.35" />
          </pattern>
          <clipPath id={u + 'halsklipp'}>
            <path d="M30 50h20v12q-10 3-20 0z" />
          </clipPath>
        </defs>
        {/* Rutete skjorte med vattert vest over. */}
        <Kropp>
        <path d="M3 100C4 85 12 77 25 73.4L33 69.6 40 76 47 69.6 55 73.4C68 77 76 85 77 100Z" fill={ruter(u, 'skjorte')} />
        <path d="M3 100C4 85 12 77 25 73.4L33 69.6 40 76 47 69.6 55 73.4C68 77 76 85 77 100Z" fill={ruter(u, 'rute')} />
        <Hals d="M34.8 52L35 68Q40 71 45 68L45.2 52Z" h={h} u={u} />
        <path d="M33 66L40 73.6 47 66 48.6 70.6 40 78.6 31.4 70.6Z" fill={skjorte.lys} />
        <path d="M40 73.6L47 66 48.6 70.6 40 78.6z" fill={skjorte.skygge} />
        <path d="M40 78.6v6" stroke={skjorte.skygge} strokeWidth="0.6" />
        <path d="M13 100C14 88 18 80.4 26 76L32.4 71.2 39 84.6V100ZM67 100C66 88 62 80.4 54 76L47.6 71.2 41 84.6V100Z" fill={ruter(u, 'jakke')} />
        <path d="M15.4 86.4Q26 84.4 38.8 87M14.2 93Q26 91 38.8 93.6M41.2 87Q54 84.4 64.6 86.4M41.2 93.6Q54 91 65.8 93M20 80.6Q28 78.6 36.2 80.6M43.8 80.6Q52 78.6 60 80.6" fill="none" stroke={vest.lys} strokeWidth="0.55" strokeDasharray="1.2 0.8" />
        <path d="M32.4 71.2L39 84.6M47.6 71.2L41 84.6" fill="none" stroke={vest.lys} strokeWidth="0.9" />
        <path d="M40.1 84.6V100" stroke="#9aa0a4" strokeWidth="0.7" />
        </Kropp>
        {/* Hodet. */}
        <Ore x={27.6} y={37} h={h} u={u} />
        <Ore x={52.4} y={37} h={h} u={u} />
        <path d="M27.6 33C27.6 22.4 32.8 16.8 40 16.8S52.4 22.4 52.4 33C52.4 40 52 45 51 48.6 49.6 53.8 45.6 57.8 40 57.8S30.4 53.8 29 48.6C28 45 27.6 40 27.6 33Z" fill={ruter(u, 'hud')} />
        <path d="M47 21.4C51.2 25.4 52.2 31.4 52 37.6 51.8 44 49.6 49 46.4 52 48 47 48.6 42 48.6 37.6 48.6 30.6 48 25.4 47 21.4Z" fill={h.skygge} opacity="0.45" />
        <ellipse cx="33.4" cy="42.4" rx="3" ry="1.6" fill={h.rodme} opacity="0.3" />
        <path d="M33.6 27Q40 25.8 46.4 27" fill="none" stroke={h.skygge} strokeWidth="0.5" opacity="0.45" />
        <ellipse cx="34.6" cy="36" rx="4" ry="2.4" fill={h.skygge} opacity="0.32" />
        <ellipse cx="45.4" cy="36" rx="4" ry="2.4" fill={h.skygge} opacity="0.38" />
        <Oye x={34.6} y={36.4} b={2.8} iris="#4f6a52" h={h} lokk={1.1} alder={1} />
        <Oye x={45.4} y={36.4} b={2.8} iris="#4f6a52" h={h} lokk={1.1} alder={1} />
        <path d="M30.4 33.2Q34 32 38.2 32.8L38 34.2Q34 33.4 30.6 34.6Z" fill="#33261d" />
        <path d="M49.6 33.2Q46 32 41.8 32.8L42 34.2Q46 33.4 49.4 34.6Z" fill="#2a1f18" />
        <Nese x={40} y={36.8} l={8.6} b={3} h={h} />
        {/* Gråsprengt skjegg rundt munnen. */}
        <path d="M28.4 39.4C28.6 46 30 51.4 33.4 55.4 36 58.4 38 59.8 40 59.8S44 58.4 46.6 55.4C50 51.4 51.4 46 51.6 39.4 50.6 43 49 45.4 47 46.6 45 45.4 42.6 44.8 40 45 37.4 44.8 35 45.4 33 46.6 31 45.4 29.4 43 28.4 39.4Z" fill={ruter(u, 'skjegg')} />
        <Munn x={40} y={51.4} b={3.6} smil={0.4} h={h} />
        <path d="M34.6 49.8C36.4 47.4 38.6 47.2 40 48.4 41.4 47.2 43.6 47.4 45.4 49.8 43.6 50 41.6 50.2 40 49.8 38.4 50.2 36.4 50 34.6 49.8Z" fill="#4c3e34" />
        <path d="M31 47.6q1.4 4 3.4 6.4M33.6 53.6q2 2.8 4.4 3.8M46.4 53.6q-2 2.8-4.4 3.8M49 47.6q-1.4 4-3.4 6.4M38 55.6l.6 2M42 55.6l-.6 2" fill="none" stroke="#b3a89c" strokeWidth="0.45" opacity="0.8" strokeLinecap="round" />
        {/* Kort hår, grått i tinningene. */}
        {/* Kort hår med en liten bølge foran, grått i tinningene. */}
        <path d="M27.6 34C26.8 24.6 30.4 17.4 36.6 15.2 40.4 13.8 45.4 14.4 48.6 17.2 52.4 20.4 53.6 26.6 52.4 34 51.6 30 50.6 27.6 49 26.2 47.6 24.4 45.4 23.6 43 23.8 41.2 22.4 38.4 22.2 36.6 23.4 34.6 22.6 32 23.4 30.8 25.4 29.4 27.6 28.4 30.6 27.6 34Z" fill={ruter(u, 'har')} />
        <path d="M27.8 32.6c-.6 2-.4 4 .2 5.6M52.2 32.6c.6 2 .4 4-.2 5.6" fill="none" stroke="#968e86" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M33 19.6Q38.4 16.4 45.6 17.8M36.4 22.4Q39.6 19.6 44 20.6M30.4 26.4Q31.6 21.6 35.6 19.4M47.4 20.4Q50.6 22.6 51.4 27" fill="none" stroke="#7d6654" strokeWidth="0.6" opacity="0.85" strokeLinecap="round" />
        <path d="M29.6 28.4q.6-1.8 1.6-2.6M50.4 28.6q-.4-1.6-1.4-2.6" fill="none" stroke="#b7aea4" strokeWidth="0.6" opacity="0.8" strokeLinecap="round" />
      </>
    )
  },
}

// ------------------------------------------------------------------ Marit Aas

const AAS_HUD: Hud = { lys: '#f2d8c8', flate: '#ddb7a2', skygge: '#b08b7a', rodme: '#d89a90', lepper: '#a8636a' }

/** Perlekjedet: perler langs en bue over kragebeinet. */
const PERLER = Array.from({ length: 11 }, (_, i) => {
  const t = i / 10
  const x = 32.4 + 15.2 * t
  return [+x.toFixed(2), +(70 + 5 * Math.sin(Math.PI * t)).toFixed(2)]
})

const AAS: Portrett = {
  bakgrunn: (u) => (
    <>
      <defs>
        <linearGradient id={u + 'himmel'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e5a3a" />
          <stop offset="0.5" stopColor="#b88f40" />
          <stop offset="0.72" stopColor="#e8c98a" />
          <stop offset="0.72" stopColor="#6f7479" />
          <stop offset="1" stopColor="#4b5359" />
        </linearGradient>
      </defs>
      <rect width="80" height="100" fill={ruter(u, 'himmel')} />
      <path d="M4 76h16M48 80h22M10 86h14M56 90h18" stroke="#e8c98a" strokeWidth="0.8" opacity="0.5" />
      {/* Kraner og et skip i havna. */}
      <g fill="#3d3027" opacity="0.85">
        <path d="M6 72V38h2.4v34zM2 40h22v1.8H2zM8.4 40l10-6 .8 1.4-9.4 5.6zM18 41.8h1v10h-1zM16.6 51.8h3.8v2h-3.8z" />
        <path d="M70 72V34h2.4v38zM58 36h22v1.8H58zM70 36l-8-5.6.9-1.3 8.6 6zM62 37.8h1v8h-1z" />
        <path d="M44 72l2-4h18l-1.4 4zM50 68v-4h8v4zM52 64v-3h2v3z" />
      </g>
    </>
  ),
  figur: (u) => {
    const h = AAS_HUD
    const jakke: Toner = { lys: '#5e4452', flate: '#46323e', skygge: '#2e212a' }
    return (
      <>
        <defs>
          <Hudtoning id={u + 'hud'} h={h} />
          <Toning id={u + 'jakke'} t={jakke} />
          <Toning id={u + 'har'} t={{ lys: '#e6e4e0', flate: '#c2bfb9', skygge: '#8f8b85' }} />
          <radialGradient id={u + 'perle'} cx="0.35" cy="0.3" r="0.7">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#bdb6ad" />
          </radialGradient>
          <clipPath id={u + 'halsklipp'}>
            <path d="M30 52h20v8.4q-10 4-20 0z" />
          </clipPath>
        </defs>
        {/* Pageklippen bak ansiktet. */}
        <path d="M25.4 51C23.6 38 25 22.6 32.6 17.6 37 14.6 43 14.6 47.4 17.6 55 22.6 56.4 38 54.6 51 52.2 53 49.8 52.8 49 51H31C30.2 52.8 27.8 53 25.4 51Z" fill={ruter(u, 'har')} />
        {/* Jakke uten krage, med kant. */}
        <Kropp>
        <path d="M3 100C4 85 12 77 25 73.4L32 70.4Q40 77.4 48 70.4L55 73.4C68 77 76 85 77 100Z" fill={ruter(u, 'jakke')} />
        <Hals d="M35 52L35 68.4Q40 74 45 68.4L45 52Z" h={h} u={u} />
        <path d="M32 70.4Q40 77.4 48 70.4" fill="none" stroke="#d8c8b8" strokeWidth="0.9" opacity="0.6" />
        <path d="M30 72.4L35 92M50 72.4L45 92" fill="none" stroke="#d8c8b8" strokeWidth="0.6" opacity="0.4" />
        {[[32.6, 83], [33.8, 88.6], [47.4, 83], [46.2, 88.6]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill={S.gull.flate} stroke={S.gull.skygge} strokeWidth="0.3" />
        ))}
        {PERLER.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.15" fill={ruter(u, 'perle')} />
        ))}
        </Kropp>
        {/* Hodet. */}
        <path d="M28.4 34C28.4 23.4 33.4 18 40 18S51.6 23.4 51.6 34C51.6 41 51 46 49.4 50 47.4 55 44 58 40 58S32.6 55 30.6 50C29 46 28.4 41 28.4 34Z" fill={ruter(u, 'hud')} />
        <path d="M46.4 22.6C50.4 26.6 51.4 32.4 51.2 38.4 51 46 48 53.6 42.4 57.6 45.8 52.4 47.6 46 47.8 38.4 48 31.8 47.4 26.6 46.4 22.6Z" fill={h.skygge} opacity="0.4" />
        <ellipse cx="33.4" cy="45" rx="3.2" ry="1.9" fill={h.rodme} opacity="0.35" />
        <ellipse cx="46.6" cy="45" rx="3.2" ry="1.9" fill={h.rodme} opacity="0.28" />
        <path d="M36.2 47Q34.4 49.6 35.4 53.2M43.8 47Q45.6 49.6 44.6 53.2M35.4 54.4q1.4 1.6 3 2M44.6 54.4q-1.4 1.6-3 2" fill="none" stroke={h.skygge} strokeWidth="0.55" opacity="0.55" />
        <ellipse cx="34.8" cy="37" rx="4" ry="2.4" fill={h.skygge} opacity="0.26" />
        <ellipse cx="45.2" cy="37" rx="4" ry="2.4" fill={h.skygge} opacity="0.3" />
        <Oye x={34.8} y={37.4} b={2.7} iris="#5d7690" h={h} lokk={1.15} alder={2} />
        <Oye x={45.2} y={37.4} b={2.7} iris="#5d7690" h={h} lokk={1.15} alder={2} />
        <path d="M31.2 34Q34.6 32.4 38 33.6L37.9 34.3Q34.6 33.2 31.4 34.7Z" fill="#8a7d74" />
        <path d="M48.8 34Q45.4 32.4 42 33.6L42.1 34.3Q45.4 33.2 48.6 34.7Z" fill="#7a6d64" />
        {/* Tynne gullbriller. */}
        <g fill="none" stroke={S.gull.flate} strokeWidth="0.6">
          <rect x="30.8" y="34.8" width="8" height="5.2" rx="1.8" />
          <rect x="41.2" y="34.8" width="8" height="5.2" rx="1.8" />
          <path d="M38.8 36.6Q40 35.8 41.2 36.6M30.8 36.4L28.6 35.8M49.2 36.4l2.2-.6" />
        </g>
        <Nese x={40} y={38} l={7.8} b={2.5} h={h} />
        <Munn x={40} y={51.2} b={4} smil={0.6} h={h} />
        {/* Ponnien foran. */}
        <path d="M29.2 34C28.4 24.6 33 18.2 40 17.8 47 18.2 51.6 24.6 50.8 34 49.2 30.8 46.6 29.4 43.2 29.2 40.8 29 38.6 30.2 36.4 30 33.4 29.8 30.8 31.4 29.2 34Z" fill={ruter(u, 'har')} />
        <path d="M32.6 23Q37 19.4 43.6 20.2M31 29.4Q33.4 23.6 38.4 22M45.4 22.6Q49 24.6 49.6 29" fill="none" stroke="#f6f5f2" strokeWidth="0.6" opacity="0.8" strokeLinecap="round" />
      </>
    )
  },
}

const PORTRETTER: Record<RivalId, Portrett> = { gronn: GRONN, lunde: LUNDE, fjeld: FJELD, aas: AAS }

export const RIVALPORTRETTER = Object.keys(PORTRETTER) as RivalId[]

/** Utsnittet til den runde formen: ansiktet, tettere når portrettet er lite. */
const utsnitt = (px: number) => (px <= 32 ? { x: 18.5, y: 14, s: 43 } : { x: 12.5, y: 10.5, s: 55 })

/**
 * Portrettet av en rival. Ukjent id gir ingenting. `størrelse` er høyden i
 * piksler; omslaget er 4:5, så det blir smalere enn det er høyt.
 */
export const Rivalportrett = memo(function Rivalportrett({ id, størrelse = 40, form = 'rund' }: { id: string; størrelse?: number; form?: 'rund' | 'omslag' }) {
  // Id-er bare av bokstaver og tall, så de kan stå rett i url(#…).
  const u = 'r' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const p = PORTRETTER[id as RivalId]
  if (!p) return null
  const farge = RIVALFARGE[id as RivalId]
  if (form === 'omslag') {
    return (
      <svg className="rivalportrett omslag" width={Math.round(størrelse * 0.8)} height={størrelse} viewBox="0 0 80 100" aria-hidden="true">
        <defs>
          <clipPath id={u + 'ramme'}>
            <rect width="80" height="100" />
          </clipPath>
        </defs>
        <g clipPath={ruter(u, 'ramme')}>
          {p.bakgrunn(u)}
          <Vignett u={u} />
          {p.figur(u)}
        </g>
        <rect x="0.5" y="0.5" width="79" height="99" fill="none" stroke={farge} strokeWidth="1" />
      </svg>
    )
  }
  const { x, y, s } = utsnitt(størrelse)
  const r = s / 2
  return (
    <svg className="rivalportrett" width={størrelse} height={størrelse} viewBox={`${x} ${y} ${s} ${s}`} aria-hidden="true">
      <defs>
        <clipPath id={u + 'ramme'}>
          <circle cx={x + r} cy={y + r} r={r - 0.6} />
        </clipPath>
      </defs>
      <g clipPath={ruter(u, 'ramme')}>
        {p.bakgrunn(u)}
        <Vignett u={u} />
        {p.figur(u)}
      </g>
      <circle cx={x + r} cy={y + r} r={r - 0.6} fill="none" stroke={farge} strokeWidth={s / 44} />
    </svg>
  )
})
