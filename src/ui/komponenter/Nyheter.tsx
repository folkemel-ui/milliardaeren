import { useRef } from 'react'
import { useFokusfelle } from './useFokusfelle'
import { ENDRINGER, type Versjonsoppforing } from '../versjon'
import { Logo } from './Logo'

function Oppforing({ v, tittel }: { v: Versjonsoppforing; tittel: 'h1' | 'h2' }) {
  const T = tittel
  return (
    <section className="nyheter-versjon">
      <T className={tittel === 'h1' ? 'velkomst-tittel' : 'kort-tittel'}>{tittel === 'h1' ? `Nytt i ${v.navn}` : `Versjon ${v.navn}`}</T>
      <p className="dempet liten">
        {v.dato} · {v.ingress}
      </p>
      <ul className="nyheter-liste">
        {v.punkter.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  )
}

/** «Nytt i 1.0»: vises én gang for spillere som kommer tilbake etter en oppdatering. */
export function Nyheter({ lukk }: { lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)
  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div ref={boks} tabIndex={-1} className="velkomst nyheter" role="dialog" aria-modal="true" aria-label={`Nytt i ${ENDRINGER[0].navn}`} onClick={(e) => e.stopPropagation()}>
        <Logo størrelse={40} />
        <Oppforing v={ENDRINGER[0]} tittel="h1" />
        <button className="knapp knapp-gull" onClick={lukk}>
          Spill videre
        </button>
      </div>
    </div>
  )
}

/** Hele endringsloggen, nyeste først — åpnes fra Innstillinger. */
export function Endringslogg({ lukk }: { lukk: () => void }) {
  const boks = useRef<HTMLDivElement>(null)
  useFokusfelle(boks, lukk)
  return (
    <div className="avis-bakgrunn" onClick={lukk}>
      <div ref={boks} tabIndex={-1} className="velkomst nyheter" role="dialog" aria-modal="true" aria-labelledby="logg-tittel" onClick={(e) => e.stopPropagation()}>
        <h1 id="logg-tittel" className="velkomst-tittel">
          Hva er nytt
        </h1>
        {ENDRINGER.map((v) => (
          <Oppforing key={v.versjon} v={v} tittel="h2" />
        ))}
        <button className="knapp" onClick={lukk}>
          Lukk
        </button>
      </div>
    </div>
  )
}
