import type { ReactNode } from 'react'
import { EIENDOMSTYPER, eiendomspris, KATEGORINAVN, LAGER, LAGER_FOR, leieHverPerSek, LUKSUS, restverdi } from '../../engine/eiendom'
import { JORD, landverdi, tommerverdi, vaer } from '../../engine/jord'
import { KUNSTNERE, MALERIER, maleripris } from '../../engine/kunst'
import { eierDu, LANDEMERKER, landemerkepris } from '../../engine/landemerker'
import { dagnummer } from '../../engine/kalender'
import type { EiendomId, JordId, LandemerkeId, LuksusId, MaleriId, Spilltilstand } from '../../engine/types'
import type { Ting } from '../detaljvisning'
import { fortegnKroner, kortKroner, perSek, tall } from '../format'
import { Eiendomskort } from '../komponenter/Eiendomskort'
import { Jordkort, Landemerkekort } from '../komponenter/JordOgLandemerker'
import { Malerikort } from '../komponenter/Kunst'
import { useVoksUt } from '../overgang'
import { Luksuskort } from './Luksus'

/**
 * Detaljsiden for noe du kan eie (G7), som bedriftene har: den store scenen
 * øverst — der tegningene beveger seg — kortet med knappene, og noen tall som
 * ikke får plass på kortet i lista. Siden vokser ut av kortet du trykket på.
 */
export function Tingdetalj({ s, ting, tilbake, fane }: { s: Spilltilstand; ting: Ting; tilbake: () => void; fane: string }) {
  const voks = useVoksUt<HTMLElement>()
  const [kort, fakta] = innhold(s, ting)
  return (
    <section className="skjerm detalj tingdetalj" ref={voks}>
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

type Fakta = [string, ReactNode][]

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
      return [<Jordkort s={s} id={id as JordId} iDetalj />, fakta]
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
      if (eier && lager) fakta.push(['Står i', LAGER[lager].bestemt])
      return [<Luksuskort s={s} id={id as LuksusId} iDetalj />, fakta]
    }
    case 'maleri': {
      const m = MALERIER[id as MaleriId]
      const eid = s.kunst.eide[id as MaleriId]
      const pris = maleripris(s, id as MaleriId)
      const fakta: Fakta = [
        ['Kunstner', KUNSTNERE[m.kunstner].navn],
        ['Malt', String(m.aar)],
        ['Verdi nå', kortKroner(pris)],
      ]
      if (eid) fakta.push(['Kjøpt for', `${kortKroner(eid.kostpris)} (${fortegnKroner(pris - eid.kostpris)})`])
      return [<Malerikort s={s} id={id as MaleriId} iDetalj />, fakta]
    }
  }
}
