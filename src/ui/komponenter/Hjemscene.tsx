import { memo } from 'react'
import type { HjemId } from '../../engine/hjemmene'
import { useDel, vedBehov } from '../vedBehov'
import { romFraKode } from '../romkode'
import { Bredt, Fullramme, IScenen, Lerret } from './Tegnestil'

/**
 * Hjemmene i Luksus (Grafikkpakke G16): Hjemmet på Frogner, Hytta på Geilo og
 * Feriehuset i Marbella, tegnet med rommene slik de er innredet. Tegningene
 * ligger i en egen bit (`ved-behov/Hjemtegninger.tsx`) som hentes første gang et
 * hjem vises, så startskriptet slipper dem. Komponentene her er bare skallet:
 * scenen i detaljvisningen (11:6, med natt og bevegelse) og flisa på kortet.
 */

const hjemtegninger = vedBehov('hjemtegninger', () => import('./ved-behov/Hjemtegninger').then((m) => m.HJEMTEGNINGER))

/** Hjemmet på lerretet; til delen er hentet, står et tomt lerret i samme størrelse. */
export function Hjemtegning({ id, rom, px }: { id: HjemId; rom: number; px: number }) {
  const hentet = useDel(hjemtegninger)
  const tegn = hentet?.[id]
  return (
    <Fullramme.Provider value={true}>
      {tegn ? (
        tegn({ størrelse: px, rom: romFraKode(rom) })
      ) : (
        <Lerret størrelse={px} himmel="ingen">
          {null}
        </Lerret>
      )}
    </Fullramme.Provider>
  )
}

/** Den store scenen øverst på detaljsiden: 11:6, der tegningen følger klokka (natt) og beveger seg. */
export const Hjemscene = memo(function Hjemscene({ id, rom }: { id: HjemId; rom: number }) {
  return (
    <div className="scene full" aria-hidden="true">
      <IScenen.Provider value={true}>
        <Bredt.Provider value={true}>
          <Hjemtegning id={id} rom={rom} px={172} />
        </Bredt.Provider>
      </IScenen.Provider>
    </div>
  )
})

/** Flisa på kortet (og i kjøpsøyeblikket med `px`): midten av tegningen, kant i kant. */
export const Hjembilde = memo(function Hjembilde({ id, rom, stor = false, dempet = false, px }: { id: HjemId; rom: number; stor?: boolean; dempet?: boolean; px?: number }) {
  return (
    <div className={`bedrift-ikon fylt${stor ? ' stor' : ''}${dempet ? ' dempet-ikon' : ''}`} aria-hidden="true">
      <Hjemtegning id={id} rom={rom} px={px ?? (stor ? 68 : 52)} />
    </div>
  )
})
