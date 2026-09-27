import { EIENDOM_SYNLIG_VED, EIENDOMSSTIGEN, EIENDOMSTYPER, eiendomspris, eiendomsverdi, leiePerSek, MEGLERHONORAR, statusnivaa } from '../../engine/eiendom'
import { eiendomSynlig, kjopEiendom, selgEiendom } from '../../engine/handlinger'
import type { EiendomId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, kortKroner, perSek, tall } from '../format'
import { Minigraf } from '../komponenter/Linjegraf'

export function Eiendom({ s }: { s: Spilltilstand }) {
  const synlige = EIENDOMSSTIGEN.filter((id) => eiendomSynlig(s, id))
  const nesteSkjult = EIENDOMSSTIGEN.find((id) => !eiendomSynlig(s, id))
  const indeks = s.marked.eiendom
  const indeksEndring = indeks.historikk.length ? indeks.kurs / indeks.historikk[0] - 1 : 0

  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Eiendom</h1>

      <div className="kort eiendom-sammendrag">
        <div className="bank-rad">
          <div>
            <span className="etikett">Eiendommene dine</span>
            <span className="tall-stort">{kortKroner(eiendomsverdi(s))}</span>
          </div>
          <div className="bank-rente">
            <span className="etikett">Leie</span>
            <span className="pluss">{perSek(leiePerSek(s))}</span>
          </div>
        </div>
        <div className="indeks">
          <div>
            <span className="etikett">Eiendomsprisene</span>
            <span className={indeksEndring >= 0 ? 'pluss liten' : 'minus liten'}>{endring(indeksEndring)} siste 2 t</span>
          </div>
          <Minigraf verdier={[...indeks.historikk, indeks.kurs]} />
        </div>
        <p className="dempet liten">Leien kommer også mens du er borte — eiendom trenger ingen leder.</p>
      </div>

      <ul className="kortliste">
        {synlige.map((id) => (
          <Eiendomskort key={id} s={s} id={id} />
        ))}
        {nesteSkjult && (
          <li className="kort kjopskort laast">
            <div className="bedrift-ikon dempet-ikon" aria-hidden="true">
              <span className="bedrift-emoji">{EIENDOMSTYPER[nesteSkjult].emoji}</span>
            </div>
            <div className="bedriftskort-midt">
              <h2>{EIENDOMSTYPER[nesteSkjult].navn}</h2>
              <span className="dempet liten">
                Til salgs når nettoformuen har vært {kortKroner(EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)}
              </span>
              <div className="milepael-spor">
                <div
                  className="milepael-fyll"
                  style={{ width: `${Math.min(1, s.hoyesteFormue / (EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)) * 100}%` }}
                />
              </div>
            </div>
          </li>
        )}
      </ul>
    </section>
  )
}

function Eiendomskort({ s, id }: { s: Spilltilstand; id: EiendomId }) {
  const t = EIENDOMSTYPER[id]
  const eier = s.eiendommer[id] ?? 0
  const pris = eiendomspris(s, id)
  const leieHver = (pris * t.avkastning) / 3600
  const fullt = eier >= t.maksAntall
  const manglerStatus = statusnivaa(s) < t.statuskrav

  return (
    <li className="kort bedriftskort">
      <div className="bedriftskort-topp">
        <div className="bedrift-ikon" aria-hidden="true">
          <span className="bedrift-emoji">{t.emoji}</span>
        </div>
        <div className="bedriftskort-midt">
          <h2>{t.navn}</h2>
          <span className="dempet">{t.sted}</span>
        </div>
        <div className="eiendom-tall">
          <span className="pluss">{perSek(leieHver)}</span>
          <span className="dempet liten">
            {eier} / {t.maksAntall} eid
          </span>
        </div>
      </div>
      <p className="dempet liten">
        Avkastning {tall(t.avkastning * 100)} % per time
        {t.statuskrav > 0 && ` · krever statusnivå ${t.statuskrav}`}
      </p>
      <div className={eier > 0 ? 'eiendom-knapper' : 'eiendom-knapper en'}>
        <button
          className="knapp knapp-gull"
          disabled={fullt || manglerStatus || s.kontanter < pris}
          onClick={() => utfor(kjopEiendom(s, id))}
        >
          {fullt ? 'Alle kjøpt' : manglerStatus ? `Krever status ${t.statuskrav}` : `Kjøp · ${kortKroner(pris)}`}
        </button>
        {eier > 0 && (
          <button className="knapp" onClick={() => utfor(selgEiendom(s, id))}>
            Selg · {kortKroner(pris * (1 - MEGLERHONORAR))}
          </button>
        )}
      </div>
    </li>
  )
}
