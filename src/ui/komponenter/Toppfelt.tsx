import { nettoformue, nettoPerSek } from '../../engine/formler'
import { statusnivaa } from '../../engine/eiendom'
import { dagnummer, erHelg } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { kompakt, perSek } from '../format'
import { klokke, kortDato, ukenummer } from '../kalender'
import { IkonProfil } from './Ikoner'
import { RulleTall } from './RulleTall'

/**
 * Fast toppfelt: kontanter og tempo til venstre, nettoformuen i midten,
 * profil til høyre — og under, datolinja med klokka og avisen.
 */
export function Toppfelt({ s, tilProfil, åpneAvis }: { s: Spilltilstand; tilProfil: () => void; åpneAvis: () => void }) {
  const dag = dagnummer(s.sek)
  const siste = s.avis[s.avis.length - 1]
  const ulest = siste !== undefined && siste.dag > s.avisLest

  return (
    <header className="toppfelt">
      <div className="toppfelt-rad">
        <div className="toppfelt-kontanter">
          <span className="etikett">Kontanter</span>
          <span className="tall-mellom">
            <RulleTall verdi={s.kontanter} format={kompakt} />
          </span>
          <span className={nettoPerSek(s) < 0 ? 'tempo negativ' : 'tempo'}>{perSek(nettoPerSek(s))}</span>
        </div>
        <div className="toppfelt-formue">
          <span className="etikett">Nettoformue</span>
          <span className="tall-stort gull">
            <RulleTall verdi={nettoformue(s)} format={kompakt} />
          </span>
        </div>
        <button className="toppfelt-profil" onClick={tilProfil} aria-label={`Profil, statusnivå ${statusnivaa(s)}`}>
          <IkonProfil størrelse={22} />
          {statusnivaa(s) > 0 && <span className="profil-nivaa">{statusnivaa(s)}</span>}
        </button>
      </div>

      <div className="datolinje">
        <span className="dato">
          {kortDato(dag)} <span className="dempet">· uke {ukenummer(dag)} · {klokke(s.sek)}</span>
        </span>
        {s.skatt.regninger.length > 0 ? (
          <button className="skattebrikke" onClick={tilProfil} aria-label="Ubetalt skatt — gå til Profil">
            🧾 Skatt
          </button>
        ) : (
          erHelg(s.sek) && <span className="helg">Børsen stengt</span>
        )}
        <button className="avisknapp" onClick={åpneAvis} aria-label={ulest ? 'Avisen, ny utgave' : 'Avisen'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="4" width="15" height="16" rx="1.5" />
            <path d="M18 8 H21 V18 A2 2 0 0 1 17 18" />
            <line x1="6" y1="8" x2="15" y2="8" />
            <rect x="6" y="11" width="4" height="5" />
            <line x1="12" y1="12" x2="15" y2="12" />
            <line x1="12" y1="15" x2="15" y2="15" />
          </svg>
          Avisen
          {ulest && <span className="ulest-prikk" />}
        </button>
      </div>
    </header>
  )
}
