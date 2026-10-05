import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { DAG_SEK } from '../../engine/kalender'
import { tidsmerker, tidspunkt, verdimerker } from '../grafakser'

const B = 320
const H = 140

/** Punktet nærmest et tidspunkt. Punktene er sortert i tid. */
function nærmeste(punkter: { sek: number }[], sek: number): number {
  let lav = 0
  let høy = punkter.length - 1
  while (høy - lav > 1) {
    const midt = (lav + høy) >> 1
    if (punkter[midt].sek <= sek) lav = midt
    else høy = midt
  }
  return sek - punkter[lav].sek <= punkter[høy].sek - sek ? lav : høy
}

/** Plassering langs en akse i prosent, så HTML-etikettene kan ligge over den strukne grafen. */
const pst = (n: number, av: number) => `${(n / av) * 100}%`

/**
 * Linjegraf over tid, som en finansgraf: rutenett på runde verdier med
 * etikettene i egen kolonne, dato eller klokkeslett langs bunnen, og verdien
 * ved start og nå i hver ende av linja. Punktene må være sortert i tid; siste
 * punkt regnes som «nå». Dra over grafen (eller hold musa over, eller bruk
 * piltastene) for å lese av verdien på et tidspunkt.
 */
export function Linjegraf({
  punkter,
  format,
  farge = 'var(--gull)',
  etikett,
  merker = [],
}: {
  punkter: { sek: number; verdi: number }[]
  format: (n: number) => string
  farge?: string
  etikett: string
  /** Handler som vises som prikker: grønne kjøp, røde salg. Utenfor tidsvinduet vises de ikke. */
  merker?: { sek: number; verdi: number; kjop: boolean }[]
}) {
  const id = useId()
  // Hvor langt inn i grafen du leser av (0–1), eller null. En andel, ikke et
  // punkt, så siktet står stille mens grafen fylles på hvert sekund.
  const [andel, settAndel] = useState<number | null>(null)
  if (punkter.length < 2) {
    return <p className="graf-tom">Grafen fylles ut etter hvert som tiden går.</p>
  }

  const førsteSek = punkter[0].sek
  const sisteSek = punkter[punkter.length - 1].sek
  const spenn = Math.max(1, sisteSek - førsteSek)
  let min = Math.min(...punkter.map((p) => p.verdi))
  let maks = Math.max(...punkter.map((p) => p.verdi))
  // En flat linje får ±10 % luft rundt seg, så aksene viser noe meningsfylt.
  if (maks - min < Math.abs(maks) * 1e-6 + 1e-9) {
    const luft = Math.abs(maks) * 0.1 || 1
    maks += luft
    min -= luft
  }
  const luft = (maks - min) * 0.12
  const bunn = min - luft
  const topp = maks + luft

  const x = (sek: number) => ((sek - førsteSek) / spenn) * B
  const y = (v: number) => H - ((v - bunn) / (topp - bunn)) * H
  const linje = punkter.map((p) => `${x(p.sek).toFixed(1)},${y(p.verdi).toFixed(1)}`).join(' ')
  const flate = `0,${H} ${linje} ${B},${H}`
  const synlige = merker.filter((m) => m.sek >= førsteSek && m.sek <= sisteSek)
  // Rutenettet: runde verdier, men ikke helt i kanten der etiketten ville blitt kuttet.
  const rutenett = verdimerker(bunn, topp).filter((v) => y(v) > H * 0.06 && y(v) < H * 0.94)
  const tider = tidsmerker(førsteSek, sisteSek)
  const medKlokke = spenn <= DAG_SEK * 3

  const første = punkter[0]
  const siste = punkter[punkter.length - 1]
  const valgt = andel === null ? null : punkter[nærmeste(punkter, førsteSek + andel * spenn)]
  const lesAv = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    settAndel(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
  }
  const vedTast = (e: KeyboardEvent<HTMLDivElement>) => {
    const steg = 1 / (punkter.length - 1)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const fra = andel ?? 1
      settAndel(Math.min(1, Math.max(0, fra + (e.key === 'ArrowRight' ? steg : -steg))))
    } else if (e.key === 'Escape') settAndel(null)
  }
  // Endeetiketten legger seg over punktet, eller under når punktet er helt øverst.
  const endeKlasse = (v: number) => (y(v) < H * 0.3 ? 'under' : 'over')

  return (
    <figure className="graf">
      <div className="graf-akse-y" aria-hidden="true">
        {rutenett.map((v) => (
          <span key={v} style={{ top: pst(y(v), H) }}>
            {format(v)}
          </span>
        ))}
      </div>
      <div
        className="graf-flate"
        tabIndex={0}
        aria-label={`${etikett}: ${format(første.verdi)} ved start, ${format(siste.verdi)} nå. Bruk piltastene for å lese av verdier.`}
        onPointerDown={(e) => {
          lesAv(e)
          try {
            // Fingeren kan gli utenfor grafen uten at avlesningen slipper.
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* ikke en ekte peker — avlesningen virker likevel */
          }
        }}
        onPointerMove={(e) => {
          // Musa leser av bare ved å sveve; en finger må trykke først.
          if (e.pointerType === 'mouse' || e.buttons) lesAv(e)
        }}
        onPointerUp={(e) => e.pointerType !== 'mouse' && settAndel(null)}
        onPointerCancel={() => settAndel(null)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && settAndel(null)}
        onKeyDown={vedTast}
        onBlur={() => settAndel(null)}
      >
        <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" role="img" aria-label={etikett}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={farge} stopOpacity="0.3" />
              <stop offset="1" stopColor={farge} stopOpacity="0" />
            </linearGradient>
          </defs>
          {rutenett.map((v) => (
            <line key={v} x1="0" y1={y(v)} x2={B} y2={y(v)} className="graf-rutenett" />
          ))}
          {tider.map((t) => (
            <line key={t.sek} x1={x(t.sek)} y1={H - 4} x2={x(t.sek)} y2={H} className="graf-strek" />
          ))}
          <polygon points={flate} fill={`url(#${CSS.escape(id)})`} />
          <polyline points={linje} fill="none" className="graf-linje" style={{ stroke: farge }} />
        </svg>
        {/* Prikkene er HTML over grafen, så de forblir runde når grafen strekkes. */}
        {synlige.map((m, i) => (
          <span
            key={i}
            className={m.kjop ? 'graf-merke kjop' : 'graf-merke salg'}
            style={{ left: pst(x(m.sek), B), top: pst(y(m.verdi), H) }}
            title={`${m.kjop ? 'Kjøpt' : 'Solgt'} til ${format(m.verdi)}`}
          />
        ))}
        {!valgt && (
          <>
            <span className={`graf-ende start ${endeKlasse(første.verdi)}`} style={{ top: pst(y(første.verdi), H) }} aria-hidden="true">
              {format(første.verdi)}
            </span>
            <span className="graf-endepunkt" style={{ left: '100%', top: pst(y(siste.verdi), H), background: farge }} aria-hidden="true" />
            <span className={`graf-ende naa ${endeKlasse(siste.verdi)}`} style={{ top: pst(y(siste.verdi), H), borderColor: farge }} aria-hidden="true">
              {format(siste.verdi)}
            </span>
          </>
        )}
        {valgt && (
          <>
            <span className="graf-sikte" style={{ left: pst(x(valgt.sek), B) }} aria-hidden="true" />
            <span className="graf-punkt" style={{ left: pst(x(valgt.sek), B), top: pst(y(valgt.verdi), H), background: farge }} aria-hidden="true" />
            <span className="graf-boble" style={{ left: `${Math.min(80, Math.max(20, (x(valgt.sek) / B) * 100))}%` }} role="status">
              <strong>{format(valgt.verdi)}</strong>
              <span>{valgt.sek === sisteSek ? 'nå' : tidspunkt(valgt.sek, medKlokke)}</span>
            </span>
          </>
        )}
      </div>
      <figcaption className="graf-akse-x" aria-hidden="true">
        {tider.map((t) => {
          const p = x(t.sek) / B
          // Merker helt i kanten holdes inne i grafen.
          const kant = p < 0.08 ? 'venstre' : p > 0.92 ? 'hoyre' : ''
          return (
            <span key={t.sek} className={kant} style={{ left: pst(x(t.sek), B) }}>
              {t.tekst}
            </span>
          )
        })}
      </figcaption>
    </figure>
  )
}

/** Liten trendlinje uten akser, farget etter retning. */
export function Minigraf({ verdier }: { verdier: number[] }) {
  if (verdier.length < 2) return null
  const min = Math.min(...verdier)
  const maks = Math.max(...verdier)
  const spenn = maks - min || 1
  const punkter = verdier
    .map((v, i) => `${((i / (verdier.length - 1)) * 60).toFixed(1)},${(22 - ((v - min) / spenn) * 20).toFixed(1)}`)
    .join(' ')
  const opp = verdier[verdier.length - 1] >= verdier[0]
  return (
    <svg className="minigraf" viewBox="0 0 60 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={punkter} fill="none" stroke={opp ? 'var(--pluss)' : 'var(--minus)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
