/** Pakke 122: en skog som holder følge — skogsmaskiner i trinn, naboskog, og storm, brann og forsikring. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { hoggBestand, kjopBestand, kjopJord, kjopNaboskog, kjopSagbruk, kjopSkogforsikring, kjopSkogmaskin, siOppSkogforsikring, type Utfall } from '../handlinger'
import { DAG_SEK } from '../kalender'
import { nettoformue } from '../formler'
import {
  bestand,
  bestandsverdi,
  besteHogstdag,
  FORSIKRING_ANDEL,
  FORSIKRING_DAGER,
  forsikringspris,
  MAKS_BESTAND,
  NABOSKOG_PRIS,
  naboskogpris,
  omlopPerDag,
  skoggrunnlag,
  skogmaskinPerDag,
  skogmaskinpris,
  skogrisiko,
  skogVedDagsskifte,
  STORM_ANDEL,
  STORM_PRIS,
  TOMMERPRIS_SNITT,
  tommerverdi,
  vekstdager,
} from '../jord'
import type { JordId, Spilltilstand } from '../types'
import { Skogmaskiner, Skogrisiko } from '../../ui/komponenter/Skog'
import { FORKLARINGER } from '../../ui/forklaringer'

const tekst = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/ /g, ' ')
const ID: JordId = 'skog-namdalen'
const timer = (pris: number, perDag: number) => (pris / perDag) * (DAG_SEK / 3600)

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

/** En skog i Namdalen til vanlig tømmerpris. */
function medSkog(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e14
  s.hoyesteFormue = 1e14
  s.marked.eiendom.avvik = Math.log(TOMMERPRIS_SNITT)
  return ok(kjopJord(s, ID))
}

/** En skog med alle fem bestandene. */
function fullSkog(): Spilltilstand {
  let s = medSkog()
  while (bestand(s.jord[ID]!).length < MAKS_BESTAND) s = ok(kjopBestand(s, ID))
  return s
}

/** Første dag fra `fra` da en skog får `hva`. */
function forsteDag(id: JordId, hva: 'storm' | 'brann', fra = 0): number {
  for (let d = fra; d < fra + 365 * 20; d++) if (skogrisiko(id, d) === hva) return d
  throw new Error(`ingen ${hva}`)
}

describe('skogsmaskiner i trinn', () => {
  it('veien og hogstmaskinen gir +10 % tømmer per trinn, og trinnene koster 1,5 ganger forrige', () => {
    let s = medSkog()
    s.sek += 30 * DAG_SEK
    const uten = bestandsverdi(s, ID, 0)
    const p1 = skogmaskinpris(s, ID, 'vei')
    expect(p1).toBeCloseTo(0.2 * skoggrunnlag(s, ID), 2)
    s = ok(kjopSkogmaskin(s, ID, 'vei'))
    expect(bestandsverdi(s, ID, 0) / uten).toBeCloseTo(1.1, 10)
    expect(skogmaskinpris(s, ID, 'vei') / p1).toBeCloseTo(1.5, 10)
    s = ok(kjopSkogmaskin(s, ID, 'vei'))
    s = ok(kjopSkogmaskin(s, ID, 'hogstmaskin'))
    expect(bestandsverdi(s, ID, 0) / uten).toBeCloseTo(1.2 * 1.1, 10)
    s = ok(kjopSkogmaskin(s, ID, 'vei'))
    expect(kjopSkogmaskin(s, ID, 'vei').ok).toBe(false)
    // Prisen står i skogens verdi og i kostprisen.
    expect(s.jord[ID]!.investert).toBeCloseTo(s.jord[ID]!.kostpris - skogpris(s), 0)
  })

  it('første trinn tjener seg inn på 8–12 timer', () => {
    const s = medSkog()
    for (const m of ['vei', 'hogstmaskin', 'planter'] as const) {
      const t = timer(skogmaskinpris(s, ID, m), skogmaskinPerDag(s, ID, m))
      expect(t, m).toBeGreaterThan(7)
      expect(t, m).toBeLessThan(13)
    }
  })

  it('bedre planter gjelder bestand som plantes etterpå: de som står, vokser som før', () => {
    let s = medSkog()
    s.sek += 40 * DAG_SEK
    const før = bestandsverdi(s, ID, 0)
    s = ok(kjopSkogmaskin(s, ID, 'planter'))
    expect(bestandsverdi(s, ID, 0)).toBeCloseTo(før, 2)
    expect(vekstdager(s.jord[ID]!, 0)).toBe(36)
    s = ok(hoggBestand(s, ID, 0))
    expect(vekstdager(s.jord[ID]!, 0)).toBe(34)
    expect(vekstdager(s.jord[ID]!, 1)).toBe(36)
    // Et nytt bestand plantes også med plantene.
    s = ok(kjopBestand(s, ID))
    expect(vekstdager(s.jord[ID]!, 3)).toBe(34)
    // Etter 20 dager har det nye bestandet mer tømmer enn et som vokser som før.
    const t = structuredClone(s)
    t.jord[ID]!.bestand = [t.sek - 20 * DAG_SEK, t.sek - 20 * DAG_SEK, t.sek - 20 * DAG_SEK, t.sek - 20 * DAG_SEK]
    expect(bestandsverdi(t, ID, 0)).toBeGreaterThan(bestandsverdi(t, ID, 1))
  })

  it('med alle tre trinnene på plantene er den beste dagen 38', () => {
    let s = medSkog()
    for (let i = 0; i < 3; i++) s = ok(kjopSkogmaskin(s, ID, 'planter'))
    expect(besteHogstdag(s.jord[ID])).toBe(38)
    expect(besteHogstdag(undefined)).toBe(49)
  })
})

/** Det skogen kostet: jorda da den ble kjøpt. */
function skogpris(s: Spilltilstand): number {
  return s.jord[ID]!.kostpris - (s.jord[ID]!.investert ?? 0)
}

describe('naboskogen', () => {
  it('kan bare kjøpes av en skog med alle fem bestandene', () => {
    const s = medSkog()
    expect(naboskogpris(s, ID)).toBeNull()
    expect(kjopNaboskog(s, ID).ok).toBe(false)
    expect(naboskogpris(fullSkog(), ID)).not.toBeNull()
  })

  it('tredobler jorda tømmeret vokser på; tømmeret som står, betales, så formuen står stille', () => {
    let s = fullSkog()
    s.sek += 30 * DAG_SEK
    const grunnlag = skoggrunnlag(s, ID)
    const jord = naboskogpris(s, ID)!
    expect(jord).toBeCloseTo(NABOSKOG_PRIS * grunnlag, 2)
    const tommer = tommerverdi(s, ID)
    const formue = nettoformue(s)
    const kontanter = s.kontanter
    s = ok(kjopNaboskog(s, ID))
    expect(kontanter - s.kontanter).toBeCloseTo(jord + 2 * tommer, 0)
    expect(skoggrunnlag(s, ID) / grunnlag).toBeCloseTo(3, 10)
    expect(tommerverdi(s, ID) / tommer).toBeCloseTo(3, 10)
    expect(Math.abs(nettoformue(s) - formue)).toBeLessThan(1)
    expect(naboskogpris(s, ID)!).toBeCloseTo(NABOSKOG_PRIS * grunnlag * 3, 2)
    s = ok(kjopNaboskog(s, ID))
    s = ok(kjopNaboskog(s, ID))
    expect(kjopNaboskog(s, ID).ok).toBe(false)
  })

  it('tjener seg inn på rundt åtte timer, som gårdenes', () => {
    const s = fullSkog()
    const gir = omlopPerDag(s, ID, besteHogstdag(s.jord[ID])) * MAKS_BESTAND * 2
    const t = timer(naboskogpris(s, ID)!, gir)
    expect(t).toBeGreaterThan(6)
    expect(t).toBeLessThan(10)
  })
})

describe('storm og brann', () => {
  it('rammer omtrent én storm i året og en brann annethvert år, likt i alle spill', () => {
    let stormer = 0
    let branner = 0
    const AAR = 100
    for (const id of ['skog-namdalen', 'skog-trysil'] as const)
      for (let d = 0; d < 365 * AAR; d++) {
        const h = skogrisiko(id, d)
        if (h === 'storm') stormer++
        if (h === 'brann') branner++
      }
    expect(stormer / (2 * AAR)).toBeGreaterThan(0.7)
    expect(stormer / (2 * AAR)).toBeLessThan(1.4)
    expect(branner / (2 * AAR)).toBeGreaterThan(0.3)
    expect(branner / (2 * AAR)).toBeLessThan(0.8)
    expect(skogrisiko(ID, forsteDag(ID, 'storm'))).toBe('storm')
  })

  it('en storm blåser ned en tredel av det eldste bestandet, som selges for ×0,7', () => {
    const s = medSkog()
    const dag = forsteDag(ID, 'storm', 40)
    s.jord[ID]!.bestand = [(dag - 40) * DAG_SEK, (dag - 20) * DAG_SEK, (dag - 5) * DAG_SEK]
    s.sek = dag * DAG_SEK
    const verdi = bestandsverdi(s, ID, 0)
    const andre = bestandsverdi(s, ID, 1)
    const kontanter = s.kontanter
    skogVedDagsskifte(s)
    expect(bestandsverdi(s, ID, 0) / verdi).toBeCloseTo(1 - STORM_ANDEL, 6)
    expect(bestandsverdi(s, ID, 1)).toBeCloseTo(andre, 2)
    expect(s.kontanter - kontanter).toBeCloseTo(verdi * STORM_ANDEL * STORM_PRIS, 0)
    expect(s.hendelser.at(-1)?.tittel).toBe('Storm')
    expect(s.jord[ID]!.skader).toHaveLength(1)
  })

  it('med forsikring betaler stormen fullt, og en brann betaler tømmeret bestandet hadde', () => {
    let s = medSkog()
    s = ok(kjopSkogforsikring(s, ID))
    const storm = forsteDag(ID, 'storm', 40)
    s.jord[ID]!.bestand = [(storm - 40) * DAG_SEK, (storm - 20) * DAG_SEK, (storm - 5) * DAG_SEK]
    s.jord[ID]!.forsikretTil = (storm + 1) * DAG_SEK
    s.sek = storm * DAG_SEK
    const verdi = bestandsverdi(s, ID, 0)
    let kontanter = s.kontanter
    skogVedDagsskifte(s)
    expect(s.kontanter - kontanter).toBeCloseTo(verdi * STORM_ANDEL, 0)

    const brann = forsteDag(ID, 'brann', 40)
    s.jord[ID]!.bestand = [(brann - 40) * DAG_SEK, (brann - 30) * DAG_SEK, (brann - 20) * DAG_SEK]
    s.jord[ID]!.forsikretTil = (brann + 1) * DAG_SEK
    s.sek = brann * DAG_SEK
    const verdier = [0, 1, 2].map((i) => bestandsverdi(s, ID, i))
    kontanter = s.kontanter
    skogVedDagsskifte(s)
    const brent = s.jord[ID]!.bestand!.findIndex((b) => b === s.sek)
    expect(brent).toBeGreaterThanOrEqual(0)
    expect(bestandsverdi(s, ID, brent)).toBe(0)
    expect(s.kontanter - kontanter).toBeCloseTo(verdier[brent], 0)
    expect(s.hendelser.at(-1)?.tittel).toBe('Skogbrann')
  })

  it('uten forsikring gir en brann ingenting', () => {
    const s = medSkog()
    const brann = forsteDag(ID, 'brann', 40)
    s.jord[ID]!.bestand = [(brann - 40) * DAG_SEK, (brann - 30) * DAG_SEK, (brann - 20) * DAG_SEK]
    s.sek = brann * DAG_SEK
    const kontanter = s.kontanter
    skogVedDagsskifte(s)
    expect(s.kontanter).toBe(kontanter)
    expect(s.jord[ID]!.skader![0].betalt).toBe(0)
  })
})

describe('skogforsikringen', () => {
  it('koster 12,5 % av jorda i året for tre bestand, betalt på forskudd, og står i forbruket', () => {
    let s = medSkog()
    const pris = forsikringspris(s, ID)
    expect(pris).toBeCloseTo(FORSIKRING_ANDEL * skoggrunnlag(s, ID), 2)
    const forbruk = s.totaltForbruk
    s = ok(kjopSkogforsikring(s, ID))
    expect(s.totaltForbruk - forbruk).toBeCloseTo(pris, 2)
    expect(s.jord[ID]!.forsikretTil).toBe(s.sek + FORSIKRING_DAGER * DAG_SEK)
    expect(kjopSkogforsikring(s, ID).ok).toBe(false)
  })

  it('fornyes når året er omme, og løper ut året når den er sagt opp', () => {
    let s = medSkog()
    s = ok(kjopSkogforsikring(s, ID))
    const til = s.jord[ID]!.forsikretTil!
    s = ok(siOppSkogforsikring(s, ID))
    expect(s.jord[ID]!.fornyForsikring).toBe(false)
    expect(s.jord[ID]!.forsikretTil).toBe(til)
    // Slått på igjen før året er omme: ingen ny premie.
    const kontanter = s.kontanter
    s = ok(kjopSkogforsikring(s, ID))
    expect(s.kontanter).toBe(kontanter)
    expect(s.jord[ID]!.fornyForsikring).toBe(true)
    // Året er omme: den fornyes for et nytt år.
    s.sek = til
    const pris = forsikringspris(s, ID)
    const før = s.kontanter
    skogVedDagsskifte(s)
    expect(før - s.kontanter).toBeCloseTo(pris, 0)
    expect(s.jord[ID]!.forsikretTil).toBe(til + FORSIKRING_DAGER * DAG_SEK)
    // Uten penger går den ut, med en linje i loggen.
    s.sek = s.jord[ID]!.forsikretTil!
    s.kontanter = 0
    skogVedDagsskifte(s)
    expect(s.jord[ID]!.fornyForsikring).toBe(false)
    expect(s.hendelser.at(-1)?.tittel).toBe('Skogforsikring')
  })
})

describe('kostprisen', () => {
  it('et bestand og et sagbruk står i kostprisen, så salget ikke skattes av det du selv la inn', () => {
    let s = medSkog()
    const før = s.jord[ID]!.kostpris
    s = ok(kjopBestand(s, ID))
    s = ok(kjopSagbruk(s, ID))
    expect(s.jord[ID]!.kostpris - før).toBeCloseTo(s.jord[ID]!.investert!, 2)
  })
})

describe('siden', () => {
  it('maskinene, naboskogen og forsikringen står på skogens side', () => {
    let s = medSkog()
    const m = tekst(createElement(Skogmaskiner, { s, id: ID }))
    expect(m).toContain('Skogsbilvei')
    expect(m).toContain('Hogstmaskin')
    expect(m).toContain('Bedre planter')
    expect(m).toMatch(/tilbake på \d/)
    expect(m).toContain('Når skogen har alle 5 bestandene')
    expect(tekst(createElement(Skogmaskiner, { s: fullSkog(), id: ID }))).toMatch(/Naboskog.*Kjøp · kr/)
    expect(tekst(createElement(Skogrisiko, { s, id: ID }))).toContain('Forsikre skogen')
    s = ok(kjopSkogforsikring(s, ID))
    expect(tekst(createElement(Skogrisiko, { s, id: ID }))).toContain('Forsikret')
    expect(tekst(createElement(Skogrisiko, { s, id: ID }))).toContain('Si opp')
  })

  it('hjelpeteksten forklarer maskinene, naboskogen, storm og brann', () => {
    const t = FORKLARINGER.jord.tekst
    expect(t).toContain('Skogsbilvei og hogstmaskin')
    expect(t).toContain('naboskoger')
    expect(t).toContain('storm')
    expect(t).toContain('Skogforsikringen')
  })
})
