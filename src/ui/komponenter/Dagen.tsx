import { BEDRIFTSTYPER } from '../../engine/innhold'
import { dagnummer } from '../../engine/kalender'
import { dagerIgjenAvFasen, dagsbilde, fase, FASER, styringsrente, VAERTYPER } from '../../engine/verden'
import type { Spilltilstand } from '../../engine/types'
import { tall } from '../format'
import { datotekst } from '../kalender'

const stor = (t: string) => t[0].toUpperCase() + t.slice(1)

/**
 * Dagen i dag (Pakke 49): dato, vær, helligdag, ukas trender og konjunkturen,
 * på én linje over bedriftene — det som gjør at de tjener mer eller mindre i dag.
 */
export function Dagen({ s }: { s: Spilltilstand }) {
  const dag = dagnummer(s.sek)
  const d = dagsbilde(s)
  const f = fase(s)
  return (
    <div className="dagen" aria-label="Dagen i dag">
      <span className="dagen-dato">{stor(datotekst(dag))}</span>
      <span className="merke">{VAERTYPER[d.vaer].navn}</span>
      {d.helligdag && <span className="merke gull">{d.helligdag.navn}</span>}
      {d.trend.het && <span className="merke ok">Het: {BEDRIFTSTYPER[d.trend.het].navn}</span>}
      {d.trend.kald && <span className="merke fare">Kald: {BEDRIFTSTYPER[d.trend.kald].navn}</span>}
      <span className={`merke${f === 'hoy' ? ' ok' : f === 'lav' ? ' varsel' : ''}`}>
        {FASER[f].navn} · rente {tall(styringsrente(s), 1).replace(/,0$/, '')} %
      </span>
    </div>
  )
}

/** Konjunkturen og styringsrenten, øverst i banken. */
export function Konjunkturkort({ s }: { s: Spilltilstand }) {
  const f = fase(s)
  const igjen = dagerIgjenAvFasen(s)
  return (
    <div className="kort konjunktur">
      <div className="bank-rad">
        <div>
          <span className="etikett">Konjunktur</span>
          <span className="tall-stort">{FASER[f].navn}</span>
        </div>
        <div className="bank-rente">
          <span className="etikett">Styringsrente</span>
          <span className="tall-stort">{tall(styringsrente(s), 1).replace(/,0$/, '')} %</span>
        </div>
      </div>
      <p className="dempet liten">
        {f === 'hoy'
          ? 'Børsen og boligprisene stiger, og lånene er dyrere. '
          : f === 'lav'
            ? 'Aksjene og boligprisene faller, men lånene er billigere — for den som tør å kjøpe. '
            : 'Normale tider: verken medvind eller motvind. '}
        Neste rentemøte om {igjen} {igjen === 1 ? 'dag' : 'dager'}.
      </p>
    </div>
  )
}
