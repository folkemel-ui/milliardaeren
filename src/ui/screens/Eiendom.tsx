import { useState } from 'react'
import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import {
  EIENDOM_SYNLIG_VED,
  EIENDOMSSTIGEN,
  EIENDOMSTYPER,
  eiendomspris,
  flyFor,
  kanReiseTil,
  LUKSUS,
  eiendomsverdi,
  leieHverPerSek,
  leiePerSek,
  MEGLERHONORAR,
  oppussingspris,
  standard,
  STANDARDER,
  statusnivaa,
} from '../../engine/eiendom'
import { eiendomSynlig, kjopEiendom, pussOpp, selgEiendom } from '../../engine/handlinger'
import type { By, EiendomId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, kortKroner, perSek, tall, varighet } from '../format'
import { Minigraf } from '../komponenter/Linjegraf'
import { Norgeskart } from '../komponenter/Norgeskart'
import { Verdenskart } from '../komponenter/Verdenskart'
import { Jordliste, Landemerkeliste } from '../komponenter/JordOgLandemerker'
import { Seksjon } from '../komponenter/Seksjon'
import { BedriftIkon } from '../komponenter/BedriftIkon'

export function Eiendom({ s }: { s: Spilltilstand }) {
  const [by, settBy] = useState<By | null>(null)
  const [kart, settKart] = useState<'norge' | 'verden'>('norge')
  const synlige = EIENDOMSSTIGEN.filter((id) => eiendomSynlig(s, id))
  const viste = by ? synlige.filter((id) => EIENDOMSTYPER[id].by === by) : synlige
  const nesteSkjult = EIENDOMSSTIGEN.find((id) => !eiendomSynlig(s, id))
  const indeks = s.marked.eiendom
  const indeksEndring = indeks.historikk.length ? indeks.kurs / indeks.historikk[0] - 1 : 0

  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Eiendom</h1>

      <div className="kort eiendom-sammendrag">
        <div className="bank-rad">
          <div>
            <span className="etikett">Eiendommene dine</span>
            <span className="tall-stort">{kortKroner(eiendomsverdi(s))}</span>
          </div>
          <div className="bank-rente">
            <span className="etikett">Leie</span>
            <span className="pluss">{perSek(leiePerSek(s))}</span>
          </div>
        </div>
        <div className="segment" role="tablist" aria-label="Kart">
          {(['norge', 'verden'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={kart === k}
              className={kart === k ? 'aktiv' : ''}
              onClick={() => {
                settKart(k)
                settBy(null)
              }}
            >
              {k === 'norge' ? 'Norge' : 'Verden'}
            </button>
          ))}
        </div>
        {kart === 'norge' ? <Norgeskart s={s} valgt={by} velg={settBy} /> : <Verdenskart s={s} valgt={by} velg={settBy} />}
        <div className="indeks">
          <div>
            <span className="etikett">Eiendomsprisene</span>
            <span className={indeksEndring >= 0 ? 'pluss liten' : 'minus liten'}>{endring(indeksEndring)} siste 2 t</span>
          </div>
          <Minigraf verdier={[...indeks.historikk, indeks.kurs]} />
        </div>
        <p className="dempet liten">Leien kommer også mens du er borte — eiendom trenger ingen leder. Trykk på en by for å vise bare den.</p>
      </div>

      {by && (
        <button className="filterbrikke" onClick={() => settBy(null)}>
          Viser {by} · <strong>Vis alle</strong> ✕
        </button>
      )}

      <Seksjon
        id="eiendom-boliger"
        tittel="Boliger og bygg"
        sammendrag={`${Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0)} eid`}
        harInnhold={Object.keys(s.eiendommer).length > 0 || !!by}
      >
      <ul className="kortliste">
        {viste.map((id) => (
          <Eiendomskort key={id} s={s} id={id} />
        ))}
        {by && viste.length === 0 && <p className="kort kort-tomt">Ingen eiendommer til salgs i {by} ennå.</p>}
        {!by && nesteSkjult && (
          <li className="kort kjopskort laast">
            <BedriftIkon type={nesteSkjult} dempet />
            <div className="bedriftskort-midt">
              <h2>{EIENDOMSTYPER[nesteSkjult].navn}</h2>
              <span className="dempet liten">
                Til salgs når nettoformuen har vært {kortKroner(EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)}
              </span>
              <div className="milepael-spor">
                <div
                  className="milepael-fyll"
                  style={{ width: `${Math.min(1, s.hoyesteFormue / (EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)) * 100}%` }}
                />
              </div>
            </div>
          </li>
        )}
      </ul>
      </Seksjon>

      <Jordliste s={s} by={by} />
      {!by && <Landemerkeliste s={s} />}
    </section>
  )
}

function Eiendomskort({ s, id }: { s: Spilltilstand; id: EiendomId }) {
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
    <li className="kort bedriftskort">
      <div className="bedriftskort-topp">
        <BedriftIkon type={id} />
        <div className="bedriftskort-midt">
          <h2>
            {t.navn}
            {st > 0 && <span className={`merke-standard s${st}`}>{STANDARDER[st].navn}</span>}
          </h2>
          <span className="dempet">{t.sted}</span>
        </div>
        <div className="eiendom-tall">
          {oppussing ? <span className="dempet">Ingen leie</span> : <span className="pluss">{perSek(leieHverPerSek(s, id))}</span>}
          <span className="dempet liten">
            {eier} / {t.maksAntall} eid
          </span>
        </div>
      </div>
      <p className="dempet liten">
        Avkastning {tall(t.avkastning * STANDARDER[st].leie * 100)} % per time
        {t.statuskrav > 0 && ` · krever statusnivå ${t.statuskrav}`}
        {fly && ` · krever ${LUKSUS[fly].navn.toLowerCase()}`}
      </p>

      {oppussing ? (
        <div className="oppussing-pågår">
          <span>
            🛠️ Pusses opp til <strong>{STANDARDER[oppussing.standard].navn.toLowerCase()}</strong>
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
                    ? `${LUKSUS[fly].emoji} Krever ${LUKSUS[fly].navn.toLowerCase()}`
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
