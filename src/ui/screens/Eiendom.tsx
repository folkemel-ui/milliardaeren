import { useCallback, useState } from 'react'
import {
  EIENDOM_SYNLIG_VED,
  EIENDOMSSTIGEN,
  EIENDOMSTYPER,
  eiendomsverdi,
  leiePerSek,
} from '../../engine/eiendom'
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
import { Ikon } from '../komponenter/Ikoner'

export function Eiendom({ s }: { s: Spilltilstand }) {
  const [by, settBy] = useState<By | null>(null)
  const [kart, settKart] = useState<'norge' | 'verden'>('norge')
  // Byen som vises i gatebildet, eller null.
  const [gate, settGate] = useState<By | null>(null)
  const synlige = EIENDOMSSTIGEN.filter((id) => eiendomSynlig(s, id))
  const viste = by ? synlige.filter((id) => EIENDOMSTYPER[id].by === by) : synlige
  const nesteSkjult = EIENDOMSSTIGEN.find((id) => !eiendomSynlig(s, id))
  const indeks = s.marked.eiendom
  const lukkGate = useCallback(() => settGate(null), [])
  const indeksEndring = indeks.historikk.length ? indeks.kurs / indeks.historikk[0] - 1 : 0

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
                settKart(k)
                settBy(null)
              }}
            >
              {k === 'norge' ? 'Norge' : 'Verden'}
            </button>
          ))}
        </div>
        {kart === 'norge' ? <Norgeskart s={s} valgt={by} velg={settBy} zoom={settGate} /> : <Verdenskart s={s} valgt={by} velg={settBy} zoom={settGate} />}
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
        <p className="dempet liten">Leien kommer også mens du er borte — eiendom trenger ingen leder. Trykk på en by for å vise bare den, og hold inne for gatebildet.</p>
      </div>

      {by && (
        <div className="filterrad">
          <button className="filterbrikke" onClick={() => settBy(null)}>
            Viser {by} · <strong>Vis alle</strong> ✕
          </button>
          <button className="filterbrikke" onClick={() => settGate(by)}>
            <Ikon navn="sok" størrelse={14} /> Gatebildet
          </button>
        </div>
      )}
      {gate && <Gatebilde s={s} by={gate} lukk={lukkGate} />}

      <Seksjon
        id="eiendom-boliger"
        tittel="Boliger og bygg"
        forklaring="eiendom"
        sammendrag={`${Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0)} eid`}
        harInnhold={Object.keys(s.eiendommer).length > 0 || !!by}
      >
      <ul className="kortliste">
        {viste.map((id) => (
          <Eiendomskort key={id} s={s} id={id} />
        ))}
        {by && viste.length === 0 && <p className="kort kort-tomt">Ingen eiendommer til salgs i {by} ennå.</p>}
        {!by && nesteSkjult && (
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

      <Jordliste s={s} by={by} />
      {!by && <Landemerkeliste s={s} />}
    </section>
  )
}
