import { Bekreftknapp } from './Bekreftknapp'
import { dagsbilde, EIENDOMSVAER, VAERTYPER } from '../../engine/verden'
import {
  EIENDOMSTYPER,
  eiendomspris,
  flyFor,
  kanReiseTil,
  LUKSUS,
  leieHverPerSek,
  MEGLERHONORAR,
  oppussingspris,
  SESONGER,
  standard,
  STANDARDER,
  statusnivaa,
} from '../../engine/eiendom'
import { kjopEiendom, pussOpp, selgEiendom } from '../../engine/handlinger'
import type { EiendomId, Spilltilstand } from '../../engine/types'
import { dagnummer, dato, MÅNEDER } from '../../engine/kalender'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall, varighet } from '../format'
import { Apneknapp, BedriftIkon, Scene } from './BedriftIkon'
import { NyMerke } from './Kjopsglimt'
import { Ikon } from './Ikoner'
import { trykkApner } from '../detaljvisning'

/**
 * Kortet for én eiendomstype: leie, standard, og knappene for å kjøpe, selge og pusse opp. Brukes i lista og i gatebildet.
 * Et trykk åpner detaljsiden; der står kortet selv under den store scenen (`iDetalj`).
 */
export function Eiendomskort({ s, id, iDetalj = false }: { s: Spilltilstand; id: EiendomId; iDetalj?: boolean }) {
  const t = EIENDOMSTYPER[id]
  const eier = s.eiendommer[id] ?? 0
  const pris = eiendomspris(s, id)
  const st = standard(s, id)
  const fullt = eier >= t.maksAntall
  const manglerStatus = statusnivaa(s) < t.statuskrav
  const fly = flyFor(id)
  const manglerFly = !kanReiseTil(s, id)
  const oppussing = s.oppussing[id]
  const oppussingPris = oppussingspris(s, id)
  const nesteStandard = STANDARDER[st + 1]

  return (
    <li className={iDetalj ? 'kort bedriftskort' : 'kort bedriftskort kan-aapnes'} data-ny={id} onClick={iDetalj ? undefined : trykkApner({ slag: 'eiendom', id })}>
      {iDetalj && <Scene type={id} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'eiendom', id }} navn={t.navn}>
            <span className="bilde-med-brikke">
              <BedriftIkon type={id} stor />
              {eier > 0 && (
                <span className="brikke gull" aria-label={`${eier} av ${t.maksAntall} eid`}>
                  {eier}/{t.maksAntall}
                </span>
              )}
            </span>
          </Apneknapp>
        )}
        <div className="bedriftskort-midt">
          <h2>
            {t.navn}
            <NyMerke id={id} />
            {st > 0 && <span className={st === 1 ? 'merke info' : 'merke gull'}>{STANDARDER[st].navn}</span>}
          </h2>
          <span className="dempet">{t.sted}</span>
        </div>
        <div className="eiendom-tall">
          {oppussing ? <span className="dempet">Ingen leie</span> : <span className="pluss">{perSek(leieHverPerSek(s, id))}</span>}
          <span className="dempet liten">per enhet</span>
        </div>
      </div>
      {t.sesong && <Sesong s={s} sesong={t.sesong} />}
      <Eiendomsvaer s={s} id={id} />
      {/* Avkastningen og kravene trengs bare så lenge det er noe igjen å kjøpe. */}
      {!fullt && (
        <p className="dempet liten">
          Avkastning {tall(t.avkastning * STANDARDER[st].leie * 100)} % per time
          {t.statuskrav > 0 && ` · krever statusnivå ${t.statuskrav}`}
          {fly && ` · krever ${LUKSUS[fly].navn.toLowerCase()}`}
        </p>
      )}

      {oppussing ? (
        <div className="oppussing-pågår">
          <span>
            <Ikon navn="kran" størrelse={16} /> Pusses opp til <strong>{STANDARDER[oppussing.standard].navn.toLowerCase()}</strong>
          </span>
          <span className="dempet liten">Ferdig om {varighet(Math.max(0, oppussing.ferdigSek - s.sek))} · ingen leie så lenge</span>
        </div>
      ) : (
        <>
          <div className={eier > 0 ? 'eiendom-knapper' : 'eiendom-knapper en'}>
            <button
              className="knapp knapp-gull"
              disabled={fullt || manglerStatus || manglerFly || s.kontanter < pris}
              onClick={() => utfor(kjopEiendom(s, id))}
            >
              {fullt
                ? 'Alle kjøpt'
                : manglerStatus
                  ? `Krever status ${t.statuskrav}`
                  : manglerFly && fly
                    ? `Krever ${LUKSUS[fly].navn.toLowerCase()}`
                    : `Kjøp · ${kortKroner(pris)}`}
            </button>
            {eier > 0 && (
              <Bekreftknapp
                bekreft={eier === 1}
                varsel={st > 0 || s.oppussing[id] ? 'Standarden og oppussingen forsvinner med den siste.' : undefined}
                onJa={() => utfor(selgEiendom(s, id))}
              >
                Selg · {kortKroner(pris * (1 - MEGLERHONORAR))}
              </Bekreftknapp>
            )}
          </div>
          {eier > 0 && nesteStandard && oppussingPris !== null && (
            <button className="knapp knapp-oppussing" disabled={s.kontanter < oppussingPris} onClick={() => utfor(pussOpp(s, id))}>
              <span>
                Pusse opp til {nesteStandard.navn.toLowerCase()} · +{tall((nesteStandard.leie / STANDARDER[st].leie - 1) * 100)} % leie ·{' '}
                {nesteStandard.dager} dager
              </span>
              <strong>{kortKroner(oppussingPris)}</strong>
            </button>
          )}
        </>
      )}
    </li>
  )
}

const BEST: Record<'sommer' | 'vinter', string> = { sommer: 'best juni–august', vinter: 'best desember–mars' }

/** Været i dag for eiendom som merker det (Pakke 54): «Snø i dag · leie +22 %», «Sol i Syden i dag · leie +15 %». */
function Eiendomsvaer({ s, id }: { s: Spilltilstand; id: EiendomId }) {
  const e = EIENDOMSVAER[id]
  if (!e) return null
  const d = dagsbilde(s)
  const vaer = e.sted === 'norge' ? d.vaer : d.vaerUte[e.sted]
  const f = d.eiendom[id] ?? 1
  const sted = e.sted === 'norge' ? '' : e.sted === 'alpene' ? ' i Alpene' : ' i Syden'
  return (
    <span className={`i-dag liten ${f > 1.02 ? 'pluss' : f < 0.98 ? 'minus' : 'dempet'}`}>
      {VAERTYPER[vaer].navn}{sted} i dag
      {Math.abs(f - 1) >= 0.02 && ` · leie ${f > 1 ? '+' : '−'}${tall(Math.abs(f - 1) * 100)} %`}
    </span>
  )
}

/**
 * Sesongen for en feriebolig: hvor i året vi er, hva leien ganges med nå, og
 * året som tolv små søyler med denne måneden markert.
 */
function Sesong({ s, sesong }: { s: Spilltilstand; sesong: 'sommer' | 'vinter' }) {
  const maaned = dato(dagnummer(s.sek)).maaned
  const faktorer = SESONGER[sesong]
  const f = faktorer[maaned]
  const navn = f >= 1.4 ? 'Høysesong' : f <= 0.7 ? 'Lavsesong' : 'Mellomsesong'
  const høyest = Math.max(...faktorer)
  return (
    <div className="sesong">
      <span className={`merke ${f >= 1.4 ? 'ok' : f <= 0.7 ? 'kant' : 'info'}`}>{navn}</span>
      <span className="dempet liten">
        Leie ×{tall(f, 1)} i {MÅNEDER[maaned]} · {BEST[sesong]}
      </span>
      <span className="sesong-aar" aria-hidden="true">
        {faktorer.map((x, i) => (
          <span key={i} className={i === maaned ? 'naa' : ''} style={{ height: `${(x / høyest) * 100}%` }} />
        ))}
      </span>
    </div>
  )
}
