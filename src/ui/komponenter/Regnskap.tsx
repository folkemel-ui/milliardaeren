import { useState } from 'react'
import type { Oppgjor, Spilltilstand } from '../../engine/types'
import { endring, fortegnKroner } from '../format'
import { nettoInn, nettoUt, OppgjorBlokk } from './Oppgjor'

const PERIODER: { id: Oppgjor['periode']; navn: string; tom: string }[] = [
  { id: 'uke', navn: 'Uker', tom: 'Første ukesoppgjør kommer i søndagsavisa.' },
  { id: 'maaned', navn: 'Måneder', tom: 'Første månedsoppgjør kommer den 1. i neste måned.' },
  { id: 'aar', navn: 'År', tom: 'Første årsoppgjør kommer 1. januar.' },
]

/** Regnskapet: alle uke-, måneds- og årsoppgjør, nyeste først. Trykk på en rad for detaljene. */
export function Regnskap({ s }: { s: Spilltilstand }) {
  const [periode, settPeriode] = useState<Oppgjor['periode']>('maaned')
  const [åpen, settÅpen] = useState<string | null>(null)
  const liste = s.oppgjor.filter((o) => o.periode === periode).reverse()
  const valgt = PERIODER.find((p) => p.id === periode)!

  return (
    <div className="kort regnskap">
      <h2 className="kort-tittel">Regnskap</h2>
      <div className="segment">
        {PERIODER.map((p) => (
          <button key={p.id} className={p.id === periode ? 'aktiv' : ''} onClick={() => settPeriode(p.id)}>
            {p.navn}
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <p className="dempet liten">{valgt.tom}</p>
      ) : (
        <ul className="regnskap-liste">
          {liste.map((o) => {
            const nøkkel = `${o.periode}-${o.tilDag}`
            const netto = nettoInn(o) - nettoUt(o)
            const vekst = o.formueFor > 0 ? (o.formueEtter - o.formueFor) / o.formueFor : 0
            return (
              <li key={nøkkel}>
                <button className="regnskap-rad" aria-expanded={åpen === nøkkel} onClick={() => settÅpen(åpen === nøkkel ? null : nøkkel)}>
                  <span className="regnskap-navn">{o.navn[0].toUpperCase() + o.navn.slice(1)}</span>
                  <span className={netto >= 0 ? 'pluss' : 'minus'}>{fortegnKroner(netto)}</span>
                  <span className={vekst >= 0 ? 'pluss liten' : 'minus liten'}>{endring(vekst)}</span>
                </button>
                {åpen === nøkkel && <OppgjorBlokk o={o} s={s} medTittel={false} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
