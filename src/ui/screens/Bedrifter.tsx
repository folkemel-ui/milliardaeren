import { bedriftInntektPerSek, bedriftsverdi } from '../../engine/formler'
import { BEDRIFTSTYPER } from '../../engine/innhold'
import type { Spilltilstand } from '../../engine/types'
import { kroner, perSek } from '../format'
import { IkonSaftbod } from '../komponenter/Ikoner'

export function Bedrifter({ s }: { s: Spilltilstand }) {
  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Dine bedrifter</h1>
      <ul className="kortliste">
        {s.bedrifter.map((b) => (
          <li key={b.id} className="kort bedriftskort">
            <div className="bedriftskort-ikon">
              <IkonSaftbod />
            </div>
            <div className="bedriftskort-midt">
              <h2>{BEDRIFTSTYPER[b.type].navn}</h2>
              <span className="dempet">Nivå {b.nivaa}</span>
            </div>
            <div className="bedriftskort-tall">
              <span className="pluss">{perSek(bedriftInntektPerSek(b))}</span>
              <span className="dempet">Verdi {kroner(bedriftsverdi(b))}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="kort kort-tomt">Flere bransjer låses opp etter hvert som formuen vokser.</p>
    </section>
  )
}
