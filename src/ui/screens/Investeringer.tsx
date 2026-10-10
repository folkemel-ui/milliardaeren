import { useState } from 'react'
import { nettoformue } from '../../engine/formler'
import { forbesliste } from '../../engine/rivaler'
import { type Aktivaklasse } from '../../engine/portefolje'
import type { PapirId, Spilltilstand } from '../../engine/types'
import { Seksjon } from '../komponenter/Seksjon'
import { aktive } from '../../engine/startups'
import { borsdel, INVESTERINGSDELER, investeringsdel, type Investeringsdel } from '../deler'
import { useTilbake } from '../tilbake'
import { Oversikt } from './investeringer/Oversikt'
import { Bors, Papirdetalj } from './investeringer/Bors'
import { Rivaler, Startups } from './investeringer/Selskaper'
import { Bank } from './investeringer/Bank'

const TIL_UNDERFANE: Record<Exclude<Aktivaklasse, 'eiendom'>, Investeringsdel> = {
  aksje: 'bors',
  krypto: 'bors',
  fond: 'bors',
  obligasjon: 'bank',
  rival: 'selskaper',
  startup: 'selskaper',
  sparing: 'bank',
}

export function Investeringer({ s }: { s: Spilltilstand }) {
  // Delen huskes, som Profil og Børs (Pakke 61).
  const fane = investeringsdel.bruk()
  const settFane = investeringsdel.sett
  const [valgt, settValgt] = useState<PapirId | null>(null)
  useTilbake(valgt !== null, () => settValgt(null))

  if (valgt) return <Papirdetalj s={s} id={valgt} tilbake={() => settValgt(null)} />

  return (
    <section className="skjerm">
      <div className="segment" role="tablist" aria-label="Investeringer">
        {INVESTERINGSDELER.map((f) => (
          <button key={f.id} role="tab" aria-selected={fane === f.id} className={fane === f.id ? 'aktiv' : ''} onClick={() => settFane(f.id)}>
            {f.navn}
          </button>
        ))}
      </div>
      {fane === 'oversikt' && (
        <Oversikt
          s={s}
          velg={(k) => {
            // Aksjer og Krypto åpner Børs på riktig liste.
            if (k === 'aksje' || k === 'krypto' || k === 'fond') borsdel.sett(k)
            settFane(TIL_UNDERFANE[k])
          }}
        />
      )}
      {fane === 'bors' && <Bors s={s} velg={settValgt} />}
      {fane === 'selskaper' && (
        <>
          <Seksjon id="selskaper-startups" tittel="Startups" forklaring="startups" sammendrag={`${aktive(s).filter((x) => x.andel > 0).length} med andel`} harInnhold={aktive(s).some((x) => x.andel > 0)}>
            <Startups s={s} />
          </Seksjon>
          <Seksjon id="selskaper-rivaler" tittel="Rivaler" forklaring="rivaler" sammendrag={`Nr. ${forbesliste(s, nettoformue(s)).findIndex((x) => x.deg) + 1} på Forbes-lista`} harInnhold={s.rivaler.some((r) => r.andel > 0)}>
            <Rivaler s={s} />
          </Seksjon>
        </>
      )}
      {fane === 'bank' && <Bank s={s} />}
    </section>
  )
}
