/**
 * Børs: aksjer og krypto (og fond), lista, detaljsiden med handel og automatiske ordre.
 * En del av Investeringer-fanen (Pakke 65 delte Investeringer.tsx per del).
 */

import { useState } from 'react'
import { maksKjop, papirverdi } from '../../../engine/formler'
import { borsenStengt, kjopPapir, nyOrdre, selgPapir, slettOrdre } from '../../../engine/handlinger'
import { PapirBransje } from '../../komponenter/Bransje'
import { ORDRETYPER } from '../../../engine/ordre'
import { erHelg } from '../../../engine/kalender'
import { AKSJER, HISTORIKK_TIKK, handelskurs, KRYPTO, kurstrykk, KURTASJE, maksPerOrdre, MARKED_TIKK_SEK, PAPIRER, RAVARER, rundAntall } from '../../../engine/marked'
import { RAVARE_FOR, ravarenivaa } from '../../../engine/ravarer'
import { BEDRIFTSTYPER } from '../../../engine/innhold'
import type { BedriftstypeId, Ordretype, PapirId, Spilltilstand } from '../../../engine/types'
import { utfor } from '../../../state/lager'
import { antall as fmtAntall, endring, kortKroner, kroner, kurs as fmtKurs, tall, varighet } from '../../format'
import { Minigraf } from '../../komponenter/Linjegraf'
import { Fondkort, Kursgraf, Nokkeltall, utbyttetekst } from '../../komponenter/Marked'
import { fondKostpris, fondverdi } from '../../../engine/fond'
import { Tikkekurs } from '../../komponenter/Tikk'
import { RulleTall } from '../../komponenter/RulleTall'
import { useVoksUt } from '../../overgang'
import { Papirlogo } from '../../komponenter/Papirlogo'
import { Forklaring } from '../../komponenter/Forklaring'
import { borsdel, type Borsdel } from '../../deler'
import { Endring } from './felles'

const RISIKO_TEKST = { lav: 'Lav risiko', middels: 'Middels risiko', høy: 'Høy risiko' } as const
/** Kort form i lista når utbyttet står etter (Pakke 104), så linja ikke går over tre rader på en telefon. */
const RISIKO_KORT = { lav: 'Lav', middels: 'Middels', høy: 'Høy' } as const

/** Endring over kurshistorikken (to timer), som andel. */
function endringTo(s: Spilltilstand, id: PapirId): number {
  const h = s.marked.kurser[id].historikk
  return h.length ? s.marked.kurser[id].kurs / h[0] - 1 : 0
}

type Klasse = Borsdel

const FLISNAVN: Record<Klasse, string> = { aksje: 'Aksjer', krypto: 'Krypto', fond: 'Fond', ravare: 'Råvarer' }
const PAPIRER_I: Record<'aksje' | 'krypto' | 'ravare', PapirId[]> = { aksje: AKSJER, krypto: KRYPTO, ravare: RAVARER }
/** Ord for klassen i lista: flertall, «alle …», og forklaringen. */
const ORD = {
  aksje: { alle: 'Alle aksjer', andre: 'Andre aksjer', eier: 'alle aksjene', tema: 'aksjer', enhet: 'aksjer' },
  krypto: { alle: 'Alle mynter', andre: 'Andre mynter', eier: 'alle myntene', tema: 'krypto', enhet: 'stk' },
  ravare: { alle: 'Alle råvarer', andre: 'Andre råvarer', eier: 'alle råvarene', tema: 'ravarer', enhet: '' },
} as const

/**
 * Børsfanen: et lite dashbord med aksjene og kryptoen dine — verdien, hva du
 * har betalt og hvor mye det har steget eller falt. Flisene er også en
 * bryter: trykk på en, og lista under viser den klassen.
 */
export function Bors({ s, velg }: { s: Spilltilstand; velg: (id: PapirId) => void }) {
  const klasse = borsdel.bruk()
  const bytt = borsdel.sett
  return (
    <>
      <div className="dashbord fire" role="tablist" aria-label="Aksjer, krypto, fond eller råvarer">
        {(['aksje', 'krypto', 'fond', 'ravare'] as Klasse[]).map((k) => {
          // Fondene (Pakke 65) har egen verdi og kostpris; aksjer og krypto regnes per papir.
          const verdi = k === 'fond' ? fondverdi(s) : papirverdi(s, k)
          const kost = k === 'fond' ? fondKostpris(s) : PAPIRER_I[k].reduce((sum, id) => sum + (s.beholdning[id]?.kostpris ?? 0), 0)
          return (
            <button key={k} role="tab" aria-selected={klasse === k} className={klasse === k ? 'kort flis aktiv' : 'kort flis'} onClick={() => bytt(k)}>
              <span className="etikett">{FLISNAVN[k]}</span>
              <span className="tall-stort">
                <RulleTall verdi={verdi} format={kortKroner} />
              </span>
              {kost > 0 ? (
                <>
                  <span className="dempet liten">Investert {kortKroner(kost)}</span>
                  <Endring kroner={verdi - kost} andel={verdi / kost - 1} liten />
                </>
              ) : (
                <span className="dempet liten">Ingenting ennå</span>
              )}
            </button>
          )
        })}
      </div>
      {klasse === 'krypto' && <Stemning verdi={s.marked.stemning} />}
      {klasse === 'fond' ? (
        <>
          <h2 className="seksjon-tittel">
            Indeksfond <Forklaring tema="fond" />
          </h2>
          <Fondkort s={s} id="BORSFOND" />
          <Fondkort s={s} id="KRYPTOFOND" />
        </>
      ) : (
        <Papirliste s={s} klasse={klasse} velg={velg} />
      )}
    </>
  )
}

export function Papirliste({ s, klasse, velg }: { s: Spilltilstand; klasse: 'aksje' | 'krypto' | 'ravare'; velg: (id: PapirId) => void }) {
  const ider = PAPIRER_I[klasse]
  const ord = ORD[klasse]
  const eide = ider.filter((id) => s.beholdning[id])
  const andre = ider.filter((id) => !s.beholdning[id])

  return (
    <>
      {klasse !== 'krypto' && erHelg(s.sek) && <p className="kort stengt">Børsen er stengt i helgen. Kursene står stille til mandag.</p>}
      {klasse === 'ravare' && <Ravarenivaa s={s} />}

      {eide.length > 0 && (
        <ul className="kortliste papirliste">
          {eide.map((id) => {
            const b = s.beholdning[id]!
            const v = b.antall * s.marked.kurser[id].kurs
            return (
              <li key={id}>
                <button className="kort papirrad eid" onClick={() => velg(id)}>
                  <Papirlogo id={id} størrelse={36} />
                  <span className="papirrad-navn">
                    <strong>{PAPIRER[id].navn}</strong>
                    <span className="dempet liten">
                      {id} · {fmtAntall(b.antall)} {PAPIRER[id].enhet ?? ord.enhet}
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

      {/* Pakke 84: det du eier, står over; her bare resten, så hver står én gang. */}
      <h2 className="seksjon-tittel">
        {eide.length === 0 ? ord.alle : ord.andre} <Forklaring tema={ord.tema} />
      </h2>
      {andre.length === 0 && <p className="dempet liten">Du eier {ord.eier} på børsen.</p>}
      <ul className="kortliste papirliste">
        {andre.map((id) => {
          const p = PAPIRER[id]
          const e = endringTo(s, id)
          return (
            <li key={id}>
              <button className="kort papirrad" onClick={() => velg(id)}>
                <Papirlogo id={id} størrelse={36} />
                <span className="papirrad-navn">
                  <strong>{p.navn}</strong>
                  <span className="dempet liten">
                    {id} · {klasse === 'ravare' ? `Per ${p.enhet}` : klasse !== 'aksje' ? 'Krypto' : utbyttetekst(s, id) ? `${RISIKO_KORT[p.risiko]} · ${utbyttetekst(s, id)}` : RISIKO_TEKST[p.risiko]}
                  </span>
                </span>
                <Minigraf verdier={s.marked.kurser[id].historikk} />
                <span className="papirrad-kurs">
                  <Tikkekurs verdi={s.marked.kurser[id].kurs} format={fmtKurs} />
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

/** «Olje ×1,08 · Laks ×0,93» over råvarelista: der prisene står mot sitt vanlige nivå, og hva det betyr (Pakke 124). */
function Ravarenivaa({ s }: { s: Spilltilstand }) {
  return (
    <p className="kort liten ravarenivaa">
      {(['OLJ', 'LAK'] as const).map((id, i) => (
        <span key={id}>
          {i > 0 && ' · '}
          {PAPIRER[id].navn} <strong>×{tall(ravarenivaa(s, id), 2)}</strong>
        </span>
      ))}
      <br />
      <span className="dempet">Mot vanlig nivå. Oljeselskapet og fiskeoppdrettet tjener i takt med prisen. Gullet går mot aksjene: det stiger i lavkonjunktur.</span>
    </p>
  )
}

/** På råvarens side: hvilken bransje som følger den, og hva det gir nå. */
function Ravarebransje({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const type = (Object.keys(RAVARE_FOR) as BedriftstypeId[]).find((t) => RAVARE_FOR[t] === id)
  if (!type) {
    return <p className="kort liten dempet">Gullet går mot konjunkturen: når aksjene faller i en lavkonjunktur, stiger det — et sted å stå trygt.</p>
  }
  const eier = s.bedrifter.some((b) => b.type === type)
  const f = ravarenivaa(s, id)
  return (
    <p className="kort liten">
      {BEDRIFTSTYPER[type].navn} følger prisen: inntekten ganges med <strong>×{tall(f, 2)}</strong> nå, der prisen står mot sitt vanlige nivå.{' '}
      <span className="dempet">{eier ? 'Ditt eget kjøp løfter ikke inntekten — den følger markedets pris uten ditt kurstrykk.' : 'Du eier ingen ennå.'}</span>
    </p>
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

export function Papirdetalj({ s, id, tilbake }: { s: Spilltilstand; id: PapirId; tilbake: () => void }) {
  const p = PAPIRER[id]
  const k = s.marked.kurser[id]
  const e = endringTo(s, id)
  const eier = s.beholdning[id]
  const steg = HISTORIKK_TIKK * MARKED_TIKK_SEK
  const voks = useVoksUt<HTMLElement>()

  return (
    <section className="skjerm detalj" ref={voks}>
      <button className="tilbake" onClick={tilbake}>
        ‹ {p.klasse === 'aksje' ? 'Aksjer' : p.klasse === 'ravare' ? 'Råvarer' : 'Krypto'}
      </button>
      <div className="kort">
        <div className="detalj-topp papir-topp">
          <Papirlogo id={id} størrelse={40} ordmerke />
          <div>
            <h1 className="skjerm-tittel">{p.navn}</h1>
            <span className="dempet liten">
              {id} · {RISIKO_TEKST[p.risiko]}
              {utbyttetekst(s, id) && ` · Utbytte ${utbyttetekst(s, id)}`}
            </span>
          </div>
        </div>
        <div className="detalj-kurs">
          <Tikkekurs verdi={k.kurs} format={fmtKurs} className="tall-kjempe" />
          <span className={e >= 0 ? 'pluss' : 'minus'}>{endring(e)} siste {varighet(k.historikk.length * steg)}</span>
        </div>
        <Kursgraf s={s} id={id} />
      </div>
      <Nokkeltall s={s} id={id} />
      <PapirBransje s={s} id={id} />
      {p.klasse === 'ravare' && <Ravarebransje s={s} id={id} />}

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
  // «Maks» er ikke et fast tall: det følger kursen og kontantene, så kjøpet aldri avvises fordi kursen steg.
  const [alt, settAlt] = useState(false)
  const eier = s.beholdning[id]?.antall ?? 0
  // Én ordre kan høyst doble eller halvere kursen (Pakke 56); «Maks» stopper der.
  const tak = maksPerOrdre(s, id, modus)
  const maks = Math.min(modus === 'kjop' ? maksKjop(s, id) : eier, tak)
  const ønsket = alt ? maks : rundAntall(id, Number(tekst.replace(',', '.')) || 0)
  const a = modus === 'selg' ? Math.min(ønsket, eier) : ønsket
  const fortegn = modus === 'kjop' ? 1 : -1
  const pris = a > 0 ? handelskurs(s, id, fortegn * a) : 0
  const sum = a * pris * (1 + fortegn * KURTASJE)
  const trykk = a > 0 ? Math.abs(Math.expm1(kurstrykk(s, id, fortegn * a))) : 0

  const velgAndel = (andel: number) => {
    settAlt(andel === 1)
    const n = rundAntall(id, maks * andel)
    settTekst(andel < 1 && n > 0 ? String(n) : '')
    settFeil(null)
  }

  const nullstill = () => {
    settTekst('')
    settAlt(false)
    settFeil(null)
  }

  const utførHandel = () => {
    const u = modus === 'kjop' ? kjopPapir(s, id, a) : selgPapir(s, id, a)
    const f = utfor(u, true)
    settFeil(f)
    if (!f) {
      settTekst('')
      settAlt(false)
    }
  }

  return (
    <div className="kort handel">
      <div className="segment">
        <button className={modus === 'kjop' ? 'aktiv' : ''} onClick={() => { settModus('kjop'); nullstill() }}>
          Kjøp
        </button>
        <button className={modus === 'selg' ? 'aktiv' : ''} disabled={eier === 0} onClick={() => { settModus('selg'); nullstill() }}>
          Selg
        </button>
      </div>

      <label className="felt">
        <span className="etikett">Antall {PAPIRER[id].klasse === 'krypto' && '(brøkdeler går fint)'}</span>
        <input
          inputMode="decimal"
          value={alt ? (maks > 0 ? String(maks) : '') : tekst}
          placeholder="0"
          onChange={(e) => {
            settTekst(e.target.value)
            settAlt(false)
            settFeil(null)
          }}
        />
      </label>

      <div className="andelsknapper">
        {[0.25, 0.5, 1].map((andel) => (
          <button key={andel} className={alt && andel === 1 ? 'knapp knapp-liten aktiv' : 'knapp knapp-liten'} aria-pressed={andel === 1 ? alt : undefined} disabled={maks <= 0} onClick={() => velgAndel(andel)}>
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

      {maks === tak && maks > 0 && (
        <p className="dempet liten">Høyst {fmtAntall(tak)} i én ordre — mer ville {modus === 'kjop' ? 'doblet' : 'halvert'} kursen. Resten kan tas i neste.</p>
      )}
      {feil && <p className="feilmelding">{feil}</p>}
      <button className="knapp knapp-gull" disabled={a <= 0 || a > maks} onClick={utførHandel}>
        {modus === 'kjop' ? 'Kjøp' : 'Selg'} {a > 0 ? fmtAntall(a) : ''}
      </button>
    </div>
  )
}

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
    const f = utfor(nyOrdre(s, id, type, grenseTall, lesTall(antall)), true)
    settFeil(f)
    if (!f) settAntall(type === 'kjop' ? '' : String(eier))
  }

  return (
    <div className="kort ordrer">
      <h2 className="kort-tittel">
        Automatiske ordrer <Forklaring tema="ordre" />
      </h2>
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
