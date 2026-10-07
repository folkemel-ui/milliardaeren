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
import { Maleribilde, Maleriscene } from './Malerier'
import { aapneTing, trykkApner } from '../detaljvisning'
import { Apneknapp } from './BedriftIkon'

/**
 * Galleriveggen øverst i Kunst (G6): maleriene du eier henger på en vegg med
 * lys ovenfra og en liten messingplate under. Et maleri som er lånt ut til
 * museum, står som en tom plass med lapp. Et trykk åpner maleriet stort (G7).
 */
function Galleriveggen({ s }: { s: Spilltilstand }) {
  const eide = MALERILISTE.filter((id) => s.kunst.eide[id])
  if (eide.length === 0) return null
  return (
    <div className="kunstvegg" role="list" aria-label="Galleriveggen">
      {eide.map((id) => {
        const ute = s.kunst.eide[id]?.utlant
        return (
          <figure key={id} className={ute ? 'kunstvegg-plass tom' : 'kunstvegg-plass'} role="listitem">
            <button className="kunstvegg-bilde" aria-label={`Vis ${MALERIER[id].navn} stort`} onClick={() => aapneTing({ slag: 'maleri', id })}>
              {ute ? <span className="kunstvegg-lapp">På museum</span> : <Maleribilde id={id} hoyde={64} />}
            </button>
            <figcaption>{MALERIER[id].navn}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export function Kunst({ s }: { s: Spilltilstand }) {
  const verdi = kunstverdi(s)
  const eide = MALERILISTE.filter((id) => s.kunst.eide[id]).length
  return (
    <Seksjon id="luksus-kunst" tittel="Kunst" forklaring="kunst" sammendrag={eide ? `${eide} ${eide === 1 ? 'maleri' : 'malerier'} · ${kortKroner(verdi)}` : 'Ingen malerier'} harInnhold={eide > 0}>
      <Galleriveggen s={s} />
      {verdi > 0 && <p className="dempet liten">Samlingen din er verdt {kortKroner(verdi)}.</p>}
      <ul className="kortliste">
        {MALERILISTE.map((id) => (
          <Malerikort key={id} s={s} id={id} />
        ))}
      </ul>
    </Seksjon>
  )
}

/** Kortet for et maleri. Et trykk åpner detaljsiden, der kortet står under maleriet på veggen (`iDetalj`). */
export function Malerikort({ s, id, iDetalj = false }: { s: Spilltilstand; id: MaleriId; iDetalj?: boolean }) {
  const m = MALERIER[id]
  const eid = s.kunst.eide[id]
  const pris = maleripris(s, id)
  const siden = pris / m.startpris - 1
  return (
    <li className={`kort maleri${eid ? ' eid' : ''}${iDetalj ? '' : ' kan-aapnes'}`} onClick={iDetalj ? undefined : trykkApner({ slag: 'maleri', id })}>
      {iDetalj && <Maleriscene id={id} navn={m.navn} under={`${KUNSTNERE[m.kunstner].navn}, ${m.aar}`} utlant={eid?.utlant} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'maleri', id }} navn={m.navn}>
            <span className="bedrift-ikon">
              <Maleribilde id={id} størrelse={44} />
            </span>
          </Apneknapp>
        )}
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
