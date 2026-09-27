import { hoggSkog, jordSynlig, kjopJord, kjopLandemerke, selgJord, selgLandemerke } from '../../engine/handlinger'
import { HOST_ANDEL, JORD, JORD_SYNLIG_VED, JORDLISTE, landverdi, skogalder, TOMMER_DAGER, tommerverdi, vaer } from '../../engine/jord'
import {
  eierDu,
  kjopsprisLandemerke,
  LANDEMERKE_HONORAR,
  LANDEMERKELISTE,
  LANDEMERKER,
  landemerkepris,
  RIVAL_KJOPER_VED,
  rivalerSomKan,
  TILBAKEKJOP_PREMIE,
} from '../../engine/landemerker'
import { MEGLERHONORAR } from '../../engine/eiendom'
import { dagnummer } from '../../engine/kalender'
import type { By, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall } from '../format'
import { BedriftIkon } from './BedriftIkon'

/** Gårder og skoger — filtrert på by når en by er valgt på kartet. */
export function Jordliste({ s, by }: { s: Spilltilstand; by: By | null }) {
  const synlige = JORDLISTE.filter((id) => (s.jord[id] || jordSynlig(s, id)) && (!by || JORD[id].by === by))
  const neste = JORDLISTE.find((id) => !jordSynlig(s, id))
  if (synlige.length === 0 && (by || !neste)) return null
  const v = vaer(dagnummer(s.sek))
  return (
    <>
      <h2 className="seksjon-tittel">Jord og skog</h2>
      <p className="dempet liten">
        Gårdene høstes hver mandag morgen, etter ukas vær. Denne uka: <strong>{v.navn.toLowerCase()}</strong>. Skogen gir ingenting før
        du hogger — tømmeret vokser raskest de første {TOMMER_DAGER} dagene.
      </p>
      <ul className="kortliste">
        {synlige.map((id) => (
          <Jordkort key={id} s={s} id={id} faktor={v.faktor} />
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
    </>
  )
}

function Jordkort({ s, id, faktor }: { s: Spilltilstand; id: JordId; faktor: number }) {
  const t = JORD[id]
  const eid = s.jord[id]
  const land = landverdi(s, id)
  const tommer = tommerverdi(s, id)
  return (
    <li className={eid ? 'kort bedriftskort eid' : 'kort bedriftskort'}>
      <div className="bedriftskort-topp">
        <BedriftIkon type={id} />
        <div className="bedriftskort-midt">
          <h2>{t.navn}</h2>
          <span className="dempet">{t.sted}</span>
        </div>
        <div className="eiendom-tall">
          <span>{kortKroner(land + tommer)}</span>
          <span className="dempet liten">{eid ? 'verdi' : 'pris'}</span>
        </div>
      </div>
      <p className="dempet liten">
        {t.type === 'gard'
          ? eid
            ? `Avling denne uka: omtrent ${kortKroner(land * HOST_ANDEL * faktor)}`
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
          <button className="knapp" onClick={() => utfor(selgJord(s, id))}>
            Selg · {kortKroner((land + tommer) * (1 - MEGLERHONORAR))}
          </button>
        </div>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < land} onClick={() => utfor(kjopJord(s, id))}>
          Kjøp · {kortKroner(land)}
        </button>
      )}
    </li>
  )
}

/** De fire landemerkene: til salgs, dine, eller eid av en rival. */
export function Landemerkeliste({ s }: { s: Spilltilstand }) {
  // Landemerkene vises når de første er innen rekkevidde.
  if (s.hoyesteFormue < LANDEMERKER.fyret.pris * 0.25) return null
  return (
    <>
      <h2 className="seksjon-tittel">Landemerker</h2>
      <p className="dempet liten">
        Det finnes bare ett av hvert. En rival med over {RIVAL_KJOPER_VED} ganger prisen i formue kan kjøpe det når som helst — da må du by
        over for å få det.
      </p>
      <ul className="kortliste">
        {LANDEMERKELISTE.map((id) => (
          <Landemerkekort key={id} s={s} id={id} />
        ))}
      </ul>
    </>
  )
}

function Landemerkekort({ s, id }: { s: Spilltilstand; id: LandemerkeId }) {
  const l = LANDEMERKER[id]
  const mitt = eierDu(s, id)
  const e = s.landemerker[id]
  const rival = e && !mitt ? s.rivaler.find((r) => r.id === e.eier) : undefined
  const pris = kjopsprisLandemerke(s, id)
  const verdi = landemerkepris(s, id)
  const truet = !e && rivalerSomKan(s, id).length > 0
  return (
    <li className={mitt ? 'kort bedriftskort eid' : 'kort bedriftskort'}>
      <div className="bedriftskort-topp">
        <BedriftIkon type={id} />
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
        <button className="knapp bred" onClick={() => utfor(selgLandemerke(s, id))}>
          Selg · {kortKroner(verdi * (1 - LANDEMERKE_HONORAR))}
        </button>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < pris} onClick={() => utfor(kjopLandemerke(s, id))}>
          {rival ? 'Kjøp fra rivalen' : 'Kjøp'} · {kortKroner(pris)}
        </button>
      )}
    </li>
  )
}
