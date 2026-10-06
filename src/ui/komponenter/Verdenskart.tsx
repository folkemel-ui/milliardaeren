import { useMemo } from 'react'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, FLY_REKKEFOLGE, LUKSUS, reiseNivaa } from '../../engine/eiendom'
import type { By, Spilltilstand, Utenlandsby } from '../../engine/types'
import { kartLeie, leieIBy, useLangtrykk, eierHeleByen, kronesti } from '../kart'
import { BREDDE, BYPLASS, byPunkt, HOYDE, INNFELT, LAND, OSLO_POS, projeksjon, sti, utsnittFor } from '../verdenskartet'
import { Ikon } from './Ikoner'

/** Flyet som trengs for å nå en by (1–3). */
function reiseTil(by: Utenlandsby): number {
  const id = EIENDOMSSTIGEN.find((x) => EIENDOMSTYPER[x].by === by)
  return id ? (EIENDOMSTYPER[id].reise ?? 0) : 0
}

function antallI(s: Spilltilstand, by: By): number {
  return EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by).reduce((sum, id) => sum + (s.eiendommer[id] ?? 0), 0)
}

/** En bue fra Oslo til byen, bøyd litt oppover som en flyrute. */
function bue([ox, oy]: [number, number], [x, y]: [number, number]): string {
  const mx = (ox + x) / 2
  const my = (oy + y) / 2 - Math.hypot(x - ox, y - oy) * 0.18
  return `M${ox.toFixed(1)},${oy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
}

/** Hva det neste flyet åpner, til teksten under kartet. */
const NESTE_STEG = ['Propellflyet åpner Norden.', 'Forretningsjeten åpner Europa: London, Berlin, Marbella og Zermatt.', 'Langdistansejeten åpner New York og Dubai.']

/**
 * Verdenskartet (Pakke 45): et ekte kart med kystlinjer som vokser med flyene
 * dine — Norden med propellflyet, Europa med forretningsjeten, og med
 * langdistansejeten to innfelte ruter for New York og Dubai. Buene er
 * flyrutene fra Oslo. Geometrien står i ui/verdenskartet.ts.
 */
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
  const p = useMemo(() => projeksjon(utsnittFor(nivaa)), [nivaa])
  const land = useMemo(() => LAND.map((l) => sti(l, p)), [p])
  const oslo = p(OSLO_POS)
  const synlige = (Object.keys(BYPLASS) as Utenlandsby[]).flatMap((by) => {
    const pos = byPunkt(by, nivaa)
    return pos ? [{ by, pos }] : []
  })

  return (
    <figure className="verdenskart-ramme">
      <svg className="verdenskart" viewBox={`0 0 ${BREDDE} ${HOYDE}`} role="group" aria-label="Kart over byene du kan fly til">
        <rect x="0" y="0" width={BREDDE} height={HOYDE} rx="8" className="kart-hav" />
        {land.map((d, i) => (
          <path key={i} d={d} className="kart-land" />
        ))}
        {nivaa >= 3 &&
          (Object.keys(INNFELT) as (keyof typeof INNFELT)[]).map((by) => {
            const i = INNFELT[by]
            const ip = projeksjon(i.utsnitt, i)
            return (
              <g key={by} className="kart-innfelt" aria-hidden="true">
                <rect x={i.x} y={i.y} width={i.bredde} height={i.hoyde} rx="5" className="kart-innfelt-ramme" />
                <clipPath id={`innfelt-${by.replace(' ', '')}`}>
                  <rect x={i.x} y={i.y} width={i.bredde} height={i.hoyde} rx="5" />
                </clipPath>
                <g clipPath={`url(#innfelt-${by.replace(' ', '')})`}>
                  {i.land.map((l, k) => (
                    <path key={k} d={sti(l, ip)} className="kart-land" />
                  ))}
                </g>
              </g>
            )
          })}
        {synlige.map(({ by, pos }) => (
          <path key={by} d={bue(oslo, pos)} className={nivaa >= reiseTil(by) ? 'kart-rute' : 'kart-rute stengt'} />
        ))}
        <g className="kart-by eid hjem">
          <circle cx={oslo[0]} cy={oslo[1]} r={4.5} className="kart-prikk" />
          <text x={oslo[0] - 7} y={oslo[1] + 3.5} textAnchor="end" className="kart-navn">
            Oslo
          </text>
        </g>
        {synlige.map(({ by, pos: [x, y] }) => {
          const n = antallI(s, by)
          const åpen = nivaa >= reiseTil(by)
          const r = n > 0 ? Math.min(11, 5 + n * 1.2) : 4
          const e = BYPLASS[by].etikett
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
              <circle cx={x} cy={y} r={åpen ? r : 6} className="kart-prikk" />
              {åpen && eierHeleByen(s, by) && <path d={kronesti(x + r * 0.9, y - r * 0.9, 9)} className="kart-krone" />}
              {!åpen && <Ikon navn="fly" størrelse={9} x={x - 4.5} y={y - 4.5} />}
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
                {by}
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
          ? `Kjøp et fly under Luksus for å reise ut. ${NESTE_STEG[0]}`
          : nivaa < FLY_REKKEFOLGE.length
            ? `${LUKSUS[FLY_REKKEFOLGE[nivaa - 1]].navn} tar deg til byene på kartet. ${NESTE_STEG[nivaa]}`
            : 'Langdistansejeten tar deg hvor som helst.'}
      </figcaption>
    </figure>
  )
}
