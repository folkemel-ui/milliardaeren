import { BEDRIFTSTYPER } from '../../engine/innhold'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { JORD } from '../../engine/jord'
import { LANDEMERKER } from '../../engine/landemerker'
import { BEDRIFTSTEGNINGER, Illustrasjon, ILLUSTRASJONSIDER, type Trinn } from '../komponenter/Illustrasjoner'

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
 * Bedriftene vises også i alle fire vekstrinn.
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
                    <Illustrasjon id={id} størrelse={64} trinn={t.trinn} />
                    <small>{t.navn}</small>
                  </span>
                ))}
              </div>
            )}
            <figcaption>{navn(id)}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
