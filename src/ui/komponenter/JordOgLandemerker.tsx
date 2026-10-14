import { antallDyr, DYR, DYRLISTE, dyrGir, dyrKasseNaa, dyrPerUke, dyrpris, fjosplasser, nesteKlipping, nesteSlakt, SLAKT_DAGER } from '../../engine/dyr'
import { hoggSkog, jordSynlig, kjopDyr, kjopGardsbygg, kjopJord, kjopJorde, kjopLandemerke, kjopMaskin, selgJord, selgKorn, selgLandemerke, settLagring } from '../../engine/handlinger'
import { Bekreftknapp } from './Bekreftknapp'
import {
  AVLINGER,
  avlingspris,
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
  JORD,
  JORD_SYNLIG_VED,
  JORDLISTE,
  jorder,
  landverdi,
  MAKS_JORDER,
  MASKINER,
  MASKINLISTE,
  maskinpris,
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
import { kortKroner, perSek, tall } from '../format'
import { Apneknapp, BedriftIkon, Scene } from './BedriftIkon'
import { trykkApner } from '../detaljvisning'
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
            {eid && gard ? `${GARDSTRINN[gardstrinn(eid)].navn} · ${jorder(eid)} av ${MAKS_JORDER} jorder` : t.sted}
          </span>
        </div>
        <div className="eiendom-tall">
          <span>{kortKroner(land + tommer + bygd)}</span>
          <span className="dempet liten">{eid ? 'verdi' : 'pris'}</span>
        </div>
      </div>
      <p className="dempet liten">
        {t.type === 'gard'
          ? eid
            ? `Avling denne uka: omtrent ${kortKroner(ukensGardHost(s, id))}`
            : `Gir omtrent ${kortKroner(land * HOST_ANDEL)} i uka i et normalt år`
          : eid
            ? `Tømmer ${kortKroner(tommer)} etter ${tall(skogalder(s, id))} dager`
            : 'Kjøpes nyplantet. Tømmeret vokser fra første dag.'}
      </p>
      {eid && t.type === 'skog' && <Skogstatus s={s} id={id} />}
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
 * maskinene, og kornlageret når gården har silo.
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
  const uke = ukeFor(dagnummer(s.sek))
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
      <p className="liten avlingspriser">
        Priser denne uka:{' '}
        {GRUPPELISTE.map((g, i) => {
          const p = avlingspris(g, uke)
          return (
            <span key={g}>
              {i > 0 && ' · '}
              {GRUPPENAVN[g].toLowerCase()} <strong className={p >= 1.1 ? 'pluss' : p <= 0.9 ? 'minus' : undefined}>×{tall(p, 2)}</strong>
            </span>
          )
        })}
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
      {j.bygg?.silo && <Kornlager s={s} id={id} />}
      {MASKINLISTE.map((m) => {
        const eier = !!j.maskiner?.[m]
        const mp = maskinpris(s, id, m)
        return (
          <div key={m} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{MASKINER[m].navn}</strong>
              <br />
              <span className="dempet">{MASKINER[m].tekst}</span>
              {!eier && (
                <>
                  <br />
                  <span className="dempet">{gardTekst(mp, gardGir(s, id, { maskin: m }))}</span>
                </>
              )}
            </p>
            {eier ? (
              <span className="merke ok">Kjøpt</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < mp} onClick={() => utfor(kjopMaskin(s, id, m))}>
                Kjøp · {kortKroner(mp)}
              </button>
            )}
          </div>
        )
      })}
      {j.bygg?.fjos && <Fjos s={s} id={id} />}
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
