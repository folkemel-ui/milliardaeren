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
 * spilleren har bedt om mindre bevegelse — se styles.css.
 *
 * Historie: til og med G8 sto noen tegninger i den gamle stilen (48 × 48,
 * paletten `F`, én `Grunn`, flate former sett fra siden). G9 tegnet de ti siste
 * om, og den gamle stilen er borte. Alle tegninger står i `NY_STIL`.
 */

import { memo, useContext, type ReactNode } from 'react'
import { r2, Blinklys, IScenen, Lakksveip, tennesOmNatta, Naerbilde, Bakke, Bunnfade, Dis, GRUNNLINJE, HORISONT, Utklipp, Kantfade, Kloss, Lampe, Lerret, Person as Figur, Plakett, S, Saltak, Slagskygge, Speiling, Bunnskygge, Glans, Tre, Vindusrad, inn, maal, pkt, type Materiale } from './Tegnestil'

type P = { størrelse?: number }
/** Hvor langt en bedrift har vokst: 0 ved nivå 1, 1 ved 25, 2 ved 50, 3 ved 100. */
export type Trinn = 0 | 1 | 2 | 3

export function trinnFor(nivaa: number | undefined): Trinn {
  if (!nivaa) return 0
  return nivaa >= 100 ? 3 : nivaa >= 50 ? 2 : nivaa >= 25 ? 1 : 0
}

// ─────────────────────────────────────────────── Felles byggeklosser

/** En bedriftstegning: vekstrinnet og hvor mange forbedringer som er kjøpt (0–3). */
type B = (trinn: Trinn, f: number) => ReactNode

// ─────────────────────────────────────────────── Bedrifter

/**
 * Saftboden (nær avstand): et bord med pappskilt på nivå 1, en ordentlig bod
 * med stripet markise fra 25, en fløy med parasoll og kunder ved 50, og ved
 * 100 hvitmalt disk med messingkant, lyslenke og et sitrontre. Forbedringene:
 * saftpresse på disken, isboks med isbiter og en grønn sukkerfri dunk med vimpel.
 * I scenen vipper skiltet på bordet og kappa på markisen i vinden (G10).
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
          <path className="anim-duve" d={`M16 39 ${Array.from({ length: 8 }, (_, i) => `Q${19.5 + i * 7} 42.4 ${23 + i * 7} 39`).join(' ')} Z`} fill={S.oker.skygge} />
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
            <g className="anim-duve">
            <rect x="37" y="73" width="18" height="9.6" rx="0.6" fill={S.hvit.flate} />
            <circle cx="42" cy="77.8" r="2.8" fill={S.oker.lys} />
            <circle cx="42" cy="77.8" r="2" fill={S.oker.flate} opacity="0.5" />
            <path d="M42 75.8 V79.8 M40 77.8 H44" stroke={S.hvit.lys} strokeWidth="0.35" />
            <rect x="46" y="75.6" width="7" height="1" rx="0.5" fill={S.treverk.flate} />
            <rect x="46" y="78" width="5" height="1" rx="0.5" fill={S.treverk.flate} />
            </g>
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
 * stål, en stor sennepsflaske med skilt, og food trucken parkert bak. I
 * scenen damper pølsene på disken (G10).
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
      {/* På disken: pølser i brød, med damp (G10). */}
      {polse(disk.x + 13, disk.y - 2.2)}
      <path className="anim-damp" d={`M${disk.x + 15} ${disk.y - 3.2} q-1 -1.4 0 -2.8 q1 -1.4 0 -2.8`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
      <path className="anim-damp sen" d={`M${disk.x + 17.6} ${disk.y - 3.2} q-1 -1.4 0 -2.8 q1 -1.4 0 -2.8`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
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

// ─────────────────────────────────────────────── Eiendom

// ─────────────────────────────────────────────── Boligene i ny stil (G5)

/**
 * Et vindu med karm; `lys` gir varmt lys inne, `sprosse` deler det i fire.
 * Om natta, i scenen, tennes de fleste mørke vinduene (`nattvindu`), og med
 * `tennes` slås lyset av og på i dette vinduet med jevne mellomrom (G10).
 */
function Vindu({ x, y, b, h, karm = S.hvit.lys, lys = false, sprosse = true, tennes = false }: { x: number; y: number; b: number; h: number; karm?: string; lys?: boolean; sprosse?: boolean; tennes?: boolean }) {
  const iScenen = useContext(IScenen)
  const k = Math.max(0.4, +(b * 0.12).toFixed(2))
  const ib = +(b - 2 * k).toFixed(2)
  const ih = +(h - 2 * k).toFixed(2)
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} fill={karm} />
      <rect x={+(x + k).toFixed(2)} y={+(y + k).toFixed(2)} width={ib} height={ih} fill={lys ? S.vinduLys.flate : S.glass.skygge} className={!lys && tennesOmNatta(x, y) ? 'nattvindu' : undefined} />
      {!lys && <rect x={+(x + k).toFixed(2)} y={+(y + k).toFixed(2)} width={+(ib * 0.45).toFixed(2)} height={ih} fill={S.glass.flate} opacity="0.5" className="nattskjul" />}
      {tennes && iScenen && !lys && <rect className="anim-vindu" x={+(x + k).toFixed(2)} y={+(y + k).toFixed(2)} width={ib} height={ih} fill={S.vinduLys.flate} />}
      {sprosse && (
        <>
          <rect x={+(x + b / 2 - k * 0.35).toFixed(2)} y={y} width={+(k * 0.7).toFixed(2)} height={h} fill={karm} />
          <rect x={x} y={+(y + h * 0.45 - k * 0.35).toFixed(2)} width={b} height={+(k * 0.7).toFixed(2)} fill={karm} />
        </>
      )}
    </g>
  )
}

/** Stående kledning: tynne linjer i skyggetonen. */
function Kledning({ x, y, b, h, farge, mellom = 2.2 }: { x: number; y: number; b: number; h: number; farge: string; mellom?: number }) {
  return (
    <g>
      {Array.from({ length: Math.floor(b / mellom) }, (_, i) => +(x + (i + 1) * mellom).toFixed(2))
        .filter((lx) => lx < x + b - 0.3)
        .map((lx) => (
          <line key={lx} x1={lx} y1={y} x2={lx} y2={y + h} stroke={farge} strokeWidth="0.3" />
        ))}
    </g>
  )
}

/**
 * Et hus med gavlen mot oss (som på Bryggen): veggen og trekantgavlen foran,
 * siden i skygge og takflaten som går bakover. Tegn husene fra venstre mot
 * høyre, så naboen dekker skyggesiden.
 */
function Gavlhus({ x, y = GRUNNLINJE, b, h, gavl, d, m, tak, children }: { x: number; y?: number; b: number; h: number; gavl: number; d: number; m: Materiale; tak: Materiale; children?: ReactNode }) {
  const v: [number, number] = [x, y - h]
  const t: [number, number] = [x + b / 2, y - h - gavl]
  const hy: [number, number] = [x + b, y - h]
  return (
    <g>
      <polygon points={pkt(t, hy, inn(...hy, d), inn(...t, d))} fill={tak.skygge} />
      <polygon points={pkt(v, t, inn(...t, d), inn(...v, d))} fill={tak.lys} />
      <polygon points={pkt([x + b, y], inn(x + b, y, d), inn(...hy, d), hy)} fill={m.skygge} />
      <rect x={x} y={y - h} width={b} height={h} fill={m.flate} />
      <polygon points={pkt(v, t, hy)} fill={m.flate} />
      <polyline points={pkt([x - 0.6, y - h + 0.4], t, [x + b + 0.6, y - h + 0.4])} fill="none" stroke={tak.flate} strokeWidth="1" strokeLinejoin="round" />
      {children}
    </g>
  )
}

/** En sykkel på gateavstand. */
function Sykkel({ x, y = GRUNNLINJE, farge = S.vin.flate }: { x: number; y?: number; farge?: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 3.4} r="3.4" fill="none" stroke={S.mork.flate} strokeWidth="0.7" />
      <circle cx={x + 10.6} cy={y - 3.4} r="3.4" fill="none" stroke={S.mork.flate} strokeWidth="0.7" />
      <path d={`M${x} ${y - 3.4} L${x + 4} ${y - 9} L${x + 9} ${y - 9} L${x + 10.6} ${y - 3.4} M${x + 4} ${y - 9} L${x + 5.6} ${y - 3.4} L${x + 9} ${y - 9} M${x + 3.4} ${y - 10.4} h2 M${x + 9} ${y - 9} l-0.6 -2 h2`} fill="none" stroke={farge} strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  )
}

/**
 * Hybelen i Bergen (gateavstand, Møhlenpris): et hvitt trehus med skifertak
 * og gavlen mot oss, og hybelen i kjelleren — egen dør ned, et lite vindu med
 * lys i og sykkelen lent mot muren. Det regner, naboen har paraply, og Ulriken
 * med masta står i dis bak. I scenen går lyset av og på i stua (G10).
 */
function Hybel({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="36,66 52,42 64,30 78,38 96,46 96,68 36,68" fill={S.fjell.flate} />
          <polygon points="64,30 78,38 70,42 62,36" fill={S.fjell.skygge} />
          <line x1="64" y1="30" x2="64" y2="16" stroke={S.hvit.flate} strokeWidth="0.8" />
          <path d="M62.6 20 H65.4 M63 24 H65" stroke={S.hvit.flate} strokeWidth="0.6" />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      <Slagskygge x1={22} x2={72} lengde={16} d={22} />
      <Tre x={11} h={48} />
      {/* Grunnmuren med kjelleren, og huset over. */}
      <Kloss x={22} b={50} h={9} d={22} m={S.stein} />
      <Kloss x={22} y={g - 9} b={50} h={27} d={22} m={S.hvit} tak={false} />
      <Kledning x={22} y={g - 36} b={50} h={27} farge={S.hvit.skygge} />
      <Saltak x={22} y={g - 36} b={50} d={22} h={18} m={S.skifer} gavl={S.hvit} />
      <rect x="21" y={g - 9.6} width="52" height="1" fill={S.hvit.skygge} />
      <Vindu x={27} y={g - 31} b={8} h={11} />
      <Vindu x={40} y={g - 31} b={8} h={11} tennes />
      <Vindu x={43} y={g - 49} b={8} h={8} />
      {/* Inngangen med trapp. */}
      <Kloss x={56} b={14} h={9} d={6} m={S.stein} />
      <rect x="59" y={g - 30} width="8.4" height="21" fill={S.faluRod.flate} />
      <rect x="59" y={g - 30} width="8.4" height="21" fill="none" stroke={S.hvit.lys} strokeWidth="0.8" />
      <circle cx="65.6" cy={g - 19} r="0.6" fill={S.gull.flate} />
      <Lampe x={70} y={g - 26} r={1.6} />
      {/* Hybelen i kjelleren: egen dør og et vindu med lys. */}
      <rect x="25" y={g - 8.4} width="6.4" height="8.4" fill={S.treMork.skygge} />
      <rect x="25" y={g - 8.4} width="6.4" height="8.4" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" />
      <Vindu x={34} y={g - 7.4} b={9} h={4.4} lys sprosse={false} />
      <Sykkel x={44} />
      {/* Naboen med paraply, og regnet. */}
      <Figur x={83} y={g + 3} avstand="gate" klaer={S.oker} vendt={-1} />
      <path d={`M75.6 ${g - 16.4} Q83 ${g - 24} 90.4 ${g - 16.4} Z`} fill={S.marine.flate} />
      <path d={`M83 ${g - 16.4} V${g - 9.6}`} stroke={S.mork.flate} strokeWidth="0.5" />
      <g opacity="0.3">
        {Array.from({ length: 18 }, (_, i) => [+((i * 37) % 92 + 3).toFixed(1), +((i * 23) % 60 + 8).toFixed(1)]).map(([x, y]) => (
          <line key={`${x}-${y}`} x1={x} y1={y} x2={x - 1.2} y2={y + 4.4} stroke={S.hvit.lys} strokeWidth="0.35" />
        ))}
      </g>
    </Lerret>
  )
}

/**
 * Hybelen i Oslo (gateavstand, Blindern): en sveitservilla i kremhvitt med
 * bratt skifertak, utskåret pynt langs gavlen og glassveranda — hybelen er
 * på loftet, med lys i gavlvinduet. T-banen går forbi på fyllingen bak. I
 * scenen glir T-banen og lyset går av og på i stua (G10).
 */
function HybelBlindern({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const m = S.puss
  const pynt = Array.from({ length: 10 }, (_, i) => i)
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 96,62 96,68 0,70" fill={S.stein.flate} />
          <g className="anim-glid">
            <path d="M2 61 L62 60 Q65 60 65.6 57 L65.6 52.4 Q65 50.4 62 50.4 L2 50.6 Z" fill={S.metall.lys} />
            <path d="M60.6 50.5 L62 50.4 Q65 50.4 65.6 52.4 L65.6 57 Q65 60 62 60 L60.6 60 Z" fill={S.marine.flate} />
            <rect className="nattvindu" x="4" y="52.6" width="54" height="3.4" fill={S.mork.flate} />
            {[16, 30, 44].map((x) => (
              <rect key={x} x={x} y="51" width="0.8" height="9" fill={S.metall.skygge} />
            ))}
          </g>
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      <Slagskygge x1={14} x2={68} lengde={16} d={20} />
      <Tre x={86} h={42} />
      {/* Glassverandaen til venstre. */}
      <Kloss x={14} b={12} h={18} d={10} m={S.hvit} />
      <rect x="15.4" y={g - 16.4} width="9.2" height="11" fill={S.vinduLys.flate} />
      {[18.4, 21.4].map((x) => (
        <rect key={x} x={x} y={g - 16.4} width="0.6" height="11" fill={S.hvit.lys} />
      ))}
      <rect x="18" y={g - 5.4} width="4.6" height="5.4" fill={S.gran.flate} />
      {/* Villaen med bratt tak og pynt i gavlen. */}
      <Kloss x={26} b={42} h={32} d={20} m={m} tak={false} />
      <Kledning x={26} y={g - 32} b={42} h={32} farge={m.skygge} mellom={1.8} />
      <rect x="25.4" y={g - 4} width="43.2" height="4" fill={S.stein.flate} />
      <Saltak x={26} y={g - 32} b={42} d={20} h={22} m={S.skifer} gavl={m} overheng={2.6} />
      {pynt.map((i) => {
        const t = i / 9
        const x1 = +(26 + t * 21).toFixed(2)
        const y1 = +(g - 32 - t * 20).toFixed(2)
        const x2 = +(68 - t * 21).toFixed(2)
        return (
          <g key={i}>
            <circle cx={x1} cy={+(y1 + 1.6).toFixed(2)} r="0.7" fill={S.gran.flate} />
            <circle cx={x2} cy={+(y1 + 1.6).toFixed(2)} r="0.7" fill={S.gran.flate} />
          </g>
        )
      })}
      <path d={`M47 ${g - 52.6} V${g - 45} M44 ${g - 48} H50`} stroke={S.gran.flate} strokeWidth="0.8" />
      <rect x="26" y={g - 32.6} width="42" height="1.2" fill={S.gran.flate} />
      <Vindu x={43.6} y={g - 44.6} b={7} h={9} lys karm={S.hvit.lys} />
      {[31, 54].map((x) => (
        <Vindu key={x} x={x} y={g - 27} b={7} h={13} karm={S.hvit.lys} tennes={x === 54} />
      ))}
      <Sykkel x={70} farge={S.marine.lys} />
    </Lerret>
  )
}

/**
 * Hybelen i Trondheim (fjern avstand, Moholt studentby): to høye studenttårn
 * i lyst massivtre med vindusrutenett og lys her og der, en lav teglblokk
 * foran, sykler, trær og studenter på vei til forelesning. I scenen går
 * lyset av og på på en hybel (G10).
 */
function HybelMoholt({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const e = maal('fjern', 'etasje')
  const tre: Materiale = { lys: S.puss.flate, flate: S.treverk.lys, skygge: S.treverk.flate }
  const tårn = (x: number, etasjer: number, start: number) => (
    <g>
      <Kloss x={x} b={18} h={etasjer * e + 2} d={14} m={tre} />
      <Kledning x={x} y={g - etasjer * e - 2} b={18} h={etasjer * e + 2} farge={tre.skygge} mellom={1.5} />
      {Array.from({ length: etasjer }, (_, k) => (
        <Vindusrad key={k} x={x + 1.8} y={g - (k + 1) * e + 1} antall={3} b={3.6} h={4.6} mellom={2.4} tent={4} start={k + start} tennes={k === 5 - start ? 1 : undefined} />
      ))}
    </g>
  )
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,62 20,52 44,56 70,48 96,54 96,68 0,68" fill={S.gran.flate} />
          <Kloss x={2} y={66} b={16} h={10} d={8} m={S.tegl} />
          <Kloss x={80} y={66} b={14} h={12} d={8} m={S.tegl} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      <Slagskygge x1={18} x2={76} lengde={20} d={16} />
      {tårn(18, 8, 0)}
      {tårn(58, 7, 2)}
      {/* Teglblokka foran. */}
      <Kloss x={30} b={36} h={3 * e} d={16} m={S.tegl} />
      {[0, 1, 2].map((k) => (
        <Vindusrad key={k} x={32.4} y={g - (k + 1) * e + 1.6} antall={6} b={3.4} h={4.2} mellom={2.4} karm={S.hvit.flate} tent={k === 1 ? 4 : 0} start={k} />
      ))}
      <rect x="45.6" y={g - 6} width="4.8" height="6" fill={S.glass.skygge} />
      <Tre x={10} h={20} />
      <Tre x={86} h={18} />
      <Figur x={28} y={g + 3} avstand="fjern" klaer={S.marine} />
      <Figur x={70} y={g + 2.4} avstand="fjern" klaer={S.vin} vendt={-1} />
      <Figur x={72.6} y={g + 3} avstand="fjern" klaer={S.oker} vendt={-1} />
      {[78, 81, 84].map((x) => (
        <g key={x}>
          <circle cx={x} cy={g + 4.6} r="0.9" fill="none" stroke={S.mork.flate} strokeWidth="0.3" />
          <circle cx={x + 2} cy={g + 4.6} r="0.9" fill="none" stroke={S.mork.flate} strokeWidth="0.3" />
        </g>
      ))}
    </Lerret>
  )
}

/**
 * Leiligheten i Oslo (fjern avstand, Grünerløkka): en okergul bygård fra
 * 1890-tallet med gesimser, kafé med markise på gateplan og mansardtak med
 * arker, lys i noen av vinduene. Den blå trikken går forbi — i scenen
 * glir den, og lyset går av og på i en leilighet (G10).
 */
function LeilighetGrunerlokka({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const e = maal('fjern', 'etasje')
  const etasjer = [1, 2, 3, 4].map((k) => g - 10 - k * e)
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <Kloss x={0} b={22} h={46} d={12} m={S.tegl} />
          <Kloss x={74} b={22} h={42} d={12} m={S.puss} />
          {[g - 40, g - 32, g - 24, g - 16].map((y) => (
            <g key={y}>
              <rect x="3" y={y} width="16" height="2.4" fill={S.tegl.skygge} />
              <rect x="77" y={y + 2} width="16" height="2.4" fill={S.puss.skygge} />
            </g>
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Slagskygge x1={20} x2={76} lengde={20} d={14} />
      <Kloss x={20} b={56} h={44} d={14} m={S.oker} tak={false} />
      {/* Gesimsene og vinduene i fire etasjer. */}
      {etasjer.map((y, i) => (
        <g key={y}>
          <rect x="19.4" y={y + e - 0.8} width="56.6" height="0.8" fill={S.oker.lys} />
          <Vindusrad x={23.6} y={y + 1.6} antall={7} b={3.2} h={4.8} mellom={4.2} karm={S.hvit.lys} tent={i === 1 ? 3 : 0} start={i} tennes={i === 2 ? 4 : undefined} />
        </g>
      ))}
      <rect x="19" y={g - 44.8} width="58" height="1.4" fill={S.oker.lys} />
      {/* Mansardtaket med arker; hybelen lyser i den ene. */}
      <polygon points={`19,${g - 44} 77,${g - 44} 74,${g - 51} 22,${g - 51}`} fill={S.skifer.flate} />
      <polygon points={`22,${g - 51} 74,${g - 51} ${inn(74, g - 51, 10).join(',')} ${inn(22, g - 51, 10).join(',')}`} fill={S.skifer.lys} />
      <polygon points={`77,${g - 44} ${inn(77, g - 44, 14).join(',')} ${inn(74, g - 51, 10).join(',')} 74,${g - 51}`} fill={S.skifer.skygge} />
      {[27, 39, 51, 63].map((x, i) => (
        <g key={x}>
          <rect x={x} y={g - 50} width="5" height="5.4" fill={S.skifer.lys} />
          <rect x={x + 1} y={g - 49} width="3" height="3.4" fill={i === 2 ? S.vinduLys.flate : S.glass.skygge} />
        </g>
      ))}
      <Kloss x={60} y={g - 51} b={3} h={5} d={3} m={S.tegl} />
      {/* Kafeen på gateplan med markise. */}
      <rect x="22" y={g - 8.6} width="52" height="8.6" fill={S.vinduLys.skygge} />
      {[30, 38, 46, 58, 66].map((x) => (
        <rect key={x} x={x} y={g - 8.6} width="0.7" height="8.6" fill={S.oker.skygge} />
      ))}
      <rect x="50" y={g - 8.6} width="5" height="8.6" fill={S.treMork.flate} />
      <polygon points={`21.4,${g - 10.4} 49.4,${g - 10.4} 48,${g - 7.6} 22.8,${g - 7.6}`} fill={S.vin.flate} />
      {[24, 28, 32, 36, 40, 44].map((x) => (
        <rect key={x} x={x} y={g - 10.4} width="2" height="2.8" fill={S.vin.lys} />
      ))}
      <Figur x={34} y={g + 2} avstand="fjern" klaer={S.marine} />
      <Figur x={37} y={g + 2.6} avstand="fjern" klaer={S.oker} vendt={-1} />
      {/* Kjøreledningen og den blå trikken. */}
      <line x1="0" y1={g - 13} x2="96" y2={g - 12} stroke={S.mork.flate} strokeWidth="0.3" />
      <path d={`M68 ${g - 12.2} L70 ${g - 9.4} L72 ${g - 12.2}`} fill="none" stroke={S.mork.flate} strokeWidth="0.4" />
      <g className="anim-glid">
        <path d={`M52 ${g + 5} L52 ${g - 6.4} Q52.4 ${g - 9} 55 ${g - 9.2} L86 ${g - 9.2} Q89.6 ${g - 9} 90.4 ${g - 5} L90.6 ${g + 5} Z`} fill={S.sjo.flate} />
        <path d={`M52 ${g + 1} L90.6 ${g + 1} L90.6 ${g + 5} L52 ${g + 5} Z`} fill={S.hvit.flate} />
        <path className="nattvindu" d={`M54 ${g - 7.4} L88.6 ${g - 7.4} L89 ${g - 3.4} L54 ${g - 3.4} Z`} fill={S.mork.flate} />
        {[60, 68, 76, 84].map((x) => (
          <rect key={x} x={x} y={g - 7.4} width="0.8" height="4" fill={S.sjo.flate} />
        ))}
        <path d={`M55 ${g - 9} L86 ${g - 9}`} stroke={S.sjo.lys} strokeWidth="0.7" />
      </g>
    </Lerret>
  )
}




/**
 * Leiligheten i Trondheim (fjern avstand, Bakklandet): bryggerekka langs
 * Nidelva — fargerike trehus på påler i elva, med speilbilder, og Gamle
 * Bybro med den røde portalen til høyre.
 */
function Bryggerekka({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const hus = [S.oker, S.faluRod, S.hvit, S.bjork, S.treverk]
  const pæl = 8
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,48 16,44 34,48 52,42 70,46 96,42 96,${HORISONT + 1}`} fill={S.gress.flate} />
          {[[10, 46], [24, 44], [44, 44], [62, 42]].map(([x, y]) => (
            <rect key={x} x={x} y={y} width="4" height="3" fill={S.puss.flate} />
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Speilbildene i elva. */}
      {hus.map((m, i) => (
        <rect key={i} x={8 + i * 14} y={g + 1.4} width="13" height="6" fill={m.flate} opacity="0.22" />
      ))}
      {/* Pålene. */}
      {hus.map((_, i) =>
        [1.4, 7, 12.6].map((dx) => <line key={`${i}-${dx}`} x1={8 + i * 14 + dx} y1={g - pæl} x2={8 + i * 14 + dx} y2={g + 1} stroke={S.treMork.skygge} strokeWidth="0.8" />),
      )}
      {hus.map((m, i) => {
        const x = 8 + i * 14
        const y = g - pæl
        const karm = m === S.hvit ? S.treMork.lys : S.hvit.lys
        return (
          <Gavlhus key={i} x={x} y={y} b={14} h={18} gavl={10} d={16} m={m} tak={S.tegl}>
            <Vindu x={x + 2.4} y={y - 15} b={3.4} h={4.2} karm={karm} lys={i === 2} />
            <Vindu x={x + 8.2} y={y - 15} b={3.4} h={4.2} karm={karm} />
            <Vindu x={x + 2.4} y={y - 8.6} b={3.4} h={4.2} karm={karm} />
            <Vindu x={x + 8.2} y={y - 8.6} b={3.4} h={4.2} karm={karm} lys={i === 4} />
            <rect x={x + 5.6} y={y - 24} width="2.8" height="4" fill={S.treMork.skygge} />
          </Gavlhus>
        )
      })}
      {/* Gamle Bybro med portalen. */}
      <rect x="78" y={g - 10} width="18" height="2" fill={S.treverk.flate} />
      {[80, 88, 95].map((x) => (
        <line key={x} x1={x} y1={g - 8} x2={x} y2={g + 1} stroke={S.treMork.skygge} strokeWidth="0.9" />
      ))}
      <path d={`M80 ${g - 10} V${g - 24} H92 V${g - 10} H90 V${g - 20} Q86 ${g - 23} 82 ${g - 20} V${g - 10} Z`} fill={S.faluRod.flate} />
      <polygon points={`79,${g - 24} 86,${g - 29} 93,${g - 24}`} fill={S.faluRod.skygge} />
    </Lerret>
  )
}

/**
 * En rekke med fem rekkehus (fjern avstand): beiset tre med pulttak, store
 * vinduer, hekk og plen foran og en bil ved den siste. `bakgrunn` setter
 * stedet bak rekka; `regn` legger på et lett bergensregn. I scenen går lyset
 * av og på i det fjerde huset (G10).
 */
function Rekkerad({ størrelse, farger, bakgrunn, regn = false }: { størrelse: number; farger: Materiale[]; bakgrunn: ReactNode; regn?: boolean }) {
  const g = GRUNNLINJE
  const e = maal('fjern', 'etasje')
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>{bakgrunn}</Dis>
      </Kantfade>
      <Bakke type="gress" />
      <Slagskygge x1={10} x2={80} lengde={14} d={12} />
      {farger.map((m, i) => {
        const x = 10 + i * 14
        return (
          <g key={i}>
            <Kloss x={x} b={14} h={2 * e + 1} d={12} m={m} />
            <polygon points={`${x - 0.4},${g - 2 * e - 1} ${x + 14.4},${g - 2 * e - 1} ${x + 14.4},${g - 2 * e - 3.6} ${x - 0.4},${g - 2 * e - 2}`} fill={S.mork.flate} />
            <Kledning x={x} y={g - 2 * e - 1} b={14} h={2 * e + 1} farge={m.skygge} mellom={1.6} />
            <Vindu x={x + 1.6} y={g - 2 * e + 1.2} b={10} h={4.6} karm={S.hvit.flate} lys={i === 1} sprosse={false} tennes={i === 3} />
            <Vindu x={x + 1.6} y={g - e + 1.4} b={5.6} h={5} karm={S.hvit.flate} sprosse={false} />
            <rect x={x + 9} y={g - 6} width="3.2" height="6" fill={S.treMork.skygge} />
            <rect x={x + 0.6} y={g + 1.2} width="9" height="2.6" rx="1.3" fill={S.gran.flate} />
            <rect x={x + 1.2} y={g + 1.2} width="7" height="1" rx="0.5" fill={S.gran.lys} />
          </g>
        )
      })}
      <path d={`M80 ${g + 4} L80 ${g + 1} L82 ${g - 1.6} L88 ${g - 1.8} L90.4 ${g + 0.6} L91 ${g + 4} Z`} fill={S.vin.flate} />
      <path d={`M82.6 ${g - 1} L87.6 ${g - 1.2} L89 ${g + 0.6} L82 ${g + 0.6} Z`} fill={S.glass.skygge} />
      <circle cx="82.6" cy={g + 4} r="1.2" fill={S.mork.flate} />
      <circle cx="88.6" cy={g + 4} r="1.2" fill={S.mork.flate} />
      <Figur x={46} y={g + 5.4} avstand="fjern" klaer={S.oker} />
      {regn && (
        <g opacity="0.3">
          {Array.from({ length: 22 }, (_, i) => [+((i * 41) % 92 + 3).toFixed(1), +((i * 29) % 64 + 6).toFixed(1)]).map(([x, y]) => (
            <line key={`${x}-${y}`} x1={x} y1={y} x2={x - 1} y2={y + 3.6} stroke={S.hvit.lys} strokeWidth="0.3" />
          ))}
        </g>
      )}
    </Lerret>
  )
}

/**
 * Rekkehuset i Stavanger (fjern avstand, Madla): lyse rekkehus i flatt
 * landskap, med Hafrsfjord og de tre sverdene på Sverd i fjell i dis bak.
 */
function Rekkehus({ størrelse = 48 }: P) {
  return (
    <Rekkerad
      størrelse={størrelse}
      farger={[S.hvit, S.puss, S.hvit, S.puss, S.hvit]}
      bakgrunn={
        <>
          <rect x="0" y="58" width="96" height="6" fill={S.sjo.lys} />
          <polygon points="0,58 30,55 60,57 96,54 96,58" fill={S.gress.flate} />
          <polygon points="66,64 70,60 84,60 88,64" fill={S.stein.flate} />
          {[[72, 22], [77, 25], [82, 20]].map(([x, h]) => (
            <g key={x}>
              <polygon points={`${x - 0.8},60 ${x - 0.8},${60 - h} ${x},${58 - h} ${x + 0.8},${60 - h} ${x + 0.8},60`} fill={S.mork.lys} />
              <rect x={x - 2.4} y={62 - h * 0.38} width="4.8" height="1" fill={S.mork.lys} />
            </g>
          ))}
        </>
      }
    />
  )
}

/**
 * Rekkehuset i Bergen (fjern avstand, Fana): rekkehus i mørkt og brunt beiset
 * tre under bratte, grønne fjellsider — i lett bergensregn.
 */
function RekkehusFana({ størrelse = 48 }: P) {
  return (
    <Rekkerad
      størrelse={størrelse}
      farger={[S.skifer, S.treverk, S.skifer, S.treverk, S.skifer]}
      regn
      bakgrunn={
        <>
          <polygon points="0,66 0,40 14,28 30,38 46,22 62,34 78,24 96,36 96,66" fill={S.gran.flate} />
          <polygon points="46,22 62,34 54,40 42,30" fill={S.gran.skygge} />
          <polygon points="0,68 20,58 40,62 60,56 96,60 96,70 0,70" fill={S.gran.skygge} />
        </>
      }
    />
  )
}

/**
 * Leiligheten i Bergen (fjern avstand, Nordnes): hvite trehus med skifertak
 * som trapper seg opp en bratt brosteinsgate, med gatelykt og fjellene i
 * dis bak. I scenen rusler en nabo i gata og lyset går av og på (G10).
 */
function LeilighetNordnes({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const hus = [
    { x: 8, y: g + 2 },
    { x: 26, y: g - 5 },
    { x: 44, y: g - 12 },
    { x: 62, y: g - 19 },
  ]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,52 12,36 28,42 44,26 60,34 76,24 96,34 96,60 0,60" fill={S.gran.flate} />
          <polygon points="44,26 60,34 52,38 42,32" fill={S.gran.skygge} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      {/* Bakken og brosteinsgata opp mot høyre. */}
      <Kantfade>
        <polygon points={`0,${g + 4} 96,${g - 24} 96,${g + 12} 0,${g + 12}`} fill={S.gress.flate} />
        <polygon points={`0,${g + 7} 96,${g - 21} 96,${g - 15} 0,${g + 12}`} fill={S.stein.flate} />
        {[8, 22, 36, 50, 64, 78, 92].map((x) => (
          <line key={x} x1={x} y1={g + 7 - x * 0.29} x2={x - 2} y2={g + 12 - x * 0.28} stroke={S.stein.skygge} strokeWidth="0.4" />
        ))}
      </Kantfade>
      {hus.map(({ x, y }, i) => (
        <g key={i}>
          <Slagskygge x1={x} x2={x + 16} y={y} lengde={8} d={12} />
          <Kloss x={x} y={y + 4} b={16} h={20} d={12} m={S.hvit} tak={false} />
          <Kledning x={x} y={y - 16} b={16} h={20} farge={S.hvit.skygge} mellom={1.4} />
          <Saltak x={x} y={y - 16} b={16} d={12} h={8} m={S.skifer} gavl={S.hvit} overheng={1} />
          <Vindu x={x + 2.4} y={y - 12.6} b={3.6} h={4.6} lys={i === 2} />
          <Vindu x={x + 10} y={y - 12.6} b={3.6} h={4.6} tennes={i === 1} />
          <Vindu x={x + 2.4} y={y - 5} b={3.6} h={4.6} />
          <rect x={x + 10.4} y={y - 4.4} width="3.4" height="6.4" fill={S.marine.flate} />
          <Vindu x={x + 6.2} y={y - 22} b={3.6} h={3.6} />
        </g>
      ))}
      <line x1="86" y1={g - 14} x2="86" y2={g - 30} stroke={S.mork.flate} strokeWidth="0.6" />
      <Lampe x={86} y={g - 30.6} r={1.4} />
      <g className="anim-glid">
        <Figur x={36} y={g + 2} avstand="fjern" klaer={S.vin} vendt={-1} />
      </g>
    </Lerret>
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
/**
 * Hytta i Trysil (gateavstand, i snøen): en moderne hytte i mørkbeiset tre
 * med glassgavl og store vinduer med lys, snø på taket, ski og staver i
 * snøen ved døra, og skibakkene med stolheis i dis bak.
 */
function HytteTrysil({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const m = S.treMork
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 10,52 24,46 40,28 56,38 70,32 96,46 96,66 0,66" fill={S.fjell.flate} />
          <polygon points="18,48 24,46 40,28 56,38 70,32 82,38 60,44 40,40 26,50" fill={S.sno.flate} />
          <path d="M40 30 Q36 44 28 62 M46 33 Q46 46 40 64 M64 35 Q60 48 56 64" fill="none" stroke={S.sno.lys} strokeWidth="2.4" />
          <line x1="32" y1="64" x2="54" y2="36" stroke={S.mork.flate} strokeWidth="0.4" />
          {[36, 42, 48].map((x) => (
            <line key={x} x1={x} y1={64 - (x - 32) * 1.27} x2={x} y2={64 - (x - 32) * 1.27 + 4} stroke={S.mork.flate} strokeWidth="0.5" />
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="sno" />
      <Slagskygge x1={24} x2={68} lengde={14} d={22} />
      <Tre x={9} h={34} slag="gran" />
      <Tre x={88} h={28} slag="gran" />
      {[[6, 61], [12, 61], [9, 69], [85.6, 66.6], [90.4, 66.6]].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="0.9" fill={S.sno.lys} />
      ))}
      {/* Hytta i mørkt tre, med snøtak. */}
      <Kloss x={24} b={44} h={24} d={22} m={m} tak={false} />
      <Kledning x={24} y={g - 24} b={44} h={24} farge={m.skygge} mellom={1.8} />
      <Saltak x={24} y={g - 24} b={44} d={22} h={17} m={S.sno} gavl={m} overheng={2.4} />
      <polygon points={`30,${g - 24.6} 46,${g - 37} 62,${g - 24.6}`} fill={S.vinduLys.flate} />
      {[38, 46, 54].map((x) => (
        <line key={x} x1={x} y1={g - 24.6} x2={x} y2={g - 24.6 - (8 - Math.abs(x - 46)) * 1.55} stroke={m.skygge} strokeWidth="0.6" />
      ))}
      <rect x="28" y={g - 21} width="22" height="16" fill={S.vinduLys.flate} />
      {[33.5, 39, 44.5].map((x) => (
        <rect key={x} x={x} y={g - 21} width="0.6" height="16" fill={m.skygge} />
      ))}
      <rect x="28" y={g - 21} width="22" height="16" fill="none" stroke={m.lys} strokeWidth="0.6" />
      <rect x="54" y={g - 21} width="8" height="21" fill={S.treverk.flate} />
      <circle cx="60.6" cy={g - 10} r="0.6" fill={S.metall.lys} />
      <Kloss x={55} y={g - 33} b={4} h={7} d={4} m={S.stein} />
      <circle className="anim-roeyk" cx="58" cy={g - 40} r="2" fill={S.hvit.flate} opacity="0.7" />
      <circle className="anim-roeyk sen" cx="60.4" cy={g - 44} r="2.6" fill={S.hvit.flate} opacity="0.45" />
      <ellipse cx="46" cy={g + 0.6} rx="24" ry="1.6" fill={S.sno.lys} />
      {/* Ski og staver i snøen. */}
      <path d={`M71 ${g + 3} L69.4 ${g - 17} M73.4 ${g + 3} L72.2 ${g - 17}`} stroke={S.vin.lys} strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M76 ${g + 3} L78 ${g - 13} M78 ${g + 3} L79.6 ${g - 12}`} stroke={S.metall.flate} strokeWidth="0.45" />
    </Lerret>
  )
}

/**
 * Rorbua i Lofoten (gateavstand, ved sjøen): en rød rorbu på påler med hvite
 * hjørnebord og vindski, brygge og færing til venstre, hjell med tørrfisk på
 * svabergene til høyre og de spisse tindene i dis bak.
 */
function Rorbu({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const m = S.faluRod
  const bunn = g - 6
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,30 8,20 14,34 22,8 30,28 38,16 48,40 58,22 66,36 76,12 86,30 96,24 96,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points="22,8 30,28 24,34 18,22" fill={S.fjell.skygge} />
          <polygon points="76,12 86,30 80,34 72,24" fill={S.fjell.skygge} />
          <path d="M22 9 L20 18 M24 12 L25 20 M76 13 L74 22 M38 17 L37 24" stroke={S.sno.lys} strokeWidth="0.8" />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <rect x="26" y={g + 1.4} width="40" height="6" fill={m.flate} opacity="0.2" />
      {/* Svabergene og hjellen med tørrfisk. */}
      <polygon points={`72,${g + 2} 78,${g - 3} 88,${g - 4} 96,${g - 2} 96,${g + 4} 74,${g + 4}`} fill={S.stein.flate} />
      <polygon points={`78,${g - 3} 88,${g - 4} 96,${g - 2} 88,${g - 2}`} fill={S.stein.lys} />
      <path d={`M79 ${g - 3} L81 ${g - 21} M93 ${g - 3} L91 ${g - 21} M80 ${g - 18} H92 M80.4 ${g - 13} H91.6`} stroke={S.treverk.skygge} strokeWidth="0.8" />
      {[82, 84.4, 86.8, 89.2].map((x) =>
        [g - 18, g - 13].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="1.2" height="4" rx="0.5" fill={S.treverk.lys} />),
      )}
      {/* Brygga og færingen. */}
      <rect x="0" y={bunn - 1.6} width="25" height="1.6" fill={S.treverk.flate} />
      {[4, 12, 20].map((x) => (
        <line key={x} x1={x} y1={bunn} x2={x} y2={g + 2} stroke={S.treMork.skygge} strokeWidth="0.8" />
      ))}
      <path d={`M3 ${g + 0.6} L20 ${g} Q19 ${g + 3} 16.6 ${g + 3.4} L6 ${g + 3.4} Q4 ${g + 2.8} 3 ${g + 0.6} Z`} fill={S.hvit.flate} />
      <path d={`M3 ${g + 0.6} L20 ${g}`} stroke={S.treverk.flate} strokeWidth="0.7" />
      {/* Pålene og rorbua. */}
      {[26, 36, 48, 58, 67].map((x) => (
        <line key={x} x1={x} y1={bunn} x2={x} y2={g + 2} stroke={S.treMork.skygge} strokeWidth="1" />
      ))}
      <Kloss x={24} y={bunn} b={44} h={22} d={20} m={m} tak={false} />
      <Kledning x={24} y={bunn - 22} b={44} h={22} farge={m.skygge} mellom={2} />
      <Saltak x={24} y={bunn - 22} b={44} d={20} h={14} m={S.treMork} gavl={m} />
      <polyline points={`22.6,${bunn - 21} 46,${bunn - 35.4} 69.4,${bunn - 21}`} fill="none" stroke={S.hvit.lys} strokeWidth="1" strokeLinejoin="round" />
      <rect x="24" y={bunn - 22} width="2" height="22" fill={S.hvit.lys} />
      <rect x="66" y={bunn - 22} width="2" height="22" fill={S.hvit.flate} />
      <Vindu x={30} y={bunn - 17} b={7} h={8} />
      <Vindu x={55} y={bunn - 17} b={7} h={8} lys />
      <Vindu x={43} y={bunn - 32} b={6} h={6} />
      <rect x="43" y={bunn - 17} width="7" height="17" fill={S.hvit.flate} />
      <rect x="43" y={bunn - 17} width="7" height="17" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" />
    </Lerret>
  )
}

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

/**
 * Kontorbygget i Stavanger (fjern avstand, Forus): et moderne kontorbygg i
 * glass med trelameller i næringsparken der oljeselskapene holder til, med
 * parkeringsplass, flaggstenger, nabobygg i dis og et fly på vei opp fra Sola.
 */
function KontorbyggStavanger({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const e = maal('fjern', 'etasje')
  const biler = [S.vin, S.metall, S.marine, S.hvit, S.mork, S.metall, S.oker]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,62 30,58 60,60 96,56 96,68 0,68" fill={S.gress.flate} />
          <Kloss x={2} y={66} b={18} h={22} d={10} m={S.stein} />
          <Kloss x={80} y={66} b={14} h={28} d={10} m={S.glass} />
          <g transform="rotate(-12 74 22)">
            <Passasjerfly x={62} gy={24} L={24} slag="jet" hale={S.vin.flate} />
          </g>
        </Dis>
      </Kantfade>
      <Bakke type="asfalt" />
      <Slagskygge x1={30} x2={80} lengde={14} d={16} />
      <Kloss x={30} b={50} h={44} d={16} m={S.glass} />
      {Array.from({ length: 5 }, (_, k) => g - (k + 1) * e - 4).map((y, k) => (
        <g key={y}>
          <rect x="30" y={y} width="50" height="1" fill={S.stein.lys} />
          {[2, 4].includes(k) && <rect x={34 + k * 6} y={y + 1.6} width="8" height={e - 2.2} fill={S.vinduLys.flate} opacity="0.8" />}
        </g>
      ))}
      {Array.from({ length: 12 }, (_, i) => +(31.6 + i * 4.1).toFixed(1)).map((x) => (
        <rect key={x} x={x} y={g - 44} width="1.2" height="36" fill={S.treverk.flate} />
      ))}
      <rect x="30" y={g - 8} width="50" height="8" fill={S.vinduLys.skygge} />
      <Glans points={`32,${g - 42} 40,${g - 42} 34,${g - 10} 32,${g - 10}`} />
      {/* Flaggstengene og parkeringsplassen. */}
      {[22, 25].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={g + 1} x2={x} y2={g - 16} stroke={S.hvit.lys} strokeWidth="0.4" />
          <polygon className="anim-flagg" points={`${x + 0.2},${g - 16} ${x + 3.4},${g - 15.2} ${x + 0.2},${g - 14.4}`} fill={i ? S.marine.lys : S.faluRod.lys} />
        </g>
      ))}
      {biler.map((m, i) => {
        const x = 18 + i * 9.6
        return (
          <g key={i}>
            <line x1={x - 1.4} y1={g + 3} x2={x - 2.6} y2={g + 8.6} stroke={S.hvit.flate} strokeWidth="0.4" opacity="0.7" />
            <rect x={x} y={g + 4} width="6.6" height="3" rx="1" fill={m.flate} />
            <rect x={x + 1.4} y={g + 3} width="3.8" height="1.6" rx="0.6" fill={m.lys} />
          </g>
        )
      })}
      <Figur x={27} y={g + 1} avstand="fjern" klaer={S.marine} />
      <Figur x={84} y={g + 1.6} avstand="fjern" klaer={S.oker} vendt={-1} />
    </Lerret>
  )
}

/**
 * Kjøpesenteret i Trondheim (fjern avstand): et stort, lavt senter med et
 * høyt glassatrium over hovedinngangen, skiltmast med logo, et parkeringshus
 * ved siden av, en full parkeringsplass foran med folk og handlevogner, og
 * Nidarosdomen med det grønne kobberspiret i dis bak. I scenen går folk over
 * plassen og lyset på skiltmasta blinker (G10).
 */
function Kjopesenter({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 8
  const biler = [S.vin, S.metall, S.marine, S.hvit, S.mork, S.petrol, S.oker, S.metall, S.hvit]
  const pose = (x: number, y: number) => (
    <g>
      <rect x={x} y={y} width="2.8" height="2.4" rx="0.3" fill={S.hvit.lys} />
      <path d={`M${+(x + 0.8).toFixed(1)} ${y} V${+(y - 0.6).toFixed(1)} Q${+(x + 1.4).toFixed(1)} ${+(y - 1.3).toFixed(1)} ${+(x + 2).toFixed(1)} ${+(y - 0.6).toFixed(1)} V${y}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.4" />
    </g>
  )
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 18,56 40,60 62,54 80,58 96,55 96,70 0,70" fill={S.gran.skygge} />
          {/* Nidarosdomen: skipet, vesttårnene og kobberspiret. */}
          <rect x="16" y="50" width="16" height="12" fill={S.stein.flate} />
          <polygon points="15,50 24,45 33,50" fill={S.skifer.flate} />
          <rect x="11" y="46" width="2.6" height="16" fill={S.stein.flate} />
          <rect x="14.2" y="46" width="2.6" height="16" fill={S.stein.flate} />
          <polygon points="10.8,46 12.3,42 13.8,46" fill={S.petrol.flate} />
          <polygon points="14,46 15.5,42 17,46" fill={S.petrol.flate} />
          <rect x="25" y="40" width="3" height="10" fill={S.stein.flate} />
          <polygon points="24.8,40 26.5,30 28.2,40" fill={S.petrol.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="asfalt" />
      {/* Senteret: lang fasade med butikkvinduer og teknikk på taket. */}
      <Slagskygge x1={8} x2={86} y={fot} lengde={16} d={18} />
      <Kloss x={8} y={fot} b={62} h={18} d={18} m={S.puss} />
      <Kloss x={16} y={fot - 18} b={6} h={2.4} d={5} m={S.metall} />
      <Kloss x={56} y={fot - 18} b={8} h={2.4} d={5} m={S.metall} />
      <rect x="8" y={fot - 18} width="62" height="3" fill={S.skifer.flate} />
      {[16, 24, 52, 60].map((x) => (
        <rect key={x} x={x} y={fot - 15} width="0.5" height="15" fill={S.puss.skygge} />
      ))}
      <rect x="10" y={fot - 8} width="16" height="6" fill={S.vinduLys.skygge} />
      <rect x="50" y={fot - 8} width="18" height="6" fill={S.vinduLys.skygge} />
      {/* Parkeringshuset. */}
      <Kloss x={72} y={fot} b={14} h={20} d={10} m={S.stein} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <rect x="72" y={+(fot - 4.4 - k * 5).toFixed(1)} width="14" height="2.4" fill={S.mork.flate} />
          <rect x={74 + (k % 2) * 6} y={+(fot - 3.6 - k * 5).toFixed(1)} width="3" height="1.4" rx="0.4" fill={[S.vin, S.metall, S.marine, S.hvit][k].flate} />
        </g>
      ))}
      {/* Glassatriet over inngangen, med logoen. */}
      <Kloss x={28} y={fot} b={20} h={26} d={10} m={S.glass} />
      {[32, 36, 40, 44].map((x) => (
        <rect key={x} x={x} y={fot - 26} width="0.4" height="26" fill={S.glass.lys} opacity="0.7" />
      ))}
      {[fot - 21, fot - 16, fot - 11].map((y) => (
        <rect key={y} x="28" y={y} width="20" height="0.4" fill={S.glass.lys} opacity="0.7" />
      ))}
      <rect x="33" y={fot - 15.6} width="10" height="4" fill={S.vinduLys.flate} opacity="0.55" />
      <Glans points={`28,${fot - 26} 36,${fot - 26} 30,${fot - 4} 28,${fot - 4}`} />
      <rect x="33" y={fot - 24.6} width="10" height="4.4" rx="0.6" fill={S.vin.flate} />
      {pose(36.6, fot - 23.6)}
      <rect x="29" y={fot - 7.4} width="18" height="1.4" fill={S.skifer.skygge} />
      <rect x="33" y={fot - 6} width="10" height="6" fill={S.vinduLys.flate} opacity="0.8" />
      {/* Skiltmasta. */}
      <rect x="2.4" y={g - 34} width="4.4" height="32" fill={S.skifer.flate} />
      <rect x="5.4" y={g - 34} width="1.4" height="32" fill={S.skifer.skygge} />
      <rect x="2.4" y={g - 33} width="4.4" height="6" fill={S.vin.flate} />
      {pose(3.2, g - 31.4)}
      <Blinklys x={4.6} y={g - 34.8} r={0.8} />
      {/* Parkeringsplassen, folk og handlevogner. */}
      {biler.map((m, i) => {
        const rad = i % 2
        const x = +(12 + i * 8.6).toFixed(1)
        return (
          <g key={i}>
            <rect x={x} y={g + 1 + rad * 5} width="6.6" height="3" rx="1" fill={m.flate} />
            <rect x={+(x + 1.4).toFixed(1)} y={g + rad * 5} width="3.8" height="1.6" rx="0.6" fill={m.lys} />
          </g>
        )
      })}
      <g className="anim-glid">
        <Figur x={22} y={g - 2} avstand="fjern" klaer={S.marine} />
      </g>
      <Figur x={58} y={g - 1.4} avstand="fjern" klaer={S.vin} vendt={-1} />
      <g className="anim-glid sen">
        <Figur x={64} y={g - 2} avstand="fjern" klaer={S.oker} />
      </g>
      {[24.4, 60].map((x) => (
        <g key={x}>
          <rect x={x} y={g - 4.4} width="2.6" height="1.8" fill="none" stroke={S.metall.lys} strokeWidth="0.3" />
          <line x1={r2(x + 0.4)} y1={g - 2.6} x2={r2(x + 0.4)} y2={g - 2} stroke={S.metall.lys} strokeWidth="0.3" />
          <line x1={r2(x + 2.2)} y1={g - 2.6} x2={r2(x + 2.2)} y2={g - 2} stroke={S.metall.lys} strokeWidth="0.3" />
        </g>
      ))}
    </Lerret>
  )
}

/**
 * Næringsbygget på Aker Brygge (fjern avstand, sett fra fjorden): et nytt
 * kontorbygg i glass og hvite rammer med skrått tak ved siden av den gamle
 * verkstedhallen i tegl fra skipsverftet, kaipromenaden med parasoller og
 * folk, båter fortøyd foran og Nesodden i dis på andre siden av fjorden.
 */
function Naeringsbygg({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const kai = g - 4
  const e = maal('fjern', 'etasje')
  const lav = kai - 44
  const hoy = kai - 50
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,52 20,50 50,53 80,49 96,51 96,${HORISONT + 1}`} fill={S.gran.skygge} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Kaia: promenaden og kaimuren ned i sjøen. */}
      <Kantfade>
        <rect x="0" y={kai - 2.4} width="96" height="2.4" fill={S.stein.lys} />
        <rect x="0" y={kai} width="96" height="5" fill={S.stein.flate} />
        <rect x="0" y={kai + 5} width="96" height="0.8" fill={S.stein.skygge} />
        <rect x="0" y={kai + 5.8} width="96" height="3" fill={S.stein.skygge} opacity="0.25" />
      </Kantfade>
      {/* Den gamle verkstedhallen i tegl, med gavlen mot sjøen. */}
      <Kloss x={4} y={kai - 2} b={28} h={18} d={12} m={S.tegl} tak={false} />
      <Saltak x={4} y={kai - 20} b={28} d={12} h={9} m={S.skifer} gavl={S.tegl} />
      <path d={`M10 ${kai - 8} V${kai - 15} Q18 ${kai - 22} 26 ${kai - 15} V${kai - 8} Z`} fill={S.glass.skygge} />
      <path d={`M14 ${kai - 8} V${kai - 18.6} M18 ${kai - 8} V${kai - 19.6} M22 ${kai - 8} V${kai - 18.6} M10 ${kai - 12} H26 M10 ${kai - 15.6} H26`} stroke={S.tegl.skygge} strokeWidth="0.5" />
      <rect x="6" y={kai - 6.6} width="24" height="4.6" fill={S.vinduLys.skygge} />
      {[12, 18, 24].map((x) => (
        <rect key={x} x={x} y={kai - 6.6} width="0.8" height="4.6" fill={S.tegl.skygge} />
      ))}
      {/* Det nye kontorbygget med skrått tak. */}
      <Slagskygge x1={40} x2={74} y={kai - 2} lengde={10} d={14} />
      <polygon points={pkt([74, kai - 2], inn(74, kai - 2, 14), inn(74, hoy, 14), [74, hoy])} fill={S.hvit.skygge} />
      <polygon points={pkt([40, lav], [74, hoy], inn(74, hoy, 14), inn(40, lav, 14))} fill={S.metall.flate} />
      <polygon points={pkt([40, kai - 2], [74, kai - 2], [74, hoy], [40, lav])} fill={S.hvit.flate} />
      {Array.from({ length: 5 }, (_, k) => +(kai - 2 - (k + 1) * e + 1.6).toFixed(1)).map((y, k) => (
        <g key={y}>
          <rect x="42" y={y} width="30" height={e - 3} fill={S.glass.skygge} />
          <rect x="42" y={y} width="12" height={e - 3} fill={S.glass.flate} opacity="0.5" />
          {k % 2 === 1 && <rect x={50 + k * 3} y={y} width="6" height={e - 3} fill={S.vinduLys.flate} opacity="0.8" />}
          {[47, 52, 57, 62, 67].map((x) => (
            <rect key={x} x={x} y={y} width="0.6" height={e - 3} fill={S.hvit.flate} />
          ))}
        </g>
      ))}
      <rect x="42" y={kai - 6} width="30" height="4" fill={S.vinduLys.skygge} />
      <Glans points={`42,${kai - 40} 50,${kai - 41.4} 44,${kai - 8} 42,${kai - 8}`} />
      {/* Promenaden: parasoller, folk, et tre og en flaggstang. */}
      {[9, 17, 25].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={kai - 2.4} x2={x} y2={kai - 5.4} stroke={S.mork.lys} strokeWidth="0.3" />
          <polygon points={pkt([x - 2.6, kai - 5], [x, kai - 6.6], [x + 2.6, kai - 5])} fill={i === 1 ? S.oker.flate : S.hvit.lys} />
        </g>
      ))}
      <Tre x={80} y={kai - 2} h={11} />
      <line x1="88" y1={kai - 2} x2="88" y2={kai - 20} stroke={S.hvit.lys} strokeWidth="0.4" />
      <polygon className="anim-flagg" points={`88.2,${kai - 20} 91.6,${kai - 19.2} 88.2,${kai - 18.4}`} fill={S.faluRod.lys} />
      <Figur x={34} y={kai - 1.6} avstand="fjern" klaer={S.marine} />
      <Figur x={37} y={kai - 1.4} avstand="fjern" klaer={S.oker} vendt={-1} />
      <Figur x={76} y={kai - 1.6} avstand="fjern" klaer={S.vin} />
      {/* Båtene ved kaia. */}
      <path d={`M14 ${g + 2.6} L28 ${g + 2.4} Q27 ${g + 4.6} 25.4 ${g + 4.8} L16 ${g + 4.8} Q14.6 ${g + 4.2} 14 ${g + 2.6} Z`} fill={S.hvit.flate} />
      <rect x="19" y={g + 0.8} width="4.4" height="1.8" rx="0.4" fill={S.glass.skygge} />
      <path d={`M48 ${g + 2.6} L62 ${g + 2.4} Q61 ${g + 4.6} 59.4 ${g + 4.8} L50 ${g + 4.8} Q48.6 ${g + 4.2} 48 ${g + 2.6} Z`} fill={S.hvit.flate} />
      <line x1="55" y1={g + 2.5} x2="55" y2={kai - 30} stroke={S.mork.lys} strokeWidth="0.4" />
      <line x1="55" y1={kai - 30} x2="48" y2={g + 2.4} stroke={S.mork.lys} strokeWidth="0.2" />
      <polyline className="anim-boelge" points={`30,${g + 8} 34,${g + 6.8} 38,${g + 8}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.7" strokeLinecap="round" />
    </Lerret>
  )
}

/**
 * Den private øya i Lofoten (fjern avstand, til havs): ei lav, grønn øy med
 * svaberg og en kolle, en moderne villa i mørkt tre med glassfront og varmt
 * lys, et rødt naust med brygge og motorbåt, flaggstang, og Lofotveggen i dis bak.
 */
function Oy({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const v = g - 12
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,40 6,34 12,42 20,22 28,38 36,30 44,44 54,26 62,18 70,34 78,28 86,40 96,32 96,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points="20,22 28,38 22,42 16,32" fill={S.fjell.skygge} />
          <polygon points="62,18 70,34 64,40 58,28" fill={S.fjell.skygge} />
          <path d="M20 23 L18.6 30 M62 19 L60.4 27 M64 22 L65 29 M54 27 L53 33" stroke={S.sno.lys} strokeWidth="0.8" />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <polygon points={pkt([12, g + 5], [84, g + 5], [76, g + 9], [22, g + 9])} fill={S.gress.skygge} opacity="0.18" />
      {/* Svabergene langs sjøen og øya, med en kolle til venstre. */}
      <polygon points={pkt([3, g + 3], [10, g - 2], [84, g - 4], [93, g + 3.4], [86, g + 5], [70, g + 4.2], [56, g + 5.2], [40, g + 4.4], [24, g + 5.4], [10, g + 4.6])} fill={S.stein.flate} />
      <polygon points={pkt([10, g - 2], [84, g - 4], [86, g - 2], [12, g])} fill={S.stein.lys} />
      <polygon points={pkt([10, g - 2], [14, g - 12], [21, g - 21], [27, g - 24], [34, g - 19], [41, g - 13], [66, g - 12], [78, g - 8], [84, g - 4])} fill={S.gress.flate} />
      <polygon points={pkt([14, g - 12], [21, g - 21], [27, g - 24], [25, g - 13], [18, g - 6])} fill={S.gress.lys} />
      <polygon points={pkt([27, g - 24], [34, g - 19], [41, g - 13], [32, g - 9], [25, g - 13])} fill={S.gress.skygge} />
      {[
        [19, g - 9, 2.2],
        [30, g - 17, 1.6],
        [72, g - 7, 1.8],
      ].map(([x, y, r]) => (
        <ellipse key={x} cx={x} cy={y} rx={r} ry={+(r * 0.6).toFixed(2)} fill={S.stein.lys} />
      ))}
      <Tre x={14} y={g - 7} h={9} />
      <Tre x={67} y={g - 10} h={8} />
      {/* Villaen: mørkt tre og glass nede, et hvitt volum trukket inn oppå. */}
      <Slagskygge x1={42} x2={64} y={v} lengde={10} d={10} />
      <Kloss x={42} y={v} b={22} h={7} d={10} m={S.treMork} />
      <rect x="44" y={v - 6} width="18" height="5.4" fill={S.vinduLys.skygge} />
      <rect x="53.4" y={v - 5.6} width="4.2" height="4.8" fill={S.vinduLys.flate} opacity="0.85" />
      {[48.5, 53, 57.5].map((x) => (
        <rect key={x} x={x} y={v - 6} width="0.5" height="5.4" fill={S.treMork.skygge} />
      ))}
      <Glans points={`44,${v - 6} 48,${v - 6} 45.4,${v - 0.6} 44,${v - 0.6}`} />
      <Kloss x={47} y={v - 7} b={13} h={4.6} d={7} m={S.hvit} />
      <rect x="48.4" y={v - 10.8} width="10" height="3" fill={S.glass.skygge} />
      <rect x="48.4" y={v - 10.8} width="4" height="3" fill={S.glass.flate} opacity="0.6" />
      {/* Flaggstanga på kollen. */}
      <line x1="38" y1={g - 15} x2="38" y2={g - 29} stroke={S.hvit.lys} strokeWidth="0.4" />
      <polygon className="anim-flagg" points={`38.2,${g - 29} 41.6,${g - 28.2} 38.2,${g - 27.4}`} fill={S.faluRod.lys} />
      {/* Naustet, brygga og motorbåten. */}
      <Kloss x={70} y={g - 5} b={8} h={5} d={6} m={S.faluRod} tak={false} />
      <Saltak x={70} y={g - 10} b={8} d={6} h={3.6} m={S.skifer} gavl={S.faluRod} overheng={1} />
      <rect x="72.6" y={g - 8.6} width="2.8" height="3.6" fill={S.faluRod.skygge} />
      <rect x="76" y={g - 4.4} width="18" height="1.2" fill={S.treverk.flate} />
      {[80, 86, 92].map((x) => (
        <line key={x} x1={x} y1={g - 3.2} x2={x} y2={g + 1} stroke={S.treMork.skygge} strokeWidth="0.6" />
      ))}
      <path d={`M80 ${g - 1.6} L92 ${g - 1.8} Q91.4 ${g + 0.6} 89.6 ${g + 0.8} L82 ${g + 0.8} Q80.6 ${g + 0.2} 80 ${g - 1.6} Z`} fill={S.hvit.flate} />
      <line x1="80.4" y1={g - 0.6} x2="91.6" y2={g - 0.8} stroke={S.marine.flate} strokeWidth="0.5" />
      <rect x="84" y={g - 3.4} width="3.6" height="1.8" rx="0.4" fill={S.glass.skygge} />
      <polyline className="anim-boelge" points={`80,${g + 2.4} 84,${g + 1.6} 88,${g + 2.4}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.6" strokeLinecap="round" />
      <Figur x={78} y={g - 4.2} avstand="fjern" klaer={S.marine} />
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Jord og skog

/**
 * Et langt hus med mønet langs fronten: veggen foran, takflaten skrått
 * bakover og gavlen til høyre i skygge. Til låver og våningshus.
 */
function Langhus({ x, y = GRUNNLINJE, b, h, d, m, tak, takH }: { x: number; y?: number; b: number; h: number; d: number; m: Materiale; tak: Materiale; takH: number }) {
  const e = y - h
  return (
    <g>
      <Kloss x={x} y={y} b={b} h={h} d={d} m={m} tak={false} />
      <polygon points={pkt([x + b, e], inn(x + b, e, d), inn(x + b, e - takH, d / 2))} fill={m.skygge} />
      <polygon points={pkt([x - 1, e + 0.5], [x + b + 1, e + 0.5], inn(x + b + 1, e - takH, d / 2), inn(x - 1, e - takH, d / 2))} fill={tak.flate} />
      <line x1={inn(x - 1, e - takH, d / 2)[0]} y1={inn(x - 1, e - takH, d / 2)[1]} x2={inn(x + b + 1, e - takH, d / 2)[0]} y2={inn(x + b + 1, e - takH, d / 2)[1]} stroke={tak.lys} strokeWidth="0.6" />
    </g>
  )
}

/**
 * Gården på Hedmarken (fjern avstand): en stor rød låve med hvite detaljer
 * og låvebru, hvitt våningshus med trær rundt, en silo, gule kornåkre foran
 * og Mjøsa med åsene i dis bak. I scenen ryker det fra pipa og lyset går av og
 * på i stua (G10).
 */
function GardHedmarken({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT - 4} 20,${HORISONT - 10} 40,${HORISONT - 7} 64,${HORISONT - 12} 96,${HORISONT - 8} 96,${HORISONT} 0,${HORISONT}`} fill={S.fjell.flate} />
          <rect x="0" y={HORISONT - 2} width="96" height="6" fill={S.sjo.lys} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      {/* Kornåkrene foran. */}
      <Kantfade>
        <polygon points={`0,${g + 3} 96,${g + 1} 96,${g + 12} 0,${g + 12}`} fill={S.oker.lys} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" y1={g + 5 + i * 2.2} x2="96" y2={g + 3 + i * 2.4} stroke={S.oker.flate} strokeWidth="0.6" />
        ))}
      </Kantfade>
      <Slagskygge x1={14} x2={82} lengde={14} d={18} />
      <Tre x={10} h={20} />
      <Tre x={36} h={18} />
      {/* Våningshuset. */}
      <Langhus x={14} b={20} h={10} d={12} m={S.hvit} tak={S.skifer} takH={6} />
      {/* Pipa med røyk (G10). */}
      <rect x="27" y={g - 19.4} width="1.8" height="5" fill={S.tegl.flate} />
      <circle className="anim-roeyk" cx="28.4" cy={g - 21.6} r="1.2" fill={S.hvit.flate} opacity="0.6" />
      <circle className="anim-roeyk sen" cx="29.8" cy={g - 24.4} r="1.6" fill={S.hvit.flate} opacity="0.4" />
      {[16.6, 21.6, 26.6].map((x) => (
        <Vindu key={x} x={x} y={g - 8} b={2.6} h={3.4} sprosse={false} tennes={x === 21.6} />
      ))}
      <rect x="31" y={g - 5.4} width="2" height="5.4" fill={S.treMork.flate} />
      {/* Siloen og låven med låvebrua. */}
      <rect x="38" y={g - 22} width="5" height="22" fill={S.stein.flate} />
      <rect x="41.6" y={g - 22} width="1.4" height="22" fill={S.stein.skygge} />
      <path d={`M38 ${g - 22} Q40.5 ${g - 25.4} 43 ${g - 22} Z`} fill={S.stein.lys} />
      <Langhus x={46} b={36} h={14} d={18} m={S.faluRod} tak={S.skifer} takH={10} />
      <rect x="46" y={g - 14} width="1.2" height="14" fill={S.hvit.lys} />
      <rect x="80.8" y={g - 14} width="1.2" height="14" fill={S.hvit.flate} />
      <rect x="57" y={g - 10} width="9" height="10" fill={S.faluRod.skygge} />
      <path d={`M57 ${g - 10} L66 ${g} M66 ${g - 10} L57 ${g} M57 ${g - 10} H66 V${g} H57 Z`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" />
      {[49, 70, 75].map((x) => (
        <Vindu key={x} x={x} y={g - 11} b={2.6} h={2.6} sprosse={false} />
      ))}
      <polygon points={pkt([82, g], inn(82, g, 10), inn(82, g - 9, 6), [82, g - 7])} fill={S.stein.flate} />
      <Figur x={70} y={g + 3} avstand="fjern" klaer={S.marine} />
    </Lerret>
  )
}

/**
 * Gården på Lista (fjern avstand): flatt kystlandskap med steingjerder over
 * markene, et hvitt våningshus og en liten rød låve, vindskjeve trær, sauer
 * på beite og havet med Lista fyr i dis bak. I scenen bøyer trærne seg i
 * vinden og fyret blinker (G10).
 */
function GardLista({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const sau = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <ellipse cx={x} cy={y} rx="2" ry="1.3" fill={S.hvit.lys} />
      <circle cx={x + 2} cy={y - 0.4} r="0.7" fill={S.mork.flate} />
    </g>
  )
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <rect x="0" y={HORISONT - 4} width="96" height="6" fill={S.sjo.flate} />
          <rect x="84" y={HORISONT - 16} width="3" height="12" fill={S.hvit.lys} />
          <rect x="83.6" y={HORISONT - 18} width="3.8" height="2.4" fill={S.faluRod.flate} />
        </Dis>
        {/* Fyrlyset blinker (G10). */}
        <Blinklys x={85.5} y={HORISONT - 16.8} r={0.9} farge={S.vinduLys.lys} />
      </Kantfade>
      <Bakke type="gress" />
      {/* Steingjerdene over markene. */}
      <Kantfade>
        {[
          [0, g - 6, 96, g - 8],
          [0, g + 4, 96, g + 1],
          [60, g - 7.4, 44, g + 10],
        ].map(([x1, y1, x2, y2], i) =>
          Array.from({ length: 24 }, (_, k) => {
            const t = k / 23
            return <ellipse key={`${i}-${k}`} cx={+(x1 + (x2 - x1) * t).toFixed(2)} cy={+(y1 + (y2 - y1) * t).toFixed(2)} rx="1.6" ry="0.9" fill={k % 2 ? S.stein.flate : S.stein.lys} />
          }),
        )}
      </Kantfade>
      <Slagskygge x1={22} x2={72} lengde={10} d={14} />
      {/* Vindskjeve trær. */}
      <g transform={`rotate(14 12 ${g - 4})`}>
        <g className="anim-svai">
          <Tre x={12} y={g - 4} h={16} />
        </g>
      </g>
      <g transform={`rotate(14 80 ${g - 4})`}>
        <g className="anim-svai sen">
          <Tre x={80} y={g - 4} h={13} />
        </g>
      </g>
      <Langhus x={24} y={g - 4} b={24} h={10} d={12} m={S.hvit} tak={S.skifer} takH={6} />
      {[26.6, 31.6, 41.6].map((x) => (
        <Vindu key={x} x={x} y={g - 12} b={2.6} h={3.4} sprosse={false} tennes={x === 31.6} />
      ))}
      <rect x="36.4" y={g - 9.4} width="2" height="5.4" fill={S.marine.flate} />
      <Langhus x={54} y={g - 4} b={18} h={8} d={12} m={S.faluRod} tak={S.skifer} takH={5} />
      <rect x="59" y={g - 10} width="5" height="6" fill={S.faluRod.skygge} />
      {sau(20, g + 6)}
      {sau(30, g + 8)}
      {sau(66, g + 5)}
      {sau(74, g + 8.4)}
    </Lerret>
  )
}

/**
 * Skogen i Trysil (fjern avstand): granskog over åsene, en grusvei med
 * tømmerstabel i veikanten og Trysilfjellet med skibakkene i dis bak. I
 * scenen går vinden gjennom granene (G10).
 */
function SkogTrysil({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const trær: [number, number, number][] = [
    [6, g - 12, 16], [14, g - 14, 18], [24, g - 13, 15], [34, g - 15, 17], [46, g - 14, 16], [58, g - 16, 18], [70, g - 14, 15], [80, g - 15, 17], [90, g - 13, 16],
    [10, g - 4, 18], [20, g - 2, 20], [30, g - 5, 16], [62, g - 4, 19], [74, g - 2, 21], [86, g - 4, 17],
    [4, g + 4, 20], [92, g + 4, 19],
  ]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,62 16,48 34,40 52,26 70,36 84,32 96,40 96,64 0,64" fill={S.fjell.flate} />
          <path d="M52 28 Q48 40 42 58 M58 30 Q56 44 52 60 M66 34 Q64 46 62 60" fill="none" stroke={S.sno.lys} strokeWidth="1.8" />
          <polygon points="0,66 20,56 44,60 70,54 96,58 96,70 0,70" fill={S.gran.skygge} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      {/* Grusveien gjennom skogen. */}
      <Kantfade>
        <path d={`M38 ${g + 12} Q44 ${g + 2} 50 ${g - 4} Q54 ${g - 9} 50 ${g - 16}`} fill="none" stroke={S.puss.skygge} strokeWidth="5" />
        <path d={`M38 ${g + 12} Q44 ${g + 2} 50 ${g - 4} Q54 ${g - 9} 50 ${g - 16}`} fill="none" stroke={S.puss.flate} strokeWidth="3.4" />
      </Kantfade>
      {trær.map(([x, y, h], i) => (
        <g key={`${x}-${y}`} className={i % 3 === 0 ? 'anim-svai' : i % 3 === 1 ? 'anim-svai sen' : undefined}>
          <Tre x={x} y={y} h={h} slag="gran" />
        </g>
      ))}
      {/* Tømmerstabelen i veikanten. */}
      {[0, 1, 2].map((rad) =>
        Array.from({ length: 4 - rad }, (_, i) => (
          <g key={`${rad}-${i}`}>
            <circle cx={+(54 + i * 2.4 + rad * 1.2).toFixed(1)} cy={+(g + 2 - rad * 2).toFixed(1)} r="1.2" fill={S.treverk.lys} />
            <circle cx={+(54 + i * 2.4 + rad * 1.2).toFixed(1)} cy={+(g + 2 - rad * 2).toFixed(1)} r="0.5" fill={S.treverk.skygge} />
          </g>
        )),
      )}
    </Lerret>
  )
}

/**
 * Skogen i Namdalen (fjern avstand): Namsen bukter seg gjennom blandingsskog
 * av gran og bjørk, med tømmer stablet ved elva, ei lita rød bu og lave fjell
 * i dis bak. I scenen rører trærne seg og elva glitrer (G10).
 */
function SkogNamdalen({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const gran: [number, number, number][] = [
    [6, g - 13, 15], [18, g - 15, 17], [64, g - 14, 16], [78, g - 16, 18], [90, g - 13, 15],
    [8, g - 2, 18], [70, g - 3, 17], [88, g - 1, 19], [4, g + 5, 18],
  ]
  const bjork: [number, number, number][] = [
    [28, g - 14, 13], [56, g - 15, 12], [16, g - 6, 13], [80, g - 6, 12], [94, g + 5, 14],
  ]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,60 14,50 30,54 48,44 64,50 80,42 96,50 96,64 0,64" fill={S.fjell.flate} />
          <polygon points="0,66 24,58 48,62 72,56 96,60 96,70 0,70" fill={S.gran.skygge} />
        </Dis>
      </Kantfade>
      <Bakke type="gress" />
      {/* Elva som bukter seg mot oss. */}
      <Kantfade>
        <path d={`M44 ${g - 18} Q50 ${g - 12} 42 ${g - 6} Q32 ${g + 2} 44 ${g + 12} L62 ${g + 12} Q48 ${g + 2} 56 ${g - 6} Q62 ${g - 12} 50 ${g - 18} Z`} fill={S.sjo.flate} />
        <path className="anim-boelge" d={`M46 ${g - 10} Q42 ${g - 6} 40 ${g - 2} M48 ${g + 4} Q50 ${g + 8} 54 ${g + 10}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.7" />
      </Kantfade>
      {gran.map(([x, y, h], i) => (
        <g key={`g${x}-${y}`} className={i % 2 ? 'anim-svai sen' : undefined}>
          <Tre x={x} y={y} h={h} slag="gran" />
        </g>
      ))}
      {bjork.map(([x, y, h], i) => (
        <g key={`b${x}-${y}`} className={i % 2 ? 'anim-svai' : 'anim-svai sen'}>
          <Tre x={x} y={y} h={h} />
        </g>
      ))}
      {/* Den røde bua og tømmeret ved elva. */}
      <Langhus x={22} y={g - 2} b={9} h={5} d={6} m={S.faluRod} tak={S.skifer} takH={3} />
      {[0, 1].map((rad) =>
        Array.from({ length: 5 - rad }, (_, i) => (
          <circle key={`${rad}-${i}`} cx={+(60 + i * 2.2 + rad * 1.1).toFixed(1)} cy={+(g + 3 - rad * 1.9).toFixed(1)} r="1.1" fill={S.treverk.lys} />
        )),
      )}
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Landemerker

/**
 * Fyret på Ytterskjær (fjern avstand, til havs): et rødt fyrtårn i støpejern
 * med hvitt belte på et nakent skjær, fyrvokterboligen ved siden av, lykta
 * som lyser varmt, brenninger mot berget, måker og øyene i dis bak.
 */
function Fyret({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 11
  const topp = fot - 40
  const cx = 36
  /** Halve bredden av tårnet i høyden y: det smalner mot toppen. */
  const hb = (y: number) => +(5.6 - ((fot - y) / 40) * 1.8).toFixed(2)
  const del = (y1: number, y2: number, farge: string) => <polygon points={pkt([cx - hb(y1), y1], [cx + hb(y1), y1], [cx + hb(y2), y2], [cx - hb(y2), y2])} fill={farge} />
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 4,${HORISONT - 3} 14,${HORISONT - 4} 22,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points={`60,${HORISONT + 1} 68,${HORISONT - 5} 78,${HORISONT - 6} 86,${HORISONT - 3} 96,${HORISONT - 2} 96,${HORISONT + 1}`} fill={S.fjell.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Lyset fra lykta: en myk glød, ingen hard kjegle. */}
      <circle cx={cx} cy={topp - 5} r="15" fill={S.vinduLys.lys} opacity="0.1" />
      <circle cx={cx} cy={topp - 5} r="8" fill={S.vinduLys.lys} opacity="0.2" />
      <path d="M62 24 q1.4 -1.2 2.8 0 q1.4 -1.2 2.8 0 M72 30 q1 -0.9 2 0 q1 -0.9 2 0" fill="none" stroke={S.hvit.lys} strokeWidth="0.6" strokeLinecap="round" />
      {/* Skjæret: nakent berg med lys topp og skyggeside, speilet svakt i sjøen. */}
      <polygon points={pkt([16, g + 5], [82, g + 5], [74, g + 9], [24, g + 9])} fill={S.stein.skygge} opacity="0.22" />
      <polygon points={pkt([10, g + 4], [16, g - 4], [24, g - 9], [30, g - 11], [70, g - 10], [77, g - 5], [86, g + 4])} fill={S.stein.flate} />
      <polygon points={pkt([24, g - 9], [30, g - 11], [70, g - 10], [74, g - 13], [36, g - 15], [28, g - 13])} fill={S.stein.lys} />
      <polygon points={pkt([70, g - 10], [74, g - 13], [80, g - 6], [88, g + 3], [86, g + 4], [77, g - 5])} fill={S.stein.skygge} />
      <path d={`M20 ${g - 2} L26 ${g - 4} M44 ${g - 6} L52 ${g - 4} L58 ${g - 6} M64 ${g - 3} L70 ${g}`} fill="none" stroke={S.stein.skygge} strokeWidth="0.6" />
      <ellipse cx="11" cy={g + 3.6} rx="4" ry="1.2" fill={S.hvit.lys} opacity="0.75" />
      <ellipse cx="87" cy={g + 3.4} rx="3.6" ry="1.1" fill={S.hvit.lys} opacity="0.75" />
      <ellipse cx="50" cy={g + 4.2} rx="5" ry="0.9" fill={S.hvit.lys} opacity="0.5" />
      {/* Fyrvokterboligen med flaggstang. */}
      <Slagskygge x1={48} x2={66} y={fot} lengde={8} d={8} />
      <Langhus x={48} y={fot} b={18} h={8} d={10} m={S.hvit} tak={S.faluRod} takH={5} />
      {[50.6, 55.6, 60.6].map((x) => (
        <Vindu key={x} x={x} y={fot - 6.4} b={2.6} h={3.2} sprosse={false} lys={x === 55.6} />
      ))}
      <rect x="63.6" y={fot - 5} width="1.8" height="5" fill={S.marine.flate} />
      <rect x="60" y={fot - 15.4} width="1.6" height="3.4" fill={S.tegl.flate} />
      <line x1="70" y1={fot} x2="70" y2={fot - 14} stroke={S.hvit.lys} strokeWidth="0.4" />
      <polygon className="anim-flagg" points={`70.2,${fot - 14} 73.4,${fot - 13.2} 70.2,${fot - 12.4}`} fill={S.faluRod.lys} />
      {/* Tårnet: rødt med hvitt belte, skygge på høyre side. */}
      <Slagskygge x1={cx - 5.6} x2={cx + 5.6} y={fot} lengde={10} d={6} />
      {del(topp, fot, S.faluRod.flate)}
      {del(fot - 24, fot - 15, S.hvit.flate)}
      <polygon points={pkt([cx + 1.2, fot], [cx + hb(fot), fot], [cx + hb(topp), topp], [cx + 0.9, topp])} fill="#000000" opacity="0.22" />
      <polygon points={pkt([cx - hb(fot), fot], [cx - hb(fot) + 1.2, fot], [cx - hb(topp) + 0.9, topp], [cx - hb(topp), topp])} fill="#ffffff" opacity="0.14" />
      {[fot - 10, fot - 31].map((y) => (
        <rect key={y} x={cx - 0.8} y={y} width="1.6" height="2.6" fill={S.mork.flate} />
      ))}
      <path d={`M${cx - 1.6} ${fot} V${fot - 4} Q${cx} ${fot - 5.6} ${cx + 1.6} ${fot - 4} V${fot} Z`} fill={S.mork.flate} />
      {/* Galleriet, lykta og kuppelen. */}
      <rect x={cx - 5.4} y={topp - 1.4} width="10.8" height="1.8" fill={S.mork.flate} />
      <line x1={cx - 5} y1={topp - 4.4} x2={cx + 5} y2={topp - 4.4} stroke={S.mork.lys} strokeWidth="0.5" />
      {[-5, -2.5, 0, 2.5, 5].map((dx) => (
        <line key={dx} x1={cx + dx} y1={topp - 4.4} x2={cx + dx} y2={topp - 1.4} stroke={S.mork.lys} strokeWidth="0.4" />
      ))}
      <rect x={cx - 3} y={topp - 9} width="6" height="7.6" fill={S.vinduLys.lys} />
      <rect x={cx + 1.2} y={topp - 9} width="1.8" height="7.6" fill={S.vinduLys.skygge} />
      {[-1, 1].map((dx) => (
        <line key={dx} x1={cx + dx} y1={topp - 9} x2={cx + dx} y2={topp - 1.4} stroke={S.mork.flate} strokeWidth="0.4" />
      ))}
      <path d={`M${cx - 3.6} ${topp - 9} Q${cx} ${topp - 14.4} ${cx + 3.6} ${topp - 9} Z`} fill={S.faluRod.flate} />
      <path d={`M${cx + 0.6} ${topp - 11.6} Q${cx + 2.8} ${topp - 11} ${cx + 3.6} ${topp - 9} H${cx + 0.6} Z`} fill={S.faluRod.skygge} />
      <circle cx={cx} cy={topp - 12.2} r="0.7" fill={S.mork.flate} />
      <line x1={cx} y1={topp - 12.6} x2={cx} y2={topp - 15.4} stroke={S.mork.flate} strokeWidth="0.4" />
    </Lerret>
  )
}

/**
 * Kollen hoppbakke (fjern avstand, Holmenkollen): det slanke stålunnarennet
 * som stikker ut fra tårnet med utsiktsplattformen, ovarennet som svinger ned
 * mot sletta, tribunen med publikum, en hopper i V-stil i lufta, granskog på
 * åsen og Oslofjorden med byen i dis langt nede.
 */
function Hoppbakken({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const a: [number, number] = [12, 18]
  const b: [number, number] = [44, 45]
  const publikum = [S.faluRod.lys, S.marine.lys, S.oker.lys, S.hvit.lys, S.gran.lys, S.vin.lys, S.metall.lys]
  const gran: [number, number, number][] = [
    [3, 60, 12], [9, 58, 13], [22, 57, 11], [30, 56, 12], [38, 58, 10],
    [6, 72, 14], [16, 70, 12], [26, 74, 13], [36, 70, 11], [12, 86, 15], [30, 88, 14], [44, 84, 12],
  ]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`36,${HORISONT + 2} 52,${HORISONT - 1} 96,${HORISONT - 2} 96,${HORISONT + 6} 36,${HORISONT + 6}`} fill={S.sjo.lys} />
          <polygon points={`62,${HORISONT - 1} 72,${HORISONT - 4} 82,${HORISONT - 1}`} fill={S.fjell.flate} />
          {[54, 57.6, 61, 66, 86, 90].map((x, i) => (
            <rect key={x} x={x} y={HORISONT + 2 - (i % 3)} width="2.4" height={3 + (i % 3)} fill={S.puss.flate} />
          ))}
          <polygon points="0,54 0,40 10,37 22,41 34,39 46,45 46,56 0,56" fill={S.gran.skygge} />
        </Dis>
      </Kantfade>
      {/* Åsen og ovarennet: profilen svinger ned mot sletta til høyre. */}
      <Bunnfade>
        <path d={`M0 52 L${b[0]} ${b[1] + 3} Q58 50 66 64 Q75 80 96 82 V96 H0 Z`} fill={S.sno.flate} />
        <path d={`M${b[0]} ${b[1] + 3} Q58 50 66 64 Q75 80 96 82 V86 Q72 84 62 70 Q54 58 ${b[0] - 2} ${b[1] + 7} Z`} fill={S.sno.lys} />
        <path d={`M${b[0]} ${b[1] + 3} Q58 50 66 64 Q75 80 96 82`} fill="none" stroke={S.sno.skygge} strokeWidth="0.6" />
        <path d="M61 59.6 L64.6 57.4 M70.6 71.2 L74.4 69.6" stroke={S.faluRod.lys} strokeWidth="0.7" />
      </Bunnfade>
      {/* Tårnet og et slankt bein under tilløpet. */}
      <polygon points={pkt([18, 22], [24, 26], [24, 62], [18, 62])} fill={S.metall.flate} />
      <rect x="22.2" y="25" width="1.8" height="37" fill={S.metall.skygge} />
      <rect x="33" y="36" width="1.6" height="17" fill={S.metall.skygge} />
      {/* Tilløpet: en tynn stålvinge med spor, ut til hoppkanten. */}
      <polygon points={pkt([a[0], a[1] - 0.6], b, [b[0], b[1] + 1], [a[0], a[1] + 0.6])} fill={S.metall.lys} />
      <polygon points={pkt([a[0], a[1] + 0.6], [b[0], b[1] + 1], [b[0], b[1] + 3.2], [a[0], a[1] + 4.4])} fill={S.metall.flate} />
      <polygon points={pkt([a[0], a[1] + 3.2], [b[0], b[1] + 2.6], [b[0], b[1] + 3.2], [a[0], a[1] + 4.4])} fill={S.metall.skygge} />
      <line x1={a[0] + 2} y1={a[1] + 1.6} x2={b[0] - 1} y2={b[1]} stroke={S.hvit.lys} strokeWidth="0.3" />
      {/* Utsiktsplattformen på toppen. */}
      <Kloss x={6} y={a[1] + 1} b={12} h={6} d={6} m={S.glass} />
      <rect x="6" y={a[1] - 5} width="12" height="1" fill={S.metall.flate} />
      <Glans points={`6,${a[1] - 5} 11,${a[1] - 5} 8,${a[1] + 1} 6,${a[1] + 1}`} />
      <line x1="12" y1={a[1] - 5} x2="12" y2={a[1] - 12} stroke={S.metall.skygge} strokeWidth="0.4" />
      <polygon className="anim-flagg" points={`12.2,${a[1] - 12} 15.4,${r2(a[1] - 11.2)} 12.2,${r2(a[1] - 10.4)}`} fill={S.faluRod.lys} />
      {gran.map(([x, y, h]) => (
        <Tre key={`${x}-${y}`} x={x} y={y} h={h} slag="gran" />
      ))}
      {/* Hopperen i V-stil. */}
      <g transform="translate(60 38) rotate(16)">
        <line x1="-3.4" y1="0.6" x2="4" y2="-0.6" stroke={S.mork.flate} strokeWidth="0.6" strokeLinecap="round" />
        <line x1="-3.4" y1="1" x2="4" y2="2.4" stroke={S.mork.flate} strokeWidth="0.6" strokeLinecap="round" />
        <rect x="-2" y="-0.4" width="4.4" height="1.4" rx="0.7" fill={S.faluRod.flate} />
        <circle cx="3" cy="0.1" r="0.8" fill={S.hvit.lys} />
      </g>
      {/* Tribunen ved sletta, full av folk. */}
      <Kloss x={72} y={g + 4} b={18} h={6} d={8} m={S.stein} />
      {[0, 1, 2].map((rad) =>
        Array.from({ length: 11 }, (_, i) => (
          <rect key={`${rad}-${i}`} x={+(72.6 + i * 1.6).toFixed(1)} y={+(g - 1.2 + rad * 1.8).toFixed(1)} width="1.1" height="1.1" fill={publikum[(i * 3 + rad * 2) % publikum.length]} />
        )),
      )}
    </Lerret>
  )
}

/**
 * Steinvik borg (fjern avstand, i fjorden): en middelalderborg i grå stein på
 * en holme i Trondheimsfjorden — et høyt hovedhus med bratt skifertak, en
 * ringmur med skyteskår og port, et rundt hjørnetårn med flagg, et firkantet
 * tårn, en færing ved brygga og de lave trønderåsene i dis bak.
 */
function Borgen({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const mur = g - 5
  const tinder = (x1: number, x2: number, y: number) =>
    Array.from({ length: Math.floor((x2 - x1) / 3) }, (_, i) => <rect key={`${x1}-${i}`} x={+(x1 + 0.6 + i * 3).toFixed(1)} y={+(y - 1.8).toFixed(1)} width="1.8" height="1.8" fill={S.stein.flate} />)
  const skar = (x: number, y: number) => <path key={`${x}-${y}`} d={`M${x} ${r2(y + 3)} V${r2(y + 0.8)} Q${r2(x + 0.8)} ${y} ${r2(x + 1.6)} ${r2(y + 0.8)} V${r2(y + 3)} Z`} fill={S.mork.flate} />
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,47 18,43 38,46 60,40 80,44 96,41 96,${HORISONT + 1}`} fill={S.gran.skygge} />
          <polygon points={`0,${HORISONT + 1} 0,52 30,50 54,52 80,49 96,51 96,${HORISONT + 1}`} fill={S.gress.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <polygon points={pkt([12, g + 5], [86, g + 5], [78, g + 9], [22, g + 9])} fill={S.stein.skygge} opacity="0.2" />
      {/* Holmen. */}
      <polygon points={pkt([3, g + 3], [10, g - 2], [86, g - 3], [93, g + 3], [84, g + 5], [66, g + 4.2], [48, g + 5.2], [30, g + 4.4], [14, g + 5])} fill={S.stein.flate} />
      <polygon points={pkt([10, g - 2], [14, g - 7], [80, g - 8], [86, g - 3])} fill={S.gress.flate} />
      <polygon points={pkt([14, g - 7], [80, g - 8], [82, g - 6], [16, g - 5])} fill={S.gress.lys} />
      <Slagskygge x1={18} x2={79} y={mur} lengde={10} d={10} />
      {/* Hovedhuset, bak muren. */}
      <Kloss x={34} y={mur - 4} b={24} h={30} d={12} m={S.stein} />
      <Saltak x={34} y={mur - 34} b={24} d={12} h={12} m={S.skifer} gavl={S.stein} />
      {[mur - 26, mur - 18].map((y) => (
        <rect key={y} x="34" y={y} width="24" height="0.6" fill={S.stein.skygge} opacity="0.6" />
      ))}
      {[39, 45.2, 51.4].map((x) => [mur - 31, mur - 23].map((y) => skar(x, y)))}
      {skar(45.2, mur - 41)}
      {/* Ringmuren med tinder og porten. */}
      <Kloss x={18} y={mur} b={54} h={11} d={10} m={S.stein} />
      {tinder(18, 72, mur - 11)}
      <rect x="18" y={mur - 6} width="54" height="0.6" fill={S.stein.skygge} opacity="0.6" />
      <path d={`M41 ${mur} V${mur - 6} Q44 ${mur - 9.4} 47 ${mur - 6} V${mur} Z`} fill={S.mork.flate} />
      <path d={`M40.4 ${mur} V${mur - 6.2} Q44 ${mur - 10.2} 47.6 ${mur - 6.2} V${mur}`} fill="none" stroke={S.stein.lys} strokeWidth="0.6" />
      {[26, 60].map((x) => skar(x, mur - 8))}
      {/* Det firkantede tårnet til høyre. */}
      <Kloss x={70} y={mur + 1} b={9} h={19} d={8} m={S.stein} />
      {tinder(70, 79, mur - 18)}
      {skar(73.8, mur - 13)}
      {/* Det runde hjørnetårnet med kjegletak og flagg. */}
      <rect x="12" y={g - 34} width="10" height="31" fill={S.stein.flate} />
      <rect x="12" y={g - 34} width="2.4" height="31" fill={S.stein.lys} />
      <rect x="18.4" y={g - 34} width="3.6" height="31" fill={S.stein.skygge} />
      <rect x="11" y={g - 34.8} width="12" height="1.2" fill={S.skifer.skygge} />
      <polygon points={pkt([11, g - 34], [17, g - 47], [23, g - 34])} fill={S.skifer.flate} />
      <polygon points={pkt([17, g - 47], [23, g - 34], [17.6, g - 34])} fill={S.skifer.skygge} />
      {[g - 26, g - 16].map((y) => skar(16.2, y))}
      <line x1="17" y1={g - 47} x2="17" y2={g - 54} stroke={S.mork.lys} strokeWidth="0.4" />
      <polygon className="anim-flagg" points={`17.2,${g - 54} 20.8,${r2(g - 53.1)} 17.2,${r2(g - 52.2)}`} fill={S.faluRod.lys} />
      {/* Stien ned fra porten, brygga og færingen. */}
      <polygon points={pkt([41.4, mur], [46.6, mur], [49, g - 1.6], [39, g - 1.6])} fill={S.puss.skygge} />
      <rect x="0" y={g - 1.8} width="11" height="1" fill={S.treverk.flate} />
      {[2, 7].map((x) => (
        <line key={x} x1={x} y1={g - 0.8} x2={x} y2={g + 2.4} stroke={S.treMork.skygge} strokeWidth="0.6" />
      ))}
      <path d={`M1 ${g + 0.6} L10 ${g + 0.2} Q9.4 ${g + 2.2} 8 ${g + 2.4} L3 ${g + 2.4} Q1.6 ${g + 2} 1 ${g + 0.6} Z`} fill={S.hvit.flate} />
      <Figur x={50} y={g - 1.2} avstand="fjern" klaer={S.vin} />
      <Figur x={53} y={g - 0.8} avstand="fjern" klaer={S.marine} vendt={-1} />
    </Lerret>
  )
}

/**
 * Oslotårnet (fjern avstand, Bjørvika): et vridd glasstårn ved fjorden — hver
 * etasje er dreid litt mer enn den under, så fasaden i lys og siden i skygge
 * bytter plass oppover — med lyskrone og spir på toppen, Operaen i hvit
 * marmor foran med folk på taket og Barcode-rekka i dis bak.
 */
function Tarnet({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const n = 16
  const h = 3.4
  const fot = g - 8
  const cx = 54
  const s = 16
  const etasjer = Array.from({ length: n }, (_, j) => {
    const v = 0.15 + (j / (n - 1)) * 1.2
    const fw = s * Math.cos(v)
    const sw = s * Math.sin(v) * 0.7
    return { y: +(fot - (j + 1) * h).toFixed(2), x: +(cx - (fw + sw) / 2).toFixed(2), fw: +fw.toFixed(2), sw: +sw.toFixed(2) }
  })
  const topp = etasjer[n - 1]
  const tent = new Set([2, 5, 9, 12])
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          {[
            [4, 7, 34, S.stein],
            [12, 6, 26, S.glass],
            [19, 7, 40, S.puss],
            [27, 6, 30, S.skifer],
            [68, 7, 36, S.glass],
            [76, 8, 44, S.stein],
            [85, 6, 30, S.puss],
          ].map(([x, b, hh, m]) => (
            <Kloss key={x as number} x={x as number} y={g - 8} b={b as number} h={hh as number} d={6} m={m as Materiale} />
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Kantfade>
        <rect x="0" y={g + 3} width="96" height="13" fill={S.sjo.flate} />
        <rect x="0" y={g + 2.2} width="96" height="0.8" fill={S.stein.skygge} />
        <polyline className="anim-boelge" points={`58,${g + 8} 62,${g + 6.8} 66,${g + 8}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.7" strokeLinecap="round" />
      </Kantfade>
      <Slagskygge x1={etasjer[0].x} x2={etasjer[0].x + etasjer[0].fw + etasjer[0].sw} y={fot} lengde={20} d={8} />
      {/* Sokkelen og tårnet, etasje for etasje. */}
      <Kloss x={44} y={fot} b={20} h={4} d={8} m={S.stein} />
      {etasjer.map((e, j) => (
        <g key={j}>
          <rect x={e.x} y={e.y} width={e.fw} height={h - 0.5} fill={S.glass.flate} />
          <rect x={+(e.x + e.fw).toFixed(2)} y={e.y} width={e.sw} height={h - 0.5} fill={S.glass.skygge} />
          {tent.has(j) && <rect x={+(e.x + e.fw * 0.4).toFixed(2)} y={r2(e.y + 0.5)} width={+(e.fw * 0.4).toFixed(2)} height={h - 1.5} fill={S.vinduLys.flate} opacity="0.8" />}
          <rect x={+(e.x + e.fw - 0.3).toFixed(2)} y={e.y} width="0.6" height={h - 0.5} fill={S.glass.lys} />
          <rect x={e.x} y={+(e.y + h - 0.5).toFixed(2)} width={+(e.fw + e.sw).toFixed(2)} height="0.5" fill={S.skifer.flate} />
          <rect x={e.x} y={e.y} width={+(e.fw * 0.28).toFixed(2)} height={h - 0.5} fill="#ffffff" opacity={+(0.18 - j * 0.008).toFixed(3)} />
        </g>
      ))}
      {/* Lyskrona og spiret. */}
      <rect x={topp.x} y={r2(topp.y - 2.4)} width={+(topp.fw + topp.sw).toFixed(2)} height="2.4" fill={S.vinduLys.lys} />
      <circle cx={cx} cy={r2(topp.y - 1.2)} r="6" fill={S.vinduLys.lys} opacity="0.16" />
      <line x1={cx} y1={r2(topp.y - 2.4)} x2={cx} y2={r2(topp.y - 12)} stroke={S.metall.lys} strokeWidth="0.6" />
      {/* Operaen: marmortaket som skrår ned mot sjøen, glassveggen og scenetårnet. */}
      <Slagskygge x1={2} x2={42} y={g + 2} lengde={6} d={6} />
      <Kloss x={30} y={g - 10} b={8} h={7} d={6} m={S.metall} />
      <polygon points={pkt([0, g + 2.4], [26, g - 10], [42, g - 10], [44, g - 8], [44, g + 2.4])} fill={S.hvit.lys} />
      <polygon points={pkt([0, g + 2.4], [26, g - 10], [26, g + 2.4])} fill={S.hvit.flate} />
      <rect x="26" y={g - 8} width="18" height="10.4" fill={S.glass.skygge} />
      {[29.6, 33.2, 36.8, 40.4].map((x) => (
        <rect key={x} x={x} y={g - 8} width="0.4" height="10.4" fill={S.hvit.flate} />
      ))}
      <rect x="32" y={g - 4} width="8" height="6.4" fill={S.vinduLys.skygge} opacity="0.8" />
      <Glans points={`26,${g - 8} 32,${g - 8} 28,${g + 2.4} 26,${g + 2.4}`} />
      <Figur x={12} y={g - 3} avstand="fjern" klaer={S.marine} />
      <Figur x={17} y={g - 5.4} avstand="fjern" klaer={S.vin} vendt={-1} />
      <Figur x={70} y={g + 1} avstand="fjern" klaer={S.oker} />
      {/* En seilbåt på fjorden. */}
      <path d={`M80 ${g + 7} L90 ${g + 7} Q89 ${g + 8.6} 87.6 ${g + 8.8} L82 ${g + 8.8} Z`} fill={S.hvit.flate} />
      <line x1="85" y1={g + 7} x2="85" y2={g - 6} stroke={S.mork.lys} strokeWidth="0.4" />
      <polygon points={pkt([85.4, g - 5.6], [85.4, g + 6], [90.4, g + 6])} fill={S.hvit.lys} />
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Eiendom utenlands

/**
 * Leiligheten på Östermalm (fjern avstand, Strandvägen): steinpalassene fra
 * 1890-tallet langs kaia — ett i tegl med karnapp og tårn med grønt kobberspir,
 * ett i lys puss med kuppel og balkonger — lindealleen og en hvit
 * skjærgårdsbåt ved Nybrokajen foran, og Stadshustornet med de tre kronene i
 * dis bak.
 */
function Stockholm({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const kai = g - 4
  const e = maal('fjern', 'etasje')
  /** Vindusradene i etasje 1–4 over sokkelen. */
  const rader = (x: number, b: number, antall: number, karm: string, tent: number[]) =>
    [1, 2, 3, 4].map((k) => (
      <Vindusrad key={k} x={x} y={r2(kai - 2 - (k + 1) * e + 2.4)} antall={antall} b={2.4} h={4} mellom={r2((b - antall * 2.4) / (antall - 1))} tent={tent.includes(k) ? 3 : 0} start={k} karm={karm} />
    ))
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,50 30,48 60,51 96,47 96,${HORISONT + 1}`} fill={S.stein.skygge} />
          {/* Stadshustornet: smalt teglårn med grønn lanterne og tre gullkroner. */}
          <rect x="10" y="22" width="6" height="30" fill={S.tegl.flate} />
          <rect x="14.2" y="22" width="1.8" height="30" fill={S.tegl.skygge} />
          <rect x="10.8" y="17.4" width="4.4" height="4.6" fill={S.petrol.flate} />
          <polygon points="10.6,17.6 13,12.4 15.4,17.6" fill={S.petrol.flate} />
          <line x1="13" y1="12.4" x2="13" y2="9.6" stroke={S.gull.flate} strokeWidth="0.4" />
          {[12.2, 13, 13.8].map((x, i) => (
            <circle key={x} cx={x} cy={i === 1 ? 8.4 : 9.2} r="0.6" fill={S.gull.lys} />
          ))}
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Kaia: promenaden og kaimuren ned i sjøen. */}
      <Kantfade>
        <rect x="0" y={kai - 2.4} width="96" height="2.4" fill={S.stein.lys} />
        <rect x="0" y={kai} width="96" height="5" fill={S.stein.flate} />
        <rect x="0" y={kai + 5} width="96" height="0.8" fill={S.stein.skygge} />
        <rect x="0" y={kai + 5.8} width="96" height="3" fill={S.stein.skygge} opacity="0.25" />
      </Kantfade>
      <Slagskygge x1={4} x2={92} y={kai - 2} lengde={10} d={12} />
      {/* Nabogården lengst til høyre, i oker. */}
      <Kloss x={84} y={kai - 2} b={8} h={32} d={8} m={S.oker} />
      {[0, 1, 2].map((k) => (
        <rect key={k} x="85.6" y={kai - 26 + k * 8} width="4.8" height="3.6" fill={S.glass.skygge} />
      ))}
      {/* Palasset i lys puss, med kobberkuppel på hjørnet og balkonger. */}
      <Kloss x={42} y={kai - 2} b={36} h={40} d={12} m={S.puss} />
      <rect x="42" y={kai - 10} width="36" height="8" fill={S.puss.skygge} />
      {rader(44, 32, 7, S.hvit.lys, [2, 4])}
      {[2, 3].map((k) => (
        <rect key={k} x="57" y={r2(kai - 2 - (k + 1) * e + 6.6)} width="10" height="0.8" fill={S.mork.flate} />
      ))}
      <polygon points={pkt([54, kai - 42], [78, kai - 42], [76, kai - 46], [54, kai - 46])} fill={S.skifer.flate} />
      {[60, 68].map((x) => (
        <rect key={x} x={x} y={kai - 45.4} width="2.4" height="2.4" fill={S.skifer.lys} />
      ))}
      <path d={`M42 ${kai - 42} Q48 ${kai - 56} 54 ${kai - 42} Z`} fill={S.petrol.flate} />
      <path d={`M48 ${kai - 49} Q52 ${kai - 47} 54 ${kai - 42} H48 Z`} fill={S.petrol.skygge} />
      <line x1="48" y1={kai - 49} x2="48" y2={kai - 53} stroke={S.gull.flate} strokeWidth="0.4" />
      <rect x="56" y={kai - 8.6} width="8" height="6.6" fill={S.vinduLys.skygge} />
      {/* Teglpalasset med sokkel i stein, karnapp og hjørnetårn med kobberspir. */}
      <Kloss x={4} y={kai - 2} b={34} h={40} d={12} m={S.tegl} />
      <rect x="4" y={kai - 10} width="34" height="8" fill={S.stein.flate} />
      <path d={`M19 ${kai - 2} V${kai - 6.4} Q21 ${kai - 8.8} 23 ${kai - 6.4} V${kai - 2} Z`} fill={S.mork.flate} />
      {rader(6, 30, 6, S.stein.lys, [1, 3])}
      <Kloss x={12} y={kai - 10} b={8} h={28} d={3} m={S.tegl} />
      {[1, 2, 3].map((k) => (
        <rect key={k} x="13.6" y={r2(kai - 2 - (k + 1) * e + 2.4)} width="4.8" height="4" fill={S.glass.skygge} />
      ))}
      <polygon points={pkt([4, kai - 42], [28, kai - 42], [28, kai - 46], [6, kai - 46])} fill={S.skifer.flate} />
      <Kloss x={28} y={kai - 42} b={10} h={6} d={8} m={S.tegl} />
      <rect x="31" y={kai - 46.4} width="4" height="3" fill={S.glass.skygge} />
      <polygon points={pkt([27, kai - 48], [33, kai - 62], [39, kai - 48])} fill={S.petrol.flate} />
      <polygon points={pkt([33, kai - 62], [39, kai - 48], [33, kai - 48])} fill={S.petrol.skygge} />
      <line x1="33" y1={kai - 62} x2="33" y2={kai - 65} stroke={S.gull.flate} strokeWidth="0.4" />
      {/* Lindealleen langs kaia, og folk på promenaden. */}
      {[8, 22, 36, 50, 64, 78].map((x) => (
        <Tre key={x} x={x} y={kai - 1} h={13} />
      ))}
      <Figur x={30} y={kai - 1.4} avstand="fjern" klaer={S.marine} />
      <Figur x={58} y={kai - 1.2} avstand="fjern" klaer={S.vin} vendt={-1} />
      {/* Skjærgårdsbåten ved kaia. */}
      <g className="anim-duve">
        <path d={`M44 ${g + 2} L76 ${g + 1.6} Q75 ${g + 4.6} 72 ${g + 5} L48 ${g + 5} Q45 ${g + 4.4} 44 ${g + 2} Z`} fill={S.hvit.flate} />
        <line x1="44.6" y1={g + 3.4} x2="75" y2={g + 3.2} stroke={S.mork.flate} strokeWidth="0.6" />
        <rect x="50" y={g - 1.8} width="20" height="3.8" fill={S.hvit.lys} />
        <Vindusrad x={51.4} y={g - 1} antall={7} b={1.6} h={1.4} mellom={1.2} />
        <rect x="61" y={g - 7} width="3" height="5.2" fill={S.mork.flate} />
        <rect x="61" y={g - 5.4} width="3" height="1" fill={S.oker.flate} />
        <line x1="74" y1={g + 1.6} x2="74" y2={g - 4} stroke={S.mork.lys} strokeWidth="0.3" />
        <polygon className="anim-flagg" points={`74.2,${g - 4} 77,${g - 3.4} 74.2,${g - 2.8}`} fill={S.marine.lys} />
      </g>
    </Lerret>
  )
}

/**
 * Kontorhuset i Nyhavn (fjern avstand): de smale gavlhusene i gult, rødt,
 * blått og hvitt langs kanalen, med uteserveringer under parasoller på kaia,
 * to gamle treseilere fortøyd med mastene foran fasadene, og spiret på Vor
 * Frelsers Kirke med gulltrappa rundt i dis bak.
 */
function Kobenhavn({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const kai = g - 4
  const hus: [number, number, number, number, Materiale][] = [
    [2, 14, 34, 8, S.oker],
    [16, 13, 30, 7, S.tegl],
    [29, 15, 36, 9, S.marine],
    [44, 13, 32, 7, S.puss],
    [57, 14, 34, 8, S.faluRod],
    [71, 13, 30, 7, S.oker],
  ]
  const skip = (x: number, h: number) => (
    <g className="anim-duve">
      <path d={`M${x} ${g + 1} L${x + 22} ${g + 0.6} Q${x + 21} ${g + 4} ${x + 18} ${g + 4.4} L${x + 3} ${g + 4.4} Q${x + 0.8} ${g + 3.6} ${x} ${g + 1} Z`} fill={S.treMork.flate} />
      <line x1={x + 0.6} y1={g + 2} x2={x + 21.4} y2={g + 1.7} stroke={S.oker.flate} strokeWidth="0.6" />
      {[x + 7, x + 15].map((mx, i) => (
        <g key={mx}>
          <line x1={mx} y1={g + 0.8} x2={mx} y2={g - h + i * 6} stroke={S.treMork.skygge} strokeWidth="0.6" />
          <line x1={mx - 4} y1={r2(g - h * 0.55 + i * 3)} x2={mx + 4} y2={r2(g - h * 0.55 + i * 3)} stroke={S.treMork.skygge} strokeWidth="0.4" />
        </g>
      ))}
      <path d={`M${x + 7} ${g - h} L${x} ${g + 0.8} M${x + 15} ${g - h + 6} L${x + 22} ${g + 0.6} M${x + 7} ${g - h} L${x + 15} ${g - h + 6}`} fill="none" stroke={S.mork.lys} strokeWidth="0.2" />
    </g>
  )
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          {/* Vor Frelsers Kirke: tårnet og spiret med trappa i spiral rundt. */}
          <rect x="82" y="30" width="6" height="22" fill={S.tegl.flate} />
          <polygon points="82.4,30 85,10 87.6,30" fill={S.mork.lys} />
          <path d="M83 28 L87 25 M83.4 24 L86.6 21 M83.8 20 L86.2 17 M84.2 16 L85.8 13.6" stroke={S.gull.flate} strokeWidth="0.6" />
          <line x1="85" y1="10" x2="85" y2="6.6" stroke={S.gull.flate} strokeWidth="0.4" />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <Kantfade>
        <rect x="0" y={kai - 2.4} width="96" height="2.4" fill={S.stein.lys} />
        <rect x="0" y={kai} width="96" height="5" fill={S.stein.flate} />
        <rect x="0" y={kai + 5} width="96" height="0.8" fill={S.stein.skygge} />
        <rect x="0" y={kai + 5.8} width="96" height="3" fill={S.stein.skygge} opacity="0.25" />
      </Kantfade>
      <Slagskygge x1={2} x2={84} y={kai - 2} lengde={10} d={8} />
      {/* Gavlhusene, fra venstre, så naboen dekker skyggesiden. */}
      {hus.map(([x, b, h, gavl, m], i) => (
        <Gavlhus key={x} x={x} y={kai - 2} b={b} h={h} gavl={gavl} d={8} m={m} tak={S.tegl}>
          {[0, 1, 2, 3].map((k) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${k}-${c}`}
                x={r2(x + 2 + c * ((b - 4 - 2.4) / 2))}
                y={r2(kai - 2 - h + 3 + k * ((h - 10) / 4))}
                width="2.4"
                height="3.6"
                fill={(k + c + i) % 5 === 0 ? S.vinduLys.flate : S.glass.skygge}
                stroke={S.hvit.lys}
                strokeWidth="0.4"
              />
            )),
          )}
          <rect x={r2(x + b / 2 - 1.2)} y={r2(kai - 2 - h - gavl * 0.55)} width="2.4" height="2.6" fill={S.glass.skygge} stroke={S.hvit.lys} strokeWidth="0.4" />
          <rect x={x + 1} y={kai - 6.6} width={b - 2} height="4.6" fill={S.vinduLys.skygge} />
        </Gavlhus>
      ))}
      {/* Uteserveringene på kaia. */}
      {[6, 20, 34, 48, 62, 76].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={kai - 2.4} x2={x} y2={kai - 5} stroke={S.mork.lys} strokeWidth="0.3" />
          <polygon points={pkt([x - 3, kai - 4.6], [x, kai - 6.2], [x + 3, kai - 4.6])} fill={[S.hvit.lys, S.vin.flate, S.hvit.lys][i % 3]} />
        </g>
      ))}
      <Figur x={12} y={kai - 1.4} avstand="fjern" klaer={S.marine} />
      <Figur x={41} y={kai - 1.2} avstand="fjern" klaer={S.oker} vendt={-1} />
      <Figur x={68} y={kai - 1.4} avstand="fjern" klaer={S.vin} />
      {/* De gamle treseilerne i kanalen. */}
      {skip(8, 40)}
      {skip(52, 46)}
    </Lerret>
  )
}

/**
 * Bygården i Mitte (fjern avstand): en pyntet gründerzeit-gård i fem etasjer
 * på et gatehjørne, med rundt hjørnetårn og kuppel, lyse gesimser, balkonger
 * med jernrekkverk og butikker med markiser i gateplanet, lindetrær, en gul
 * trikk på vei forbi, og Fernsehturm i dis bak. I scenen glir trikken,
 * lindene rører seg og lyset på tårnet blinker (G10).
 */
function Berlin({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  const etasjeY = (k: number) => r2(fot - (k + 1) * e + 2.4)
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 20,58 46,62 70,56 96,60 96,70 0,70" fill={S.stein.skygge} />
          {/* Fernsehturm: skaftet, kula med det lyse beltet og antenna. */}
          <polygon points="77.4,58 78.2,16 79.4,16 80.2,58" fill={S.stein.lys} />
          <circle cx="78.8" cy="20" r="4.6" fill={S.metall.flate} />
          <rect x="74.2" y="19.2" width="9.2" height="1.4" fill={S.metall.lys} />
          <rect x="78.4" y="6" width="0.8" height="10" fill={S.vin.lys} />
        </Dis>
        <Blinklys x={78.8} y={6} r={0.8} />
      </Kantfade>
      <Bakke type="asfalt" />
      <Slagskygge x1={8} x2={88} y={fot} lengde={12} d={12} />
      {/* Nabogården til høyre, lavere og enklere. */}
      <Kloss x={70} y={fot} b={18} h={32} d={10} m={S.stein} />
      {[0, 1, 2].map((k) => (
        <Vindusrad key={k} x={72} y={etasjeY(k + 1)} antall={4} b={2.4} h={4} mellom={2.2} karm={S.hvit.flate} tent={k === 1 ? 3 : 0} />
      ))}
      <rect x="70" y={fot - 7} width="18" height="7" fill={S.vinduLys.skygge} />
      {/* Hovedgården i varm puss, med gesimser, balkonger og mansardtak. */}
      <Kloss x={14} y={fot} b={56} h={40} d={12} m={S.puss} />
      {[1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect x="14" y={r2(fot - (k + 1) * e + 7.2)} width="56" height="0.8" fill={S.puss.lys} />
          <Vindusrad x={17} y={etasjeY(k)} antall={9} b={2.6} h={4.2} mellom={3.15} karm={S.hvit.lys} tent={k % 2 ? 4 : 0} start={k} tennes={k === 2 ? 5 : undefined} />
        </g>
      ))}
      {[2, 3].map((k) => (
        <g key={k}>
          <rect x="33" y={r2(etasjeY(k) + 4.4)} width="16" height="0.8" fill={S.mork.flate} />
          {[34, 37, 40, 43, 46].map((x) => (
            <line key={x} x1={x} y1={r2(etasjeY(k) + 2.6)} x2={x} y2={r2(etasjeY(k) + 4.4)} stroke={S.mork.flate} strokeWidth="0.3" />
          ))}
        </g>
      ))}
      <polygon points={pkt([14, fot - 40], [70, fot - 40], [68, fot - 45], [16, fot - 45])} fill={S.skifer.flate} />
      {[26, 38, 50, 62].map((x) => (
        <rect key={x} x={x} y={fot - 44.4} width="2.8" height="3" fill={S.skifer.lys} />
      ))}
      {/* Butikkene med markiser. */}
      <rect x="14" y={fot - 7} width="56" height="7" fill={S.vinduLys.skygge} />
      {[16, 30, 44, 58].map((x, i) => (
        <g key={x}>
          <rect x={x + 0.4} y={fot - 5.6} width="10" height="5.6" fill={S.glass.skygge} />
          <polygon points={pkt([x, fot - 7.6], [x + 11, fot - 7.6], [x + 12, fot - 5.4], [x - 1, fot - 5.4])} fill={i % 2 ? S.marine.flate : S.vin.flate} />
        </g>
      ))}
      {/* Det runde hjørnetårnet med kuppel. */}
      <rect x="6" y={fot - 44} width="10" height="44" fill={S.puss.flate} />
      <rect x="6" y={fot - 44} width="2.2" height="44" fill={S.puss.lys} />
      <rect x="13" y={fot - 44} width="3" height="44" fill={S.puss.skygge} />
      {[1, 2, 3, 4].map((k) => (
        <rect key={k} x="9.6" y={etasjeY(k)} width="2.8" height="4.2" fill={S.glass.skygge} stroke={S.hvit.lys} strokeWidth="0.4" />
      ))}
      <rect x="5" y={fot - 45} width="12" height="1.4" fill={S.puss.lys} />
      <path d={`M5.6 ${fot - 45} Q11 ${fot - 56} 16.4 ${fot - 45} Z`} fill={S.petrol.flate} />
      <path d={`M11 ${fot - 50.6} Q14.6 ${fot - 49.6} 16.4 ${fot - 45} H11 Z`} fill={S.petrol.skygge} />
      <line x1="11" y1={fot - 50.6} x2="11" y2={fot - 54.6} stroke={S.gull.flate} strokeWidth="0.4" />
      <rect x="6" y={fot - 7} width="10" height="7" fill={S.vinduLys.skygge} />
      {/* Lindetrærne og trikken. */}
      {[22, 52, 84].map((x, i) => (
        <g key={x} className={i % 2 ? 'anim-svai sen' : 'anim-svai'}>
          <Tre x={x} y={fot + 2} h={14} />
        </g>
      ))}
      <rect x="0" y={g + 3} width="96" height="0.4" fill={S.metall.skygge} />
      <rect x="0" y={g + 5.4} width="96" height="0.4" fill={S.metall.skygge} />
      <g className="anim-glid">
        <rect x="30" y={g - 4.6} width="38" height="9" rx="1.6" fill={S.oker.lys} />
        <rect x="30" y={g + 2.4} width="38" height="2" fill={S.oker.skygge} />
        <Vindusrad x={32} y={g - 3.4} antall={8} b={3} h={3.2} mellom={1.5} />
        <path d={`M49 ${g - 4.6} L51 ${g - 8} L47 ${g - 9.6} M44 ${g - 9.6} H54`} fill="none" stroke={S.mork.flate} strokeWidth="0.4" />
      </g>
      <Figur x={12} y={g - 4} avstand="fjern" klaer={S.marine} />
      <Figur x={76} y={g - 3.6} avstand="fjern" klaer={S.vin} vendt={-1} />
    </Lerret>
  )
}

/**
 * Byhuset i Mayfair (fjern avstand): en rekke hvite stukkaturhus i fem
 * etasjer med søylebuer over dørene, svarte jerngjerder, balkongen som går
 * langs hele første etasje og pipene på taket — ditt med den mørkeblå døra —
 * en svart drosje ved fortauskanten, en platan og Big Ben i dis bak. I scenen
 * ryker det fra en pipe, platanen rører seg og lyset går av og på (G10).
 */
function London({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  const hus = [4, 21.5, 39, 56.5]
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 30,60 60,62 96,58 96,70 0,70" fill={S.stein.skygge} />
          {/* Big Ben: tårnet i lys stein, urskiva, klokketårnet og spiret. */}
          <rect x="80" y="22" width="7" height="40" fill={S.oker.lys} />
          <rect x="85" y="22" width="2" height="40" fill={S.oker.flate} />
          <rect x="79.4" y="16" width="8.2" height="7" fill={S.oker.lys} />
          <circle cx="83.5" cy="19.5" r="2.4" fill={S.hvit.lys} />
          <path d="M83.5 19.5 V17.8 M83.5 19.5 H84.8" stroke={S.mork.flate} strokeWidth="0.3" />
          <polygon points="79.4,16 83.5,6 87.6,16" fill={S.skifer.flate} />
          <line x1="83.5" y1="6" x2="83.5" y2="3.4" stroke={S.gull.flate} strokeWidth="0.4" />
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Slagskygge x1={4} x2={74} y={fot} lengde={12} d={12} />
      {/* Rekka: én lang hvit fasade, delt i fire hus. */}
      <Kloss x={4} y={fot} b={70} h={40} d={12} m={S.hvit} />
      <rect x="4" y={fot - 9} width="70" height="9" fill={S.hvit.lys} />
      {[fot - 3, fot - 6].map((y) => (
        <rect key={y} x="4" y={y} width="70" height="0.4" fill={S.hvit.skygge} />
      ))}
      {hus.slice(1).map((x) => (
        <rect key={x} x={r2(x - 0.3)} y={fot - 40} width="0.6" height="31" fill={S.hvit.skygge} />
      ))}
      {[1, 2, 3, 4].map((k) => (
        <g key={k}>
          <Vindusrad
            x={6}
            y={r2(fot - (k + 1) * e + (k === 4 ? 4.4 : 1.8))}
            antall={12}
            b={2.6}
            h={k === 4 ? 3.2 : k === 1 ? 5.4 : 4.6}
            mellom={3.2}
            karm={S.hvit.lys}
            tent={k === 2 ? 5 : 0}
            start={k}
            tennes={k === 1 ? 7 : undefined}
          />
        </g>
      ))}
      {/* Balkongen langs første etasje, og gesimsen og pipene på toppen. */}
      <rect x="4" y={r2(fot - 2 * e - 0.4)} width="70" height="1.2" fill={S.mork.flate} />
      <rect x="3" y={fot - 41.2} width="72" height="1.6" fill={S.hvit.lys} />
      {/* Røyk fra én av pipene (G10). */}
      <circle className="anim-roeyk" cx={r2(hus[1] + 8.4)} cy={r2(fot - 48.4)} r="1.2" fill={S.hvit.flate} opacity="0.55" />
      <circle className="anim-roeyk sen" cx={r2(hus[1] + 9.8)} cy={r2(fot - 51)} r="1.6" fill={S.hvit.flate} opacity="0.35" />
      {hus.map((x) => (
        <g key={x}>
          <Kloss x={r2(x + 6)} y={fot - 41} b={4} h={4} d={3} m={S.hvit} />
          {[0, 1.4, 2.8].map((dx) => (
            <rect key={dx} x={r2(x + 6.4 + dx)} y={r2(fot - 46.2)} width="0.8" height="1.6" fill={S.tegl.flate} />
          ))}
        </g>
      ))}
      {/* Søylebuene, dørene og jerngjerdet. */}
      {hus.map((x, i) => (
        <g key={x}>
          <rect x={r2(x + 3)} y={fot - 8.4} width="7" height="1.2" fill={S.hvit.lys} />
          <rect x={r2(x + 3.4)} y={fot - 7.2} width="0.8" height="7.2" fill={S.hvit.lys} />
          <rect x={r2(x + 8.8)} y={fot - 7.2} width="0.8" height="7.2" fill={S.hvit.lys} />
          <rect x={r2(x + 5)} y={fot - 6.4} width="3" height="6.4" fill={i === 1 ? S.marine.flate : S.mork.flate} />
          {i === 1 && <circle cx={r2(x + 6.5)} cy={fot - 3.4} r="0.3" fill={S.gull.lys} />}
        </g>
      ))}
      <rect x="4" y={fot + 1.4} width="70" height="0.4" fill={S.mork.flate} />
      {Array.from({ length: 36 }, (_, i) => r2(4.6 + i * 1.95)).map((x) => (
        <line key={x} x1={x} y1={fot + 1.4} x2={x} y2={fot + 3.4} stroke={S.mork.flate} strokeWidth="0.25" />
      ))}
      {/* Platanen og den svarte drosjen. */}
      <g className="anim-svai">
        <Tre x={84} y={g + 2} h={22} />
      </g>
      <g>
        <path d={`M30 ${g + 6} V${g + 3} Q30.4 ${g + 1.6} 32 ${g + 1.4} L34 ${g - 0.8} Q38 ${g - 1.6} 41.6 ${g - 0.8} L43.4 ${g + 1.4} Q45 ${g + 1.8} 45 ${g + 3.4} V${g + 6} Z`} fill={S.mork.flate} />
        <path d={`M34.6 ${g + 1.2} L35.6 ${g - 0.2} H38 V${g + 1.2} Z M38.8 ${g + 1.2} V${g - 0.2} H41.2 L42.2 ${g + 1.2} Z`} fill={S.glass.skygge} />
        <rect x="37" y={g - 1.6} width="2.4" height="0.8" rx="0.3" fill={S.oker.lys} />
        {[33.4, 41.8].map((x) => (
          <circle key={x} cx={x} cy={g + 6} r="1.4" fill={S.mork.skygge} />
        ))}
      </g>
      <Figur x={18} y={fot + 4.6} avstand="fjern" klaer={S.marine} />
      <Figur x={62} y={fot + 4.2} avstand="fjern" klaer={S.oker} vendt={-1} />
    </Lerret>
  )
}

/**
 * Kanalhuset i Jordaan (fjern avstand, Pakke 59): fem smale murhus langs
 * grachten, med trappegavler og klokkegavler, heisebjelken under mønet og
 * store vinduer med hvite karmer — ditt i midten med den grønne døra. Foran
 * en buet steinbro med sykler mot rekkverket og en husbåt i kanalen,
 * Westerkerk i dis bak. I scenen duver husbåten og lyset går av og på.
 */
function Amsterdam({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const kai = g - 5
  const e = maal('fjern', 'etasje')
  // [x, bredde, høyde, gavl: 'trapp' | 'klokke', materiale]
  const hus: [number, number, number, 'trapp' | 'klokke', Materiale][] = [
    [3, 13, 4 * e + 4, 'trapp', S.tegl],
    [16, 12, 5 * e + 2, 'klokke', S.mork],
    [28, 14, 4 * e + 6, 'trapp', S.faluRod],
    [42, 12, 5 * e, 'klokke', S.tegl],
    [54, 13, 4 * e + 2, 'trapp', S.treMork],
  ]
  const gavl = (x: number, b: number, topp: number, slag: 'trapp' | 'klokke', m: Materiale) =>
    slag === 'trapp' ? (
      <polygon
        points={pkt(
          [x, topp],
          [x, topp - 2.4],
          [x + b * 0.2, topp - 2.4],
          [x + b * 0.2, topp - 4.8],
          [x + b * 0.38, topp - 4.8],
          [x + b * 0.38, topp - 7.2],
          [x + b * 0.62, topp - 7.2],
          [x + b * 0.62, topp - 4.8],
          [x + b * 0.8, topp - 4.8],
          [x + b * 0.8, topp - 2.4],
          [x + b, topp - 2.4],
          [x + b, topp],
        )}
        fill={m.flate}
      />
    ) : (
      <path d={`M${x} ${topp} Q${x + 1} ${topp - 3} ${r2(x + b * 0.3)} ${topp - 4} Q${r2(x + b * 0.3)} ${topp - 7.6} ${r2(x + b / 2)} ${topp - 7.6} Q${r2(x + b * 0.7)} ${topp - 7.6} ${r2(x + b * 0.7)} ${topp - 4} Q${x + b - 1} ${topp - 3} ${x + b} ${topp} Z`} fill={m.flate} />
    )
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,58 24,54 52,57 96,53 96,64 0,64" fill={S.stein.skygge} />
          {/* Westerkerk: tårnet i tre avsatser med den blå keiserkrona på toppen. */}
          <rect x="80" y="28" width="7" height="30" fill={S.tegl.skygge} />
          <rect x="81" y="18" width="5" height="10" fill={S.stein.lys} />
          <rect x="81.8" y="11" width="3.4" height="7" fill={S.stein.lys} />
          <circle cx="83.5" cy="9.6" r="2" fill={S.marine.lys} />
          <line x1="83.5" y1="7.6" x2="83.5" y2="4.4" stroke={S.gull.flate} strokeWidth="0.4" />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <Kantfade>
        <rect x="0" y={kai - 2} width="96" height="2" fill={S.stein.lys} />
        <rect x="0" y={kai} width="96" height="4" fill={S.stein.flate} />
        <rect x="0" y={kai + 4} width="96" height="0.8" fill={S.stein.skygge} />
      </Kantfade>
      <Slagskygge x1={3} x2={67} y={kai - 2} lengde={10} d={8} />
      {/* Husene, med gavl, vinduer, heisebjelke og trapp opp til døra. */}
      {hus.map(([x, b, h, slag, m], i) => {
        const topp = kai - 2 - h
        return (
          <g key={x}>
            <polygon points={pkt([x + b, kai - 2], inn(x + b, kai - 2, 6), inn(x + b, topp, 6), [x + b, topp])} fill={m.skygge} />
            <rect x={x} y={topp} width={b} height={h} fill={m.flate} />
            <rect x={x} y={topp} width="1" height={h} fill={m.lys} />
            {gavl(x, b, topp, slag, m)}
            <rect x={r2(x + b / 2 - 0.4)} y={r2(topp - 6.6)} width="0.8" height="2.4" fill={S.mork.flate} />
            <line x1={r2(x + b / 2)} y1={r2(topp - 5.6)} x2={r2(x + b / 2 + 2.6)} y2={r2(topp - 5.6)} stroke={S.mork.flate} strokeWidth="0.5" />
            {Array.from({ length: Math.floor((h - 8) / e) + 1 }, (_, k) => (
              <Vindusrad key={k} x={r2(x + 1.8)} y={r2(topp + 2 + k * e)} antall={2} b={r2((b - 5.4) / 2)} h={4.2} mellom={1.8} karm={S.hvit.lys} tent={(k + i) % 3 === 0 ? 1 : 0} start={k + i} tennes={k === 1 ? i : undefined} />
            ))}
            <rect x={r2(x + b / 2 - 1.4)} y={kai - 7.6} width="2.8" height="5.6" fill={i === 2 ? S.gran.flate : S.mork.flate} />
            {i === 2 && <circle cx={r2(x + b / 2 + 0.6)} cy={kai - 4.6} r="0.3" fill={S.gull.lys} />}
          </g>
        )
      })}
      {/* Buebroa over grachten, med syklene mot rekkverket. */}
      <path d={`M68 ${kai - 2} Q80 ${kai - 9} 92 ${kai - 2} V${kai + 4} H88 Q80 ${kai - 3} 72 ${kai + 4} H68 Z`} fill={S.tegl.flate} />
      <path d={`M68 ${kai - 2} Q80 ${kai - 9} 92 ${kai - 2}`} fill="none" stroke={S.tegl.lys} strokeWidth="1" />
      {[72, 77, 82, 87].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={r2(kai - 6.2 + Math.abs(x - 80) * 0.5)} r="1.4" fill="none" stroke={S.mork.flate} strokeWidth="0.4" />
          <circle cx={x + 3} cy={r2(kai - 6.2 + Math.abs(x + 3 - 80) * 0.5)} r="1.4" fill="none" stroke={[S.vin.flate, S.marine.flate, S.mork.lys, S.oker.flate][i]} strokeWidth="0.4" />
        </g>
      ))}
      {/* Husbåten i kanalen. */}
      <g className="anim-duve">
        <rect x="14" y={g + 1} width="34" height="3.6" rx="1" fill={S.treMork.flate} />
        <rect x="18" y={g - 4} width="24" height="5" fill={S.gran.flate} />
        <rect x="18" y={g - 4.8} width="24" height="0.8" fill={S.gran.lys} />
        <Vindusrad x={20} y={g - 3} antall={5} b={2.6} h={2.6} mellom={1.8} karm={S.hvit.lys} tent={2} />
      </g>
      <Figur x={9} y={kai - 1.2} avstand="fjern" klaer={S.oker} />
      <Figur x={63} y={kai - 1.4} avstand="fjern" klaer={S.marine} vendt={-1} />
    </Lerret>
  )
}

/**
 * Palazzoen i Trastevere (fjern avstand, Pakke 59): et okergult bypalass i
 * fire etasjer med buede vinduer i gateplanet, grønne skodder, en gesims med
 * dypt takutstikk og takterrasse med pergola. En vespa ved døra, en pinje som
 * skjermer, og Peterskirkens kuppel i dis bak. I scenen rører pinjen seg og
 * lyset går av og på.
 */
function Roma({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  const etasjeY = (k: number) => r2(fot - (k + 1) * e + 2.2)
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,62 26,58 56,61 96,57 96,68 0,68" fill={S.stein.skygge} />
          {/* Peterskirken: tamburen, kuppelen og lanternen. */}
          <rect x="70" y="40" width="18" height="18" fill={S.stein.lys} />
          <rect x="72" y="34" width="14" height="6" fill={S.stein.lys} />
          <path d="M71 34 Q79 16 87 34 Z" fill={S.metall.lys} />
          <rect x="77.8" y="20" width="2.4" height="4" fill={S.stein.lys} />
          <line x1="79" y1="20" x2="79" y2="16.4" stroke={S.gull.flate} strokeWidth="0.4" />
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Slagskygge x1={6} x2={70} y={fot} lengde={12} d={12} />
      {/* Palasset i okerpuss. */}
      <Kloss x={6} y={fot} b={62} h={4 * e + 2} d={12} m={S.oker} />
      <rect x="6" y={fot - 8} width="62" height="8" fill={S.oker.skygge} />
      {[2, 3, 4].map((k) => (
        <g key={k}>
          <rect x="6" y={r2(fot - k * e + 2.6)} width="62" height="0.6" fill={S.oker.lys} />
          {[10, 20, 30, 40, 50, 60].map((x, i) => (
            <g key={x}>
              <rect x={r2(x - 2.4)} y={etasjeY(k - 1)} width="1.6" height="4.6" fill={S.gran.skygge} />
              <rect x={r2(x - 0.8)} y={etasjeY(k - 1)} width="2.6" height="4.6" fill={(k + i) % 4 === 0 ? S.vinduLys.flate : S.glass.skygge} />
              <rect x={r2(x + 1.8)} y={etasjeY(k - 1)} width="1.6" height="4.6" fill={S.gran.skygge} />
            </g>
          ))}
        </g>
      ))}
      {/* Gateplanet: buede vinduer og porten. */}
      {[10, 20, 40, 50, 60].map((x) => (
        <path key={x} d={`M${x - 2.2} ${fot} V${fot - 4} Q${x} ${fot - 6.6} ${x + 2.2} ${fot - 4} V${fot} Z`} fill={S.glass.skygge} />
      ))}
      <path d={`M27 ${fot} V${fot - 5} Q30 ${fot - 8.6} 33 ${fot - 5} V${fot} Z`} fill={S.treMork.flate} />
      {/* Gesimsen med det dype takutstikket og takterrassen. */}
      <rect x="4" y={r2(fot - 4 * e - 3.4)} width="66" height="1.6" fill={S.oker.lys} />
      <polygon points={pkt([3, fot - 4 * e - 3.4], [71, fot - 4 * e - 3.4], [69, fot - 4 * e - 6.6], [5, fot - 4 * e - 6.6])} fill={S.tegl.flate} />
      <polygon points={pkt([71, fot - 4 * e - 3.4], inn(71, fot - 4 * e - 3.4, 12), inn(69, fot - 4 * e - 6.6, 12), [69, fot - 4 * e - 6.6])} fill={S.tegl.skygge} />
      <g>
        {[46, 52, 58, 64].map((x) => (
          <line key={x} x1={x} y1={r2(fot - 4 * e - 6.6)} x2={x} y2={r2(fot - 4 * e - 12)} stroke={S.treverk.flate} strokeWidth="0.6" />
        ))}
        <rect x="45" y={r2(fot - 4 * e - 12.6)} width="20" height="0.8" fill={S.treverk.lys} />
        <rect x="46" y={r2(fot - 4 * e - 13.4)} width="18" height="1.2" fill={S.gress.flate} opacity="0.8" />
      </g>
      {/* Pinjen og vespaen. */}
      <g className="anim-svai">
        <rect x="81" y={fot - 22} width="1.4" height="24" fill={S.treMork.flate} />
        <ellipse cx="81.6" cy={fot - 24} rx="11" ry="4.6" fill={S.gran.flate} />
        <ellipse cx="79.6" cy={fot - 25.4} rx="7" ry="2.6" fill={S.gran.lys} />
      </g>
      <g>
        <path d={`M20 ${g + 2} Q20 ${g - 3} 24 ${g - 3} H26 L28 ${g - 6} M24 ${g - 3} Q29 ${g - 3} 30 ${g + 1}`} fill="none" stroke={S.petrol.flate} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="21" cy={g + 2.6} r="1.6" fill={S.mork.flate} />
        <circle cx="29.6" cy={g + 2.6} r="1.6" fill={S.mork.flate} />
      </g>
      <Figur x={40} y={fot + 4.4} avstand="fjern" klaer={S.vin} />
      <Figur x={64} y={fot + 4.6} avstand="fjern" klaer={S.marine} vendt={-1} />
    </Lerret>
  )
}

/**
 * Leiligheten i Le Marais (fjern avstand, Pakke 59): en Haussmann-gård i lys
 * kalkstein, seks etasjer med smijernsbalkonger langs andre og femte, et grått
 * mansardtak av sink med kvistvinduer og piper, og en kafé med vinrød markise
 * og småbord på fortauet. Eiffeltårnet i dis bak. I scenen går lyset av og på.
 */
function Paris({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  const topp = fot - 5 * e - 2
  const etasjeY = (k: number) => r2(fot - (k + 1) * e + 2.4)
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points="0,64 30,60 62,63 96,59 96,70 0,70" fill={S.stein.skygge} />
          {/* Eiffeltårnet: de fire beina, de to plattformene og spiret. */}
          <path d="M74 58 Q78.6 40 80.4 24 L81.6 24 Q83.4 40 88 58 H85 Q82.4 50 81 44 Q79.6 50 77 58 Z" fill={S.metall.skygge} />
          <rect x="76.6" y="44" width="8.8" height="1" fill={S.metall.flate} />
          <rect x="78.8" y="33" width="4.4" height="0.8" fill={S.metall.flate} />
          <line x1="81" y1="24" x2="81" y2="14" stroke={S.metall.skygge} strokeWidth="0.8" />
        </Dis>
      </Kantfade>
      <Bakke type="fortau" />
      <Slagskygge x1={4} x2={76} y={fot} lengde={12} d={12} />
      {/* Gården i kalkstein, med fuger og vindusrader. */}
      <Kloss x={4} y={fot} b={72} h={5 * e + 2} d={12} m={S.puss} />
      {[1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect x="4" y={r2(fot - k * e - 0.6)} width="72" height="0.5" fill={S.puss.skygge} />
          <Vindusrad x={7} y={etasjeY(k)} antall={10} b={3} h={k === 1 ? 5.2 : 4.6} mellom={3.9} karm={S.hvit.lys} tent={k === 3 ? 4 : 0} start={k} tennes={k === 2 ? 6 : undefined} />
        </g>
      ))}
      {/* Smijernsbalkongene langs andre og femte etasje. */}
      {[1, 4].map((k) => (
        <g key={k}>
          <rect x="4" y={r2(etasjeY(k) + 4.6)} width="72" height="0.9" fill={S.puss.lys} />
          <rect x="4" y={r2(etasjeY(k) + 2.4)} width="72" height="0.4" fill={S.mork.flate} />
          {Array.from({ length: 36 }, (_, i) => r2(4.8 + i * 2)).map((x) => (
            <line key={x} x1={x} y1={r2(etasjeY(k) + 2.4)} x2={x} y2={r2(etasjeY(k) + 4.6)} stroke={S.mork.flate} strokeWidth="0.25" />
          ))}
        </g>
      ))}
      {/* Mansardtaket i sink, kvistene og pipene. */}
      <polygon points={pkt([3, topp], [77, topp], [74, topp - 7], [6, topp - 7])} fill={S.skifer.lys} />
      <polygon points={pkt([77, topp], inn(77, topp, 12), inn(74, topp - 7, 12), [74, topp - 7])} fill={S.skifer.skygge} />
      <rect x="3" y={topp} width="74" height="1.2" fill={S.puss.lys} />
      {[11, 23, 35, 47, 59, 69].map((x) => (
        <g key={x}>
          <rect x={x} y={topp - 5.6} width="3.2" height="4" fill={S.glass.skygge} stroke={S.hvit.lys} strokeWidth="0.4" />
          <polygon points={pkt([x - 0.4, topp - 5.6], [x + 1.6, topp - 7], [x + 3.6, topp - 5.6])} fill={S.skifer.flate} />
        </g>
      ))}
      {[17, 41, 64].map((x) => (
        <g key={x}>
          <rect x={x} y={topp - 10} width="4" height="3.4" fill={S.tegl.flate} />
          {[0.6, 1.8, 3].map((dx) => (
            <rect key={dx} x={r2(x + dx - 0.3)} y={topp - 11} width="0.6" height="1" fill={S.tegl.skygge} />
          ))}
        </g>
      ))}
      {/* Kafeen i gateplanet: markisen og småbordene på fortauet. */}
      <rect x="4" y={fot - 8} width="72" height="8" fill={S.vinduLys.skygge} />
      <rect x="8" y={fot - 6.4} width="28" height="6.4" fill={S.glass.skygge} />
      <polygon points={pkt([6, fot - 8.6], [38, fot - 8.6], [40, fot - 5.4], [4, fot - 5.4])} fill={S.vin.flate} />
      <rect x="4" y={fot - 5.8} width="36" height="0.4" fill={S.vin.skygge} />
      <rect x="52" y={fot - 7} width="4" height="7" fill={S.marine.skygge} />
      {[10, 20, 30].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={fot + 1.4} rx="2" ry="0.5" fill={S.metall.lys} />
          <line x1={x} y1={fot + 1.4} x2={x} y2={fot + 4} stroke={S.mork.flate} strokeWidth="0.3" />
        </g>
      ))}
      <Figur x={14} y={fot + 4.4} avstand="fjern" klaer={S.mork} />
      <Figur x={46} y={fot + 4.6} avstand="fjern" klaer={S.oker} vendt={-1} />
      <Figur x={84} y={g - 3.6} avstand="fjern" klaer={S.marine} />
    </Lerret>
  )
}

/**
 * En palme som står på (x, y), `h` enheter høy: en buet stamme og blader som
 * henger ut fra toppen. `boy` sier hvilken vei stammen bøyer.
 */
function Palme({ x, y = GRUNNLINJE, h, boy = 1 }: { x: number; y?: number; h: number; boy?: 1 | -1 }) {
  const tx = r2(x + boy * h * 0.16)
  const ty = r2(y - h)
  const blader: [number, number, string][] = [
    [-0.42, 0.14, S.gran.skygge],
    [0.44, 0.16, S.gran.skygge],
    [-0.34, -0.1, S.gran.flate],
    [0.36, -0.06, S.gran.flate],
    [-0.12, -0.2, S.lov.lys],
    [0.14, -0.18, S.lov.flate],
    [0.06, 0.24, S.gran.flate],
  ]
  return (
    <g>
      <ellipse cx={r2(x + h * 0.1)} cy={y} rx={r2(h * 0.22)} ry={r2(h * 0.04)} fill="#000000" opacity="0.2" />
      <path d={`M${x} ${y} Q${r2(x + boy * h * 0.02)} ${r2(y - h * 0.55)} ${tx} ${ty}`} fill="none" stroke={S.treverk.flate} strokeWidth={r2(h * 0.06)} strokeLinecap="round" />
      {blader.map(([dx, dy, farge], i) => {
        const ex = r2(tx + dx * h)
        const ey = r2(ty + dy * h)
        const mx = r2(tx + dx * h * 0.5)
        return <path key={i} d={`M${tx} ${ty} Q${mx} ${r2(ty + dy * h * 0.5 - h * 0.1)} ${ex} ${ey} Q${mx} ${r2(ty + dy * h * 0.5 - h * 0.02)} ${tx} ${ty} Z`} fill={farge} />
      })}
    </g>
  )
}

/**
 * Villaen på Palmen (fjern avstand, Palm Jumeirah): en hvit, moderne villa i
 * to etasjer med glass og utkragede terrasser, infinitybasseng, palmer og
 * egen strand mot Persiabukta, en yacht på vannet og Burj Al Arab som et seil
 * i dis ute i havet.
 */
function Dubai({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 8
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          {/* Burj Al Arab: seilet med masta og helikopterplattformen. */}
          <path d={`M78 ${HORISONT} Q78.4 42 81 32 Q85.4 41 86.4 ${HORISONT} Z`} fill={S.hvit.lys} />
          <path d={`M81 32 Q84.4 42 86.4 ${HORISONT} H84 Q83 43 81 32 Z`} fill={S.hvit.skygge} />
          <line x1="78" y1={HORISONT} x2="81" y2="29" stroke={S.stein.flate} strokeWidth="0.5" />
          <rect x="78.4" y="40" width="2.6" height="0.6" fill={S.stein.flate} />
          <rect x="90" y="44" width="1.6" height="12" fill={S.stein.lys} />
          <rect x="90.5" y="36" width="0.6" height="8" fill={S.stein.lys} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Stranda og hagen. */}
      <Kantfade>
        <polygon points={`0,${g - 12} 96,${g - 14} 96,${g + 12} 0,${g + 12}`} fill={S.puss.lys} />
        <polygon points={`0,${g - 12} 96,${g - 14} 96,${g - 10} 0,${g - 8}`} fill={S.gress.flate} />
        <path d={`M0 ${g + 7} Q30 ${g + 4} 60 ${g + 6} T96 ${g + 5}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" opacity="0.8" />
      </Kantfade>
      {/* Yachten ute på vannet. */}
      <g className="anim-duve">
        <path d={`M8 ${HORISONT + 6} L24 ${HORISONT + 5.6} Q23 ${HORISONT + 8} 21 ${HORISONT + 8.2} L10 ${HORISONT + 8.2} Z`} fill={S.hvit.lys} />
        <rect x="12" y={HORISONT + 3.4} width="8" height="2.2" rx="0.6" fill={S.hvit.flate} />
        <rect x="13" y={HORISONT + 3.8} width="6" height="0.8" fill={S.glass.skygge} />
      </g>
      {/* Villaen: to etasjer i hvitt med glass, den øverste kraget ut. */}
      <Slagskygge x1={22} x2={66} y={fot} lengde={12} d={14} />
      <Kloss x={22} y={fot} b={40} h={8} d={14} m={S.hvit} />
      <rect x="24" y={fot - 6.6} width="36" height="5.6" fill={S.glass.skygge} />
      <rect x="40" y={fot - 6.6} width="10" height="5.6" fill={S.vinduLys.flate} opacity="0.8" />
      {[30, 36, 42, 48, 54].map((x) => (
        <rect key={x} x={x} y={fot - 6.6} width="0.4" height="5.6" fill={S.hvit.lys} />
      ))}
      <Kloss x={30} y={fot - 8} b={34} h={7.4} d={12} m={S.hvit} />
      <rect x="32" y={fot - 14.4} width="26" height="5" fill={S.glass.flate} />
      <rect x="32" y={fot - 14.4} width="10" height="5" fill={S.glass.lys} opacity="0.5" />
      <Kloss x={28} y={fot - 15.4} b={38} h={1.2} d={13} m={S.hvit} />
      <Glans points={`24,${fot - 6.6} 30,${fot - 6.6} 26,${fot - 1} 24,${fot - 1}`} />
      {/* Infinitybassenget foran. */}
      <rect x="18" y={fot + 1.6} width="48" height="3.2" fill={S.sjo.lys} />
      <rect x="18" y={fot + 1.6} width="48" height="0.6" fill={S.hvit.lys} opacity="0.7" />
      <rect x="18" y={fot + 4.8} width="48" height="0.8" fill={S.hvit.flate} />
      {[22, 28].map((x) => (
        <rect key={x} x={x} y={fot + 6.6} width="4" height="1" rx="0.4" fill={S.hvit.lys} />
      ))}
      <Palme x={12} y={fot + 2} h={22} boy={-1} />
      <Palme x={72} y={fot + 1} h={24} />
      <Palme x={82} y={fot + 3} h={18} />
      <Figur x={46} y={fot + 8} avstand="fjern" klaer={S.hvit} />
    </Lerret>
  )
}

/** La Concha, fjellet over Marbella, i dis: en lang rygg med den runde «skjellet» øverst. */
function LaConcha({ dx = 0 }: { dx?: number }) {
  return (
    <Kantfade>
      <Dis>
        <polygon points={pkt([0 + dx, HORISONT + 1], [12 + dx, 46], [28 + dx, 40], [40 + dx, 28], [48 + dx, 22], [56 + dx, 24], [62 + dx, 32], [74 + dx, 40], [90 + dx, 44], [110 + dx, HORISONT + 1])} fill={S.fjell.flate} />
        <polygon points={pkt([48 + dx, 22], [56 + dx, 24], [62 + dx, 32], [52 + dx, 36], [46 + dx, 30])} fill={S.fjell.skygge} />
      </Dis>
    </Kantfade>
  )
}

/**
 * Ferieleiligheten i Marbella (fjern avstand, høysesong om sommeren): en hvit
 * andalusisk leilighetsblokk i tre terrasser oppover lia, med takstein,
 * buede vinduer og bougainvillea over rekkverkene, bassenget foran med
 * solsenger og en parasoll, folk i vannet, palmer og La Concha i dis bak. I
 * scenen rører palmene seg og vannet i bassenget krusner seg (G10).
 */
function Ferieleilighet({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  /** Buede vinduer i en rad. */
  const buer = (x: number, y: number, antall: number, mellom: number) =>
    Array.from({ length: antall }, (_, i) => {
      const vx = r2(x + i * mellom)
      return <path key={i} d={`M${vx} ${y + 4} V${y + 1.4} Q${r2(vx + 1.2)} ${y} ${r2(vx + 2.4)} ${y + 1.4} V${y + 4} Z`} fill={i % 4 === 1 ? S.vinduLys.flate : S.glass.skygge} />
    })
  const blomster = (x: number, y: number, b: number) =>
    Array.from({ length: Math.floor(b / 3) }, (_, i) => (
      <circle key={i} cx={r2(x + 1.4 + i * 3)} cy={r2(y + (i % 2) * 0.6)} r="1.3" fill={i % 3 ? S.vin.lys : S.vin.flate} />
    ))
  return (
    <Lerret størrelse={størrelse}>
      <LaConcha />
      <Bakke type="gress" />
      <Slagskygge x1={12} x2={72} y={fot} lengde={12} d={10} />
      {/* Øverste terrasse, med valmtak i takstein. */}
      <Kloss x={30} y={fot - 30} b={30} h={11} d={10} m={S.hvit} />
      <polygon points={pkt([28.6, fot - 41], [61.4, fot - 41], [56, fot - 47], [34, fot - 47])} fill={S.tegl.flate} />
      <polygon points={pkt([61.4, fot - 41], inn(61.4, fot - 41, 10), inn(56, fot - 47, 6), [56, fot - 47])} fill={S.tegl.skygge} />
      {buer(33, fot - 38, 7, 3.8)}
      {/* Midterste terrasse. */}
      <Kloss x={20} y={fot - 15} b={48} h={12} d={10} m={S.hvit} />
      <rect x="20" y={fot - 27.6} width="48" height="1.2" fill={S.tegl.flate} />
      {buer(23, fot - 24, 11, 4)}
      {blomster(20, fot - 27.4, 48)}
      {/* Nederste terrasse. */}
      <Kloss x={12} y={fot} b={60} h={13} d={10} m={S.hvit} />
      <rect x="12" y={fot - 13.6} width="60" height="1.2" fill={S.tegl.flate} />
      {buer(15, fot - 10, 14, 4)}
      {blomster(12, fot - 13.4, 60)}
      <rect x="12" y={fot - 3} width="60" height="3" fill={S.hvit.skygge} opacity="0.6" />
      {/* Bassenget, solsengene og parasollen. */}
      <rect x="18" y={fot + 2} width="40" height="4" fill={S.sjo.lys} />
      <rect x="18" y={fot + 2} width="40" height="0.6" fill={S.hvit.lys} opacity="0.8" />
      <circle className="anim-duve" cx="30" cy={fot + 3.6} r="0.8" fill={S.hud.flate} />
      <path className="anim-boelge" d={`M28.4 ${fot + 4.6} q1.6 -0.8 3.2 0`} fill="none" stroke={S.hvit.lys} strokeWidth="0.3" />
      <path className="anim-boelge sen" d={`M44 ${fot + 4} q1.6 -0.8 3.2 0`} fill="none" stroke={S.hvit.lys} strokeWidth="0.3" />
      {[60, 64.6].map((x) => (
        <rect key={x} x={x} y={fot + 4} width="3.6" height="1" rx="0.4" fill={S.hvit.lys} />
      ))}
      <line x1="66" y1={fot + 4} x2="66" y2={fot - 2.6} stroke={S.mork.lys} strokeWidth="0.3" />
      <polygon points={pkt([62, fot - 1.6], [66, fot - 3.4], [70, fot - 1.6])} fill={S.oker.lys} />
      <Figur x={63} y={fot + 4} avstand="fjern" klaer={S.vin} />
      <g className="anim-svai sen">
        <Palme x={7} y={fot + 4} h={24} boy={-1} />
      </g>
      <g className="anim-svai">
        <Palme x={82} y={fot + 5} h={22} />
      </g>
    </Lerret>
  )
}

/**
 * Strandhotellet på Costa del Sol (fjern avstand, høysesong om sommeren): et
 * bredt hvitt hotell med balkonger i hver etasje og en lavere fløy, palmer og
 * basseng foran, stranda med parasoller, solsenger og folk, badende i havet
 * nederst og La Concha i dis bak.
 */
function Strandhotell({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 14
  const e = maal('fjern', 'etasje')
  const parasoller: [number, number, string][] = [
    [10, g - 6, S.oker.lys],
    [24, g - 4, S.hvit.lys],
    [38, g - 7, S.marine.lys],
    [54, g - 5, S.oker.lys],
    [70, g - 6, S.hvit.lys],
    [84, g - 4, S.vin.lys],
  ]
  return (
    <Lerret størrelse={størrelse}>
      <LaConcha dx={-8} />
      {/* Stranda, og havet nederst. */}
      <Kantfade>
        <rect x="0" y={fot - 2} width="96" height="20" fill={S.puss.lys} />
        <rect x="0" y={fot - 2} width="96" height="3" fill={S.gress.flate} />
      </Kantfade>
      <Bunnfade>
        <path d={`M0 ${g + 2} Q30 ${g} 60 ${g + 1.6} T96 ${g + 1} V96 H0 Z`} fill={S.sjo.flate} />
        <path d={`M0 ${g + 2} Q30 ${g} 60 ${g + 1.6} T96 ${g + 1}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.8" />
        <polyline className="anim-boelge" points={`20,${g + 7} 24,${g + 5.8} 28,${g + 7}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.7" strokeLinecap="round" />
        <polyline className="anim-boelge sen" points={`66,${g + 9} 70,${g + 7.8} 74,${g + 9}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.7" strokeLinecap="round" />
      </Bunnfade>
      <Slagskygge x1={8} x2={88} y={fot} lengde={12} d={12} />
      {/* Den lave fløyen til høyre. */}
      <Kloss x={70} y={fot} b={18} h={24} d={10} m={S.hvit} />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <rect x="71" y={r2(fot - (k + 1) * e + 2)} width="16" height="4" fill={S.glass.skygge} />
          <rect x="70" y={r2(fot - (k + 1) * e + 5.4)} width="18" height="1" fill={S.hvit.lys} />
        </g>
      ))}
      {/* Hovedbygget med balkonger i alle etasjer. */}
      <Kloss x={8} y={fot} b={62} h={48} d={12} m={S.hvit} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <g key={k}>
          <rect x="9" y={r2(fot - (k + 1) * e + 2)} width="60" height="4" fill={S.glass.skygge} />
          {k === 2 || k === 4 ? <rect x={20 + k * 6} y={r2(fot - (k + 1) * e + 2)} width="8" height="4" fill={S.vinduLys.flate} opacity="0.8" /> : null}
          <rect x="8" y={r2(fot - (k + 1) * e + 5.4)} width="62" height="1.2" fill={S.hvit.lys} />
          {[18, 28, 38, 48, 58].map((x) => (
            <rect key={x} x={x} y={r2(fot - (k + 1) * e + 1.4)} width="0.6" height="5" fill={S.hvit.flate} />
          ))}
        </g>
      ))}
      <rect x="8" y={fot - 49.4} width="62" height="1.4" fill={S.hvit.lys} />
      <Glans points={`9,${fot - 46} 18,${fot - 46} 12,${fot - 4} 9,${fot - 4}`} />
      {/* Bassenget og palmene foran hotellet. */}
      <rect x="24" y={fot + 1.4} width="30" height="2.6" fill={S.sjo.lys} />
      <Palme x={16} y={fot + 3} h={22} boy={-1} />
      <Palme x={62} y={fot + 3} h={20} />
      {/* Parasollene, solsengene og folk på stranda. */}
      {parasoller.map(([x, y, farge]) => (
        <g key={x}>
          <rect x={x - 3} y={y + 1.6} width="3.6" height="0.9" rx="0.4" fill={S.hvit.lys} />
          <line x1={x} y1={y + 2} x2={x} y2={y - 3} stroke={S.mork.lys} strokeWidth="0.3" />
          <polygon points={pkt([x - 3.4, y - 2], [x, y - 3.6], [x + 3.4, y - 2])} fill={farge} />
        </g>
      ))}
      <Figur x={31} y={g - 2} avstand="fjern" klaer={S.marine} />
      <Figur x={77} y={g - 1.4} avstand="fjern" klaer={S.vin} vendt={-1} />
      {[40, 56].map((x) => (
        <circle key={x} cx={x} cy={g + 6} r="0.8" fill={S.hud.flate} />
      ))}
    </Lerret>
  )
}

/**
 * Matterhorn i dis, med den skjeve toppen som bøyer seg mot høyre og snø i
 * renner nedover. `x` er toppen, `s` skalaen.
 */
function Matterhorn({ x, s = 1 }: { x: number; s?: number }) {
  const p = (dx: number, y: number): [number, number] => [r2(x + dx * s), r2(HORISONT + 1 - (HORISONT + 1 - y) * s)]
  return (
    <Kantfade>
      <Dis>
        <polygon points={pkt(p(-34, HORISONT + 1), p(-14, 30), p(-4, 12), p(0, 8), p(3, 10), p(6, 18), p(18, 34), p(36, HORISONT + 1))} fill={S.fjell.flate} />
        <polygon points={pkt(p(0, 8), p(3, 10), p(6, 18), p(18, 34), p(36, HORISONT + 1), p(8, HORISONT + 1), p(2, 26))} fill={S.fjell.skygge} />
        <path d={`M${p(-2, 12).join(' ')} L${p(-6, 24).join(' ')} M${p(1, 14).join(' ')} L${p(-1, 30).join(' ')} M${p(-10, 28).join(' ')} L${p(-16, 40).join(' ')} M${p(8, 22).join(' ')} L${p(10, 34).join(' ')}`} stroke={S.sno.lys} strokeWidth={r2(1.2 * s)} />
      </Dis>
    </Kantfade>
  )
}

/** Granene i Zermatt, med snø på greinene. */
function Snogran({ x, y = GRUNNLINJE, h }: { x: number; y?: number; h: number }) {
  return (
    <g>
      <Tre x={x} y={y} h={h} slag="gran" />
      {[0, 1, 2].map((i) => {
        const topp = y - h + i * h * 0.24
        const b = h * (0.2 + i * 0.09)
        return <polygon key={i} points={pkt([x, topp], [x - b * 0.7, topp + h * 0.22], [x + b * 0.3, topp + h * 0.16])} fill={S.sno.lys} />
      })}
    </g>
  )
}

/**
 * Skileiligheten i Zermatt (fjern avstand, høysesong om vinteren): et stort
 * chaletbygg med steinsokkel og etasjer i mørk lerk, hvite balkonger, varmt lys
 * i vinduene og tung snø på taket, granene med snø, skiløpere med skiene på
 * skulderen og Matterhorn bak. I scenen går skiløperne og lyset går av og
 * på (G10).
 */
function Skileilighet({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  return (
    <Lerret størrelse={størrelse}>
      <Matterhorn x={62} />
      <Bakke type="sno" />
      <Slagskygge x1={18} x2={64} y={fot} lengde={12} d={14} />
      {/* Sokkelen i stein og etasjene i lerk. */}
      <Kloss x={18} y={fot} b={46} h={10} d={14} m={S.stein} />
      <Kloss x={18} y={fot - 10} b={46} h={22} d={14} m={S.treMork} tak={false} />
      <Kledning x={18} y={fot - 32} b={46} h={22} farge={S.treMork.skygge} mellom={2.4} />
      <Saltak x={18} y={fot - 32} b={46} d={14} h={13} m={S.sno} gavl={S.treMork} overheng={3} />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <Vindusrad x={21} y={r2(fot - 10 - (k + 1) * e + 2)} antall={8} b={3} h={3.8} mellom={2.4} tent={2} start={k} karm={S.treverk.lys} tennes={k === 1 ? 2 : undefined} />
          {k < 2 && (
            <>
              <rect x="18" y={r2(fot - 10 - (k + 1) * e + 6)} width="46" height="1" fill={S.hvit.lys} />
              {Array.from({ length: 16 }, (_, i) => r2(19 + i * 2.9)).map((x) => (
                <line key={x} x1={x} y1={r2(fot - 10 - (k + 1) * e + 7)} x2={x} y2={r2(fot - 10 - (k + 1) * e + 8.6)} stroke={S.hvit.flate} strokeWidth="0.4" />
              ))}
            </>
          )}
        </g>
      ))}
      <rect x="40" y="35" width="3.4" height="3.4" fill={S.vinduLys.flate} />
      <Vindusrad x={22} y={fot - 7.4} antall={6} b={3.4} h={3.6} mellom={3.6} tent={3} start={1} karm={S.stein.lys} />
      <rect x="54" y={fot - 7} width="4" height="7" fill={S.treverk.flate} />
      {/* Granene og skiløperne. */}
      <Snogran x={8} y={fot + 2} h={20} />
      <Snogran x={78} y={fot + 3} h={18} />
      <Snogran x={88} y={fot + 1} h={14} />
      {[
        [66, S.vin],
        [70, S.marine],
      ].map(([x, klaer]) => (
        <g key={x as number} className={x === 66 ? 'anim-glid' : 'anim-glid sen'}>
          <Figur x={x as number} y={g + 2} avstand="fjern" klaer={klaer as Materiale} />
          <line x1={(x as number) - 1.6} y1={g - 3.6} x2={(x as number) + 2.2} y2={g - 1.2} stroke={S.oker.flate} strokeWidth="0.4" />
        </g>
      ))}
    </Lerret>
  )
}

/**
 * Alpehotellet i Zermatt (fjern avstand, høysesong om vinteren): et grand
 * hotell fra belle époque i lys stein, fem etasjer med mansardtak under snø,
 * hjørnetårn med små spir, sveitserflagg på taket og varmt lys i vinduene,
 * granene med snø, skiløpere og Matterhorn stort bak til venstre.
 */
function Alpehotell({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const fot = g - 6
  const e = maal('fjern', 'etasje')
  const taarn = (x: number) => (
    <g key={x}>
      <Kloss x={x} y={fot} b={10} h={46} d={8} m={S.puss} />
      <polygon points={pkt([x - 0.6, fot - 46], [x + 5, fot - 58], [x + 10.6, fot - 46])} fill={S.skifer.flate} />
      <polygon points={pkt([x + 5, fot - 58], [x + 10.6, fot - 46], [x + 5, fot - 46])} fill={S.skifer.skygge} />
      <polygon points={pkt([x + 0.6, fot - 47.4], [x + 5, fot - 57], [x + 3.6, fot - 47.4])} fill={S.sno.lys} />
      <line x1={x + 5} y1={fot - 58} x2={x + 5} y2={fot - 61} stroke={S.mork.lys} strokeWidth="0.3" />
      {[1, 2, 3, 4].map((k) => (
        <rect key={k} x={x + 3.4} y={r2(fot - (k + 1) * e + 2.4)} width="3.2" height="4" fill={k % 2 ? S.vinduLys.flate : S.glass.skygge} />
      ))}
    </g>
  )
  return (
    <Lerret størrelse={størrelse}>
      <Matterhorn x={26} s={1.1} />
      <Bakke type="sno" />
      <Slagskygge x1={8} x2={86} y={fot} lengde={12} d={12} />
      {/* Hovedfløyen med mansardtak under snø. */}
      <Kloss x={16} y={fot} b={62} h={40} d={12} m={S.puss} />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <Vindusrad x={19} y={r2(fot - (k + 1) * e + 2.4)} antall={11} b={2.8} h={4} mellom={2.7} tent={k === 0 ? 2 : 3} start={k} karm={S.hvit.lys} />
          <rect x="16" y={r2(fot - (k + 1) * e + 7.2)} width="62" height="0.6" fill={S.puss.lys} />
        </g>
      ))}
      <polygon points={pkt([16, fot - 40], [78, fot - 40], [75, fot - 47], [19, fot - 47])} fill={S.skifer.flate} />
      <polygon points={pkt([17, fot - 41], [77, fot - 41], [75.6, fot - 46.2], [18.4, fot - 46.2])} fill={S.sno.flate} />
      {[26, 38, 50, 62].map((x) => (
        <g key={x}>
          <rect x={x} y={fot - 45.4} width="3" height="3.4" fill={S.vinduLys.flate} />
          <polygon points={pkt([x - 0.6, fot - 45.4], [x + 1.5, fot - 47.4], [x + 3.6, fot - 45.4])} fill={S.sno.lys} />
        </g>
      ))}
      <rect x="40" y={fot - 7} width="12" height="7" fill={S.vinduLys.skygge} />
      <rect x="38" y={fot - 8.6} width="16" height="1.6" fill={S.skifer.flate} />
      {/* Hjørnetårnene og sveitserflagget. */}
      {taarn(8)}
      {taarn(76)}
      <line x1="47" y1={fot - 47} x2="47" y2={fot - 56} stroke={S.hvit.lys} strokeWidth="0.4" />
      <g className="anim-flagg">
        <rect x="47.2" y={fot - 56} width="3.6" height="3.6" fill={S.faluRod.lys} />
        <path d={`M49 ${r2(fot - 55.2)} V${r2(fot - 53.2)} M48 ${r2(fot - 54.2)} H50`} stroke={S.hvit.lys} strokeWidth="0.6" />
      </g>
      {/* Granene og skiløperne. */}
      <Snogran x={4} y={g + 4} h={18} />
      <Snogran x={92} y={g + 4} h={16} />
      <Figur x={30} y={g + 3} avstand="fjern" klaer={S.marine} />
      <Figur x={62} y={g + 2} avstand="fjern" klaer={S.vin} vendt={-1} />
    </Lerret>
  )
}

/**
 * Toppleiligheten på Manhattan (fjern avstand): penthouse i glass på toppen
 * av et tårn, med takterrasse, trær i kasser, et lite basseng og noen ved
 * rekkverket, tårnets fasade som forsvinner nedover, og skylinen med Empire
 * State Building i dis rundt. I scenen blinker lyset på Empire State, vannet
 * i bassenget krusner seg og trærne rører seg i vinden der oppe (G10).
 */
function NewYork({ størrelse = 48 }: P) {
  const tak = 50
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          {/* Empire State Building: avtrappet tårn med spir. */}
          <polygon points="6,96 6,40 8,40 8,30 10,30 10,22 11.6,22 11.6,14 13,14 13,22 14.6,22 14.6,30 16.6,30 16.6,40 18.6,40 18.6,96" fill={S.stein.lys} />
          <rect x="12" y="4" width="0.6" height="10" fill={S.stein.lys} />
          <Blinklys x={12.3} y={4} r={0.7} />
          {[
            [0, 52, 7],
            [20, 46, 6],
            [74, 38, 8],
            [84, 50, 10],
            [64, 56, 9],
          ].map(([x, y, b]) => (
            <rect key={x} x={x} y={y} width={b} height={96 - y} fill={x % 3 ? S.stein.flate : S.glass.skygge} />
          ))}
        </Dis>
      </Kantfade>
      {/* Tårnet: fasaden blekner ut nedover. */}
      <Bunnfade>
        <Kloss x={24} y={110} b={48} h={60} d={14} m={S.skifer} />
        {Array.from({ length: 7 }, (_, k) => tak + 4 + k * 6).map((y, k) => (
          <Vindusrad key={y} x={25.4} y={y} antall={10} b={3} h={3.6} mellom={1.6} tent={k % 2 ? 4 : 0} start={k} tennes={k === 0 ? 6 : undefined} />
        ))}
      </Bunnfade>
      {/* Takterrassen: glassrekkverk, basseng, trær i kasser. */}
      <rect x="24" y={tak - 2.4} width="48" height="2.4" fill={S.glass.lys} opacity="0.55" />
      <rect x="24" y={tak - 2.6} width="48" height="0.4" fill={S.metall.lys} />
      <polygon points={pkt([56, tak - 1.2], [70, tak - 1.2], inn(70, tak - 1.2, 8), inn(56, tak - 1.2, 8))} fill={S.sjo.lys} />
      <path className="anim-boelge" d={`M60 ${tak - 2.6} q1.6 -0.6 3.2 0`} fill="none" stroke={S.hvit.lys} strokeWidth="0.3" />
      {/* Penthouset i glass, med lys inne. */}
      <Slagskygge x1={30} x2={56} y={tak - 1} lengde={8} d={10} />
      <Kloss x={30} y={tak - 1} b={26} h={12} d={10} m={S.glass} />
      <rect x="31" y={tak - 12} width="24" height="10" fill={S.vinduLys.skygge} />
      <rect x="40" y={tak - 12} width="8" height="10" fill={S.vinduLys.flate} opacity="0.85" />
      {[37, 43.4, 49.6].map((x) => (
        <rect key={x} x={x} y={tak - 12} width="0.5" height="10" fill={S.metall.flate} />
      ))}
      <Glans points={`31,${tak - 12} 36,${tak - 12} 32.6,${tak - 2} 31,${tak - 2}`} />
      <Kloss x={28.6} y={tak - 13} b={29} h={1.4} d={11} m={S.hvit} />
      {[27, 60].map((x) => (
        <g key={x}>
          <rect x={x - 2} y={tak - 3} width="4" height="2" fill={S.treMork.flate} />
          <g className={x === 27 ? 'anim-svai' : 'anim-svai sen'}>
            <Tre x={x} y={tak - 2.6} h={8} />
          </g>
        </g>
      ))}
      <Figur x={66} y={tak - 1} avstand="fjern" klaer={S.hvit} vendt={-1} />
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Bilene i ny stil (G5)

type Felgstil = 'stal' | 'eiker' | 'aero' | 'wire' | 'racing' | 'krom'

/**
 * Et bilhjul på nær avstand: dekket med en lysere kant og felgen i valgt stil.
 * Hjulet står på grunnlinja, så navet ligger `r` over den.
 */
function Bilhjul({ x, r = 6, stil, m = S.metall, kaliper }: { x: number; r?: number; stil: Felgstil; m?: Materiale; kaliper?: string }) {
  const g = GRUNNLINJE
  const cy = +(g - r).toFixed(2)
  const f = +(r * 0.66).toFixed(2)
  const punkter = (n: number, l: number, vri = 0) =>
    Array.from({ length: n }, (_, i) => {
      const v = (i / n) * Math.PI * 2 + vri
      return [+(x + Math.cos(v) * l).toFixed(2), +(cy + Math.sin(v) * l).toFixed(2)]
    })
  return (
    <g className="ikke-lakk">
      <circle cx={x} cy={cy} r={r} fill={S.mork.skygge} />
      <circle cx={x} cy={cy} r={+(r - 0.7).toFixed(2)} fill="none" stroke={S.mork.flate} strokeWidth="0.5" />
      {stil === 'stal' && (
        <>
          <circle cx={x} cy={cy} r={f} fill={m.flate} />
          <circle cx={x} cy={cy} r={+(f * 0.55).toFixed(2)} fill={m.skygge} />
          {punkter(5, f * 0.75, 0.4).map(([px, py]) => (
            <circle key={`${px}-${py}`} cx={px} cy={py} r="0.55" fill={m.skygge} />
          ))}
          <circle cx={x} cy={cy} r={+(f * 0.28).toFixed(2)} fill={m.lys} />
        </>
      )}
      {stil === 'eiker' && (
        <>
          <circle cx={x} cy={cy} r={f} fill={S.mork.flate} />
          {kaliper && <path d={`M${+(x - f * 0.8).toFixed(2)} ${+(cy - f * 0.5).toFixed(2)} A${f} ${f} 0 0 1 ${+(x + f * 0.1).toFixed(2)} ${+(cy - f * 0.95).toFixed(2)}`} fill="none" stroke={kaliper} strokeWidth="1.5" />}
          {punkter(5, f * 0.92, 0.3).map(([px, py]) => (
            <line key={`${px}-${py}`} x1={x} y1={cy} x2={px} y2={py} stroke={m.lys} strokeWidth="1.1" strokeLinecap="round" />
          ))}
          <circle cx={x} cy={cy} r={f} fill="none" stroke={m.lys} strokeWidth="0.6" />
          <circle cx={x} cy={cy} r="1" fill={m.skygge} />
        </>
      )}
      {stil === 'aero' && (
        <>
          <circle cx={x} cy={cy} r={f} fill={m.lys} />
          {punkter(4, f * 0.62, 0.2).map(([px, py]) => (
            <path key={`${px}-${py}`} d={`M${x} ${cy} Q${+((x + px) / 2 + (py - cy) * 0.4).toFixed(2)} ${+((cy + py) / 2 - (px - x) * 0.4).toFixed(2)} ${px} ${py}`} fill="none" stroke={m.flate} strokeWidth="0.9" />
          ))}
          <circle cx={x} cy={cy} r={f} fill="none" stroke={m.skygge} strokeWidth="0.5" />
          <circle cx={x} cy={cy} r="1.1" fill={m.skygge} />
        </>
      )}
      {stil === 'wire' && (
        <>
          <circle cx={x} cy={cy} r={f} fill={S.mork.flate} />
          {punkter(16, f * 0.95).map(([px, py]) => (
            <line key={`${px}-${py}`} x1={x} y1={cy} x2={px} y2={py} stroke={m.lys} strokeWidth="0.25" />
          ))}
          <circle cx={x} cy={cy} r={f} fill="none" stroke={m.lys} strokeWidth="0.7" />
          <circle cx={x} cy={cy} r="1.5" fill={m.lys} />
          <path d={`M${x - 2} ${cy}h4M${x} ${cy - 2}v4`} stroke={m.flate} strokeWidth="0.6" />
        </>
      )}
      {stil === 'racing' && (
        <>
          <circle cx={x} cy={cy} r={+(r - 1.5).toFixed(2)} fill="none" stroke={S.oker.flate} strokeWidth="0.6" />
          <circle cx={x} cy={cy} r={+(f * 0.8).toFixed(2)} fill={S.mork.flate} />
          {punkter(6, f * 0.55, 0.5).map(([px, py]) => (
            <line key={`${px}-${py}`} x1={x} y1={cy} x2={px} y2={py} stroke={S.mork.lys} strokeWidth="0.9" />
          ))}
          <circle cx={x} cy={cy} r="1" fill={m.lys} />
        </>
      )}
      {stil === 'krom' && (
        <>
          <circle cx={x} cy={cy} r={f} fill={m.lys} />
          <circle cx={x} cy={cy} r={+(f * 0.72).toFixed(2)} fill={m.flate} />
          <circle cx={x} cy={cy} r={+(f * 0.35).toFixed(2)} fill={m.lys} />
          <path d={`M${+(x - f * 0.6).toFixed(2)} ${+(cy - f * 0.5).toFixed(2)} A${f * 0.8} ${f * 0.8} 0 0 1 ${+(x + f * 0.2).toFixed(2)} ${+(cy - f * 0.78).toFixed(2)}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" opacity="0.8" />
        </>
      )}
      {/* Lys fra venstre på dekket. */}
      <path d={`M${+(x - r * 0.85).toFixed(2)} ${+(cy - r * 0.35).toFixed(2)} A${r} ${r} 0 0 1 ${+(x - r * 0.2).toFixed(2)} ${+(cy - r * 0.95).toFixed(2)}`} fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.15" />
    </g>
  )
}

/** Hjulbuen: mørk innside der karosseriet er skåret ut over hjulet. */
function Hjulbue({ x, r, bunn = 80 }: { x: number; r: number; bunn?: number }) {
  const dy = bunn - (GRUNNLINJE - 6)
  const dx = +Math.sqrt(Math.max(r * r - dy * dy, 0)).toFixed(2)
  return <path d={`M${+(x - dx).toFixed(2)} ${bunn} A${r} ${r} 0 0 1 ${+(x + dx).toFixed(2)} ${bunn} Z`} fill={S.mork.skygge} />
}

/**
 * Utstillingsrommet til bilene (som superbilen fra G1): blankt gulv, lys
 * ovenfra, bilen speiler seg i gulvet og har en mørk kontaktskygge. I scenen
 * glir et lys over lakken (`Lakksveip`, G10).
 */
function Utstilling({ størrelse, fra = 8, til = 90, children }: { størrelse: number; fra?: number; til?: number; children: () => ReactNode }) {
  return (
    <Lerret størrelse={størrelse} himmel="inne">
      <Bakke type="gulv" />
      <Speiling>{children()}</Speiling>
      <ellipse cx={(fra + til) / 2} cy={GRUNNLINJE + 0.3} rx={(til - fra) / 2} ry="2" fill="#000000" opacity="0.45" />
      {children()}
      <Lakksveip>{children()}</Lakksveip>
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Luksus: biler


/**
 * Den brukte stasjonsvognen (nær avstand, utstillingsrommet): en kantete
 * svensk stasjonsvogn i stålblått, med takboks til skiferien, svarte
 * støtfangere og stålfelger. Brukt, men stelt.
 */
function Stasjonsvogn({ størrelse = 48 }: P) {
  const m = S.sjo
  const bil = () => (
    <g>
      {/* Takboksen på takrailene. */}
      <path d="M16 56.6 Q17 52.4 22 52 L50 51.8 Q55.4 52 56.6 56.4 Z" fill={S.skifer.flate} />
      <path d="M17.6 54 Q19 52.6 22 52.4 L50 52.2 Q53.4 52.4 54.6 54 Z" fill={S.skifer.lys} />
      <rect x="11" y="56.4" width="49" height="1.3" rx="0.6" fill={S.mork.flate} />
      {/* Karosseriet: rett bakluke, langt tak, kort panser. */}
      <path d="M6 80 L5.4 70 L6 60 Q6.4 58.2 8.6 58 L60 57.6 Q63.6 57.6 65.6 59.4 L72.6 66.2 L86.6 67.6 Q90.6 68.2 91 71.4 L91.4 77.6 Q91.4 80 89 80 L80.12 80 A7.4 7.4 0 0 0 65.88 80 L29.12 80 A7.4 7.4 0 0 0 14.88 80 Z" fill={m.flate} />
      <path d="M5.8 74 L91.3 74 L91.4 77.6 Q91.4 80 89 80 L80.12 80 A7.4 7.4 0 0 0 65.88 80 L29.12 80 A7.4 7.4 0 0 0 14.88 80 L6 80 Z" fill={m.skygge} />
      <path d="M72.6 66.2 L86.6 67.6 Q89.4 68 90.4 69.6 L73.6 67.6 Z" fill={m.lys} />
      <path d="M8.6 58 L60 57.6 Q63.6 57.6 65.6 59.4 L64.6 59.8 Q62.6 58.8 60 58.8 L8.4 59.2 Z" fill={m.lys} />
      <path d="M6 66.6 L72 66.8" stroke={m.lys} strokeWidth="0.8" />
      {/* Vinduene, med stolper i lakken. */}
      <path d="M8.4 66 L8.6 60.4 L59.6 60 Q62.4 60 64 61.4 L69.4 66.2 Z" fill={S.glass.skygge} />
      <rect x="24.6" y="60" width="2.2" height="6.2" fill={m.flate} />
      <rect x="46.4" y="60" width="2.2" height="6.2" fill={m.flate} />
      <Glans points="10,60.4 21,60.2 16,66 9,66" />
      <Glans points="50,60.2 57,60 61,66 54,66" />
      {/* Dørlinjer og håndtak. */}
      <path d="M26 66.4 V79 M47.6 66.4 V79.2" stroke={m.skygge} strokeWidth="0.5" />
      <rect x="29" y="68.4" width="3" height="0.9" rx="0.4" fill={S.mork.flate} />
      <rect x="50.6" y="68.4" width="3" height="0.9" rx="0.4" fill={S.mork.flate} />
      {/* Lista, de svarte støtfangerne og lyktene. */}
      <rect x="7" y="71.6" width="83" height="0.9" fill={S.mork.flate} />
      <rect x="85.4" y="73.6" width="7" height="3.6" rx="1" fill={S.mork.flate} />
      <rect x="4.2" y="73.6" width="6" height="3.6" rx="1" fill={S.mork.flate} />
      <rect x="87.6" y="69" width="3.4" height="2.6" rx="0.6" fill={S.hvit.lys} />
      <rect x="88.4" y="71.9" width="2.4" height="1.1" fill={S.oker.lys} />
      <rect x="5.4" y="60.6" width="1.6" height="9" rx="0.5" fill={S.faluRod.lys} />
      <path d="M69.6 64 L72.6 63.6 L72.8 65.6 L70 65.8 Z" fill={m.skygge} />
      <Hjulbue x={22} r={7.4} />
      <Hjulbue x={73} r={7.4} />
      <Bilhjul x={22} stil="stal" />
      <Bilhjul x={73} stil="stal" />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={5} til={92}>{bil}</Utstilling>
}

/**
 * Den elektriske sportsbilen (nær avstand, utstillingsrommet): glatt og lav i
 * lys sølv, med glasstak, lysstriper foran og bak, skjulte dørhåndtak og
 * aerofelger. Ingen grill — den trenger ingen.
 */
function Elbil({ størrelse = 48 }: P) {
  const m = S.metall
  const bil = () => (
    <g>
      <path d="M7 80 L6.4 73.4 Q6.6 69.6 10.6 68.8 L24 67.4 Q32 63.2 42 62.8 Q51 62.6 57 64.6 L70 68.2 L84.4 69.6 Q89.6 70.4 90.6 73.6 L90.8 77.6 Q90.6 80 88.2 80 L79.07 80 A7.4 7.4 0 0 0 64.93 80 L30.07 80 A7.4 7.4 0 0 0 15.93 80 Z" fill={m.flate} />
      <path d="M6.6 75 L90.8 75 L90.8 77.6 Q90.6 80 88.2 80 L79.07 80 A7.4 7.4 0 0 0 64.93 80 L30.07 80 A7.4 7.4 0 0 0 15.93 80 L7 80 Z" fill={m.skygge} />
      <path d="M24.6 67.2 Q32.2 63.4 42 63.2 Q51 63 56.6 64.8 L56 65.4 Q50.6 63.8 42 64 Q33 64.2 26.4 67.2 Z" fill={m.lys} />
      <path d="M70 68.2 L84.4 69.6 Q88 70.2 89.6 71.6 L71 69.2 Z" fill={m.lys} />
      <path d="M10 71 Q40 69.6 86 71.6" fill="none" stroke={m.lys} strokeWidth="0.7" />
      {/* Glasstaket og sidevinduene i ett, mørkt tonet. */}
      <path d="M26.4 67.6 Q33 64 42 63.8 Q50.4 63.6 56.4 65.4 L65 68 L26.4 67.8 Z" fill={S.mork.flate} />
      <rect x="44.6" y="63.8" width="1.3" height="4.1" fill={m.flate} />
      <Glans points="28,67.4 35,64.4 40,64.2 33,67.8" />
      {/* Dørlinja og de flate håndtakene. */}
      <path d="M44.8 68 Q45.6 72.6 45 78.4" fill="none" stroke={m.skygge} strokeWidth="0.5" />
      <rect x="34" y="69.4" width="3.6" height="0.7" rx="0.35" fill={m.skygge} />
      <rect x="54" y="69.6" width="3.6" height="0.7" rx="0.35" fill={m.skygge} />
      {/* Lysstripa foran, luftinntaket og lysstripa bak. */}
      <path d="M82.8 70 L90 72 L89.8 73 L82.6 71.2 Z" fill={S.hvit.lys} />
      <path d="M84 76.2 L90.6 76 L90.4 78 L84.6 78 Z" fill={S.mork.flate} />
      <rect x="6.4" y="69.6" width="4.2" height="1.1" rx="0.5" fill={S.faluRod.lys} />
      <rect x="6.8" y="77" width="8" height="1.6" rx="0.6" fill={S.mork.flate} />
      <path d="M65.4 65.8 L68.2 65.6 L68.4 67.4 L65.8 67.6 Z" fill={m.skygge} />
      <Hjulbue x={23} r={7.4} />
      <Hjulbue x={72} r={7.4} />
      <Bilhjul x={23} r={6.2} stil="aero" />
      <Bilhjul x={72} r={6.2} stil="aero" />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={6} til={91}>{bil}</Utstilling>
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
        <g key={x} className="ikke-lakk">
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
      <Lakksveip>
        <SuperbilKarosseri />
      </Lakksveip>
    </Lerret>
  )
}

/**
 * Hyperbilen (nær avstand, utstillingsrommet): helt lav og bred i grafitt,
 * med karbon nederst, stort luftinntak, bakvinge på stag og gull i felgene,
 * bremsene og en tynn linje langs skuldra. Lyset i rommet tegner formen.
 */
function Hyperbil({ størrelse = 48 }: P) {
  const m = S.skifer
  const bil = () => (
    <g>
      {/* Bakvingen på to stag. */}
      <path d="M10.6 68 L11.6 61.6 M15.6 67.6 L16.2 61.4" stroke={S.mork.flate} strokeWidth="1.2" />
      <path d="M3.6 60.4 L19.6 59.4 L20 61.4 L4 62.4 Z" fill={S.mork.flate} />
      <path d="M3.6 60.4 L19.6 59.4" stroke={S.gull.flate} strokeWidth="0.5" />
      <path d="M6.4 80 L5.6 72.6 Q6 69.4 9 68.6 L20 67.6 Q28 64 38 63.2 Q46 62.6 52 64.4 Q57 66 62 67.4 L80 70.2 Q88 71.6 90.6 75.6 L90.8 78.2 Q90.4 80 88 80 L80.14 80 A7.6 7.6 0 0 0 65.86 80 L30.14 80 A7.6 7.6 0 0 0 15.86 80 Z" fill={m.flate} />
      <path d="M9 68.6 L20 67.6 Q28 64 38 63.2 Q46 62.6 52 64.4 Q57 66 62 67.4 L80 70.2 Q86 71.2 89 73.6 L80 71.6 L62 68.8 Q56 67.4 52 66 Q46 64.4 38 64.6 Q28 65.4 21 69 L9.6 70 Z" fill={m.lys} />
      {/* Karbon nederst og splitteren foran. */}
      <path d="M6 76.6 L90.8 77.4 L90.8 78.2 Q90.4 80 88 80 L80.14 80 A7.6 7.6 0 0 0 65.86 80 L30.14 80 A7.6 7.6 0 0 0 15.86 80 L6.4 80 Z" fill={S.mork.skygge} />
      <path d="M79 79.4 L92 79 L91.6 80.6 L79 80.6 Z" fill={S.mork.flate} />
      {/* Kuppelen. */}
      <path d="M33 64.4 Q41.6 62.6 48 63 Q53.6 63.6 58.6 66.4 L61 67.6 L34 68.2 Z" fill={S.mork.flate} />
      <Glans d="M34.2 64.6 Q40 63.2 45 63.2 L40.6 67.8 L34.4 68 Z" />
      {/* Luftinntaket foran bakhjulet, med gullkant. */}
      <path d="M30.6 70.4 Q38 69 46 69.2 Q44 74 39.6 76.4 L31.6 76.6 Z" fill={S.mork.skygge} />
      <path d="M30.6 70.4 Q38 69 46 69.2" fill="none" stroke={S.gull.flate} strokeWidth="0.6" />
      {/* Gullinja langs skuldra, lykter og speil. */}
      <path d="M62.4 68.6 L80 71.2" stroke={S.gull.flate} strokeWidth="0.7" />
      <path d="M81 71.4 L89 73.6 L88.6 74.6 L80.6 72.6 Z" fill={S.hvit.lys} />
      <path d="M5.8 70.2 L9.4 69.8 L9.4 71 L5.9 71.4 Z" fill={S.faluRod.lys} />
      <path d="M58.6 66 L62 65.6 L62 67.2 L59 67.4 Z" fill={m.skygge} />
      <Hjulbue x={23} r={7.6} />
      <Hjulbue x={73} r={7.6} />
      <Bilhjul x={23} r={6.6} stil="eiker" m={S.gull} kaliper={S.gull.lys} />
      <Bilhjul x={73} r={6.6} stil="eiker" m={S.gull} kaliper={S.gull.lys} />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={5} til={92}>{bil}</Utstilling>
}

/**
 * Veteranbilen (nær avstand, utstillingsrommet): en britisk roadster fra
 * 1930-tallet i racinggrønt, med frittstående skjermer, stigbrett, langt
 * panser med gjeller, kromgrill og runde lykter, nedfelt kalesje, krem
 * interiør, eikefelger og reservehjulet bak.
 */
function Veteranbil({ størrelse = 48 }: P) {
  const m = S.gran
  const krom = S.metall
  const bil = () => (
    <g>
      {/* Reservehjulet bak, delvis skjult. */}
      <circle cx="12.6" cy="69.6" r="5.4" fill={S.mork.skygge} />
      <circle cx="12.6" cy="69.6" r="3.4" fill={krom.lys} />
      <circle cx="12.6" cy="69.6" r="1.2" fill={krom.flate} />
      {/* Stigbrettet med eksosrørene over. */}
      <rect x="32" y="75.8" width="34" height="1.8" rx="0.6" fill={S.mork.flate} />
      <rect x="32" y="75.8" width="34" height="0.5" fill={S.mork.lys} />
      {/* Karosseriet: rund hale, cockpit, langt panser. */}
      <path d="M15 76 Q12.6 70 14 64.6 Q15.6 61 20 60.6 L32 60.6 Q33 60.4 34 61.4 L46 61.6 L49 62.2 Q60 62 80.6 62.2 Q83 62.4 83.2 64.6 L83.6 75 L15.4 76 Z" fill={m.flate} />
      <path d="M14.4 70 L83.4 70 L83.6 75 L15.4 76 Q14.2 73.4 14.4 70 Z" fill={m.skygge} />
      <path d="M20 60.6 L32 60.6 M49 62.2 Q60 62 80.6 62.2 Q82.4 62.4 82.8 63.6" fill="none" stroke={m.lys} strokeWidth="1" strokeLinecap="round" />
      {/* Interiøret, kalesjen og rattet. */}
      <path d="M22 60.8 Q23 58 27 58 L31.6 58.2 L32.4 60.8 Z" fill={S.puss.skygge} />
      <path d="M33.6 61.4 Q34.6 56.6 38.4 56.8 L40 57 L40.6 61.4 Z" fill={S.puss.lys} />
      <ellipse cx="44.6" cy="58.8" rx="0.8" ry="2.6" fill="none" stroke={S.mork.flate} strokeWidth="0.7" />
      {/* Frontruta i kromramme. */}
      <path d="M47 61.6 L48.4 54 L50 54 L49.2 61.8 Z" fill={S.glass.lys} opacity="0.7" />
      <path d="M47 61.6 L48.4 54 L50 54" fill="none" stroke={krom.lys} strokeWidth="0.6" />
      {/* Gjellene i panseret og panserlinja. */}
      {[56, 59, 62, 65, 68, 71].map((x) => (
        <path key={x} d={`M${x} 65.4 l1.4 2.6`} stroke={m.skygge} strokeWidth="0.6" />
      ))}
      <path d="M49.4 62.4 L49.4 69.8" stroke={m.skygge} strokeWidth="0.5" />
      {/* Bakskjermen og forskjermen, frittstående. */}
      <path d="M16.6 77.4 Q16.6 67.8 26 67.6 Q34.4 67.8 36.2 76.4 L36.4 77.4 L33.4 77.4 Q32.4 71 26 71 Q19.4 71 19.6 77.4 Z" fill={m.flate} />
      <path d="M17.6 72 Q19.4 68.2 26 68 Q31 68.2 33.6 71" fill="none" stroke={m.lys} strokeWidth="0.8" />
      <path d="M60 77.4 Q62 76 64 74.6 Q66.6 68 73 67.8 Q80.6 67.8 84.8 74.2 L86.4 77.4 L83.4 77.4 Q80.6 71 73 71 Q68.4 71 67 75.6 Q65 77.2 62.6 77.6 Z" fill={m.flate} />
      <path d="M65.6 71 Q68.6 68.2 73 68 Q79 68 82.6 71.4" fill="none" stroke={m.lys} strokeWidth="0.8" />
      {/* Kromgrillen, lykta og støtfangerne. */}
      <rect x="81.6" y="60.6" width="3.8" height="13.6" rx="1.4" fill={krom.lys} />
      {[82.6, 83.5, 84.4].map((x) => (
        <rect key={x} x={x} y="61.6" width="0.4" height="11.6" fill={krom.skygge} />
      ))}
      <path d="M84 66 L86.2 65" stroke={krom.flate} strokeWidth="0.8" />
      <circle cx="87" cy="64.6" r="2.6" fill={krom.lys} />
      <circle cx="87.2" cy="64.6" r="1.8" fill={S.hvit.lys} />
      <rect x="84" y="75.4" width="6" height="1.4" rx="0.6" fill={krom.lys} />
      <rect x="9.6" y="74.6" width="5" height="1.4" rx="0.6" fill={krom.lys} />
      <Bilhjul x={26} r={6.3} stil="wire" />
      <Bilhjul x={73} r={6.3} stil="wire" />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={8} til={90}>{bil}</Utstilling>
}

/**
 * Limousinen (nær avstand, utstillingsrommet): lang og svart, med fire
 * tonede sidevinduer i kromramme, kromlist, grill og pansermerke, og to små
 * flagg på forskjermene. Lyset i rommet gir lakken glans.
 */
function Limousin({ størrelse = 48 }: P) {
  const m = S.mork
  const krom = S.metall
  const bil = () => (
    <g>
      <path d="M5 80 L4.4 71 Q4.6 68.6 7.6 68 L14 67.4 L20.6 60 Q22 58.4 25 58.2 L66 57.8 Q69.4 57.8 71.4 59.6 L77.6 66.4 L88.4 67.8 Q91.8 68.4 92.2 71.6 L92.4 77.6 Q92.4 80 90 80 L87.12 80 A7.4 7.4 0 0 0 72.88 80 L23.12 80 A7.4 7.4 0 0 0 8.88 80 Z" fill={m.flate} />
      <path d="M4.6 74.6 L92.3 74.6 L92.4 77.6 Q92.4 80 90 80 L87.12 80 A7.4 7.4 0 0 0 72.88 80 L23.12 80 A7.4 7.4 0 0 0 8.88 80 L5 80 Z" fill={m.skygge} />
      {/* Glansen fra taklyset på tak, panser og skuldre. */}
      <path d="M25 58.2 L66 57.8 Q69.4 57.8 71.4 59.6 L70.6 60 Q68.6 58.8 66 58.8 L25.4 59.2 Q23 59.4 21.8 60.6 L20.6 60 Q22 58.4 25 58.2 Z" fill={m.lys} />
      <path d="M77.6 66.4 L88.4 67.8 Q91 68.2 91.8 69.8 L78.6 67.8 Z" fill={m.lys} />
      <path d="M7.6 68 L14 67.4 L76 67.2 L88 68.6" fill="none" stroke={m.lys} strokeWidth="0.9" />
      {/* De lange, tonede vinduene i kromramme. */}
      <path d="M21.6 66.4 L24.6 60.2 L65.6 59.8 Q68.6 59.8 70.4 61.4 L75 66.4 Z" fill={S.skifer.skygge} />
      {[34, 46, 58].map((x) => (
        <rect key={x} x={x} y="59.9" width="1.8" height="6.5" fill={m.flate} />
      ))}
      <path d="M21.6 66.4 L24.6 60.2 L65.6 59.8 Q68.6 59.8 70.4 61.4 L75 66.4 Z" fill="none" stroke={krom.lys} strokeWidth="0.5" />
      <Glans points="25,60.4 31,60.3 28,66.2 23,66.2" />
      <Glans points="60,60 65,60 69,66.2 63,66.2" />
      {/* Dørlinjer, håndtak og kromlista. */}
      <path d="M34.9 66.6 V78.8 M46.9 66.6 V79.4 M58.9 66.6 V79.4" stroke={m.lys} strokeWidth="0.4" opacity="0.6" />
      {[38, 50, 62].map((x) => (
        <rect key={x} x={x} y="68.6" width="2.6" height="0.8" rx="0.4" fill={krom.lys} />
      ))}
      <rect x="5.4" y="72" width="86.4" height="0.8" fill={krom.lys} />
      {/* Grillen, lyktene, pansermerket og flaggene. */}
      <rect x="90.4" y="69.8" width="1.8" height="5" rx="0.4" fill={krom.lys} />
      <rect x="88.4" y="68.8" width="3.2" height="2.4" rx="0.6" fill={S.hvit.lys} />
      <path d="M86.4 67.6 L87.2 65.8 L88 67.6 Z" fill={krom.lys} />
      <rect x="4.6" y="69" width="1.6" height="4" rx="0.5" fill={S.faluRod.lys} />
      <rect x="4.4" y="75.6" width="4" height="1.6" rx="0.6" fill={krom.lys} />
      <rect x="88.4" y="75.6" width="4.2" height="1.6" rx="0.6" fill={krom.lys} />
      <line x1="83.4" y1="67.8" x2="83.4" y2="61.4" stroke={krom.lys} strokeWidth="0.4" />
      <g className="anim-flagg">
        <rect x="83.6" y="61.4" width="4.4" height="3" fill={S.faluRod.lys} />
        <rect x="83.6" y="62.5" width="4.4" height="0.8" fill={S.hvit.lys} />
        <rect x="84.8" y="61.4" width="0.8" height="3" fill={S.hvit.lys} />
        <rect x="83.6" y="62.75" width="4.4" height="0.3" fill={S.marine.flate} />
        <rect x="85.05" y="61.4" width="0.3" height="3" fill={S.marine.flate} />
      </g>
      <path d="M71.6 64 L74.4 63.6 L74.6 65.6 L72 65.8 Z" fill={m.lys} />
      <Hjulbue x={16} r={7.4} />
      <Hjulbue x={80} r={7.4} />
      <Bilhjul x={16} stil="krom" />
      <Bilhjul x={80} stil="krom" />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={4} til={93}>{bil}</Utstilling>
}

/**
 * Formelbilen (nær avstand, utstillingsrommet): lav og åpen i rødt og hvitt,
 * med frontvinge, bakvinge, sidekasser, luftinntak over føreren, halo og
 * hjelmen i oker. Store dekk med gul stripe på siden.
 */
function Formelbil({ størrelse = 48 }: P) {
  const m = S.faluRod
  const bil = () => (
    <g>
      {/* Bakvingen med endeplate. */}
      <path d="M5 61.4 L13.4 61.4 L13.4 74.6 L6.6 74.6 Z" fill={m.skygge} />
      <path d="M5 61.4 L13.4 61.4 L13.4 63.4 L5 63.4 Z" fill={S.mork.flate} />
      <path d="M5.6 65.8 L13 65.8" stroke={S.mork.flate} strokeWidth="1.2" />
      <rect x="9.6" y="70.6" width="2" height="1.2" fill={S.faluRod.lys} />
      {/* Bunnplata. */}
      <path d="M12 77.2 L86 77.6 L86 79 L12 78.8 Z" fill={S.mork.skygge} />
      {/* Karosseriet: motordeksel, cockpit og den lange nesa. */}
      <path d="M12 77 L13 70.6 Q18 68.4 28 68.4 L38 66.8 Q46 66 51 67 L57 68.8 L68 70.6 L84 73.6 L92.6 75 L92.4 76.6 L80 77.2 Z" fill={m.flate} />
      <path d="M27 68.4 Q29 62.4 34.6 61.6 L38.6 61.6 Q40.6 62.2 40.6 66.8 L38 66.8 Z" fill={m.flate} />
      <path d="M29.6 63.4 Q31.6 62.2 34.6 62.2 L37 62.2" fill="none" stroke={m.lys} strokeWidth="0.9" />
      <path d="M13 70.6 Q18 68.4 28 68.4 M57 68.8 L68 70.6 L84 73.6 L92.6 75" fill="none" stroke={m.lys} strokeWidth="0.9" />
      {/* Den hvite stripa og sidekassa. */}
      <path d="M13.6 72.6 L82 74.6 L91.8 75.6 L91.6 76.4 L82 75.8 L13.4 74 Z" fill={S.hvit.lys} />
      <path d="M30 76.4 Q31 71.2 37 70.8 L53 70.8 Q57 71.2 59 73.2 L59 76.4 Z" fill={m.skygge} />
      <path d="M31.4 72.6 Q33 71.4 37 71.4 L52 71.4" fill="none" stroke={m.lys} strokeWidth="0.6" />
      {/* Hjelmen, halo og speilet. */}
      <circle cx="46.2" cy="64.8" r="2.5" fill={S.oker.flate} />
      <path d="M46.4 63.6 L48.6 63.8 L48.6 65 L46.6 65.2 Z" fill={S.mork.flate} />
      <path d="M42.2 66.6 Q44.8 62.2 49.8 62.4 L55.4 66.8" fill="none" stroke={S.mork.flate} strokeWidth="1.2" strokeLinecap="round" />
      {/* Frontvingen. */}
      <path d="M78 77 L94 76.4 L94 78.8 L78 79.2 Z" fill={S.mork.flate} />
      <path d="M91.4 73.6 L94 73.6 L94 78.8 L91.4 78.8 Z" fill={m.skygge} />
      {/* Hjuloppheng. */}
      <path d="M24 77 L30.4 73.4 M24 77 L30.4 76.4 M74 77.4 L66 71.4 M74 77.4 L67.6 76" stroke={S.mork.flate} strokeWidth="0.7" />
      <Bilhjul x={24} r={7} stil="racing" />
      <Bilhjul x={74} r={6.6} stil="racing" />
    </g>
  )
  return <Utstilling størrelse={størrelse} fra={4} til={94}>{bil}</Utstilling>
}

// ─────────────────────────────────────────────── Klokkene i ny stil (G5)

/**
 * Skrinet klokkene ligger i: en åpen eske på bordet, lokket slått opp bak med
 * for innvendig, og en pute klokka sitter rundt. Klokkene er et nærbilde —
 * en klokke er fire centimeter, så målestokken gjelder ikke her.
 * `logo` legger et lite preget merke i gull på lokket (de dyreste).
 */
function Klokkeskrin({ størrelse, eske, fôr, logo = false, kant, children }: { størrelse: number; eske: Materiale; fôr: Materiale; logo?: boolean; kant?: string; children: ReactNode }) {
  const g = GRUNNLINJE
  return (
    <Lerret størrelse={størrelse} himmel="inne">
      <Bakke type="gulv" />
      <Slagskygge x1={14} x2={74} lengde={10} d={16} />
      {/* Lokket, slått opp bak, med foret innvendig. */}
      <polygon points="22,63.2 82,63.2 85,14 25,14" fill={eske.skygge} />
      <polygon points="25,61 79,61 81.8,17 27.6,17" fill={fôr.flate} />
      <polygon points="27.6,17 81.8,17 81.6,20 27.4,20" fill={fôr.skygge} />
      <Glans points="30,20 44,20 36,58 28,58" />
      {logo && <path d="M50 24.6 L51.6 28.4 L54.4 25.6 L55.2 30.4 L57.6 27.6 L58.4 32 H50.4 Z" fill={S.gull.flate} opacity="0.85" />}
      {kant && <polygon points="22,63.2 82,63.2 85,14 25,14" fill="none" stroke={kant} strokeWidth="0.6" />}
      {/* Esken med foret oppe. */}
      <Kloss x={14} b={60} h={16} d={16} m={eske} />
      <polygon points={`16,${g - 16.6} 72,${g - 16.6} ${inn(72, g - 16.6, 13).join(',')} ${inn(16, g - 16.6, 13).join(',')}`} fill={fôr.skygge} />
      {/* Puta klokka sitter rundt. */}
      <rect x="22" y="29" width="54" height="44" rx="9" fill={fôr.flate} />
      <rect x="23" y="30" width="52" height="7" rx="3.5" fill={fôr.lys} opacity="0.7" />
      <path d="M30 29.6 V72 M68 29.6 V72" stroke={fôr.skygge} strokeWidth="0.6" opacity="0.7" />
      {children}
      {/* Eskens front foran puta. */}
      <rect x="14" y={g - 16} width="60" height="16" fill={eske.flate} />
      <rect x="14" y={g - 16} width="60" height="1.2" fill={eske.lys} />
      {kant && <rect x="14" y={g - 16} width="60" height="16" fill="none" stroke={kant} strokeWidth="0.6" />}
      <rect x="41" y={g - 11} width="6" height="3" rx="0.8" fill={kant ?? S.metall.flate} />
    </Lerret>
  )
}

/**
 * En viser som går (G10): tegnet rett opp fra (cx, cy) og dreid så langt `t`
 * sekunder av et omløp på `omlop` sekunder tilsier. Animasjonen tar over derfra
 * (en negativ forsinkelse); med mindre bevegelse står viseren der den ble
 * tegnet. `tikk` hopper ett sekund om gangen, som de små sekundene i et lommeur.
 */
function Viser({ cx, cy, omlop, t, tikk = false, children }: { cx: number; cy: number; omlop: number; t: number; tikk?: boolean; children: ReactNode }) {
  return (
    <g
      className={tikk ? 'anim-viser tikk' : 'anim-viser'}
      style={{ transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${r2((t / omlop) * 360)}deg)`, animationDelay: `-${r2(t)}s`, ['--omlop' as string]: `${omlop}s` }}
    >
      {children}
    </g>
  )
}

/**
 * Et armbåndsur sett rett forfra: kasse med lys og skygge, lunette, skive med
 * indekser og visere som står på ti over ti, krone til høyre og glans på glasset.
 * `lunette` og `ekstra` legger til det som er spesielt for hver klokke.
 */
function Urkasse({ cx = 49, cy = 52, R = 14, kasse, skive, visere, indeks, sekund, lunette, ekstra, dotter = false, horn = true }: { cx?: number; cy?: number; R?: number; kasse: Materiale; skive: string; visere: string; indeks: string; sekund?: string; lunette?: ReactNode; ekstra?: ReactNode; dotter?: boolean; horn?: boolean }) {
  // Ekte tid bare i scenen; i lister og galleri står de på ti over ti.
  const naa = useContext(IScenen) ? new Date() : null
  const r = +(R - 2.6).toFixed(2)
  const n = (v: number) => +v.toFixed(2)
  const p = (v: number, l: number) => [+(cx + Math.sin(v) * l).toFixed(2), +(cy - Math.cos(v) * l).toFixed(2)]
  const viser = (grader: number, l: number) => p((grader * Math.PI) / 180, l)
  const [tx, ty] = viser(305, r * 0.5)
  const [mx, my] = viser(60, r * 0.8)
  const [sx, sy] = viser(200, r * 0.86)
  return (
    <g>
      {/* Hornene og krona. */}
      {horn && [-1, 1].map((s) => (
        <g key={s}>
          <rect x={cx - 7.4} y={cy + s * (R - 1) - (s < 0 ? 4 : 0)} width="3.2" height="4" rx="1" fill={kasse.flate} />
          <rect x={cx + 4.2} y={cy + s * (R - 1) - (s < 0 ? 4 : 0)} width="3.2" height="4" rx="1" fill={kasse.skygge} />
        </g>
      ))}
      <rect x={cx + R - 0.6} y={cy - 2} width="3" height="4" rx="0.8" fill={kasse.flate} />
      <path d={`M${cx + R + 0.4} ${cy - 1.4}v2.8M${cx + R + 1.4} ${cy - 1.4}v2.8`} stroke={kasse.skygge} strokeWidth="0.35" />
      {/* Kassa: lys oppe til venstre, skygge nede til høyre. */}
      <circle cx={cx} cy={cy} r={R} fill={kasse.flate} />
      <path d={`M${p(-2.3, R - 0.7).join(' ')} A${n(R - 0.7)} ${n(R - 0.7)} 0 0 1 ${p(0.75, R - 0.7).join(' ')}`} fill="none" stroke={kasse.lys} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${p(0.85, R - 0.7).join(' ')} A${n(R - 0.7)} ${n(R - 0.7)} 0 0 1 ${p(3.9, R - 0.7).join(' ')}`} fill="none" stroke={kasse.skygge} strokeWidth="1.3" strokeLinecap="round" />
      {lunette}
      <circle cx={cx} cy={cy} r={r} fill={skive} />
      {Array.from({ length: 12 }, (_, i) => {
        const v = (i / 12) * Math.PI * 2
        if (dotter) {
          const [x, y] = p(v, r * 0.84)
          return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1 : 0.65} fill={indeks} />
        }
        const [x1, y1] = p(v, r * (i % 3 === 0 ? 0.68 : 0.76))
        const [x2, y2] = p(v, r * 0.9)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={indeks} strokeWidth={i % 3 === 0 ? 1.2 : 0.6} strokeLinecap="round" />
      })}
      {ekstra}
      {naa ? (
        // I scenen: viserne viser klokka på telefonen og går (G10).
        <>
          <Viser cx={cx} cy={cy} omlop={43200} t={(naa.getHours() % 12) * 3600 + naa.getMinutes() * 60 + naa.getSeconds()}>
            <line x1={cx} y1={cy} x2={cx} y2={n(cy - r * 0.5)} stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
          </Viser>
          <Viser cx={cx} cy={cy} omlop={3600} t={naa.getMinutes() * 60 + naa.getSeconds()}>
            <line x1={cx} y1={cy} x2={cx} y2={n(cy - r * 0.8)} stroke={visere} strokeWidth="0.95" strokeLinecap="round" />
          </Viser>
          {sekund && (
            <Viser cx={cx} cy={cy} omlop={60} t={naa.getSeconds() + naa.getMilliseconds() / 1000}>
              <line x1={cx} y1={n(cy + r * 0.2)} x2={cx} y2={n(cy - r * 0.86)} stroke={sekund} strokeWidth="0.35" />
            </Viser>
          )}
        </>
      ) : (
        <>
          <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={visere} strokeWidth="1.4" strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={mx} y2={my} stroke={visere} strokeWidth="0.95" strokeLinecap="round" />
          {sekund && <line x1={cx} y1={cy} x2={sx} y2={sy} stroke={sekund} strokeWidth="0.35" />}
        </>
      )}
      <circle cx={cx} cy={cy} r="1" fill={visere} />
      {/* Glansen på glasset. */}
      <path d={`M${p(-1.9, r * 0.9).join(' ')} A${n(r * 0.9)} ${n(r * 0.9)} 0 0 1 ${p(-0.3, r * 0.9).join(' ')} Q${n(cx - r * 0.3)} ${n(cy - r * 0.45)} ${p(-1.9, r * 0.9).join(' ')} Z`} fill="#ffffff" opacity="0.16" />
    </g>
  )
}

// ─────────────────────────────────────────────── Luksus: klokker


/**
 * Gullklokka (200 000): slank gullkasse, kremhvit skive med gullindekser og
 * en brun skinnrem med søm. I en eske av mørkt tre med kremfarget for.
 */
function Gullklokke({ størrelse = 48 }: P) {
  const cx = 49
  const cy = 52
  const rem = (y: number, h: number) => (
    <g>
      <rect x={cx - 5} y={y} width="10" height={h} rx="1.4" fill={S.treverk.skygge} />
      <rect x={cx - 4.1} y={y + 0.8} width="8.2" height={h - 1.6} rx="1" fill="none" stroke={S.puss.lys} strokeWidth="0.3" strokeDasharray="0.8 0.6" />
    </g>
  )
  return (
    <Klokkeskrin størrelse={størrelse} eske={S.treMork} fôr={S.puss}>
      {rem(29, 10)}
      {rem(cy + 12, 10)}
      <Urkasse cx={cx} cy={cy} R={13.4} kasse={S.gull} skive={S.puss.lys} visere={S.treMork.skygge} indeks={S.gull.skygge} sekund={S.gull.skygge} />
    </Klokkeskrin>
  )
}

/**
 * Det sveitsiske mesterverket (2 mill): hvitgull med riflet lunette, dyp blå
 * skive med månefase på seks og et lenkearmbånd i stål. I svart skinn med
 * blått for og et lite gullmerke på lokket.
 */
function Mesterverk({ størrelse = 48 }: P) {
  const cx = 49
  const cy = 52
  const lenker = (y: number, n: number) =>
    Array.from({ length: n }, (_, i) => (
      <g key={i}>
        <rect x={cx - 5.4} y={y + i * 2.4} width="10.8" height="2.1" rx="0.5" fill={S.metall.flate} />
        <rect x={cx - 1.8} y={y + i * 2.4} width="3.6" height="2.1" fill={S.metall.lys} />
      </g>
    ))
  return (
    <Klokkeskrin størrelse={størrelse} eske={S.mork} fôr={S.marine} logo>
      {lenker(28.6, 4)}
      {lenker(cy + 13, 4)}
      <Urkasse
        cx={cx}
        cy={cy}
        R={14}
        kasse={S.metall}
        skive={S.marine.flate}
        visere={S.metall.lys}
        indeks={S.metall.lys}
        sekund={S.gull.lys}
        lunette={
          <g>
            {Array.from({ length: 36 }, (_, i) => {
              const v = (i / 36) * Math.PI * 2
              return (
                <line
                  key={i}
                  x1={+(cx + Math.sin(v) * 11.6).toFixed(2)}
                  y1={+(cy - Math.cos(v) * 11.6).toFixed(2)}
                  x2={+(cx + Math.sin(v) * 13).toFixed(2)}
                  y2={+(cy - Math.cos(v) * 13).toFixed(2)}
                  stroke={S.metall.skygge}
                  strokeWidth="0.4"
                />
              )
            })}
          </g>
        }
        ekstra={
          <g>
            {/* Månefasen: et vindu med månen og to stjerner. */}
            <path d={`M${cx - 4} ${cy + 6.4} A4 4 0 0 1 ${cx + 4} ${cy + 6.4} Z`} fill={S.marine.skygge} />
            <circle cx={cx + 1.2} cy={cy + 4.8} r="1.5" fill={S.gull.lys} />
            <circle cx={cx - 2} cy={cy + 4.6} r="0.3" fill={S.gull.lys} />
            <circle cx={cx - 1} cy={cy + 3.4} r="0.25" fill={S.gull.lys} />
          </g>
        }
      />
    </Klokkeskrin>
  )
}

/**
 * Dykkerklokka (40 000): stål med svart skive, selvlysende prikker, dreibar
 * lunette med minuttmerker og trekant på tolv, datovindu på tre og en
 * gummirem med hull. I en enkel treeske med grå filt.
 */
function Dykkerklokke({ størrelse = 48 }: P) {
  const cx = 49
  const cy = 52
  const merker = Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 === 0 && i > 0)
  return (
    <Klokkeskrin størrelse={størrelse} eske={S.treverk} fôr={S.stein}>
      <rect x={cx - 5.6} y="29" width="11.2" height="10" rx="1.6" fill={S.mork.flate} />
      <rect x={cx - 5.6} y={cy + 13} width="11.2" height="9" rx="1.6" fill={S.mork.flate} />
      {[31.6, 34.6].map((y) => (
        <circle key={y} cx={cx} cy={y} r="0.7" fill={S.mork.skygge} />
      ))}
      <Urkasse
        cx={cx}
        cy={cy}
        R={15}
        kasse={S.metall}
        skive={S.mork.skygge}
        visere={S.hvit.lys}
        indeks={S.hvit.lys}
        sekund={S.oker.lys}
        dotter
        lunette={
          <>
            <circle cx={cx} cy={cy} r="12.7" fill="none" stroke={S.marine.skygge} strokeWidth="2.6" />
            {merker.map((i) => {
              const v = (i / 60) * Math.PI * 2
              return <circle key={i} cx={+(cx + Math.sin(v) * 12.7).toFixed(2)} cy={+(cy - Math.cos(v) * 12.7).toFixed(2)} r="0.38" fill={S.hvit.flate} />
            })}
            <path d={`M${cx - 1.1} ${cy - 13.8} L${cx + 1.1} ${cy - 13.8} L${cx} ${cy - 11.8} Z`} fill={S.hvit.lys} />
          </>
        }
        ekstra={<rect x={cx + 5.6} y={cy - 1} width="2.6" height="2" fill={S.hvit.lys} />}
      />
    </Klokkeskrin>
  )
}

/**
 * Det antikke lommeuret (5 mill): gullkasse med lokket slått opp til venstre,
 * hvit emaljeskive med små sekunder, blåstålvisere, bøyle på toppen og
 * kjedet lagt i en bue. I vinrødt skinn med vinrød fløyel.
 */
function Lommeur({ størrelse = 48 }: P) {
  const naa = useContext(IScenen) ? new Date() : null
  const cx = 52
  const cy = 52
  return (
    <Klokkeskrin størrelse={størrelse} eske={S.vin} fôr={S.vin} logo>
      {/* Kjedet i en bue ned mot venstre. */}
      <path d={`M${cx} ${cy - 16.6} Q30 ${cy - 22} 28 ${cy + 4} Q27 ${cy + 16} 36 ${cy + 18}`} fill="none" stroke={S.gull.flate} strokeWidth="1" strokeDasharray="1.2 0.7" />
      <circle cx="36.4" cy={cy + 18} r="1.2" fill="none" stroke={S.gull.lys} strokeWidth="0.7" />
      {/* Lokket, slått opp til venstre, med gravering. */}
      <circle cx={cx - 15} cy={cy + 1} r="12.4" fill={S.gull.skygge} />
      <circle cx={cx - 15} cy={cy + 1} r="9.6" fill="none" stroke={S.gull.flate} strokeWidth="0.5" />
      <path d={`M${cx - 21} ${cy + 1} q3-4 6 0 t6 0`} fill="none" stroke={S.gull.flate} strokeWidth="0.5" />
      {/* Bøylen og krona på toppen. */}
      <circle cx={cx} cy={cy - 17.4} r="2.6" fill="none" stroke={S.gull.flate} strokeWidth="1" />
      <rect x={cx - 1.4} y={cy - 15.6} width="2.8" height="2.8" rx="0.6" fill={S.gull.flate} />
      <Urkasse
        cx={cx}
        cy={cy}
        R={13.4}
        kasse={S.gull}
        skive={S.hvit.lys}
        visere={S.marine.flate}
        indeks={S.mork.flate}
        horn={false}
        ekstra={
          <g>
            <circle cx={cx} cy={cy + 4.6} r="2.4" fill="none" stroke={S.mork.lys} strokeWidth="0.35" />
            {naa ? (
              <Viser cx={cx} cy={cy + 4.6} omlop={60} t={naa.getSeconds()} tikk>
                <line x1={cx} y1={cy + 4.6} x2={cx} y2={cy + 2.8} stroke={S.mork.flate} strokeWidth="0.3" />
              </Viser>
            ) : (
              <line x1={cx} y1={cy + 4.6} x2={cx + 1.2} y2={cy + 3.2} stroke={S.mork.flate} strokeWidth="0.3" />
            )}
          </g>
        }
      />
    </Klokkeskrin>
  )
}

/**
 * Diamantklokka (15 mill): gullkasse med en ring av diamanter i lunetten,
 * svart skive med diamantindekser, svart alligatorrem med gullspenne og et
 * par gnister. I svart fløyel med gullkanter og gullmerke — klart den dyreste.
 */
function Diamantklokke({ størrelse = 48 }: P) {
  const cx = 49
  const cy = 52
  const rem = (y: number, h: number) => (
    <g>
      <rect x={cx - 5.2} y={y} width="10.4" height={h} rx="1.4" fill={S.mork.flate} />
      {Array.from({ length: Math.floor(h / 2.2) }, (_, i) => (
        <path key={i} d={`M${cx - 4.4} ${y + 1.4 + i * 2.2} h8.8`} stroke={S.mork.lys} strokeWidth="0.4" />
      ))}
    </g>
  )
  const steiner = Array.from({ length: 24 }, (_, i) => {
    const v = (i / 24) * Math.PI * 2
    return [+(cx + Math.sin(v) * 12.6).toFixed(2), +(cy - Math.cos(v) * 12.6).toFixed(2), i]
  })
  const gnist = (x: number, y: number, s: number) => <path d={`M${x} ${y - s}L${x + s * 0.25} ${y - s * 0.25}L${x + s} ${y}L${x + s * 0.25} ${y + s * 0.25}L${x} ${y + s}L${x - s * 0.25} ${y + s * 0.25}L${x - s} ${y}L${x - s * 0.25} ${y - s * 0.25}Z`} fill={S.hvit.lys} />
  return (
    <Klokkeskrin størrelse={størrelse} eske={S.mork} fôr={S.mork} logo kant={S.gull.flate}>
      {rem(29, 10)}
      {rem(cy + 12, 10)}
      <rect x={cx - 3.6} y={cy + 19} width="7.2" height="2.4" rx="0.6" fill="none" stroke={S.gull.lys} strokeWidth="0.6" />
      <Urkasse
        cx={cx}
        cy={cy}
        R={14.4}
        kasse={S.gull}
        skive={S.mork.skygge}
        visere={S.gull.lys}
        indeks={S.hvit.lys}
        sekund={S.hvit.lys}
        dotter
        lunette={
          <g>
            {steiner.map(([x, y, i]) => (
              <circle key={i} cx={x} cy={y} r="1.05" fill={i % 2 ? S.glass.lys : S.hvit.lys} />
            ))}
          </g>
        }
      />
      {gnist(cx - 10, cy - 11, 2.4)}
      {gnist(cx + 12.6, cy + 7, 1.6)}
      {gnist(cx + 8, cy - 14.4, 1.2)}
    </Klokkeskrin>
  )
}

// ─────────────────────────────────────────────── Luksus: båter

/**
 * Snekka (gateavstand, ved kaia): en klinkbygd trebåt i ferniss med spiss
 * hekk og baug, en hvit kappe foran med koøye, eksosrør fra sabben,
 * fendere og flagget i hekken. Fortøyd til pullerten.
 */
function Snekke({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const t = S.treverk
  return (
    <Lerret størrelse={størrelse}>
      <Bakke type="kai" />
      <path d={`M17.5 ${g - 8} Q25 ${g - 3} 32.4 ${g - 8.6}`} fill="none" stroke={S.treverk.lys} strokeWidth="0.6" />
      <g className="anim-duve">
        {[g + 1.6, g + 3.8, g + 6.2].map((y, i) => (
          <rect key={y} x={38 + i * 4} y={y} width={40 - i * 9} height="0.9" rx="0.45" fill={S.hvit.flate} opacity={0.3 - i * 0.08} />
        ))}
        {/* Flagget i hekken. */}
        <line x1="33" y1={g - 9.4} x2="31.6" y2={g - 21} stroke={S.metall.flate} strokeWidth="0.5" />
        <g className="anim-flagg">
          <rect x="31.8" y={g - 21} width="5.6" height="3.8" fill={S.faluRod.lys} />
          <rect x="31.8" y={g - 19.6} width="5.6" height="1" fill={S.hvit.lys} />
          <rect x="33.4" y={g - 21} width="1" height="3.8" fill={S.hvit.lys} />
          <rect x="31.8" y={g - 19.3} width="5.6" height="0.4" fill={S.marine.flate} />
          <rect x="33.7" y={g - 21} width="0.4" height="3.8" fill={S.marine.flate} />
        </g>
        {/* Eksosrøret og kappa foran. */}
        <rect x="57.6" y={g - 16} width="1.6" height="8.6" fill={S.mork.flate} />
        <rect x="57.2" y={g - 16.6} width="2.4" height="1" rx="0.4" fill={S.mork.lys} />
        <path d={`M63 ${g - 7.6} L63.6 ${g - 14.4} L74.6 ${g - 14.6} L80 ${g - 9.4} Z`} fill={S.hvit.flate} />
        <path d={`M63.4 ${g - 14.4} L74.6 ${g - 14.6} L75.6 ${g - 13.6} L63.4 ${g - 13.4} Z`} fill={S.hvit.lys} />
        <circle cx="69" cy={g - 10.8} r="1.3" fill={S.glass.skygge} />
        <path d={`M75.6 ${g - 13.2} L79 ${g - 9.8} L76.2 ${g - 9.8} Z`} fill={S.glass.skygge} />
        {/* Skroget: klinkbygd i ferniss, bunnstoff ved vannlinja. */}
        <path d={`M31 ${g - 9.6} Q56 ${g - 6.2} 88 ${g - 11.2} Q86.4 ${g - 3.4} 80.6 ${g} L37 ${g} Q32.2 ${g - 3} 31 ${g - 9.6} Z`} fill={t.flate} />
        <path d={`M31.6 ${g - 7.4} Q56 ${g - 4.4} 87 ${g - 8.6} M32.6 ${g - 5} Q56 ${g - 2.6} 85.4 ${g - 5.8} M34.4 ${g - 2.6} Q56 ${g - 0.8} 83 ${g - 2.8}`} fill="none" stroke={t.skygge} strokeWidth="0.5" />
        <path d={`M36 ${g - 1} L81.6 ${g - 1} Q81 ${g - 0.4} 80.6 ${g} L37 ${g} Z`} fill={S.vin.skygge} />
        <path d={`M31 ${g - 9.6} Q56 ${g - 6.2} 88 ${g - 11.2}`} fill="none" stroke={t.lys} strokeWidth="1.2" />
        <path d={`M88 ${g - 11.2} Q86.6 ${g - 3.4} 80.6 ${g}`} fill="none" stroke={t.skygge} strokeWidth="0.9" />
        {/* Fendere. */}
        {[44, 56].map((x) => (
          <g key={x}>
            <line x1={x + 1} y1={g - 7.8} x2={x + 1} y2={g - 6.6} stroke={S.hvit.skygge} strokeWidth="0.3" />
            <rect x={x} y={g - 6.8} width="2" height="4.2" rx="1" fill={S.hvit.lys} />
          </g>
        ))}
      </g>
    </Lerret>
  )
}

/**
 * Motorbåten (gateavstand, ved anker): en lav hvit dagscruiser med marineblå
 * stripe, mørkt vindusbånd, hardtop over styreplassen, skrå frontrute,
 * badeplattform i teak og rekkverk foran. Kysten ligger i dis bak.
 */
function Motorbaat({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const h = S.hvit
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 12,50 22,53 34,46 46,52 60,49 72,53 84,47 96,51 96,${HORISONT + 1}`} fill={S.fjell.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      <g className="anim-duve">
        {[g + 1.6, g + 3.8].map((y, i) => (
          <rect key={y} x={16 + i * 5} y={y} width={64 - i * 12} height="0.9" rx="0.45" fill={h.flate} opacity={0.3 - i * 0.1} />
        ))}
        {/* Hardtopen og antennen. */}
        <path d={`M26.4 ${g - 12.4} L24 ${g - 18.2}`} stroke={h.flate} strokeWidth="1" />
        <path d={`M22 ${g - 19} L50 ${g - 19.6} Q52 ${g - 19.4} 52.6 ${g - 18.6} L22.6 ${g - 17.8} Z`} fill={h.flate} />
        <path d={`M22 ${g - 19} L50 ${g - 19.6}`} stroke={h.lys} strokeWidth="0.6" />
        <line x1="34" y1={g - 19.4} x2="34" y2={g - 24} stroke={S.metall.skygge} strokeWidth="0.5" />
        <ellipse cx="40" cy={g - 20.4} rx="2" ry="0.9" fill={h.lys} />
        <path d={`M52.4 ${g - 18.6} L60 ${g - 10} L55.6 ${g - 11} L50.4 ${g - 18.2} Z`} fill={S.glass.skygge} opacity="0.85" />
        {/* Overbygget med vindusbånd. */}
        <path d={`M24 ${g - 7} L26 ${g - 12.4} L54 ${g - 13.2} L66 ${g - 8.2} Z`} fill={h.lys} />
        <path d={`M28 ${g - 9.4} L29 ${g - 11.4} L53 ${g - 12} L60 ${g - 9} Z`} fill={S.mork.flate} />
        <Glans points={`30,${g - 11.2} 38,${g - 11.4} 35,${g - 9.4} 29,${g - 9.4}`} />
        {/* Skroget med stripe, og badeplattformen. */}
        <path d={`M10 ${g - 6.4} L80 ${g - 8.4} Q87 ${g - 8.8} 91 ${g - 10.8} Q88.6 ${g - 4.4} 83 ${g - 0.6} Q79 ${g} 74 ${g} L14 ${g} L10.6 ${g - 2.4} Z`} fill={h.flate} />
        <path d={`M11 ${g - 2.8} L86 ${g - 3.4} Q84.6 ${g - 1.4} 83 ${g - 0.6} Q79 ${g} 74 ${g} L14 ${g} Z`} fill={h.skygge} />
        <path d={`M10.4 ${g - 5.4} L82 ${g - 7} Q87 ${g - 7.4} 89.6 ${g - 8.6} L88.8 ${g - 7.2} Q85.6 ${g - 6} 82 ${g - 5.6} L10.6 ${g - 4} Z`} fill={S.marine.flate} />
        <path d={`M10 ${g - 6.4} L80 ${g - 8.4} Q87 ${g - 8.8} 91 ${g - 10.8}`} fill="none" stroke={S.treverk.lys} strokeWidth="0.8" />
        <rect x="5.6" y={g - 3.8} width="6" height="1.4" fill={S.treverk.flate} />
        {/* Rekkverket foran. */}
        <path d={`M62 ${g - 10.6} L88 ${g - 12.4}`} stroke={S.metall.lys} strokeWidth="0.4" />
        {[66, 74, 82].map((x) => (
          <line key={x} x1={x} y1={g - 10.6 - (x - 62) * 0.07} x2={x} y2={g - 8.2 - (x - 62) * 0.05} stroke={S.metall.lys} strokeWidth="0.35" />
        ))}
      </g>
    </Lerret>
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

/**
 * Havseileren (seilende, åpen sjø): en marineblå havseiler med gullstripe
 * som krenger litt i vinden, med fullt storseil og genua, lavt ruff og
 * skumsprut ved baugen. Kysten ligger i dis bak.
 */
function Seilyacht({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const m = S.marine
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 10,52 24,54 40,48 56,53 70,50 84,54 96,52 96,${HORISONT + 1}`} fill={S.fjell.flate} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {/* Kjølvannet og sprut ved baugen. */}
      <path d={`M10 ${g + 3} Q24 ${g + 1} 30 ${g + 0.6}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.8" opacity="0.5" />
      <path d={`M14 ${g + 5.6} Q26 ${g + 3.6} 34 ${g + 2}`} fill="none" stroke={S.hvit.lys} strokeWidth="0.6" opacity="0.35" />
      <g transform={`rotate(-6 54 ${g})`}>
        {/* Stagene. */}
        <line x1="53" y1="9" x2="19" y2={g - 6.4} stroke={S.metall.skygge} strokeWidth="0.35" />
        <line x1="53" y1="12" x2="87" y2={g - 9.2} stroke={S.metall.skygge} strokeWidth="0.35" />
        {/* Storseilet med sømmer, og bommen. */}
        <path d={`M51.6 10 Q42 40 24.6 ${g - 14} L51.6 ${g - 14} Z`} fill={S.hvit.lys} />
        <path d={`M51.6 10 L51.6 ${g - 14} L47 ${g - 14} Q48.6 40 51.6 10 Z`} fill={S.hvit.flate} />
        {[28, 44, 58].map((y) => (
          <line key={y} x1="51.6" y1={y} x2={+(51.6 - (y - 10) * 0.42).toFixed(1)} y2={y} stroke={S.hvit.skygge} strokeWidth="0.4" />
        ))}
        <rect x="24" y={g - 14.6} width="28.4" height="1.2" rx="0.5" fill={S.metall.flate} />
        {/* Genuaen. */}
        <path d={`M53.6 14 L86.4 ${g - 9.6} Q72 ${g - 8.6} 59.4 ${g - 11} Q57.4 48 53.6 14 Z`} fill={S.hvit.flate} />
        <path d={`M53.6 14 Q57.4 48 59.4 ${g - 11} L64 ${g - 10.4} Q59.6 46 53.6 14 Z`} fill={S.hvit.skygge} opacity="0.6" />
        {/* Masta. */}
        <rect x="52" y="8" width="1.2" height={g - 16} fill={S.metall.flate} />
        <path d="M48 30 H57 M49 50 H56" stroke={S.metall.skygge} strokeWidth="0.4" />
        {/* Ruffen og skroget med gullstripe. */}
        <path d={`M40 ${g - 7} L42 ${g - 10} L58 ${g - 10.4} L62 ${g - 7.4} Z`} fill={S.hvit.flate} />
        <path d={`M43 ${g - 8.6} L58 ${g - 8.9} L59.6 ${g - 7.8} L43 ${g - 7.6} Z`} fill={S.mork.flate} />
        <path d={`M18 ${g - 6} L82 ${g - 7.6} Q86 ${g - 7.8} 88 ${g - 9} Q84 ${g - 2} 78 ${g} L26 ${g} Q20 ${g - 2} 18 ${g - 6} Z`} fill={m.flate} />
        <path d={`M18 ${g - 6} L82 ${g - 7.6} Q86 ${g - 7.8} 88 ${g - 9}`} fill="none" stroke={m.lys} strokeWidth="0.9" />
        <path d={`M19.4 ${g - 4.2} L84 ${g - 5.6}`} stroke={S.gull.flate} strokeWidth="0.6" />
        <path d={`M21 ${g - 1.6} L82.6 ${g - 2.4} Q80.6 ${g - 0.8} 78 ${g} L26 ${g} Z`} fill={m.skygge} />
        <path d={`M76 ${g + 0.4} Q82 ${g - 2.6} 87.6 ${g - 1.4} Q86 ${g + 1} 80 ${g + 1.2} Z`} fill={S.hvit.lys} opacity="0.75" />
      </g>
    </Lerret>
  )
}

/**
 * Superyachten (fjern avstand, for anker i en fjord): marineblått skrog, tre
 * hvite dekk med mørke vindusbånd og varme lys, radarmast med kuppel, en
 * jolle ved hekken og små folk på dekk. Fjellene står i dis bak.
 */
function Superyacht({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const h = S.hvit
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        <Dis>
          <polygon points={`0,${HORISONT + 1} 0,40 10,32 22,38 34,26 48,36 60,30 74,38 86,28 96,34 96,${HORISONT + 1}`} fill={S.fjell.flate} />
          <polygon points="34,26 48,36 40,38 32,32" fill={S.fjell.skygge} />
          <polygon points="31,30 34,26 37.4,29.6 35,29 33.6,31" fill={S.sno.lys} />
          <polygon points="83,31.6 86,28 89.4,31.4 87,31 85.4,32.4" fill={S.sno.lys} />
        </Dis>
      </Kantfade>
      <Bakke type="hav" />
      {[g + 1.6, g + 3.8, g + 6].map((y, i) => (
        <rect key={y} x={14 + i * 6} y={y} width={70 - i * 14} height="0.9" rx="0.45" fill={h.flate} opacity={0.32 - i * 0.09} />
      ))}
      {/* Radarmasta. */}
      <path d={`M42 ${g - 24} L44 ${g - 31} L46.4 ${g - 31} L48.4 ${g - 24} Z`} fill={h.flate} />
      <path d={`M40.4 ${g - 29} H50`} stroke={S.mork.flate} strokeWidth="0.6" />
      <circle cx="45.2" cy={g - 32.6} r="1.8" fill={h.lys} />
      {/* Dekkene, fra broa og ned. */}
      <path d={`M30 ${g - 18.8} L32 ${g - 23.6} L56 ${g - 24.2} L62 ${g - 19.4} Z`} fill={h.lys} />
      <path d={`M33 ${g - 20.6} L33.6 ${g - 22.4} L55 ${g - 22.8} L58.6 ${g - 20.8} Z`} fill={S.mork.flate} />
      <path d={`M20 ${g - 13.2} L22 ${g - 18.8} L64 ${g - 19.6} L72 ${g - 14} Z`} fill={h.flate} />
      <path d={`M23 ${g - 15} L23.6 ${g - 17.2} L63 ${g - 17.8} L68 ${g - 15.2} Z`} fill={S.mork.flate} />
      <path d={`M10 ${g - 7.2} L12 ${g - 13.2} L76 ${g - 14.2} L84 ${g - 9} Z`} fill={h.flate} />
      <path d={`M14 ${g - 9.4} L15 ${g - 11.8} L72 ${g - 12.6} L78 ${g - 9.8} Z`} fill={S.mork.flate} />
      {[18, 26, 36, 50, 60, 31, 44, 54].map((x, i) => (
        <rect key={i} x={x} y={i < 5 ? g - 11.6 : g - 17.2} width="2.2" height="1.6" fill={S.vinduLys.flate} opacity="0.85" />
      ))}
      <path d={`M12 ${g - 13.2} L76 ${g - 14.2} M22 ${g - 18.8} L64 ${g - 19.6}`} stroke={h.lys} strokeWidth="0.6" />
      <Figur x={28} y={g - 19.4} avstand="fjern" klaer={S.hvit} />
      <Figur x={66} y={g - 14} avstand="fjern" klaer={S.marine} vendt={-1} />
      {/* Skroget og ankerkjettingen. */}
      <path d={`M6 ${g - 7} L84 ${g - 9} Q90 ${g - 9.4} 93 ${g - 12} Q90 ${g - 4} 84 ${g - 0.6} L12 ${g} L7 ${g - 3} Z`} fill={S.marine.flate} />
      <path d={`M6 ${g - 7} L84 ${g - 9} Q90 ${g - 9.4} 93 ${g - 12}`} fill="none" stroke={S.marine.lys} strokeWidth="0.9" />
      <path d={`M8 ${g - 2.4} L86.6 ${g - 3.4}`} stroke={h.flate} strokeWidth="0.6" />
      <path d={`M88 ${g - 8} Q89 ${g - 3} 90.6 ${g + 1}`} fill="none" stroke={S.metall.skygge} strokeWidth="0.4" strokeDasharray="0.6 0.4" />
      {/* Jolla ved hekken. */}
      <path d={`M2 ${g + 2.4} L13 ${g + 2} Q12.4 ${g + 4} 10.6 ${g + 4.6} L4 ${g + 4.6} Q2.6 ${g + 4} 2 ${g + 2.4} Z`} fill={h.lys} />
      <rect x="5" y={g + 0.8} width="3" height="1.4" fill={S.mork.flate} />
    </Lerret>
  )
}

// ─────────────────────────────────────────────── Luksus: fly (sett fra siden, parkert)


/**
 * Propellflyet (gateavstand, på en gressstripe): et privat turbopropfly med
 * lavvinge, hvitt med vinrød og okerfarget stripe, cockpit og tre
 * kabinvinduer, firebladet propell i fart og vindpølsa ved stripa. I scenen
 * går propellen, pølsa blafrer og lyset på finnen blinker (G10).
 */
function Propellfly({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const h = S.hvit
  return (
    <Lerret størrelse={størrelse}>
      <Kantfade>
        {/* Vindpølsa ved enden av stripa. */}
        <line x1="34" y1={g - 14} x2="34" y2={g - 36} stroke={h.flate} strokeWidth="0.6" />
        <g className="anim-flagg">
          <path d={`M34.4 ${g - 36} L43 ${g - 34.8} L43 ${g - 33} L34.4 ${g - 33.4} Z`} fill={S.oker.flate} />
          <path d={`M37.2 ${g - 35.6} L40 ${g - 35.2} L40 ${g - 33.2} L37.2 ${g - 33.4} Z`} fill={h.lys} />
        </g>
      </Kantfade>
      <Bakke type="gress" />
      <ellipse cx="50" cy={g + 0.4} rx="34" ry="1.6" fill="#000000" opacity="0.22" />
      {/* Understellet. */}
      {[54, 80].map((x) => (
        <g key={x}>
          <line x1={x} y1={g - 8} x2={x} y2={g - 3} stroke={S.metall.skygge} strokeWidth="0.8" />
          <circle cx={x} cy={g - 2.4} r="2.4" fill={S.mork.flate} />
          <circle cx={x} cy={g - 2.4} r="0.9" fill={S.metall.flate} />
        </g>
      ))}
      {/* Halen: høyderor og finne. */}
      <path d={`M6 ${g - 17} L20 ${g - 17.6} L20 ${g - 16} L7 ${g - 15.6} Z`} fill={h.skygge} />
      <path d={`M9 ${g - 17} L14 ${g - 31} L20.6 ${g - 31} L23 ${g - 18} Z`} fill={h.flate} />
      <path d={`M13.3 ${g - 29} L14 ${g - 31} L20.6 ${g - 31} L20.9 ${g - 29} Z`} fill={S.vin.flate} />
      {/* Kroppen. */}
      <path d={`M10 ${g - 17.4} L62 ${g - 19} Q70 ${g - 19.4} 76 ${g - 17.4} L84 ${g - 14} Q87 ${g - 12.6} 88 ${g - 11} L88 ${g - 9.6} Q86 ${g - 8} 82 ${g - 8} L40 ${g - 8} Q22 ${g - 9} 10 ${g - 15.6} Z`} fill={h.flate} />
      <path d={`M10 ${g - 17.4} L62 ${g - 19} Q70 ${g - 19.4} 76 ${g - 17.4} L75 ${g - 16.8} Q70 ${g - 18.4} 62 ${g - 18.2} L11 ${g - 16.6} Z`} fill={h.lys} />
      <path d={`M40 ${g - 8} L82 ${g - 8} Q86 ${g - 8} 88 ${g - 9.6} L88 ${g - 10.4} L40 ${g - 10.2} Q24 ${g - 10.6} 12 ${g - 15} Q22 ${g - 9} 40 ${g - 8} Z`} fill={h.skygge} />
      <path d={`M12.6 ${g - 14.6} L84.4 ${g - 13.2} L85 ${g - 12.2} L13.2 ${g - 13.4} Z`} fill={S.vin.flate} />
      <path d={`M14 ${g - 12.8} L85.4 ${g - 11.6}`} stroke={S.oker.flate} strokeWidth="0.5" />
      {/* Cockpit og kabinvinduer. */}
      <path d={`M66 ${g - 18.8} L72 ${g - 18.6} L77.4 ${g - 16} L66 ${g - 15.8} Z`} fill={S.mork.flate} />
      {[46, 52, 58].map((x) => (
        <rect key={x} className="nattvindu" x={x} y={g - 17.4} width="3.6" height="2.4" rx="1" fill={S.glass.skygge} />
      ))}
      <Glans points={`66.6,${g - 18.6} 70,${g - 18.5} 68,${g - 16} 66.4,${g - 16}`} />
      {/* Vingen, sett fra siden. */}
      <path d={`M40 ${g - 9.4} L64 ${g - 10} L66 ${g - 8.6} L38 ${g - 7.8} Z`} fill={h.skygge} />
      {/* Spinneren og propellen i fart. */}
      <path d={`M88 ${g - 13.4} Q91.8 ${g - 11.4} 88 ${g - 9.2} Z`} fill={S.vin.flate} />
      <ellipse cx="89.6" cy={g - 11.3} rx="1" ry="9" fill={S.mork.flate} opacity="0.22" />
      <path className="anim-propell" d={`M89.6 ${g - 11.3} L89.2 ${g - 19.4} M89.6 ${g - 11.3} L90 ${g - 3.6}`} stroke={S.mork.flate} strokeWidth="0.8" strokeLinecap="round" />
      <Blinklys x={17.4} y={g - 31.6} r={0.9} />
    </Lerret>
  )
}

/**
 * Forretningsjetten (gateavstand, på oppstillingsplassen): hvit med marineblå
 * og gull stripe, T-hale, motorer bak, ovale vinduer, trappa nede og rød
 * løper fram til den. Klar til å ta deg hvor som helst.
 */
function Forretningsjet({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const h = S.hvit
  return (
    <Lerret størrelse={størrelse}>
      <Bakke type="asfalt" />
      <Kantfade>
        <path d={`M69 ${g} L72.6 ${g} L62 ${g + 9} L56 ${g + 9} Z`} fill={S.faluRod.flate} />
      </Kantfade>
      <ellipse cx="50" cy={g + 0.4} rx="38" ry="1.5" fill="#000000" opacity="0.22" />
      {[52, 82].map((x) => (
        <g key={x}>
          <line x1={x} y1={g - 7.6} x2={x} y2={g - 2.6} stroke={S.metall.skygge} strokeWidth="0.8" />
          <circle cx={x} cy={g - 2.2} r="2.2" fill={S.mork.flate} />
        </g>
      ))}
      {/* T-halen med høyderor på toppen. */}
      <path d={`M8 ${g - 13} L14 ${g - 30} L21 ${g - 30} L24 ${g - 14} Z`} fill={h.flate} />
      <path d={`M12.6 ${g - 26} L14 ${g - 30} L21 ${g - 30} L21.8 ${g - 26} Z`} fill={S.marine.flate} />
      <path d={`M10 ${g - 30.4} L24 ${g - 30.8} L24 ${g - 29.2} L11 ${g - 29} Z`} fill={h.skygge} />
      {/* Kroppen. */}
      <path d={`M10 ${g - 14} L72 ${g - 15} Q84 ${g - 15.2} 90 ${g - 11.8} Q91.4 ${g - 10.4} 89.6 ${g - 9.4} Q86 ${g - 7.6} 80 ${g - 7.6} L24 ${g - 7.6} Q14 ${g - 8.4} 8 ${g - 12.4} Z`} fill={h.flate} />
      <path d={`M10 ${g - 14} L72 ${g - 15} Q80 ${g - 15.2} 85 ${g - 13.8} L72 ${g - 14.2} L11 ${g - 13.2} Z`} fill={h.lys} />
      <path d={`M24 ${g - 7.6} L80 ${g - 7.6} Q86 ${g - 7.6} 89.6 ${g - 9.4} L89 ${g - 9} L24 ${g - 9} Q14 ${g - 9.6} 9 ${g - 12} Q14 ${g - 8.4} 24 ${g - 7.6} Z`} fill={h.skygge} />
      <path d={`M10 ${g - 10.6} L88.6 ${g - 10.2} L89.2 ${g - 9.4} L10.6 ${g - 9.6} Z`} fill={S.marine.flate} />
      <path d={`M11 ${g - 9} L88 ${g - 8.7}`} stroke={S.gull.flate} strokeWidth="0.45" />
      {/* Cockpit og ovale vinduer. */}
      <path d={`M82 ${g - 14.6} Q86.6 ${g - 13.8} 88.8 ${g - 12} L82.6 ${g - 11.8} Z`} fill={S.mork.flate} />
      {[40, 45, 50, 55, 60, 65].map((x) => (
        <ellipse key={x} className="nattvindu" cx={x} cy={g - 12.2} rx="1.2" ry="1.5" fill={S.glass.skygge} />
      ))}
      {/* Motoren bak og vingen. */}
      <path d={`M24 ${g - 14.6} L28 ${g - 13.4}`} stroke={h.skygge} strokeWidth="1.4" />
      <rect x="17" y={g - 18.4} width="15" height="5.2" rx="2.6" fill={S.metall.flate} />
      <rect x="30" y={g - 18} width="2" height="4.4" rx="1" fill={S.mork.flate} />
      <path d={`M17.6 ${g - 17.6} H29`} stroke={S.metall.lys} strokeWidth="0.6" />
      <path d={`M44 ${g - 8.6} L60 ${g - 9} L64 ${g - 7.4} L40 ${g - 7} Z`} fill={h.skygge} />
      {/* Døra og trappa ned. */}
      <rect x="73.6" y={g - 14.2} width="4" height="6.4" rx="1" fill={S.mork.flate} />
      <path d={`M73.6 ${g - 7.6} L77.6 ${g - 7.6} L73.4 ${g} L69.6 ${g} Z`} fill={h.flate} />
      {[1.6, 3.2, 4.8, 6.4].map((d) => (
        <line key={d} x1={+(73.6 - d * 0.5).toFixed(2)} y1={g - 7.6 + d} x2={+(77.6 - d * 0.55).toFixed(2)} y2={g - 7.6 + d} stroke={h.skygge} strokeWidth="0.4" />
      ))}
      <path d={`M77.6 ${g - 7.6} L73.6 ${g}`} stroke={S.metall.skygge} strokeWidth="0.5" />
      {/* Varsellysene (G10). */}
      <Blinklys x={50} y={g - 15.6} />
      <Blinklys x={58} y={g - 7.2} r={0.8} sen />
      <Blinklys x={23.4} y={g - 31.2} r={0.8} farge={S.hvit.lys} sen />
    </Lerret>
  )
}

/**
 * Helikopteret (gateavstand, på helipaden): et lett tomotors helikopter i
 * vinrødt med hvit stripe, stor glasskuppel, skrog med skyvedør, fenestron
 * i halen, meier og rotorbladene. H-en på plattformen foran. I scenen går
 * rotorene og lyset på finnen blinker (G10).
 */
function Helikopter({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const m = S.vin
  return (
    <Lerret størrelse={størrelse}>
      <Bakke type="asfalt" />
      <Kantfade>
        <ellipse cx="46" cy={g + 4} rx="30" ry="4.6" fill="none" stroke={S.oker.flate} strokeWidth="0.8" />
        <path d={`M40 ${g + 2.6} L39 ${g + 5.6} M52 ${g + 2.6} L53 ${g + 5.6} M39.6 ${g + 4} L52.4 ${g + 4}`} stroke={S.hvit.lys} strokeWidth="1" />
      </Kantfade>
      <ellipse cx="46" cy={g + 0.4} rx="24" ry="1.4" fill="#000000" opacity="0.24" />
      {/* Meiene. */}
      <rect x="26" y={g - 1.6} width="42" height="1.4" rx="0.7" fill={S.metall.skygge} />
      <path d={`M34 ${g - 1.4} Q33.4 ${g - 4} 35 ${g - 6.6} M57 ${g - 1.4} Q57.6 ${g - 4} 56 ${g - 6.6}`} fill="none" stroke={S.metall.skygge} strokeWidth="1" />
      {/* Halebommen, finnen og fenestronen. */}
      <path d={`M26 ${g - 18} L5 ${g - 20.6} L5 ${g - 18.6} L26 ${g - 12.6} Z`} fill={m.flate} />
      <path d={`M2 ${g - 18} L4 ${g - 31} L10.6 ${g - 31} L11 ${g - 17} Z`} fill={m.flate} />
      <circle cx="6.8" cy={g - 21.6} r="3.2" fill={S.mork.flate} />
      <path className="anim-dreie" style={{ ['--omlop' as string]: '0.4s' }} d={`M4.4 ${g - 21.6} H9.2 M6.8 ${g - 24} V${g - 19.2}`} stroke={S.metall.skygge} strokeWidth="0.5" />
      <path d={`M8 ${g - 19.4} L18 ${g - 19.8} L18 ${g - 18.6} L8.4 ${g - 18.2} Z`} fill={m.skygge} />
      {/* Motordekselet og rotoren. */}
      <path d={`M34 ${g - 22.6} L36.4 ${g - 27} L52 ${g - 27} L54 ${g - 22.6} Z`} fill={S.metall.flate} />
      <rect x="35.6" y={g - 25.6} width="3" height="1.6" rx="0.6" fill={S.mork.flate} />
      <rect x="43.4" y={g - 30} width="1.4" height="3.2" fill={S.metall.skygge} />
      <path className="anim-rotor" style={{ transformBox: 'view-box', transformOrigin: `44px ${g - 30.4}px` }} d={`M6 ${g - 29.6} Q44 ${g - 31.6} 88 ${g - 29.2}`} fill="none" stroke={S.mork.flate} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="44" cy={g - 30.4} rx="2" ry="1" fill={S.metall.flate} />
      {/* Skroget. */}
      <path d={`M24 ${g - 8} L24 ${g - 16} Q26 ${g - 22} 36 ${g - 23} L52 ${g - 23} Q64 ${g - 22.6} 68 ${g - 16} Q70 ${g - 11} 66 ${g - 8.4} Q62 ${g - 6.6} 56 ${g - 6.6} L30 ${g - 6.6} Q25 ${g - 7} 24 ${g - 8} Z`} fill={m.flate} />
      <path d={`M26 ${g - 19.6} Q28.6 ${g - 22.4} 36 ${g - 22.8} L52 ${g - 22.8} Q56 ${g - 22.6} 58.6 ${g - 21.6} L52 ${g - 21.8} L36 ${g - 21.8} Q30 ${g - 21.4} 26.6 ${g - 19} Z`} fill={m.lys} />
      <path d={`M24.4 ${g - 12.6} L67.4 ${g - 12.6} L67 ${g - 11} L24.4 ${g - 11} Z`} fill={S.hvit.lys} />
      <path d={`M25 ${g - 9} Q26 ${g - 7} 30 ${g - 6.8} L56 ${g - 6.8} Q62 ${g - 6.8} 65.6 ${g - 8.6} L65 ${g - 9.6} L25 ${g - 9.6} Z`} fill={m.skygge} />
      {/* Glasskuppelen og døra. */}
      <path d={`M54 ${g - 22.6} Q64.6 ${g - 21.6} 68 ${g - 15.4} Q69.4 ${g - 11.6} 66.6 ${g - 9.6} L60 ${g - 9.6} Q58 ${g - 16} 54 ${g - 22.6} Z`} fill={S.mork.flate} />
      <Glans points={`56,${g - 22} 61,${g - 21} 61.4,${g - 15} 59,${g - 15}`} />
      <rect x="38" y={g - 20.4} width="12" height="7.4" rx="1.6" fill={S.mork.flate} />
      <path d={`M37 ${g - 21} V${g - 7.4}`} stroke={m.skygge} strokeWidth="0.5" />
      <Blinklys x={7.2} y={g - 31.8} r={0.9} />
    </Lerret>
  )
}

/**
 * Langdistansejetten (fjern avstand, ved privatterminalen): et stort
 * privatfly i hvitt med marineblå hale og gullstripe, trappebil ved døra og
 * to små folk på vei om bord. Flyet når rundt halve jorda uten å lande.
 */
function Langdistansejet({ størrelse = 48 }: P) {
  const g = GRUNNLINJE
  const L = 88
  return (
    <Lerret størrelse={størrelse}>
      <Bakke type="asfalt" />
      <Passasjerfly x={4} gy={g} L={L} slag="jet" hale={S.marine.flate} />
      <path d={`M${4 + L * 0.12} ${g - 7.6} L${4 + L * 0.96} ${g - 7.6}`} stroke={S.gull.flate} strokeWidth="0.6" />
      {/* Trappebilen ved døra. */}
      <path d={`M70.6 ${g - 12.6} L74.4 ${g - 12.6} L68.4 ${g - 2.4} L64.4 ${g - 2.4} Z`} fill={S.hvit.flate} />
      {[2, 4, 6, 8].map((d) => (
        <line key={d} x1={+(70.6 - d * 0.6).toFixed(2)} y1={g - 12.6 + d} x2={+(74.4 - d * 0.6).toFixed(2)} y2={g - 12.6 + d} stroke={S.hvit.skygge} strokeWidth="0.35" />
      ))}
      <rect x="58" y={g - 4.4} width="12" height="3.6" rx="0.8" fill={S.oker.flate} />
      <rect x="58.8" y={g - 4} width="3" height="1.8" fill={S.mork.flate} />
      <circle cx="60.4" cy={g - 0.6} r="1" fill={S.mork.flate} />
      <circle cx="67.6" cy={g - 0.6} r="1" fill={S.mork.flate} />
      <Figur x={63} y={g + 1.6} avstand="fjern" klaer={S.mork} />
      <Figur x={60.4} y={g + 2.2} avstand="fjern" klaer={S.puss} />
    </Lerret>
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
  leilighet: LeilighetGrunerlokka,
  rekkehus: Rekkehus,
  hytte: Hytte,
  // Byversjonene (Pakke 44) har hver sin tegning fra G5.
  'hybel-trondheim': HybelMoholt,
  'hybel-oslo': HybelBlindern,
  'leilighet-bergen': LeilighetNordnes,
  'leilighet-trondheim': Bryggerekka,
  'rekkehus-bergen': RekkehusFana,
  'hytte-trysil': HytteTrysil,
  'hytte-lofoten': Rorbu,
  'kontorbygg-stavanger': KontorbyggStavanger,
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
  // Pakke 59: flere land.
  amsterdam: Amsterdam,
  roma: Roma,
  paris: Paris,
  'gard-hedmarken': GardHedmarken,
  'gard-lista': GardLista,
  'skog-trysil': SkogTrysil,
  'skog-namdalen': SkogNamdalen,
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
 * Hver eiendom har sin egen tegning fra stedet den ligger (G5), så les `sted` i
 * EIENDOMSTYPER før du tegner en ny.
 */
export const NY_STIL = ['kiosk', 'hytte', 'hytte-trysil', 'hytte-lofoten', 'kontorbygg', 'kontorbygg-stavanger', 'superbil', 'seilbaat', 'saftbod', 'polsebod', 'gatekjokken', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter', 'stasjonsvogn', 'elbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil', 'dykkerklokke', 'gullklokke', 'mesterverk', 'lommeur', 'diamantklokke', 'snekke', 'motorbaat', 'seilyacht', 'superyacht', 'propellfly', 'helikopter', 'forretningsjet', 'langdistansejet', 'hybel', 'hybel-oslo', 'hybel-trondheim', 'leilighet', 'leilighet-bergen', 'leilighet-trondheim', 'rekkehus', 'rekkehus-bergen', 'gard-hedmarken', 'gard-lista', 'skog-trysil', 'skog-namdalen', 'oy', 'fyret', 'borgen', 'hoppbakken', 'tarnet', 'naeringsbygg', 'kjopesenter', 'stockholm', 'kobenhavn', 'berlin', 'london', 'newyork', 'dubai', 'marbella-leilighet', 'marbella-hotell', 'zermatt-leilighet', 'zermatt-hotell', 'amsterdam', 'roma', 'paris']

/** Bedriftene, som har fire vekstrinn. */
export const BEDRIFTSTEGNINGER = ['saftbod', 'polsebod', 'gatekjokken', 'kiosk', 'kafe', 'restaurant', 'hotell', 'bank', 'oljeselskap', 'rederi', 'fiskeoppdrett', 'flyselskap', 'skisenter']

/**
 * Nærbildene (G9): utsnittet rundt motivet, [x, y, bredde, høyde] i lerretets
 * enheter, for steder der tegningen er så liten at motivet forsvinner.
 * Bedriftene er målt på trinn 0 og er kvadratiske (rivallista, 32 px); bilene,
 * båtene og flyene er brede eller høye som motivet (plassene i lageret).
 * Lest av på et rutenett over tegningen i ?galleri.
 */
export const NAERBILDER: Record<string, readonly [number, number, number, number]> = {
  saftbod: [26, 42, 48, 48],
  polsebod: [32, 40, 48, 48],
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
 * Illustrasjonen for en bedrift, eiendom eller luksusgjenstand, etter id.
 * Bedrifter vokser med `trinn` og viser `forbedringer` (0–3) som detaljer.
 * Med `utklipp` kommer tegningene uten himmel, bakke og bakgrunn, til steder
 * som har sin egen scene rundt. Med `naerbilde` ([maks bredde, maks høyde] i
 * piksler) vises bare utsnittet rundt motivet (`NAERBILDER`), så stort det får
 * plass; tegninger uten utsnitt vises hele, i `størrelse`.
 */
export const Illustrasjon = memo(function Illustrasjon({
  id,
  størrelse = 44,
  trinn = 0,
  forbedringer = 0,
  utklipp = false,
  naerbilde,
}: {
  id: string
  størrelse?: number
  trinn?: Trinn
  forbedringer?: number
  utklipp?: boolean
  naerbilde?: readonly [number, number]
}) {
  const Tegning = ILLUSTRASJONER[id]
  if (!Tegning) return null
  const boks = naerbilde && NAERBILDER[id]
  const skala = boks ? Math.min(naerbilde[0] / boks[2], naerbilde[1] / boks[3]) : 1
  const naer = boks ? { boks, bredde: Math.round(boks[2] * skala), hoyde: Math.round(boks[3] * skala) } : null
  return (
    <Utklipp.Provider value={utklipp}>
      <Naerbilde.Provider value={naer}>{Tegning({ størrelse, trinn, forbedringer })}</Naerbilde.Provider>
    </Utklipp.Provider>
  )
})
