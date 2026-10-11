/** Pakke 89: utleie av yachtene og jetene, og auksjonshuset med de unike tingene. */

import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { hentHjem, kjopAuksjon, kjopLuksus, leiUt, selgLuksus, selgUnik, utvidLager, type Utfall } from '../handlinger'
import { simuler } from '../simulering'
import { brukteplasser, LUKSUS, LUKSUSLISTE, luksusverdi, statuspoeng } from '../eiendom'
import { nettoformue } from '../formler'
import { dagFra, dagnummer, DAG_SEK } from '../kalender'
import { CHARTER_I_SESONG, CHARTER_UTENFOR, CHARTERLISTE, charterPerSekFor, chartersats, kanLeiesUt } from '../charter'
import {
  AUKSJON_DAGER,
  auksjonspris,
  auksjonVedDagsskifte,
  BUDSTIGNING,
  dagerIgjen,
  estimat,
  PAUSE_MAKS,
  PAUSE_MIN,
  rundBud,
  sluttpris,
  TILBAKE_DAGER,
  TILBAKE_PREMIE,
  tilgjengelige,
} from '../auksjon'
import { UNIK_RESTVERDI, UNIKE, UNIKLISTE, unikstatus } from '../unike'
import { utforLuksussalg } from '../handel'
import type { Spilltilstand } from '../types'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** Et spill med mye penger, satt til en dag i spillet. */
function rik(dag = 0, kontanter = 1e12): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = kontanter
  s.hoyesteFormue = kontanter
  s.sek = dag * DAG_SEK + 1
  return s
}

/** Spiller fram til og med neste dagsskifte. */
function tilNesteDag(s: Spilltilstand): Spilltilstand {
  return simuler(s, DAG_SEK - (s.sek % DAG_SEK))
}

const JULI = dagFra(2027, 6, 10)
const JANUAR = dagFra(2028, 0, 10)

function medYacht(dag: number): Spilltilstand {
  let s = rik(dag)
  s = ok(utvidLager(s, 'havn'))
  return ok(kjopLuksus(s, 'superyacht'))
}

describe('utleie av yachtene og jetene', () => {
  it('bare de to yachtene og de to jetene kan leies ut', () => {
    expect(CHARTERLISTE.sort()).toEqual(['langdistansejet', 'megayacht', 'superyacht', 'widebodyjet'])
    for (const id of LUKSUSLISTE) expect(kanLeiesUt(id)).toBe(CHARTERLISTE.includes(id))
    expect(leiUt(rik(), 'superyacht').ok).toBe(false) // du eier den ikke
    let s = rik()
    s = ok(kjopLuksus(s, 'stasjonsvogn'))
    expect(leiUt(s, 'stasjonsvogn').ok).toBe(false)
  })

  it('yachten gir 3 % av nyprisen i timen om sommeren og 1 % om vinteren; jeten motsatt', () => {
    expect(chartersats(rik(JULI), 'superyacht')).toBe(CHARTER_I_SESONG)
    expect(chartersats(rik(JANUAR), 'superyacht')).toBe(CHARTER_UTENFOR)
    expect(chartersats(rik(JULI), 'widebodyjet')).toBe(CHARTER_UTENFOR)
    expect(chartersats(rik(JANUAR), 'widebodyjet')).toBe(CHARTER_I_SESONG)
    expect(CHARTER_I_SESONG).toBe(0.03)
    expect(CHARTER_UTENFOR).toBe(0.01)
  })

  it('over et år gir den rundt 1,8 % i timen — under eiendom på toppen (5,5 %)', () => {
    const s = rik()
    for (const id of CHARTERLISTE) {
      let sum = 0
      for (let d = 0; d < 365; d++) {
        s.sek = d * DAG_SEK
        sum += chartersats(s, id)
      }
      const snitt = sum / 365
      expect(snitt).toBeGreaterThan(0.017)
      expect(snitt).toBeLessThan(0.019)
    }
  })

  it('et sekund utleid gir nøyaktig leien i tillegg, og den teller som leie', () => {
    const hjemme = medYacht(JULI)
    const ute = ok(leiUt(hjemme, 'superyacht'))
    const a = simuler(hjemme, 1)
    const b = simuler(ute, 1)
    const leie = (LUKSUS.superyacht.pris * 0.03) / 3600
    expect(b.kontanter - a.kontanter).toBeCloseTo(leie, 3)
    expect(b.totaltLeie - a.totaltLeie).toBeCloseTo(leie, 3)
    expect(b.charter?.superyacht?.tjent).toBeCloseTo(leie, 3)
    expect(charterPerSekFor(ute, 'superyacht')).toBeCloseTo(leie, 6)
  })

  it('borte betales det samme som når du spiller', () => {
    const ute = ok(leiUt(medYacht(JULI), 'superyacht'))
    const levende = simuler(ute, 600)
    const borte = simuler(ute, 600, true)
    expect(borte.charter!.superyacht!.tjent).toBeCloseTo(levende.charter!.superyacht!.tjent, 0)
  })

  it('statusen står mens den er ute, men den kan ikke selges før den er hjemme', () => {
    const hjemme = medYacht(JULI)
    let s = ok(leiUt(hjemme, 'superyacht'))
    expect(statuspoeng(s)).toBe(statuspoeng(hjemme))
    expect(selgLuksus(s, 'superyacht').ok).toBe(false)
    expect(leiUt(s, 'superyacht').ok).toBe(false)
    s = ok(hentHjem(s, 'superyacht'))
    expect(hentHjem(s, 'superyacht').ok).toBe(false)
    // Leien går til dagen er omme …
    const før = s.charter!.superyacht!.tjent
    s = simuler(s, 10)
    expect(s.charter!.superyacht!.tjent).toBeGreaterThan(før)
    // … og ved dagsskiftet er den hjemme.
    s = tilNesteDag(s)
    expect(s.charter?.superyacht).toBeUndefined()
    expect(selgLuksus(s, 'superyacht').ok).toBe(true)
  })

  it('et tvangssalg avslutter utleien', () => {
    const s = ok(leiUt(medYacht(JULI), 'superyacht'))
    utforLuksussalg(s, 'superyacht')
    expect(s.charter?.superyacht).toBeUndefined()
  })
})

describe('de unike tingene', () => {
  it('tolv ting fra 30 mill til 30 mrd, i prisrekkefølge, hver tegnet som noe i sin egen kategori', () => {
    expect(UNIKLISTE).toHaveLength(12)
    const estimater = UNIKLISTE.map((id) => UNIKE[id].estimat)
    expect([...estimater].sort((a, b) => a - b)).toEqual(estimater)
    expect(estimater[0]).toBe(30e6)
    expect(estimater.at(-1)).toBe(30e9)
    for (const id of UNIKLISTE) {
      expect(LUKSUS[UNIKE[id].tegning].kategori).toBe(UNIKE[id].kategori)
      expect(UNIKE[id].linje.length).toBeGreaterThan(20)
    }
    // Statusen stiger med prisen.
    const status = UNIKLISTE.map((id) => UNIKE[id].status)
    expect([...status].sort((a, b) => a - b)).toEqual(status)
  })
})

/** Et rikt spill der den første auksjonen akkurat har åpnet. */
function medAuksjon(kontanter = 1e9): Spilltilstand {
  return tilNesteDag(rik(10, kontanter))
}

describe('auksjonshuset', () => {
  it('ingen auksjon før formuen er fire ganger det billigste', () => {
    let s = rik(10, 100e6)
    for (let i = 0; i < 3; i++) s = tilNesteDag(s)
    expect(s.auksjon?.aktiv).toBeUndefined()
  })

  it('med 1 mrd åpner den første ved neste dagsskifte: en av de tre dyreste under en firedel', () => {
    const s = medAuksjon()
    const a = s.auksjon!.aktiv!
    expect(['le-mans-1971', 'regattavinneren', 'sjoflyet']).toContain(a.id)
    expect(a.fraDag).toBe(dagnummer(s.sek))
    expect(a.tilDag).toBe(a.fraDag + AUKSJON_DAGER - 1)
    expect(a.startpris / UNIKE[a.id].estimat).toBeGreaterThanOrEqual(0.9)
    expect(a.startpris / UNIKE[a.id].estimat).toBeLessThanOrEqual(1.2)
    expect(s.hendelser.at(-1)?.tittel).toBe('Auksjon')
  })

  it('er lik i to spill: samme ting, samme pris', () => {
    expect(medAuksjon().auksjon).toEqual(medAuksjon().auksjon)
  })

  it('budet stiger 10 % om dagen, i tre dager', () => {
    let s = medAuksjon()
    const start = s.auksjon!.aktiv!.startpris
    expect(auksjonspris(s)).toBe(start)
    expect(dagerIgjen(s)).toBe(3)
    s = tilNesteDag(s)
    expect(auksjonspris(s)).toBe(rundBud(start * (1 + BUDSTIGNING)))
    expect(dagerIgjen(s)).toBe(2)
    s = tilNesteDag(s)
    expect(auksjonspris(s)).toBe(rundBud(start * (1 + 2 * BUDSTIGNING)))
    expect(dagerIgjen(s)).toBe(1)
  })

  it('kjøpet trenger en plass, koster budet og gir status og 90 % i formuen', () => {
    let s = medAuksjon()
    const id = s.auksjon!.aktiv!.id
    const lager = { bil: 'garasje', baat: 'havn', fly: 'hangar', klokke: null }[UNIKE[id].kategori] as 'garasje' | 'havn' | 'hangar' | null
    if (lager) {
      // Ingen ledig plass: kjøpet må vente på en til.
      s.lager[lager] = brukteplasser(s, lager)
      expect(kjopAuksjon(s).ok).toBe(false)
      s = ok(utvidLager(s, lager))
    }
    const pris = auksjonspris(s)!
    const kontanter = s.kontanter
    const status = statuspoeng(s)
    const samling = luksusverdi(s)
    s = ok(kjopAuksjon(s))
    expect(kontanter - s.kontanter).toBeCloseTo(pris, 2)
    expect(statuspoeng(s) - status).toBe(UNIKE[id].status)
    expect(unikstatus(s)).toBe(UNIKE[id].status)
    expect(luksusverdi(s) - samling).toBeCloseTo(pris * UNIK_RESTVERDI, 2)
    expect(auksjonspris(s)).toBeNull()
    expect(kjopAuksjon(s).ok).toBe(false)
    if (lager) expect(brukteplasser(s, lager)).toBeGreaterThan(0)
    // Avisa skriver om det ved dagsskiftet, og så er det pause i 6–12 dager.
    const dag = dagnummer(s.sek) + 1
    s = tilNesteDag(s)
    expect(s.auksjon!.aktiv).toBeUndefined()
    expect(s.auksjon!.nesteDag - dag).toBeGreaterThanOrEqual(PAUSE_MIN)
    expect(s.auksjon!.nesteDag - dag).toBeLessThanOrEqual(PAUSE_MAKS)
    expect(s.avis.at(-1)!.saker.some((x) => x.tittel.includes('kjøper') && x.type === 'deg')).toBe(true)
  })

  it('en tur-retur taper 10 %, og tingen kan bys fram igjen senere', () => {
    let s = medAuksjon()
    const id = s.auksjon!.aktiv!.id
    s = ok(utvidLager(ok(utvidLager(ok(utvidLager(s, 'havn')), 'hangar')), 'garasje'))
    const før = nettoformue(s)
    const pris = auksjonspris(s)!
    s = ok(kjopAuksjon(s))
    s = ok(selgUnik(s, id))
    expect(nettoformue(s) - før).toBeCloseTo(-pris * (1 - UNIK_RESTVERDI), 0)
    expect(tilgjengelige(s, dagnummer(s.sek))).not.toContain(id)
    expect(tilgjengelige(s, dagnummer(s.sek) + TILBAKE_DAGER)).toContain(id)
  })

  it('kjøper du den ikke, går den til en rival — og kommer tilbake etter 120 dager, 1,5 gang så dyr', () => {
    let s = medAuksjon()
    const a = s.auksjon!.aktiv!
    for (let i = 0; i < AUKSJON_DAGER; i++) s = tilNesteDag(s)
    const borte = s.auksjon!.borte[a.id]!
    const dag = dagnummer(s.sek)
    expect(s.auksjon!.aktiv).toBeUndefined()
    expect(borte.rival).toBeTruthy()
    expect(borte.pris).toBeCloseTo(sluttpris(a.startpris), 2)
    expect(borte.tilbakeDag).toBe(dag + TILBAKE_DAGER)
    expect(estimat(s, a.id)).toBeCloseTo(UNIKE[a.id].estimat * TILBAKE_PREMIE, 2)
    expect(tilgjengelige(s, dag)).not.toContain(a.id)
    expect(tilgjengelige(s, dag + TILBAKE_DAGER)).toContain(a.id)
    expect(s.hendelser.some((h) => h.tittel === 'Auksjon' && h.tekst.includes(borte.rival!))).toBe(true)
  })

  it('uten en rival som har råd, trekkes den og kommer igjen om 60 dager til samme pris', () => {
    const s = medAuksjon()
    const a = s.auksjon!.aktiv!
    for (const r of s.rivaler) r.formue = 0
    s.sek = (a.tilDag + 1) * DAG_SEK
    const saker = auksjonVedDagsskifte(s, 'Rikmannen')
    expect(saker[0].tittel).toMatch(/^Ingen bud/)
    expect(s.auksjon!.borte[a.id]).toEqual({ tilbakeDag: a.tilDag + 1 + TILBAKE_DAGER / 2, ganger: 0 })
  })

  it('rundt én auksjon i timen (tolv spilldager)', () => {
    let s = rik(10, 1e13)
    const sett = new Set<string>()
    for (let i = 0; i < 240; i++) {
      s = tilNesteDag(s)
      const a = s.auksjon?.aktiv
      if (a) sett.add(`${a.id}:${a.fraDag}`)
    }
    // 240 dager / (3 + 9) ≈ 20.
    expect(sett.size).toBeGreaterThanOrEqual(16)
    expect(sett.size).toBeLessThanOrEqual(26)
  })

  it('et spill uten auksjonshus eller utleie (fra før Pakke 89) går som før', () => {
    const s = nyttSpill()
    expect(s.auksjon).toBeUndefined()
    expect(s.charter).toBeUndefined()
    expect(statuspoeng(s)).toBe(0)
    const etter = simuler(s, 2 * DAG_SEK)
    expect(etter.auksjon?.aktiv).toBeUndefined()
  })
})
