import { auksjonspris, dagerIgjen, prisIMorgen } from '../../engine/auksjon'
import { brukteplasser, LAGER, LAGER_FOR } from '../../engine/eiendom'
import { kjopAuksjon, selgUnik } from '../../engine/handlinger'
import type { Spilltilstand, UnikId } from '../../engine/types'
import { UNIKE, unikRestverdi } from '../../engine/unike'
import { utfor } from '../../state/lager'
import { kortKroner } from '../format'
import { BedriftIkon } from './BedriftIkon'
import { Bekreftknapp } from './Bekreftknapp'
import { Forklaring } from './Forklaring'

/**
 * Auksjonen som står åpen (Pakke 89), øverst i Samling: tingen, linjen om den,
 * dagens bud og hva det er i morgen. Kjøper du den ikke innen tre dager, går den
 * til en rival.
 */
export function Auksjonskort({ s }: { s: Spilltilstand }) {
  const a = s.auksjon?.aktiv
  const pris = auksjonspris(s)
  if (!a || pris === null) return null
  const u = UNIKE[a.id]
  const lager = LAGER_FOR[u.kategori]
  const ingenPlass = lager !== null && brukteplasser(s, lager) >= s.lager[lager]
  const igjen = dagerIgjen(s)
  const imorgen = prisIMorgen(s)
  return (
    <div className="kort auksjonskort">
      <div className="auksjon-topp">
        <span className="etikett">Auksjon</span>
        <span className={`merke ${igjen <= 1 ? 'varsel' : 'gull'}`}>{igjen <= 1 ? 'Siste dag' : `${igjen} dager igjen`}</span>
        <Forklaring tema="auksjon" />
      </div>
      <div className="auksjon-rad">
        <BedriftIkon type={u.tegning} stor />
        <div className="bedriftskort-midt">
          <h2>{u.navn}</h2>
          <span className="gull liten">+{u.status} status</span>
        </div>
      </div>
      <p className="dempet liten">{u.linje}</p>
      <p className="liten auksjon-bud">
        Budet står i <strong>{kortKroner(pris)}</strong>
        {imorgen !== null ? `, i morgen ${kortKroner(imorgen)}.` : '. I morgen faller hammeren.'}
      </p>
      <button className="knapp knapp-gull bred" disabled={ingenPlass || s.kontanter < pris} onClick={() => utfor(kjopAuksjon(s))}>
        {ingenPlass ? `Ingen plass i ${LAGER[lager!].bestemt}` : `Kjøp · ${kortKroner(pris)}`}
      </button>
    </div>
  )
}

/** En unik ting du eier: tegningen, linjen om den, statusen og salget tilbake til auksjonshuset. */
export function Unikkort({ s, id }: { s: Spilltilstand; id: UnikId }) {
  const u = UNIKE[id]
  return (
    <li className="kort kjopskort luksuskort eid unikkort">
      <BedriftIkon type={u.tegning} stor />
      <div className="bedriftskort-midt">
        <h2>
          {u.navn}
          <span className="merke gull">Unik</span>
        </h2>
        <span className="gull liten">+{u.status} status</span>
        <span className="dempet liten">{u.linje}</span>
      </div>
      <Bekreftknapp className="knapp knapp-liten" onJa={() => utfor(selgUnik(s, id))}>
        Selg · {kortKroner(unikRestverdi(s, id))}
      </Bekreftknapp>
    </li>
  )
}
