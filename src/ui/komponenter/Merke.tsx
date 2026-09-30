import { merkeFor } from '../merker'
import { Ikon } from './Ikoner'

/**
 * En prestasjon som medalje: rund, med en ring i bronse, sølv eller gull og
 * ikonet i midten. En prestasjon du ikke har nådd ennå, er grå med en lås.
 */
export function Merke({ id, klart, størrelse = 40 }: { id: string; klart: boolean; størrelse?: number }) {
  const m = merkeFor(id)
  return (
    <span className={`merke-medalje ${klart ? m.grad : 'laast'}`} style={{ width: størrelse, height: størrelse }} aria-hidden="true">
      <Ikon navn={klart ? m.ikon : 'las'} størrelse={Math.round(størrelse * 0.5)} />
    </span>
  )
}
