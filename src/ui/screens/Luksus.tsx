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
import { Apneknapp, BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { trykkApner } from '../detaljvisning'
import { useEffect, useState, type ReactNode } from 'react'
import { aapneTing, FANE_FOR, useTing } from '../detaljvisning'
import { Tingdetalj } from './Tingdetalj'
import { Klubbdel } from './Klubb'
import { Kunst } from '../komponenter/Kunst'
import { Hjemmene } from '../komponenter/Hjemmene'
import { Seksjon } from '../komponenter/Seksjon'
import { Illustrasjon } from '../komponenter/Illustrasjoner'
import { NyMerke } from '../komponenter/Kjopsglimt'
import { Ikon, type Ikonnavn } from '../komponenter/Ikoner'
import { useTilbake } from '../tilbake'
import { LUKSUSDELER, luksusdel } from '../deler'

/** Prisrekkefølge: lista over det som er til salgs, og klokkene, starter med det billigste. */
const etterPris = (a: LuksusId, b: LuksusId) => LUKSUS[a].pris - LUKSUS[b].pris

/**
 * Luksus i fire deler (Pakke 62): Samling (garasjen, havna, hangaren og
 * klokkene), Hjem, Kunst og Klubb. Statusen står over delene, for alle fire
 * gir statuspoeng. Delen du sist hadde åpen, huskes.
 */
export function Luksus({ s }: { s: Spilltilstand }) {
  const del = luksusdel.bruk()
  const ting = useTing()
  // Detaljsiden lukkes når du bytter fane.
  useEffect(() => () => aapneTing(null), [])
  const egenTing = ting !== null && FANE_FOR[ting.slag] === 'luksus'
  useTilbake(egenTing, () => aapneTing(null))
  if (ting && egenTing) return <Tingdetalj s={s} ting={ting} tilbake={() => aapneTing(null)} fane="Luksus" />
  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Luksus</h1>
      <Status s={s} />
      <div className="segment" role="tablist" aria-label="Luksus">
        {LUKSUSDELER.map((d) => (
          <button key={d.id} role="tab" aria-selected={del === d.id} className={del === d.id ? 'aktiv' : ''} onClick={() => luksusdel.sett(d.id)}>
            {d.navn}
          </button>
        ))}
      </div>
      {del === 'samling' && <Samling s={s} />}
      {del === 'hjem' && <Hjemmene s={s} />}
      {del === 'kunst' && <Kunst s={s} />}
      {del === 'klubb' && <Klubbdel s={s} />}
    </section>
  )
}

/** Hvilken luksuskategori som står i hvert lager. */
const KATEGORI_I: Record<LagerId, LuksusKategori> = { garasje: 'bil', havn: 'baat', hangar: 'fly' }

/**
 * Samlingen: bilene, båtene og flyene du eier, står bare i scenen sin
 * (garasjen, havna, hangaren). Under hver scene ligger det som er til salgs,
 * så hver ting vises én gang. Klokkene ligger i bankboksen og har ingen scene.
 */
function Samling({ s }: { s: Spilltilstand }) {
  const klokker = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === 'klokke').sort(etterPris)
  const eideKlokker = klokker.filter((id) => s.luksus.includes(id))
  return (
    <>
      {LAGERLISTE.map((l) => (
        <div key={l} className="lagerliste">
          <Lagerkort s={s} lager={l} />
          <TilSalgs s={s} kategori={KATEGORI_I[l]} />
        </div>
      ))}
      <Seksjon id="luksus-klokke" tittel={KATEGORINAVN.klokke} sammendrag={`${eideKlokker.length} av ${klokker.length} eid`} harInnhold={eideKlokker.length > 0}>
        <ul className="kortliste">
          {[...eideKlokker, ...klokker.filter((id) => !s.luksus.includes(id))].map((id) => (
            <Luksuskort key={id} s={s} id={id} />
          ))}
        </ul>
      </Seksjon>
    </>
  )
}

/** Det i kategorien du ikke eier ennå. Sammenfoldet fra start: den ledige plassen i scenen viser alt det neste. */
function TilSalgs({ s, kategori }: { s: Spilltilstand; kategori: LuksusKategori }) {
  const ider = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === kategori && !s.luksus.includes(id)).sort(etterPris)
  if (ider.length === 0) return null
  return (
    <Seksjon id={`luksus-salg-${kategori}`} tittel={`${KATEGORINAVN[kategori]} til salgs`} sammendrag={`${ider.length} · fra ${kortKroner(LUKSUS[ider[0]].pris)}`} harInnhold={false}>
      <ul className="kortliste">
        {ider.map((id) => (
          <Luksuskort key={id} s={s} id={id} />
        ))}
      </ul>
    </Seksjon>
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

/** Kortet for en luksusgjenstand. Et trykk åpner detaljsiden, der kortet står under den store scenen (`iDetalj`). */
export function Luksuskort({ s, id, iDetalj = false }: { s: Spilltilstand; id: LuksusId; iDetalj?: boolean }) {
  const g = LUKSUS[id]
  const eier = s.luksus.includes(id)
  const lager = LAGER_FOR[g.kategori]
  const ingenPlass = !eier && lager !== null && brukteplasser(s, lager) >= s.lager[lager]

  return (
    <li
      className={`kort kjopskort luksuskort${eier ? ' eid' : ''}${iDetalj ? ' i-detalj' : ' kan-aapnes'}`}
      data-ny={id}
      onClick={iDetalj ? undefined : trykkApner({ slag: 'luksus', id })}
    >
      {iDetalj ? (
        <Scene type={id} />
      ) : (
        <Apneknapp ting={{ slag: 'luksus', id }} navn={g.navn}>
          <BedriftIkon type={id} stor />
        </Apneknapp>
      )}
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

type Lagervalg = { slag: 'eid'; id: LuksusId } | { slag: 'ledig' } | null

/**
 * Garasjen, havna eller hangaren som en scene, som gatebildet for eiendom:
 * bilene står parkert i hver sin bås, båtene ligger ved brygga og flyene
 * står i hangaren. En ledig plass viser en skygge av det neste du kan kjøpe
 * dit, og bakerst kan du bygge en plass til. Trykk på en plass for kortet.
 */
function Lagerkort({ s, lager }: { s: Spilltilstand; lager: LagerId }) {
  const [valgt, velg] = useState<Lagervalg>(null)
  const l = LAGER[lager]
  const pris = utvidelsespris(s, lager)
  const her = s.luksus.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === lager).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)
  const ledige = Math.max(0, s.lager[lager] - her.length)
  // Det billigste i kategorien du ikke eier ennå — det er det en ledig plass venter på.
  const neste = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === KATEGORI_I[lager] && !s.luksus.includes(id)).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)[0]
  const trykk = (v: Lagervalg) => velg(JSON.stringify(v) === JSON.stringify(valgt) ? null : v)

  return (
    <div className={`kort lagerkort lager-${lager}`}>
      <div className="lagerkort-topp">
        <span className="lager-emoji" aria-hidden="true">
          <Ikon navn={LAGERIKON[lager]} størrelse={22} />
        </span>
        <strong>{l.navn}</strong>
        <span className="dempet liten">
          {brukteplasser(s, lager)} / {s.lager[lager]} {l.enhet}
        </span>
      </div>
      <div className="lagerscene" role="list" aria-label={l.navn} data-ingen-sveip>
        {her.map((id) => (
          <Plass key={id} lager={lager} navn={LUKSUS[id].navn} under={`+${LUKSUS[id].status} status`} valgt={valgt?.slag === 'eid' && valgt.id === id} trykk={() => trykk({ slag: 'eid', id })}>
            <Illustrasjon id={id} størrelse={64} utklipp naerbilde={[86, 74]} />
          </Plass>
        ))}
        {Array.from({ length: ledige }, (_, i) => (
          <Plass
            key={`ledig-${i}`}
            lager={lager}
            klasse="ledig"
            navn="Ledig plass"
            under={neste ? LUKSUS[neste].navn : 'Alt er kjøpt'}
            valgt={i === 0 && valgt?.slag === 'ledig'}
            trykk={() => neste && trykk({ slag: 'ledig' })}
          >
            {neste && (
              <span className="plass-skygge">
                <Illustrasjon id={neste} størrelse={64} utklipp naerbilde={[86, 74]} />
              </span>
            )}
          </Plass>
        ))}
        <div role="listitem" className="plass-hylle">
          <button
            className={`plass ${lager} ny`}
            disabled={s.kontanter < pris}
            onClick={() => utfor(utvidLager(s, lager))}
            aria-label={`Bygg én plass til for ${kortKroner(pris)}`}
          >
            <span className="plass-bilde">
              <span className="plass-pluss" aria-hidden="true">
                +
              </span>
            </span>
            <span className="plass-navn">Bygg plass</span>
            <span className="plass-under">{kortKroner(pris)}</span>
          </button>
        </div>
      </div>
      {valgt?.slag === 'eid' && s.luksus.includes(valgt.id) && (
        <ul className="kortliste lager-valgt">
          <Luksuskort s={s} id={valgt.id} />
        </ul>
      )}
      {valgt?.slag === 'ledig' && neste && (
        <ul className="kortliste lager-valgt">
          <Luksuskort s={s} id={neste} />
        </ul>
      )}
    </div>
  )
}

/** Én plass i lageret: tegningen på bakgrunnen (vegg og gulv, sjø og brygge, hangar), navnet og en linje under. */
function Plass({
  lager,
  klasse = '',
  navn,
  under,
  valgt,
  trykk,
  children,
}: {
  lager: LagerId
  klasse?: string
  navn: string
  under: string
  valgt: boolean
  trykk: () => void
  children: ReactNode
}) {
  return (
    <div role="listitem" className="plass-hylle">
      <button className={`plass ${lager} ${klasse}${valgt ? ' valgt' : ''}`} aria-pressed={valgt} onClick={trykk}>
        <span className="plass-bilde">{children}</span>
        <span className="plass-navn">{navn}</span>
        <span className="plass-under">{under}</span>
      </button>
    </div>
  )
}
