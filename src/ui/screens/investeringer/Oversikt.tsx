/**
 * Oversikt: hva investeringene er verdt, fordelt på slag, med en vei til hver del.
 * En del av Investeringer-fanen (Pakke 65 delte Investeringer.tsx per del).
 */

import { portefolje, sum, type Aktivaklasse } from '../../../engine/portefolje'
import type { Spilltilstand } from '../../../engine/types'
import { kortKroner, tall } from '../../format'
import { RulleTall } from '../../komponenter/RulleTall'
import { Endring } from './felles'

const KLASSENAVN: Record<Aktivaklasse, string> = {
  aksje: 'Aksjer',
  krypto: 'Krypto',
  fond: 'Indeksfond',
  obligasjon: 'Obligasjoner',
  eiendom: 'Eiendom',
  rival: 'Rivalselskaper',
  startup: 'Startups',
  sparing: 'Sparekonto',
}

export function Oversikt({ s, velg }: { s: Spilltilstand; velg: (k: Exclude<Aktivaklasse, 'eiendom'>) => void }) {
  // Eiendom har sin egen fane og sin egen rad i formuen på Profil (Pakke 62), så den er ikke med her.
  const poster = portefolje(s).filter((p): p is typeof p & { klasse: Exclude<Aktivaklasse, 'eiendom'> } => p.klasse !== 'eiendom')
  const total = sum(poster)
  const avkastning = total.verdi - total.kostpris
  const startIDag = total.verdi - total.iDag

  return (
    <>
      <div className="kort oversikt">
        <span className="etikett">Investeringene dine</span>
        <span className="tall-kjempe">
          <RulleTall verdi={total.verdi} format={kortKroner} />
        </span>
        <div className="oversikt-tall">
          <div>
            <span className="etikett">Kursendring i dag</span>
            <Endring kroner={total.iDag} andel={startIDag > 0 ? total.iDag / startIDag : 0} />
          </div>
          <div>
            <span className="etikett">Total avkastning</span>
            <Endring kroner={avkastning} andel={total.kostpris > 0 ? avkastning / total.kostpris : 0} />
          </div>
        </div>
        {total.verdi > 0 && (
          <div className="fordeling" role="img" aria-label="Fordeling av investeringene">
            {poster
              .filter((p) => p.verdi > 0)
              .map((p) => (
                <span key={p.klasse} className={`fordeling-del ${p.klasse}`} style={{ flexGrow: p.verdi }} />
              ))}
          </div>
        )}
      </div>

      <ul className="kortliste">
        {poster.map((p) => {
          const avk = p.verdi - p.kostpris
          return (
            <li key={p.klasse}>
              <button className="kort klasserad" onClick={() => velg(p.klasse)}>
                <span className={`klasse-prikk ${p.klasse}`} aria-hidden="true" />
                <span className="klasserad-navn">
                  <strong>{KLASSENAVN[p.klasse]}</strong>
                  <span className="dempet liten">
                    {total.verdi > 0 ? `${tall((p.verdi / total.verdi) * 100)} % av porteføljen` : 'Ingenting ennå'}
                  </span>
                </span>
                <span className="papirrad-kurs">
                  <span>{kortKroner(p.verdi)}</span>
                  {p.verdi > 0 && <Endring kroner={avk} andel={p.kostpris > 0 ? avk / p.kostpris : 0} liten />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="dempet liten">Bedriftene og eiendommene har egne faner. Hele formuen, delt opp, står på Profil.</p>
    </>
  )
}
