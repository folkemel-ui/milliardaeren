import { useState } from 'react'
import {
  belaaningsgrad,
  maksKjop,
  nettoformue,
  maksNyttLaan,
  papirverdi,
  rentePerSek,
  rentesats,
  sparerentePerSek,
} from '../../engine/formler'
import {
  borsenStengt,
  kjopPapir,
  kjopRivalblokk,
  laan,
  nedbetal,
  nyOrdre,
  overtaRival,
  selgPapir,
  selgRivalandel,
  settInn,
  slettOrdre,
  taUt,
} from '../../engine/handlinger'
import { ORDRETYPER } from '../../engine/ordre'
import { BLOKK, blokkpris, forbesliste, oppkjopspris, RIVALUTBYTTE, SALGSHONORAR, selskapsverdi } from '../../engine/rivaler'
import { erHelg } from '../../engine/kalender'
import { MAKS_BELAANING, MARGINKRAV, RENTE_PER_TIME, SPARERENTE_PER_TIME } from '../../engine/innhold'
import { AKSJER, HISTORIKK_TIKK, handelskurs, KRYPTO, kurstrykk, KURTASJE, MARKED_TIKK_SEK, PAPIRER, rundAntall } from '../../engine/marked'
import { portefolje, sum, type Aktivaklasse } from '../../engine/portefolje'
import type { Ordretype, PapirId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { antall as fmtAntall, endring, fortegnKroner, kortKroner, kroner, kurs as fmtKurs, perSek, tall, varighet } from '../format'
import { Linjegraf, Minigraf } from '../komponenter/Linjegraf'

type Underfane = 'oversikt' | 'aksjer' | 'krypto' | 'rivaler' | 'bank'

const UNDERFANER: { id: Underfane; navn: string }[] = [
  { id: 'oversikt', navn: 'Oversikt' },
  { id: 'aksjer', navn: 'Aksjer' },
  { id: 'krypto', navn: 'Krypto' },
  { id: 'rivaler', navn: 'Rivaler' },
  { id: 'bank', navn: 'Bank' },
]

const TIL_UNDERFANE: Record<Exclude<Aktivaklasse, 'eiendom'>, Underfane> = {
  aksje: 'aksjer',
  krypto: 'krypto',
  rival: 'rivaler',
  sparing: 'bank',
}

const RISIKO_TEKST = { lav: 'Lav risiko', middels: 'Middels risiko', høy: 'Høy risiko' } as const

/** Endring over kurshistorikken (to timer), som andel. */
function endringTo(s: Spilltilstand, id: PapirId): number {
  const h = s.marked.kurser[id].historikk
  return h.length ? s.marked.kurser[id].kurs / h[0] - 1 : 0
}

export function Investeringer({ s, tilEiendom }: { s: Spilltilstand; tilEiendom: () => void }) {
  const [fane, settFane] = useState<Underfane>('oversikt')
  const [valgt, settValgt] = useState<PapirId | null>(null)

  if (valgt) return <Papirdetalj s={s} id={valgt} tilbake={() => settValgt(null)} />

  return (
    <section className="skjerm">
      <div className="segment segment-fem" role="tablist">
        {UNDERFANER.map((f) => (
          <button key={f.id} role="tab" aria-selected={fane === f.id} className={fane === f.id ? 'aktiv' : ''} onClick={() => settFane(f.id)}>
            {f.navn}
          </button>
        ))}
      </div>
      {fane === 'oversikt' && (
        <Oversikt s={s} velg={(k) => (k === 'eiendom' ? tilEiendom() : settFane(TIL_UNDERFANE[k]))} />
      )}
      {fane === 'rivaler' && <Rivaler s={s} />}
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

// ─────────────────────────────────────────────── Oversikt

const KLASSENAVN: Record<Aktivaklasse, string> = {
  aksje: 'Aksjer',
  krypto: 'Krypto',
  eiendom: 'Eiendom',
  rival: 'Rivalselskaper',
  sparing: 'Sparekonto',
}

function Oversikt({ s, velg }: { s: Spilltilstand; velg: (k: Aktivaklasse) => void }) {
  const poster = portefolje(s)
  const total = sum(poster)
  const avkastning = total.verdi - total.kostpris
  const startIDag = total.verdi - total.iDag

  return (
    <>
      <div className="kort oversikt">
        <span className="etikett">Investeringene dine</span>
        <span className="tall-kjempe">{kortKroner(total.verdi)}</span>
        <div className="oversikt-tall">
          <div>
            <span className="etikett">Kursendring i dag</span>
            <Endring kroner={total.iDag} andel={startIDag > 0 ? total.iDag / startIDag : 0} />
          </div>
          <div>
            <span className="etikett">Total avkastning</span>
            <Endring kroner={avkastning} andel={total.kostpris > 0 ? avkastning / total.kostpris : 0} />
          </div>
        </div>
        {total.verdi > 0 && (
          <div className="fordeling" role="img" aria-label="Fordeling av investeringene">
            {poster
              .filter((p) => p.verdi > 0)
              .map((p) => (
                <span key={p.klasse} className={`fordeling-del ${p.klasse}`} style={{ flexGrow: p.verdi }} />
              ))}
          </div>
        )}
      </div>

      <ul className="kortliste">
        {poster.map((p) => {
          const avk = p.verdi - p.kostpris
          return (
            <li key={p.klasse}>
              <button className="kort klasserad" onClick={() => velg(p.klasse)}>
                <span className={`klasse-prikk ${p.klasse}`} aria-hidden="true" />
                <span className="klasserad-navn">
                  <strong>{KLASSENAVN[p.klasse]}</strong>
                  <span className="dempet liten">
                    {total.verdi > 0 ? `${tall((p.verdi / total.verdi) * 100)} % av porteføljen` : 'Ingenting ennå'}
                  </span>
                </span>
                <span className="papirrad-kurs">
                  <span>{kortKroner(p.verdi)}</span>
                  {p.verdi > 0 && <Endring kroner={avk} andel={p.kostpris > 0 ? avk / p.kostpris : 0} liten />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="dempet liten">Bedriftene er ikke med her — de finner du under Bedrifter.</p>
    </>
  )
}

/** «+kr 1 240 · +4,6 %» i grønt, eller rødt når det går nedover. */
function Endring({ kroner: k, andel, liten = false }: { kroner: number; andel: number; liten?: boolean }) {
  return (
    <span className={`${k >= 0 ? 'pluss' : 'minus'}${liten ? ' liten' : ''}`}>
      {fortegnKroner(k)} · {endring(andel)}
    </span>
  )
}

// ─────────────────────────────────────────────── Lister

function Papirliste({ s, klasse, velg }: { s: Spilltilstand; klasse: 'aksje' | 'krypto'; velg: (id: PapirId) => void }) {
  const ider = klasse === 'aksje' ? AKSJER : KRYPTO
  const verdi = papirverdi(s, klasse)
  const kost = ider.reduce((sum, id) => sum + (s.beholdning[id]?.kostpris ?? 0), 0)
  const eide = ider.filter((id) => s.beholdning[id])

  return (
    <>
      {klasse === 'aksje' && erHelg(s.sek) && <p className="kort stengt">Børsen er stengt i helgen. Kursene står stille til mandag.</p>}
      <div className="kort portefolje">
        <div>
          <span className="etikett">{klasse === 'aksje' ? 'Dine aksjer' : 'Din krypto'}</span>
          <span className="tall-stort">{kortKroner(verdi)}</span>
        </div>
        {kost > 0 && <Endring kroner={verdi - kost} andel={verdi / kost - 1} />}
      </div>

      {eide.length > 0 && (
        <ul className="kortliste papirliste">
          {eide.map((id) => {
            const b = s.beholdning[id]!
            const v = b.antall * s.marked.kurser[id].kurs
            return (
              <li key={id}>
                <button className="kort papirrad eid" onClick={() => velg(id)}>
                  <span className="ticker">{id}</span>
                  <span className="papirrad-navn">
                    <strong>{PAPIRER[id].navn}</strong>
                    <span className="dempet liten">
                      {fmtAntall(b.antall)} {klasse === 'aksje' ? 'aksjer' : 'stk'}
                    </span>
                  </span>
                  <Minigraf verdier={s.marked.kurser[id].historikk} />
                  <span className="papirrad-kurs">
                    <span>{kroner(v)}</span>
                    <Endring kroner={v - b.kostpris} andel={v / b.kostpris - 1} liten />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <h2 className="seksjon-tittel">{klasse === 'aksje' ? 'Børsen' : 'Kryptomarkedet'}</h2>
      <ul className="kortliste papirliste">
        {ider.map((id) => {
          const p = PAPIRER[id]
          const e = endringTo(s, id)
          return (
            <li key={id}>
              <button className="kort papirrad" onClick={() => velg(id)}>
                <span className="ticker">{id}</span>
                <span className="papirrad-navn">
                  <strong>{p.navn}</strong>
                  <span className="dempet liten">{klasse === 'aksje' ? RISIKO_TEKST[p.risiko] : 'Krypto'}</span>
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
              {p.utbytte > 0 && ` · Utbytte ${tall(p.utbytte * 100, 3)} % hver børsdag`}
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

      {borsenStengt(s, id) ? (
        <p className="kort stengt">Børsen er stengt i helgen. Den åpner mandag morgen — kryptoen kan du handle hele uka.</p>
      ) : (
        <Handelsboks s={s} id={id} />
      )}
      <Ordrer s={s} id={id} />
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

// ─────────────────────────────────────────────── Automatiske ordre

const STANDARDGRENSE: Record<Ordretype, number> = { kjop: 0.9, 'selg-over': 1.2, 'selg-under': 0.85 }

function Ordrer({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const kurs = s.marked.kurser[id].kurs
  const eier = s.beholdning[id]?.antall ?? 0
  const [type, settType] = useState<Ordretype>('kjop')
  const [grense, settGrense] = useState('')
  const [antall, settAntall] = useState('')
  const [feil, settFeil] = useState<string | null>(null)
  const mine = s.ordre.filter((o) => o.papir === id)
  const lesTall = (t: string) => Number(t.replace(',', '.').replace(/\s/g, ''))

  const velgType = (t: Ordretype) => {
    settType(t)
    settGrense('')
    settAntall(t === 'kjop' ? '' : String(eier))
    settFeil(null)
  }
  const forslag = kurs * STANDARDGRENSE[type]
  const grenseTall = grense ? lesTall(grense) : forslag

  const leggInn = () => {
    const f = utfor(nyOrdre(s, id, type, grenseTall, lesTall(antall)))
    settFeil(f)
    if (!f) settAntall(type === 'kjop' ? '' : String(eier))
  }

  return (
    <div className="kort ordrer">
      <h2 className="kort-tittel">Automatiske ordre</h2>
      <p className="dempet liten">Utføres av seg selv når kursen når grensen — også mens du er borte.</p>
      <div className="segment">
        {(Object.keys(ORDRETYPER) as Ordretype[]).map((t) => (
          <button key={t} className={t === type ? 'aktiv' : ''} disabled={t !== 'kjop' && eier === 0} onClick={() => velgType(t)}>
            {ORDRETYPER[t].navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">{ORDRETYPER[type].forklaring}. Kursen nå: {fmtKurs(kurs)}.</p>
      <div className="ordre-felt">
        <label className="felt">
          <span className="etikett">Grense (kr)</span>
          <input inputMode="decimal" value={grense} placeholder={fmtKurs(forslag).replace('kr ', '')} onChange={(e) => settGrense(e.target.value)} />
        </label>
        <label className="felt">
          <span className="etikett">Antall</span>
          <input inputMode="decimal" value={antall} placeholder="0" onChange={(e) => settAntall(e.target.value)} />
        </label>
      </div>
      {feil && <p className="feilmelding">{feil}</p>}
      <button className="knapp knapp-gull" disabled={!(lesTall(antall) > 0)} onClick={leggInn}>
        Legg inn ordre
      </button>

      {mine.length > 0 && (
        <ul className="ordreliste">
          {mine.map((o) => (
            <li key={o.id}>
              <span>
                <strong>{ORDRETYPER[o.type].navn}</strong>
                <span className="dempet liten">
                  {' '}
                  {fmtAntall(o.antall)} ved {fmtKurs(o.grense)}
                </span>
              </span>
              <button className="knapp knapp-liten" aria-label="Slett ordren" onClick={() => utfor(slettOrdre(s, o.id))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────── Rivaler

function Rivaler({ s }: { s: Spilltilstand }) {
  const liste = forbesliste(s, nettoformue(s))
  return (
    <>
      <div className="kort">
        <h2 className="kort-tittel">Forbes-lista</h2>
        <ol className="forbes">
          {liste.map((p, i) => (
            <li key={p.navn} className={p.deg ? 'deg' : ''}>
              <span className="forbes-plass">{i + 1}</span>
              <span className="forbes-navn">{p.navn}</span>
              <span className="forbes-formue">{kortKroner(p.formue)}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="dempet liten">
        Kjøp deg inn i rivalenes holdingselskaper i blokker på {tall(BLOKK * 100)} %. Andelene gir {tall(RIVALUTBYTTE * 100)} %
        utbytte per time. Med halvparten kan du ta resten med et fiendtlig oppkjøp.
      </p>

      <ul className="kortliste">
        {s.rivaler.map((r) => {
          const verdi = selskapsverdi(r)
          const min = r.andel * verdi
          const bp = blokkpris(r)
          const op = oppkjopspris(r)
          return (
            <li key={r.id} className={r.overtatt ? 'kort rivalkort eid' : 'kort rivalkort'}>
              <div className="rival-topp">
                <div>
                  <h2>{r.selskap}</h2>
                  <span className="dempet liten">
                    {r.overtatt ? 'Eid av deg — tidligere' : 'Eies av'} {r.navn}
                  </span>
                </div>
                <div className="papirrad-kurs">
                  <span>{kortKroner(verdi)}</span>
                  <span className="dempet liten">selskapsverdi</span>
                </div>
              </div>
              {r.andel > 0 && (
                <div className="rival-andel">
                  <span>
                    Din andel: <strong>{tall(r.andel * 100)} %</strong> · {kortKroner(min)}
                  </span>
                  <span className={min >= r.kostpris ? 'pluss liten' : 'minus liten'}>
                    {fortegnKroner(min - r.kostpris)} · {endring(r.kostpris > 0 ? min / r.kostpris - 1 : 0)}
                  </span>
                </div>
              )}
              <div className="andelsbar" aria-hidden="true">
                <div style={{ width: `${r.andel * 100}%` }} />
                <span className="andelsbar-strek" />
              </div>
              <div className="rival-knapper">
                {!r.overtatt && r.andel < 0.5 - 1e-9 && (
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < bp} onClick={() => utfor(kjopRivalblokk(s, r.id))}>
                    Kjøp {tall(BLOKK * 100)} % · {kortKroner(bp)}
                  </button>
                )}
                {!r.overtatt && r.andel >= 0.5 - 1e-9 && (
                  <button className="knapp knapp-fare knapp-liten" disabled={s.kontanter < op} onClick={() => utfor(overtaRival(s, r.id))}>
                    Fiendtlig oppkjøp · {kortKroner(op)}
                  </button>
                )}
                {r.andel > 0 && (
                  <button className="knapp knapp-liten" onClick={() => utfor(selgRivalandel(s, r.id))}>
                    Selg · {kortKroner(min * (1 - SALGSHONORAR))}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

// ─────────────────────────────────────────────── Banken

function Sparekonto({ s }: { s: Spilltilstand }) {
  const andeler = [0.25, 0.5, 1]
  return (
    <div className="kort sparekonto">
      <div className="bank-rad">
        <div>
          <span className="etikett">Sparekonto</span>
          <span className="tall-stort">{kroner(s.sparing)}</span>
        </div>
        <div className="bank-rente">
          <span className="etikett">Rente {tall(SPARERENTE_PER_TIME * 100)} % per time</span>
          <span className={s.sparing > 0 ? 'pluss' : 'dempet'}>{perSek(sparerentePerSek(s))}</span>
        </div>
      </div>
      <p className="dempet liten">
        Risikofritt: renten legges til hvert sekund, også mens du er borte. Opptjent så langt: {kroner(s.totaltSparerente)}.
      </p>
      <div className="spare-rad">
        <span className="etikett">Sett inn</span>
        <div className="andelsknapper">
          {andeler.map((a) => {
            const belop = a === 1 ? s.kontanter : Math.floor(s.kontanter * a)
            return (
              <button key={a} className="knapp knapp-liten" disabled={belop < 1} onClick={() => utfor(settInn(s, belop))}>
                {a === 1 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="spare-rad">
        <span className="etikett">Ta ut</span>
        <div className="andelsknapper">
          {andeler.map((a) => {
            const belop = a === 1 ? s.sparing : Math.floor(s.sparing * a)
            return (
              <button key={a} className="knapp knapp-liten" disabled={belop < 1} onClick={() => utfor(taUt(s, belop))}>
                {a === 1 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Bank({ s }: { s: Spilltilstand }) {
  const grad = belaaningsgrad(s)
  const tilgjengelig = maksNyttLaan(s)
  const kanBetale = Math.min(s.gjeld, s.kontanter)
  const fare = grad > MARGINKRAV * 0.9 ? 'kritisk' : grad > MAKS_BELAANING ? 'advarsel' : ''

  return (
    <>
      <Sparekonto s={s} />
      <div className="kort bank">
        <div className="bank-rad">
          <div>
            <span className="etikett">Gjeld</span>
            <span className="tall-stort">{kroner(s.gjeld)}</span>
          </div>
          <div className="bank-rente">
            <span className="etikett">Rente {tall(rentesats(s) * 100, rentesats(s) === RENTE_PER_TIME ? 0 : 1)} % per time</span>
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
