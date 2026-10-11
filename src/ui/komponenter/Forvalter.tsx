import { byverdi } from '../../engine/eiendom'
import { ansettForvalter, byttForvalter, sigOppForvalter } from '../../engine/handlinger'
import { byttepris, forvalter, FORVALTER_ANDEL, FORVALTER_MINSTEPRIS, FORVALTERE, FORVALTERLISTE, forvalterpris, ledighet, UFLAKS_DAGER, uflaksSjanse, ventetLeie } from '../../engine/utleie'
import { fase, FASER } from '../../engine/verden'
import type { By, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { Bekreftknapp } from './Bekreftknapp'

const pst = (n: number) => `${tall(n * 100)} %`

/**
 * Utleien i en by (Pakke 54): hvor mye som står tomt denne uka, sjansen for en
 * dårlig leietaker, og forvalteren — eller de tre du kan ansette.
 */
export function Forvalterkort({ s, by }: { s: Spilltilstand; by: By }) {
  const nå = forvalter(s, by)
  const pris = forvalterpris(byverdi(s, by))
  const bytte = byttepris(byverdi(s, by))
  // Hvem gir mest denne uka, i fasen konjunkturen er i (Pakke 83).
  const best = [...FORVALTERLISTE].sort((a, b) => ventetLeie(s, by, b) - ventetLeie(s, by, a))[0]
  return (
    <div className="kort forvalter">
      <div className="maal-topp">
        <h2 className="kort-tittel">Utleie</h2>
        {nå ? <span className="merke kant">{FORVALTERE[nå].navn} forvalter</span> : <span className="merke">Ingen forvalter</span>}
      </div>
      <dl className="byvisning-tall">
        <div>
          <dt className="etikett">Står tomt denne uka</dt>
          <dd className={ledighet(s, by) > 0.1 ? 'minus' : ''}>{pst(ledighet(s, by))}</dd>
        </div>
        <div>
          <dt className="etikett">Dårlig leietaker</dt>
          <dd>{pst(uflaksSjanse(s, by))} i uka</dd>
        </div>
      </dl>
      <p className="dempet liten">
        {FASER[fase(s)].navn}: best nå er {FORVALTERE[best].navn.toLowerCase()}. En dårlig leietaker koster {UFLAKS_DAGER === 7 ? 'en ukes' : `${UFLAKS_DAGER} dagers`} leie.
      </p>
      {nå ? (
        <div className="personale-rad">
          <p className="dempet liten">
            {FORVALTERE[nå].beskrivelse} Kjøper du mer i {by}, tar forvalteren {pst(FORVALTER_ANDEL)} av prisen. Selger du alt, slutter forvalteren.
          </p>
          <Bekreftknapp className="knapp knapp-liten" ja="Ja, si opp" varsel="Du får ikke pengene tilbake." onJa={() => utfor(sigOppForvalter(s, by))}>
            Si opp
          </Bekreftknapp>
        </div>
      ) : null}
      {nå ? (
        <div className="retning-valg">
          {FORVALTERLISTE.map((id) => (
            <div key={id} className="retning-alternativ">
              <strong>
                {FORVALTERE[id].navn} {id === best && <span className="merke gull">Best nå</span>}
              </strong>
              <span className="liten">Venter {pst(ventetLeie(s, by, id))} av full leie</span>
              {id === nå ? (
                <span className="merke ok">Forvalter nå</span>
              ) : (
                <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < bytte} onClick={() => utfor(byttForvalter(s, by, id))}>
                  Bytt · {kortKroner(bytte)}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="dempet liten">
            En forvalter holder leilighetene fulle og leietakerne i sjakk. Koster {kortKroner(pris)} én gang —{' '}
            {pris > FORVALTER_MINSTEPRIS ? `5 % av det du eier i ${by}` : `minsteprisen; når du eier mer, er det 5 % av det du eier i ${by}`}, og 5 % av alt du kjøper
            der senere.
          </p>
          <div className="retning-valg">
            {FORVALTERLISTE.map((id) => {
              const f = FORVALTERE[id]
              return (
                <div key={id} className="retning-alternativ">
                  <strong>
                    {f.navn} {id === best && <span className="merke gull">Best nå</span>}
                  </strong>
                  <span className="dempet liten">{f.beskrivelse}</span>
                  <span className="liten">Venter {pst(ventetLeie(s, by, id))} av full leie nå (uten forvalter {pst(ventetLeie(s, by, undefined))})</span>
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(ansettForvalter(s, by, id))}>
                    Ansett · {kortKroner(pris)}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
