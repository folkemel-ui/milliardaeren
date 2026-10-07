import { memo, type ReactNode } from 'react'
import { drakt } from './Klubbvaapen'
import { bland } from './Papirlogo'
import { S } from './Tegnestil'

/**
 * Klubbens hjemmebane (Grafikkpakke G6), sett som på TV: høyt oppe fra
 * hovedtribunen, med banen litt på skrå foran deg og tribunen på andre siden
 * full av folk i klubbens farger. Banen vokser med divisjonen:
 *
 * - 4. divisjon: grusbane, tregjerde, et leskur og noen som står og ser på.
 * - 3. divisjon: gress og en liten overbygd tretribune.
 * - 2. divisjon: betongtribune med tak, resultattavle på stolper, lysmaster.
 * - 1. divisjon: to etasjer, tribuner bak målene og digital tavle.
 * - Eliteserien: en lukket arena med glasstak kantet i klubbens farge,
 *   storskjerm og fullt hus — et annet bygg.
 *
 * Rutenettet er 160 × 90 (16:9). Banen er det eneste med perspektiv: den
 * smalner litt mot langsiden borte. Paletten er `S` fra Tegnestil; bare
 * publikum, taket og spillerne bærer klubbens farger.
 */

const NAER = 82
const FJERN = 56
/** Et punkt på banen: u langs banen (0–1), v innover mot langsiden borte (0–1). */
function bane(u: number, v: number): [number, number] {
  const xn = 4 + 152 * u
  const xf = 24 + 112 * u
  return [+(xn + (xf - xn) * v).toFixed(2), +(NAER - (NAER - FJERN) * v).toFixed(2)]
}
const pk = (...p: [number, number][]) => p.map((q) => q.join(',')).join(' ')

/** Et fast «tilfeldig» tall 0–1, så publikum står likt hver gang. */
function fast(i: number, j: number): number {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type Farger = [string, string]

/**
 * Publikum som en masse: rad for rad nedenfra, der radene blir lavere og
 * smalere jo lenger bak de sitter. Folk sitter i blokker i klubbens farge med
 * hoder langs kanten; tomme seter er grå. Noen få skjerf og flagg lyser opp.
 */
function Publikum({ x0, x1, y0, y1, krymp, fylt, farger, frø = 0 }: { x0: number; x1: number; y0: number; y1: number; krymp: number; fylt: number; farger: Farger; frø?: number }) {
  const masse = bland(farger[0], '#000000', 0.35)
  const hode = bland(farger[0], '#000000', 0.12)
  const rader: ReactNode[] = []
  let y = y1
  let h = 3
  let r = 0
  while (y - h > y0 && r < 14) {
    const inn = krymp * r
    const a = x0 + inn
    const b = x1 - inn
    const blokker = Math.max(2, Math.round((b - a) / 7))
    const bb = (b - a) / blokker
    rader.push(
      <g key={r}>
        <rect x={+a.toFixed(2)} y={+(y - h).toFixed(2)} width={+(b - a).toFixed(2)} height={+h.toFixed(2)} fill={S.stein.flate} />
        {Array.from({ length: blokker }, (_, k) => {
          if (fast(r + frø, k) > fylt) return null
          const bx = +(a + k * bb).toFixed(2)
          const ant = Math.max(2, Math.floor(bb / 1.3))
          return (
            <g key={k}>
              <rect x={bx} y={+(y - h * 0.82).toFixed(2)} width={+bb.toFixed(2)} height={+(h * 0.82).toFixed(2)} fill={masse} />
              {Array.from({ length: ant }, (_, i) => (
                <circle key={i} cx={+(bx + (i + 0.5) * (bb / ant)).toFixed(2)} cy={+(y - h * 0.78).toFixed(2)} r={+(h * 0.2).toFixed(2)} fill={hode} />
              ))}
              {fast(k, r + frø + 7) > 0.82 && <rect x={+(bx + bb * 0.3).toFixed(2)} y={+(y - h * 0.95).toFixed(2)} width={+(bb * 0.4).toFixed(2)} height={+(h * 0.28).toFixed(2)} fill={farger[1]} />}
              {fast(k + 3, r + frø) > 0.9 && <circle cx={+(bx + bb * 0.7).toFixed(2)} cy={+(y - h * 0.5).toFixed(2)} r={+(h * 0.18).toFixed(2)} fill={S.hvit.lys} />}
            </g>
          )
        })}
        <rect x={+a.toFixed(2)} y={+(y - 0.4).toFixed(2)} width={+(b - a).toFixed(2)} height="0.4" fill={S.stein.skygge} />
      </g>,
    )
    y -= h
    h *= 0.9
    r++
  }
  return <>{rader}</>
}

/** Publikum på en tribune bak målet, skrått langs mållinja (venstre eller høyre). */
function Endetribune({ side, topp, fylt, farger }: { side: 1 | -1; topp: number; fylt: number; farger: Farger }) {
  const masse = bland(farger[0], '#000000', 0.35)
  const [nx, ny] = bane(side < 0 ? 0 : 1, 0)
  const [fx, fy] = bane(side < 0 ? 0 : 1, 1)
  const ut = side * 16
  const poly: [number, number][] = [[nx - side * 1, ny - 1], [fx - side * 1, fy - 2], [fx + ut * 0.6, topp], [nx + ut, topp + 18]]
  const linjer = [0.25, 0.5, 0.75].map((t) => {
    const a: [number, number] = [nx - side + (nx + ut - nx + side) * t, ny - 1 + (topp + 18 - ny + 1) * t]
    const b: [number, number] = [fx - side + (fx + ut * 0.6 - fx + side) * t, fy - 2 + (topp - fy + 2) * t]
    return [a, b] as const
  })
  return (
    <g>
      <polygon points={pk(...poly)} fill={S.stein.flate} />
      <polygon points={pk(...poly)} fill={masse} opacity={fylt} />
      {linjer.map(([a, b], i) => (
        <line key={i} x1={+a[0].toFixed(2)} y1={+a[1].toFixed(2)} x2={+b[0].toFixed(2)} y2={+b[1].toFixed(2)} stroke={S.stein.skygge} strokeWidth="0.5" />
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const t = fast(i, side + 9)
        const s = fast(side + 4, i)
        const x = nx - side + (fx - nx) * t + ut * (0.2 + s * 0.6)
        const y = ny - 2 + (fy - ny) * t - (s * 14)
        return fast(i, side) < fylt ? <circle key={i} cx={+x.toFixed(2)} cy={+y.toFixed(2)} r="0.6" fill={i % 3 ? farger[1] : S.hvit.lys} /> : null
      })}
    </g>
  )
}

/** En lysmast med lampegitter øverst. */
function Lysmast({ x, bunn, topp }: { x: number; bunn: number; topp: number }) {
  return (
    <g>
      <path d={`M${x - 0.8} ${bunn} L${x - 0.3} ${topp} M${x + 0.8} ${bunn} L${x + 0.3} ${topp}`} stroke={S.metall.skygge} strokeWidth="0.6" />
      <rect x={x - 3} y={topp - 3.6} width="6" height="3.6" fill={S.metall.skygge} />
      {[0, 1, 2].map((i) =>
        [0, 1].map((j) => <rect key={`${i}-${j}`} x={x - 2.6 + i * 1.8} y={topp - 3.2 + j * 1.6} width="1.4" height="1.2" fill={S.vinduLys.lys} />),
      )}
    </g>
  )
}

/** En resultattavle: mørk flate med lysende tall som streker. */
function Tavle({ x, y, b, h, farge }: { x: number; y: number; b: number; h: number; farge: string }) {
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} rx="0.6" fill={S.mork.skygge} />
      <rect x={x + 0.8} y={y + 0.8} width={b - 1.6} height={h * 0.3} fill={farge} opacity="0.85" />
      {[0.2, 0.32, 0.62, 0.74].map((t) => (
        <rect key={t} x={+(x + b * t).toFixed(2)} y={+(y + h * 0.48).toFixed(2)} width={+(b * 0.08).toFixed(2)} height={+(h * 0.36).toFixed(2)} fill={S.vinduLys.lys} />
      ))}
      <rect x={+(x + b * 0.47).toFixed(2)} y={+(y + h * 0.62).toFixed(2)} width={+(b * 0.06).toFixed(2)} height="0.6" fill={S.vinduLys.lys} />
    </g>
  )
}

/** En gran sett fra stadionavstand. */
function Gran({ x, y, h, m = S.gran }: { x: number; y: number; h: number; m?: typeof S.gran }) {
  return (
    <g>
      <rect x={x - 0.4} y={y - h * 0.15} width="0.8" height={h * 0.15} fill={S.treMork.flate} />
      {[0, 1, 2].map((i) => {
        const t = y - h + i * h * 0.26
        const b = h * (0.18 + i * 0.08)
        return (
          <g key={i}>
            <polygon points={pk([x, t], [x - b, t + h * 0.38], [x + b, t + h * 0.38])} fill={m.flate} />
            <polygon points={pk([x, t], [x + b * 0.2, t + h * 0.38], [x + b, t + h * 0.38])} fill={m.skygge} />
          </g>
        )
      })}
    </g>
  )
}

/** En spiller i perspektiv: `v` er hvor langt inn på banen, så de bak blir mindre. */
function Spiller({ u, v, farger, steg = 0 }: { u: number; v: number; farger: Farger; steg?: number }) {
  const [x, y] = bane(u, v)
  const s = 1 - v * 0.45
  const k = (n: number) => +(n * s).toFixed(2)
  return (
    <g>
      <ellipse cx={+(x + k(0.8)).toFixed(2)} cy={y} rx={k(1.6)} ry={k(0.4)} fill="#000000" opacity="0.25" />
      <rect x={+(x - k(1) + k(steg)).toFixed(2)} y={+(y - k(3)).toFixed(2)} width={k(0.8)} height={k(3)} fill={S.mork.flate} />
      <rect x={+(x + k(0.2) - k(steg)).toFixed(2)} y={+(y - k(3)).toFixed(2)} width={k(0.8)} height={k(3)} fill={S.mork.flate} />
      <rect x={+(x - k(1.3)).toFixed(2)} y={+(y - k(4.4)).toFixed(2)} width={k(2.6)} height={k(1.6)} fill={farger[1]} />
      <rect x={+(x - k(1.4)).toFixed(2)} y={+(y - k(7.6)).toFixed(2)} width={k(2.8)} height={k(3.4)} rx={k(0.6)} fill={farger[0]} />
      <circle cx={x} cy={+(y - k(8.8)).toFixed(2)} r={k(1.15)} fill={S.hud.flate} />
    </g>
  )
}

/** Banen: grus eller gress med klippestriper, linjer, sirkel, felt og mål. */
function Banen({ grus }: { grus: boolean }) {
  const striper = Array.from({ length: 10 }, (_, i) => i)
  const m = grus ? { lys: S.puss.flate, flate: S.puss.skygge } : { lys: S.gress.lys, flate: S.gress.flate }
  const felt = (u0: number, u1: number, v0: number, v1: number) => pk(bane(u0, v0), bane(u1, v0), bane(u1, v1), bane(u0, v1))
  const [mx, my] = bane(0.5, 0.5)
  const maal = (u: number) => {
    const [ax, ay] = bane(u, 0.44)
    const [bx, by] = bane(u, 0.56)
    const ut = u < 0.5 ? -2.4 : 2.4
    return (
      <g key={u}>
        <path d={`M${ax} ${ay} V${ay - 4.6} L${bx} ${by - 4} V${by}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" />
        <path d={`M${ax} ${ay - 4.6} L${ax + ut} ${ay - 3.6} L${ax + ut} ${ay} M${bx} ${by - 4} L${bx + ut} ${by - 3.2} L${bx + ut} ${by}`} fill="none" stroke={S.hvit.flate} strokeWidth="0.3" opacity="0.8" />
      </g>
    )
  }
  return (
    <g>
      <polygon points={pk(bane(-0.02, -0.04), bane(1.02, -0.04), bane(1.02, 1.04), bane(-0.02, 1.04))} fill={m.flate} />
      {striper.map((i) =>
        i % 2 ? null : <polygon key={i} points={felt(i / 10, (i + 1) / 10, 0, 1)} fill={m.lys} opacity={grus ? 0.4 : 0.55} />,
      )}
      <g fill="none" stroke={S.hvit.lys} strokeWidth="0.5" opacity={grus ? 0.55 : 0.9}>
        <polygon points={felt(0, 1, 0, 1)} />
        <line x1={bane(0.5, 0)[0]} y1={NAER} x2={bane(0.5, 1)[0]} y2={FJERN} />
        <ellipse cx={mx} cy={my} rx="11" ry="3.6" />
        <polygon points={felt(0, 0.157, 0.2, 0.8)} />
        <polygon points={felt(0.843, 1, 0.2, 0.8)} />
      </g>
      {maal(0)}
      {maal(1)}
    </g>
  )
}

/** Reklameskiltene langs sidelinja nærmest oss. */
function Reklame({ farger }: { farger: Farger }) {
  const f = [S.marine.flate, farger[0], S.hvit.flate, S.vin.flate, S.oker.flate, S.skifer.flate, farger[0], S.hvit.flate]
  return (
    <g>
      {f.map((c, i) => (
        <g key={i}>
          <rect x={2 + i * 19.5} y={NAER + 2} width="19" height="3.4" fill={c} />
          <rect x={4 + i * 19.5} y={NAER + 3.2} width="8" height="1" fill={c === S.hvit.flate ? S.marine.flate : S.hvit.lys} opacity="0.75" />
        </g>
      ))}
    </g>
  )
}

/** Den lave reklamelista langs langsiden borte. */
function ReklameBorte() {
  return <rect x={22} y={FJERN - 2.2} width="116" height="1.8" fill={S.marine.flate} />
}

export const STADIONTRINN = 5
const NAVN = ['Grusbane med tregjerde', 'Gressbane med liten tretribune', 'Betongtribune med tak og lysmaster', 'Stadion med to etasjer og tribuner bak målene', 'Lukket arena med glasstak']

/** Hjemmebanen i en divisjon (0 = 4. divisjon … 4 = Eliteserien), i klubbens farger. */
export const Stadion = memo(function Stadion({ divisjon, navn }: { divisjon: number; navn: string }) {
  const farger = drakt(navn).farger
  const d = Math.max(0, Math.min(STADIONTRINN - 1, divisjon))
  const borte: Farger = [S.hvit.lys, S.marine.flate]
  return (
    <svg className="stadion" viewBox="0 0 160 90" role="img" aria-label={NAVN[d]}>
      {d === 0 && (
        <g>
          {/* Åsene og granskogen bak, tregjerdet og leskuret. */}
          <polygon points="0,52 20,40 46,46 74,34 104,44 132,36 160,44 160,56 0,56" fill={S.gran.skygge} opacity="0.55" />
          {[[8, 54, 18], [18, 54, 22], [30, 54, 16], [118, 54, 20], [132, 54, 24], [146, 54, 18], [154, 54, 21]].map(([x, y, h]) => (
            <Gran key={x} x={x} y={y} h={h} />
          ))}
          <rect x="62" y="38" width="32" height="15" fill={S.faluRod.flate} />
          <rect x="91" y="38" width="3" height="15" fill={S.faluRod.skygge} />
          <polygon points="60,38 96,38 93,34 63,34" fill={S.skifer.flate} />
          <rect x="65" y="41" width="26" height="9" fill={S.treMork.skygge} />
          {[68, 72, 76, 82, 86].map((x, i) => (
            <g key={x}>
              <rect x={x - 0.8} y="44" width="1.6" height="3" fill={i % 2 ? farger[0] : S.skifer.lys} />
              <circle cx={x} cy="43.2" r="0.8" fill={S.hud.flate} />
            </g>
          ))}
          <rect x="20" y="51.4" width="120" height="0.8" fill={S.treverk.flate} />
          <rect x="20" y="53.4" width="120" height="0.8" fill={S.treverk.flate} />
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={20 + i * 8} y="50.6" width="0.8" height="4.6" fill={S.treverk.skygge} />
          ))}
          {[30, 34, 44, 108, 112, 124].map((x, i) => (
            <g key={x}>
              <rect x={x - 0.7} y="47.6" width="1.4" height="2.8" fill={i % 2 ? farger[0] : S.marine.flate} />
              <circle cx={x} cy="46.8" r="0.7" fill={S.hud.flate} />
            </g>
          ))}
          <Lysmast x={150} bunn={56} topp={24} />
        </g>
      )}
      {d === 1 && (
        <g>
          <polygon points="0,50 24,40 52,44 80,34 110,42 140,36 160,42 160,56 0,56" fill={S.gran.skygge} opacity="0.5" />
          {[[8, 54, 20], [20, 54, 24], [126, 54, 22], [140, 54, 26], [152, 54, 20]].map(([x, y, h]) => (
            <Gran key={x} x={x} y={y} h={h} />
          ))}
          {/* Den lille tretribunen med tak på stolper. */}
          <rect x="44" y="36" width="72" height="18" fill={S.treverk.flate} />
          <Publikum x0={46} x1={114} y0={38} y1={53} krymp={0.6} fylt={0.55} farger={farger} />
          <polygon points="40,36 120,36 117,30 43,30" fill={S.skifer.flate} />
          <rect x="40" y="35.4" width="80" height="1" fill={S.skifer.skygge} />
          {[46, 80, 114].map((x) => (
            <rect key={x} x={x - 0.4} y="36" width="0.8" height="18" fill={S.treMork.flate} />
          ))}
          <Lysmast x={14} bunn={56} topp={20} />
          <Lysmast x={146} bunn={56} topp={20} />
        </g>
      )}
      {d === 2 && (
        <g>
          {/* Betongtribunen langs hele siden, tak over midten. */}
          <rect x="6" y="28" width="148" height="26" fill={S.stein.skygge} />
          <Publikum x0={8} x1={152} y0={30} y1={53} krymp={0.8} fylt={0.68} farger={farger} />
          <polygon points="30,28 130,28 127,21 33,21" fill={S.skifer.flate} />
          <rect x="30" y="27.4" width="100" height="1.2" fill={farger[0]} />
          {[36, 80, 124].map((x) => (
            <rect key={x} x={x - 0.4} y="28" width="0.8" height="6" fill={S.metall.skygge} />
          ))}
          <rect x="138" y="20" width="0.8" height="8" fill={S.metall.skygge} />
          <rect x="148" y="20" width="0.8" height="8" fill={S.metall.skygge} />
          <Tavle x={135} y={12} b={17} h={9} farge={farger[0]} />
          <Lysmast x={4} bunn={56} topp={10} />
          <Lysmast x={156} bunn={56} topp={10} />
        </g>
      )}
      {d === 3 && (
        <g>
          {/* To etasjer, tak over hele og tribuner bak målene. */}
          <rect x="4" y="14" width="152" height="40" fill={S.stein.skygge} />
          <Publikum x0={6} x1={154} y0={34} y1={53} krymp={0.7} fylt={0.82} farger={farger} />
          <rect x="4" y="32.6" width="152" height="1.8" fill={S.stein.flate} />
          <rect x="4" y="33.4" width="152" height="0.8" fill={farger[0]} />
          <Publikum x0={10} x1={150} y0={16} y1={32} krymp={0.7} fylt={0.76} farger={farger} frø={5} />
          <polygon points="0,14 160,14 156,7 4,7" fill={S.skifer.flate} />
          <rect x="0" y="13.2" width="160" height="1.2" fill={farger[0]} />
          <Endetribune side={-1} topp={30} fylt={0.8} farger={farger} />
          <Endetribune side={1} topp={30} fylt={0.8} farger={farger} />
          <Tavle x={4} y={22} b={14} h={8} farge={farger[0]} />
          <Lysmast x={2} bunn={30} topp={3} />
          <Lysmast x={158} bunn={30} topp={3} />
        </g>
      )}
      {d === 4 && (
        <g>
          {/* Arenaen: tribunene går rundt, under et glasstak kantet i klubbens farge. */}
          <rect x="0" y="10" width="160" height="44" fill={S.stein.skygge} />
          <Publikum x0={2} x1={158} y0={33} y1={53} krymp={0.6} fylt={0.96} farger={farger} />
          <rect x="0" y="31.6" width="160" height="2.2" fill={S.stein.flate} />
          <rect x="0" y="32.6" width="160" height="0.8" fill={farger[1]} />
          <Publikum x0={4} x1={156} y0={12} y1={31} krymp={0.5} fylt={0.94} farger={farger} frø={11} />
          <Endetribune side={-1} topp={22} fylt={0.95} farger={farger} />
          <Endetribune side={1} topp={22} fylt={0.95} farger={farger} />
          <path d="M-4 16 Q80 -4 164 16 L164 4 Q80 -14 -4 4 Z" fill={S.glass.lys} opacity="0.4" />
          <path d="M-4 16 Q80 -4 164 16" fill="none" stroke={farger[0]} strokeWidth="2.4" />
          <path d="M-4 17.4 Q80 -2.6 164 17.4" fill="none" stroke={S.vinduLys.lys} strokeWidth="0.5" strokeDasharray="1.6 1.2" />
          {[24, 52, 80, 108, 136].map((x) => (
            <line key={x} x1={x} y1={x === 80 ? 6 : x === 52 || x === 108 ? 7.4 : 10.4} x2={x + (x - 80) * 0.08} y2="-6" stroke={S.metall.lys} strokeWidth="0.4" opacity="0.6" />
          ))}
          <g>
            <rect x="128" y="18" width="22" height="12" rx="0.8" fill={S.mork.skygge} />
            <rect x="129.4" y="19.4" width="19.2" height="9.2" fill={farger[0]} opacity="0.7" />
            {/* Reprisen på skjermen: en spiller som jubler. */}
            <rect x="138" y="22.6" width="2.4" height="3.4" rx="0.5" fill={farger[1]} />
            <circle cx="139.2" cy="21.6" r="0.9" fill={S.hud.flate} />
            <path d="M138 23 L136.6 20.8 M140.4 23 L141.8 20.8" stroke={farger[1]} strokeWidth="0.7" strokeLinecap="round" />
            <rect x="129.4" y="27.4" width="19.2" height="1.2" fill={S.mork.flate} opacity="0.6" />
          </g>
        </g>
      )}
      <ReklameBorte />
      <Banen grus={d === 0} />
      {[[0.28, 0.35], [0.42, 0.62], [0.55, 0.3], [0.68, 0.7], [0.8, 0.45]].map(([u, v], i) => (
        <Spiller key={i} u={u} v={v} farger={i % 2 ? borte : farger} steg={i % 2 ? -0.3 : 0.3} />
      ))}
      <circle cx={bane(0.6, 0.42)[0]} cy={bane(0.6, 0.42)[1] - 0.6} r="0.8" fill={S.hvit.lys} />
      {d > 0 && <Reklame farger={farger} />}
    </svg>
  )
})
