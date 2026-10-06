import { useId, useMemo } from 'react'
import { EIENDOMSSTIGEN, EIENDOMSTYPER, FLY_REKKEFOLGE, LUKSUS, reiseNivaa } from '../../engine/eiendom'
import type { By, Spilltilstand, Utenlandsby } from '../../engine/types'
import { kartLeie, leieIBy, useLangtrykk, eierHeleByen } from '../kart'
import { BREDDE, BYPLASS, byPunkt, HOYDE, INNFELT, LAND, merkeboksVerden, NORGE, OSLO_POS, projeksjon, sti, utsnittFor } from '../verdenskartet'
import { morke } from '../dagognatt'
import { Ikon } from './Ikoner'
import { Flysymbol, Reisende, usePuls } from './Bevegelse'
import { Bykort } from './Bykort'
import { Kartmerke } from './Kartmerke'

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
 * om kvelden, og byene du eier, lyser. Samme atlas som Norgeskartet (G3):
 * dempet hav, Norge i varm stein, de andre landene flatt grått, og de samme
 * rolige markørene. Geometrien står i ui/verdenskartet.ts.
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
  const id = 'verden' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const p = useMemo(() => projeksjon(utsnittFor(nivaa)), [nivaa])
  const land = useMemo(() => ({ andre: LAND.map((l) => sti(l, p)).join(' '), norge: NORGE.map((l) => sti(l, p)).join(' ') }), [p])
  // Gradnettet: hver tiende grad, som på et atlas.
  const nett = useMemo(
    () => ({
      bredde: [30, 40, 50, 60, 70].map((b) => p([0, b])[1]),
      lengde: [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60].map((l) => p([l, 60])[0]),
    }),
    [p],
  )
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
            <radialGradient id={`${id}-glod`}>
              <stop offset="0" stopColor="#ffd970" stopOpacity="0.95" />
              <stop offset="1" stopColor="#ffd970" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={BREDDE} height={HOYDE} rx="8" className="kart-hav" />
          {nett.bredde.map((y) => (
            <line key={`b${y}`} x1="0" y1={y} x2={BREDDE} y2={y} className="kart-nett" />
          ))}
          {nett.lengde.map((x) => (
            <line key={`l${x}`} x1={x} y1="0" x2={x} y2={HOYDE} className="kart-nett" />
          ))}
          <path d={land.andre} className="kart-naboland" />
          <path d={land.norge} className="kart-land" />
          {nivaa >= 3 &&
            (Object.keys(INNFELT) as (keyof typeof INNFELT)[]).map((by) => {
              const i = INNFELT[by]
              const ip = projeksjon(i.utsnitt, i)
              return (
                <g key={by} className="kart-innfelt" aria-hidden="true">
                  <rect x={i.x} y={i.y} width={i.bredde} height={i.hoyde} rx="5" className="kart-hav" />
                  <clipPath id={`${id}-${by.replace(' ', '')}`}>
                    <rect x={i.x} y={i.y} width={i.bredde} height={i.hoyde} rx="5" />
                  </clipPath>
                  <g clipPath={`url(#${id}-${by.replace(' ', '')})`}>
                    <path d={i.land.map((l) => sti(l, ip)).join(' ')} className="kart-naboland" />
                  </g>
                  <rect x={i.x} y={i.y} width={i.bredde} height={i.hoyde} rx="5" className="kart-innfelt-ramme" />
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
            <circle cx={oslo[0]} cy={oslo[1]} r={3.2} className="kart-prikk" />
            <text x={oslo[0] - 6} y={oslo[1] + 3.5} textAnchor="end" className="kart-navn">
              Oslo
            </text>
          </g>
          {synlige.map(({ by, pos: [x, y] }) => (
            <Verdensby key={by} s={s} by={by} x={x} y={y} nivaa={nivaa} natt={natt} valgt={valgt === by} velg={velg} lang={lang} glod={`${id}-glod`} />
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

/** Én by på verdenskartet: prikk, antall i merket, navn, og leien når byen er valgt — lys om kvelden og en ring når du kjøper. */
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
  glod,
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
  glod: string
}) {
  const n = antallI(s, by)
  const puls = usePuls(n)
  const åpen = nivaa >= reiseTil(by)
  const hel = åpen && eierHeleByen(s, by)
  const r = n > 0 ? 3.2 : 2.6
  const e = BYPLASS[by].etikett
  const fly = LUKSUS[FLY_REKKEFOLGE[reiseTil(by) - 1]]
  const leie = leieIBy(s, by)
  return (
    <g
      className={`kart-by${n > 0 ? ' eid' : ''}${hel ? ' hel' : ''}${valgt ? ' valgt' : ''}${åpen ? '' : ' stengt'}`}
      role="button"
      tabIndex={0}
      aria-label={`${by}: ${åpen ? `${n} ${n === 1 ? 'eiendom' : 'eiendommer'}` : `krever ${fly.navn.toLowerCase()}`}${valgt ? ', valgt' : ''}`}
      onClick={() => !lang.varLangt() && velg(valgt ? null : by)}
      onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt ? null : by)}
      {...lang.hendelser(by)}
    >
      <circle cx={x} cy={y} r={16} className="kart-treff" />
      {valgt && <circle cx={x} cy={y} r={r + 2.6} className="kart-valgt" />}
      {åpen ? (
        <Kartmerke x={x} y={y} r={r} n={n} hel={hel} natt={natt} puls={puls} glod={glod} merke={n > 0 ? merkeboksVerden(x, y, r, String(n).length, hel, e) : null} />
      ) : (
        <Ikon navn="fly" størrelse={8} x={x - 4} y={y - 4} />
      )}
      <text
        x={e === 'høyre' ? x + r + 3.5 : e === 'venstre' ? x - r - 3.5 : x}
        y={e === 'under' ? y + r + 10.5 : y + 3.5}
        textAnchor={e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'}
        className="kart-navn"
      >
        {by}
      </text>
      {valgt && leie > 0 && (
        <text
          x={e === 'høyre' ? x + r + 3.5 : e === 'venstre' ? x - r - 3.5 : x}
          y={e === 'under' ? y + r + 19 : y + 12}
          textAnchor={e === 'høyre' ? 'start' : e === 'venstre' ? 'end' : 'middle'}
          className="kart-leie"
        >
          {kartLeie(leie)}
        </text>
      )}
    </g>
  )
}
