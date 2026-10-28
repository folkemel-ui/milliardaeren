import { KATEGORINAVN, LUKSUS, LUKSUSLISTE } from '../../engine/eiendom'
import type { LuksusKategori, Spilltilstand } from '../../engine/types'
import { UNIKE, UNIKLISTE } from '../../engine/unike'
import { aapneTing } from '../detaljvisning'
import { Illustrasjon } from './Illustrasjoner'

/** Nærbildet i oversikten. Fast, så Illustrasjon (memo) ikke tegnes på nytt hvert sekund (Pakke 64). */
const NAER_IKON = [40, 34] as const

const KATEGORIER: LuksusKategori[] = ['bil', 'klokke', 'baat', 'fly']

/**
 * Hele samlingen på ett kort (Pakke 91): en rad per slag med en silhuett av hver
 * ting, fylt inn når du eier den. Et trykk åpner tingens side, der du kjøper eller
 * selger. De unike tingene fra auksjonene har sin egen rad i gull, med bare dem du
 * eier: de andre kan bare kjøpes når de er under hammeren, og tolv skygger tok to
 * linjer på en telefon.
 */
/** Så mange 44 px-mål står i bredden på en telefon (315 px), uten luft imellom. */
export const PER_RAD = 7

export function Samlingsoversikt({ s }: { s: Spilltilstand }) {
  const eide = s.luksus.length
  const unikeEid = UNIKLISTE.filter((id) => s.auksjon?.eide[id]).length
  return (
    <div className="kort samlingsoversikt">
      <div className="maal-topp">
        <h2 className="kort-tittel">Samlingen</h2>
        <span className="dempet liten">
          {eide} av {LUKSUSLISTE.length}
          {unikeEid > 0 && ` · ${unikeEid} unik${unikeEid > 1 ? 'e' : ''}`}
        </span>
      </div>
      {KATEGORIER.map((k) => {
        const ider = LUKSUSLISTE.filter((id) => LUKSUS[id].kategori === k).sort((a, b) => LUKSUS[a].pris - LUKSUS[b].pris)
        const mine = ider.filter((id) => s.luksus.includes(id)).length
        return (
          <div key={k} className="samling-rad">
            <span className="samling-navn liten">
              {KATEGORINAVN[k]} <span className="dempet">{mine} av {ider.length}</span>
            </span>
            {/*
              Pakke 132: en gruppe som trenger to rader, deles jevnt (8 → 4 + 4) i stedet for 7 + 1. Sju står i bredden på
              en telefon; færre enn det fyller raden som før.
            */}
            <ul className="samling-ikoner" style={ider.length > PER_RAD ? { maxWidth: `${Math.ceil(ider.length / Math.ceil(ider.length / PER_RAD)) * 44}px` } : undefined}>
              {ider.map((id) => {
                const eier = s.luksus.includes(id)
                return (
                  <li key={id}>
                    <button
                      className={`samling-ting${eier ? ' eid' : ''}`}
                      aria-label={eier ? LUKSUS[id].navn : `${LUKSUS[id].navn}, ikke kjøpt`}
                      onClick={() => aapneTing({ slag: 'luksus', id })}
                    >
                      <span className={eier ? undefined : 'samling-skygge'}>
                        <Illustrasjon id={id} størrelse={36} utklipp naerbilde={NAER_IKON} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      <div className="samling-rad">
        <span className="samling-navn liten">
          <span className="gull">Unike</span>{' '}
          <span className="dempet">
            {unikeEid} av {UNIKLISTE.length} · fra auksjonene
          </span>
        </span>
        {unikeEid > 0 && (
          <ul className="samling-ikoner">
            {UNIKLISTE.filter((id) => s.auksjon?.eide[id]).map((id) => (
              <li key={id}>
                <span className="samling-ting unik eid" role="img" aria-label={UNIKE[id].navn}>
                  <Illustrasjon id={UNIKE[id].tegning} størrelse={36} utklipp naerbilde={NAER_IKON} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
