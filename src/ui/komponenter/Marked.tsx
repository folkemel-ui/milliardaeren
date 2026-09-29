import { useState } from 'react'
import { kjopFond, selgFond } from '../../engine/handlinger'
import { FOND, FOND_GEBYR, fondshistorikk, fondskurs, fondStengt, fondsutbytte } from '../../engine/fond'
import { ESTIMAT_DAGER, ESTIMATTEKST, estimat, kvartalFor, nesteRapport, rapportkalender, UTFALLTEKST, utbytteFor } from '../../engine/kvartal'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import { HISTORIKK_TIKK, MARKED_TIKK_SEK, PAPIRER } from '../../engine/marked'
import type { FondId, PapirId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, fortegnKroner, kortKroner, kurs as fmtKurs, tall } from '../format'
import { kortDato } from '../kalender'
import { Linjegraf, Minigraf } from './Linjegraf'

// ─────────────────────────────────────────────── Fond

/** Et indeksfond øverst i aksje- eller kryptofanen: kurs, andelen din, og kjøp og salg for beløp. */
export function Fondkort({ s, id }: { s: Spilltilstand; id: FondId }) {
  const [feil, settFeil] = useState<string | null>(null)
  const f = FOND[id]
  const kurs = fondskurs(s, id)
  const historikk = fondshistorikk(s, id)
  const e = historikk.length ? kurs / historikk[0] - 1 : 0
  const b = s.fond[id]
  const verdi = b ? b.antall * kurs : 0
  const stengt = fondStengt(s, id)
  const utbytte = fondsutbytte(s, id)
  const kjop = (andel: number) => settFeil(utfor(kjopFond(s, id, s.kontanter * andel)))
  const selg = (andel: number) => settFeil(utfor(selgFond(s, id, andel === 1 ? Infinity : verdi * andel)))

  return (
    <div className={b ? 'kort fondkort eid' : 'kort fondkort'}>
      <div className="rival-topp">
        <div>
          <h2>{f.navn}</h2>
          <span className="dempet liten">
            Indeksfond · gebyr {tall(FOND_GEBYR * 100, 1)} %{utbytte > 0 && ` · utbytte ${tall(utbytte * 5 * 100, 2)} % i uka`}
          </span>
        </div>
        <div className="papirrad-kurs">
          <span>{fmtKurs(kurs)}</span>
          <span className={e >= 0 ? 'pluss liten' : 'minus liten'}>{endring(e)}</span>
        </div>
      </div>
      <Minigraf verdier={historikk} />
      <p className="dempet liten fond-besk">{f.beskrivelse}</p>
      {b && (
        <div className="rival-andel">
          <span>
            Dine andeler: <strong>{kortKroner(verdi)}</strong>
          </span>
          <span className={verdi >= b.kostpris ? 'pluss liten' : 'minus liten'}>
            {fortegnKroner(verdi - b.kostpris)} · {endring(verdi / b.kostpris - 1)}
          </span>
        </div>
      )}
      {stengt ? (
        <p className="dempet liten">Børsen er stengt i helgen. Fondet handles igjen mandag.</p>
      ) : (
        <>
          <div className="bud-knapper">
            {[0.1, 0.25, 1].map((a) => (
              <button key={a} className={a === 1 ? 'knapp knapp-gull knapp-bud' : 'knapp knapp-bud'} disabled={s.kontanter < 1} onClick={() => kjop(a)}>
                <span>Kjøp {a === 1 ? 'for alt' : `${tall(a * 100)} %`}</span>
                <strong>{kortKroner(s.kontanter * a)}</strong>
              </button>
            ))}
          </div>
          {b && (
            <div className="rival-knapper">
              <button className="knapp knapp-liten" onClick={() => selg(0.5)}>
                Selg halvparten
              </button>
              <button className="knapp knapp-liten" onClick={() => selg(1)}>
                Selg alt
              </button>
            </div>
          )}
        </>
      )}
      {feil && <p className="rival-melding">{feil}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────── Rapportkalender

/** De neste kvartalsrapportene, med estimatet når det er kjent. */
export function Rapportkalender({ s, velg }: { s: Spilltilstand; velg: (id: PapirId) => void }) {
  const i_dag = dagnummer(s.sek)
  const liste = rapportkalender(s, 10)
  if (liste.length === 0) return null
  return (
    <div className="kort">
      <h2 className="kort-tittel">Kvartalsrapporter</h2>
      <ul className="rapportliste">
        {liste.map((r) => (
          <li key={r.id}>
            <button onClick={() => velg(r.id)}>
              <span className="ticker">{r.id}</span>
              <span className="rapport-navn">
                <strong>{PAPIRER[r.id].navn}</strong>
                <span className="dempet liten">{r.dag === i_dag + 1 ? 'I morgen' : kortDato(r.dag)}</span>
              </span>
              <span className={r.estimat === null ? 'dempet liten' : `estimat e${r.estimat}`}>
                {r.estimat === null ? `Estimat om ${r.dag - i_dag - ESTIMAT_DAGER} d` : ESTIMATTEKST[r.estimat]}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="dempet liten">
        Hvert selskap legger frem tall én gang i måneden. Estimatet kommer {ESTIMAT_DAGER} dager før — det er overraskelsen som flytter kursen.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────── Papirdetalj: graf, nøkkeltall og rapporter

type Periode = 'dag' | 'uker' | 'alt'
const PERIODER: { id: Periode; navn: string }[] = [
  { id: 'dag', navn: 'I dag' },
  { id: 'uker', navn: '3 uker' },
  { id: 'alt', navn: 'Alt' },
]

/** Kursgrafen med tre tidsrom og handlene dine som prikker. */
export function Kursgraf({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const [periode, settPeriode] = useState<Periode>('uker')
  const k = s.marked.kurser[id]
  const steg = HISTORIKK_TIKK * MARKED_TIKK_SEK
  let punkter: { sek: number; verdi: number }[]
  if (periode === 'alt' && (k.dagslutt?.length ?? 0) >= 2) {
    // Sluttkursene: én per dag, den siste var ved forrige dagsskifte.
    const d = k.dagslutt!
    const sisteSkifte = dagnummer(s.sek) * DAG_SEK
    punkter = [...d.map((v, i) => ({ sek: sisteSkifte - (d.length - 1 - i) * DAG_SEK, verdi: v })), { sek: s.sek, verdi: k.kurs }]
  } else {
    // Historikken: et punkt hvert 30. sekund, det siste akkurat nå.
    const h = periode === 'dag' ? k.historikk.slice(-DAG_SEK / steg) : k.historikk
    punkter = [...h.map((v, i) => ({ sek: s.sek - (h.length - i) * steg, verdi: v })), { sek: s.sek, verdi: k.kurs }]
  }
  const e = punkter[punkter.length - 1].verdi / punkter[0].verdi - 1
  const merker = (s.handler ?? []).filter((h) => h.papir === id).map((h) => ({ sek: h.sek, verdi: h.kurs, kjop: h.antall > 0 }))
  const ingenHistorikk = periode === 'alt' && (k.dagslutt?.length ?? 0) < 2

  return (
    <>
      <div className="segment" role="tablist" aria-label="Tidsrom">
        {PERIODER.map((p) => (
          <button key={p.id} role="tab" aria-selected={periode === p.id} className={periode === p.id ? 'aktiv' : ''} onClick={() => settPeriode(p.id)}>
            {p.navn}
          </button>
        ))}
      </div>
      {ingenHistorikk ? (
        <p className="graf-tom">Sluttkursene samles fra neste dagsskifte. Om to dager står den første linja her.</p>
      ) : (
        <Linjegraf punkter={punkter} format={fmtKurs} farge={e >= 0 ? 'var(--pluss)' : 'var(--minus)'} etikett={`Kursen til ${PAPIRER[id].navn}`} merker={merker} />
      )}
      {merker.length > 0 && (
        <p className="dempet liten graf-forklaring">
          <span className="pluss">●</span> kjøp · <span className="minus">●</span> salg
        </p>
      )}
    </>
  )
}

/** Høyeste og laveste kurs, utbytte og neste rapport. */
export function Nokkeltall({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const p = PAPIRER[id]
  const k = s.marked.kurser[id]
  const alle = [...k.historikk, k.kurs]
  const aksje = p.klasse === 'aksje'
  const i_dag = dagnummer(s.sek)
  // Dagens rapport kom ved dagsskiftet — den står under «forrige».
  const neste = aksje ? nesteRapport(id, i_dag + 1) : null
  const siste = aksje ? kvartalFor(s, id).siste : null
  return (
    <>
      <dl className="kort statistikk nokkeltall">
        <div>
          <dt>Høyeste</dt>
          <dd>{fmtKurs(k.topp ?? Math.max(...alle))}</dd>
        </div>
        <div>
          <dt>Laveste</dt>
          <dd>{fmtKurs(k.bunn ?? Math.min(...alle))}</dd>
        </div>
        <div>
          <dt>3 uker</dt>
          <dd className="liten">
            {fmtKurs(Math.min(...alle))} – {fmtKurs(Math.max(...alle))}
          </dd>
        </div>
        {aksje && (
          <div>
            <dt>Utbytte</dt>
            <dd>{utbytteFor(s, id) > 0 ? `${tall(utbytteFor(s, id) * 5 * 100, 2)} % i uka` : 'Ingen'}</dd>
          </div>
        )}
      </dl>
      {aksje && neste !== null && (
        <div className="kort rapportkort">
          <h2 className="kort-tittel">Kvartalsrapport</h2>
          <p>
            Neste: <strong>{neste === i_dag + 1 ? 'i morgen' : kortDato(neste)}</strong>
            {neste - i_dag <= ESTIMAT_DAGER ? (
              <>
                {' '}
                · analytikerne venter <span className={`estimat e${estimat(id, neste)}`}>{ESTIMATTEKST[estimat(id, neste)].toLowerCase()}</span>
              </>
            ) : (
              <span className="dempet"> · estimatet kommer {ESTIMAT_DAGER} dager før</span>
            )}
          </p>
          {siste && (
            <p className="dempet liten">
              Forrige ({siste.dag === i_dag ? 'i dag' : kortDato(siste.dag)}): {UTFALLTEKST[siste.utfall].toLowerCase()} — kursen {endring(siste.endring)}. Utbyttet er nå{' '}
              {tall(kvartalFor(s, id).utbytteFaktor * 100)} % av normalt.
            </p>
          )}
        </div>
      )}
    </>
  )
}
