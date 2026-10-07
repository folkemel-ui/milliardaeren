import { vedKorttrykk } from '../detaljvisning'
import {
  ansettelsespris,
  bedriftInntektPerSek,
  bedriftLonn,
  lederpris,
  maksAnsatte,
  forbedringspris,
  nesteForbedring,
  nesteMilepael,
  statusfaktor,
} from '../../engine/formler'
import { ansett, ansettLeder, kjopForbedring, oppgraderFlere, siOpp } from '../../engine/handlinger'
import { kjop, type Kjopsmengde } from '../kjopsmengde'
import {
  ANSATT_BONUS,
  ANSATTE_PER_NIVAA,
  BEDRIFTSTYPER,
  BORTE_TAK_SEK,
  MAKS_ANSATTE,
  MILEPAELER,
} from '../../engine/innhold'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utfor, utforMed } from '../../state/lager'
import { Koknapp, Koppknapp, useFlytetall, useHold } from './Hender'
import { kortKroner, perSek, tall, varighet } from '../format'
import { BedriftIkon } from './BedriftIkon'
import { usePuls } from './Tikk'
import { NyMerke } from './Kjopsglimt'
import { Ikon } from './Ikoner'

/** Hvor langt bedriften har kommet fra forrige milepæl mot neste (0–1). */
function milepaelFremdrift(nivaa: number, neste: number | null): number {
  if (neste === null) return 1
  const forrige = [...MILEPAELER].reverse().find((m) => m <= nivaa) ?? 0
  return (nivaa - forrige) / (neste - forrige)
}

export function Bedriftskort({ b, s, mengde, åpne }: { b: Bedrift; s: Spilltilstand; mengde: Kjopsmengde; åpne: () => void }) {
  const type = BEDRIFTSTYPER[b.type]
  const neste = nesteMilepael(b.nivaa)
  // En forbedring som er låst opp men ikke kjøpt, får egen knapp rett på kortet.
  const f = nesteForbedring(b)
  const klarForbedring = f && b.nivaa >= f.nivaa ? f : null
  // Hvert kjøp i bedriften gir en puls — gull når en milepæl nettopp er nådd.
  const puls = usePuls(b.nivaa + b.ansatte + b.forbedringer + (b.leder ? 1 : 0), MILEPAELER.includes(b.nivaa))
  const [flytetall, legg] = useFlytetall()

  return (
    <li className={`kort bedriftskort kan-aapnes ${puls}`} data-ny={b.type} onClick={vedKorttrykk(åpne)}>
      {flytetall}
      <div className="bedriftskort-topp">
        <BedriftIkon type={b.type} nivaa={b.nivaa} forbedringer={b.forbedringer} />
        <div className="bedriftskort-midt">
          <h2>
            {type.navn}
            <NyMerke id={b.type} />
            {b.leder && <span className="merke kant">Leder</span>}
          </h2>
          <span className="dempet">
            Nivå {b.nivaa}
            {b.ansatte > 0 && ` · ${b.ansatte} ansatte`}
            {(b.fusjoner ?? 0) > 0 && ` · ${b.fusjoner} ${b.fusjoner === 1 ? 'fusjon' : 'fusjoner'}`}
          </span>
        </div>
        <span className={`${bedriftInntektPerSek(b) >= 0 ? 'pluss' : 'minus'} inntekt ${puls}`}>{perSek(bedriftInntektPerSek(b) * statusfaktor(s))}</span>
      </div>

      <div className="milepael">
        <div className="milepael-spor">
          <div className="milepael-fyll" style={{ width: `${milepaelFremdrift(b.nivaa, neste) * 100}%` }} />
        </div>
        <span className="dempet liten">{neste ? `×2 inntekt ved nivå ${neste}` : 'Alle milepæler nådd'}</span>
      </div>

      <Koknapp s={s} b={b} legg={legg} />
      {b.type === 'saftbod' && <Koppknapp s={s} legg={legg} />}

      {klarForbedring && (
        <button
          className="forbedring-knapp"
          disabled={s.kontanter < forbedringspris(b, klarForbedring)}
          onClick={() => utfor(kjopForbedring(s, b.id))}
        >
          <span>
            <Ikon navn="gnist" størrelse={14} /> <strong>{klarForbedring.navn}</strong> · ×{tall(klarForbedring.faktor, 1)} inntekt
          </span>
          <span>{kortKroner(forbedringspris(b, klarForbedring))}</span>
        </button>
      )}

      <div className="bedriftskort-knapper">
        <Oppgraderingsknapp s={s} b={b} mengde={mengde} />
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
  const lonnHver = bedriftLonn({ ...b, ansatte: 1 })
  // Hva én ansatt til gir netto: ekstra inntekt minus lønnen. Kan være negativt.
  const nesteGir = (bedriftInntektPerSek({ ...b, ansatte: b.ansatte + 1 }) - bedriftInntektPerSek(b)) * statusfaktor(s)

  return (
    <div className="personale">
      <div className="personale-rad">
        <div>
          <h3>
            Ansatte <span className="dempet">{b.ansatte} / {maks}</span>
          </h3>
          <p className="dempet liten">
            Hver ansatt gir +{tall(ANSATT_BONUS * 100)} % inntekt og koster fast {perSek(lonnHver).slice(1)} i lønn.
            {fullt && maks < MAKS_ANSATTE && ` Ny plass på nivå ${nesteplass}.`}
          </p>
          {!fullt && (
            <p className={nesteGir >= 0 ? 'pluss liten' : 'minus liten'}>
              Én til gir {perSek(nesteGir)}
              {nesteGir < 0 && ' — lønnen er større enn det den ansatte tjener inn'}
            </p>
          )}
        </div>
        <div className="personale-knapper">
          <button
            className="knapp knapp-gull knapp-liten"
            disabled={fullt || s.kontanter < ansPris}
            onClick={() => utfor(ansett(s, b.id))}
          >
            {fullt ? 'Fullt' : `Ansett · ${kortKroner(ansPris)}`}
          </button>
          {b.ansatte > 0 && (
            <button className="knapp knapp-liten" onClick={() => utfor(siOpp(s, b.id))}>
              Si opp én
            </button>
          )}
        </div>
      </div>

      <div className="personale-rad">
        <div>
          <h3>Leder</h3>
          <p className="dempet liten">
            {b.leder
              ? `Driver bedriften mens du er borte, i opptil ${varighet(BORTE_TAK_SEK)}.`
              : `Uten leder står bedriften stille når spillet har vært lukket i mer enn ett minutt. En leder holder den i gang i opptil ${varighet(BORTE_TAK_SEK)}.`}
          </p>
        </div>
        {b.leder ? (
          <span className="merke ok">✓ Ansatt</span>
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

/**
 * Oppgraderingsknappen, for 1, 10, 100 eller så mange nivåer du har råd til.
 * Holder du den inne, fortsetter den å kjøpe — stadig raskere — til pengene tar slutt.
 */
export function Oppgraderingsknapp({ s, b, mengde, bred = false }: { s: Spilltilstand; b: Bedrift; mengde: Kjopsmengde; bred?: boolean }) {
  const { antall, pris } = kjop(b, mengde, s.kontanter)
  const hold = useHold(
    (første) =>
      utforMed((nå) => {
        const bn = nå.bedrifter.find((x) => x.id === b.id)
        if (!bn) return { ok: false, feil: 'Fant ikke bedriften.' }
        return oppgraderFlere(nå, b.id, kjop(bn, mengde, nå.kontanter).antall)
      }, !første) === null,
  )
  return (
    <button
      className={bred ? 'knapp knapp-gull bred hold-knapp' : 'knapp knapp-gull hold-knapp'}
      disabled={antall === 0 || s.kontanter < pris}
      {...hold}
    >
      {antall === 0 ? `Maks · trenger ${kortKroner(pris)}` : `→ nivå ${b.nivaa + antall} · ${kortKroner(pris)}`}
    </button>
  )
}
