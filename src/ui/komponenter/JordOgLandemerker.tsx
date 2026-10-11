import { hoggSkog, jordSynlig, kjopJord, kjopJorde, kjopLandemerke, kjopMaskin, selgJord, selgLandemerke } from '../../engine/handlinger'
import { Bekreftknapp } from './Bekreftknapp'
import {
  GARDSTRINN,
  gardstrinn,
  HOST_ANDEL,
  JORD,
  JORD_SYNLIG_VED,
  JORDLISTE,
  jorder,
  landverdi,
  MAKS_JORDER,
  MASKINER,
  MASKINLISTE,
  maskinpris,
  nesteJordpris,
  skogalder,
  tommerverdi,
  ukensGardHost,
  vaer,
} from '../../engine/jord'
import {
  eierDu,
  kjopsprisLandemerke,
  LANDEMERKE_HONORAR,
  LANDEMERKELISTE,
  LANDEMERKER,
  landemerkepris,
  rivalerSomKan,
  TILBAKEKJOP_PREMIE,
} from '../../engine/landemerker'
import { MEGLERHONORAR } from '../../engine/eiendom'
import { DAG_SEK, dagnummer, ukedag } from '../../engine/kalender'
import type { By, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall } from '../format'
import { Apneknapp, BedriftIkon, Scene } from './BedriftIkon'
import { trykkApner } from '../detaljvisning'
import { Seksjon } from './Seksjon'

/** Gårder og skoger — filtrert på by når en by er valgt på kartet. */
export function Jordliste({ s, by }: { s: Spilltilstand; by: By | null }) {
  const synlige = JORDLISTE.filter((id) => (s.jord[id] || jordSynlig(s, id)) && (!by || JORD[id].by === by))
  const neste = JORDLISTE.find((id) => !jordSynlig(s, id))
  if (synlige.length === 0 && (by || !neste)) return null
  const v = vaer(dagnummer(s.sek))
  const eide = JORDLISTE.filter((id) => s.jord[id]).length
  return (
    <Seksjon id="eiendom-jord" tittel="Jord og skog" forklaring="jord" sammendrag={`${eide} av ${JORDLISTE.length} eid`} harInnhold={eide > 0 || !!by}>
      <p className="dempet liten">
        Ukas vær: <strong>{v.navn.toLowerCase()}</strong>. Gårdene høstes mandag morgen.
      </p>
      <ul className="kortliste">
        {synlige.map((id) => (
          <Jordkort key={id} s={s} id={id} />
        ))}
        {!by && neste && (
          <li className="kort kjopskort laast">
            <BedriftIkon type={neste} dempet />
            <div className="bedriftskort-midt">
              <h2>{JORD[neste].navn}</h2>
              <span className="dempet liten">Til salgs når nettoformuen har vært {kortKroner(JORD[neste].pris * JORD_SYNLIG_VED)}</span>
            </div>
          </li>
        )}
      </ul>
    </Seksjon>
  )
}

/** Kortet for en gård eller skog. Avlingen er ukas, for dagene du eier gården. Et trykk åpner detaljsiden (`iDetalj`). */
export function Jordkort({ s, id, iDetalj = false }: { s: Spilltilstand; id: JordId; iDetalj?: boolean }) {
  const t = JORD[id]
  const eid = s.jord[id]
  const land = landverdi(s, id)
  const tommer = tommerverdi(s, id)
  // Pakke 92: jordene og maskinene teller i verdien og følger med i salget.
  const bygd = eid?.investert ?? 0
  const gard = t.type === 'gard'
  return (
    <li className={`kort bedriftskort${eid ? ' eid' : ''}${iDetalj ? '' : ' kan-aapnes'}`} onClick={iDetalj ? undefined : trykkApner({ slag: 'jord', id })}>
      {iDetalj && <Scene type={id} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'jord', id }} navn={t.navn}>
            <BedriftIkon type={id} stor />
          </Apneknapp>
        )}
        <div className="bedriftskort-midt">
          <h2>{t.navn}</h2>
          <span className="dempet">
            {eid && gard ? `${GARDSTRINN[gardstrinn(eid)].navn} · ${jorder(eid)} av ${MAKS_JORDER} jorder` : t.sted}
          </span>
        </div>
        <div className="eiendom-tall">
          <span>{kortKroner(land + tommer + bygd)}</span>
          <span className="dempet liten">{eid ? 'verdi' : 'pris'}</span>
        </div>
      </div>
      <p className="dempet liten">
        {t.type === 'gard'
          ? eid
            ? `Avling denne uka: omtrent ${kortKroner(ukensGardHost(s, id))}`
            : `Gir omtrent ${kortKroner(land * HOST_ANDEL)} i uka i et normalt år`
          : eid
            ? `Tømmer ${kortKroner(tommer)} etter ${tall(skogalder(s, id))} dager`
            : 'Kjøpes nyplantet. Tømmeret vokser fra første dag.'}
      </p>
      {eid ? (
        <div className={t.type === 'skog' ? 'eiendom-knapper' : 'eiendom-knapper en'}>
          {t.type === 'skog' && (
            <button className="knapp knapp-gull" disabled={tommer < 1} onClick={() => utfor(hoggSkog(s, id))}>
              Hogg · {kortKroner(tommer)}
            </button>
          )}
          <Bekreftknapp onJa={() => utfor(selgJord(s, id))}>
            Selg · {kortKroner((land + tommer + bygd) * (1 - MEGLERHONORAR))}
          </Bekreftknapp>
        </div>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < land} onClick={() => utfor(kjopJord(s, id))}>
          Kjøp · {kortKroner(land)}
        </button>
      )}
    </li>
  )
}

/** Det som vokser på hver jord, i fast rekkefølge. */
const AVLINGER = ['Bygg', 'Hvete', 'Havre', 'Poteter', 'Rug', 'Gulrøtter', 'Jordbær', 'Raps', 'Kål', 'Epler']

/**
 * Gårdens kart (Pakke 92), på gårdens side: jordene som ruter — hva som vokser og hvor
 * langt det er kommet mot mandagens høst — og der neste jord kan legges til. Under
 * kartet maskinene. Trinnet (småbruk → gods) står øverst, med hva neste trinn gir.
 */
export function Gardskart({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j || JORD[id].type !== 'gard') return null
  const n = jorder(j)
  const trinn = gardstrinn(j)
  const neste = GARDSTRINN[trinn + 1]
  const pris = nesteJordpris(s, id)
  // Hvor langt uka er kommet: avlingen høstes mandag morgen.
  const vekst = (ukedag(s.sek) + (s.sek % DAG_SEK) / DAG_SEK) / 7
  return (
    <li className="kort gardskart">
      <div className="maal-topp">
        <h2 className="kort-tittel">{GARDSTRINN[trinn].navn}</h2>
        <span className="dempet liten">
          {n} av {MAKS_JORDER} jorder
        </span>
      </div>
      <p className="dempet liten">
        {neste ? `${neste.navn} ved ${neste.fra} jorder: +${neste.status} status.` : 'Gården er et gods: alle jordene er dyrket.'} Høsten mandag morgen.
      </p>
      <ul className="jordruter">
        {Array.from({ length: MAKS_JORDER }, (_, i) => {
          if (i < n) {
            return (
              <li key={i} className="jordrute dyrket">
                <span className="jordrute-navn">{AVLINGER[i]}</span>
                <span className="jordrute-spor" aria-hidden="true">
                  <span style={{ width: `${Math.round(vekst * 100)}%` }} />
                </span>
              </li>
            )
          }
          if (i === n && pris !== null) {
            return (
              <li key={i}>
                <button className="jordrute ny" disabled={s.kontanter < pris} onClick={() => utfor(kjopJorde(s, id))} aria-label={`Dyrk jord ${i + 1} for ${kortKroner(pris)}`}>
                  <span className="jordrute-pluss" aria-hidden="true">
                    +
                  </span>
                  {/* «261 mill» — «kr» får ikke plass i ruta; hele prisen står i navnet på knappen. */}
                  <span className="jordrute-navn">{kortKroner(pris).replace(/^kr\s/, '')}</span>
                </button>
              </li>
            )
          }
          return <li key={i} className="jordrute laast" aria-hidden="true" />
        })}
      </ul>
      {MASKINLISTE.map((m) => {
        const eier = !!j.maskiner?.[m]
        const mp = maskinpris(s, id, m)
        return (
          <div key={m} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{MASKINER[m].navn}</strong>
              <br />
              <span className="dempet">{MASKINER[m].tekst}</span>
            </p>
            {eier ? (
              <span className="merke ok">Kjøpt</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < mp} onClick={() => utfor(kjopMaskin(s, id, m))}>
                Kjøp · {kortKroner(mp)}
              </button>
            )}
          </div>
        )
      })}
    </li>
  )
}

/** De fire landemerkene: til salgs, dine, eller eid av en rival. */
export function Landemerkeliste({ s }: { s: Spilltilstand }) {
  // Landemerkene vises når de første er innen rekkevidde.
  if (s.hoyesteFormue < LANDEMERKER.fyret.pris * 0.25) return null
  const mine = LANDEMERKELISTE.filter((id) => eierDu(s, id)).length
  return (
    <Seksjon id="eiendom-landemerker" tittel="Landemerker" forklaring="landemerker" sammendrag={`${mine} av ${LANDEMERKELISTE.length}`} harInnhold={mine > 0}>
      <ul className="kortliste">
        {LANDEMERKELISTE.map((id) => (
          <Landemerkekort key={id} s={s} id={id} />
        ))}
      </ul>
    </Seksjon>
  )
}

export function Landemerkekort({ s, id, iDetalj = false }: { s: Spilltilstand; id: LandemerkeId; iDetalj?: boolean }) {
  const l = LANDEMERKER[id]
  const mitt = eierDu(s, id)
  const e = s.landemerker[id]
  const rival = e && !mitt ? s.rivaler.find((r) => r.id === e.eier) : undefined
  const pris = kjopsprisLandemerke(s, id)
  const verdi = landemerkepris(s, id)
  const truet = !e && rivalerSomKan(s, id).length > 0
  return (
    <li className={`kort bedriftskort${mitt ? ' eid' : ''}${iDetalj ? '' : ' kan-aapnes'}`} onClick={iDetalj ? undefined : trykkApner({ slag: 'landemerke', id })}>
      {iDetalj && <Scene type={id} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'landemerke', id }} navn={l.navn}>
            <BedriftIkon type={id} stor />
          </Apneknapp>
        )}
        <div className="bedriftskort-midt">
          <h2>{l.navn}</h2>
          <span className="dempet">{l.sted}</span>
        </div>
        <div className="eiendom-tall">
          <span className="pluss">{perSek((verdi * l.avkastning) / 3600)}</span>
          <span className="gull liten">+{l.status} status</span>
        </div>
      </div>
      <p className="dempet liten">
        {mitt
          ? 'Ditt. Leien kommer hvert sekund.'
          : rival
            ? `Eies av ${rival.navn}. Du må betale ${tall((TILBAKEKJOP_PREMIE - 1) * 100)} % over verdien.`
            : truet
              ? 'Til salgs — og en rival har råd. Det kan være borte i morgen.'
              : 'Til salgs.'}
      </p>
      {mitt ? (
        <Bekreftknapp className="knapp bred" onJa={() => utfor(selgLandemerke(s, id))}>
          Selg · {kortKroner(verdi * (1 - LANDEMERKE_HONORAR))}
        </Bekreftknapp>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < pris} onClick={() => utfor(kjopLandemerke(s, id))}>
          {rival ? 'Kjøp fra rivalen' : 'Kjøp'} · {kortKroner(pris)}
        </button>
      )}
    </li>
  )
}
