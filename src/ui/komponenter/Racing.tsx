import { useState } from 'react'
import { dagnummer } from '../../engine/kalender'
import { ansettForer, byggAnlegg, byggRacingakademi, juniorISete, oppgraderDel, selgJunior, selgRacingteam, settStrategi, startRacingteam, velgSponsor } from '../../engine/handlinger'
import {
  AKADEMI_TRINN,
  ANLEGG,
  ANLEGG_PRIS,
  ANLEGGLISTE,
  anleggstrinn,
  delrabatt,
  juniorpris,
  JUNIORSALG_DAGER,
  MAKS_JUNIORER,
  nesteAkademi,
  nesteAnleggspris,
  potensialspenn,
  SPONSOR_PLASS,
  SPONSOR_TRYGG,
  SPONSORAVTALER,
  tryggSponsor,
  baneFor,
  bilfart,
  BILDELER,
  BILDELLISTE,
  DELTALL,
  deltall,
  feltetsBesteTrinn,
  regnILop,
  vaatferdighet,
  forertabell,
  konstruktortabell,
  LOP_PER_SESONG,
  lonnPerDag,
  nesteDelpris,
  plasstekst,
  SALG_ANDEL,
  STRATEGIER,
  STRATEGILISTE,
  TEAMPRIS,
} from '../../engine/racing'
import type { Forer, Racinglop, Racingteam, Sponsoravtale, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { fortegnKroner, kortKroner, tall } from '../format'
import { useVoksUt } from '../overgang'
import { aapneRacing } from '../racingside'
import { forlop, liveLop, lopsrunde, raskesteRunde, rundetidTekst, RUNDER, stillingIRunde, visRacing } from '../racinglive'
import { Bekreftknapp } from './Bekreftknapp'
import { Forklaring } from './Forklaring'
import { Ikon } from './Ikoner'

/** Bilens fart med norsk komma: «72,5», «70». */
const fart = (r: Racingteam) => tall(bilfart(r), bilfart(r) % 1 ? 1 : 0)

/** Når neste løp avgjøres, sett fra i dag. */
function nesteLopTekst(s: Spilltilstand, r: Racingteam): string {
  const dager = r.nesteDag - dagnummer(s.sek)
  return dager <= 1 ? 'ved neste dagsskifte' : `om ${dager} dager`
}

/** Plassen blant teamene, som tekst. Før første løp har ingen poeng. */
function plassering(r: Racingteam): string {
  if (r.runde === 0) return 'ny sesong'
  return `${konstruktortabell(r).findIndex((x) => x.deg) + 1}. plass`
}

/**
 * Raden i Samling under garasjen (Pakke 90): med Formel 1-bilen kan du starte et
 * team; har du ett, sier raden hvor det står og åpner siden.
 */
export function Racingrad({ s }: { s: Spilltilstand }) {
  const r = s.racing
  if (!r && !s.luksus.includes('formelbil')) return null
  if (!r) {
    return (
      <div className="kort racingstart">
        <div className="maal-topp">
          <h2 className="kort-tittel">Racingteam</h2>
          <Forklaring tema="racing" />
        </div>
        <p className="dempet liten">Meld på Formel 1-bilen: åtte løp i sesongen mot ni team, et løp hver tredje dag.</p>
        <button className="knapp knapp-gull bred" disabled={s.kontanter < TEAMPRIS} onClick={() => utfor(startRacingteam(s))}>
          Start et team · {kortKroner(TEAMPRIS)}
        </button>
      </div>
    )
  }
  return (
    <nav className="kort klubbsider racingrad" aria-label="Racingteamet">
      <button className="klubbside-rad" onClick={() => aapneRacing(true)}>
        <span className="klubbside-tekst">
          <strong>{r.navn}</strong>
          <span className="dempet liten">
            {/* Pakke 110: mens et løp kjøres, sier raden det. */}
            {liveLop(s) ? `Live i ${liveLop(s)!.bane} · runde ${lopsrunde(s.sek)} av ${RUNDER}` : `Sesong ${r.sesong} · ${plassering(visRacing(s, r))} · ${baneFor(r.runde)} ${nesteLopTekst(s, r)}`}
          </span>
        </span>
        {(s.racingtrofeer?.length ?? 0) > 0 && (
          <span className="merke gull">
            {s.racingtrofeer!.length} {s.racingtrofeer!.length === 1 ? 'tittel' : 'titler'}
          </span>
        )}
        <span className="gull" aria-hidden="true">
          ›
        </span>
      </button>
    </nav>
  )
}

/** Teamets side: neste løp og strategien, siste løp, mesterskapene, bilen, førerne og sesongene. */
export function Racingdetalj({ s, tilbake }: { s: Spilltilstand; tilbake: () => void }) {
  const voks = useVoksUt<HTMLElement>()
  const r = s.racing
  if (!r) return null
  // Pakke 110: mens løpet kjøres, viser siden teamet slik det var før det (tabellene og siste løp).
  const v = visRacing(s, r)
  const live = liveLop(s)
  const siste = v.lop.at(-1)
  return (
    <section className="skjerm detalj racingdetalj" ref={voks}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Luksus
      </button>
      <h1 className="skjerm-tittel">{r.navn}</h1>
      {live && <Livelop s={s} r={r} lop={live} />}
      <Nestelop s={s} r={r} />
      {siste && (siste.felt ? <Lopsrapport r={r} lop={siste} /> : <Sistelop r={r} lop={siste} />)}
      {v.tabellVenter ? (
        <div className="kort">
          <h2 className="kort-tittel">Mesterskapene</h2>
          <p className="dempet liten">Sesongens siste løp kjøres. Tabellen kommer ved målflagget.</p>
        </div>
      ) : (
        <Mesterskap r={v} />
      )}
      <Bilkort s={s} r={r} />
      <Anleggskort s={s} r={r} />
      <Forerkort s={s} r={r} />
      <Akademikort s={s} r={r} />
      <Sponsorkort s={s} r={r} />
      <Sesongkort s={s} r={v} />
    </section>
  )
}

/** «+12,4 s» bak vinneren, eller «Vinner». */
const gapTekst = (gap: number | null) => (gap === null ? '' : gap === 0 ? 'Vinner' : `+${tall(gap, 1)} s`)

/**
 * Løpet direkte (Pakke 110): runden, de ti første og dine, hvem som er i depot, og de som har
 * kjørt av. Følger spilldagen; ved målflagget (dagsskiftet) er det resultatet.
 */
function Livelop({ s, r, lop }: { s: Spilltilstand; r: Racingteam; lop: Racinglop }) {
  const runde = lopsrunde(s.sek)
  const rader = stillingIRunde(r, lop, runde)
  const vises = rader.filter((x) => (!x.ute && x.plass <= 10) || x.deg || x.ute)
  return (
    <div className="kort livelop" aria-live="polite">
      <div className="maal-topp">
        <span className="etikett">
          <span className="merke fare">Live</span> {lop.bane}
          {lop.regn ? ' · regn' : ''}
        </span>
        <span className="dempet liten">
          Runde {runde} av {RUNDER}
        </span>
      </div>
      <div className="milepael-spor">
        <div className="milepael-fyll" style={{ width: `${(runde / RUNDER) * 100}%` }} />
      </div>
      <ol className="racing-felt">
        {vises.map((x) => (
          <li key={`${x.forer}|${x.lag}`} className={x.deg ? 'deg' : undefined}>
            <span className="racing-felt-plass">{x.ute ? 'Ute' : x.plass}</span>
            <span className="racing-felt-navn">
              <strong>{x.forer}</strong> <span className="dempet liten">{x.lag}</span>
            </span>
            <span className="dempet liten">{x.ute ? x.aarsak : x.iDepot ? 'Depot' : ''}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Den fulle rapporten (Pakke 110): plassene med avstand, startplass og depotstopp, de som kjørte
 * av med årsak, og raskeste runde. De ti første, dine og de som kjørte av vises; resten bak «Vis
 * alle tjue».
 */
function Lopsrapport({ r, lop }: { r: Racingteam; lop: Racinglop }) {
  const [alle, settAlle] = useState(false)
  const biler = forlop(r, lop)
  const imaal = biler.filter((b) => b.plass > 0).sort((a, b) => a.plass - b.plass)
  const ute = biler.filter((b) => b.plass === 0)
  const vises = alle ? imaal : imaal.filter((b) => b.plass <= 10 || b.deg)
  const skjult = imaal.length - vises.length
  const raskest = raskesteRunde(r, lop)
  const mine = lop.plasser.map((p, i) => ({ p, f: r.forere[i] })).filter((x) => x.p !== null)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Siste løp: {lop.bane}</h2>
        <span className="dempet liten">
          {lop.regn ? 'Regn · ' : ''}
          {STRATEGIER[lop.strategi].navn}
        </span>
      </div>
      <p className="liten">
        Dine: {mine.map((x) => `${x.f?.navn ?? 'fører'} ${plasstekst(x.p!)}`).join(', ') || 'ingen førere'} ·{' '}
        <strong className="gull">{lop.poeng} poeng</strong>
        {lop.premie > 0 && ` · ${kortKroner(lop.premie)}`}
      </p>
      <table className="tabell racing-rapport">
        <thead>
          <tr>
            <th>#</th>
            <th>Fører</th>
            <th>Bak</th>
            <th>Start</th>
            <th>Depot</th>
          </tr>
        </thead>
        <tbody>
          {vises.map((b) => (
            <tr key={`${b.forer}|${b.lag}`} className={b.deg ? 'deg' : undefined}>
              <td>{b.plass}</td>
              <td>
                <strong>{b.forer}</strong>
                <span className="dempet liten">{b.lag}</span>
              </td>
              <td>{gapTekst(b.gap)}</td>
              <td>{b.start}</td>
              <td>{tall(b.stopptid, 1)} s</td>
            </tr>
          ))}
          {ute.map((b) => (
            <tr key={`${b.forer}|${b.lag}`} className={b.deg ? 'deg' : undefined}>
              <td>Ute</td>
              <td>
                <strong>{b.forer}</strong>
                <span className="dempet liten">{b.lag}</span>
              </td>
              <td colSpan={3} className="dempet">
                {b.aarsak}, runde {b.uteRunde}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {skjult > 0 && !alle && (
        <button className="knapp knapp-liten bred" onClick={() => settAlle(true)}>
          Vis alle tjue
        </button>
      )}
      <p className="dempet liten">
        {raskest && `Raskeste runde: ${raskest.forer} (${raskest.lag}), ${rundetidTekst(raskest.tid)}`}
        {lop.pole && ` · Pole: ${lop.pole.forer}`}
      </p>
    </div>
  )
}

function Nestelop({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  return (
    <div className="kort">
      <div className="maal-topp">
        <span className="etikett">
          Sesong {r.sesong} · løp {r.runde + 1} av {LOP_PER_SESONG}
        </span>
        <Forklaring tema="racing" />
      </div>
      <h2 className="kort-tittel">
        {baneFor(r.runde)} {nesteLopTekst(s, r)}
      </h2>
      <p className="dempet liten">
        Bilen har fart {fart(r)} av 90 · {plassering(r)} blant teamene
      </p>
      {/* Pakke 109: været er kjent på forhånd, så strategien kan velges etter det. */}
      {regnILop(r, r.runde) && (
        <p className="liten">
          <span className="merke info">Regn ventet</span> Aero, chassis og føreren teller mer, flaksen også, og dobbelt så mange kjører av.
        </p>
      )}
      <div className="segment racing-strategi" role="radiogroup" aria-label="Strategi">
        {STRATEGILISTE.map((id) => (
          <button key={id} role="radio" aria-checked={r.strategi === id} className={r.strategi === id ? 'aktiv' : ''} onClick={() => utfor(settStrategi(s, id))}>
            {STRATEGIER[id].navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">{STRATEGIER[r.strategi].tekst}</p>
    </div>
  )
}

function Sistelop({ r, lop }: { r: Racingteam; lop: Racinglop }) {
  const mine = lop.plasser.map((p, i) => ({ p, f: r.forere[i] })).filter((x) => x.p !== null)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Siste løp: {lop.bane}</h2>
        <span className="dempet liten">
          {lop.regn ? 'Regn · ' : ''}
          {STRATEGIER[lop.strategi].navn}
        </span>
      </div>
      <ol className="racing-pall">
        {lop.pall.map((x, i) => (
          <li key={i} className={x.lag === r.navn ? 'deg' : undefined}>
            <span className="racing-plass">{i + 1}</span>
            <span>
              <strong>{x.forer}</strong> <span className="dempet liten">{x.lag}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="liten">
        Dine: {mine.map((x) => `${x.f?.navn ?? 'fører'} ${plasstekst(x.p!)}`).join(', ') || 'ingen førere'} ·{' '}
        <strong className="gull">{lop.poeng} poeng</strong>
        {lop.premie > 0 && ` · ${kortKroner(lop.premie)}`}
      </p>
      {lop.pole && (
        <p className="dempet liten">
          Start: {lop.plasser.flatMap((p, i) => (p === null ? [] : [`${r.forere[i]?.navn ?? 'fører'} ${lop.start?.[i] ?? '–'}.`])).join(', ') || '–'} · Pole: {lop.pole.forer} ({lop.pole.lag})
        </p>
      )}
    </div>
  )
}

/** Konstruktørene (alle ti) og førerne (de fem første og dine). */
function Mesterskap({ r }: { r: Racingteam }) {
  const lag = konstruktortabell(r)
  const forere = forertabell(r)
  const viste = forere.filter((x, i) => i < 5 || x.deg)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Konstruktørene</h2>
      <table className="tabell">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {lag.map((x, i) => (
            <tr key={x.lag} className={x.deg ? 'deg' : undefined}>
              <td>{i + 1}</td>
              <td>{x.lag}</td>
              <td>
                <strong>{x.poeng}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="kort-tittel racing-undertittel">Førerne</h2>
      <table className="tabell">
        <thead>
          <tr>
            <th>#</th>
            <th>Fører</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {viste.map((x) => (
            <tr key={`${x.forer}|${x.lag}`} className={x.deg ? 'deg' : undefined}>
              <td>{forere.indexOf(x) + 1}</td>
              <td>
                {x.forer} <span className="dempet liten">{x.lag}</span>
              </td>
              <td>
                <strong>{x.poeng}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Bilen: farten, og (Pakke 109) hver del med sine virkelige tall som streker mot feltets beste
 * i år, og når delen teller mest.
 */
function Bilkort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  const best = feltetsBesteTrinn(r)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Bilen</h2>
        <span className="dempet liten">fart {fart(r)} av 90</span>
      </div>
      <div className="milepael-spor">
        <div className="milepael-fyll" style={{ width: `${((bilfart(r) - 40) / 50) * 100}%` }} />
      </div>
      <p className="dempet liten">Strekene er tallene dine; merket er feltets beste i år.</p>
      {BILDELLISTE.map((d) => {
        const pris = nesteDelpris(r, d)
        return (
          <div key={d} className="racing-del">
            <div className="personale-rad">
              <p className="liten">
                <strong>{BILDELER[d].navn}</strong> · trinn {r.deler[d]} av 5
                <br />
                <span className="dempet">{BILDELER[d].tekst}</span>
              </p>
              {pris === null ? (
                <span className="merke ok">Ferdig</span>
              ) : (
                <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(oppgraderDel(s, d))}>
                  Bygg · {kortKroner(pris)}
                </button>
              )}
            </div>
            {/* Pakke 111: rabatten fra anlegget som bygger delen. */}
            {pris !== null && delrabatt(r, d) > 0 && <p className="dempet liten">{Math.round(delrabatt(r, d) * 100)} % billigere med {d === 'aero' || d === 'chassis' ? 'vindtunnelen' : 'fabrikken'}</p>}
            <div className="deltall">
              {DELTALL[d].map((x) => (
                <div key={x.navn} className="deltall-rad">
                  <span className="dempet liten">{x.navn}</span>
                  <span className="deltall-spor" aria-hidden="true">
                    <span className="deltall-fyll" style={{ width: `${((r.deler[d] ?? 0) / 5) * 100}%` }} />
                    <span className="deltall-best" style={{ left: `${(best[d] / 5) * 100}%` }} />
                  </span>
                  <span className="liten deltall-tall">
                    {tall(deltall(x, r.deler[d] ?? 0), x.desimaler ?? 0)} {x.enhet}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** «+3», «−2» eller «±0»: førerens ferdighet i regn mot tørt (Pakke 109). */
const regnTekst = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '±0')

function Forerlinje({ f, junior = false }: { f: Forer; junior?: boolean }) {
  const spenn = junior ? potensialspenn(f) : null
  return (
    <p className="liten">
      <strong>{f.navn}</strong> · ferdighet {f.ferdighet}
      {f.alder !== undefined && ` · ${f.alder} år`} · regn {regnTekst(vaatferdighet(f.navn))}
      <br />
      <span className="dempet">
        {/* Pakke 111: en junior koster ingenting før han tar et sete. */}
        {junior ? `${spenn ? `Kan bli ${spenn[0]}–${spenn[1]}` : 'Ferdig utviklet'} · ${kortKroner(f.lonn)} om dagen i et sete` : `${kortKroner(f.lonn)} om dagen`}
      </span>
    </p>
  )
}

function Forerkort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Førerne</h2>
        <span className="dempet liten">{kortKroner(lonnPerDag(r))} om dagen</span>
      </div>
      {r.forere.map((f, i) => (
        <div key={i} className="personale-rad racing-forer">
          {f ? <Forerlinje f={f} /> : <p className="dempet liten">Sete {i + 1} er tomt</p>}
          <span className="etikett">Sete {i + 1}</span>
        </div>
      ))}
      {r.marked.length > 0 && (
        <>
          <h2 className="kort-tittel racing-undertittel">På markedet</h2>
          <p className="dempet liten">Nye førere hver sesong. Den du ansetter, tar setet; den som satt der, går. Unge førere blir bedre for hver sesong, og lønnen følger.</p>
          {r.marked.map((f) => (
            <div key={f.id} className="personale-rad racing-forer">
              <Forerlinje f={f} />
              <span className="racing-seter">
                {[0, 1].map((sete) => (
                  <button key={sete} className="knapp knapp-liten" onClick={() => utfor(ansettForer(s, f.id, sete))}>
                    Sete {sete + 1}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/** Anleggene (Pakke 111): tre i tre trinn — vindtunnelen og fabrikken gjør delene billigere, simulatoren førerne bedre. */
function Anleggskort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Anleggene</h2>
        <span className="dempet liten">teller i teamets verdi</span>
      </div>
      {ANLEGGLISTE.map((a) => {
        const pris = nesteAnleggspris(r, a)
        return (
          <div key={a} className="personale-rad racing-del">
            <p className="liten">
              <strong>{ANLEGG[a].navn}</strong> · trinn {anleggstrinn(r, a)} av {ANLEGG_PRIS.length}
              <br />
              <span className="dempet">{ANLEGG[a].tekst}</span>
            </p>
            {pris === null ? (
              <span className="merke ok">Ferdig</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(byggAnlegg(s, a))}>
                Bygg · {kortKroner(pris)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Juniorakademiet (Pakke 111): trinnet, og juniorene — med taket som et spenn, et sete eller et salg. */
function Akademikort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  const trinn = r.akademi ?? 0
  const neste = nesteAkademi(r)
  const juniorer = r.juniorer ?? []
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Akademiet</h2>
        <span className="dempet liten">{trinn > 0 ? `${AKADEMI_TRINN[trinn].navn} · ${juniorer.length} av ${MAKS_JUNIORER}` : 'ikke bygd'}</span>
      </div>
      <p className="dempet liten">
        {trinn > 0
          ? `En junior på 16–18 år hver sesong, ferdighet ${AKADEMI_TRINN[trinn].ferdighet[0]}–${AKADEMI_TRINN[trinn].ferdighet[1]}. De vokser til de er 23, mot et tak du bare ser et spenn av.`
          : 'Et akademi sender opp en ung fører hver sesong. Han blir bedre for hver sesong — de beste blir bedre enn noen på markedet.'}
      </p>
      {juniorer.map((f) => (
        <div key={f.id} className="racing-forer racing-junior">
          <Forerlinje f={f} junior />
          <span className="racing-seter">
            {[0, 1].map((sete) => (
              <button key={sete} className="knapp knapp-liten" onClick={() => utfor(juniorISete(s, f.id, sete))}>
                Sete {sete + 1}
              </button>
            ))}
            <Bekreftknapp className="knapp knapp-liten" onJa={() => utfor(selgJunior(s, f.id))} varsel={`Et annet team betaler ${JUNIORSALG_DAGER} dagers lønn.`}>
              Selg · {kortKroner(juniorpris(f))}
            </Bekreftknapp>
          </span>
        </div>
      ))}
      {neste && (
        <button className="knapp knapp-gull bred racing-bygg" disabled={s.kontanter < neste.pris} onClick={() => utfor(byggRacingakademi(s))}>
          {trinn > 0 ? 'Bygg ut til' : 'Bygg'} {neste.navn.toLowerCase()} · {kortKroner(neste.pris)}
        </button>
      )}
    </div>
  )
}

/**
 * Sponsoren (Pakke 111): en trygg sum fordelt på løpene, eller etter plassen til slutt. Valget står
 * åpent til første løp; så gjelder det sesongen ut.
 */
function Sponsorkort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  const sp = r.sponsor
  const trygg = sp?.trygg ?? tryggSponsor(r)
  const aapen = r.runde === 0
  const avtale: Sponsoravtale = sp?.avtale ?? 'trygg'
  const sum = (a: Sponsoravtale) => (a === 'trygg' ? kortKroner(trygg) : `opptil ${kortKroner(SPONSOR_PLASS[0])}`)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Sponsoren</h2>
        <span className="dempet liten">{sp?.navn ?? 'ny avtale ved neste løp'}</span>
      </div>
      {aapen ? (
        <div className="segment racing-strategi" role="radiogroup" aria-label="Sponsoravtale">
          {(['trygg', 'resultat'] as const).map((a) => (
            <button key={a} role="radio" aria-checked={avtale === a} className={avtale === a ? 'aktiv' : ''} onClick={() => utfor(velgSponsor(s, a))}>
              {SPONSORAVTALER[a].navn}
            </button>
          ))}
        </div>
      ) : (
        <p className="liten">
          <strong>{SPONSORAVTALER[avtale].navn}</strong> · {sum(avtale)}
        </p>
      )}
      <p className="dempet liten">
        {avtale === 'trygg'
          ? `${aapen ? `${kortKroner(trygg)} for sesongen, fordelt` : 'Fordelt'} på de åtte løpene: ${Math.round(SPONSOR_TRYGG * 100)} % av det ${r.sesonger.length ? 'fjorårets plass' : '10. plass'} ville gitt med resultatavtalen.`
          : `Betaler etter plassen blant teamene når sesongen er over: ${SPONSOR_PLASS.slice(0, 4).map((x, i) => `${i + 1}. ${kortKroner(x)}`).join(', ')} … ${SPONSOR_PLASS.length}. ${kortKroner(SPONSOR_PLASS[SPONSOR_PLASS.length - 1])}.`}
        {aapen ? ' Velg før første løp.' : ' Skrevet under for sesongen.'}
      </p>
    </div>
  )
}

function Sesongkort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  const trofeer = [...(s.racingtrofeer ?? [])].reverse()
  return (
    <div className="kort">
      <h2 className="kort-tittel">Sesongene</h2>
      {r.sesonger.length === 0 ? (
        <p className="dempet liten">Første sesong pågår.</p>
      ) : (
        <ul className="racing-sesonger">
          {[...r.sesonger].reverse().map((x) => (
            <li key={x.sesong} className="liten">
              <strong>Sesong {x.sesong}</strong>: {x.plass}. plass, {x.poeng} poeng, {x.seire} {x.seire === 1 ? 'seier' : 'seire'}
              {x.titler.length > 0 && <span className="gull"> · {x.titler.join(' og ').toLowerCase()}</span>}
            </li>
          ))}
        </ul>
      )}
      {trofeer.length > 0 && (
        <ul className="trofeer">
          {trofeer.map((t, i) => (
            <li key={i}>
              <span className="trofe-ikon" aria-hidden="true">
                <Ikon navn="trofe" størrelse={22} />
              </span>
              <span>
                <strong>{t.navn}</strong>
                <span className="dempet liten">
                  {t.klubb} · sesong {t.sesong}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <dl className="status-fordeler racing-penger">
        <div>
          <dt>Premier</dt>
          <dd>{kortKroner(r.premier)}</dd>
        </div>
        <div>
          <dt>Sponsorer</dt>
          <dd>{kortKroner(r.sponsorpenger ?? 0)}</dd>
        </div>
        <div>
          <dt>Lønn</dt>
          <dd>{kortKroner(r.lonn)}</dd>
        </div>
        <div>
          <dt>Netto</dt>
          <dd>{fortegnKroner(r.premier + (r.sponsorpenger ?? 0) - r.lonn)}</dd>
        </div>
      </dl>
      <Bekreftknapp
        className="knapp bred"
        onJa={() => {
          // Siden lukker seg selv, ellers ville den åpnet igjen ved neste team.
          aapneRacing(false)
          utfor(selgRacingteam(s))
        }}
        varsel="Bilen og trofeene beholder du."
      >
        Selg teamet · {kortKroner(r.investert * SALG_ANDEL)}
      </Bekreftknapp>
    </div>
  )
}
