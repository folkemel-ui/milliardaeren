import { nettoformue, nettoPerSek } from '../../engine/formler'
import { statusnivaa } from '../../engine/eiendom'
import type { Spilltilstand } from '../../engine/types'
import { formue, perSek } from '../format'
import { IkonProfil } from './Ikoner'
import { RulleTall } from './RulleTall'

/** Fast toppfelt: kontanter og tempo til venstre, nettoformuen i midten, profil til høyre. */
export function Toppfelt({ s, tilProfil }: { s: Spilltilstand; tilProfil: () => void }) {
  return (
    <header className="toppfelt">
      <div className="toppfelt-kontanter">
        <span className="etikett">Kontanter</span>
        <span className="tall-mellom">
          <RulleTall verdi={s.kontanter} format={formue} />
        </span>
        <span className={nettoPerSek(s) < 0 ? 'tempo negativ' : 'tempo'}>{perSek(nettoPerSek(s))}</span>
      </div>
      <div className="toppfelt-formue">
        <span className="etikett">Nettoformue</span>
        <span className="tall-stort gull">
          <RulleTall verdi={nettoformue(s)} format={formue} />
        </span>
      </div>
      <button className="toppfelt-profil" onClick={tilProfil} aria-label={`Profil, statusnivå ${statusnivaa(s)}`}>
        <IkonProfil størrelse={22} />
        {statusnivaa(s) > 0 && <span className="profil-nivaa">{statusnivaa(s)}</span>}
      </button>
    </header>
  )
}
