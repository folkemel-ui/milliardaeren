/**
 * Illustrasjonene for bedrifter, eiendom og luksus. Alle er bygget av enkle
 * former på et 48×48-rutenett, med faste farger, så de ser like ut i mørkt
 * og lyst tema. Se dem store på ?galleri.
 *
 * Tegnereglene, så nye tegninger passer med de gamle:
 * - Fargene kommer fra paletten F — ingen løse fargekoder.
 * - Alt står på samme grunnlinje (y = 43) og på én «Grunn»: gate, sjø,
 *   gress, snø, sand, åker eller en skygge for ting som står løst.
 *   Ingen bakgrunn fyller hele ruta, og ingenting går helt ut i kanten.
 * - Alt sees fra siden, også flyene.
 * - Flate former uten omriss. Streker bare for tynne detaljer.
 * - Bygninger har en mørkere stripe på høyre side (lyset kommer fra venstre).
 * - Bedriftene er steder, ikke varer: varen står på skiltet.
 *
 * Bedriftene vokser med nivået (trinn 0–3 ved nivå 1, 25, 50 og 100):
 * større og en egen detalj ved 25, kunder ved 50, og en gullplakett ved 100.
 * Hver av de tre forbedringene legger til sin egen lille detalj (`f` = hvor
 * mange som er kjøpt), så du ser hva du har investert i.
 *
 * Noen deler har en `anim-`-klasse (damp, røyk, flagg, flamme, bølger …).
 * De beveger seg bare på den store scenen i detaljvisningene, og aldri når
 * spilleren har bedt om mindre bevegelse — se styles.css.
 */

import { memo, type ReactNode } from 'react'

export const F = {
  hvit: '#f8f6f1',
  krem: '#ece6d8',
  kremMork: '#d8cfbd',
  lysgraa: '#d6d3d1',
  graa: '#a8a29e',
  stein: '#8b8680',
  skifer: '#57534e',
  mork: '#2b2622',
  gate: '#9ca3af',
  tre: '#b5835a',
  treLys: '#d19e6e',
  treMork: '#7a5230',
  treDyp: '#4a2f1d',
  rod: '#d64545',
  rodMork: '#a33030',
  vin: '#8e2f3a',
  vinMork: '#6b2230',
  oransje: '#f4a261',
  brod: '#f0b865',
  gul: '#f4d35e',
  gulMork: '#c9a227',
  saft: '#ffe066',
  gull: '#d4af37',
  gullLys: '#f7e3a1',
  gullMork: '#9c7c1c',
  gronn: '#5a9e4b',
  gronnMork: '#2f6b3a',
  gran: '#236b40',
  granMork: '#1f5f3a',
  blaa: '#3b82c4',
  blaaMork: '#2f5d8a',
  marine: '#1e3a5f',
  glass: '#a8d8f0',
  glassMork: '#6aa6d0',
  sjo: '#2f7fbf',
  sjoMork: '#235f91',
  sjoLys: '#8cc4ea',
  sno: '#eef3f8',
  snoSkygge: '#cdd9e5',
  fjell: '#94a3b8',
  lys: '#fde68a',
  mur: '#b5563c',
  murMork: '#8a3f2b',
  sand: '#e9d3a0',
  aker: '#e9c46a',
  akerMork: '#d4a93c',
  tyrkis: '#2a9d8f',
  tyrkisMork: '#1f6f66',
  rosa: '#e9a0b0',
  metall: '#9ca3af',
  metallLys: '#d1d5db',
  metallMork: '#6b7280',
  hud: '#e8b894',
} as const

function Svg({ størrelse, children }: { størrelse: number; children: ReactNode }) {
  return (
    <svg width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  )
}

type P = { størrelse?: number }
/** Hvor langt en bedrift har vokst: 0 ved nivå 1, 1 ved 25, 2 ved 50, 3 ved 100. */
export type Trinn = 0 | 1 | 2 | 3

export function trinnFor(nivaa: number | undefined): Trinn {
  if (!nivaa) return 0
  return nivaa >= 100 ? 3 : nivaa >= 50 ? 2 : nivaa >= 25 ? 1 : 0
}

// ─────────────────────────────────────────────── Felles byggeklosser

type Grunntype = 'gate' | 'skygge' | 'sjo' | 'fjord' | 'gress' | 'sno' | 'sand' | 'aker'

/** Bakken alt står på. Samme høyde og bredde overalt, så tegningene står likt i kortene. */
function Grunn({ type }: { type: Grunntype }) {
  switch (type) {
    case 'gate':
      return <rect x="4" y="43" width="40" height="2.2" rx="1.1" fill={F.gate} />
    case 'skygge':
      return <ellipse cx="24" cy="43.8" rx="17" ry="1.9" fill="#000000" opacity="0.2" />
    case 'gress':
      return <rect x="3" y="41.5" width="42" height="3.6" rx="1.8" fill={F.gronn} />
    case 'sno':
      return (
        <>
          <rect x="3" y="41" width="42" height="4.2" rx="2.1" fill={F.sno} />
          <rect x="5" y="43.6" width="38" height="1.6" rx="0.8" fill={F.snoSkygge} />
        </>
      )
    case 'sand':
      return <rect x="3" y="40" width="42" height="5.2" rx="2.6" fill={F.sand} />
    case 'aker':
      return (
        <>
          <rect x="3" y="37" width="42" height="8.2" rx="2.4" fill={F.aker} />
          {[39.5, 42].map((y) => (
            <rect key={y} x="5" y={y} width="38" height="0.8" rx="0.4" fill={F.akerMork} />
          ))}
          <rect x="3" y="36" width="42" height="2" rx="1" fill={F.gronn} />
        </>
      )
    case 'sjo':
    case 'fjord': {
      const y = type === 'sjo' ? 38 : 26
      return (
        <>
          <rect x="3" y={y} width="42" height={45.2 - y} rx="3.6" fill={F.sjo} />
          <polyline className="anim-boelge" points={`7,${y + 3.4} 10,${y + 2.5} 13,${y + 3.4}`} fill="none" stroke={F.sjoLys} strokeWidth="1" strokeLinecap="round" />
          <polyline className="anim-boelge sen" points="33,43 36,42.1 39,43" fill="none" stroke={F.sjoLys} strokeWidth="1" strokeLinecap="round" />
        </>
      )
    }
  }
}

/** Større for hvert trinn, målt fra midt på grunnlinjen, så det aldri svever. */
const SKALA: Record<Trinn, number> = { 0: 0.86, 1: 0.93, 2: 1, 3: 1 }

function Vekst({ trinn, children }: { trinn: Trinn; children: ReactNode }) {
  const k = SKALA[trinn]
  return k === 1 ? <>{children}</> : <g transform={`translate(24 43) scale(${k}) translate(-24 -43)`}>{children}</g>
}

/** En liten figur som står på grunnlinjen. */
function Person({ x, farge }: { x: number; farge: string }) {
  return (
    <g>
      <rect x={x - 1.8} y="37.4" width="3.6" height="5.8" rx="1.5" fill={farge} />
      <circle cx={x} cy="35.6" r="1.55" fill={F.hud} />
    </g>
  )
}

/** En liten båt på vannet, for bedriftene som ligger på sjøen. */
function Smabaat({ x, farge }: { x: number; farge: string }) {
  return (
    <g>
      <polygon points={`${x - 3.6},40.2 ${x + 3.6},40.2 ${x + 2.6},42.4 ${x - 2.6},42.4`} fill={farge} />
      <rect x={x - 1.6} y="38.3" width="2.6" height="2" fill={F.hvit} />
    </g>
  )
}

/** Kundene ved nivå 50: to figurer, tre ved nivå 100. Båter der bedriften ligger på sjøen. */
function Kunder({ trinn, sjo }: { trinn: Trinn; sjo?: boolean }) {
  if (trinn < 2) return null
  if (sjo) {
    return (
      <>
        <Smabaat x={8} farge={F.rod} />
        {trinn >= 3 && <Smabaat x={40} farge={F.gul} />}
      </>
    )
  }
  return (
    <>
      <Person x={5.5} farge={F.blaa} />
      <Person x={42.5} farge={F.rod} />
      {trinn >= 3 && <Person x={38.6} farge={F.gronn} />}
    </>
  )
}

/** Gullplaketten ved nivå 100: en mørk plate med gullkant og en stjerne — et diskret kvalitetsstempel. */
function Utmerkelse({ x, y }: { x: number; y: number }) {
  const cx = x + 4.5
  const cy = y + 3.2
  const stjerne = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 1 : 2.3
    const v = (i / 10) * Math.PI * 2
    return `${cx + Math.sin(v) * r},${cy - Math.cos(v) * r}`
  }).join(' ')
  return (
    <g>
      <rect x={x} y={y} width="9" height="6.4" rx="1.2" fill={F.mork} stroke={F.gull} strokeWidth="0.8" />
      <polygon points={stjerne} fill={F.gullLys} />
    </g>
  )
}

/** Hvor plaketten henger på hver bedrift — der tegningen har ledig plass. */
const PLAKETT: Record<string, [number, number]> = {
  restaurant: [35, 3],
  hotell: [37, 9],
}

/** Setter sammen en bedrift: grunn, selve stedet (som vokser), kunder og plaketten. */
function Bedrift({ trinn, grunn, sjo, id, children }: { trinn: Trinn; grunn: Grunntype; sjo?: boolean; id: string; children: ReactNode }) {
  const [nx, ny] = PLAKETT[id] ?? [3, 3]
  return (
    <>
      <Grunn type={grunn} />
      <Vekst trinn={trinn}>{children}</Vekst>
      <Kunder trinn={trinn} sjo={sjo} />
      {trinn >= 3 && <Utmerkelse x={nx} y={ny} />}
    </>
  )
}

/** En bedriftstegning: vekstrinnet og hvor mange forbedringer som er kjøpt (0–3). */
type B = (trinn: Trinn, f: number) => ReactNode

// ─────────────────────────────────────────────── Bedrifter

const saftbod: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="saftbod">
    <rect x="9" y="18" width="2.5" height="25" fill={F.treMork} />
    <rect x="36.5" y="18" width="2.5" height="25" fill={F.treMork} />
    <polygon points="6,12 42,12 44,20 4,20" fill={F.gul} />
    <polygon points="13.2,12 20.4,12 20.8,20 12.4,20" fill={F.hvit} />
    <polygon points="27.6,12 34.8,12 35.6,20 27.2,20" fill={F.hvit} />
    <rect x="4" y="20" width="40" height="2" fill={F.gulMork} />
    <rect x="6" y="33" width="36" height="10" rx="1" fill={F.tre} />
    <rect x="6" y="33" width="36" height="2.5" fill={F.treLys} />
    <rect x="16" y="25" width="7" height="8" rx="1.5" fill={F.saft} />
    <rect x="21" y="25" width="2" height="8" rx="1" fill={F.gul} />
    <rect x="23" y="27" width="2" height="4" rx="1" fill="none" stroke={F.gulMork} strokeWidth="1" />
    <rect x="28" y="28.5" width="3.5" height="4.5" rx="0.6" fill={F.saft} />
    <circle cx="19.5" cy="24.2" r="1.3" fill={F.gronn} />
    {t >= 1 && (
      <>
        <rect x="33" y="28.5" width="3.5" height="4.5" rx="0.6" fill={F.saft} />
        <rect x="9" y="36.4" width="12" height="5" rx="1" fill={F.hvit} />
        <circle cx="12" cy="38.9" r="1.4" fill={F.gul} />
        <rect x="14.6" y="38.4" width="4.6" height="1" rx="0.5" fill={F.stein} />
      </>
    )}
    {/* Saftpresse, isbiter og en grønn vimpel for den sukkerfrie linja. */}
    {f >= 1 && (
      <>
        <rect x="9.5" y="27" width="4" height="6" rx="0.8" fill={F.metallLys} />
        <line x1="11.5" y1="27" x2="14.5" y2="24" stroke={F.metallMork} strokeWidth="1" strokeLinecap="round" />
        <circle cx="11.5" cy="26" r="1.1" fill={F.gul} />
      </>
    )}
    {f >= 2 && (
      <>
        <rect x="17" y="27.2" width="1.6" height="1.6" rx="0.3" fill={F.hvit} opacity="0.85" />
        <rect x="18.8" y="29.4" width="1.6" height="1.6" rx="0.3" fill={F.hvit} opacity="0.85" />
        <rect x="29" y="29.3" width="1.4" height="1.4" rx="0.3" fill={F.hvit} opacity="0.85" />
      </>
    )}
    {f >= 3 && (
      <>
        <line x1="42" y1="12" x2="42" y2="5.5" stroke={F.treMork} strokeWidth="0.8" />
        <polygon points="42,5.5 45,7.2 42,8.9" fill={F.gronn} />
      </>
    )}
  </Bedrift>
)

const polsebod: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="polsebod">
    <rect x="23.3" y="12" width="1.4" height="14" fill={F.metallMork} />
    <path d="M8 16 Q24 1 40 16 Z" fill={F.rod} />
    <polygon points="24,8.8 17,16 20.6,16" fill={F.hvit} />
    <polygon points="24,8.8 27.4,16 31,16" fill={F.hvit} />
    <rect x="8" y="15.4" width="32" height="1.6" rx="0.8" fill={F.rodMork} />
    <rect x="6" y="24.5" width="36" height="2.4" rx="1" fill={F.metallLys} />
    <rect x="8" y="26.5" width="32" height="12" rx="2" fill={F.hvit} />
    <rect x="35" y="26.5" width="5" height="12" rx="2" fill={F.krem} />
    <rect x="8" y="34.5" width="32" height="4" fill={F.rod} />
    <rect x="13" y="28.4" width="22" height="4.4" rx="2.2" fill={F.brod} />
    <rect x="11" y="29.2" width="26" height="2.8" rx="1.4" fill="#c0452b" />
    <polyline points="14,30.6 16,29.7 18,30.6 20,29.7 22,30.6 24,29.7 26,30.6 28,29.7 30,30.6 32,29.7 34,30.6" fill="none" stroke={F.gul} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="40" y="29" width="4" height="1.4" rx="0.7" fill={F.metallMork} />
    <circle cx="14" cy="40.3" r="2.8" fill={F.mork} />
    <circle cx="14" cy="40.3" r="1.1" fill={F.metall} />
    <circle cx="34" cy="40.3" r="2.8" fill={F.mork} />
    <circle cx="34" cy="40.3" r="1.1" fill={F.metall} />
    {t >= 1 && (
      <>
        <rect x="10" y="19.6" width="2.6" height="5" rx="1" fill={F.rod} />
        <rect x="10.6" y="18.6" width="1.4" height="1.4" fill={F.hvit} />
        <rect x="13.6" y="19.6" width="2.6" height="5" rx="1" fill={F.gul} />
        <rect x="14.2" y="18.6" width="1.4" height="1.4" fill={F.hvit} />
      </>
    )}
    {/* Grillplate i stål, sennepsflaske og lykta foran på foodtrucken. */}
    {f >= 1 && (
      <>
        <rect x="19" y="22.4" width="10" height="2.2" rx="0.5" fill={F.metallMork} />
        <line x1="21" y1="22.9" x2="27" y2="22.9" stroke={F.metallLys} strokeWidth="0.4" />
      </>
    )}
    {f >= 2 && (
      <>
        <rect x="33" y="19.6" width="2.4" height="5" rx="0.8" fill={F.gul} />
        <rect x="33.5" y="18.4" width="1.4" height="1.4" rx="0.3" fill={F.rod} />
      </>
    )}
    {f >= 3 && (
      <>
        <rect x="8" y="33.2" width="32" height="1" fill={F.gul} />
        <circle cx="7.2" cy="31" r="1.2" fill={F.lys} />
      </>
    )}
  </Bedrift>
)

const gatekjokken: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="gatekjokken">
    <rect x="8" y="18" width="32" height="25" fill={F.lysgraa} />
    <rect x="36" y="18" width="4" height="25" fill={F.graa} />
    <rect x="6" y="15.5" width="36" height="3" fill={F.skifer} />
    {/* Skiltet: en burger. */}
    <rect x="14" y="5" width="20" height="10" rx="2" fill={F.mork} />
    <path d="M18.5 10 Q24 5.6 29.5 10 Z" fill={F.brod} />
    <rect x="18" y="10" width="12" height="1.1" rx="0.5" fill={F.gronn} />
    <rect x="18.3" y="11.1" width="11.4" height="1.7" rx="0.8" fill={F.treMork} />
    <rect x="18.5" y="12.8" width="11" height="1.4" rx="0.7" fill={F.brod} />
    {/* Luka med markise, og kokken inne. */}
    <polygon points="8,18.5 32,18.5 34,24 6,24" fill={F.oransje} />
    <rect x="6" y="24" width="28" height="1.4" fill={F.rodMork} />
    <rect x="10" y="26.5" width="20" height="8.5" fill={F.glass} />
    <rect x="17.8" y="30.6" width="4.4" height="4.4" rx="1.4" fill={F.hvit} />
    <circle cx="20" cy="29.4" r="1.6" fill={F.hud} />
    <rect x="18.4" y="26.8" width="3.2" height="1.6" rx="0.6" fill={F.hvit} />
    <rect x="8.5" y="35" width="23" height="2.2" fill={F.metallLys} />
    <rect x="25" y="33.2" width="3" height="1.8" rx="0.5" fill={F.rod} />
    <rect x="12" y="33.4" width="2.4" height="1.6" rx="0.4" fill={F.gul} />
    <rect x="32" y="27" width="4" height="16" fill={F.skifer} />
    <circle cx="33" cy="35.5" r="0.7" fill={F.gul} />
    {t >= 1 && (
      <>
        {/* Pipa ryker: grillen står aldri stille. */}
        <rect x="36" y="10" width="3" height="6" fill={F.stein} />
        <circle className="anim-roeyk" cx="37.6" cy="8" r="1.4" fill={F.lysgraa} opacity="0.85" />
        <circle className="anim-roeyk sen" cx="39.4" cy="5.4" r="1.8" fill={F.lysgraa} opacity="0.6" />
      </>
    )}
    {/* Pommes frites fra den nye gryta, dressingflaska og drive-in-luka på siden. */}
    {f >= 1 && (
      <>
        {[15.1, 15.9, 16.7].map((x) => (
          <rect key={x} x={x} y="31.3" width="0.5" height="1.8" rx="0.2" fill={F.gul} />
        ))}
        <polygon points="14.6,32.8 17.6,32.8 17.2,35 15,35" fill={F.rod} />
      </>
    )}
    {f >= 2 && (
      <>
        <rect x="22.8" y="31.6" width="1.7" height="3.4" rx="0.6" fill={F.oransje} />
        <rect x="23.2" y="30.8" width="0.9" height="0.9" fill={F.hvit} />
      </>
    )}
    {f >= 3 && (
      <>
        <rect x="36.6" y="28.6" width="2.8" height="4" rx="0.4" fill={F.glass} />
        <polygon points="36.4,27.6 39.6,27.6 38,26" fill={F.gul} />
      </>
    )}
  </Bedrift>
)

const kiosk: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="kiosk">
    <rect x="7" y="16" width="34" height="27" fill={F.krem} />
    <rect x="37" y="16" width="4" height="27" fill={F.kremMork} />
    <rect x="4" y="12" width="40" height="5" fill={F.blaaMork} />
    <polygon points="5,17 43,17 45,23 3,23" fill={F.blaa} />
    <polygon points="11.3,17 17.6,17 18,23 10.7,23" fill={F.hvit} />
    <polygon points="23.9,17 30.2,17 31.2,23 23.8,23" fill={F.hvit} />
    <polygon points="36.5,17 42.8,17 44.3,23 37.2,23" fill={F.hvit} />
    <rect x="10" y="26" width="16" height="12" fill={F.glass} />
    <rect x="12" y="32" width="3" height="5" fill={F.rod} />
    <rect x="16" y="30" width="3" height="7" fill={F.oransje} />
    <rect x="20" y="33" width="4" height="4" fill={F.tyrkis} />
    <rect x="30" y="26" width="7" height="17" fill={F.treMork} />
    <circle cx="35.4" cy="35" r="0.9" fill={F.gul} />
    <rect x="16" y="5" width="16" height="7" rx="1.5" fill={F.rod} />
    {/* «24» tegnet som streker, ikke <text>: tekst i SVG havner i sidens tekst og skjermlesere. */}
    <path
      d="M20.2 7.4 Q20.2 6.3 21.5 6.3 Q22.8 6.3 22.8 7.4 Q22.8 8.2 21.8 8.9 L20.2 10.5 H22.9 M26.9 10.6 V6.3 L24.8 9.3 H28"
      fill="none"
      stroke={F.hvit}
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {t >= 1 && (
      <>
        <polygon points="3.5,43 6.5,34.5 9.5,43" fill={F.hvit} />
        <polygon points="5.8,38.6 6.5,41.4 7.2,38.6" fill={F.tre} />
        <circle cx="6.5" cy="38" r="1.1" fill={F.rosa} />
      </>
    )}
    {/* Kaffe i vinduet, pakker til henting og en måne for døgnåpent. */}
    {f >= 1 && (
      <>
        <rect x="11" y="27.4" width="2.4" height="2.2" rx="0.4" fill={F.hvit} />
        <path d="M11.6 26.8 Q12.2 25.8 11.8 25" fill="none" stroke={F.hvit} strokeWidth="0.5" strokeLinecap="round" />
      </>
    )}
    {f >= 2 && (
      <>
        <rect x="20.4" y="27" width="4.4" height="2.6" fill={F.tre} />
        <line x1="22.6" y1="27" x2="22.6" y2="29.6" stroke={F.treLys} strokeWidth="0.6" />
      </>
    )}
    {f >= 3 && <path d="M37 4.8 A2.7 2.7 0 1 0 39.8 9 A2.1 2.1 0 1 1 37 4.8 Z" fill={F.lys} />}
  </Bedrift>
)

const kafe: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="kafe">
    <rect x="7" y="16" width="34" height="27" fill={F.krem} />
    <rect x="37" y="16" width="4" height="27" fill={F.kremMork} />
    <rect x="6" y="14" width="36" height="3" fill={F.treMork} />
    <rect x="14" y="4" width="20" height="9" rx="2" fill={F.treDyp} />
    <path d="M20 7 H27 V9.6 A2.6 2.6 0 0 1 24.4 12 H22.6 A2.6 2.6 0 0 1 20 9.6 Z" fill={F.hvit} />
    <circle cx="28" cy="9" r="1.3" fill="none" stroke={F.hvit} strokeWidth="0.9" />
    <polygon points="5,20 43,20 45,26 3,26" fill={F.gronnMork} />
    <polygon points="11.3,20 17.6,20 18,26 10.7,26" fill={F.krem} />
    <polygon points="23.9,20 30.2,20 31.2,26 23.8,26" fill={F.krem} />
    <polygon points="36.5,20 42.8,20 44.3,26 37.2,26" fill={F.krem} />
    <rect x="10" y="29" width="16" height="11" fill={F.lys} />
    <rect x="17.6" y="29" width="0.8" height="11" fill={F.treMork} />
    <rect x="29" y="29" width="7" height="14" fill={F.treMork} />
    <rect x="30.5" y="31" width="4" height="5" fill={F.lys} />
    {t >= 1 && (
      <>
        <rect x="10" y="40" width="16" height="2.4" rx="0.8" fill={F.treLys} />
        {[12, 15.5, 19, 22.5].map((x, i) => (
          <circle key={x} cx={x} cy="39.6" r="1.2" fill={i % 2 ? F.rosa : F.rod} />
        ))}
      </>
    )}
    {/* Espressomaskin og boller i vinduet, og en parasoll på takterrassen. */}
    {f >= 1 && (
      <>
        <rect x="11" y="31.4" width="4.4" height="4.6" rx="0.4" fill={F.metall} />
        <rect x="11" y="30.8" width="4.4" height="0.8" fill={F.metallMork} />
        <rect x="12.4" y="36.2" width="1.6" height="1.2" rx="0.3" fill={F.hvit} />
      </>
    )}
    {f >= 2 && (
      <>
        {[20.2, 22.6, 24.8].map((x) => (
          <circle key={x} cx={x} cy="37.6" r="1.1" fill={F.brod} />
        ))}
      </>
    )}
    {f >= 3 && (
      <>
        <line x1="35.5" y1="11.5" x2="42" y2="11.5" stroke={F.metallMork} strokeWidth="0.6" />
        <line x1="39" y1="7.6" x2="39" y2="14" stroke={F.metallMork} strokeWidth="0.6" />
        <polygon points="35.6,8 42.4,8 39,5.6" fill={F.rod} />
      </>
    )}
    {/* Dampen fra koppen på skiltet. */}
    <path className="anim-damp" d="M23 3.6 Q22 2.4 23 1.2" fill="none" stroke={F.hvit} strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
    <path className="anim-damp sen" d="M25 3.6 Q24 2.4 25 1.2" fill="none" stroke={F.hvit} strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
  </Bedrift>
)

const restaurant: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="restaurant">
    <rect x="6" y="12" width="36" height="31" fill={F.vin} />
    <rect x="38" y="12" width="4" height="31" fill={F.vinMork} />
    <rect x="5" y="10" width="38" height="3" fill={F.mork} />
    <rect x="15" y="2.5" width="18" height="7" rx="1.5" fill={F.mork} />
    <circle cx="24" cy="6" r="2.6" fill={F.hvit} />
    <circle cx="24" cy="6" r="1.5" fill="none" stroke={F.lysgraa} strokeWidth="0.7" />
    <rect x="19.4" y="4" width="0.7" height="4" fill={F.metallLys} />
    <rect x="28" y="4" width="0.8" height="4" fill={F.metallLys} />
    <path d="M10 36 V24 A4 4 0 0 1 18 24 V36 Z" fill={F.lys} />
    <path d="M30 36 V24 A4 4 0 0 1 38 24 V36 Z" fill={F.lys} />
    <rect x="13.6" y="21" width="0.8" height="15" fill={F.vinMork} />
    <rect x="33.6" y="21" width="0.8" height="15" fill={F.vinMork} />
    <path d="M20.5 43 V29 A3.5 3.5 0 0 1 27.5 29 V43 Z" fill={F.treDyp} />
    <circle cx="26" cy="36" r="0.6" fill={F.gull} />
    {t >= 1 && (
      <>
        {[18.4, 28.4].map((x) => (
          <g key={x}>
            <circle cx={x + 0.6} cy="31" r="1.9" fill={F.lys} opacity="0.45" />
            <rect x={x} y="30" width="1.2" height="2.2" rx="0.4" fill={F.gull} />
          </g>
        ))}
      </>
    )}
    {/* Kokken i vinduet, vinflasker og en plakett med stjerne ved døra. */}
    {f >= 1 && (
      <>
        <circle cx="16" cy="29" r="1.4" fill={F.hud} />
        <rect x="14.8" y="26.3" width="2.4" height="1.6" fill={F.hvit} />
        <circle cx="16" cy="26" r="1.3" fill={F.hvit} />
      </>
    )}
    {f >= 2 && (
      <>
        {[31.2, 35.2, 36.6].map((x) => (
          <g key={x}>
            <rect x={x} y="31" width="1" height="3.6" rx="0.3" fill={F.vinMork} />
            <rect x={x + 0.3} y="30" width="0.4" height="1.2" fill={F.vinMork} />
          </g>
        ))}
      </>
    )}
    {f >= 3 && (
      <>
        <rect x="31.5" y="37.5" width="5" height="4" rx="0.8" fill={F.mork} stroke={F.gull} strokeWidth="0.5" />
        <polygon points="34,38.3 34.5,39.4 35.6,39.5 34.8,40.2 35,41.2 34,40.7 33,41.2 33.2,40.2 32.4,39.5 33.5,39.4" fill={F.gull} />
      </>
    )}
  </Bedrift>
)

const hotell: B = (t, f) => {
  const vinduer: ReactNode[] = []
  for (let rad = 0; rad < 6; rad++) {
    for (let kol = 0; kol < 3; kol++) {
      const tent = (rad * 3 + kol) % 4 !== 1
      // Spaet ligger i nederste etasje: turkis vinduer.
      const farge = f >= 1 && rad === 5 ? F.tyrkis : tent ? F.lys : F.glassMork
      vinduer.push(<rect key={`${rad}-${kol}`} x={15.5 + kol * 6} y={9 + rad * 4.4} width="4" height="2.8" fill={farge} />)
    }
  }
  return (
    <Bedrift trinn={t} grunn="gate" id="hotell">
      <rect x="13" y="6" width="22" height="37" fill="#c9a26b" />
      <rect x="31.5" y="6" width="3.5" height="37" fill="#b38d58" />
      <rect x="11" y="3.5" width="26" height="3.5" fill={F.treMork} />
      {vinduer}
      <rect x="6" y="12" width="5" height="14" rx="1" fill={F.rodMork} />
      <path d="M7.3 17 V21.4 M9.7 17 V21.4 M7.3 19.2 H9.7" fill="none" stroke={F.hvit} strokeWidth="1.1" strokeLinecap="round" />
      <rect x="11" y="18.4" width="2" height="1" fill={F.metallMork} />
      <rect x="16" y="36" width="16" height="2.6" rx="0.8" fill={F.rodMork} />
      <rect x="20" y="38.4" width="8" height="4.6" fill={F.treDyp} />
      {t >= 1 && (
        <>
          {[14.5, 33.5].map((x) => (
            <g key={x}>
              <rect x={x - 1.3} y="40" width="2.6" height="3" rx="0.6" fill={F.treMork} />
              <circle cx={x} cy="38.2" r="2.2" fill={F.gronn} />
            </g>
          ))}
        </>
      )}
      {/* Konferansefløy og takbar. Spaet er vinduene nederst. */}
      {f >= 2 && (
        <>
          <rect x="35" y="30" width="7" height="13" fill={F.krem} />
          <rect x="35" y="33.5" width="7" height="3" fill={F.glassMork} />
          <rect x="34.6" y="29" width="7.8" height="1.2" fill={F.treMork} />
        </>
      )}
      {f >= 3 && (
        <>
          <rect x="16" y="1.4" width="20" height="2.1" fill={F.glass} opacity="0.7" />
          {[18, 23, 28, 33].map((x) => (
            <circle key={x} cx={x} cy="1.2" r="0.5" fill={F.lys} />
          ))}
        </>
      )}
      {/* Flagget på taket. */}
      <line x1="12" y1="3.5" x2="12" y2="0.4" stroke={F.metallMork} strokeWidth="0.5" />
      <polygon className="anim-flagg" points="12,0.4 15.2,1.2 12,2.1" fill={F.rod} />
    </Bedrift>
  )
}

const bank: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="bank">
    <polygon points="4,16.5 24,5 44,16.5" fill={F.lysgraa} />
    <polygon points="11,15.1 24,8.3 37,15.1" fill={F.krem} />
    <circle cx="24" cy="12.5" r="2.6" fill={F.gull} />
    <rect x="6" y="16.5" width="36" height="3" fill={F.krem} />
    {[9, 17, 27, 35].map((x) => (
      <g key={x}>
        <rect x={x} y="19.5" width="4" height="17" fill={F.hvit} />
        <rect x={x + 3} y="19.5" width="1" height="17" fill={F.lysgraa} />
      </g>
    ))}
    <rect x="6" y="36.5" width="36" height="3" fill={F.lysgraa} />
    <rect x="4" y="39.5" width="40" height="3.5" fill={F.graa} />
    {t >= 1 && (
      <>
        <rect x="19" y="40.4" width="4.8" height="2.6" rx="0.4" fill={F.gull} />
        <rect x="24.2" y="40.4" width="4.8" height="2.6" rx="0.4" fill={F.gull} />
        <rect x="21.6" y="37.9" width="4.8" height="2.6" rx="0.4" fill={F.gullLys} />
      </>
    )}
    {/* Nettbank-skjerm, myntstabel og en stigende kurs i gavlen. */}
    {f >= 1 && (
      <>
        <rect x="21.8" y="23" width="4.4" height="6.4" rx="0.5" fill={F.marine} />
        <rect x="22.4" y="23.6" width="3.2" height="2.4" fill={F.glass} />
      </>
    )}
    {f >= 2 && (
      <>
        {[35.6, 34.4, 33.2].map((cy) => (
          <ellipse key={cy} cx="15" cy={cy} rx="1.8" ry="0.7" fill={F.gull} stroke={F.gullMork} strokeWidth="0.3" />
        ))}
      </>
    )}
    {f >= 3 && (
      <>
        <polyline points="28,14 30,12.4 31.6,13.2 34,10.8" fill="none" stroke={F.gronn} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="34.6,10.2 34.4,12 32.8,10.4" fill={F.gronn} />
      </>
    )}
  </Bedrift>
)

const oljeselskap: B = (t, f) => (
  <Bedrift trinn={t} grunn="sjo" sjo id="oljeselskap">
    <rect x="11" y="27" width="3" height="14" fill={F.metallMork} />
    <rect x="34" y="27" width="3" height="14" fill={F.metallMork} />
    <line x1="14" y1="30" x2="34" y2="38" stroke={F.metallMork} strokeWidth="1.2" />
    <line x1="34" y1="30" x2="14" y2="38" stroke={F.metallMork} strokeWidth="1.2" />
    <rect x="7" y="23.5" width="34" height="4" fill="#f59e0b" />
    <rect x="7" y="26.2" width="34" height="1.3" fill="#c77c06" />
    <polygon points="15,23.5 20.5,6 23.5,6 29,23.5" fill="none" stroke={F.metall} strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="17.2" y1="17" x2="26.8" y2="17" stroke={F.metall} strokeWidth="1" />
    <line x1="19" y1="11" x2="25" y2="11" stroke={F.metall} strokeWidth="1" />
    <rect x="36" y="11" width="2" height="12.5" fill={F.metallMork} />
    <g className="anim-flamme">
      <polygon points="37,2.5 40.5,8.5 37,11 33.5,8.5" fill="#f97316" />
      <polygon points="37,5.5 38.8,8.6 37,10 35.2,8.6" fill={F.lys} />
    </g>
    {t >= 1 && (
      <>
        <rect x="8" y="18" width="6" height="5.5" fill={F.hvit} />
        <rect x="9" y="19.4" width="4" height="1.4" fill={F.glassMork} />
      </>
    )}
    {/* Et nytt boretårn, en undervannsrobot og en ny plattform ute på feltet. */}
    {f >= 1 && <polygon points="30,23.5 31.5,15 32.5,15 34,23.5" fill="none" stroke={F.metall} strokeWidth="1" strokeLinejoin="round" />}
    {f >= 2 && (
      <>
        <rect x="18" y="41" width="4" height="2" rx="0.6" fill={F.gul} />
        <circle cx="22.5" cy="42" r="0.5" fill={F.lys} />
      </>
    )}
    {f >= 3 && (
      <>
        <rect x="1.5" y="29" width="5" height="1.6" fill={F.metall} />
        <line x1="2.5" y1="30.6" x2="2.5" y2="38.5" stroke={F.metallMork} strokeWidth="0.7" />
        <line x1="5.5" y1="30.6" x2="5.5" y2="38.5" stroke={F.metallMork} strokeWidth="0.7" />
      </>
    )}
  </Bedrift>
)

const rederi: B = (t, f) => {
  const kontainere: [number, number, string][] = [
    [12, 26, F.rod], [18, 26, F.tyrkis], [24, 26, F.oransje], [30, 26, F.blaa],
    [15, 21, F.aker], [21, 21, F.rodMork], [27, 21, F.tyrkis],
  ]
  if (t >= 1) kontainere.push([18, 16, F.blaa], [24, 16, F.oransje])
  return (
    <Bedrift trinn={t} grunn="sjo" sjo id="rederi">
      <g className="anim-duve">
      <polygon points="4,31 44,31 40,40 8,40" fill={F.mork} />
      <rect x="4" y="31" width="40" height="2" fill={F.rodMork} />
      {kontainere.map(([x, y, farge]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="5.4" height="5" fill={farge} />
          <rect x={x + 4.4} y={y} width="1" height="5" fill="#000000" opacity="0.18" />
        </g>
      ))}
      <rect x="36" y="19" width="6" height="12" fill={F.hvit} />
      <rect x="40.4" y="19" width="1.6" height="12" fill={F.lysgraa} />
      <rect x="37" y="21" width="4" height="1.6" fill={F.marine} />
      <rect x="38.5" y="15" width="1.6" height="4" fill={F.skifer} />
      {/* LNG-stripe, egen kran i havna og et vindseil. */}
      {f >= 1 && <rect x="8" y="35.4" width="32" height="1" fill={F.tyrkis} />}
      {f >= 3 && <polygon points="31.6,26 32.3,9 34.5,9 34.1,26" fill={F.hvit} stroke={F.lysgraa} strokeWidth="0.4" />}
      </g>
      {f >= 2 && (
        <>
          <rect x="3.6" y="12" width="1.6" height="26" fill={F.gul} />
          <line x1="4.4" y1="13" x2="15" y2="13" stroke={F.gul} strokeWidth="1.2" />
          <line x1="13" y1="13" x2="13" y2="18" stroke={F.metallMork} strokeWidth="0.5" />
        </>
      )}
    </Bedrift>
  )
}

const fiskeoppdrett: B = (t, f) => (
  <Bedrift trinn={t} grunn="fjord" sjo id="fiskeoppdrett">
    {[[13, 33], [33, 35], [22, 40.5]].map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <ellipse cx={x} cy={y} rx="7.5" ry="2.9" fill="none" stroke={F.gul} strokeWidth="1.5" />
        <ellipse cx={x} cy={y} rx="5.4" ry="1.8" fill={F.sjoMork} />
      </g>
    ))}
    <rect x="29" y="24.5" width="14" height="3.4" rx="0.8" fill={F.metallMork} />
    <rect x="31" y="18" width="10" height="6.5" fill={F.hvit} />
    <rect x="38.6" y="18" width="2.4" height="6.5" fill={F.lysgraa} />
    <polygon points="30,18.4 36,14.5 42,18.4" fill={F.rod} />
    <rect x="32.4" y="20" width="3" height="2.2" fill={F.glassMork} />
    <g className="anim-hopp">
      <path d="M9 24 Q13 18 17 22" fill="none" stroke={F.oransje} strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="17,22 19.4,20.6 19,24" fill={F.oransje} />
    </g>
    {t >= 1 && (
      <>
        <polygon points="18,31 27,31 26,33.4 19,33.4" fill={F.hvit} />
        <rect x="20" y="28.8" width="3" height="2.2" fill={F.blaaMork} />
      </>
    )}
    {/* Lukket merd, havmerd på dypt vann og et eksportfly. */}
    {f >= 1 && <path d="M5.5 33 A7.5 4.2 0 0 1 20.5 33 Z" fill={F.metallLys} opacity="0.9" />}
    {f >= 2 && (
      <>
        <ellipse cx="5.5" cy="28.6" rx="3.2" ry="1.2" fill="none" stroke={F.metall} strokeWidth="1.1" />
        <rect x="5" y="25" width="1" height="3.6" fill={F.metallMork} />
      </>
    )}
    {f >= 3 && (
      <g transform="translate(19 4)">
        <rect x="0" y="1.2" width="7" height="1.6" rx="0.8" fill={F.metallLys} />
        <polygon points="5.4,1.2 7,-0.6 7.8,-0.6 7.3,1.2" fill={F.blaa} />
        <polygon points="2.4,2 4.8,2 3.2,3.8 2,3.8" fill={F.metall} />
      </g>
    )}
  </Bedrift>
)

const flyselskap: B = (t, f) => (
  <Bedrift trinn={t} grunn="gate" id="flyselskap">
    {[8, 18, 28].map((x) => (
      <rect key={x} x={x} y="43.6" width="5" height="1" fill={F.hvit} />
    ))}
    <rect x="39" y="30" width="3" height="13" fill={F.metallLys} />
    <rect x="37.5" y="26" width="6" height="4.4" rx="0.8" fill={F.glassMork} />
    <rect x="37" y="25" width="7" height="1.4" fill={F.metallMork} />
    <g transform="rotate(-18 24 22)">
      <rect x="6" y="19" width="34" height="7" rx="3.5" fill={F.hvit} />
      <rect x="6" y="23.4" width="34" height="2.6" rx="1.3" fill={F.krem} />
      <polygon points="36,19 43,11.5 45,11.5 42,19" fill={F.rod} />
      <polygon points="18,24 30,24 20,33 16,33" fill={F.metallLys} />
      <polygon points="20,19 28,19 20,13 17,13" fill={F.metallLys} />
      {[10, 14, 18, 22, 26, 30].map((x) => (
        <circle key={x} cx={x} cy="21.4" r="0.9" fill={F.marine} />
      ))}
      <path d="M6 22.5 Q6 19 9.5 19 L9.5 22.5 Z" fill={F.marine} />
      {f >= 1 && <rect x="21" y="26.4" width="4.4" height="2" rx="1" fill={F.metallMork} />}
    </g>
    {t >= 1 && (
      <g className="anim-glid">
      <g transform="translate(30 4)">
        <rect x="0" y="1.2" width="9" height="2" rx="1" fill={F.metallLys} />
        <polygon points="7,1.2 9,-1 10,-1 9.4,1.2" fill={F.rod} />
        <polygon points="3,2 6,2 4,4.4 2.6,4.4" fill={F.metall} />
      </g>
      </g>
    )}
    {/* Terminal med lounge og en rute mot øst. Motoren sitter på flyet. */}
    {f >= 2 && (
      <>
        <rect x="3" y="37" width="12" height="6" fill={F.glassMork} />
        <rect x="2.5" y="36" width="13" height="1.2" fill={F.metallMork} />
      </>
    )}
    {f >= 3 && <path d="M12 13 Q18 2 28 6" fill="none" stroke={F.gul} strokeWidth="0.8" strokeDasharray="1.6 1.2" />}
  </Bedrift>
)

const skisenter: B = (t, f) => (
  <Bedrift trinn={t} grunn="sno" id="skisenter">
    <polygon points="3,43 18,10 28,24 34,16 45,43" fill={F.sno} />
    <polygon points="18,10 26,43 45,43 34,16 28,24" fill={F.snoSkygge} />
    <polygon points="13.5,20 18,10 22.4,16 19.4,15 17,18.6" fill={F.fjell} />
    <path d="M18 12 Q12 24 21 30 Q28 35 23 42" fill="none" stroke={F.blaa} strokeWidth="1.3" strokeDasharray="2 1.5" />
    <path d="M34 18 Q39 27 34 34 Q31 39 35 42" fill="none" stroke={F.rod} strokeWidth="1.3" strokeDasharray="2 1.5" />
    <line x1="6" y1="41" x2="30" y2="15" stroke={F.skifer} strokeWidth="0.8" />
    {[[11, 34], [17.5, 27], [24, 20]].map(([x, y]) => (
      <g key={x} className="anim-gondol">
        <line x1={x} y1={y} x2={x} y2={y + 2.6} stroke={F.skifer} strokeWidth="0.6" />
        <rect x={x - 2} y={y + 2.6} width="4" height="2.6" rx="0.8" fill={F.rod} />
      </g>
    ))}
    <polygon points="4,43 7,35 10,43" fill={F.gran} />
    {t >= 1 && (
      <>
        <rect x="31" y="36.5" width="10" height="6.5" fill={F.treMork} />
        <polygon points="29.5,37 36,32 42.5,37" fill={F.skifer} />
        <rect x="33" y="38.5" width="2.6" height="2.2" fill={F.lys} />
      </>
    )}
    {/* Ny gondolstasjon, snøkanon og en målportal for OL-arenaen. */}
    {f >= 1 && <rect x="28.4" y="12.6" width="4.4" height="3.2" rx="0.4" fill={F.skifer} />}
    {f >= 2 && (
      <>
        <line x1="38.5" y1="31.5" x2="40" y2="28" stroke={F.metallMork} strokeWidth="1" />
        <rect x="38.8" y="26.6" width="3.4" height="1.8" rx="0.6" fill={F.metall} transform="rotate(-28 40.5 27.5)" />
        <circle cx="43" cy="25.2" r="0.6" fill={F.hvit} />
        <circle cx="44.2" cy="24" r="0.5" fill={F.hvit} />
      </>
    )}
    {f >= 3 && (
      <>
        <rect x="18.5" y="36" width="1" height="7" fill={F.metallMork} />
        <rect x="27.5" y="36" width="1" height="7" fill={F.metallMork} />
        <rect x="18" y="34.6" width="11" height="2.4" rx="0.4" fill={F.rod} />
        <rect x="18" y="35.5" width="11" height="0.5" fill={F.gull} />
      </>
    )}
  </Bedrift>
)

// ─────────────────────────────────────────────── Eiendom

function Hybel({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="12" y="18" width="24" height="25" fill={F.hvit} />
      <rect x="32.5" y="18" width="3.5" height="25" fill={F.krem} />
      {[22, 26, 30, 34, 38].map((y) => (
        <rect key={y} x="12" y={y} width="24" height="0.6" fill={F.kremMork} />
      ))}
      <polygon points="10,19 24,8 38,19" fill={F.skifer} />
      <rect x="16" y="23" width="6" height="6" fill={F.lys} />
      <rect x="18.7" y="23" width="0.6" height="6" fill={F.treMork} />
      <rect x="26" y="23" width="6" height="6" fill={F.glass} />
      <rect x="26" y="33" width="6" height="10" fill={F.blaaMork} />
      <circle cx="30.6" cy="38.4" r="0.5" fill={F.gull} />
    </Svg>
  )
}

function Leilighet({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (let rad = 0; rad < 5; rad++) {
    for (let kol = 0; kol < 3; kol++) vinduer.push(<rect key={`${rad}-${kol}`} x={13.5 + kol * 7.5} y={11 + rad * 5.8} width="5" height="3.8" fill={(rad + kol) % 3 ? F.glass : F.lys} />)
  }
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="10" y="7" width="28" height="36" fill={F.mur} />
      <rect x="34.5" y="7" width="3.5" height="36" fill={F.murMork} />
      <rect x="9" y="5" width="30" height="3" fill={F.murMork} />
      {vinduer}
      <rect x="21" y="37" width="6" height="6" fill={F.treDyp} />
    </Svg>
  )
}

function Rekkehus({ størrelse = 48 }: P) {
  const hus = [
    { x: 4, farge: F.aker, tak: F.treMork },
    { x: 17, farge: F.oransje, tak: F.murMork },
    { x: 30, farge: F.tyrkis, tak: F.tyrkisMork },
  ]
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      {hus.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y="23" width="13.5" height="20" fill={h.farge} />
          <rect x={h.x + 11} y="23" width="2.5" height="20" fill="#000000" opacity="0.12" />
          <polygon points={`${h.x - 0.8},24 ${h.x + 6.75},14 ${h.x + 14.3},24`} fill={h.tak} />
          <rect x={h.x + 2.5} y="27" width="4" height="4" fill={F.hvit} />
          <rect x={h.x + 7.5} y="34" width="4" height="9" fill={F.treDyp} />
        </g>
      ))}
    </Svg>
  )
}

function Hytte({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="3,34 14,12 22,24 30,14 45,34" fill={F.fjell} />
      <polygon points="11,18 14,12 17,17.8 15,17 13,18.6" fill={F.sno} />
      <polygon points="27.5,17.6 30,14 32.6,17.4 30.8,16.8 29,18" fill={F.sno} />
      <Grunn type="sno" />
      <rect x="11" y="28" width="26" height="15" fill={F.treMork} />
      <rect x="33.5" y="28" width="3.5" height="15" fill={F.treDyp} />
      {[31, 34, 37, 40].map((y) => (
        <rect key={y} x="11" y={y} width="26" height="0.7" fill={F.treDyp} />
      ))}
      <polygon points="8,29 24,18 40,29" fill={F.mork} />
      <polygon points="8,29 24,18 40,29 38,29 24,20.3 10,29" fill={F.sno} />
      <rect x="31" y="18" width="3" height="6" fill={F.treDyp} />
      <rect x="14" y="32" width="6" height="5" fill={F.lys} />
      <rect x="25" y="34" width="6" height="9" fill={F.treDyp} />
    </Svg>
  )
}

function Kontorbygg({ størrelse = 48 }: P) {
  const linjer: ReactNode[] = []
  for (let y = 8; y < 43; y += 4) linjer.push(<rect key={y} x="14" y={y} width="20" height="0.8" fill={F.glass} />)
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="5" y="20" width="10" height="23" fill={F.blaaMork} />
      {[23, 28, 33, 38].map((y) => (
        <rect key={y} x="7" y={y} width="6" height="0.8" fill={F.glassMork} />
      ))}
      <polygon points="13,43 13,6 35,3 35,43" fill={F.glassMork} />
      {linjer}
      <rect x="23.5" y="4" width="0.8" height="39" fill={F.glass} />
      <polygon points="17,43 30,4 34,3.5 21,43" fill={F.hvit} opacity="0.25" />
      <rect x="31.5" y="3.4" width="3.5" height="39.6" fill={F.blaaMork} opacity="0.35" />
    </Svg>
  )
}

function Kjopesenter({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="4" y="19" width="40" height="24" fill={F.metallLys} />
      <rect x="40" y="19" width="4" height="24" fill={F.graa} />
      <rect x="3" y="16" width="42" height="4" fill={F.metallMork} />
      <rect x="8" y="28" width="30" height="15" fill={F.glass} />
      <rect x="22.6" y="28" width="1" height="15" fill={F.metallMork} />
      <rect x="15" y="28" width="1" height="15" fill={F.hvit} opacity="0.6" />
      <rect x="30.5" y="28" width="1" height="15" fill={F.hvit} opacity="0.6" />
      <rect x="13" y="21.5" width="22" height="5" rx="1" fill="#db2777" />
      <rect x="21.5" y="22.6" width="5" height="3.4" rx="0.5" fill={F.hvit} />
      <path d="M22.6 22.8 V22 A1.4 1.4 0 0 1 25.4 22 V22.8" fill="none" stroke={F.hvit} strokeWidth="0.7" />
    </Svg>
  )
}

function Naeringsbygg({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="5" y="14" width="16" height="24" fill={F.graa} />
      {[17, 22, 27, 32].map((y) => (
        <rect key={y} x="6.5" y={y} width="13" height="2.2" fill={F.skifer} />
      ))}
      <polygon points="21,38 21,8 43,4 43,38" fill={F.krem} />
      <rect x="39.5" y="4.6" width="3.5" height="33.4" fill={F.kremMork} />
      {[11, 16, 21, 26, 31].map((y) => (
        <polygon key={y} points={`23,${y + 2.5} 23,${y} 39,${y - 2} 39,${y + 0.5}`} fill={F.mork} />
      ))}
      <rect x="3" y="37" width="42" height="1.6" fill={F.stein} />
    </Svg>
  )
}

function Oy({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="fjord" />
      <polygon points="6,33 14,12 20,21 26,7 35,24 42,33" fill={F.skifer} />
      <polygon points="11.8,17.8 14,12 16.4,16 14.6,15.4 13,17.6" fill={F.sno} />
      <polygon points="23.6,12.6 26,7 28.9,12.4 27,11.4 25,13.4" fill={F.sno} />
      <polygon points="4,35 9,29 20,31.6 32,28.6 42,30 44,35" fill={F.gronn} />
      <rect x="30" y="26" width="8" height="5" fill={F.rod} />
      <polygon points="29,26.5 34,22.5 39,26.5" fill={F.rodMork} />
      <rect x="33" y="28" width="2" height="3" fill={F.hvit} />
      <rect x="33" y="31.8" width="1" height="4" fill={F.treMork} />
      <rect x="31" y="35.4" width="6" height="0.9" fill={F.treMork} />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Jord og skog

/** Gård: rød låve og silo ved åkeren. */
function Gard({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="aker" />
      <rect x="8" y="23" width="20" height="14" fill={F.rod} />
      <rect x="25" y="23" width="3" height="14" fill={F.rodMork} />
      <polygon points="6,24 18,13 30,24" fill={F.vinMork} />
      <rect x="14" y="28" width="8" height="9" fill={F.hvit} />
      <line x1="14" y1="28" x2="22" y2="37" stroke={F.rod} strokeWidth="1" />
      <line x1="22" y1="28" x2="14" y2="37" stroke={F.rod} strokeWidth="1" />
      <rect x="33" y="17" width="7" height="20" rx="3.5" fill={F.metall} />
      <rect x="37.6" y="18" width="2.4" height="19" fill={F.metallMork} opacity="0.5" />
      <rect x="33" y="17" width="7" height="3" rx="1.5" fill={F.metallMork} />
    </Svg>
  )
}

/** Skog: tette grantrær på en ås. */
function Skog({ størrelse = 48 }: P) {
  const trær: [number, number, number][] = [
    [9, 17, 1], [20, 12, 1.15], [32, 13, 1.1], [40, 17, 0.9], [14, 22, 1], [27, 21, 1.1], [37, 24, 0.95],
  ]
  return (
    <Svg størrelse={størrelse}>
      <path d="M3 43 V34 L14 29 L30 32 L45 26 V43 Q45 45.2 43 45.2 H5 Q3 45.2 3 43 Z" fill={F.gronnMork} />
      {trær.map(([x, y, k]) => (
        <g key={`${x}-${y}`}>
          <rect x={x - 0.8} y={y + 14 * k} width="1.6" height={3.5 * k} fill={F.treDyp} />
          <polygon points={`${x},${y} ${x + 6 * k},${y + 8 * k} ${x - 6 * k},${y + 8 * k}`} fill={F.granMork} />
          <polygon points={`${x},${y + 4 * k} ${x + 7 * k},${y + 14 * k} ${x - 7 * k},${y + 14 * k}`} fill={F.gran} />
        </g>
      ))}
    </Svg>
  )
}

// ─────────────────────────────────────────────── Landemerker

/** Fyr: rødt og hvitt tårn på et skjær, med lysstråle. */
function Fyret({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="26,9 45,4 45,15" fill={F.lys} opacity="0.5" />
      <Grunn type="sjo" />
      <polygon points="10,40 16,33 32,33 38,40" fill={F.skifer} />
      <polygon points="19,34 21,12 27,12 29,34" fill={F.hvit} />
      <polygon points="25,12 27,12 29,34 26.4,34" fill={F.lysgraa} />
      <polygon points="19.6,28 20.2,22 27.8,22 28.4,28" fill={F.rod} />
      <polygon points="20.8,17 21.2,13 26.8,13 27.2,17" fill={F.rod} />
      <rect x="20" y="7" width="8" height="5" fill={F.lys} />
      <polygon points="19,7 24,3 29,7" fill={F.rod} />
      <rect x="19" y="11.5" width="10" height="1.4" fill={F.mork} />
    </Svg>
  )
}

/** Hoppbakke: tilløp fra tårnet, unnarenn ned mot sletta, og en hopper i lufta. */
function Hoppbakken({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sno" />
      <path d="M3 43 V28 Q8 25 14 24.4 Q24 28 31 35.5 Q37 40.6 45 41 V43 Z" fill={F.sno} />
      <path d="M14 24.4 Q24 28 31 35.5 Q37 40.6 45 41 V43 H30 Q25 36 20 31 Q17 27.6 14 24.4 Z" fill={F.snoSkygge} />
      {[9, 14.5].map((x) => (
        <rect key={x} x={x - 0.7} y={x === 9 ? 11 : 17.5} width="1.4" height={x === 9 ? 15.5 : 7.4} fill={F.metallMork} />
      ))}
      <polygon points="4.6,6.2 8,5.4 20.6,22.2 17.6,23.4" fill={F.metallLys} />
      <polygon points="17.6,23.4 20.6,22.2 21.6,23.2 18.2,24.4" fill={F.metallMork} />
      <rect x="3.2" y="2.6" width="6.4" height="4.2" rx="0.8" fill={F.rod} />
      <rect x="4.6" y="3.8" width="3.6" height="1.6" fill={F.lys} />
      <g transform="rotate(-24 32 16)">
        <rect x="28.5" y="14.8" width="8" height="2.4" rx="1.2" fill={F.rod} />
        <circle cx="37.6" cy="15.4" r="1.5" fill={F.mork} />
        <line x1="25.5" y1="18.8" x2="40" y2="16.6" stroke={F.mork} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="25.5" y1="20.4" x2="40" y2="18.2" stroke={F.mork} strokeWidth="0.9" strokeLinecap="round" />
      </g>
    </Svg>
  )
}

/** Borg: middelalderborg i stein med tårn og flagg. */
function Borgen({ størrelse = 48 }: P) {
  const tinder = (x: number, y: number, b: number) =>
    Array.from({ length: Math.floor(b / 3) }, (_, i) => <rect key={`${x}-${i}`} x={x + i * 3} y={y - 2} width="1.8" height="2" fill={F.stein} />)
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gress" />
      <rect x="10" y="22" width="28" height="20" fill={F.graa} />
      {tinder(10, 22, 28)}
      <rect x="4" y="14" width="9" height="28" fill={F.stein} />
      {tinder(4, 14, 9)}
      <rect x="35" y="14" width="9" height="28" fill={F.stein} />
      <rect x="41" y="14" width="3" height="28" fill={F.skifer} opacity="0.5" />
      {tinder(35, 14, 9)}
      <path d="M20 42 V33 A4 4 0 0 1 28 33 V42 Z" fill={F.skifer} />
      <rect x="7" y="20" width="2.4" height="4" fill={F.mork} />
      <rect x="38.6" y="20" width="2.4" height="4" fill={F.mork} />
      <rect x="23.4" y="4" width="1.2" height="16" fill={F.skifer} />
      <polygon points="24.6,4 32,6.5 24.6,9" fill={F.rod} />
      <rect x="16" y="26" width="2.4" height="3.6" fill={F.mork} />
      <rect x="29.6" y="26" width="2.4" height="3.6" fill={F.mork} />
    </Svg>
  )
}

/** Oslotårnet: vridd glasstårn ved sjøen. */
function Tarnet({ størrelse = 48 }: P) {
  const etasjer: ReactNode[] = []
  for (let i = 0; i < 11; i++) {
    const y = 5 + i * 3
    const skift = Math.sin(i / 2) * 2
    etasjer.push(<rect key={i} x={17 + skift} y={y} width="14" height="2.4" fill={i % 2 ? F.glass : F.glassMork} />)
  }
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="5" y="26" width="9" height="12" fill={F.fjell} />
      <rect x="35" y="22" width="8" height="16" fill={F.fjell} />
      <rect x="40.5" y="22" width="2.5" height="16" fill={F.metallMork} opacity="0.5" />
      {etasjer}
      <rect x="23.4" y="1" width="1.2" height="4" fill={F.metall} />
      <rect x="16" y="37" width="16" height="1.6" fill={F.skifer} />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Eiendom utenlands

/** Stockholm: okergul bygård med kobbergrønt tak og tårn. */
function Stockholm({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (const y of [20, 27, 34]) for (const x of [9, 16, 23, 30, 36.5]) vinduer.push(<rect key={`${x}-${y}`} x={x} y={y} width="3.5" height="4.5" fill={F.gullLys} />)
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <polygon points="31,11 35,4 39,11" fill="#4d9e8a" />
      <rect x="31" y="11" width="8" height="5" fill="#e0b050" />
      <rect x="5" y="16" width="38" height="27" fill="#e0b050" />
      <rect x="40" y="16" width="3" height="27" fill="#c8983b" />
      <polygon points="3,17 8,10 40,10 45,17" fill="#4d9e8a" />
      <rect x="5" y="16" width="38" height="1.4" fill="#b8862b" />
      {vinduer}
      <path d="M21 43 V38 A3 3 0 0 1 27 38 V43 Z" fill={F.treMork} />
    </Svg>
  )
}

/** København: fargerike, smale hus ved kanalen i Nyhavn. */
function Kobenhavn({ størrelse = 48 }: P) {
  const hus: [number, number, string][] = [
    [4, 16, F.rod],
    [13, 12, F.gul],
    [21, 18, F.blaa],
    [30, 14, F.rosa],
    [38, 17, F.gronn],
  ]
  return (
    <Svg størrelse={størrelse}>
      {hus.map(([x, y, farge], i) => {
        const b = i === 1 || i === 3 ? 8 : i === 4 ? 7 : 9
        return (
          <g key={x}>
            <rect x={x} y={y} width={b} height={38 - y} fill={farge} />
            <polygon points={`${x},${y} ${x + b / 2},${y - 4} ${x + b},${y}`} fill={farge} />
            <rect x={x + 2} y={y + 3} width="2" height="3" fill={F.hvit} />
            <rect x={x + b - 4} y={y + 3} width="2" height="3" fill={F.hvit} />
            <rect x={x + 2} y={y + 10} width="2" height="3" fill={F.hvit} />
            <rect x={x + b - 4} y={y + 10} width="2" height="3" fill={F.hvit} />
          </g>
        )
      })}
      <Grunn type="sjo" />
      <rect x="18" y="33" width="1.2" height="8" fill={F.treMork} />
      <polygon points="19.2,34 26,39 19.2,39" fill={F.hvit} />
      <polygon points="14,40 28,40 26.5,42.2 15.5,42.2" fill={F.treMork} />
    </Svg>
  )
}

/** Berlin: bygård i Mitte med TV-tårnet bak. */
function Berlin({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="35.4" y="3" width="1.2" height="10" fill={F.metall} />
      <circle cx="36" cy="14.5" r="3.4" fill={F.metallLys} />
      <rect x="35" y="17" width="2" height="18" fill={F.metallLys} />
      <rect x="4" y="18" width="30" height="25" fill="#d6c7a8" />
      <rect x="3" y="16" width="32" height="3" fill="#8a7a5c" />
      {[22, 29, 36].map((y) =>
        [7, 13, 19, 25].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="3.5" height="4.5" fill={(x + y) % 3 ? F.skifer : F.lys} />),
      )}
      <rect x="30" y="24" width="15" height="19" fill={F.metall} />
      <rect x="42" y="24" width="3" height="19" fill={F.metallMork} />
      {[27, 32, 37].map((y) => (
        <rect key={y} x="32" y={y} width="10" height="2.4" fill={F.skifer} />
      ))}
    </Svg>
  )
}

/** London: hvitt byhus med søyler, svart dør og gjerde. */
function London({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="8" y="8" width="32" height="35" fill={F.hvit} />
      <rect x="36.5" y="8" width="3.5" height="35" fill={F.krem} />
      <rect x="7" y="6" width="34" height="3" fill={F.kremMork} />
      <rect x="10" y="3" width="4" height="4" fill={F.mur} />
      <rect x="34" y="3" width="4" height="4" fill={F.mur} />
      {[12, 20].map((y) =>
        [12, 21.5, 31].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="6" fill={F.mork} />),
      )}
      <rect x="17" y="29" width="14" height="2" fill={F.kremMork} />
      <rect x="18" y="31" width="2" height="12" fill={F.krem} />
      <rect x="28" y="31" width="2" height="12" fill={F.krem} />
      <rect x="21" y="32" width="6" height="11" fill={F.mork} />
      <circle cx="26" cy="38" r="0.7" fill={F.gull} />
      <rect x="4" y="40" width="40" height="0.8" fill={F.mork} />
      {[5, 8, 11, 14, 34, 37, 40, 43].map((x) => (
        <rect key={x} x={x - 0.4} y="38" width="0.8" height="5" fill={F.mork} />
      ))}
    </Svg>
  )
}

/** Dubai: hvit villa med basseng og palme. */
function Dubai({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sand" />
      <rect x="11" y="26" width="30" height="14" fill={F.hvit} />
      <rect x="37.5" y="26" width="3.5" height="14" fill={F.krem} />
      <rect x="19" y="18" width="18" height="8" fill={F.hvit} />
      <rect x="17" y="17" width="22" height="1.6" fill={F.lysgraa} />
      <rect x="9" y="25" width="34" height="1.6" fill={F.lysgraa} />
      <rect x="21" y="20" width="14" height="4" fill={F.glassMork} />
      <rect x="14" y="29" width="10" height="8" fill={F.glassMork} />
      <rect x="27" y="29" width="9" height="11" fill={F.stein} />
      <rect x="15" y="41.2" width="24" height="2.8" rx="1.2" fill="#22b8cf" />
      <rect x="17" y="42" width="8" height="0.8" fill="#a5f3fc" />
      <path d="M7 40 Q6 30 8 22" fill="none" stroke={F.treMork} strokeWidth="1.6" />
      <path d="M8 22 Q3.5 20 3.4 25 M8 22 Q12.5 18 15 22 M8 22 Q5 16 3.4 16.4 M8 22 Q10 15 14 15" fill="none" stroke={F.gronn} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

/** New York: skyskraper med opplyst toppleilighet. */
function NewYork({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (let y = 16; y < 42; y += 3.5) vinduer.push(<rect key={y} x="19" y={y} width="11" height="1.4" fill={F.skifer} />)
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="4" y="24" width="10" height="19" fill={F.metallMork} />
      <rect x="36" y="20" width="8" height="23" fill={F.metallMork} />
      <rect x="23.6" y="1" width="1" height="5" fill={F.metall} />
      <polygon points="20,12 24,5 28,5 32,12" fill={F.fjell} />
      <rect x="17" y="12" width="16" height="31" fill={F.fjell} />
      <rect x="30" y="12" width="3" height="31" fill={F.metallMork} opacity="0.45" />
      <rect x="18" y="10" width="14" height="5" fill={F.lys} />
      <rect x="18" y="10" width="14" height="0.8" fill={F.gull} />
      {vinduer}
      <rect x="6" y="27" width="6" height="1" fill={F.fjell} />
      <rect x="6" y="32" width="6" height="1" fill={F.fjell} />
      <rect x="38" y="24" width="4" height="1" fill={F.fjell} />
      <rect x="38" y="29" width="4" height="1" fill={F.fjell} />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Luksus: biler

function Hjul({ x, r = 4.5, felg = F.metall }: { x: number; r?: number; felg?: string }) {
  return (
    <g>
      <circle cx={x} cy={38.5} r={r} fill={F.mork} />
      <circle cx={x} cy={38.5} r={r * 0.45} fill={felg} />
    </g>
  )
}

/** Bilene står på grunnlinjen: hjulene når ned til y = 43. */
function Bil({ størrelse, children }: { størrelse: number; children: ReactNode }) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="skygge" />
      <g transform="translate(0 2.5)">{children}</g>
    </Svg>
  )
}

function Stasjonsvogn({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <polygon points="9,24 13,15 40,15 42,24" fill="#6b8fb3" />
      <rect x="3" y="23" width="42" height="11" rx="2.5" fill="#6b8fb3" />
      <rect x="3" y="29.5" width="42" height="4.5" rx="2" fill="#56779a" />
      <polygon points="14.5,23 17,17 26,17 26,23" fill={F.glass} />
      <polygon points="28,23 28,17 38.5,17 40,23" fill={F.glass} />
      <rect x="42" y="25" width="3" height="2" rx="0.6" fill={F.lys} />
      <rect x="14" y="13.5" width="24" height="1.6" rx="0.8" fill={F.skifer} />
      <Hjul x={13} />
      <Hjul x={36} />
    </Bil>
  )
}

function Elbil({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <polygon points="3,33 4,27 14,24.5 20,17.5 33,17 41,23.5 45,26 45.5,33" fill={F.metallLys} />
      <polygon points="3.4,30 45.2,30 45.5,33 3,33" fill={F.metall} />
      <polygon points="21,23.5 23.5,19.4 32.5,19.2 38.5,23.5" fill={F.mork} />
      <rect x="28.5" y="19.3" width="1" height="4.2" fill={F.metallLys} />
      <polygon points="24,25 21.5,29.4 23.8,29.4 22.5,32.5 27,27.8 24.6,27.8 26.4,25" fill="#22c55e" />
      <rect x="42" y="26.5" width="3.5" height="1.3" rx="0.6" fill={F.glass} />
      <Hjul x={12.5} felg={F.metallLys} />
      <Hjul x={36.5} felg={F.metallLys} />
    </Bil>
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
    <Bil størrelse={størrelse}>
      <Speilet>
        <polygon points="2,33 3,28.5 16,25.5 24,20 33,19.5 44,26 46,33" fill="#dc2626" />
        <polygon points="2.4,30.5 45.6,30.5 46,33 2,33" fill={F.rodMork} />
        <polygon points="25,24.8 27.5,21.5 32.5,21.3 38.5,25.3" fill={F.mork} />
        <polygon points="30,27 36,27 35,29.5 31,29.5" fill={F.mork} />
        <rect x="2.2" y="28.6" width="3" height="1.2" rx="0.5" fill={F.lys} />
        <Hjul x={12} r={5} felg={F.lysgraa} />
        <Hjul x={37} r={5} felg={F.lysgraa} />
      </Speilet>
    </Bil>
  )
}

function Hyperbil({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <Speilet>
        <rect x="37" y="20" width="9" height="1.8" rx="0.6" fill={F.mork} />
        <rect x="40" y="21.5" width="1.4" height="4" fill={F.mork} />
        <polygon points="2,33.5 4,30 18,27.5 26,21.5 34,21.3 45,28 46,33.5" fill={F.mork} />
        <polygon points="27,26 29,23.2 33.5,23 39,26.5" fill={F.skifer} />
        <polyline points="4,30.5 18,28.3 26,23 34,22.8 44.5,28.6" fill="none" stroke={F.gull} strokeWidth="0.9" />
        <rect x="3" y="31.5" width="43" height="0.9" fill={F.gull} />
        <rect x="2.6" y="30.2" width="3" height="1" rx="0.5" fill={F.glass} />
        <Hjul x={12} r={5} felg={F.gull} />
        <Hjul x={37} r={5} felg={F.gull} />
      </Speilet>
    </Bil>
  )
}

function Veteranbil({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <circle cx="5.4" cy="28.5" r="3" fill={F.mork} />
      <rect x="6" y="27" width="36" height="7" rx="2" fill={F.gronnMork} />
      <rect x="29" y="23.5" width="13" height="6" rx="1.5" fill={F.gronnMork} />
      <rect x="41" y="23.5" width="2.2" height="8" rx="0.6" fill={F.metallLys} />
      <rect x="12" y="16" width="17" height="12" rx="2" fill={F.gronnMork} />
      <rect x="11" y="15" width="19" height="2.4" rx="1" fill={F.mork} />
      <rect x="14" y="18.5" width="6" height="6" rx="0.6" fill={F.glass} />
      <rect x="21.5" y="18.5" width="6" height="6" rx="0.6" fill={F.glass} />
      <rect x="6" y="30" width="36" height="1" fill={F.gull} />
      <path d="M6.5 35 Q13 28 19.5 35 Z M29.5 35 Q36 28 42.5 35 Z" fill={F.mork} />
      <rect x="18" y="34" width="13" height="1.4" rx="0.6" fill={F.mork} />
      <circle cx="42.4" cy="26.4" r="1.4" fill={F.lys} />
      <Hjul x={13} felg={F.krem} />
      <Hjul x={36} felg={F.krem} />
    </Bil>
  )
}

function Limousin({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <polygon points="9,24.5 12,17 38,17 41,24.5" fill={F.mork} />
      <rect x="12" y="17" width="26" height="1" fill={F.skifer} />
      <rect x="2" y="24" width="44" height="9.5" rx="2.5" fill={F.mork} />
      <polygon points="12.6,23.8 14.2,19 20,19 20,23.8" fill={F.glassMork} />
      <rect x="21.5" y="19" width="7" height="4.8" fill={F.skifer} />
      <polygon points="30,19 36.2,19 38.2,23.8 30,23.8" fill={F.skifer} />
      <rect x="2" y="28" width="44" height="0.9" fill={F.metallLys} />
      <rect x="44" y="25.2" width="2" height="1.8" rx="0.5" fill={F.lys} />
      <Hjul x={9} felg={F.metallLys} />
      <Hjul x={39} felg={F.metallLys} />
    </Bil>
  )
}

function Formelbil({ størrelse = 48 }: P) {
  return (
    <Bil størrelse={størrelse}>
      <rect x="4.6" y="24" width="1.4" height="7" fill={F.mork} />
      <rect x="2.5" y="21.5" width="7" height="2.6" rx="0.6" fill={F.mork} />
      <polygon points="5,33 9,28.5 21,27.5 27,25.5 33,27.5 46,31.5 46,33.5" fill={F.rod} />
      <polygon points="12,31 44,31 46,33.5 5,33.5" fill={F.hvit} />
      <circle cx="25" cy="25.2" r="2.6" fill={F.gul} />
      <rect x="25.6" y="24" width="2" height="1.4" rx="0.5" fill={F.mork} />
      <circle cx="16" cy="30" r="1.8" fill={F.hvit} />
      <rect x="39.5" y="32.6" width="7" height="1.4" rx="0.5" fill={F.mork} />
      <Hjul x={11} r={5.2} felg={F.metall} />
      <Hjul x={36} r={5.2} felg={F.metall} />
    </Bil>
  )
}

// ─────────────────────────────────────────────── Luksus: klokker

/** Klokkene står på en fløyelspute, med remmen rundt puta. */
function Klokke({ størrelse, rem, kasse, skive, visere, ekstra, lomme = false }: { størrelse: number; rem: string; kasse: string; skive: string; visere: string; ekstra?: ReactNode; lomme?: boolean }) {
  const markører: ReactNode[] = []
  for (let i = 0; i < 12; i++) {
    const v = (i / 12) * Math.PI * 2
    markører.push(<circle key={i} cx={24 + Math.sin(v) * 7.6} cy={24 - Math.cos(v) * 7.6} r={i % 3 === 0 ? 0.9 : 0.5} fill={visere} />)
  }
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="skygge" />
      <g transform="translate(24 20.5) scale(0.74) translate(-24 -24)">
        {lomme ? (
          <>
            <path d="M22 7 Q4 6 5 40" fill="none" stroke={rem} strokeWidth="1.6" strokeDasharray="2 1.2" />
            <circle cx="24" cy="7" r="3" fill="none" stroke={kasse} strokeWidth="1.6" />
            <rect x="22" y="9" width="4" height="3.4" rx="0.8" fill={kasse} />
          </>
        ) : (
          <>
            <rect x="18.5" y="1.5" width="11" height="12" rx="2" fill={rem} />
            <rect x="18.5" y="34.5" width="11" height="12" rx="2" fill={rem} />
            <rect x="35" y="22.3" width="3.4" height="3.4" rx="0.8" fill={kasse} />
          </>
        )}
        <circle cx="24" cy="24" r="12.5" fill={kasse} />
        <circle cx="24" cy="24" r="10" fill={skive} />
        {markører}
        {ekstra}
        <line x1="24" y1="24" x2="24" y2="17.5" stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="24" y1="24" x2="29" y2="26.5" stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="1" fill={visere} />
      </g>
      <rect x="9" y="35" width="30" height="8.4" rx="4.2" fill={F.vin} />
      <rect x="12" y="36" width="24" height="2" rx="1" fill="#a8434f" />
    </Svg>
  )
}

function Gullklokke({ størrelse = 48 }: P) {
  return <Klokke størrelse={størrelse} rem={F.treMork} kasse={F.gull} skive="#fffbeb" visere={F.treDyp} />
}

function Mesterverk({ størrelse = 48 }: P) {
  return (
    <Klokke
      størrelse={størrelse}
      rem={F.metall}
      kasse={F.metallLys}
      skive={F.marine}
      visere={F.hvit}
      ekstra={<circle cx="24" cy="29" r="2.6" fill="none" stroke={F.glass} strokeWidth="0.8" />}
    />
  )
}

function Dykkerklokke({ størrelse = 48 }: P) {
  return (
    <Klokke
      størrelse={størrelse}
      rem={F.mork}
      kasse={F.metallLys}
      skive="#0b1f33"
      visere={F.hvit}
      ekstra={<circle cx="24" cy="24" r="11.2" fill="none" stroke={F.blaa} strokeWidth="2.2" />}
    />
  )
}

function Lommeur({ størrelse = 48 }: P) {
  return (
    <Klokke
      størrelse={størrelse}
      rem={F.gullMork}
      kasse={F.gull}
      skive={F.krem}
      visere={F.treDyp}
      lomme
      ekstra={<circle cx="24" cy="29.5" r="2.4" fill="none" stroke={F.treMork} strokeWidth="0.6" />}
    />
  )
}

function Diamantklokke({ størrelse = 48 }: P) {
  const steiner: ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    const v = (i / 16) * Math.PI * 2
    steiner.push(<circle key={i} cx={24 + Math.sin(v) * 11.3} cy={24 - Math.cos(v) * 11.3} r="1.1" fill={i % 2 ? '#e0f2fe' : F.hvit} />)
  }
  return (
    <Klokke
      størrelse={størrelse}
      rem={F.mork}
      kasse={F.gull}
      skive="#0b0b0f"
      visere={F.gull}
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

function Snekke({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="18" y="23" width="10" height="9" fill={F.hvit} />
      <rect x="19.5" y="25" width="7" height="3" fill={F.glass} />
      <rect x="17" y="21.5" width="12" height="2" fill={F.rodMork} />
      <polygon points="4,31 44,31 38.5,41 9.5,41" fill={F.tre} />
      <polygon points="4,31 44,31 43,33 5,33" fill={F.hvit} />
      <rect x="7" y="35" width="34" height="1" fill={F.treMork} />
    </Svg>
  )
}

function Motorbaat({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <polyline points="4,40 8,38.5 4,37" fill="none" stroke={F.hvit} strokeWidth="1.2" strokeLinecap="round" />
      <polygon points="20,29 28,23 34,23 32,29" fill={F.mork} opacity="0.85" />
      <polygon points="5,30 45,28 39,40 9,40" fill={F.hvit} />
      <polygon points="7,33 43,31.5 41.5,34 8,35" fill="#1d4ed8" />
      <rect x="10" y="28" width="10" height="2.3" rx="1" fill={F.metallLys} />
    </Svg>
  )
}

function Seilbaat({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="23.4" y="7" width="1.2" height="27" fill={F.metallMork} />
      <polygon points="22.8,9 22.8,32 9,32" fill={F.hvit} />
      <polygon points="25.2,11 25.2,32 37,32" fill={F.krem} />
      <polygon points="7,33.5 41,33.5 37,40 11,40" fill={F.hvit} />
      <polygon points="8.8,36.6 39.2,36.6 37,40 11,40" fill={F.blaaMork} />
    </Svg>
  )
}

function Seilyacht({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="15.4" y="4" width="1.2" height="28" fill={F.metallMork} />
      <rect x="30.4" y="8" width="1.2" height="24" fill={F.metallMork} />
      <polygon points="14.8,6 14.8,29 4.5,29" fill={F.hvit} />
      <polygon points="17.2,8 17.2,29 29,29" fill={F.krem} />
      <polygon points="29.8,10 29.8,29 21,29" fill={F.hvit} opacity="0.9" />
      <polygon points="32.2,10 44,29 32.2,29" fill={F.hvit} />
      <rect x="18" y="28" width="11" height="3" rx="0.8" fill={F.hvit} />
      <polygon points="3,31 45,30 40.5,40 8,40" fill={F.marine} />
      <rect x="4.5" y="32.6" width="39" height="1" fill={F.gull} />
    </Svg>
  )
}

function Superyacht({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sjo" />
      <rect x="27" y="7" width="1" height="7" fill={F.metall} />
      <circle cx="27.5" cy="7" r="1.6" fill={F.metallLys} />
      <polygon points="17,18 32,18 34,14 19,14" fill={F.hvit} />
      <polygon points="12,23 38,23 40,18 14,18" fill={F.hvit} />
      <polygon points="8,28 44,28 46,23 10,23" fill={F.hvit} />
      <rect x="20" y="15.3" width="11" height="1.4" fill={F.mork} />
      <rect x="15" y="19.8" width="22" height="1.6" fill={F.mork} />
      <rect x="11" y="24.8" width="31" height="1.6" fill={F.mork} />
      <polygon points="3,29 45,27.5 41,40 7,40" fill={F.hvit} />
      <polygon points="5,32 44,31 43,32.8 6,33.8" fill="#0f172a" />
    </Svg>
  )
}

// ─────────────────────────────────────────────── Luksus: fly (sett fra siden, parkert)

function Understell({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 0.5} y="36" width="1" height="4" fill={F.metallMork} />
      <circle cx={x} cy="41.2" r="1.8" fill={F.skifer} />
      <circle cx={x} cy="41.2" r="0.7" fill={F.metallLys} />
    </g>
  )
}

function Propellfly({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <Understell x={12} />
      <Understell x={26} />
      <g transform="translate(0 4.6)">
        <path d="M6 32 Q6 27 11 27 H35 L40.5 20 H43.5 L42 32 Z" fill={F.hvit} />
        <rect x="7" y="29.6" width="35" height="1.4" fill={F.rod} />
        <polygon points="37,27 40.5,20 43.5,20 42,27" fill={F.rod} />
        <rect x="36" y="30.6" width="8" height="1.3" rx="0.6" fill={F.rod} />
        <rect x="14" y="26" width="16" height="2" rx="1" fill={F.rod} />
        <polygon points="11,27.4 16,27.4 16,29.3 9.6,29.3" fill={F.glassMork} />
        <circle cx="5.6" cy="30" r="1.3" fill={F.skifer} />
        <rect x="4.4" y="24" width="1.2" height="12" rx="0.6" fill={F.metallMork} />
      </g>
    </Svg>
  )
}

function Forretningsjet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <Understell x={10} />
      <Understell x={27} />
      <g transform="translate(0 4.6)">
        <path d="M4 31 Q4 26.4 10 26 H36 L41 17 H44.5 L43.2 29 Q42 31.8 37 31.8 H6 Q4 31.8 4 31 Z" fill={F.hvit} />
        <rect x="6" y="29.4" width="34" height="1" fill={F.gull} />
        {[14, 17, 20, 23, 26, 29].map((x) => (
          <circle key={x} cx={x} cy="28" r="0.8" fill={F.marine} />
        ))}
        <polygon points="6.4,27.2 10,26.6 10.4,28.4 5.6,28.4" fill={F.marine} />
        <rect x="30" y="24.2" width="8" height="3.4" rx="1.7" fill={F.metall} />
        <polygon points="15,31.8 29,31.8 24,34 12,34" fill={F.metallLys} />
        <rect x="39.5" y="16.2" width="6" height="1.3" rx="0.6" fill={F.metallLys} />
      </g>
    </Svg>
  )
}

function Helikopter({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <rect x="11" y="34" width="1" height="6" fill={F.metallMork} />
      <rect x="23" y="34" width="1" height="6" fill={F.metallMork} />
      <rect x="7" y="39.6" width="21" height="1.5" rx="0.75" fill={F.metallMork} />
      <polygon points="25,26.5 42,28.4 42,30.4 25,32" fill={F.rod} />
      <polygon points="40,23 43,23 43.6,30.4 41,30.4" fill={F.rodMork} />
      <circle cx="42.3" cy="25.4" r="2.6" fill="none" stroke={F.metall} strokeWidth="0.8" />
      <ellipse cx="17.5" cy="29" rx="10" ry="6.2" fill={F.rod} />
      <ellipse cx="11" cy="27.6" rx="4.6" ry="3.8" fill={F.glassMork} />
      <rect x="9" y="31.6" width="17" height="1" fill={F.rodMork} />
      <rect x="16.8" y="20.4" width="1.4" height="3.2" fill={F.metallMork} />
      <rect x="3" y="19.2" width="30" height="1.3" rx="0.65" fill={F.skifer} />
    </Svg>
  )
}

function Langdistansejet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="gate" />
      <Understell x={9} />
      <Understell x={26} />
      <Understell x={30} />
      <g transform="translate(0 4.6)">
        <path d="M3 32 Q3 25 10 24.5 H37 L41.5 13 H45 L44 29 Q43 32.8 37 32.8 H5 Q3 32.8 3 32 Z" fill={F.hvit} />
        <polygon points="38,24.5 41.5,13 45,13 44,24.5" fill={F.blaaMork} />
        <rect x="4" y="30" width="39" height="1.2" fill={F.blaaMork} />
        {[11, 14, 17, 20, 23, 26, 29, 32].map((x) => (
          <circle key={x} cx={x} cy="27.2" r="0.75" fill={F.marine} />
        ))}
        <polygon points="5,26 9.4,25.2 9.8,27 4.4,27" fill={F.marine} />
        <polygon points="13,31.5 32,31.5 36,34 11,34" fill={F.metallLys} />
        <rect x="17" y="33" width="10" height="4.4" rx="2.2" fill={F.metall} />
        <rect x="17" y="33.6" width="1.6" height="3.2" rx="0.8" fill={F.metallMork} />
        <rect x="39" y="23.2" width="7" height="1.4" rx="0.7" fill={F.blaaMork} />
      </g>
    </Svg>
  )
}

// ─────────────────────────────────────────────── Oppslag

type Tegning = (p: P & { trinn: Trinn; forbedringer: number }) => ReactNode

const bedrift =
  (b: B): Tegning =>
  ({ størrelse = 48, trinn, forbedringer }) => <Svg størrelse={størrelse}>{b(trinn, forbedringer)}</Svg>

const ILLUSTRASJONER: Record<string, Tegning> = {
  saftbod: bedrift(saftbod),
  polsebod: bedrift(polsebod),
  gatekjokken: bedrift(gatekjokken),
  kiosk: bedrift(kiosk),
  kafe: bedrift(kafe),
  restaurant: bedrift(restaurant),
  hotell: bedrift(hotell),
  bank: bedrift(bank),
  oljeselskap: bedrift(oljeselskap),
  rederi: bedrift(rederi),
  fiskeoppdrett: bedrift(fiskeoppdrett),
  flyselskap: bedrift(flyselskap),
  skisenter: bedrift(skisenter),
  hybel: Hybel,
  leilighet: Leilighet,
  rekkehus: Rekkehus,
  hytte: Hytte,
  kontorbygg: Kontorbygg,
  kjopesenter: Kjopesenter,
  naeringsbygg: Naeringsbygg,
  oy: Oy,
  stockholm: Stockholm,
  kobenhavn: Kobenhavn,
  berlin: Berlin,
  london: London,
  dubai: Dubai,
  newyork: NewYork,
  'gard-hedmarken': Gard,
  'gard-lista': Gard,
  'skog-trysil': Skog,
  'skog-namdalen': Skog,
  fyret: Fyret,
  hoppbakken: Hoppbakken,
  borgen: Borgen,
  tarnet: Tarnet,
  stasjonsvogn: Stasjonsvogn,
  elbil: Elbil,
  superbil: Superbil,
  hyperbil: Hyperbil,
  veteranbil: Veteranbil,
  limousin: Limousin,
  formelbil: Formelbil,
  dykkerklokke: Dykkerklokke,
  lommeur: Lommeur,
  seilbaat: Seilbaat,
  seilyacht: Seilyacht,
  helikopter: Helikopter,
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

/** Bedriftene, som har fire vekstrinn. */
export const BEDRIFTSTEGNINGER = ['saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter']

/**
 * Illustrasjonen for en bedrift, eiendom eller luksusgjenstand, etter id.
 * Bedrifter vokser med `trinn` og viser `forbedringer` (0–3) som detaljer.
 */
export const Illustrasjon = memo(function Illustrasjon({
  id,
  størrelse = 44,
  trinn = 0,
  forbedringer = 0,
}: {
  id: string
  størrelse?: number
  trinn?: Trinn
  forbedringer?: number
}) {
  const Tegning = ILLUSTRASJONER[id]
  return Tegning ? <>{Tegning({ størrelse, trinn, forbedringer })}</> : null
})
