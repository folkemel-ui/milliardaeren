import { memo, type ReactNode } from 'react'
import { F } from './Illustrasjoner'
import { drakt } from './Klubbvaapen'

/**
 * Klubbens hjemmebane, som vokser med divisjonen: grusbane med tregjerde i
 * 4. divisjon, en liten tribune i 3., tribune langs hele siden i 2., to
 * etasjer med tak og lysmaster i 1., og full arena i Eliteserien. Spillerne
 * og publikum bærer klubbens farger fra våpenet.
 *
 * Tegnet etter reglene i Illustrasjoner.tsx: paletten F, sett fra siden,
 * flate former uten omriss, alt står på grunnlinja (her y = 56 på et
 * 160×64-rutenett) og ingen bakgrunn fyller hele ruta.
 */

const GRUNN = 56
const BANE = 52

/** Et fast «tilfeldig» tall 0–1 for en plass, så publikum står likt hver gang. */
function fast(i: number, j: number): number {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Publikum på en tribune: hoder i rader, tettere jo høyere `fylt`, mest i klubbens farger. */
function Publikum({ x0, x1, y0, y1, fylt, farger }: { x0: number; x1: number; y0: number; y1: number; fylt: number; farger: [string, string] }) {
  const palett = [farger[0], farger[0], farger[1], F.hvit, F.rod, F.blaa, F.gul]
  const hoder: ReactNode[] = []
  let r = 0
  for (let y = y1 - 1.6; y > y0 + 0.8; y -= 2.6, r++) {
    let k = 0
    for (let x = x0 + 1.2 + (r % 2) * 1.1; x < x1 - 0.8; x += 2.2, k++) {
      if (fast(r, k) > fylt) continue
      hoder.push(<circle key={`${r}-${k}`} cx={x} cy={y} r={0.85} fill={palett[Math.floor(fast(k, r) * palett.length)]} />)
    }
  }
  return <>{hoder}</>
}

/** En tribune: trappetrinn i grått med mørkere rader, og publikum oppå. */
function Tribune({ x0, x1, y0, y1, fylt, farger }: { x0: number; x1: number; y0: number; y1: number; fylt: number; farger: [string, string] }) {
  const rader: ReactNode[] = []
  for (let y = y1 - 2.6; y > y0; y -= 2.6) rader.push(<rect key={y} x={x0} y={y} width={x1 - x0} height={0.5} fill={F.stein} />)
  return (
    <>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={F.graa} />
      {/* Mørkere side til høyre: lyset kommer fra venstre. */}
      <rect x={x1 - 2} y={y0} width={2} height={y1 - y0} fill={F.stein} />
      {rader}
      <Publikum x0={x0} x1={x1 - 2} y0={y0} y1={y1} fylt={fylt} farger={farger} />
    </>
  )
}

/** En lysmast med lampene øverst. */
function Lysmast({ x, topp }: { x: number; topp: number }) {
  return (
    <>
      <rect x={x - 0.5} y={topp} width={1} height={BANE - topp} fill={F.metallMork} />
      <rect x={x - 2.5} y={topp - 2} width={5} height={2.4} rx={0.4} fill={F.metallMork} />
      <rect x={x - 2} y={topp - 1.6} width={4} height={1.4} fill={F.lys} />
    </>
  )
}

/** Et mål sett fra siden: stolpe, tverrligger og nettet skrått bakover. */
function Maal({ x, retning }: { x: number; retning: 1 | -1 }) {
  const bak = x - 5 * retning
  return (
    <>
      <path d={`M${x} ${BANE} V${BANE - 7} H${bak + 1.5 * retning} L${bak} ${BANE}`} fill="none" stroke={F.hvit} strokeWidth={0.8} />
      <path d={`M${x - 1.6 * retning} ${BANE - 7} L${bak + 0.4 * retning} ${BANE} M${x - 3.2 * retning} ${BANE - 7} L${bak + 1.2 * retning} ${BANE - 2}`} stroke={F.hvit} strokeWidth={0.3} opacity={0.7} />
    </>
  )
}

/** En spiller: hode, drakt i klubbens farge, shorts i den andre og bein. */
function Spiller({ x, farger, steg = 0 }: { x: number; farger: [string, string]; steg?: number }) {
  return (
    <>
      <rect x={x - 1.1 + steg} y={48.6} width={0.9} height={BANE - 48.6} fill={F.mork} />
      <rect x={x + 0.2 - steg} y={48.6} width={0.9} height={BANE - 48.6} fill={F.mork} />
      <rect x={x - 1.4} y={47.4} width={2.8} height={1.6} fill={farger[1]} />
      <rect x={x - 1.5} y={44.2} width={3} height={3.4} rx={0.6} fill={farger[0]} />
      <circle cx={x} cy={42.9} r={1.25} fill={F.hud} />
    </>
  )
}

function Gran({ x, h }: { x: number; h: number }) {
  return (
    <>
      <rect x={x - 0.6} y={BANE - 3} width={1.2} height={3} fill={F.treMork} />
      <path d={`M${x} ${BANE - 3 - h} L${x + h * 0.38} ${BANE - 3} H${x - h * 0.38} Z`} fill={F.gran} />
    </>
  )
}

/** Banen: grus i 4. divisjon, ellers gress med klipte striper, og en hvit sidelinje. */
function Bane({ grus }: { grus: boolean }) {
  return (
    <>
      <rect x={4} y={BANE} width={152} height={GRUNN - BANE} rx={1} fill={grus ? F.sand : F.gronn} />
      {!grus && [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={10 + i * 24} y={BANE} width={12} height={GRUNN - BANE} fill={F.gronnMork} opacity={0.35} />)}
      <rect x={4} y={BANE} width={152} height={0.6} fill={F.hvit} opacity={grus ? 0.6 : 0.9} />
    </>
  )
}

export const STADIONTRINN = 5

/** Hvor høyt opp tegningen går per trinn — den lille banen trenger ikke en stor himmel. */
const TOPP = [26, 18, 9, 3, 0]

/** Hjemmebanen i en divisjon (0 = 4. divisjon … 4 = Eliteserien), i klubbens farger. */
export const Stadion = memo(function Stadion({ divisjon, navn }: { divisjon: number; navn: string }) {
  const farger = drakt(navn).farger
  const d = Math.max(0, Math.min(STADIONTRINN - 1, divisjon))
  return (
    <svg className="stadion" viewBox={`0 ${TOPP[d]} 160 ${64 - TOPP[d]}`} role="img" aria-label={['Grusbane med tregjerde', 'Liten tribune', 'Tribune langs hele banen', 'Stadion med tak og lysmaster', 'Full arena'][d]}>
      {d === 0 && (
        <>
          {[12, 22, 34, 120, 132, 146].map((x, i) => (
            <Gran key={x} x={x} h={14 + (i % 3) * 4} />
          ))}
          {/* Tregjerdet langs banen. */}
          <rect x={6} y={47.5} width={148} height={1} fill={F.tre} />
          <rect x={6} y={50} width={148} height={1} fill={F.tre} />
          {Array.from({ length: 19 }, (_, i) => (
            <rect key={i} x={6 + i * 8} y={46.5} width={1} height={BANE - 46.5} fill={F.treMork} />
          ))}
          {/* Et lite leskur for innbytterne. */}
          <rect x={68} y={42} width={24} height={BANE - 42} fill={F.treLys} />
          <rect x={90} y={42} width={2} height={BANE - 42} fill={F.tre} />
          <path d="M66 42 L94 42 L92 39 L68 39 Z" fill={F.mur} />
          <Publikum x0={70} x1={90} y0={44} y1={50} fylt={0.5} farger={farger} />
        </>
      )}
      {d === 1 && (
        <>
          {[128, 140, 150].map((x, i) => (
            <Gran key={x} x={x} h={14 + i * 3} />
          ))}
          <Tribune x0={30} x1={96} y0={40} y1={BANE} fylt={0.45} farger={farger} />
          {/* Taket over tribunen, på søyler. */}
          <rect x={28} y={34} width={70} height={2} fill={F.skifer} />
          {[31, 63, 95].map((x) => (
            <rect key={x} x={x - 0.5} y={36} width={1} height={4} fill={F.metallMork} />
          ))}
          <Lysmast x={112} topp={22} />
        </>
      )}
      {d === 2 && (
        <>
          <Tribune x0={10} x1={150} y0={38} y1={BANE} fylt={0.65} farger={farger} />
          <rect x={44} y={32} width={72} height={2} fill={F.skifer} />
          {[47, 80, 113].map((x) => (
            <rect key={x} x={x - 0.5} y={34} width={1} height={4} fill={F.metallMork} />
          ))}
          <Lysmast x={6} topp={14} />
          <Lysmast x={154} topp={14} />
        </>
      )}
      {d === 3 && (
        <>
          <Tribune x0={8} x1={152} y0={28} y1={39} fylt={0.75} farger={farger} />
          <Tribune x0={6} x1={154} y0={40} y1={BANE} fylt={0.85} farger={farger} />
          {/* Tak over hele, med en stripe i klubbens farge. */}
          <rect x={4} y={22} width={152} height={4} fill={F.skifer} />
          <rect x={4} y={25} width={152} height={1.2} fill={farger[0]} />
          {/* Resultattavla på taket. */}
          <rect x={70} y={13} width={20} height={9} rx={0.8} fill={F.mork} />
          <rect x={72} y={15} width={16} height={5} fill={F.lys} opacity={0.85} />
          {[3, 40, 120, 157].map((x) => (
            <Lysmast key={x} x={x} topp={8} />
          ))}
        </>
      )}
      {d === 4 && (
        <>
          <Tribune x0={14} x1={146} y0={18} y1={27} fylt={0.9} farger={farger} />
          <Tribune x0={8} x1={152} y0={28} y1={39} fylt={0.95} farger={farger} />
          <Tribune x0={4} x1={156} y0={40} y1={BANE} fylt={0.97} farger={farger} />
          {/* Buetaket i klubbens farge, med lys langs kanten. */}
          <path d="M2 18 Q80 2 158 18 L158 21 Q80 6 2 21 Z" fill={farger[0]} />
          <path d="M2 18 Q80 2 158 18" fill="none" stroke={farger[1]} strokeWidth={0.8} />
          {[20, 50, 80, 110, 140].map((x) => (
            <rect key={x} x={x - 3} y={x === 80 ? 7.2 : x === 50 || x === 110 ? 9.6 : 14.4} width={6} height={1} fill={F.lys} />
          ))}
          {/* Storskjermen. */}
          <rect x={66} y={9} width={28} height={8} rx={0.8} fill={F.mork} />
          <rect x={68} y={10.5} width={24} height={5} fill={F.glass} />
          {/* Flagg på taket. */}
          {[10, 150].map((x) => (
            <g key={x}>
              <rect x={x} y={4} width={0.7} height={12} fill={F.metallMork} />
              <path d={`M${x + 0.7} 4 h6 l-1.5 2 l1.5 2 h-6 z`} fill={farger[0]} />
            </g>
          ))}
        </>
      )}
      <Bane grus={d === 0} />
      <Maal x={14} retning={1} />
      <Maal x={146} retning={-1} />
      {[38, 62, 84, 104, 126].map((x, i) => (
        <Spiller key={x} x={x} farger={i % 2 === 0 ? farger : [F.hvit, F.mork]} steg={i % 2 === 0 ? 0.3 : -0.3} />
      ))}
      <circle cx={95} cy={BANE - 1} r={1} fill={F.hvit} />
    </svg>
  )
})
