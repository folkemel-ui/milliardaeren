import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import { JORD, JORDLISTE } from '../../engine/jord'
import { memo, useId, useMemo, useRef } from 'react'
import type { By, NorskBy, Spilltilstand } from '../../engine/types'
import { eierHeleByen, kartLeie, leieIBy, trendFor, trendRing, useKlyp, useLangtrykk } from '../kart'
import { perSek } from '../format'
import { BYLISTE, BYPLAN, byPunkt, etiketter, hovedpunkt, KYSTRUTA, INNFELT, innfeltpunkt, KARTNAVN, KUN_JORD, merkeboks, navnestorrelse, radius, VISNING } from '../norgeskartet'
import { FJELL_NORD, FJELL_SOR, INNSJOER_SOR, NABOLAND_NORD, NABOLAND_SOR, NORGE_NORD, NORGE_SOR, type Ring } from '../kartdata'
import { morke } from '../dagognatt'
import { Reisende, Skipsymbol, usePuls } from './Bevegelse'
import { Bykort } from './Bykort'
import { Kartmerke } from './Kartmerke'

/*
 * Norgeskartet (Grafikkpakke G3): et rolig atlas med ekte kystlinjer fra
 * Natural Earth. Havet, Sverige og Danmark i dempede toner, Norge i varm
 * stein med myke fjellskygger, og et innfelt med Nord-Norge og Lofoten
 * nederst til høyre. Fargene følger temaet (--kart-* i styles.css).
 * Geometrien (projeksjon, sider for navnene, merkene) står i norgeskartet.ts,
 * der en test sjekker at ingenting overlapper.
 *
 * Kartet viser bare prikk, antall og navn, og en liten pil for prisene i
 * regionen. Leien står ved byen du har valgt.
 */

/** Ringene som én SVG-sti, med en gitt projeksjon. */
function sti(ringer: Ring[], p: (q: [number, number]) => [number, number]): string {
  return ringer
    .map((r) => {
      let d = ''
      for (let i = 0; i < r.length; i += 2) {
        const [x, y] = p([r[i], r[i + 1]])
        d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
      }
      return d + 'Z'
    })
    .join('')
}

const KYSTSTI = 'M' + KYSTRUTA.map((p) => hovedpunkt(p).map((v) => v.toFixed(1)).join(',')).join(' L')

/** De faste delene av kartet: land, hav, fjell og innfelt. Tegnes én gang, ikke hvert sekund. */
const Kartbunn = memo(function Kartbunn({ id }: { id: string }) {
  const stier = useMemo(
    () => ({
      norge: sti(NORGE_SOR, hovedpunkt),
      naboland: sti(NABOLAND_SOR, hovedpunkt),
      sjoer: sti(INNSJOER_SOR, hovedpunkt),
      norgeNord: sti(NORGE_NORD, innfeltpunkt),
      nabolandNord: sti(NABOLAND_NORD, innfeltpunkt),
      fjell: sti(FJELL_SOR, hovedpunkt),
      fjellNord: sti(FJELL_NORD, innfeltpunkt),
    }),
    [],
  )
  // Fjellene (Kjølen og Hardangervidda) som myk relieff: et lyst drag mot nordvest og
  // skygge mot sørøst, uskarpt, og bare innenfor Norge.
  const fjell = (d: string, k: number) => (
    <>
      <path d={d} transform={`translate(${-2 * k} ${-2.4 * k})`} className="kart-fjell-lys" filter={`url(#${id}-myk${k < 1 ? '-nord' : ''})`} />
      <path d={d} transform={`translate(${2.4 * k} ${3 * k})`} className="kart-fjell" filter={`url(#${id}-myk${k < 1 ? '-nord' : ''})`} />
    </>
  )
  const [nx, ny] = [INNFELT.x, INNFELT.y]
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glod`}>
          <stop offset="0" stopColor="#ffd970" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd970" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-myk`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-myk-nord`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <clipPath id={`${id}-norge`}>
          <path d={stier.norge} />
        </clipPath>
        <clipPath id={`${id}-nord`}>
          <rect x={nx} y={ny} width={INNFELT.bredde} height={INNFELT.hoyde} rx="6" />
        </clipPath>
        <clipPath id={`${id}-norge-nord`}>
          <path d={stier.norgeNord} />
        </clipPath>
      </defs>
      <rect x={VISNING.x} y={VISNING.y} width={VISNING.bredde} height={VISNING.hoyde} rx="10" className="kart-hav" />
      {/* Breddegradene, svakt, som på et atlas. */}
      {[58, 60, 62, 64].map((b) => {
        const y = hovedpunkt([0, b])[1]
        return <line key={b} x1={VISNING.x} y1={y} x2={VISNING.x + VISNING.bredde} y2={y} className="kart-nett" />
      })}
      {[0, 5, 10, 15].map((l) => {
        const x = hovedpunkt([l, 0])[0]
        return <line key={l} x1={x} y1={VISNING.y} x2={x} y2={VISNING.y + VISNING.hoyde} className="kart-nett" />
      })}
      <path d={stier.naboland} className="kart-naboland" />
      <path d={stier.norge} className="kart-land" />
      <g clipPath={`url(#${id}-norge)`}>{fjell(stier.fjell, 1)}</g>
      <path d={stier.sjoer} className="kart-innsjo" />
      {KARTNAVN.map((k) => {
        const [x, y] = hovedpunkt(k.pos)
        return (
          <text key={k.navn} x={x} y={y} textAnchor="middle" className={k.hav ? 'kart-havnavn' : 'kart-landnavn'} style={{ fontSize: k.hav ? 7.5 : 7 }}>
            {k.navn}
          </text>
        )
      })}
      {/* Innfeltet: Nord-Norge fra Trondheim til Nordkapp, med Lofoten. */}
      <g className="kart-innfelt" aria-hidden="true">
        <rect x={nx} y={ny} width={INNFELT.bredde} height={INNFELT.hoyde} rx="6" className="kart-hav" />
        <g clipPath={`url(#${id}-nord)`}>
          <path d={stier.nabolandNord} className="kart-naboland" />
          <path d={stier.norgeNord} className="kart-land" />
          <g clipPath={`url(#${id}-norge-nord)`}>{fjell(stier.fjellNord, 0.4)}</g>
        </g>
        <rect x={nx} y={ny} width={INNFELT.bredde} height={INNFELT.hoyde} rx="6" className="kart-innfelt-ramme" />
        <text x={nx + 6} y={ny + 11} className="kart-havnavn" style={{ fontSize: 7 }}>
          Nord-Norge
        </text>
      </g>
    </>
  )
})

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
  const id = 'kart' + useId().replace(/[^a-zA-Z0-9]/g, '')
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

  const natt = morke(s.sek)
  const valgtNorsk = valgt && (BYLISTE as By[]).includes(valgt) ? (valgt as NorskBy) : null
  const [vx, vy] = valgtNorsk ? byPunkt(valgtNorsk) : [0, 0]

  return (
    <div className="kart-ramme norgeskart-ramme">
      <svg
        ref={svg}
        className="norgeskart kart-natt"
        style={{ ['--natt' as string]: natt.toFixed(3) }}
        viewBox={`${VISNING.x} ${VISNING.y} ${VISNING.bredde} ${VISNING.hoyde}`}
        role="group"
        aria-label="Kart over eiendommene dine"
        {...klyp}
      >
        <Kartbunn id={id} />
        <Reisende d={KYSTSTI} periode={42_000} snu="speil">
          <Skipsymbol />
        </Reisende>
        {BYLISTE.map((by) => (
          <Byen key={by} s={s} by={by} n={antall[by] ?? 0} valgt={valgt === by} velg={velg} lang={lang} natt={natt} glod={`${id}-glod`} />
        ))}
      </svg>
      {valgtNorsk && <Bykort s={s} by={valgtNorsk} x={(vx - VISNING.x) / VISNING.bredde} y={(vy - VISNING.y) / VISNING.hoyde} lukk={() => velg(null)} />}
    </div>
  )
}

function Byen({
  s,
  by,
  n,
  valgt,
  velg,
  lang,
  natt,
  glod,
}: {
  s: Spilltilstand
  by: NorskBy
  n: number
  valgt: boolean
  velg: (by: By | null) => void
  lang: ReturnType<typeof useLangtrykk>
  /** Hvor mørkt det er på kartet, 0–1. Byene du eier, lyser om kvelden. */
  natt: number
  glod: string
}) {
  const [x, y] = byPunkt(by)
  const eid = n > 0
  const hel = eierHeleByen(s, by)
  const puls = usePuls(n)
  const r = radius(by, eid)
  const trend = trendRing(trendFor(s, by))
  const leie = leieIBy(s, by)
  // Stedene med bare jord har ikke navn på kartet før du eier noe der eller velger dem.
  const visNavn = !KUN_JORD.has(by) || eid || valgt
  const { navn, leie: leiepos } = etiketter(by, r, valgt && leie > 0 ? kartLeie(leie) : null)
  return (
    <g
      className={`kart-by${eid ? ' eid' : ''}${hel ? ' hel' : ''}${valgt ? ' valgt' : ''}${KUN_JORD.has(by) ? ' jord' : ''}${BYPLAN[by].innfelt ? ' i-innfelt' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${by}: ${n} ${n === 1 ? 'eiendom' : 'eiendommer'}${hel ? ', du eier hele byen' : ''}${leie > 0 ? `, leie ${perSek(leie)}` : ''}${valgt ? ', valgt' : ''}. Hold inne for gatebildet.`}
      onClick={() => !lang.varLangt() && velg(valgt ? null : by)}
      onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && velg(valgt ? null : by)}
      {...lang.hendelser(by)}
    >
      {/* Større, usynlig treffflate så byene er lette å treffe med fingeren. */}
      <circle cx={x} cy={y} r={14} className="kart-treff" />
      {valgt && <circle cx={x} cy={y} r={r + 2.6} className="kart-valgt" />}
      <Kartmerke x={x} y={y} r={r} n={n} hel={hel} natt={natt} puls={puls} glod={glod} merke={eid ? merkeboks(by, r, String(n).length, hel) : null} />
      {visNavn && (
        <text x={navn.x} y={navn.y} textAnchor={navn.anker} className="kart-navn" style={{ fontSize: navnestorrelse(by) }}>
          {by}
          {/* Prisene i regionen: en liten pil rett etter navnet. */}
          {trend && (
            <tspan className={`kart-trendpil ${trend.klasse}`} dx="1.6" style={{ fontSize: navnestorrelse(by) * 0.6, opacity: trend.styrke }}>
              {trend.klasse === 'opp' ? '▲' : '▼'}
            </tspan>
          )}
        </text>
      )}
      {leiepos && (
        <text x={leiepos.x} y={leiepos.y} textAnchor={leiepos.anker} className="kart-leie">
          {kartLeie(leie)}
        </text>
      )}
    </g>
  )
}
