import { bedriftInntektPerSek, forbedringspris, nesteMilepael, oppgraderingspris, statusfaktor } from '../../engine/formler'
import { kjopForbedring, oppgrader } from '../../engine/handlinger'
import { fusjonsfaktor } from '../../engine/fusjon'
import { BEDRIFTSTYPER, FORBEDRINGER, MILEPAELER } from '../../engine/innhold'
import { dagnummer } from '../../engine/kalender'
import { INNTEKT_HISTORIKK_SEK } from '../../engine/simulering'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, kroner, perSek, tall, varighet } from '../format'
import { kortDato } from '../kalender'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Personale } from '../komponenter/Bedriftskort'
import { Linjegraf } from '../komponenter/Linjegraf'
import { usePuls } from '../komponenter/Tikk'

export function Bedriftdetalj({ s, b, tilbake }: { s: Spilltilstand; b: Bedrift; tilbake: () => void }) {
  const type = BEDRIFTSTYPER[b.type]
  const inntekt = bedriftInntektPerSek(b) * statusfaktor(s)
  const pris = oppgraderingspris(b)
  const neste = nesteMilepael(b.nivaa)
  const punkter = [
    ...b.inntektHistorikk.map((v, i) => ({ sek: i * INNTEKT_HISTORIKK_SEK, verdi: v })),
    { sek: b.inntektHistorikk.length * INNTEKT_HISTORIKK_SEK, verdi: inntekt },
  ]
  const alder = s.sek - b.startetSek
  const puls = usePuls(b.nivaa + b.ansatte + b.forbedringer + (b.leder ? 1 : 0), MILEPAELER.includes(b.nivaa))

  return (
    <section className="skjerm">
      <button className="tilbake" onClick={tilbake}>
        ‹ Bedrifter
      </button>

      <div className="kort">
        <div className="bedriftskort-topp">
          <BedriftIkon type={b.type} />
          <div className="bedriftskort-midt">
            <h1 className="skjerm-tittel">
              {type.navn}
              {b.leder && <span className="merke-leder">Leder</span>}
            </h1>
            <span className="dempet">
              Nivå {b.nivaa}
              {b.ansatte > 0 && ` · ${b.ansatte} ansatte`}
              {(b.fusjoner ?? 0) > 0 && ` · ${b.fusjoner} ${b.fusjoner === 1 ? 'fusjon' : 'fusjoner'} (×${tall(fusjonsfaktor(b), 2)} inntekt)`}
            </span>
          </div>
        </div>
        <div className="detalj-kurs">
          <span className={`tall-kjempe pluss inntekt ${puls}`}>{perSek(inntekt)}</span>
          <span className="dempet liten">Inntekt etter lønn{statusfaktor(s) > 1 && ' og statusbonus'}</span>
        </div>
        {b.inntektHistorikk.length > 0 ? (
          <Linjegraf punkter={punkter} format={(n) => perSek(n)} farge="var(--pluss)" etikett={`Inntekten til ${type.navn}`} />
        ) : (
          <p className="graf-tom">Grafen fylles ut minutt for minutt.</p>
        )}
        <button className="knapp knapp-gull bred" disabled={s.kontanter < pris} onClick={() => utfor(oppgrader(s, b.id))}>
          Oppgrader til nivå {b.nivaa + 1} · {kortKroner(pris)}
        </button>
      </div>

      <dl className="kort rekorder">
        <div>
          <dt>Tjent totalt</dt>
          <dd>{kroner(b.tjent)}</dd>
        </div>
        <div>
          <dt>Investert</dt>
          <dd>{kroner(b.investert)}</dd>
        </div>
        <div>
          <dt>Tjent inn igjen</dt>
          <dd className={b.tjent >= b.investert ? 'pluss' : ''}>{tall((b.tjent / Math.max(1, b.investert)) * 100)} %</dd>
        </div>
        <div>
          <dt>Startet</dt>
          <dd>
            {kortDato(dagnummer(b.startetSek))} · for {varighet(alder)} siden
          </dd>
        </div>
      </dl>

      <div className="kort">
        <h2 className="kort-tittel">Forbedringer</h2>
        <ul className="forbedringer">
          {FORBEDRINGER[b.type].map((f, i) => {
            const kjøpt = i < b.forbedringer
            const neste = i === b.forbedringer
            const låstOpp = b.nivaa >= f.nivaa
            const pris = forbedringspris(b, f)
            return (
              <li key={f.navn} className={kjøpt ? 'kjøpt' : ''}>
                <div>
                  <strong>
                    {f.navn} <span className="gull">×{tall(f.faktor, 1)}</span>
                  </strong>
                  <p className="dempet liten">{f.beskrivelse}</p>
                </div>
                {kjøpt ? (
                  <span className="merke-ok">✓ Kjøpt</span>
                ) : neste && låstOpp ? (
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(kjopForbedring(s, b.id))}>
                    {kortKroner(pris)}
                  </button>
                ) : (
                  <span className="dempet liten laast-merke">🔒 Nivå {f.nivaa}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="kort">
        <h2 className="kort-tittel">Milepæler</h2>
        <ul className="milepaeler">
          {MILEPAELER.map((m) => {
            const nådd = b.nivaa >= m
            return (
              <li key={m} className={nådd ? 'nådd' : m === neste ? 'neste' : ''}>
                <span className="milepael-merke" aria-hidden="true">
                  {nådd ? '✓' : m}
                </span>
                <span>
                  Nivå {m}: ×2 inntekt
                  <span className="dempet liten">{nådd ? ' — nådd' : ` — ${m - b.nivaa} nivåer igjen`}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="kort">
        <Personale b={b} s={s} />
      </div>
    </section>
  )
}
