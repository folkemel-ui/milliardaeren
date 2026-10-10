import { useRef, useState } from 'react'
import { dagerIgjenAvFasen, fase, FASER, styringsrente } from '../../engine/verden'
import type { Spilltilstand } from '../../engine/types'
import { tall } from '../format'
import { markedetIDag } from '../markedet'
import { useFokusfelle } from './useFokusfelle'

/**
 * Dagen i dag (Pakke 49) — siden Pakke 75 én rolig linje: datoen, og
 * «Markedet i dag ›» med et tall når noe er utenom det vanlige (en helligdag,
 * en het eller kald bransje, høy- eller lavkonjunktur). Et trykk åpner arket
 * med været, trendene og konjunkturen, og forklaringen.
 */
export function Dagen({ s }: { s: Spilltilstand }) {
  const [åpen, settÅpen] = useState(false)
  const m = markedetIDag(s)
  return (
    <div className="dagen" aria-label="Dagen i dag">
      <span className="dagen-dato">{m.dato}</span>
      <button type="button" className="markedslinje" aria-haspopup="dialog" aria-expanded={åpen} onClick={() => settÅpen(true)}>
        Markedet i dag
        {m.spesielle > 0 && <span className="brikke markedstall">{m.spesielle}</span>}
        <span aria-hidden="true"> ›</span>
      </button>
      {åpen && <Markedsark s={s} lukk={() => settÅpen(false)} />}
    </div>
  )
}

/** Arket bak «Markedet i dag»: linjene, og hva de gjør med inntekten. */
function Markedsark({ s, lukk }: { s: Spilltilstand; lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)
  const m = markedetIDag(s)
  const igjen = dagerIgjenAvFasen(s)
  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div ref={boks} tabIndex={-1} className="velkomst markedsark" role="dialog" aria-modal="true" aria-labelledby="marked-tittel" onClick={(e) => e.stopPropagation()}>
        <h1 id="marked-tittel" className="velkomst-tittel">
          Markedet i dag
        </h1>
        <p className="dempet liten">{m.dato}</p>
        <dl className="oppgjor-tall markedsliste">
          {m.linjer.map((l) => (
            <div key={l.navn}>
              <dt>{l.navn}</dt>
              <dd>{l.merke ? <span className={`merke ${l.merke}`}>{l.verdi}</span> : l.verdi}</dd>
            </div>
          ))}
        </dl>
        <p className="dempet liten">
          Neste rentemøte om {igjen} {igjen === 1 ? 'dag' : 'dager'}. Restauranter og hoteller tjener mest i helgen, bankene og kafeene på hverdager, saftbodene i sola og skisentrene i snøen. Hver uke kan én
          bransje være het og én kald; helligdagene er rene bonuser.
        </p>
        <button className="knapp" onClick={lukk}>
          Lukk
        </button>
      </div>
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
