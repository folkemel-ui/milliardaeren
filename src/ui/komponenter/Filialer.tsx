import { bedriftInntektPerSek, dagensFaktor, statusfaktor } from '../../engine/formler'
import { erHjemme, filialbidrag, filialer, filialFraNivaa, filialpris, FILIALANDEL, HJEMME_BONUS, hjemby, ledigeFilialbyer, MAKS_FILIALER } from '../../engine/filialer'
import { synergifaktor } from '../../engine/synergi'
import { aapneFilial } from '../../engine/handlinger'
import { BEDRIFTSTYPER } from '../../engine/innhold'
import { dagnummer } from '../../engine/kalender'
import { REGIONER, regionFor } from '../../engine/regioner'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall } from '../format'
import { tilbakeTekst } from '../inntjening'
import { kortDato } from '../kalender'
import { Ikon } from './Ikoner'

const pst = (andel: number) => `+${tall(andel * 100)} %`

/**
 * Filialene (Pakke 59): de bedriften har, og byene den kan åpne i. Hver filial
 * gir en andel av bedriftens inntekt — mest den første, mest i hjemregionen.
 */
export function Filialkort({ s, b }: { s: Spilltilstand; b: Bedrift }) {
  const navn = BEDRIFTSTYPER[b.type].navn
  const mine = filialer(b)
  const nr = mine.length
  const pris = filialpris(b)
  const fra = filialFraNivaa(b.type)
  // Inntekten før lønn i dag, med statusbonusen: det en filial tar en andel av.
  const brutto = (bedriftInntektPerSek(b, dagensFaktor(s, b.type) * synergifaktor(s, b)) - bedriftInntektPerSek(b, 0)) * statusfaktor(s)
  // Regionen, når den heter noe annet enn byen: «Trøndelag», men ikke «Bergen · Bergen».
  const sted = (by: (typeof mine)[number]['by']) => (erHjemme(b.type, by) ? 'Hjemregionen · ' : REGIONER[regionFor(by)!].navn !== by ? `${REGIONER[regionFor(by)!].navn} · ` : '')

  return (
    <div className="kort">
      <h2 className="kort-tittel">Filialer</h2>
      <p className="dempet liten">
        Fra nivå {fra} kan du åpne {navn.toLowerCase()} i opptil {MAKS_FILIALER} byer, én i hver. Den første gir {pst(FILIALANDEL[0])} av inntekten, den andre {pst(FILIALANDEL[1])} og den
        tredje {pst(FILIALANDEL[2])} — og {pst(HJEMME_BONUS - 1)} mer i bransjens hjemby, {hjemby(b.type)}. Regionens økonomi drar litt opp eller ned. Prisen
        står fast per bransje, og går inn i bedriftens verdi.
      </p>
      <ul className="forbedringer">
        {mine.map((f, i) => (
          <li key={f.by} className="kjøpt">
            <div>
              <strong>
                {f.by} <span className="gull">{pst(filialbidrag(s, b.type, f.by, i))}</span>
              </strong>
              <p className="dempet liten">
                {sted(f.by)}åpnet {kortDato(dagnummer(f.aapnetSek))}
              </p>
            </div>
            <span className="merke ok">✓ Åpen</span>
          </li>
        ))}
        {pris !== null &&
          ledigeFilialbyer(b).map((by) => {
            const bidrag = filialbidrag(s, b.type, by, nr)
            return (
              <li key={by}>
                <div>
                  <strong>
                    {by} <span className="gull">{pst(bidrag)}</span>
                  </strong>
                  <p className="dempet liten">
                    {sted(by)}gir {perSek(brutto * bidrag)} i dag · {tilbakeTekst(pris, brutto * bidrag).toLowerCase()}
                  </p>
                </div>
                <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(aapneFilial(s, b.id, by))}>
                  Åpne · {kortKroner(pris)}
                </button>
              </li>
            )
          })}
      </ul>
      {nr >= MAKS_FILIALER && <p className="dempet liten">{navn} har filialer i {MAKS_FILIALER} byer — så mange den kan få.</p>}
      {nr < MAKS_FILIALER && b.nivaa < fra && (
        <p className="dempet liten laast-merke">
          <Ikon navn="las" størrelse={12} /> Filialer åpner ved nivå {fra} — {fra - b.nivaa} nivåer igjen.
        </p>
      )}
    </div>
  )
}
