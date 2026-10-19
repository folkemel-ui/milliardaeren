/**
 * Skogen på sin side (Pakke 120): bestandene med alder, tømmer og hogst, et bestand til å
 * kjøpe, vekstkurven og skogens regnskap. Før var siden kortet, faktaene og kraftverket, og
 * en hogst etterlot bare en linje i loggen.
 */

import { useState, type PointerEvent } from 'react'
import { hoggBestand, kjopBestand } from '../../engine/handlinger'
import { bestand, bestandsalder, bestandsverdi, HOGST_BEST_DAG, landverdi, MAKS_BESTAND, nesteBestandpris, START_BESTAND, TOMMER_DAGER, TOMMER_MAKS, tommerfaktor } from '../../engine/jord'
import { DAG_SEK } from '../../engine/kalender'
import type { JordId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall, varighet } from '../format'

const dager = (d: number) => `${tall(d)} ${Math.round(d) === 1 ? 'dag' : 'dager'}`

/** Bestandene: alder, tømmer nå og når det er best å hogge, og knappen. Så et bestand til. */
export function Bestandkort({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const b = bestand(j)
  const pris = nesteBestandpris(s, id)
  // Et bestand til gir en tredel av jorda: ~0,25 × jorda per omløp på 36 dager.
  const perDag = (landverdi(s, id) / START_BESTAND) * tommerfaktor(HOGST_BEST_DAG) / HOGST_BEST_DAG
  return (
    <div className="kort">
      <h2 className="kort-tittel">Bestandene</h2>
      <p className="dempet liten">
        Hvert bestand er en tredel av jorda og hogges for seg. Hogger du dem på rad, kommer tømmeret jevnt — hvert bestand gir mest per dag ved {dager(HOGST_BEST_DAG)}.
      </p>
      <ul className="forbedringer">
        {b.map((_, i) => {
          const alder = bestandsalder(s, id, i)
          const verdi = bestandsverdi(s, id, i)
          const igjen = HOGST_BEST_DAG - alder
          return (
            <li key={i}>
              <div>
                <strong>Bestand {i + 1}</strong>
                <p className="dempet liten">
                  {alder < 1 ? 'Nyplantet' : `${dager(Math.floor(alder))} · ${kortKroner(verdi)}`}
                  {igjen > 0 ? ` · best om ${dager(Math.ceil(igjen))}` : ''}
                </p>
              </div>
              {igjen <= 0 ? (
                <button className="knapp knapp-gull knapp-liten" onClick={() => utfor(hoggBestand(s, id, i))}>
                  Hogg · {kortKroner(verdi)}
                </button>
              ) : (
                <button className="knapp knapp-sekundær knapp-liten" disabled={alder < 1} onClick={() => utfor(hoggBestand(s, id, i))}>
                  Hogg nå
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {pris !== null ? (
        <button className="knapp knapp-gull" disabled={s.kontanter < pris} onClick={() => utfor(kjopBestand(s, id))}>
          Bestand {b.length + 1} av {MAKS_BESTAND} · {kortKroner(pris)}
        </button>
      ) : (
        <p className="dempet liten">Skogen har alle {MAKS_BESTAND} bestandene.</p>
      )}
      {pris !== null && <p className="dempet liten">En tredel mer jord: ≈ {kortKroner(perDag)} om dagen i et jevnt omløp, tilbake på {varighet((pris / perDag) * DAG_SEK)}.</p>}
    </div>
  )
}

const B = 320
const H = 110
const MAKS_DAG = 150
/** Tømmeret som andel av en tredel av jorda: fra 0 til ~2,4 ved dag 150 (taket er 3). */
const TOPP = TOMMER_MAKS

/**
 * Vekstkurven (Pakke 120): tømmeret i et bestand fra planting til dag 150, som andel av
 * bestandets jord, med dagen da det gir mest per dag stiplet og hvert bestand der det står
 * nå. Under: hva det koster å vente forbi den beste dagen.
 */
export function Tommerkurve({ s, id }: { s: Spilltilstand; id: JordId }) {
  const [valgt, settValgt] = useState<number | null>(null)
  const j = s.jord[id]
  if (!j) return null
  const x = (d: number) => (d / MAKS_DAG) * B
  const y = (f: number) => H - (f / TOPP) * H
  const punkter = Array.from({ length: 76 }, (_, i) => i * 2).map((d) => `${x(d).toFixed(1)},${y(tommerfaktor(d)).toFixed(1)}`).join(' ')
  const tredel = landverdi(s, id) / START_BESTAND
  const lesAv = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    settValgt(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * MAKS_DAG))
  }
  // Snittet per dag ved den beste dagen, og 30 dager senere.
  const perDagBest = tommerfaktor(HOGST_BEST_DAG) / HOGST_BEST_DAG
  const perDagSent = tommerfaktor(HOGST_BEST_DAG + 30) / (HOGST_BEST_DAG + 30)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Tømmeret vokser</h2>
      <figure className="graf tommergraf">
        <div className="graf-akse-y" aria-hidden="true">
          {[1, 2, 3].map((v) => (
            <span key={v} style={{ top: `${(y(v) / H) * 100}%` }}>
              ×{v}
            </span>
          ))}
        </div>
        <div
          className="graf-flate"
          role="img"
          aria-label={`Tømmeret i et bestand vokser mot tre ganger jorda. Mest per dag ved dag ${HOGST_BEST_DAG}.`}
          onPointerDown={lesAv}
          onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && lesAv(e)}
          onPointerUp={(e) => e.pointerType !== 'mouse' && settValgt(null)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && settValgt(null)}
          onPointerCancel={() => settValgt(null)}
        >
          <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {[1, 2].map((v) => (
              <line key={v} x1="0" y1={y(v)} x2={B} y2={y(v)} className="graf-rutenett" />
            ))}
            <line x1={x(HOGST_BEST_DAG)} y1="0" x2={x(HOGST_BEST_DAG)} y2={H} className="graf-snitt" />
            <polyline points={punkter} fill="none" className="graf-linje" style={{ stroke: 'var(--kilde-1)' }} />
          </svg>
          {bestand(j).map((_, i) => {
            const d = Math.min(MAKS_DAG, Math.max(0, bestandsalder(s, id, i)))
            return <span key={i} className="graf-punkt" style={{ left: `${(x(d) / B) * 100}%`, top: `${(y(tommerfaktor(d)) / H) * 100}%`, background: 'var(--gull)' }} aria-hidden="true" />
          })}
          {valgt !== null && (
            <>
              <span className="graf-sikte" style={{ left: `${(x(valgt) / B) * 100}%` }} aria-hidden="true" />
              <span className="graf-boble" style={{ left: `${Math.min(75, Math.max(25, (valgt / MAKS_DAG) * 100))}%` }} role="status">
                <strong>Dag {valgt}</strong>
                <span>{kortKroner(tredel * tommerfaktor(valgt))} per bestand</span>
                <span>{valgt > 0 ? `${kortKroner((tredel * tommerfaktor(valgt)) / valgt)} om dagen` : ''}</span>
              </span>
            </>
          )}
        </div>
        <figcaption className="graf-akse-x" aria-hidden="true">
          <span className="venstre" style={{ left: '0%' }}>
            plantet
          </span>
          <span style={{ left: `${(x(HOGST_BEST_DAG) / B) * 100}%` }}>dag {HOGST_BEST_DAG}</span>
          <span className="hoyre" style={{ left: '100%' }}>
            dag {MAKS_DAG}
          </span>
        </figcaption>
      </figure>
      <p className="dempet liten">
        Tømmeret vokser raskest rundt dag {TOMMER_DAGER / 2}, men gir mest per dag over et helt omløp ved dag {HOGST_BEST_DAG}: {kortKroner(tredel * perDagBest)} om dagen per bestand. Venter du 30 dager til, er det {kortKroner(tredel * perDagSent)} — {Math.round((1 - perDagSent / perDagBest) * 100)} % mindre. Prikkene er bestandene dine.
      </p>
    </div>
  )
}

/** Skogens regnskap (Pakke 120): de siste åtte hogstene og alt tømmeret har gitt. */
export function Skogregnskap({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const hogster = [...(j.hogster ?? [])].reverse()
  return (
    <div className="kort">
      <h2 className="kort-tittel">Regnskapet</h2>
      {hogster.length === 0 ? (
        <p className="dempet liten">Ingen hogster ennå. Hver hogst står her med dag, bestand, alder og hva den ga.</p>
      ) : (
        <>
          <p className="dempet liten">Tømmeret har gitt {kortKroner(j.tommerTotalt ?? 0)} siden du kjøpte skogen.</p>
          <ul className="romlogg">
            {hogster.map((h, i) => (
              <li key={`${h.dag}-${h.bestand}-${i}`}>
                <span>
                  Dag {h.dag} · bestand {h.bestand + 1} · {dager(Math.round(h.alder))}
                </span>
                <span>
                  {kortKroner(h.belop)}
                  {h.alder > 0 && <span className="dempet"> · {kortKroner(h.belop / h.alder)}/d</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}


