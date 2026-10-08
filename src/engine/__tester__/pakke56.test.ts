/**
 * Pakke 56 — rettferdige markeder. Tre måter å tjene sikre penger på,
 * gjenskapt slik de ble funnet i kodegjennomgangen 8. oktober, og stengt:
 * aksjer kjøpt i biter og solgt i ett, fond som ble pumpet via medlemmene, og
 * obligasjoner som bare kunne stige når høykonjunkturen tok slutt.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { kjopFond, kjopObligasjon, kjopPapir, nyOrdre, selgFond, selgObligasjon, selgPapir } from '../handlinger'
import { fondskurs } from '../fond'
import { maksKjop } from '../formler'
import { handelskurs, KURTASJE, maksPerOrdre, PAPIRER } from '../marked'
import { markedsrente, obligasjonsverdiFor, OBLIGASJONER } from '../obligasjoner'
import { DAG_SEK } from '../kalender'
import { FASE_DAGER, FASER, FASESJANSE, faseI, styringsrente, type Fase } from '../verden'
import { simuler } from '../simulering'
import { nyttSpill } from '../start'
import { migrer } from '../../state/migrering'
import type { PapirId, Spilltilstand } from '../types'

const ok = (u: { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }) => {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et rikt spill på en hverdag, så børsen er åpen. */
function rikt(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e11
  s.hoyesteFormue = 1e12
  return s
}

/** Selger alt av et papir, i så mange ordrer som trengs. */
function selgAlt(s: Spilltilstand, id: PapirId): Spilltilstand {
  for (let i = 0; i < 100 && s.beholdning[id]; i++) s = ok(selgPapir(s, id, Math.min(s.beholdning[id]!.antall, maksPerOrdre(s, id, 'selg'))))
  return s
}

describe('aksjer og krypto: hver krone flytter kursen like mye', () => {
  it('mange kjøp og ett salg gir ingen gevinst — før +113 % på Vikingtoken', () => {
    for (const id of ['VKT', 'NFS', 'BMT'] as PapirId[]) {
      let s = rikt()
      const start = s.kontanter
      const kurs = s.marked.kurser[id].kurs
      for (let i = 0; i < 10; i++) s = ok(kjopPapir(s, id, maksPerOrdre(s, id, 'kjop')))
      const brukt = start - s.kontanter
      s = selgAlt(s, id)
      // Uten tid imellom går kjøpene og salgene i null — bare kurtasjen er borte.
      expect(s.kontanter - start, id).toBeLessThan(0)
      expect(s.kontanter - start, id).toBeGreaterThan(-2.1 * KURTASJE * brukt)
      expect(s.marked.kurser[id].kurs / kurs, id).toBeCloseTo(1, 3)
    }
  })

  it('å dele en ordre endrer ikke hva den koster', () => {
    const s = rikt()
    // Aksjer handles i hele stykk: et antall delelig med fire.
    const q = 4 * Math.floor(maksPerOrdre(s, 'NFS', 'kjop') * 0.2)
    const ett = ok(kjopPapir(s, 'NFS', q))
    let delt = s
    for (let i = 0; i < 4; i++) delt = ok(kjopPapir(delt, 'NFS', q / 4))
    expect(delt.kontanter / ett.kontanter).toBeCloseTo(1, 9)
    expect(delt.marked.kurser.NFS.kurs / ett.marked.kurser.NFS.kurs).toBeCloseTo(1, 9)
  })

  it('én ordre kan høyst doble kursen, eller halvere den', () => {
    let s = rikt()
    const kurs = s.marked.kurser.NFS.kurs
    const maks = maksPerOrdre(s, 'NFS', 'kjop')
    expect(maksKjop(s, 'NFS')).toBe(maks)
    const u = kjopPapir(s, 'NFS', maks + 1)
    expect(u.ok ? '' : u.feil).toMatch(/Høyst .* om gangen/)
    s = ok(kjopPapir(s, 'NFS', maks))
    expect(s.marked.kurser.NFS.kurs / kurs).toBeGreaterThan(1.999)
    expect(s.marked.kurser.NFS.kurs / kurs).toBeLessThanOrEqual(2)
    // Snittprisen ligger mellom start og slutt: dybde · ln 2 for det hele.
    expect(maks * handelskurs(rikt(), 'NFS', maks)).toBeCloseTo(PAPIRER.NFS.dybde * Math.LN2, -3)
    // Et salg som ville mer enn halvert kursen, avvises også.
    const stor = rikt()
    stor.beholdning.NFS = { antall: 1e9, kostpris: 1e11 }
    const f = selgPapir(stor, 'NFS', maksPerOrdre(stor, 'NFS', 'selg') + 1)
    expect(f.ok ? '' : f.feil).toMatch(/Høyst .* om gangen/)
    expect(ok(selgPapir(stor, 'NFS', maksPerOrdre(stor, 'NFS', 'selg'))).marked.kurser.NFS.kurs / kurs).toBeCloseTo(0.5, 3)
  })

  it('en stor automatisk ordre tas i biter', () => {
    let s = rikt()
    const tak = maksPerOrdre(s, 'BMT', 'kjop')
    // Grensen er så høy at ordren alltid er utløst. Første bit dobler kursen,
    // så den neste kan bare være rundt halvparten så stor. Kursen går imellom, så det kan bli en bit til.
    s = ok(nyOrdre(s, 'BMT', 'kjop', 1e15, tak * 1.5))
    s = simuler(s, 30)
    expect(s.beholdning.BMT!.antall).toBeCloseTo(tak * 1.5, 3)
    expect(s.ordre).toHaveLength(0)
    expect(s.hendelser.filter((h) => h.tittel === 'Ordre utført').length).toBeGreaterThanOrEqual(2)
  })

  it('ditt eget kurstrykk trekkes tilbake over tid, som før', () => {
    let s = rikt()
    s = ok(kjopPapir(s, 'NFS', maksPerOrdre(s, 'NFS', 'kjop')))
    const trykk = s.marked.kurser.NFS.trykk!
    expect(trykk).toBeCloseTo(Math.LN2)
    s = simuler(s, 3600)
    // NFS trekkes tilbake med 0,5 per time: rundt e^−0,5 igjen etter en time (helgen kan stoppe børsen).
    expect(s.marked.kurser.NFS.trykk!).toBeLessThan(trykk)
    expect(s.marked.kurser.NFS.trykk!).toBeGreaterThan(trykk * Math.exp(-0.6))
  })
})

describe('fondene ser bort fra ditt eget kurstrykk', () => {
  it('å pumpe medlemmene flytter ikke fondet — før +176 000 risikofritt', () => {
    let s = rikt()
    const start = s.kontanter
    s = ok(kjopFond(s, 'KRYPTOFOND', 1e7))
    const før = fondskurs(s, 'KRYPTOFOND')
    for (const id of ['LKS', 'VKT', 'TRM'] as PapirId[]) s = ok(kjopPapir(s, id, 3e6 / s.marked.kurser[id].kurs))
    expect(fondskurs(s, 'KRYPTOFOND')).toBe(før)
    s = ok(selgFond(s, 'KRYPTOFOND'))
    for (const id of ['LKS', 'VKT', 'TRM'] as PapirId[]) s = selgAlt(s, id)
    expect(s.kontanter - start).toBeLessThan(0)
  })
})

describe('obligasjonene: ingen sikker gevinst når fasen skifter', () => {
  /** Første dag i en periode med fasen. */
  function iFase(fase: Fase): Spilltilstand {
    const s = rikt()
    const p = Array.from({ length: 80 }, (_, i) => i).find((i) => i > 0 && faseI(s, i) === fase)!
    s.sek = p * FASE_DAGER * DAG_SEK
    return s
  }

  it('kjøpt like før høykonjunkturen slutter, er gevinsten i snitt null — før +9 %', () => {
    for (const id of ['lang', 'kort'] as const) {
      const hoy = iFase('hoy')
      const sent = { ...hoy, sek: hoy.sek + FASE_DAGER * DAG_SEK - 10 }
      const s = ok(kjopObligasjon(sent, id, 1_000_000))
      // Verdien rett etter skiftet, for hver fase som kan komme, vektet med sjansen.
      let snitt = 0
      for (const f of Object.keys(FASER) as Fase[]) {
        const etter = { ...s, sek: iFase(f).sek }
        const endring = obligasjonsverdiFor(etter, id) / 1_000_000 - 1
        expect(Math.abs(endring), `${id} → ${f}`).toBeLessThan(0.016)
        snitt += FASESJANSE[f] * endring
      }
      expect(Math.abs(snitt), id).toBeLessThan(0.001)
    }
  })

  it('kjøpt ti sekunder før høy blir lav og solgt etterpå: høyst rundt 1,4 % — før +19,9 %', () => {
    const s0 = rikt()
    const p = Array.from({ length: 200 }, (_, i) => i).find((i) => i > 0 && faseI(s0, i) === 'hoy' && faseI(s0, i + 1) === 'lav')!
    const grense = (p + 1) * FASE_DAGER * DAG_SEK
    const s = ok(kjopObligasjon({ ...s0, sek: grense - 10 }, 'lang', 1e8))
    const solgt = ok(selgObligasjon({ ...s, sek: grense + 10 }, 'lang', 1))
    const gevinst = (solgt.kontanter - s.kontanter) / 1e8 - 1
    expect(gevinst).toBeGreaterThan(0)
    expect(gevinst).toBeLessThan(0.015)
  })

  it('en hel høykonjunktur gir høyst rundt 1 % i kursgevinst', () => {
    for (const id of ['lang', 'kort'] as const) {
      const hoy = iFase('hoy')
      const s = ok(kjopObligasjon(hoy, id, 1_000_000))
      const slutt = { ...s, sek: hoy.sek + FASE_DAGER * DAG_SEK - 1 }
      expect(obligasjonsverdiFor(slutt, id) / 1_000_000 - 1, id).toBeLessThan(0.012)
    }
  })

  it('en lagring fra versjon 20 beholder både verdien og kupongen på obligasjonene', () => {
    const fil = join(__dirname, '../../state/__tester__/gamle-lagringer/v20.json.gz')
    const gammel = JSON.parse(gunzipSync(readFileSync(fil)).toString('utf8')).tilstand as Spilltilstand
    const post = gammel.obligasjoner!.lang!
    const verdiFør = post.palydende * (1 - (OBLIGASJONER.lang.varighet * (styringsrente(gammel) - post.rente)) / 100)
    const r = migrer(structuredClone(gammel))
    if (!r.ok) throw new Error(r.feil)
    expect(obligasjonsverdiFor(r.tilstand, 'lang')).toBeCloseTo(verdiFør, 6)
    expect(r.tilstand.obligasjoner!.lang!.rente).toBe(post.rente)
    // Kjøper du mer etterpå, er den gamle posten fortsatt verdt det samme.
    const mer = ok(kjopObligasjon(r.tilstand, 'lang', 500_000))
    expect(obligasjonsverdiFor(mer, 'lang')).toBeCloseTo(verdiFør + 500_000, 4)
    expect(markedsrente(mer, 'lang')).toBeGreaterThan(0)
  })
})
