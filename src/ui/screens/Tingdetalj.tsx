import { useEffect, type ReactNode } from 'react'
import { EIENDOMSTYPER, eiendomspris, KATEGORINAVN, LAGER, LAGER_FOR, leieHverPerSek, LUKSUS, restverdi } from '../../engine/eiendom'
import { JORD, landverdi, ODEL_DAGER, tommerverdi, vaer } from '../../engine/jord'
import { KUNSTNERE, kunstnertrend, MALERIER, maleripris, nesteTrendbytte } from '../../engine/kunst'
import { eierDu, LANDEMERKER, landemerkepris } from '../../engine/landemerker'
import { DAG_SEK, dagnummer } from '../../engine/kalender'
import type { EiendomId, JordId, LandemerkeId, LuksusId, MaleriId, Spilltilstand } from '../../engine/types'
import { HJEM, INNREDNING_VERDI, type HjemId } from '../../engine/hjemmene'
import { hjemTall } from '../romkode'
import { Hjemkort } from '../komponenter/Hjemmene'
import type { Ting } from '../detaljvisning'
import { fortegnKroner, kortKroner, perSek, tall, varighet } from '../format'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { Fjoskort, Gardskart, Gardsnav, Gardsregnskap, Jordkort, Lagerkort, Landemerkekort } from '../komponenter/JordOgLandemerker'
import { aapneGardsside, GARDSSIDER, useGardsside, type Gardsside } from '../gardssider'
import { useTilbake } from '../tilbake'
import { Malerikort } from '../komponenter/Kunst'
import { nattstil } from '../dagognatt'
import { useVoksUt } from '../overgang'
import { charterlinje, Luksuskort } from './Luksus'
import { CHARTERBAR, kanLeiesUt } from '../../engine/charter'

/**
 * Detaljsiden for noe du kan eie (G7), som bedriftene har: den store scenen
 * øverst — der tegningene beveger seg — kortet med knappene, og noen tall som
 * ikke får plass på kortet i lista. Siden vokser ut av kortet du trykket på.
 */
export function Tingdetalj({ s, ting, tilbake, fane }: { s: Spilltilstand; ting: Ting; tilbake: () => void; fane: string }) {
  const voks = useVoksUt<HTMLElement>()
  // Pakke 112: en gård har tre sider; en side er et steg tilbake, og den lukkes med gården.
  const side = useGardsside()
  const gard = ting.slag === 'jord' && JORD[ting.id as JordId].type === 'gard' && !!s.jord[ting.id as JordId]
  const sideAapen = side !== null && gard
  useEffect(() => () => aapneGardsside(null), [ting.id])
  useTilbake(sideAapen, () => aapneGardsside(null))
  if (sideAapen) return <Gardsdetalj s={s} id={ting.id as JordId} side={side} />
  const [kort, fakta] = innhold(s, ting)
  return (
    <section className="skjerm detalj tingdetalj" ref={voks} style={nattstil(s.sek)}>
      <button className="tilbake" onClick={tilbake}>
        ‹ {fane}
      </button>
      <ul className="kortliste tingkort">{kort}</ul>
      {fakta.length > 0 && (
        <dl className="kort rekorder">
          {fakta.map(([navn, verdi]) => (
            <div key={navn}>
              <dt>{navn}</dt>
              <dd>{verdi}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

/**
 * En av gårdens sider (Pakke 112), med tilbake til gården øverst. Siden står i stedet for
 * gårdens side, som klubbens sider gjør i Luksus.
 */
function Gardsdetalj({ s, id, side }: { s: Spilltilstand; id: JordId; side: Gardsside }) {
  const voks = useVoksUt<HTMLElement>()
  return (
    <section className={`skjerm detalj tingdetalj gardsdetalj side-${side}`} ref={voks} style={nattstil(s.sek)}>
      <button className="tilbake" onClick={() => aapneGardsside(null)}>
        ‹ {JORD[id].navn}
      </button>
      <h1 className="skjerm-tittel">{GARDSSIDER.find((d) => d.id === side)!.navn}</h1>
      <ul className="kortliste">
        {side === 'jorder' && <Gardskart s={s} id={id} />}
        {side === 'dyr' && <Fjoskort s={s} id={id} />}
        {side === 'lager' && (
          <>
            <Lagerkort s={s} id={id} />
            <Gardsregnskap s={s} id={id} />
          </>
        )}
      </ul>
    </section>
  )
}

type Fakta = [string, ReactNode][]

/**
 * «I vinden · +2 % i timen · bytter om 3 t 10 min» (Pakke 107). `trend` er per spilldag,
 * `dager` spilldagene til trendene byttes igjen.
 */
function trendtekst(trend: number, dager: number): string {
  const perTime = trend * 12
  const ord = perTime >= 0.015 ? 'I vinden' : perTime >= 0.01 ? 'På vei opp' : perTime > 0 ? 'Stø' : 'Går av moten'
  const p = Math.round(Math.abs(perTime) * 1000) / 10
  return `${ord} · ${perTime > 0 ? '+' : '−'}${tall(p, p % 1 ? 1 : 0)} % i timen · bytter om ${varighet(dager * DAG_SEK)}`
}

function innhold(s: Spilltilstand, { slag, id }: Ting): [ReactNode, Fakta] {
  switch (slag) {
    case 'eiendom': {
      const t = EIENDOMSTYPER[id as EiendomId]
      const eier = s.eiendommer[id as EiendomId] ?? 0
      const fakta: Fakta = [
        ['Sted', t.sted],
        ['Du eier', `${eier} av ${t.maksAntall}`],
      ]
      if (eier > 0) {
        fakta.push(['Leie i alt', perSek(leieHverPerSek(s, id as EiendomId) * eier)])
        fakta.push(['Verdien av dine', kortKroner(eiendomspris(s, id as EiendomId) * eier)])
      }
      return [<Eiendomskort s={s} id={id as EiendomId} iDetalj />, fakta]
    }
    case 'jord': {
      const t = JORD[id as JordId]
      const fakta: Fakta = [
        ['Sted', t.sted],
        ['Verdien av jorda', kortKroner(landverdi(s, id as JordId))],
      ]
      if (t.type === 'skog') fakta.push(['Tømmeret', kortKroner(tommerverdi(s, id as JordId))])
      else fakta.push(['Ukas vær', vaer(dagnummer(s.sek)).navn])
      // Pakke 114: odel etter 90 dager — eller hvor lenge det er igjen.
      const j = s.jord[id as JordId]
      if (j && t.type === 'gard') {
        const igjen = ODEL_DAGER - (dagnummer(s.sek) - (j.eidFra ?? dagnummer(s.sek)))
        fakta.push(['Odel', j.odel ? 'Odelsgård' : `Om ${igjen} ${igjen === 1 ? 'dag' : 'dager'}`])
      }
      // Pakke 112: kortet, og radene som åpner gårdens tre sider — kartet, fjøset og lageret står der.
      return [
        <>
          <Jordkort s={s} id={id as JordId} iDetalj />
          <Gardsnav s={s} id={id as JordId} />
        </>,
        fakta,
      ]
    }
    case 'landemerke': {
      const l = LANDEMERKER[id as LandemerkeId]
      const e = s.landemerker[id as LandemerkeId]
      const eier = eierDu(s, id as LandemerkeId) ? 'Deg' : e ? (s.rivaler.find((r) => r.id === e.eier)?.navn ?? 'En rival') : 'Ingen ennå'
      return [
        <Landemerkekort s={s} id={id as LandemerkeId} iDetalj />,
        [
          ['Sted', l.sted],
          ['Eier', eier],
          ['Verdi', kortKroner(landemerkepris(s, id as LandemerkeId))],
          ['Avkastning', `${tall(l.avkastning * 100, 1)} % per time`],
        ],
      ]
    }
    case 'luksus': {
      const g = LUKSUS[id as LuksusId]
      const eier = s.luksus.includes(id as LuksusId)
      const lager = LAGER_FOR[g.kategori]
      const fakta: Fakta = [
        ['Slag', KATEGORINAVN[g.kategori]],
        ['Status', `+${g.status}`],
        ['Ny pris', kortKroner(g.pris)],
      ]
      if (eier) fakta.push(['Selges for', kortKroner(restverdi(id as LuksusId))])
      if (eier && lager) fakta.push(['Står i', s.charter?.[id as LuksusId] ? 'leid ut' : LAGER[lager].bestemt])
      // Pakke 89: yachtene og jetene kan leies ut — sesongen og det den har tjent.
      if (eier && kanLeiesUt(id as LuksusId)) {
        fakta.push(['Utleie', charterlinje(s, id as LuksusId)])
        fakta.push(['Sesong', CHARTERBAR[id as LuksusId] === 'sommer' ? 'Mai–september' : 'November–mars'])
        const ute = s.charter?.[id as LuksusId]
        if (ute) fakta.push(['Tjent på utleien', kortKroner(ute.tjent)])
      }
      return [<Luksuskort s={s} id={id as LuksusId} iDetalj />, fakta]
    }
    case 'hjem': {
      const h = HJEM[id as HjemId]
      const d = hjemTall(s, id as HjemId)
      const fakta: Fakta = [
        ['Sted', h.sted],
        ['Innredet', `${d.trinn} av ${d.alle} trinn`],
        ['Status fra rommene', `+${d.status}`],
      ]
      if (d.brukt > 0) {
        fakta.push(['Brukt på rommene', kortKroner(d.brukt)])
        fakta.push(['Teller i formuen', kortKroner(d.brukt * INNREDNING_VERDI)])
      }
      return [<Hjemkort s={s} id={id as HjemId} iDetalj />, fakta]
    }
    case 'maleri': {
      const m = MALERIER[id as MaleriId]
      const eid = s.kunst.eide[id as MaleriId]
      const pris = maleripris(s, id as MaleriId)
      const fakta: Fakta = [
        ['Kunstner', KUNSTNERE[m.kunstner].navn],
        ['Malt', String(m.aar)],
        ['Verdi nå', kortKroner(pris)],
        // Pakke 107: trendene byttes hver tiende time, så siden sier hvor kunstneren står nå.
        ['Trend', trendtekst(kunstnertrend(m.kunstner, dagnummer(s.sek)), nesteTrendbytte(dagnummer(s.sek)) - dagnummer(s.sek))],
      ]
      if (eid) fakta.push(['Kjøpt for', `${kortKroner(eid.kostpris)} (${fortegnKroner(pris - eid.kostpris)})`])
      return [<Malerikort s={s} id={id as MaleriId} iDetalj />, fakta]
    }
  }
}
