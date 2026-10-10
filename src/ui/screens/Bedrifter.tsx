import { useState } from 'react'
import { eierType, erLaastOpp } from '../../engine/formler'
import { kanVelgeRetning } from '../../engine/ansatte'
import { Bedriftdetalj } from './Bedriftdetalj'
import { kjopBedrift } from '../../engine/handlinger'
import { BEDRIFTSTYPER, STIGEN } from '../../engine/innhold'
import type { BedriftstypeId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek } from '../format'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Bedriftskort } from '../komponenter/Bedriftskort'
import { Seksjon } from '../komponenter/Seksjon'
import { Dagen } from '../komponenter/Dagen'
import { lagreKjopsmengde, lesKjopsmengde, MENGDER, type Kjopsmengde } from '../kjopsmengde'
import { Forklaring } from '../komponenter/Forklaring'
import { bedriftsrekkefolge, REKKEFOLGER } from '../deler'
import { fastInntekt } from '../sortering'
import { useTilbake } from '../tilbake'

export function Bedrifter({ s }: { s: Spilltilstand }) {
  const [valgt, settValgt] = useState<string | null>(null)
  const [mengde, settMengde] = useState<Kjopsmengde>(lesKjopsmengde)
  const velgMengde = (m: Kjopsmengde) => {
    lagreKjopsmengde(m)
    settMengde(m)
  }
  // Kjøpt (standard) eller etter fast inntekt — størst først, lik inntekt i kjøpsrekkefølge.
  const rekkefolge = bedriftsrekkefolge.bruk()
  const bedrifter = rekkefolge === 'inntekt' ? [...s.bedrifter].sort((a, b) => fastInntekt(b) - fastInntekt(a)) : s.bedrifter
  // Bedriftene som venter på en retning (Pakke 75): én linje øverst i stedet for et merke på hvert kort.
  const venter = bedrifter.filter(kanVelgeRetning)
  const tilSalgs = STIGEN.filter((t) => !eierType(s, t) && erLaastOpp(s, t))
  const laaste = STIGEN.filter((t) => !erLaastOpp(s, t))

  // Bedriften kan forsvinne mens siden er åpen (banken kan ta den over).
  const detalj = valgt ? s.bedrifter.find((b) => b.id === valgt) : undefined
  useTilbake(detalj !== undefined, () => settValgt(null))
  if (detalj) return <Bedriftdetalj s={s} b={detalj} mengde={mengde} tilbake={() => settValgt(null)} />

  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">
        Dine bedrifter <Forklaring tema="bedrifter" />
      </h1>
      <Dagen s={s} />
      {/* Pakke 75: ganger og rekkefølge på én rad. */}
      <div className="bedrifter-kontroller">
        <div className="segment mengdevalg" role="radiogroup" aria-label="Hvor mange nivåer hver oppgradering kjøper">
          {MENGDER.map((m) => (
            <button key={m.id} role="radio" aria-checked={mengde === m.id} className={mengde === m.id ? 'aktiv' : ''} onClick={() => velgMengde(m.id)}>
              {m.navn}
            </button>
          ))}
        </div>
        {s.bedrifter.length >= 3 && (
          <div className="segment rekkefolge" role="radiogroup" aria-label="Rekkefølge på bedriftene">
            {REKKEFOLGER.map((r) => (
              <button key={r.id} role="radio" aria-checked={rekkefolge === r.id} className={rekkefolge === r.id ? 'aktiv' : ''} onClick={() => bedriftsrekkefolge.sett(r.id)}>
                {r.navn}
              </button>
            ))}
          </div>
        )}
      </div>
      {venter.length > 0 && (
        <button type="button" className="retningslinje" onClick={() => settValgt(venter[0].id)}>
          <span className="retningsprikk" aria-hidden="true" />
          {venter.length === 1 ? `${BEDRIFTSTYPER[venter[0].type].navn} venter på retning` : `${venter.length} bedrifter venter på retning`}
          <span aria-hidden="true"> ›</span>
        </button>
      )}
      <ul className="kortliste">
        {bedrifter.map((b) => (
          <Bedriftskort key={b.id} b={b} s={s} mengde={mengde} åpne={() => settValgt(b.id)} />
        ))}
      </ul>

      {(tilSalgs.length > 0 || laaste.length > 0) && (
      <Seksjon id="bedrifter-nye" tittel="Start ny bedrift" sammendrag={tilSalgs.length ? `${tilSalgs.length} til salgs` : `${laaste.length} låst`} harInnhold={tilSalgs.length > 0}>
      <ul className="kortliste">
        {tilSalgs.map((id) => {
          const t = BEDRIFTSTYPER[id]
          return (
            <li key={id} className="kort kjopskort">
              <BedriftIkon type={id} />
              <div className="bedriftskort-midt">
                <h2>{t.navn}</h2>
                <span className="pluss liten">{perSek(t.grunninntekt)}</span>
              </div>
              <button
                className="knapp knapp-gull knapp-liten"
                disabled={s.kontanter < t.pris}
                onClick={() => utfor(kjopBedrift(s, id))}
              >
                Kjøp · {kortKroner(t.pris)}
              </button>
            </li>
          )
        })}
        {laaste.map((id, i) => (
          <Laastkort key={id} s={s} id={id} neste={i === 0} synlig={i < SYNLIGE_LAASTE} />
        ))}
      </ul>
      </Seksjon>
      )}
    </section>
  )
}

/** De første låste bedriftene vises med navn og bilde; resten er silhuetter, så sluttspillet blir en overraskelse. */
const SYNLIGE_LAASTE = 3

function Laastkort({ s, id, neste, synlig }: { s: Spilltilstand; id: BedriftstypeId; neste: boolean; synlig: boolean }) {
  const t = BEDRIFTSTYPER[id]
  return (
    <li className={synlig ? 'kort kjopskort laast' : 'kort kjopskort laast skjult'}>
      <div className={synlig ? '' : 'silhuett'}>
        <BedriftIkon type={id} dempet />
      </div>
      <div className="bedriftskort-midt">
        <h2>{synlig ? t.navn : '???'}</h2>
        <span className="dempet liten">Låses opp ved {kortKroner(t.laasesOppVed)}</span>
        {neste && (
          <div className="milepael-spor">
            <div className="milepael-fyll" style={{ width: `${Math.min(1, s.hoyesteFormue / t.laasesOppVed) * 100}%` }} />
          </div>
        )}
      </div>
      <span className="laas" aria-label="Låst">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
        </svg>
      </span>
    </li>
  )
}
