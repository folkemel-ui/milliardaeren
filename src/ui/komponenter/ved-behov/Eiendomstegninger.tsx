/**
 * Tegningene av eiendommene: boligene, jord og skog, landemerkene og eiendom
 * utenlands. De ligger utenfor startskriptet og lastes først når de trengs
 * (Grafikkpakke G12) — på Eiendom-fanen, i Avisa eller et kjøpsglimt — eller i ro
 * like etter at spillet har startet (`forvarm` i ui/vedBehov.ts). Kunstretningen
 * står øverst i Illustrasjoner.tsx, som også slår opp tegningene.
 */

import { useContext, type ReactNode } from 'react'
import { r2, Blinklys, IScenen, tennesOmNatta, Bakke, Bunnfade, Dis, GRUNNLINJE, HORISONT, Kantfade, Kloss, Lampe, Lerret, Person as Figur, S, Saltak, Slagskygge, Glans, Tre, Vindusrad, inn, maal, pkt, type Materiale } from '../Tegnestil'
import { Passasjerfly, Sykkel, type P, type Tegning } from '../Illustrasjoner'

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

// ─────────────────────────────────────────────── Oppslag

/** Eiendomstegningene, etter id. Illustrasjon i Illustrasjoner.tsx slår opp her når delen er lastet. */
export const EIENDOMSTEGNINGER: Record<string, Tegning> = {
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
}
