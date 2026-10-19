/**
 * Synergiene på bedriftens side (Pakke 117): parene bedriften er med i, hva de
 * gir, og om du eier den andre. Vises bare for bransjer som er med i et par.
 */

import { FORMER } from '../../engine/fusjon'
import { SYNERGI_BONUS, synergierFor } from '../../engine/synergi'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { andelTekst } from '../format'

export function Synergikort({ s, b }: { s: Spilltilstand; b: Bedrift }) {
  const par = synergierFor(b.type)
  if (par.length === 0) return null
  return (
    <div className="kort">
      <h2 className="kort-tittel">Synergier</h2>
      <p className="dempet liten">Eier du begge bedriftene i et par, tjener begge {andelTekst(SYNERGI_BONUS)} mer.</p>
      <ul className="forbedringer">
        {par.map(({ synergi, andre }) => {
          const eier = s.bedrifter.some((x) => x.type === andre)
          return (
            <li key={synergi.navn} className={eier ? 'kjøpt' : ''}>
              <div>
                <strong>
                  {synergi.navn} <span className="gull">+{andelTekst(SYNERGI_BONUS)}</span>
                </strong>
                <p className="dempet liten">{synergi.tekst}</p>
              </div>
              {eier ? <span className="merke ok">✓ Med {FORMER[andre].den}</span> : <span className="dempet liten laast-merke">Krever {FORMER[andre].en}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
