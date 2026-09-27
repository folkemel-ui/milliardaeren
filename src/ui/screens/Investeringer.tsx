import { useState } from 'react'
import {
  belaaningsgrad,
  maksKjop,
  maksNyttLaan,
  papirverdi,
  rentePerSek,
} from '../../engine/formler'
import { kjopPapir, laan, nedbetal, selgPapir } from '../../engine/handlinger'
import { MAKS_BELAANING, MARGINKRAV, RENTE_PER_TIME } from '../../engine/innhold'
import { AKSJER, HISTORIKK_TIKK, handelskurs, KRYPTO, kurstrykk, KURTASJE, MARKED_TIKK_SEK, PAPIRER, rundAntall } from '../../engine/marked'
import type { PapirId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { antall as fmtAntall, endring, kortKroner, kroner, kurs as fmtKurs, perSek, tall, varighet } from '../format'
import { Linjegraf, Minigraf } from '../komponenter/Linjegraf'

type Underfane = 'aksjer' | 'krypto' | 'bank'

const RISIKO_TEKST = { lav: 'Lav risiko', middels: 'Middels risiko', høy: 'Høy risiko' } as const

/** Endring over kurshistorikken (to timer), som andel. */
function endringTo(s: Spilltilstand, id: PapirId): number {
  const h = s.marked.kurser[id].historikk
  return h.length ? s.marked.kurser[id].kurs / h[0] - 1 : 0
}

export function Investeringer({ s }: { s: Spilltilstand }) {
  const [fane, settFane] = useState<Underfane>('aksjer')
  const [valgt, settValgt] = useState<PapirId | null>(null)

  if (valgt) return <Papirdetalj s={s} id={valgt} tilbake={() => settValgt(null)} />

  return (
    <section className="skjerm">
      <div className="segment" role="tablist">
        {(['aksjer', 'krypto', 'bank'] as const).map((f) => (
          <button key={f} role="tab" aria-selected={fane === f} className={fane === f ? 'aktiv' : ''} onClick={() => settFane(f)}>
            {f === 'aksjer' ? 'Aksjer' : f === 'krypto' ? 'Krypto' : 'Bank'}
          </button>
        ))}
      </div>
      {fane === 'aksjer' && <Papirliste s={s} klasse="aksje" velg={settValgt} />}
      {fane === 'krypto' && (
        <>
          <Stemning verdi={s.marked.stemning} />
          <Papirliste s={s} klasse="krypto" velg={settValgt} />
        </>
      )}
      {fane === 'bank' && <Bank s={s} />}
    </section>
  )
}

// ─────────────────────────────────────────────── Lister

function Papirliste({ s, klasse, velg }: { s: Spilltilstand; klasse: 'aksje' | 'krypto'; velg: (id: PapirId) => void }) {
  const ider = klasse === 'aksje' ? AKSJER : KRYPTO
  const verdi = papirverdi(s, klasse)
  const kost = ider.reduce((sum, id) => sum + (s.beholdning[id]?.kostpris ?? 0), 0)

  return (
    <>
      <div className="kort portefolje">
        <div>
          <span className="etikett">{klasse === 'aksje' ? 'Dine aksjer' : 'Din krypto'}</span>
          <span className="tall-stort">{kortKroner(verdi)}</span>
        </div>
        {kost > 0 && (
          <span className={verdi >= kost ? 'pluss' : 'minus'}>
            {endring(verdi / kost - 1)}
          </span>
        )}
      </div>
      <ul className="kortliste papirliste">
        {ider.map((id) => {
          const p = PAPIRER[id]
          const e = endringTo(s, id)
          const eier = s.beholdning[id]
          return (
            <li key={id}>
              <button className="kort papirrad" onClick={() => velg(id)}>
                <span className="ticker">{id}</span>
                <span className="papirrad-navn">
                  <strong>{p.navn}</strong>
                  <span className="dempet liten">
                    {eier ? `Du eier ${fmtAntall(eier.antall)}` : klasse === 'aksje' ? RISIKO_TEKST[p.risiko] : 'Krypto'}
                  </span>
                </span>
                <Minigraf verdier={s.marked.kurser[id].historikk} />
                <span className="papirrad-kurs">
                  <span>{fmtKurs(s.marked.kurser[id].kurs)}</span>
                  <span className={e >= 0 ? 'pluss liten' : 'minus liten'}>{endring(e)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Stemning({ verdi }: { verdi: number }) {
  const tekst = verdi < -0.5 ? 'Ekstrem frykt' : verdi < -0.15 ? 'Frykt' : verdi <= 0.15 ? 'Nøytral' : verdi <= 0.5 ? 'Grådighet' : 'Ekstrem grådighet'
  return (
    <div className="kort stemning">
      <div className="maal-topp">
        <span className="etikett">Stemning i kryptomarkedet</span>
        <strong>{tekst}</strong>
      </div>
      <div className="stemning-spor">
        <div className="stemning-merke" style={{ left: `${((verdi + 1) / 2) * 100}%` }} />
      </div>
      <div className="stemning-ender dempet liten">
        <span>Frykt</span>
        <span>Grådighet</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────── Detalj og handel

function Papirdetalj({ s, id, tilbake }: { s: Spilltilstand; id: PapirId; tilbake: () => void }) {
  const p = PAPIRER[id]
  const k = s.marked.kurser[id]
  const e = endringTo(s, id)
  const eier = s.beholdning[id]
  const steg = HISTORIKK_TIKK * MARKED_TIKK_SEK
  const punkter = [...k.historikk.map((v, i) => ({ sek: i * steg, verdi: v })), { sek: k.historikk.length * steg, verdi: k.kurs }]

  return (
    <section className="skjerm">
      <button className="tilbake" onClick={tilbake}>
        ‹ {p.klasse === 'aksje' ? 'Aksjer' : 'Krypto'}
      </button>
      <div className="kort">
        <div className="detalj-topp">
          <span className="ticker">{id}</span>
          <div>
            <h1 className="skjerm-tittel">{p.navn}</h1>
            <span className="dempet liten">
              {RISIKO_TEKST[p.risiko]}
              {p.utbytte > 0 && ` · Utbytte ${tall(p.utbytte * 100, 2)} % hvert 10. min`}
            </span>
          </div>
        </div>
        <div className="detalj-kurs">
          <span className="tall-kjempe">{fmtKurs(k.kurs)}</span>
          <span className={e >= 0 ? 'pluss' : 'minus'}>{endring(e)} siste {varighet(k.historikk.length * steg)}</span>
        </div>
        <Linjegraf punkter={punkter} format={fmtKurs} farge={e >= 0 ? 'var(--pluss)' : 'var(--minus)'} etikett={`Kursen til ${p.navn}`} />
      </div>

      {eier && (
        <dl className="kort statistikk">
          <div>
            <dt>Du eier</dt>
            <dd>{fmtAntall(eier.antall)}</dd>
          </div>
          <div>
            <dt>Verdi</dt>
            <dd>{kortKroner(eier.antall * k.kurs)}</dd>
          </div>
          <div>
            <dt>Gevinst</dt>
            <dd className={eier.antall * k.kurs >= eier.kostpris ? 'pluss' : 'minus'}>
              {endring((eier.antall * k.kurs) / eier.kostpris - 1)}
            </dd>
          </div>
        </dl>
      )}

      <Handelsboks s={s} id={id} />
    </section>
  )
}

function Handelsboks({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const [modus, settModus] = useState<'kjop' | 'selg'>('kjop')
  const [tekst, settTekst] = useState('')
  const [feil, settFeil] = useState<string | null>(null)
  const eier = s.beholdning[id]?.antall ?? 0
  const maks = modus === 'kjop' ? maksKjop(s, id) : eier
  const ønsket = rundAntall(id, Number(tekst.replace(',', '.')) || 0)
  const a = modus === 'selg' ? Math.min(ønsket, eier) : ønsket
  const fortegn = modus === 'kjop' ? 1 : -1
  const pris = a > 0 ? handelskurs(s, id, fortegn * a) : 0
  const sum = a * pris * (1 + fortegn * KURTASJE)
  const trykk = a > 0 ? Math.abs(Math.exp(kurstrykk(id, fortegn * a * s.marked.kurser[id].kurs)) - 1) : 0

  const velgAndel = (andel: number) => {
    const n = andel === 1 ? maks : rundAntall(id, maks * andel)
    settTekst(n > 0 ? String(n) : '')
    settFeil(null)
  }

  const utførHandel = () => {
    const u = modus === 'kjop' ? kjopPapir(s, id, a) : selgPapir(s, id, a)
    const f = utfor(u)
    settFeil(f)
    if (!f) settTekst('')
  }

  return (
    <div className="kort handel">
      <div className="segment">
        <button className={modus === 'kjop' ? 'aktiv' : ''} onClick={() => { settModus('kjop'); settTekst(''); settFeil(null) }}>
          Kjøp
        </button>
        <button className={modus === 'selg' ? 'aktiv' : ''} disabled={eier === 0} onClick={() => { settModus('selg'); settTekst(''); settFeil(null) }}>
          Selg
        </button>
      </div>

      <label className="felt">
        <span className="etikett">Antall {PAPIRER[id].klasse === 'krypto' && '(brøkdeler går fint)'}</span>
        <input
          inputMode="decimal"
          value={tekst}
          placeholder="0"
          onChange={(e) => {
            settTekst(e.target.value)
            settFeil(null)
          }}
        />
      </label>

      <div className="andelsknapper">
        {[0.25, 0.5, 1].map((andel) => (
          <button key={andel} className="knapp knapp-liten" disabled={maks <= 0} onClick={() => velgAndel(andel)}>
            {andel === 1 ? 'Maks' : `${andel * 100} %`}
          </button>
        ))}
      </div>

      <dl className="handel-sum">
        <div>
          <dt>{modus === 'kjop' ? 'Du betaler' : 'Du får'}</dt>
          <dd>{kroner(sum)}</dd>
        </div>
        <div>
          <dt>Kurtasje</dt>
          <dd>{kroner(a * pris * KURTASJE)}</dd>
        </div>
        {trykk >= 0.001 && (
          <div>
            <dt>Kursen flytter seg</dt>
            <dd className="advarsel">{endring(fortegn * trykk)}</dd>
          </div>
        )}
      </dl>

      {feil && <p className="feilmelding">{feil}</p>}
      <button className="knapp knapp-gull" disabled={a <= 0 || (modus === 'kjop' && a > maks)} onClick={utførHandel}>
        {modus === 'kjop' ? 'Kjøp' : 'Selg'} {a > 0 ? fmtAntall(a) : ''}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────── Banken

function Bank({ s }: { s: Spilltilstand }) {
  const grad = belaaningsgrad(s)
  const tilgjengelig = maksNyttLaan(s)
  const kanBetale = Math.min(s.gjeld, s.kontanter)
  const fare = grad > MARGINKRAV * 0.9 ? 'kritisk' : grad > MAKS_BELAANING ? 'advarsel' : ''

  return (
    <>
      <div className="kort bank">
        <div className="bank-rad">
          <div>
            <span className="etikett">Gjeld</span>
            <span className="tall-stort">{kroner(s.gjeld)}</span>
          </div>
          <div className="bank-rente">
            <span className="etikett">Rente {tall(RENTE_PER_TIME * 100)} % per time</span>
            <span className={s.gjeld > 0 ? 'minus' : 'dempet'}>{perSek(-rentePerSek(s))}</span>
          </div>
        </div>
        <div>
          <div className="maal-topp">
            <span className="etikett">Belåningsgrad</span>
            <strong className={fare}>{tall(Math.min(grad, 9.99) * 100)} %</strong>
          </div>
          <div className="belaaning-spor">
            <div className={`belaaning-fyll ${fare}`} style={{ width: `${Math.min(1, grad) * 100}%` }} />
            <span className="belaaning-strek" style={{ left: `${MAKS_BELAANING * 100}%` }} />
            <span className="belaaning-strek fare" style={{ left: `${MARGINKRAV * 100}%` }} />
          </div>
          <p className="dempet liten">
            Du kan låne til gjelden er {tall(MAKS_BELAANING * 100)} % av alt du eier. Over {tall(MARGINKRAV * 100)} %
            selger banken investeringene dine — og holder ikke det, tar den over bedrifter.
          </p>
        </div>
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Lån</h2>
          <span className="dempet liten">Tilgjengelig {kortKroner(tilgjengelig)}</span>
        </div>
        <div className="andelsknapper">
          {[0.25, 0.5, 1].map((andel) => {
            const belop = Math.floor(tilgjengelig * andel)
            return (
              <button key={andel} className="knapp knapp-liten" disabled={belop <= 0} onClick={() => utfor(laan(s, belop))}>
                {kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Nedbetal</h2>
          <span className="dempet liten">Kontanter {kortKroner(s.kontanter)}</span>
        </div>
        <div className="andelsknapper">
          {[0.25, 0.5, 1].map((andel) => {
            const belop = andel === 1 ? kanBetale : Math.floor(kanBetale * andel)
            return (
              <button key={andel} className="knapp knapp-liten" disabled={belop <= 0} onClick={() => utfor(nedbetal(s, belop))}>
                {andel === 1 && kanBetale >= s.gjeld && s.gjeld > 0 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="kort">
        <h2 className="kort-tittel">Hendelser</h2>
        {s.hendelser.length === 0 ? (
          <p className="dempet liten">Ingen hendelser ennå.</p>
        ) : (
          <ul className="hendelser">
            {[...s.hendelser].reverse().slice(0, 10).map((h, i) => (
              <li key={i} className={`hendelse ${h.alvor}`}>
                <strong>{h.tittel}</strong>
                <span className="dempet liten">for {varighet(Math.max(0, s.sek - h.sek))} siden</span>
                <p className="liten">{h.tekst}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
