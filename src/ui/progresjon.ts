/**
 * Progresjonen: hvilke faner som er åpne, og hva det neste målet er. Begge
 * følger den høyeste nettoformuen du har hatt — som bransjene — så ingenting
 * låses igjen når formuen faller. Rene funksjoner, så de kan testes.
 */

import { BEDRIFTSTYPER, STIGEN } from '../engine/innhold'
import { EIENDOM_SYNLIG_VED, EIENDOMSTYPER, LUKSUS } from '../engine/eiendom'
import { STARTUP_LAAST_OPP } from '../engine/startups'
import { KLUBB_LAAST_OPP } from '../engine/klubb'
import { LANDEMERKELISTE, LANDEMERKER } from '../engine/landemerker'
import { PRESTASJONER } from '../engine/prestasjoner'
import type { Spilltilstand } from '../engine/types'
import type { Fane } from './komponenter/Fanemeny'

/**
 * Når fanene åpner. Investeringer når en aksjepost betyr noe, Luksus når den
 * billigste klokka (kr 40 000) er innen rekkevidde, Eiendom når hybelen blir
 * synlig (80 % av kr 250 000).
 */
export const FANE_AAPNER: Record<Fane, number> = {
  bedrifter: 0,
  investeringer: 10_000,
  luksus: 50_000,
  eiendom: EIENDOMSTYPER.hybel.pris * EIENDOM_SYNLIG_VED,
  profil: 0,
}

/** Noe du eier i fanen — da er den åpen uansett, så ingenting du har, gjemmes bort. */
function eierNoeI(s: Spilltilstand, f: Fane): boolean {
  if (f === 'investeringer') {
    return (
      Object.keys(s.beholdning).length > 0 ||
      Object.keys(s.fond ?? {}).length > 0 ||
      s.gjeld > 0 ||
      s.sparing > 0 ||
      (s.ordre ?? []).length > 0 ||
      (s.startups ?? []).some((x) => x.andel > 0) ||
      s.rivaler.some((r) => r.andel > 0)
    )
  }
  if (f === 'luksus') return s.luksus.length > 0 || !!s.klubb || Object.keys(s.kunst?.eide ?? {}).length > 0
  if (f === 'eiendom') {
    return Object.values(s.eiendommer).some((n) => (n ?? 0) > 0) || Object.keys(s.jord ?? {}).length > 0 || Object.values(s.landemerker ?? {}).some((l) => l?.eier === 'deg')
  }
  return false
}

export function faneAapen(s: Spilltilstand, f: Fane): boolean {
  return s.hoyesteFormue >= FANE_AAPNER[f] || eierNoeI(s, f)
}

export type Maalart = 'fane' | 'bedrift' | 'annet' | 'milepael' | 'prestasjon'

export interface Maal {
  belop: number
  /** Det som skjer ved beløpet: «Kiosk», «Investeringer åpner», «Millionær». */
  tekst: string
  art: Maalart
  /** Hvor et trykk på målet tar deg — en fane som åpner, er ikke åpen ennå. */
  fane?: Fane
}

/** Formuemilepælene, med samme navn som prestasjonene — og videre etter milliarden. */
export const MILEPAELER: { belop: number; navn: string }[] = [
  { belop: 1e4, navn: 'Fem sifre' },
  { belop: 1e5, navn: 'Seks sifre' },
  { belop: 1e6, navn: 'Millionær' },
  { belop: 1e7, navn: 'Tosifret million' },
  { belop: 1e8, navn: 'Hundre millioner' },
  { belop: 1e9, navn: 'Milliardær' },
  { belop: 1e10, navn: 'Ti milliarder' },
  { belop: 1e11, navn: 'Hundre milliarder' },
  { belop: 1e12, navn: 'Billionær' },
]

const FANENAVN: Record<Fane, string> = { bedrifter: 'Bedrifter', investeringer: 'Investeringer', eiendom: 'Eiendom', luksus: 'Luksus', profil: 'Profil' }

/** Alle målene i spillet, sortert etter beløp. Ved samme beløp kommer det som åpner noe, først. */
export function alleMaal(): Maal[] {
  const maal: Maal[] = []
  for (const f of Object.keys(FANE_AAPNER) as Fane[]) {
    if (FANE_AAPNER[f] > 0) maal.push({ belop: FANE_AAPNER[f], tekst: `${FANENAVN[f]} åpner`, art: 'fane' })
  }
  for (const id of STIGEN) {
    const t = BEDRIFTSTYPER[id]
    if (t.laasesOppVed > 0) maal.push({ belop: t.laasesOppVed, tekst: t.navn, art: 'bedrift', fane: 'bedrifter' })
  }
  maal.push({ belop: STARTUP_LAAST_OPP, tekst: 'Oppstartsselskaper', art: 'annet', fane: 'investeringer' })
  maal.push({ belop: KLUBB_LAAST_OPP, tekst: 'Fotballklubb til salgs', art: 'annet', fane: 'luksus' })
  // Pakke 70: de sene målene spillet alt har — landemerkene, langdistansejeten og New York.
  for (const id of LANDEMERKELISTE) maal.push({ belop: LANDEMERKER[id].pris, tekst: LANDEMERKER[id].navn, art: 'annet', fane: 'eiendom' })
  maal.push({ belop: LUKSUS.langdistansejet.pris, tekst: LUKSUS.langdistansejet.navn, art: 'annet', fane: 'luksus' })
  maal.push({ belop: EIENDOMSTYPER.newyork.pris, tekst: 'New York', art: 'annet', fane: 'eiendom' })
  for (const m of MILEPAELER) maal.push({ belop: m.belop, tekst: m.navn, art: 'milepael', fane: 'profil' })
  const rang: Record<Maalart, number> = { fane: 0, bedrift: 1, annet: 2, milepael: 3, prestasjon: 4 }
  return maal.sort((a, b) => a.belop - b.belop || rang[a.art] - rang[b.art])
}

const ALLE = alleMaal()

export interface Neste {
  belop: number
  /** Målene ved dette beløpet, det viktigste først. */
  maal: Maal[]
  /** Hvor langt du har kommet fra forrige mål, 0–1, på logaritmisk skala. */
  andel: number
  /** Det som står der beløpet pleier å stå, når målet ikke er et beløp («12 / 53»). */
  visning?: string
}

/**
 * Det neste målet over den høyeste formuen din. Når beløpene er brukt opp
 * (etter billionen), står prestasjonene du ikke har igjen (Pakke 70); null
 * først når alt er nådd.
 */
export function nesteMaal(s: Spilltilstand): Neste | null {
  const h = s.hoyesteFormue
  const neste = ALLE.find((m) => m.belop > h)
  if (!neste) return prestasjonsmaal(s)
  const forrige = Math.max(1_000, ...ALLE.filter((m) => m.belop <= h).map((m) => m.belop))
  const fra = Math.log10(forrige)
  const andel = Math.min(1, Math.max(0, (Math.log10(Math.max(1, h)) - fra) / (Math.log10(neste.belop) - fra)))
  return { belop: neste.belop, maal: ALLE.filter((m) => m.belop === neste.belop), andel }
}

/** Prestasjonene som er igjen, som ett mål — også de skjulte teller, uten å røpes. */
function prestasjonsmaal(s: Spilltilstand): Neste | null {
  let klart = 0
  for (const p of PRESTASJONER) if (s.prestasjoner[p.id] !== undefined) klart++
  const igjen = PRESTASJONER.length - klart
  if (igjen === 0) return null
  return {
    belop: Infinity,
    maal: [{ belop: Infinity, tekst: igjen === 1 ? 'Én prestasjon igjen' : `${igjen} prestasjoner igjen`, art: 'prestasjon', fane: 'profil' }],
    andel: klart / PRESTASJONER.length,
    visning: `${klart} / ${PRESTASJONER.length}`,
  }
}

/** De neste `antall` beløpene med mål, til lista på Profil. */
export function kommendeMaal(s: Spilltilstand, antall = 4): { belop: number; maal: Maal[] }[] {
  const ut: { belop: number; maal: Maal[] }[] = []
  for (const m of ALLE) {
    if (m.belop <= s.hoyesteFormue) continue
    const siste = ut.at(-1)
    if (siste?.belop === m.belop) siste.maal.push(m)
    else if (ut.length < antall) ut.push({ belop: m.belop, maal: [m] })
    else break
  }
  return ut
}
