import { useMemo } from 'react'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, FLY_REKKEFOLGE, LUKSUS, reiseNivaa } from '../../engine/eiendom'
import type { By, Spilltilstand, Utenlandsby } from '../../engine/types'
import { kartLeie, leieIBy, useLangtrykk, eierHeleByen, kronesti } from '../kart'
import { BREDDE, BYPLASS, byPunkt, HOYDE, INNFELT, LAND, OSLO_POS, projeksjon, sti, utsnittFor } from '../verdenskartet'
import { morke } from '../dagognatt'
import { Ikon } from './Ikoner'
import { Flysymbol, Reisende, usePuls } from './Bevegelse'
import { Bykort } from './Bykort'

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
 * Verdenskartet (Pakke 45–46): et ekte kart med kystlinjer som vokser med
 * flyene dine — Norden med propellflyet, Europa med forretningsjeten, og med
 * langdistansejeten to innfelte ruter for New York og Dubai. Buene er
 * flyrutene fra Oslo, og et fly går på hver rute du kan fly. Kartet mørkner
 * om kvelden, og byene du eier, lyser. Geometrien står i ui/verdenskartet.ts.
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
  const natt = morke(s.sek)
  const valgtPlass = synlige.find((x) => x.by === valgt && nivaa >= reiseTil(x.by))

  return (
    <figure className="verdenskart-ramme">
      <div className="kart-ramme">
        <svg className="verdenskart kart-natt" style={{ ['--natt' as string]: natt.toFixed(3) }} viewBox={`0 0 ${BREDDE} ${HOYDE}`} role="group" aria-label="Kart over byene du kan fly til">
          <defs>
            <radialGradient id="verden-lysglod">
              <stop offset="0" stopColor="#ffd970" stopOpacity="0.95" />
              <stop offset="1" stopColor="#ffd970" stopOpacity="0" />
            </radialGradient>
          </defs>
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
          {/* Et fly på hver rute du kan fly, i hver sin takt. */}
          {synlige
            .filter(({ by }) => nivaa >= reiseTil(by))
            .map(({ by, pos }, i) => (
              <Reisende key={by} d={bue(oslo, pos)} periode={7_000 + Math.hypot(pos[0] - oslo[0], pos[1] - oslo[1]) * 60} forsinkelse={i * 2_300}>
                <Flysymbol storrelse={1.35} />
              </Reisende>
            ))}
          <g className="kart-by eid hjem">
            <circle cx={oslo[0]} cy={oslo[1]} r={4.5} className="kart-prikk" />
            <text x={oslo[0] - 7} y={oslo[1] + 3.5} textAnchor="end" className="kart-navn">
              Oslo
            </text>
          </g>
          {synlige.map(({ by, pos: [x, y] }) => (
            <Verdensby key={by} s={s} by={by} x={x} y={y} nivaa={nivaa} natt={natt} valgt={valgt === by} velg={velg} lang={lang} />
          ))}
        </svg>
        {valgtPlass && <Bykort s={s} by={valgtPlass.by} x={valgtPlass.pos[0] / BREDDE} y={valgtPlass.pos[1] / HOYDE} lukk={() => velg(null)} />}
      </div>
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

/** Én by på verdenskartet: prikk, antall, navn og leie — lys om kvelden og en ring når du kjøper. */
function Verdensby({
  s,
  by,
  x,
  y,
  nivaa,
  natt,
  valgt,
  velg,
  lang,
}: {
  s: Spilltilstand
  by: Utenlandsby
  x: number
  y: number
  nivaa: number
  natt: number
  valgt: boolean
  velg: (by: By | null) => void
  lang: ReturnType<typeof useLangtrykk>
}) {
  const n = antallI(s, by)
  const puls = usePuls(n)
  const åpen = nivaa >= reiseTil(by)
  const r = n > 0 ? Math.min(11, 5 + n * 1.2) : 4
  const e = BYPLASS[by].etikett
  const fly = LUKSUS[FLY_REKKEFOLGE[reiseTil(by) - 1]]
  const leie = leieIBy(s, by)
  return (
    <g
      className={`kart-by${n > 0 ? ' eid' : ''}${valgt ? ' valgt' : ''}${åpen ? '' : ' stengt'}`}
      role="button"
      tabIndex={0}
      aria-label={`${by}: ${åpen ? `${n} ${n === 1 ? 'eiendom' : 'eiendommer'}` : `krever ${fly.navn.toLowerCase()}`}${valgt ? ', valgt' : ''}`}
      onClick={() => !lang.varLangt() && velg(valgt ? null : by)}
      onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt ? null : by)}
      {...lang.hendelser(by)}
    >
      <circle cx={x} cy={y} r={16} className="kart-treff" />
      {n > 0 && natt > 0 && <circle cx={x} cy={y} r={r + 11} fill="url(#verden-lysglod)" className="kart-lys" style={{ opacity: natt }} />}
      {puls > 0 && <circle key={puls} cx={x} cy={y} r={r + 2} className="kart-puls" />}
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
      {leie > 0 && (
        <text
          x={e === 'høyre' ? x + r + 4 : e === 'venstre' ? x - r - 4 : x}
          y={e === 'under' ? y + r + 21 : y + 14}
          textAnchor={e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'}
          className="kart-leie"
        >
          {kartLeie(leie)}
        </text>
      )}
    </g>
  )
}
