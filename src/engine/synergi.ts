/**
 * Synergiene (Pakke 117): eier du begge bedriftene i et par, tjener begge litt
 * mer. Før tjente hver bedrift for seg. Fem par, +5 % hver; en bedrift i to par
 * (oljeselskapet, hotellet, restauranten) får begge. To av parene møter du
 * tidlig (hotellet og restauranten, banken og oljeselskapet), tre sent.
 *
 * Målt med den smarte boten før pakken: ved 100 mrd kommer 67 % av inntekten fra
 * bedrifter i et par, ved 1 000 mrd 78 % — men boten eier ikke fiskeoppdrett
 * eller flyselskap før billionen, så de tre sene parene merkes først der.
 */

import type { Bedrift, BedriftstypeId, Spilltilstand } from './types'

/** Hva hver bedrift i et par får på inntekten. */
export const SYNERGI_BONUS = 0.05

export interface Synergi {
  par: readonly [BedriftstypeId, BedriftstypeId]
  navn: string
  /** Én linje om hvorfor de to tjener på hverandre. */
  tekst: string
}

export const SYNERGIER: readonly Synergi[] = [
  { par: ['hotell', 'restaurant'], navn: 'Hotellrestauranten', tekst: 'Gjestene spiser i huset, og bordene er fulle hver kveld.' },
  { par: ['bank', 'oljeselskap'], navn: 'Oljefinans', tekst: 'Banken låner ut til feltene, og oljepengene står i banken.' },
  { par: ['rederi', 'oljeselskap'], navn: 'Egne tankskip', tekst: 'Oljen går på egne skip, og skipene har alltid last.' },
  { par: ['flyselskap', 'hotell'], navn: 'Pakkereiser', tekst: 'Flyet og hotellet selges som én reise.' },
  { par: ['fiskeoppdrett', 'restaurant'], navn: 'Fersk laks', tekst: 'Laksen går rett fra merdene til menyen.' },
]

/** Parene en bransje er med i, og den andre i hvert. */
export function synergierFor(type: BedriftstypeId): { synergi: Synergi; andre: BedriftstypeId }[] {
  return SYNERGIER.filter((x) => x.par.includes(type)).map((synergi) => ({ synergi, andre: synergi.par[0] === type ? synergi.par[1] : synergi.par[0] }))
}

/** Parene som virker for bedriften nå: du eier den andre også. */
export function aktiveSynergier(s: Spilltilstand, b: Bedrift): Synergi[] {
  return synergierFor(b.type)
    .filter(({ andre }) => s.bedrifter.some((x) => x.type === andre))
    .map(({ synergi }) => synergi)
}

/**
 * Partnerne som bitmaske, regnet ut én gang: hver bransje har sin bit, og en bedrifts
 * partnere er en maske. Sekundet regner da alle bedriftene på to operasjoner hver
 * (`synergifaktorer`) — løkkene over parene kostet ~7 ms på to timer borte.
 */
const BIT: Partial<Record<BedriftstypeId, number>> = {}
for (const x of SYNERGIER) for (const t of x.par) BIT[t] ??= 1 << Object.keys(BIT).length
const PARTNERMASKE: Partial<Record<BedriftstypeId, number>> = {}
for (const x of SYNERGIER) {
  PARTNERMASKE[x.par[0]] = (PARTNERMASKE[x.par[0]] ?? 0) | BIT[x.par[1]]!
  PARTNERMASKE[x.par[1]] = (PARTNERMASKE[x.par[1]] ?? 0) | BIT[x.par[0]]!
}

/** Hvilke av bransjene i parene du eier, som maske — husket per liste, som faktorene under. */
const MASKER = new WeakMap<Bedrift[], { n: number; m: number }>()
function eidMaske(s: Spilltilstand): number {
  const h = MASKER.get(s.bedrifter)
  if (h && h.n === s.bedrifter.length) return h.m
  let m = 0
  for (let i = 0; i < s.bedrifter.length; i++) m |= BIT[s.bedrifter[i].type] ?? 0
  MASKER.set(s.bedrifter, { n: s.bedrifter.length, m })
  return m
}

function faktorFra(type: BedriftstypeId, eid: number): number {
  let p = (PARTNERMASKE[type] ?? 0) & eid
  if (p === 0) return 1
  let n = 0
  while (p) {
    p &= p - 1
    n++
  }
  return 1 + SYNERGI_BONUS * n
}

/** Det bedriftens inntekt (før lønn) ganges med for synergiene: 1 uten par, 1,05 med ett, 1,10 med to. */
export function synergifaktor(s: Spilltilstand, b: Bedrift): number {
  return PARTNERMASKE[b.type] === undefined ? 1 : faktorFra(b.type, eidMaske(s))
}

/**
 * Faktorene for bedriftene i en liste, husket per liste. Lista byttes ut (kjøp gir en
 * ny kopi, et tvangssalg en filtrert) eller blir lengre når typene endres, og innenfor
 * én `simuler` er den den samme — så sekundet slår bare opp. Uten hukommelsen kostet
 * oppslagene på bransjenavn ~8 ms på to timer borte (ytelse.test.ts, «inntekt»).
 */
const HUSKET = new WeakMap<Bedrift[], { n: number; f: number[] }>()

/** Faktoren for hver bedrift i `s.bedrifter`, i samme rekkefølge. */
export function synergifaktorer(s: Spilltilstand): number[] {
  const h = HUSKET.get(s.bedrifter)
  if (h && h.n === s.bedrifter.length) return h.f
  const eid = eidMaske(s)
  const f = s.bedrifter.map((b) => faktorFra(b.type, eid))
  HUSKET.set(s.bedrifter, { n: s.bedrifter.length, f })
  return f
}
