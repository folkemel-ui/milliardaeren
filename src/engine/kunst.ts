/**
 * Kunst: malerier av oppdiktede norske kunstnere. Hvert maleri har en verdi
 * som følger kunstnerens trend — noen er på vei opp, andre går av moten — og
 * en pris som svinger rundt verdien og trekkes tilbake mot den (Pakke 67).
 * Av og til åpner en utstilling, og prisene på alt kunstneren har laget,
 * hopper — men løftet ebber ut på samme måte.
 *
 * Et maleri gir status så lenge du eier det, og dobbelt så mye når det henger
 * på museum. Da kan det ikke selges, og det tar en dag å hente det hjem.
 *
 * Kunstmarkedet har sin egen terning, så kunst endrer ikke resten av spillet.
 *
 * Pakke 107: trendene byttes mellom kunstnerne hver 120. spilldag (ti timer), fra en hash —
 * likt i alle spill, og avisa sier hvem som er i vinden. Før hadde hver kunstner sin trend
 * for alltid, og Aske tapte penger hver gang. Tre sene verk gjør at kunsten varer.
 */

import { hashNormal, hashTekst, hashvalg, Terning, tilfeldig } from './rng'
import { dagnummer } from './kalender'

/** Utstillingssakene for kunstnere du ikke eier (Pakke 101): hver sto på trykk 14–19 ganger med én tekst. */
const UTSTILLINGSTEKSTER = [
  'Samlerne står i kø, og prisene stiger kraftig.',
  'Åpningen var utsolgt på en time. Galleriene ringer rundt etter flere verk.',
  'Kritikerne er enige for en gangs skyld, og prisene følger etter.',
  'Museene låner ut alt de har. Det de ikke har, vil alle kjøpe.',
] as const
const UTSTILLINGSTEKSTER_EIER = [
  'Prisene på verkene stiger kraftig — også på dem du eier.',
  'Galleristene ringer samlerne som eier verk av kunstneren. Du står på lista.',
  'Køen til åpningen gikk rundt kvartalet. Verkene på veggen din er verdt mer i kveld.',
  'Kritikerne kaller det et gjennombrudd. Samlingen din har nettopp fått et.',
] as const
import type { Kunstmarked, MaleriId, Overskrift, Spilltilstand } from './types'

export interface Kunstner {
  navn: string
  /** Hvor mye verdien endrer seg per spilldag (tolv i timen). */
  trend: number
}

/**
 * Per time: Vik +2 %, Lind +1,2 %, Solheim +0,6 %, Aske −0,6 % — som aksjene, ikke mer. Det
 * er trendene i den første perioden; etter den byttes de (`kunstnertrend`).
 */
export const KUNSTNERE = {
  vik: { navn: 'Ragnhild Vik', trend: 0.02 / 12 },
  solheim: { navn: 'Einar Solheim', trend: 0.006 / 12 },
  aske: { navn: 'Tor Aske', trend: -0.006 / 12 },
  lind: { navn: 'Maja Lind', trend: 0.012 / 12 },
} as const satisfies Record<string, Kunstner>

export type KunstnerId = keyof typeof KUNSTNERE

export interface Maleri {
  id: MaleriId
  navn: string
  kunstner: KunstnerId
  aar: number
  startpris: number
  /** Statuspoeng så lenge du eier det; dobbelt på museum. */
  status: number
  /** Tre farger til miniatyren: himmel, land og detalj. */
  farger: [string, string, string]
}

export const MALERIER: Record<MaleriId, Maleri> = {
  morgenlys: { id: 'morgenlys', navn: 'Fjord i morgenlys', kunstner: 'solheim', aar: 1911, startpris: 400_000, status: 1, farger: ['#f6c7a1', '#3f6f8f', '#f4e3b0'] },
  fiskeverket: { id: 'fiskeverket', navn: 'Fiskeverket', kunstner: 'aske', aar: 1952, startpris: 1_500_000, status: 2, farger: ['#9fb4c7', '#5b4636', '#c0392b'] },
  blaatimen: { id: 'blaatimen', navn: 'Blåtimen', kunstner: 'lind', aar: 1998, startpris: 4_000_000, status: 3, farger: ['#1e3a8a', '#0f172a', '#fbbf24'] },
  'byen-sover': { id: 'byen-sover', navn: 'Byen sover', kunstner: 'vik', aar: 2019, startpris: 9_000_000, status: 4, farger: ['#312e81', '#1f2937', '#f59e0b'] },
  'nordlys-over-vaagen': { id: 'nordlys-over-vaagen', navn: 'Nordlys over Vågen', kunstner: 'solheim', aar: 1924, startpris: 25_000_000, status: 6, farger: ['#0b3d2e', '#1e293b', '#4ade80'] },
  'kvinne-i-roedt': { id: 'kvinne-i-roedt', navn: 'Kvinne i rødt', kunstner: 'lind', aar: 2004, startpris: 60_000_000, status: 8, farger: ['#fde68a', '#7c2d12', '#dc2626'] },
  stormen: { id: 'stormen', navn: 'Stormen', kunstner: 'aske', aar: 1961, startpris: 150_000_000, status: 12, farger: ['#475569', '#1e3a5f', '#e2e8f0'] },
  sommernatt: { id: 'sommernatt', navn: 'Sommernatt', kunstner: 'vik', aar: 2021, startpris: 350_000_000, status: 18, farger: ['#fbcfe8', '#166534', '#fef08a'] },
  'skrik-i-byen': { id: 'skrik-i-byen', navn: 'Skrik i byen', kunstner: 'solheim', aar: 1933, startpris: 900_000_000, status: 30, farger: ['#ea580c', '#1e1b4b', '#fde047'] },
  // Pakke 107: de tre sene verkene, så kunsten varer forbi ~1,5 mrd.
  tausheten: { id: 'tausheten', navn: 'Tausheten', kunstner: 'lind', aar: 2009, startpris: 3_000_000_000, status: 35, farger: ['#9b2a2a', '#5b5f66', '#f1e6d2'] },
  'byen-vaakner': { id: 'byen-vaakner', navn: 'Byen våkner', kunstner: 'vik', aar: 2024, startpris: 10_000_000_000, status: 50, farger: ['#f4d7b4', '#8aa1bd', '#fbe7a8'] },
  'fjorden-brenner': { id: 'fjorden-brenner', navn: 'Fjorden brenner', kunstner: 'solheim', aar: 1934, startpris: 30_000_000_000, status: 70, farger: ['#c5462a', '#3b2552', '#f7d36a'] },
}

/** De sene verkene får svingningen sin fra en hash, så kunstterningen og de ni gamle står som før. */
export const SENE_MALERIER: readonly MaleriId[] = ['tausheten', 'byen-vaakner', 'fjorden-brenner']

/** Trendene som byttes mellom kunstnerne, per time, fra best til verst. */
export const TRENDER = [0.02, 0.012, 0.006, -0.006] as const
/** Så mange spilldager mellom hvert bytte: ti timer. */
export const TRENDPERIODE = 120

const KUNSTNERLISTE = ['vik', 'lind', 'solheim', 'aske'] as const
const HUSKET_REKKEFOLGE = new Map<number, readonly KunstnerId[]>()

/** Kunstnerne fra best til verst trend i en periode. Den første er den gamle rekkefølgen. */
export function trendrekkefolge(periode: number): readonly KunstnerId[] {
  if (periode <= 0) return KUNSTNERLISTE
  const husket = HUSKET_REKKEFOLGE.get(periode)
  if (husket) return husket
  const r: KunstnerId[] = [...KUNSTNERLISTE]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(tilfeldig(hashTekst(`kunsttrend:${periode}:${i}`)) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  if (HUSKET_REKKEFOLGE.size > 100) HUSKET_REKKEFOLGE.clear()
  HUSKET_REKKEFOLGE.set(periode, r)
  return r
}

/** Kunstnerens trend per spilldag på en dag (Pakke 107). */
export function kunstnertrend(kid: KunstnerId, dag: number): number {
  return TRENDER[trendrekkefolge(Math.floor(dag / TRENDPERIODE)).indexOf(kid)] / 12
}

/** Når neste bytte kommer, som spilldag. */
export const nesteTrendbytte = (dag: number) => (Math.floor(dag / TRENDPERIODE) + 1) * TRENDPERIODE

export const MALERILISTE = Object.keys(MALERIER) as MaleriId[]

/** Auksjonshuset tar så mye når du kjøper … */
export const KJOPSSALAER = 0.05
/** … og når du selger. */
export const SALGSSALAER = 0.1
/** Daglig svingning i prisen. */
export const SVINGNING = 0.05
/** Avstanden mellom pris og verdi halveres på så mange spilldager (30 minutter). */
export const HALVERING_DAGER = 6
/** Så mye av avstanden som står igjen etter en dag. */
export const TILBAKETREKK = 0.5 ** (1 / HALVERING_DAGER)
/** Sjansen per kunstner per dag for en utstilling som løfter prisene. */
export const UTSTILLING_SJANSE = 0.04
export const UTSTILLING_LOFT = 0.3

export function lagKunst(frø: number): Kunstmarked {
  const kurser = {} as Record<MaleriId, number>
  for (const id of MALERILISTE) kurser[id] = MALERIER[id].startpris
  return { kurser, verdier: { ...kurser }, eide: {}, frø: (frø ^ 0x27d4eb2d) | 0 }
}

/** Verdien prisen trekkes mot. Uten verdi (før Pakke 67) er den prisen. */
export function maleriverdi(s: Spilltilstand, id: MaleriId): number {
  return s.kunst?.verdier?.[id] ?? maleripris(s, id)
}

export function maleripris(s: Spilltilstand, id: MaleriId): number {
  return s.kunst?.kurser[id] ?? MALERIER[id].startpris
}

export const kjopsprisMaleri = (s: Spilltilstand, id: MaleriId) => maleripris(s, id) * (1 + KJOPSSALAER)
export const salgsprisMaleri = (s: Spilltilstand, id: MaleriId) => maleripris(s, id) * (1 - SALGSSALAER)

export function mineMalerier(s: Spilltilstand): MaleriId[] {
  return MALERILISTE.filter((id) => s.kunst?.eide[id])
}

export function kunstverdi(s: Spilltilstand): number {
  return mineMalerier(s).reduce((sum, id) => sum + maleripris(s, id), 0)
}

export function kunststatus(s: Spilltilstand): number {
  // Uten mellomliste: statusen regnes flere ganger i sekundet.
  let sum = 0
  for (const id of MALERILISTE) {
    const e = s.kunst?.eide[id]
    if (e) sum += MALERIER[id].status * (e.utlant ? 2 : 1)
  }
  return sum
}

/** Nye dagspriser, utstillinger, og malerier som hentes hjem fra museet. Muterer. */
export function kunstVedDagsskifte(s: Spilltilstand): Overskrift[] {
  const k = s.kunst
  if (!k) return []
  const t = new Terning(k.frø)
  const dag = dagnummer(s.sek)
  const saker: Overskrift[] = []
  // Pakke 107: på byttedagen sier avisa hvem som er i vinden og hvem som går av moten.
  if (dag > 0 && dag % TRENDPERIODE === 0) {
    const r = trendrekkefolge(dag / TRENDPERIODE)
    const opp = r[0]
    const ned = r[r.length - 1]
    const eier = MALERILISTE.some((id) => (MALERIER[id].kunstner === opp || MALERIER[id].kunstner === ned) && k.eide[id])
    saker.push({
      type: eier ? 'deg' : 'marked',
      tittel: 'Nye favoritter i kunstmarkedet',
      tekst: `${KUNSTNERE[opp].navn} er i vinden, og ${KUNSTNERE[ned].navn} går av moten. Kritikerne har snudd, og samlerne følger etter de neste ti timene.`,
    })
  }
  const loft: Partial<Record<KunstnerId, number>> = {}
  for (const kid of Object.keys(KUNSTNERE) as KunstnerId[]) {
    if (t.sjanse(UTSTILLING_SJANSE)) {
      loft[kid] = 1 + UTSTILLING_LOFT
      const eier = MALERILISTE.some((id) => MALERIER[id].kunstner === kid && k.eide[id])
      saker.push({
        type: eier ? 'deg' : 'marked',
        tittel: `Stor utstilling for ${KUNSTNERE[kid].navn}`,
        tekst: hashvalg(eier ? UTSTILLINGSTEKSTER_EIER : UTSTILLINGSTEKSTER, `utstilling:${kid}:${dagnummer(s.sek)}`),
      })
    }
  }
  // Verdien følger trenden; avstanden fra verdien til prisen krymper, svinger og løftes av utstillinger.
  const verdier = (k.verdier ??= { ...k.kurser })
  for (const id of MALERILISTE) {
    const m = MALERIER[id]
    // De sene verkene finnes ikke i eldre lagringer: de starter på katalogprisen.
    k.kurser[id] ??= m.startpris
    let normal: number
    if (SENE_MALERIER.includes(id)) normal = hashNormal(hashTekst(`maleri:${id}:${dag}`))
    else {
      const u = 1 - t.neste()
      normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * t.neste())
    }
    const verdi = (verdier[id] ?? k.kurser[id]) * Math.exp(kunstnertrend(m.kunstner, dag))
    const avvik = Math.log(k.kurser[id] / verdi) * TILBAKETREKK + SVINGNING * normal + Math.log(loft[m.kunstner] ?? 1)
    verdier[id] = verdi
    k.kurser[id] = verdi * Math.exp(avvik)
  }
  for (const id of MALERILISTE) {
    const v = k.eide[id]
    if (v?.hentes) {
      v.utlant = false
      v.hentes = false
    }
  }
  k.frø = t.fro
  return saker
}
