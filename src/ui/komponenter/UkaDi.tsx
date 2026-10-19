import { DAG_SEK } from '../../engine/kalender'
import type { Aktivaklasse, Oppgjor } from '../../engine/types'
import { endring, kortKroner } from '../format'
import { Linjegraf } from './Linjegraf'

const KLASSENAVN: Record<Aktivaklasse, string> = {
  aksje: 'Aksjer',
  krypto: 'Krypto',
  fond: 'Fond',
  obligasjon: 'Obligasjoner',
  eiendom: 'Eiendom og jord',
  sparing: 'Sparekontoen',
  rival: 'Rivaler',
  startup: 'Startups',
}

/**
 * «Uka di» i søndagsavisa (Pakke 60): formuen gjennom uka, Forbes-lista den
 * søndagen, det du kjøpte og solgte, og ukas beste og verste investering.
 * Tallene ligger i ukeoppgjøret, så en gammel søndagsavis viser sin egen uke.
 */
export function UkaDi({ o }: { o: Oppgjor }) {
  const kurve = o.formuekurve ?? []
  const opp = kurve.length > 1 && kurve[kurve.length - 1] >= kurve[0]
  return (
    <div className="oppgjor uka-di">
      <h3 className="oppgjor-tittel">Uka di</h3>

      {kurve.length > 1 && (
        <Linjegraf
          punkter={kurve.map((verdi, i) => ({ sek: (o.fraDag + i) * DAG_SEK, verdi }))}
          format={kortKroner}
          farge={opp ? 'var(--pluss)' : 'var(--minus)'}
          etikett="Formuen din gjennom uka"
        />
      )}

      {o.forbes && o.forbes.length > 0 && (
        <>
          <h4 className="uka-di-tittel">Forbes-lista</h4>
          <ol className="uka-di-liste">
            {o.forbes.map((p) => (
              <li key={p.plass} className={p.deg ? 'deg' : ''}>
                <span className="uka-di-plass">{p.plass}.</span>
                <span>{p.deg ? 'Deg' : p.navn}</span>
                <span>{kortKroner(p.formue)}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {o.handel && o.handel.length > 0 && (
        <>
          <h4 className="uka-di-tittel">Kjøpt og solgt</h4>
          <dl className="oppgjor-tall">
            {o.handel.map((h) => (
              <div key={h.klasse}>
                <dt>{KLASSENAVN[h.klasse]}</dt>
                <dd>
                  {h.kjopt >= 1 && `kjøpt ${kortKroner(h.kjopt)}`}
                  {h.kjopt >= 1 && h.solgt >= 1 && ' · '}
                  {h.solgt >= 1 && `solgt ${kortKroner(h.solgt)}`}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {o.besteInvestering && (
        <p className="oppgjor-merknad">
          Ukas beste investering: <strong>{o.besteInvestering.navn}</strong> ({endring(o.besteInvestering.endring)})
          {o.versteInvestering && (
            <>
              . Ukas verste: <strong>{o.versteInvestering.navn}</strong> ({endring(o.versteInvestering.endring)})
            </>
          )}
          .
        </p>
      )}
      {/* Pakke 113: gårdene står her hver uke; avisa skriver om dem bare den beste og verste uka av åtte. */}
      {o.gardene && (
        <p className="oppgjor-merknad">
          Gårdene ga <strong>{kortKroner(o.gardene.host)}</strong> for {o.gardene.vaer.toLowerCase()}.
        </p>
      )}
      {/* Pakke 123: skogene — hogstene i uka, og storm og brann. */}
      {o.skogene && (
        <p className="oppgjor-merknad">
          {o.skogene.hogster > 0 ? (
            <>
              Skogene ga <strong>{kortKroner(o.skogene.tommer)}</strong> i tømmer fra {o.skogene.hogster} {o.skogene.hogster === 1 ? 'hogst' : 'hogster'}
            </>
          ) : (
            'Ingen hogst i skogene'
          )}
          {o.skogene.stormer + o.skogene.branner > 0 && `, og ${[o.skogene.stormer ? (o.skogene.stormer === 1 ? 'en storm' : `${o.skogene.stormer} stormer`) : '', o.skogene.branner ? (o.skogene.branner === 1 ? 'en brann' : `${o.skogene.branner} branner`) : ''].filter(Boolean).join(' og ')}`}
          .
        </p>
      )}
      {!o.besteInvestering && !o.handel?.length && (
        <p className="oppgjor-merknad">En stille uke: ingen handel, og ingenting du eide hele uka å sammenligne.</p>
      )}
    </div>
  )
}
