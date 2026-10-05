import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Spilltilstand } from '../../engine/types'
import { fortegnKroner, kortKroner, tall } from '../format'
import { verdimerker } from '../grafakser'
import { KILDER, kolonner, summer, type Kolonne, type KildeId, type Statistikkperiode } from '../statistikk'

/** `maksNavn`: så mange navn får plass langs bunnen — «16. jan» er bredere enn «jan». */
const PERIODER: { id: Statistikkperiode; navn: string; tom: string; maksNavn: number }[] = [
  { id: 'dag', navn: 'Dager', tom: 'Dagene telles fra neste dagsskifte.', maksNavn: 5 },
  { id: 'uke', navn: 'Uker', tom: 'Ukene telles fra søndag.', maksNavn: 6 },
  { id: 'maaned', navn: 'Måneder', tom: 'Månedene telles fra den 1.', maksNavn: 7 },
]

const pst = (andel: number) => `${andel * 100}%`

/** Andelen av det som kom inn, i hele prosent — men aldri «0 %» for noe som faktisk ga penger. */
function andel(v: number, brutto: number): string {
  if (v <= 0 || brutto <= 0) return '–'
  const p = (v / brutto) * 100
  return p < 0.5 ? '< 1 %' : `${tall(p)} %`
}

/**
 * Statistikk på Profil: inntekten per kilde som stablede søyler, med en
 * tabell under som også er forklaringen — og det samme for hele spillet.
 */
export function Statistikk({ s }: { s: Spilltilstand }) {
  const [periode, settPeriode] = useState<Statistikkperiode>('dag')
  const k = kolonner(s, periode)
  const valgt = PERIODER.find((p) => p.id === periode)!
  return (
    <>
      <div className="kort kildestatistikk">
        <h2 className="kort-tittel">Inntekt per kilde</h2>
        <div className="segment" role="tablist" aria-label="Periode">
          {PERIODER.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === periode} className={p.id === periode ? 'aktiv' : ''} onClick={() => settPeriode(p.id)}>
              {p.navn}
            </button>
          ))}
        </div>
        {k.length === 0 ? <p className="graf-tom">{valgt.tom}</p> : <Stabelgraf kolonner={k} maksNavn={valgt.maksNavn} />}
        <Kildetabell sum={summer(k)} />
      </div>
      <SidenStart s={s} />
    </>
  )
}

function Stabelgraf({ kolonner: k, maksNavn }: { kolonner: Kolonne[]; maksNavn: number }) {
  const [valgt, settValgt] = useState<number | null>(null)
  const pluss = k.map((kol) => KILDER.reduce((sum, x) => sum + Math.max(0, kol.verdier[x.id]), 0))
  const minus = k.map((kol) => KILDER.reduce((sum, x) => sum + Math.min(0, kol.verdier[x.id]), 0))
  const maks = Math.max(...pluss)
  const min = Math.min(...minus)
  if (maks - min < 1) return <p className="graf-tom">Ingen inntekt i denne perioden ennå.</p>

  const topp = maks + (maks - min) * 0.08
  const bunn = min < 0 ? min - (maks - min) * 0.08 : 0
  const y = (v: number) => (topp - v) / (topp - bunn)
  const rutenett = verdimerker(bunn, topp).filter((v) => y(v) > 0.06 && y(v) <= 1)
  const n = k.length
  // Ikke flere navn enn det er plass til; den siste søylen (perioden som pågår) har alltid navn.
  const hvert = Math.ceil(n / maksNavn)

  const velg = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    settValgt(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))))
  }
  const vedTast = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const fra = valgt ?? n - 1
      settValgt(Math.min(n - 1, Math.max(0, fra + (e.key === 'ArrowRight' ? 1 : -1))))
    } else if (e.key === 'Escape') settValgt(null)
  }
  const kol = valgt === null ? null : k[valgt]

  return (
    <figure className="graf stabelgraf">
      <div className="graf-akse-y" aria-hidden="true">
        {rutenett.map((v) => (
          <span key={v} style={{ top: pst(y(v)) }}>
            {kortKroner(v)}
          </span>
        ))}
      </div>
      <div
        className="graf-flate stabel-flate"
        tabIndex={0}
        role="img"
        aria-label="Inntekt per kilde som stablede søyler. Bruk piltastene for å lese av en periode; tabellen under har summene."
        onPointerDown={velg}
        onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && velg(e)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && settValgt(null)}
        onKeyDown={vedTast}
        onBlur={() => settValgt(null)}
      >
        {rutenett.map((v) => (
          <span key={v} className={v === 0 ? 'stabel-null' : 'stabel-linje'} style={{ top: pst(y(v)) }} />
        ))}
        {bunn < 0 && !rutenett.includes(0) && <span className="stabel-null" style={{ top: pst(y(0)) }} />}
        {k.map((kol, i) => {
          let opp = 0
          let ned = 0
          const øverst = KILDER.filter((x) => kol.verdier[x.id] > 0).at(-1)?.id
          const nederst = KILDER.filter((x) => kol.verdier[x.id] < 0).at(-1)?.id
          return (
            <div
              key={i}
              className={`stabel-kolonne${kol.paagaar ? ' paagaar' : ''}${valgt === i ? ' valgt' : ''}`}
              style={{ left: pst(i / n), width: pst(1 / n) }}
            >
              {KILDER.map((x) => {
                const v = kol.verdier[x.id]
                if (Math.abs(v) < 1e-9) return null
                const fra = v > 0 ? opp : ned
                const til = fra + v
                if (v > 0) opp = til
                else ned = til
                const klasse = x.id === øverst ? ' topp' : x.id === nederst ? ' bunn' : ''
                return (
                  <span
                    key={x.id}
                    className={`stabel-del${klasse}`}
                    style={{ top: pst(y(Math.max(fra, til))), height: pst(Math.abs(v) / (topp - bunn)), background: x.farge }}
                  />
                )
              })}
            </div>
          )
        })}
        {kol && (
          <div className="graf-boble stabel-boble" style={{ left: `${Math.min(75, Math.max(25, ((valgt! + 0.5) / n) * 100))}%` }} role="status">
            <strong>{kol.tittel}</strong>
            {KILDER.filter((x) => Math.abs(kol.verdier[x.id]) >= 1).map((x) => (
              <span key={x.id} className="stabel-boble-rad">
                <i style={{ background: x.farge }} />
                {x.navn}
                <b>{fortegnKroner(kol.verdier[x.id])}</b>
              </span>
            ))}
            <span className="stabel-boble-rad sum">
              Sum<b>{fortegnKroner(KILDER.reduce((sum, x) => sum + kol.verdier[x.id], 0))}</b>
            </span>
          </div>
        )}
      </div>
      <figcaption className="graf-akse-x" aria-hidden="true">
        {k.map((kol, i) =>
          (n - 1 - i) % hvert === 0 ? (
            <span key={i} className={(i + 0.5) / n < 0.07 ? 'venstre' : ''} style={{ left: pst((i + 0.5) / n < 0.07 ? 0 : (i + 0.5) / n) }}>
              {kol.navn}
            </span>
          ) : null,
        )}
      </figcaption>
    </figure>
  )
}

/** Tabellen under grafen: hver kilde med farge, sum og andel. Den er også forklaringen til fargene. */
function Kildetabell({ sum }: { sum: Record<KildeId, number> }) {
  const total = KILDER.reduce((t, x) => t + sum[x.id], 0)
  // Andelen er av det som kom inn; et tap har ingen andel.
  const brutto = KILDER.reduce((t, x) => t + Math.max(0, sum[x.id]), 0)
  const rader = KILDER.filter((x) => Math.abs(sum[x.id]) >= 1)
  if (rader.length === 0) return null
  return (
    <table className="kildetabell">
      <thead>
        <tr>
          <th scope="col">Kilde</th>
          <th scope="col">Sum</th>
          <th scope="col">Andel</th>
        </tr>
      </thead>
      <tbody>
        {rader.map((x) => (
          <tr key={x.id}>
            <th scope="row">
              <i className="kilde-farge" style={{ background: x.farge }} aria-hidden="true" />
              {x.navn}
            </th>
            <td className={sum[x.id] < 0 ? 'minus' : ''}>{fortegnKroner(sum[x.id])}</td>
            <td className="dempet">{andel(sum[x.id], brutto)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Til sammen</th>
          <td className={total < 0 ? 'minus' : ''}>{fortegnKroner(total)}</td>
          <td />
        </tr>
      </tfoot>
    </table>
  )
}

/** Alt spillet har gitt og kostet siden start, med en søyle for hver inntektskilde. */
function SidenStart({ s }: { s: Spilltilstand }) {
  const inn: Record<KildeId, number> = {
    bedrifter: s.totaltTjent,
    leie: s.totaltLeie - (s.totaltHost ?? 0),
    host: s.totaltHost ?? 0,
    utbytte: s.totaltUtbytte,
    sparerente: s.totaltSparerente,
    gevinster: s.totaltGevinst ?? 0,
    klubb: s.totaltKlubb ?? 0,
  }
  const ut: [string, number][] = [
    ['Lånerenter', s.totaltRentebetalt],
    ['Luksus, lager og ansettelser', s.totaltForbruk],
    ['Skatt', s.skatt.totaltBetalt],
  ]
  const størst = Math.max(1, ...KILDER.map((x) => Math.abs(inn[x.id])))
  const sumInn = KILDER.reduce((t, x) => t + inn[x.id], 0)
  const sumUt = ut.reduce((t, [, v]) => t + v, 0)
  return (
    <div className="kort siden-start">
      <h2 className="kort-tittel">Siden start</h2>
      <ul className="kildesoyler">
        {KILDER.filter((x) => Math.abs(inn[x.id]) >= 1).map((x) => (
          <li key={x.id}>
            <span className="kildesoyle-navn">{x.navn}</span>
            <span className={inn[x.id] < 0 ? 'minus' : ''}>{fortegnKroner(inn[x.id])}</span>
            <span className="kildesoyle" aria-hidden="true">
              <i style={{ width: pst(Math.abs(inn[x.id]) / størst), background: x.farge }} />
            </span>
          </li>
        ))}
      </ul>
      <dl className="oppgjor-tall">
        {ut
          .filter(([, v]) => v >= 1)
          .map(([navn, v]) => (
            <div key={navn}>
              <dt>{navn}</dt>
              <dd className="minus">{fortegnKroner(-v)}</dd>
            </div>
          ))}
        <div className="sum">
          <dt>Inn minus ut</dt>
          <dd className={sumInn - sumUt >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(sumInn - sumUt)}</dd>
        </div>
      </dl>
    </div>
  )
}
