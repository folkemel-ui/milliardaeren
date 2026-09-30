import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import { JORD, JORDLISTE } from '../../engine/jord'
import { useRef } from 'react'
import type { By, NorskBy, Spilltilstand } from '../../engine/types'
import { kartLeie, leieIBy, trendFor, trendRing, useKlyp, useLangtrykk } from '../kart'
import { perSek } from '../format'
import { BYLISTE, byPunkt, etiketter, HOVEDOMRAADE, hovedpunkt, INNFELT, innfeltpunkt, KUN_JORD, navnestorrelse, radius, VISNING } from '../norgeskartet'
import { Ikon } from './Ikoner'

/*
 * Et stilisert Norgeskart tegnet fra ekte koordinater. Hovedkartet viser
 * Sør-Norge, der nesten alt skjer; hele landet står som et innfelt nederst
 * til høyre, med Lofoten. Geometrien (projeksjon, sider for navnene) står i
 * norgeskartet.ts, der en test sjekker at ingenting overlapper.
 *
 * Kartet viser bare prikk, antall og navn. Leien står ved byen du har valgt;
 * gårder, skoger og landemerker står i lista under kartet.
 */

const FASTLAND: [number, number][] = [
  // Sørlandet: Lindesnes, Kristiansand, Arendal, Kragerø, Larvik
  [7.05, 57.98], [7.45, 58.02], [8.0, 58.12], [8.38, 58.25], [8.77, 58.46], [9.23, 58.72], [9.42, 58.87], [9.75, 59.0],
  [10.03, 59.05], [10.23, 59.13],
  // Oslofjorden: vestsiden inn til Drammen og Oslo, østsiden ut til Hvaler og Halden
  [10.42, 59.27], [10.48, 59.42], [10.3, 59.49], [10.25, 59.72], [10.55, 59.82], [10.75, 59.9], [10.72, 59.62],
  [10.66, 59.43], [10.93, 59.21], [11.05, 59.08], [11.39, 59.12],
  // Svenskegrensa
  [11.8, 59.8], [12.5, 60.3], [12.3, 61.0], [12.1, 61.8], [12.3, 62.8], [12.0, 63.3], [13.2, 64.0], [14.0, 64.6], [14.1, 65.3],
  [15.0, 66.1], [15.8, 66.6], [16.5, 67.5], [17.9, 68.2], [18.3, 68.5], [19.9, 68.4], [20.6, 69.1],
  // Finnmarksvidda og russegrensa
  [21.8, 69.0], [22.5, 68.7], [23.9, 68.8], [25.0, 68.6], [25.8, 69.4], [26.5, 69.9], [27.9, 70.1], [28.9, 69.8], [29.3, 69.3],
  [29.1, 69.0], [30.9, 69.6],
  // Nordkysten
  [31.0, 70.3], [30.0, 70.6], [28.5, 71.0], [27.0, 71.0], [25.8, 71.15], [24.5, 70.9], [23.2, 70.8], [22.0, 70.4],
  [21.0, 70.1], [19.5, 70.1], [18.3, 69.8], [17.0, 69.3], [16.0, 68.8],
  // Vestfjorden og Helgeland
  [16.1, 68.4], [15.5, 68.1], [14.9, 67.8], [14.4, 67.4], [13.7, 67.0], [13.0, 66.6], [12.6, 66.1], [12.2, 65.5],
  // Trøndelag og Vestlandet
  [11.5, 64.9], [10.7, 64.5], [10.0, 64.0], [9.7, 63.85],
  // Trondheimsfjorden: nordsiden inn til Levanger, rundt via Trondheim og ut langs sørsiden
  [10.3, 63.72], [11.0, 63.8], [11.3, 63.72], [10.95, 63.47], [10.4, 63.43], [9.9, 63.5], [9.5, 63.56],
  [8.4, 63.4], [7.3, 63.0], [6.3, 62.5], [5.6, 62.35], [5.2, 62.2], [5.0, 61.6],
  // Sognefjorden
  [4.95, 61.12], [5.6, 61.14], [6.6, 61.18], [7.2, 61.22], [6.6, 61.08], [5.6, 61.04], [4.9, 61.0],
  [5.0, 60.4],
  // Hardangerfjorden
  [5.3, 60.05], [6.0, 60.2], [6.6, 60.42], [6.1, 60.1], [5.55, 59.9], [5.2, 59.85],
  [5.3, 59.4], [5.55, 59.1], [5.6, 58.9], [5.7, 58.6], [6.2, 58.3], [6.7, 58.08],
]

const LOFOTEN: [number, number][] = [
  [12.9, 67.9], [13.8, 68.1], [14.6, 68.2], [15.3, 68.3], [15.1, 68.5], [14.2, 68.45], [13.3, 68.2], [12.9, 68.0],
]

const punkter = (liste: [number, number][], p: (x: [number, number]) => [number, number]) => liste.map((k) => p(k).map((v) => v.toFixed(1)).join(',')).join(' ')

/** Hvor mange eiendommer du eier i hver by. */
function perBy(s: Spilltilstand): Partial<Record<By, number>> {
  const antall: Partial<Record<By, number>> = {}
  for (const id of EIENDOMSSTIGEN) antall[EIENDOMSTYPER[id].by] = (antall[EIENDOMSTYPER[id].by] ?? 0) + (s.eiendommer[id] ?? 0)
  for (const id of JORDLISTE) if (s.jord?.[id]) antall[JORD[id].by] = (antall[JORD[id].by] ?? 0) + 1
  return antall
}

export function Norgeskart({
  s,
  valgt,
  velg,
  zoom,
}: {
  s: Spilltilstand
  valgt: By | null
  velg: (by: By | null) => void
  /** Åpner gatebildet for en by: langt trykk på byen, eller to fingre som glir fra hverandre. */
  zoom: (by: By) => void
}) {
  const antall = perBy(s)
  const svg = useRef<SVGSVGElement>(null)
  const lang = useLangtrykk(zoom)
  // Klyp: gatebildet for den valgte byen, eller byen nærmest midt mellom fingrene.
  const klyp = useKlyp((sx, sy) => {
    if (valgt) return zoom(valgt)
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(sx, sy).matrixTransform(m.inverse())
    const nærmest = BYLISTE.map((by) => {
      const [x, y] = byPunkt(by)
      return { by, d: Math.hypot(x - p.x, y - p.y) }
    }).sort((a, b) => a.d - b.d)[0]
    if (nærmest) zoom(nærmest.by)
  })

  const [[vLon, nLat], [oLon, sLat]] = HOVEDOMRAADE
  const [rx1, ry1] = innfeltpunkt([vLon, nLat])
  const [rx2, ry2] = innfeltpunkt([oLon, sLat])

  return (
    <svg
      ref={svg}
      className="norgeskart"
      viewBox={`${VISNING.x} ${VISNING.y} ${VISNING.bredde} ${VISNING.hoyde}`}
      role="group"
      aria-label="Kart over eiendommene dine"
      {...klyp}
    >
      <polygon points={punkter(FASTLAND, hovedpunkt)} className="kart-land" />

      {/* Innfeltet: hele landet, med rammen rundt det hovedkartet viser. */}
      <g className="kart-innfelt" aria-hidden="true">
        <rect x={INNFELT.x} y={INNFELT.y} width={INNFELT.bredde} height={INNFELT.hoyde} rx="6" className="kart-innfelt-ramme" />
        <polygon points={punkter(FASTLAND, innfeltpunkt)} className="kart-land" />
        <polygon points={punkter(LOFOTEN, innfeltpunkt)} className="kart-land" />
        <rect x={rx1} y={ry1} width={rx2 - rx1} height={ry2 - ry1} className="kart-innfelt-utsnitt" />
      </g>

      {BYLISTE.map((by, i) => (
        <Byen key={by} s={s} by={by} i={i} n={antall[by] ?? 0} valgt={valgt === by} velg={velg} lang={lang} />
      ))}
    </svg>
  )
}

function Byen({
  s,
  by,
  i,
  n,
  valgt,
  velg,
  lang,
}: {
  s: Spilltilstand
  by: NorskBy
  i: number
  n: number
  valgt: boolean
  velg: (by: By | null) => void
  lang: ReturnType<typeof useLangtrykk>
}) {
  const [x, y] = byPunkt(by)
  const eid = n > 0
  const r = radius(by, eid)
  const trend = trendRing(trendFor(s, by))
  const leie = leieIBy(s, by)
  // Stedene med bare jord har ikke navn på kartet før du eier noe der eller velger dem.
  const visNavn = !KUN_JORD.has(by) || eid || valgt
  const { navn, leie: leiepos } = etiketter(by, r, valgt && leie > 0 ? kartLeie(leie) : null)
  return (
    <g
      className={`kart-by${eid ? ' eid' : ''}${valgt ? ' valgt' : ''}${KUN_JORD.has(by) ? ' jord' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${by}: ${n} ${n === 1 ? 'eiendom' : 'eiendommer'}${leie > 0 ? `, leie ${perSek(leie)}` : ''}${valgt ? ', valgt' : ''}. Hold inne for gatebildet.`}
      onClick={() => !lang.varLangt() && velg(valgt ? null : by)}
      onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt ? null : by)}
      {...lang.hendelser(by)}
    >
      {/* Større, usynlig treffflate så byene er lette å treffe med fingeren. */}
      <circle cx={x} cy={y} r={14} className="kart-treff" />
      {trend && <circle cx={x} cy={y} r={r + 3} className={`kart-trend ${trend.klasse}`} style={{ strokeOpacity: trend.styrke }} />}
      <circle cx={x} cy={y} r={r} className="kart-prikk" />
      {eid && (
        <text x={x} y={y + r * 0.43} className="kart-antall" textAnchor="middle" style={{ fontSize: r * 1.3 }}>
          {n}
        </text>
      )}
      {visNavn && (
        <text x={navn.x} y={navn.y} textAnchor={navn.anker} className="kart-navn" style={{ fontSize: navnestorrelse(by) }}>
          {by}
        </text>
      )}
      {leiepos && (
        <text x={leiepos.x} y={leiepos.y} textAnchor={leiepos.anker} className="kart-leie">
          {kartLeie(leie)}
        </text>
      )}
      {leie > 0 && (
        // En mynt som stiger når leien kommer — forskjøvet per by, så de ikke går i takt.
        <g className="kart-mynt" style={{ animationDelay: `${(i % 5) * 0.9}s` }}>
          <Ikon navn="mynt" størrelse={8} x={x - 4} y={y - r - 10} />
        </g>
      )}
    </g>
  )
}
