import { AKSJE_FOR, NYHET_DAGER, NYHET_VIRKNING, nyhetsfaktor, TRENDDRIFT } from '../../engine/bransjer'
import { BEDRIFTSTYPER } from '../../engine/innhold'
import { dagnummer } from '../../engine/kalender'
import { PAPIRER } from '../../engine/marked'
import { ukensTrend } from '../../engine/verden'
import type { Bedrift, BedriftstypeId, PapirId, Spilltilstand } from '../../engine/types'
import { endring, kurs as fmtKurs, tall } from '../format'
import { Papirlogo } from './Papirlogo'

/** Ukas trend for en bransje: 'het', 'kald' eller null. */
function trendFor(s: Spilltilstand, type: BedriftstypeId): 'het' | 'kald' | null {
  const t = ukensTrend(s)
  return t.het === type ? 'het' : t.kald === type ? 'kald' : null
}

/** Dager igjen av nyheten som treffer bransjen nå, eller 0. */
function nyhetIgjen(s: Spilltilstand, type: BedriftstypeId): number {
  const dag = dagnummer(s.sek)
  return Math.max(0, ...(s.bransjenyheter ?? []).filter((n) => n.type === type && dag < n.tilDag).map((n) => n.tilDag - dag))
}

/**
 * På en aksje: bransjen den hører til, ukas trend og om du eier en bedrift
 * som merker nyhetene (Pakke 53). Ingenting for aksjer uten bransje.
 */
export function PapirBransje({ s, id }: { s: Spilltilstand; id: PapirId }) {
  const type = PAPIRER[id].bransje
  if (!type) return null
  const navn = BEDRIFTSTYPER[type].navn
  const eier = s.bedrifter.some((b) => b.type === type)
  const trend = trendFor(s, type)
  return (
    <div className="kort bransje">
      <div className="maal-topp">
        <span className="etikett">Bransje</span>
        <strong>{navn}</strong>
      </div>
      {trend && (
        <p className={`liten ${trend === 'het' ? 'pluss' : 'minus'}`}>
          {trend === 'het' ? 'Het' : 'Kald'} bransje denne uka: {trend === 'het' ? '+' : '−'}
          {tall(TRENDDRIFT * 100)} % i timen ekstra for aksjen.
        </p>
      )}
      <p className="dempet liten">
        {eier
          ? `Du eier en bedrift i bransjen: en god nyhet for ${PAPIRER[id].navn} gir den +${tall(NYHET_VIRKNING * 100)} % inntekt i ${NYHET_DAGER} dager, en dårlig −${tall(NYHET_VIRKNING * 100)} %.`
          : `Ukas trend for ${navn.toLowerCase()} flytter kursen. Eier du en bedrift i bransjen, merker den også nyhetene om selskapet.`}
      </p>
    </div>
  )
}

/** På en bedrift: aksjen i samme bransje, ukas trend og nyheter som virker nå (Pakke 53). */
export function BedriftBorsen({ s, b }: { s: Spilltilstand; b: Bedrift }) {
  const id = AKSJE_FOR[b.type]
  if (!id) return null
  const k = s.marked.kurser[id]
  const forrige = s.forrigeDag.kurser?.[id] ?? k.kurs
  const iDag = k.kurs / forrige - 1
  const f = nyhetsfaktor(s, b.type)
  const igjen = nyhetIgjen(s, b.type)
  return (
    <div className="kort bransje">
      <div className="maal-topp">
        <span className="etikett">På børsen</span>
        <span className="bransje-aksje">
          <Papirlogo id={id} størrelse={20} /> <strong>{PAPIRER[id].navn}</strong>
        </span>
      </div>
      <p className="liten">
        {fmtKurs(k.kurs)} <span className={iDag >= 0 ? 'pluss' : 'minus'}>{endring(iDag)} i dag</span>
      </p>
      {f !== 1 && (
        <p className={`liten ${f > 1 ? 'pluss' : 'minus'}`}>
          Nyheten om selskapet gir bedriften din {f > 1 ? '+' : '−'}
          {tall(Math.abs(f - 1) * 100)} % inntekt i {igjen} {igjen === 1 ? 'dag' : 'dager'} til.
        </p>
      )}
      <p className="dempet liten">Gode og dårlige nyheter om selskapet treffer også bedriften din, og ukas trend for bransjen flytter aksjen.</p>
    </div>
  )
}
