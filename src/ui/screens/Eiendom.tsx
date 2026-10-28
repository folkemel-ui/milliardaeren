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
import { eierDu, LANDEMERKELISTE, LANDEMERKER } from '../../engine/landemerker'
import { Byvisning, byerMedInnhold } from '../komponenter/Byvisning'
import { leieIBy } from '../kart'
import { eiendomSynlig } from '../../engine/handlinger'
import type { By, Spilltilstand } from '../../engine/types'
import { endring, kortKroner, perSek } from '../format'
import { Minigraf } from '../komponenter/Linjegraf'
import { Norgeskart } from '../komponenter/Norgeskart'
import { Verdenskart } from '../komponenter/Verdenskart'
import { Jordliste, Landemerkeliste, Landkort } from '../komponenter/JordOgLandemerker'
import { Seksjon } from '../komponenter/Seksjon'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Gatebilde } from '../komponenter/Gatebilde'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { EIENDOMSREKKEFOLGER, eiendomsrekkefolge } from '../deler'
import { sorterEiendom } from '../sortering'
import { REGIONER, REGIONLISTE, regionEndring } from '../../engine/regioner'
import { RulleTall } from '../komponenter/RulleTall'
import { kartdel } from '../deler'
import { useTilbake } from '../tilbake'

/** Kartet står åpent til du eier noe i så mange byer; så foldes det til en stripe (Pakke 131). */
export const KART_FOLDES_FRA = 5

/** Eier du noe i byen: et bygg, og i Norge en gård, skog eller et landemerke. */
function eiendomIBy(s: Spilltilstand, by: By, norge: boolean): boolean {
  if (EIENDOMSSTIGEN.some((id) => EIENDOMSTYPER[id].by === by && (s.eiendommer[id] ?? 0) > 0)) return true
  if (!norge) return false
  return JORDLISTE.some((id) => JORD[id].by === by && s.jord?.[id]) || LANDEMERKELISTE.some((id) => LANDEMERKER[id].by === by && eierDu(s, id))
}

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
  // Norge/Verden-bryteren filtrerer lista også (Pakke 65): ute er det som krever fly.
  const iDenneDelen = (id: (typeof EIENDOMSSTIGEN)[number]) => !!EIENDOMSTYPER[id].reise === (kart === 'verden')
  // Rekkefølgen huskes, som bedriftenes (Pakke 75).
  const rekkefolge = eiendomsrekkefolge.bruk()
  const synlige = sorterEiendom(
    EIENDOMSSTIGEN.filter((id) => iDenneDelen(id) && eiendomSynlig(s, id)),
    rekkefolge,
  )
  const eidHer = synlige.reduce((sum, id) => sum + (s.eiendommer[id] ?? 0), 0)
  const byer = byerMedInnhold(s, kart === 'norge' ? NORSKE_BYER : UTENLANDSBYER)
  const nesteSkjult = EIENDOMSSTIGEN.find((id) => iDenneDelen(id) && !eiendomSynlig(s, id))
  const indeks = s.marked.eiendom
  const lukkGate = useCallback(() => settGate(null), [])
  const indeksEndring = indeks.historikk.length ? indeks.kurs / indeks.historikk[0] - 1 : 0
  // Pakke 131: lista gruppert etter by, i kartets og by-knappenes rekkefølge; Pris/Leie sorterer inne i hver by.
  const grupper = (kart === 'norge' ? NORSKE_BYER : UTENLANDSBYER)
    .map((b) => ({ by: b, ider: synlige.filter((id) => EIENDOMSTYPER[id].by === b) }))
    .filter((g) => g.ider.length > 0)
  // Kartet foldes sammen fra fem byer du eier noe i (Pakke 131); før det står det åpent.
  const eideByer = byer.filter((b) => eiendomIBy(s, b, kart === 'norge')).length
  // Leia fra byggene i byene; gårdene og skogene tjener med høsten, ikke per sekund.
  const byleie = byer.reduce((sum, b) => sum + leieIBy(s, b), 0)
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
        <Seksjon
          id={kart === 'norge' ? 'eiendom-kart' : 'eiendom-kart-ute'}
          tittel="Kartet"
          sammendrag={`${eideByer} ${eideByer === 1 ? 'by' : 'byer'}${byleie > 0 ? ` · ${perSek(byleie)}` : ''}`}
          harInnhold={eideByer < KART_FOLDES_FRA}
        >
          {kart === 'norge' ? <Norgeskart s={s} valgt={by} velg={settBy} zoom={settGate} /> : <Verdenskart s={s} valgt={by} velg={settBy} zoom={settGate} />}
        </Seksjon>
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
        <p className="dempet liten">Leien kommer også mens du er borte — eiendom trenger ingen leder. Norge og Verden viser hver sine eiendommer. Velg en by for å se bare den, og hold inne på kartet for gatebildet.</p>
      </div>

      {gate && <Gatebilde s={s} by={gate} lukk={lukkGate} />}

      {/* Pakke 112: gårdene og skogene øverst, med ukas høst og det som venter. */}
      {kart === 'norge' && !by && <Landkort s={s} />}

      {by ? (
        <Byvisning s={s} by={by} lukk={() => settBy(null)} gatebilde={() => settGate(by)} />
      ) : (
        <>

      <Seksjon
        id={kart === 'norge' ? 'eiendom-boliger' : 'eiendom-boliger-ute'}
        tittel={kart === 'norge' ? 'Boliger og bygg' : 'Boliger og bygg ute'}
        forklaring="eiendom"
        sammendrag={`${eidHer} eid`}
        harInnhold={eidHer > 0}
      >
      {synlige.length >= 3 && (
        <div className="segment rekkefolge" role="radiogroup" aria-label="Rekkefølge på eiendommene">
          {EIENDOMSREKKEFOLGER.map((r) => (
            <button key={r.id} role="radio" aria-checked={rekkefolge === r.id} className={rekkefolge === r.id ? 'aktiv' : ''} onClick={() => eiendomsrekkefolge.sett(r.id)}>
              {r.navn}
            </button>
          ))}
        </div>
      )}
      {grupper.map((g) => {
        const eid = g.ider.reduce((n, id) => n + (s.eiendommer[id] ?? 0), 0)
        return (
          <Seksjon
            key={g.by}
            id={`eiendom-by-${g.by}`}
            tittel={g.by}
            sammendrag={eid > 0 ? `${eid} eid · ${perSek(leieIBy(s, g.by))}` : 'Til salgs'}
            // Eier du ingenting her ennå, står alle byene åpne, så det første kjøpet ikke ligger bak to trykk.
            harInnhold={eid > 0 || eidHer === 0}
            under
          >
            <ul className="kortliste">
              {g.ider.map((id) => (
                <Eiendomskort key={id} s={s} id={id} somRad />
              ))}
            </ul>
          </Seksjon>
        )
      })}
      <ul className="kortliste">
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

      {/* Gårder, skog og landemerker finnes bare i Norge. */}
      {kart === 'norge' && (
        <>
          <Jordliste s={s} by={null} />
          <Landemerkeliste s={s} />
        </>
      )}
        </>
      )}
    </section>
  )
}
