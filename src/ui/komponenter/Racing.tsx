import { dagnummer } from '../../engine/kalender'
import { ansettForer, oppgraderDel, selgRacingteam, settStrategi, startRacingteam } from '../../engine/handlinger'
import {
  baneFor,
  bilfart,
  BILDELER,
  BILDELLISTE,
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
import type { Forer, Racinglop, Racingteam, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { fortegnKroner, kortKroner, tall } from '../format'
import { useVoksUt } from '../overgang'
import { aapneRacing } from '../racingside'
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
            Sesong {r.sesong} · {plassering(r)} · {baneFor(r.runde)} {nesteLopTekst(s, r)}
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
  const siste = r.lop.at(-1)
  return (
    <section className="skjerm detalj racingdetalj" ref={voks}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Luksus
      </button>
      <h1 className="skjerm-tittel">{r.navn}</h1>
      <Nestelop s={s} r={r} />
      {siste && <Sistelop r={r} lop={siste} />}
      <Mesterskap r={r} />
      <Bilkort s={s} r={r} />
      <Forerkort s={s} r={r} />
      <Sesongkort s={s} r={r} />
    </section>
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
        <span className="dempet liten">{STRATEGIER[lop.strategi].navn}</span>
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

function Bilkort({ s, r }: { s: Spilltilstand; r: Racingteam }) {
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Bilen</h2>
        <span className="dempet liten">fart {fart(r)} av 90</span>
      </div>
      <div className="milepael-spor">
        <div className="milepael-fyll" style={{ width: `${((bilfart(r) - 40) / 50) * 100}%` }} />
      </div>
      {BILDELLISTE.map((d) => {
        const pris = nesteDelpris(r, d)
        return (
          <div key={d} className="personale-rad racing-del">
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
        )
      })}
    </div>
  )
}

function Forerlinje({ f }: { f: Forer }) {
  return (
    <p className="liten">
      <strong>{f.navn}</strong> · ferdighet {f.ferdighet}
      <br />
      <span className="dempet">{kortKroner(f.lonn)} om dagen</span>
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
          <p className="dempet liten">Nye førere hver sesong. Den du ansetter, tar setet; den som satt der, går.</p>
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
          <dt>Lønn</dt>
          <dd>{kortKroner(r.lonn)}</dd>
        </div>
        <div>
          <dt>Netto</dt>
          <dd>{fortegnKroner(r.premier - r.lonn)}</dd>
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
