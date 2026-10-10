import { vedKorttrykk } from '../detaljvisning'
import {
  ansettelsespris,
  bedriftInntektIDag,
  bedriftInntektPerSek,
  dagensFaktor,
  lonnFor,
  lederpris,
  maksAnsatte,
  forbedringspris,
  nesteForbedring,
  nesteMilepael,
  statusfaktor,
} from '../../engine/formler'
import { ansett, ansettLeder, kjopForbedring, oppgraderFlere, siOpp, velgRetning } from '../../engine/handlinger'
import { GRADER, GRADLISTE, kanVelgeRetning, medNyAnsatt, RETNING_NIVAA, RETNINGER, RETNINGSLISTE, retningsstatus, stab } from '../../engine/ansatte'
import { Bekreftknapp } from './Bekreftknapp'
import { dagsbilde, grunner } from '../../engine/verden'
import { nyhetsfaktor } from '../../engine/bransjer'
import { kjop, type Kjopsmengde } from '../kjopsmengde'
import {
  ANSATTE_PER_NIVAA,
  BEDRIFTSTYPER,
  BORTE_TAK_SEK,
  MAKS_ANSATTE,
  MILEPAELER,
} from '../../engine/innhold'
import type { Bedrift, Retning, Spilltilstand } from '../../engine/types'
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
            {b.retning && <span className="merke kant">{RETNINGER[b.retning].navn}</span>}
            {kanVelgeRetning(b) && <span className="retningsprikk" role="img" aria-label="Venter på retning" title="Venter på retning" />}
          </h2>
          <span className="dempet">
            Nivå {b.nivaa}
            {b.ansatte > 0 && ` · ${b.ansatte} ansatte`}
            {(b.fusjoner ?? 0) > 0 && ` · ${b.fusjoner} ${b.fusjoner === 1 ? 'fusjon' : 'fusjoner'}`}
          </span>
        </div>
        <span className={`${bedriftInntektIDag(s, b) >= 0 ? 'pluss' : 'minus'} inntekt ${puls}`}>{perSek(bedriftInntektIDag(s, b))}</span>
      </div>

      <IDag s={s} b={b} />

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

/**
 * Dagens kalender for én bedrift (Pakke 49): «+30 % i dag · Helg». Vises bare
 * når dagen gjør en forskjell på mer enn et par prosent.
 */
export function IDag({ s, b }: { s: Spilltilstand; b: Bedrift }) {
  const d = dagsbilde(s)
  const nyhet = nyhetsfaktor(s, b.type)
  const f = d.faktor[b.type] * nyhet
  if (Math.abs(f - 1) < 0.02) return null
  const hvorfor = grunner(d, b.type, s.sek)
  if (nyhet !== 1) hvorfor.unshift(nyhet > 1 ? 'God nyhet' : 'Dårlig nyhet')
  return (
    <span className={`i-dag liten ${f > 1 ? 'pluss' : 'minus'}`}>
      {f > 1 ? '+' : '−'}
      {tall(Math.abs(f - 1) * 100)} % i dag{hvorfor.length > 0 && <span className="dempet"> · {hvorfor.join(', ')}</span>}
    </span>
  )
}

/** Ansatte og leder — vises på bedriftens detaljside. */
export function Personale({ b, s }: { b: Bedrift; s: Spilltilstand }) {
  const maks = maksAnsatte(b)
  const fullt = b.ansatte >= maks
  const ledPris = lederpris(b.type)
  const nesteplass = (Math.floor(b.nivaa / ANSATTE_PER_NIVAA) + 1) * ANSATTE_PER_NIVAA
  const folk = stab(b)

  return (
    <div className="personale">
      <div>
        <h3 className="personale-tittel">
          Ansatte <span className="dempet">{b.ansatte} / {maks}</span>
        </h3>
        <p className="dempet liten">
          Lønnen er fast, uansett nivå: i en liten bedrift koster en ansatt mer enn den gir.
          {fullt && maks < MAKS_ANSATTE && ` Ny plass på nivå ${nesteplass}.`}
        </p>
      </div>

      {folk.length > 0 && (
        <ul className="stab" aria-label="De ansatte">
          {folk.map((a, i) => (
            <li key={`${a.navn}-${i}`} className="stab-rad">
              <span className="stab-navn">
                {a.navn}
                <span className={`merke${a.grad === 'stjerne' ? ' gull' : a.grad === 'erfaren' ? ' kant' : ''}`}>{GRADER[a.grad].navn}</span>
              </span>
              <span className="dempet liten stab-tall">
                +{tall(GRADER[a.grad].bonus * 100)} % · {perSek(lonnFor(b, a.grad)).slice(1)} i lønn
              </span>
              <button className="knapp knapp-liten" onClick={() => utfor(siOpp(s, b.id, i))} aria-label={`Si opp ${a.navn}`}>
                Si opp
              </button>
            </li>
          ))}
        </ul>
      )}

      {!fullt && (
        <div className="ansett-valg" role="group" aria-label="Ansett">
          {GRADLISTE.map((grad) => {
            const g = GRADER[grad]
            const laast = b.nivaa < g.fraNivaa
            const pris = ansettelsespris(b, grad)
            // Hva én til gir netto: ekstra inntekt minus lønnen. Kan være negativt.
            const gir = (bedriftInntektPerSek(medNyAnsatt(b, grad), dagensFaktor(s, b.type)) - bedriftInntektPerSek(b, dagensFaktor(s, b.type))) * statusfaktor(s)
            return (
              <div key={grad} className={`ansett-grad${laast ? ' laast' : ''}`}>
                <strong>{g.navn}</strong>
                <span className="dempet liten">
                  +{tall(g.bonus * 100)} % · {perSek(lonnFor(b, grad)).slice(1)}
                </span>
                {laast ? (
                  <span className="dempet liten laast-merke">
                    <Ikon navn="las" størrelse={12} /> Nivå {g.fraNivaa}
                  </span>
                ) : (
                  <span className={`liten ${gir >= 0 ? 'pluss' : 'minus'}`}>Gir {perSek(gir)}</span>
                )}
                <button
                  className="knapp knapp-gull knapp-liten"
                  disabled={laast || s.kontanter < pris}
                  onClick={() => utfor(ansett(s, b.id, grad))}
                  aria-label={`Ansett ${g.navn.toLowerCase()} for ${kortKroner(pris)}`}
                >
                  {kortKroner(pris)}
                </button>
              </div>
            )
          })}
        </div>
      )}

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
 * Retningen på nivå 50 (Pakke 48): volum eller premium, for godt. Under nivå 50
 * står det hva som kommer; etter valget står det hva bedriften valgte.
 */
export function Retningskort({ b, s }: { b: Bedrift; s: Spilltilstand }) {
  if (b.retning) {
    const r = RETNINGER[b.retning]
    return (
      <div className="retning">
        <h2 className="kort-tittel">
          Retning <span className="merke gull">{r.navn}</span>
        </h2>
        <p className="dempet liten">
          {r.beskrivelse} {retningGir(b, b.retning)}.
        </p>
      </div>
    )
  }
  const kan = kanVelgeRetning(b)
  return (
    <div className="retning">
      <h2 className="kort-tittel">Retning</h2>
      <p className="dempet liten">
        {kan
          ? 'Bedriften er stor nok til å velge vei. Valget er gratis, men det gjelder for godt.'
          : `På nivå ${RETNING_NIVAA} velger bedriften vei, for godt. ${RETNING_NIVAA - b.nivaa} nivåer igjen.`}
      </p>
      <div className="retning-valg">
        {RETNINGSLISTE.map((id) => (
          <div key={id} className={`retning-alternativ${kan ? '' : ' laast'}`}>
            <strong>{RETNINGER[id].navn}</strong>
            <span className="dempet liten">{RETNINGER[id].beskrivelse}</span>
            <span className="gull liten">{retningGir(b, id)}</span>
            {kan && (
              <Bekreftknapp className="knapp knapp-gull knapp-liten" ja={`Ja, ${RETNINGER[id].navn.toLowerCase()}`} varsel="Valget kan ikke angres." onJa={() => utfor(velgRetning(s, b.id, id))}>
                Velg {RETNINGER[id].navn.toLowerCase()}
              </Bekreftknapp>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Hva en retning gir, i tall: «+25 % inntekt» eller «+30 % verdi · +4 status». */
function retningGir(b: Bedrift, id: Retning): string {
  const r = RETNINGER[id]
  const deler: string[] = []
  if (r.inntekt !== 1) deler.push(`+${tall((r.inntekt - 1) * 100)} % inntekt`)
  if (r.verdi !== 1) deler.push(`+${tall((r.verdi - 1) * 100)} % verdi`)
  const status = retningsstatus({ ...b, retning: id })
  if (status > 0) deler.push(`+${status} status`)
  return deler.join(' · ')
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
