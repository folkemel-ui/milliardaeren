import { bedriftInntektIDag, bedriftsverdi, forbedringspris, milepaelboost, nesteMilepael, prisForNivaaer, statusfaktor } from '../../engine/formler'
import { bedriftssalgspris, kjopForbedring, selgBedrift } from '../../engine/handlinger'
import type { Kjopsmengde } from '../kjopsmengde'
import { FORMER, FUSJON_FRA_NIVAA, FUSJONSFAKTOR, fusjonsfaktor, fusjonstilbud, kanSlaasSammen } from '../../engine/fusjon'
import { kanVelgeRetning } from '../../engine/ansatte'
import { forbedringGir, fusjonGir, tilbakeTekst } from '../inntjening'
import { BEDRIFTSSALG_RABATT, BEDRIFTSTYPER, FORBEDRINGER, milepaelerFor } from '../../engine/innhold'
import { dagnummer } from '../../engine/kalender'
import { INNTEKT_HISTORIKK_SEK } from '../../engine/simulering'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall, varighet } from '../format'
import { kortDato } from '../kalender'
import { Scene } from '../komponenter/BedriftIkon'
import { IDag, Oppgraderingsknapp, Personale, Retningskort, Tilbakelinje } from '../komponenter/Bedriftskort'
import { Koknapp, useFlytetall } from '../komponenter/Hender'
import { BedriftBorsen } from '../komponenter/Bransje'
import { Linjegraf } from '../komponenter/Linjegraf'
import { usePuls } from '../komponenter/Tikk'
import { nattstil } from '../dagognatt'
import { useVoksUt } from '../overgang'
import { Ikon } from '../komponenter/Ikoner'
import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import { Filialkort } from '../komponenter/Filialer'
import { filialer } from '../../engine/filialer'

export function Bedriftdetalj({
  s,
  b,
  mengde,
  tilbake,
  tilRival,
}: {
  s: Spilltilstand
  b: Bedrift
  mengde: Kjopsmengde
  tilbake: () => void
  tilRival: (id: string, type: Bedrift['type']) => void
}) {
  const type = BEDRIFTSTYPER[b.type]
  const inntekt = bedriftInntektIDag(s, b)
  const neste = nesteMilepael(b.nivaa, b.type)
  const punkter = [
    ...b.inntektHistorikk.map((v, i) => ({ sek: i * INNTEKT_HISTORIKK_SEK, verdi: v })),
    { sek: b.inntektHistorikk.length * INNTEKT_HISTORIKK_SEK, verdi: inntekt },
  ]
  const alder = s.sek - b.startetSek
  const voks = useVoksUt<HTMLElement>()
  const puls = usePuls(b.nivaa + b.ansatte + b.forbedringer + (b.leder ? 1 : 0), milepaelerFor(b.type).includes(b.nivaa))
  const [flytetall, legg] = useFlytetall()
  // Pakke 99: retningen står først mens valget venter — før var den den åttende blokken.
  const venterRetning = kanVelgeRetning(b)
  const tilbud = fusjonstilbud(s, b)

  return (
    <section className="skjerm detalj" ref={voks} style={nattstil(s.sek)}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Bedrifter
      </button>

      <div className="kort">
        {flytetall}
        <Scene type={b.type} nivaa={b.nivaa} forbedringer={b.forbedringer} />
        <div className="bedriftskort-topp">
          <div className="bedriftskort-midt">
            <h1 className="skjerm-tittel">
              {type.navn}
              {b.leder && <span className="merke kant">Leder</span>}
              {b.retning && <span className="merke kant">{b.retning === 'volum' ? 'Volum' : 'Premium'}</span>}
            </h1>
            <span className="dempet">
              Nivå {b.nivaa}
              {b.ansatte > 0 && ` · ${b.ansatte} ansatte`}
              {(b.fusjoner ?? 0) > 0 && ` · ${b.fusjoner} ${b.fusjoner === 1 ? 'fusjon' : 'fusjoner'} (×${tall(fusjonsfaktor(b), 2)} inntekt)`}
              {filialer(b).length > 0 && ` · filialer i ${filialer(b).map((f) => f.by).join(', ')}`}
            </span>
          </div>
        </div>
        <div className="detalj-kurs">
          <span className={`tall-kjempe ${inntekt >= 0 ? 'pluss' : 'minus'} inntekt ${puls}`}>{perSek(inntekt)}</span>
          <span className="dempet liten">Inntekt i dag, etter lønn{statusfaktor(s) > 1 && ' og statusbonus'}</span>
          <IDag s={s} b={b} />
        </div>
        <Koknapp s={s} b={b} legg={legg} />
        {b.inntektHistorikk.length > 0 ? (
          <Linjegraf punkter={punkter} format={(n) => perSek(n)} farge="var(--pluss)" etikett={`Inntekten til ${type.navn}`} />
        ) : (
          <p className="graf-tom">Grafen fylles ut minutt for minutt.</p>
        )}
        <Oppgraderingsknapp s={s} b={b} mengde={mengde} bred />
        <Tilbakelinje s={s} b={b} mengde={mengde} />
      </div>

      {venterRetning && (
        <div className="kort">
          <Retningskort b={b} s={s} />
        </div>
      )}

      {kanSlaasSammen(b) && tilbud.length > 0 && (
        <button className="kort fusjonsrad" onClick={() => tilRival(tilbud[0].rival.id, b.type)}>
          <span>
            <strong>
              {tilbud.length === 1 ? `${tilbud[0].rival.navn} eier` : `${tilbud.length} rivaler eier`} {FORMER[b.type].en}
            </strong>
            <span className="dempet liten">
              {' '}
              · ×{tall(FUSJONSFAKTOR, 1)} inntekt{tilbud.length > 1 ? ' hver' : ''} · fra {kortKroner(tilbud[0].antydning)} ·{' '}
              {tilbakeTekst(tilbud[0].antydning, fusjonGir(s, b)).toLowerCase()}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <dl className="kort rekorder">
        <div>
          <dt>Tjent totalt</dt>
          <dd>{kortKroner(b.tjent)}</dd>
        </div>
        <div>
          <dt>Investert</dt>
          <dd>{kortKroner(b.investert)}</dd>
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
                  <span className="merke ok">✓ Kjøpt</span>
                ) : neste && låstOpp ? (
                  <span className="forbedring-kjop">
                    <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(kjopForbedring(s, b.id))}>
                      {kortKroner(pris)}
                    </button>
                    <span className="dempet liten">{tilbakeTekst(pris, forbedringGir(s, b))}</span>
                  </span>
                ) : (
                  <span className="dempet liten laast-merke">
                    <Ikon navn="las" størrelse={12} /> Nivå {f.nivaa}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <Filialkort s={s} b={b} />

      <div className="kort">
        <h2 className="kort-tittel">Milepæler</h2>
        <ul className="milepaeler">
          {milepaelerFor(b.type).map((m) => {
            const nådd = b.nivaa >= m
            return (
              <li key={m} className={nådd ? 'nådd' : m === neste ? 'neste' : ''}>
                <span className="milepael-merke" aria-hidden="true">
                  {nådd ? '✓' : m}
                </span>
                <span>
                  Nivå {m}: ×{String(milepaelboost(m, b.type)).replace('.', ',')} inntekt
                  <span className="dempet liten">
                    {nådd ? ' — nådd' : ` — ${m - b.nivaa} nivåer igjen${m === neste ? `, ${kortKroner(prisForNivaaer(b, m - b.nivaa))}` : ''}`}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        {b.nivaa < FUSJON_FRA_NIVAA && tilbud.length > 0 && (
          <p className="dempet liten">
            Fusjoner åpner ved nivå {FUSJON_FRA_NIVAA}: {tilbud.length === 1 ? `${tilbud[0].rival.navn} eier` : `${tilbud.length} rivaler eier`} {FORMER[b.type].en}.
          </p>
        )}
      </div>

      <BedriftBorsen s={s} b={b} />

      {!venterRetning && (
        <div className="kort">
          <Retningskort b={b} s={s} />
        </div>
      )}

      <div className="kort">
        <Personale b={b} s={s} />
      </div>

      <div className="kort">
        <div className="personale-rad">
          <div>
            <h3>Selg bedriften</h3>
            <p className="dempet liten">
              {s.bedrifter.length <= 1
                ? 'Den siste bedriften din kan du ikke selge.'
                : `Du får det bedriften er verdt, ${kortKroner(bedriftsverdi(b))}, minus ${tall(BEDRIFTSSALG_RABATT * 100)} %. Fusjonene og retningen forsvinner med den, og kjøper du bransjen igjen, starter du på nivå 1.`}
            </p>
          </div>
          <Bekreftknapp
            className="knapp knapp-fare knapp-liten"
            disabled={s.bedrifter.length <= 1}
            varsel={`Du taper ${kortKroner(bedriftsverdi(b) - bedriftssalgspris(b))}.`}
            onJa={() => utfor(selgBedrift(s, b.id))}
          >
            Selg · {kortKroner(bedriftssalgspris(b))}
          </Bekreftknapp>
        </div>
      </div>
    </section>
  )
}
