import { useState } from 'react'
import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import { byggStadion, kjopKlubb, kjopSpiller, selgKlubb, selgSpiller, settTaktikk } from '../../engine/handlinger'
import {
  ANTALL_LAG,
  DIVISJONER,
  divisjonsnavn,
  FLOMLYS,
  form,
  forventetMaal,
  kjopspris,
  KLUBB_LAAST_OPP,
  KLUBBNAVN,
  KLUBBSALG_HONORAR,
  klubbTilSalgs,
  kravtekst,
  klubbverdi,
  lagstyrke,
  LONN_ANDEL,
  lonnPerDag,
  MAKS_TROPP,
  MIN_TROPP,
  nesteKamp,
  nesteUtbygging,
  oppfyllerKrav,
  plasser,
  plassering,
  poeng,
  RUNDER_PER_SESONG,
  rykkerNed,
  rykkerOpp,
  salgspris,
  spillerverdi,
  sponsorbelop,
  STADIONTRINN,
  tabell,
  TAKTIKKER,
  tilskuere,
  VIP,
  type Stadiondel,
} from '../../engine/klubb'
import { tidTilNesteRunde } from '../../engine/startups'
import type { Kamp, Klubb as KlubbT, Spilltilstand, Taktikk } from '../../engine/types'
import { utfor } from '../../state/lager'
import { fortegnKroner, kompakt, kortKroner, tall, varighet } from '../format'
import { Ikon } from '../komponenter/Ikoner'
import { Klubbvaapen } from '../komponenter/Klubbvaapen'
import { Stadion } from '../komponenter/Stadion'
import { Forklaring } from '../komponenter/Forklaring'

/**
 * Klubb-delen i Luksus (Pakke 62): klubben din rett i delen, uten egen side
 * og tilbakeknapp. Uten klubb er den til salgs — eller låst til formuen har
 * vært høy nok.
 */
export function Klubbdel({ s }: { s: Spilltilstand }) {
  if (s.klubb) return <Klubbside s={s} k={s.klubb} />
  if (s.hoyesteFormue < KLUBB_LAAST_OPP) {
    return (
      <div className="kort klubbkort">
        <span className="klubb-emoji" aria-hidden="true">
          <Ikon navn="ball" størrelse={26} />
        </span>
        <span className="klubbkort-midt">
          <strong>Fotballklubb</strong>
          <span className="dempet liten">Til salgs når nettoformuen har vært {kortKroner(KLUBB_LAAST_OPP)}</span>
        </span>
      </div>
    )
  }
  return <Klubbkjop s={s} />
}

function Klubbkjop({ s }: { s: Spilltilstand }) {
  const [navn, settNavn] = useState(KLUBBNAVN[0])
  const [feil, settFeil] = useState<string | null>(null)
  const { klubb, pris } = klubbTilSalgs(s, navn)
  return (
    <div className="kort klubbkjop">
      <h2 className="skjerm-tittel">
        Kjøp en fotballklubb <Forklaring tema="klubb" />
      </h2>
      <p className="dempet">
        Klubbene i 4. divisjon er til salgs. Du får en tropp på {klubb.spillere.length} spillere og sponsorpengene for første sesong.
        Klubben spiller én kamp hver spilldag.
      </p>
      <div className="navnevalg" role="radiogroup" aria-label="Velg klubb">
        {KLUBBNAVN.map((n) => (
          <button key={n} role="radio" aria-checked={navn === n} className={navn === n ? 'aktiv' : ''} onClick={() => settNavn(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="klubbvalgt">
        <Klubbvaapen navn={navn} størrelse={56} />
        <strong>{navn}</strong>
      </div>
      <Stadion divisjon={0} navn={navn} />
      <p className="liten">
        Lagstyrke <strong>{tall(lagstyrke(klubb))}</strong> · troppen er verdt {kortKroner(pris - DIVISJONER[0].verdi)}
      </p>
      {feil && <p className="rival-melding">{feil}</p>}
      <button className="knapp knapp-gull bred" disabled={s.kontanter < pris} onClick={() => settFeil(utfor(kjopKlubb(s, navn), true))}>
        Kjøp {navn} · {kortKroner(pris)}
      </button>
    </div>
  )
}

const RESULTAT = (k: Kamp) => (k.maalFor > k.maalMot ? 'S' : k.maalFor === k.maalMot ? 'U' : 'T')

function Klubbside({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  const [bekreft, settBekreft] = useState(false)
  const verdi = klubbverdi(s)
  const neste = nesteKamp(k)
  const styrke = lagstyrke(k)
  const netto = k.billetter + k.sponsor - k.lonn
  const opp = rykkerOpp(k)
  const ned = rykkerNed(k)
  const sperret = k.divisjon < DIVISJONER.length - 1 && !oppfyllerKrav(k, k.divisjon + 1)
  const nye = k.lag.filter((l) => l.fra !== undefined)

  return (
    <>
      <div className="kort klubbtopp">
        <Stadion divisjon={k.divisjon} navn={k.navn} />
        <div className="rival-topp">
          <div className="klubbtopp-navn">
            <Klubbvaapen navn={k.navn} størrelse={52} />
            <div>
              <h2 className="skjerm-tittel">
                {k.navn} <Forklaring tema="klubb" />
              </h2>
              <span className="dempet">
                {DIVISJONER[k.divisjon].navn} · sesong {k.sesong}
              </span>
            </div>
          </div>
          <div className="papirrad-kurs">
            <span>{kortKroner(verdi)}</span>
            <span className="dempet liten">klubbverdi</span>
          </div>
        </div>
        <div className="klubbtall">
          <div>
            <span className="etikett">Plass</span>
            <strong>
              {plassering(k)} / {ANTALL_LAG}
            </strong>
          </div>
          <div>
            <span className="etikett">Lagstyrke</span>
            <strong>{tall(styrke)}</strong>
          </div>
          <div>
            <span className="etikett">Runde</span>
            <strong>
              {Math.min(k.runde + 1, RUNDER_PER_SESONG)} / {RUNDER_PER_SESONG}
            </strong>
          </div>
        </div>
      </div>

      <Stadionkort s={s} k={k} />

      {neste && (
        <div className="kort">
          <h2 className="kort-tittel">Neste kamp · om {varighet(tidTilNesteRunde(s))}</h2>
          <Kampoppsett k={k} styrke={styrke} motstander={neste.motstander.navn} motStyrke={neste.motstander.styrke} hjemme={neste.hjemme} />
          <div className="segment" role="radiogroup" aria-label="Taktikk">
            {(Object.keys(TAKTIKKER) as Taktikk[]).map((t) => (
              <button key={t} role="radio" aria-checked={k.taktikk === t} className={k.taktikk === t ? 'aktiv' : ''} onClick={() => utfor(settTaktikk(s, t))}>
                {TAKTIKKER[t].navn}
              </button>
            ))}
          </div>
          <p className="dempet liten">{TAKTIKKER[k.taktikk].beskrivelse}</p>
        </div>
      )}

      {k.kamper.length > 0 && (
        <div className="kort">
          <h2 className="kort-tittel">Siste kamper</h2>
          <ul className="kampliste">
            {[...k.kamper].reverse().slice(0, 5).map((m) => (
              <li key={`${m.sesong}-${m.runde}`}>
                <span className={`brikke resultat r${RESULTAT(m)}`}>{RESULTAT(m)}</span>
                <span className="spiller-navn">
                  <span>
                    {m.hjemme ? 'Hjemme mot' : 'Borte mot'} {m.motstander}
                  </span>
                  {m.tilskuere !== undefined && <span className="dempet liten">{tall(m.tilskuere)} tilskuere</span>}
                </span>
                <strong>
                  {m.maalFor}–{m.maalMot}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="kort">
        <h2 className="kort-tittel">Tabell</h2>
        <table className="tabell">
          <thead>
            <tr>
              <th>#</th>
              <th>Lag</th>
              <th>K</th>
              <th>+/−</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {tabell(k).map((i, plass) => {
              const l = k.lag[i]
              const sone = opp.includes(i) ? 'opp' : ned.includes(i) && k.divisjon > 0 ? 'ned' : ''
              return (
                <tr key={l.navn} className={`${i === 0 ? 'deg' : ''} ${sone}`}>
                  <td>{plass + 1}</td>
                  <td>
                    <span className="tabell-lag">
                      <Klubbvaapen navn={l.navn} størrelse={18} />
                      {l.navn}
                    </span>
                  </td>
                  <td>{l.spilt}</td>
                  <td>{fortegn(l.maalFor - l.maalMot)}</td>
                  <td>
                    <strong>{poeng(l)}</strong>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="dempet liten">
          {k.divisjon < DIVISJONER.length - 1 && `De to beste rykker opp til ${DIVISJONER[k.divisjon + 1].navn}${sperret ? ' — men ikke du, før stadion holder kravet' : ''}. `}
          {k.divisjon > 0 && `De to dårligste rykker ned.`}
        </p>
        {nye.length > 0 && (
          <p className="dempet liten">
            Nye i år: {nye.map((l) => `${l.navn} (${l.fra! > k.divisjon ? 'ned' : 'opp'} fra ${divisjonsnavn(l.fra!)})`).join(', ')}.
          </p>
        )}
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Troppen</h2>
          <span className="dempet liten">
            {k.spillere.length} / {MAKS_TROPP} · lønn {kortKroner(lonnPerDag(k))} per dag
          </span>
        </div>
        <ul className="spillerliste">
          {k.spillere.map((p, i) => (
            <li key={p.id} className={i < MIN_TROPP ? 'start' : ''}>
              <Styrke verdi={p.styrke} />
              <span className="spiller-navn">
                <strong>{p.navn}</strong>
                <span className="dempet liten">
                  {p.alder} år · verdi {kompakt(spillerverdi(p))}
                  {i >= MIN_TROPP && ' · innbytter'}
                </span>
              </span>
              <Bekreftknapp
                className="knapp knapp-bud spiller-knapp"
                ja="Ja"
                disabled={k.spillere.length <= MIN_TROPP}
                onJa={() => utfor(selgSpiller(s, p.id))}
              >
                <span>Selg</span>
                <strong>{kompakt(salgspris(p))}</strong>
              </Bekreftknapp>
            </li>
          ))}
        </ul>
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Overgangsmarkedet</h2>
          <span className="dempet liten">Nye spillere i morgen</span>
        </div>
        <ul className="spillerliste">
          {k.marked.map((p) => (
            <li key={p.id}>
              <Styrke verdi={p.styrke} />
              <span className="spiller-navn">
                <strong>{p.navn}</strong>
                <span className="dempet liten">
                  {p.alder} år · lønn {kompakt(spillerverdi(p) * LONN_ANDEL)}/dag
                </span>
              </span>
              <button
                className="knapp knapp-gull knapp-bud spiller-knapp"
                disabled={k.spillere.length >= MAKS_TROPP || s.kontanter < kjopspris(p)}
                onClick={() => utfor(kjopSpiller(s, p.id))}
              >
                <span>Kjøp</span>
                <strong>{kompakt(kjopspris(p))}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dl className="kort rekorder">
        <div>
          <dt>Billetter i år</dt>
          <dd className="pluss">{kortKroner(k.billetter)}</dd>
        </div>
        <div>
          <dt>Sponsor i år</dt>
          <dd className="pluss">{kortKroner(k.sponsor)}</dd>
        </div>
        <div>
          <dt>Lønn i år</dt>
          <dd className="minus">−{kortKroner(k.lonn)}</dd>
        </div>
        <div>
          <dt>Netto i år</dt>
          <dd className={netto >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(netto)}</dd>
        </div>
      </dl>

      <div className="kort">
        {bekreft ? (
          <div className="rival-knapper">
            <button className="knapp knapp-fare" onClick={() => utfor(selgKlubb(s))}>
              Ja, selg for {kortKroner(verdi * (1 - KLUBBSALG_HONORAR))}
            </button>
            <button className="knapp" onClick={() => settBekreft(false)}>
              Avbryt
            </button>
          </div>
        ) : (
          <button className="knapp bred" onClick={() => settBekreft(true)}>
            Selg klubben · {kortKroner(verdi * (1 - KLUBBSALG_HONORAR))}
          </button>
        )}
        <p className="dempet liten">Megler og advokater tar {tall(KLUBBSALG_HONORAR * 100)} %. Trofeene beholder du.</p>
      </div>
    </>
  )
}

const UTBYGGINGER: { del: Stadiondel; effekt: (k: KlubbT) => string }[] = [
  { del: 'tribune', effekt: () => 'Plass til flere når laget går godt eller rykker opp' },
  { del: 'flomlys', effekt: () => `Kveldskamper: ${tall((FLOMLYS.publikum - 1) * 100)} % flere vil komme` },
  { del: 'vip', effekt: (k) => `Sponsoren betaler ${tall((VIP.sponsor - 1) * 100)} % mer fra neste sesong — ${kortKroner(sponsorbelop({ ...k, stadion: { ...k.stadion, vip: true } }) - sponsorbelop(k))} i ${DIVISJONER[k.divisjon].navn}` },
]

/**
 * Stadion (Pakke 66): plassene, publikummet og lisenskravet, og det du kan
 * bygge. Det du bygger, teller i klubbverdien.
 */
function Stadionkort({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  const div = DIVISJONER[k.divisjon]
  const forventet = tilskuere(k, form(k))
  const over = k.divisjon < DIVISJONER.length - 1 ? k.divisjon + 1 : null
  const holder = over === null || oppfyllerKrav(k, over)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Stadion</h2>
        <span className="dempet liten">{STADIONTRINN[k.stadion.trinn].navn}</span>
      </div>
      <div className="klubbtall">
        <div>
          <span className="etikett">Plasser</span>
          <strong>{tall(plasser(k))}</strong>
        </div>
        <div>
          <span className="etikett">Publikum</span>
          <strong>{tall(forventet)}</strong>
        </div>
        <div>
          <span className="etikett">Billett</span>
          <strong>{kortKroner(div.billettpris)}</strong>
        </div>
      </div>
      <p className="dempet liten">
        Neste hjemmekamp gir om lag {kortKroner(forventet * div.billettpris)}
        {forventet >= plasser(k) ? ' — utsolgt, flere ville kommet.' : '.'}
      </p>
      {over !== null && (
        <p className="liten stadionkrav">
          <span className={`merke ${holder ? 'ok' : 'varsel'}`}>{holder ? 'Holder' : 'Mangler'}</span> {DIVISJONER[over].navn} krever {kravtekst(over)}.
        </p>
      )}
      <ul className="stadionliste">
        {UTBYGGINGER.map(({ del, effekt }) => {
          const neste = nesteUtbygging(k, del)
          const ferdig = del === 'tribune' ? STADIONTRINN[k.stadion.trinn].navn : del === 'flomlys' ? 'Flomlys' : 'VIP-losje'
          return (
            <li key={del}>
              <span className="spiller-navn">
                <strong>{neste ? (neste.plasser ? `${neste.navn} · ${tall(neste.plasser)} plasser` : neste.navn) : ferdig}</strong>
                <span className="dempet liten">{neste ? effekt(k) : 'Ferdig bygd'}</span>
              </span>
              {neste ? (
                <button className="knapp knapp-gull knapp-bud spiller-knapp" disabled={s.kontanter < neste.pris} onClick={() => utfor(byggStadion(s, del), true)}>
                  <span>Bygg</span>
                  <strong>{kompakt(neste.pris)}</strong>
                </button>
              ) : (
                <span className="merke ok">Bygd</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const fortegn = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Kampoppsett({ k, styrke, motstander, motStyrke, hjemme }: { k: KlubbT; styrke: number; motstander: string; motStyrke: number; hjemme: boolean }) {
  const [xh, xb] = hjemme ? forventetMaal(styrke, motStyrke, k.taktikk, 'balansert') : forventetMaal(motStyrke, styrke, 'balansert', k.taktikk)
  const [egne, mot] = hjemme ? [xh, xb] : [xb, xh]
  return (
    <div className="kampoppsett">
      <div>
        <Klubbvaapen navn={hjemme ? k.navn : motstander} størrelse={40} />
        <strong>{hjemme ? k.navn : motstander}</strong>
        <span className="dempet liten">styrke {tall(hjemme ? styrke : motStyrke)}</span>
      </div>
      <span className="kamp-mot">mot</span>
      <div>
        <Klubbvaapen navn={hjemme ? motstander : k.navn} størrelse={40} />
        <strong>{hjemme ? motstander : k.navn}</strong>
        <span className="dempet liten">styrke {tall(hjemme ? motStyrke : styrke)}</span>
      </div>
      <p className="dempet liten kamp-forventet">
        {hjemme ? 'Hjemmekamp' : 'Bortekamp'} · forventet {tall(egne, 1)} mål for, {tall(mot, 1)} mot
      </p>
    </div>
  )
}

function Styrke({ verdi }: { verdi: number }) {
  return (
    <span className="spiller-styrke" style={{ ['--andel' as string]: `${verdi}%` }} aria-label={`Styrke ${verdi}`}>
      {verdi}
    </span>
  )
}
