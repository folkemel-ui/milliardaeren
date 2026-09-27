import { eierType, erLaastOpp } from '../../engine/formler'
import { kjopBedrift } from '../../engine/handlinger'
import { BEDRIFTSTYPER, STIGEN } from '../../engine/innhold'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek } from '../format'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Bedriftskort } from '../komponenter/Bedriftskort'

export function Bedrifter({ s }: { s: Spilltilstand }) {
  const tilSalgs = STIGEN.filter((t) => !eierType(s, t) && erLaastOpp(s, t))
  const nesteLaast = STIGEN.find((t) => !erLaastOpp(s, t))

  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Dine bedrifter</h1>
      <ul className="kortliste">
        {s.bedrifter.map((b) => (
          <Bedriftskort key={b.id} b={b} s={s} />
        ))}
      </ul>

      {(tilSalgs.length > 0 || nesteLaast) && <h2 className="seksjon-tittel">Start ny bedrift</h2>}
      <ul className="kortliste">
        {tilSalgs.map((id) => {
          const t = BEDRIFTSTYPER[id]
          return (
            <li key={id} className="kort kjopskort">
              <BedriftIkon type={id} />
              <div className="bedriftskort-midt">
                <h2>{t.navn}</h2>
                <span className="pluss liten">{perSek(t.grunninntekt)}</span>
              </div>
              <button
                className="knapp knapp-gull knapp-liten"
                disabled={s.kontanter < t.pris}
                onClick={() => utfor(kjopBedrift(s, id))}
              >
                Kjøp · {kortKroner(t.pris)}
              </button>
            </li>
          )
        })}
        {nesteLaast && (
          <li className="kort kjopskort laast">
            <BedriftIkon type={nesteLaast} dempet />
            <div className="bedriftskort-midt">
              <h2>{BEDRIFTSTYPER[nesteLaast].navn}</h2>
              <span className="dempet liten">
                Låses opp ved nettoformue {kortKroner(BEDRIFTSTYPER[nesteLaast].laasesOppVed)}
              </span>
              <div className="milepael-spor">
                <div
                  className="milepael-fyll"
                  style={{ width: `${Math.min(1, s.hoyesteFormue / BEDRIFTSTYPER[nesteLaast].laasesOppVed) * 100}%` }}
                />
              </div>
            </div>
            <span className="laas" aria-label="Låst">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
              </svg>
            </span>
          </li>
        )}
      </ul>
    </section>
  )
}
