import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import { JORD, JORDLISTE } from '../../engine/jord'
import { useRef } from 'react'
import type { By, NorskBy, Spilltilstand } from '../../engine/types'
import { kartLeie, leieIBy, symbolerI, trendFor, trendRing, useKlyp, useLangtrykk } from '../kart'
import { perSek } from '../format'
import { Ikon } from './Ikoner'

/*
 * Et stilisert Norgeskart tegnet fra ekte koordinater (lengde, bredde),
 * projisert enkelt: x = (lengde − 4) · 0,46 · S, y = (71,4 − bredde) · S.
 * Faktoren 0,46 ≈ cos(63°) retter opp at lengdegradene er smale så langt nord.
 */
const S = 20
const px = ([lon, lat]: [number, number]) => [((lon - 4) * 0.46 * S).toFixed(1), ((71.4 - lat) * S).toFixed(1)].join(',')

const FASTLAND: [number, number][] = [
  // Sørlandet og Oslofjorden
  [7.05, 57.98], [7.9, 58.1], [8.7, 58.4], [9.6, 58.9], [10.2, 59.05], [10.5, 59.3], [10.7, 59.7], [10.9, 59.3], [11.4, 59.1],
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
  [11.5, 64.9], [10.7, 64.5], [10.0, 64.0], [9.3, 63.7], [8.4, 63.4], [7.3, 63.0], [6.3, 62.5], [5.2, 62.2], [5.0, 61.6],
  [4.9, 61.0], [5.0, 60.4], [5.2, 59.9], [5.3, 59.4], [5.6, 58.9], [5.7, 58.6], [6.2, 58.3],
]

const LOFOTEN: [number, number][] = [
  [12.9, 67.9], [13.8, 68.1], [14.6, 68.2], [15.3, 68.3], [15.1, 68.5], [14.2, 68.45], [13.3, 68.2], [12.9, 68.0],
]

const BYER: Record<NorskBy, { pos: [number, number]; etikett: 'høyre' | 'venstre' | 'over' }> = {
  Bergen: { pos: [5.32, 60.39], etikett: 'venstre' },
  Stavanger: { pos: [5.73, 58.97], etikett: 'venstre' },
  Oslo: { pos: [10.75, 59.91], etikett: 'høyre' },
  Geilo: { pos: [8.21, 60.53], etikett: 'over' },
  Trondheim: { pos: [10.4, 63.43], etikett: 'høyre' },
  Lofoten: { pos: [14.56, 68.23], etikett: 'venstre' },
  Hedmarken: { pos: [11.07, 60.79], etikett: 'høyre' },
  Trysil: { pos: [12.27, 61.31], etikett: 'høyre' },
  Lista: { pos: [6.7, 58.1], etikett: 'høyre' },
  Namdalen: { pos: [11.5, 64.47], etikett: 'høyre' },
}

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
    const nærmest = (Object.keys(BYER) as NorskBy[])
      .map((by) => {
        const [x, y] = px(BYER[by].pos).split(',').map(Number)
        return { by, d: Math.hypot(x - p.x, y - p.y) }
      })
      .sort((a, b) => a.d - b.d)[0]
    if (nærmest) zoom(nærmest.by)
  })

  return (
    // Litt luft til venstre, så «Bergen» får plass utenfor kysten.
    <svg ref={svg} className="norgeskart" viewBox="-44 0 304 280" role="group" aria-label="Kart over eiendommene dine" {...klyp}>
      <polygon points={FASTLAND.map(px).join(' ')} className="kart-land" />
      <polygon points={LOFOTEN.map(px).join(' ')} className="kart-land" />
      {(Object.keys(BYER) as NorskBy[]).map((by, i) => {
        const [x, y] = px(BYER[by].pos).split(',').map(Number)
        const n = antall[by] ?? 0
        const r = n > 0 ? Math.min(11, 5 + n * 1.2) : 4
        const e = BYER[by].etikett
        const trend = trendRing(trendFor(s, by))
        const leie = leieIBy(s, by)
        const symboler = symbolerI(s, by)
        // Navnet står på én side av prikken; symbolene på den andre.
        const navnX = e === 'høyre' ? x + r + 4 : e === 'venstre' ? x - r - 4 : x
        const navnY = e === 'over' ? y - r - 5 : y + 4
        const anker = e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'
        const symbolX = e === 'høyre' ? x - r - 3 : e === 'venstre' ? x + r + 3 : x
        const symbolY = e === 'over' ? y + r + 9 : y + 3
        const symbolAnker = e === 'høyre' ? 'end' : e === 'venstre' ? 'start' : 'middle'
        return (
          <g
            key={by}
            className={`kart-by${n > 0 ? ' eid' : ''}${valgt === by ? ' valgt' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${by}: ${n} ${n === 1 ? 'eiendom' : 'eiendommer'}${leie > 0 ? `, leie ${perSek(leie)}` : ''}${valgt === by ? ', valgt' : ''}. Hold inne for gatebildet.`}
            onClick={() => !lang.varLangt() && velg(valgt === by ? null : by)}
            onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt === by ? null : by)}
            {...lang.hendelser(by)}
          >
            {/* Større, usynlig treffflate så byene er lette å treffe med fingeren. */}
            <circle cx={x} cy={y} r={16} className="kart-treff" />
            {trend && <circle cx={x} cy={y} r={r + 3} className={`kart-trend ${trend.klasse}`} style={{ strokeOpacity: trend.styrke }} />}
            <circle cx={x} cy={y} r={r} className="kart-prikk" />
            {n > 0 && (
              <text x={x} y={y + 3.5} className="kart-antall" textAnchor="middle">
                {n}
              </text>
            )}
            <text x={navnX} y={navnY} textAnchor={anker} className="kart-navn">
              {by}
            </text>
            {leie > 0 && (
              <>
                <text x={navnX} y={e === 'over' ? navnY - 10 : navnY + 9} textAnchor={anker} className="kart-leie">
                  {kartLeie(leie)}
                </text>
                {/* En mynt som stiger når leien kommer — forskjøvet per by, så de ikke går i takt. */}
                <g className="kart-mynt" style={{ animationDelay: `${(i % 5) * 0.9}s` }}>
                  <Ikon navn="mynt" størrelse={8} x={x - 4} y={y - r - 10} />
                </g>
              </>
            )}
            {symboler.length > 0 && (
              <text x={symbolX} y={symbolY} textAnchor={symbolAnker} className="kart-symboler">
                {symboler.map((sym, j) => (
                  <tspan key={j} className={sym.eid ? 'eid' : ''}>
                    <title>{`${sym.navn}${sym.eid ? ' (din)' : ''}`}</title>
                    {sym.tegn}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
