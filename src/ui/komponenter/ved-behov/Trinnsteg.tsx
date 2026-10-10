/**
 * Stegene mellom vekstrinnene (Grafikkpakke G16). En bedriftstegning endrer seg
 * bare ved nivå 1, 25, 50 og 100 og med de tre forbedringene; her kommer det som
 * viser nivåene i mellom. For hvert femte nivå inne i et trinn (`stegFor`)
 * legges noe nytt over tegningen i scenen: en kunde til i køen, en vimpelrekke,
 * et bord, et skilt, en båt. `steg` (k) er 1–4 før nivå 25 og 50, 1–9 før 100 og
 * 1–10 derfra; hver bedrift har sin egen liste over hva som kommer når.
 *
 * Alt står på gulvet foran, i sidene eller på himmelen, der tegningen ellers har
 * plass. Tingene må ikke havne oppå trinnets egne detaljer eller på
 * forbedringene — tegn og se på trinn 0–3 med f = 3. Bitene vises bare i scenen
 * (`IScenen`), så startskriptet slipper dem; se `Trinnsteg` i Illustrasjoner.tsx.
 */

import { Fragment, type ReactNode } from 'react'
import { Dis, Folk, GRUNNLINJE, maal, r2, S, type Avstand, type Haandting, type Materiale } from '../Tegnestil'
import { Bil, Passasjerfly, Sykkel, type Trinn } from '../Illustrasjoner'

type Steg = (t: Trinn, f: number, k: number) => ReactNode

const g = GRUNNLINJE

/** Delene som har kommet ved steg `k`: hver er `[første steg, tegningen]`. */
function med(k: number, ...deler: [number, ReactNode][]): ReactNode {
  return deler.filter(([fra]) => k >= fra).map(([, node], i) => <Fragment key={i}>{node}</Fragment>)
}

// ─────────────────────────────────────────────── Byggeklosser

const KLAER: Materiale[] = [S.marine, S.vin, S.gran, S.oker, S.petrol, S.treverk, S.hvit, S.skifer]
const HUDER: Materiale[] = [S.hud, S.hudMork, S.hud, S.hud, S.hudMork, S.hud]
const HAR = [S.treMork.skygge, S.mork.flate, S.oker.skygge, S.treverk.skygge, S.mork.lys, S.vin.skygge]
const HOYDER = [1.78, 1.66, 1.72, 1.6, 1.82, 1.68]

/**
 * En kunde i riktig mål på avstanden. `i` velger klær, hår og høyde, så ingen i
 * køen er like; `barn` er et barn på 1,2 m.
 */
function Kunde({ x, y, i, avstand, barn = false, arm = 'ned', ting }: { x: number; y: number; i: number; avstand: Avstand; barn?: boolean; arm?: 'ned' | 'holde' | 'opp'; ting?: Haandting }) {
  return (
    <Folk
      x={r2(x)}
      y={r2(y)}
      m={barn ? 1.2 : HOYDER[i % HOYDER.length]}
      avstand={avstand}
      klaer={KLAER[i % KLAER.length]}
      hud={HUDER[(i * 5) % HUDER.length]}
      har={HAR[(i * 3) % HAR.length]}
      barn={barn}
      arm={arm}
      ting={ting}
    />
  )
}

/** En kø: kunde nr. `n` står på (x0 − n × avstandMellom, y) — de som står lengst bak, tegnes først. */
function Ko({ x0, y, mellom = 7.4, fra, avstand, i0 = 0, barn = [] }: { x0: number; y: number; mellom?: number; fra: number; avstand: Avstand; i0?: number; barn?: number[] }) {
  return (
    <>
      {Array.from({ length: fra }, (_, n) => fra - 1 - n).map((n) => (
        <Kunde key={n} x={x0 - n * mellom} y={y + (n % 2) * 1.1} i={i0 + n} avstand={avstand} barn={barn.includes(n)} />
      ))}
    </>
  )
}

const VIMPELFARGER = [S.vin.lys, S.gull.flate, S.hvit.lys, S.marine.lys, S.gran.lys]

/** En vimpelrekke i en bue fra (x1, y) til (x2, y), som henger `sig` enheter ned i midten. */
function Vimpler({ x1, x2, y, sig = 4, n }: { x1: number; x2: number; y: number; sig?: number; n: number }) {
  const bue = (u: number): [number, number] => [x1 + (x2 - x1) * u, y + 4 * sig * u * (1 - u)]
  return (
    <g>
      <path d={`M${x1} ${y} Q${r2((x1 + x2) / 2)} ${r2(y + 2 * sig)} ${x2} ${y}`} fill="none" stroke={S.treMork.flate} strokeWidth="0.3" />
      {Array.from({ length: n }, (_, i) => {
        const [x, yy] = bue((i + 0.5) / n)
        return <polygon key={i} points={`${r2(x - 1.3)},${r2(yy)} ${r2(x + 1.3)},${r2(yy)} ${r2(x)},${r2(yy + 3)}`} fill={VIMPELFARGER[i % VIMPELFARGER.length]} />
      })}
    </g>
  )
}

/** En lyslenke: små, varme pærer på en snor — de lyser om natta (fargene i `LYSFARGER`). */
function Lyslenke({ x1, x2, y, sig = 4, n }: { x1: number; x2: number; y: number; sig?: number; n: number }) {
  const bue = (u: number): [number, number] => [x1 + (x2 - x1) * u, y + 4 * sig * u * (1 - u)]
  return (
    <g>
      <path d={`M${x1} ${y} Q${r2((x1 + x2) / 2)} ${r2(y + 2 * sig)} ${x2} ${y}`} fill="none" stroke={S.mork.flate} strokeWidth="0.3" />
      {Array.from({ length: n }, (_, i) => {
        const [x, yy] = bue((i + 0.5) / n)
        return <circle key={i} cx={r2(x)} cy={r2(yy + 0.9)} r="0.8" fill={S.vinduLys.lys} />
      })}
    </g>
  )
}

const BALLONGFARGER = [S.vin.lys, S.gull.lys, S.hvit.flate, S.marine.lys]

/** En klase ballonger i en snor som er festet i (x, y). */
function Ballonger({ x, y, n = 3 }: { x: number; y: number; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const bx = r2(x + (i - (n - 1) / 2) * 4.4)
        const by = r2(y - 15 - (i % 2) * 3.4)
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={bx} y2={r2(by + 3.6)} stroke={S.mork.skygge} strokeWidth="0.25" />
            <ellipse cx={bx} cy={by} rx="2.5" ry="3.1" fill={BALLONGFARGER[i % BALLONGFARGER.length]} />
            <ellipse cx={r2(bx - 0.8)} cy={r2(by - 1)} rx="0.6" ry="0.9" fill={S.hvit.lys} opacity="0.7" />
          </g>
        )
      })}
    </g>
  )
}

/** En liten hund, vendt mot høyre, som står på (x, y); `s` skalerer (1 = nær avstand). */
function Hund({ x, y, s = 1, farge = S.treverk }: { x: number; y: number; s?: number; farge?: Materiale }) {
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) scale(${s})`}>
      <ellipse cx="0.6" cy="0" rx="4.4" ry="0.8" fill="#000000" opacity="0.25" />
      <rect x="-3.2" y="-2.6" width="0.9" height="2.6" fill={farge.skygge} />
      <rect x="1.6" y="-2.6" width="0.9" height="2.6" fill={farge.skygge} />
      <rect x="-3.6" y="-5.4" width="7.6" height="3.2" rx="1.4" fill={farge.flate} />
      <rect x="-2.8" y="-2.8" width="0.9" height="2.8" fill={farge.flate} />
      <rect x="2.2" y="-2.8" width="0.9" height="2.8" fill={farge.flate} />
      <circle cx="4.2" cy="-6.2" r="1.7" fill={farge.lys} />
      <path d="M5.4 -6 L7 -5.6 L5.6 -5 Z" fill={farge.lys} />
      <path d="M3.4 -8.2 L4.4 -6.8 L3 -6.6 Z" fill={farge.skygge} />
      <path d="M-3.6 -4.8 Q-5.6 -6.6 -4.8 -8" fill="none" stroke={farge.flate} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  )
}

/** Kasser med frukt eller bær: `n` lag oppå hverandre, bunnen på y. */
function Kasser({ x, y, n = 1, bredde = 8, frukt = S.vin.lys }: { x: number; y: number; n?: number; bredde?: number; frukt?: string }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ky = r2(y - (i + 1) * 4.4)
        return (
          <g key={i}>
            {Array.from({ length: Math.floor(bredde / 2.4) }, (_, j) => (
              <circle key={j} cx={r2(x + 1.4 + j * 2.4)} cy={r2(ky + 0.2)} r="1.3" fill={frukt} />
            ))}
            <rect x={x} y={ky} width={bredde} height="4.4" fill={S.treverk.flate} />
            <rect x={x} y={ky} width={bredde} height="0.7" fill={S.treverk.lys} />
            <rect x={r2(x + bredde / 2 - 0.3)} y={ky} width="0.6" height="4.4" fill={S.treverk.skygge} />
          </g>
        )
      })}
    </g>
  )
}

/** Et ståbord med to gjester som drikker kaffe, på (x, y) = fortauet under bordet. */
function Staabord({ x, y, i, avstand = 'gate', bare = false }: { x: number; y: number; i: number; avstand?: Avstand; bare?: boolean }) {
  const h = r2(maal(avstand, 'person') * 0.6)
  return (
    <g>
      <ellipse cx={x} cy={r2(y + 0.3)} rx="3.4" ry="0.7" fill="#000000" opacity="0.2" />
      <rect x={r2(x - 0.3)} y={r2(y - h)} width="0.6" height={h} fill={S.metall.skygge} />
      <ellipse cx={x} cy={r2(y - h)} rx="3.6" ry="1" fill={S.metall.lys} />
      <rect x={r2(x - 1.6)} y={r2(y - h - 1.3)} width="1" height="1.3" fill={S.hvit.lys} />
      <rect x={r2(x + 0.8)} y={r2(y - h - 1.3)} width="1" height="1.3" fill={S.hvit.flate} />
      {!bare && <Kunde x={x - 5.4} y={y + 1.2} i={i} avstand={avstand} arm="opp" ting="kopp" />}
      {!bare && <Kunde x={x + 5.4} y={y + 1.2} i={i + 3} avstand={avstand} arm="holde" ting="kopp" />}
    </g>
  )
}

/** En kritt-tavle på to bein (fortauet): mørk plate med to linjer skrift. */
function Tavle({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={r2(x + 1.6)} y2={r2(y - 9.4)} stroke={S.treMork.flate} strokeWidth="0.7" />
      <line x1={r2(x + 7)} y1={y} x2={r2(x + 5.4)} y2={r2(y - 9.4)} stroke={S.treMork.flate} strokeWidth="0.7" />
      <rect x={r2(x + 0.7)} y={r2(y - 9)} width="5.6" height="7.2" fill={S.mork.skygge} stroke={S.treverk.flate} strokeWidth="0.5" />
      {[0, 1, 2].map((j) => (
        <rect key={j} x={r2(x + 1.7)} y={r2(y - 7.6 + j * 1.9)} width={j === 1 ? 2.4 : 3.6} height="0.5" fill={S.hvit.lys} opacity="0.85" />
      ))}
    </g>
  )
}

/** En moped med leveringsboks bak, vendt mot høyre, hjulene på `y`. */
function Moped({ x, y, farge = S.gran }: { x: number; y: number; farge?: Materiale }) {
  return (
    <g>
      <ellipse cx={r2(x + 8)} cy={r2(y + 0.2)} rx="9" ry="0.8" fill="#000000" opacity="0.22" />
      {[0, 12.4].map((dx) => (
        <g key={dx}>
          <circle cx={r2(x + dx)} cy={r2(y - 2.2)} r="2.2" fill={S.mork.skygge} />
          <circle cx={r2(x + dx)} cy={r2(y - 2.2)} r="0.8" fill={S.metall.flate} />
        </g>
      ))}
      <path d={`M${x} ${r2(y - 2.2)} L${r2(x + 4)} ${r2(y - 6.4)} L${r2(x + 11)} ${r2(y - 6.4)} L${r2(x + 12.4)} ${r2(y - 2.2)}`} fill={S.metall.flate} stroke={S.metall.skygge} strokeWidth="0.5" strokeLinejoin="round" />
      <rect x={r2(x + 3.4)} y={r2(y - 7.6)} width="5.6" height="1.5" rx="0.6" fill={S.mork.flate} />
      <rect x={r2(x - 3.8)} y={r2(y - 10.8)} width="6.6" height="5.8" fill={farge.flate} />
      <rect x={r2(x - 3.8)} y={r2(y - 10.8)} width="6.6" height="1.2" fill={farge.lys} />
      <line x1={r2(x + 12)} y1={r2(y - 6.4)} x2={r2(x + 11.2)} y2={r2(y - 10.4)} stroke={S.mork.flate} strokeWidth="0.6" />
      <line x1={r2(x + 10.2)} y1={r2(y - 10.4)} x2={r2(x + 12.8)} y2={r2(y - 10.4)} stroke={S.mork.flate} strokeWidth="0.6" />
    </g>
  )
}

/** En bil sett fra siden på fjern avstand (4,5 m = 11 enheter): `Bil` skalert ned, hjulene på y. */
function LitenBil({ x, y, farge = S.mork, taxi = false }: { x: number; y: number; farge?: Materiale; taxi?: boolean }) {
  const s = 0.37
  return (
    <g transform={`translate(${r2(x - 70 * s)} ${r2(y - 74.6 * s)}) scale(${s})`}>
      <Bil x={70} y={74.6} farge={farge} taxi={taxi} />
    </g>
  )
}

// ─────────────────────────────────────────────── Bedriftene

/**
 * Saftboden (nær): en kø av barn og voksne til venstre (én per steg til sju),
 * ballonger ved boden, vimpler over hele bildet, kasser med bær og en hund.
 */
const saftbod: Steg = (t, _f, k) => {
  const kø = [14, 12, 2, 0][t]
  return (
    <>
      {med(
        k,
        [3, <Vimpler x1={-40} x2={16} y={9} sig={4.4} n={7} />],
        [5, <Vimpler x1={16} x2={76} y={9} sig={5} n={8} />],
        [8, <Vimpler x1={76} x2={136} y={9} sig={4.4} n={8} />],
        [9, <Ballonger x={[74, 68, 82, 78][t]} y={[70, 64, 66, 66][t]} n={2} />],
        [2, <Ballonger x={[21, 20, 20, 20][t]} y={[70, 62, 66, 66][t]} />],
        [6, <Kasser x={[76, 70, 84, 80][t]} y={g + 4} n={t >= 2 ? 2 : 1} />],
      )}
      <Ko x0={kø} y={g + 5} mellom={8.4} fra={Math.min(k, 7)} avstand="naer" i0={t * 2} barn={t === 0 ? [0, 1, 2, 3, 4, 5, 6] : [3, 6]} />
      {k >= 10 && <Hund x={kø - 7 * 8.4 + 1} y={g + 5.5} />}
    </>
  )
}

/**
 * Pølseboden (gate): kø til venstre for bua, to ståbord med gjester til høyre,
 * vimpler, en sykkel og en hund.
 */
const polsebod: Steg = (t, _f, k) => {
  const x0 = [30, 24, 24, 24][t]
  const kunder = k >= 10 ? 6 : k >= 8 ? 5 : k >= 6 ? 4 : k >= 4 ? 3 : k >= 2 ? 2 : k
  return (
    <>
      {med(
        k,
        [3, <Staabord x={100} y={g + 3} i={1} />],
        [5, <Vimpler x1={-40} x2={48} y={9} sig={5} n={11} />],
        [5, <Vimpler x1={48} x2={136} y={9} sig={5} n={11} />],
        [7, <Sykkel x={122} y={g + 2} farge={S.petrol.flate} />],
        [9, <Staabord x={112} y={g + 4.5} i={4} />],
      )}
      <Ko x0={x0} y={g + 5} fra={kunder} avstand="gate" i0={t + 1} barn={[2]} />
      {k >= 10 && <Hund x={x0 - 6 * 7.4} y={g + 5.5} s={0.8} />}
    </>
  )
}

/**
 * Gatekjøkkenet (gate): kø ved vinduet, en leveringsmoped, en tavle med dagens,
 * et ståbord og vimpler.
 */
const gatekjokken: Steg = (t, _f, k) => {
  const x0 = [24, 6, -2, -2][t]
  const kunder = k >= 10 ? 6 : k >= 8 ? 5 : k >= 6 ? 4 : k >= 4 ? 3 : k >= 2 ? 2 : k
  return (
    <>
      {med(
        k,
        [3, <Vimpler x1={-40} x2={48} y={9} sig={5} n={11} />],
        [3, <Vimpler x1={48} x2={136} y={9} sig={5} n={11} />],
        [5, <Moped x={98} y={g + 10} />],
        [7, <Tavle x={54} y={g + 8} />],
        [9, <Kunde x={68} y={g + 7} i={2} avstand="gate" arm="opp" ting="kopp" />],
      )}
      <Ko x0={x0} y={g + 5} fra={kunder} avstand="gate" i0={t + 3} barn={[3]} />
    </>
  )
}

/**
 * Kiosken (gate): folk som venter på bussen, kunder foran disken, flere
 * sykler, en tavle og en hund.
 */
const kiosk: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Kunde x={-9} y={g + 1.6} i={1} avstand="gate" />],
      [2, <Kunde x={31} y={g + 5} i={2} avstand="gate" />],
      [3, <Sykkel x={88} y={g + 1} farge={S.gran.flate} />],
      [4, <Kunde x={-19} y={g + 1.6} i={5} avstand="gate" />],
      [5, <Vimpler x1={-40} x2={48} y={9} sig={5} n={11} />],
      [5, <Vimpler x1={48} x2={136} y={9} sig={5} n={11} />],
      [6, <Kunde x={53} y={g + 6} i={4} avstand="gate" />],
      [7, <Kunde x={77} y={g + 5.4} i={0} avstand="gate" barn />],
      [8, <Hund x={104} y={g + 4.5} s={0.8} />],
      [9, <Kunde x={-27} y={g + 1.8} i={3} avstand="gate" />],
      [10, <Kunde x={112} y={g + 5.6} i={3} avstand="gate" />],
    )}
  </>
)

/**
 * Kafeen (gate): gjester ved ståbord på fortauet, flere bord og en kø ved
 * døra, en tavle, lyslenker.
 */
const kafe: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [3, <Lyslenke x1={-40} x2={24} y={17} sig={4} n={10} />],
      [3, <Lyslenke x1={24} x2={136} y={17} sig={6} n={17} />],
      [1, <Staabord x={-6} y={g + 4} i={0} />],
      [2, <Kunde x={61} y={g + 5.5} i={3} avstand="gate" />],
      [4, <Staabord x={104} y={g + 4} i={2} />],
      [5, <Tavle x={64} y={g + 5} />],
      [6, <Kunde x={113} y={g + 7} i={6} avstand="gate" barn />],
      [7, <Staabord x={124} y={g + 4.6} i={5} />],
      [8, <Kunde x={66} y={g + 5} i={7} avstand="gate" />],
      [9, <Sykkel x={-30} y={g + 2.4} farge={S.marine.flate} />],
      [10, <Kunde x={-22} y={g + 5.4} i={6} avstand="gate" />],
    )}
  </>
)

/**
 * Restauranten (gate): gjester som venter utenfor, en moped med bestilling,
 * en lyslenke over gata og ståbord.
 */
const restaurant: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Kunde x={41} y={g + 5} i={2} avstand="gate" />],
      [2, <Kunde x={34} y={g + 5.6} i={4} avstand="gate" />],
      [3, <Lyslenke x1={-40} x2={48} y={11} sig={5} n={14} />],
      [3, <Lyslenke x1={48} x2={136} y={11} sig={5} n={14} />],
      [4, <Staabord x={108} y={g + 4} i={1} />],
      [5, <Kunde x={96} y={g + 6} i={5} avstand="gate" />],
      [6, <Tavle x={16} y={g + 4.4} />],
      [7, <Kunde x={27} y={g + 5} i={3} avstand="gate" />],
      [8, <Moped x={118} y={g + 6.4} farge={S.vin} />],
      [9, <Staabord x={-12} y={g + 4} i={6} />],
      [10, <Kunde x={104} y={g + 5.6} i={0} avstand="gate" barn />],
    )}
  </>
)

// ─────────────────────────────────────────────── Skip, fly og skiløpere

/**
 * Et skip sett fra siden, `L` langt og `h` høyt i skroget, vannlinja på `y` og
 * venstre kant i `x`. Baugen er til høyre, eller til venstre med `retning` −1.
 * `kasser` er antall containere på dekk (0 = et forsyningsskip eller en slepebåt).
 */
function Skip({ x, y, L, h = 3, retning = 1, skrog = S.marine, kasser = 0, skorstein = S.vin }: { x: number; y: number; L: number; h?: number; retning?: 1 | -1; skrog?: Materiale; kasser?: number; skorstein?: Materiale }) {
  const bro = r2(L * 0.2)
  const boks = r2(Math.max(1.6, L * 0.085))
  const farger = [S.vin.flate, S.gran.flate, S.oker.flate, S.hvit.flate, S.marine.lys]
  return (
    <g transform={retning === -1 ? `translate(${r2(2 * x + L)} 0) scale(-1 1)` : undefined}>
      <ellipse cx={r2(x + L / 2)} cy={r2(y + 0.5)} rx={r2(L * 0.55)} ry="0.8" fill={S.sjo.skygge} opacity="0.35" />
      <polygon points={`${x},${r2(y - h)} ${r2(x + L)},${r2(y - h)} ${r2(x + L - h * 1.7)},${y} ${r2(x + h * 0.5)},${y}`} fill={skrog.flate} />
      <polygon points={`${r2(x + h * 0.35)},${r2(y - h * 0.3)} ${r2(x + L - h * 1.25)},${r2(y - h * 0.3)} ${r2(x + L - h * 1.7)},${y} ${r2(x + h * 0.5)},${y}`} fill={S.vin.flate} />
      <rect x={x} y={r2(y - h - 0.4)} width={L} height="0.5" fill={skrog.lys} />
      {Array.from({ length: kasser }, (_, i) => (
        <rect key={i} x={r2(x + L * 0.38 + i * boks)} y={r2(y - h - boks * 0.8)} width={r2(boks - 0.2)} height={r2(boks * 0.8)} fill={farger[i % farger.length]} />
      ))}
      <rect x={r2(x + L * 0.1)} y={r2(y - h - h * 0.9)} width={bro} height={r2(h * 0.9)} fill={S.hvit.flate} />
      <rect x={r2(x + L * 0.1)} y={r2(y - h - h * 0.9)} width={bro} height="0.5" fill={S.hvit.lys} />
      <rect x={r2(x + L * 0.1 + 0.4)} y={r2(y - h - h * 0.6)} width={r2(bro - 0.8)} height="0.7" fill={S.glass.skygge} className="nattvindu" />
      <rect x={r2(x + L * 0.3 - 0.1)} y={r2(y - h - h * 0.75)} width={r2(Math.max(1.2, L * 0.05))} height={r2(h * 0.75)} fill={skorstein.flate} />
      <line x1={r2(x + L * 0.14)} y1={r2(y - h - h * 0.9)} x2={r2(x + L * 0.14)} y2={r2(y - h - h * 1.7)} stroke={S.mork.flate} strokeWidth="0.3" />
    </g>
  )
}

/** Et helikopter sett fra siden med snuten til høyre; rotoren flakser i scenen. */
function Heli({ x, y, farge = S.hvit }: { x: number; y: number; farge?: Materiale }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="-3,-0.9 -10,-1.3 -10.2,-3.3 -9.2,-3.3 -8.6,-1.6 -3,-0.2" fill={farge.skygge} />
      <ellipse cx="0" cy="0" rx="4.2" ry="2" fill={farge.flate} />
      <path d="M1.4 -1.7 Q3.8 -1.5 4.1 0.2 L1.4 0.2 Z" fill={S.glass.skygge} />
      <rect x="-2" y="-0.6" width="3" height="0.5" fill={S.vin.flate} />
      <line x1="-3" y1="2.6" x2="3" y2="2.6" stroke={S.mork.flate} strokeWidth="0.4" />
      <line x1="-1.6" y1="1.8" x2="-1.6" y2="2.6" stroke={S.mork.flate} strokeWidth="0.3" />
      <line x1="1.6" y1="1.8" x2="1.6" y2="2.6" stroke={S.mork.flate} strokeWidth="0.3" />
      <line x1="0" y1="-2" x2="0" y2="-3.2" stroke={S.mork.flate} strokeWidth="0.5" />
      <g className="anim-rotor">
        <rect x="-7.6" y="-3.6" width="15.2" height="0.5" rx="0.25" fill={S.mork.skygge} />
      </g>
    </g>
  )
}

/** Et par måker, hver en liten bue, på himmelen. */
function Maker({ pkt }: { pkt: [number, number][] }) {
  return (
    <g fill="none" stroke={S.hvit.lys} strokeWidth="0.45" strokeLinecap="round" opacity="0.9">
      {pkt.map(([x, y], i) => (
        <path key={i} d={`M${r2(x - 1.7)} ${y} Q${r2(x - 0.85)} ${r2(y - 1.3)} ${x} ${y} Q${r2(x + 0.85)} ${r2(y - 1.3)} ${r2(x + 1.7)} ${y}`} />
      ))}
    </g>
  )
}

/** En liten jack-up-rigg på horisonten (kommer i disen): dekk, fire bein og et boretårn. */
function Rigg({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 3, 6.4, 9.4].map((dx) => (
        <line key={dx} x1={r2(x + dx)} y1={r2(y - 3)} x2={r2(x + dx)} y2={r2(y + 2)} stroke={S.skifer.skygge} strokeWidth="0.5" />
      ))}
      <rect x={r2(x - 0.6)} y={r2(y - 4.4)} width="11" height="1.8" fill={S.skifer.flate} />
      <polygon points={`${r2(x + 6)},${r2(y - 4.4)} ${r2(x + 7)},${r2(y - 9.4)} ${r2(x + 8)},${r2(y - 4.4)}`} fill={S.skifer.skygge} />
      <rect x={r2(x + 1)} y={r2(y - 6.2)} width="2.8" height="1.8" fill={S.hvit.flate} />
    </g>
  )
}

/** En merd i havet, sett skrått ovenfra: ring med rekkverk, mørkt vann inni. */
function Merd({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={r2(y + 0.5)} rx={r2(r + 0.8)} ry={r2(r * 0.3 + 0.4)} fill={S.sjo.skygge} opacity="0.5" />
      <ellipse cx={x} cy={y} rx={r} ry={r2(r * 0.3)} fill={S.petrol.skygge} />
      <ellipse cx={x} cy={y} rx={r} ry={r2(r * 0.3)} fill="none" stroke={S.mork.flate} strokeWidth="1" />
      <ellipse cx={x} cy={r2(y - 0.9)} rx={r} ry={r2(r * 0.3)} fill="none" stroke={S.metall.lys} strokeWidth="0.35" />
      {[-0.8, -0.3, 0.25, 0.75].map((u) => (
        <rect key={u} x={r2(x + r * u - 0.2)} y={r2(y - 1.2)} width="0.4" height="1.3" fill={S.metall.flate} />
      ))}
    </g>
  )
}

/** En skiløper på vei ned bakken: ei jakke i `farge`, hjelm, ski og stavene. */
function Skiloper({ x, y, farge, retning = 1 }: { x: number; y: number; farge: string; retning?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${retning} 1)`}>
      <line x1="-2.4" y1="0" x2="2.6" y2="-0.4" stroke={S.mork.flate} strokeWidth="0.5" strokeLinecap="round" />
      <rect x="-0.5" y="-3.4" width="1.1" height="3" fill={S.mork.flate} />
      <rect x="-0.9" y="-6.6" width="1.9" height="3.4" rx="0.5" fill={farge} />
      <circle cx="0" cy="-7.4" r="0.9" fill={S.hud.flate} />
      <path d="M-1 -7.6 Q0 -9 1 -7.6 Z" fill={S.mork.skygge} />
      <line x1="0.9" y1="-5.6" x2="2.4" y2="-1" stroke={S.mork.skygge} strokeWidth="0.25" />
    </g>
  )
}

/** En tankbil på flyplassen (fjern avstand), vendt mot venstre, hjulene på `y`. */
function Tankbil({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={r2(x + 7)} cy={r2(y + 0.3)} rx="9" ry="0.8" fill="#000000" opacity="0.25" />
      <rect x={x} y={r2(y - 4.6)} width="3.6" height="3.4" fill={S.hvit.flate} />
      <rect x={r2(x + 0.5)} y={r2(y - 4.2)} width="2.2" height="1.4" fill={S.glass.skygge} />
      <rect x={r2(x + 3.8)} y={r2(y - 5.4)} width="10" height="4.2" rx="1.6" fill={S.vin.flate} />
      <rect x={r2(x + 3.8)} y={r2(y - 5.4)} width="10" height="1" rx="0.5" fill={S.vin.lys} />
      {[1.4, 6, 11.6].map((dx) => (
        <circle key={dx} cx={r2(x + dx)} cy={r2(y - 1)} r="1.1" fill={S.mork.skygge} />
      ))}
    </g>
  )
}

/** Et bagasjetog: et trekkvogn og `n` vogner med kofferter, hjulene på `y`. */
function Bagasjetog({ x, y, n = 3 }: { x: number; y: number; n?: number }) {
  return (
    <g>
      <rect x={x} y={r2(y - 3.6)} width="3.4" height="2.6" rx="0.5" fill={S.oker.flate} />
      {Array.from({ length: n }, (_, i) => {
        const vx = r2(x + 4.6 + i * 5.2)
        return (
          <g key={i}>
            <rect x={vx} y={r2(y - 2.2)} width="4.2" height="0.6" fill={S.metall.skygge} />
            <rect x={r2(vx + 0.4)} y={r2(y - 4.2)} width="1.6" height="2" fill={[S.vin.flate, S.marine.flate, S.treverk.flate][i % 3]} />
            <rect x={r2(vx + 2.2)} y={r2(y - 3.4)} width="1.6" height="1.2" fill={[S.gran.flate, S.oker.flate, S.hvit.skygge][i % 3]} />
            <circle cx={r2(vx + 0.9)} cy={r2(y - 0.9)} r="0.7" fill={S.mork.flate} />
            <circle cx={r2(vx + 3.3)} cy={r2(y - 0.9)} r="0.7" fill={S.mork.flate} />
          </g>
        )
      })}
      {[0.8, 2.6].map((dx) => (
        <circle key={dx} cx={r2(x + dx)} cy={r2(y - 0.9)} r="0.8" fill={S.mork.flate} />
      ))}
    </g>
  )
}

/** En buss (flyplass- eller turistbuss) på fjern avstand, vendt mot høyre. */
function Buss({ x, y, farge = S.oker }: { x: number; y: number; farge?: Materiale }) {
  return (
    <g>
      <ellipse cx={r2(x + 9)} cy={r2(y + 0.3)} rx="11" ry="0.9" fill="#000000" opacity="0.22" />
      <rect x={x} y={r2(y - 6)} width="18" height="5" rx="1" fill={farge.flate} />
      <rect x={x} y={r2(y - 6)} width="18" height="1" rx="0.5" fill={farge.lys} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={r2(x + 1.2 + i * 2.8)} y={r2(y - 5)} width="2" height="1.8" fill={S.glass.skygge} className="nattvindu" />
      ))}
      <rect x={r2(x + 15.4)} y={r2(y - 5)} width="2" height="3" fill={S.glass.skygge} />
      {[3.4, 14].map((dx) => (
        <circle key={dx} cx={r2(x + dx)} cy={r2(y - 1)} r="1.2" fill={S.mork.skygge} />
      ))}
    </g>
  )
}

// ─────────────────────────────────────────────── De store bedriftene

/**
 * Hotellet (fjern): biler og taxier som kjører opp foran, gjestene på fortauet,
 * en turistbuss og en lysløype langs inngangen.
 */
const hotell: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <LitenBil x={14} y={g + 8} farge={S.oker} taxi />],
      [2, <Kunde x={64} y={g + 4.4} i={2} avstand="fjern" />],
      [2, <Kunde x={67} y={g + 4.8} i={5} avstand="fjern" />],
      [3, <LitenBil x={96} y={g + 7.6} farge={S.vin} />],
      [4, <Kunde x={28} y={g + 5} i={4} avstand="fjern" />],
      [4, <Kunde x={31} y={g + 4.6} i={1} avstand="fjern" barn />],
      [5, <LitenBil x={114} y={g + 8.4} farge={S.oker} taxi />],
      [6, <Buss x={-30} y={g + 9} />],
      [7, <Kunde x={86} y={g + 5.4} i={6} avstand="fjern" />],
      [7, <Kunde x={89} y={g + 5} i={3} avstand="fjern" />],
      [8, <LitenBil x={36} y={g + 9.4} farge={S.marine} />],
      [9, <Kunde x={120} y={g + 5.6} i={7} avstand="fjern" />],
      [10, <LitenBil x={-8} y={g + 7.8} farge={S.mork} />],
    )}
  </>
)

/**
 * Banken (gate): kunder ved minibanken og foran trappa, en pengetransport og
 * en bud på sykkel.
 */
const bank: Steg = (t, _f, k) => (
  <>
    {med(
      k,
      [1, <Kunde x={[34, 26, 26, 26][t]} y={g + 6} i={1} avstand="gate" />],
      [2, <Kunde x={[26, 19, 19, 19][t]} y={g + 6.4} i={4} avstand="gate" />],
      [3, <Pengebil x={96} y={g + 9} />],
      [4, <Kunde x={46} y={g + 7} i={2} avstand="gate" />],
      [5, <Sykkel x={122} y={g + 3} farge={S.marine.flate} />],
      [6, <Kunde x={-22} y={g + 5} i={6} avstand="gate" />],
      [7, <Kunde x={70} y={g + 7} i={0} avstand="gate" />],
      [8, <Kunde x={-12} y={g + 6.4} i={5} avstand="gate" />],
      [9, <Kunde x={96} y={g + 4} i={3} avstand="gate" />],
      [10, <Kunde x={10} y={g + 6} i={7} avstand="gate" />],
    )}
  </>
)

/** En pengetransport: kassebil i grått med gullstripe, 3,6 m lang (komprimert), vendt mot høyre. */
function Pengebil({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={r2(x + 14)} cy={r2(y + 0.4)} rx="17" ry="1.1" fill="#000000" opacity="0.25" />
      <rect x={x} y={r2(y - 12)} width="22" height="10" rx="1" fill={S.skifer.flate} />
      <rect x={x} y={r2(y - 12)} width="22" height="1.6" rx="0.8" fill={S.skifer.lys} />
      <rect x={x} y={r2(y - 5.2)} width="22" height="1" fill={S.gull.flate} />
      <polygon points={`${r2(x + 22)},${r2(y - 8.4)} ${r2(x + 26)},${r2(y - 8.4)} ${r2(x + 28)},${r2(y - 4.6)} ${r2(x + 28)},${r2(y - 2)} ${r2(x + 22)},${r2(y - 2)}`} fill={S.skifer.lys} />
      <polygon points={`${r2(x + 22.8)},${r2(y - 7.8)} ${r2(x + 25.6)},${r2(y - 7.8)} ${r2(x + 27)},${r2(y - 5)} ${r2(x + 22.8)},${r2(y - 5)}`} fill={S.glass.skygge} />
      <rect x={r2(x + 14)} y={r2(y - 9.6)} width="4.4" height="2.6" fill={S.mork.skygge} />
      {[5, 22].map((dx) => (
        <g key={dx}>
          <circle cx={r2(x + dx)} cy={r2(y - 2)} r="2.4" fill={S.mork.skygge} />
          <circle cx={r2(x + dx)} cy={r2(y - 2)} r="0.9" fill={S.metall.flate} />
        </g>
      ))}
    </g>
  )
}

/**
 * Oljeselskapet (fjern, til havs): forsyningsskip og slepebåter, riggene på
 * horisonten, måker og flere helikoptre.
 */
const oljeselskap: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Skip x={-36} y={83} L={24} h={3} skrog={S.marine} />],
      [2, <Dis><Rigg x={-12} y={57} /></Dis>],
      [3, <Maker pkt={[[26, 22], [34, 17], [42, 24], [52, 15]]} />],
      [4, <Heli x={104} y={38} />],
      [5, <Skip x={22} y={95} L={22} h={3} skrog={S.petrol} retning={-1} />],
      [6, <Dis><Rigg x={92} y={57} /></Dis>],
      [7, <Dis><Skip x={-38} y={61} L={34} h={3.4} skrog={S.skifer} kasser={0} /></Dis>],
      [8, <Skip x={54} y={95} L={18} h={2.6} skrog={S.marine} />],
      [9, <Heli x={14} y={20} farge={S.oker} />],
      [10, <Skip x={96} y={72} L={22} h={3} skrog={S.petrol} retning={-1} />],
    )}
  </>
)

/**
 * Rederiet (fjern, i havn): slepebåter, flere skip som kommer og går, måker og
 * en losbåt.
 */
const rederi: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Skip x={96} y={84} L={12} h={2.6} skrog={S.vin} skorstein={S.hvit} />],
      [2, <Dis><Skip x={100} y={72} L={28} h={3.4} skrog={S.petrol} kasser={5} retning={-1} /></Dis>],
      [3, <Maker pkt={[[-24, 26], [-14, 20], [4, 28], [60, 16]]} />],
      [4, <Skip x={40} y={95} L={12} h={2.4} skrog={S.oker} />],
      [5, <Dis><Skip x={104} y={64} L={26} h={3} skrog={S.marine} kasser={4} /></Dis>],
      [6, <Skip x={8} y={95} L={13} h={2.4} skrog={S.vin} skorstein={S.hvit} retning={-1} />],
      [7, <Dis><Skip x={56} y={60} L={30} h={3} skrog={S.skifer} kasser={6} retning={-1} /></Dis>],
      [8, <Maker pkt={[[80, 24], [90, 30], [100, 20]]} />],
      [9, <Skip x={70} y={95} L={14} h={2.4} skrog={S.petrol} />],
      [10, <Maker pkt={[[110, 36], [120, 28], [128, 38]]} />],
    )}
  </>
)

/**
 * Oppdrettsanlegget (fjern): flere merder utover fjorden, en brønnbåt, en
 * fôrflåte til, hoppende laks og måker.
 */
const fiskeoppdrett: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Merd x={98} y={79} />],
      [2, <Merd x={116} y={79} />],
      [3, <Merd x={107} y={87} />],
      [4, <Merd x={125} y={87} />],
      [5, <Skip x={94} y={72} L={18} h={3} skrog={S.hvit} skorstein={S.petrol} retning={-1} />],
      [6, <Maker pkt={[[100, 54], [110, 48], [120, 56], [90, 60]]} />],
      [7, <Skip x={46} y={95} L={20} h={3} skrog={S.petrol} />],
      [8, <Merd x={89} y={90} />],
      [9, <Maker pkt={[[20, 40], [30, 34]]} />],
      [10, <Skip x={30} y={95} L={14} h={2.6} skrog={S.hvit} skorstein={S.oker} />],
    )}
  </>
)

/**
 * Flyselskapet (fjern, på flyplassen): fly i luften, flere kjøretøy på
 * oppstillingsplassen og en helikopterflyging.
 */
const flyselskap: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <g transform="rotate(-12 116 36)"><Passasjerfly x={102} gy={37} L={22} slag="jet" hale={S.marine.flate} /></g>],
      [2, <Tankbil x={96} y={g + 7} />],
      [3, <Bagasjetog x={30} y={g + 9.4} n={3} />],
      [4, <g transform="rotate(8 -18 44)"><Passasjerfly x={-32} gy={44} L={22} slag="propell" hale={S.vin.flate} /></g>],
      [5, <Buss x={62} y={g + 10} />],
      [6, <Bagasjetog x={-30} y={g + 7} n={2} />],
      [7, <Heli x={44} y={30} farge={S.vin} />],
      [8, <g transform="rotate(-10 46 14)"><Passasjerfly x={34} gy={15} L={22} slag="jet" hale={S.oker.flate} /></g>],
      [9, <Tankbil x={-4} y={g + 11} />],
      [10, <Bagasjetog x={110} y={g + 10} n={2} />],
    )}
  </>
)

/**
 * Skisenteret (fjern): skiløpere nedover løypene, flere i køen, en
 * rednings-helikopter og en tråkkemaskin.
 */
const skisenter: Steg = (_t, _f, k) => (
  <>
    {med(
      k,
      [1, <Skiloper x={50} y={46} farge={S.vin.flate} />],
      [2, <Skiloper x={72} y={48} farge={S.marine.lys} retning={-1} />],
      [3, <Skiloper x={44} y={58} farge={S.oker.flate} />],
      [4, <Skiloper x={82} y={58} farge={S.gran.lys} retning={-1} />],
      [5, <Skiloper x={58} y={54} farge={S.vin.lys} />],
      [6, <Skiloper x={98} y={90} farge={S.hvit.flate} retning={-1} />],
      [7, <Skiloper x={20} y={92} farge={S.petrol.flate} />],
      [8, <Skiloper x={34} y={94} farge={S.oker.lys} />],
      [9, <Heli x={36} y={13} farge={S.vin} />],
      [10, <Skiloper x={86} y={52} farge={S.oker.flate} retning={-1} />],
    )}
  </>
)

// ─────────────────────────────────────────────── Oppslag

/** Stegene, etter bedriftens id. `Trinnsteg` i Illustrasjoner.tsx slår opp her når delen er lastet. */
export const TRINNSTEG: Record<string, Steg> = {
  saftbod,
  polsebod,
  gatekjokken,
  kiosk,
  kafe,
  restaurant,
  hotell,
  bank,
  oljeselskap,
  rederi,
  fiskeoppdrett,
  flyselskap,
  skisenter,
}
