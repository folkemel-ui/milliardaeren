/**
 * Formuesforvalteren på Oversikt (Pakke 124): velg en profil, gi forvalteren av kontantene eller ta
 * ut, og se hva den gjorde sist mandag. Forvalteren holder aksjene, Børsfondet, obligasjonene og
 * råvarene dine i profilens blanding; kryptoen rører den ikke. (Ikke å forveksle med
 * eiendomsforvalterne i Forvalter.tsx, fra Pakke 54.)
 */

import { forvalterBelop, startForvalter, stoppForvalter } from '../../engine/handlinger'
import { FORVALTER_GEBYR, forvaltetVerdi, PROFILER, PROFILLISTE } from '../../engine/forvalter'
import { erHelg } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { Bekreftknapp } from './Bekreftknapp'

export function Formuesforvalter({ s }: { s: Spilltilstand }) {
  const f = s.forvalter
  const verdi = forvaltetVerdi(s)
  const stengt = erHelg(s.sek)
  const gebyr = `${tall(FORVALTER_GEBYR * 100, 1)} %`
  return (
    <div className="kort formuesforvalter">
      <h2 className="kort-tittel">Formuesforvalter</h2>
      {f ? (
        <p className="liten">
          <strong>{PROFILER[f.profil].navn}</strong> · forvalter {kortKroner(verdi)} · gebyr ≈ {kortKroner(FORVALTER_GEBYR * verdi)} i uka
          {f.siste && (
            <span className="dempet">
              <br />
              Sist mandag: solgte for {kortKroner(f.siste.solgt)}, kjøpte for {kortKroner(f.siste.kjopt)}.
            </span>
          )}
        </p>
      ) : (
        <p className="dempet liten">
          Velg en profil, og forvalteren holder aksjene, Børsfondet, obligasjonene og råvarene dine i den blandingen — hver mandag morgen, for {gebyr} av det den forvalter i uka. Kryptoen rører den ikke.
        </p>
      )}
      <div className="andelsknapper" role="radiogroup" aria-label="Profil">
        {PROFILLISTE.map((p) => (
          <button key={p} role="radio" aria-checked={f?.profil === p} className={f?.profil === p ? 'knapp knapp-liten aktiv' : 'knapp knapp-liten'} disabled={stengt} onClick={() => utfor(startForvalter(s, p))}>
            {PROFILER[p].navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">{PROFILER[f?.profil ?? 'balansert'].tekst}</p>
      {f && (
        <>
          <div className="spare-rad">
            <span className="etikett">Gi forvalteren</span>
            <div className="andelsknapper">
              {[0.1, 0.25, 0.5].map((a) => {
                const belop = Math.floor(s.kontanter * a)
                return (
                  <button key={a} className="knapp knapp-liten" disabled={stengt || belop < 1} onClick={() => utfor(forvalterBelop(s, belop))}>
                    {kortKroner(belop)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="spare-rad">
            <span className="etikett">Ta ut</span>
            <div className="andelsknapper">
              {[0.25, 0.5, 1].map((a) => {
                const belop = Math.floor(verdi * a)
                return (
                  <button key={a} className="knapp knapp-liten" disabled={stengt || belop < 1} onClick={() => utfor(forvalterBelop(s, -belop))}>
                    {a === 1 ? 'Alt' : kortKroner(belop)}
                  </button>
                )
              })}
            </div>
          </div>
          <Bekreftknapp className="knapp knapp-liten" ja="Ja, si opp" varsel="Det forvalteren har kjøpt, blir stående som ditt." onJa={() => utfor(stoppForvalter(s))}>
            Si opp forvalteren
          </Bekreftknapp>
          <p className="dempet liten">Gebyrene så langt: {kortKroner(f.gebyrBetalt)}.</p>
        </>
      )}
      {stengt && <p className="dempet liten">Børsen er stengt i helgen; forvalteren handler fra mandag.</p>}
    </div>
  )
}
