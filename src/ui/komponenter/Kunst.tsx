import { kjopMaleri, museum, selgMaleri } from '../../engine/handlinger'
import { Bekreftknapp } from './Bekreftknapp'
import {
  kjopsprisMaleri,
  KUNSTNERE,
  kunstverdi,
  MALERIER,
  MALERILISTE,
  maleripris,
  salgsprisMaleri,
} from '../../engine/kunst'
import type { MaleriId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, fortegnKroner, kortKroner } from '../format'
import { Seksjon } from './Seksjon'

/** Et lite maleri i gullramme, tegnet av maleriets tre farger. Formen følger id-en, så hvert er ulikt. */
export function Miniatyr({ id, størrelse = 44 }: { id: MaleriId; størrelse?: number }) {
  const [himmel, land, detalj] = MALERIER[id].farger
  const n = MALERILISTE.indexOf(id)
  const horisont = 22 + (n % 3) * 4
  return (
    <svg width={størrelse} height={størrelse} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="2" fill="#b8860b" />
      <rect x="4.5" y="4.5" width="39" height="39" fill="#e3c26b" />
      <rect x="7" y="7" width="34" height="34" fill={himmel} />
      <polygon points={`7,${horisont + 6} ${14 + n},${horisont - 4} ${24 - (n % 4)},${horisont + 3} ${32 + (n % 3)},${horisont - 6} 41,${horisont + 2} 41,41 7,41`} fill={land} />
      {n % 2 === 0 ? (
        <circle cx={30 - n} cy={14 + (n % 3) * 2} r={3 + (n % 3)} fill={detalj} />
      ) : (
        <rect x={12 + n} y={horisont + 4} width="5" height="9" fill={detalj} />
      )}
    </svg>
  )
}

export function Kunst({ s }: { s: Spilltilstand }) {
  const verdi = kunstverdi(s)
  const eide = MALERILISTE.filter((id) => s.kunst.eide[id]).length
  return (
    <Seksjon id="luksus-kunst" tittel="Kunst" forklaring="kunst" sammendrag={eide ? `${eide} ${eide === 1 ? 'maleri' : 'malerier'} · ${kortKroner(verdi)}` : 'Ingen malerier'} harInnhold={eide > 0}>
      {verdi > 0 && <p className="dempet liten">Samlingen din er verdt {kortKroner(verdi)}.</p>}
      <ul className="kortliste">
        {MALERILISTE.map((id) => (
          <Maleri key={id} s={s} id={id} />
        ))}
      </ul>
    </Seksjon>
  )
}

function Maleri({ s, id }: { s: Spilltilstand; id: MaleriId }) {
  const m = MALERIER[id]
  const eid = s.kunst.eide[id]
  const pris = maleripris(s, id)
  const siden = pris / m.startpris - 1
  return (
    <li className={eid ? 'kort maleri eid' : 'kort maleri'}>
      <div className="bedriftskort-topp">
        <div className="bedrift-ikon" aria-hidden="true">
          <Miniatyr id={id} />
        </div>
        <div className="bedriftskort-midt">
          <h2>{m.navn}</h2>
          <span className="dempet liten">
            {KUNSTNERE[m.kunstner].navn}, {m.aar}
          </span>
        </div>
        <div className="eiendom-tall">
          <span>{kortKroner(pris)}</span>
          <span className={siden >= 0 ? 'pluss liten' : 'minus liten'}>{endring(siden)} i alt</span>
        </div>
      </div>
      <p className="dempet liten">
        <span className="gull">+{eid?.utlant ? m.status * 2 : m.status} status</span>
        {eid && ` · kjøpt for ${kortKroner(eid.kostpris)}, ${fortegnKroner(pris - eid.kostpris)}`}
        {eid?.utlant && (eid.hentes ? ' · kommer hjem i morgen' : ' · henger på museum')}
      </p>
      {eid ? (
        <div className="eiendom-knapper">
          <button className="knapp" disabled={eid.hentes} onClick={() => utfor(museum(s, id))}>
            {eid.utlant ? (eid.hentes ? 'På vei hjem' : 'Hent hjem') : 'Lån ut til museum'}
          </button>
          <Bekreftknapp disabled={eid.utlant} onJa={() => utfor(selgMaleri(s, id))}>
            Selg · {kortKroner(salgsprisMaleri(s, id))}
          </Bekreftknapp>
        </div>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < kjopsprisMaleri(s, id)} onClick={() => utfor(kjopMaleri(s, id))}>
          Kjøp · {kortKroner(kjopsprisMaleri(s, id))}
        </button>
      )}
    </li>
  )
}
