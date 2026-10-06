import { EIENDOMSTYPER, eiendomspris, eierHeleByen, enheterI, kanReiseTil } from '../../engine/eiendom'
import { kjopEiendom } from '../../engine/handlinger'
import { regionFor, REGIONER } from '../../engine/regioner'
import type { By, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { endring, kortKroner, perSek } from '../format'
import { leieIBy, trendFor } from '../kart'
import { iByen } from './Byvisning'
import { Ikon } from './Ikoner'

/**
 * Bykortet (Pakke 46): et lite kort på selve kartet når du trykker på en by —
 * pristrend, leie, veien mot å eie byen, og en kjøpsknapp per bygg. Byvisningen
 * under kartet har hele lista; «Se byen» tar deg dit.
 *
 * `x` og `y` er byens plass i kartet, som andel (0–1) av bredden og høyden.
 * Kortet står på den siden av byen der det er plass.
 */
export function Bykort({ s, by, x, y, lukk }: { s: Spilltilstand; by: By; x: number; y: number; lukk: () => void }) {
  const { bygg } = iByen(s, by)
  const trend = trendFor(s, by)
  const region = regionFor(by)
  const leie = leieIBy(s, by)
  const enheter = enheterI(s, by)
  const ledige = bygg.filter((id) => (s.eiendommer[id] ?? 0) < EIENDOMSTYPER[id].maksAntall)
  const venstre = x > 0.55
  const stil = {
    left: venstre ? undefined : `calc(${x * 100}% + 14px)`,
    right: venstre ? `calc(${(1 - x) * 100}% + 14px)` : undefined,
    // I øvre halvdel henger kortet nedover fra byen, i nedre halvdel står det oppover, så det holder seg inne i kartet.
    top: y < 0.5 ? `${Math.max(0.02, y - 0.08) * 100}%` : undefined,
    bottom: y < 0.5 ? undefined : `${Math.max(0.02, 1 - y - 0.08) * 100}%`,
  }
  return (
    <div className="bykort" style={stil} role="dialog" aria-label={`${by}: kort`} data-ingen-sveip>
      <div className="bykort-topp">
        <strong>
          {eierHeleByen(s, by) && (
            <span className="gull" aria-label="Du eier hele byen">
              <Ikon navn="krone" størrelse={13} />{' '}
            </span>
          )}
          {by}
        </strong>
        <button className="bykort-lukk" onClick={lukk} aria-label="Lukk bykortet">
          ✕
        </button>
      </div>
      <span className="dempet liten">
        {region ? REGIONER[region].navn : 'Følger landet'} <span className={trend >= 0 ? 'pluss' : 'minus'}>{endring(trend)}</span>
        {leie > 0 && (
          <>
            {' '}
            · <span className="pluss">{perSek(leie)}</span>
          </>
        )}
      </span>
      {enheter.av > 0 && (
        <span className="bykort-spor" aria-label={`${enheter.eid} av ${enheter.av} enheter`}>
          <span style={{ width: `${(enheter.eid / enheter.av) * 100}%` }} />
        </span>
      )}
      {/* Bare det som er igjen å kjøpe, og høyst to — kortet skal ikke dekke kartet. */}
      {ledige.slice(0, 2).map((id) => {
        const t = EIENDOMSTYPER[id]
        const pris = eiendomspris(s, id)
        return (
          <button
            key={id}
            className="knapp knapp-liten bykort-kjop"
            disabled={!kanReiseTil(s, id) || s.kontanter < pris}
            onClick={() => utfor(kjopEiendom(s, id))}
          >
            <span>{t.navn}</span>
            <span>{kortKroner(pris)}</span>
          </button>
        )
      })}
      {bygg.length === 0 && <span className="dempet liten">Ingen bygg til salgs her ennå.</span>}
      {bygg.length > 0 && ledige.length === 0 && <span className="dempet liten">Alt du kan kjøpe her, er ditt.</span>}
      <button className="lenkeknapp liten" onClick={() => document.querySelector('.byvisning')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
        Se byen
      </button>
    </div>
  )
}
