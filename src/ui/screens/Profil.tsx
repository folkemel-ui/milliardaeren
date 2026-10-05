import { useState, type ReactNode } from 'react'
import { nettoformue } from '../../engine/formler'
import { MAAL } from '../../engine/innhold'
import { PRESTASJONER } from '../../engine/prestasjoner'
import type { Spilltilstand } from '../../engine/types'
import { startPaaNytt } from '../../state/lager'
import { formue, kortKroner, kroner, perSek, tall, varighet } from '../format'
import { Formuegraf } from '../komponenter/Formuegraf'
import { RulleTall } from '../komponenter/RulleTall'
import { Regnskap } from '../komponenter/Regnskap'
import { Skattekort } from '../komponenter/Skattekort'
import { FlyttSpillet } from '../komponenter/FlyttSpillet'
import { Reservekopi } from '../komponenter/Reservekopi'
import { lesAvisvalg, settAvisvalg, type Avisvalg } from '../avisvalg'
import { lesTema, settTema, type Tema } from '../tema'
import { forbesliste } from '../../engine/rivaler'
import { Logo } from '../komponenter/Logo'
import { Ikon } from '../komponenter/Ikoner'
import { Merke } from '../komponenter/Merke'
import { PROFILDELER, settProfildel, useProfildel } from '../profilfane'
import { Statistikk } from '../komponenter/Statistikk'
import { kommendeMaal } from '../progresjon'
import { settBevegelse, settVarsler, useBevegelse, useVarselnivaa } from '../innstillinger'
import { VERSJON } from '../versjon'
import { Endringslogg } from '../komponenter/Nyheter'

function Trofeskap({ s }: { s: Spilltilstand }) {
  const trofeer = s.trofeer ?? []
  if (trofeer.length === 0) return null
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Trofeskapet</h2>
        <span className="dempet liten">{trofeer.length}</span>
      </div>
      <ul className="trofeer">
        {[...trofeer].reverse().map((t, i) => (
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
    </div>
  )
}

function Prestasjonsliste({ s }: { s: Spilltilstand }) {
  const klart = PRESTASJONER.filter((p) => s.prestasjoner[p.id] !== undefined).length
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">Prestasjoner</h2>
        <span className="dempet liten">
          {klart} / {PRESTASJONER.length}
        </span>
      </div>
      <ul className="prestasjoner">
        {PRESTASJONER.map((p) => {
          const når = s.prestasjoner[p.id]
          return (
            <li key={p.id} className={når === undefined ? 'prestasjon' : 'prestasjon klart'} title={p.beskrivelse}>
              <span className="prestasjon-emoji">
                <Merke id={p.id} klart={når !== undefined} størrelse={38} />
              </span>
              <span className="prestasjon-navn">{p.navn}</span>
              <span className="prestasjon-besk">{p.beskrivelse}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Rekordbok({ s }: { s: Spilltilstand }) {
  const r = s.rekorder
  const tilMillion = s.prestasjoner.millionaer
  const tilMilliard = s.prestasjoner.milliardaer
  const rader: [string, string][] = [
    ['Høyeste nettoformue', formue(s.hoyesteFormue)],
    ['Høyeste inntekt', perSek(r.hoyesteInntekt)],
    ['Største handel', r.storsteHandel > 0 ? kortKroner(r.storsteHandel) : '—'],
    ['Største gevinst på et salg', r.storsteGevinst > 0 ? kortKroner(r.storsteGevinst) : '—'],
    ['Tid til første million', tilMillion !== undefined ? varighet(tilMillion) : '—'],
    ['Tid til milliarden', tilMilliard !== undefined ? varighet(tilMilliard) : '—'],
    ['Utbytte totalt', kortKroner(s.totaltUtbytte)],
    ['Leie og avlinger totalt', kortKroner(s.totaltLeie)],
  ]
  return (
    <div className="kort">
      <h2 className="kort-tittel">Rekordboka</h2>
      <dl className="rekorder">
        {rader.map(([navn, verdi]) => (
          <div key={navn}>
            <dt>{navn}</dt>
            <dd>{verdi}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Fremdrift mot milliarden på logaritmisk skala: hvert nuller er like langt. */
function fremdrift(n: number): number {
  return Math.min(1, Math.max(0, Math.log10(Math.max(1, n)) / Math.log10(MAAL)))
}

/** De neste målene over den høyeste formuen din: hva som åpner, og milepælene. */
function KommendeMaal({ s }: { s: Spilltilstand }) {
  const liste = kommendeMaal(s)
  if (liste.length === 0) return <p className="dempet liten">Alt er låst opp, og alle milepælene er nådd.</p>
  return (
    <>
      <h3 className="etikett kommende-tittel">De neste målene</h3>
      <ul className="kommende-maal">
        {liste.map((g) => (
          <li key={g.belop}>
            <span>{g.maal.map((m) => m.tekst).join(' · ')}</span>
            <span>{kortKroner(g.belop)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

/** Ett valg i innstillingene: navn, knappene og en linje om hva det gjør. */
function Valg<T extends string>({ navn, verdi, valg, velg, forklaring }: { navn: string; verdi: T; valg: [T, ReactNode][]; velg: (v: T) => void; forklaring: string }) {
  return (
    <div className="innstilling">
      <h3 className="etikett">{navn}</h3>
      <div className="segment" role="radiogroup" aria-label={navn}>
        {valg.map(([v, tekst]) => (
          <button key={v} role="radio" aria-checked={verdi === v} className={verdi === v ? 'aktiv' : ''} onClick={() => velg(v)}>
            {tekst}
          </button>
        ))}
      </div>
      <p className="dempet liten">{forklaring}</p>
    </div>
  )
}

/**
 * Alle innstillingene samlet i ett kort: utseende, avisa, varsler og
 * bevegelse. De hører til nettleseren, ikke spillet.
 */
function Innstillingskort() {
  const [tema, settValgtTema] = useState<Tema>(lesTema)
  const [avis, settAvis] = useState<Avisvalg>(lesAvisvalg)
  const varsler = useVarselnivaa()
  const bevegelse = useBevegelse()
  return (
    <div className="kort innstillinger">
      <h2 className="kort-tittel">Innstillinger</h2>
      <Valg
        navn="Utseende"
        verdi={tema}
        valg={[
          ['mork', <><Ikon navn="mane" størrelse={15} /> Mørkt</>],
          ['lys', <><Ikon navn="sol" størrelse={15} /> Lyst</>],
        ]}
        velg={(v) => {
          settTema(v)
          settValgtTema(v)
        }}
        forklaring="Mørkt «luksus» eller lyst «ren finans». Avisa er alltid på papir."
      />
      <Valg
        navn="Avisa"
        verdi={avis}
        valg={[
          ['varsel', 'Varsel'],
          ['apne', 'Åpne selv'],
          ['av', 'Av'],
        ]}
        velg={(v) => {
          settAvisvalg(v)
          settAvis(v)
        }}
        forklaring="Hva som skjer når en ny utgave kommer, hver spilldag. Den røde prikken på «Avisa» er der uansett."
      />
      <Valg
        navn="Varsler"
        verdi={varsler}
        valg={[
          ['alle', 'Alle'],
          ['viktige', 'Viktige'],
          ['av', 'Av'],
        ]}
        velg={settVarsler}
        forklaring="Hendelser, prestasjoner og nye faner nederst på skjermen. «Viktige» viser bare det som har gått galt — og nye faner. Feil når du trykker, vises alltid."
      />
      <Valg
        navn="Bevegelse"
        verdi={bevegelse}
        valg={[
          ['system', 'Som systemet'],
          ['redusert', 'Redusert'],
        ]}
        velg={settBevegelse}
        forklaring="Redusert skrur av glidende faner, konfetti, rullende tall og tegninger som beveger seg — også om systemet ikke ber om det."
      />
    </div>
  )
}

/**
 * Profil i fire deler: Meg (formuen, målet og det du har oppnådd), Regnskap
 * (skatt og oppgjør), Statistikk (hvor inntekten kommer fra) og Innstillinger. Delen du sist hadde åpen, huskes.
 */
export function Profil({ s }: { s: Spilltilstand }) {
  const del = useProfildel()
  const ubetalt = s.skatt.regninger.length > 0
  return (
    <section className="skjerm">
      <div className="segment segment-fem" role="tablist" aria-label="Profil">
        {PROFILDELER.map((d) => (
          <button key={d.id} role="tab" aria-selected={del === d.id} className={del === d.id ? 'aktiv' : ''} onClick={() => settProfildel(d.id)}>
            {d.navn}
            {d.id === 'regnskap' && ubetalt && <span className="fane-prikk" aria-label="ubetalt skatt" />}
          </button>
        ))}
      </div>
      {del === 'meg' && <Meg s={s} />}
      {del === 'regnskap' && (
        <>
          <Skattekort s={s} />
          <Regnskap s={s} />
        </>
      )}
      {del === 'statistikk' && <Statistikk s={s} />}
      {del === 'innstillinger' && <Innstillinger />}
    </section>
  )
}

function Meg({ s }: { s: Spilltilstand }) {
  const verdi = nettoformue(s)
  const andel = fremdrift(verdi)
  return (
    <>
      <div className="kort profil-formue">
        <span className="etikett">Nettoformue</span>
        <span className="tall-kjempe gull">
          <RulleTall verdi={verdi} format={formue} />
        </span>
        <span className="dempet liten">
          Nr. {forbesliste(s, verdi).findIndex((p) => p.deg) + 1} på Forbes-lista
        </span>
        <Formuegraf punkter={s.historikk.punkter} naa={{ sek: s.sek, verdi }} />
      </div>

      <div className="kort">
        <div className="maal-topp">
          <span className="etikett">Mål: 1 milliard</span>
          <span className="dempet">{tall(andel * 100, 0)} %</span>
        </div>
        <div
          className="maal-spor"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(andel * 100)}
        >
          <div className="maal-fyll" style={{ width: `${andel * 100}%` }} />
        </div>
        <p className="dempet liten">Hvert nuller teller like mye: 1 000 → 10 000 er like langt som 100 mill → 1 mrd.</p>
        <KommendeMaal s={s} />
      </div>

      <dl className="kort statistikk">
        <div>
          <dt>Spilletid</dt>
          <dd>{varighet(s.sek)}</dd>
        </div>
        <div>
          <dt>Tjent totalt</dt>
          <dd>{kroner(s.totaltTjent)}</dd>
        </div>
        <div>
          <dt>Bedrifter</dt>
          <dd>{s.bedrifter.length}</dd>
        </div>
      </dl>

      <Trofeskap s={s} />
      <Prestasjonsliste s={s} />
      <Rekordbok s={s} />
    </>
  )
}

function Innstillinger() {
  const [bekreft, settBekreft] = useState(false)
  const [logg, settLogg] = useState(false)
  return (
    <>
      <Innstillingskort />

      <h2 className="seksjon-tittel">Lagringen</h2>
      <FlyttSpillet />
      <Reservekopi />

      <div className="kort">
        {bekreft ? (
          <div className="bekreft">
            <p>Starte på nytt med kr 1 000? Det forrige spillet tas vare på i en reservekopi.</p>
            <div className="knapperad">
              <button className="knapp" onClick={() => settBekreft(false)}>
                Avbryt
              </button>
              <button
                className="knapp knapp-fare"
                onClick={() => {
                  startPaaNytt()
                  settBekreft(false)
                }}
              >
                Start på nytt
              </button>
            </div>
          </div>
        ) : (
          <button className="knapp knapp-sekundær" onClick={() => settBekreft(true)}>
            Start på nytt …
          </button>
        )}
      </div>

      <footer className="profil-bunn">
        <Logo størrelse={36} undertekst="Fra 1 000 kr og en saftbod til milliardær" />
        <p className="dempet liten versjonslinje">
          Versjon {VERSJON} ·{' '}
          <button className="lenkeknapp" onClick={() => settLogg(true)}>
            Hva er nytt
          </button>
        </p>
      </footer>
      {logg && <Endringslogg lukk={() => settLogg(false)} />}
    </>
  )
}
