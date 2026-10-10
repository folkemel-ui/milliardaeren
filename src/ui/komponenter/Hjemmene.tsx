import { innred } from '../../engine/handlinger'
import { HJEM, HJEMLISTE, hjemAapent, hjemkostnad, hjemstatus, INNREDNING_VERDI, nesteTrinn, ROM, romtrinn, type HjemId } from '../../engine/hjemmene'
import type { Ting } from '../detaljvisning'
import { trykkApner } from '../detaljvisning'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall } from '../format'
import { hjemTall, romkodeFor } from '../romkode'
import { Apneknapp } from './BedriftIkon'
import { Hjembilde, Hjemscene } from './Hjemscene'
import { Ikon } from './Ikoner'
import { Delhode } from './Seksjon'

/**
 * Hjemmene (Pakke 60): tre steder du bor, og rommene du innreder i dem. Hvert
 * trinn gir status; halvparten av det du har brukt, teller i formuen. Fra G16
 * har hvert hjem en scene der rommene står slik de er innredet; et trykk på
 * kortet åpner den store scenen på en egen side.
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
      <ul className="kortliste">
        {HJEMLISTE.map((h) => (
          <Hjemkort key={h} s={s} id={h} />
        ))}
      </ul>
    </>
  )
}

/**
 * Kortet for ett hjem: bildet av hjemmet slik det er innredet nå, og rommene med
 * knappene for neste trinn. På detaljsiden (`iDetalj`) står den store scenen i
 * stedet for flisa.
 */
export function Hjemkort({ s, id, iDetalj = false }: { s: Spilltilstand; id: HjemId; iDetalj?: boolean }) {
  const h = HJEM[id]
  const åpent = hjemAapent(s, id)
  const kode = romkodeFor(s, id)
  const { trinn, alle } = hjemTall(s, id)
  const ting: Ting = { slag: 'hjem', id }
  const kanApnes = åpent && !iDetalj
  return (
    <li className={`kort bedriftskort hjemkort${kanApnes ? ' kan-aapnes' : ''}`} onClick={kanApnes ? trykkApner(ting) : undefined}>
      {iDetalj && <Hjemscene id={id} rom={kode} />}
      <div className="bedriftskort-topp">
        {!iDetalj &&
          (åpent ? (
            <Apneknapp ting={ting} navn={h.navn}>
              <Hjembilde id={id} rom={kode} stor />
            </Apneknapp>
          ) : (
            <Hjembilde id={id} rom={kode} stor dempet />
          ))}
        <div className="bedriftskort-midt">
          <h2>{h.navn}</h2>
          <span className="dempet">{h.sted}</span>
        </div>
        {åpent && (
          <div className="eiendom-tall">
            <span className="gull">
              {trinn}/{alle}
            </span>
            <span className="dempet liten">trinn</span>
          </div>
        )}
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
    </li>
  )
}
