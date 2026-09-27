import type { ReactNode } from 'react'

/** Plass holdt av til en fane som ikke er bygget ennå. */
export function KommerSnart({ tittel, ikon, tekst }: { tittel: string; ikon: ReactNode; tekst: string }) {
  return (
    <section className="skjerm kommer-snart">
      <div className="kommer-snart-ikon">{ikon}</div>
      <h1 className="skjerm-tittel">{tittel}</h1>
      <p className="dempet">{tekst}</p>
      <span className="merkelapp">Kommer snart</span>
    </section>
  )
}
