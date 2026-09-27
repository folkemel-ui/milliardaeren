import { Illustrasjon } from './Illustrasjoner'

/** Illustrasjonen i en rund flis — for bedrifter, eiendom og luksus. */
export function BedriftIkon({ type, dempet = false }: { type: string; dempet?: boolean }) {
  return (
    <div className={dempet ? 'bedrift-ikon dempet-ikon' : 'bedrift-ikon'} aria-hidden="true">
      <Illustrasjon id={type} størrelse={44} />
    </div>
  )
}
