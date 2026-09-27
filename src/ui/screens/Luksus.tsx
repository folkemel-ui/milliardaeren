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
  STATUSNIVAAER,
  statusnivaa,
  statuspoeng,
  utvidelsespris,
} from '../../engine/eiendom'
import { rentesats } from '../../engine/formler'
import { kjopLuksus, selgLuksus, utvidLager } from '../../engine/handlinger'
import type { LuksusId, LuksusKategori, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { BedriftIkon } from '../komponenter/BedriftIkon'

const KATEGORIER: LuksusKategori[] = ['bil', 'klokke', 'baat', 'fly']

export function Luksus({ s }: { s: Spilltilstand }) {
  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Luksus</h1>
      <Status s={s} />

      <div className="lagerrad">
        {LAGERLISTE.map((l) => {
          const pris = utvidelsespris(s, l)
          return (
            <div key={l} className="kort lagerkort">
              <span className="lager-emoji" aria-hidden="true">{LAGER[l].emoji}</span>
              <strong>{LAGER[l].navn}</strong>
              <span className="dempet liten">
                {brukteplasser(s, l)} / {s.lager[l]} {LAGER[l].enhet}
              </span>
              <button className="knapp knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(utvidLager(s, l))}>
                +1 · {kortKroner(pris)}
              </button>
            </div>
          )
        })}
      </div>

      {KATEGORIER.map((k) => (
        <div key={k} className="skjerm">
          <h2 className="seksjon-tittel">{KATEGORINAVN[k]}</h2>
          <ul className="kortliste">
            {LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === k).map((id) => (
              <Luksuskort key={id} s={s} id={id} />
            ))}
          </ul>
        </div>
      ))}
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
      <p className="dempet liten">
        {neste ? `${neste.poeng - poeng} poeng til ${neste.navn}. ` : 'Høyeste nivå nådd. '}
        Nå: +{tall(STATUS_INNTEKT * nivaa * 100)} % inntekt fra bedriftene, rente {tall(rentesats(s) * 100, 1)} % per time.
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
    <li className={eier ? 'kort kjopskort eid' : 'kort kjopskort'}>
      <BedriftIkon type={id} />
      <div className="bedriftskort-midt">
        <h2>{g.navn}</h2>
        <span className="gull liten">+{g.status} status</span>
      </div>
      {eier ? (
        <button className="knapp knapp-liten" onClick={() => utfor(selgLuksus(s, id))}>
          Selg · {kortKroner(restverdi(id))}
        </button>
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
