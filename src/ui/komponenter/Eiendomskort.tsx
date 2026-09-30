import { Bekreftknapp } from './Bekreftknapp'
import {
  EIENDOMSTYPER,
  eiendomspris,
  flyFor,
  kanReiseTil,
  LUKSUS,
  leieHverPerSek,
  MEGLERHONORAR,
  oppussingspris,
  standard,
  STANDARDER,
  statusnivaa,
} from '../../engine/eiendom'
import { kjopEiendom, pussOpp, selgEiendom } from '../../engine/handlinger'
import type { EiendomId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall, varighet } from '../format'
import { BedriftIkon } from './BedriftIkon'
import { NyMerke } from './Kjopsglimt'
import { Ikon } from './Ikoner'

/** Kortet for én eiendomstype: leie, standard, og knappene for å kjøpe, selge og pusse opp. Brukes i lista og i gatebildet. */
export function Eiendomskort({ s, id }: { s: Spilltilstand; id: EiendomId }) {
  const t = EIENDOMSTYPER[id]
  const eier = s.eiendommer[id] ?? 0
  const pris = eiendomspris(s, id)
  const st = standard(s, id)
  const fullt = eier >= t.maksAntall
  const manglerStatus = statusnivaa(s) < t.statuskrav
  const fly = flyFor(id)
  const manglerFly = !kanReiseTil(s, id)
  const oppussing = s.oppussing[id]
  const oppussingPris = oppussingspris(s, id)
  const nesteStandard = STANDARDER[st + 1]

  return (
    <li className="kort bedriftskort" data-ny={id}>
      <div className="bedriftskort-topp">
        <div className="bilde-med-brikke">
          <BedriftIkon type={id} stor />
          {eier > 0 && (
            <span className="brikke gull" aria-label={`${eier} av ${t.maksAntall} eid`}>
              {eier}/{t.maksAntall}
            </span>
          )}
        </div>
        <div className="bedriftskort-midt">
          <h2>
            {t.navn}
            <NyMerke id={id} />
            {st > 0 && <span className={st === 1 ? 'merke info' : 'merke gull'}>{STANDARDER[st].navn}</span>}
          </h2>
          <span className="dempet">{t.sted}</span>
        </div>
        <div className="eiendom-tall">
          {oppussing ? <span className="dempet">Ingen leie</span> : <span className="pluss">{perSek(leieHverPerSek(s, id))}</span>}
          <span className="dempet liten">per enhet</span>
        </div>
      </div>
      {/* Avkastningen og kravene trengs bare så lenge det er noe igjen å kjøpe. */}
      {!fullt && (
        <p className="dempet liten">
          Avkastning {tall(t.avkastning * STANDARDER[st].leie * 100)} % per time
          {t.statuskrav > 0 && ` · krever statusnivå ${t.statuskrav}`}
          {fly && ` · krever ${LUKSUS[fly].navn.toLowerCase()}`}
        </p>
      )}

      {oppussing ? (
        <div className="oppussing-pågår">
          <span>
            <Ikon navn="kran" størrelse={16} /> Pusses opp til <strong>{STANDARDER[oppussing.standard].navn.toLowerCase()}</strong>
          </span>
          <span className="dempet liten">Ferdig om {varighet(Math.max(0, oppussing.ferdigSek - s.sek))} · ingen leie så lenge</span>
        </div>
      ) : (
        <>
          <div className={eier > 0 ? 'eiendom-knapper' : 'eiendom-knapper en'}>
            <button
              className="knapp knapp-gull"
              disabled={fullt || manglerStatus || manglerFly || s.kontanter < pris}
              onClick={() => utfor(kjopEiendom(s, id))}
            >
              {fullt
                ? 'Alle kjøpt'
                : manglerStatus
                  ? `Krever status ${t.statuskrav}`
                  : manglerFly && fly
                    ? `Krever ${LUKSUS[fly].navn.toLowerCase()}`
                    : `Kjøp · ${kortKroner(pris)}`}
            </button>
            {eier > 0 && (
              <Bekreftknapp
                bekreft={eier === 1}
                varsel={st > 0 || s.oppussing[id] ? 'Standarden og oppussingen forsvinner med den siste.' : undefined}
                onJa={() => utfor(selgEiendom(s, id))}
              >
                Selg · {kortKroner(pris * (1 - MEGLERHONORAR))}
              </Bekreftknapp>
            )}
          </div>
          {eier > 0 && nesteStandard && oppussingPris !== null && (
            <button className="knapp knapp-oppussing" disabled={s.kontanter < oppussingPris} onClick={() => utfor(pussOpp(s, id))}>
              <span>
                Pusse opp til {nesteStandard.navn.toLowerCase()} · +{tall((nesteStandard.leie / STANDARDER[st].leie - 1) * 100)} % leie ·{' '}
                {nesteStandard.dager} dager
              </span>
              <strong>{kortKroner(oppussingPris)}</strong>
            </button>
          )}
        </>
      )}
    </li>
  )
}
