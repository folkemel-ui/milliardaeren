import { BEDRIFTSTYPER } from '../../engine/innhold'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { JORD } from '../../engine/jord'
import { LANDEMERKER } from '../../engine/landemerker'
import { Illustrasjon, ILLUSTRASJONSIDER } from '../komponenter/Illustrasjoner'

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
            <figcaption>{navn(id)}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
