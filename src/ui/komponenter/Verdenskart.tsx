import { EIENDOMSSTIGEN, EIENDOMSTYPER, FLY_REKKEFOLGE, LUKSUS, reiseNivaa } from '../../engine/eiendom'
import type { By, Spilltilstand, Utenlandsby } from '../../engine/types'
import { kartLeie, leieIBy, useLangtrykk } from '../kart'

/*
 * Et rutekart, ikke et ekte kart: byene står omtrent der de ligger i forhold
 * til Oslo, men avstandene er klemt sammen så Europa får plass ved siden av
 * New York og Dubai. Buene er flyrutene fra Oslo.
 */
const OSLO: [number, number] = [150, 38]

const BYER: Record<Utenlandsby, { pos: [number, number]; etikett: 'høyre' | 'venstre' | 'under' }> = {
  Stockholm: { pos: [196, 46], etikett: 'høyre' },
  København: { pos: [160, 76], etikett: 'høyre' },
  Berlin: { pos: [184, 104], etikett: 'høyre' },
  London: { pos: [108, 92], etikett: 'venstre' },
  'New York': { pos: [30, 132], etikett: 'under' },
  Dubai: { pos: [266, 146], etikett: 'under' },
}

/** Flyet som trengs for å nå en by (1–3). */
function reiseTil(by: Utenlandsby): number {
  const id = EIENDOMSSTIGEN.find((x) => EIENDOMSTYPER[x].by === by)
  return id ? (EIENDOMSTYPER[id].reise ?? 0) : 0
}

function antallI(s: Spilltilstand, by: By): number {
  return EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by).reduce((sum, id) => sum + (s.eiendommer[id] ?? 0), 0)
}

/** En bue fra Oslo til byen, bøyd litt oppover som en flyrute. */
function bue([x, y]: [number, number]): string {
  const [ox, oy] = OSLO
  const mx = (ox + x) / 2
  const my = (oy + y) / 2 - Math.hypot(x - ox, y - oy) * 0.18
  return `M${ox},${oy} Q${mx.toFixed(1)},${my.toFixed(1)} ${x},${y}`
}

export function Verdenskart({
  s,
  valgt,
  velg,
  zoom,
}: {
  s: Spilltilstand
  valgt: By | null
  velg: (by: By | null) => void
  /** Åpner gatebildet for en by — langt trykk på byen. */
  zoom: (by: By) => void
}) {
  const nivaa = reiseNivaa(s)
  const lang = useLangtrykk(zoom)
  return (
    <figure className="verdenskart-ramme">
      <svg className="verdenskart" viewBox="0 0 300 175" role="group" aria-label="Rutekart over byene du kan fly til">
        {(Object.keys(BYER) as Utenlandsby[]).map((by) => (
          <path key={by} d={bue(BYER[by].pos)} className={nivaa >= reiseTil(by) ? 'kart-rute' : 'kart-rute stengt'} />
        ))}
        <g className="kart-by eid hjem">
          <circle cx={OSLO[0]} cy={OSLO[1]} r={5} className="kart-prikk" />
          <text x={OSLO[0]} y={OSLO[1] - 9} textAnchor="middle" className="kart-navn">
            Oslo
          </text>
        </g>
        {(Object.keys(BYER) as Utenlandsby[]).map((by) => {
          const [x, y] = BYER[by].pos
          const n = antallI(s, by)
          const åpen = nivaa >= reiseTil(by)
          const r = n > 0 ? Math.min(11, 5 + n * 1.2) : 4
          const e = BYER[by].etikett
          const fly = LUKSUS[FLY_REKKEFOLGE[reiseTil(by) - 1]]
          return (
            <g
              key={by}
              className={`kart-by${n > 0 ? ' eid' : ''}${valgt === by ? ' valgt' : ''}${åpen ? '' : ' stengt'}`}
              role="button"
              tabIndex={0}
              aria-label={`${by}: ${åpen ? `${n} ${n === 1 ? 'eiendom' : 'eiendommer'}` : `krever ${fly.navn.toLowerCase()}`}${valgt === by ? ', valgt' : ''}`}
              onClick={() => !lang.varLangt() && velg(valgt === by ? null : by)}
              onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt === by ? null : by)}
              {...lang.hendelser(by)}
            >
              <circle cx={x} cy={y} r={16} className="kart-treff" />
              <circle cx={x} cy={y} r={r} className="kart-prikk" />
              {n > 0 && (
                <text x={x} y={y + 3.5} className="kart-antall" textAnchor="middle">
                  {n}
                </text>
              )}
              <text
                x={e === 'høyre' ? x + r + 4 : e === 'venstre' ? x - r - 4 : x}
                y={e === 'under' ? y + r + 11 : y + 4}
                textAnchor={e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'}
                className="kart-navn"
              >
                {åpen ? by : `${fly.emoji} ${by}`}
              </text>
              {leieIBy(s, by) > 0 && (
                <text
                  x={e === 'høyre' ? x + r + 4 : e === 'venstre' ? x - r - 4 : x}
                  y={e === 'under' ? y + r + 21 : y + 14}
                  textAnchor={e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'}
                  className="kart-leie"
                >
                  {kartLeie(leieIBy(s, by))}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="dempet liten">
        {nivaa === 0
          ? 'Kjøp et fly under Luksus for å reise ut. Propellflyet når Norden, jetflyene resten av verden.'
          : nivaa < FLY_REKKEFOLGE.length
            ? `${LUKSUS[FLY_REKKEFOLGE[nivaa - 1]].navn} tar deg til de åpne byene. ${LUKSUS[FLY_REKKEFOLGE[nivaa]].navn} når lenger.`
            : 'Langdistansejeten tar deg hvor som helst.'}
      </figcaption>
    </figure>
  )
}
