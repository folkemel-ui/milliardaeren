import { useState } from 'react'
import { Bekreftknapp } from '../komponenter/Bekreftknapp'
import { byggAkademi, byggStadion, kjopKlubb, kjopSpiller, selgKlubb, selgSpiller, settFormasjon, settTaktikk } from '../../engine/handlinger'
import {
  AKADEMITRINN,
  ANTALL_LAG,
  CUPDAGER,
  CUPRUNDER,
  EUROPADAGER,
  EUROPARUNDER,
  naaddTekst,
  nesteUtslagskamp,
  tvpenger,
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
import type { Kamp, Klubb as KlubbT, Posisjon, Sesongoppsummering, Spiller, Spilltilstand, Taktikk, Turnering, Utslag } from '../../engine/types'
import { utfor } from '../../state/lager'
import { fortegnKroner, kompakt, kortKroner, tall, varighet } from '../format'
import { Ikon } from '../komponenter/Ikoner'
import { Klubbvaapen } from '../komponenter/Klubbvaapen'
import { Stadion } from '../komponenter/Stadion'
import { Forklaring } from '../komponenter/Forklaring'
import { aapneKlubbside, KLUBBSIDER, type Klubbside as Side } from '../klubbsider'
import { useVoksUt } from '../overgang'

/**
 * Klubb-delen i Luksus (Pakke 62): klubben din rett i delen — et nav med
 * sider bak (Pakke 77). Uten klubb er den til salgs — eller låst til formuen
 * har vært høy nok.
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
/** En cupkamp avgjort på straffer: videre er en seier, ute et tap. */
const UTFALL_KAMP = (m: Kamp) => (m.straffer ? (m.straffer === 'deg' ? 'S' : 'T') : RESULTAT(m))
/** Serie og turnering kan ha samme runde samme sesong. */
const kampnokkel = (m: Kamp) => `${m.sesong}-${m.turnering ?? 'serie'}-${m.runde}`

/** «Cupen, hjemme mot X» eller «Hjemme mot X». */
function kampnavn(m: Kamp): string {
  const sted = `${m.hjemme ? 'hjemme' : 'borte'} mot ${m.motstander}`
  if (!m.turnering) return sted[0].toUpperCase() + sted.slice(1)
  return `${m.turnering === 'cup' ? 'Cupen' : 'Europa'}, ${sted}`
}

/** Nettoen i år: billetter, sponsor, TV og premier minus lønn. */
const nettoIAar = (k: KlubbT) => k.billetter + k.sponsor + (k.tv ?? 0) + (k.premier ?? 0) - k.lonn

/**
 * Klubben som et nav (Pakke 77). Før var alt på én side på sju skjermer, i
 * den rekkefølgen pakkene ble bygd. Nå står det du gjør hver runde øverst —
 * neste kamp med formasjon og taktikk — så formen, din bit av tabellen og fire
 * rader til sidene med resten (Pakke 66s regel: en del som har vokst ut av
 * plassen sin, får detaljsider med tilbake). Ingenting er tatt bort.
 */
function Klubbside({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  const neste = nesteKamp(k)
  const profil = lagprofil(k)
  return (
    <>
      <Klubbtopp s={s} k={k} profil={profil} />

      {neste && (
        <div className="kort nestekamp">
          <h2 className="kort-tittel">Neste kamp · om {varighet(tidTilNesteRunde(s))}</h2>
          <Kampoppsett k={k} profil={profil} motstander={neste.motstander.navn} motStyrke={neste.motstander.styrke} hjemme={neste.hjemme} />
          <Turneringslinjer k={k} />
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

      {k.kamper.length > 0 && <Formkort k={k} />}
      <Minitabell k={k} />
      <Siderader k={k} />
    </>
  )
}

/**
 * Toppen av klubben (Pakke 77): stadion som en stripe ved siden av våpenet og
 * navnet, og de tre tallene under. Et trykk på stadion åpner anlegget.
 */
function Klubbtopp({ s, k, profil }: { s: Spilltilstand; k: KlubbT; profil: Lagprofil }) {
  return (
    <div className="kort klubbtopp">
      <div className="klubbtopp-rad">
        <button className="klubbtopp-stadion" onClick={() => aapneKlubbside('anlegg')} aria-label="Stadion: åpne Anlegg og økonomi">
          <Stadion divisjon={k.divisjon} navn={k.navn} />
        </button>
        <div className="klubbtopp-navn">
          <Klubbvaapen navn={k.navn} størrelse={36} />
          <div>
            <h2 className="klubbtopp-tittel">
              {k.navn} <Forklaring tema="klubb" />
            </h2>
            <span className="dempet liten">
              {DIVISJONER[k.divisjon].navn} · sesong {k.sesong}
            </span>
            <span className="dempet liten">verdi {kortKroner(klubbverdi(s))}</span>
          </div>
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
  )
}

/** Cupen og Europa som én linje hver i neste kamp, når du er med (Pakke 77). */
function Turneringslinjer({ k }: { k: KlubbT }) {
  const linjer: { turnering: Turnering; tekst: string }[] = []
  for (const turnering of ['cup', 'europa'] as const) {
    const u = k[turnering]
    if (!u || u.ute) continue
    const runder = turnering === 'cup' ? CUPRUNDER : EUROPARUNDER
    const dag = (turnering === 'cup' ? CUPDAGER : EUROPADAGER)[u.runde]
    if (dag === undefined || u.runde >= runder.length) continue
    const mot = nesteUtslagskamp(u)
    const naar = dag === k.runde + 1 ? 'samme dag' : `dag ${dag}`
    if (mot) linjer.push({ turnering, tekst: `${runder[u.runde]} mot ${mot.navn} (${tall(mot.styrke)}), ${naar}` })
    else if (turnering === 'cup' && u.runde === 0) linjer.push({ turnering, tekst: 'Seedet, står over første runde' })
  }
  if (linjer.length === 0) return null
  return (
    <ul className="turneringslinjer">
      {linjer.map((l) => (
        <li key={l.turnering} className="liten">
          <span className="etikett">{l.turnering === 'cup' ? 'Cupen' : 'Europa'}</span> {l.tekst}
        </li>
      ))}
    </ul>
  )
}

/** De fem siste kampene som S/U/T, eldst først, og den siste i én linje (Pakke 77). */
function Formkort({ k }: { k: KlubbT }) {
  const siste = k.kamper.slice(-5)
  const m = siste[siste.length - 1]
  const beste = m.vurderinger?.find((v) => v.id === m.beste)
  return (
    <div className="kort formkort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Formen</h2>
        <button className="kort-lenke" onClick={() => aapneKlubbside('kamper')}>
          Kamprapport <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="formrekke" aria-label="De siste kampene, eldst først">
        {siste.map((x) => (
          <span key={kampnokkel(x)} className={`brikke resultat r${UTFALL_KAMP(x)}`}>
            {UTFALL_KAMP(x)}
          </span>
        ))}
      </div>
      <p className="liten">
        {kampnavn(m)} <strong>{m.maalFor}–{m.maalMot}</strong>
        {beste && (
          <span className="dempet">
            {' '}
            · banens beste {beste.navn} ({tall(beste.vurdering, 1)})
          </span>
        )}
      </p>
    </div>
  )
}

/** Tabellen, hele eller en bit av den. `rader` er lagenes indekser i tabellrekkefølge, `start` plassen til den første. */
function Tabell({ k, rader, start }: { k: KlubbT; rader: number[]; start: number }) {
  const opp = rykkerOpp(k)
  const ned = rykkerNed(k)
  return (
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
        {rader.map((i, n) => {
          const l = k.lag[i]
          const sone = opp.includes(i) ? 'opp' : ned.includes(i) && k.divisjon > 0 ? 'ned' : ''
          return (
            <tr key={l.navn} className={`${i === 0 ? 'deg' : ''} ${sone}`}>
              <td>{start + n + 1}</td>
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
  )
}

/** Fem rader av tabellen med deg i midten — øverst og nederst så nær som det går (Pakke 77). */
function Minitabell({ k }: { k: KlubbT }) {
  const rekke = tabell(k)
  const din = rekke.indexOf(0)
  const fra = Math.max(0, Math.min(din - 2, rekke.length - MINITABELL))
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Tabell</h2>
        <button className="kort-lenke" onClick={() => aapneKlubbside('kamper')}>
          Hele tabellen <span aria-hidden="true">›</span>
        </button>
      </div>
      <Tabell k={k} rader={rekke.slice(fra, fra + MINITABELL)} start={fra} />
    </div>
  )
}

export const MINITABELL = 5

/** Radene til klubbens sider, hver med én linje som sier hva som er der (Pakke 77). */
function Siderader({ k }: { k: KlubbT }) {
  const scorer = toppscorere(k, 1)[0]
  const over = k.divisjon < DIVISJONER.length - 1 ? k.divisjon + 1 : null
  const mangler = over !== null && !oppfyllerKrav(k, over)
  const forrige = k.sesonger?.[k.sesonger.length - 1]
  const under: Record<Side, string | null> = {
    tropp: `${k.spillere.length} / ${MAKS_TROPP} spillere · ${k.marked.length} på markedet`,
    kamper: `${plassering(k)}. plass${scorer ? ` · toppscorer ${scorer.navn}, ${scorer.maal} mål` : ''}`,
    anlegg: `${STADIONTRINN[k.stadion.trinn].navn} · netto i år ${fortegnKroner(nettoIAar(k))}`,
    sesonger: forrige ? `Forrige: ${forrige.plass}. plass, ${UTFALL[forrige.utfall].toLowerCase()}` : null,
  }
  return (
    <nav className="kort klubbsider" aria-label="Klubbens sider">
      {KLUBBSIDER.filter((d) => under[d.id] !== null).map((d) => (
        <button key={d.id} className="klubbside-rad" onClick={() => aapneKlubbside(d.id)}>
          <span className="klubbside-tekst">
            <strong>{d.navn}</strong>
            <span className="dempet liten">{under[d.id]}</span>
          </span>
          {d.id === 'anlegg' && mangler && <span className="merke varsel">Mangler</span>}
          <span className="gull" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </nav>
  )
}

/**
 * En av klubbens sider (Pakke 77), med tilbake til Klubb øverst. Siden står i
 * stedet for hele Luksus-skjermen, som tingsidene, og vokser ut av raden.
 */
export function Klubbdetalj({ s, k, side, tilbake }: { s: Spilltilstand; k: KlubbT; side: Side; tilbake: () => void }) {
  const voks = useVoksUt<HTMLElement>()
  return (
    <section className={`skjerm detalj klubbdetalj side-${side}`} ref={voks}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Klubb
      </button>
      <h1 className="skjerm-tittel">{KLUBBSIDER.find((d) => d.id === side)!.navn}</h1>
      {side === 'tropp' && (
        <>
          <Troppkort s={s} k={k} />
          <Akademikort k={k} />
          <Markedkort s={s} k={k} />
        </>
      )}
      {side === 'kamper' && (
        <>
          {k.kamper.length > 0 && <Kamprapport kamp={k.kamper[k.kamper.length - 1]} k={k} />}
          {k.cup && <Turneringskort k={k} u={k.cup} turnering="cup" />}
          {k.europa && <Turneringskort k={k} u={k.europa} turnering="europa" />}
          {k.kamper.length > 0 && <Kampliste k={k} />}
          <Tabellkort k={k} />
          <Toppscorerkort k={k} />
        </>
      )}
      {side === 'anlegg' && (
        <>
          <Stadionkort k={k} />
          <Byggkort s={s} k={k} />
          <Regnskapskort k={k} />
          <Salgskort s={s} />
        </>
      )}
      {side === 'sesonger' && (k.sesonger?.length ?? 0) > 0 && <Sesongkort k={k} />}
    </section>
  )
}

function Kampliste({ k }: { k: KlubbT }) {
  return (
    <div className="kort">
      <h2 className="kort-tittel">Siste kamper</h2>
      <ul className="kampliste">
        {[...k.kamper].reverse().slice(0, 5).map((m) => (
          <li key={kampnokkel(m)}>
            <span className={`brikke resultat r${UTFALL_KAMP(m)}`}>{UTFALL_KAMP(m)}</span>
            <span className="spiller-navn">
              <span>
                {m.hjemme ? 'Hjemme mot' : 'Borte mot'} {m.motstander}
              </span>
              <span className="dempet liten">
                {m.turnering && `${m.turnering === 'cup' ? 'Cupen' : 'Europa'}, ${(m.turnering === 'cup' ? CUPRUNDER : EUROPARUNDER)[m.runde]?.toLowerCase()}${m.straffer ? `, straffer (${m.straffer === 'deg' ? 'videre' : 'ute'})` : ''}`}
                {m.turnering && m.tilskuere !== undefined && ' · '}
                {m.tilskuere !== undefined && `${tall(m.tilskuere)} tilskuere`}
              </span>
            </span>
            <strong>
              {m.maalFor}–{m.maalMot}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tabellkort({ k }: { k: KlubbT }) {
  const sperret = k.divisjon < DIVISJONER.length - 1 && !oppfyllerKrav(k, k.divisjon + 1)
  const nye = k.lag.filter((l) => l.fra !== undefined)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Tabell</h2>
      <Tabell k={k} rader={tabell(k)} start={0} />
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
  )
}

function Troppkort({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  // Hvem som starter neste kamp, og på hvilken plass (Pakke 71).
  const plasser = new Map<number, Posisjon>()
  for (const { plass, spiller } of startellever(k)) if (spiller) plasser.set(spiller.id, plass)
  return (
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
              <Bekreftknapp className="knapp knapp-bud spiller-knapp" ja="Ja" disabled={k.spillere.length <= MIN_TROPP} onJa={() => utfor(selgSpiller(s, p.id))}>
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
  )
}

function Markedkort({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  return (
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
  )
}

/** Årets tall for klubben — regnskapet, nederst i Anlegg og økonomi (Pakke 77). */
function Regnskapskort({ k }: { k: KlubbT }) {
  const netto = nettoIAar(k)
  return (
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
        <dt>TV-penger i år</dt>
        <dd className="pluss">{kortKroner(k.tv ?? 0)}</dd>
      </div>
      <div>
        <dt>Premier i år</dt>
        <dd className="pluss">{kortKroner(k.premier ?? 0)}</dd>
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
  )
}

/** Salget du gjør én gang, bak en bekreftelse og borte fra knappene du bruker hver dag. */
function Salgskort({ s }: { s: Spilltilstand }) {
  const [bekreft, settBekreft] = useState(false)
  const pris = klubbverdi(s) * (1 - KLUBBSALG_HONORAR)
  return (
    <div className="kort">
      {bekreft ? (
        <div className="rival-knapper">
          <button
            className="knapp knapp-fare"
            onClick={() => {
              if (utfor(selgKlubb(s)) === null) aapneKlubbside(null)
            }}
          >
            Ja, selg for {kortKroner(pris)}
          </button>
          <button className="knapp" onClick={() => settBekreft(false)}>
            Avbryt
          </button>
        </div>
      ) : (
        <button className="knapp bred" onClick={() => settBekreft(true)}>
          Selg klubben · {kortKroner(pris)}
        </button>
      )}
      <p className="dempet liten">Megler og advokater tar {tall(KLUBBSALG_HONORAR * 100)} %. Trofeene beholder du.</p>
    </div>
  )
}

const UTBYGGINGER: { del: Stadiondel; effekt: (k: KlubbT) => string }[] = [
  { del: 'tribune', effekt: () => 'Plass til flere når laget går godt eller rykker opp' },
  { del: 'flomlys', effekt: () => `Kveldskamper: ${tall((FLOMLYS.publikum - 1) * 100)} % flere vil komme` },
  { del: 'vip', effekt: (k) => `Sponsoren betaler ${tall((VIP.sponsor - 1) * 100)} % mer fra neste sesong — ${kortKroner(sponsorbelop({ ...k, stadion: { ...k.stadion, vip: true } }) - sponsorbelop(k))} i ${DIVISJONER[k.divisjon].navn}` },
]

/**
 * Stadion (Pakke 66): plassene, publikummet og billettprisen. Det du kan
 * bygge, står i Bygg-kortet under (Pakke 77).
 */
function Stadionkort({ k }: { k: KlubbT }) {
  const div = DIVISJONER[k.divisjon]
  const forventet = tilskuere(k, form(k))
  return (
    <div className="kort">
      <Stadion divisjon={k.divisjon} navn={k.navn} />
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
    </div>
  )
}

/**
 * Ett sted å bygge (Pakke 77): de tre stadionutbyggingene og akademiet i én
 * liste med pris og effekt, og lisenskravet over, så du ser hva som er neste.
 * Det du bygger, teller i klubbverdien.
 */
function Byggkort({ s, k }: { s: Spilltilstand; k: KlubbT }) {
  const over = k.divisjon < DIVISJONER.length - 1 ? k.divisjon + 1 : null
  const holder = over === null || oppfyllerKrav(k, over)
  const akademi = nesteAkademi(k)
  const rader: { id: string; navn: string; effekt: string; pris: number | null; bygg: () => void }[] = UTBYGGINGER.map(({ del, effekt }) => {
    const neste = nesteUtbygging(k, del)
    const ferdig = del === 'tribune' ? STADIONTRINN[k.stadion.trinn].navn : del === 'flomlys' ? 'Flomlys' : 'VIP-losje'
    return {
      id: del,
      navn: neste ? (neste.plasser ? `${neste.navn} · ${tall(neste.plasser)} plasser` : neste.navn) : ferdig,
      effekt: neste ? effekt(k) : 'Ferdig bygd',
      pris: neste ? neste.pris : null,
      bygg: () => utfor(byggStadion(s, del), true),
    }
  })
  rader.push({
    id: 'akademi',
    navn: akademi ? akademi.navn : AKADEMITRINN[k.akademi.trinn].navn,
    effekt: akademi ? `${akademi.juniorer} ${akademi.juniorer === 1 ? 'junior' : 'juniorer'} per sesong, ${akademi.nivaa[0]} til ${akademi.nivaa[1]} mot divisjonens nivå` : 'Ferdig bygd',
    pris: akademi ? akademi.pris : null,
    bygg: () => utfor(byggAkademi(s), true),
  })
  const igjen = rader.filter((r) => r.pris !== null).length
  return (
    <div className="kort byggkort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Bygg</h2>
        <span className="dempet liten">{igjen === 0 ? 'Alt er bygd' : `${igjen} av ${rader.length} igjen`}</span>
      </div>
      {over !== null && (
        <p className="liten stadionkrav">
          <span className={`merke ${holder ? 'ok' : 'varsel'}`}>{holder ? 'Holder' : 'Mangler'}</span> {DIVISJONER[over].navn} krever {kravtekst(over)}.
        </p>
      )}
      <ul className="stadionliste">
        {rader.map((r) => (
          <li key={r.id}>
            <span className="spiller-navn">
              <strong>{r.navn}</strong>
              <span className="dempet liten">{r.effekt}</span>
            </span>
            {r.pris !== null ? (
              <button className="knapp knapp-gull knapp-bud spiller-knapp" disabled={s.kontanter < r.pris} onClick={r.bygg}>
                <span>Bygg</span>
                <strong>{kompakt(r.pris)}</strong>
              </button>
            ) : (
              <span className="merke ok">Bygd</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const fortegn = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/**
 * Akademiet (Pakke 71): trinnet og juniorene som kommer hver sesong. Det
 * står ved troppen; utbyggingen står i Bygg-kortet (Pakke 77).
 */
function Akademikort({ k }: { k: KlubbT }) {
  const trinn = AKADEMITRINN[k.akademi.trinn]
  const juniorer = k.spillere.filter((p) => potensialspenn(p))
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Akademiet</h2>
        <span className="dempet liten">{trinn.navn}</span>
      </div>
      <p className="dempet liten">
        {trinn.juniorer === 0
          ? 'Uten et akademi kommer ingen spillere opp nedenfra — alle må kjøpes på markedet. Akademiet bygges under Anlegg og økonomi.'
          : `Hver sesong kommer ${trinn.juniorer === 1 ? 'én junior' : `${trinn.juniorer} juniorer`} på 16–17 år opp i A-troppen, så lenge det er plass. De vokser raskt til de er ${JUNIOR_TIL}, mot et tak treneren bare aner.`}
      </p>
      {juniorer.length > 0 && (
        <p className="liten">
          Fra akademiet: {juniorer.map((p) => `${p.navn} (${p.alder})`).join(', ')}.
        </p>
      )}
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

/** Så mange toppscorere kortet viser før «Vis alle» (Pakke 77). */
export const TOPPSCORERE_KORT = 3

/**
 * Divisjonens toppscorere denne sesongen — dine og motstandernes (Pakke 72).
 * Står ved tabellen; tre navn, og resten et trykk unna (Pakke 77).
 */
function Toppscorerkort({ k }: { k: KlubbT }) {
  const [alle, settAlle] = useState(false)
  const hele = toppscorere(k, 10)
  const liste = alle ? hele : hele.slice(0, TOPPSCORERE_KORT)
  if (hele.length === 0) return null
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
      {hele.length > TOPPSCORERE_KORT && (
        <button className="knapp liten-knapp" onClick={() => settAlle(!alle)}>
          {alle ? 'Vis de tre beste' : `Vis alle ${hele.length}`}
        </button>
      )}
    </div>
  )
}

const UTFALL: Record<Sesongoppsummering['utfall'], string> = { opp: 'Opprykk', ned: 'Nedrykk', nektet: 'Nektet opprykk', samme: 'Samme divisjon' }

/**
 * Sesongen som var, og de før (Pakke 72): plassering, prisene, pengene og hva
 * som skjedde. På sin egen side: den siste i sin helhet, de før som rader (Pakke 77).
 */
function Sesongkort({ k }: { k: KlubbT }) {
  const sesonger = [...(k.sesonger ?? [])].reverse()
  const siste = sesonger[0]
  const netto = siste.billetter + siste.sponsor + (siste.tv ?? 0) + (siste.premier ?? 0) - siste.lonn
  return (
    <>
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
        {(siste.tv ?? 0) + (siste.premier ?? 0) > 0 && (
          <div>
            <dt>TV-penger og premier</dt>
            <dd className="pluss">{kortKroner((siste.tv ?? 0) + (siste.premier ?? 0))}</dd>
          </div>
        )}
        <div>
          <dt>Netto</dt>
          <dd className={netto >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(netto)}</dd>
        </div>
        {siste.cup && (
          <div>
            <dt>Cupen</dt>
            <dd>{siste.cup}</dd>
          </div>
        )}
        {siste.europa && (
          <div>
            <dt>Europa</dt>
            <dd>{siste.europa}</dd>
          </div>
        )}
      </dl>
      <p className="liten">
        <span className={`merke ${siste.utfall === 'opp' ? 'gull' : siste.utfall === 'ned' || siste.utfall === 'nektet' ? 'varsel' : 'info'}`}>{UTFALL[siste.utfall]}</span>{' '}
        {siste.trofe && `${siste.trofe}. `}
        {siste.neste < DIVISJONER.length - 1 && `${DIVISJONER[siste.neste + 1].navn} krever ${kravtekst(siste.neste + 1)}.`}
      </p>
    </div>
    {sesonger.length > 1 && (
      <div className="kort">
        <h2 className="kort-tittel">Tidligere sesonger</h2>
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
      </div>
    )}
    </>
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

/**
 * Cupen og Europa (Pakke 73): hvor langt du er, neste motstander og når, og
 * kampene du har spilt i turneringen i år.
 */
function Turneringskort({ k, u, turnering }: { k: KlubbT; u: Utslag; turnering: Turnering }) {
  const runder = turnering === 'cup' ? CUPRUNDER : EUROPARUNDER
  const dager = turnering === 'cup' ? CUPDAGER : EUROPADAGER
  const neste = nesteUtslagskamp(u)
  const mester = !u.ute && u.lag.length === 1 && !!u.lag[0].deg
  const dag = dager[u.runde]
  const spilt = k.kamper.filter((m) => m.turnering === turnering && m.sesong === u.sesong)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">{turnering === 'cup' ? 'Cupen' : 'Europa'}</h2>
        <span className="dempet liten">{mester ? naaddTekst(u, turnering) : u.ute ? `Ute i ${runder[Math.min(u.naadd, runder.length - 1)].toLowerCase()}` : `${runder[u.runde]} · dag ${dag} av ${RUNDER_PER_SESONG}`}</span>
      </div>
      {mester ? (
        <p className="liten">
          <span className="merke gull">{naaddTekst(u, turnering)}</span> Pokalen står i skapet
          {turnering === 'cup' && ' — og kr 40 mill i kassa'}.
        </p>
      ) : u.ute ? (
        <p className="dempet liten">
          {turnering === 'cup' ? 'Cupen er over for i år. Ny trekning neste sesong.' : 'Europa-eventyret er over for denne gang. Et nytt seriegull gir en ny sjanse.'}
        </p>
      ) : neste ? (
        <p className="liten">
          {runder[u.runde]} mot <strong>{neste.navn}</strong> (styrke {tall(neste.styrke)}) på dag {dag}.
          {turnering === 'cup' && u.runde === 0 ? ' De fjorten beste står over første runde.' : ''}
        </p>
      ) : (
        <p className="liten">
          {turnering === 'cup' && u.runde === 0 ? 'Laget er seedet og står over første runde.' : `${runder[u.runde]} på dag ${dag}.`}
        </p>
      )}
      {spilt.length > 0 && (
        <ul className="kampliste">
          {spilt.map((m) => (
            <li key={m.runde}>
              <span className={`brikke resultat r${m.straffer ? (m.straffer === 'deg' ? 'S' : 'T') : RESULTAT(m)}`}>{m.straffer ? (m.straffer === 'deg' ? 'S' : 'T') : RESULTAT(m)}</span>
              <span className="spiller-navn">
                <span>
                  {runder[m.runde]} {m.hjemme ? 'hjemme mot' : 'borte mot'} {m.motstander}
                </span>
                {m.straffer && <span className="dempet liten">Avgjort på straffer</span>}
              </span>
              <strong>
                {m.maalFor}–{m.maalMot}
              </strong>
            </li>
          ))}
        </ul>
      )}
      <p className="dempet liten">
        {turnering === 'cup'
          ? `Alle femti lagene er med. Hver runde du vinner, gir ${kortKroner(Math.round(tvpenger(k) * 0.02))}; cupmesteren får kr 40 mill og et trofé.`
          : 'Åtte lag, tre runder: kr 10, 20 og 40 mill for hver runde du vinner, og et trofé som gir mer status enn de andre.'}
      </p>
    </div>
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
