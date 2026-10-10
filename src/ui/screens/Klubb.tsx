import { useState } from 'react'
import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import { byggAkademi, byggStadion, kjopKlubb, kjopSpiller, selgKlubb, selgSpiller, settFormasjon, settTaktikk } from '../../engine/handlinger'
import {
  AKADEMITRINN,
  ANTALL_LAG,
  FORMASJONSLISTE,
  JUNIOR_TIL,
  lagprofil,
  nesteAkademi,
  POSISJONER,
  potensialspenn,
  snittvurdering,
  startellever,
  toppscorere,
  type Lagprofil,
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
import type { Kamp, Klubb as KlubbT, Posisjon, Sesongoppsummering, Spiller, Spilltilstand, Taktikk } from '../../engine/types'
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
  const profil = lagprofil(k)
  // Hvem som starter neste kamp, og på hvilken plass (Pakke 71).
  const plasser = new Map<number, Posisjon>()
  for (const { plass, spiller } of startellever(k)) if (spiller) plasser.set(spiller.id, plass)
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
            <span className="etikett">Angrep · forsvar</span>
            <strong>
              {tall(profil.angrep)} · {tall(profil.forsvar)}
            </strong>
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
          <Kampoppsett k={k} profil={profil} motstander={neste.motstander.navn} motStyrke={neste.motstander.styrke} hjemme={neste.hjemme} />
          <h3 className="etikett">Formasjon</h3>
          <div className="segment" role="radiogroup" aria-label="Formasjon">
            {FORMASJONSLISTE.map((f) => (
              <button key={f} role="radio" aria-checked={k.formasjon === f} className={k.formasjon === f ? 'aktiv' : ''} onClick={() => utfor(settFormasjon(s, f))}>
                {f}
              </button>
            ))}
          </div>
          <h3 className="etikett">Taktikk</h3>
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

      {k.kamper.length > 0 && <Kamprapport kamp={k.kamper[k.kamper.length - 1]} k={k} />}

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

      <Toppscorerkort k={k} />

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Troppen</h2>
          <span className="dempet liten">
            {k.spillere.length} / {MAKS_TROPP} · lønn {kortKroner(lonnPerDag(k))} per dag
          </span>
        </div>
        <ul className="spillerliste">
          {k.spillere.map((p) => {
            const plass = plasser.get(p.id)
            return (
            <li key={p.id} className={plass ? 'start' : ''}>
              <Styrke verdi={p.styrke} />
              <span className="spiller-navn">
                <strong>
                  <Posisjonsmerke p={p} /> {p.navn}
                </strong>
                <span className="dempet liten">
                  {p.alder} år · A {p.angrep} · F {p.forsvar} · verdi {kompakt(spillerverdi(p))}
                  {plass === undefined ? ' · innbytter' : plass !== p.posisjon ? ` · spiller ${POSISJONER[plass].navn.toLowerCase()}` : ''}
                  <Potensial p={p} />
                  <Sesongtall p={p} />
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
            )
          })}
        </ul>
        <p className="dempet liten">
          Formasjonen {k.formasjon}: den beste som er igjen tar hver plass. Utenfor sin posisjon teller en spiller 70 %, en utespiller i mål 40 %.
        </p>
      </div>

      <Akademikort s={s} k={k} />

      {(k.sesonger?.length ?? 0) > 0 && <Sesongkort k={k} />}

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
                <strong>
                  <Posisjonsmerke p={p} /> {p.navn}
                </strong>
                <span className="dempet liten">
                  {p.alder} år · A {p.angrep} · F {p.forsvar} · lønn {kompakt(spillerverdi(p) * LONN_ANDEL)}/dag
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

/**
 * Akademiet (Pakke 71): trinnet, juniorene som kommer hver sesong, og neste
 * utbygging. Det du bygger, teller i klubbverdien.
 */
function Akademikort({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  const trinn = AKADEMITRINN[k.akademi.trinn]
  const neste = nesteAkademi(k)
  const juniorer = k.spillere.filter((p) => potensialspenn(p))
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Akademiet</h2>
        <span className="dempet liten">{trinn.navn}</span>
      </div>
      <p className="dempet liten">
        {trinn.juniorer === 0
          ? 'Uten et akademi kommer ingen spillere opp nedenfra — alle må kjøpes på markedet.'
          : `Hver sesong kommer ${trinn.juniorer === 1 ? 'én junior' : `${trinn.juniorer} juniorer`} på 16–17 år opp i A-troppen, så lenge det er plass. De vokser raskt til de er ${JUNIOR_TIL}, mot et tak treneren bare aner.`}
      </p>
      {juniorer.length > 0 && (
        <p className="liten">
          Fra akademiet: {juniorer.map((p) => `${p.navn} (${p.alder})`).join(', ')}.
        </p>
      )}
      <ul className="stadionliste">
        <li>
          <span className="spiller-navn">
            <strong>{neste ? neste.navn : trinn.navn}</strong>
            <span className="dempet liten">
              {neste ? `${neste.juniorer} ${neste.juniorer === 1 ? 'junior' : 'juniorer'} per sesong, ${neste.nivaa[0]} til ${neste.nivaa[1]} mot divisjonens nivå` : 'Ferdig bygd'}
            </span>
          </span>
          {neste ? (
            <button className="knapp knapp-gull knapp-bud spiller-knapp" disabled={s.kontanter < neste.pris} onClick={() => utfor(byggAkademi(s), true)}>
              <span>Bygg</span>
              <strong>{kompakt(neste.pris)}</strong>
            </button>
          ) : (
            <span className="merke ok">Bygd</span>
          )}
        </li>
      </ul>
    </div>
  )
}

/**
 * Kamprapporten (Pakke 72) for den siste kampen: målene med minutt, scorer og
 * assist, banens beste og de elleves vurderinger. Gamle kamper uten rapport
 * viser bare resultatet i lista under.
 */
function Kamprapport({ kamp, k }: { kamp: Kamp; k: KlubbT }) {
  if (!kamp.maal || !kamp.vurderinger) return null
  const beste = kamp.vurderinger.find((v) => v.id === kamp.beste)
  const hjemmelag = kamp.hjemme ? k.navn : kamp.motstander
  const bortelag = kamp.hjemme ? kamp.motstander : k.navn
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Kamprapport</h2>
        <span className="dempet liten">
          runde {kamp.runde + 1} · {kamp.hjemme ? 'hjemme' : 'borte'}
        </span>
      </div>
      <p className="rapport-resultat">
        <strong>
          {hjemmelag} {kamp.hjemme ? kamp.maalFor : kamp.maalMot}–{kamp.hjemme ? kamp.maalMot : kamp.maalFor} {bortelag}
        </strong>
      </p>
      {kamp.maal.length > 0 ? (
        <ul className="rapport-maal">
          {kamp.maal.map((m, i) => (
            <li key={i} className={m.mot ? 'mot' : 'egne'}>
              <span className="rapport-minutt">{m.minutt}'</span>
              <span>
                {m.navn}
                {m.assist && <span className="dempet"> ({m.assist})</span>}
              </span>
              <span className="dempet liten">{m.mot ? kamp.motstander : k.navn}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dempet liten">Ingen mål. En kamp for de tålmodige.</p>
      )}
      {beste && (
        <p className="liten">
          Banens beste: <strong>{beste.navn}</strong> ({tall(beste.vurdering, 1)})
        </p>
      )}
      <ul className="rapport-vurderinger">
        {kamp.vurderinger.map((v) => (
          <li key={v.id} className={v.id === kamp.beste ? 'beste' : ''}>
            <span className="etikett">{POSISJONER[v.plass].kort}</span>
            <span>{v.navn}</span>
            <strong>{tall(v.vurdering, 1)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Divisjonens toppscorere denne sesongen — dine og motstandernes (Pakke 72). */
function Toppscorerkort({ k }: { k: KlubbT }) {
  const liste = toppscorere(k)
  if (liste.length === 0) return null
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Toppscorere</h2>
        <span className="dempet liten">{DIVISJONER[k.divisjon].navn} · sesong {k.sesong}</span>
      </div>
      <ol className="uka-di-liste">
        {liste.map((p, i) => (
          <li key={p.navn} className={p.deg ? 'deg' : ''}>
            <span className="uka-di-plass">{i + 1}.</span>
            <span>{p.navn}</span>
            <span>{p.maal} mål</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const UTFALL: Record<Sesongoppsummering['utfall'], string> = { opp: 'Opprykk', ned: 'Nedrykk', nektet: 'Nektet opprykk', samme: 'Samme divisjon' }

/** Sesongen som var, og de før (Pakke 72): plassering, prisene, pengene og hva som skjedde. */
function Sesongkort({ k }: { k: KlubbT }) {
  const [alle, settAlle] = useState(false)
  const sesonger = [...(k.sesonger ?? [])].reverse()
  const siste = sesonger[0]
  const netto = siste.billetter + siste.sponsor - siste.lonn
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Sesongen som var</h2>
        <span className="dempet liten">
          sesong {siste.sesong} · {DIVISJONER[siste.divisjon].navn}
        </span>
      </div>
      <div className="klubbtall">
        <div>
          <span className="etikett">Plass</span>
          <strong>
            {siste.plass} / {ANTALL_LAG}
          </strong>
        </div>
        <div>
          <span className="etikett">Poeng</span>
          <strong>{siste.poeng}</strong>
        </div>
        <div>
          <span className="etikett">Mål</span>
          <strong>
            {siste.maalFor}–{siste.maalMot}
          </strong>
        </div>
      </div>
      <dl className="oppgjor-tall sesong-tall">
        <div>
          <dt>Toppscorer</dt>
          <dd>{siste.toppscorer ? `${siste.toppscorer.navn} · ${siste.toppscorer.maal} mål` : '—'}</dd>
        </div>
        <div>
          <dt>Årets spiller</dt>
          <dd>{siste.aaretsSpiller ? `${siste.aaretsSpiller.navn} · snitt ${tall(siste.aaretsSpiller.snitt, 1)}` : '—'}</dd>
        </div>
        <div>
          <dt>Billetter og sponsor</dt>
          <dd className="pluss">{kortKroner(siste.billetter + siste.sponsor)}</dd>
        </div>
        <div>
          <dt>Lønn</dt>
          <dd className="minus">−{kortKroner(siste.lonn)}</dd>
        </div>
        <div>
          <dt>Netto</dt>
          <dd className={netto >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(netto)}</dd>
        </div>
      </dl>
      <p className="liten">
        <span className={`merke ${siste.utfall === 'opp' ? 'gull' : siste.utfall === 'ned' || siste.utfall === 'nektet' ? 'varsel' : 'info'}`}>{UTFALL[siste.utfall]}</span>{' '}
        {siste.trofe && `${siste.trofe}. `}
        {siste.neste < DIVISJONER.length - 1 && `${DIVISJONER[siste.neste + 1].navn} krever ${kravtekst(siste.neste + 1)}.`}
      </p>
      {sesonger.length > 1 && (
        <>
          {alle && (
            <ul className="sesongliste">
              {sesonger.slice(1).map((o) => (
                <li key={o.sesong}>
                  <span className="dempet liten">Sesong {o.sesong}</span>
                  <span>
                    {DIVISJONER[o.divisjon].navn} · nr. {o.plass}
                  </span>
                  <span className="dempet liten">{o.trofe ?? UTFALL[o.utfall]}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="knapp liten-knapp" onClick={() => settAlle(!alle)}>
            {alle ? 'Skjul tidligere sesonger' : `Vis ${sesonger.length - 1} tidligere ${sesonger.length === 2 ? 'sesong' : 'sesonger'}`}
          </button>
        </>
      )}
    </div>
  )
}

/** «3 mål · 1 assist · snitt 7,1» denne sesongen (Pakke 72). */
function Sesongtall({ p }: { p: Spiller }) {
  const st = p.sesong
  const snitt = snittvurdering(st)
  if (!st || snitt === null) return null
  return (
    <>
      {' · '}
      {st.maal} mål · {st.assist} assist · snitt {tall(snitt, 1)}
    </>
  )
}

/** K, F, M eller A foran navnet. */
function Posisjonsmerke({ p }: { p: Spiller }) {
  return (
    <span className="etikett spiller-pos" title={POSISJONER[p.posisjon].navn}>
      {POSISJONER[p.posisjon].kort}
    </span>
  )
}

/** «kan bli 55–69» for en junior fra akademiet. */
function Potensial({ p }: { p: Spiller }) {
  const spenn = potensialspenn(p)
  return spenn ? <> · kan bli {spenn[0]}–{spenn[1]}</> : null
}

function Kampoppsett({ k, profil, motstander, motStyrke, hjemme }: { k: KlubbT; profil: Lagprofil; motstander: string; motStyrke: number; hjemme: boolean }) {
  const [xh, xb] = hjemme ? forventetMaal(profil, motStyrke, k.taktikk, 'balansert') : forventetMaal(motStyrke, profil, 'balansert', k.taktikk)
  const [egne, mot] = hjemme ? [xh, xb] : [xb, xh]
  const ditt = `angrep ${tall(profil.angrep)} · forsvar ${tall(profil.forsvar)}`
  const deres = `styrke ${tall(motStyrke)}`
  return (
    <div className="kampoppsett">
      <div>
        <Klubbvaapen navn={hjemme ? k.navn : motstander} størrelse={40} />
        <strong>{hjemme ? k.navn : motstander}</strong>
        <span className="dempet liten">{hjemme ? ditt : deres}</span>
      </div>
      <span className="kamp-mot">mot</span>
      <div>
        <Klubbvaapen navn={hjemme ? motstander : k.navn} størrelse={40} />
        <strong>{hjemme ? motstander : k.navn}</strong>
        <span className="dempet liten">{hjemme ? deres : ditt}</span>
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
