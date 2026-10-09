import { nettoformue, nettoPerSek } from '../../engine/formler'
import { STATUSNIVAAER, statusnivaa } from '../../engine/eiendom'
import { dagnummer, erHelg } from '../../engine/kalender'
import type { Spilltilstand } from '../../engine/types'
import { kompakt, perSek } from '../format'
import { klokke, kortDato, ukenummer } from '../kalender'
import { Ikon, IkonProfil } from './Ikoner'
import { RulleTall } from './RulleTall'
import { settProfildel } from '../deler'
import { faneAapen, nesteMaal } from '../progresjon'
import { kortKroner } from '../format'
import { antallUsette, useHendelserSett } from '../hendelsessett'
import type { Fane } from './Fanemeny'

/**
 * Hvor langt du har kommet, i fire trinn: under en million, millionær,
 * milliardær og over tusen milliarder. Nettoformuen i toppfeltet skifter
 * utseende for hvert trinn, så fremgangen synes uten å lese tallet.
 */
export function formuetrinn(formue: number): 0 | 1 | 2 | 3 {
  return formue >= 1e12 ? 3 : formue >= 1e9 ? 2 : formue >= 1e6 ? 1 : 0
}

/**
 * Fast toppfelt: kontanter og tempo til venstre, nettoformuen i midten,
 * profil til høyre — og under, datolinja med klokka, bjella for hendelsene
 * (Pakke 61) og avisen. Kanten under
 * blir gylnere for hvert statusnivå, og tittelen din står under formuen.
 * Rett under står det neste målet (Pakke 40). Det ligger utenfor det faste
 * feltet (G8): det står der øverst på siden, men glir bort under datolinja når
 * du ruller, så toppen dekker mindre av skjermen.
 */
export function Toppfelt({
  s,
  tilProfil,
  åpneAvis,
  åpneLogg,
  gåTil,
}: {
  s: Spilltilstand
  tilProfil: () => void
  åpneAvis: () => void
  åpneLogg: () => void
  gåTil: (f: Fane) => void
}) {
  const dag = dagnummer(s.sek)
  const siste = s.avis[s.avis.length - 1]
  const ulest = siste !== undefined && siste.dag > s.avisLest
  const formue = nettoformue(s)
  const nivaa = statusnivaa(s)
  const styrke = nivaa / (STATUSNIVAAER.length - 1)
  useHendelserSett()
  const usette = antallUsette(s)

  return (
    <>
      <header className="toppfelt" style={{ ['--status-styrke' as string]: styrke }}>
        <div className="toppfelt-rad">
          <div className="toppfelt-kontanter">
            <span className="etikett">Kontanter</span>
            <span className="tall-mellom">
              <RulleTall verdi={s.kontanter} format={kompakt} />
            </span>
            <span className={nettoPerSek(s) < 0 ? 'tempo negativ' : 'tempo'}>{perSek(nettoPerSek(s))}</span>
          </div>
          <div className="toppfelt-formue">
            <span className="etikett">Nettoformue</span>
            <span className={`tall-stort formue-trinn-${formuetrinn(formue)}`}>
              <RulleTall verdi={formue} format={kompakt} />
            </span>
            {nivaa > 0 && <span className="toppfelt-tittel">{STATUSNIVAAER[nivaa].navn}</span>}
          </div>
          <button className="toppfelt-profil" onClick={tilProfil} aria-label={`Profil, statusnivå ${statusnivaa(s)}`}>
            <IkonProfil størrelse={22} />
            {statusnivaa(s) > 0 && <span className="profil-nivaa brikke gull">{statusnivaa(s)}</span>}
          </button>
        </div>

        <div className="datolinje">
          <span className="dato">
            {kortDato(dag)} <span className="dempet">· uke {ukenummer(dag)} · {klokke(s.sek)}</span>
          </span>
          {s.skatt.regninger.length > 0 ? (
            <button
              className="merke fare"
              onClick={() => {
                settProfildel('regnskap')
                tilProfil()
              }}
              aria-label="Ubetalt skatt — gå til regnskapet"
            >
              <Ikon navn="kvittering" størrelse={14} /> Skatt
            </button>
          ) : (
            erHelg(s.sek) && <span className="merke varsel">Børsen stengt</span>
          )}
          <button className="avisknapp hendelsesknapp" onClick={åpneLogg} aria-label={usette ? `Hendelser, ${usette} nye` : 'Hendelser'}>
            <Ikon navn="bjelle" størrelse={18} />
            {usette > 0 && <span className="ulest-prikk" />}
          </button>
          <button className="avisknapp" onClick={åpneAvis} aria-label={ulest ? 'Avisa, ny utgave' : 'Avisa'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="4" width="15" height="16" rx="1.5" />
              <path d="M18 8 H21 V18 A2 2 0 0 1 17 18" />
              <line x1="6" y1="8" x2="15" y2="8" />
              <rect x="6" y="11" width="4" height="5" />
              <line x1="12" y1="12" x2="15" y2="12" />
              <line x1="12" y1="15" x2="15" y2="15" />
            </svg>
            Avisa
            {ulest && <span className="ulest-prikk" />}
          </button>
        </div>
      </header>
      <Maalstripe s={s} gåTil={gåTil} />
    </>
  )
}

/**
 * Det neste målet over den høyeste formuen din: hva som skjer, ved hvilket
 * beløp, og hvor langt du har kommet siden forrige mål. Et trykk tar deg dit
 * målet hører hjemme — en fane som åpner, kan du ikke gå til ennå.
 */
function Maalstripe({ s, gåTil }: { s: Spilltilstand; gåTil: (f: Fane) => void }) {
  const neste = nesteMaal(s)
  if (!neste) return null
  const [forst, ...resten] = neste.maal
  const mål = forst.fane && faneAapen(s, forst.fane) ? forst.fane : undefined
  const innhold = (
    <>
      <span className="maalstripe-tekst">
        <span className="etikett">Neste</span> <strong>{forst.tekst}</strong>
        {resten.length > 0 && <span className="dempet"> · {resten.map((m) => m.tekst).join(' · ')}</span>}
      </span>
      <span className="maalstripe-belop">{kortKroner(neste.belop)}</span>
      <span className="maalstripe-spor" aria-hidden="true">
        <span style={{ width: `${neste.andel * 100}%` }} />
      </span>
    </>
  )
  const etikett = `Neste mål: ${neste.maal.map((m) => m.tekst).join(', ')} ved ${kortKroner(neste.belop)}. ${Math.round(neste.andel * 100)} % av veien fra forrige mål.`
  return (
    <div className="maalfelt">
      {mål ? (
        <button className="maalstripe" onClick={() => gåTil(mål)} aria-label={etikett}>
          {innhold}
        </button>
      ) : (
        <div className="maalstripe" role="status" aria-label={etikett}>
          {innhold}
        </div>
      )}
    </div>
  )
}
