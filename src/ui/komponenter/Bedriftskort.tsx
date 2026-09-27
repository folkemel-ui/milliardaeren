import {
  ansettelsespris,
  bedriftInntektPerSek,
  lederpris,
  maksAnsatte,
  forbedringspris,
  nesteForbedring,
  nesteMilepael,
  oppgraderingspris,
  statusfaktor,
} from '../../engine/formler'
import { ansett, ansettLeder, kjopForbedring, oppgrader } from '../../engine/handlinger'
import {
  ANSATT_BONUS,
  ANSATT_LONN,
  ANSATTE_PER_NIVAA,
  BEDRIFTSTYPER,
  BORTE_TAK_SEK,
  MAKS_ANSATTE,
  MILEPAELER,
} from '../../engine/innhold'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall, varighet } from '../format'
import { BedriftIkon } from './BedriftIkon'

/** Hvor langt bedriften har kommet fra forrige milepæl mot neste (0–1). */
function milepaelFremdrift(nivaa: number, neste: number | null): number {
  if (neste === null) return 1
  const forrige = [...MILEPAELER].reverse().find((m) => m <= nivaa) ?? 0
  return (nivaa - forrige) / (neste - forrige)
}

export function Bedriftskort({ b, s, åpne }: { b: Bedrift; s: Spilltilstand; åpne: () => void }) {
  const type = BEDRIFTSTYPER[b.type]
  const pris = oppgraderingspris(b)
  const neste = nesteMilepael(b.nivaa)
  // En forbedring som er låst opp men ikke kjøpt, får egen knapp rett på kortet.
  const f = nesteForbedring(b)
  const klarForbedring = f && b.nivaa >= f.nivaa ? f : null

  return (
    <li className="kort bedriftskort">
      <div className="bedriftskort-topp">
        <BedriftIkon type={b.type} />
        <div className="bedriftskort-midt">
          <h2>
            {type.navn}
            {b.leder && <span className="merke-leder">Leder</span>}
          </h2>
          <span className="dempet">
            Nivå {b.nivaa}
            {b.ansatte > 0 && ` · ${b.ansatte} ansatte`}
          </span>
        </div>
        <span className="pluss">{perSek(bedriftInntektPerSek(b) * statusfaktor(s))}</span>
      </div>

      <div className="milepael">
        <div className="milepael-spor">
          <div className="milepael-fyll" style={{ width: `${milepaelFremdrift(b.nivaa, neste) * 100}%` }} />
        </div>
        <span className="dempet liten">{neste ? `×2 inntekt ved nivå ${neste}` : 'Alle milepæler nådd'}</span>
      </div>

      {klarForbedring && (
        <button
          className="forbedring-knapp"
          disabled={s.kontanter < forbedringspris(b, klarForbedring)}
          onClick={() => utfor(kjopForbedring(s, b.id))}
        >
          <span>
            ✨ <strong>{klarForbedring.navn}</strong> · ×{tall(klarForbedring.faktor, 1)} inntekt
          </span>
          <span>{kortKroner(forbedringspris(b, klarForbedring))}</span>
        </button>
      )}

      <div className="bedriftskort-knapper">
        <button className="knapp knapp-gull" disabled={s.kontanter < pris} onClick={() => utfor(oppgrader(s, b.id))}>
          Oppgrader · {kortKroner(pris)}
        </button>
        <button className="knapp knapp-ikon" aria-label={`Detaljer for ${type.navn}`} onClick={åpne}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9,6 15,12 9,18" />
          </svg>
        </button>
      </div>
    </li>
  )
}

/** Ansatte og leder — vises på bedriftens detaljside. */
export function Personale({ b, s }: { b: Bedrift; s: Spilltilstand }) {
  const maks = maksAnsatte(b)
  const fullt = b.ansatte >= maks
  const ansPris = ansettelsespris(b)
  const ledPris = lederpris(b.type)
  const nesteplass = (Math.floor(b.nivaa / ANSATTE_PER_NIVAA) + 1) * ANSATTE_PER_NIVAA

  return (
    <div className="personale">
      <div className="personale-rad">
        <div>
          <h3>
            Ansatte <span className="dempet">{b.ansatte} / {maks}</span>
          </h3>
          <p className="dempet liten">
            Hver ansatt gir +{tall(ANSATT_BONUS * 100)} % inntekt og koster {tall(ANSATT_LONN * 100)} % i lønn.
            {fullt && maks < MAKS_ANSATTE && ` Ny plass på nivå ${nesteplass}.`}
          </p>
        </div>
        <button
          className="knapp knapp-gull knapp-liten"
          disabled={fullt || s.kontanter < ansPris}
          onClick={() => utfor(ansett(s, b.id))}
        >
          {fullt ? 'Fullt' : `Ansett · ${kortKroner(ansPris)}`}
        </button>
      </div>

      <div className="personale-rad">
        <div>
          <h3>Leder</h3>
          <p className="dempet liten">
            {b.leder
              ? `Driver bedriften mens du er borte, i opptil ${varighet(BORTE_TAK_SEK)}.`
              : `Uten leder står bedriften stille når appen er lukket. En leder holder den i gang i opptil ${varighet(BORTE_TAK_SEK)}.`}
          </p>
        </div>
        {b.leder ? (
          <span className="merke-ok">✓ Ansatt</span>
        ) : (
          <button
            className="knapp knapp-gull knapp-liten"
            disabled={s.kontanter < ledPris}
            onClick={() => utfor(ansettLeder(s, b.id))}
          >
            Ansett · {kortKroner(ledPris)}
          </button>
        )}
      </div>
    </div>
  )
}
