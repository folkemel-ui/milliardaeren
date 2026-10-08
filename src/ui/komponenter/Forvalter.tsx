import { byverdi } from '../../engine/eiendom'
import { ansettForvalter, sigOppForvalter } from '../../engine/handlinger'
import { forvalter, FORVALTER_ANDEL, FORVALTER_MINSTEPRIS, FORVALTERE, FORVALTERLISTE, forvalterpris, ledighet, uflaksSjanse } from '../../engine/utleie'
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
      {nå ? (
        <div className="personale-rad">
          <p className="dempet liten">
            {FORVALTERE[nå].beskrivelse} Kjøper du mer i {by}, tar forvalteren {pst(FORVALTER_ANDEL)} av prisen. Selger du alt, slutter forvalteren.
          </p>
          <Bekreftknapp className="knapp knapp-liten" ja="Ja, si opp" varsel="Du får ikke pengene tilbake." onJa={() => utfor(sigOppForvalter(s, by))}>
            Si opp
          </Bekreftknapp>
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
                  <strong>{f.navn}</strong>
                  <span className="dempet liten">{f.beskrivelse}</span>
                  <span className="liten">
                    Tomt {pst(f.ledighet - 1)} · uflaks {f.uflaks > 1 ? '+' : ''}
                    {pst(f.uflaks - 1)} · leie {f.leie >= 1 ? '+' : ''}
                    {pst(f.leie - 1)}
                  </span>
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
