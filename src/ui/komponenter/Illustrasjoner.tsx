/**
 * Illustrasjonene for bedrifter, eiendom og luksus. Se dem store på ?galleri,
 * der stilarket øverst viser paletten, bakkene og de tre avstandene.
 *
 * KUNSTRETNINGEN (Grafikkpakke G1). Alle tegninger følger den (G1–G9).
 *
 * Uttrykket: rolige, voksne tegninger som hører hjemme i et mørkt og gyllent
 * grensesnitt — som illustrasjonene i en næringslivsavis, ikke et mobilspill.
 *
 * - Lerret: 96 × 96 (`Lerret` i Tegnestil.tsx). Små ikoner er den samme
 *   tegningen skalert ned, så detaljer under ~1 enhet forsvinner i lista.
 *   Ingen `<text>`: bokstaver og tall tegnes som streker.
 * - Farger: bare paletten `S`, dempede nordiske toner (metning under 50 %).
 *   Gull er den eneste klare fargen og brukes sparsomt: plaketter, beslag,
 *   detaljer som skal se dyre ut.
 * - Lys: alltid ovenfra til venstre. Hvert materiale har tre toner — `lys` på
 *   flater som vender mot lyset (tak, venstre kanter), `flate` på fronten og
 *   `skygge` på siden bort fra lyset. Glass og lakk får `Glans`, bunnen av
 *   en vegg `Bunnskygge`.
 * - Dybde: skrått sett. Fronten er rett på, og dybden går opp og til høyre
 *   (`DYBDE`), så vi ser siden mot høyre i skygge (`Kloss`, `Saltak`).
 * - Skygge: hver ting kaster en myk `Slagskygge` mot høyre og inn i bildet,
 *   og har en mørk kontaktskygge der den møter bakken.
 * - Bakke: alt står på `GRUNNLINJE` (y = 84) og på en `Bakke` som passer
 *   motivet — fortau for forretninger, gress for hus, kai for båter, blankt
 *   gulv for biler, snø i fjellet. Bakken blekner ut mot sidene.
 * - Himmel: en svak himmel som blekner ut mot kantene, ingen hard boks.
 *   Biler står inne (`himmel="inne"`), med lys ovenfra.
 * - Målestokk: hvert motiv ses fra én av tre avstander (`METER`), og alt på
 *   samme avstand har samme mål — en person, en dør, en etasje (`maal`).
 *   Nær (18 enheter/m): biler, klokker, boder. Gate (10): hus og forretninger.
 *   Fjern (2,5): tårn, anlegg og store bygg. Det som står langt bak, får `Dis`.
 *   Unntak (G5): klokkene er et nærbilde i skrinet sitt — en klokke er fire
 *   centimeter. Kjøretøy uten folk ved siden av (biler, fly, båter) kan presses
 *   litt i lengden så de får plass, men aldri i høyden.
 *   Hus i to etasjer er det høyeste som får plass på gateavstand; blokker,
 *   bygårder og rekker står fjernt.
 * - Mennesker: `Person` i riktig målestokk, i palettens klær. De gir
 *   tegningen størrelse og liv, så bruk dem der det passer.
 * - Former: flate former med tre toner, ingen omriss. Streker bare for tynne
 *   ting (stag, sprosser, skjøter).
 *
 * Bedriftene (G2) er steder, ikke varer, og stedet selv vokser med nivået
 * (trinn 0–3 ved nivå 1, 25, 50 og 100): ved 25 blir det større (boden blir en
 * bu, kafeen tar over nabobutikken, hotellet får etasjer, feltet en plattform
 * til), ved 50 kommer kunder eller trafikk (folk, båter, fly), og ved 100
 * finere materialer, varmt lys og gullplaketten (`Plakett`). Hver av de tre
 * forbedringene legger til sin egen detalj (`f` = hvor mange som er kjøpt),
 * synlig på alle trinn, så du ser hva du har investert i. De små bedriftene
 * står på gateavstand (saftboden nær), de store sees fjernt — selve driften:
 * plattformen, skipet, merdene, flyplassen og fjellet. Banken er unntaket:
 * bygget er bedriften. Til havs brukes `Bakke type="hav"` med horisont.
 *
 * Noen deler har en `anim-`-klasse (damp, røyk, flagg, flamme, bølger …).
 * De beveger seg bare på den store scenen i detaljvisningene, og aldri når
 * spilleren har bedt om mindre bevegelse — se styles/tegninger.css og styles/grunnlag.css.
 *
 * Historie: til og med G8 sto noen tegninger i den gamle stilen (48 × 48,
 * paletten `F`, én `Grunn`, flate former sett fra siden). G9 tegnet de ti siste
 * om, og den gamle stilen er borte. Alle tegninger står i `NY_STIL`.
 */

import { memo, useContext, type ReactNode } from 'react'
import { useDel, vedBehov } from '../vedBehov'
import { r2, Blinklys, Fullramme, IScenen, tennesOmNatta, Naerbilde, Bakke, Bunnfade, Dis, GRUNNLINJE, HORISONT, Utklipp, Kantfade, Kloss, Folk, Spiser, haand, figurskala, Lampe, Lerret, Person as Figur, Plakett, S, Saltak, Slagskygge, Bunnskygge, Glans, Tre, Vindusrad, inn, maal, pkt, type Materiale } from './Tegnestil'

export type P = { størrelse?: number }
/** Hvor langt en bedrift har vokst: 0 ved nivå 1, 1 ved 25, 2 ved 50, 3 ved 100. */
export type Trinn = 0 | 1 | 2 | 3

export function trinnFor(nivaa: number | undefined): Trinn {
  if (!nivaa) return 0
  return nivaa >= 100 ? 3 : nivaa >= 50 ? 2 : nivaa >= 25 ? 1 : 0
}

/**
 * Stegene mellom vekstrinnene (G16): for hvert femte nivå inne i et trinn
 * kommer det noe nytt i scenen — flere kunder, en lengre kø, flere bord. 0 der
 * trinnet starter; høyst 4 før nivå 25 og 50, 9 før nivå 100 og 10 derfra, til
 * nivå 150. Tegningene ligger i `ved-behov/Trinnsteg.tsx` og vises bare i scenen.
 */
export function stegFor(nivaa: number | undefined): number {
  if (!nivaa || nivaa < 1) return 0
  const start = nivaa >= 100 ? 100 : nivaa >= 50 ? 50 : nivaa >= 25 ? 25 : 0
  return Math.min(Math.floor(nivaa / 5) - Math.floor(start / 5), 10)
}

// ─────────────────────────────────────────────── Felles byggeklosser

/** En bedriftstegning: vekstrinnet og hvor mange forbedringer som er kjøpt (0–3). */
type B = (trinn: Trinn, f: number) => ReactNode

// ─────────────────────────────────────────────── Bedrifter

/**
 * Bokstavene til skiltene (SAFT, SENNEP), hver i en boks fra 0 til 1, tegnet
 * som streker. Ingen `<text>` — bokstavene er stier.
 */
const BOKSTAVER: Record<string, string> = {
  S: 'M0.92 0.16 Q0.78 0 0.5 0 Q0.08 0 0.1 0.27 Q0.12 0.48 0.5 0.5 Q0.92 0.52 0.9 0.76 Q0.88 1 0.5 1 Q0.2 1 0.06 0.84',
  A: 'M0 1 L0.5 0 L1 1 M0.22 0.62 L0.78 0.62',
  F: 'M0.12 1 L0.12 0 L0.95 0 M0.12 0.48 L0.75 0.48',
  T: 'M0 0 L1 0 M0.5 0 L0.5 1',
  E: 'M0.9 0 L0.12 0 L0.12 1 L0.9 1 M0.12 0.48 L0.7 0.48',
  N: 'M0.1 1 L0.1 0 L0.9 1 L0.9 0',
  P: 'M0.12 1 L0.12 0 L0.6 0 Q0.95 0 0.95 0.27 Q0.95 0.54 0.6 0.54 L0.12 0.54',
}

/** Bredden på et ord tegnet med `Ord`: hver bokstav 0,66 × h, med 0,28 × h mellom. */
const ordbredde = (tekst: string, h: number) => r2(tekst.length * h * 0.66 + (tekst.length - 1) * h * 0.28)

/**
 * Et ord malt for hånd, `h` høyt, med øvre venstre hjørne i (x, y). Bare
 * bokstavene i `BOKSTAVER`. Regn ut bredden med `ordbredde` før du setter
 * det på et skilt.
 */
function Ord({ tekst, x, y, h, farge, bredde }: { tekst: string; x: number; y: number; h: number; farge: string; bredde: number }) {
  const b = h * 0.66
  const mellom = h * 0.28
  const d = [...tekst].map((bokstav, i) => {
    const s = BOKSTAVER[bokstav]
    const x0 = x + i * (b + mellom)
    return s.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, px: string, py: string) => `${r2(x0 + Number(px) * b)} ${r2(y + Number(py) * h)}`)
  }).join(' ')
  return <path d={d} fill="none" stroke={farge} strokeWidth={bredde} strokeLinecap="round" strokeLinejoin="round" />
}

/**
 * Byen bak (G13): en rad hus i disen fra x `fra` til `til`, med grunnmuren på
 * `y` (fortauets bakkant). Husene står fjernt (8 enheter per etasje, `METER`),
 * to til fire etasjer, med flatt tak eller saltak, og om natta tennes de fleste
 * vinduene. `start` forskyver mønsteret, så to tegninger ikke får samme gate.
 * Gir de små bedriftene på gateavstand en by rundt seg i den brede rammen. Med
 * `dis={false}` står husene på samme avstand som motivet (hotellets torg, G14).
 */
function Byrekke({ fra = -40, til = 136, y = 68, start = 0, dis = true }: { fra?: number; til?: number; y?: number; start?: number; dis?: boolean }) {
  const FASADER = [S.puss, S.tegl, S.oker, S.hvit, S.faluRod, S.stein, S.petrol]
  const MÅL: [number, number, boolean][] = [
    [14, 3, false],
    [10, 2, true],
    [18, 4, false],
    [12, 3, true],
    [16, 2, false],
    [11, 3, false],
    [13, 4, true],
  ]
  const hus: { x: number; b: number; et: number; saltak: boolean; m: Materiale }[] = []
  for (let x = fra, i = start; x < til; i++) {
    const [b, et, saltak] = MÅL[i % MÅL.length]
    hus.push({ x, b, et, saltak, m: FASADER[(i * 3 + 1) % FASADER.length] })
    x += b + (i % 3 === 1 ? 1.6 : 0)
  }
  const rekke = (
    <>
      {hus.map(({ x, b, et, saltak, m }) => {
        const h = et * 8
        const kolonner = Math.max(1, Math.floor((b - 2) / 3.6))
        const marg = r2((b - kolonner * 3.6 + 1.6) / 2)
        return (
          <g key={x}>
            <rect x={x} y={y - h} width={b} height={h} fill={m.flate} />
            <rect x={r2(x + b - 1.6)} y={y - h} width="1.6" height={h} fill={m.skygge} opacity="0.6" />
            {saltak ? (
              <polygon points={pkt([x - 0.6, y - h], [x + b / 2, y - h - 6], [x + b + 0.6, y - h])} fill={S.skifer.flate} />
            ) : (
              <rect x={r2(x - 0.4)} y={r2(y - h - 1.2)} width={r2(b + 0.8)} height="1.2" fill={m.skygge} />
            )}
            {Array.from({ length: et }, (_, e) =>
              Array.from({ length: kolonner }, (_, k) => {
                const vx = r2(x + marg + k * 3.6)
                const vy = r2(y - h + 2.4 + e * 8)
                return <rect key={`${e}-${k}`} x={vx} y={vy} width="2" height="3" fill={S.glass.skygge} className={tennesOmNatta(vx, vy) ? 'nattvindu' : undefined} />
              }),
            )}
          </g>
        )
      })}
    </>
  )
  return dis ? <Dis>{rekke}</Dis> : <g>{rekke}</g>
}

/**
 * En bil sett fra siden på gateavstand (G13: hentet ut av pølsebodens taxi),
 * fronten til venstre, 30 enheter lang, med hjulene på `y`. `taxi` gir
 * taklampa.
 */
export function Bil({ x, y = 74.6, farge = S.mork, taxi = false }: { x: number; y?: number; farge?: Materiale; taxi?: boolean }) {
  const dy = r2(y - 74.6)
  return (
    <g transform={x === 70 && dy === 0 ? undefined : `translate(${r2(x - 70)} ${dy})`}>
      <Slagskygge x1={70} x2={100} y={76} lengde={6} d={6} />
      <polygon points="70,72 74,67.6 100,67.6 100,74.6 70,74.6" fill={farge.lys} />
      <polygon points="76,67.6 80,62.6 94,62.6 98,67.6" fill={farge.flate} />
      <polygon points="77.6,67.2 80.6,63.2 86.4,63.2 86.4,67.2" fill={S.glass.skygge} />
      <polygon points="87.4,67.2 87.4,63.2 93.4,63.2 96.4,67.2" fill={S.glass.skygge} />
      {taxi && (
        <>
          <rect x="84" y="60.6" width="5" height="2" rx="0.4" fill={S.vinduLys.lys} />
          <rect x="85" y="61.3" width="3" height="0.5" fill={S.mork.flate} opacity="0.6" />
        </>
      )}
      <rect x="70" y="70.4" width="1.6" height="1.2" fill={S.vinduLys.flate} />
      {[76, 94].map((hx) => (
        <g key={hx}>
          <circle cx={hx} cy="74.6" r="2.6" fill={S.mork.skygge} />
          <circle cx={hx} cy="74.6" r="1" fill={S.metall.flate} />
        </g>
      ))}
    </g>
  )
}

/** En sykkel på gateavstand. */
export function Sykkel({ x, y = GRUNNLINJE, farge = S.vin.flate }: { x: number; y?: number; farge?: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 3.4} r="3.4" fill="none" stroke={S.mork.flate} strokeWidth="0.7" />
      <circle cx={x + 10.6} cy={y - 3.4} r="3.4" fill="none" stroke={S.mork.flate} strokeWidth="0.7" />
      <path d={`M${x} ${y - 3.4} L${x + 4} ${y - 9} L${x + 9} ${y - 9} L${x + 10.6} ${y - 3.4} M${x + 4} ${y - 9} L${x + 5.6} ${y - 3.4} L${x + 9} ${y - 9} M${x + 3.4} ${y - 10.4} h2 M${x + 9} ${y - 9} l-0.6 -2 h2`} fill="none" stroke={farge} strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  )
}

/**
 * Et busskur på gateavstand (G13): glassvegger i stålramme, tak og en benk,
 * 3 m bredt og 2,5 m høyt, med venstre hjørne i `x` og foten på `y`.
 */
function Busskur({ x, y = GRUNNLINJE - 4 }: { x: number; y?: number }) {
  return (
    <g>
      <Slagskygge x1={x} x2={x + 30} y={y} lengde={6} d={6} />
      <rect x={x} y={y - 24} width="30" height="24" fill={S.glass.lys} opacity="0.3" />
      <rect x={r2(x + 1.2)} y={y - 22} width="9" height="20" fill={S.glass.lys} opacity="0.25" className="nattskjul" />
      {[0, 14.6, 29].map((dx) => (
        <rect key={dx} x={r2(x + dx)} y={y - 25} width="1" height="25" fill={S.metall.skygge} />
      ))}
      <rect x={r2(x - 1)} y={y - 26.4} width="32" height="1.8" fill={S.metall.flate} />
      <rect x={r2(x - 1)} y={y - 24.6} width="32" height="0.6" fill={S.mork.flate} opacity="0.4" />
      {/* Benken og ruteplanen. */}
      <rect x={r2(x + 3)} y={y - 6} width="22" height="1.2" fill={S.treverk.flate} />
      <rect x={r2(x + 5)} y={y - 4.8} width="0.8" height="4.8" fill={S.mork.flate} />
      <rect x={r2(x + 22)} y={y - 4.8} width="0.8" height="4.8" fill={S.mork.flate} />
      <rect x={r2(x + 17)} y={y - 20} width="7" height="9" fill={S.hvit.lys} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={r2(x + 18)} y={r2(y - 18.6 + i * 2)} width={i % 2 ? 3.6 : 5} height="0.6" fill={S.mork.lys} />
      ))}
      {/* Holdeplasskiltet på stang. */}
      <rect x={r2(x - 6)} y={y - 30} width="0.8" height="30" fill={S.metall.skygge} />
      <circle cx={r2(x - 5.6)} cy={y - 31} r="2.8" fill={S.oker.flate} />
      <rect x={r2(x - 7.2)} y={y - 31.6} width="3.2" height="1.2" fill={S.mork.flate} />
    </g>
  )
}

/**
 * Et hus i en gaterekke på gateavstand (G14): fasaden i `m`, en gesims øverst
 * og vinduer i etasjene over butikken (de fleste tennes om natta). Butikkfronten
 * står i `children`, mellom y 52 og grunnlinja. Står husene i rekke, tegnes de
 * til høyre etter naboen, så sideveggen bak dekkes som i en ekte gate.
 */
function Gatehus({ x, b, h, m, d = 18, children }: { x: number; b: number; h: number; m: Materiale; d?: number; children?: ReactNode }) {
  const topp = GRUNNLINJE - h
  const etasjer = Math.max(0, Math.floor((52 - topp - 4) / 13))
  const antall = Math.max(1, Math.floor((b - 6 + 4) / 10))
  const mellom = antall > 1 ? r2((b - 6 - antall * 6) / (antall - 1)) : 0
  return (
    <g>
      <Kloss x={x} b={b} h={h} d={d} m={m} />
      {/* Skyggen nederst på veggen før vinduene: tegnet over dem ble den svart i nattlaget og slukket lyset. */}
      <Bunnskygge x={x} y={topp} b={b} h={h} />
      <Kloss x={x - 0.6} y={r2(topp + 2.2)} b={b + 1.2} h={2.2} d={d + 1} m={S.hvit} />
      {Array.from({ length: etasjer }, (_, e) => (
        <Vindusrad key={e} x={x + 3} y={r2(topp + 5 + e * 13)} antall={antall} b={6} h={8.6} mellom={mellom} karm={S.hvit.lys} />
      ))}
      {children}
    </g>
  )
}

/** En butikkfront på gateavstand (G14): et vindu med karm og glans, og en dør til høyre. */
function Butikkvindu({ x, b, karm = S.treMork.flate, lys = false, children }: { x: number; b: number; karm?: string; lys?: boolean; children?: ReactNode }) {
  const g = GRUNNLINJE
  return (
    <g>
      <rect x={x} y="59" width={b} height="19" fill={lys ? S.vinduLys.skygge : S.glass.skygge} className={lys ? undefined : 'nattvindu'} />
      {children}
      <Glans points={pkt([x, 59], [x + b * 0.35, 59], [x + 2, 78], [x, 78])} />
      <rect x={x} y="59" width={b} height="19" fill="none" stroke={karm} strokeWidth="0.9" />
      <rect x={r2(x + b + 2.4)} y={g - 21} width="7.4" height="21" fill={karm} />
      <rect x={r2(x + b + 3.6)} y={g - 19} width="5" height="9" fill={S.glass.skygge} className="nattvindu" />
      <circle cx={r2(x + b + 8.6)} cy={g - 9} r="0.5" fill={S.gull.flate} />
    </g>
  )
}

/**
 * Et kafébord på nær avstand (G13): et rundt bord, 75 cm høyt og 60 cm bredt, på
 * én fot, med en bistrostol på hver side. Står med foten i (x, y). Med `glass`
 * står det et glass saft på bordet.
 */
function Kafebord({ x, y, glass = false }: { x: number; y: number; glass?: boolean }) {
  const topp = r2(y - 13.5)
  const stol = (sx: number, vendt: 1 | -1) => (
    <g>
      <rect x={r2(sx - 0.4)} y={r2(y - 8)} width="0.8" height="8" fill={S.mork.flate} />
      <rect x={r2(sx + vendt * 4.4)} y={r2(y - 8)} width="0.8" height="8" fill={S.mork.flate} />
      <rect x={r2(Math.min(sx, sx + vendt * 5) - 0.6)} y={r2(y - 8.6)} width="6.4" height="1.2" rx="0.5" fill={S.treverk.lys} />
      <rect x={r2(sx - 0.4)} y={r2(y - 15.6)} width="0.8" height="7.2" fill={S.mork.flate} />
      <rect x={r2(sx - 0.8)} y={r2(y - 15.6)} width="1.6" height="4" rx="0.6" fill={S.treverk.flate} />
    </g>
  )
  return (
    <g>
      <ellipse cx={x} cy={r2(y + 0.4)} rx="9" ry="1.2" fill="#000000" opacity="0.18" />
      {stol(r2(x - 9), 1)}
      {stol(r2(x + 9), -1)}
      <ellipse cx={x} cy={y} rx="2.4" ry="0.6" fill={S.mork.flate} />
      <rect x={r2(x - 0.5)} y={topp} width="1" height="13.5" fill={S.mork.lys} />
      <ellipse cx={x} cy={r2(topp + 0.5)} rx="5.6" ry="1.4" fill={S.metall.skygge} />
      <ellipse cx={x} cy={topp} rx="5.6" ry="1.4" fill={S.metall.lys} />
      {glass && <Saftglass x={r2(x - 1)} y={r2(topp - 3.2)} h={3} />}
    </g>
  )
}

/** Et glass rød saft med sugerør, `h` høyt, med øvre venstre hjørne i (x, y): saftbodens merke. */
function Saftglass({ x, y, h }: { x: number; y: number; h: number }) {
  const b = h * 0.72
  return (
    <g>
      <line x1={r2(x + b * 0.62)} y1={r2(y + h * 0.35)} x2={r2(x + b * 0.95)} y2={r2(y - h * 0.3)} stroke={S.hvit.lys} strokeWidth={r2(h * 0.09)} strokeLinecap="round" />
      <polygon points={pkt([x, y], [x + b, y], [x + b * 0.86, y + h], [x + b * 0.14, y + h])} fill={S.glass.lys} />
      <polygon points={pkt([x + b * 0.05, y + h * 0.3], [x + b * 0.95, y + h * 0.3], [x + b * 0.86, y + h], [x + b * 0.14, y + h])} fill={S.vin.lys} />
      <polygon points={pkt([x + b * 0.1, y + h * 0.3], [x + b * 0.3, y + h * 0.3], [x + b * 0.32, y + h * 0.92], [x + b * 0.2, y + h * 0.92])} fill={S.hvit.lys} opacity="0.35" />
    </g>
  )
}

/**
 * En batterilykt, stående med bunnen på (x, y). Slukket om dagen; om natta
 * tennes glasset (`nattvindu`) og natt-laget gir det en glorie.
 */
function Lykt({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={r2(y - 1)} width="3.4" height="1" rx="0.3" fill={S.mork.lys} />
      <rect x={r2(x + 0.3)} y={r2(y - 5)} width="2.8" height="4" fill={S.glass.skygge} className="nattvindu" />
      <rect x={r2(x + 0.9)} y={r2(y - 4.6)} width="0.6" height="3.2" fill={S.glass.lys} opacity="0.5" className="nattskjul" />
      <rect x={r2(x + 0.3)} y={r2(y - 5)} width="0.5" height="4" fill={S.mork.lys} />
      <rect x={r2(x + 2.6)} y={r2(y - 5)} width="0.5" height="4" fill={S.mork.lys} />
      <polygon points={pkt([x, y - 5], [x + 3.4, y - 5], [x + 2.7, y - 6.2], [x + 0.7, y - 6.2])} fill={S.mork.flate} />
      <path d={`M${r2(x + 0.9)} ${r2(y - 6.2)} Q${r2(x + 1.7)} ${r2(y - 8.2)} ${r2(x + 2.5)} ${r2(y - 6.2)}`} fill="none" stroke={S.mork.lys} strokeWidth="0.4" />
    </g>
  )
}

/**
 * En veps som sirkler over saften — bare i scenen, der den flyr i en liten
 * sløyfe og vingene dirrer. I lista ville den vært et prikk.
 */
function Veps({ x, y }: { x: number; y: number }) {
  if (!useContext(IScenen)) return null
  return (
    <g className="anim-veps">
      <g className="anim-vinge">
        <ellipse cx={r2(x - 0.2)} cy={r2(y - 0.7)} rx="0.55" ry="0.7" fill={S.hvit.lys} opacity="0.7" />
        <ellipse cx={r2(x + 0.35)} cy={r2(y - 0.65)} rx="0.5" ry="0.65" fill={S.hvit.lys} opacity="0.55" />
      </g>
      <ellipse cx={x} cy={y} rx="0.9" ry="0.5" fill={S.oker.lys} />
      <rect x={r2(x - 0.3)} y={r2(y - 0.5)} width="0.3" height="1" fill={S.mork.skygge} />
      <rect x={r2(x + 0.25)} y={r2(y - 0.5)} width="0.3" height="1" fill={S.mork.skygge} />
      <circle cx={r2(x - 1)} cy={y} r="0.38" fill={S.mork.skygge} />
    </g>
  )
}

/**
 * Kanna selgeren skjenker fra, med strålen ned i koppen på disken. Kanna
 * henger i hånda (`h`, lerretets enheter) og er vippet; i scenen rettes den
 * opp og vippes igjen (`anim-skjenk`), og strålen kommer bare når den heller.
 * `bunn` er der koppen står.
 */
function Skjenk({ h, k, bunn }: { h: [number, number]; k: number; bunn: number }) {
  const [hx, hy] = h
  const VIPP = 35
  // Tuten etter vippen, i lerretets enheter: (4.2, −2.6) fra hånda, dreid VIPP grader.
  const v = (VIPP * Math.PI) / 180
  const tx = r2(hx + (4.2 * Math.cos(v) + 2.6 * Math.sin(v)) * k)
  const ty = r2(hy + (4.2 * Math.sin(v) - 2.6 * Math.cos(v)) * k)
  const koppTopp = r2(bunn - 2.6)
  return (
    <g>
      {/* Koppen som fylles. */}
      <polygon points={pkt([tx - 1.2, koppTopp], [tx + 1.2, koppTopp], [tx + 0.95, bunn], [tx - 0.95, bunn])} fill={S.hvit.lys} />
      <rect x={r2(tx - 1.05)} y={r2(koppTopp + 0.3)} width="2.1" height="0.8" fill={S.vin.lys} opacity="0.8" />
      <rect className="anim-strale" x={r2(tx - 0.35)} y={ty} width="0.7" height={r2(koppTopp + 0.6 - ty)} rx="0.35" fill={S.vin.lys} />
      <g className="anim-skjenk" style={{ transformBox: 'view-box', transformOrigin: `${hx}px ${hy}px` }}>
        <g transform={`translate(${hx} ${hy}) scale(${k}) rotate(${VIPP})`}>
          <path d="M0.6 -1.6 Q-0.6 -0.4 0.6 0.9" fill="none" stroke={S.glass.flate} strokeWidth="0.5" />
          <rect x="0.6" y="-2.2" width="2.8" height="3.8" rx="0.4" fill={S.glass.lys} opacity="0.7" />
          <rect x="0.8" y="-1.1" width="2.4" height="2.5" rx="0.3" fill={S.vin.lys} />
          <polygon points="3.4,-2.2 4.2,-2.6 3.4,-1.5" fill={S.glass.lys} />
          <rect x="1.1" y="-2" width="0.5" height="3.2" fill={S.hvit.lys} opacity="0.5" />
        </g>
      </g>
    </g>
  )
}

/**
 * Saftboden (nær avstand) — rød saft, og et sted som vokser med boden:
 * på nivå 1 et bord ved hageporten, med et barn bak og et pappskilt med SAFT
 * teipet til bordkanten, og porten åpen mot et hus i hagen; fra 25 en ordentlig bod med stripet markise utenfor en
 * butikk, og en ungdom i caps bak disken; ved 50 strandpromenaden, med eieren
 * og en hjelper, en sidebod med bærkurver og kunder i kø (én betaler med kort); og ved 100 et torg med
 * brostein, gatelykt, hvitmalt disk med messingkant og lyslenke. Forbedringene:
 * saftpresse med bær, en stålbalje med isbiter (og dugg på dunkene) og en egen
 * sukkerfri dunk med grønn etikett. Selgeren skjenker hele tiden; i scenen
 * vipper kanna, en kunde drikker, skiltet og markisen rører seg, og en veps
 * sirkler over saften. Lykta og gatelykta er slukket om dagen og tennes om
 * natta. Dunkene, koppene og bærene har sine virkelige mål på nær avstand
 * (en dunk 9,5 enheter ≈ 50 cm, en kopp 2,6 ≈ 14 cm, en bærkurv 2,2 ≈ 12 cm).
 */
const saftbod: B = (t, f) => {
  const g = GRUNNLINJE
  const bod = t >= 1
  const disk = bod ? { x: 22, b: 44, y: 68 } : { x: 22, b: 48, y: 70 }
  const x0 = disk.x
  const fot = r2(disk.y - 1.2)
  const panel = t >= 3 ? S.hvit : S.oker
  // Hvor tingene står på disken, fra venstre.
  const plass = bod ? { dunk: 25, sukkerfri: 32.8, presse: 40.5, is: 48.4, kopper: 55.5 } : { dunk: 24, sukkerfri: 31.8, presse: 61.4, is: 73, kopper: 50.6 }
  // Isen står i disken fra 25; ved bordet står isbøtta på gresset.
  const isb = bod ? fot : g + 1.5
  const dunk = (x: number, liten: boolean, sukkerfri: boolean) => {
    const h = liten ? 7.5 : 9.5
    const b = liten ? 5.5 : 7
    const topp = r2(fot - h)
    return (
      <g>
        <rect x={x} y={topp} width={b} height={h} rx="1.2" fill={S.vin.lys} />
        <rect x={x} y={topp} width={b} height={r2(h * 0.3)} rx="1.2" fill={S.hvit.lys} opacity="0.55" />
        <rect x={r2(x + b - 2)} y={topp} width="2" height={h} fill={S.vin.flate} opacity="0.6" />
        {sukkerfri ? (
          <>
            <rect x={x} y={r2(fot - h * 0.62)} width={b} height="2.4" fill={S.lov.lys} />
            <circle cx={r2(x + b * 0.45)} cy={r2(fot - h * 0.62 + 1.2)} r="0.9" fill={S.hvit.lys} />
            <circle cx={r2(x + b * 0.45)} cy={r2(fot - h * 0.62 + 1.2)} r="0.4" fill="none" stroke={S.lov.skygge} strokeWidth="0.3" />
          </>
        ) : (
          <circle cx={r2(x + b * 0.4)} cy={r2(fot - h * 0.45)} r={r2(b * 0.18)} fill={S.hvit.lys} opacity="0.8" />
        )}
        {/* Dugg på dunken når saften er iskald. */}
        {f >= 2 &&
          [[0.2, 0.55], [0.5, 0.7], [0.3, 0.85], [0.65, 0.5], [0.15, 0.75]].map(([dx, dy]) => (
            <circle key={`${dx}-${dy}`} cx={r2(x + dx * b)} cy={r2(topp + dy * h)} r="0.35" fill={S.hvit.lys} opacity="0.75" />
          ))}
        <rect x={r2(x - 0.4)} y={r2(topp - 1.4)} width={r2(b + 0.8)} height="1.6" rx="0.6" fill={S.metall.flate} />
        <rect x={r2(x + b * 0.35)} y={r2(fot - 1.8)} width="1.6" height="1.1" fill={S.metall.skygge} />
        <Glans points={pkt([x, topp], [x + b * 0.45, topp], [x, fot - h * 0.3])} />
      </g>
    )
  }
  // Selgerne: et barn på nivå 1, en ungdom fra 25, eieren og en hjelper fra 50.
  const selger = bod ? { x: 44, y: 76, m: t >= 2 ? 1.78 : 1.6, barn: false } : { x: 45, y: 76, m: 1.25, barn: true }
  const hand = haand(selger.x, selger.y, selger.m, selger.barn, 'skjenk')
  return (
    <>
      {/* Stedet: hageporten (1), butikken (25), strandpromenaden (50), torget (100). */}
      {t === 2 && (
        <Kantfade>
          <rect x="-40" y="50" width="176" height="20" fill={S.sjo.flate} />
          <rect x="-40" y="50" width="176" height="1.6" fill={S.sjo.lys} opacity="0.55" />
          {[[-30, 55], [-12, 57], [8, 56], [30, 54], [60, 57], [84, 55], [104, 56], [124, 54]].map(([x, y]) => (
            <polyline key={x} className="anim-boelge" points={`${x},${y} ${x + 3},${y - 0.9} ${x + 6},${y}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.5" strokeLinecap="round" />
          ))}
          <Dis>
            <polygon points="10,49.6 10,42 15,49.6" fill={S.hvit.lys} />
            <polygon points="8.6,49.8 16,49.8 15,51 9.4,51" fill={S.mork.lys} />
            {/* En seiler til, lenger ute til høyre. */}
            <polygon points="121,49.4 121,40.4 127,49.4" fill={S.hvit.lys} />
            <polygon points="119.4,49.6 128,49.6 127,50.8 120.2,50.8" fill={S.vin.skygge} />
          </Dis>
          <rect x="-40" y="64.6" width="176" height="5" fill={S.puss.flate} />
          {/* Rekkverket langs promenaden. */}
          <rect x="-40" y="59.4" width="176" height="0.7" fill={S.metall.skygge} />
          <rect x="-40" y="63" width="176" height="0.4" fill={S.metall.skygge} />
          {Array.from({ length: 18 }, (_, i) => -38 + i * 10).map((x) => (
            <rect key={x} x={x} y="59.4" width="0.6" height="6.4" fill={S.metall.skygge} />
          ))}
          {/* Livbøya på rekkverket, rød og hvit. */}
          <rect x="113.6" y="55.4" width="0.8" height="10.4" fill={S.metall.skygge} />
          <circle cx="114" cy="58.6" r="2.7" fill="none" stroke={S.hvit.lys} strokeWidth="1.3" />
          <circle cx="114" cy="58.6" r="2.7" fill="none" stroke={S.vin.lys} strokeWidth="1.3" strokeDasharray="2.12 2.12" />
          {/* Gatelykta på promenaden: slukket om dagen. */}
          <rect x="-24.7" y="27" width="1.4" height="43" fill={S.mork.flate} />
          <rect x="-25.7" y="68" width="3.4" height="2.4" fill={S.mork.skygge} />
          <polygon points="-26.8,24.6 -21.2,24.6 -22.2,22.6 -25.8,22.6" fill={S.mork.flate} />
          <rect x="-25.8" y="24.6" width="3.6" height="5.2" fill={S.glass.skygge} className="nattvindu" />
          <rect x="-25.2" y="25.2" width="0.7" height="4" fill={S.glass.lys} opacity="0.5" className="nattskjul" />
          <rect x="-26.4" y="29.8" width="4.8" height="0.8" fill={S.mork.flate} />
        </Kantfade>
      )}
      <Bakke type={t === 0 ? 'gress' : t === 2 ? 'promenade' : t === 3 ? 'brostein' : 'fortau'} />
      {t === 0 && (
        <>
          <Bunnfade>
            <polygon points="70,68 82,68 96,96 60,96" fill={S.stein.lys} opacity="0.85" />
          </Bunnfade>
          <Kantfade>
            {/* Gjennom porten: plenen, grusveien videre og huset i hagen. */}
            <rect x="70" y="55" width="12" height="14" fill={S.gress.flate} />
            <polygon points="72.4,69 79.6,69 77.2,57 74.8,57" fill={S.stein.lys} opacity="0.85" />
            <Dis>
              <rect x="70.6" y="47.4" width="10.8" height="9.6" fill={S.faluRod.flate} />
              <polygon points="69.6,47.6 76,42.4 82.4,47.6" fill={S.skifer.flate} />
              <rect x="72.4" y="50" width="2.4" height="2.8" fill={S.glass.skygge} className="nattvindu" />
              <rect x="77.2" y="50" width="2.4" height="2.8" fill={S.glass.skygge} className="nattvindu" />
            </Dis>
            <rect x="-40" y="56" width="108.4" height="13" fill={S.lov.skygge} />
            <rect x="83.6" y="56" width="52.4" height="13" fill={S.lov.skygge} />
            {[-36, -27, -18, -9, 0, 9, 18, 27, 36, 45, 54, 63, 86, 95, 104, 113, 122, 131].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 54 : 52.5} r={i % 3 ? 6 : 7} fill={i % 2 ? S.lov.skygge : S.lov.flate} />
            ))}
            {[-33, -24, -15, -6, 3, 12, 21, 30, 39, 48, 57, 107, 116, 125, 134].map((x) => (
              <circle key={x} cx={x} cy="49.6" r="2.4" fill={S.lov.lys} opacity="0.6" />
            ))}
            {/* Stakittet, åpent ved porten. */}
            <rect x="-40" y="61" width="110" height="1" fill={S.hvit.skygge} />
            <rect x="-40" y="65.6" width="110" height="1" fill={S.hvit.skygge} />
            <rect x="82" y="61" width="54" height="1" fill={S.hvit.skygge} />
            <rect x="82" y="65.6" width="54" height="1" fill={S.hvit.skygge} />
            {[...Array.from({ length: 10 }, (_, i) => -39 + i * 4), 1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 84, 88, 92, ...Array.from({ length: 10 }, (_, i) => 96 + i * 4)].map((x) => (
              <polygon key={x} points={pkt([x, 69], [x, 58.4], [x + 0.7, 57.4], [x + 1.4, 58.4], [x + 1.4, 69])} fill={S.hvit.flate} />
            ))}
            <rect x="68.4" y="55.6" width="2" height="13.4" fill={S.hvit.lys} />
            <rect x="81.6" y="55.6" width="2" height="13.4" fill={S.hvit.lys} />
          </Kantfade>
        </>
      )}
      {t === 1 && (
        <Kantfade>
          <rect x="-40" y="0" width="176" height="69" fill={S.tegl.flate} />
          <rect x="-40" y="64" width="176" height="5" fill={S.stein.flate} />
          {/* Nedløpsrørene mellom husene. */}
          {[-3.2, 97.4].map((x) => (
            <g key={x}>
              <rect x={x} y="0" width="1.6" height="64" fill={S.metall.skygge} />
              <rect x={r2(x - 0.3)} y="20" width="2.2" height="0.8" fill={S.metall.flate} />
              <rect x={r2(x - 0.3)} y="44" width="2.2" height="0.8" fill={S.metall.flate} />
            </g>
          ))}
          {/* Naboen til høyre: et vindu med mørk karm, og et skilt over. */}
          <rect x="104" y="25" width="28" height="5" fill={S.mork.flate} />
          <rect x="105" y="33" width="26" height="31" fill={S.gran.skygge} />
          <rect x="106.4" y="34.4" width="23.2" height="28" fill={S.glass.skygge} className="nattvindu" />
          <rect x="117.4" y="34.4" width="1.2" height="28" fill={S.gran.skygge} />
          <polygon points="107,35 113,35 107,44" fill={S.glass.lys} opacity="0.35" className="nattskjul" />
          {/* Til venstre: et lite vindu med blomsterkasse. */}
          <rect x="-34" y="30" width="18" height="20" fill={S.treMork.flate} />
          <rect x="-32.6" y="31.4" width="15.2" height="17.2" fill={S.glass.skygge} className="nattvindu" />
          <rect x="-25.6" y="31.4" width="1.2" height="17.2" fill={S.treMork.flate} />
          <rect x="-35" y="50" width="20" height="3.6" fill={S.treverk.flate} />
          {[-33.6, -30.4, -27.2, -24, -20.8, -17.6].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="49.4" r="1.7" fill={S.lov.flate} />
              <circle cx={r2(x + 0.5)} cy="48.4" r="0.9" fill={i % 2 ? S.vin.lys : S.oker.lys} />
            </g>
          ))}
          {/* Butikkvinduet med varmt lys, og døra. */}
          <rect x="64" y="25" width="30" height="5" fill={S.mork.flate} />
          <rect x="65" y="33" width="28" height="31" fill={S.treMork.flate} />
          <rect x="66.4" y="34.4" width="25.2" height="28" fill={S.vinduLys.flate} />
          <rect x="78.4" y="34.4" width="1.2" height="28" fill={S.treMork.flate} />
          <rect x="66.4" y="54" width="25.2" height="8.4" fill={S.treMork.skygge} opacity="0.5" />
          <rect x="4" y="30" width="13" height="39" fill={S.treMork.flate} />
          <rect x="6" y="32.4" width="9" height="15" fill={S.glass.skygge} className="nattvindu" />
        </Kantfade>
      )}
      {t === 3 && (
        <g>
          <rect x="6.3" y="27" width="1.4" height="43" fill={S.mork.flate} />
          <rect x="5.3" y="68" width="3.4" height="2.4" fill={S.mork.skygge} />
          <polygon points="4.2,24.6 9.8,24.6 8.8,22.6 5.2,22.6" fill={S.mork.flate} />
          {/* Gatelykta: slukket om dagen, tent om natta. */}
          <rect x="5.2" y="24.6" width="3.6" height="5.2" fill={S.glass.skygge} className="nattvindu" />
          <rect x="5.8" y="25.2" width="0.7" height="4" fill={S.glass.lys} opacity="0.5" className="nattskjul" />
          <rect x="4.6" y="29.8" width="4.8" height="0.8" fill={S.mork.flate} />
          {/* Treet i en plantekasse (3 m høyt). */}
          <Tre x={-18} y={g - 9} h={36} />
          <Kloss x={-27} b={18} h={9} d={6} m={S.stein} />
          {/* Kafébordene på torget: runde bord (75 cm høye, 60 cm brede) med to stoler hver. */}
          {[104, 124].map((x, i) => (
            <Kafebord key={x} x={x} y={g - 3 + i * 2} glass={i === 0} />
          ))}
        </g>
      )}
      <Slagskygge x1={x0} x2={x0 + disk.b + (t >= 2 ? 16 : 0)} lengde={14} d={12} />
      {/* Sidebua med bær og parasoll fra nivå 50. */}
      {t >= 2 && (
        <g>
          <line x1="78" y1={g - 12} x2="78" y2="45" stroke={S.metall.skygge} strokeWidth="0.8" />
          <path d="M65 50 Q78 40 91 50 Z" fill={t >= 3 ? S.hvit.lys : S.oker.lys} />
          <path d="M78 42.4 Q86.4 43.6 91 50 L78 50 Z" fill={t >= 3 ? S.hvit.flate : S.oker.flate} />
          <Kloss x={68} b={16} h={12} d={10} m={S.treverk} front={panel.skygge} />
          <Kloss x={70} y={g - 12} b={12} h={2.4} d={6} m={S.treverk} />
          {/* Kurver med bringebær og solbær, to rader. */}
          {[0, 1].map((rad) =>
            [0, 1, 2, 3, 4].map((i) => {
              const x = r2(70.6 + i * 2.4 + rad * 1.6)
              const y = r2(g - 14.4 - rad * 1)
              const bar = (i + rad) % 3 === 2 ? S.mork.lys : S.vin.lys
              return (
                <g key={`${rad}-${i}`}>
                  <ellipse cx={r2(x + 1.05)} cy={r2(y - 0.1)} rx="1" ry="0.55" fill={bar} />
                  <rect x={x} y={y} width="2.1" height="1.3" fill={S.treverk.lys} />
                  <rect x={x} y={y} width="2.1" height="0.35" fill={S.treverk.flate} />
                </g>
              )
            }),
          )}
        </g>
      )}
      {/* Boden: stolper, markise og skilt fra nivå 25. */}
      {bod && (
        <g>
          <rect x="23" y="34" width="2" height="34" fill={S.treverk.flate} />
          <rect x="63" y="34" width="2" height="34" fill={S.treverk.skygge} />
          <polygon points="19,31 69,31 72,39 16,39" fill={S.hvit.lys} />
          {[0, 2, 4].map((i) => (
            <polygon key={i} points={`${r2(19 + i * 8.33)},31 ${r2(27.33 + i * 8.33)},31 ${r2(25.33 + i * 9.33)},39 ${r2(16 + i * 9.33)},39`} fill={S.oker.flate} />
          ))}
          <path className="anim-duve" d={`M16 39 ${Array.from({ length: 8 }, (_, i) => `Q${19.5 + i * 7} 42.4 ${23 + i * 7} 39`).join(' ')} Z`} fill={S.oker.skygge} />
          <rect x="16" y="39" width="56" height="0.8" fill="#000000" opacity="0.2" />
          {/* Skiltet: et rødt saftglass og SAFT, malt på et bord. */}
          <Kloss x={30} y={31} b={28} h={9} d={3} m={S.treverk} front={S.treMork.flate} />
          <Saftglass x={32.4} y={23.4} h={6.2} />
          <Ord tekst="SAFT" x={39.4} y={24} h={5} farge={S.hvit.lys} bredde={1.1} />
        </g>
      )}
      {/* Lykta henger på stolpen til lyslenka kommer (100). */}
      {(t === 1 || t === 2) && (
        <g>
          <line x1="26.4" y1="40" x2="26.4" y2="42.4" stroke={S.mork.lys} strokeWidth="0.4" />
          <Lykt x={24.7} y={49.6} />
        </g>
      )}
      {/* Nivå 100: lyslenke under markisen. */}
      {t >= 3 && (
        <g>
          <path d="M24 41 Q44 47 64 41" fill="none" stroke={S.mork.flate} strokeWidth="0.4" />
          {[28, 34, 40, 46, 52, 58].map((x) => (
            <Lampe key={x} x={x} y={+(41 + 6 * (1 - ((x - 44) / 20) ** 2) * 0.95).toFixed(2)} r={1.6} />
          ))}
        </g>
      )}
      {/* Hjelperen bak dunkene, fra nivå 50. */}
      {t >= 2 && <Folk x={31} y={75} m={1.64} klaer={S.petrol} caps={S.vin.flate} forkle={t >= 3 ? S.hvit.flate : undefined} />}
      {/* Selgeren bak disken. */}
      {selger.barn ? (
        <Folk x={selger.x} y={selger.y} m={selger.m} barn klaer={S.oker} har={S.oker.skygge} arm="skjenk" />
      ) : t === 1 ? (
        <Folk x={selger.x} y={selger.y} m={selger.m} klaer={S.marine} caps={S.vin.flate} arm="skjenk" />
      ) : (
        <Folk x={selger.x} y={selger.y} m={selger.m} klaer={S.marine} har={S.mork.flate} forkle={S.hvit.flate} arm="skjenk" />
      )}
      {/* Disken: et bord på nivå 1, en malt disk fra 25. */}
      {bod ? (
        <g>
          <Kloss x={x0} b={disk.b} h={g - disk.y} d={12} m={S.treverk} front={panel.flate} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={x0 + 5 + i * 5} y={r2(disk.y + 1.6)} width="0.5" height={r2(g - disk.y - 1.6)} fill={panel.skygge} opacity="0.7" />
          ))}
          <rect x={x0 - 1} y={r2(disk.y - 0.6)} width={disk.b + 2} height="1.6" fill={t >= 3 ? S.gull.flate : S.treverk.lys} />
          <Bunnskygge x={x0} y={disk.y} b={disk.b} h={g - disk.y} />
        </g>
      ) : (
        <g>
          <rect x="24" y="72.4" width="2" height="11.6" fill={S.treverk.skygge} />
          <rect x="66" y="72.4" width="2" height="11.6" fill={S.treverk.skygge} />
          <Kloss x={x0} y={72.4} b={disk.b} h={2.4} d={10} m={S.treverk} />
          {/* Pappskiltet: et glass rød saft og SAFT med tusj. */}
          {/* Pappen henger i to teipbiter fra bordkanten og vipper litt i vinden. */}
          <g transform="rotate(-2 46 73)">
            <g className="anim-duve">
              <rect x="33" y="73" width="26" height="9.6" rx="0.6" fill={S.puss.lys} />
              <rect x="33" y="81.6" width="26" height="1" fill={S.puss.skygge} opacity="0.6" />
              <Saftglass x={35.2} y={74.6} h={6.4} />
              <Ord tekst="SAFT" x={41.6} y={75.6} h={4.2} farge={S.vin.flate} bredde={0.85} />
            </g>
          </g>
          {[34.4, 54.6].map((x) => (
            <rect key={x} x={x} y="71.4" width="3" height="2.6" fill={S.hvit.lys} opacity="0.75" />
          ))}
        </g>
      )}
      {/* På disken: dunken med rød saft, koppene og kanna som skjenker. */}
      {dunk(plass.dunk, false, false)}
      {[0, 1, 2].map((i) => (
        <polygon key={i} points={pkt([plass.kopper, fot - i * 0.7], [plass.kopper + 2.4, fot - i * 0.7], [plass.kopper + 2.15, fot - 2.6 - i * 0.7], [plass.kopper + 0.25, fot - 2.6 - i * 0.7])} fill={i === 2 ? S.hvit.lys : S.hvit.flate} />
      ))}
      <Skjenk h={hand} k={figurskala(selger.m)} bunn={fot} />
      {/* Sukkerfri linje: en egen dunk med grønn etikett. */}
      {f >= 3 && dunk(plass.sukkerfri, true, true)}
      {/* Saftpressen: en spakpresse med bær på toppen, og en skål bær. */}
      {f >= 1 && (
        <g>
          <rect x={plass.presse} y={r2(fot - 1.2)} width="6" height="1.2" rx="0.3" fill={S.metall.skygge} />
          <rect x={r2(plass.presse + 4.2)} y={r2(fot - 9)} width="1.1" height="8" fill={S.metall.flate} />
          <polygon points={pkt([plass.presse + 0.6, fot - 5.6], [plass.presse + 4.4, fot - 5.6], [plass.presse + 3.6, fot - 3], [plass.presse + 1.4, fot - 3])} fill={S.metall.lys} />
          <rect x={r2(plass.presse + 1.6)} y={r2(fot - 3)} width="1.8" height="1.8" fill={S.vin.lys} />
          <line x1={r2(plass.presse + 4.8)} y1={r2(fot - 8.6)} x2={r2(plass.presse + 0.4)} y2={r2(fot - 12.6)} stroke={S.metall.skygge} strokeWidth="0.9" strokeLinecap="round" />
          {[[1.5, 6], [2.3, 6.1], [3.1, 6], [1.9, 6.6], [2.7, 6.7]].map(([dx, dy]) => (
            <circle key={dx * 10 + dy} cx={r2(plass.presse + dx)} cy={r2(fot - dy)} r="0.42" fill={dx === 2.7 ? S.mork.lys : S.vin.flate} />
          ))}
        </g>
      )}
      {/* Isen: en stålbalje full av isbiter. */}
      {f >= 2 && (
        <g>
          {[[0.6, 4.4], [2, 4.9], [3.4, 4.5], [1.3, 5.7], [2.7, 5.8]].map(([dx, dy]) => (
            <rect key={dx * 10 + dy} x={r2(plass.is + dx)} y={r2(isb - dy)} width="1.5" height="1.5" rx="0.3" fill={dy > 5 ? S.hvit.lys : S.glass.lys} transform={`rotate(${dx * 12} ${r2(plass.is + dx + 0.75)} ${r2(isb - dy + 0.75)})`} />
          ))}
          {!bod && <ellipse cx={r2(plass.is + 3.4)} cy={isb} rx="4" ry="0.8" fill="#000000" opacity="0.25" />}
          <polygon points={pkt([plass.is, isb - 3.6], [plass.is + 5.6, isb - 3.6], [plass.is + 5, isb], [plass.is + 0.6, isb])} fill={S.metall.flate} />
          <rect x={plass.is} y={r2(isb - 3.8)} width="5.6" height="0.8" rx="0.3" fill={S.metall.lys} />
        </g>
      )}
      <Veps x={bod ? 29.5 : 28} y={bod ? 53.5 : 55.5} />
      {/* Nivå 100: plaketten. */}
      {t >= 3 && <Plakett x={x0 + 28} y={disk.y + 4} />}
      {/* Kundene i kø til venstre, i sommerklær: én betaler, én drikker (og én venter ved 100). */}
      {t === 0 && <Lykt x={17} y={g + 2} />}
      {t >= 3 && <Folk x={13} y={g - 1} m={1.7} klaer={S.gran} ben={S.marine.flate} hud={S.hudMork} har={S.mork.skygge} />}
      {t >= 2 && (
        <>
          <Spiser ting="kopp" x={6} y={g + 3} m={1.72} klaer={S.petrol} hud={S.hudMork} har={S.mork.skygge} ben={S.treverk.skygge} shorts />
          <Folk x={19} y={g + 4.5} m={1.76} klaer={S.hvit} ben={S.marine.flate} shorts caps={S.petrol.flate} arm="frem" ting="kort" />
        </>
      )}
    </>
  )
}

/**
 * En pølse i lompe, liggende med venstre ende i (x, y), `l` enheter lang:
 * pølsa stikker ut av den lyse potetlompa i begge ender, med sennep og ketsjup.
 */
function Lompe({ x, y, l }: { x: number; y: number; l: number }) {
  const h = r2(l * 0.3)
  return (
    <g>
      <rect x={x} y={y} width={l} height={r2(h * 0.55)} rx={r2(h * 0.27)} fill={S.tegl.lys} />
      <rect x={r2(x + l * 0.16)} y={r2(y - h * 0.2)} width={r2(l * 0.68)} height={h} rx={r2(h * 0.3)} fill={S.puss.flate} />
      {l >= 6 && (
        <>
          {[0.3, 0.5, 0.7].map((d) => (
            <circle key={d} cx={r2(x + l * d)} cy={r2(y + h * 0.45)} r={r2(h * 0.08)} fill={S.treverk.lys} />
          ))}
          <path d={`M${r2(x + l * 0.2)} ${r2(y - h * 0.25)} ${Array.from({ length: 6 }, (_, i) => `L${r2(x + l * (0.27 + i * 0.1))} ${r2(y - h * (i % 2 ? 0.25 : 0.4))}`).join(' ')}`} fill="none" stroke={S.oker.lys} strokeWidth={r2(h * 0.12)} strokeLinecap="round" />
          <path d={`M${r2(x + l * 0.25)} ${r2(y - h * 0.32)} ${Array.from({ length: 5 }, (_, i) => `L${r2(x + l * (0.32 + i * 0.1))} ${r2(y - h * (i % 2 ? 0.4 : 0.26))}`).join(' ')}`} fill="none" stroke={S.tegl.flate} strokeWidth={r2(h * 0.1)} strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

/** Speiler en figur om x, så den vender mot venstre (en kunde som rekker inn i luka fra høyre). */
const speil = (x: number, barn: ReactNode) => <g transform={`translate(${r2(2 * x)} 0) scale(-1 1)`}>{barn}</g>

/**
 * Gatebukken med krittavle for den hjemmelagde sennepen (70 × 100 cm på
 * gateavstand), med bena på (x, y): et sennepsglass og SENNEP med kritt, og en
 * strek for prisen. Det bakre benet stikker ut til høyre.
 */
function Krittavle({ x, y }: { x: number; y: number }) {
  const h = 1
  return (
    <g>
      <ellipse cx={r2(x + 4.6)} cy={y} rx="4.6" ry="0.6" fill="#000000" opacity="0.22" />
      <polygon points={pkt([x + 6.4, y - 9.4], [x + 7.2, y - 9.4], [x + 8.6, y], [x + 7.8, y])} fill={S.treverk.skygge} />
      <polygon points={pkt([x + 0.4, y - 10], [x + 6.6, y - 10], [x + 7.4, y], [x - 0.4, y])} fill={S.treverk.flate} />
      <polygon points={pkt([x + 1, y - 9.4], [x + 6, y - 9.4], [x + 6.6, y - 0.8], [x + 0.4, y - 0.8])} fill={S.mork.flate} />
      <rect x={r2(x + 2.5)} y={r2(y - 8.6)} width="2" height="2.4" rx="0.4" fill={S.oker.lys} />
      <rect x={r2(x + 2.3)} y={r2(y - 9)} width="2.4" height="0.6" fill={S.hvit.flate} />
      <Ord tekst="SENNEP" x={r2(x + 3.5 - ordbredde('SENNEP', h) / 2)} y={r2(y - 5.2)} h={h} farge={S.hvit.flate} bredde={0.22} />
      <line x1={r2(x + 2)} y1={r2(y - 2.6)} x2={r2(x + 5)} y2={r2(y - 2.6)} stroke={S.oker.lys} strokeWidth="0.3" strokeLinecap="round" />
    </g>
  )
}

/** Et ståbord på terrassen, med serviettholder, en flaske og en pølse på papp. */
function Staabord({ x }: { x: number }) {
  const g = GRUNNLINJE
  return (
    <g>
      <rect x={r2(x - 0.4)} y={g - 11} width="0.8" height="11" fill={S.mork.flate} />
      <ellipse cx={x} cy={g - 11} rx="3.4" ry="0.9" fill={S.treverk.lys} />
      <rect x={r2(x - 2.4)} y={r2(g - 12.4)} width="1" height="1" fill={S.hvit.lys} />
      <rect x={r2(x + 1.4)} y={r2(g - 13.4)} width="0.6" height="1.9" rx="0.2" fill={S.glass.flate} />
      <rect x={r2(x - 1)} y={r2(g - 11.5)} width="2.2" height="0.4" fill={S.hvit.flate} />
      <Lompe x={r2(x - 0.9)} y={r2(g - 12)} l={1.9} />
    </g>
  )
}

/** En måke som hopper på kaia (Pølseboden ved fergekaia, nivå 100). */
function Maake({ x, y }: { x: number; y: number }) {
  return (
    <g className="anim-hopp">
      <ellipse cx={r2(x + 0.6)} cy={y} rx="1.6" ry="0.3" fill="#000000" opacity="0.2" />
      <line x1={r2(x - 0.3)} y1={r2(y - 1.4)} x2={r2(x - 0.3)} y2={y} stroke={S.oker.flate} strokeWidth="0.25" />
      <line x1={r2(x + 0.4)} y1={r2(y - 1.4)} x2={r2(x + 0.4)} y2={y} stroke={S.oker.flate} strokeWidth="0.25" />
      <ellipse cx={x} cy={r2(y - 2.6)} rx="2" ry="1.3" fill={S.hvit.lys} />
      <path d={`M${r2(x - 1.8)} ${r2(y - 2.9)} Q${r2(x)} ${r2(y - 3.5)} ${r2(x + 1.2)} ${r2(y - 2.5)} L${r2(x - 0.6)} ${r2(y - 2.2)} Z`} fill={S.fjell.lys} />
      <path d={`M${r2(x - 1.9)} ${r2(y - 2.8)} L${r2(x - 3)} ${r2(y - 2.5)} L${r2(x - 1.9)} ${r2(y - 2.3)} Z`} fill={S.mork.lys} />
      <circle cx={r2(x + 1.7)} cy={r2(y - 3.6)} r="0.85" fill={S.hvit.lys} />
      <polygon points={pkt([x + 2.4, y - 3.7], [x + 3.4, y - 3.5], [x + 2.4, y - 3.3])} fill={S.oker.flate} />
      <circle cx={r2(x + 1.9)} cy={r2(y - 3.8)} r="0.16" fill={S.mork.skygge} />
    </g>
  )
}

/**
 * Pølseboden (gateavstand) — norsk pølse i lompe, og et sted som vokser med
 * boden: på nivå 1 en pølsevogn med parasoll på en grussti i parken, med eieren
 * alene ved gryta; fra 25 en rød pølsebu med luke og meny på et gatehjørne med
 * taxi og gatelykt, og eieren i papirhatt; ved 50 utenfor fotballbanen på
 * kampdag, med en hjelper ved grillen, en overbygd terrasse med ståbord og
 * supportere i skjerf; og ved 100 på fergekaia med ferja i disen, gullkant,
 * plakett, blomsterkasser langs terrassen og to i like forklær. Pølsene har
 * virkelige mål (en pølse i lompe 1,9 enheter ≈ 19 cm). Forbedringene: grillplate
 * i stål, hjemmelaget sennep (et glass på disken og en krittavle med SENNEP på
 * fortauet), og food trucken med åpen luke og egen
 * kø på andre siden av gata. I scenen damper gryta, tanga snur pølsene, en kunde
 * tar en bit, parasollen rører seg og måka hopper; lysene tennes om natta.
 */
const polsebod: B = (t, f) => {
  const g = GRUNNLINJE
  const bu = t >= 1
  const disk = bu ? { x: 33, y: 74.4 } : { x: 37, y: 71 }
  // Hvor tingene står på disken: grillplata, gryta og pølsene som er klare.
  const plass = bu ? { klare: 34.6, grill: 41.6, gryte: 51, sennep: 55.4 } : { klare: 37.4, grill: 44, gryte: 53.6, sennep: 57.6 }
  const gryte = (
    <g>
      <rect x={plass.gryte} y={r2(disk.y - 3)} width="3.6" height="3" rx="0.4" fill={S.metall.flate} />
      <rect x={r2(plass.gryte + 2.4)} y={r2(disk.y - 3)} width="1.2" height="3" fill={S.metall.skygge} />
      <rect x={r2(plass.gryte - 0.2)} y={r2(disk.y - 3.3)} width="4" height="0.5" rx="0.2" fill={S.metall.lys} />
      <path className="anim-damp" d={`M${r2(plass.gryte + 1)} ${r2(disk.y - 3.6)} q-1 -1.4 0 -2.8 q1 -1.4 0 -2.8`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
      <path className="anim-damp sen" d={`M${r2(plass.gryte + 2.6)} ${r2(disk.y - 3.6)} q-1 -1.4 0 -2.8 q1 -1.4 0 -2.8`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
    </g>
  )
  return (
    <>
      {/* Stedet bak: fotballbanen på kampdag (50), sjøen og ferja ved fergekaia (100). */}
      {t === 2 && (
        <Kantfade>
          <Dis>
            <rect x="-40" y="36" width="176" height="32" fill={S.stein.flate} />
            <rect x="-40" y="33.6" width="176" height="3" fill={S.skifer.flate} />
            {[-22, 8, 38, 68, 98, 128].map((x) => (
              <rect key={x} x={x} y="54" width="12" height="14" fill={S.mork.flate} />
            ))}
            {[-33, -3, 27, 57, 87, 117].map((x) => (
              <g key={x}>
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={x + i * 1.4} y="39" width="1.4" height="11" fill={i % 2 ? S.hvit.lys : S.vin.flate} />
                ))}
              </g>
            ))}
            {[-34, 4, 91, 129].map((x) => (
              <g key={x}>
                <rect x={x} y="6" width="1.2" height="62" fill={S.metall.skygge} />
                <rect x={r2(x - 2.4)} y="3.4" width="6" height="3.6" fill={S.glass.skygge} className="nattvindu" />
              </g>
            ))}
          </Dis>
        </Kantfade>
      )}
      {t === 3 && (
        <Kantfade>
          <rect x="-40" y="48" width="176" height="22" fill={S.sjo.flate} />
          <rect x="-40" y="48" width="176" height="1.6" fill={S.sjo.lys} opacity="0.55" />
          {[[-32, 55], [-10, 53], [14, 57], [44, 54], [70, 52], [86, 57], [108, 55], [126, 52]].map(([x, y]) => (
            <polyline key={x} className="anim-boelge" points={`${x},${y} ${x + 3},${y - 0.9} ${x + 6},${y}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.5" strokeLinecap="round" />
          ))}
          <Dis>
            {/* Fjordferja: mørkt skrog, hvite dekk og en pipe. */}
            <polygon points="60,52 96,52 93,56.4 63,56.4" fill={S.marine.skygge} />
            <rect x="66" y="46.4" width="24" height="5.6" fill={S.hvit.lys} />
            <rect x="70" y="43" width="14" height="3.4" fill={S.hvit.flate} />
            <rect x="78" y="39.4" width="3" height="3.6" fill={S.vin.flate} />
            {[68, 71, 74, 77, 80, 83, 86].map((x) => (
              <rect key={x} x={x} y="48" width="1.8" height="1.4" fill={S.glass.skygge} className="nattvindu" />
            ))}
          </Dis>
          {/* Kaikanten med pullerter. */}
          <rect x="-40" y="67.4" width="176" height="1.4" fill={S.stein.skygge} />
          {[-26, -12, 8, 22, 106, 122].map((x) => (
            <g key={x}>
              <rect x={x} y="65" width="2" height="3" rx="0.6" fill={S.mork.lys} />
              <rect x={r2(x - 0.4)} y="64.6" width="2.8" height="0.9" rx="0.45" fill={S.mork.flate} />
            </g>
          ))}
        </Kantfade>
      )}
      {/* Gatehjørnet (25): byen bak, i disen. */}
      {t === 1 && (
        <Kantfade>
          <Byrekke start={2} />
        </Kantfade>
      )}
      <Bakke type={t === 0 ? 'gress' : 'fortau'} />
      {/* Nivå 1: grusstien i parken, trær og en benk. */}
      {t === 0 && (
        <>
          <Bunnfade>
            <polygon points="-40,74.25 136,68.75 136,78.33 -40,86.67" fill={S.stein.lys} opacity="0.6" />
          </Bunnfade>
          <Kantfade>
            <Tre x={-28} y={68} h={34} />
            <Tre x={-6} y={70} h={24} />
            <Tre x={12} y={69} h={30} />
            <Tre x={86} y={68} h={26} />
            <Tre x={114} y={69} h={32} />
            <Tre x={130} y={67} h={22} slag="gran" />
            <rect x="68" y="66" width="14" height="1.2" fill={S.treverk.flate} />
            <rect x="68" y="63.4" width="14" height="1" fill={S.treverk.flate} />
            {[69, 80.4].map((x) => (
              <rect key={x} x={x} y="63.4" width="0.6" height="6" fill={S.mork.flate} />
            ))}
          </Kantfade>
        </>
      )}
      {/* Nivå 25: gatehjørnet med gatelykt og en taxi som venter. */}
      {t === 1 && (
        <g>
          <g transform="translate(-9 0)">
          <rect x="21.3" y="31" width="1.4" height="53" fill={S.mork.flate} />
          <rect x="20.2" y="82" width="3.6" height="2" fill={S.mork.skygge} />
          <polygon points="19.4,26.6 24.6,26.6 23.8,24.6 20.2,24.6" fill={S.mork.flate} />
          <rect x="20.2" y="26.6" width="3.6" height="4.6" fill={S.glass.skygge} className="nattvindu" />
          <rect x="20.8" y="27.2" width="0.7" height="3.4" fill={S.glass.lys} opacity="0.5" className="nattskjul" />
          <rect x="19.8" y="31" width="4.4" height="0.8" fill={S.mork.flate} />
          </g>
          {/* Taxien ved fortauskanten, og en bil bak den. */}
          <Bil x={70} taxi />
          <Bil x={104} y={73.8} farge={S.petrol} />
          <Sykkel x={-30} y={g - 2} farge={S.petrol.flate} />
        </g>
      )}
      {/* Food trucken på andre siden av gata: luka åpen, markise, damp og en liten kø. */}
      {f >= 3 && (
        <Kantfade>
          <Dis>
            <g transform="translate(0 4)">
            <rect x="0" y="40" width="44" height="23" fill={S.hvit.flate} />
            <rect x="0" y="57" width="44" height="2.4" fill={S.vin.flate} />
            <rect x="10" y="45" width="18" height="8" fill={S.vinduLys.flate} />
            <polygon points="8.6,45 29.4,45 31,41.6 7,41.6" fill={S.vin.flate} />
            <rect x="9.6" y="52.6" width="19" height="1.2" fill={S.metall.flate} />
            <path className="anim-damp" d="M18 44.6 q-1 -1.4 0 -2.8 q1 -1.4 0 -2.8" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
            <rect x="34" y="44" width="10" height="9" fill={S.glass.skygge} />
            {[7, 37].map((x) => (
              <g key={x}>
                <circle cx={x} cy="63" r="3.2" fill={S.mork.skygge} />
                <circle cx={x} cy="63" r="1.2" fill={S.metall.flate} />
              </g>
            ))}
            <Folk x={14} y={67} m={1.75} avstand="gate" klaer={S.petrol} />
            <Folk x={20} y={67.6} m={1.7} avstand="gate" klaer={S.oker} hud={S.hudMork} har={S.mork.skygge} />
            </g>
          </Dis>
        </Kantfade>
      )}
      {/* Terrassen med tak og ståbord fra nivå 50; lampene tennes om natta (100). */}
      {t >= 2 && (
        <g>
          <Slagskygge x1={65} x2={84} lengde={8} d={12} />
          {t >= 3 && (
            <g>
              <Kloss x={67} y={g - 8.4} b={15} h={2.4} d={3} m={S.treverk} />
              {[68.4, 71, 73.6, 76.2, 78.8, 81].map((x, i) => (
                <circle key={x} cx={x} cy={r2(g - 11.6)} r="1.2" fill={i % 3 === 1 ? S.vin.lys : S.lov.flate} />
              ))}
            </g>
          )}
          {[66, 82].map((x) => (
            <rect key={x} x={x} y="58" width="1.2" height={g - 58} fill={S.treverk.skygge} />
          ))}
          <Kloss x={64} y={59} b={20} h={1.8} d={12} m={S.skifer} />
          {t >= 3 &&
            [70, 78].map((x) => (
              <g key={x}>
                <line x1={x} y1="59" x2={x} y2="60.6" stroke={S.mork.flate} strokeWidth="0.3" />
                <rect x={r2(x - 0.9)} y="60.6" width="1.8" height="2.2" rx="0.5" fill={S.glass.skygge} className="nattvindu" />
              </g>
            ))}
          {/* Gjestene står bak ståbordene: én spiser (supporter i skjerf på kampdag), én drikker (100). */}
          <Spiser ting="polse" x={75.6} y={g - 1.2} m={1.76} avstand="gate" klaer={S.petrol} skjerf={t === 2 ? S.vin.flate : undefined} />
          {t >= 3 && <Spiser ting="kopp" x={80.6} y={g - 2.4} m={1.68} avstand="gate" klaer={S.oker} hud={S.hudMork} har={S.mork.skygge} />}
          <Staabord x={74} />
          <Staabord x={80.6} />
          {t >= 3 && (
            <g>
              <Kloss x={84.4} y={g} b={8} h={3.2} d={4} m={S.treverk} />
              {[85.6, 88, 90.4].map((x, i) => (
                <circle key={x} cx={x} cy={r2(g - 4)} r="1.5" fill={i === 1 ? S.vin.lys : S.lov.flate} />
              ))}
            </g>
          )}
        </g>
      )}
      {bu ? (
        <g>
          {/* Pølsebua: rød med hvite hjørner, luke med disk, meny og skilt på taket. */}
          <Slagskygge x1={30} x2={64} lengde={14} d={16} />
          <Kloss x={30} b={34} h={26} d={16} m={S.faluRod} />
          <rect x="34" y="63" width="22" height="11.4" fill={S.vinduLys.skygge} />
          {/* Inne i luka: eieren alene (25), en hjelper ved grillen fra 50; like forklær ved 100. */}
          {t === 1 ? (
            <Folk x={45} y={g - 1} m={1.78} avstand="gate" klaer={S.hvit} papirhatt arm="grill" ting="tang" />
          ) : (
            <>
              <Folk x={47} y={g - 1} m={1.72} avstand="gate" klaer={S.hvit} papirhatt forkle={t >= 3 ? S.vin.flate : undefined} arm="grill" ting="tang" />
              {speil(40, <Folk x={40} y={g - 1} m={1.78} avstand="gate" klaer={S.hvit} papirhatt forkle={t >= 3 ? S.vin.flate : undefined} arm="frem" ting="polse" />)}
            </>
          )}
          <rect x="30" y="74.4" width="34" height={g - 74.4} fill={S.faluRod.flate} />
          <Bunnskygge x={30} y={64} b={34} h={20} />
          {[30, 62.8].map((x) => (
            <rect key={x} x={x} y="58" width="1.2" height="26" fill={S.hvit.flate} />
          ))}
          <polygon points="33,62.6 57,62.6 59,58.6 31,58.6" fill={S.vin.flate} />
          <Kloss x={28} y={59} b={38} h={2} d={18} m={S.skifer} />
          <Kloss x={33} y={76} b={24} h={1.6} d={3} m={S.metall} />
          {/* Menyen ved luka: linjer og priser, uten lesbar tekst. */}
          <rect x="57.4" y="63.4" width="5" height="9" fill={S.mork.flate} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x="58.1" y={r2(64.4 + i * 1.6)} width={i % 2 ? 2.2 : 2.8} height="0.45" fill={S.hvit.flate} />
              <rect x="61" y={r2(64.4 + i * 1.6)} width="0.8" height="0.45" fill={S.oker.lys} />
            </g>
          ))}
          {[38, 56].map((x) => (
            <rect key={x} x={x} y="55" width="0.8" height="4" fill={S.mork.flate} />
          ))}
          <Kloss x={34} y={55.4} b={26} h={8.6} d={2} m={S.hvit} />
          <Lompe x={37} y={50} l={20} />
          {t >= 3 && <rect x="34" y="54.6" width="26" height="0.8" fill={S.gull.flate} />}
        </g>
      ) : (
        <g>
          {/* Pølsevogna med parasoll; lykta henger under parasollen og tennes om natta. */}
          <Slagskygge x1={36} x2={58} lengde={10} d={8} />
          <line x1="47" y1={disk.y} x2="47" y2="52" stroke={S.metall.skygge} strokeWidth="0.8" />
          <g className="anim-duve">
            <path d="M31 57 Q47 45 63 57 Z" fill={S.hvit.lys} />
            {[0, 2, 4].map((i) => (
              <path key={i} d={`M47 47 L${r2(31 + i * 5.33)} 57 L${r2(36.33 + i * 5.33)} 57 Z`} fill={S.vin.flate} />
            ))}
            <path d="M47 47 L57.7 57 L63 57 Q58 50.6 47 47 Z" fill={S.vin.skygge} />
          </g>
          <line x1="44.6" y1="56" x2="44.6" y2="57.6" stroke={S.mork.lys} strokeWidth="0.3" />
          <Lykt x={43.6} y={62.6} />
          <Folk x={49} y={g - 7} m={1.78} avstand="gate" klaer={S.hvit} arm="grill" ting="tang" />
          <Kloss x={36} y={80} b={22} h={9} d={8} m={S.metall} front={S.hvit.flate} />
          <rect x="36" y="76" width="22" height="2.2" fill={S.vin.flate} />
          <Lompe x={41} y={73.2} l={11} />
          {[40, 54].map((x) => (
            <g key={x}>
              <circle cx={x} cy={81.4} r="2.6" fill={S.mork.skygge} />
              <circle cx={x} cy={81.4} r="1" fill={S.metall.flate} />
            </g>
          ))}
          <line x1="58" y1="74" x2="62" y2="72" stroke={S.metall.skygge} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}
      {/* På disken: gryta med pølser i varmt vann, og pølser i lompe som er klare. */}
      {gryte}
      {[0, 1, 2].map((i) => (
        <Lompe key={i} x={r2(plass.klare + i * 2.1)} y={r2(disk.y - 0.8)} l={1.9} />
      ))}
      {/* Grillplate i stål, med pølser på rad. */}
      {f >= 1 && (
        <g>
          <rect x={plass.grill} y={r2(disk.y - 1.2)} width="9" height="1.2" fill={S.metall.skygge} />
          <rect x={plass.grill} y={r2(disk.y - 1.4)} width="9" height="0.4" fill={S.metall.lys} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={r2(plass.grill + 0.5 + i * 2.1)} y={r2(disk.y - 2)} width="1.8" height="0.6" rx="0.3" fill={S.tegl.lys} />
          ))}
        </g>
      )}
      {/* Hjemmelaget sennep: et glass på disken (≈ 15 cm) og en gatebukk med
          krittavle på fortauet — et sennepsglass og SENNEP med kritt. */}
      {f >= 2 && (
        <g>
          <rect x={plass.sennep} y={r2(disk.y - 1.5)} width="1.3" height="1.5" rx="0.25" fill={S.oker.lys} />
          <rect x={r2(plass.sennep - 0.1)} y={r2(disk.y - 1.8)} width="1.5" height="0.4" fill={S.vin.flate} />
          <Krittavle x={bu ? 19.6 : 25.6} y={bu ? g + 3 : g + 2} />
        </g>
      )}
      {t >= 3 && <Plakett x={61} y={46.6} />}
      {/* Kundene: én bestiller ved luka og får pølsa, én spiser ved ståbordet (50); én drikker ved 100. Supportere i skjerf på kampdag. */}
      {t >= 2 && (
        <>
          <Folk x={31} y={g + 5} m={1.85} avstand="gate" klaer={S.marine} ben={S.treMork.skygge} skjerf={t === 2 ? S.vin.flate : undefined} arm="frem" ting="kort" />
        </>
      )}
      {t >= 3 && <Maake x={89} y={g + 7} />}
    </>
  )
}

/**
 * Gatekjøkkenet (gateavstand): en liten grillbu med luke og burgerskilt på
 * taket på nivå 1, et ordentlig gatekjøkken med vindu, dør, pipe og skilt på
 * stang fra 25, uteservering med parasoll og kunder ved 50, og ved 100 lyse
 * menytavler, lamper og blomster. Forbedringene: frityrgryta med pommes frites,
 * dressingflasker på disken og en drive-in-luke på siden med skilt og pil.
 */
const gatekjokken: B = (t, f) => {
  const g = GRUNNLINJE
  const stor = t >= 1
  const hus = stor ? { x: 22, b: 48, h: 26, d: 18 } : { x: 34, b: 28, h: 24, d: 16 }
  const topp = g - hus.h
  const luke = stor ? { x: 25, b: 30 } : { x: 37, b: 18 }
  const burger = (x: number, y: number, k = 1) => (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M-5 0 Q0 -4.4 5 0 Z" fill={S.oker.lys} />
      <rect x="-5.4" y="0" width="10.8" height="1" rx="0.5" fill={S.lov.lys} />
      <rect x="-5.2" y="1" width="10.4" height="1.8" rx="0.9" fill={S.treMork.lys} />
      <rect x="-5" y="2.8" width="10" height="1.4" rx="0.7" fill={S.oker.flate} />
    </g>
  )
  return (
    <>
      {/* Byen bak, i disen (G13). */}
      <Kantfade>
        <Byrekke start={4} />
      </Kantfade>
      <Bakke type="fortau" />
      {/* Parkeringen til venstre: en bil og P-skiltet (G13). */}
      <Bil x={-38} y={g - 4.4} farge={S.marine} />
      <rect x="-3.4" y={g - 26} width="0.8" height="24" fill={S.metall.skygge} />
      <rect x="-6.6" y={g - 31.6} width="7.2" height="7.2" rx="0.8" fill={S.marine.flate} />
      <path d={`M-4.6 ${g - 25.8} V${g - 30} H-2.6 Q-0.9 ${g - 30} -0.9 ${g - 28.6} Q-0.9 ${g - 27.2} -2.6 ${g - 27.2} H-4.6`} fill="none" stroke={S.hvit.lys} strokeWidth="0.9" strokeLinejoin="round" />
      {/* Søppelbøtta, og fra 50 et bord til med parasoll og en gjest (G13). */}
      <rect x="99" y={g - 8} width="4.6" height="7" rx="0.6" fill={S.gran.flate} />
      <rect x="98.6" y={g - 8.6} width="5.4" height="1.2" rx="0.4" fill={S.gran.skygge} />
      {t >= 2 && (
        <g>
          <line x1="120" y1={g - 4} x2="120" y2="57" stroke={S.metall.skygge} strokeWidth="0.7" />
          <path d="M111 62 Q120 54 129 62 Z" fill={S.vin.flate} />
          <path d="M120 55.4 Q126 56.6 129 62 L120 62 Z" fill={S.vin.skygge} />
          <Figur x={124} y={g + 0.4} avstand="gate" klaer={S.gran} vendt={-1} />
          <Kloss x={111} y={g} b={14} h={1.4} d={8} m={S.treverk} />
          {[112, 123].map((x) => (
            <rect key={x} x={x} y={g + 1.4} width="1" height="3.6" fill={S.treverk.skygge} />
          ))}
        </g>
      )}
      {/* Uteservering med parasoll fra nivå 50. */}
      {t >= 2 && (
        <g>
          <line x1="14" y1={g - 6} x2="14" y2="57" stroke={S.metall.skygge} strokeWidth="0.7" />
          <path d="M5 62 Q14 54 23 62 Z" fill={S.vin.flate} />
          <path d="M14 55.4 Q20 56.6 23 62 L14 62 Z" fill={S.vin.skygge} />
          <Kloss x={5} y={g - 2} b={14} h={1.4} d={8} m={S.treverk} />
          {[6, 17].map((x) => (
            <rect key={x} x={x} y={g - 0.6} width="1" height="3.6" fill={S.treverk.skygge} />
          ))}
        </g>
      )}
      {/* Skiltet på stang fra nivå 25. */}
      {stor && (
        <g>
          <rect x="83.6" y="44" width="1.4" height={g + 2 - 44} fill={S.metall.skygge} />
          <rect x="76" y="33" width="16.6" height="13" rx="2" fill={S.mork.flate} />
          {t >= 3 && <rect x="76" y="33" width="16.6" height="13" rx="2" fill="none" stroke={S.gull.flate} strokeWidth="0.8" />}
          {burger(84.3, 40.4)}
        </g>
      )}
      <Slagskygge x1={hus.x} x2={hus.x + hus.b} lengde={16} d={hus.d} />
      {/* Huset: hvite fliser, rødt takbånd. */}
      <Kloss x={hus.x} b={hus.b} h={hus.h} d={hus.d} m={S.hvit} />
      {Array.from({ length: Math.floor(hus.h / 3) }, (_, i) => (
        <rect key={i} x={hus.x} y={topp + 3 + i * 3} width={hus.b} height="0.3" fill={S.hvit.skygge} opacity="0.6" />
      ))}
      <rect x={luke.x} y="64" width={luke.b} height="11.6" fill={S.mork.lys} />
      {/* Menytavlene over disken. */}
      {Array.from({ length: stor ? 4 : 2 }, (_, i) => (
        <rect key={i} x={luke.x + 1.4 + i * 7.2} y="64.8" width="6" height="3" fill={t >= 3 ? S.vinduLys.lys : S.vinduLys.skygge} />
      ))}
      <Figur x={luke.x + luke.b / 2 + 2} y={g - 1} avstand="gate" klaer={S.hvit} />
      {/* Frityrgryta med kurv, og en kremmerhus med pommes frites. */}
      {f >= 1 && (
        <g>
          <rect x={luke.x + 2} y="70.6" width="6" height="4" fill={S.metall.flate} />
          <rect x={luke.x + 2.6} y="69.4" width="4.8" height="1.6" fill={S.metall.skygge} />
          <line x1={luke.x + 7.4} y1="69.8" x2={luke.x + 9.6} y2="67.6" stroke={S.mork.flate} strokeWidth="0.6" />
        </g>
      )}
      <rect x={hus.x} y="75.6" width={hus.b} height={g - 75.6} fill={S.hvit.flate} />
      <Bunnskygge x={hus.x} y={topp} b={hus.b} h={hus.h} />
      <rect x={hus.x} y="77" width={hus.b} height="1.4" fill={S.vin.flate} />
      <Kloss x={luke.x - 1} y={76.4} b={luke.b + 2} h={1.6} d={3} m={S.metall} />
      {/* Markise over luka. */}
      <polygon points={`${luke.x - 1},62.6 ${luke.x + luke.b + 1},62.6 ${luke.x + luke.b + 2.4},59.4 ${luke.x - 2.4},59.4`} fill={S.oker.flate} />
      {/* Døra. */}
      {stor && (
        <g>
          <rect x="58" y={g - 21} width="9" height="21" fill={S.glass.skygge} />
          <rect x="58" y={g - 21} width="9" height="21" fill="none" stroke={S.metall.flate} strokeWidth="0.8" />
          <Glans points={`58,${g - 21} 62,${g - 21} 58,${g - 13}`} />
          <rect x="65.4" y={g - 11} width="0.8" height="3" fill={S.metall.lys} />
        </g>
      )}
      {/* Takbåndet og pipa. */}
      <Kloss x={hus.x - 1} y={topp + 3} b={hus.b + 2} h={3.4} d={hus.d + 2} m={S.vin} />
      {stor && (
        <g>
          <Kloss x={60} y={topp - 6} b={4} h={8} d={3} m={S.metall} />
          <circle className="anim-roeyk" cx="62.4" cy={topp - 17} r="2" fill={S.hvit.flate} opacity="0.65" />
          <circle className="anim-roeyk sen" cx="64.6" cy={topp - 21} r="2.6" fill={S.hvit.flate} opacity="0.4" />
        </g>
      )}
      {!stor && (
        <g>
          {/* Lufteventilen med os fra grillen (G10). */}
          <rect x="37" y={topp - 4} width="2.4" height="4" fill={S.metall.flate} />
          <rect x="36.6" y={topp - 4.6} width="3.2" height="0.8" fill={S.metall.skygge} />
          <circle className="anim-roeyk" cx="38.4" cy={topp - 7.6} r="1.4" fill={S.hvit.flate} opacity="0.6" />
          <circle className="anim-roeyk sen" cx="39.8" cy={topp - 10.6} r="1.9" fill={S.hvit.flate} opacity="0.38" />
          <rect x="42" y={topp - 9} width="12" height="8" rx="1.4" fill={S.mork.flate} />
          {burger(48, topp - 4.4, 0.8)}
        </g>
      )}
      {/* Dressingflasker på disken. */}
      {f >= 2 && (
        <g>
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={luke.x + luke.b - 6 + i * 2.8} y="71.4" width="2.2" height="5" rx="0.7" fill={i ? S.vin.lys : S.oker.lys} />
              <rect x={luke.x + luke.b - 5.4 + i * 2.8} y="70.4" width="1" height="1.2" fill={S.hvit.lys} />
            </g>
          ))}
        </g>
      )}
      {/* Drive-in: luke på siden, skilt med pil og pil i kjørebanen. */}
      {f >= 3 && (
        <g>
          <polygon points={`${hus.x + hus.b + 1.4},${g - 8} ${inn(hus.x + hus.b + 1.4, g - 8, 7).join(',')} ${inn(hus.x + hus.b + 1.4, g - 16, 7).join(',')} ${hus.x + hus.b + 1.4},${g - 16}`} fill={S.vinduLys.flate} />
          <rect x={stor ? 74 : 68} y={g - 8} width="1" height="10" fill={S.metall.skygge} />
          <rect x={stor ? 70.4 : 64.4} y={g - 14.6} width="8.2" height="7" rx="1" fill={S.oker.flate} />
          <path d={`M${stor ? 72 : 66} ${g - 11.1} H${stor ? 76.6 : 70.6} M${stor ? 74.8 : 68.8} ${g - 13} L${stor ? 76.8 : 70.8} ${g - 11.1} L${stor ? 74.8 : 68.8} ${g - 9.2}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${stor ? 78 : 72} ${g + 5} H${stor ? 88 : 82} M${stor ? 85 : 79} ${g + 3} L${stor ? 88 : 82} ${g + 5} L${stor ? 85 : 79} ${g + 7}`} fill="none" stroke={S.hvit.flate} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {t >= 3 && (
        <g>
          <Plakett x={24} y={topp - 10} />
          {[luke.x + 6, luke.x + 22].map((x) => (
            <Lampe key={x} x={x} y={topp + 4.6} r={2} />
          ))}
          <Kloss x={hus.x + 1} y={g} b={10} h={3} d={3} m={S.treverk} />
          {[2.5, 5.5, 8.5].map((dx) => (
            <circle key={dx} cx={hus.x + 1 + dx} cy={g - 3.8} r="1.7" fill={dx === 5.5 ? S.oker.lys : S.lov.flate} />
          ))}
        </g>
      )}
      {t >= 2 && (
        <>
          <Figur x={9} y={g + 5} avstand="gate" klaer={S.petrol} />
          <Figur x={42} y={g + 4} avstand="gate" klaer={S.vin} hud={S.hudMork} har={S.mork.skygge} vendt={-1} />
        </>
      )}
      {t >= 3 && <Figur x={18} y={g + 7} avstand="gate" klaer={S.oker} ben={S.marine.skygge} vendt={-1} />}
    </>
  )
}

/**
 * Kiosken (ny stil, gateavstand): en liten paviljong i puss med skiltbånd,
 * markise over luka og dør til høyre. Nivå 25 får en isboks med flagg, 50
 * kunder, 100 gullkant, lamper og plakett. Forbedringene: kaffe (skilt og
 * maskin), pakkeautomat og døgnåpent (måneskilt og varmt lys inne). I scenen
 * går folk forbi på fortauet (G10).
 */
const kiosk: B = (t, f) => {
  const g = GRUNNLINJE
  const lysInne = f >= 3 || t >= 3
  const varer = [S.oker, S.petrol, S.vin, S.hvit, S.gran, S.oker, S.vin]
  return (
    <>
      {/* Byen bak, i disen (G13). */}
      <Kantfade>
        <Byrekke start={0} />
      </Kantfade>
      <Bakke type="fortau" />
      {/* Busskuret til venstre og sykkelstativet til høyre (G13). */}
      <Busskur x={-29} />
      <rect x="103" y={g - 7} width="30" height="0.8" fill={S.metall.flate} />
      {[104, 132].map((x) => (
        <rect key={x} x={x} y={g - 7} width="0.8" height="7" fill={S.metall.skygge} />
      ))}
      <Sykkel x={106} y={g} farge={S.petrol.flate} />
      <Sykkel x={119} y={g + 1} farge={t >= 2 ? S.oker.flate : S.vin.flate} />
      <Slagskygge x1={28} x2={70} lengde={18} d={22} />
      {/* Nivå 25: et tilbygg til venstre med avisvindu — der står pakkeautomaten når den er kjøpt. */}
      {t >= 1 && (
        <g>
          <Kloss x={12} b={16} h={22} d={16} m={S.puss} />
          <Kloss x={11} y={g - 20} b={18} h={3.6} d={18} m={{ lys: S.skifer.flate, flate: S.marine.flate, skygge: S.marine.skygge }} />
          {f >= 2 ? (
            <g>
              <rect x="13.4" y={g - 15.4} width="13.2" height="15.4" fill={S.petrol.flate} />
              {[0, 1].map((k) =>
                [0, 1, 2].map((r) => <rect key={`${k}-${r}`} x={14.2 + k * 6.2} y={g - 14.6 + r * 4.8} width="5.4" height="4" rx="0.4" fill={S.petrol.lys} opacity="0.6" />),
              )}
            </g>
          ) : (
            <g>
              <rect x="14" y={g - 15} width="12" height="11" fill={S.glass.skygge} />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x={14.8 + i * 3.8} y={g - 10.6 + (i % 2)} width="3.2" height="5" fill={S.hvit.lys} />
                  <rect x={15.2 + i * 3.8} y={g - 9.6 + (i % 2)} width="2.4" height="0.6" fill={S.mork.flate} />
                </g>
              ))}
              <Glans points={`14,${g - 15} 18,${g - 15} 15,${g - 4} 14,${g - 4}`} />
            </g>
          )}
        </g>
      )}
      {/* Pakkeautomaten står fritt før tilbygget kommer. */}
      {f >= 2 && t === 0 && (
        <g>
          <Kloss x={12} b={15} h={23} d={9} m={S.petrol} />
          {[0, 1].map((k) =>
            [0, 1, 2, 3].map((r) => <rect key={`${k}-${r}`} x={13.4 + k * 6.6} y={g - 21.6 + r * 5.3} width="5.6" height="4.5" rx="0.4" fill={S.petrol.lys} opacity="0.55" />),
          )}
          <rect x="17" y={g - 19.8} width="5" height="3" rx="0.4" fill={S.glass.lys} />
        </g>
      )}
      {/* Selve kiosken. */}
      <Kloss x={28} b={42} h={29} d={22} m={S.puss} />
      <Bunnskygge x={28} y={g - 16} b={42} h={16} />
      <rect x="28" y={g - 3} width="42" height="3" fill={S.stein.skygge} />
      {/* Skiltbåndet med «24», tegnet som streker. */}
      <Kloss x={26} y={56} b={46} h={9} d={24} m={{ lys: S.skifer.flate, flate: S.marine.flate, skygge: S.marine.skygge }} />
      <rect x="42" y="48.4" width="14" height="6.2" rx="1" fill={S.vin.flate} />
      <path d="M45.2 50.4 Q45.2 49.3 46.6 49.3 Q48 49.3 48 50.4 Q48 51.3 47 52 L45.2 53.6 H48.1 M52.7 53.7 V49.3 L50.3 52.3 H53.9" fill="none" stroke={S.hvit.lys} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      {t >= 3 && <rect x="26" y="55.2" width="46" height="0.8" fill={S.gull.flate} />}
      {/* Døgnåpent: et måneskilt på båndet. */}
      {f >= 3 && (
        <g>
          <rect x="60" y="48.4" width="8" height="6.2" rx="1" fill={S.mork.skygge} />
          <path d="M64.6 49.6 A2.4 2.4 0 1 0 65.4 53.6 A1.9 1.9 0 1 1 64.6 49.6 Z" fill={S.vinduLys.lys} />
        </g>
      )}
      {/* Luka: hyller med varer bak glasset, disk foran. */}
      <rect x="31" y="63" width="22" height="12.5" fill={lysInne ? S.vinduLys.skygge : S.mork.lys} />
      {[67.4, 71.2].map((y) => (
        <rect key={y} x="31" y={y} width="22" height="0.8" fill={S.metall.skygge} />
      ))}
      {varer.map((m, i) => (
        <rect key={i} x={32.4 + i * 3} y={64.6 + (i % 2) * 0.6} width="2.2" height={2.8 - (i % 2) * 0.6} fill={m.flate} />
      ))}
      {varer.map((_, i) => (
        <rect key={`n${i}`} x={33.2 + i * 2.8} y={68.6 + (i % 3) * 0.4} width="1.8" height={2.6 - (i % 3) * 0.4} fill={varer[(i + 3) % varer.length].lys} />
      ))}
      {/* Kaffemaskinen i luka. */}
      {f >= 1 && (
        <g>
          <rect x="45" y="71.6" width="6" height="3.9" fill={S.metall.flate} />
          <rect x="45" y="71.6" width="6" height="1" fill={S.metall.lys} />
          <rect x="47.4" y="73.4" width="1.6" height="2.1" fill={S.hvit.lys} />
        </g>
      )}
      <Glans points="31,63 41,63 34.5,75.5 31,75.5" />
      <rect x="31" y="63" width="22" height="12.5" fill="none" stroke={S.hvit.flate} strokeWidth="0.8" />
      <Kloss x={29.5} y={77.4} b={25} h={1.9} d={3} m={S.metall} />
      {/* Markisen over luka. */}
      <polygon points="30,57 54,57 55.8,62.6 28.2,62.6" fill={S.hvit.flate} />
      {[0, 2, 4].map((i) => (
        <polygon key={i} points={`${30 + i * 4},57 ${34 + i * 4},57 ${33.8 + i * 4.6},62.6 ${28.2 + i * 4.6},62.6`} fill={S.vin.flate} />
      ))}
      <rect x="28.2" y="62.6" width="27.6" height="1.2" fill={S.vin.skygge} />
      {/* Døra. */}
      <rect x="57" y={g - 21} width="9.6" height="21" fill={S.treMork.flate} />
      <rect x="58.5" y={g - 19} width="6.6" height="9.5" fill={lysInne ? S.vinduLys.flate : S.glass.skygge} />
      <rect x="56.4" y={g - 21.6} width="10.8" height="0.8" fill={S.hvit.flate} />
      <circle cx="64.9" cy={g - 8.6} r="0.6" fill={S.gull.flate} />
      {/* Kaffeskiltet som henger ut fra hjørnet til høyre. */}
      {f >= 1 && (
        <g transform="translate(52 0)">
          <rect x="18" y="57.6" width="6.4" height="0.8" fill={S.mork.flate} />
          <line x1="23.6" y1="58.4" x2="23.6" y2="60" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx="23.6" cy="63.6" r="3.8" fill={S.hvit.lys} stroke={S.treMork.flate} strokeWidth="0.6" />
          <path d="M21.6 62.4 H25 V64.4 A1.7 1.7 0 0 1 23.3 66 A1.7 1.7 0 0 1 21.6 64.4 Z" fill={S.treMork.flate} />
          <circle cx="25.6" cy="63.6" r="0.9" fill="none" stroke={S.treMork.flate} strokeWidth="0.5" />
          <path className="anim-damp" d="M23 61.6 Q22.2 60.6 23 59.8" fill="none" stroke={S.hvit.flate} strokeWidth="0.5" strokeLinecap="round" />
        </g>
      )}
      {/* Nivå 25: isboks og flagg på fortauet. */}
      {t >= 1 && (
        <g>
          <Kloss x={73} y={g + 3} b={12} h={8} d={5} m={S.hvit} />
          <rect x="74" y={g - 4.2} width="10" height="2.2" fill={S.glass.flate} />
          <line x1="89" y1={g + 4} x2="89" y2="55" stroke={S.metall.skygge} strokeWidth="0.8" />
          <path d="M88.6 56 Q82 57 82.6 66 L83.4 80 L88.6 80 Z" fill={S.oker.flate} />
          <path d="M88.6 56 Q86.6 57 86.4 66 L86.6 80 L88.6 80 Z" fill={S.oker.skygge} />
          <polygon points="84,68 86.6,68 85.3,73" fill={S.treverk.lys} />
          <circle cx="85.3" cy="66.8" r="1.6" fill={S.vin.lys} />
        </g>
      )}
      {/* Nivå 100: messinglamper ved døra. */}
      {t >= 3 && (
        <g>
          {[55.4, 68.2].map((x) => (
            <g key={x}>
              <circle cx={x} cy="65.5" r="2.6" fill={S.vinduLys.lys} opacity="0.35" />
              <rect x={x - 0.8} y="64" width="1.6" height="2.8" rx="0.5" fill={S.gull.flate} />
            </g>
          ))}
        </g>
      )}
      {t >= 3 && <Plakett x={28} y={47.2} />}
      {/* Kunder: to ved nivå 50, tre ved 100. */}
      {/* Før kundene kommer, går noen forbi (G10). */}
      {t < 2 && (
        <g className="anim-glid">
          <Figur x={16} y={g + 4.2} avstand="gate" klaer={S.oker} hud={S.hudMork} har={S.mork.skygge} />
        </g>
      )}
      {t >= 2 && (
        <>
          <g className="anim-glid sen">
            <Figur x={42} y={g + 1.6} avstand="gate" klaer={S.petrol} vendt={-1} />
          </g>
          <Figur x={18} y={g + 4.2} avstand="gate" klaer={S.oker} hud={S.hudMork} har={S.mork.skygge} />
        </>
      )}
      {t >= 3 && <Figur x={63} y={g + 5} avstand="gate" klaer={S.vin} ben={S.marine.skygge} vendt={-1} />}
    </>
  )
}

/**
 * Kafeen (gateavstand): en kafé i første etasje av et bygårdshus med grønn
 * markise på nivå 1. Fra 25 tar den over butikken ved siden av, ved 50 kommer
 * bord på fortauet og kunder, og ved 100 gullskrift, lamper og blomsterkasser.
 * Forbedringene: espressomaskin i vinduet, bakeri med kringleskilt og boller,
 * og takterrasse med rekkverk og parasoll. Koppen på skiltet damper.
 */
const kafe: B = (t, f) => {
  const g = GRUNNLINJE
  const markise = (x: number, b: number) => (
    <g>
      <polygon points={`${x},50 ${x + b},50 ${x + b + 2},57 ${x - 2},57`} fill={S.gran.flate} />
      {Array.from({ length: Math.floor(b / 6) }, (_, i) => (
        <polygon key={i} points={`${x + 3 + i * 6},50 ${x + 4.4 + i * 6},50 ${x + 4.2 + i * 6 + ((i * 6 + 3.7 - b / 2) / b) * 4},57 ${x + 2.4 + i * 6 + ((i * 6 + 3.7 - b / 2) / b) * 4},57`} fill={S.hvit.flate} opacity="0.8" />
      ))}
      <rect x={x - 2} y="57" width={b + 4} height="1.2" fill={S.gran.skygge} />
    </g>
  )
  return (
    <>
      <Bakke type="fortau" />
      {/* Naboene til venstre (G14): bokhandelen, og på nivå 1 en tom butikk som kafeen tar over ved 25. */}
      <Gatehus x={-40} b={48} h={46} m={S.oker}>
        <rect x="-38" y="52.6" width="44" height="4" fill={S.marine.skygge} />
        {[-34, -28, -21, -15, -9].map((x, i) => (
          <rect key={x} x={x} y="54" width={i % 2 ? 3.4 : 4.6} height="1.2" rx="0.6" fill={S.hvit.flate} />
        ))}
        <Butikkvindu x={-36} b={30} lys>
          {/* Bokryggene på to hyller. */}
          {[61.4, 68.6].map((y) => (
            <g key={y}>
              {Array.from({ length: 13 }, (_, i) => (
                <rect key={i} x={r2(-35 + i * 2.15)} y={r2(y + 0.6 + ((i * 7) % 3) * 0.6)} width="1.6" height={r2(4.6 - ((i * 7) % 3) * 0.6)} fill={[S.vin.flate, S.gran.flate, S.oker.flate, S.marine.flate, S.hvit.flate][i % 5]} />
              ))}
              <rect x="-35.4" y={r2(y + 5.4)} width="28.6" height="0.6" fill={S.treMork.flate} />
            </g>
          ))}
        </Butikkvindu>
      </Gatehus>
      {t === 0 && (
        <Gatehus x={8} b={24} h={50} m={S.tegl}>
          <rect x="10" y="60" width="20" height="20" fill={S.puss.lys} />
          <rect x="10" y="60" width="20" height="20" fill="none" stroke={S.treMork.flate} strokeWidth="0.9" />
          {/* Lappen i vinduet: lokalet er ledig. */}
          <rect x="16.4" y="65" width="7" height="9" fill={S.hvit.lys} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x="17.4" y={r2(66.6 + i * 2.2)} width={i === 1 ? 3.4 : 5} height="0.7" fill={S.mork.lys} />
          ))}
        </Gatehus>
      )}
      {/* Nivå 25: butikken ved siden av blir en del av kafeen. */}
      {t >= 1 && (
        <g>
          <Kloss x={8} b={24} h={50} d={16} m={S.tegl} />
          <Vindusrad x={11} y={39} antall={2} b={7} h={9} mellom={4} karm={S.hvit.lys} tent={2} start={1} />
          <rect x="10" y="60" width="20" height="20" fill={S.vinduLys.skygge} />
          <Glans points="10,60 17,60 12,80 10,80" />
          <rect x="10" y="60" width="20" height="20" fill="none" stroke={S.treMork.flate} strokeWidth="0.9" />
          {markise(10, 20)}
          <Bunnskygge x={8} y={56} b={24} h={28} />
        </g>
      )}
      <Slagskygge x1={32} x2={66} lengde={18} d={18} />
      {/* Bygårdshuset. */}
      <Kloss x={32} b={34} h={62} d={18} m={S.puss} />
      <Kloss x={31} y={24} b={36} h={2.4} d={20} m={S.hvit} />
      <Vindusrad x={35} y={26} antall={3} b={7} h={9} mellom={4} karm={S.hvit.lys} tent={2} />
      {t >= 3 &&
        [35, 46, 57].map((x) => (
          <g key={x}>
            <rect x={x - 0.6} y="35.6" width="8.2" height="1.6" fill={S.treverk.flate} />
            {[1, 3.5, 6].map((dx, i) => (
              <circle key={dx} cx={x + dx} cy="35" r="1.3" fill={i === 1 ? S.vin.lys : S.lov.flate} />
            ))}
          </g>
        ))}
      {/* Kafeen i første etasje: vindu, dør, skilt og markise. */}
      <rect x="34" y="59" width="20" height="21" fill={S.vinduLys.skygge} />
      {[0, 1].map((i) => (
        <circle key={i} cx={40 + i * 9} cy="63" r="1.6" fill={S.vinduLys.lys} opacity="0.8" />
      ))}
      {f >= 1 && (
        <g>
          <rect x="36" y="71" width="7" height="6" fill={S.metall.lys} />
          <rect x="36" y="71" width="7" height="1.2" fill={S.metall.flate} />
          <rect x="38.6" y="73.4" width="1.8" height="2" fill={S.mork.flate} />
          <rect x="37" y="76.4" width="5" height="0.6" fill={S.metall.skygge} />
        </g>
      )}
      {f >= 2 &&
        [46, 49.4, 52.6].map((x) => (
          <g key={x}>
            <circle cx={x} cy="77.6" r="1.6" fill={S.oker.flate} />
            <circle cx={x - 0.4} cy="77.1" r="0.7" fill={S.oker.lys} />
          </g>
        ))}
      <rect x="34" y="77.6" width="20" height="2.4" fill={S.treverk.flate} opacity={f >= 2 ? 0.9 : 0} />
      <Glans points="34,59 41,59 36,80 34,80" />
      <rect x="34" y="59" width="20" height="21" fill="none" stroke={S.treMork.flate} strokeWidth="0.9" />
      <rect x="56" y={g - 23} width="8.4" height="23" fill={S.treMork.flate} />
      <rect x="57.4" y={g - 21} width="5.6" height="12" fill={S.vinduLys.flate} />
      <circle cx="62.6" cy={g - 8} r="0.6" fill={S.gull.flate} />
      <Bunnskygge x={32} y={50} b={34} h={34} />
      <rect x="36" y="44" width="26" height="5" fill={S.gran.skygge} />
      {[39, 44, 49, 54].map((x, i) => (
        <rect key={x} x={x} y="45.9" width={i % 2 ? 3 : 4} height="1.2" rx="0.6" fill={t >= 3 ? S.gull.lys : S.hvit.flate} />
      ))}
      {markise(34, 30)}
      {t >= 3 && <Plakett x={43} y={35.6} />}
      {t >= 3 && [55.2, 65].map((x) => <Lampe key={x} x={x} y={g - 19} r={1.8} />)}
      {/* Naboene til høyre (G14): blomsterbutikken med bøtter på fortauet, og et høyere hus. */}
      <Gatehus x={66} b={36} h={46} m={S.hvit}>
        <rect x="76" y="52.6" width="24" height="4" fill={S.lov.skygge} />
        {[79, 84, 89, 94].map((x, i) => (
          <rect key={x} x={x} y="54" width={i % 2 ? 3 : 4} height="1.2" rx="0.6" fill={S.hvit.lys} />
        ))}
        <Butikkvindu x={78} b={14} karm={S.lov.skygge}>
          {[[80.4, 70], [83.6, 68.6], [86.8, 70.4], [89.6, 69]].map(([x, y], i) => (
            <g key={x}>
              <circle cx={x} cy={y} r="2" fill={S.lov.flate} />
              <circle cx={r2(x + 0.6)} cy={r2(y - 0.8)} r="1.1" fill={[S.vin.lys, S.oker.lys, S.hvit.lys, S.vin.flate][i]} />
            </g>
          ))}
        </Butikkvindu>
      </Gatehus>
      {/* Bøttene med blomster utenfor. */}
      {[79, 84.5, 90].map((x, i) => (
        <g key={x}>
          {[0, 1, 2].map((j) => (
            <circle key={j} cx={r2(x + 0.8 + j * 1.2)} cy={r2(g - 6 - (j % 2))} r="1.3" fill={[S.vin.lys, S.oker.lys, S.hvit.lys][(i + j) % 3]} />
          ))}
          <rect x={x} y={g - 5} width="4" height="5" fill={S.metall.flate} />
          <rect x={r2(x + 2.8)} y={g - 5} width="1.2" height="5" fill={S.metall.skygge} />
        </g>
      ))}
      <Gatehus x={102} b={34} h={58} m={S.faluRod}>
        <Butikkvindu x={106} b={16} />
      </Gatehus>
      {/* Skiltet med koppen, som damper. */}
      <rect x="66" y="38.6" width="6" height="0.8" fill={S.mork.flate} />
      <circle cx="71.4" cy="44" r="4" fill={S.gran.flate} stroke={S.hvit.lys} strokeWidth="0.6" />
      <path d="M69.4 42.8 H72.8 V44.8 A1.7 1.7 0 0 1 71.1 46.4 A1.7 1.7 0 0 1 69.4 44.8 Z" fill={S.hvit.lys} />
      <circle cx="73.3" cy="44" r="0.9" fill="none" stroke={S.hvit.lys} strokeWidth="0.5" />
      <path className="anim-damp" d="M70.6 41.8 Q69.8 40.8 70.6 40" fill="none" stroke={S.hvit.lys} strokeWidth="0.5" strokeLinecap="round" />
      <path className="anim-damp sen" d="M71.8 41.8 Q71 40.8 71.8 40" fill="none" stroke={S.hvit.lys} strokeWidth="0.5" strokeLinecap="round" />
      {/* Bakeriet: kringla henger ut fra veggen. */}
      {f >= 2 && (
        <g>
          <rect x="66" y="56.6" width="5" height="0.8" fill={S.mork.flate} />
          <path d="M66.6 64.6 C64.6 59.6 69.6 58.6 70.6 62.6 C71.6 58.6 76.6 59.6 74.6 64.6 C72.6 67.6 68.6 67.6 66.6 64.6 Z M68.6 61.6 L72.6 65.6 M72.6 61.6 L68.6 65.6" fill="none" stroke={S.gull.flate} strokeWidth="1.3" strokeLinejoin="round" />
        </g>
      )}
      {/* Takterrassen. */}
      {f >= 3 && (
        <g>
          <line x1="50" y1="21" x2="50" y2="9" stroke={S.metall.skygge} strokeWidth="0.6" />
          <path d="M41 12.4 Q50 6 59 12.4 Z" fill={S.oker.lys} />
          <path d="M50 7.4 Q56 8.4 59 12.4 L50 12.4 Z" fill={S.oker.flate} />
          <line x1="31" y1="18" x2="67" y2="18" stroke={S.metall.flate} strokeWidth="0.6" />
          {[32, 38, 44, 56, 62, 66].map((x) => (
            <line key={x} x1={x} y1="18" x2={x} y2="21.6" stroke={S.metall.flate} strokeWidth="0.5" />
          ))}
          <circle cx="35" cy="19.4" r="1.6" fill={S.lov.flate} />
          <circle cx="63" cy="19.4" r="1.6" fill={S.lov.flate} />
        </g>
      )}
      {/* Bord på fortauet fra nivå 50. */}
      {t >= 2 &&
        [44, 76].map((x) => (
          <g key={x}>
            <rect x={x - 0.4} y={g + 0.4} width="0.8" height="5.6" fill={S.mork.flate} />
            <ellipse cx={x} cy={g + 0.4} rx="3.6" ry="1" fill={S.metall.lys} />
            <path d={`M${x + 4} ${g + 6} V${g + 1.6} M${x + 4} ${g + 3.4} H${x + 7} V${g + 6}`} fill="none" stroke={S.mork.flate} strokeWidth="0.6" />
          </g>
        ))}
      {t >= 2 && (
        <>
          <Figur x={82} y={g + 6} avstand="gate" klaer={S.marine} vendt={-1} />
          <Figur x={22} y={g + 5} avstand="gate" klaer={S.vin} hud={S.hudMork} har={S.mork.skygge} />
        </>
      )}
      {t >= 3 && <Figur x={70} y={g + 4} avstand="gate" klaer={S.oker} ben={S.treMork.skygge} />}
    </>
  )
}

/**
 * Restauranten (gateavstand): en bistro i første etasje av et steinhus på
 * nivå 1. Fra 25 tar den andre etasje (buede, opplyste vinduer) og en fløy med
 * et stort buevindu, ved 50 kommer baldakin over døra og gjester, og ved 100
 * dørvakt, messinglamper, blomsterkasser og gullskrift. Forbedringene:
 * kjendiskokken i vinduet, vinkjeller (tønne og kjellervindu) og
 * Michelin-skiltet ved døra. I scenen flakker lysene på bordene og det ryker
 * fra kjøkkenet (G10).
 */
const restaurant: B = (t, f) => {
  const g = GRUNNLINJE
  const stor = t >= 1
  const bue = (x: number, y: number, b: number, h: number, fyll: string) => <path d={`M${x} ${y + h} V${y + b / 2} A${b / 2} ${b / 2} 0 0 1 ${x + b} ${y + b / 2} V${y + h} Z`} fill={fyll} />
  return (
    <>
      <Bakke type="fortau" />
      {/* Naboene til venstre (G14): et hus, vinbaren, og på nivå 1 et smalt hus der fløyen kommer ved 25. */}
      <Gatehus x={-40} b={30} h={52} m={S.puss}>
        <Butikkvindu x={-37} b={14} karm={S.stein.skygge} />
      </Gatehus>
      <Gatehus x={-10} b={24} h={50} m={S.treMork}>
        <rect x="-8" y="52.6" width="20" height="4" fill={S.vin.skygge} />
        {[-5, 0.4, 5.4].map((x, i) => (
          <rect key={x} x={x} y="54" width={i % 2 ? 3.4 : 4} height="1.2" rx="0.6" fill={S.gull.lys} />
        ))}
        <Butikkvindu x={-8} b={12} karm={S.gull.skygge} lys>
          {/* Flaskene i vinduet. */}
          {[-6.4, -3.6, -0.8, 2].map((x, i) => (
            <g key={x}>
              <rect x={x} y="70" width="1.8" height="6" rx="0.5" fill={i % 2 ? S.gran.skygge : S.vin.skygge} />
              <rect x={r2(x + 0.5)} y="68.4" width="0.8" height="1.8" fill={i % 2 ? S.gran.skygge : S.vin.skygge} />
            </g>
          ))}
          <rect x="-7.4" y="76" width="10.8" height="0.8" fill={S.treMork.skygge} />
        </Butikkvindu>
      </Gatehus>
      {!stor && (
        <Gatehus x={14} b={18} h={46} m={S.oker}>
          <Butikkvindu x={15.6} b={6} karm={S.treMork.flate} />
        </Gatehus>
      )}
      {/* Fløyen med det store buevinduet fra nivå 25. */}
      {stor && (
        <g>
          <Kloss x={14} b={18} h={40} d={16} m={S.stein} />
          <Kloss x={13} y={46} b={20} h={2} d={18} m={S.hvit} />
          {bue(17.5, 54, 11, 24, S.hvit.lys)}
          {bue(18.5, 55, 9, 22.5, S.vinduLys.flate)}
          <rect x="22.6" y="56" width="0.8" height="21.5" fill={S.hvit.lys} />
          <rect x="18.5" y="66" width="9" height="0.8" fill={S.hvit.lys} />
          {t >= 3 && <Plakett x={17} y={36} />}
        </g>
      )}
      <Slagskygge x1={32} x2={66} lengde={18} d={18} />
      {/* Steinhuset. */}
      <Kloss x={32} b={34} h={58} d={18} m={S.stein} />
      {[34, 40, 46].map((y) => (
        <rect key={y} x="32" y={y} width="34" height="0.4" fill={S.stein.skygge} opacity="0.6" />
      ))}
      <Kloss x={31} y={28} b={36} h={2.4} d={20} m={S.hvit} />
      {/* Ventilen fra kjøkkenet, med os (G10). */}
      <Kloss x={60} y={23.6} b={3} h={4.4} d={2} m={S.metall} />
      <circle className="anim-roeyk" cx="61.8" cy="16.4" r="1.6" fill={S.hvit.flate} opacity="0.55" />
      <circle className="anim-roeyk sen" cx="63.6" cy="12.6" r="2.1" fill={S.hvit.flate} opacity="0.35" />
      {stor ? (
        [35, 45.6, 56.2].map((x) => (
          <g key={x}>
            {bue(x - 0.6, 31.4, 7.6, 13.2, S.hvit.lys)}
            {bue(x, 32, 6.4, 12, S.vinduLys.flate)}
            {t >= 3 && (
              <g>
                <rect x={x - 0.8} y="44" width="8" height="1.6" fill={S.treverk.flate} />
                {[1, 3.2, 5.4].map((dx, i) => (
                  <circle key={dx} cx={x + dx} cy="43.4" r="1.2" fill={i === 1 ? S.vin.lys : S.lov.flate} />
                ))}
              </g>
            )}
          </g>
        ))
      ) : (
        <Vindusrad x={35} y={33} antall={3} b={6.4} h={10} mellom={4.2} karm={S.hvit.lys} />
      )}
      {/* Butikkfronten i dyp vinrød, med vindu og dør. */}
      <rect x="32" y="51" width="34" height={g - 51} fill={S.vin.flate} />
      <rect x="34" y="52.4" width="30" height="4" fill={S.mork.skygge} />
      {[37, 42, 46, 51, 56].map((x, i) => (
        <rect key={x} x={x} y="53.8" width={i % 2 ? 3 : 4} height="1.2" rx="0.6" fill={t >= 3 ? S.gull.lys : S.hvit.flate} />
      ))}
      <rect x="35" y="59" width="17" height="20" fill={S.vinduLys.flate} />
      {[39, 47].map((x, i) => (
        <g key={x}>
          <rect x={x - 2.6} y="73" width="5.2" height="1" fill={S.hvit.lys} />
          <rect x={x - 0.4} y="74" width="0.8" height="5" fill={S.mork.flate} />
          <circle className={i ? 'anim-flamme sen' : 'anim-flamme'} cx={x} cy="71.6" r="1" fill={S.vinduLys.lys} />
        </g>
      ))}
      {/* Kjendiskokken i vinduet. */}
      {f >= 1 && (
        <g>
          <Figur x={44} y={g - 3} avstand="gate" klaer={S.hvit} />
          <rect x="42.6" y="61.2" width="2.8" height="2.4" fill={S.hvit.lys} />
          <circle cx="44" cy="61" r="1.7" fill={S.hvit.lys} />
        </g>
      )}
      <rect x="32" y="79" width="34" height={g - 79} fill={S.vin.flate} />
      {/* Vinkjelleren: et opplyst kjellervindu. */}
      {f >= 2 && <rect x="36" y="80.6" width="15" height="2.4" fill={S.vinduLys.skygge} />}
      <Glans points="35,59 42,59 37,79 35,79" />
      <rect x="35" y="59" width="17" height="20" fill="none" stroke={S.gull.skygge} strokeWidth="0.6" />
      <rect x="55" y={g - 22} width="8.6" height="22" fill={S.treMork.skygge} />
      <rect x="56.4" y={g - 20} width="5.8" height="10" fill={S.vinduLys.skygge} />
      <circle cx="61.6" cy={g - 9} r="0.6" fill={S.gull.flate} />
      <Bunnskygge x={32} y={51} b={34} h={33} />
      {/* Naboene til høyre (G14): et lite galleri med et maleri i vinduet, og et høyere hus. */}
      <Gatehus x={66} b={34} h={46} m={S.hvit}>
        <rect x="72" y="52.6" width="24" height="4" fill={S.mork.skygge} />
        {[75, 80, 85, 90].map((x, i) => (
          <rect key={x} x={x} y="54" width={i % 2 ? 3 : 4.2} height="1.2" rx="0.6" fill={S.hvit.lys} />
        ))}
        <Butikkvindu x={74} b={16} karm={S.mork.flate} lys>
          {/* Maleriet på staffeliet. */}
          <line x1="80" y1="76.6" x2="81.6" y2="62" stroke={S.treverk.skygge} strokeWidth="0.6" />
          <line x1="84" y1="76.6" x2="82.4" y2="62" stroke={S.treverk.skygge} strokeWidth="0.6" />
          <rect x="77" y="62.4" width="10" height="8" fill={S.gull.flate} />
          <rect x="77.8" y="63.2" width="8.4" height="6.4" fill={S.petrol.lys} />
          <circle cx="84" cy="65" r="1.1" fill={S.oker.lys} />
          <path d="M77.8 69.6 L80.6 66.4 L82.6 68.2 L84.4 66.8 L86.2 69.6 Z" fill={S.gran.flate} />
        </Butikkvindu>
      </Gatehus>
      <Gatehus x={100} b={36} h={56} m={S.tegl}>
        <Butikkvindu x={104} b={18} />
      </Gatehus>
      {/* Michelin-skiltet over døra. */}
      {f >= 3 && (
        <g>
          <rect x="58" y="44.4" width="6.6" height="6" rx="1" fill={S.hvit.lys} />
          <path d="M61.3 45.4 L62 47 L63.6 47.2 L62.4 48.3 L62.7 49.9 L61.3 49.1 L59.9 49.9 L60.2 48.3 L59 47.2 L60.6 47 Z" fill={S.vin.flate} />
        </g>
      )}
      {/* Baldakinen over døra fra nivå 50. */}
      {t >= 2 && (
        <g>
          <polygon points="53.6,60 65,60 67,64 51.6,64" fill={S.mork.flate} />
          <rect x="51.6" y="64" width="15.4" height="1" fill={t >= 3 ? S.gull.flate : S.mork.skygge} />
        </g>
      )}
      {t >= 3 && [53.6, 65].map((x) => <Lampe key={x} x={x} y={g - 15} r={1.8} />)}
      {/* Vintønna ved døra. */}
      {f >= 2 && (
        <g>
          <rect x="67" y={g - 8} width="6" height="8" rx="1.6" fill={S.treverk.flate} />
          <rect x="70.6" y={g - 8} width="2.4" height="8" rx="1" fill={S.treverk.skygge} />
          {[g - 6.4, g - 1.8].map((y) => (
            <rect key={y} x="67" y={y} width="6" height="0.7" fill={S.metall.skygge} />
          ))}
          <rect x="67.6" y={g - 9.2} width="4.6" height="1.6" rx="0.4" fill={S.vin.skygge} />
        </g>
      )}
      {t >= 2 && (
        <>
          <Figur x={77} y={g + 4} avstand="gate" klaer={S.marine} ben={S.mork.skygge} vendt={-1} />
          <Figur x={83} y={g + 3} avstand="gate" klaer={S.vin} hud={S.hudMork} har={S.mork.skygge} vendt={-1} />
        </>
      )}
      {/* Dørvakten ved nivå 100. */}
      {t >= 3 && (
        <g>
          <Figur x={51} y={g + 3} avstand="gate" klaer={S.marine} ben={S.marine.skygge} />
          <rect x="49.6" y="68.6" width="2.8" height="1.1" rx="0.4" fill={S.mork.skygge} />
          <rect x="50.6" y="74" width="0.8" height="3" fill={S.gull.flate} />
        </g>
      )}
    </>
  )
}

/**
 * Hotellet (fjern avstand): et grand hotell i puss med mansardtak i skifer. Det
 * vokser fra tre etasjer på nivå 1 til fem ved 25, seks og en sidefløy med
 * drosje og gjester ved 50, og sju ved 100 med gullkant, flaggrekke og
 * plakett. Forbedringene: spa med basseng foran, konferansepaviljong i glass
 * og takbar med lys. Flagget på taket vaier.
 */
const hotell: B = (t, f) => {
  const g = GRUNNLINJE
  const etasje = maal('fjern', 'etasje')
  const n = [3, 5, 6, 7][t]
  const b = [24, 28, 28, 30][t]
  const x = [36, 34, 34, 33][t]
  const topp = g - 10 - n * etasje
  const d = 16
  const vinduer = Math.floor((b - 2) / 5)
  return (
    <>
      {/* Torget (G14): byen bak i disen, og husene rundt torget på samme avstand. */}
      <Kantfade>
        <Byrekke start={3} />
      </Kantfade>
      <Bakke type="fortau" />
      <Byrekke fra={92} til={136} y={g - 2} start={5} dis={false} />
      {/* Fontenen med to trær og noen på torget. */}
      <Tre x={-33} y={g - 3} h={24} />
      <Tre x={-2} y={g - 2} h={20} />
      <ellipse cx="-17" cy={g + 2.6} rx="9.6" ry="2.6" fill={S.stein.flate} />
      <ellipse cx="-17" cy={g + 1.8} rx="9.6" ry="2.6" fill={S.stein.lys} />
      <ellipse cx="-17" cy={g + 1.9} rx="8.2" ry="1.9" fill={S.sjo.lys} />
      <rect x="-17.6" y={g - 5} width="1.2" height="6.8" fill={S.stein.lys} />
      <ellipse cx="-17" cy={g - 5} rx="2.6" ry="0.7" fill={S.stein.flate} />
      {[-1, 1].map((s) => (
        <path key={s} className="anim-duve" d={`M-17 ${g - 7.4} q${s * 3} -1.6 ${s * 5} ${4.6}`} fill="none" stroke={S.glass.lys} strokeWidth="0.6" strokeLinecap="round" />
      ))}
      <rect x="-17.4" y={g - 8.4} width="0.8" height="3.4" fill={S.glass.lys} />
      <Figur x={-28} y={g + 4} avstand="fjern" klaer={S.gran} />
      <Figur x={-6} y={g + 5} avstand="fjern" klaer={S.vin} vendt={-1} />
      {/* Konferansepaviljongen i glass til venstre. */}
      {f >= 2 && (
        <g>
          <Slagskygge x1={10} x2={x} lengde={8} d={14} />
          <Kloss x={10} b={x - 10} h={12} d={14} m={S.glass} />
          <rect x="11" y={g - 9} width={x - 12} height="5" fill={S.vinduLys.flate} opacity="0.85" />
          <Kloss x={9} y={g - 11.6} b={x - 8} h={1.4} d={15} m={S.hvit} />
          <Glans points={`10,${g - 12} 16,${g - 12} 12,${g} 10,${g}`} />
        </g>
      )}
      <Slagskygge x1={x} x2={x + b} lengde={22} d={d} />
      {/* Hovedbygget: etasjer med vinduer, lobby og mansardtak. */}
      <Kloss x={x} b={b} h={g - topp} d={d} m={S.puss} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={x} y={g - 10 - (i + 1) * etasje} width={b} height="0.6" fill={S.puss.skygge} opacity="0.7" />
          <Vindusrad x={x + 2.2} y={g - 10 - (i + 1) * etasje + 2.2} antall={vinduer} b={3} h={4.4} mellom={2} tent={t >= 3 ? 2 : 3} start={i} />
        </g>
      ))}
      <rect x={x} y={g - 10} width={b} height="1.4" fill={t >= 3 ? S.gull.flate : S.hvit.flate} />
      <rect x={x + 2} y={g - 7.6} width={b - 4} height="7.6" fill={f >= 1 ? S.petrol.lys : S.vinduLys.skygge} />
      <rect x={x + b / 2 - 3} y={g - 7.6} width="6" height="7.6" fill={S.vinduLys.flate} />
      <polygon points={`${x + b / 2 - 5},${g - 8.6} ${x + b / 2 + 5},${g - 8.6} ${x + b / 2 + 6},${g - 6.6} ${x + b / 2 - 6},${g - 6.6}`} fill={S.marine.flate} />
      {t >= 3 && <rect x={x + b / 2 - 6} y={g - 6.6} width="12" height="0.6" fill={S.gull.flate} />}
      <Bunnskygge x={x} y={topp} b={b} h={g - topp} />
      {/* Mansardtaket med kvister. */}
      <polygon points={`${x + b + 1},${topp} ${inn(x + b + 1, topp, d + 2).join(',')} ${inn(x + b - 2, topp - 6, d - 1).join(',')} ${x + b - 2},${topp - 6}`} fill={S.skifer.skygge} />
      <polygon points={`${x + 2},${topp - 6} ${x + b - 2},${topp - 6} ${inn(x + b - 2, topp - 6, d - 1).join(',')} ${inn(x + 2, topp - 6, d - 1).join(',')}`} fill={S.skifer.lys} />
      <polygon points={`${x - 1},${topp} ${x + b + 1},${topp} ${x + b - 2},${topp - 6} ${x + 2},${topp - 6}`} fill={S.skifer.flate} />
      {Array.from({ length: vinduer - 1 }, (_, i) => (
        <rect key={i} x={x + 4.6 + i * 5} y={topp - 4.4} width="2.2" height="3" fill={S.vinduLys.flate} opacity="0.85" />
      ))}
      <rect x={x - 1} y={topp - 0.6} width={b + 2} height="1.2" fill={t >= 3 ? S.gull.flate : S.hvit.lys} />
      {/* Sidefløyen fra nivå 50. */}
      {t >= 2 && (
        <g>
          <Slagskygge x1={x + b} x2={x + b + 16} lengde={10} d={14} />
          <Kloss x={x + b} b={16} h={10 + 3 * etasje} d={14} m={S.puss} />
          {[0, 1, 2].map((i) => (
            <Vindusrad key={i} x={x + b + 1.6} y={g - 10 - (i + 1) * etasje + 2.2} antall={3} b={3} h={4.4} mellom={2} tent={2} start={i} />
          ))}
          <rect x={x + b + 1.6} y={g - 8} width="12.8" height="5" fill={S.vinduLys.skygge} />
          {t >= 3 && <Plakett x={x + b + 2} y={g - 10 - 3 * etasje - 10} />}
        </g>
      )}
      {/* Takbaren. */}
      {f >= 3 && (
        <g>
          <Kloss x={x + 6} y={topp - 6} b={b - 12} h={5} d={10} m={S.glass} />
          <rect x={x + 7} y={topp - 10} width={b - 14} height="3" fill={S.vinduLys.flate} opacity="0.9" />
          {Array.from({ length: Math.floor((b - 12) / 3) }, (_, i) => (
            <circle key={i} cx={x + 7 + i * 3} cy={topp - 11.6} r="0.5" fill={S.vinduLys.lys} />
          ))}
        </g>
      )}
      {/* Flagget på taket. */}
      <line x1={x + b - 4} y1={topp - 6} x2={x + b - 4} y2={topp - 15} stroke={S.hvit.lys} strokeWidth="0.5" />
      <polygon className="anim-flagg" points={`${x + b - 3.8},${topp - 15} ${x + b + 1.2},${topp - 13.8} ${x + b - 3.8},${topp - 12.6}`} fill={S.vin.lys} />
      {/* Spa: basseng med solsenger foran. */}
      {f >= 1 && (
        <g>
          <polygon points={`66,${g + 5} 88,${g + 5} 91,${g + 1} 69,${g + 1}`} fill={S.hvit.flate} />
          <polygon points={`68,${g + 4.2} 86,${g + 4.2} 88.4,${g + 1.6} 70.4,${g + 1.6}`} fill={S.sjo.lys} />
          <polygon points={`68,${g + 4.2} 86,${g + 4.2} 87,${g + 3} 69,${g + 3}`} fill={S.petrol.lys} opacity="0.6" />
        </g>
      )}
      {/* Ved nivå 100: flaggrekke foran inngangen. */}
      {t >= 3 &&
        [x + 3, x + 7, x + b - 7, x + b - 3].map((fx, i) => (
          <g key={fx}>
            <line x1={fx} y1={g + 2} x2={fx} y2={g - 12} stroke={S.hvit.lys} strokeWidth="0.35" />
            <polygon points={`${fx + 0.2},${g - 12} ${fx + 2.6},${g - 11.3} ${fx + 0.2},${g - 10.6}`} fill={i % 2 ? S.marine.lys : S.vin.lys} />
          </g>
        ))}
      {/* Drosje og gjester fra nivå 50. */}
      {t >= 2 && (
        <g>
          <rect x={x + b / 2 + 6} y={g - 2.6} width="11" height="2.4" rx="0.8" fill={S.mork.flate} />
          <path d={`M${x + b / 2 + 8} ${g - 2.6} L${x + b / 2 + 9.4} ${g - 4.6} H${x + b / 2 + 13.6} L${x + b / 2 + 15} ${g - 2.6} Z`} fill={S.mork.lys} />
          <rect x={x + b / 2 + 10.6} y={g - 5.4} width="1.6" height="0.8" fill={S.oker.lys} />
          {[x + b / 2 + 8.6, x + b / 2 + 14.4].map((cx) => (
            <circle key={cx} cx={cx} cy={g - 0.2} r="1.1" fill={S.mork.skygge} />
          ))}
          <Figur x={x + b / 2 - 4} y={g + 1.4} avstand="fjern" klaer={S.vin} />
          <Figur x={x + b / 2 - 1.6} y={g + 1.8} avstand="fjern" klaer={S.oker} />
        </g>
      )}
      {t >= 3 && <Figur x={x + b / 2 + 4} y={g + 1.6} avstand="fjern" klaer={S.marine} />}
      {/* Drosjeholdeplassen til høyre (G14): skiltet og to drosjer i kø. */}
      <rect x="95.4" y={g - 8} width="0.5" height="9" fill={S.metall.skygge} />
      <rect x="94" y={g - 10.4} width="3.4" height="2.6" rx="0.4" fill={S.oker.lys} />
      {[100, 114].map((bx) => (
        <g key={bx}>
          <rect x={bx} y={g + 0.4} width="11" height="2.4" rx="0.8" fill={S.mork.flate} />
          <path d={`M${bx + 2} ${g + 0.4} L${bx + 3.4} ${g - 1.6} H${bx + 7.6} L${bx + 9} ${g + 0.4} Z`} fill={S.mork.lys} />
          <rect x={bx + 4.6} y={g - 2.4} width="1.6" height="0.8" fill={S.oker.lys} />
          {[bx + 2.6, bx + 8.4].map((cx) => (
            <circle key={cx} cx={cx} cy={g + 2.8} r="1.1" fill={S.mork.skygge} />
          ))}
        </g>
      ))}
    </>
  )
}

/**
 * Banken (gateavstand): en liten filial i et steinhus på nivå 1, et
 * hovedkontor med søyler, gavl og trapp fra 25, sidefløyer og kunder ved 50,
 * og ved 100 marmor, gullkant, flagg og lamper. Forbedringene: en digital
 * søyle for nettbanken, en egen inngang for formuesforvaltning under
 * gullkantet baldakin, og et kurstikker-bånd over inngangen for investeringsbanken.
 * I scenen går en kunde forbi på fortauet (G10).
 */
const bank: B = (t, f) => {
  const g = GRUNNLINJE
  const tempel = t >= 1
  const stein = t >= 3 ? S.hvit : S.stein
  const mynt = (x: number, y: number, r: number) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={S.gull.flate} />
      <circle cx={x} cy={y} r={r * 0.68} fill="none" stroke={S.gull.lys} strokeWidth={r * 0.14} />
    </g>
  )
  const tikker = (x: number, y: number, b: number) => (
    <g>
      <rect x={x} y={y} width={b} height="3.6" fill={S.mork.skygge} />
      {Array.from({ length: Math.floor(b / 3.2) }, (_, i) => (
        <rect key={i} x={x + 0.8 + i * 3.2} y={y + 1.2} width="2.2" height="1.2" fill={i % 3 === 1 ? S.vin.lys : S.gress.lys} />
      ))}
    </g>
  )
  // Den egne inngangen for formuesforvaltning: mørk dør under gullkantet baldakin.
  const privat = (x: number) => (
    <g>
      <rect x={x} y={g - (tempel ? 22 : 18)} width="6" height={tempel ? 17 : 18} fill={S.mork.flate} />
      <rect x={x + 4.4} y={g - (tempel ? 14 : 10)} width="0.7" height="2.4" fill={S.gull.flate} />
      <polygon points={`${x - 1.4},${g - (tempel ? 23 : 19)} ${x + 7.4},${g - (tempel ? 23 : 19)} ${x + 8.4},${g - (tempel ? 21 : 17)} ${x - 2.4},${g - (tempel ? 21 : 17)}`} fill={S.marine.skygge} />
      <rect x={x - 2.4} y={g - (tempel ? 21 : 17)} width="10.8" height="0.6" fill={S.gull.flate} />
    </g>
  )
  return (
    <>
      <Bakke type="brostein" />
      {/* Det gamle torget (G14): steinhus på hver side, et lindetre ved hvert, og statuen. */}
      <Gatehus x={-40} b={20} h={52} m={S.stein}>
        <Butikkvindu x={-38} b={8} karm={S.stein.skygge} />
      </Gatehus>
      <Gatehus x={108} b={28} h={56} m={S.stein}>
        <Butikkvindu x={111} b={12} karm={S.stein.skygge} lys />
      </Gatehus>
      <Tre x={-26} y={g - 2} h={44} />
      <Tre x={100} y={g - 1} h={42} />
      {/* Statuen: en skikkelse i irret bronse på en sokkel i stein. */}
      <Kloss x={-9} y={g + 1} b={9} h={14} d={6} m={S.stein} />
      <Kloss x={-10} y={g - 12.4} b={11} h={1.6} d={7} m={S.stein} />
      <Figur x={-4.4} y={g - 14} avstand="gate" klaer={S.gran} hud={S.gran} har={S.gran.skygge} ben={S.gran.skygge} />
      {/* Sidefløyene fra nivå 50. */}
      {t >= 2 &&
        [9, 74].map((wx) => (
          <g key={wx}>
            <Kloss x={wx} b={13} h={34} d={10} m={stein} />
            <Kloss x={wx - 1} y={g - 33} b={15} h={2} d={12} m={S.hvit} />
            {[0, 1].map((r) => (
              <Vindusrad key={r} x={wx + 1.6} y={g - 30 + r * 13} antall={2} b={4} h={8} mellom={1.8} karm={S.hvit.lys} tent={t >= 3 ? 2 : 0} start={r} />
            ))}
          </g>
        ))}
      {t >= 3 && <Plakett x={14} y={g - 48} />}
      {t >= 3 &&
        [11, 84].map((fx, i) => (
          <g key={fx}>
            <line x1={fx} y1={g - 35} x2={fx} y2={g - 50} stroke={S.hvit.lys} strokeWidth="0.5" />
            <polygon className="anim-flagg" points={`${fx + 0.3},${g - 50} ${fx + 5},${g - 48.8} ${fx + 0.3},${g - 47.6}`} fill={i ? S.marine.lys : S.vin.lys} />
          </g>
        ))}
      {tempel ? (
        <g>
          <Slagskygge x1={18} x2={78} lengde={18} d={20} />
          {/* Trappa, søylene, gesimsen og gavlen. */}
          {[0, 1, 2].map((i) => (
            <Kloss key={i} x={18 + i * 1.6} y={g - i * 1.8} b={60 - i * 3.2} h={1.8} d={20 - i * 0.8} m={stein} />
          ))}
          <Kloss x={22} y={g - 5.4} b={52} h={38} d={18} m={stein} />
          <rect x="22" y={g - 43.4} width="52" height="38" fill={stein.skygge} opacity="0.55" />
          {[[29, 62], [61, 62]].map(([vx, vy]) => (
            <g key={vx}>
              <rect x={vx} y={vy - 14} width="6" height="12" fill={S.vinduLys.skygge} />
              <rect x={vx} y={vy - 14} width="6" height="12" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" />
            </g>
          ))}
          <rect x="43" y={g - 24} width="10" height="18.6" fill={S.treMork.skygge} />
          <rect x="43" y={g - 24} width="10" height="18.6" fill="none" stroke={S.gull.skygge} strokeWidth="0.8" />
          <line x1="48" y1={g - 24} x2="48" y2={g - 5.4} stroke={S.gull.skygge} strokeWidth="0.5" />
          {f >= 2 && privat(62)}
          {[25, 35, 57, 67].map((cx) => (
            <g key={cx}>
              <rect x={cx} y={g - 41.6} width="4" height="36.2" fill={stein.lys} />
              <rect x={cx + 2.6} y={g - 41.6} width="1.4" height="36.2" fill={stein.flate} />
              {[0.8, 2].map((dx) => (
                <rect key={dx} x={cx + dx} y={g - 41.6} width="0.3" height="36.2" fill={stein.skygge} opacity="0.5" />
              ))}
              <rect x={cx - 0.6} y={g - 42.8} width="5.2" height="1.4" fill={stein.lys} />
              <rect x={cx - 0.6} y={g - 6.8} width="5.2" height="1.4" fill={stein.lys} />
            </g>
          ))}
          <Kloss x={20} y={g - 43.4} b={56} h={6.4} d={20} m={stein} />
          {f >= 3 && tikker(24, g - 48.6, 48)}
          <polygon points={`${inn(76, g - 49.8, 20).join(',')} ${inn(48, g - 63, 20).join(',')} 48,${g - 63} 76,${g - 49.8}`} fill={S.skifer.flate} />
          <polygon points={`19,${g - 49.8} 77,${g - 49.8} 48,${g - 63}`} fill={stein.lys} />
          <polygon points={`25,${g - 50.8} 71,${g - 50.8} 48,${g - 61.2}`} fill={stein.flate} />
          {mynt(48, g - 54.6, 3.2)}
          {t >= 3 && <polyline points={`19,${g - 49.8} 48,${g - 63} 77,${g - 49.8}`} fill="none" stroke={S.gull.flate} strokeWidth="0.8" />}
          {t >= 3 && <rect x="20" y={g - 49.9} width="56" height="0.7" fill={S.gull.flate} />}
          {t >= 3 && [40.6, 55.4].map((lx) => <Lampe key={lx} x={lx} y={g - 19} r={1.8} />)}
        </g>
      ) : (
        <g>
          {/* Filialen: et steinhus med glassfront og myntskilt. */}
          <Slagskygge x1={28} x2={68} lengde={16} d={16} />
          <Kloss x={28} b={40} h={36} d={16} m={S.stein} />
          <Kloss x={27} y={g - 34} b={42} h={2.2} d={18} m={S.hvit} />
          <rect x="28" y={g - 31} width="40" height="0.4" fill={S.stein.skygge} />
          {f >= 3 ? tikker(30, g - 30.4, 36) : <Vindusrad x={31} y={g - 30.6} antall={4} b={6} h={4} mellom={3.4} karm={S.hvit.lys} />}
          <rect x="31" y="58" width="22" height="4.6" fill={S.marine.flate} />
          {mynt(35, 60.3, 1.8)}
          {[39, 44].map((lx, i) => (
            <rect key={lx} x={lx} y="59.7" width={i ? 5 : 4} height="1.2" rx="0.6" fill={S.hvit.flate} />
          ))}
          <rect x="31" y="64" width="17" height="16" fill={S.glass.skygge} />
          <Glans points="31,64 37,64 33,80 31,80" />
          <rect x="31" y="64" width="17" height="16" fill="none" stroke={S.metall.flate} strokeWidth="0.7" />
          <rect x="50" y={g - 20} width="8" height="20" fill={S.glass.flate} />
          <rect x="50" y={g - 20} width="8" height="20" fill="none" stroke={S.metall.flate} strokeWidth="0.7" />
          <Bunnskygge x={28} y={g - 36} b={40} h={36} />
          {f >= 2 && privat(60.6)}
        </g>
      )}
      {/* Nettbanken: en digital søyle på fortauet. */}
      {f >= 1 && (
        <g>
          <Kloss x={tempel ? 8 : 16} y={g + 6} b={6} h={18} d={3} m={S.mork} />
          <rect x={(tempel ? 8 : 16) + 1} y={g - 9} width="4" height="7" fill={S.glass.lys} />
          <rect x={(tempel ? 8 : 16) + 2.1} y={g - 8} width="1.8" height="4.6" rx="0.4" fill={S.marine.flate} />
          <rect x={(tempel ? 8 : 16) + 2.4} y={g - 7.4} width="1.2" height="3" fill={S.glass.lys} />
        </g>
      )}
      {/* En kunde på vei forbi (G10), før kundene kommer ved 50. */}
      {t < 2 && (
        <g className="anim-glid">
          <Figur x={78} y={g + 4} avstand="gate" klaer={S.petrol} ben={S.mork.skygge} vendt={-1} />
        </g>
      )}
      {t >= 2 && (
        <>
          <g className="anim-glid">
            <Figur x={38} y={g + 4} avstand="gate" klaer={S.marine} ben={S.mork.skygge} />
          </g>
          <Figur x={84} y={g + 5} avstand="gate" klaer={S.vin} hud={S.hudMork} har={S.mork.skygge} vendt={-1} />
        </>
      )}
      {t >= 3 && <Figur x={58} y={g + 6} avstand="gate" klaer={S.oker} ben={S.treMork.skygge} vendt={-1} />}
    </>
  )
}

/**
 * Oljeselskapet (fjern avstand, til havs): én liten plattform med boretårn og
 * fakkel på nivå 1, boligmodul, helidekk og kran fra 25, en brønnhodeplattform
 * med bro, forsyningsskip og helikopter ved 50, og ved 100 lys langs dekket og
 * plakett. Forbedringene: et boretårn til, en undervannsrobot ved beina, og et
 * nytt felt med egen plattform ute ved horisonten. Fakkelen brenner.
 */
const oljeselskap: B = (t, f) => {
  const g = GRUNNLINJE
  const dekk = 62
  const plattform = (x: number, b: number, bein: number) => (
    <g>
      {Array.from({ length: bein }, (_, i) => {
        const bx = x + 2 + (i * (b - 6)) / (bein - 1)
        return (
          <g key={i}>
            <rect x={bx} y={dekk} width="2" height={g - dekk - 6} fill={S.metall.skygge} />
            <rect x={bx} y={g - 6} width="2" height="10" fill={S.sjo.skygge} />
            <ellipse cx={bx + 1} cy={g - 6} rx="2.2" ry="0.6" fill={S.hvit.flate} opacity="0.5" />
          </g>
        )
      })}
      <line x1={x + 3} y1={dekk + 4} x2={x + b - 3} y2={g - 8} stroke={S.metall.skygge} strokeWidth="0.5" />
      <line x1={x + b - 3} y1={dekk + 4} x2={x + 3} y2={g - 8} stroke={S.metall.skygge} strokeWidth="0.5" />
      <Kloss x={x} y={dekk + 3} b={b} h={3} d={10} m={S.oker} />
    </g>
  )
  const boretarn = (x: number, h: number) => (
    <g>
      <polygon points={`${x},${dekk} ${x + 8},${dekk} ${x + 5},${dekk - h} ${x + 3},${dekk - h}`} fill="none" stroke={S.metall.flate} strokeWidth="0.8" />
      {Array.from({ length: Math.floor(h / 5) }, (_, i) => {
        const y = dekk - (i + 1) * 5
        const k = (dekk - y) / h
        return <line key={i} x1={x + k * 3} y1={y} x2={x + 8 - k * 3} y2={y + 5} stroke={S.metall.flate} strokeWidth="0.5" />
      })}
      <rect x={x + 2.6} y={dekk - h - 2} width="2.8" height="2" fill={S.metall.lys} />
    </g>
  )
  const n = t >= 1 ? 4 : 3
  const b = t >= 1 ? 44 : 30
  const x = t >= 1 ? 30 : 36
  return (
    <>
      <Bakke type="hav" />
      {/* Ute på feltet (G15): en rigg til og en tankbåt ved horisonten, og beredskapsfartøyet som alltid ligger klar. */}
      <Dis>
        <rect x="-31" y={HORISONT - 7} width="11" height="2.2" fill={S.oker.flate} />
        {[-30, -22].map((lx) => (
          <rect key={lx} x={lx} y={HORISONT - 4.8} width="0.9" height="5" fill={S.metall.skygge} />
        ))}
        <polygon points={`-28,${HORISONT - 7} -25,${HORISONT - 7} -26.5,${HORISONT - 16}`} fill="none" stroke={S.metall.flate} strokeWidth="0.5" />
        <path d={`M104 ${HORISONT + 2} L130 ${HORISONT + 2} L132 ${HORISONT - 1} L104 ${HORISONT - 1} Z`} fill={S.marine.skygge} />
        <rect x="108" y={HORISONT - 2.4} width="16" height="1.4" fill={S.vin.flate} />
        <rect x="125" y={HORISONT - 5} width="4" height="4" fill={S.hvit.flate} />
      </Dis>
      <g className="anim-duve sen">
        <path d={`M104 ${g + 7} L126 ${g + 7} L128.6 ${g + 3.6} L104 ${g + 3.6} Z`} fill={S.oker.flate} />
        <rect x="105" y={g - 1.6} width="7" height="5.2" fill={S.hvit.flate} />
        <rect x="106" y={g - 0.6} width="5" height="1.4" fill={S.glass.skygge} />
        <rect x="113" y={g + 2.2} width="13" height="1.4" fill={S.oker.skygge} />
        <rect x="108.2" y={g - 4} width="0.6" height="2.4" fill={S.mork.flate} />
      </g>
      {/* Nytt felt ute ved horisonten. */}
      {f >= 3 && (
        <Dis>
          <rect x="78" y={HORISONT - 6} width="9" height="2" fill={S.oker.flate} />
          {[79, 85].map((lx) => (
            <rect key={lx} x={lx} y={HORISONT - 4} width="0.8" height="4" fill={S.metall.skygge} />
          ))}
          <polygon points={`80,${HORISONT - 6} 83,${HORISONT - 6} 81.5,${HORISONT - 14}`} fill="none" stroke={S.metall.flate} strokeWidth="0.5" />
          <line x1="87" y1={HORISONT - 6} x2="90" y2={HORISONT - 10} stroke={S.metall.flate} strokeWidth="0.5" />
          <circle cx="90.4" cy={HORISONT - 11} r="1.1" fill={S.oker.lys} />
        </Dis>
      )}
      {/* Brønnhodeplattformen med bro fra nivå 50. */}
      {t >= 2 && (
        <g>
          {plattform(8, 16, 2)}
          <Kloss x={10} y={dekk} b={10} h={5} d={6} m={S.hvit} />
          <line x1="24" y1={dekk + 0.6} x2={x} y2={dekk + 0.6} stroke={S.metall.flate} strokeWidth="1" />
          <line x1="24" y1={dekk - 1.6} x2={x} y2={dekk - 1.6} stroke={S.metall.skygge} strokeWidth="0.4" />
        </g>
      )}
      {/* Undervannsroboten ved beina, med lys og kabel. */}
      {f >= 2 && (
        <g>
          <line x1={x + b - 6} y1={dekk + 3} x2={x + b - 2} y2={g + 5} stroke={S.mork.flate} strokeWidth="0.4" />
          <polygon points={`${x + b - 1},${g + 6} ${x + b + 10},${g + 3} ${x + b + 10},${g + 10}`} fill={S.vinduLys.lys} opacity="0.3" />
          <rect x={x + b - 4} y={g + 4.4} width="5" height="3.2" rx="0.6" fill={S.oker.lys} />
          <rect x={x + b - 4} y={g + 6.4} width="5" height="1.2" fill={S.mork.flate} />
        </g>
      )}
      {plattform(x, b, n)}
      {/* Prosessmodulene og boretårnet. */}
      <Kloss x={x + 2} y={dekk} b={12} h={6} d={8} m={S.metall} />
      <Kloss x={x + 15} y={dekk} b={8} h={4} d={8} m={S.vin} />
      {boretarn(x + 16, 26)}
      {f >= 1 && boretarn(x + 4, 20)}
      {/* Boligmodulen med helidekk og kranen fra nivå 25. */}
      {t >= 1 && (
        <g>
          <Kloss x={x + b - 16} y={dekk} b={14} h={10} d={8} m={S.hvit} />
          <Vindusrad x={x + b - 15} y={dekk - 8.6} antall={4} b={2} h={1.8} mellom={1.3} tent={t >= 3 ? 1 : 2} />
          <Vindusrad x={x + b - 15} y={dekk - 4.6} antall={4} b={2} h={1.8} mellom={1.3} tent={t >= 3 ? 1 : 3} start={1} />
          <ellipse cx={x + b - 7} cy={dekk - 10.6} rx="8" ry="2.4" fill={S.gress.flate} />
          <ellipse cx={x + b - 7} cy={dekk - 11.2} rx="8" ry="2.4" fill={S.skifer.flate} />
          <path d={`M${x + b - 9} ${dekk - 12.4} V${dekk - 10} M${x + b - 5} ${dekk - 12.4} V${dekk - 10} M${x + b - 9} ${dekk - 11.2} H${x + b - 5}`} stroke={S.hvit.lys} strokeWidth="0.5" />
          <line x1={x + 27} y1={dekk} x2={x + 27} y2={dekk - 8} stroke={S.oker.skygge} strokeWidth="1.2" />
          <line x1={x + 27} y1={dekk - 8} x2={x + 38} y2={dekk - 18} stroke={S.oker.flate} strokeWidth="0.9" />
          <line x1={x + 38} y1={dekk - 18} x2={x + 38} y2={dekk - 10} stroke={S.mork.flate} strokeWidth="0.3" />
          {t >= 3 && <Plakett x={6} y={dekk - 17} />}
        </g>
      )}
      {/* Fakkelbommen med flammen. */}
      <line x1={x + b - 2} y1={dekk + 1} x2={x + b + 10} y2={dekk - 18} stroke={S.metall.flate} strokeWidth="1" />
      <path className="anim-flamme" d={`M${x + b + 10} ${dekk - 18} q-2.4 -3 0 -7.6 q2.4 4.6 0 7.6 Z`} fill={S.oker.lys} />
      <path className="anim-flamme" d={`M${x + b + 10} ${dekk - 18} q-1.2 -1.6 0 -4 q1.2 2.4 0 4 Z`} fill={S.vinduLys.lys} />
      {/* Lys langs dekket ved nivå 100. */}
      {t >= 3 && Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x + 3 + i * ((b - 6) / 5)} cy={dekk + 1.4} r="0.7" fill={S.vinduLys.lys} />)}
      {/* Forsyningsskip og helikopter fra nivå 50. */}
      {t >= 2 && (
        <g>
          <g className="anim-duve">
            <path d={`M10 ${g + 4} L36 ${g + 4} L38 ${g + 1} L10 ${g + 1} Z`} fill={S.vin.flate} />
            <rect x="11" y={g - 4} width="8" height="5" fill={S.hvit.flate} />
            <rect x="12" y={g - 3} width="6" height="1.4" fill={S.glass.skygge} />
            <rect x="20" y={g - 0.4} width="16" height="1.4" fill={S.oker.flate} />
          </g>
          <g transform={`translate(22 ${dekk - 26})`}>
            <ellipse cx="0" cy="0" rx="3.4" ry="1.6" fill={S.hvit.flate} />
            <line x1="-3" y1="-0.2" x2="-8" y2="-0.8" stroke={S.hvit.flate} strokeWidth="0.7" />
            <line x1="-5" y1="-2.4" x2="5" y2="-2.4" stroke={S.mork.flate} strokeWidth="0.4" />
            <rect x="1" y="-1" width="1.6" height="0.9" fill={S.glass.skygge} />
          </g>
        </g>
      )}
    </>
  )
}

/**
 * Rederiet (fjern avstand, til havs): et lite feederskip med noen få
 * containere på nivå 1, et større skip med to lag fra 25, et stort skip med tre
 * lag og en slepebåt ved 50, og ved 100 gullstripe, lys på broa og plakett.
 * Forbedringene: et LNG-skip med kuletanker ute ved horisonten, egen
 * containerhavn med portalkran og stabler på kaia til venstre, og rotorseil på
 * dekket. Skipet duver.
 */
const rederi: B = (t, f) => {
  const g = GRUNNLINJE
  const L = [40, 52, 62, 62][t]
  const x0 = f >= 2 ? 92 - L : 88 - L - (62 - L) / 2
  const dekk = g - 9
  const lag = [1, 2, 3, 3][t]
  const farger = [S.oker, S.petrol, S.vin, S.marine, S.tegl, S.gran, S.hvit]
  const brokke = x0 + 3
  return (
    <>
      <Bakke type="hav" />
      {/* LNG-skipet ved horisonten. */}
      {f >= 1 && (
        <Dis>
          <path d={`M10 ${HORISONT + 2} L44 ${HORISONT + 2} L46 ${HORISONT - 1} L10 ${HORISONT - 1} Z`} fill={S.vin.flate} />
          {[18, 26, 34].map((cx) => (
            <path key={cx} d={`M${cx - 3.4} ${HORISONT - 1} A3.4 3.4 0 0 1 ${cx + 3.4} ${HORISONT - 1} Z`} fill={S.hvit.flate} />
          ))}
          <rect x="11" y={HORISONT - 5} width="4" height="4" fill={S.hvit.flate} />
        </Dis>
      )}
      {/* Containerhavna fortsetter til venstre (G15): kaia, stablene og en kran til. */}
      <polygon points={`-40,${g - 6} 0,${g - 6} 0,${g - 12} -40,${g - 12}`} fill={S.stein.lys} />
      <rect x="-40" y={g - 6} width="40" height="16" fill={S.stein.flate} />
      <rect x="-40" y={g - 6.6} width="40" height="1" fill={S.oker.flate} />
      <rect x="-1.4" y={g - 12} width="1.4" height="22" fill={S.stein.skygge} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((k) =>
          r + (k % 3) < 4 ? <Kloss key={`${r}-${k}`} x={-38 + k * 6.4} y={g - 7 - r * 3.4} b={6} h={3.2} d={4} m={farger[(r * 2 + k + 1) % farger.length]} /> : null,
        ),
      )}
      {[-16, -7].map((kx) => (
        <rect key={kx} x={kx} y={g - 36} width="1.4" height="29" fill={S.oker.skygge} />
      ))}
      <rect x="-19" y={g - 38} width="24" height="2.4" fill={S.oker.flate} />
      <rect x="-18" y={g - 36} width="7" height="3" fill={S.oker.flate} />
      {/* Moloen med et lite fyr ved innløpet. */}
      <polygon points={`98,${g + 4} 99,${g - 1} 104,${g - 3} 111,${g - 2.4} 119,${g - 3.4} 127,${g - 2.6} 136,${g - 3.2} 136,${g + 4}`} fill={S.stein.flate} />
      <polygon points={`99,${g - 1} 104,${g - 3} 111,${g - 2.4} 119,${g - 3.4} 127,${g - 2.6} 136,${g - 3.2} 136,${g - 1.8} 99,${g + 0.2}`} fill={S.stein.lys} />
      <polyline className="anim-boelge" points={`98,${g + 5} 102,${g + 3.8} 106,${g + 5}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.6" strokeLinecap="round" />
      <rect x="126.4" y={g - 16} width="3.2" height="13.6" fill={S.hvit.lys} />
      {[g - 13, g - 7.6].map((by) => (
        <rect key={by} x="126.4" y={by} width="3.2" height="2.4" fill={S.vin.flate} />
      ))}
      <rect x="126.8" y={g - 19} width="2.4" height="3" fill={S.vinduLys.lys} />
      <polygon points={`126.2,${g - 19} 129.8,${g - 19} 128,${g - 21}`} fill={S.vin.skygge} />
      {/* Containerhavna: kai, stabler og portalkran. */}
      {f >= 2 && (
        <g>
          <polygon points={`0,${g - 6} ${x0 - 2},${g - 6} ${x0 + 6},${g - 12} 0,${g - 12}`} fill={S.stein.lys} />
          <rect x="0" y={g - 6} width={x0 - 2} height="16" fill={S.stein.flate} />
          <rect x="0" y={g - 6.6} width={x0 - 2} height="1" fill={S.oker.flate} />
          {[0, 1].map((r) =>
            [0, 1, 2].map((k) => (
              <Kloss key={`${r}-${k}`} x={3 + k * 6.4} y={g - 7 - r * 3.4} b={6} h={3.2} d={4} m={farger[(r * 3 + k + 2) % farger.length]} />
            )),
          )}
          <g>
            {[x0 - 12, x0 - 4].map((kx) => (
              <rect key={kx} x={kx} y={g - 34} width="1.4" height="28" fill={S.oker.skygge} />
            ))}
            <rect x={x0 - 14} y={g - 36} width={L * 0.6 + 14} height="2.4" fill={S.oker.flate} />
            <rect x={x0 - 13} y={g - 34} width="8" height="3" fill={S.oker.flate} />
            <line x1={x0 + 16} y1={g - 33.6} x2={x0 + 16} y2={dekk - 3.2 * lag - 2} stroke={S.mork.flate} strokeWidth="0.3" />
            <rect x={x0 + 14.4} y={dekk - 3.2 * lag - 2} width="3.2" height="1.2" fill={S.mork.flate} />
          </g>
        </g>
      )}
      {/* Slepebåten fra nivå 50. */}
      {t >= 2 && (
        <g className="anim-duve sen">
          <path d={`M${x0 - 16} ${g + 6} L${x0 - 4} ${g + 6} L${x0 - 2} ${g + 3} L${x0 - 17} ${g + 3} Z`} fill={S.vin.flate} />
          <rect x={x0 - 13} y={g - 1} width="6" height="4" fill={S.hvit.flate} />
          <rect x={x0 - 11} y={g - 3.4} width="1.4" height="2.4" fill={S.mork.flate} />
        </g>
      )}
      <g className="anim-duve">
        <ellipse cx={x0 + L / 2} cy={g + 1} rx={L / 2 + 4} ry="2" fill="#000000" opacity="0.18" />
        {/* Skroget: mørkt, hvit vannlinje og rød bunn. */}
        <path d={`M${x0} ${dekk} L${x0 + L - 4} ${dekk} L${x0 + L + 1} ${dekk - 2} Q${x0 + L - 1} ${g - 1} ${x0 + L - 7} ${g} L${x0 + 3} ${g} Q${x0} ${g - 2} ${x0} ${dekk} Z`} fill={S.marine.skygge} />
        <rect x={x0 + 1} y={g - 3} width={L - 6} height="1" fill={S.hvit.flate} />
        <rect x={x0 + 2} y={g - 2} width={L - 8} height="2" fill={S.vin.flate} />
        {t >= 3 && <rect x={x0} y={dekk + 1.4} width={L - 4} height="0.7" fill={S.gull.flate} />}
        {/* Containerne, lag på lag. */}
        {Array.from({ length: lag }, (_, r) =>
          Array.from({ length: Math.floor((L - 18) / 6.4) }, (_, k) => {
            const cx = x0 + 13 + k * 6.4
            if (f >= 3 && (k === 2 || k === 5)) return null
            return <Kloss key={`${r}-${k}`} x={cx} y={dekk - r * 3.2} b={6} h={3.2} d={4} m={farger[(r * 5 + k * 3) % farger.length]} />
          }),
        )}
        {/* Rotorseil mellom stablene. */}
        {f >= 3 &&
          [2, 5].map((k) => {
            const rx = x0 + 15 + k * 6.4
            return (
              <g key={k}>
                <rect x={rx - 1.6} y={dekk - 20} width="3.2" height="20" rx="0.8" fill={S.hvit.lys} />
                <rect x={rx + 0.4} y={dekk - 20} width="1.2" height="20" fill={S.hvit.skygge} />
                <rect x={rx - 2.4} y={dekk - 21} width="4.8" height="1.4" rx="0.6" fill={S.hvit.flate} />
                <rect x={rx - 1.6} y={dekk - 9} width="3.2" height="1.4" fill={S.marine.flate} />
              </g>
            )
          })}
        {/* Broa og skorsteinen akterut. */}
        <Kloss x={brokke} y={dekk} b={8} h={12} d={5} m={S.hvit} />
        <rect x={brokke - 1} y={dekk - 11} width="10" height="2.2" fill={t >= 3 ? S.vinduLys.flate : S.glass.skygge} />
        <Vindusrad x={brokke + 1} y={dekk - 7.4} antall={3} b={1.6} h={1.2} mellom={1} tent={t >= 3 ? 1 : 0} />
        <Kloss x={brokke + 2} y={dekk - 12} b={4} h={5} d={3} m={S.vin} />
        <rect x={brokke + 2} y={dekk - 17} width="4" height="1.2" fill={S.mork.flate} />
        {t >= 3 && <Plakett x={brokke - 2} y={dekk - 45} />}
      </g>
    </>
  )
}

/**
 * Fiskeoppdrettet (fjern avstand, i fjorden): to merder på nivå 1, fire og en
 * fôrflåte fra 25, seks merder og en arbeidsbåt ved 50, og ved 100 lys på
 * flåten og ringene, og plakett. Fjellene står i dis bak. Forbedringene: en
 * lukket merd, en stor havmerd ute ved horisonten, og eget slakteri med
 * kjølebil på land til venstre.
 */
const fiskeoppdrett: B = (t, f) => {
  const g = GRUNNLINJE
  const antall = [2, 4, 6, 6][t]
  const plasser: [number, number][] = [
    [52, 79],
    [70, 79],
    [44, 71],
    [61, 71],
    [36, 79],
    [78, 71],
  ]
  const merd = (cx: number, cy: number, lukket: boolean, key: number) => {
    const rx = cy > 75 ? 8 : 6.6
    const ry = rx * 0.32
    if (lukket) {
      return (
        <g key={key}>
          <ellipse cx={cx} cy={cy + 1.4} rx={rx} ry={ry} fill={S.petrol.skygge} />
          <rect x={cx - rx} y={cy - 2} width={rx * 2} height="3.4" fill={S.petrol.flate} />
          <ellipse cx={cx} cy={cy - 2} rx={rx} ry={ry} fill={S.petrol.lys} />
          <ellipse cx={cx} cy={cy - 2} rx={rx * 0.8} ry={ry * 0.8} fill={S.sjo.skygge} />
        </g>
      )
    }
    return (
      <g key={key}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={S.sjo.skygge} />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={S.mork.flate} strokeWidth="1.1" />
        {Array.from({ length: 8 }, (_, i) => {
          const v = (i / 8) * Math.PI * 2
          const px = +(cx + Math.cos(v) * rx).toFixed(2)
          const py = +(cy + Math.sin(v) * ry).toFixed(2)
          return <line key={i} x1={px} y1={py} x2={px} y2={py - 1.6} stroke={S.mork.lys} strokeWidth="0.35" />
        })}
        <ellipse cx={cx} cy={cy - 1.6} rx={rx} ry={ry} fill="none" stroke={S.metall.flate} strokeWidth="0.35" />
        <line x1={cx} y1={cy} x2={cx} y2={cy - 4.4} stroke={S.mork.lys} strokeWidth="0.35" />
        <path d={`M${cx - rx} ${cy - 1.6} L${cx} ${cy - 4.4} L${cx + rx} ${cy - 1.6}`} fill="none" stroke={S.mork.lys} strokeWidth="0.25" />
        {t >= 3 && <circle cx={cx} cy={cy - 4.6} r="0.6" fill={S.vinduLys.lys} />}
      </g>
    )
  }
  return (
    <>
      <Kantfade>
        <Dis>
          <polygon points={`-40,${HORISONT + 1} -40,46 -28,36 -16,46 -6,41 0,43 10,40 22,48 34,30 48,44 60,36 74,48 86,38 96,44 108,33 120,45 130,39 136,42 136,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points={`-28,36 -16,46 -22,${HORISONT} -30,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points={`108,33 120,45 114,${HORISONT} 106,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points="-30.6,39.2 -28,36 -25.2,39.4 -27,38.6 -28.4,40 -29.6,38.8" fill={S.sno.lys} />
          <polygon points="105.6,36.4 108,33 111,36.6 109.2,36 108,37.4 106.8,36" fill={S.sno.lys} />
          <polygon points={`34,30 48,44 38,${HORISONT} 30,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points={`86,38 96,44 94,${HORISONT} 84,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points="30.4,35.6 34,30 38.6,35 36,34 34,36.4 32.4,34.6" fill={S.sno.lys} />
          <polygon points="57,40 60,36 63.6,39.8 61.6,39 59.6,41 58.4,39.6" fill={S.sno.lys} />
          <polygon points={`-40,${HORISONT + 1} -40,52 -24,51 -10,53 0,50 12,52 24,54 40,53 56,54 74,52 96,51 112,53 126,51 136,52 136,${HORISONT + 1}`} fill={S.gran.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Land til venstre (G15): naustet og en båt ved land. */}
      <path d={`M-40 ${g - 16} Q-20 ${g - 18} 0 ${g - 14} Q5 ${g} -2 ${g + 6} Q-20 ${g + 8} -40 ${g + 7} Z`} fill={S.stein.flate} />
      <path d={`M-40 ${g - 16} Q-20 ${g - 18} 0 ${g - 14} L0.6 ${g - 11} Q-20 ${g - 15} -40 ${g - 13} Z`} fill={S.stein.lys} />
      <Kloss x={-33} y={g - 8} b={12} h={8} d={7} m={S.faluRod} />
      <Saltak x={-33} y={g - 16} b={12} d={7} h={5} m={S.skifer} gavl={S.faluRod} />
      <rect x="-30" y={g - 13} width="6" height="5" fill={S.treMork.skygge} />
      <g className="anim-duve">
        <path d={`M-30 ${g + 11} L-16 ${g + 11} L-14.4 ${g + 8.4} L-30.6 ${g + 8.4} Z`} fill={S.hvit.flate} />
        <rect x="-26" y={g + 6} width="4" height="2.6" fill={S.hvit.lys} />
      </g>
      {/* Havmerda langt ute. */}
      {f >= 2 && (
        <Dis>
          <ellipse cx="84" cy={HORISONT + 3} rx="8" ry="1.6" fill="none" stroke={S.oker.flate} strokeWidth="0.8" />
          <polygon points={`76,${HORISONT + 3} 80,${HORISONT - 4} 88,${HORISONT - 4} 92,${HORISONT + 3}`} fill="none" stroke={S.metall.flate} strokeWidth="0.6" />
          <rect x="83" y={HORISONT - 9} width="2" height="5" fill={S.hvit.flate} />
        </Dis>
      )}
      {/* Slakteriet på land, med kjølebil. */}
      {f >= 3 && (
        <g>
          <Kantfade>
            <path d={`M0 ${g - 14} Q16 ${g - 16} 28 ${g - 12} Q31 ${g} 25 ${g + 5} Q12 ${g + 8} 0 ${g + 7} Z`} fill={S.stein.flate} />
          </Kantfade>
          <path d={`M0 ${g - 14} Q16 ${g - 16} 28 ${g - 12} L28.6 ${g - 9} Q16 ${g - 13} 0 ${g - 11} Z`} fill={S.stein.lys} />
          <Kloss x={3} y={g - 10} b={18} h={9} d={8} m={S.hvit} />
          <rect x="3" y={g - 15} width="18" height="1.4" fill={S.petrol.flate} />
          <Kloss x={15} y={g - 19} b={3} h={8} d={2} m={S.metall} />
          <Kloss x={6} y={g - 1} b={11} h={4.4} d={4} m={S.hvit} />
          <rect x="17" y={g - 4.4} width="3.6" height="3.4" fill={S.petrol.flate} />
          {[8.6, 18.4].map((cx) => (
            <circle key={cx} cx={cx} cy={g - 0.6} r="1.2" fill={S.mork.skygge} />
          ))}
        </g>
      )}
      {/* Fôrflåten fra nivå 25. */}
      {t >= 1 && (
        <g>
          <path d={`M72 ${g - 15} L92 ${g - 15} L90 ${g - 12} L74 ${g - 12} Z`} fill={S.marine.flate} />
          <Kloss x={75} y={g - 15} b={14} h={6} d={5} m={S.hvit} />
          <Vindusrad x={76} y={g - 19.6} antall={3} b={2.6} h={1.6} mellom={1.6} tent={t >= 3 ? 1 : 0} />
          {[0, 1].map((i) => (
            <Kloss key={i} x={77 + i * 5} y={g - 21} b={4} h={6} d={3} m={S.metall} />
          ))}
          {t >= 3 && <Plakett x={78} y={g - 42} />}
        </g>
      )}
      {plasser.slice(0, antall).sort((a, b) => a[1] - b[1]).map(([cx, cy], i) => merd(cx, cy, f >= 1 && cx === 52 && cy === 79, i))}
      {/* Arbeidsbåten fra nivå 50. */}
      {t >= 2 && (
        <g className="anim-duve">
          <path d={`M60 ${g + 9} L76 ${g + 9} L78 ${g + 6} L59 ${g + 6} Z`} fill={S.petrol.flate} />
          <rect x="61" y={g + 3} width="6" height="3" fill={S.hvit.flate} />
          <rect x="62" y={g + 3.6} width="4" height="1" fill={S.glass.skygge} />
          <line x1="72" y1={g + 6} x2="75" y2={g} stroke={S.oker.flate} strokeWidth="0.6" />
        </g>
      )}
    </>
  )
}

/**
 * Et passasjerfly sett fra siden, med nesa mot høyre: `x` er halen, `gy`
 * bakken under hjulene og `L` lengden. `slag` velger propellfly (høy vinge,
 * propeller), jetfly eller widebody (tykkere kropp, store motorer).
 */
export function Passasjerfly({ x, gy, L, slag, hale }: { x: number; gy: number; L: number; slag: 'propell' | 'jet' | 'wide'; hale: string }) {
  const H = L * (slag === 'wide' ? 0.135 : 0.115)
  const w = L * 0.05
  const fb = gy - w
  const ft = fb - H
  const r = (n: number) => +n.toFixed(2)
  const px = (k: number) => r(x + L * k)
  return (
    <g>
      <ellipse cx={px(0.55)} cy={gy + 0.3} rx={L * 0.42} ry="1.4" fill="#000000" opacity="0.22" />
      {/* Understellet. */}
      {[0.86, 0.52].map((k) => (
        <g key={k}>
          <rect x={r(px(k) - 0.3)} y={r(fb)} width="0.6" height={r(w * 0.6)} fill={S.metall.skygge} />
          <circle cx={px(k)} cy={r(gy - w * 0.4)} r={r(w * 0.42)} fill={S.mork.flate} />
        </g>
      ))}
      {/* Halen: finne og haleror. */}
      <polygon points={`${px(0.03)},${r(ft)} ${px(0.17)},${r(ft)} ${px(0.09)},${r(ft - H * 1.7)} ${px(0.02)},${r(ft - H * 1.7)}`} fill={hale} />
      <polygon points={`${px(0.01)},${r(ft + H * 0.3)} ${px(0.14)},${r(ft + H * 0.35)} ${px(0.13)},${r(ft + H * 0.55)} ${px(0.02)},${r(ft + H * 0.5)}`} fill={S.hvit.skygge} />
      {/* Kroppen. */}
      <path
        d={`M${px(0.08)} ${r(ft)} L${px(0.86)} ${r(ft)} Q${px(1)} ${r(ft)} ${px(1)} ${r(fb - H * 0.35)} Q${px(0.99)} ${r(fb)} ${px(0.9)} ${r(fb)} L${px(0.14)} ${r(fb)} L${px(0)} ${r(ft - H * 0.15)} Z`}
        fill={S.hvit.lys}
      />
      <path d={`M${px(0.14)} ${r(fb)} L${px(0.9)} ${r(fb)} Q${px(0.99)} ${r(fb)} ${px(1)} ${r(fb - H * 0.35)} L${px(0.14)} ${r(fb - H * 0.35)} Z`} fill={S.hvit.flate} />
      <rect x={px(0.12)} y={r(ft + H * 0.62)} width={r(L * 0.84)} height={r(H * 0.12)} fill={hale} />
      {/* Vinduene og cockpiten. */}
      {Array.from({ length: Math.floor(0.6 / 0.032) }, (_, i) => (
        <circle key={i} className="nattvindu" cx={px(0.2 + i * 0.032)} cy={r(ft + H * 0.38)} r={r(H * 0.09)} fill={S.glass.skygge} />
      ))}
      <path d={`M${px(0.9)} ${r(ft + H * 0.18)} L${px(0.955)} ${r(ft + H * 0.26)} L${px(0.97)} ${r(ft + H * 0.42)} L${px(0.9)} ${r(ft + H * 0.42)} Z`} fill={S.mork.flate} />
      {/* Vingen og motorene. */}
      {slag === 'propell' ? (
        <g>
          <polygon points={`${px(0.62)},${r(ft + 0.4)} ${px(0.4)},${r(ft + 0.4)} ${px(0.36)},${r(ft + 1.6)} ${px(0.58)},${r(ft + 1.6)}`} fill={S.hvit.skygge} />
          <rect x={px(0.5)} y={r(ft + 0.6)} width={r(L * 0.1)} height={r(H * 0.4)} rx={r(H * 0.2)} fill={S.metall.flate} />
          <ellipse cx={px(0.6)} cy={r(ft + 0.6 + H * 0.2)} rx="0.4" ry={r(H * 0.75)} fill={S.mork.flate} opacity="0.5" />
        </g>
      ) : (
        <g>
          <polygon points={`${px(0.58)},${r(fb - H * 0.3)} ${px(0.36)},${r(fb - H * 0.12)} ${px(0.31)},${r(fb + H * 0.1)} ${px(0.53)},${r(fb - H * 0.02)}`} fill={S.hvit.skygge} />
          <rect x={px(0.43)} y={r(fb - H * 0.05)} width={r(L * (slag === 'wide' ? 0.14 : 0.11))} height={r(H * (slag === 'wide' ? 0.55 : 0.45))} rx={r(H * 0.22)} fill={S.metall.flate} />
          <rect x={px(slag === 'wide' ? 0.55 : 0.52)} y={r(fb - H * 0.02)} width="0.8" height={r(H * (slag === 'wide' ? 0.49 : 0.39))} fill={S.mork.flate} />
        </g>
      )}
      <Glans points={`${px(0.2)},${r(ft)} ${px(0.6)},${r(ft)} ${px(0.5)},${r(ft + H * 0.3)} ${px(0.2)},${r(ft + H * 0.3)}`} />
      {/* Varsellysene (G10): rødt oppe og under, hvitt på halen. */}
      <Blinklys x={px(0.5)} y={r(ft - 0.5)} r={r(Math.max(0.6, H * 0.08))} />
      <Blinklys x={px(0.62)} y={r(fb + 0.4)} r={r(Math.max(0.5, H * 0.06))} sen />
      <Blinklys x={px(0.07)} y={r(ft - H * 1.7)} r={r(Math.max(0.5, H * 0.07))} farge={S.hvit.lys} sen />
    </g>
  )
}

/**
 * Flyselskapet (fjern avstand, på flyplassen): et propellfly ved en liten
 * terminal på nivå 1, et jetfly ved gaten med glassterminal og passasjerbro
 * fra 25, tårn, et fly til og bagasjetog ved 50, og ved 100 gullbånd,
 * lysmaster og plakett. Forbedringene: et widebody for langdistanse, en
 * lounge i glass på terminaltaket og et fly på vei opp mot Asia.
 */
const flyselskap: B = (t, f) => {
  const g = GRUNNLINJE
  const slag = f >= 1 ? 'wide' : t >= 1 ? 'jet' : 'propell'
  const L = slag === 'wide' ? 64 : slag === 'jet' ? 56 : 40
  const fx = slag === 'propell' ? 40 : 92 - L - 2
  const hale = t >= 3 ? S.marine.flate : S.vin.flate
  const H = L * (slag === 'wide' ? 0.135 : 0.115)
  const ft = g + 2 - L * 0.05 - H
  return (
    <>
      <Bakke type="asfalt" />
      {/* Flyplassen fortsetter (G15): to fly ved gatene i disen til venstre, tankbilen, hangaren og vindposen til høyre. */}
      <Dis>
        <Passasjerfly x={-66} gy={g - 13} L={34} slag="jet" hale={S.marine.flate} />
        <Passasjerfly x={-32} gy={g - 12} L={34} slag="jet" hale={hale} />
      </Dis>
      {Array.from({ length: 22 }, (_, i) => -38 + i * 8).map((lx) => (
        <circle key={lx} cx={lx} cy={g + 11} r="0.5" fill={S.vinduLys.lys} />
      ))}
      <Kloss x={104} y={g - 8} b={32} h={22} d={10} m={S.metall} />
      <path d={`M104 ${g - 30} Q120 ${g - 38} 136 ${g - 30} Z`} fill={S.metall.lys} />
      <rect x="109" y={g - 26} width="22" height="18" fill={S.mork.flate} />
      {[109, 114.5, 120, 125.5, 131].map((dx) => (
        <rect key={dx} x={dx} y={g - 26} width="0.5" height="18" fill={S.metall.skygge} />
      ))}
      <rect x="98" y={g - 14} width="0.5" height="14" fill={S.metall.skygge} />
      <polygon className="anim-flagg" points={`98.5,${g - 14} 104,${g - 13.2} 104,${g - 11.8} 98.5,${g - 11}`} fill={S.oker.lys} />
      <rect x="100.6" y={g - 13.6} width="1.2" height="2.4" fill={S.hvit.lys} />
      <g>
        <rect x="-13" y={g + 2.4} width="9" height="4" rx="1.8" fill={S.hvit.flate} />
        <rect x="-4" y={g + 1.6} width="4.4" height="4.8" fill={S.vin.flate} />
        <rect x="-3.2" y={g + 2.2} width="2.4" height="1.6" fill={S.glass.skygge} />
        {[-11, -6, -1.6].map((cx) => (
          <circle key={cx} cx={cx} cy={g + 6.6} r="1" fill={S.mork.skygge} />
        ))}
      </g>
      {/* Et fly på vei opp mot Asia. */}
      {f >= 3 && (
        <g>
          <line x1="44" y1="38" x2="66" y2="27.6" stroke={S.hvit.lys} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <g transform="rotate(-14 78 24)">
            <Passasjerfly x={66} gy={27} L={22} slag="jet" hale={hale} />
          </g>
        </g>
      )}
      {/* Tårnet fra nivå 50. */}
      {t >= 2 && (
        <g>
          <Kloss x={80} y={g - 14} b={4} h={32} d={3} m={S.hvit} />
          <Kloss x={77.6} y={g - 46} b={8.8} h={5} d={5} m={S.glass} />
          <Kloss x={77} y={g - 51} b={10} h={1.2} d={6} m={S.skifer} />
        </g>
      )}
      {/* Et fly til, parkert lenger bak. */}
      {t >= 2 && (
        <Dis>
          <Passasjerfly x={44} gy={g - 12} L={40} slag="jet" hale={hale} />
        </Dis>
      )}
      {/* Terminalen. */}
      {t >= 1 ? (
        <g>
          <Kloss x={4} y={g - 12} b={44} h={16} d={10} m={S.glass} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={4 + i * 4.4} y={g - 28} width="0.4" height="16" fill={S.glass.lys} opacity="0.7" />
          ))}
          <rect x="4" y={g - 20.6} width="44" height="0.8" fill={S.glass.skygge} />
          <rect x="5" y={g - 19} width="42" height="5" fill={S.vinduLys.flate} opacity="0.55" />
          <Glans points={`4,${g - 28} 14,${g - 28} 8,${g - 12} 4,${g - 12}`} />
          <Kloss x={3} y={g - 28} b={46} h={2} d={12} m={S.hvit} />
          {t >= 3 && <rect x="3" y={g - 28.6} width="46" height="0.8" fill={S.gull.flate} />}
        </g>
      ) : (
        <g>
          <Kloss x={8} y={g - 12} b={24} h={10} d={8} m={S.hvit} />
          <Vindusrad x={10} y={g - 20} antall={4} b={3.4} h={4} mellom={2} tent={2} />
          <Kloss x={7} y={g - 22} b={26} h={1.4} d={9} m={S.skifer} />
        </g>
      )}
      {/* Loungen på taket. */}
      {f >= 2 && (
        <g>
          <Kloss x={t >= 1 ? 22 : 12} y={t >= 1 ? g - 30 : g - 23.4} b={16} h={5} d={6} m={S.glass} />
          <rect x={t >= 1 ? 23 : 13} y={(t >= 1 ? g - 30 : g - 23.4) - 4} width="14" height="3" fill={S.vinduLys.flate} />
          <rect x={t >= 1 ? 22 : 12} y={(t >= 1 ? g - 30 : g - 23.4) - 5.6} width="16" height="0.7" fill={S.gull.flate} />
        </g>
      )}
      {/* Passasjerbroa ut til flyet. */}
      {t >= 1 && <polygon points={`44,${g - 24} 48,${g - 24} ${fx + L * 0.84},${ft + 1} ${fx + L * 0.84},${ft + 5} 48,${g - 19} 44,${g - 19}`} fill={S.metall.flate} />}
      <Passasjerfly x={fx} gy={g + 2} L={L} slag={slag} hale={hale} />
      {t >= 3 && <circle cx={fx + L * 0.09} cy={ft - H * 0.9} r="1.4" fill={S.gull.flate} />}
      {/* Bagasjetog og folk fra nivå 50. */}
      {t >= 2 && (
        <g>
          {[0, 1, 2].map((i) => (
            <Kloss key={i} x={10 + i * 6} y={g + 8} b={5} h={2.6} d={3} m={i ? S.metall : S.oker} />
          ))}
          <Figur x={30} y={g + 7} avstand="fjern" klaer={S.oker} />
          <Figur x={33} y={g + 6} avstand="fjern" klaer={S.oker} />
        </g>
      )}
      {/* Lysmaster og plakett ved nivå 100. */}
      {t >= 3 && (
        <g>
          {[4, 90].map((lx) => (
            <g key={lx}>
              <rect x={lx - 0.3} y={g - 30} width="0.6" height="38" fill={S.metall.skygge} />
              <Lampe x={lx} y={g - 30} r={2.2} />
            </g>
          ))}
          <Plakett x={6} y={g - 50} />
        </g>
      )}
    </>
  )
}

/**
 * Skisenteret (fjern avstand, i fjellet): en liten bakke med skitrekk og en
 * hytte på nivå 1, et ordentlig fjell med stolheis, flere nedfarter og lodge
 * fra 25, skiløpere i bakkene ved 50, og ved 100 lysløype, opplyst hotell og
 * plakett. Forbedringene: gondolbane til toppen (gondolene glir), snøkanoner
 * langs nedfarten og en hoppbakke med tribune for vinter-OL. I scenen går
 * skitrekket og stolheisen (G10).
 */
const skisenter: B = (t, f) => {
  const g = GRUNNLINJE
  const stor = t >= 1
  const fjell = stor
    ? `-40,${g - 8} -20,${g - 14} 0,${g - 10} 14,${g - 30} 26,${g - 40} 40,${g - 64} 50,${g - 56} 60,${g - 66} 76,${g - 40} 96,${g - 22} 116,${g - 14} 136,${g - 8} 136,${g - 6} -40,${g - 6}`
    : `-40,${g - 8} -20,${g - 12} 0,${g - 10} 20,${g - 24} 36,${g - 36} 48,${g - 40} 60,${g - 34} 80,${g - 20} 96,${g - 12} 116,${g - 10} 136,${g - 7} 136,${g - 6} -40,${g - 6}`
  const topp: [number, number] = stor ? [60, g - 66] : [48, g - 40]
  // Nedfartene, fra toppen og ned mot dalen.
  const nedfarter = stor
    ? [`M40 ${g - 62} Q30 ${g - 40} 26 ${g - 10}`, `M58 ${g - 62} Q50 ${g - 36} 44 ${g - 8}`, `M62 ${g - 60} Q72 ${g - 38} 70 ${g - 10}`]
    : [`M46 ${g - 38} Q38 ${g - 24} 32 ${g - 8}`]
  const skog = stor
    ? [[-34, g - 10], [-26, g - 13], [-10, g - 11], [104, g - 17], [112, g - 14], [126, g - 10], [6, g - 14], [12, g - 20], [18, g - 16], [34, g - 24], [38, g - 18], [52, g - 30], [56, g - 22], [60, g - 16], [78, g - 28], [84, g - 20], [90, g - 16], [8, g - 9], [20, g - 26]]
    : [[-34, g - 10], [-24, g - 12], [-10, g - 11], [104, g - 12], [114, g - 11], [126, g - 9], [10, g - 14], [16, g - 18], [24, g - 22], [52, g - 30], [58, g - 24], [66, g - 22], [74, g - 18], [84, g - 14]]
  return (
    <>
      {/* Nabotoppene i disen (G15). */}
      <Kantfade>
        <Dis>
          <polygon points={`-40,${g - 8} -40,${g - 30} -22,${g - 50} -6,${g - 34} 6,${g - 24} 6,${g - 8}`} fill={S.sno.flate} stroke={S.fjell.lys} strokeWidth="0.6" strokeLinejoin="round" />
          <polygon points={`-22,${g - 50} -6,${g - 34} 6,${g - 24} 6,${g - 8} -12,${g - 8}`} fill={S.fjell.flate} opacity="0.5" />
          <polygon points={`92,${g - 8} 104,${g - 30} 120,${g - 48} 136,${g - 32} 136,${g - 8}`} fill={S.sno.flate} stroke={S.fjell.lys} strokeWidth="0.6" strokeLinejoin="round" />
          <polygon points={`120,${g - 48} 136,${g - 32} 136,${g - 8} 124,${g - 8}`} fill={S.fjell.flate} opacity="0.5" />
        </Dis>
      </Kantfade>
      {/* Fjellet: snø, fjellvegg på skyggesiden, skog og nedfarter. Fjellet er motivet, så
          det står ikke i bakgrunnen (G15): silhuetten av et låst skisenter viser det. */}
      <g>
        <polygon points={fjell} fill={S.sno.flate} stroke={S.fjell.lys} strokeWidth="0.6" strokeLinejoin="round" />
        <polygon points={stor ? `60,${g - 66} 76,${g - 40} 96,${g - 22} 116,${g - 14} 136,${g - 8} 136,${g - 6} 72,${g - 6} 66,${g - 34}` : `48,${g - 40} 60,${g - 34} 80,${g - 20} 96,${g - 12} 116,${g - 10} 136,${g - 7} 136,${g - 6} 62,${g - 6}`} fill={S.sno.skygge} />
        {stor && <polygon points={`40,${g - 64} 50,${g - 56} 46,${g - 48} 42,${g - 52}`} fill={S.fjell.skygge} />}
        {stor && <polygon points={`60,${g - 66} 68,${g - 54} 64,${g - 50}`} fill={S.fjell.flate} />}
        {nedfarter.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={S.sno.lys} strokeWidth="4.4" strokeLinecap="round" />
        ))}
        {skog.map(([sx, sy], i) => (
          <Tre key={i} x={sx} y={sy} h={stor ? 7 : 6} slag="gran" />
        ))}
      </g>
      <Bakke type="sno" />
      {/* Landsbyen ved foten (G15): hytter til venstre, et lite hotell og parkeringen med bussen til høyre. */}
      {[[-37, S.treverk], [-27, S.faluRod], [-17, S.treverk]].map(([hx, m], i) => (
        <g key={i}>
          <Kloss x={hx as number} y={g - 2 + (i % 2)} b={8} h={5} d={6} m={m as Materiale} />
          <Saltak x={hx as number} y={g - 7 + (i % 2)} b={8} d={6} h={3.6} m={S.skifer} gavl={m as Materiale} />
          <Vindusrad x={(hx as number) + 1.6} y={g - 5.6 + (i % 2)} antall={2} b={1.8} h={1.8} mellom={1.4} tent={i % 2 ? 1 : 2} />
        </g>
      ))}
      <Kloss x={106} y={g - 1} b={18} h={11} d={8} m={S.treverk} />
      <Vindusrad x={107.6} y={g - 9.4} antall={5} b={2.2} h={2.4} mellom={1.2} tent={2} />
      <Vindusrad x={107.6} y={g - 5} antall={5} b={2.2} h={2.4} mellom={1.2} tent={2} start={1} />
      <Saltak x={106} y={g - 12} b={18} d={8} h={6} m={S.skifer} gavl={S.treverk} />
      <rect x="110" y={g + 2.6} width="22" height="4.6" rx="1" fill={S.vin.flate} />
      <rect x="111" y={g + 3.4} width="20" height="1.6" fill={S.glass.skygge} />
      {[113, 128].map((cx) => (
        <circle key={cx} cx={cx} cy={g + 7.4} r="1.1" fill={S.mork.skygge} />
      ))}
      {/* Lysløypa ved nivå 100. */}
      {t >= 3 &&
        [[30, g - 34], [27.6, g - 24], [26.4, g - 14]].map(([lx, ly]) => (
          <g key={ly}>
            <rect x={lx + 2.6} y={ly} width="0.5" height="5" fill={S.metall.skygge} />
            <Lampe x={lx + 2.85} y={ly} r={1.8} />
          </g>
        ))}
      {/* Skitrekket (nivå 1) eller stolheisen (fra 25). */}
      <line x1={stor ? 48 : 40} y1={g - 8} x2={stor ? 58 : 47} y2={topp[1] + (stor ? 4 : 2)} stroke={S.mork.flate} strokeWidth="0.4" />
      {(stor ? [0.25, 0.5, 0.75] : [0.33, 0.66]).map((k) => {
        const lx = (stor ? 48 : 40) + k * (stor ? 10 : 7)
        const ly = g - 8 + k * ((topp[1] + (stor ? 4 : 2)) - (g - 8))
        return (
          <g key={k} className={k === 0.5 ? 'anim-gondol sen' : 'anim-gondol'}>
            <rect x={lx - 0.3} y={ly} width="0.6" height="4" fill={S.metall.skygge} />
            <rect x={lx - 1.2} y={ly - 0.2} width="2.4" height="0.5" fill={S.metall.skygge} />
            {stor && <rect x={lx + 1.4} y={ly + 2} width="1.6" height="1.2" fill={S.marine.flate} />}
          </g>
        )
      })}
      {/* Snøkanoner langs nedfarten. */}
      {f >= 2 &&
        [[30, g - 30], [27, g - 20], [stor ? 46 : 36, g - 14]].map(([kx, ky]) => (
          <g key={`${kx}-${ky}`}>
            <rect x={kx - 0.3} y={ky} width="0.6" height="3" fill={S.metall.skygge} />
            <rect x={kx - 1} y={ky - 1} width="2.6" height="1.4" rx="0.6" fill={S.oker.flate} />
            <path d={`M${kx + 1.6} ${ky - 0.6} Q${kx + 6} ${ky - 4} ${kx + 9} ${ky - 1}`} fill="none" stroke={S.hvit.lys} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          </g>
        ))}
      {/* Gondolbanen til toppen; gondolene glir. */}
      {f >= 1 && (
        <g>
          <line x1="78" y1={g - 12} x2={topp[0] + 2} y2={topp[1] + 2} stroke={S.mork.flate} strokeWidth="0.45" />
          <Kloss x={topp[0] - 1} y={topp[1] + 4} b={7} h={4} d={4} m={S.metall} />
          {[0.3, 0.62].map((k) => {
            const gx = 78 + k * (topp[0] + 2 - 78)
            const gy = g - 12 + k * (topp[1] + 2 - (g - 12))
            return (
              <g key={k} className="anim-gondol">
                <line x1={gx} y1={gy} x2={gx} y2={gy + 2.4} stroke={S.mork.flate} strokeWidth="0.35" />
                <rect x={gx - 1.8} y={gy + 2.4} width="3.6" height="3" rx="0.8" fill={S.vin.lys} />
                <rect x={gx - 1.2} y={gy + 3} width="2.4" height="1.2" fill={S.glass.lys} />
              </g>
            )
          })}
          <Kloss x={74} y={g - 6} b={8} h={6} d={5} m={S.metall} />
        </g>
      )}
      {/* Hoppbakken med tribune. */}
      {f >= 3 && (
        <g>
          <path d={`M82 ${g - 50} Q83 ${g - 34} 90 ${g - 28}`} fill="none" stroke={S.hvit.lys} strokeWidth="2.4" />
          <path d={`M82 ${g - 50} Q83 ${g - 34} 90 ${g - 28}`} fill="none" stroke={S.treverk.flate} strokeWidth="0.6" />
          <rect x="80.6" y={g - 54} width="3" height="4" fill={S.hvit.flate} />
          <path d={`M88 ${g - 30} Q86 ${g - 14} 70 ${g - 6}`} fill="none" stroke={S.sno.lys} strokeWidth="5" />
          <Kloss x={80} y={g - 2} b={12} h={4} d={4} m={S.treverk} />
          {[81, 85, 89].map((fx, i) => (
            <g key={fx}>
              <line x1={fx} y1={g - 6} x2={fx} y2={g - 13} stroke={S.hvit.lys} strokeWidth="0.35" />
              <polygon points={`${fx + 0.2},${g - 13} ${fx + 2.6},${g - 12.3} ${fx + 0.2},${g - 11.6}`} fill={[S.vin.lys, S.marine.lys, S.oker.lys][i]} />
            </g>
          ))}
        </g>
      )}
      {/* Lodgen i dalen; et hotell ved nivå 100. */}
      <Slagskygge x1={stor ? 30 : 34} x2={stor ? 56 : 48} lengde={10} d={8} />
      {t >= 3 ? (
        <g>
          <Kloss x={28} b={30} h={14} d={10} m={S.treverk} />
          <Vindusrad x={30} y={g - 12} antall={6} b={3} h={3.4} mellom={1.6} tent={1} />
          <Vindusrad x={30} y={g - 6.6} antall={6} b={3} h={3.4} mellom={1.6} tent={1} start={1} />
          <Saltak x={28} y={g - 14} b={30} d={10} h={8} m={S.skifer} gavl={S.treverk} />
          <Plakett x={4} y={g - 62} />
        </g>
      ) : (
        <g>
          <Kloss x={stor ? 32 : 34} b={stor ? 22 : 14} h={stor ? 9 : 6} d={8} m={S.treverk} />
          <Vindusrad x={stor ? 34 : 36} y={g - (stor ? 7 : 4.8)} antall={stor ? 4 : 2} b={3} h={3} mellom={2} tent={2} />
          <Saltak x={stor ? 32 : 34} y={g - (stor ? 9 : 6)} b={stor ? 22 : 14} d={8} h={stor ? 6 : 4} m={S.skifer} gavl={S.treverk} />
        </g>
      )}
      {/* Skiløpere i bakkene fra nivå 50. */}
      {t >= 2 &&
        [[34, g - 34, S.vin], [29, g - 22, S.marine], [50, g - 30, S.oker], [47, g - 18, S.petrol], [68, g - 26, S.vin]].map(([sx, sy, m], i) => (
          <Figur key={i} x={sx as number} y={sy as number} avstand="fjern" klaer={m as Materiale} vendt={i % 2 ? 1 : -1} />
        ))}
    </>
  )
}

// ─────────────────────────────────────────────── Oppslag

export type Tegning = (p: P & { trinn: Trinn; forbedringer: number; steg?: number }) => ReactNode

/**
 * Stegene (G16) ligger i en egen bit, for startskriptet har ikke plass til dem:
 * bare scenen i detaljvisningen viser dem, så bitene hentes først da (og i ro
 * like etter start).
 */
const trinnsteg = vedBehov('trinnsteg', () => import('./ved-behov/Trinnsteg').then((m) => m.TRINNSTEG))

function Trinnsteg({ id, trinn, f, steg }: { id: string; trinn: Trinn; f: number; steg: number }) {
  const iScenen = useContext(IScenen)
  const hentet = useDel(iScenen ? trinnsteg : null)
  return <>{hentet?.[id]?.(trinn, f, steg)}</>
}

/** En bedrift i den nye stilen: 96 × 96 på et `Lerret`, med stegene lagt over i scenen. */
const bedriftNy =
  (id: string, b: B): Tegning =>
  ({ størrelse = 48, trinn, forbedringer, steg = 0 }) => (
    <Lerret størrelse={størrelse}>
      {b(trinn, forbedringer)}
      {steg > 0 && <Trinnsteg id={id} trinn={trinn} f={forbedringer} steg={steg} />}
    </Lerret>
  )

const BEDRIFTER: Record<string, Tegning> = {
  saftbod: bedriftNy('saftbod', saftbod),
  polsebod: bedriftNy('polsebod', polsebod),
  gatekjokken: bedriftNy('gatekjokken', gatekjokken),
  kiosk: bedriftNy('kiosk', kiosk),
  kafe: bedriftNy('kafe', kafe),
  restaurant: bedriftNy('restaurant', restaurant),
  hotell: bedriftNy('hotell', hotell),
  bank: bedriftNy('bank', bank),
  oljeselskap: bedriftNy('oljeselskap', oljeselskap),
  rederi: bedriftNy('rederi', rederi),
  fiskeoppdrett: bedriftNy('fiskeoppdrett', fiskeoppdrett),
  flyselskap: bedriftNy('flyselskap', flyselskap),
  skisenter: bedriftNy('skisenter', skisenter),
}

/** Eiendommene, tegnet i ved-behov/Eiendomstegninger.tsx og lastet når de trengs (G12). */
export const EIENDOMSIDER = ['hybel', 'leilighet', 'rekkehus', 'hytte', 'hybel-trondheim', 'hybel-oslo', 'leilighet-bergen', 'leilighet-trondheim', 'rekkehus-bergen', 'hytte-trysil', 'hytte-lofoten', 'kontorbygg-stavanger', 'marbella-leilighet', 'marbella-hotell', 'zermatt-leilighet', 'zermatt-hotell', 'kontorbygg', 'kjopesenter', 'naeringsbygg', 'oy', 'stockholm', 'kobenhavn', 'berlin', 'london', 'dubai', 'newyork', 'amsterdam', 'roma', 'paris', 'gard-hedmarken', 'gard-lista', 'skog-trysil', 'skog-namdalen', 'fyret', 'hoppbakken', 'borgen', 'tarnet']

/** Luksusen, tegnet i ved-behov/Luksustegninger.tsx og lastet når de trengs (G12). */
export const LUKSUSIDER = ['stasjonsvogn', 'elbil', 'superbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil', 'dykkerklokke', 'lommeur', 'seilbaat', 'seilyacht', 'helikopter', 'gullklokke', 'mesterverk', 'diamantklokke', 'snekke', 'motorbaat', 'superyacht', 'propellfly', 'forretningsjet', 'langdistansejet']

export const ILLUSTRASJONSIDER = [...Object.keys(BEDRIFTER), ...EIENDOMSIDER, ...LUKSUSIDER]

/**
 * Eiendom og luksus ligger utenfor startskriptet (G12): Bedrifter-fanen, som
 * spillet starter på, trenger bare bedriftene. Delene hentes første gang en av
 * tegningene deres vises, og i ro like etter start (`forvarm` i ui/vedBehov.ts).
 */
const eiendomstegninger = vedBehov('eiendomstegninger', () => import('./ved-behov/Eiendomstegninger').then((m) => m.EIENDOMSTEGNINGER))
const luksustegninger = vedBehov('luksustegninger', () => import('./ved-behov/Luksustegninger').then((m) => m.LUKSUSTEGNINGER))
const DEL_FOR = new Map<string, typeof eiendomstegninger>([
  ...EIENDOMSIDER.map((id) => [id, eiendomstegninger] as const),
  ...LUKSUSIDER.map((id) => [id, luksustegninger] as const),
])

/** Plassen til en tegning som ikke er hentet ennå: et tomt lerret i samme størrelse. */
const TOMT: Tegning = ({ størrelse = 48 }) => (
  <Lerret størrelse={størrelse} himmel="ingen">
    {null}
  </Lerret>
)

/**
 * Tegningene som er tegnet i den nye stilen (G1). Listen vokser til den dekker alt.
 * Hver eiendom har sin egen tegning fra stedet den ligger (G5), så les `sted` i
 * EIENDOMSTYPER før du tegner en ny.
 */
export const NY_STIL = ['kiosk', 'hytte', 'hytte-trysil', 'hytte-lofoten', 'kontorbygg', 'kontorbygg-stavanger', 'superbil', 'seilbaat', 'saftbod', 'polsebod', 'gatekjokken', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter', 'stasjonsvogn', 'elbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil', 'dykkerklokke', 'gullklokke', 'mesterverk', 'lommeur', 'diamantklokke', 'snekke', 'motorbaat', 'seilyacht', 'superyacht', 'propellfly', 'helikopter', 'forretningsjet', 'langdistansejet', 'hybel', 'hybel-oslo', 'hybel-trondheim', 'leilighet', 'leilighet-bergen', 'leilighet-trondheim', 'rekkehus', 'rekkehus-bergen', 'gard-hedmarken', 'gard-lista', 'skog-trysil', 'skog-namdalen', 'oy', 'fyret', 'borgen', 'hoppbakken', 'tarnet', 'naeringsbygg', 'kjopesenter', 'stockholm', 'kobenhavn', 'berlin', 'london', 'newyork', 'dubai', 'marbella-leilighet', 'marbella-hotell', 'zermatt-leilighet', 'zermatt-hotell', 'amsterdam', 'roma', 'paris']

/**
 * Tegningene med full ramme (G13): ingen vignett, og i scenen bredformat
 * 176 × 96 (x −40 til 136), med den gamle firkanten midt i. Slås på tegning for
 * tegning, gruppe for gruppe (G13–G21 i Ideer.md); resten har vignetten til de
 * er tegnet brede. En tegning her må nå kantene selv: alt som før bleknet ut
 * (bakgrunn, gjerder, rekker av hus), må forlenges til x −40 og 136.
 */
export const FULL_RAMME: readonly string[] = [
  // G13–G15: bedriftene.
  'saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter',
  // G17: boligene og hyttene.
  'hybel', 'hybel-oslo', 'hybel-trondheim', 'leilighet', 'leilighet-bergen', 'leilighet-trondheim', 'rekkehus', 'rekkehus-bergen', 'hytte', 'hytte-trysil', 'hytte-lofoten',
]

/** Bedriftene, som har fire vekstrinn. */
export const BEDRIFTSTEGNINGER = ['saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter']

/**
 * Nærbildene (G9): utsnittet rundt motivet, [x, y, bredde, høyde] i lerretets
 * enheter, for steder der tegningen er så liten at motivet forsvinner.
 * Bedriftene er målt på trinn 0 og er kvadratiske (rivallista, 32 px; saftboden
 * og pølseboden også på kortet, se `NAER_PAA_KORTET` i BedriftIkon); bilene,
 * båtene og flyene er brede eller høye som motivet (plassene i lageret).
 * Lest av på et rutenett over tegningen i ?galleri.
 */
export const NAERBILDER: Record<string, readonly [number, number, number, number]> = {
  saftbod: [12, 22, 64, 64],
  polsebod: [24, 38, 50, 50],
  gatekjokken: [31, 42, 46, 46],
  kiosk: [26, 34, 56, 56],
  kafe: [19, 15, 72, 72],
  restaurant: [22, 18, 68, 68],
  hotell: [31, 34, 52, 52],
  bank: [24, 32, 60, 60],
  oljeselskap: [28, 30, 56, 56],
  rederi: [32, 40, 56, 56],
  fiskeoppdrett: [44, 52, 40, 40],
  flyselskap: [10, 16, 80, 80],
  skisenter: [14, 24, 68, 68],
  stasjonsvogn: [5, 48, 88, 40],
  elbil: [5, 54, 88, 34],
  superbil: [5, 54, 88, 34],
  hyperbil: [5, 54, 88, 34],
  veteranbil: [5, 50, 88, 38],
  limousin: [2, 54, 92, 34],
  formelbil: [2, 50, 92, 38],
  snekke: [30, 56, 64, 38],
  motorbaat: [8, 58, 86, 36],
  superyacht: [2, 44, 92, 50],
  seilbaat: [28, 2, 64, 92],
  seilyacht: [12, 0, 80, 94],
  propellfly: [4, 60, 90, 32],
  forretningsjet: [4, 60, 90, 32],
  langdistansejet: [2, 60, 94, 30],
  helikopter: [2, 58, 92, 36],
}

/**
 * Nærbilder per vekstrinn (G13), der motivet vokser ut av nærbildet fra trinn 0:
 * skiltet, taket og plaketten skal med når flisa fylles helt. Trinn uten eget
 * utsnitt bruker `NAERBILDER`.
 */
const TRINNUTSNITT: Record<string, readonly (readonly [number, number, number, number])[]> = {
  saftbod: [[12, 22, 64, 64], [12, 18, 68, 68], [12, 18, 68, 68], [12, 18, 68, 68]],
  polsebod: [[24, 38, 50, 50], [22, 34, 56, 56], [22, 34, 56, 56], [22, 34, 56, 56]],
  gatekjokken: [[31, 42, 46, 46], [20, 22, 74, 74], [20, 22, 74, 74], [20, 22, 74, 74]],
  kafe: [[19, 15, 72, 72], [6, 10, 80, 80], [6, 10, 80, 80], [6, 10, 80, 80]],
  restaurant: [[22, 18, 68, 68], [10, 14, 76, 76], [10, 14, 76, 76], [10, 14, 76, 76]],
  hotell: [[26, 22, 64, 64], [22, 10, 76, 76], [18, 4, 82, 82], [18, 0, 86, 86]],
  bank: [[24, 32, 60, 60], [12, 14, 74, 74], [6, 12, 80, 80], [6, 12, 80, 80]],
  oljeselskap: [[26, 26, 60, 60], [20, 20, 70, 70], [20, 20, 70, 70], [2, 14, 82, 82]],
  rederi: [[30, 36, 58, 58], [28, 32, 62, 62], [26, 30, 64, 64], [24, 24, 70, 70]],
  fiskeoppdrett: [[28, 40, 54, 54], [32, 36, 60, 60], [30, 34, 62, 62], [30, 30, 66, 66]],
  flyselskap: [[10, 16, 80, 80], [10, 16, 80, 80], [10, 16, 80, 80], [2, 10, 86, 86]],
  skisenter: [[14, 24, 68, 68], [6, 12, 80, 80], [6, 12, 80, 80], [0, 8, 86, 86]],
}

/**
 * Flisene for eiendommene med full ramme (G17): et kvadratisk utsnitt som tar med
 * bygget og litt hage, hage og vær rundt, ut til hjørnene i flisa (68 px). Boligene
 * har ikke vekstrinn, så ett utsnitt holder, og de står ikke i `NAERBILDER`:
 * galleriet og lageret viser nærbilder bare for bedrifter og luksus.
 */
export const FLISUTSNITT: Record<string, readonly [number, number, number, number]> = {
  hybel: [4, 11, 85, 85],
  'hybel-oslo': [4, 8, 88, 88],
  'hybel-trondheim': [6, 8, 88, 88],
  leilighet: [4, 6, 90, 90],
  'leilighet-bergen': [4, 8, 88, 88],
  'leilighet-trondheim': [8, 20, 76, 76],
  rekkehus: [8, 42, 54, 54],
  'rekkehus-bergen': [8, 42, 54, 54],
  hytte: [6, 20, 76, 76],
  'hytte-trysil': [6, 18, 78, 78],
  'hytte-lofoten': [12, 22, 74, 74],
}

/**
 * Illustrasjonen for en bedrift, eiendom eller luksusgjenstand, etter id.
 * Bedrifter vokser med `trinn` og viser `forbedringer` (0–3) som detaljer.
 * Med `utklipp` kommer tegningene uten himmel, bakke og bakgrunn, til steder
 * som har sin egen scene rundt. Med `naerbilde` ([maks bredde, maks høyde] i
 * piksler) vises bare utsnittet rundt motivet (`NAERBILDER`), så stort det får
 * plass; tegninger uten utsnitt vises hele, i `størrelse`. Til en eiendoms- eller
 * luksustegning er hentet, står et tomt lerret i samme størrelse (G12).
 */
export const Illustrasjon = memo(function Illustrasjon({
  id,
  størrelse = 44,
  trinn = 0,
  forbedringer = 0,
  utklipp = false,
  naerbilde,
  steg = 0,
}: {
  id: string
  størrelse?: number
  trinn?: Trinn
  forbedringer?: number
  utklipp?: boolean
  naerbilde?: readonly [number, number]
  /** Steget inne i vekstrinnet (`stegFor`), bare i scenen. */
  steg?: number
}) {
  const del = DEL_FOR.get(id) ?? null
  const hentet = useDel(del)
  if (!del && !BEDRIFTER[id]) return null
  const Tegning: Tegning = del ? (hentet?.[id] ?? TOMT) : BEDRIFTER[id]
  const boks = naerbilde && (TRINNUTSNITT[id]?.[trinn] ?? NAERBILDER[id] ?? FLISUTSNITT[id])
  const skala = boks ? Math.min(naerbilde[0] / boks[2], naerbilde[1] / boks[3]) : 1
  const naer = boks ? { boks, bredde: Math.round(boks[2] * skala), hoyde: Math.round(boks[3] * skala) } : null
  return (
    <Fullramme.Provider value={FULL_RAMME.includes(id)}>
      <Utklipp.Provider value={utklipp}>
        <Naerbilde.Provider value={naer}>{Tegning({ størrelse, trinn, forbedringer, steg })}</Naerbilde.Provider>
      </Utklipp.Provider>
    </Fullramme.Provider>
  )
})
