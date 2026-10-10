import { useEffect } from 'react'
import { HJEM, ROM, type HjemId } from '../../engine/hjemmene'
import type { MaleriId, RomId } from '../../engine/types'
import type { Kjopsart } from '../hendelsesstrom'
import { useNy } from '../nymerker'
import { avsluttKjop, useKjop, type Kjopsglimt as Glimt } from '../varsler'
import { Hjemtegning } from './Hjemscene'
import { FULL_RAMME, Illustrasjon } from './Illustrasjoner'
import { Klubbvaapen } from './Klubbvaapen'
import { Maleribilde } from './Malerier'
import { StartupLogo } from './StartupLogo'

const OVERSKRIFT: Record<Kjopsart, string> = {
  bedrift: 'Ny bedrift',
  eiendom: 'Ny eiendom',
  luksus: 'Nytt kjøp',
  jord: 'Ny gård',
  landemerke: 'Nytt landemerke',
  maleri: 'Nytt maleri',
  klubb: 'Ny klubb',
  startup: 'Ny eierandel',
  fusjon: 'Fusjon',
  hjem: 'Innredet',
}

function overskrift(k: Glimt): string {
  return k.art === 'jord' && k.id.startsWith('skog') ? 'Ny skog' : OVERSKRIFT[k.art]
}

/**
 * Bildet i kjøpsøyeblikket (G11): tegningen for det meste, maleriet i rammen
 * sin, klubbens våpen og startupens logo.
 */
/** «hjem:rom:kode» fra `nytt()`: hjemmet, rommet og hvordan hjemmet står (`romkode`). */
function hjemFraId(id: string): { hjem: HjemId; rom: RomId; kode: number } {
  const [hjem, rom, kode] = id.split(':')
  return { hjem: hjem as HjemId, rom: rom as RomId, kode: Number(kode) }
}

function Kjopsbilde({ k }: { k: Glimt }) {
  if (k.art === 'hjem') {
    // Hjemmet slik det ble, i hele flisa: midten av scenen, kant i kant (som en bedrift i full ramme).
    const { hjem, kode } = hjemFraId(k.id)
    return <Hjemtegning id={hjem} rom={kode} px={174} />
  }
  if (k.art === 'maleri') return <Maleribilde id={k.id as MaleriId} størrelse={132} />
  if (k.art === 'klubb') return <Klubbvaapen navn={k.id} størrelse={124} />
  if (k.art === 'startup') return <StartupLogo navn={k.id} størrelse={104} />
  // En tegning med full ramme (G13) fyller hele flisa (176 px minus kanten), uten luft rundt.
  return <Illustrasjon id={k.id} størrelse={FULL_RAMME.includes(k.id) ? 174 : 132} />
}

/** Så lenge øyeblikket står. Kort nok til at du aldri venter på det; en fusjon får litt lenger. */
const VARIGHET_MS = 1800
const FUSJON_MS = 2600

/**
 * Kjøpsøyeblikket: tegningen av det du nettopp kjøpte vokser frem midt på
 * skjermen med et gullskjær, og forsvinner av seg selv. Trykk går rett
 * gjennom, så det aldri står i veien for neste kjøp.
 */
export function Kjopsglimt() {
  const k = useKjop()

  useEffect(() => {
    if (!k) return
    const t = setTimeout(() => avsluttKjop(k.nr), k.art === 'fusjon' ? FUSJON_MS : VARIGHET_MS)
    return () => clearTimeout(t)
  }, [k])

  if (!k) return null
  // Et rom sier hvilket hjem det er i, under navnet på trinnet.
  const under = k.under ?? (k.art === 'hjem' ? `${HJEM[hjemFraId(k.id).hjem].navn} · ${ROM[hjemFraId(k.id).rom].navn}` : undefined)
  return (
    <div key={k.nr} className={k.art === 'fusjon' ? 'kjopsglimt fusjon' : 'kjopsglimt'} role="status">
      <div className="kjopsglimt-glod" aria-hidden="true" />
      <div className={`kjopsglimt-bilde ${k.art}`}>
        {/* Ved en fusjon glir rivalens bedrift inn i din og blir borte i den. */}
        {k.art === 'fusjon' && (
          <span className="fusjon-inn" aria-hidden="true">
            <Illustrasjon id={k.id} størrelse={96} />
          </span>
        )}
        <Kjopsbilde k={k} />
        <span className="kjopsglimt-skjaer" aria-hidden="true" />
      </div>
      <span className="kjopsglimt-overskrift">{overskrift(k)}</span>
      <strong className="kjopsglimt-navn">{k.navn}</strong>
      {under && <span className="kjopsglimt-under">{under}</span>}
    </div>
  )
}

/** «NY» ved navnet på et kort, til kortet trykkes på (se nymerker.ts). */
export function NyMerke({ id }: { id: string }) {
  return useNy(id) ? <span className="merke gull ny">Ny</span> : null
}
