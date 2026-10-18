/**
 * Det delene i Investeringer deler: endringen i kroner og prosent, i grønt eller rødt.
 * En del av Investeringer-fanen (Pakke 65 delte Investeringer.tsx per del).
 */

import { endring, fortegnKroner } from '../../format'

/**
 * «+kr 1 240 · +4,6 %» i grønt, eller rødt når det går nedover. Beløpet og prosenten
 * holdes hver for seg samlet (Pakke 116), så linja bare brytes ved «·» — før sto «%» alene.
 */
export function Endring({ kroner: k, andel, liten = false }: { kroner: number; andel: number; liten?: boolean }) {
  return (
    <span className={`${k >= 0 ? 'pluss' : 'minus'}${liten ? ' liten' : ''}`}>
      <span className="samlet">{fortegnKroner(k)}</span> · <span className="samlet">{endring(andel)}</span>
    </span>
  )
}
