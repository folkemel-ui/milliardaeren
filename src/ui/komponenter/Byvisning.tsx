import { BYEIER_BONUS, EIENDOMSSTIGEN, EIENDOMSTYPER, eierHeleByen, enheterI } from '../../engine/eiendom'
import { eiendomSynlig, jordSynlig } from '../../engine/handlinger'
import { JORD, JORDLISTE, ukensGardHost } from '../../engine/jord'
import { eierDu, landemerkepris, LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { REGIONER, regionFor } from '../../engine/regioner'
import { kronekurs, valutaendring, valutaForBy } from '../../engine/valuta'
import { DAG_SEK } from '../../engine/kalender'
import type { By, EiendomId, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { endring, kortKroner, perSek, tall } from '../format'
import { leieIBy, trendFor } from '../kart'
import { Eiendomskort } from './Eiendomskort'
import { Forvalterkort } from './Forvalter'
import { Ikon } from './Ikoner'
import { Jordkort, Landemerkekort } from './JordOgLandemerker'

const UKE_SEK = 7 * DAG_SEK

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
  // Utlandet handles i landets valuta (Pakke 59): pris, verdi og leie følger kursen.
  const valuta = valutaForBy(by)
  const avling = jord.filter((id) => s.jord[id] && JORD[id].type === 'gard').reduce((sum, id) => sum + ukensGardHost(s, id), 0)

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
              {valuta && (
                <div>
                  <dt className="etikett">1 {valuta} · siste uke</dt>
                  <dd>
                    kr {tall(kronekurs(s, valuta), 2)}{' '}
                    <span className={valutaendring(s, valuta, UKE_SEK) >= 0 ? 'pluss' : 'minus'}>{endring(valutaendring(s, valuta, UKE_SEK))}</span>
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
        {bygg.length > 0 && <Byeier s={s} by={by} />}
        <button className="knapp knapp-liten" onClick={gatebilde}>
          <Ikon navn="sok" størrelse={14} /> Gatebildet
        </button>
      </div>

      {bygg.some((id) => (s.eiendommer[id] ?? 0) > 0) && <Forvalterkort s={s} by={by} />}

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

/**
 * Veien mot å eie hele byen: hvor mange av enhetene du har, og hva det gir.
 * Når alt er ditt, står kronen og bonusen der i stedet.
 */
function Byeier({ s, by }: { s: Spilltilstand; by: By }) {
  const { eid, av } = enheterI(s, by)
  const hel = eierHeleByen(s, by)
  return (
    <div className={hel ? 'byeier hel' : 'byeier'}>
      <span className="byeier-krone" aria-hidden="true">
        <Ikon navn="krone" størrelse={16} />
      </span>
      <div className="byeier-tekst">
        <strong>{hel ? 'Du eier hele byen' : `${eid} av ${av} enheter`}</strong>
        <span className="dempet liten">
          {hel ? `+${tall(BYEIER_BONUS * 100)} % leie på alt du eier her.` : `Eier du alle, gir leien her +${tall(BYEIER_BONUS * 100)} %.`}
        </span>
      </div>
      {!hel && (
        <span className="byeier-spor" aria-hidden="true">
          <span style={{ width: `${(eid / av) * 100}%` }} />
        </span>
      )}
    </div>
  )
}
