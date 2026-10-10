/**
 * Selskaper: startups du kan investere i, og rivalene — aksjer, oppkjøp og fusjoner.
 * En del av Investeringer-fanen (Pakke 65 delte Investeringer.tsx per del).
 */

import { useState } from 'react'
import { Bekreftknapp } from '../../komponenter/Bekreftknapp'
import { nettoformue } from '../../../engine/formler'
import { byPaaBedrift, godtaMotbud, investerIStartup, kjopRivalblokk, overtaRival, selgRivalandel } from '../../../engine/handlinger'
import { BLOKK, blokkpris, forbesliste, RIVALUTBYTTE, SALGSHONORAR, selskapsverdi } from '../../../engine/rivaler'
import { BUD, type BudId, dagensForhandling, FORMER, FUSJON_FRA_NIVAA, FUSJONSFAKTOR, fulltOppkjop, prisantydning, rivalbedrifter } from '../../../engine/fusjon'
import { BEDRIFTSTYPER } from '../../../engine/innhold'
import type { BedriftstypeId, Rival, Spilltilstand } from '../../../engine/types'
import { utfor } from '../../../state/lager'
import { endring, fortegnKroner, kortKroner, tall, varighet } from '../../format'
import { Illustrasjon } from '../../komponenter/Illustrasjoner'
import { aktive, ide, INNTRYKK, ledigIRunde, RUNDER, STARTUP_LAAST_OPP, tidTilNesteRunde } from '../../../engine/startups'
import { StartupLogo } from '../../komponenter/StartupLogo'
import { Ikon } from '../../komponenter/Ikoner'
import { Rivalportrett } from '../../komponenter/Rivalportrett'

/** Nærbildet i rivalenes bedriftsliste. Fast, så Illustrasjon (memo) ikke tegnes på nytt hvert sekund (Pakke 64). */
const NAER_RIVAL = [32, 32] as const

const SLUTT: Record<string, string> = { konkurs: 'Konkurs', solgt: 'Kjøpt opp', bors: 'Børsnotert' }

export function Startups({ s }: { s: Spilltilstand }) {
  const liste = aktive(s)
  const avsluttet = (s.startups ?? []).filter((st) => st.status !== 'aktiv').reverse()
  if (s.hoyesteFormue < STARTUP_LAAST_OPP && liste.length === 0) {
    return (
      <div className="kort">
        <h2 className="kort-tittel">Startups</h2>
        <p className="dempet">Gründerne tar kontakt når du har nådd {kortKroner(STARTUP_LAAST_OPP)}.</p>
      </div>
    )
  }
  return (
    <>
      {liste.length === 0 && <p className="dempet">Ingen søker penger akkurat nå. Nye gründere dukker opp ved dagsskiftene.</p>}
      <ul className="kortliste">
        {liste.map((st) => {
          const { navn, beskrivelse } = ide(st)
          const ledig = ledigIRunde(st)
          const valg = [...new Set([ledig / 4, ledig / 2, ledig].map((b) => Math.floor(b)))].filter((b) => b > 0)
          return (
            <li key={st.id} className="kort startupkort">
              <div className="rival-topp">
                <div className="rivalbedrift-topp">
                  <StartupLogo navn={navn} />
                  <div>
                    <h2>{navn}</h2>
                    <span className="dempet liten">{INNTRYKK[st.inntrykk]}</span>
                  </div>
                </div>
                <div className="papirrad-kurs">
                  <span>{kortKroner(st.verdi)}</span>
                  <span className="dempet liten">verdsatt</span>
                </div>
              </div>
              <p className="dempet liten startup-besk">{beskrivelse}</p>
              <ol className="runder" aria-label={`Runde ${st.runde + 1} av ${RUNDER.length}`}>
                {RUNDER.map((r, i) => (
                  <li key={r.navn} className={i < st.runde ? 'ferdig' : i === st.runde ? 'naa' : ''}>
                    {r.navn}
                  </li>
                ))}
              </ol>
              {st.andel > 0 && (
                <div className="rival-andel">
                  <span>
                    Din andel: <strong>{tall(st.andel * 100, 2)} %</strong> · {kortKroner(st.andel * st.verdi)}
                  </span>
                  <span className={st.andel * st.verdi >= st.investert ? 'pluss liten' : 'minus liten'}>
                    {fortegnKroner(st.andel * st.verdi - st.investert)}
                  </span>
                </div>
              )}
              <span className="dempet liten">
                {RUNDER[st.runde].navn} avgjøres om {varighet(tidTilNesteRunde(s))}
                {ledig <= 0 && ' · du har tatt din del av runden'}
              </span>
              {valg.length > 0 && (
                <div className="bud-knapper">
                  {valg.map((b, i) => (
                    <button
                      key={b}
                      className={i === valg.length - 1 ? 'knapp knapp-gull knapp-bud' : 'knapp knapp-bud'}
                      disabled={s.kontanter < b}
                      onClick={() => utfor(investerIStartup(s, st.id, b))}
                    >
                      <span>{i === valg.length - 1 ? 'Maks' : 'Invester'}</span>
                      <strong>{kortKroner(b)}</strong>
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {avsluttet.length > 0 && (
        <div className="kort">
          <h2 className="kort-tittel">Avsluttet</h2>
          <ul className="startup-slutt">
            {avsluttet.map((st) => (
              <li key={st.id}>
                <span>
                  <StartupLogo navn={ide(st).navn} liten /> {ide(st).navn} <span className="dempet liten">· {SLUTT[st.status]}</span>
                </span>
                {st.investert > 0 ? (
                  <span className={(st.utbetalt ?? 0) >= st.investert ? 'pluss' : 'minus'}>{fortegnKroner((st.utbetalt ?? 0) - st.investert)}</span>
                ) : (
                  <span className="dempet liten">Du var ikke med</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export function Rivaler({ s }: { s: Spilltilstand }) {
  const liste = forbesliste(s, nettoformue(s))
  return (
    <>
      <div className="kort">
        <h2 className="kort-tittel">Forbes-lista</h2>
        <ol className="forbes">
          {liste.map((p, i) => (
            <li key={p.navn} className={p.deg ? 'deg' : ''}>
              <span className="forbes-plass">{i + 1}</span>
              <span className="forbes-navn">
                {p.rivalId ? (
                  <Rivalportrett id={p.rivalId} størrelse={28} />
                ) : (
                  <span className="forbes-deg" aria-hidden="true">
                    <Ikon navn="person" størrelse={16} />
                  </span>
                )}
                {p.navn}
              </span>
              <span className="forbes-formue">{kortKroner(p.formue)}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="dempet liten">
        Kjøp deg inn i rivalenes holdingselskaper i blokker på {tall(BLOKK * 100)} %. Andelene gir {tall(RIVALUTBYTTE * 100)} %
        utbytte per time. Med halvparten kan du ta resten med et fiendtlig oppkjøp — da får du bedriftene deres med på kjøpet,
        men aldri billigere enn fusjonene ville kostet hver for seg.
      </p>
      <p className="dempet liten">
        Du kan også by på bedriftene rivalene eier. Kjøper du en, slås den sammen med din egen i samme bransje, og inntekten
        ganges med {tall(FUSJONSFAKTOR, 1)}. Din bedrift må ha nådd nivå {FUSJON_FRA_NIVAA}. Ett bud per bedrift per dag.
      </p>

      <ul className="kortliste">
        {s.rivaler.map((r) => {
          const verdi = selskapsverdi(r)
          const min = r.andel * verdi
          const bp = blokkpris(r)
          const op = fulltOppkjop(s, r)
          return (
            <li key={r.id} className={r.overtatt ? 'kort rivalkort eid' : 'kort rivalkort'}>
              <div className="rival-topp">
                <Rivalportrett id={r.id} størrelse={44} />
                <div className="rival-navn">
                  <h2>{r.selskap}</h2>
                  <span className="dempet liten">
                    {r.overtatt ? 'Eid av deg — tidligere' : 'Eies av'} {r.navn}
                  </span>
                </div>
                <div className="papirrad-kurs">
                  <span>{kortKroner(verdi)}</span>
                  <span className="dempet liten">selskapsverdi</span>
                </div>
              </div>
              {r.andel > 0 && (
                <div className="rival-andel">
                  <span>
                    Din andel: <strong>{tall(r.andel * 100)} %</strong> · {kortKroner(min)}
                  </span>
                  <span className={min >= r.kostpris ? 'pluss liten' : 'minus liten'}>
                    {fortegnKroner(min - r.kostpris)} · {endring(r.kostpris > 0 ? min / r.kostpris - 1 : 0)}
                  </span>
                </div>
              )}
              <div className="andelsbar" aria-hidden="true">
                <div style={{ width: `${r.andel * 100}%` }} />
                <span className="andelsbar-strek" />
              </div>
              <div className="rival-knapper">
                {!r.overtatt && r.andel < 0.5 - 1e-9 && (
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < bp} onClick={() => utfor(kjopRivalblokk(s, r.id))}>
                    Kjøp {tall(BLOKK * 100)} % · {kortKroner(bp)}
                  </button>
                )}
                {!r.overtatt && r.andel >= 0.5 - 1e-9 && (
                  <button className="knapp knapp-fare knapp-liten" disabled={s.kontanter < op} onClick={() => utfor(overtaRival(s, r.id))}>
                    Fiendtlig oppkjøp · {kortKroner(op)}
                  </button>
                )}
                {r.andel > 0 && (
                  <Bekreftknapp
                    className="knapp knapp-liten"
                    varsel={r.overtatt ? `Hele ${r.selskap} selges.` : undefined}
                    onJa={() => utfor(selgRivalandel(s, r.id))}
                  >
                    Selg · {kortKroner(min * (1 - SALGSHONORAR))}
                  </Bekreftknapp>
                )}
              </div>
              <Rivalbedrifter s={s} r={r} />
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Bedriftene en rival eier, med bud, motbud og avslag. */
function Rivalbedrifter({ s, r }: { s: Spilltilstand; r: Rival }) {
  const [melding, settMelding] = useState<string | null>(null)
  const liste = rivalbedrifter(r)
  if (r.overtatt) return null

  function by(type: BedriftstypeId, bud: BudId) {
    const u = byPaaBedrift(s, r.id, type, bud)
    const feil = utfor(u, true)
    const avtale = u.ok && (u.tilstand.rivaler.find((x) => x.id === r.id)?.solgt ?? []).includes(type)
    settMelding(feil ?? (avtale ? `Avtale! ${stor(FORMER[type].den)} er slått sammen med virksomheten din.` : null))
  }

  function godta(type: BedriftstypeId) {
    const feil = utfor(godtaMotbud(s, r.id, type), true)
    settMelding(feil ?? `Avtale! ${stor(FORMER[type].den)} er slått sammen med virksomheten din.`)
  }

  return (
    <details className="rivalbedrifter">
      <summary>
        Bedriftene til {r.navn.split(' ')[0]} <span className="dempet">({liste.length})</span>
      </summary>
      {melding && <p className="rival-melding">{melding}</p>}
      {liste.length === 0 ? (
        <p className="dempet liten">{r.navn} eier ingen bedrifter som er til salgs.</p>
      ) : (
        <ul>
          {liste.map((rb) => {
            const din = s.bedrifter.find((b) => b.type === rb.type)
            const f = dagensForhandling(s, r, rb.type)
            const antydning = prisantydning(s, rb)
            return (
              <li key={rb.type}>
                <div className="rivalbedrift-topp">
                  <Illustrasjon id={rb.type} størrelse={32} naerbilde={NAER_RIVAL} />
                  <div>
                    <strong>{BEDRIFTSTYPER[rb.type].navn}</strong>
                    <span className="dempet liten">
                      Nivå {rb.nivaa} · prisantydning {kortKroner(antydning)}
                    </span>
                  </div>
                </div>
                {!din ? (
                  <p className="dempet liten">Du må eie {FORMER[rb.type].en} selv for å slå dem sammen.</p>
                ) : din.nivaa < FUSJON_FRA_NIVAA ? (
                  <p className="dempet liten">
                    Fusjoner åpner når {FORMER[rb.type].den} din når nivå {FUSJON_FRA_NIVAA} — nå nivå {din.nivaa}.
                  </p>
                ) : f?.motbud ? (
                  <div className="rival-knapper">
                    <span className="liten">
                      {r.navn.split(' ')[0]} vil ha <strong>{kortKroner(f.motbud)}</strong>
                    </span>
                    <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < f.motbud} onClick={() => godta(rb.type)}>
                      Godta
                    </button>
                  </div>
                ) : f ? (
                  <p className="dempet liten">{r.navn.split(' ')[0]} sa nei. Prøv igjen i morgen.</p>
                ) : (
                  <div className="bud-knapper">
                    {BUD.map((b) => {
                      const tilbud = antydning * b.faktor
                      return (
                        <button
                          key={b.id}
                          className={b.id === 'sjenerost' ? 'knapp knapp-gull knapp-bud' : 'knapp knapp-bud'}
                          disabled={s.kontanter < tilbud}
                          onClick={() => by(rb.type, b.id)}
                        >
                          <span>{b.navn}</span>
                          <strong>{kortKroner(tilbud)}</strong>
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}

const stor = (t: string) => t[0].toUpperCase() + t.slice(1)
