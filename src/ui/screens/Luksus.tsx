import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import {
  brukteplasser,
  KATEGORINAVN,
  LAGER,
  LAGER_FOR,
  LAGERLISTE,
  LUKSUS,
  LUKSUSLISTE,
  restverdi,
  STATUS_INNTEKT,
  STATUS_RENTEKUTT,
  STATUSNIVAAER,
  statusnivaa,
  statuspoeng,
  utvidelsespris,
} from '../../engine/eiendom'
import { rentesats } from '../../engine/formler'
import { kjopLuksus, selgLuksus, utvidLager } from '../../engine/handlinger'
import type { LagerId, LuksusId, LuksusKategori, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { useState } from 'react'
import { Klubb, Klubbkort } from './Klubb'
import { Kunst } from '../komponenter/Kunst'
import { Seksjon } from '../komponenter/Seksjon'
import { Illustrasjon } from '../komponenter/Illustrasjoner'
import { NyMerke } from '../komponenter/Kjopsglimt'
import { Ikon, type Ikonnavn } from '../komponenter/Ikoner'

const KATEGORIER: LuksusKategori[] = ['bil', 'klokke', 'baat', 'fly']

export function Luksus({ s }: { s: Spilltilstand }) {
  const [klubb, settKlubb] = useState(false)
  if (klubb) return <Klubb s={s} tilbake={() => settKlubb(false)} />
  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Luksus</h1>
      <Status s={s} />
      <Klubbkort s={s} aapne={() => settKlubb(true)} />

      <div className="lagerliste">
        {LAGERLISTE.map((l) => (
          <Lagerkort key={l} s={s} lager={l} />
        ))}
      </div>

      {KATEGORIER.map((k) => {
        const ider = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === k).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)
        const eid = ider.filter((id) => s.luksus.includes(id)).length
        return (
          <Seksjon key={k} id={`luksus-${k}`} tittel={KATEGORINAVN[k]} sammendrag={`${eid} av ${ider.length} eid`} harInnhold={eid > 0}>
            <ul className="kortliste">
              {ider.map((id) => (
                <Luksuskort key={id} s={s} id={id} />
              ))}
            </ul>
          </Seksjon>
        )
      })}

      <Kunst s={s} />
    </section>
  )
}

function Status({ s }: { s: Spilltilstand }) {
  const nivaa = statusnivaa(s)
  const poeng = statuspoeng(s)
  const neste = STATUSNIVAAER[nivaa + 1]
  const fra = STATUSNIVAAER[nivaa].poeng
  const andel = neste ? (poeng - fra) / (neste.poeng - fra) : 1

  return (
    <div className="kort status">
      <div className="status-topp">
        <span className="status-merke">{nivaa}</span>
        <div>
          <span className="etikett">Statusnivå</span>
          <strong className="status-navn">{STATUSNIVAAER[nivaa].navn}</strong>
        </div>
        <span className="dempet liten status-poeng">{poeng} poeng</span>
      </div>
      <div className="milepael-spor">
        <div className="milepael-fyll" style={{ width: `${andel * 100}%` }} />
      </div>
      <p className="dempet liten">{neste ? `${neste.poeng - poeng} poeng til ${neste.navn}.` : 'Høyeste nivå nådd.'}</p>
      {/* Hva statusen gir, nå og på neste nivå — så det er klart hvorfor luksus lønner seg. */}
      <dl className="status-fordeler">
        <div>
          <dt>Inntekt fra bedriftene</dt>
          <dd>
            +{tall(STATUS_INNTEKT * nivaa * 100)} %
            {neste && <span className="dempet"> → +{tall(STATUS_INNTEKT * (nivaa + 1) * 100)} %</span>}
          </dd>
        </div>
        <div>
          <dt>Rente på lån, per time</dt>
          <dd>
            {tall(rentesats(s) * 100, 1)} %
            {neste && <span className="dempet"> → {tall((rentesats(s) - STATUS_RENTEKUTT) * 100, 1)} %</span>}
          </dd>
        </div>
      </dl>
      <p className="dempet liten">
        Hvert statusnivå gir +{tall(STATUS_INNTEKT * 100)} % inntekt og kutter lånerenten med {tall(STATUS_RENTEKUTT * 100, 1)} prosentpoeng.
      </p>
    </div>
  )
}

function Luksuskort({ s, id }: { s: Spilltilstand; id: LuksusId }) {
  const g = LUKSUS[id]
  const eier = s.luksus.includes(id)
  const lager = LAGER_FOR[g.kategori]
  const ingenPlass = !eier && lager !== null && brukteplasser(s, lager) >= s.lager[lager]

  return (
    <li className={eier ? 'kort kjopskort luksuskort eid' : 'kort kjopskort luksuskort'} data-ny={id}>
      <BedriftIkon type={id} stor />
      <div className="bedriftskort-midt">
        <h2>
          {g.navn}
          <NyMerke id={id} />
        </h2>
        <span className="gull liten">+{g.status} status</span>
      </div>
      {eier ? (
        <Bekreftknapp className="knapp knapp-liten" onJa={() => utfor(selgLuksus(s, id))}>
          Selg · {kortKroner(restverdi(id))}
        </Bekreftknapp>
      ) : (
        <button
          className="knapp knapp-gull knapp-liten"
          disabled={ingenPlass || s.kontanter < g.pris}
          onClick={() => utfor(kjopLuksus(s, id))}
        >
          {ingenPlass ? `Ingen plass i ${LAGER[lager!].bestemt}` : `Kjøp · ${kortKroner(g.pris)}`}
        </button>
      )}
    </li>
  )
}

const LAGERIKON: Record<LagerId, Ikonnavn> = { garasje: 'garasje', havn: 'anker', hangar: 'hangar' }

/** Garasjen, havna eller hangaren som et rutenett: brukte plasser viser hva som står der, ledige er stiplet. */
function Lagerkort({ s, lager }: { s: Spilltilstand; lager: LagerId }) {
  const l = LAGER[lager]
  const pris = utvidelsespris(s, lager)
  const her = s.luksus.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === lager)
  const ledige = Math.max(0, s.lager[lager] - her.length)
  return (
    <div className="kort lagerkort">
      <div className="lagerkort-topp">
        <span className="lager-emoji" aria-hidden="true">
          <Ikon navn={LAGERIKON[lager]} størrelse={22} />
        </span>
        <strong>{l.navn}</strong>
        <span className="dempet liten">
          {brukteplasser(s, lager)} / {s.lager[lager]} {l.enhet}
        </span>
      </div>
      <ul className="lagerplasser">
        {her.map((id) => (
          <li key={id} className="lagerplass brukt" title={LUKSUS[id].navn}>
            <Illustrasjon id={id} størrelse={30} />
          </li>
        ))}
        {Array.from({ length: ledige }, (_, i) => (
          <li key={`ledig-${i}`} className="lagerplass ledig" aria-label="Ledig plass" />
        ))}
        <li>
          <button
            className="lagerplass ny"
            disabled={s.kontanter < pris}
            onClick={() => utfor(utvidLager(s, lager))}
            aria-label={`Bygg én plass til for ${kortKroner(pris)}`}
          >
            <span>+</span>
            <span className="liten">{kortKroner(pris)}</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
