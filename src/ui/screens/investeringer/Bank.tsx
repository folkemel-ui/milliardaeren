/**
 * Bank: konjunkturen, sparekontoen, obligasjoner, lån og rente.
 * En del av Investeringer-fanen (Pakke 65 delte Investeringer.tsx per del).
 */

import { Bekreftknapp } from '../../komponenter/Bekreftknapp'
import { belaaningsgrad, maksNyttLaan, laanetak, rentePerSek, rentesats, fastrente, flytendeRente, sparerente, sparerentePerSek } from '../../../engine/formler'
import { laan, nedbetal, settInn, taUt, bindRente } from '../../../engine/handlinger'
import { BINDING_DAGER, FAST_PAASLAG, NORMAL_STYRINGSRENTE } from '../../../engine/verden'
import { Konjunkturkort } from '../../komponenter/Dagen'
import { Obligasjoner } from '../../komponenter/Obligasjoner'
import { datotekst } from '../../kalender'
import { dagnummer } from '../../../engine/kalender'
import { LAANETAK_TIMER, MAKS_BELAANING, MARGINKRAV, RENTE_PER_TIME } from '../../../engine/innhold'
import type { Spilltilstand } from '../../../engine/types'
import { utfor } from '../../../state/lager'
import { kortKroner, kroner, perSek, tall } from '../../format'
import { RulleTall } from '../../komponenter/RulleTall'
import { Forklaring } from '../../komponenter/Forklaring'

function Sparekonto({ s }: { s: Spilltilstand }) {
  const andeler = [0.25, 0.5, 1]
  return (
    <div className="kort sparekonto">
      <div className="bank-rad">
        <div>
          <span className="etikett">Sparekonto</span>
          <span className="tall-stort">
            <RulleTall verdi={s.sparing} format={kroner} />
          </span>
        </div>
        <div className="bank-rente">
          <span className="etikett">Rente {tall(sparerente(s) * 100, 2).replace(/,?0+$/, '')} % per time</span>
          <span className={s.sparing > 0 ? 'pluss' : 'dempet'}>{perSek(sparerentePerSek(s))}</span>
        </div>
      </div>
      <p className="dempet liten">
        Risikofritt: renten legges til hvert sekund, også mens du er borte. Opptjent så langt: {kroner(s.totaltSparerente)}.
      </p>
      <div className="spare-rad">
        <span className="etikett">Sett inn</span>
        <div className="andelsknapper">
          {andeler.map((a) => {
            const belop = a === 1 ? s.kontanter : Math.floor(s.kontanter * a)
            return (
              <button key={a} className="knapp knapp-liten" disabled={belop < 1} onClick={() => utfor(settInn(s, belop))}>
                {a === 1 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="spare-rad">
        <span className="etikett">Ta ut</span>
        <div className="andelsknapper">
          {andeler.map((a) => {
            const belop = a === 1 ? s.sparing : Math.floor(s.sparing * a)
            return (
              <button key={a} className="knapp knapp-liten" disabled={belop < 1} onClick={() => utfor(taUt(s, belop))}>
                {a === 1 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Bank({ s }: { s: Spilltilstand }) {
  const grad = belaaningsgrad(s)
  const tilgjengelig = maksNyttLaan(s)
  const kanBetale = Math.min(s.gjeld, s.kontanter)
  const fare = grad > MARGINKRAV * 0.9 ? 'kritisk' : grad > MAKS_BELAANING ? 'advarsel' : ''

  const fast = fastrente(s)
  return (
    <>
      <Konjunkturkort s={s} />
      <Sparekonto s={s} />
      <h2 className="seksjon-tittel">
        Obligasjoner <Forklaring tema="obligasjoner" />
      </h2>
      <Obligasjoner s={s} />
      <h2 className="seksjon-tittel">
        Gjeld og lån <Forklaring tema="laan" />
      </h2>
      <div className="kort bank">
        <div className="bank-rad">
          <div>
            <span className="etikett">Gjeld</span>
            <span className="tall-stort">
              <RulleTall verdi={s.gjeld} format={kroner} />
            </span>
          </div>
          <div className="bank-rente">
            <span className="etikett">
              {fast === null ? 'Flytende' : 'Fast'} rente {tall(rentesats(s) * 100, 2).replace(/,?0+$/, '')} % per time
            </span>
            <span className={s.gjeld > 0 ? 'minus' : 'dempet'}>{perSek(-rentePerSek(s))}</span>
          </div>
        </div>
        <div>
          <div className="maal-topp">
            <span className="etikett">Belåningsgrad</span>
            <strong className={fare}>{tall(Math.min(grad, 9.99) * 100)} %</strong>
          </div>
          <div className="belaaning-spor">
            <div className={`belaaning-fyll ${fare}`} style={{ width: `${Math.min(1, grad) * 100}%` }} />
            <span className="belaaning-strek" style={{ left: `${MAKS_BELAANING * 100}%` }} />
            <span className="belaaning-strek fare" style={{ left: `${MARGINKRAV * 100}%` }} />
          </div>
          <p className="dempet liten">
            Du kan låne til gjelden er {tall(MAKS_BELAANING * 100)} % av alt du eier, og høyst {tall(LAANETAK_TIMER)} timer av
            inntekten din — nå {kortKroner(laanetak(s))}. Over {tall(MARGINKRAV * 100)} %
            selger banken investeringene dine — og holder ikke det, tar den over bedrifter.
          </p>
        </div>
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Rente</h2>
          <span className={`merke${fast === null ? '' : ' kant'}`}>{fast === null ? 'Flytende' : 'Fast'}</span>
        </div>
        {fast === null ? (
          <>
            <p className="dempet liten">
              Den flytende renten følger styringsrenten. Binder du, får du dagens rente pluss {tall(FAST_PAASLAG, 1)} prosentpoeng, låst i{' '}
              {BINDING_DAGER} dager — da kan du ikke gå tilbake før tiden er ute.
            </p>
            <Bekreftknapp
              className="knapp knapp-gull knapp-liten"
              ja="Ja, bind renten"
              varsel={`Låst til ${datotekst(dagnummer(s.sek) + BINDING_DAGER).toLowerCase()}.`}
              onJa={() => utfor(bindRente(s))}
            >
              Bind renten · {tall(((flytendeRente(s) + (RENTE_PER_TIME * FAST_PAASLAG) / NORMAL_STYRINGSRENTE) * 100), 2).replace(/,?0+$/, '')} % per time
            </Bekreftknapp>
          </>
        ) : (
          <p className="dempet liten">
            Renten er bundet til {datotekst(s.rentebinding!.tilDag).toLowerCase()}. Så går den over til flytende igjen, og du kan binde på nytt.
          </p>
        )}
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Lån</h2>
          <span className="dempet liten">Tilgjengelig {kortKroner(tilgjengelig)}</span>
        </div>
        <div className="andelsknapper">
          {[0.25, 0.5, 1].map((andel) => {
            const belop = Math.floor(tilgjengelig * andel)
            return (
              <button key={andel} className="knapp knapp-liten" disabled={belop <= 0} onClick={() => utfor(laan(s, belop))}>
                {kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="kort">
        <div className="maal-topp">
          <h2 className="kort-tittel">Nedbetal</h2>
          <span className="dempet liten">Kontanter {kortKroner(s.kontanter)}</span>
        </div>
        <div className="andelsknapper">
          {[0.25, 0.5, 1].map((andel) => {
            const belop = andel === 1 ? kanBetale : Math.floor(kanBetale * andel)
            return (
              <button key={andel} className="knapp knapp-liten" disabled={belop <= 0} onClick={() => utfor(nedbetal(s, belop))}>
                {andel === 1 && kanBetale >= s.gjeld && s.gjeld > 0 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>

    </>
  )
}
