import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import {
  brukteplasser,
  KATEGORI_I,
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
  lagernavn,
  lagertrinn,
  nesteLagertrinn,
  TRINN_PLASSER,
} from '../../engine/eiendom'
import { rentesats } from '../../engine/formler'
import { byggLagertrinn, hentHjem, kjopLuksus, leiUt, selgLuksus, utvidLager } from '../../engine/handlinger'
import type { LagerId, LuksusId, Spilltilstand, UnikId } from '../../engine/types'
import { charterPerSekFor, iSesong, kanLeiesUt } from '../../engine/charter'
import { dagnummer } from '../../engine/kalender'
import { mineUnike, UNIKE } from '../../engine/unike'
import { Auksjonskort, Unikkort } from '../komponenter/Auksjon'
import { Racingdetalj, Racingrad } from '../komponenter/Racing'
import { aapneRacing, useRacingside } from '../racingside'
import { aapneLager, useLagerside } from '../lagerside'
import { Samlingsoversikt } from '../komponenter/Samlingsoversikt'
import { useVoksUt } from '../overgang'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { Apneknapp, BedriftIkon, Scene } from '../komponenter/BedriftIkon'
import { trykkApner } from '../detaljvisning'
import { useEffect, useState, type ReactNode } from 'react'
import { aapneTing, FANE_FOR, useTing } from '../detaljvisning'
import { Tingdetalj } from './Tingdetalj'
import { Klubbdel, Klubbdetalj } from './Klubb'
import { aapneKlubbside, useKlubbside } from '../klubbsider'
import { Kunst } from '../komponenter/Kunst'
import { Hjemmene } from '../komponenter/Hjemmene'
import { Illustrasjon } from '../komponenter/Illustrasjoner'
import { NyMerke } from '../komponenter/Kjopsglimt'
import { Ikon, type Ikonnavn } from '../komponenter/Ikoner'
import { useTilbake } from '../tilbake'
import { LUKSUSDELER, luksusdel } from '../deler'
import { visKlubb } from '../klubblive'

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
  // Klubbens sider (Pakke 77) står i stedet for skjermen, som tingsidene.
  const klubbside = useKlubbside()
  useEffect(() => () => aapneKlubbside(null), [])
  const klubbAapen = klubbside !== null && del === 'klubb' && !!s.klubb
  useTilbake(klubbAapen, () => aapneKlubbside(null))
  // Racingteamets side (Pakke 90), fra raden i Samling.
  const racing = useRacingside()
  useEffect(() => () => aapneRacing(false), [])
  const racingAapen = racing && del === 'samling' && !!s.racing
  useTilbake(racingAapen, () => aapneRacing(false))
  // Pakke 91: garasjen, havna eller hangaren i full størrelse.
  const lagerside = useLagerside()
  useEffect(() => () => aapneLager(null), [])
  const lagerAapen = lagerside !== null && del === 'samling'
  useTilbake(lagerAapen, () => aapneLager(null))
  if (ting && egenTing) return <Tingdetalj s={s} ting={ting} tilbake={() => aapneTing(null)} fane="Luksus" />
  if (racingAapen) return <Racingdetalj s={s} tilbake={() => aapneRacing(false)} />
  if (lagerAapen) return <Lagerdetalj s={s} lager={lagerside} tilbake={() => aapneLager(null)} />
  if (klubbAapen) return <Klubbdetalj s={s} k={visKlubb(s, s.klubb!)} side={klubbside} tilbake={() => aapneKlubbside(null)} />
  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Luksus</h1>
      {del === 'klubb' ? <Statusstripe s={s} /> : <Status s={s} />}
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


/**
 * Samlingen: oversikten over alt øverst (Pakke 91), der en silhuett åpner tingens
 * side og kjøpet, så bilene, båtene og flyene du eier i scenen sin (garasjen,
 * havna, hangaren) — en ledig plass viser det neste. Klokkene står i klokkeskapet
 * (G20). «Til salgs»-listene under scenene er borte: oversikten viser alt som finnes.
 */
function Samling({ s }: { s: Spilltilstand }) {
  return (
    <>
      <Auksjonskort s={s} />
      <Samlingsoversikt s={s} />
      {LAGERLISTE.map((l) => (
        <div key={l} className="lagerliste">
          <Lagerkort s={s} lager={l} />
          {l === 'garasje' && <Racingrad s={s} />}
        </div>
      ))}
      <Klokkeskap s={s} />
    </>
  )
}

/**
 * Klokkeskapet (G20): klokkene får et sted, som bilene, båtene og flyene — et
 * opplyst glasskap med en fløyelspute per klokke. De du eier og de unike fra
 * auksjonene står på puta si (nærbildet uten esken), og den neste du kan kjøpe står
 * dempet. Klokker tar ingen plass, så det er ingen «bygg plass». Et trykk viser
 * kortet under, som i garasjen.
 */
function Klokkeskap({ s }: { s: Spilltilstand }) {
  const [valgt, velg] = useState<Lagervalg>(null)
  const klokker = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === 'klokke').sort(etterPris)
  const eide = klokker.filter((id) => s.luksus.includes(id))
  // Pakke 89: de unike klokkene står sammen med de andre.
  const unike = mineUnike(s).filter((id) => UNIKE[id].kategori === 'klokke')
  const neste = klokker.find((id) => !s.luksus.includes(id))
  const trykk = (v: Lagervalg) => velg(JSON.stringify(v) === JSON.stringify(valgt) ? null : v)
  return (
    <div className="kort lagerkort klokkeskap">
      <div className="lagerkort-topp">
        <span className="lager-emoji" aria-hidden="true">
          <Ikon navn="klokke" størrelse={22} />
        </span>
        <strong>Klokkeskapet</strong>
        <span className="dempet liten">
          {eide.length} av {klokker.length} {KATEGORINAVN.klokke.toLowerCase()}
          {unike.length > 0 && ` · ${unike.length} unik${unike.length > 1 ? 'e' : ''}`}
        </span>
      </div>
      <div className="lagerscene" role="list" aria-label="Klokkeskapet" data-ingen-sveip>
        {eide.map((id) => (
          <Plass key={id} lager="skap" navn={LUKSUS[id].navn} under={`+${LUKSUS[id].status} status`} valgt={valgt?.slag === 'eid' && valgt.id === id} trykk={() => trykk({ slag: 'eid', id })}>
            <Illustrasjon id={id} størrelse={64} utklipp naerbilde={NAER_SKAP} />
          </Plass>
        ))}
        {unike.map((id) => (
          <Plass key={id} lager="skap" klasse="unik" navn={UNIKE[id].navn} under={`Unik · +${UNIKE[id].status} status`} valgt={valgt?.slag === 'unik' && valgt.id === id} trykk={() => trykk({ slag: 'unik', id })}>
            <Illustrasjon id={UNIKE[id].tegning} størrelse={64} utklipp naerbilde={NAER_SKAP} />
          </Plass>
        ))}
        {neste && (
          <Plass lager="skap" klasse="ledig" navn={LUKSUS[neste].navn} under={kortKroner(LUKSUS[neste].pris)} valgt={valgt?.slag === 'ledig'} trykk={() => trykk({ slag: 'ledig' })}>
            <span className="plass-skygge">
              <Illustrasjon id={neste} størrelse={64} utklipp naerbilde={NAER_SKAP} />
            </span>
          </Plass>
        )}
      </div>
      {valgt?.slag === 'eid' && s.luksus.includes(valgt.id) && (
        <ul className="kortliste lager-valgt">
          <Luksuskort s={s} id={valgt.id} />
        </ul>
      )}
      {valgt?.slag === 'unik' && s.auksjon?.eide[valgt.id] && (
        <ul className="kortliste lager-valgt">
          <Unikkort s={s} id={valgt.id} />
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

/**
 * Statusen som én linje på Klubb (Pakke 77): klubbens egen topp skal ikke
 * starte en skjerm ned. Et trykk viser hele kortet.
 */
function Statusstripe({ s }: { s: Spilltilstand }) {
  const [aapen, settAapen] = useState(false)
  const nivaa = statusnivaa(s)
  const poeng = statuspoeng(s)
  const neste = STATUSNIVAAER[nivaa + 1]
  const fra = STATUSNIVAAER[nivaa].poeng
  const andel = neste ? (poeng - fra) / (neste.poeng - fra) : 1
  return (
    <>
      <button className="kort statusstripe" aria-expanded={aapen} onClick={() => settAapen(!aapen)}>
        <span className="status-merke">{nivaa}</span>
        <span className="statusstripe-midt">
          <span className="statusstripe-linje">
            <strong>{STATUSNIVAAER[nivaa].navn}</strong>
            <span className="dempet liten">{neste ? `${neste.poeng - poeng} poeng til ${neste.navn}` : 'Høyeste nivå'}</span>
          </span>
          <span className="milepael-spor">
            <span className="milepael-fyll" style={{ width: `${andel * 100}%` }} />
          </span>
        </span>
        <span className={`seksjon-pil${aapen ? ' snudd' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>
      {aapen && <Status s={s} />}
    </>
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
  // Pakke 89: yachtene og jetene kan leies ut.
  const charter = eier && kanLeiesUt(id)
  const ute = s.charter?.[id]

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
        <span className="dempet liten">{g.linje}</span>
        {charter && <span className="dempet liten">{charterlinje(s, id)}</span>}
      </div>
      {charter ? (
        <div className="eiendom-knapper">
          <button className="knapp knapp-liten" disabled={ute?.hentes} onClick={() => utfor(ute ? hentHjem(s, id) : leiUt(s, id))}>
            {ute ? (ute.hentes ? 'På vei hjem' : 'Hent hjem') : 'Lei ut'}
          </button>
          <Bekreftknapp className="knapp knapp-liten" disabled={!!ute} onJa={() => utfor(selgLuksus(s, id))}>
            Selg · {kortKroner(restverdi(id))}
          </Bekreftknapp>
        </div>
      ) : eier ? (
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

/** «Leid ut · kr 12 mill i timen, høysesong» — eller hva den kan gi, når den står hjemme. */
export function charterlinje(s: Spilltilstand, id: LuksusId): string {
  const ute = s.charter?.[id]
  const sesong = iSesong(id, dagnummer(s.sek)) ? 'høysesong' : 'lavsesong'
  const timen = `${kortKroner(charterPerSekFor(s, id) * 3600)} i timen`
  if (ute?.hentes) return 'Kommer hjem i morgen'
  return ute ? `Leid ut · ${timen}, ${sesong}` : `Kan leies ut for ${timen} nå, ${sesong}`
}

/** Nærbildet på en plass i lageret. Fast, så Illustrasjon (memo) ikke tegnes på nytt hvert sekund (Pakke 64). */
const NAER_PLASS = [86, 74] as const
/** … i klokkeskapet (G20) litt mindre, så fløyelen og glasshylla synes rundt puta … */
const NAER_SKAP = [70, 60] as const
/** … og i full størrelse (Pakke 91): en plass er 153 px bred på en telefon, nærbildet fyller ni tideler av den. */
const NAER_STOR = [138, 119] as const

const LAGERIKON: Record<LagerId, Ikonnavn> = { garasje: 'garasje', havn: 'anker', hangar: 'hangar' }

type Lagervalg = { slag: 'eid'; id: LuksusId } | { slag: 'unik'; id: UnikId } | { slag: 'ledig' } | null

/**
 * Garasjen, havna eller hangaren som en scene, som gatebildet for eiendom:
 * bilene står parkert i hver sin bås, båtene ligger ved brygga og flyene
 * står i hangaren. En ledig plass viser en skygge av det neste du kan kjøpe
 * dit, og bakerst kan du bygge en plass til. Trykk på en plass for kortet.
 */
function Lagerkort({ s, lager, stor = false }: { s: Spilltilstand; lager: LagerId; stor?: boolean }) {
  const [valgt, velg] = useState<Lagervalg>(null)
  // Pakke 91: på stedets egen side er hver plass dobbelt så stor, to i bredden.
  const naer = stor ? NAER_STOR : NAER_PLASS
  const str = stor ? 128 : 64
  const l = LAGER[lager]
  const pris = utvidelsespris(s, lager)
  // Pakke 88: stedet vokser i trinn — navnet står på skiltet, og gullkanten viser trinnet.
  const trinn = lagertrinn(s, lager)
  const nesteTrinn = nesteLagertrinn(s, lager)
  const her = s.luksus.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === lager).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)
  // Pakke 89: de unike tingene fra auksjonene står sammen med resten og tar en plass.
  const unike = mineUnike(s).filter((id) => UNIKE[id].kategori === KATEGORI_I[lager])
  const ledige = Math.max(0, s.lager[lager] - her.length - unike.length)
  // Det billigste i kategorien du ikke eier ennå — det er det en ledig plass venter på.
  const neste = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === KATEGORI_I[lager] && !s.luksus.includes(id)).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)[0]
  const trykk = (v: Lagervalg) => velg(JSON.stringify(v) === JSON.stringify(valgt) ? null : v)

  return (
    <div className={`kort lagerkort lager-${lager} lager-trinn-${trinn}${stor ? ' stor' : ''}`}>
      <div className="lagerkort-topp">
        <span className="lager-emoji" aria-hidden="true">
          <Ikon navn={LAGERIKON[lager]} størrelse={22} />
        </span>
        {stor ? (
          <strong className={trinn > 0 ? 'lager-skilt' : undefined}>{lagernavn(s, lager)}</strong>
        ) : (
          <button className="lager-apne" onClick={() => aapneLager(lager)} aria-label={`Åpne ${lagernavn(s, lager).toLowerCase()} i full størrelse`}>
            <strong className={trinn > 0 ? 'lager-skilt' : undefined}>{lagernavn(s, lager)}</strong>
            <span className="gull" aria-hidden="true">
              ›
            </span>
          </button>
        )}
        <span className="dempet liten">
          {brukteplasser(s, lager)} / {s.lager[lager]} {l.enhet}
        </span>
      </div>
      <div className="lagerscene" role="list" aria-label={l.navn} data-ingen-sveip>
        {her.map((id) => (
          <Plass
            key={id}
            lager={lager}
            klasse={s.charter?.[id] ? 'utleid' : ''}
            navn={LUKSUS[id].navn}
            under={s.charter?.[id] ? 'Leid ut' : `+${LUKSUS[id].status} status`}
            valgt={valgt?.slag === 'eid' && valgt.id === id}
            trykk={() => trykk({ slag: 'eid', id })}
          >
            <Illustrasjon id={id} størrelse={str} utklipp naerbilde={naer} />
          </Plass>
        ))}
        {unike.map((id) => (
          <Plass key={id} lager={lager} klasse="unik" navn={UNIKE[id].navn} under={`Unik · +${UNIKE[id].status} status`} valgt={valgt?.slag === 'unik' && valgt.id === id} trykk={() => trykk({ slag: 'unik', id })}>
            <Illustrasjon id={UNIKE[id].tegning} størrelse={str} utklipp naerbilde={naer} />
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
                <Illustrasjon id={neste} størrelse={str} utklipp naerbilde={naer} />
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
      {nesteTrinn && s.lager[lager] > 0 && (
        <div className="personale-rad lager-trinnrad">
          <p className="dempet liten">
            Bygg ut til <strong>{nesteTrinn.navn.toLowerCase()}</strong>: +{nesteTrinn.status} status og {TRINN_PLASSER} plasser til.
          </p>
          <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < nesteTrinn.pris} onClick={() => utfor(byggLagertrinn(s, lager))}>
            Bygg · {kortKroner(nesteTrinn.pris)}
          </button>
        </div>
      )}
      {valgt?.slag === 'eid' && s.luksus.includes(valgt.id) && (
        <ul className="kortliste lager-valgt">
          <Luksuskort s={s} id={valgt.id} />
        </ul>
      )}
      {valgt?.slag === 'unik' && s.auksjon?.eide[valgt.id] && (
        <ul className="kortliste lager-valgt">
          <Unikkort s={s} id={valgt.id} />
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

/** Garasjen, havna eller hangaren i full størrelse (Pakke 91), med tilbake til Samling. */
function Lagerdetalj({ s, lager, tilbake }: { s: Spilltilstand; lager: LagerId; tilbake: () => void }) {
  const voks = useVoksUt<HTMLElement>()
  return (
    <section className="skjerm detalj lagerdetalj" ref={voks}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Luksus
      </button>
      <h1 className="skjerm-tittel">{lagernavn(s, lager)}</h1>
      <Lagerkort s={s} lager={lager} stor />
    </section>
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
  lager: LagerId | 'skap'
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
