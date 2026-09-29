import { useState } from 'react'
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
            <span aria-hidden="true">🏆</span>
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
              <span className="prestasjon-emoji" aria-hidden="true">
                {når === undefined ? '🔒' : p.emoji}
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

function Utseende() {
  const [tema, settValgt] = useState<Tema>(lesTema)
  const [avis, settAvis] = useState<Avisvalg>(lesAvisvalg)
  const velg = (t: Tema) => {
    settTema(t)
    settValgt(t)
  }
  return (
    <div className="kort utseende">
      <h2 className="kort-tittel">Utseende</h2>
      <div className="segment">
        <button className={tema === 'mork' ? 'aktiv' : ''} onClick={() => velg('mork')}>
          🌙 Mørkt
        </button>
        <button className={tema === 'lys' ? 'aktiv' : ''} onClick={() => velg('lys')}>
          ☀️ Lyst
        </button>
      </div>
      <h2 className="kort-tittel">Avisen</h2>
      <div className="segment">
        {(
          [
            ['varsel', 'Varsel'],
            ['apne', 'Åpne selv'],
            ['av', 'Av'],
          ] as [Avisvalg, string][]
        ).map(([v, navn]) => (
          <button
            key={v}
            className={avis === v ? 'aktiv' : ''}
            onClick={() => {
              settAvisvalg(v)
              settAvis(v)
            }}
          >
            {navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">Hva som skjer når en ny utgave kommer, hver spilldag. Den røde prikken på «Avisen» er der uansett.</p>
    </div>
  )
}

export function Profil({ s }: { s: Spilltilstand }) {
  const [bekreft, settBekreft] = useState(false)
  const verdi = nettoformue(s)
  const andel = fremdrift(verdi)

  return (
    <section className="skjerm">
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

      <Skattekort s={s} />
      <Regnskap s={s} />
      <Trofeskap s={s} />
      <Prestasjonsliste s={s} />
      <Rekordbok s={s} />
      <Utseende />
      <FlyttSpillet />
      <Reservekopi />

      <div className="kort">
        {bekreft ? (
          <div className="bekreft">
            <p>Starte på nytt med 1 000 kr? Det forrige spillet tas vare på i en reservekopi.</p>
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
    </section>
  )
}
