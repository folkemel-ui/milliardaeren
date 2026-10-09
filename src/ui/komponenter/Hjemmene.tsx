import { innred } from '../../engine/handlinger'
import { HJEM, HJEMLISTE, hjemAapent, hjemkostnad, hjemstatus, INNREDNING_VERDI, nesteTrinn, ROM, romtrinn, type HjemId } from '../../engine/hjemmene'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { Ikon } from './Ikoner'
import { Delhode } from './Seksjon'

/**
 * Hjemmene (Pakke 60): tre steder du bor, og rommene du innreder i dem. Hvert
 * trinn gir status; halvparten av det du har brukt, teller i formuen.
 */
export function Hjemmene({ s }: { s: Spilltilstand }) {
  const ferdige = Object.values(s.hjem ?? {}).reduce((sum, n) => sum + (n ?? 0), 0)
  const alle = HJEMLISTE.reduce((sum, h) => sum + HJEM[h].rom.reduce((n, r) => n + ROM[r].trinn.length, 0), 0)
  return (
    <>
      <Delhode tittel="Hjemmene" sammendrag={`${ferdige} av ${alle} trinn`} />
      <p className="dempet liten">
        Husene har du; innredningen kjøper du, rom for rom. Hvert trinn gir status, og {tall(INNREDNING_VERDI * 100)} % av det du har brukt teller i formuen
        {hjemkostnad(s) > 0 && ` (${kortKroner(hjemkostnad(s) * INNREDNING_VERDI)} nå, ${tall(hjemstatus(s))} statuspoeng)`}. Et rom kan ikke selges for seg.
      </p>
      {HJEMLISTE.map((h) => (
        <Hjemkort key={h} s={s} id={h} />
      ))}
    </>
  )
}

function Hjemkort({ s, id }: { s: Spilltilstand; id: HjemId }) {
  const h = HJEM[id]
  const åpent = hjemAapent(s, id)
  return (
    <div className="kort">
      <div className="maal-topp">
        <h2 className="kort-tittel">
          <Ikon navn="hus" størrelse={16} /> {h.navn}
        </h2>
        <span className="dempet liten">{h.sted}</span>
      </div>
      {!åpent ? (
        <p className="dempet liten laast-merke">
          <Ikon navn="las" størrelse={12} /> Blir ditt når formuen din når {kortKroner(h.apnerVed)}.
        </p>
      ) : (
        <ul className="forbedringer">
          {h.rom.map((rom) => {
            const r = ROM[rom]
            const n = romtrinn(s, rom)
            const neste = nesteTrinn(s, rom)
            return (
              <li key={rom} className={neste ? '' : 'kjøpt'}>
                <div>
                  <strong>
                    {r.navn}{' '}
                    <span className="gull" aria-label={`${n} av ${r.trinn.length} trinn`}>
                      {'●'.repeat(n)}
                      {'○'.repeat(r.trinn.length - n)}
                    </span>
                  </strong>
                  <p className="dempet liten">
                    {n > 0 ? r.trinn[n - 1].navn : 'Ikke innredet'}
                    {neste && ` · neste: ${neste.navn.toLowerCase()}, +${neste.status} status`}
                  </p>
                </div>
                {neste ? (
                  <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < neste.pris} onClick={() => utfor(innred(s, rom))}>
                    {kortKroner(neste.pris)}
                  </button>
                ) : (
                  <span className="merke ok">✓ Ferdig</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
