import { useEffect, useRef, useState } from 'react'
import { MAKS_HENDELSER } from '../../engine/innhold'
import type { Spilltilstand } from '../../engine/types'
import { varighet } from '../format'
import { merkHendelserSett, settGrense } from '../hendelsessett'
import { useFokusfelle } from './useFokusfelle'

/**
 * Hendelsesloggen (Pakke 61): alle hendelsene spillet husker, nyeste først,
 * i et vindu som åpnes fra bjella i toppfeltet, fra varselet etter tid borte
 * og fra velkomstskjermen. Før lå de ti siste nederst i Bank.
 */
export function Hendelseslogg({ s, lukk }: { s: Spilltilstand; lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)
  // Det som var usett da loggen ble åpnet, beholder «Ny»-merket mens den er åpen.
  const [grense] = useState(() => settGrense(s))
  const siste = s.hendelser.at(-1)?.sek
  useEffect(() => {
    if (siste !== undefined) merkHendelserSett(siste)
  }, [siste])

  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div
        ref={boks}
        tabIndex={-1}
        className="velkomst hendelseslogg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hendelser-tittel"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id="hendelser-tittel" className="velkomst-tittel">
          Hendelser
        </h1>
        {s.hendelser.length === 0 ? (
          <p className="dempet">Ingen hendelser ennå. Marginkrav, fusjoner, skatt, opprykk og store nyheter havner her.</p>
        ) : (
          <>
            <p className="dempet liten">De siste {MAKS_HENDELSER} hendelsene, nyeste først.</p>
            <ul className="hendelser">
              {[...s.hendelser].reverse().map((h, i) => (
                <li key={`${h.sek}-${i}`} className={`hendelse ${h.alvor}`}>
                  <strong>{h.tittel}</strong>
                  <span className="dempet liten hendelse-tid">
                    {h.sek > grense && <span className="merke gull">Ny</span>}
                    for {varighet(Math.max(0, s.sek - h.sek))} siden
                  </span>
                  <p className="liten">{h.tekst}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <button className="knapp" onClick={lukk}>
          Lukk
        </button>
      </div>
    </div>
  )
}
