/**
 * Pakke 59 — valuta. Eiendom i utlandet prises, verdsettes og leies ut i
 * landets valuta, regnet om til kroner med en kurs som svinger sakte. Kursen
 * er en glatt bølge av tre lag — rundt to uker, fire dager og én dag — fra
 * hasher av valutaen og tiden, ikke fra terningen: den er den samme i alle
 * spill og kan regnes ut for hvilket sekund som helst. Den holder seg innenfor
 * rundt ±8 % av utgangspunktet (±11 % for dollaren).
 *
 * Danske kroner følger euroen og dirham dollaren, som i virkeligheten.
 *
 * Et spill som fantes før valutaene kom, får et anker (lagringsversjon 22), så
 * kursen står på 1 der spillet var da — ingen eiendom endret verdi over natta.
 */

import { DAG_SEK } from './kalender'
import { hashTekst, tilfeldig } from './rng'
import type { By, Spilltilstand, Utenlandsby, Valuta } from './types'

export const VALUTAER: Record<Valuta, { navn: string; kroner: number; sti: string; skala: number }> = {
  SEK: { navn: 'svenske kroner', kroner: 1, sti: 'SEK', skala: 1.1 },
  DKK: { navn: 'danske kroner', kroner: 1.55, sti: 'EUR', skala: 1 },
  EUR: { navn: 'euro', kroner: 11.6, sti: 'EUR', skala: 1 },
  GBP: { navn: 'britiske pund', kroner: 13.6, sti: 'GBP', skala: 1 },
  CHF: { navn: 'sveitsiske franc', kroner: 12.4, sti: 'CHF', skala: 0.8 },
  USD: { navn: 'amerikanske dollar', kroner: 10.7, sti: 'USD', skala: 1.3 },
  AED: { navn: 'dirham', kroner: 2.91, sti: 'USD', skala: 1.3 },
}

export const VALUTALISTE = Object.keys(VALUTAER) as Valuta[]

export const VALUTA_FOR: Record<Utenlandsby, Valuta> = {
  Stockholm: 'SEK',
  København: 'DKK',
  Berlin: 'EUR',
  Amsterdam: 'EUR',
  Paris: 'EUR',
  Roma: 'EUR',
  Marbella: 'EUR',
  London: 'GBP',
  Zermatt: 'CHF',
  Dubai: 'AED',
  'New York': 'USD',
}

const VALUTA_BY = new Map<By, Valuta>(Object.entries(VALUTA_FOR) as [By, Valuta][])

/** Valutaen i en by, eller null i Norge. Leien og verdiene spør hvert sekund, for hver eiendom. */
export function valutaForBy(by: By): Valuta | null {
  return VALUTA_BY.get(by) ?? null
}

/** Bølgene: hvor mye hver kan flytte kursen (logaritmisk), og hvor mange spilldager det er mellom knutene. */
const LAG = [
  { utslag: 0.05, dager: 14 },
  { utslag: 0.025, dager: 4 },
  { utslag: 0.01, dager: 1 },
]
const PERIODE = LAG.map((l) => l.dager * DAG_SEK)

function knute(sti: string, lag: number, k: number): number {
  return 2 * tilfeldig(hashTekst(`valuta:${sti}:${lag}:${k}`)) - 1
}

/*
 * Én bølge per sti (danske kroner deler euroens, dirham dollarens). Knutene
 * huskes til tiden går forbi dem, og verdien for siste sekund huskes: et døgn
 * borte spør om kursen 7 200 ganger, og å hashe en tekst hver gang var for tregt.
 */
interface Sti {
  navn: string
  k: number[]
  a: number[]
  b: number[]
  /** Bølgen ved sekund 0, så kursen starter på 1. */
  start: number
  sek: number
  verdi: number
}

function lagSti(navn: string): Sti {
  let start = 0
  for (let i = 0; i < LAG.length; i++) start += LAG[i].utslag * knute(navn, i, 0)
  return { navn, k: LAG.map(() => NaN), a: LAG.map(() => 0), b: LAG.map(() => 0), start, sek: NaN, verdi: 0 }
}

const STI_FOR = {} as Record<Valuta, Sti>
for (const v of VALUTALISTE) {
  const navn = VALUTAER[v].sti
  STI_FOR[v] = (Object.values(STI_FOR).find((x) => x.navn === navn) as Sti | undefined) ?? lagSti(navn)
}

/** Bølgen ved et sekund, minus starten. Før skalaen. */
function bølge(p: Sti, sek: number): number {
  if (p.sek === sek) return p.verdi
  let sum = 0
  for (let i = 0; i < LAG.length; i++) {
    const x = sek / PERIODE[i]
    const k = Math.floor(x)
    if (p.k[i] !== k) {
      // Ett steg frem gjenbruker den forrige høyre knuten.
      p.a[i] = p.k[i] === k - 1 ? p.b[i] : knute(p.navn, i, k)
      p.b[i] = knute(p.navn, i, k + 1)
      p.k[i] = k
    }
    // Glatt overgang mellom knutene (smoothstep): ingen knekk i kursen.
    const t = x - k
    sum += LAG[i].utslag * (p.a[i] + (p.b[i] - p.a[i]) * t * t * (3 - 2 * t))
  }
  p.sek = sek
  p.verdi = sum - p.start
  return p.verdi
}

/** Logaritmen av kursen ved et sekund, null ved spillets start. Den samme i alle spill. */
export function valutalogg(v: Valuta, sek: number): number {
  return VALUTAER[v].skala * bølge(STI_FOR[v], sek)
}

/*
 * Alle kursene for ett sekund regnes på én gang og huskes: leien og verdiene
 * spør mange ganger i sekundet, og da skal svaret være ett oppslag.
 */
const FAKTOR = {} as Record<Valuta, number>
let sistSek = NaN
let sistAnker: Spilltilstand['valutaanker'] | null = null

/** Kursen nå mot utgangspunktet (1 = som da spillet startet, eller da valutaene kom). */
export function valutafaktor(s: Spilltilstand, v: Valuta): number {
  if (s.sek !== sistSek || s.valutaanker !== sistAnker) {
    const anker = s.valutaanker
    for (const x of VALUTALISTE) FAKTOR[x] = Math.exp(valutalogg(x, s.sek) - (anker?.[x] ?? 0))
    sistSek = s.sek
    sistAnker = anker
  }
  return FAKTOR[v]
}

/** Hva én enhet av valutaen koster i kroner nå. */
export function kronekurs(s: Spilltilstand, v: Valuta): number {
  return VALUTAER[v].kroner * valutafaktor(s, v)
}

/** Hvor mye valutaen har endret seg mot kronen de siste `sek` sekundene. */
export function valutaendring(s: Spilltilstand, v: Valuta, sek: number): number {
  return Math.exp(valutalogg(v, s.sek) - valutalogg(v, Math.max(0, s.sek - sek))) - 1
}

/** Ankrene for et spill som var i gang da valutaene kom: kursen står på 1 der det er nå. */
export function valutaankerVed(sek: number): Partial<Record<Valuta, number>> {
  const anker: Partial<Record<Valuta, number>> = {}
  for (const v of VALUTALISTE) anker[v] = valutalogg(v, sek)
  return anker
}
