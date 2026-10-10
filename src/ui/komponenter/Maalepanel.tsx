import { useState } from 'react'
import { hentMaalinger, sekundtall, skjulMaaling, useMaalinger, visMaaling, type Maalinger } from '../../state/maaling'
import { VERSJON } from '../versjon'
import { tall, varighet } from '../format'

/** «3,7 ms» under ett sekund, ellers «1,2 s». */
export function tid(ms: number): string {
  return ms < 1000 ? `${tall(ms, ms < 10 ? 1 : 0)} ms` : `${tall(ms / 1000, 1)} s`
}

/** Tallene som rader: navnet og verdien, i den rekkefølgen panelet og kopien viser dem. */
export function maalerader(m: Maalinger): [string, string][] {
  const sek = sekundtall(m)
  const nav = typeof navigator === 'undefined' ? null : (navigator as Navigator & { deviceMemory?: number })
  return [
    ['Oppstart', m.oppstartMs === null ? 'ikke målt' : tid(m.oppstartMs)],
    ['Lengste tid borte', m.borte ? `${tid(m.borte.ms)} for ${varighet(m.borte.sek)}` : 'ikke målt ennå'],
    ['Ett sekund i spillet', sek ? `snitt ${tid(sek.snitt)} · topp ${tid(sek.topp)} (siste ${sek.antall})` : 'ikke målt ennå'],
    ['Lagring', m.lagring ? `${tid(m.lagring.ms)} · ${tall(m.lagring.byte / 1024)} kB` : 'ikke målt ennå'],
    ['Telefonen', nav ? `${nav.hardwareConcurrency ?? '?'} kjerner${nav.deviceMemory ? ` · ${nav.deviceMemory} GB` : ''}` : '?'],
    ['Versjon', VERSJON],
  ]
}

/**
 * Målepanelet i Innstillinger (Pakke 76): tallene fra denne telefonen, når
 * spillet er åpnet med «?maal». Til sjekken på en ekte, treg telefon og
 * spilltesten før App Store — se Spilltest.md.
 */
export function Maalepanel() {
  const [vis, settVis] = useState(visMaaling)
  const m = useMaalinger()
  const [kopiert, settKopiert] = useState(false)
  if (!vis) return null
  const rader = maalerader(m)
  const kopier = () => {
    const tekst = maalerader(hentMaalinger())
      .map(([navn, verdi]) => `${navn}: ${verdi}`)
      .join('\n')
    navigator.clipboard?.writeText(`Milliardær, målt på telefonen\n${tekst}\n${navigator.userAgent}`).then(
      () => settKopiert(true),
      () => settKopiert(false),
    )
  }
  return (
    <div className="kort maalepanel">
      <h2 className="kort-tittel">Måling på denne telefonen</h2>
      <dl className="rekorder">
        {rader.map(([navn, verdi]) => (
          <div key={navn}>
            <dt>{navn}</dt>
            <dd>{verdi}</dd>
          </div>
        ))}
      </dl>
      <p className="dempet liten">Lukk spillet en stund og åpne det igjen for å måle tiden borte.</p>
      <div className="rival-knapper">
        <button className="knapp knapp-gull" onClick={kopier}>
          {kopiert ? 'Kopiert' : 'Kopier tallene'}
        </button>
        <button
          className="knapp"
          onClick={() => {
            skjulMaaling()
            settVis(false)
          }}
        >
          Skjul
        </button>
      </div>
    </div>
  )
}
