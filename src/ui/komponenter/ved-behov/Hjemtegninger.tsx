/**
 * Hjemmene (Grafikkpakke G16): Hjemmet på Frogner, Hytta på Geilo og Feriehuset
 * i Marbella, med de tre rommene i hvert, slik de er innredet. Hvert rom har
 * fire stadier: 0 er ikke innredet (rått, med en pære og litt rot), 1–3 er de tre
 * trinnene du kjøper, i samme rekkefølge som i `ROM` (engine/hjemmene.ts).
 *
 * Hjemmet og Hytta er snitt: veggen mot oss er tatt bort, så du ser inn i
 * rommene. Feriehuset er sett utenfra, med terrassen, bassenget og gjestefløyen.
 * Alle er i full ramme (176 × 96, x −40 til 136), med det viktigste innenfor
 * midtfirkanten (x 0–96) som flisa på kortet viser. I scenen lyser rommene om
 * natta (`nattvindu`), og peisen, badstua og boblebadet ryker og flakker.
 * Delen lastes når et hjem vises (ui/komponenter/Hjemscene.tsx).
 */

import type { ReactNode } from 'react'
import { Dis, Kloss, Lampe, Lerret, Person as Figur, pkt, r2, S, Tre, type Materiale } from '../Tegnestil'

export type Rompakke = readonly [number, number, number]
export type Hjemtegning = (p: { størrelse: number; rom: Rompakke }) => ReactNode

// ─────────────────────────────────────────────── Felles

const FLASKER = [S.vin.flate, S.gran.flate, S.oker.flate, S.vin.skygge, S.petrol.flate, S.treMork.lys]

/**
 * En flaskereol sett forfra, flaskene ligger med bunnen mot oss: `kol` × `rad`
 * i et treverk, øvre venstre hjørne i (x, y). Hver flaske er en liten sirkel.
 */
function Flaskereol({ x, y, kol, rad, dx = 3.2, dy = 3, start = 0 }: { x: number; y: number; kol: number; rad: number; dx?: number; dy?: number; start?: number }) {
  const b = r2(kol * dx)
  const h = r2(rad * dy)
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} fill={S.treMork.skygge} />
      {Array.from({ length: rad }, (_, r) =>
        Array.from({ length: kol }, (_, c) => (
          <g key={`${r}-${c}`}>
            <circle cx={r2(x + dx / 2 + c * dx)} cy={r2(y + dy / 2 + r * dy)} r={r2(Math.min(dx, dy) * 0.38)} fill={FLASKER[(start + r * 2 + c * 3) % FLASKER.length]} />
            <circle cx={r2(x + dx / 2 + c * dx - 0.3)} cy={r2(y + dy / 2 + r * dy - 0.3)} r="0.3" fill={S.hvit.lys} opacity="0.5" />
          </g>
        )),
      )}
      {Array.from({ length: rad + 1 }, (_, r) => (
        <rect key={r} x={r2(x - 0.4)} y={r2(y + r * dy - 0.3)} width={r2(b + 0.8)} height="0.6" fill={S.treverk.flate} />
      ))}
      {[0, b].map((dxx) => (
        <rect key={dxx} x={r2(x + dxx - 0.4)} y={y} width="0.8" height={h} fill={S.treverk.lys} />
      ))}
    </g>
  )
}

/** Et innrammet bilde: ramme i `ramme`, lerret med blokker i `farger`, på (x, y) med størrelse b × h. */
function Bilde({ x, y, b, h, farger, ramme = S.gull.flate }: { x: number; y: number; b: number; h: number; farger: string[]; ramme?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} fill={ramme} />
      <rect x={r2(x + 0.7)} y={r2(y + 0.7)} width={r2(b - 1.4)} height={r2(h - 1.4)} fill={farger[0]} />
      <rect x={r2(x + 0.7)} y={r2(y + h * 0.5)} width={r2(b - 1.4)} height={r2(h * 0.5 - 0.7)} fill={farger[1]} />
      <circle cx={r2(x + b * 0.66)} cy={r2(y + h * 0.36)} r={r2(Math.min(b, h) * 0.18)} fill={farger[2]} />
    </g>
  )
}

/** Et glassvindu med hvit karm: himmel bak, og et lite glansfelt. */
function Rute({ x, y, b, h, karm = S.hvit.lys, sprosse = true }: { x: number; y: number; b: number; h: number; karm?: string; sprosse?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} fill={karm} />
      <rect x={r2(x + 0.7)} y={r2(y + 0.7)} width={r2(b - 1.4)} height={r2(h - 1.4)} fill={S.glass.lys} />
      <polygon points={pkt([x + 0.7, y + 0.7], [x + b * 0.5, y + 0.7], [x + 0.7 + b * 0.18, y + h - 0.7], [x + 0.7, y + h - 0.7])} fill={S.hvit.lys} opacity="0.35" />
      {sprosse && <rect x={r2(x + b / 2 - 0.3)} y={y} width="0.6" height={h} fill={karm} />}
    </g>
  )
}

// ─────────────────────────────────────────────── Hjemmet på Frogner

/** Byen bak: gamle villaer og bygårder i disen, så snittet står i en gate på Frogner. */
function FrognerBak() {
  const hus: [number, number, number, Materiale][] = [
    [-40, 18, 34, S.puss],
    [-21, 16, 28, S.tegl],
    [-4, 12, 36, S.hvit],
    [98, 14, 30, S.oker],
    [113, 12, 38, S.stein],
    [126, 16, 30, S.puss],
  ]
  return (
    <Dis>
      {hus.map(([x, b, h, m]) => (
        <g key={x}>
          <rect x={x} y={r2(66 - h)} width={b} height={h} fill={m.flate} />
          <polygon points={pkt([x - 0.5, 66 - h], [x + b / 2, 66 - h - 5], [x + b + 0.5, 66 - h])} fill={S.skifer.flate} />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => <rect key={`${r}-${c}`} x={r2(x + 2.4 + c * (b / 2 - 0.4))} y={r2(66 - h + 3 + r * 8)} width="3" height="4" fill={S.glass.skygge} className="nattvindu" />),
          )}
        </g>
      ))}
    </Dis>
  )
}

/** Kjøkkenet (x 9–47, gulv y 64): fra rått rom til restaurantkjøkken. */
function Kjokken({ n }: { n: number }) {
  return (
    <g>
      <rect x="9" y="40" width="38" height="24" fill={n === 0 ? S.stein.lys : S.hvit.flate} className={n > 0 ? 'nattvindu' : undefined} />
      <rect x="9" y="61" width="38" height="3" fill={n === 0 ? S.stein.skygge : S.treverk.flate} />
      {n === 0 && (
        <g>
          {/* Rått rom: en stige, malingsspann og en pære på ledning. */}
          <line x1="28" y1="40" x2="28" y2="46" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx="28" cy="47" r="1.3" fill={S.vinduLys.lys} className="nattvindu" />
          <path d="M34 63 L37 46 L40 63" fill="none" stroke={S.treverk.skygge} strokeWidth="1" strokeLinejoin="round" />
          {[50, 54, 58].map((y) => (
            <line key={y} x1={r2(34.8 + (y - 50) * -0.2)} y1={y} x2={r2(39 + (y - 50) * 0.2)} y2={y} stroke={S.treverk.skygge} strokeWidth="0.8" />
          ))}
          <rect x="13" y="59" width="4" height="4" rx="0.4" fill={S.metall.flate} />
          <rect x="13" y="59" width="4" height="1" fill={S.vin.flate} />
          <rect x="19" y="60.4" width="3.2" height="2.6" rx="0.4" fill={S.metall.skygge} />
          <polygon points="12,64 20,64 18,62.4 14,62.4" fill={S.hvit.skygge} opacity="0.7" />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Nye fronter og benkeplate: skap i hvitt, flis over benken og et vindu. */}
          <Rute x={31} y={42} b={11} h={10} />
          <rect x="9" y="48.5" width="38" height="4.2" fill={S.hvit.lys} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={r2(9.6 + i * 4.2)} y="48.5" width="0.3" height="4.2" fill={S.hvit.skygge} opacity="0.7" />
          ))}
          <rect x="10" y="41.6" width="21" height="6.8" fill={S.hvit.lys} />
          {[10, 17, 24].map((x) => (
            <g key={x}>
              <rect x={x} y="41.6" width="7" height="6.8" fill={S.hvit.lys} stroke={S.hvit.skygge} strokeWidth="0.3" />
              <rect x={r2(x + 5.4)} y="46.2" width="0.5" height="1.6" fill={S.metall.flate} />
            </g>
          ))}
          <rect x="10" y="53.6" width="36" height="1.6" fill={S.stein.lys} />
          <rect x="10" y="55.2" width="36" height="7.2" fill={S.hvit.lys} />
          {[10, 19, 28, 37].map((x) => (
            <g key={x}>
              <rect x={x} y="55.2" width="9" height="7.2" fill={S.hvit.lys} stroke={S.hvit.skygge} strokeWidth="0.3" />
              <rect x={r2(x + 7.2)} y="56" width="0.5" height="1.8" fill={S.metall.flate} />
            </g>
          ))}
          <rect x="10" y="62.4" width="36" height="1" fill={S.mork.skygge} />
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Kjøkkenøy i marmor, to barkrakker og to lamper over. */}
          {[24, 35].map((x) => (
            <g key={x}>
              <line x1={x} y1="40" x2={x} y2="44.4" stroke={S.mork.flate} strokeWidth="0.35" />
              <path d={`M${x - 2.4} 47 Q${x - 2.4} 44.2 ${x} 44.2 Q${x + 2.4} 44.2 ${x + 2.4} 47 Z`} fill={S.glass.skygge} className="nattvindu" />
              <rect x={r2(x - 2.4)} y="46.8" width="4.8" height="0.5" fill={S.metall.flate} />
            </g>
          ))}
          <rect x="17.4" y="57.4" width="22.6" height="6.4" fill={S.treverk.lys} />
          <rect x="17.4" y="57.4" width="22.6" height="0.8" fill={S.treverk.skygge} opacity="0.4" />
          <polygon points="16,57.4 41.6,57.4 40.6,55.4 17,55.4" fill={S.hvit.lys} />
          <path d="M20 56.8 L24 55.8 M28 57 L33 55.7 M35 57 L38 56.2" stroke={S.stein.lys} strokeWidth="0.35" fill="none" />
          {[22, 36].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="60.4" rx="2" ry="0.7" fill={S.mork.flate} />
              <rect x={r2(x - 0.2)} y="61" width="0.4" height="3" fill={S.metall.skygge} />
            </g>
          ))}
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Restaurantkjøkken: avtrekk og komfyr i stål, kjeler på stang og et vinskap i glass. */}
          <polygon points="12.4,48.4 26.4,48.4 25,43.4 13.8,43.4" fill={S.metall.flate} />
          <rect x="13.8" y="40.4" width="11.2" height="3" fill={S.metall.skygge} />
          <rect x="12" y="48.2" width="14.8" height="0.8" fill={S.metall.lys} />
          <line x1="12" y1="51.4" x2="27" y2="51.4" stroke={S.metall.skygge} strokeWidth="0.5" />
          {[14.4, 18.4, 22.4].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="51.4" x2={x} y2="52.6" stroke={S.metall.skygge} strokeWidth="0.4" />
              <circle cx={x} cy={r2(54 + (i % 2))} r={1.4} fill={S.metall.skygge} />
              <circle cx={x} cy={r2(54 + (i % 2))} r="0.6" fill={S.mork.flate} />
            </g>
          ))}
          <rect x="12" y="55.4" width="15" height="7" fill={S.metall.flate} />
          <rect x="12" y="55.4" width="15" height="1.2" fill={S.metall.lys} />
          <rect x="13.4" y="58" width="12.2" height="4" fill={S.mork.flate} />
          {[14.6, 18, 21.4, 24.6].map((x) => (
            <circle key={x} cx={x} cy="56.4" r="0.45" fill={S.mork.flate} />
          ))}
          <path className="anim-damp" d="M17.6 53.4 Q16.8 52.2 17.6 51 M20.4 53.4 Q19.6 52.2 20.4 51" fill="none" stroke={S.hvit.lys} strokeWidth="0.5" strokeLinecap="round" />
          <rect x="32.4" y="42" width="12.4" height="22" fill={S.mork.flate} />
          <rect x="33.4" y="43" width="10.4" height="20" fill={S.glass.skygge} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              {[0, 1, 2].map((c) => (
                <rect key={c} x={r2(34.4 + c * 3.2)} y={r2(44.4 + r * 6.2)} width="1.6" height="4.4" rx="0.5" fill={FLASKER[(r * 3 + c) % FLASKER.length]} />
              ))}
              <rect x="33.4" y={r2(49.4 + r * 6.2)} width="10.4" height="0.5" fill={S.hvit.lys} opacity="0.7" />
            </g>
          ))}
          <rect x="33.4" y="43" width="10.4" height="20" fill={S.vinduLys.flate} opacity="0.16" className="nattvindu" />
          <Figur x={30} y={63} avstand="gate" klaer={S.hvit} har={S.mork.flate} />
          <rect x="27.2" y="44.8" width="5.2" height="1.2" rx="0.6" fill={S.hvit.lys} />
        </g>
      )}
    </g>
  )
}

/** Stuen (x 49–87): fra et tomt rom til en salong med flygel. */
function Stue({ n }: { n: number }) {
  return (
    <g>
      <rect x="49" y="40" width="38" height="24" fill={n === 0 ? S.stein.lys : S.puss.flate} className={n > 0 ? 'nattvindu' : undefined} />
      <rect x="49" y="61" width="38" height="3" fill={n === 0 ? S.stein.skygge : S.treverk.lys} />
      {n >= 1 &&
        Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={r2(52 + i * 3.2)} y1="61" x2={r2(51 + i * 3.2)} y2="64" stroke={S.treverk.flate} strokeWidth="0.3" />
        ))}
      {n === 0 && (
        <g>
          <line x1="68" y1="40" x2="68" y2="45" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx="68" cy="46" r="1.3" fill={S.vinduLys.lys} className="nattvindu" />
          <rect x="52" y="58" width="9" height="5" fill={S.treverk.flate} />
          <rect x="52" y="58" width="9" height="1" fill={S.treverk.lys} />
          <rect x="54" y="54" width="8" height="4.2" fill={S.treverk.flate} />
          <path d="M52 57.6 Q58 55 62 57.6 L61 63 L53 63 Z" fill={S.hvit.skygge} opacity="0.85" />
          <rect x="75" y="59" width="8" height="4" rx="1.8" fill={S.sno.skygge} />
          <rect x="75" y="59" width="8" height="1.2" rx="0.6" fill={S.sno.flate} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Designersofa, teppe, gulvlampe og en plante. */}
          <ellipse cx="70" cy="62.6" rx="15" ry="1.2" fill={S.vin.flate} />
          <g transform="translate(20.6 0) scale(0.78 1)">
          <rect x="57" y="50.4" width="24" height="6" rx="1.6" fill={S.marine.skygge} />
          <rect x="55.6" y="55.4" width="26.8" height="5.8" rx="1.4" fill={S.marine.flate} />
          <rect x="55.6" y="55.4" width="26.8" height="1.2" rx="0.6" fill={S.marine.lys} />
          <rect x="54.4" y="52.6" width="3.4" height="8.6" rx="1.4" fill={S.marine.lys} />
          <rect x="80.2" y="52.6" width="3.4" height="8.6" rx="1.4" fill={S.marine.lys} />
          <rect x="60" y="52.4" width="5" height="4" rx="1" fill={S.oker.flate} />
          <rect x="72" y="52.8" width="5" height="3.6" rx="1" fill={S.hvit.flate} />
          <rect x="56.6" y="61" width="1" height="2.4" fill={S.mork.flate} />
          <rect x="80.6" y="61" width="1" height="2.4" fill={S.mork.flate} />
          </g>
          <line x1="86" y1="63" x2="86" y2="47" stroke={S.metall.skygge} strokeWidth="0.5" />
          <path d="M83.4 46 L88.6 46 L87.4 42.4 L84.6 42.4 Z" fill={S.vinduLys.lys} />
          <circle cx="86" cy="46.4" r="2.8" fill={S.vinduLys.lys} opacity="0.2" />
          <rect x="50.4" y="58" width="2.8" height="5.4" fill={S.tegl.flate} />
          {[[51.8, 55.6, 2.2], [50.4, 57, 1.7], [53.4, 57.2, 1.6]].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={S.lov.flate} />
          ))}
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Kunstveggen: fire bilder med egne lys over sofaen. */}
          <Bilde x={63} y={42} b={9.4} h={7.6} farger={[S.marine.flate, S.oker.flate, S.hvit.flate]} />
          <Bilde x={73.6} y={42.6} b={6} h={9} farger={[S.vin.flate, S.hvit.lys, S.oker.lys]} />
          <Bilde x={81} y={42.6} b={4.4} h={5.4} farger={[S.gran.flate, S.oker.lys, S.hvit.flate]} ramme={S.mork.flate} />
          <Bilde x={53} y={44} b={4} h={6.4} farger={[S.petrol.flate, S.hvit.lys, S.vin.lys]} ramme={S.mork.flate} />
          {[67.7, 76.6, 83.2].map((x) => (
            <g key={x}>
              <rect x={r2(x - 2)} y="40.8" width="4" height="0.8" fill={S.metall.skygge} />
              <polygon points={pkt([x - 1.6, 41.6], [x + 1.6, 41.6], [x + 3.4, 50], [x - 3.4, 50])} fill={S.vinduLys.lys} opacity="0.16" />
            </g>
          ))}
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Salong med flygel, lysekrone og tunge gardiner. */}
          <rect x="49" y="40" width="3.4" height="22" fill={S.vin.skygge} />
          <rect x="83.6" y="40" width="3.4" height="22" fill={S.vin.skygge} />
          {[50, 51.4].map((x) => (
            <line key={x} x1={x} y1="40" x2={x} y2="62" stroke={S.vin.flate} strokeWidth="0.4" />
          ))}
          {[85.4, 86.6].map((x) => (
            <line key={x} x1={x} y1="40" x2={x} y2="62" stroke={S.vin.flate} strokeWidth="0.4" />
          ))}
          <line x1="58" y1="40" x2="58" y2="44.6" stroke={S.gull.skygge} strokeWidth="0.4" />
          <path d="M52.4 47.6 Q58 49.6 63.6 47.6 L62.4 45.6 Q58 47 53.6 45.6 Z" fill={S.gull.flate} />
          {[53.4, 55.6, 58, 60.4, 62.6].map((x) => (
            <g key={x}>
              <rect x={r2(x - 0.3)} y="43.4" width="0.6" height="2.4" fill={S.hvit.lys} />
              <circle cx={x} cy="42.8" r="0.8" fill={S.vinduLys.lys} />
            </g>
          ))}
          <circle cx="58" cy="46" r="7" fill={S.vinduLys.lys} opacity="0.1" />
          <path d="M51.4 61.6 L51.4 58 Q51.4 56.8 53 56.4 L62.4 54.6 Q64.6 54.4 64.6 57.4 L64 61.6 Z" fill={S.mork.flate} />
          <path d="M52.4 56.6 L60.4 52.2 L64.4 55.6 L62 55 Z" fill={S.mork.lys} />
          <rect x="52" y="57.4" width="11.4" height="1.2" fill={S.hvit.lys} />
          <rect x="52" y="61.4" width="1" height="2.6" fill={S.mork.flate} />
          <rect x="62.2" y="61.4" width="1" height="2.6" fill={S.mork.flate} />
          <rect x="55.4" y="61.6" width="5.6" height="1.6" rx="0.5" fill={S.mork.skygge} />
        </g>
      )}
    </g>
  )
}

/** Vinkjelleren (x 9–87, y 68–90): fra bar betong til en samling i verdensklasse. */
function Vinkjeller({ n }: { n: number }) {
  const vegg = [S.stein.flate, S.stein.lys, S.tegl.skygge, S.treMork.flate][n]
  return (
    <g>
      <rect x="9" y="68" width="78" height="22" fill={vegg} className={n > 0 ? 'nattvindu' : undefined} />
      <rect x="9" y="86.4" width="78" height="3.6" fill={n === 3 ? S.treverk.skygge : S.stein.skygge} />
      {n >= 2 &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M${r2(13 + i * 24)} 80 Q${r2(25 + i * 24)} ${68 + 1} ${r2(37 + i * 24)} 80`} fill="none" stroke={n === 3 ? S.treverk.lys : S.tegl.lys} strokeWidth="0.8" />
        ))}
      {n === 0 && (
        <g>
          <line x1="48" y1="68" x2="48" y2="74" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx="48" cy="75" r="1.3" fill={S.vinduLys.lys} className="nattvindu" />
          {[[14, 80, 8, 7], [23, 82.4, 7, 5], [64, 78.4, 9, 8.6], [74, 82, 7, 5]].map(([x, y, b, h]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width={b} height={h} fill={S.treverk.flate} />
              <rect x={x} y={y} width={b} height="1" fill={S.treverk.lys} />
              <rect x={r2(x + b / 2 - 0.4)} y={y} width="0.8" height={h} fill={S.treverk.skygge} />
            </g>
          ))}
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Vinrom med flaskereoler langs veggen, og en lampe i taket. */}
          <Flaskereol x={12} y={69.4} kol={9} rad={5} dx={3.1} dy={3.4} />
          <line x1="48" y1="68" x2="48" y2="72" stroke={S.mork.flate} strokeWidth="0.4" />
          <path d="M45.6 75 Q45.6 72.2 48 72.2 Q50.4 72.2 50.4 75 Z" fill={S.metall.skygge} />
          <circle cx="48" cy="75.2" r="1.1" fill={S.vinduLys.lys} />
          <circle cx="48" cy="76" r="5" fill={S.vinduLys.lys} opacity="0.14" />
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Smaksrom: en flaskereol til, et bord med glass og lys, to krakker. */}
          <Flaskereol x={61} y={69.4} kol={8} rad={4} dx={3.1} dy={3.4} start={2} />
          <ellipse cx="52" cy="81" rx="6.6" ry="1.5" fill={S.treverk.lys} />
          <rect x="51.4" y="81" width="1.2" height="6.4" fill={S.treMork.flate} />
          <ellipse cx="52" cy="87.4" rx="3.2" ry="0.7" fill={S.treMork.skygge} />
          {[47.6, 50.4, 53.2].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 78.8 L${r2(x + 1.4)} 78.8 L${r2(x + 0.9)} 80.6 L${r2(x + 0.5)} 80.6 Z`} fill={S.hvit.lys} opacity="0.85" />
              <rect x={r2(x + 0.55)} y="80.6" width="0.3" height="0.9" fill={S.hvit.lys} />
              <rect x={r2(x + 0.1)} y={r2(79.6 + (i % 2) * 0.3)} width="1.2" height="0.5" fill={S.vin.flate} />
            </g>
          ))}
          <rect x="56.6" y="78.4" width="1.2" height="2.4" fill={S.hvit.lys} />
          <circle cx="57.2" cy="77.8" r="0.8" fill={S.vinduLys.lys} />
          {[43.4, 61].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="84.8" rx="2.4" ry="0.8" fill={S.treMork.flate} />
              <rect x={r2(x - 0.2)} y="84.8" width="0.4" height="2.6" fill={S.treMork.flate} />
            </g>
          ))}
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Samling i verdensklasse: reoler fra gulv til tak, et lyst glasskap med de sjeldne flaskene og en sommelier. */}
          <rect x="42" y="69.2" width="13.4" height="9.6" fill={S.mork.flate} />
          <rect x="42.8" y="70" width="11.8" height="8" fill={S.vinduLys.flate} opacity="0.55" className="nattvindu" />
          {[0, 1].map((r) => (
            <g key={r}>
              {[0, 1, 2].map((c) => (
                <rect key={c} x={r2(44 + c * 3.6)} y={r2(70.6 + r * 3.8)} width="1.8" height="3" rx="0.5" fill={FLASKER[(r * 3 + c) % FLASKER.length]} />
              ))}
              <rect x="42.8" y={r2(73.8 + r * 3.8)} width="11.8" height="0.4" fill={S.gull.lys} />
            </g>
          ))}
          <rect x="46.4" y="78.8" width="5.2" height="1" rx="0.3" fill={S.gull.flate} />
          <Figur x={70} y={88} avstand="gate" klaer={S.mork} har={S.treMork.skygge} />
          <rect x="68.6" y="79" width="3.2" height="5.6" fill={S.hvit.lys} />
          <Lampe x={38} y={74} r={1.6} />
        </g>
      )}
    </g>
  )
}

/** Hjemmet: snittet gjennom et hus på Frogner — vinkjeller, kjøkken og stue. */
const Hjemmet: Hjemtegning = ({ størrelse, rom: [kj, st, vk] }) => (
  <Lerret størrelse={størrelse}>
    <FrognerBak />
    {/* Naboene til hver side, og to lindetrær langs fortauet. */}
    <g>
      <rect x="-40" y="44" width="42" height="22" fill={S.oker.flate} />
      <polygon points={pkt([-41, 44], [-31, 34], [-7, 34], [3, 44])} fill={S.tegl.flate} />
      <rect x="-40" y="44" width="42" height="1.6" fill={S.hvit.flate} />
      {[-36, -26, -16, -6].map((x) => (
        <g key={x}>
          <rect x={x} y="48" width="5" height="7" fill={S.hvit.lys} />
          <rect x={r2(x + 0.7)} y="48.7" width="3.6" height="5.6" fill={S.glass.skygge} className="nattvindu" />
          <rect x={x} y="57" width="5" height="7" fill={S.hvit.lys} />
          <rect x={r2(x + 0.7)} y="57.7" width="3.6" height="5.6" fill={S.glass.skygge} className="nattvindu" />
        </g>
      ))}
      <rect x="94" y="40" width="42" height="26" fill={S.hvit.flate} />
      <polygon points={pkt([93, 40], [103, 30], [127, 30], [137, 40])} fill={S.skifer.flate} />
      <rect x="94" y="40" width="42" height="1.6" fill={S.hvit.skygge} />
      {[98, 108, 118, 128].map((x) => (
        <g key={x}>
          <rect x={x} y="45" width="5" height="8" fill={S.hvit.skygge} />
          <rect x={r2(x + 0.7)} y="45.7" width="3.6" height="6.6" fill={S.glass.skygge} className="nattvindu" />
          <rect x={x} y="55" width="5" height="8" fill={S.hvit.skygge} />
          <rect x={r2(x + 0.7)} y="55.7" width="3.6" height="6.6" fill={S.glass.skygge} className="nattvindu" />
        </g>
      ))}
    </g>
    <Tre x={-17} y={66} h={34} />
    <Tre x={112} y={66} h={40} />
    {/* Jorda, med en lysere gressrand, og steiner. */}
    <rect x="-40" y="66" width="176" height="30" fill={S.treMork.flate} />
    <rect x="-40" y="66" width="176" height="1.6" fill={S.treMork.lys} />
    {[[-30, 74, 3.2], [-12, 88, 2.4], [100, 78, 3], [118, 90, 3.6], [128, 72, 2], [-34, 92, 2.6]].map(([x, y, r]) => (
      <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={r} ry={r2(r * 0.7)} fill={S.stein.skygge} />
    ))}
    <rect x="-40" y="64.4" width="176" height="2" fill={S.gress.flate} />
    {/* Huset: kjelleren, ytterveggene i snitt, taket og pipa. */}
    <rect x="6" y="66" width="84" height="26" fill={S.stein.skygge} />
    <rect x="6" y="40" width="84" height="26" fill={S.puss.skygge} />
    <Vinkjeller n={vk} />
    <Kjokken n={kj} />
    <Stue n={st} />
    <rect x="47" y="40" width="2" height="24" fill={S.puss.skygge} />
    <rect x="47" y="40" width="2" height="1.2" fill={S.puss.flate} />
    <rect x="6" y="64" width="84" height="4" fill={S.stein.lys} />
    <rect x="6" y="64" width="84" height="0.8" fill={S.hvit.lys} opacity="0.6" />
    <rect x="3" y="38" width="90" height="3" fill={S.hvit.flate} />
    <rect x="3" y="40.2" width="90" height="0.8" fill={S.hvit.skygge} opacity="0.7" />
    <polygon points="6,38 48,15 90,38" fill={S.puss.flate} />
    <polygon points="3,38.6 48,13.4 93,38.6 91,38.6 48,15.8 5,38.6" fill={S.skifer.flate} />
    <rect x="73" y="18" width="6" height="12" fill={S.tegl.flate} />
    <rect x="72.4" y="17" width="7.2" height="1.6" fill={S.stein.skygge} />
    <circle className="anim-roeyk" cx="76.4" cy="13" r="1.6" fill={S.hvit.flate} opacity="0.6" />
    <circle className="anim-roeyk sen" cx="77.6" cy="9.4" r="2.1" fill={S.hvit.flate} opacity="0.38" />
    <circle cx="48" cy="28" r="3" fill={S.hvit.lys} />
    <circle cx="48" cy="28" r="2.2" fill={S.glass.skygge} className="nattvindu" />
    {[-1, 1].map((d) => (
      <rect key={d} x={r2(48 + d * 13 - 1.8)} y="31" width="3.6" height="5.6" rx="1.8" fill={S.glass.skygge} className="nattvindu" />
    ))}
    {/* Trappa og døra står til siden, utenfor snittet. */}
    <rect x="-3" y="62" width="9" height="2" fill={S.stein.lys} />
    <rect x="-1" y="60" width="7" height="2" fill={S.stein.flate} />
  </Lerret>
)

// ─────────────────────────────────────────────── Hytta på Geilo

/** En gran med snø på grenene, `h` høy, foten på (x, y). */
function Snogran({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g>
      <rect x={r2(x - 0.6)} y={r2(y - 2.4)} width="1.2" height="2.4" fill={S.treMork.flate} />
      {[0, 1, 2].map((i) => {
        const ty = r2(y - 2 - h + i * h * 0.27)
        const by = r2(ty + h * 0.42)
        const hw = r2(h * (0.17 + i * 0.07))
        const my = r2(ty + (by - ty) * 0.55)
        return (
          <g key={i}>
            <polygon points={pkt([x, ty], [x + hw, by], [x - hw, by])} fill={S.gran.flate} />
            <polygon points={pkt([x, ty], [x + hw, by], [x, by])} fill={S.gran.skygge} />
            <polygon points={pkt([x, ty], [x + hw * 0.55, my], [x - hw * 0.55, my])} fill={S.sno.flate} />
            <polygon points={pkt([x - hw * 0.6, my], [x + hw * 0.6, my], [x + hw * 0.7, by - 0.8], [x - hw * 0.7, by - 0.8])} fill={S.sno.flate} opacity="0.25" />
          </g>
        )
      })}
    </g>
  )
}

/** Peisestua (x 2–38, gulv y 82): fra bare tømmer til en stue med utsikt over vidda. */
function Peisestue({ n }: { n: number }) {
  return (
    <g>
      {/* Tømmerveggen bak, og gulvplankene. */}
      <rect x="4" y="56" width="34" height="26" fill={S.treverk.flate} className={n > 0 ? 'nattvindu' : undefined} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="4" y={r2(58.4 + i * 2.8)} width="34" height="0.5" fill={S.treverk.skygge} opacity="0.7" />
      ))}
      <rect x="4" y="77.6" width="34" height="4.4" fill={S.treMork.flate} />
      {n === 0 && (
        <g>
          {/* Bare tømmer: hull der vinduet skal komme, en sagbukk med planker, en pære på ledning. */}
          <rect x="22" y="62" width="12" height="9" fill={S.sno.skygge} />
          <rect x="22" y="62" width="12" height="9" fill="none" stroke={S.treverk.skygge} strokeWidth="0.8" />
          <line x1="20" y1="56" x2="20" y2="62" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx="20" cy="63" r="1.3" fill={S.vinduLys.lys} className="nattvindu" />
          <path d="M8 81 L11 72 L14 81 M16 81 L19 72 L22 81" fill="none" stroke={S.treverk.skygge} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="6" y="70.6" width="18" height="1.6" fill={S.treverk.lys} />
          <rect x="7" y="69" width="14" height="1.6" fill={S.treverk.flate} />
          <rect x="28" y="76" width="7" height="5.4" fill={S.treverk.skygge} />
          <rect x="28" y="76" width="7" height="1" fill={S.treverk.lys} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Peis i naturstein: pipe av stein, ildsted, bjelke og en skinnfell på gulvet. */}
          <polygon points="6,82 6,66 10,60 18,60 22,66 22,82" fill={S.stein.flate} />
          {[[8, 64], [12, 62], [16, 64], [9, 69], [14, 68], [19, 69], [8, 74], [13, 73], [18, 74], [11, 79], [16, 78]].map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.2" ry="1.5" fill={S.stein.lys} stroke={S.stein.skygge} strokeWidth="0.3" />
          ))}
          <rect x="9.4" y="70" width="9.2" height="11.6" fill={S.mork.flate} />
          <rect x="4.6" y="68.4" width="19" height="1.6" fill={S.treMork.flate} />
          <path className="anim-flamme" d="M14 81 q-4 -3 -2 -8 q2 3 3 -2 q3 4 1 10 Z" fill={S.oker.lys} />
          <path className="anim-flamme" d="M14 81 q-2 -2 -1 -5 q1.5 2 2 -1 q1.6 3 0 6 Z" fill={S.vinduLys.lys} />
          <ellipse cx="14" cy="82.4" rx="5" ry="0.8" fill={S.vinduLys.flate} opacity="0.4" className="nattvindu" />
          <ellipse cx="28" cy="80.4" rx="8" ry="1.4" fill={S.hvit.skygge} />
          <ellipse cx="27" cy="80" rx="6.6" ry="1" fill={S.hvit.flate} />
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Panoramavindu mot fjellene, og to lenestoler i skinn. */}
          <rect x="21" y="58" width="15" height="14" fill={S.treMork.flate} />
          <rect x="22" y="59" width="13" height="12" fill={S.glass.lys} />
          <polygon points="22,71 25,64 28,67 31,61 35,67 35,71" fill={S.fjell.flate} />
          <polygon points="31,61 32.4,63.4 29.8,63.4" fill={S.sno.lys} />
          <polygon points="22.8,59 29,59 24.6,71 22.8,71" fill={S.hvit.lys} opacity="0.3" />
          <rect x="28.2" y="59" width="0.6" height="12" fill={S.treMork.flate} />
          {[25, 33].map((x) => (
            <g key={x}>
              <rect x={r2(x - 3.4)} y="71" width="6.8" height="9.4" rx="1.6" fill={S.tegl.skygge} />
              <rect x={r2(x - 3.4)} y="76.6" width="6.8" height="3.8" rx="1" fill={S.tegl.flate} />
              <rect x={r2(x - 3.8)} y="74" width="1.4" height="6.4" rx="0.7" fill={S.tegl.lys} />
              <rect x={r2(x + 2.4)} y="74" width="1.4" height="6.4" rx="0.7" fill={S.tegl.lys} />
            </g>
          ))}
          <path d="M7 58 L11 55 M11 58 L15 55 M15 58 L19 55" stroke={S.treverk.lys} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Utsikt over vidda: vinduet går til taket, bjelkene vises, og en lysekrone av gevir. */}
          <rect x="21" y="52" width="15" height="6" fill={S.glass.lys} />
          <polygon points="21,57.5 26,53.4 30,56 36,52.6 36,57.5" fill={S.fjell.lys} />
          <polygon points="22,52.4 28,52.4 23.4,57.5 22,57.5" fill={S.hvit.lys} opacity="0.3" />
          {[3, 12, 21, 30, 38].map((x) => (
            <rect key={x} x={x} y="51" width="2.6" height="5.4" fill={S.treMork.flate} />
          ))}
          <rect x="2" y="50.4" width="38" height="2.4" fill={S.treMork.flate} />
          <line x1="30" y1="52.8" x2="30" y2="58.6" stroke={S.treMork.skygge} strokeWidth="0.4" />
          <path d="M26.6 61 Q26.6 59 28.6 58.6 M33.4 61 Q33.4 59 31.4 58.6 M27.4 59.4 L26 56.8 M32.6 59.4 L34 56.8 M28.2 60.4 L27.4 62" fill="none" stroke={S.treverk.lys} strokeWidth="0.9" strokeLinecap="round" />
          <rect x="28" y="58.2" width="4" height="1.4" fill={S.treverk.flate} />
          {[27.4, 30, 32.6].map((x) => (
            <circle key={x} cx={x} cy="61.2" r="0.7" fill={S.vinduLys.lys} />
          ))}
          <circle cx="30" cy="61" r="5" fill={S.vinduLys.lys} opacity="0.12" />
          <Figur x={5.6} y={81} avstand="gate" klaer={S.vin} har={S.oker.skygge} />
          <rect x="3" y="73" width="3" height="3" rx="0.4" fill={S.hvit.lys} />
        </g>
      )}
    </g>
  )
}

/** Badstua (x 38–58, gulv y 82), med kaldkulpen og spaet utenfor. */
function Badstue({ n }: { n: number }) {
  return (
    <g>
      <rect x="40" y="62" width="16" height="20" fill={n >= 3 ? S.stein.lys : S.treverk.lys} className={n > 0 ? 'nattvindu' : undefined} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={r2(40 + i * 2.7)} y="62" width="0.4" height="20" fill={S.treverk.flate} opacity={n >= 3 ? 0.2 : 0.7} />
      ))}
      <rect x="40" y="78.6" width="16" height="3.4" fill={n >= 3 ? S.stein.skygge : S.treverk.skygge} />
      {n === 0 && (
        <g>
          <rect x="43" y="66" width="6" height="5" fill={S.sno.skygge} />
          <rect x="43" y="66" width="6" height="5" fill="none" stroke={S.treverk.skygge} strokeWidth="0.7" />
          <rect x="50" y="76" width="4.6" height="2.6" fill={S.treverk.skygge} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Vedfyrt: to benkerader, en ovn med stein og en bøtte med øse; dampen stiger. */}
          <rect x="46" y="72.6" width="10" height="1.4" fill={S.treverk.flate} />
          <rect x="46" y="73.6" width="10" height="5" fill={S.treverk.skygge} />
          <rect x="50" y="68" width="6" height="1.4" fill={S.treverk.flate} />
          <rect x="50" y="69" width="6" height="4" fill={S.treverk.skygge} />
          <rect x="41" y="73" width="4.6" height="7" fill={S.mork.flate} />
          <rect x="41.4" y="70.6" width="3.8" height="2.4" fill={S.stein.skygge} />
          <circle cx="42.6" cy="70.2" r="1" fill={S.stein.flate} />
          <circle cx="44.2" cy="70.4" r="0.9" fill={S.stein.lys} />
          <rect x="42.2" y="75.6" width="1.8" height="1.6" fill={S.oker.lys} className="nattvindu" />
          <rect x="52.6" y="71" width="2.2" height="1.6" fill={S.treverk.lys} />
          <path className="anim-damp" d="M43 69 Q42 67 43 65 M45 69 Q44 67 45 65" fill="none" stroke={S.hvit.lys} strokeWidth="0.5" strokeLinecap="round" />
          <rect x="42.6" y="60" width="1.6" height="10" fill={S.metall.skygge} />
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Kaldkulp: et trekar med kaldt vann utenfor, og et badekåpe på knaggen. */}
          <rect x="59.4" y="75" width="10" height="7.6" rx="1.4" fill={S.treverk.flate} />
          <rect x="59.4" y="75" width="10" height="1.2" rx="0.6" fill={S.treverk.lys} />
          <ellipse cx="64.4" cy="76.4" rx="4" ry="1" fill={S.sjo.lys} />
          <path d="M71 74 L71 68 M73 74 L73 68 M71 71 L73 71 M71 73.4 L73 73.4" stroke={S.metall.skygge} strokeWidth="0.4" fill="none" />
          <rect x="47.6" y="64" width="3.4" height="6" rx="0.8" fill={S.hvit.flate} />
          <line x1="49.3" y1="63.6" x2="49.3" y2="64.4" stroke={S.metall.skygge} strokeWidth="0.5" />
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Spa i fjellet: to solsenger med håndklær, lys langs veggen, og kulpen er blitt et basseng i stein. */}
          {[43.6, 51.6].map((x) => (
            <g key={x}>
              <path d={`M${x} 80.6 L${r2(x + 6)} 79 L${r2(x + 6.6)} 80.4 L${r2(x + 0.6)} 82 Z`} fill={S.hvit.lys} />
              <rect x={r2(x - 0.4)} y="77.4" width="2.4" height="3.2" rx="0.8" fill={S.hvit.flate} />
            </g>
          ))}
          {[44, 47.6, 51.2, 54.8].map((x) => (
            <g key={x}>
              <rect x={r2(x - 0.4)} y="65.4" width="0.8" height="1.8" fill={S.hvit.lys} />
              <circle cx={x} cy="65" r="0.6" fill={S.vinduLys.lys} />
            </g>
          ))}
          <ellipse cx="64.4" cy="82" rx="8.6" ry="2.2" fill={S.stein.flate} />
          <ellipse cx="64.4" cy="81.4" rx="7.2" ry="1.6" fill={S.petrol.lys} />
          <path className="anim-damp" d="M62 79.6 Q61 77.6 62 75.4 M66 79.6 Q65 77.6 66 75.4" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

/** Boblebadet (x 72–100, på terrassen): fra et bart dekke til et oppvarmet basseng. */
function Boblebad({ n }: { n: number }) {
  return (
    <g>
      <polygon points="70,82 102,82 106,86.4 66,86.4" fill={S.treverk.flate} />
      <rect x="66" y="86.4" width="40" height="1.2" fill={S.treverk.skygge} />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={r2(72 + i * 4)} y1="82" x2={r2(70.4 + i * 4.8)} y2="86.4" stroke={S.treverk.skygge} strokeWidth="0.3" />
      ))}
      {n === 0 && (
        <g>
          <rect x="72" y="80.6" width="26" height="1.2" fill={S.sno.flate} />
          <path d="M90 82 L92 72 M92 72 L94.4 72" stroke={S.treverk.skygge} strokeWidth="0.7" fill="none" strokeLinecap="round" />
          <polygon points="93.4,73 97,73 96,74.6 94,74.6" fill={S.metall.flate} />
        </g>
      )}
      {n === 1 && (
        <g>
          {/* Stamp: en tønne av tre med vedfyring bak, trapp og damp. */}
          <ellipse cx="84" cy="83.6" rx="7.6" ry="1.6" fill="#000000" opacity="0.22" />
          <rect x="77" y="73.4" width="14" height="10" rx="1" fill={S.treverk.flate} />
          {[79.8, 82.6, 85.4, 88.2].map((x) => (
            <line key={x} x1={x} y1="73.4" x2={x} y2="83.4" stroke={S.treverk.skygge} strokeWidth="0.35" />
          ))}
          <rect x="77" y="77" width="14" height="0.9" fill={S.metall.skygge} />
          <rect x="77" y="80.4" width="14" height="0.9" fill={S.metall.skygge} />
          <ellipse cx="84" cy="73.4" rx="7" ry="1.5" fill={S.sjo.lys} />
          <path className="anim-damp" d="M81 71.6 Q80 69.4 81 67 M85 71.6 Q84 69.4 85 67 M88 71.6 Q87 69.4 88 67" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
          <rect x="93" y="79.6" width="4" height="1.2" fill={S.treverk.lys} />
          <rect x="93.6" y="81.2" width="4" height="1.2" fill={S.treverk.flate} />
        </g>
      )}
      {n === 2 && (
        <g>
          {/* Boblebad i snøen: et felt nedfelt i dekket, snøfonner rundt, lykter og damp. */}
          <polygon points="72,78 98,78 102,83.6 68,83.6" fill={S.treMork.flate} />
          <polygon points="74,79 96,79 99.4,83 71,83" fill={S.petrol.lys} />
          <polygon points="74,79 85,79 82,83 71,83" fill={S.hvit.lys} opacity="0.25" />
          {[[78, 80.6], [84, 81.8], [90, 80.4], [94, 81.6], [80, 82.2]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" fill={S.hvit.lys} opacity="0.8" />
          ))}
          <ellipse cx="70" cy="79" rx="5.4" ry="1.6" fill={S.sno.flate} />
          <ellipse cx="101" cy="79.4" rx="5" ry="1.4" fill={S.sno.flate} />
          {[72, 100].map((x) => (
            <g key={x}>
              <rect x={r2(x - 0.4)} y="73" width="0.8" height="5.6" fill={S.mork.flate} />
              <rect x={r2(x - 1.4)} y="71.2" width="2.8" height="2.4" fill={S.vinduLys.lys} />
            </g>
          ))}
          <path className="anim-damp" d="M80 77 Q79 74.4 80 72 M86 77 Q85 74.4 86 72 M92 77 Q91 74.4 92 72" fill="none" stroke={S.hvit.lys} strokeWidth="0.7" strokeLinecap="round" />
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Utendørs varmebasseng: stort, med vindskjerm i glass, solseng og en som sitter i vannet. */}
          <polygon points="70,77 104,77 108,83.6 66,83.6" fill={S.stein.flate} />
          <polygon points="72.4,78.2 101.6,78.2 104.6,82.8 69.4,82.8" fill={S.petrol.lys} />
          <polygon points="72.4,78.2 88,78.2 84,82.8 69.4,82.8" fill={S.hvit.lys} opacity="0.22" />
          <rect x="70" y="66" width="0.8" height="11" fill={S.metall.skygge} />
          <rect x="103.4" y="66" width="0.8" height="11" fill={S.metall.skygge} />
          <rect x="70" y="66" width="34" height="11" fill={S.glass.lys} opacity="0.22" />
          <rect x="71" y="67" width="9" height="9" fill={S.hvit.lys} opacity="0.2" className="nattskjul" />
          <ellipse cx="86" cy="78.4" rx="1.8" ry="1.8" fill={S.hud.flate} />
          <rect x="84.2" y="79" width="3.6" height="1.6" rx="0.8" fill={S.hud.flate} />
          <path d="M84 77.6 Q86 75.2 88 77.6" fill={S.treMork.skygge} />
          <rect x="88" y="76.4" width="1.2" height="1.4" fill={S.hvit.lys} />
          <path className="anim-damp" d="M76 77 Q75 73.4 76 70 M82 77 Q81 73.4 82 70 M94 77 Q93 73.4 94 70 M99 77 Q98 73.4 99 70" fill="none" stroke={S.hvit.lys} strokeWidth="0.8" strokeLinecap="round" />
          {[66.4, 106.4].map((x) => (
            <g key={x}>
              <rect x={r2(x - 0.4)} y="76.6" width="0.8" height="5.4" fill={S.mork.flate} />
              <rect x={r2(x - 1.4)} y="74.8" width="2.8" height="2.4" fill={S.vinduLys.lys} />
            </g>
          ))}
          <path d="M96 85.4 L106 85.4 L108 87.4 L98 87.4 Z" fill={S.hvit.lys} />
        </g>
      )}
    </g>
  )
}

/** Hytta: snittet gjennom en tømmerhytte på Geilo — peisestue, badstue og boblebad på terrassen. */
const Hytta: Hjemtegning = ({ størrelse, rom: [ps, bs, bb] }) => (
  <Lerret størrelse={størrelse}>
    {/* Fjellene bak, og skogen i snø. */}
    <Dis>
      <polygon points={pkt([-40, 62], [-26, 36], [-12, 52], [6, 28], [26, 56], [46, 34], [66, 56], [88, 30], [110, 54], [124, 38], [136, 50], [136, 66], [-40, 66])} fill={S.fjell.flate} />
      {[[-26, 36], [6, 28], [46, 34], [88, 30], [124, 38]].map(([x, y]) => (
        <polygon key={x} points={pkt([x, y], [x + 5, y + 8], [x + 1, y + 6], [x - 2, y + 9], [x - 5, y + 7])} fill={S.sno.lys} />
      ))}
    </Dis>
    <rect x="-40" y="62" width="176" height="20" fill={S.sno.skygge} opacity="0.5" />
    {[-34, -24, -12, 112, 122, 132].map((x, i) => (
      <Snogran key={x} x={x} y={74 + (i % 3) * 2} h={26 + (i % 2) * 6} />
    ))}
    <rect x="-40" y="76" width="176" height="20" fill={S.sno.flate} />
    <rect x="-40" y="76" width="176" height="3" fill={S.sno.lys} />
    <ellipse cx="-20" cy="86" rx="16" ry="2.4" fill={S.sno.lys} />
    <ellipse cx="124" cy="88" rx="18" ry="2.6" fill={S.sno.lys} />
    {/* Vedskjulet til venstre: en stabel med ved, og øksa i kappen. */}
    <rect x="-34" y="70" width="26" height="12" fill={S.treMork.flate} />
    <polygon points={pkt([-36, 70], [-21, 62], [-6, 70])} fill={S.treMork.skygge} />
    {Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => <circle key={`${r}-${c}`} cx={r2(-31 + c * 4 + (r % 2) * 2)} cy={r2(73.4 + r * 3.2)} r="1.5" fill={S.treverk.lys} stroke={S.treverk.skygge} strokeWidth="0.3" />),
    )}
    {/* Hytta: tak med snø, tømmerhjørner, snittet og annekset. */}
    <rect x="2" y="56" width="38" height="26" fill={S.treverk.skygge} />
    <Peisestue n={ps} />
    <rect x="38" y="62" width="20" height="20" fill={S.treverk.skygge} />
    <Badstue n={bs} />
    {[2, 38, 56].map((x) => (
      <g key={x}>
        <rect x={x} y={x === 2 ? 56 : 62} width="3" height={x === 2 ? 26 : 20} fill={S.treverk.lys} />
        {Array.from({ length: x === 2 ? 9 : 7 }, (_, i) => (
          <circle key={i} cx={x + 1.5} cy={r2((x === 2 ? 57.4 : 63.4) + i * 2.8)} r="1.3" fill={S.treverk.flate} stroke={S.treverk.skygge} strokeWidth="0.3" />
        ))}
      </g>
    ))}
    <polygon points="0,57 21,32 42,57 40,57 21,35 2,57" fill={S.treMork.flate} />
    <polygon points="3,56 21,34.6 39,56" fill={S.treverk.lys} />
    <polygon points="0,57.4 21,31.6 42,57.4 39.4,57.4 21,36.4 2.6,57.4" fill={S.sno.flate} />
    <polygon points="36,64 58,64 62,69 58,69" fill={S.treMork.flate} />
    <polygon points="36,63.4 58,63.4 63,68.4 36,68.4" fill={S.treMork.skygge} />
    <polygon points="35,63 58,63 62,67.4 35,67.4" fill={S.sno.flate} />
    {ps >= 1 && (
      <g>
        <rect x="10" y="36" width="5" height="14" fill={S.stein.flate} />
        <rect x="9.4" y="34.6" width="6.2" height="1.8" fill={S.stein.skygge} />
        <circle className="anim-roeyk" cx="12.6" cy="30" r="1.8" fill={S.hvit.flate} opacity="0.6" />
        <circle className="anim-roeyk sen" cx="14" cy="26" r="2.3" fill={S.hvit.flate} opacity="0.38" />
      </g>
    )}
    <Boblebad n={bb} />
    {/* Skiene mot veggen til høyre. */}
    {[0, 1].map((i) => (
      <g key={i}>
        <line x1={r2(112 + i * 2.4)} y1="64" x2={r2(113 + i * 2.4)} y2="82" stroke={S.mork.flate} strokeWidth="0.7" strokeLinecap="round" />
        <line x1={r2(113.4 + i * 2.4)} y1="66" x2={r2(114.4 + i * 2.4)} y2="82" stroke={S.vin.flate} strokeWidth="0.6" strokeLinecap="round" />
      </g>
    ))}
  </Lerret>
)

// ─────────────────────────────────────────────── Feriehuset i Marbella

/** En palme: bøyd stamme og syv blad som henger ut fra toppen, foten på (x, y). */
function Palme({ x, y, h }: { x: number; y: number; h: number }) {
  const tx = r2(x + h * 0.08)
  const ty = r2(y - h)
  const blad: [number, number][] = [[-9, 3], [-7, -2.4], [-3, -4.6], [2, -4.4], [6.4, -2], [9, 3.4], [0, -2]]
  return (
    <g>
      <path d={`M${x} ${y} Q${r2(x + h * 0.14)} ${r2(y - h * 0.5)} ${tx} ${ty}`} fill="none" stroke={S.treverk.flate} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${x} ${y} Q${r2(x + h * 0.14)} ${r2(y - h * 0.5)} ${tx} ${ty}`} fill="none" stroke={S.treverk.skygge} strokeWidth="0.4" strokeDasharray="1 1.6" />
      {blad.map(([dx, dy], i) => (
        <path key={i} d={`M${tx} ${ty} Q${r2(tx + dx * 0.55)} ${r2(ty + dy - 3.2)} ${r2(tx + dx)} ${r2(ty + dy + 3)}`} fill="none" stroke={i % 2 ? S.lov.lys : S.lov.flate} strokeWidth="1.5" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** Et sitrustre i krukke: stamme, tett krone og frukt. */
function Sitrus({ x, y, farge = S.oker.lys }: { x: number; y: number; farge?: string }) {
  return (
    <g>
      <polygon points={pkt([x - 2, y - 4], [x + 2, y - 4], [x + 1.4, y], [x - 1.4, y])} fill={S.tegl.flate} />
      <rect x={r2(x - 0.3)} y={r2(y - 8)} width="0.6" height="4" fill={S.treverk.skygge} />
      <circle cx={r2(x - 1.4)} cy={r2(y - 9.4)} r="2.6" fill={S.lov.flate} />
      <circle cx={r2(x + 1.6)} cy={r2(y - 9)} r="2.4" fill={S.lov.skygge} />
      <circle cx={x} cy={r2(y - 11.2)} r="2.4" fill={S.lov.lys} />
      {[[-2, -9.6], [1.8, -10.4], [0.2, -8.4], [-0.6, -12]].map(([dx, dy]) => (
        <circle key={`${dx}-${dy}`} cx={r2(x + dx)} cy={r2(y + dy)} r="0.65" fill={farge} />
      ))}
    </g>
  )
}

/** Terrassen på taket (x 8–50, takflata y 38): fra et bart tak til en hage med sitrustrær. */
function Takterrasse({ n }: { n: number }) {
  return (
    <g>
      {/* Rekkverk rundt takflata. */}
      <rect x="8" y="34.4" width="42" height="1.2" fill={S.hvit.lys} />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={r2(8.6 + i * 4.1)} y="35.6" width="0.7" height="2.8" fill={S.hvit.flate} />
      ))}
      {n === 0 && (
        <g>
          <rect x="30" y="31" width="9" height="3.4" fill={S.treverk.lys} />
          <rect x="30" y="33.2" width="9" height="1.2" fill={S.treverk.flate} />
          <path d="M12 38 L13 33 L18 33 L19 38 Z" fill={S.stein.lys} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Pergola med solsenger og ei pute. */}
          {[12, 25, 38, 48].map((x) => (
            <rect key={x} x={x} y="22" width="1" height="13" fill={S.treMork.flate} />
          ))}
          <rect x="10" y="21" width="42" height="1.6" fill={S.treMork.skygge} />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={r2(11 + i * 3.1)} y="19.8" width="0.9" height="2.2" fill={S.treMork.flate} />
          ))}
          <path d="M14 22.4 Q30 25 46 22.4" fill="none" stroke={S.lov.flate} strokeWidth="1.2" />
          {[16, 24].map((x) => (
            <g key={x}>
              <path d={`M${x} 35 L${r2(x + 6)} 33 L${r2(x + 6.6)} 34.2 L${r2(x + 0.6)} 36 Z`} fill={S.hvit.lys} />
              <rect x={r2(x - 0.3)} y="32.2" width="2.2" height="3" rx="0.8" fill={S.oker.lys} />
            </g>
          ))}
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Utekjøkken: grillbenk med avtrekk, disk med krakker og lyslenke. */}
          <rect x="32" y="28" width="16" height="7" fill={S.stein.flate} />
          <rect x="31" y="27" width="18" height="1.6" fill={S.stein.lys} />
          <rect x="34" y="29.6" width="6" height="4" fill={S.mork.flate} />
          <rect x="34" y="29.6" width="6" height="1" fill={S.metall.skygge} />
          <path className="anim-roeyk" d="M37 27 Q36 24 37 21.6" fill="none" stroke={S.hvit.lys} strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
          {[42, 46].map((x) => (
            <g key={x}>
              <rect x={x} y="31" width="2" height="4" fill={S.treverk.flate} />
              <ellipse cx={r2(x + 1)} cy="30.6" rx="1.6" ry="0.6" fill={S.treverk.lys} />
            </g>
          ))}
          <path d="M12 24 Q20 27 28 24" fill="none" stroke={S.mork.flate} strokeWidth="0.3" />
          {[14, 18.4, 22.8, 26.4].map((x, i) => (
            <circle key={x} cx={x} cy={r2(25 + (i === 1 || i === 2 ? 1 : 0.4))} r="0.7" fill={S.vinduLys.lys} />
          ))}
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Hageanlegg: sitrustrær i store krukker rundt terrassen, og en liten fontene. */}
          <Sitrus x={11} y={37.6} />
          <Sitrus x={29.6} y={37.6} farge={S.tegl.lys} />
          <Sitrus x={46.6} y={37.6} />
          <ellipse cx="40" cy="37.4" rx="4" ry="1" fill={S.stein.lys} />
          <ellipse cx="40" cy="37" rx="3" ry="0.7" fill={S.sjo.lys} />
          <path d="M40 37 L40 33.4" stroke={S.hvit.lys} strokeWidth="0.5" />
          <path className="anim-damp" d="M40 33.4 Q38 32.6 37.4 35 M40 33.4 Q42 32.6 42.6 35" fill="none" stroke={S.glass.lys} strokeWidth="0.4" />
        </g>
      )}
    </g>
  )
}

/** Bassenget (x 36–104, y 78–94): fra en tom grop til et basseng med strandbar. */
function Basseng({ n }: { n: number }) {
  return (
    <g>
      {n === 0 && (
        <g>
          <polygon points="46,80 94,80 100,92 40,92" fill={S.stein.skygge} />
          <polygon points="48,81 92,81 96.6,90.6 43.4,90.6" fill={S.stein.flate} />
          <rect x="82" y="70" width="1" height="12" fill={S.metall.flate} />
          <path d="M82 72 L90 72 M82 77 L90 77" stroke={S.metall.skygge} strokeWidth="0.5" />
          <rect x="52" y="86" width="9" height="3" fill={S.treverk.flate} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Basseng i hagen: hvit kant, lyst vann, to solsenger. */}
          <polygon points={n >= 2 ? '40,79 104,79 110,92 34,92' : '48,80 88,80 93,91 43,91'} fill={S.hvit.lys} />
          <polygon points={n >= 2 ? '42.4,80.6 101.6,80.6 106.6,90.6 37.4,90.6' : '50,81.4 86,81.4 90.4,89.8 45.4,89.8'} fill={S.sjo.lys} />
          <polygon points={n >= 2 ? '42.4,80.6 74,80.6 66,90.6 37.4,90.6' : '50,81.4 68,81.4 64,89.8 45.4,89.8'} fill={S.hvit.lys} opacity="0.22" />
          {[[58, 84.4], [72, 86.4], [84, 84], [48, 88]].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y} q1.4 -0.8 2.8 0 q1.4 0.8 2.8 0`} fill="none" stroke={S.hvit.lys} strokeWidth="0.35" opacity="0.8" />
          ))}
          {[[94, 87], [98, 90.4]].map(([x, y], i) => (
            <g key={`${x}-${y}`}>
              <path d={`M${x} ${y} L${r2(x + 7)} ${r2(y - 2)} L${r2(x + 7.6)} ${r2(y - 0.6)} L${r2(x + 0.6)} ${r2(y + 1.4)} Z`} fill={S.hvit.lys} />
              <rect x={r2(x - 0.4)} y={r2(y - 3)} width="2.4" height="3.2" rx="0.8" fill={i ? S.oker.lys : S.hvit.flate} />
            </g>
          ))}
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Uendelighetsbasseng: kanten mot havet er glass, og vannet går over i horisonten. */}
          <rect x="40" y="76.6" width="70" height="2.6" fill={S.glass.lys} opacity="0.55" />
          <rect x="40" y="78.4" width="70" height="0.8" fill={S.hvit.lys} opacity="0.7" />
          <rect x="42" y="79.2" width="64" height="1.4" fill={S.sjo.lys} opacity="0.5" />
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Strandbar: palapa med stråtak, krakker i vannet, parasoll og et par gjester. */}
          <rect x="92" y="70" width="1" height="14" fill={S.treMork.flate} />
          <rect x="104" y="70" width="1" height="14" fill={S.treMork.flate} />
          <polygon points="88,70 98.4,60 109,70" fill={S.oker.skygge} />
          <polygon points="90,70 98.4,62.4 107,70" fill={S.oker.flate} />
          {[92, 96, 100, 104].map((x) => (
            <line key={x} x1={x} y1="70" x2={r2(98.4 + (x - 98.4) * 0.4)} y2="63" stroke={S.oker.lys} strokeWidth="0.4" />
          ))}
          <rect x="93" y="79" width="11" height="4.6" fill={S.treverk.flate} />
          <rect x="92.4" y="78" width="12.2" height="1.4" fill={S.treverk.lys} />
          {[94.4, 98.4, 102.4].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="86" rx="1.4" ry="0.6" fill={S.treverk.lys} />
              <rect x={r2(x - 0.25)} y="86" width="0.5" height="3.4" fill={S.mork.flate} />
            </g>
          ))}
          <rect x="94" y="73" width="1.6" height="2.6" fill={S.vin.lys} />
          <rect x="97" y="73.4" width="1.4" height="2.2" fill={S.hvit.lys} />
          <rect x="100" y="73" width="1.6" height="2.6" fill={S.gran.lys} />
          <Figur x={97} y={86} avstand="gate" klaer={S.oker} />
          <Figur x={103} y={85} avstand="gate" klaer={S.hvit} vendt={-1} />
          <line x1="60" y1="86" x2="60" y2="78" stroke={S.treverk.skygge} strokeWidth="0.5" />
          <path d="M54 78.4 Q60 74 66 78.4 Z" fill={S.vin.flate} />
          <path d="M60 74.6 Q63.4 75.4 66 78.4 L60 78.4 Z" fill={S.vin.skygge} />
        </g>
      )}
    </g>
  )
}

/** Gjestefløyen (x 62–112, bak bassenget): fra råbygg til gjestehus for statsbesøk. */
function Gjestefloy({ n }: { n: number }) {
  const g = 76
  return (
    <g>
      {n === 0 && (
        <g>
          <Kloss x={66} y={g} b={26} h={18} d={8} m={S.stein} />
          <rect x="68" y={g - 10} width="5" height="7" fill={S.mork.flate} />
          <rect x="78" y={g - 10} width="5" height="7" fill={S.mork.flate} />
          <path d="M64 76 L64 54 M90 76 L90 54 M64 62 L92 62 M64 70 L92 70" fill="none" stroke={S.treverk.lys} strokeWidth="0.7" />
          <rect x="66" y="58" width="26" height="1.4" fill={S.treverk.flate} />
        </g>
      )}
      {n >= 1 && (
        <g>
          {/* Gjestesuiten: en lav hvit bygning med store vinduer, tak med terrakotta og egen liten terrasse. */}
          <Kloss x={66} y={g} b={n >= 2 ? 40 : 26} h={n >= 2 ? 30 : 18} d={8} m={S.hvit} />
          <rect x="64.6" y={n >= 2 ? g - 31.4 : g - 19.4} width={n >= 2 ? 42.8 : 28.8} height="2" fill={S.tegl.flate} />
          <rect x="70" y={g - 12} width="8" height="12" fill={S.glass.skygge} className="nattvindu" />
          <rect x="70" y={g - 12} width="3" height="12" fill={S.glass.flate} opacity="0.5" className="nattskjul" />
          <rect x="82" y={g - 10} width="6" height="8" fill={S.glass.skygge} className="nattvindu" />
          <rect x="68.6" y={g - 1.2} width="22" height="1.2" fill={S.hvit.skygge} />
        </g>
      )}
      {n >= 2 && (
        <g>
          {/* Fløy med personale: en etasje til, en betjent ved døra og en bagasjetralle. */}
          {[70, 82, 94].map((x) => (
            <g key={x}>
              <rect x={x} y={g - 26} width="7" height="9" fill={S.glass.skygge} className="nattvindu" />
              <rect x={x} y={g - 26} width="2.6" height="9" fill={S.glass.flate} opacity="0.5" className="nattskjul" />
              <rect x={r2(x - 0.8)} y={g - 17} width="8.6" height="1" fill={S.hvit.skygge} />
            </g>
          ))}
          <rect x="96" y={g - 12} width="7" height="12" fill={S.glass.skygge} className="nattvindu" />
          <Figur x={93.4} y={g + 2} avstand="gate" klaer={S.marine} har={S.mork.flate} vendt={-1} />
          <rect x="101" y={g - 3.4} width="4" height="2.6" fill={S.treverk.flate} />
          <rect x="100.4" y={g - 4.6} width="5.2" height="1.4" fill={S.metall.skygge} />
          <circle cx="102" cy={g - 0.4} r="0.7" fill={S.mork.flate} />
          <circle cx="104.4" cy={g - 0.4} r="0.7" fill={S.mork.flate} />
        </g>
      )}
      {n >= 3 && (
        <g>
          {/* Gjestehus for statsbesøk: søyler, flaggstenger, rød løper, to vakter og en limousin. */}
          <rect x="62" y={g - 33} width="52" height="2.6" fill={S.hvit.lys} />
          <polygon points={pkt([62, g - 33], [88, g - 44], [114, g - 33])} fill={S.hvit.flate} />
          <polygon points={pkt([64, g - 33.4], [88, g - 42.4], [112, g - 33.4])} fill={S.hvit.lys} />
          <circle cx="88" cy={g - 38.2} r="2.2" fill={S.gull.flate} />
          {[66, 74, 102, 110].map((x) => (
            <g key={x}>
              <rect x={x} y={g - 31} width="2.6" height="31" fill={S.hvit.lys} />
              <rect x={r2(x + 1.8)} y={g - 31} width="0.8" height="31" fill={S.hvit.skygge} />
            </g>
          ))}
          <rect x="82" y={g - 14} width="12" height="14" fill={S.treMork.flate} />
          <rect x="84" y={g - 12} width="3.6" height="12" fill={S.gull.flate} />
          <rect x="88.4" y={g - 12} width="3.6" height="12" fill={S.gull.flate} />
          <polygon points={pkt([84, g], [92, g], [97, g + 10], [79, g + 10])} fill={S.vin.flate} />
          <polygon points={pkt([84, g], [92, g], [93, g + 2], [83, g + 2])} fill={S.vin.skygge} />
          {[58, 112].map((x, i) => (
            <g key={x}>
              <rect x={x} y="38" width="0.7" height={g - 38 + 8} fill={S.metall.flate} />
              <polygon className="anim-flagg" points={`${x + 0.7},38.6 ${x + 8},39.6 ${x + 8},44.4 ${x + 0.7},45.4`} fill={i ? S.hvit.flate : S.vin.flate} />
              <rect className="anim-flagg" x={r2(x + 3)} y="39" width="1.6" height="5.8" fill={i ? S.vin.flate : S.hvit.lys} />
            </g>
          ))}
          <Figur x={78} y={g + 8} avstand="gate" klaer={S.mork} har={S.mork.flate} />
          <Figur x={99} y={g + 8} avstand="gate" klaer={S.mork} har={S.mork.flate} vendt={-1} />
          <g transform="translate(52 -2)">
            <ellipse cx="14" cy="97" rx="19" ry="1.6" fill="#000000" opacity="0.28" />
            <polygon points="0,92 4,86.4 14,84.8 34,84.8 38,90 38,96 0,96" fill={S.mork.flate} />
            <polygon points="6,86.6 12,81 26,81 32,86.4" fill={S.mork.lys} />
            <polygon points="8,86 12,82 18,82 18,86" fill={S.glass.skygge} />
            <polygon points="20,86 20,82 26,82 30,86" fill={S.glass.skygge} />
            {[7, 31].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="96" r="3.2" fill={S.mork.skygge} />
                <circle cx={cx} cy="96" r="1.2" fill={S.metall.flate} />
              </g>
            ))}
            <rect x="0" y="92" width="2.2" height="1.4" fill={S.vinduLys.lys} className="nattvindu" />
          </g>
        </g>
      )}
    </g>
  )
}

/** Feriehuset: den hvite villaen i Marbella med terrasse på taket, basseng og gjestefløy. */
const Feriehuset: Hjemtegning = ({ størrelse, rom: [te, ba, gj] }) => (
  <Lerret størrelse={størrelse}>
    {/* Havet i bakgrunnen med fjellene bak, og palmene langs kanten. */}
    <Dis>
      <polygon points={pkt([-40, 52], [-22, 34], [-4, 44], [16, 30], [34, 46], [52, 38], [70, 50], [-40, 54])} fill={S.fjell.flate} />
    </Dis>
    <rect x="-40" y="48" width="176" height="18" fill={S.sjo.flate} />
    <rect x="-40" y="48" width="176" height="3.4" fill={S.sjo.lys} opacity="0.6" />
    {[[-24, 56], [10, 60], [60, 54], [96, 58], [122, 54]].map(([x, y]) => (
      <path key={`${x}-${y}`} d={`M${x} ${y} q2 -1 4 0 q2 1 4 0`} fill="none" stroke={S.hvit.lys} strokeWidth="0.45" opacity="0.7" />
    ))}
    <g>
      <polygon points="124,54 133,54 128.4,41" fill={S.hvit.lys} />
      <polygon points="128.4,41 133,54 128.4,54" fill={S.hvit.skygge} />
      <rect x="127.6" y="54" width="1.6" height="1.2" fill={S.treverk.skygge} />
    </g>
    {/* Terrassen foran og muren mot havet. */}
    <rect x="-40" y="64" width="176" height="32" fill={S.puss.flate} />
    <rect x="-40" y="64" width="176" height="2.4" fill={S.hvit.lys} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-40 + i * 24} y1="96" x2={-30 + i * 24} y2="66" stroke={S.puss.skygge} strokeWidth="0.4" opacity="0.7" />
    ))}
    {[72, 84].map((y) => (
      <line key={y} x1="-40" y1={y} x2="136" y2={y} stroke={S.puss.skygge} strokeWidth="0.4" opacity="0.7" />
    ))}
    <Palme x={-28} y={70} h={34} />
    <Palme x={-12} y={72} h={26} />
    <Palme x={118} y={70} h={36} />
    <g transform="translate(-92 0)">
      <Gjestefloy n={gj} />
    </g>
    {/* Villaen: to volumer i hvitt med glassdører og et tak i flukt. */}
    <g transform="translate(24 0)">
    <Kloss x={4} y={76} b={50} h={22} d={12} m={S.hvit} />
    <Kloss x={9} y={54} b={40} h={18} d={10} m={S.hvit} />
    {[14, 25, 36].map((x) => (
      <g key={x}>
        <rect x={x} y="40" width="7" height="10" fill={S.glass.skygge} className="nattvindu" />
        <rect x={x} y="40" width="2.6" height="10" fill={S.glass.flate} opacity="0.5" className="nattskjul" />
        <rect x={r2(x - 0.8)} y="50" width="8.6" height="1" fill={S.hvit.skygge} />
      </g>
    ))}
    {[8, 22, 36].map((x) => (
      <g key={x}>
        <rect x={x} y="58" width="12" height="17" fill={S.glass.skygge} className="nattvindu" />
        <rect x={x} y="58" width="4" height="17" fill={S.glass.flate} opacity="0.5" className="nattskjul" />
        <rect x={r2(x + 5.7)} y="58" width="0.6" height="17" fill={S.hvit.lys} />
      </g>
    ))}
    <Takterrasse n={te} />
    <rect x="3" y="75.4" width="52" height="1.8" fill={S.tegl.flate} />
    </g>
    <Basseng n={ba} />
  </Lerret>
)

// ─────────────────────────────────────────────── Oppslag

/** Hjemmene, etter id. `Hjemtegning` i ui/komponenter/Hjemscene.tsx slår opp her når delen er lastet. */
export const HJEMTEGNINGER: Record<string, Hjemtegning> = {
  oslo: Hjemmet,
  hytta: Hytta,
  feriehuset: Feriehuset,
}
