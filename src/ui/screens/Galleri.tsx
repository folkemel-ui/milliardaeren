import { BEDRIFTSTYPER } from '../../engine/innhold'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { JORD } from '../../engine/jord'
import { LANDEMERKER } from '../../engine/landemerker'
import { BEDRIFTSTEGNINGER, Illustrasjon, ILLUSTRASJONSIDER, type Trinn } from '../komponenter/Illustrasjoner'
import { PAPIRER } from '../../engine/marked'
import { PAPIRLOGOER, Papirlogo } from '../komponenter/Papirlogo'
import { RIVALPORTRETTER, Rivalportrett } from '../komponenter/Rivalportrett'
import { Stadion, STADIONTRINN } from '../komponenter/Stadion'
import { DIVISJONER, KLUBBNAVN } from '../../engine/klubb'
import { Verdenskart } from '../komponenter/Verdenskart'
import { nyttSpill } from '../../engine/start'
import type { LuksusId } from '../../engine/types'

/** Et spill med et gitt fly, så verdenskartet kan vises i hvert trinn. */
function medFly(fly: LuksusId | null) {
  const s = nyttSpill()
  if (fly) s.luksus = [fly]
  return s
}
import { START_RIVALER } from '../../engine/rivaler'

const TRINN: { trinn: Trinn; navn: string }[] = [
  { trinn: 0, navn: 'Nivå 1' },
  { trinn: 1, navn: '25' },
  { trinn: 2, navn: '50' },
  { trinn: 3, navn: '100' },
]

/** Navn til galleriet, fra katalogene i motoren. */
function navn(id: string): string {
  return (
    BEDRIFTSTYPER[id as keyof typeof BEDRIFTSTYPER]?.navn ??
    EIENDOMSTYPER[id as keyof typeof EIENDOMSTYPER]?.navn ??
    LUKSUS[id as keyof typeof LUKSUS]?.navn ??
    JORD[id as keyof typeof JORD]?.navn ??
    LANDEMERKER[id as keyof typeof LANDEMERKER]?.navn ??
    id
  )
}

/**
 * Illustrasjonsgalleriet (åpnes med ?galleri): hver tegning i 5× størrelse og
 * i vanlig størrelse, på både mørk og lys bunn — for å vurdere dem ordentlig.
 * Bedriftene vises også i alle fire vekstrinn — trinn n med n forbedringer, så
 * alle detaljene kan vurderes.
 */
export function Galleri() {
  return (
    <main className="galleri">
      <h1 className="skjerm-tittel">Illustrasjoner</h1>
      <p className="dempet">Hver tegning i 5× størrelse, og slik den vises i spillet — på mørk og lys bunn.</p>
      <div className="galleri-rutenett">
        {ILLUSTRASJONSIDER.map((id) => (
          <figure key={id} className="galleri-kort">
            <div className="galleri-stor">
              <Illustrasjon id={id} størrelse={240} />
            </div>
            <div className="galleri-små">
              <span className="galleri-mork">
                <Illustrasjon id={id} størrelse={44} />
              </span>
              <span className="galleri-lys">
                <Illustrasjon id={id} størrelse={44} />
              </span>
            </div>
            {BEDRIFTSTEGNINGER.includes(id) && (
              <div className="galleri-trinn">
                {TRINN.map((t) => (
                  <span key={t.trinn} className="galleri-mork" title={t.navn}>
                    <Illustrasjon id={id} størrelse={64} trinn={t.trinn} forbedringer={t.trinn} />
                    <small>{t.navn}</small>
                  </span>
                ))}
              </div>
            )}
            <figcaption>{navn(id)}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="skjerm-tittel galleri-del">Rivalene</h2>
      <div className="galleri-rutenett">
        {RIVALPORTRETTER.map((id) => (
          <figure key={id} className="galleri-kort">
            <div className="galleri-stor">
              <Rivalportrett id={id} størrelse={240} />
            </div>
            <div className="galleri-små">
              <span className="galleri-mork">
                <Rivalportrett id={id} størrelse={40} />
              </span>
              <span className="galleri-lys">
                <Rivalportrett id={id} størrelse={40} />
              </span>
            </div>
            <figcaption>{START_RIVALER.find((r) => r.id === id)?.navn ?? id}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="skjerm-tittel galleri-del">Stadion</h2>
      <div className="galleri-stadion">
        {Array.from({ length: STADIONTRINN }, (_, d) => (
          <figure key={d} className="galleri-kort">
            <span className="galleri-mork">
              <Stadion divisjon={d} navn={KLUBBNAVN[d % KLUBBNAVN.length]} />
            </span>
            <span className="galleri-lys">
              <Stadion divisjon={d} navn={KLUBBNAVN[d % KLUBBNAVN.length]} />
            </span>
            <figcaption>
              {DIVISJONER[d].navn} · {KLUBBNAVN[d % KLUBBNAVN.length]}
            </figcaption>
          </figure>
        ))}
      </div>

      <h2 className="skjerm-tittel galleri-del">Verdenskartet</h2>
      <div className="galleri-stadion">
        {([null, 'propellfly', 'forretningsjet', 'langdistansejet'] as (LuksusId | null)[]).map((fly) => (
          <figure key={fly ?? 'ingen'} className="galleri-kort">
            <Verdenskart s={medFly(fly)} valgt={null} velg={() => {}} zoom={() => {}} />
            <figcaption>{fly ?? 'Uten fly'}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="skjerm-tittel galleri-del">Logoer</h2>
      <div className="galleri-logoer">
        {PAPIRLOGOER.map((id) => (
          <figure key={id} className="galleri-logo">
            <span className="galleri-mork">
              <Papirlogo id={id} størrelse={96} />
            </span>
            <span className="galleri-små">
              <span className="galleri-mork">
                <Papirlogo id={id} størrelse={32} />
              </span>
              <span className="galleri-lys">
                <Papirlogo id={id} størrelse={32} />
              </span>
            </span>
            <figcaption>
              {id} · {PAPIRER[id].navn}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
