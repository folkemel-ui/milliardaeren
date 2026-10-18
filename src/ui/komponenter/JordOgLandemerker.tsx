import { antallDyr, DYR, DYRLISTE, dyrGir, dyrKasseNaa, dyrPerUke, dyrpris, fjosplasser, nesteKlipping, nesteSlakt, SLAKT_DAGER } from '../../engine/dyr'
import { byggKraftverk, hoggSkog, jordSynlig, kjopDyr, kjopGardsbygg, kjopJord, kjopJorde, kjopLandemerke, kjopMaskin, kjopNabogard, selgJord, selgKorn, selgLandemerke, settLagring } from '../../engine/handlinger'
import { Bekreftknapp } from './Bekreftknapp'
import {
  AVLINGER,
  byggpris,
  byggSperre,
  DRIVHUSAVLING,
  GARDSBYGG,
  GARDSBYGGLISTE,
  GRUPPELISTE,
  GRUPPENAVN,
  gardGir,
  gruppePerUke,
  lagerAv,
  lagerkapasitet,
  lagerverdi,
  lagringsvalg,
  SELG_DYRT,
  ukeFor,
  GARDSTRINN,
  gardstrinn,
  HOST_ANDEL,
  hostSaLangt,
  lagerFullt,
  reddetSaLangt,
  tidTilHost,
  ukefaktorSaLangt,
  JORD,
  JORD_SYNLIG_VED,
  JORDLISTE,
  jorder,
  landverdi,
  MAKS_JORDER,
  MASKINER,
  MASKINLISTE,
  maskinpris,
  maskintekst,
  maskintrinn,
  MAKS_MASKINTRINN,
  MAKS_NABOER,
  NABO_FAKTOR,
  NABO_STATUS,
  nabopris,
  naboer,
  forventetUke,
  KRAFTVERK,
  kraftpris,
  kraftSperre,
  kraftverkFor,
  kraftverkPerSek,
  kraftverkUke,
  nesteJordpris,
  dagerTilHogst,
  skogalder,
  tommervekst,
  tommerverdi,
  ukensGardHost,
  vaer,
} from '../../engine/jord'
import {
  eierDu,
  kjopsprisLandemerke,
  LANDEMERKE_HONORAR,
  LANDEMERKELISTE,
  LANDEMERKER,
  landemerkepris,
  rivalerSomKan,
  TILBAKEKJOP_PREMIE,
} from '../../engine/landemerker'
import { MEGLERHONORAR } from '../../engine/eiendom'
import { DAG_SEK, dagnummer, dato, MÅNEDER, ukedag, ukenummer } from '../../engine/kalender'
import type { By, Gardstall, JordId, LandemerkeId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall, varighet } from '../format'
import { Apneknapp, BedriftIkon, Scene } from './BedriftIkon'
import { Avlingspriser } from './Avlingspriser'
import { Ikon, type Ikonnavn } from './Ikoner'
import { vaerPaaDag, VAERTYPER, type Vaertype } from '../../engine/verden'
import { aapneTing, trykkApner } from '../detaljvisning'
import { aapneGardsside, GARDSSIDER, type Gardsside } from '../gardssider'
import { Seksjon } from './Seksjon'
import { gardTekst } from '../inntjening'
import type { Avlingsgruppe } from '../../engine/jord'
import type { Lagring } from '../../engine/types'

/** Gårder og skoger — filtrert på by når en by er valgt på kartet. */
export function Jordliste({ s, by }: { s: Spilltilstand; by: By | null }) {
  const synlige = JORDLISTE.filter((id) => (s.jord[id] || jordSynlig(s, id)) && (!by || JORD[id].by === by))
  const neste = JORDLISTE.find((id) => !jordSynlig(s, id))
  if (synlige.length === 0 && (by || !neste)) return null
  const v = vaer(dagnummer(s.sek))
  const eide = JORDLISTE.filter((id) => s.jord[id]).length
  return (
    <Seksjon id="eiendom-jord" tittel="Jord og skog" forklaring="jord" sammendrag={`${eide} av ${JORDLISTE.length} eid`} harInnhold={eide > 0 || !!by}>
      <p className="dempet liten">
        Ukas vær: <strong>{v.navn.toLowerCase()}</strong>. Gårdene høstes mandag morgen.
      </p>
      <ul className="kortliste">
        {synlige.map((id) => (
          <Jordkort key={id} s={s} id={id} />
        ))}
        {!by && neste && (
          <li className="kort kjopskort laast">
            <BedriftIkon type={neste} dempet />
            <div className="bedriftskort-midt">
              <h2>{JORD[neste].navn}</h2>
              <span className="dempet liten">Til salgs når nettoformuen har vært {kortKroner(JORD[neste].pris * JORD_SYNLIG_VED)}</span>
            </div>
          </li>
        )}
      </ul>
    </Seksjon>
  )
}

/** «Gods med 2 nabogårder · odelsgård · 10 av 10 jorder» (Pakke 114). */
function gardsnavn(j: NonNullable<Spilltilstand['jord'][JordId]>): string {
  const n = naboer(j)
  const nabo = n > 0 ? ` med ${n} ${n === 1 ? 'nabogård' : 'nabogårder'}` : ''
  return `${GARDSTRINN[gardstrinn(j)].navn}${nabo}${j.odel ? ' · odelsgård' : ''} · ${jorder(j)} av ${MAKS_JORDER} jorder`
}

/** Kortet for en gård eller skog. Avlingen er ukas, for dagene du eier gården. Et trykk åpner detaljsiden (`iDetalj`). */
export function Jordkort({ s, id, iDetalj = false }: { s: Spilltilstand; id: JordId; iDetalj?: boolean }) {
  const t = JORD[id]
  const eid = s.jord[id]
  const land = landverdi(s, id)
  const tommer = tommerverdi(s, id)
  // Pakke 92: jordene og maskinene teller i verdien og følger med i salget.
  const bygd = eid?.investert ?? 0
  const gard = t.type === 'gard'
  return (
    <li className={`kort bedriftskort${eid ? ' eid' : ''}${iDetalj ? '' : ' kan-aapnes'}`} onClick={iDetalj ? undefined : trykkApner({ slag: 'jord', id })}>
      {iDetalj && <Scene type={id} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'jord', id }} navn={t.navn}>
            <BedriftIkon type={id} stor />
          </Apneknapp>
        )}
        <div className="bedriftskort-midt">
          <h2>{t.navn}</h2>
          <span className="dempet">
            {eid && gard ? gardsnavn(eid) : t.sted}
          </span>
        </div>
        <div className="eiendom-tall">
          <span>{kortKroner(land + tommer + bygd)}</span>
          <span className="dempet liten">{eid ? 'verdi' : 'pris'}</span>
        </div>
      </div>
      <p className="dempet liten">
        {/* Pakke 112: det uka har gitt så langt stiger mens du ser på, og når høsten kommer. */}
        {t.type === 'gard'
          ? eid
            ? `Så langt denne uka ${kortKroner(hostSaLangt(s, id))} av omtrent ${kortKroner(ukensGardHost(s, id))}. Høstes mandag, om ${varighet(tidTilHost(s))}.`
            : `Gir omtrent ${kortKroner(land * HOST_ANDEL)} i uka i et normalt år`
          : eid
            ? `Tømmer ${kortKroner(tommer)} etter ${tall(skogalder(s, id))} dager`
            : 'Kjøpes nyplantet. Tømmeret vokser fra første dag.'}
      </p>
      {eid && t.type === 'skog' && <Skogstatus s={s} id={id} />}
      {eid && gard && <Ukedager s={s} id={id} />}
      {eid && gard && lagerFullt(s, id) && (
        <p className="liten">
          <span className="merke varsel">Silo full</span> <span className="dempet">Det som ikke får plass, selges mandag til ukas pris.</span>
        </p>
      )}
      {eid ? (
        <div className={t.type === 'skog' ? 'eiendom-knapper' : 'eiendom-knapper en'}>
          {t.type === 'skog' && (
            <button className="knapp knapp-gull" disabled={tommer < 1} onClick={() => utfor(hoggSkog(s, id))}>
              Hogg · {kortKroner(tommer)}
            </button>
          )}
          <Bekreftknapp onJa={() => utfor(selgJord(s, id))}>
            Selg · {kortKroner((land + tommer + bygd) * (1 - MEGLERHONORAR))}
          </Bekreftknapp>
        </div>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < land} onClick={() => utfor(kjopJord(s, id))}>
          Kjøp · {kortKroner(land)}
        </button>
      )}
    </li>
  )
}

/**
 * Når skogen bør hogges (Pakke 106): hvor fort tømmeret vokser nå, og hvor mange dager til
 * en hogst gir mest — eller «Klar for hogst». Før sto bare tømmeret og alderen der, og
 * hjelpeteksten sa at veksten var raskest de første 36 dagene; den topper ved dag 18.
 */
function Skogstatus({ s, id }: { s: Spilltilstand; id: JordId }) {
  const igjen = dagerTilHogst(s, id)
  return (
    <p className="dempet liten skogstatus">
      Vokser nå {kortKroner(tommervekst(s, id))} om dagen
      {igjen > 0 ? ` · best å hogge om ${tall(Math.ceil(igjen))} ${Math.ceil(igjen) === 1 ? 'dag' : 'dager'}` : ' · '}
      {igjen <= 0 && <span className="merke gull">Klar for hogst</span>}
    </p>
  )
}

/**
 * Gårdens kart (Pakke 92), på gårdens side: jordene som ruter — hva som vokser og hvor
 * langt det er kommet mot mandagens høst — og der neste jord kan legges til. Under
 * kartet maskinene. Trinnet (småbruk → gods) står øverst, med hva neste trinn gir.
 * Pakke 93: ukas priser over kartet, drivhuset som en ellevte rute, byggene under
 * maskinene, og kornlageret når gården har silo. Pakke 112: kartet står på «Jorder og
 * maskiner»; prisene og lageret har flyttet til «Lager og regnskap», fjøset til «Dyr».
 */
export function Gardskart({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j || JORD[id].type !== 'gard') return null
  const n = jorder(j)
  const trinn = gardstrinn(j)
  const neste = GARDSTRINN[trinn + 1]
  const pris = nesteJordpris(s, id)
  // Hvor langt uka er kommet: avlingen høstes mandag morgen.
  const vekst = (ukedag(s.sek) + (s.sek % DAG_SEK) / DAG_SEK) / 7
  return (
    <li className="kort gardskart">
      <div className="maal-topp">
        <h2 className="kort-tittel">{GARDSTRINN[trinn].navn}</h2>
        <span className="dempet liten">
          {n} av {MAKS_JORDER} jorder
        </span>
      </div>
      <p className="dempet liten">
        {neste ? `${neste.navn} ved ${neste.fra} jorder: +${neste.status} status.` : 'Gården er et gods: alle jordene er dyrket.'} Høsten mandag morgen.
      </p>
      <ul className="jordruter">
        {Array.from({ length: MAKS_JORDER }, (_, i) => {
          if (i < n) {
            return (
              <li key={i} className="jordrute dyrket">
                <span className="jordrute-navn">{AVLINGER[i].navn}</span>
                <span className="jordrute-spor" aria-hidden="true">
                  <span style={{ width: `${Math.round(vekst * 100)}%` }} />
                </span>
              </li>
            )
          }
          if (i === n && pris !== null) {
            return (
              <li key={i}>
                <button className="jordrute ny" disabled={s.kontanter < pris} onClick={() => utfor(kjopJorde(s, id))} aria-label={`Dyrk jord ${i + 1} for ${kortKroner(pris)}`}>
                  <span className="jordrute-pluss" aria-hidden="true">
                    +
                  </span>
                  {/* «261 mill» — «kr» får ikke plass i ruta; hele prisen står i navnet på knappen. */}
                  <span className="jordrute-navn">{kortKroner(pris).replace(/^kr\s/, '')}</span>
                </button>
              </li>
            )
          }
          return <li key={i} className="jordrute laast" aria-hidden="true" />
        })}
        {j.bygg?.drivhus && (
          <li className="jordrute dyrket drivhus">
            <span className="jordrute-navn">{DRIVHUSAVLING.navn}</span>
            <span className="jordrute-spor" aria-hidden="true">
              <span style={{ width: `${Math.round(vekst * 100)}%` }} />
            </span>
          </li>
        )}
      </ul>
      {pris !== null && <p className="dempet liten">Neste jord: {gardTekst(pris, gardGir(s, id, { jord: true }))}</p>}
      {/* Pakke 114: tre trinn per maskin; raden sier hva den gir nå og hva neste trinn gir. */}
      {MASKINLISTE.map((m) => {
        const trinn = maskintrinn(j, m)
        const ferdig = trinn >= MAKS_MASKINTRINN
        const mp = maskinpris(s, id, m)
        return (
          <div key={m} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{MASKINER[m].navn}</strong>
              {trinn > 0 && ` · trinn ${trinn} av ${MAKS_MASKINTRINN}`}
              <br />
              <span className="dempet">{trinn > 0 && !ferdig ? `Nå ${maskintekst(m, trinn)}; neste ${maskintekst(m, trinn + 1)}` : maskintekst(m, Math.max(1, trinn))}</span>
              {!ferdig && (
                <>
                  <br />
                  <span className="dempet">{gardTekst(mp, gardGir(s, id, { maskin: m }))}</span>
                </>
              )}
            </p>
            {ferdig ? (
              <span className="merke ok">Ferdig</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < mp} onClick={() => utfor(kjopMaskin(s, id, m))}>
                {trinn > 0 ? `Trinn ${trinn + 1}` : 'Kjøp'} · {kortKroner(mp)}
              </button>
            )}
          </div>
        )
      })}
      <Nabogard s={s} id={id} />
      {GARDSBYGGLISTE.map((b) => {
        const eier = !!j.bygg?.[b]
        const sperre = byggSperre(j, b)
        const bp = byggpris(s, id, b)
        return (
          <div key={b} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{GARDSBYGG[b].navn}</strong>
              <br />
              <span className="dempet">{GARDSBYGG[b].tekst}</span>
              {/* Fjøset gir ingenting selv; dyrene gjør det. */}
              {!eier && !sperre && b !== 'fjos' && (
                <>
                  <br />
                  <span className="dempet">{gardTekst(bp, gardGir(s, id, { bygg: b }))}</span>
                </>
              )}
            </p>
            {eier ? (
              <span className="merke ok">Bygd</span>
            ) : sperre ? (
              <span className="merke kant">{sperre}</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < bp} onClick={() => utfor(kjopGardsbygg(s, id, b))}>
                Bygg · {kortKroner(bp)}
              </button>
            )}
          </div>
        )
      })}
    </li>
  )
}

/** Ikonet for hvert vær på dagbrikkene (Pakke 113). */
const VAERIKON: Record<Vaertype, Ikonnavn> = { sol: 'sol', overskyet: 'sky', regn: 'regn', sno: 'sno' }
const DAGNAVN = ['M', 'T', 'O', 'T', 'F', 'L', 'S'] as const

/**
 * Ukas vær på gårdens kort (Pakke 113): sju dager, fylt inn etter hvert som de går — i dag med —
 * værfaktoren så langt, og hva drenering og frostdekke har reddet. Uka er bestemt fra mandag,
 * men kortet viser bare det som har vært.
 */
function Ukedager({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]!
  const dag = dagnummer(s.sek)
  const start = ukeFor(dag) * 7
  const faktor = ukefaktorSaLangt(dag, !!j.bygg?.drenering, !!j.bygg?.frostdekke)
  const reddet = reddetSaLangt(s, id)
  const bygg = [j.bygg?.drenering && 'dreneringen', j.bygg?.frostdekke && 'frostdekket'].filter(Boolean).join(' og ')
  return (
    <div className="ukedager-rad">
      <ol className="ukedager" aria-label="Ukas vær så langt">
        {DAGNAVN.map((navn, i) => {
          const d = start + i
          const v = d <= dag ? vaerPaaDag(d) : null
          return (
            <li key={i} className={`ukedag${v ? ` vaer-${v}` : ' kommer'}${d === dag ? ' idag' : ''}`} title={v ? VAERTYPER[v].navn : 'Kommer'}>
              <span className="ukedag-navn">{navn}</span>
              {v ? <Ikon navn={VAERIKON[v]} størrelse={16} /> : <span className="ukedag-tom" aria-hidden="true" />}
              <span className="skjult-tekst">{v ? VAERTYPER[v].navn : 'kommer'}</span>
            </li>
          )
        })}
      </ol>
      <p className="dempet liten">
        Været så langt gir <strong className={faktor >= 1.1 ? 'pluss' : faktor <= 0.9 ? 'minus' : undefined}>×{tall(faktor, 2)}</strong>
        {reddet >= 1 && ` · ${bygg[0].toUpperCase()}${bygg.slice(1)} har reddet ${kortKroner(reddet)}`}
      </p>
    </div>
  )
}

/**
 * Radene til gårdens sider (Pakke 112), under kortet på gårdens side: hver sier i én linje
 * hva som er der, og åpner siden med tilbake. «Silo full» står på lagerets rad.
 */
export function Gardsnav({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j || JORD[id].type !== 'gard') return null
  const maskiner = MASKINLISTE.reduce((sum, m) => sum + maskintrinn(j, m), 0)
  const under: Record<Gardsside, string> = {
    jorder: `${jorder(j)} av ${MAKS_JORDER} jorder · ${maskiner} av ${MASKINLISTE.length * MAKS_MASKINTRINN} maskintrinn${naboer(j) ? ` · ${naboer(j)} ${naboer(j) === 1 ? 'nabogård' : 'nabogårder'}` : ''}`,
    dyr: j.bygg?.fjos ? `${antallDyr(j)} av ${fjosplasser(j)} dyr · ${kortKroner(dyrPerUke(s, id))} i uka` : 'Bygg et fjøs først, under jorder og maskiner',
    lager: j.bygg?.silo ? `${kortKroner(lagerverdi(s, id))} på lager` : 'Ukas priser og regnskapet',
  }
  const fullt = lagerFullt(s, id)
  return (
    <li className="kort klubbsider" aria-label="Gårdens sider">
      {GARDSSIDER.map((d) => (
        <button key={d.id} className="klubbside-rad" onClick={() => aapneGardsside(d.id)}>
          <span className="klubbside-tekst">
            <strong>{d.navn}</strong>
            <span className="dempet liten">{under[d.id]}</span>
          </span>
          {d.id === 'lager' && fullt ? <span className="merke varsel">Silo full</span> : <span />}
          <span className="gull" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </li>
  )
}

/** «Dyr» (Pakke 112): fjøset, eller hva som trengs for å få et. */
export function Fjoskort({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  return (
    <li className="kort">
      {j.bygg?.fjos ? (
        <Fjos s={s} id={id} />
      ) : (
        <p className="dempet liten">Gården har ikke fjøs ennå. Bygg det under «Jorder og maskiner»; da får du plass til kyr, høner, sauer og griser.</p>
      )}
    </li>
  )
}

/** «Lager og regnskap» (Pakke 112): ukas priser og lageret, eller hva en silo gir. */
export function Lagerkort({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  return (
    <li className="kort">
      <h2 className="kort-tittel">Priser denne uka</h2>
      <Avlingspriser sek={s.sek} />
      <h2 className="kort-tittel lager-tittel">Lageret</h2>
      {j.bygg?.silo ? (
        <Kornlager s={s} id={id} />
      ) : (
        <p className="dempet liten">Uten silo selges ukas avling mandag til ukas pris. Med silo kan du lagre kornet og selge når prisen er god — bygg den under «Jorder og maskiner».</p>
      )}
    </li>
  )
}

/**
 * «Gårder og skog» øverst på Eiendom (Pakke 112): når høsten kommer og hva uka har gitt så
 * langt, og én rad per jordstykke du eier — gården med ukas høst og «Silo full», skogen med
 * tømmeret og «Klar for hogst». Hver rad åpner stykkets side.
 */
export function Landkort({ s }: { s: Spilltilstand }) {
  const eide = JORDLISTE.filter((id) => s.jord[id])
  if (eide.length === 0) return null
  const garder = eide.filter((id) => JORD[id].type === 'gard')
  const saLangt = garder.reduce((sum, id) => sum + hostSaLangt(s, id), 0)
  const omtrent = garder.reduce((sum, id) => sum + ukensGardHost(s, id), 0)
  return (
    <nav className="kort klubbsider landkort" aria-label="Gårder og skog">
      <div className="maal-topp">
        <h2 className="kort-tittel">Gårder og skog</h2>
        {garder.length > 0 && <span className="dempet liten">høstes mandag, om {varighet(tidTilHost(s))}</span>}
      </div>
      {garder.length > 0 && (
        <p className="dempet liten">
          Så langt denne uka {kortKroner(saLangt)} av omtrent {kortKroner(omtrent)}.
        </p>
      )}
      {eide.map((id) => {
        const gard = JORD[id].type === 'gard'
        const igjen = gard ? 0 : dagerTilHogst(s, id)
        const merke = gard ? (lagerFullt(s, id) ? 'Silo full' : null) : igjen <= 0 ? 'Klar for hogst' : null
        return (
          <button key={id} className="klubbside-rad" onClick={() => aapneTing({ slag: 'jord', id })}>
            <span className="klubbside-tekst">
              <strong>{JORD[id].navn}</strong>
              <span className="dempet liten">
                {gard
                  ? `${kortKroner(hostSaLangt(s, id))} så langt denne uka`
                  : `Tømmer ${kortKroner(tommerverdi(s, id))}${igjen > 0 ? ` · best å hogge om ${tall(Math.ceil(igjen))} ${Math.ceil(igjen) === 1 ? 'dag' : 'dager'}` : ''}`}
              </span>
            </span>
            {merke ? <span className={`merke ${gard ? 'varsel' : 'gull'}`}>{merke}</span> : <span />}
            <span className="gull" aria-hidden="true">
              ›
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/**
 * Nabogården (Pakke 114), under maskinene: et gods kan kjøpe opptil tre, og hver tredobler jorda
 * avlingen regnes på. Før gården er et gods sier raden hva som trengs.
 */
function Nabogard({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]!
  const n = naboer(j)
  const pris = nabopris(s, id)
  const gods = gardstrinn(j) >= GARDSTRINN.length - 1
  return (
    <div className="personale-rad gardsmaskin nabogard">
      <p className="liten">
        <strong>Nabogården</strong>
        {n > 0 && ` · ${n} av ${MAKS_NABOER}`}
        <br />
        <span className="dempet">
          {n >= MAKS_NABOER
            ? `Gården er ${NABO_FAKTOR ** n} ganger så stor som da du kjøpte den.`
            : `Kjøp naboen ut: avlingen ×${NABO_FAKTOR}, og +${NABO_STATUS} status. Jordene, maskinene og byggene du har, følger med.`}
        </span>
        {pris !== null && (
          <>
            <br />
            <span className="dempet">{gardTekst(pris, ukensNabogevinst(s, id))}</span>
          </>
        )}
      </p>
      {n >= MAKS_NABOER ? (
        <span className="merke ok">Ferdig</span>
      ) : pris === null ? (
        <span className="merke kant">{gods ? 'Ikke til salgs' : 'Krever gods'}</span>
      ) : (
        <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(kjopNabogard(s, id))}>
          Kjøp · {kortKroner(pris)}
        </button>
      )}
    </div>
  )
}

/** Hva en nabogård til gir i en normal uke: avlingen ganger to til (×3 i alt). */
const ukensNabogevinst = (s: Spilltilstand, id: JordId) => (NABO_FAKTOR - 1) * forventetUke(s, id, s.jord[id]!)

/**
 * Kraften (Pakke 115): verkene som kan stå på jorda — vind på Lista, sol på en gård med låve, vann
 * i Namdalen — med hva de gir nå og har tjent, eller pris og tilbakebetaling. Står på «Jorder og
 * maskiner» for en gård og på siden for skogen.
 */
export function Kraftkort({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  const verk = kraftverkFor(id)
  if (!j || verk.length === 0) return null
  return (
    <li className="kort kraftkort">
      <h2 className="kort-tittel">Kraft</h2>
      <p className="dempet liten">Betales hvert sekund, også mens du er borte, og følger ukas vær.</p>
      {verk.map((v) => {
        const bygd = j.kraftverk?.[v]
        const sperre = kraftSperre(j, v)
        const pris = kraftpris(s, id, v)
        return (
          <div key={v} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{KRAFTVERK[v].navn}</strong>
              <br />
              <span className="dempet">{KRAFTVERK[v].tekst}</span>
              <br />
              <span className="dempet">
                {bygd !== undefined ? `Gir ${perSek(kraftverkPerSek(s, id, v))} nå · har tjent ${kortKroner(bygd)}` : !sperre ? gardTekst(pris, kraftverkUke(s, id, v)) : ''}
              </span>
            </p>
            {bygd !== undefined ? (
              <span className="merke ok">Bygd</span>
            ) : sperre ? (
              <span className="merke kant">{sperre}</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(byggKraftverk(s, id, v))}>
                Bygg · {kortKroner(pris)}
              </button>
            )}
          </div>
        )
      })}
    </li>
  )
}

/** Hvordan hvert dyr betaler, i én linje. */
const BETALING: Record<'daglig' | 'ull' | 'slakt', string> = {
  daglig: 'hver dag',
  ull: 'klippes 1. mai og 1. september',
  slakt: `slakt hver ${SLAKT_DAGER / 7}. uke`,
}

/**
 * Fjøset (Pakke 94): plassene etter gårdens trinn, dyrene du har, hva de gir og når,
 * og et kjøp per slag. Pakke 106: hvert slag gir sin andel av prisen, hver rad sier hva
 * ett dyr til gir og når det er tjent inn, og ulla og kjøttet som venter, står over radene.
 */
function Fjos({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]!
  const n = antallDyr(j)
  const plasser = fjosplasser(j)
  return (
    <div className="kornlager fjos">
      <div className="maal-topp">
        <strong className="liten">Fjøs</strong>
        <span className="dempet liten">
          {n} av {plasser} plasser · {kortKroner(dyrPerUke(s, id))} i uka
        </span>
      </div>
      <Venter s={s} id={id} />
      {DYRLISTE.map((d) => {
        const antall = j.dyr?.[d] ?? 0
        const pris = dyrpris(s, id, d)
        return (
          <div key={d} className="personale-rad">
            <p className="liten">
              <strong>
                {antall > 0 ? `${antall} ${antall === 1 ? DYR[d].navn.toLowerCase() : DYR[d].flertall}` : DYR[d].navn}
              </strong>
              <br />
              <span className="dempet">
                {DYR[d].vare[0].toUpperCase() + DYR[d].vare.slice(1)} · {BETALING[DYR[d].betaling]}
              </span>
              {n < plasser && (
                <>
                  <br />
                  <span className="dempet">{gardTekst(pris, dyrGir(s, id, d))}</span>
                </>
              )}
            </p>
            <button className="knapp knapp-gull knapp-liten" disabled={n >= plasser || s.kontanter < pris} onClick={() => utfor(kjopDyr(s, id, d))}>
              Kjøp · {kortKroner(pris)}
            </button>
          </div>
        )
      })}
      {n >= plasser && <p className="dempet liten">Fjøset er fullt. En større gård gir flere plasser: 4, 8, 12 og 20.</p>}
    </div>
  )
}

/** «12. mai»: dagen i måneden og månedens navn. */
const datotekst = (dag: number) => `${dato(dag).dag}. ${MÅNEDER[dato(dag).maaned]}`

/**
 * Det dyrene har tjent og som venter på betalingsdagen (Pakke 106): ulla til klippingen og
 * kjøttet til slakten. Det teller i formuen fra dagen det vokser.
 */
function Venter({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]!
  const k = dyrKasseNaa(s, id)
  const dag = dagnummer(s.sek)
  const linjer: string[] = []
  if ((j.dyr?.sau ?? 0) > 0 || k.ull > 0) linjer.push(`Ull så langt ${kortKroner(k.ull)} · klippes ${datotekst(nesteKlipping(dag))}`)
  if ((j.dyr?.gris ?? 0) > 0 || k.slakt > 0) linjer.push(`Kjøtt så langt ${kortKroner(k.slakt)} · slakt ${datotekst(nesteSlakt(dag))}`)
  if (linjer.length === 0) return null
  return (
    <p className="dempet liten">
      {linjer.map((l, i) => (
        <span key={l}>
          {i > 0 && <br />}
          {l}
        </span>
      ))}
    </p>
  )
}

/**
 * Gårdens eget regnskap (Pakke 94): de siste åtte ukene, én rad hver — det som kom inn
 * (høst, korn, dyr og tilskudd) med en liten søyle, og det du bygde — og summen siden kjøpet.
 */
export function Gardsregnskap({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j || JORD[id].type !== 'gard') return null
  const rader = [...(j.regnskap ?? [])].reverse()
  const inn = (r: Gardstall) => r.host + r.korn + r.dyr + r.tilskudd
  const storst = Math.max(1, ...rader.map(inn))
  const sum = j.siden
  return (
    <li className="kort gardsregnskap">
      <h2 className="kort-tittel">Gårdens regnskap</h2>
      {rader.length === 0 ? (
        <p className="dempet liten">Ingenting ført ennå. Høsten kommer mandag morgen.</p>
      ) : (
        <table className="tabell">
          <thead>
            <tr>
              <th>Uke</th>
              <th>Inn</th>
              <th>Bygd</th>
            </tr>
          </thead>
          <tbody>
            {rader.map((r) => (
              <tr key={r.uke}>
                <td>{ukenummer(r.uke * 7 + 3)}</td>
                <td>
                  <span className="regnskap-inn">
                    <span className="regnskap-sule" style={{ width: `${Math.round((inn(r) / storst) * 100)}%` }} />
                    <span>{kortKroner(inn(r))}</span>
                  </span>
                </td>
                <td>{r.bygd > 0 ? kortKroner(r.bygd) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sum && (
        <dl className="status-fordeler">
          <div>
            <dt>Høst siden kjøpet</dt>
            <dd>{kortKroner(sum.host)}</dd>
          </div>
          <div>
            <dt>Solgt fra lager</dt>
            <dd>{kortKroner(sum.korn)}</dd>
          </div>
          <div>
            <dt>Dyrene</dt>
            <dd>{kortKroner(sum.dyr)}</dd>
          </div>
          <div>
            <dt>Tilskudd</dt>
            <dd>{kortKroner(sum.tilskudd)}</dd>
          </div>
          <div>
            <dt>Bygd og kjøpt</dt>
            <dd>{kortKroner(sum.bygd)}</dd>
          </div>
        </dl>
      )}
    </li>
  )
}

/** Lagerets tre valg (Pakke 105), og hva hvert gjør mandag. */
const LAGRINGSVALG: { id: Lagring; navn: string; tekst: string }[] = [
  { id: 'selg', navn: 'Selg', tekst: 'Ukas avling selges mandag til ukas pris. Det som ligger på lager, selger du selv.' },
  { id: 'lagre', navn: 'Lagre', tekst: 'Ukas avling går på lager mandag, så lenge det er plass. Du selger selv.' },
  {
    id: 'smart',
    navn: 'Selg dyrt',
    tekst: `Lagre billig, selg dyrt: avlingen går på lager når ukas pris er under ×${tall(SELG_DYRT, 2)}, og alt selges mandag den er ×${tall(SELG_DYRT, 2)} eller mer.`,
  },
]

/**
 * Lageret (Pakke 93): hvor mye som ligger i silo og låve, hva det er verdt til denne ukas
 * priser, hva lageret gjør mandag, og salget. Pakke 105: låven tar grønnsakene og frukten
 * også, én rad per slag, og lageret kan lagre billig og selge dyrt.
 */
function Kornlager({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]!
  const valg = lagringsvalg(j)
  const verdi = lagerverdi(s, id)
  const grupper = GRUPPELISTE.filter((g) => lagerkapasitet(s, id, g) > 0)
  return (
    <div className="kornlager">
      <div className="maal-topp">
        <strong className="liten">{j.bygg?.laave ? 'Silo og låve' : 'Silo'}</strong>
        <span className="dempet liten">{kortKroner(verdi)}</span>
      </div>
      {grupper.map((g) => (
        <Lagerrad key={g} s={s} id={id} g={g} />
      ))}
      <div className="segment" role="radiogroup" aria-label="Lageret mandag">
        {LAGRINGSVALG.map((v) => (
          <button key={v.id} role="radio" aria-checked={valg === v.id} className={valg === v.id ? 'aktiv' : ''} onClick={() => utfor(settLagring(s, id, v.id))}>
            {v.navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">
        {LAGRINGSVALG.find((v) => v.id === valg)!.tekst} Det som ligger på lager, taper 1&nbsp;% i uka.
      </p>
      <button className="knapp knapp-gull bred" disabled={verdi <= 0} onClick={() => utfor(selgKorn(s, id))}>
        Selg lageret · {kortKroner(verdi)}
      </button>
    </div>
  )
}

/** Én rad i lageret: «Korn · 2,1 av 4 uker» og en strek for hvor fullt det er. */
function Lagerrad({ s, id, g }: { s: Spilltilstand; id: JordId; g: Avlingsgruppe }) {
  const per = gruppePerUke(s, id, g)
  const l = lagerAv(s.jord[id], g)
  const kap = lagerkapasitet(s, id, g)
  return (
    <div className="lagerrad">
      <div className="maal-topp">
        <span className="liten">{GRUPPENAVN[g]}</span>
        <span className="dempet liten">
          {tall(per > 0 ? l / per : 0, 1)} av {tall(per > 0 ? kap / per : 0)} uker
        </span>
      </div>
      <div className="milepael-spor">
        <div className="milepael-fyll" style={{ width: `${kap > 0 ? Math.min(100, (l / kap) * 100) : 0}%` }} />
      </div>
    </div>
  )
}

/** De fire landemerkene: til salgs, dine, eller eid av en rival. */
export function Landemerkeliste({ s }: { s: Spilltilstand }) {
  // Landemerkene vises når de første er innen rekkevidde.
  if (s.hoyesteFormue < LANDEMERKER.fyret.pris * 0.25) return null
  const mine = LANDEMERKELISTE.filter((id) => eierDu(s, id)).length
  return (
    <Seksjon id="eiendom-landemerker" tittel="Landemerker" forklaring="landemerker" sammendrag={`${mine} av ${LANDEMERKELISTE.length}`} harInnhold={mine > 0}>
      <ul className="kortliste">
        {LANDEMERKELISTE.map((id) => (
          <Landemerkekort key={id} s={s} id={id} />
        ))}
      </ul>
    </Seksjon>
  )
}

export function Landemerkekort({ s, id, iDetalj = false }: { s: Spilltilstand; id: LandemerkeId; iDetalj?: boolean }) {
  const l = LANDEMERKER[id]
  const mitt = eierDu(s, id)
  const e = s.landemerker[id]
  const rival = e && !mitt ? s.rivaler.find((r) => r.id === e.eier) : undefined
  const pris = kjopsprisLandemerke(s, id)
  const verdi = landemerkepris(s, id)
  const truet = !e && rivalerSomKan(s, id).length > 0
  return (
    <li className={`kort bedriftskort${mitt ? ' eid' : ''}${iDetalj ? '' : ' kan-aapnes'}`} onClick={iDetalj ? undefined : trykkApner({ slag: 'landemerke', id })}>
      {iDetalj && <Scene type={id} />}
      <div className="bedriftskort-topp">
        {!iDetalj && (
          <Apneknapp ting={{ slag: 'landemerke', id }} navn={l.navn}>
            <BedriftIkon type={id} stor />
          </Apneknapp>
        )}
        <div className="bedriftskort-midt">
          <h2>{l.navn}</h2>
          <span className="dempet">{l.sted}</span>
        </div>
        <div className="eiendom-tall">
          <span className="pluss">{perSek((verdi * l.avkastning) / 3600)}</span>
          <span className="gull liten">+{l.status} status</span>
        </div>
      </div>
      <p className="dempet liten">
        {mitt
          ? 'Ditt. Leien kommer hvert sekund.'
          : rival
            ? `Eies av ${rival.navn}. Du må betale ${tall((TILBAKEKJOP_PREMIE - 1) * 100)} % over verdien.`
            : truet
              ? 'Til salgs — og en rival har råd. Det kan være borte i morgen.'
              : 'Til salgs.'}
      </p>
      {mitt ? (
        <Bekreftknapp className="knapp bred" onJa={() => utfor(selgLandemerke(s, id))}>
          Selg · {kortKroner(verdi * (1 - LANDEMERKE_HONORAR))}
        </Bekreftknapp>
      ) : (
        <button className="knapp knapp-gull bred" disabled={s.kontanter < pris} onClick={() => utfor(kjopLandemerke(s, id))}>
          {rival ? 'Kjøp fra rivalen' : 'Kjøp'} · {kortKroner(pris)}
        </button>
      )}
    </li>
  )
}
