import { EIENDOMSSTIGEN, EIENDOMSTYPER } from '../../engine/eiendom'
import { eiendomSynlig, jordSynlig } from '../../engine/handlinger'
import { HOST_ANDEL, JORD, JORDLISTE, landverdi, vaer } from '../../engine/jord'
import { dagnummer } from '../../engine/kalender'
import { eierDu, landemerkepris, LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { REGIONER, regionFor } from '../../engine/regioner'
import type { By, EiendomId, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { endring, kortKroner, perSek } from '../format'
import { leieIBy, trendFor } from '../kart'
import { Eiendomskort } from './Eiendomskort'
import { Ikon } from './Ikoner'
import { Jordkort, Landemerkekort } from './JordOgLandemerker'

/** Landemerkene vises når de første er innen rekkevidde — samme grense som i lista. */
const landemerkerSynlige = (s: Spilltilstand) => s.hoyesteFormue >= LANDEMERKER.fyret.pris * 0.25

/** Alt som er å se i en by: bygg, jord og landemerker du eier eller kan kjøpe. */
export function iByen(s: Spilltilstand, by: By): { bygg: EiendomId[]; jord: JordId[]; merker: LandemerkeId[] } {
  return {
    bygg: EIENDOMSSTIGEN.filter((id) => EIENDOMSTYPER[id].by === by && ((s.eiendommer[id] ?? 0) > 0 || eiendomSynlig(s, id))),
    jord: JORDLISTE.filter((id) => JORD[id].by === by && (!!s.jord[id] || jordSynlig(s, id))),
    merker: landemerkerSynlige(s) ? LANDEMERKELISTE.filter((id) => LANDEMERKER[id].by === by) : [],
  }
}

/** Byene som har noe å vise — i rekkefølgen de står i spillet. */
export function byerMedInnhold(s: Spilltilstand, byer: readonly By[]): By[] {
  return byer.filter((by) => {
    const i = iByen(s, by)
    return i.bygg.length + i.jord.length + i.merker.length > 0
  })
}

/**
 * Én by om gangen: et kort med det du eier der, leien og prisene i regionen,
 * og under det bare byens bygg, jord og landemerker.
 */
export function Byvisning({ s, by, lukk, gatebilde }: { s: Spilltilstand; by: By; lukk: () => void; gatebilde: () => void }) {
  const { bygg, jord, merker } = iByen(s, by)
  const mineMerker = merker.filter((id) => eierDu(s, id))
  const eid = bygg.reduce((n, id) => n + (s.eiendommer[id] ?? 0), 0) + jord.filter((id) => s.jord[id]).length + mineMerker.length
  const leie = leieIBy(s, by) + mineMerker.reduce((sum, id) => sum + (landemerkepris(s, id) * LANDEMERKER[id].avkastning) / 3600, 0)
  const trend = trendFor(s, by)
  const region = regionFor(by)
  // Jord gir avling hver mandag og har egne priser — en by med bare jord viser avlingen, ikke leie og boligpriser.
  const bareJord = bygg.length + merker.length === 0
  const faktor = vaer(dagnummer(s.sek)).faktor
  const avling = jord.filter((id) => s.jord[id] && JORD[id].type === 'gard').reduce((sum, id) => sum + landverdi(s, id) * HOST_ANDEL * faktor, 0)

  return (
    <>
      <div className="kort byvisning">
        <div className="maal-topp">
          <h2 className="skjerm-tittel">{by}</h2>
          <button className="knapp knapp-liten" onClick={lukk}>
            Alle byer
          </button>
        </div>
        <dl className="byvisning-tall">
          <div>
            <dt className="etikett">Eier her</dt>
            <dd>{eid}</dd>
          </div>
          {bareJord ? (
            <div>
              <dt className="etikett">Avling denne uka</dt>
              <dd className={avling > 0 ? 'pluss' : 'dempet'}>{avling > 0 ? `+${kortKroner(avling)}` : '—'}</dd>
            </div>
          ) : (
            <>
              <div>
                <dt className="etikett">Leie</dt>
                <dd className={leie > 0 ? 'pluss' : 'dempet'}>{perSek(leie)}</dd>
              </div>
              <div>
                <dt className="etikett">Priser · {region ? REGIONER[region].navn : 'landet'}</dt>
                <dd className={trend >= 0 ? 'pluss' : 'minus'}>{endring(trend)}</dd>
              </div>
            </>
          )}
        </dl>
        <button className="knapp knapp-liten" onClick={gatebilde}>
          <Ikon navn="sok" størrelse={14} /> Gatebildet
        </button>
      </div>

      {bygg.length > 0 && (
        <>
          <h2 className="seksjon-tittel">Boliger og bygg</h2>
          <ul className="kortliste">
            {bygg.map((id) => (
              <Eiendomskort key={id} s={s} id={id} />
            ))}
          </ul>
        </>
      )}
      {jord.length > 0 && (
        <>
          <h2 className="seksjon-tittel">Jord og skog</h2>
          <ul className="kortliste">
            {jord.map((id) => (
              <Jordkort key={id} s={s} id={id} />
            ))}
          </ul>
        </>
      )}
      {merker.length > 0 && (
        <>
          <h2 className="seksjon-tittel">Landemerker</h2>
          <ul className="kortliste">
            {merker.map((id) => (
              <Landemerkekort key={id} s={s} id={id} />
            ))}
          </ul>
        </>
      )}
      {bygg.length + jord.length + merker.length === 0 && <p className="kort kort-tomt">Ingenting til salgs i {by} ennå.</p>}
    </>
  )
}
