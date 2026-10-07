import { BEDRIFTSTYPER } from '../../engine/innhold'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { JORD } from '../../engine/jord'
import { LANDEMERKER } from '../../engine/landemerker'
import { BEDRIFTSTEGNINGER, Illustrasjon, ILLUSTRASJONSIDER, NY_STIL, type Trinn } from '../komponenter/Illustrasjoner'
import { Bakke, GRUNNLINJE, Kloss, Lerret, maal, METER, Person, S, Slagskygge, type Avstand, type Bakketype } from '../komponenter/Tegnestil'
import { PAPIRER } from '../../engine/marked'
import { PAPIRLOGOER, Papirlogo } from '../komponenter/Papirlogo'
import { RIVALPORTRETTER, Rivalportrett } from '../komponenter/Rivalportrett'
import { STARTUPNAVN, StartupLogo } from '../komponenter/StartupLogo'
import { MALERIVERK, Maleribilde } from '../komponenter/Malerier'
import { KUNSTNERE, MALERIER } from '../../engine/kunst'
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

const BAKKER: { type: Bakketype; navn: string; himmel?: 'inne' }[] = [
  { type: 'fortau', navn: 'Fortau — forretninger' },
  { type: 'gress', navn: 'Gress — hus og hytter' },
  { type: 'kai', navn: 'Kai — båter' },
  { type: 'gulv', navn: 'Gulv — biler', himmel: 'inne' },
  { type: 'sno', navn: 'Snø — fjellet' },
]

const AVSTANDER: { avstand: Avstand; navn: string }[] = [
  { avstand: 'naer', navn: 'Nær — biler, klokker, boder' },
  { avstand: 'gate', navn: 'Gate — hus og forretninger' },
  { avstand: 'fjern', navn: 'Fjern — tårn og anlegg' },
]

/** Et typisk bygg for hver avstand: én etasje nær, to på gateavstand, åtte fjernt. */
const ETASJER: Record<Avstand, number> = { naer: 1, gate: 2, fjern: 8 }

/** En dør og en person på samme avstand, foran et bygg: målestokken. */
function Maalestokk({ avstand }: { avstand: Avstand }) {
  const dor = maal(avstand, 'dor')
  const etasje = maal(avstand, 'etasje')
  const etasjer = ETASJER[avstand]
  const bredde = { naer: 44, gate: 46, fjern: 26 }[avstand]
  const x = 44 - bredde / 2
  return (
    <Lerret størrelse={240}>
      <Bakke type="fortau" />
      <Slagskygge x1={x} x2={x + bredde} lengde={14} d={10} />
      <Kloss x={x} b={bredde} h={etasje * etasjer} d={10} m={S.puss} />
      {Array.from({ length: etasjer - 1 }, (_, n) => (
        <rect key={n} x={x} y={GRUNNLINJE - (n + 1) * etasje} width={bredde} height="0.8" fill={S.puss.skygge} />
      ))}
      <rect x={x + bredde / 2 - dor * 0.22} y={GRUNNLINJE - dor} width={dor * 0.44} height={dor} fill={S.treMork.flate} />
      <Person x={x + bredde + 4 + maal(avstand, 'person') * 0.2} avstand={avstand} klaer={S.marine} />
    </Lerret>
  )
}

/** Stilarket øverst i galleriet: paletten, bakkene og de tre avstandene fra G1. */
function Stilark() {
  return (
    <>
      <h2 className="skjerm-tittel galleri-del">Stilarket</h2>
      <p className="dempet">
        Kunstretningen fra Grafikkpakke G1 (reglene står i Illustrasjoner.tsx). Tre toner per materiale, lyset ovenfra til venstre. Gull er den eneste klare fargen.
      </p>
      <div className="stilark-palett">
        {Object.entries(S).map(([navn, m]) => (
          <div key={navn} className="stilark-farge">
            <div className="stilark-toner" aria-hidden="true">
              <span style={{ background: m.lys }} />
              <span style={{ background: m.flate }} />
              <span style={{ background: m.skygge }} />
            </div>
            <span>{navn}</span>
          </div>
        ))}
      </div>
      <div className="galleri-rutenett">
        {BAKKER.map((b) => (
          <figure key={b.type} className="galleri-kort">
            <div className="galleri-stor">
              <Lerret størrelse={240} himmel={b.himmel}>
                <Bakke type={b.type} />
                <Slagskygge x1={34} x2={58} lengde={16} d={14} />
                <Kloss x={34} b={24} h={24} d={14} m={S.stein} />
              </Lerret>
            </div>
            <figcaption>{b.navn}</figcaption>
          </figure>
        ))}
        {AVSTANDER.map((a) => (
          <figure key={a.avstand} className="galleri-kort">
            <div className="galleri-stor">
              <Maalestokk avstand={a.avstand} />
            </div>
            <figcaption>
              {a.navn} · {String(METER[a.avstand]).replace('.', ',')} enheter per meter
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 className="skjerm-tittel galleri-del">Tegningene</h2>
    </>
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
      <p className="dempet">Hver tegning i 5× størrelse, og slik den vises i spillet — på mørk og lys bunn. De som er tegnet i den nye stilen, kommer først.</p>
      <Stilark />
      <div className="galleri-rutenett">
        {[...ILLUSTRASJONSIDER].sort((a, b) => Number(NY_STIL.includes(b)) - Number(NY_STIL.includes(a))).map((id) => (
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
            <figcaption>
              {navn(id)} {NY_STIL.includes(id) && <span className="merke gull">Ny stil</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <h2 className="skjerm-tittel galleri-del">Rivalene</h2>
      <div className="galleri-rutenett">
        {RIVALPORTRETTER.map((id) => (
          <figure key={id} className="galleri-kort">
            <div className="galleri-stor">
              <Rivalportrett id={id} størrelse={260} form="omslag" />
            </div>
            <div className="galleri-små">
              <span className="galleri-mork">
                <Rivalportrett id={id} størrelse={44} />
              </span>
              <span className="galleri-lys">
                <Rivalportrett id={id} størrelse={44} />
              </span>
              <span className="galleri-mork">
                <Rivalportrett id={id} størrelse={28} />
              </span>
              <span className="galleri-lys">
                <Rivalportrett id={id} størrelse={28} />
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

      <h2 className="skjerm-tittel galleri-del">Malerier</h2>
      <div className="galleri-logoer">
        {MALERIVERK.map((id) => (
          <figure key={id} className="galleri-logo">
            <span className="galleri-mork galleri-ordmerke">
              <Maleribilde id={id} størrelse={170} />
            </span>
            <span className="galleri-små">
              <span className="galleri-mork">
                <Maleribilde id={id} størrelse={44} />
              </span>
              <span className="galleri-lys">
                <Maleribilde id={id} størrelse={44} />
              </span>
            </span>
            <figcaption>
              {MALERIER[id].navn} · {KUNSTNERE[MALERIER[id].kunstner].navn}, {MALERIER[id].aar}
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
            <span className="galleri-mork galleri-ordmerke">
              <Papirlogo id={id} størrelse={96} />
            </span>
            <span className="galleri-mork galleri-ordmerke">
              <Papirlogo id={id} størrelse={36} ordmerke />
            </span>
            <span className="galleri-lys galleri-ordmerke">
              <Papirlogo id={id} størrelse={36} ordmerke />
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

      <h2 className="skjerm-tittel galleri-del">Startups</h2>
      <div className="galleri-logoer">
        {STARTUPNAVN.map((navn) => (
          <figure key={navn} className="galleri-logo">
            <span className="galleri-mork galleri-ordmerke">
              <StartupLogo navn={navn} />
            </span>
            <span className="galleri-små">
              <span className="galleri-mork">
                <StartupLogo navn={navn} liten />
              </span>
              <span className="galleri-lys">
                <StartupLogo navn={navn} />
              </span>
            </span>
            <figcaption>{navn}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
