import { useCallback, useEffect, useState } from 'react'
import { aapneTing, FANE_FOR, useTing } from '../detaljvisning'
import { Tingdetalj } from './Tingdetalj'
import {
  EIENDOM_SYNLIG_VED,
  EIENDOMSSTIGEN,
  EIENDOMSTYPER,
  eiendomsverdi,
  leiePerSek,
  UTENLANDSBYER,
} from '../../engine/eiendom'
import { JORD, JORDLISTE } from '../../engine/jord'
import { LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { Byvisning, byerMedInnhold } from '../komponenter/Byvisning'
import { eiendomSynlig } from '../../engine/handlinger'
import type { By, Spilltilstand } from '../../engine/types'
import { endring, kortKroner, perSek } from '../format'
import { Minigraf } from '../komponenter/Linjegraf'
import { Norgeskart } from '../komponenter/Norgeskart'
import { Verdenskart } from '../komponenter/Verdenskart'
import { Jordliste, Landemerkeliste } from '../komponenter/JordOgLandemerker'
import { Seksjon } from '../komponenter/Seksjon'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Gatebilde } from '../komponenter/Gatebilde'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { REGIONER, REGIONLISTE, regionEndring } from '../../engine/regioner'
import { RulleTall } from '../komponenter/RulleTall'
import { kartdel } from '../deler'
import { useTilbake } from '../tilbake'

/** Byene i Norge, i stigens rekkefølge: først byggene, så jorda og landemerkene. */
const NORSKE_BYER: By[] = [
  ...new Set<By>([
    ...EIENDOMSSTIGEN.filter((id) => !EIENDOMSTYPER[id].reise).map((id) => EIENDOMSTYPER[id].by),
    ...JORDLISTE.map((id) => JORD[id].by),
    ...LANDEMERKELISTE.map((id) => LANDEMERKER[id].by),
  ]),
]

export function Eiendom({ s }: { s: Spilltilstand }) {
  const [by, settBy] = useState<By | null>(null)
  // Norge eller Verden huskes, som delene i de andre fanene (Pakke 61).
  const kart = kartdel.bruk()
  // Byen som vises i gatebildet, eller null.
  const [gate, settGate] = useState<By | null>(null)
  const synlige = EIENDOMSSTIGEN.filter((id) => eiendomSynlig(s, id))
  const byer = byerMedInnhold(s, kart === 'norge' ? NORSKE_BYER : UTENLANDSBYER)
  const nesteSkjult = EIENDOMSSTIGEN.find((id) => !eiendomSynlig(s, id))
  const indeks = s.marked.eiendom
  const lukkGate = useCallback(() => settGate(null), [])
  const indeksEndring = indeks.historikk.length ? indeks.kurs / indeks.historikk[0] - 1 : 0
  const ting = useTing()
  // Detaljsiden lukkes når du bytter fane.
  useEffect(() => () => aapneTing(null), [])
  // En by, og en detaljside over den, er hvert sitt steg tilbake.
  useTilbake(by !== null, () => settBy(null))
  const egenTing = ting !== null && FANE_FOR[ting.slag] === 'eiendom'
  useTilbake(egenTing, () => aapneTing(null))
  if (ting && egenTing) return <Tingdetalj s={s} ting={ting} tilbake={() => aapneTing(null)} fane="Eiendom" />

  return (
    <section className="skjerm">
      <h1 className="skjerm-tittel">Eiendom</h1>

      <div className="kort eiendom-sammendrag">
        <div className="bank-rad">
          <div>
            <span className="etikett">Eiendommene dine</span>
            <span className="tall-stort">
              <RulleTall verdi={eiendomsverdi(s)} format={kortKroner} />
            </span>
          </div>
          <div className="bank-rente">
            <span className="etikett">Leie</span>
            <span className="pluss">{perSek(leiePerSek(s))}</span>
          </div>
        </div>
        <div className="segment" role="tablist" aria-label="Kart">
          {(['norge', 'verden'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={kart === k}
              className={kart === k ? 'aktiv' : ''}
              onClick={() => {
                kartdel.sett(k)
                settBy(null)
              }}
            >
              {k === 'norge' ? 'Norge' : 'Verden'}
            </button>
          ))}
        </div>
        {kart === 'norge' ? <Norgeskart s={s} valgt={by} velg={settBy} zoom={settGate} /> : <Verdenskart s={s} valgt={by} velg={settBy} zoom={settGate} />}
        {byer.length > 1 && (
          <div className="byvalg" role="tablist" aria-label="Velg by">
            <button role="tab" aria-selected={by === null} className={by === null ? 'aktiv' : ''} onClick={() => settBy(null)}>
              Alle
            </button>
            {byer.map((b) => (
              <button key={b} role="tab" aria-selected={by === b} className={by === b ? 'aktiv' : ''} onClick={() => settBy(b)}>
                {b}
              </button>
            ))}
          </div>
        )}
        <div className="indeks">
          <div>
            <span className="etikett">Eiendomsprisene</span>
            <span className={indeksEndring >= 0 ? 'pluss liten' : 'minus liten'}>{endring(indeksEndring)} siste 2 t</span>
          </div>
          <Minigraf verdier={[...indeks.historikk, indeks.kurs]} />
        </div>
        {kart === 'norge' && (
          <ul className="regionpriser" aria-label="Prisene per region, siste 2 timer">
            {REGIONLISTE.map((r) => {
              const e = regionEndring(s, r)
              return (
                <li key={r}>
                  <span className="dempet">{REGIONER[r].navn}</span> <span className={e >= 0 ? 'pluss' : 'minus'}>{endring(e)}</span>
                </li>
              )
            })}
          </ul>
        )}
        <p className="dempet liten">Leien kommer også mens du er borte — eiendom trenger ingen leder. Velg en by for å se bare den, og hold inne på kartet for gatebildet.</p>
      </div>

      {gate && <Gatebilde s={s} by={gate} lukk={lukkGate} />}

      {by ? (
        <Byvisning s={s} by={by} lukk={() => settBy(null)} gatebilde={() => settGate(by)} />
      ) : (
        <>

      <Seksjon
        id="eiendom-boliger"
        tittel="Boliger og bygg"
        forklaring="eiendom"
        sammendrag={`${Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0)} eid`}
        harInnhold={Object.keys(s.eiendommer).length > 0}
      >
      <ul className="kortliste">
        {synlige.map((id) => (
          <Eiendomskort key={id} s={s} id={id} />
        ))}
        {nesteSkjult && (
          <li className="kort kjopskort laast">
            <BedriftIkon type={nesteSkjult} dempet />
            <div className="bedriftskort-midt">
              <h2>{EIENDOMSTYPER[nesteSkjult].navn}</h2>
              <span className="dempet liten">
                Til salgs når nettoformuen har vært {kortKroner(EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)}
              </span>
              <div className="milepael-spor">
                <div
                  className="milepael-fyll"
                  style={{ width: `${Math.min(1, s.hoyesteFormue / (EIENDOMSTYPER[nesteSkjult].pris * EIENDOM_SYNLIG_VED)) * 100}%` }}
                />
              </div>
            </div>
          </li>
        )}
      </ul>
      </Seksjon>

      <Jordliste s={s} by={null} />
      <Landemerkeliste s={s} />
        </>
      )}
    </section>
  )
}
