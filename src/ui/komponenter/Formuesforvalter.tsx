/**
 * Formuesforvalteren på Oversikt (Pakke 124): velg en profil, gi forvalteren av kontantene eller ta
 * ut, og se hva den gjorde sist mandag. Forvalteren holder aksjene, Børsfondet, obligasjonene og
 * råvarene dine i profilens blanding; kryptoen rører den ikke. (Ikke å forveksle med
 * eiendomsforvalterne i Forvalter.tsx, fra Pakke 54.) Pakke 125: trinnene, og hva den holder nå.
 * Pakke 126: Utbytte-profilen, en andel av inntekten og sparemålet.
 */

import { forvalterBelop, kjopForvaltertrinn, settForvalterinnskudd, settForvaltermaal, startForvalter, stoppForvalter } from '../../engine/handlinger'
import {
  blandingNaa,
  erPapirpost,
  FORVALTERTRINN,
  forvaltertrinn,
  forvaltertrinnpris,
  forvaltetVerdi,
  gebyrsats,
  GLIR_FRA,
  INNSKUDDSANDELER,
  MAALGANGER,
  nesteBedriftsmaal,
  PROFILER,
  PROFILLISTE,
  utbyttePerDag,
  VINNER_SLINGRING,
} from '../../engine/forvalter'
import { eierType, inntektPerSek } from '../../engine/formler'
import { STIGEN } from '../../engine/innhold'
import { leiePerSek } from '../../engine/eiendom'
import { PAPIRER } from '../../engine/marked'
import { fase, FASER } from '../../engine/verden'
import { erHelg } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek, tall } from '../format'
import { Bekreftknapp } from './Bekreftknapp'

const RENTEPOST: Record<string, string> = { kort: '2-årige obligasjoner', lang: '10-årige obligasjoner', konto: 'forvalterkontoen' }
const pst = (n: number) => `${tall(n * 100)} %`

/** «Høykonjunktur: aksjer 35 %, gull 20 % · 10-årige obligasjoner» — blandingen den følger nå. */
function blandingstekst(s: Spilltilstand): string {
  const m = blandingNaa(s)
  let aksjer = 0
  let rente = ''
  for (const [post, andel] of m) {
    if (erPapirpost(post) && PAPIRER[post].klasse === 'aksje') aksjer += andel
    if (post === 'kort' || post === 'lang' || post === 'konto') rente = RENTEPOST[post]
  }
  const deler = [`aksjer ${pst(aksjer)}`, `gull ${pst(m.get('GLD') ?? 0)}`]
  return `${FASER[fase(s)].navn}: ${deler.join(', ')}${rente ? ` · ${rente}` : ''}`
}

/** «Av inntekten»: en andel av inntekten og leia til forvalteren hvert sekund, investert mandag (Pakke 126). */
function Innskudd({ s }: { s: Spilltilstand }) {
  const andel = s.forvalter?.innskudd ?? 0
  const spar = s.sparandel ?? 0
  return (
    <>
      <div className="spare-rad">
        <span className="etikett">Gi forvalteren av inntekten</span>
        <div className="andelsknapper fire" role="radiogroup" aria-label="Gi forvalteren av inntekten">
          {INNSKUDDSANDELER.map((a) => (
            <button key={a} role="radio" aria-checked={andel === a} className={andel === a ? 'knapp knapp-liten aktiv' : 'knapp knapp-liten'} onClick={() => utfor(settForvalterinnskudd(s, a))}>
              {a ? `${tall(a * 100)} %` : 'Av'}
            </button>
          ))}
        </div>
      </div>
      {andel > 0 && (
        <p className="dempet liten">
          ≈ {perSek((inntektPerSek(s) + leiePerSek(s)) * andel)} samles på forvalterkontoen ({kortKroner(s.forvalter?.konto ?? 0)} nå) og investeres mandag morgen.
          {spar > 0 && ` Med ${tall(spar * 100)} % til sparekontoen beholder du ${tall((1 - andel - spar) * 100)} %.`}
        </p>
      )}
    </>
  )
}

/** Sparemålet (Pakke 126): neste bedrift eller to, fem eller ti ganger det den har; tryggere fra halvveis. */
function Sparemaal({ s, verdi }: { s: Spilltilstand; verdi: number }) {
  const m = s.forvalter?.maal
  const neste = nesteBedriftsmaal(s, verdi)
  if (m) {
    const andel = Math.min(1, verdi / m.belop)
    return (
      <div className="spare-rad">
        <span className="etikett">Sparemål</span>
        <p className="liten">
          <strong>{m.bedrift ? m.navn : 'Sparemål'}</strong> · {kortKroner(m.belop)} · {tall(andel * 100)} % der
          <br />
          <span className="dempet">
            {andel >= GLIR_FRA ? 'Blandingen glir mot Forsiktig nå.' : `Blandingen glir mot Forsiktig fra ${tall(GLIR_FRA * 100)} %.`} Når den har beløpet, betales det ut som kontanter en hverdag morgen.
          </span>
        </p>
        <button className="knapp knapp-liten" onClick={() => utfor(settForvaltermaal(s, null))}>
          Fjern målet
        </button>
      </div>
    )
  }
  return (
    <div className="spare-rad">
      <span className="etikett">Spar til</span>
      <div className="andelsknapper maalvalg">
        <button className="knapp knapp-liten" disabled={!neste} onClick={() => utfor(settForvaltermaal(s, 'bedrift'))}>
          {neste ? neste.navn : 'Neste bedrift'}
        </button>
        {MAALGANGER.map((g) => (
          <button key={g} className="knapp knapp-liten" disabled={verdi < 1} onClick={() => utfor(settForvaltermaal(s, g))}>
            {g} ×
          </button>
        ))}
      </div>
      <p className="dempet liten">
        {neste ? `${neste.navn} koster ${kortKroner(neste.belop)}` : STIGEN.every((id) => eierType(s, id)) ? 'Du eier alle bedriftene' : 'Forvalteren har nok til bedriftene du ikke eier'}, eller 2, 5 eller 10 ganger det den har. Den blir tryggere fra halvveis og betaler ut når målet er nådd.
      </p>
    </div>
  )
}

export function Formuesforvalter({ s }: { s: Spilltilstand }) {
  const f = s.forvalter
  const verdi = forvaltetVerdi(s)
  const stengt = erHelg(s.sek)
  // «0,2 %» og «0,15 %»: én desimal når den holder.
  const sats = gebyrsats(s) * 100
  const gebyr = `${tall(sats, Math.abs(sats * 10 - Math.round(sats * 10)) < 1e-9 ? 1 : 2)} %`
  const trinn = forvaltertrinn(s)
  const neste = forvaltertrinnpris(s)
  return (
    <div className="kort formuesforvalter">
      <h2 className="kort-tittel">Formuesforvalter</h2>
      {f ? (
        <p className="liten">
          <strong>{PROFILER[f.profil].navn}</strong> · forvalter {kortKroner(verdi)} · gebyr {gebyr} ≈ {kortKroner(gebyrsats(s) * verdi)} i uka
          {trinn >= 2 && (
            <span className="dempet">
              <br />
              {blandingstekst(s)}
            </span>
          )}
          {f.siste && (
            <span className="dempet">
              <br />
              Sist mandag: solgte for {kortKroner(f.siste.solgt)}, kjøpte for {kortKroner(f.siste.kjopt)}.
            </span>
          )}
          {f.profil === 'utbytte' && (
            <span className="dempet">
              <br />
              Utbytte og kuponger ≈ {kortKroner(utbyttePerDag(s))} til deg hver hverdag.
            </span>
          )}
        </p>
      ) : (
        <p className="dempet liten">
          Velg en profil, og forvalteren holder aksjene, Børsfondet, obligasjonene og råvarene dine i den blandingen — hver mandag morgen, for {gebyr} av det den forvalter i uka. Den selger tap før gevinst, og en vinner først når den er {tall(VINNER_SLINGRING * 100)} % over målet, så skatten venter. Kryptoen rører den ikke.
        </p>
      )}
      <div className="andelsknapper fire" role="radiogroup" aria-label="Profil">
        {PROFILLISTE.map((p) => (
          <button key={p} role="radio" aria-checked={f?.profil === p} className={f?.profil === p ? 'knapp knapp-liten aktiv' : 'knapp knapp-liten'} disabled={stengt} onClick={() => utfor(startForvalter(s, p))}>
            {PROFILER[p].navn}
          </button>
        ))}
      </div>
      <p className="dempet liten">{PROFILER[f?.profil ?? 'balansert'].tekst}</p>
      {f && (
        <>
          <div className="spare-rad">
            <span className="etikett">Gi forvalteren</span>
            <div className="andelsknapper">
              {[0.1, 0.25, 0.5].map((a) => {
                const belop = Math.floor(s.kontanter * a)
                return (
                  <button key={a} className="knapp knapp-liten" disabled={stengt || belop < 1} onClick={() => utfor(forvalterBelop(s, belop))}>
                    {kortKroner(belop)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="spare-rad">
            <span className="etikett">Ta ut</span>
            <div className="andelsknapper">
              {[0.25, 0.5, 1].map((a) => {
                const belop = Math.floor(verdi * a)
                return (
                  <button key={a} className="knapp knapp-liten" disabled={stengt || belop < 1} onClick={() => utfor(forvalterBelop(s, -belop))}>
                    {a === 1 ? 'Alt' : kortKroner(belop)}
                  </button>
                )
              })}
            </div>
          </div>
          <Innskudd s={s} />
          <Sparemaal s={s} verdi={verdi} />
          <Bekreftknapp className="knapp knapp-liten" ja="Ja, si opp" varsel="Det forvalteren har kjøpt, blir stående som ditt." onJa={() => utfor(stoppForvalter(s))}>
            Si opp forvalteren
          </Bekreftknapp>
          <p className="dempet liten">Gebyrene så langt: {kortKroner(f.gebyrBetalt)}.</p>
        </>
      )}
      {/* Pakke 125: tre trinn, kjøpt én gang og priset på nettoformuen; de blir stående om du sier opp. */}
      {FORVALTERTRINN.map((tr, i) => (
        <div key={tr.navn} className="personale-rad gardsmaskin">
          <p className="liten">
            <strong>
              Trinn {i + 1}: {tr.navn}
            </strong>
            <br />
            <span className="dempet">{tr.tekst}</span>
          </p>
          {i < trinn ? (
            <span className="merke ok">Kjøpt</span>
          ) : i === trinn && neste !== null ? (
            <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < neste} onClick={() => utfor(kjopForvaltertrinn(s))}>
              Kjøp · {kortKroner(neste)}
            </button>
          ) : (
            <span className="merke kant">Etter trinn {i}</span>
          )}
        </div>
      ))}
      <p className="dempet liten">Trinnene koster en andel av nettoformuen, én gang, og blir stående om du sier opp forvalteren.</p>
      {stengt && <p className="dempet liten">Børsen er stengt i helgen; forvalteren handler fra mandag.</p>}
    </div>
  )
}
