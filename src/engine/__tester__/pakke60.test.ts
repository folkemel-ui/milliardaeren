/**
 * Pakke 60 — det gode liv: hjemmene du innreder, og «Uka di» i søndagsavisa.
 */

import { describe, expect, it } from 'vitest'
import { innred, kjopPapir } from '../handlinger'
import { HJEM, HJEMLISTE, hjemstatus, hjemverdi, INNREDNING_VERDI, ROM, ROMLISTE } from '../hjemmene'
import { statuspoeng } from '../eiendom'
import { nettoformue } from '../formler'
import { sjekkPrestasjoner } from '../prestasjoner'
import { DAG_SEK, ukedag } from '../kalender'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import type { Oppgjor, Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rikt(formue = 1e11): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = formue
  s.hoyesteFormue = formue
  return s
}

describe('hjemmene', () => {
  it('tre hjem med tre rom i tre trinn, rundt 200 statuspoeng til sammen', () => {
    expect(HJEMLISTE).toEqual(['oslo', 'hytta', 'feriehuset'])
    for (const h of HJEMLISTE) expect(HJEM[h].rom).toHaveLength(3)
    const total = ROMLISTE.reduce((sum, r) => sum + ROM[r].trinn.reduce((n, t) => n + t.status, 0), 0)
    expect(total).toBeGreaterThan(180)
    expect(total).toBeLessThan(240)
    // Hvert trinn er dyrere og gir mer enn det forrige.
    for (const r of ROMLISTE) {
      const t = ROM[r].trinn
      for (let i = 1; i < t.length; i++) {
        expect(t[i].pris, r).toBeGreaterThan(t[i - 1].pris)
        expect(t[i].status, r).toBeGreaterThan(t[i - 1].status)
      }
    }
  })

  it('et trinn gir status, og halve prisen teller i formuen', () => {
    const s = rikt()
    const før = nettoformue(s)
    const statusFør = statuspoeng(s)
    const n = ok(innred(s, 'kjokken'))
    const trinn = ROM.kjokken.trinn[0]
    expect(n.hjem?.kjokken).toBe(1)
    expect(s.kontanter - n.kontanter).toBe(trinn.pris)
    expect(statuspoeng(n) - statusFør).toBe(trinn.status)
    expect(hjemverdi(n)).toBe(trinn.pris * INNREDNING_VERDI)
    expect(nettoformue(n) - før).toBeCloseTo(-trinn.pris * (1 - INNREDNING_VERDI))
  })

  it('trinnene tas i rekkefølge, og et rom kan bli ferdig', () => {
    let s = rikt()
    for (let i = 0; i < 3; i++) s = ok(innred(s, 'stue'))
    expect(s.hjem?.stue).toBe(3)
    const u = innred(s, 'stue')
    expect(u.ok ? '' : u.feil).toMatch(/ferdig innredet/)
  })

  it('hjemmene åpner etter formuen: feriehuset først ved en milliard', () => {
    const s = rikt(60_000_000)
    expect(innred(s, 'kjokken').ok).toBe(true)
    expect(innred(s, 'peisestue').ok).toBe(true)
    const u = innred(s, 'terrasse')
    expect(u.ok ? '' : u.feil).toMatch(/Feriehuset er ikke ditt/)
  })

  it('uten innredning er status og formue nøyaktig som før', () => {
    const s = rikt()
    expect(hjemstatus(s)).toBe(0)
    expect(hjemverdi(s)).toBe(0)
  })

  it('gir Innflyttingsfest og Drømmehjem', () => {
    let s = ok(innred(rikt(), 'vinkjeller'))
    sjekkPrestasjoner(s)
    expect(s.prestasjoner.innflytting).toBeDefined()
    expect(s.prestasjoner.drommehjem).toBeUndefined()
    s.kontanter = 1e12
    for (const r of ROMLISTE) while ((s.hjem?.[r] ?? 0) < ROM[r].trinn.length) s = ok(innred(s, r))
    sjekkPrestasjoner(s)
    expect(s.prestasjoner.drommehjem).toBeDefined()
    expect(hjemstatus(s)).toBe(ROMLISTE.reduce((sum, r) => sum + ROM[r].trinn.reduce((n, t) => n + t.status, 0), 0))
  })
})

describe('«Uka di» i søndagsavisa', () => {
  /** Spiller to ukeoppgjør: kjøp i første uke, eid hele andre uke. */
  function toUker(): { s: Spilltilstand; første: Oppgjor; andre: Oppgjor } {
    let s = rikt(1e9)
    s = ok(kjopPapir(s, 'NFS', 1000))
    s = simuler(s, 2 * DAG_SEK)
    s = ok(kjopPapir(s, 'FJK', 500))
    const uker = () => s.oppgjor.filter((o) => o.periode === 'uke')
    while (uker().length < 2) s = simuler(s, DAG_SEK)
    return { s, første: uker()[0], andre: uker()[1] }
  }

  it('står i søndagsavisa, med formuen dag for dag', () => {
    const { s, andre } = toUker()
    expect(ukedag(andre.tilDag * DAG_SEK)).toBe(6)
    const utgave = s.avis.find((u) => u.dag === andre.tilDag)!
    expect(utgave.oppgjor?.some((x) => x.periode === 'uke' && x.formuekurve)).toBe(true)
    // En hel uke: formuen ved starten av hver av de sju dagene, og ved slutten.
    expect(andre.tilDag - andre.fraDag).toBe(7)
    expect(andre.formuekurve).toHaveLength(8)
    expect(andre.formuekurve![0]).toBeCloseTo(andre.formueFor)
    expect(andre.formuekurve!.at(-1)).toBe(andre.formueEtter)
  })

  it('har Forbes-lista med deg, kjøpt og solgt, og ukas beste og verste investering', () => {
    const { første, andre } = toUker()
    expect(andre.forbes!.some((p) => p.deg)).toBe(true)
    expect(andre.forbes!.length).toBeLessThanOrEqual(6)
    // Kjøpene står i uka de ble gjort.
    const aksjer = første.handel!.find((h) => h.klasse === 'aksje')!
    expect(aksjer.kjopt).toBeGreaterThan(0)
    expect(aksjer.solgt).toBe(0)
    expect(andre.handel).toEqual([])
    // Andre uke eide du begge aksjene hele tiden.
    expect(andre.besteInvestering).toBeDefined()
    expect(andre.versteInvestering).toBeDefined()
    expect([andre.besteInvestering!.navn, andre.versteInvestering!.navn].sort()).toEqual(['Fjellkraft', 'Nordfjord Sjømat'])
    expect(andre.besteInvestering!.endring).toBeGreaterThanOrEqual(andre.versteInvestering!.endring)
  })

  it('en ukestart fra før Pakke 60 gir et vanlig oppgjør uten handel og investeringer', () => {
    let s = rikt(1e9)
    delete s.ukestart.handel
    delete s.ukestart.enhetspriser
    while (!s.oppgjor.some((o) => o.periode === 'uke')) s = simuler(s, DAG_SEK)
    const o = s.oppgjor.find((x) => x.periode === 'uke')!
    expect(o.handel).toBeUndefined()
    expect(o.besteInvestering).toBeUndefined()
    expect(o.forbes!.length).toBeGreaterThan(0)
  })
})
