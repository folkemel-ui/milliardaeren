import { kjopObligasjon, selgObligasjon } from '../../engine/handlinger'
import {
  kupongsats,
  markedsrente,
  OBLIGASJON_GEBYR,
  OBLIGASJONER,
  OBLIGASJONSLISTE,
  obligasjonskurs,
  obligasjonsverdiFor,
} from '../../engine/obligasjoner'
import { LANGSIKTIG_STYRINGSRENTE } from '../../engine/verden'
import type { ObligasjonId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, fortegnKroner, kortKroner, perSek, tall } from '../format'
import { Bekreftknapp } from './Bekreftknapp'

const prosent = (n: number, d = 2) => `${tall(n, d).replace(/,?0+$/, '')} %`

/** Statsobligasjonene i banken (Pakke 53): kjøp, hold og selg. */
export function Obligasjoner({ s }: { s: Spilltilstand }) {
  return (
    <>
      {OBLIGASJONSLISTE.map((id) => (
        <Obligasjonskort key={id} s={s} id={id} />
      ))}
    </>
  )
}

function Obligasjonskort({ s, id }: { s: Spilltilstand; id: ObligasjonId }) {
  const o = OBLIGASJONER[id]
  const post = s.obligasjoner?.[id]
  const rente = markedsrente(s, id)
  const verdi = obligasjonsverdiFor(s, id)
  const gevinst = post ? verdi - post.kostpris : 0
  const salg = verdi * (1 - OBLIGASJON_GEBYR)
  return (
    <div className="kort obligasjon">
      <div className="bank-rad">
        <div>
          <span className="etikett">{o.navn}</span>
          <span className="tall-stort">{post ? kortKroner(verdi) : '—'}</span>
        </div>
        <div className="bank-rente">
          <span className="etikett">
            Markedsrente {prosent(rente)} · kupong {prosent(kupongsats(id, rente) * 100)} per time
          </span>
          {post && <span className="pluss">{perSek((post.palydende * kupongsats(id, post.rente)) / 3600)}</span>}
        </div>
      </div>
      <p className="dempet liten">
        Kupongen låses til markedsrenten den dagen du kjøper: styringsrenten for resten av fasen, snittet over tid ({prosent(LANGSIKTIG_STYRINGSRENTE)})
        for resten av løpetiden. Stiger markedsrenten ett prosentpoeng, faller verdien rundt {tall(o.varighet)} % — og den stiger like mye når
        den faller.
      </p>
      {post && (
        <p className="liten">
          Låst til {prosent(post.rente, 1)} · kurs {tall(obligasjonskurs(s, id, post) * 100, 1)} ·{' '}
          <span className={gevinst >= 0 ? 'pluss' : 'minus'}>
            {fortegnKroner(gevinst)} ({endring(verdi / post.kostpris - 1)})
          </span>
        </p>
      )}
      <div className="spare-rad">
        <span className="etikett">Kjøp</span>
        <div className="andelsknapper">
          {[0.25, 0.5, 1].map((a) => {
            const belop = Math.floor(s.kontanter * a)
            return (
              <button key={a} className="knapp knapp-liten" disabled={belop < 1} onClick={() => utfor(kjopObligasjon(s, id, belop))}>
                {a === 1 ? 'Alt' : kortKroner(belop)}
              </button>
            )
          })}
        </div>
      </div>
      {post && (
        <div className="spare-rad">
          <span className="etikett">Selg</span>
          <Bekreftknapp
            className="knapp knapp-liten"
            varsel={`Du får ${kortKroner(salg)}, ${gevinst >= 0 ? 'en gevinst' : 'et tap'} på ${kortKroner(Math.abs(salg - post.kostpris))}.`}
            onJa={() => utfor(selgObligasjon(s, id, 1))}
          >
            Selg alt · {kortKroner(salg)}
          </Bekreftknapp>
        </div>
      )}
    </div>
  )
}
