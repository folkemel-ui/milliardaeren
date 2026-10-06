/**
 * Illustrasjonene for bedrifter, eiendom og luksus. Se dem store på ?galleri,
 * der stilarket øverst viser paletten, bakkene og de tre avstandene.
 *
 * KUNSTRETNINGEN (Grafikkpakke G1). Alle nye tegninger følger den; de gamle
 * tegnes om etter den i G2–G7 og bruker den gamle stilen (nederst) til da.
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
 * spilleren har bedt om mindre bevegelse — se styles.css.
 *
 * DEN GAMLE STILEN (48 × 48), for tegningene som ikke er tegnet om ennå:
 * paletten `F`, grunnlinje y = 43 og én `Grunn`, flate former sett fra siden.
 * Lag ingen nye tegninger i den.
 */

import { memo, type ReactNode } from 'react'
import { Bakke, Dis, GRUNNLINJE, HORISONT, Utklipp, Kantfade, Kloss, Lampe, Lerret, Person as Figur, Plakett, S, Saltak, Slagskygge, Speiling, Bunnskygge, Glans, Tre, Vindusrad, inn, maal, type Materiale } from './Tegnestil'

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
    <svg className="illustrasjon" width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
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

/** En bedriftstegning: vekstrinnet og hvor mange forbedringer som er kjøpt (0–3). */
type B = (trinn: Trinn, f: number) => ReactNode

// ─────────────────────────────────────────────── Bedrifter

/**
 * Saftboden (nær avstand): et bord med pappskilt på nivå 1, en ordentlig bod
 * med stripet markise fra 25, en fløy med parasoll og kunder ved 50, og ved
 * 100 hvitmalt disk med messingkant, lyslenke og et sitrontre. Forbedringene:
 * saftpresse på disken, isboks med isbiter og en grønn sukkerfri dunk med vimpel.
 */
const saftbod: B = (t, f) => {
  const g = GRUNNLINJE
  const bod = t >= 1
  const disk = bod ? { x: 22, b: 44, y: 68 } : { x: 26, b: 40, y: 70 }
  const x0 = disk.x
  const fot = disk.y - 1.2
  const panel = t >= 3 ? S.hvit : S.oker
  const dunk = (x: number, saft: Materiale, liten: boolean) => {
    const h = liten ? 10 : 13
    const b = liten ? 7 : 9
    return (
      <g>
        <rect x={x} y={fot - h} width={b} height={h} rx="1.2" fill={saft.lys} />
        <rect x={x} y={fot - h} width={b} height={h * 0.3} rx="1.2" fill={S.hvit.lys} opacity="0.55" />
        <rect x={x + b - 2} y={fot - h} width="2" height={h} fill={saft.flate} opacity="0.6" />
        <circle cx={x + b * 0.4} cy={fot - h * 0.45} r={b * 0.18} fill={S.hvit.lys} opacity="0.8" />
        <rect x={x - 0.4} y={fot - h - 1.4} width={b + 0.8} height="1.6" rx="0.6" fill={S.metall.flate} />
        <rect x={x + b * 0.35} y={fot - 2.2} width="2.2" height="1.4" fill={S.metall.skygge} />
        <Glans points={`${x},${fot - h} ${x + b * 0.45},${fot - h} ${x},${fot - h * 0.3}`} />
      </g>
    )
  }
  return (
    <>
      <Bakke type="fortau" />
      <Slagskygge x1={x0} x2={x0 + disk.b + (t >= 2 ? 16 : 0)} lengde={14} d={12} />
      {/* Fløyen med parasoll fra nivå 50. */}
      {t >= 2 && (
        <g>
          <line x1="76" y1={g - 12} x2="76" y2="45" stroke={S.metall.skygge} strokeWidth="0.8" />
          <path d="M60 50 Q76 39 92 50 Z" fill={t >= 3 ? S.hvit.lys : S.oker.lys} />
          <path d="M76 41.6 Q86 43 92 50 L76 50 Z" fill={t >= 3 ? S.hvit.flate : S.oker.flate} />
          <Kloss x={66} b={18} h={12} d={10} m={S.treverk} front={panel.skygge} />
          {[70, 74, 78].map((x) => (
            <circle key={x} cx={x} cy={g - 13.4} r="1.6" fill={S.oker.lys} />
          ))}
          <circle cx="72" cy={g - 15.6} r="1.6" fill={S.oker.flate} />
        </g>
      )}
      {/* Boden: stolper, markise og skilt fra nivå 25. */}
      {bod && (
        <g>
          <rect x="23" y="34" width="2" height="34" fill={S.treverk.flate} />
          <rect x="63" y="34" width="2" height="34" fill={S.treverk.skygge} />
          <polygon points="19,31 69,31 72,39 16,39" fill={S.hvit.lys} />
          {[0, 2, 4].map((i) => (
            <polygon key={i} points={`${19 + i * 8.33},31 ${27.33 + i * 8.33},31 ${25.33 + i * 9.33},39 ${16 + i * 9.33},39`} fill={S.oker.flate} />
          ))}
          <path d={`M16 39 ${Array.from({ length: 8 }, (_, i) => `Q${19.5 + i * 7} 42.4 ${23 + i * 7} 39`).join(' ')} Z`} fill={S.oker.skygge} />
          <rect x="16" y="39" width="56" height="0.8" fill="#000000" opacity="0.2" />
          <Kloss x={31} y={31} b={26} h={8} d={3} m={S.treverk} />
          <rect x="40" y="24.6" width="5.4" height="5.4" rx="0.6" fill={S.hvit.lys} opacity="0.85" />
          <rect x="40.6" y="26.6" width="4.2" height="3" fill={S.oker.lys} />
          <circle cx="45.6" cy="25.2" r="1.6" fill={S.oker.flate} />
          <path d="M44.2 25.2 H47" stroke={S.hvit.lys} strokeWidth="0.3" />
          <rect x="48.6" y="26.6" width="5" height="0.9" rx="0.45" fill={S.treverk.lys} />
          <rect x="48.6" y="28.4" width="3.6" height="0.9" rx="0.45" fill={S.treverk.lys} />
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
      {/* Selgeren bak disken. */}
      <Figur x={x0 + disk.b * 0.62} y={disk.y + 8} avstand="naer" klaer={S.marine} />
      {/* Disken: et bord på nivå 1, en malt disk fra 25. */}
      {bod ? (
        <g>
          <Kloss x={x0} b={disk.b} h={g - disk.y} d={12} m={S.treverk} front={panel.flate} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={x0 + 5 + i * 5} y={disk.y + 1.6} width="0.5" height={g - disk.y - 1.6} fill={panel.skygge} opacity="0.7" />
          ))}
          <rect x={x0 - 1} y={disk.y - 0.6} width={disk.b + 2} height="1.6" fill={t >= 3 ? S.gull.flate : S.treverk.lys} />
          <Bunnskygge x={x0} y={disk.y} b={disk.b} h={g - disk.y} />
        </g>
      ) : (
        <g>
          <rect x="28" y="72.4" width="2" height="11.6" fill={S.treverk.skygge} />
          <rect x="62" y="72.4" width="2" height="11.6" fill={S.treverk.skygge} />
          <Kloss x={x0} y={72.4} b={disk.b} h={2.4} d={10} m={S.treverk} />
          <g transform="rotate(-3 46 77)">
            <rect x="37" y="73" width="18" height="9.6" rx="0.6" fill={S.hvit.flate} />
            <circle cx="42" cy="77.8" r="2.8" fill={S.oker.lys} />
            <circle cx="42" cy="77.8" r="2" fill={S.oker.flate} opacity="0.5" />
            <path d="M42 75.8 V79.8 M40 77.8 H44" stroke={S.hvit.lys} strokeWidth="0.35" />
            <rect x="46" y="75.6" width="7" height="1" rx="0.5" fill={S.treverk.flate} />
            <rect x="46" y="78" width="5" height="1" rx="0.5" fill={S.treverk.flate} />
          </g>
        </g>
      )}
      {/* På disken: dunken med saft og koppene. */}
      {dunk(x0 + 3, S.oker, false)}
      {[0, 1, 2].map((i) => (
        <polygon key={i} points={`${x0 + disk.b - 8},${fot - i * 1.4} ${x0 + disk.b - 3},${fot - i * 1.4} ${x0 + disk.b - 3.4},${fot - 4 - i * 1.4} ${x0 + disk.b - 7.6},${fot - 4 - i * 1.4}`} fill={i === 2 ? S.hvit.lys : S.hvit.flate} />
      ))}
      {/* Sukkerfri linje: en grønn dunk og en grønn vimpel. */}
      {f >= 3 && (
        <g>
          {dunk(x0 + 13, S.bjork, true)}
          <line x1={x0 + 1} y1={disk.y} x2={x0 + 1} y2={disk.y - 16} stroke={S.treverk.skygge} strokeWidth="0.6" />
          <polygon className="anim-flagg" points={`${x0 + 1.3},${disk.y - 16} ${x0 + 7},${disk.y - 14} ${x0 + 1.3},${disk.y - 12}`} fill={S.gran.lys} />
        </g>
      )}
      {/* Saftpressen. */}
      {f >= 1 && (
        <g>
          <rect x={x0 + 22} y={fot - 3} width="6" height="3" rx="0.6" fill={S.metall.flate} />
          <polygon points={`${x0 + 23},${fot - 3} ${x0 + 27},${fot - 3} ${x0 + 25},${fot - 6}`} fill={S.metall.lys} />
          <line x1={x0 + 27.6} y1={fot - 2.6} x2={x0 + 30.6} y2={fot - 9} stroke={S.metall.skygge} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={x0 + 25} cy={fot - 7.2} r="1.3" fill={S.oker.lys} />
        </g>
      )}
      {/* Isboksen på bakken, med lokket oppe. */}
      {f >= 2 && (
        <g>
          <polygon points={`70,${g + 1} 81,${g + 1} 83,${g - 5} 72,${g - 5}`} fill={S.hvit.skygge} />
          <Kloss x={70} y={g + 8} b={12} h={7} d={6} m={S.petrol} />
          {[71.6, 74.4, 77.2, 80].map((x, i) => (
            <rect key={x} x={x + (i % 2) * 0.6} y={g - 0.6 - (i % 2)} width="2" height="2" rx="0.3" fill={S.hvit.lys} />
          ))}
        </g>
      )}
      {/* Nivå 100: sitrontre i krukke, og plaketten. */}
      {t >= 3 && (
        <g>
          <Tre x={81} y={g - 15} h={17} />
          {[[78, 59], [83, 57], [80.6, 62], [84.4, 61]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill={S.oker.lys} />
          ))}
          <polygon points={`77.6,${g - 16} 84.4,${g - 16} 83.6,${g - 12} 78.4,${g - 12}`} fill={S.tegl.flate} />
          <Plakett x={x0 + 28} y={disk.y + 4} />
        </g>
      )}
      {/* Kunder: to ved nivå 50, tre ved 100. */}
      {t >= 2 && (
        <>
          <Figur x={11} y={g + 6} avstand="naer" klaer={S.petrol} hud={S.hudMork} har={S.mork.skygge} />
          <Figur x={19} y={g + 3} avstand="naer" klaer={S.vin} ben={S.marine.skygge} />
        </>
      )}
      {t >= 3 && <Figur x={88} y={g + 7} avstand="naer" klaer={S.oker} vendt={-1} />}
    </>
  )
}

/**
 * Pølseboden (gateavstand): en pølsevogn med parasoll på nivå 1, en rød
 * pølsebu med luke fra 25, en overbygd terrasse med ståbord og kunder ved 50,
 * og ved 100 gullskrift, lamper og blomsterkasser. Forbedringene: grillplate i
 * stål, en stor sennepsflaske med skilt, og food trucken parkert bak.
 */
const polsebod: B = (t, f) => {
  const g = GRUNNLINJE
  const bu = t >= 1
  const disk = bu ? { x: 33, y: 74.4 } : { x: 37, y: 71 }
  const polse = (x: number, y: number) => (
    <g>
      <rect x={x} y={y} width="6" height="2" rx="1" fill={S.oker.lys} />
      <rect x={x - 0.6} y={y + 0.3} width="7.2" height="1.1" rx="0.55" fill={S.tegl.lys} />
    </g>
  )
  return (
    <>
      <Bakke type="fortau" />
      {/* Food trucken, parkert bak til venstre. */}
      {f >= 3 && (
        <g>
          <Slagskygge x1={6} x2={40} y={g - 6} lengde={10} d={10} />
          <Kloss x={6} y={g - 8} b={34} h={22} d={12} m={S.hvit} />
          <rect x="6" y={g - 14} width="34" height="2.4" fill={S.vin.flate} />
          <polygon points={`6,${g - 30} 13,${g - 30} 13,${g - 20} 6,${g - 20}`} fill={S.glass.skygge} />
          <Glans points={`6,${g - 30} 10,${g - 30} 6,${g - 23}`} />
          <rect x="16" y={g - 26} width="18" height="8" fill={S.vinduLys.skygge} />
          <polygon points={`15,${g - 26} 35,${g - 26} 36.4,${g - 30.4} 13.6,${g - 30.4}`} fill={S.vin.flate} />
          {[11, 33].map((x) => (
            <g key={x}>
              <circle cx={x} cy={g - 8} r="3.4" fill={S.mork.skygge} />
              <circle cx={x} cy={g - 8} r="1.4" fill={S.metall.flate} />
            </g>
          ))}
        </g>
      )}
      {/* Terrassen med tak og ståbord fra nivå 50. */}
      {t >= 2 && (
        <g>
          <Slagskygge x1={65} x2={84} lengde={8} d={12} />
          {[66, 82].map((x) => (
            <rect key={x} x={x} y="58" width="1.2" height={g - 58} fill={S.treverk.skygge} />
          ))}
          <Kloss x={64} y={59} b={20} h={1.8} d={12} m={S.skifer} />
          {t >= 3 && [70, 80].map((x) => <Lampe key={x} x={x} y={61.6} r={2} />)}
          {[71, 79].map((x) => (
            <g key={x}>
              <rect x={x - 0.4} y={g - 11} width="0.8" height="11" fill={S.mork.flate} />
              <ellipse cx={x} cy={g - 11} rx="3.4" ry="0.9" fill={S.treverk.lys} />
            </g>
          ))}
        </g>
      )}
      {bu ? (
        <g>
          {/* Pølsebua: rød med hvite hjørner, skilt på taket. */}
          <Slagskygge x1={30} x2={64} lengde={14} d={16} />
          <Kloss x={30} b={34} h={26} d={16} m={S.faluRod} />
          <rect x="34" y="63" width="22" height="11.4" fill={S.vinduLys.skygge} />
          <Figur x={45} y={g - 1} avstand="gate" klaer={S.hvit} />
          <rect x="30" y="74.4" width="34" height={g - 74.4} fill={S.faluRod.flate} />
          <Bunnskygge x={30} y={64} b={34} h={20} />
          {[30, 62.8].map((x) => (
            <rect key={x} x={x} y="58" width="1.2" height="26" fill={S.hvit.flate} />
          ))}
          <polygon points="33,62.6 57,62.6 59,58.6 31,58.6" fill={S.vin.flate} />
          <Kloss x={28} y={59} b={38} h={2} d={18} m={S.skifer} />
          <Kloss x={33} y={76} b={24} h={1.6} d={3} m={S.metall} />
          {[38, 56].map((x) => (
            <rect key={x} x={x} y="55" width="0.8" height="4" fill={S.mork.flate} />
          ))}
          <Kloss x={34} y={55.4} b={26} h={8.6} d={2} m={S.hvit} />
          <rect x="39" y="49.6" width="16" height="3.6" rx="1.8" fill={S.oker.lys} />
          <rect x="37.6" y="50.4" width="18.8" height="2" rx="1" fill={S.tegl.lys} />
          {t >= 3 && <rect x="34" y="54.6" width="26" height="0.8" fill={S.gull.flate} />}
        </g>
      ) : (
        <g>
          {/* Pølsevogna med parasoll. */}
          <Slagskygge x1={36} x2={58} lengde={10} d={8} />
          <line x1="47" y1={disk.y} x2="47" y2="52" stroke={S.metall.skygge} strokeWidth="0.8" />
          <path d="M31 57 Q47 45 63 57 Z" fill={S.hvit.lys} />
          {[0, 2, 4].map((i) => (
            <path key={i} d={`M47 47 L${31 + i * 5.33} 57 L${36.33 + i * 5.33} 57 Z`} fill={S.vin.flate} />
          ))}
          <path d="M47 47 L57.7 57 L63 57 Q58 50.6 47 47 Z" fill={S.vin.skygge} />
          <Figur x={51} y={g - 7} avstand="gate" klaer={S.hvit} />
          <Kloss x={36} y={80} b={22} h={9} d={8} m={S.metall} front={S.hvit.flate} />
          <rect x="36" y="76" width="22" height="2.2" fill={S.vin.flate} />
          {[40, 54].map((x) => (
            <g key={x}>
              <circle cx={x} cy={81.4} r="2.6" fill={S.mork.skygge} />
              <circle cx={x} cy={81.4} r="1" fill={S.metall.flate} />
            </g>
          ))}
          <line x1="58" y1="74" x2="62" y2="72" stroke={S.metall.skygge} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}
      {/* På disken: pølser i brød. */}
      {polse(disk.x + 13, disk.y - 2.2)}
      {/* Grillplate i stål. */}
      {f >= 1 && (
        <g>
          <rect x={disk.x + 1} y={disk.y - 1.6} width="10" height="1.6" fill={S.metall.skygge} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={disk.x + 1.6 + i * 3} y={disk.y - 2.6} width="2.6" height="1" rx="0.5" fill={S.tegl.lys} />
          ))}
        </g>
      )}
      {/* Hjemmelaget sennep: flaska på disken og et skilt. */}
      {f >= 2 && (
        <g>
          <rect x={disk.x + 20.5} y={disk.y - 6.6} width="2.6" height="6.6" rx="0.8" fill={S.oker.flate} />
          <rect x={disk.x + 21.1} y={disk.y - 8} width="1.4" height="1.6" fill={S.vin.flate} />
          <circle cx={bu ? 26 : 30} cy={bu ? 68 : 64} r="3.6" fill={S.oker.lys} stroke={S.hvit.lys} strokeWidth="0.6" />
          <rect x={(bu ? 26 : 30) - 1} y={(bu ? 68 : 64) - 1.8} width="2" height="3.6" rx="0.6" fill={S.oker.skygge} />
          <line x1={bu ? 26 : 30} y1={(bu ? 68 : 64) + 3.6} x2={bu ? 26 : 30} y2={g} stroke={S.mork.flate} strokeWidth="0.6" />
        </g>
      )}
      {t >= 3 && (
        <g>
          <Plakett x={61} y={46.6} />
          {[33, 51].map((x) => (
            <g key={x}>
              <Kloss x={x} y={g} b={8} h={3} d={3} m={S.treverk} />
              {[1.5, 4, 6.5].map((dx) => (
                <circle key={dx} cx={x + dx} cy={g - 3.8} r="1.6" fill={dx === 4 ? S.vin.lys : S.lov.flate} />
              ))}
            </g>
          ))}
        </g>
      )}
      {t >= 2 && (
        <>
          <Figur x={68} y={g + 4} avstand="gate" klaer={S.petrol} vendt={1} />
          <Figur x={83} y={g + 3} avstand="gate" klaer={S.oker} hud={S.hudMork} har={S.mork.skygge} vendt={-1} />
        </>
      )}
      {t >= 3 && <Figur x={22} y={g + 6} avstand="gate" klaer={S.marine} ben={S.treMork.skygge} />}
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
      <Bakke type="fortau" />
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
 * maskin), pakkeautomat og døgnåpent (måneskilt og varmt lys inne).
 */
const kiosk: B = (t, f) => {
  const g = GRUNNLINJE
  const lysInne = f >= 3 || t >= 3
  const varer = [S.oker, S.petrol, S.vin, S.hvit, S.gran, S.oker, S.vin]
  return (
    <>
      <Bakke type="fortau" />
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
      {t >= 2 && (
        <>
          <Figur x={42} y={g + 1.6} avstand="gate" klaer={S.petrol} vendt={-1} />
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
 * Michelin-skiltet ved døra.
 */
const restaurant: B = (t, f) => {
  const g = GRUNNLINJE
  const stor = t >= 1
  const bue = (x: number, y: number, b: number, h: number, fyll: string) => <path d={`M${x} ${y + h} V${y + b / 2} A${b / 2} ${b / 2} 0 0 1 ${x + b} ${y + b / 2} V${y + h} Z`} fill={fyll} />
  return (
    <>
      <Bakke type="fortau" />
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
      {[39, 47].map((x) => (
        <g key={x}>
          <rect x={x - 2.6} y="73" width="5.2" height="1" fill={S.hvit.lys} />
          <rect x={x - 0.4} y="74" width="0.8" height="5" fill={S.mork.flate} />
          <circle cx={x} cy="71.6" r="1" fill={S.vinduLys.lys} />
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
      <Bakke type="fortau" />
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
    </>
  )
}

/**
 * Banken (gateavstand): en liten filial i et steinhus på nivå 1, et
 * hovedkontor med søyler, gavl og trapp fra 25, sidefløyer og kunder ved 50,
 * og ved 100 marmor, gullkant, flagg og lamper. Forbedringene: en digital
 * søyle for nettbanken, en egen inngang for formuesforvaltning under
 * gullkantet baldakin, og et kurstikker-bånd over inngangen for investeringsbanken.
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
      <Bakke type="fortau" />
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
      {t >= 2 && (
        <>
          <Figur x={38} y={g + 4} avstand="gate" klaer={S.marine} ben={S.mork.skygge} />
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
          <polygon points={`0,${HORISONT + 1} 10,40 22,48 34,30 48,44 60,36 74,48 86,38 96,44 96,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points={`34,30 48,44 38,${HORISONT} 30,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points={`86,38 96,44 96,${HORISONT} 84,${HORISONT}`} fill={S.fjell.skygge} />
          <polygon points="30.4,35.6 34,30 38.6,35 36,34 34,36.4 32.4,34.6" fill={S.sno.lys} />
          <polygon points="57,40 60,36 63.6,39.8 61.6,39 59.6,41 58.4,39.6" fill={S.sno.lys} />
          <polygon points={`0,${HORISONT + 1} 0,50 12,52 24,54 40,53 56,54 74,52 96,51 96,${HORISONT + 1}`} fill={S.gran.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
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
function Passasjerfly({ x, gy, L, slag, hale }: { x: number; gy: number; L: number; slag: 'propell' | 'jet' | 'wide'; hale: string }) {
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
          <rect x={px(k) - 0.3} y={r(fb)} width="0.6" height={r(w * 0.6)} fill={S.metall.skygge} />
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
        <circle key={i} cx={px(0.2 + i * 0.032)} cy={r(ft + H * 0.38)} r={r(H * 0.09)} fill={S.glass.skygge} />
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
 * langs nedfarten og en hoppbakke med tribune for vinter-OL.
 */
const skisenter: B = (t, f) => {
  const g = GRUNNLINJE
  const stor = t >= 1
  const fjell = stor
    ? `0,${g - 10} 14,${g - 30} 26,${g - 40} 40,${g - 64} 50,${g - 56} 60,${g - 66} 76,${g - 40} 96,${g - 22} 96,${g - 6} 0,${g - 6}`
    : `0,${g - 10} 20,${g - 24} 36,${g - 36} 48,${g - 40} 60,${g - 34} 80,${g - 20} 96,${g - 12} 96,${g - 6} 0,${g - 6}`
  const topp: [number, number] = stor ? [60, g - 66] : [48, g - 40]
  // Nedfartene, fra toppen og ned mot dalen.
  const nedfarter = stor
    ? [`M40 ${g - 62} Q30 ${g - 40} 26 ${g - 10}`, `M58 ${g - 62} Q50 ${g - 36} 44 ${g - 8}`, `M62 ${g - 60} Q72 ${g - 38} 70 ${g - 10}`]
    : [`M46 ${g - 38} Q38 ${g - 24} 32 ${g - 8}`]
  const skog = stor
    ? [[6, g - 14], [12, g - 20], [18, g - 16], [34, g - 24], [38, g - 18], [52, g - 30], [56, g - 22], [60, g - 16], [78, g - 28], [84, g - 20], [90, g - 16], [8, g - 9], [20, g - 26]]
    : [[10, g - 14], [16, g - 18], [24, g - 22], [52, g - 30], [58, g - 24], [66, g - 22], [74, g - 18], [84, g - 14]]
  return (
    <>
      {/* Fjellet: snø, fjellvegg på skyggesiden, skog og nedfarter. */}
      <Kantfade>
        <polygon points={fjell} fill={S.sno.flate} stroke={S.fjell.lys} strokeWidth="0.6" strokeLinejoin="round" />
        <polygon points={stor ? `60,${g - 66} 76,${g - 40} 96,${g - 22} 96,${g - 6} 72,${g - 6} 66,${g - 34}` : `48,${g - 40} 60,${g - 34} 80,${g - 20} 96,${g - 12} 96,${g - 6} 62,${g - 6}`} fill={S.sno.skygge} />
        {stor && <polygon points={`40,${g - 64} 50,${g - 56} 46,${g - 48} 42,${g - 52}`} fill={S.fjell.skygge} />}
        {stor && <polygon points={`60,${g - 66} 68,${g - 54} 64,${g - 50}`} fill={S.fjell.flate} />}
        {nedfarter.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={S.sno.lys} strokeWidth="4.4" strokeLinecap="round" />
        ))}
        {skog.map(([sx, sy], i) => (
          <Tre key={i} x={sx} y={sy} h={stor ? 7 : 6} slag="gran" />
        ))}
      </Kantfade>
      <Bakke type="sno" />
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
          <g key={k}>
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

/**
 * Hytta (ny stil, gateavstand): laftet tømmer med torvtak, hvite vinduskarmer,
 * pipe med røyk og vimpel. Fjellene bak står i dis, så det føles langt dit.
 */
function Hytte({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  // Veggen: front x 20–66, topp y 62, dybde 26. Mønet ligger midt i dybden.
  const møne = (x: number) => inn(x, 62 - 14, 13)
  const [mvx, mvy] = møne(17)
  const [mhx, mhy] = møne(69)
  const tuster = Array.from({ length: 13 }, (_, i) => {
    const x = mvx + ((mhx - mvx) * i) / 12
    return `Q${x + 2} ${mvy - 2.4 - (i % 2) * 0.8} ${x + 4.3} ${mvy}`
  }).join(' ')
  return (
    <Lerret størrelse={størrelse}>
      {/* Fjellene langt bak, i dis. */}
      <Kantfade>
        <Dis>
          <polygon points="0,70 8,56 16,60 26,42 38,58 50,50 60,56 74,36 86,50 96,46 96,72 0,72" fill={S.fjell.flate} />
          <polygon points="26,42 38,58 30,60 24,56" fill={S.fjell.skygge} />
          <polygon points="74,36 86,50 80,58 72,54" fill={S.fjell.skygge} />
          <polygon points="21.6,49 26,42 31,48.8 28.6,47.6 26,50 23.8,48" fill={S.sno.lys} />
          <polygon points="69.6,43 74,36 79,42.6 76.6,41.6 74.4,44 72,42.4" fill={S.sno.lys} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      <Slagskygge x1={20} x2={66} lengde={16} d={26} />
      {/* Bjørka til venstre. */}
      <polygon points={`9.4,${g + 2} 12.2,${g + 2} 11.5,52 10.3,52`} fill={S.hvit.lys} />
      <line x1="11.2" y1="60" x2="15" y2="55" stroke={S.hvit.flate} strokeWidth="0.7" />
      {[58, 63, 68.5, 74, 79].map((y, i) => (
        <rect key={y} x={i % 2 ? 10.4 : 9.6} y={y} width="1.3" height="0.6" fill={S.mork.flate} />
      ))}
      {[
        [5.6, 54, 4.6, S.bjork.flate],
        [15.6, 52, 4.4, S.bjork.skygge],
        [9, 50, 5.2, S.bjork.flate],
        [13.6, 46, 4.4, S.bjork.flate],
        [7.4, 45.4, 3.8, S.bjork.lys],
        [10.8, 41.8, 3.6, S.bjork.lys],
      ].map(([x, y, r, c]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={c as string} />
      ))}
      {/* Veggene i laftet tømmer. */}
      <Kloss x={20} b={46} h={22} d={26} m={S.treMork} tak={false} />
      {Array.from({ length: 7 }, (_, i) => +(64.4 + i * 3.1).toFixed(1)).map((y) => (
        <g key={y}>
          <line x1="20" y1={y} x2="66" y2={y} stroke={S.treMork.skygge} strokeWidth="0.6" />
          <line x1="66" y1={y} x2={inn(66, y, 26)[0]} y2={inn(66, y, 26)[1]} stroke={S.mork.flate} strokeWidth="0.5" />
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => +(63 + i * 3.1).toFixed(1)).map((y) => (
        <g key={`e${y}`}>
          <circle cx="20" cy={y} r="1.15" fill={S.treverk.flate} />
          <circle cx="66" cy={y} r="1.15" fill={S.treverk.skygge} />
        </g>
      ))}
      {/* Gavlen på siden, og torvtaket. */}
      <polygon points={`66,62 ${inn(66, 62, 26).join(',')} ${mhx - 3},${mhy}`} fill={S.treMork.skygge} />
      <polygon points={`17,63.6 69,63.6 ${mhx},${mhy} ${mvx},${mvy}`} fill={S.gress.flate} />
      <path d={`M${mvx} ${mvy} ${tuster}`} fill={S.gress.lys} />
      <polyline points={`69,63.6 ${mhx},${mhy} ${inn(69, 63.6, 29).join(',')}`} fill="none" stroke={S.treMork.skygge} strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="17" y="63" width="52" height="1.6" fill={S.treMork.skygge} />
      {/* Pipa med røyk. */}
      <Kloss x={52} y={56} b={4.6} h={9} d={4} m={S.stein} />
      <circle className="anim-roeyk" cx="55.6" cy="44" r="2" fill={S.hvit.flate} opacity="0.7" />
      <circle className="anim-roeyk sen" cx="58" cy="40" r="2.6" fill={S.hvit.flate} opacity="0.45" />
      {/* Vinduer med hvite karmer, og døra. */}
      {[24.4, 36.4].map((x) => (
        <g key={x}>
          <rect x={x} y="67" width="8.4" height="8.4" fill={S.hvit.lys} />
          <rect x={x + 1} y="68" width="6.4" height="6.4" fill={S.vinduLys.flate} />
          <rect x={x + 3.8} y="68" width="0.8" height="6.4" fill={S.hvit.lys} />
          <rect x={x + 1} y="70.8" width="6.4" height="0.8" fill={S.hvit.lys} />
          <rect x={x - 0.6} y="75.4" width="9.6" height="1" fill={S.hvit.flate} />
        </g>
      ))}
      <rect x="51" y={g - 19.5} width="9" height="19.5" fill={S.faluRod.flate} />
      <rect x="51" y={g - 19.5} width="9" height="19.5" fill="none" stroke={S.hvit.flate} strokeWidth="0.8" />
      <circle cx="58.3" cy={g - 9.5} r="0.6" fill={S.gull.flate} />
      <rect x="19.4" y={g - 2.2} width="47" height="2.2" fill={S.stein.flate} />
      {/* Steinheller ned til plenen. */}
      {[[55.5, g + 2.6], [53.5, g + 6]].map(([x, y]) => (
        <ellipse key={y} cx={x} cy={y} rx="4" ry="1.2" fill={S.stein.lys} />
      ))}
      {/* Flaggstanga med vimpel. */}
      <line x1="84" y1={g + 3} x2="84" y2="38" stroke={S.hvit.lys} strokeWidth="0.9" />
      <circle cx="84" cy="37.6" r="0.9" fill={S.gull.flate} />
      <g className="anim-flagg">
        <polygon points="84.4,39 92,41.4 84.4,43.2" fill={S.faluRod.lys} />
        <rect x="84.4" y="39.8" width="2.2" height="2.6" fill={S.faluRod.lys} />
        <rect x="84.4" y="40.6" width="2.2" height="1" fill={S.hvit.lys} />
        <rect x="85" y="39.8" width="1" height="2.6" fill={S.hvit.lys} />
        <rect x="84.4" y="40.9" width="2.2" height="0.4" fill={S.marine.flate} />
        <rect x="85.3" y="39.8" width="0.4" height="2.6" fill={S.marine.flate} />
      </g>
    </Lerret>
  )
}

/**
 * Kontorbygget (ny stil, fjern avstand): et glasstårn på et lavt steinbygg,
 * sett fra andre siden av byen. Folkene ved foten er små — det er det som
 * gjør tårnet stort. Nabobyggene står i dis bak.
 */
function Kontorbygg({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const etasje = maal('fjern', 'etasje')
  const etasjer = Array.from({ length: 8 }, (_, i) => g - 12 - (i + 1) * etasje)
  const tent = new Set(['1-2', '2-5', '3-1', '4-4', '5-0', '6-3', '7-5', '8-2'])
  return (
    <Lerret størrelse={størrelse}>
      {/* Byen bak, i dis. */}
      <Kantfade>
        <Dis>
          <Kloss x={8} y={g - 6} b={16} h={40} d={10} m={S.stein} />
          {[0, 1, 2, 3, 4, 5, 6].map((r) => (
            <rect key={r} x="10" y={g - 42 + r * 5} width="12" height="1.6" fill={S.stein.skygge} />
          ))}
          <Kloss x={66} y={g - 6} b={20} h={30} d={10} m={S.skifer} />
          {[0, 1, 2, 3, 4].map((r) => (
            <rect key={r} x="68" y={g - 32 + r * 5} width="16" height="1.6" fill={S.skifer.skygge} />
          ))}
          <Kloss x={78} y={g - 6} b={10} h={46} d={8} m={S.puss} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
            <rect key={r} x="80" y={g - 48 + r * 5} width="6" height="1.6" fill={S.puss.skygge} />
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Slagskygge x1={14} x2={62} lengde={26} d={14} />
      {/* Det lave steinbygget med lobbyen. */}
      <Kloss x={14} b={48} h={12} d={14} m={S.stein} />
      <rect x="14" y={g - 12} width="48" height="1.2" fill={S.stein.lys} />
      <rect x="18" y={g - 8.6} width="40" height="8.6" fill={S.vinduLys.skygge} />
      {[23, 28, 33, 38, 43, 48, 53].map((x) => (
        <rect key={x} x={x} y={g - 8.6} width="0.5" height="8.6" fill={S.stein.skygge} />
      ))}
      <Glans points={`18,${g - 8.6} 26,${g - 8.6} 21,${g} 18,${g}`} />
      <rect x="31" y={g - 10.4} width="14" height="1.6" fill={S.mork.flate} />
      {/* Tårnet: glassfasade med etasjeskiller og sprosser. */}
      <Kloss x={34} y={g - 12} b={28} h={64} d={16} m={S.glass} />
      {etasjer.map((y, rad) => (
        <g key={y}>
          <rect x="34" y={y} width="28" height="1.3" fill={S.glass.skygge} />
          <polygon points={`62,${y} ${inn(62, y, 16).join(',')} ${inn(62, y + 1.3, 16).join(',')} 62,${y + 1.3}`} fill={S.skifer.flate} />
          {[0, 1, 2, 3, 4, 5].map((k) =>
            tent.has(`${rad}-${k}`) ? <rect key={k} x={34.6 + k * 4.62} y={y + 1.9} width="3.6" height={etasje - 2.6} fill={S.vinduLys.flate} opacity="0.75" /> : null,
          )}
        </g>
      ))}
      {[1, 2, 3, 4, 5].map((k) => (
        <rect key={k} x={34 + k * 4.62} y={g - 76} width="0.4" height="64" fill={S.glass.lys} opacity="0.7" />
      ))}
      <Glans points={`34,${g - 70} 34,${g - 50} 62,${g - 22} 62,${g - 42}`} />
      <Glans points={`34,${g - 44} 34,${g - 38} 62,${g - 14} 62,${g - 20}`} />
      {/* Teknisk rom på taket. */}
      <Kloss x={40} y={g - 76} b={13} h={4} d={9} m={S.stein} />
      {/* Små trær og folk ved foten: målestokken. */}
      {[70, 78].map((x) => (
        <g key={x}>
          <rect x={x - 0.4} y={g - 5} width="0.8" height="5" fill={S.treMork.flate} />
          <circle cx={x} cy={g - 7} r="3" fill={S.gran.flate} />
          <circle cx={x - 0.9} cy={g - 7.8} r="1.6" fill={S.gran.lys} />
        </g>
      ))}
      <Figur x={26} y={g + 2} avstand="fjern" klaer={S.marine} />
      <Figur x={29} y={g + 3} avstand="fjern" klaer={S.oker} />
      <Figur x={66} y={g + 2.6} avstand="fjern" klaer={S.vin} vendt={-1} />
      <Figur x={84} y={g + 3.4} avstand="fjern" klaer={S.hvit} />
      {/* Flaggstengene foran. */}
      {[8, 11].map((x) => (
        <g key={x}>
          <line x1={x} y1={g + 1} x2={x} y2={g - 13} stroke={S.hvit.lys} strokeWidth="0.4" />
          <polygon className="anim-flagg" points={`${x + 0.2},${g - 13} ${x + 3},${g - 12.2} ${x + 0.2},${g - 11.4}`} fill={x === 8 ? S.faluRod.lys : S.marine.lys} />
        </g>
      ))}
    </Lerret>
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

/** Marbella: hvit ferieleilighet med terrakottatak, balkonger og palme. */
function Ferieleilighet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sand" />
      <rect x="13" y="20" width="26" height="20" fill={F.hvit} />
      <rect x="35.5" y="20" width="3.5" height="20" fill={F.krem} />
      <polygon points="11,20.5 26,13 41,20.5" fill={F.mur} />
      <polygon points="35,17.5 41,20.5 35,20.5" fill={F.murMork} />
      {[23, 30.5].map((y) => (
        <g key={y}>
          <rect x="16" y={y} width="6" height="4" fill={F.glassMork} />
          <rect x="25" y={y} width="6" height="4" fill={F.glassMork} />
          <rect x="15" y={y + 4} width="17" height="1" fill={F.mur} />
        </g>
      ))}
      <rect x="32.5" y="33" width="3" height="7" fill={F.tre} />
      <path d="M8 40 Q7 32 9 25" fill="none" stroke={F.treMork} strokeWidth="1.6" />
      <path d="M9 25 Q4.5 23 4.4 28 M9 25 Q13.5 21 15.5 25 M9 25 Q6 19 4.4 19.4 M9 25 Q11 18 14.5 18.5" fill="none" stroke={F.gronn} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

/** Marbella: høyt hvitt strandhotell med parasoll på stranda. */
function Strandhotell({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (let y = 11; y < 34; y += 4) {
    vinduer.push(<rect key={`v${y}`} x="16.5" y={y} width="4.5" height="2.2" fill={F.glassMork} />)
    vinduer.push(<rect key={`h${y}`} x="23.5" y={y} width="4.5" height="2.2" fill={F.glassMork} />)
  }
  return (
    <Svg størrelse={størrelse}>
      <Grunn type="sand" />
      <rect x="14" y="8" width="20" height="32" fill={F.hvit} />
      <rect x="30.5" y="8" width="3.5" height="32" fill={F.krem} />
      <rect x="13" y="6.4" width="22" height="2" fill={F.mur} />
      <rect x="21" y="3.6" width="6" height="2.6" rx="0.6" fill={F.gull} />
      {vinduer}
      <rect x="20" y="35" width="6" height="5" fill={F.glass} />
      <path d="M8 40 Q7 33 9 27" fill="none" stroke={F.treMork} strokeWidth="1.5" />
      <path d="M9 27 Q5 25.5 4.8 29.5 M9 27 Q13 24 14.6 27.4 M9 27 Q6.5 22 5 22.4" fill="none" stroke={F.gronn} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="40" y="31" width="0.8" height="9.5" fill={F.treMork} />
      <path d="M35 32.4 Q40.4 27 45.8 32.4 Z" fill={F.rod} />
      <path d="M38.6 32.4 Q40.4 28.4 42.2 32.4 Z" fill={F.hvit} />
    </Svg>
  )
}

/** Zermatt: skileilighet i treverk med balkong, under en spiss fjelltopp. */
function Skileilighet({ størrelse = 48 }: P) {
  return (
    <Svg størrelse={størrelse}>
      <polygon points="14,34 27,5 31,13 42,34" fill={F.fjell} />
      <polygon points="24.4,11 27,5 29.2,9.4 28,9 26,11.6" fill={F.sno} />
      <Grunn type="sno" />
      <rect x="12" y="24" width="24" height="19" fill={F.tre} />
      <rect x="32.5" y="24" width="3.5" height="19" fill={F.treMork} />
      <rect x="11" y="32" width="26" height="1.4" fill={F.treDyp} />
      {[12, 15, 18, 21, 24, 27, 30, 33, 36].map((x) => (
        <rect key={x} x={x} y="29.2" width="0.8" height="2.8" fill={F.treDyp} />
      ))}
      <rect x="11" y="29" width="26" height="0.8" fill={F.treDyp} />
      <polygon points="8,25 24,15 40,25" fill={F.treDyp} />
      <polygon points="8,25 24,15 40,25 38,25 24,17.4 10,25" fill={F.sno} />
      <rect x="15" y="25.6" width="5" height="3" fill={F.lys} />
      <rect x="26" y="25.6" width="5" height="3" fill={F.lys} />
      <rect x="15" y="35" width="5" height="4" fill={F.lys} />
      <rect x="14.6" y="39" width="5.8" height="1.2" fill={F.rod} />
      <rect x="26" y="35" width="5" height="8" fill={F.treDyp} />
    </Svg>
  )
}

/** Zermatt: stort alpehotell med sveitserflagg, foran fjellene. */
function Alpehotell({ størrelse = 48 }: P) {
  const vinduer: ReactNode[] = []
  for (const y of [21.5, 27.5, 33])
    for (const x of [11, 16, 21, 26, 31]) if (!(y === 33 && (x === 21 || x === 26))) vinduer.push(<rect key={`${x}-${y}`} x={x} y={y} width="3" height="3.4" fill={F.lys} />)
  return (
    <Svg størrelse={størrelse}>
      <polygon points="3,34 12,17 19,26 28,7 33.5,16 45,34" fill={F.fjell} />
      <polygon points="10,20.8 12,17 14,20.4 12.6,20 11.4,21" fill={F.sno} />
      <polygon points="25.6,11.4 28,7 30.6,11.2 29,10.6 27.2,12" fill={F.sno} />
      <Grunn type="sno" />
      <rect x="8" y="19" width="32" height="24" fill={F.krem} />
      <rect x="36" y="19" width="4" height="24" fill={F.kremMork} />
      <polygon points="6,19.6 24,11 42,19.6" fill={F.vin} />
      <polygon points="36,16.7 42,19.6 36,19.6" fill={F.vinMork} />
      {vinduer}
      <rect x="21" y="36" width="8" height="7" fill={F.treDyp} />
      <rect x="23.6" y="3.6" width="0.8" height="8" fill={F.metallMork} />
      <rect x="24.4" y="3.6" width="5" height="3.6" fill={F.rod} />
      <rect x="26.4" y="4.2" width="1" height="2.4" fill={F.hvit} />
      <rect x="25.7" y="4.9" width="2.4" height="1" fill={F.hvit} />
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

/**
 * Superbilen (ny stil, nær avstand): lav kile i dyp vinrød lakk med lys
 * skulderlinje, mørk kuppel, felger med eiker og gule bremser. Den står i et
 * utstillingsrom med lys ovenfra og speiler seg i det blanke gulvet.
 */
function SuperbilKarosseri() {
  const g = GRUNNLINJE
  const hjul = [24, 72]
  return (
    <g>
      <path
        d="M9 80.6 L8 72.4 Q9 68.6 13 67.4 L19 66.6 Q27 64.6 35 63.6 Q41 60.8 47 60.8 Q54 60.8 58.6 63.4 Q62 65.6 65 66.6 L80 69.6 Q86.6 71.2 88.6 74 L89.6 77.4 Q89.4 80 87 80.6 L79.6 80.6 A7.6 7.6 0 0 0 64.4 80.6 L31.6 80.6 A7.6 7.6 0 0 0 16.4 80.6 Z"
        fill={S.vin.flate}
      />
      {/* Nedre del i skygge, og skulderlinja i lys. */}
      <path d="M31.6 80.6 L64.4 80.6 L64.8 76.4 L31.2 76.6 Z" fill={S.vin.skygge} />
      <path d="M13 67.6 Q27 64.8 35 63.8 M65 66.8 L80 69.8 Q85.4 71 87.6 73" fill="none" stroke={S.vin.lys} strokeWidth="1.3" strokeLinecap="round" />
      {/* Kuppelen. */}
      <path d="M36.4 64.8 Q41.6 62 47 62 Q53.4 62 57.6 64.2 L61 66.2 L37 67.6 Z" fill={S.mork.flate} />
      <Glans d="M37.4 64.8 Q41.6 62.6 46 62.4 L42.4 67.2 L37.6 67.4 Z" />
      <line x1="49.2" y1="62.4" x2="48.4" y2="67" stroke={S.vin.skygge} strokeWidth="0.8" />
      {/* Luftinntaket foran bakhjulet, dørlinja og speilet. */}
      <path d="M33.6 70.6 L44.6 69.6 Q43.6 73.6 41.4 75.4 L34.2 75.6 Z" fill={S.mork.skygge} />
      <path d="M45.6 68 Q47.6 72 47.2 76.4" fill="none" stroke={S.vin.skygge} strokeWidth="0.5" />
      <path d="M59.4 66.4 L62.8 66.2 L62.4 67.8 L59.8 67.8 Z" fill={S.vin.skygge} />
      {/* Lykter. */}
      <path d="M80.4 71 L87.4 73 L86.8 74.2 L80 72.4 Z" fill={S.hvit.lys} />
      <rect x="8.4" y="69.4" width="4" height="1.4" rx="0.5" fill={S.faluRod.lys} />
      <path d="M78 79 L89.2 78.6" stroke={S.mork.flate} strokeWidth="1" />
      {/* Hjulene: dekk, felg med fem eiker, bremsekaliper. */}
      {hjul.map((x) => (
        <g key={x}>
          <circle cx={x} cy={g - 6.4} r="6.4" fill={S.mork.skygge} />
          <circle cx={x} cy={g - 6.4} r="4.6" fill={S.metall.skygge} />
          <path d={`M${x - 3.4} ${g - 9.6} A4.4 4.4 0 0 1 ${x + 1} ${g - 10.8}`} fill="none" stroke={S.oker.flate} strokeWidth="1.4" />
          {[0, 1, 2, 3, 4].map((i) => {
            const v = (i / 5) * Math.PI * 2 + 0.3
            return <line key={i} x1={x} y1={g - 6.4} x2={+(x + Math.cos(v) * 4.2).toFixed(2)} y2={+(g - 6.4 + Math.sin(v) * 4.2).toFixed(2)} stroke={S.metall.lys} strokeWidth="1.1" strokeLinecap="round" />
          })}
          <circle cx={x} cy={g - 6.4} r="4.6" fill="none" stroke={S.metall.lys} strokeWidth="0.6" />
          <circle cx={x} cy={g - 6.4} r="1" fill={S.mork.flate} />
        </g>
      ))}
    </g>
  )
}

function Superbil({ størrelse = 48 }: P) {
  return (
    <Lerret størrelse={størrelse} himmel="inne">
      <Bakke type="gulv" />
      <Speiling>
        <SuperbilKarosseri />
      </Speiling>
      <ellipse cx="49" cy={GRUNNLINJE + 0.3} rx="40" ry="2" fill="#000000" opacity="0.45" />
      <SuperbilKarosseri />
    </Lerret>
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

/**
 * Seilbåten (ny stil, gateavstand): en liten seilbåt fortøyd ved kaia, med
 * baugen mot høyre. Storseilet bak masta, fokka foran, og en marineblå stripe
 * langs skroget. Båten duver på den store scenen.
 */
function Seilbaat({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  return (
    <Lerret størrelse={størrelse}>
      <Bakke type="kai" />
      {/* Fortøyningen fra pullerten. */}
      <path d={`M17.5 ${g - 8} Q25 ${g - 2} 33 ${g - 5.6}`} fill="none" stroke={S.treverk.lys} strokeWidth="0.6" />
      <g className="anim-duve">
        {/* Speilbildet i vannet. */}
        {[g + 1.6, g + 3.8, g + 6.2].map((y, i) => (
          <rect key={y} x={36 + i * 4} y={y} width={46 - i * 9} height="0.9" rx="0.45" fill={S.hvit.flate} opacity={0.3 - i * 0.08} />
        ))}
        {/* Masta, bommen og stagene. */}
        <line x1="57" y1={g - 7} x2="86.6" y2={g - 6.4} stroke={S.metall.skygge} strokeWidth="0.35" />
        <line x1="57" y1="10" x2="31" y2={g - 6.6} stroke={S.metall.skygge} strokeWidth="0.35" />
        <rect x="56.4" y="10" width="1.2" height={g - 7 - 10} fill={S.metall.flate} />
        {/* Storseilet, med sømmer og skygge mot masta. */}
        <polygon points={`55.8,12 55.8,${g - 13} 34,${g - 13}`} fill={S.hvit.lys} />
        <polygon points={`55.8,12 55.8,${g - 13} 51,${g - 13}`} fill={S.hvit.flate} />
        {[30, 44, 58].map((y) => (
          <line key={y} x1="55.8" y1={y} x2={55.8 - ((y - 12) / (g - 25)) * 21.8} y2={y} stroke={S.hvit.skygge} strokeWidth="0.4" />
        ))}
        <rect x="33" y={g - 13} width="23.6" height="1.4" rx="0.6" fill={S.treverk.flate} />
        {/* Fokka. */}
        <polygon points={`58.2,15 82,${g - 8} 59,${g - 10}`} fill={S.hvit.flate} />
        <polygon points={`58.2,15 64,${g - 9.6} 59,${g - 10}`} fill={S.hvit.skygge} opacity="0.6" />
        {/* Vimpelen på toppen. */}
        <polygon points="57.6,10 62.4,11.2 57.6,12.4" fill={S.vin.lys} />
        {/* Ruffen med koøyer. */}
        <path d={`M45 ${g - 7} L47 ${g - 11} L64 ${g - 11} L67 ${g - 7} Z`} fill={S.hvit.flate} />
        <path d={`M47 ${g - 11} L64 ${g - 11} L64.6 ${g - 10} L46.6 ${g - 10} Z`} fill={S.hvit.lys} />
        {[51, 56, 61].map((x) => (
          <circle key={x} cx={x} cy={g - 8.6} r="0.9" fill={S.glass.skygge} />
        ))}
        {/* Skroget: hvitt med marineblå stripe, mørkere under vannlinja. */}
        <path d={`M30 ${g - 7} L88 ${g - 7} Q86.6 ${g - 2} 83.4 ${g} L35 ${g} Q31.4 ${g - 2.4} 30 ${g - 7} Z`} fill={S.hvit.flate} />
        <path d={`M30.4 ${g - 6} L87.6 ${g - 6} L87.2 ${g - 4.6} L30.8 ${g - 4.6} Z`} fill={S.marine.flate} />
        <path d={`M31.6 ${g - 3} L86.6 ${g - 3} Q85.4 ${g - 1} 83.4 ${g} L35 ${g} Q32.6 ${g - 1.2} 31.6 ${g - 3} Z`} fill={S.hvit.skygge} />
        <rect x="34" y={g - 0.8} width="50" height="1.2" rx="0.6" fill={S.vin.skygge} />
        <rect x="29.6" y={g - 7.6} width="58.8" height="0.9" rx="0.45" fill={S.treverk.lys} />
      </g>
    </Lerret>
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

/** En bedrift i den nye stilen: 96 × 96 på et `Lerret`. */
const bedriftNy =
  (b: B): Tegning =>
  ({ størrelse = 48, trinn, forbedringer }) => <Lerret størrelse={størrelse}>{b(trinn, forbedringer)}</Lerret>

const ILLUSTRASJONER: Record<string, Tegning> = {
  saftbod: bedriftNy(saftbod),
  polsebod: bedriftNy(polsebod),
  gatekjokken: bedriftNy(gatekjokken),
  kiosk: bedriftNy(kiosk),
  kafe: bedriftNy(kafe),
  restaurant: bedriftNy(restaurant),
  hotell: bedriftNy(hotell),
  bank: bedriftNy(bank),
  oljeselskap: bedriftNy(oljeselskap),
  rederi: bedriftNy(rederi),
  fiskeoppdrett: bedriftNy(fiskeoppdrett),
  flyselskap: bedriftNy(flyselskap),
  skisenter: bedriftNy(skisenter),
  hybel: Hybel,
  leilighet: Leilighet,
  rekkehus: Rekkehus,
  hytte: Hytte,
  // De samme byggene i flere byer (Pakke 44) bruker samme tegning.
  'hybel-trondheim': Hybel,
  'hybel-oslo': Hybel,
  'leilighet-bergen': Leilighet,
  'leilighet-trondheim': Leilighet,
  'rekkehus-bergen': Rekkehus,
  'hytte-trysil': Hytte,
  'hytte-lofoten': Hytte,
  'kontorbygg-stavanger': Kontorbygg,
  'marbella-leilighet': Ferieleilighet,
  'marbella-hotell': Strandhotell,
  'zermatt-leilighet': Skileilighet,
  'zermatt-hotell': Alpehotell,
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

/**
 * Tegningene som er tegnet i den nye stilen (G1). Listen vokser til den dekker alt.
 * Byversjonene deler tegning med grunnbygget til G5 gir dem sine egne.
 */
export const NY_STIL = ['kiosk', 'hytte', 'hytte-trysil', 'hytte-lofoten', 'kontorbygg', 'kontorbygg-stavanger', 'superbil', 'seilbaat', 'saftbod', 'polsebod', 'gatekjokken', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter']

/** Bedriftene, som har fire vekstrinn. */
export const BEDRIFTSTEGNINGER = ['saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter']

/**
 * Illustrasjonen for en bedrift, eiendom eller luksusgjenstand, etter id.
 * Bedrifter vokser med `trinn` og viser `forbedringer` (0–3) som detaljer.
 * Med `utklipp` kommer tegningene i den nye stilen uten himmel, bakke og
 * bakgrunn, til steder som har sin egen scene rundt.
 */
export const Illustrasjon = memo(function Illustrasjon({
  id,
  størrelse = 44,
  trinn = 0,
  forbedringer = 0,
  utklipp = false,
}: {
  id: string
  størrelse?: number
  trinn?: Trinn
  forbedringer?: number
  utklipp?: boolean
}) {
  const Tegning = ILLUSTRASJONER[id]
  return Tegning ? <Utklipp.Provider value={utklipp}>{Tegning({ størrelse, trinn, forbedringer })}</Utklipp.Provider> : null
})
