/**
 * Tegningene av luksusen: bilene, klokkene, båtene og flyene. De ligger utenfor
 * startskriptet og lastes først når de trengs (Grafikkpakke G12) — på Luksus-fanen,
 * i Avisa eller et kjøpsglimt — eller i ro like etter at spillet har startet
 * (`forvarm` i ui/vedBehov.ts). Kunstretningen står øverst i Illustrasjoner.tsx,
 * som også slår opp tegningene.
 */

import { useContext, type ReactNode } from 'react'
import { r2, Blinklys, IScenen, Lakksveip, Bakke, Dis, GRUNNLINJE, HORISONT, Kantfade, Kloss, Lerret, Person as Figur, S, Slagskygge, Speiling, Glans, inn, type Materiale } from '../Tegnestil'
import { Passasjerfly, type P, type Tegning } from '../Illustrasjoner'

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

/** Luksustegningene, etter id. Illustrasjon i Illustrasjoner.tsx slår opp her når delen er lastet. */
export const LUKSUSTEGNINGER: Record<string, Tegning> = {
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
