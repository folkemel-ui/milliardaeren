/**
 * Eiendom, luksus, lager og status: tall som beskriver verden, og de rene
 * utregningene som hører til.
 */

import type {
  EiendomId,
  Eiendomstype,
  LagerId,
  LuksusId,
  LuksusKategori,
  Luksusgjenstand,
  Spilltilstand,
} from './types'

// ─────────────────────────────────────────────── Eiendom

/**
 * Eiendommene gir leie hvert sekund — også mens du er borte, uten leder.
 * Avkastningen er lavere enn i bedriftene, men den krever ingenting av deg.
 */
export const EIENDOMSTYPER: Record<EiendomId, Eiendomstype> = {
  hybel: { id: 'hybel', navn: 'Hybel', sted: 'Møhlenpris, Bergen', by: 'Bergen', emoji: '🛏️', pris: 250_000, avkastning: 0.3, maksAntall: 8, statuskrav: 0 },
  leilighet: { id: 'leilighet', navn: 'Leilighet', sted: 'Grünerløkka, Oslo', by: 'Oslo', emoji: '🏠', pris: 2_500_000, avkastning: 0.28, maksAntall: 6, statuskrav: 0 },
  rekkehus: { id: 'rekkehus', navn: 'Rekkehus', sted: 'Madla, Stavanger', by: 'Stavanger', emoji: '🏘️', pris: 6_000_000, avkastning: 0.26, maksAntall: 5, statuskrav: 0 },
  hytte: { id: 'hytte', navn: 'Hytte', sted: 'Geilo', by: 'Geilo', emoji: '🏔️', pris: 15_000_000, avkastning: 0.22, maksAntall: 4, statuskrav: 0 },
  kontorbygg: { id: 'kontorbygg', navn: 'Kontorbygg', sted: 'Bjørvika, Oslo', by: 'Oslo', emoji: '🏢', pris: 80_000_000, avkastning: 0.25, maksAntall: 4, statuskrav: 0 },
  kjopesenter: { id: 'kjopesenter', navn: 'Kjøpesenter', sted: 'Trondheim', by: 'Trondheim', emoji: '🛍️', pris: 400_000_000, avkastning: 0.22, maksAntall: 3, statuskrav: 0 },
  naeringsbygg: { id: 'naeringsbygg', navn: 'Næringsbygg', sted: 'Aker Brygge, Oslo', by: 'Oslo', emoji: '🏙️', pris: 1_500_000_000, avkastning: 0.2, maksAntall: 2, statuskrav: 3 },
  oy: { id: 'oy', navn: 'Privat øy', sted: 'Lofoten', by: 'Lofoten', emoji: '🏝️', pris: 6_000_000_000, avkastning: 0.1, maksAntall: 1, statuskrav: 5 },
}

export const EIENDOMSSTIGEN = Object.keys(EIENDOMSTYPER) as EiendomId[]

/** Du kan se og kjøpe en eiendom når formuen din en gang har vært så stor andel av prisen. */
export const EIENDOM_SYNLIG_VED = 0.8
/** Meglerhonorar når du selger. */
export const MEGLERHONORAR = 0.03

// ─────────────────────────────────────────────── Standard og oppussing

/**
 * Standardene en eiendomstype kan pusses opp til. Oppussing gir mer leie og
 * høyere verdi, men koster en andel av prisen per enhet og tar noen dager —
 * uten leie mens håndverkerne holder på.
 */
export const STANDARDER = [
  { navn: 'Normal', leie: 1, verdi: 1, kostnad: 0, dager: 0 },
  { navn: 'Oppusset', leie: 1.3, verdi: 1.15, kostnad: 0.25, dager: 2 },
  { navn: 'Luksus', leie: 1.7, verdi: 1.35, kostnad: 0.4, dager: 3 },
]

/*
 * `?.` på eiendomStandard og oppussing er med vilje: migreringskjeden kjører
 * dagens motorkode på lagringer fra før feltene fantes (f.eks. regnes
 * nettoformuen ut i trinn 4 → 5). Da betyr et manglende felt «normal
 * standard» og «ingen oppussing».
 */
export function standard(s: Spilltilstand, id: EiendomId): number {
  return s.eiendomStandard?.[id] ?? 0
}

/** Pris (og verdi) for én enhet: katalogpris × eiendomsindeks × standardens verdifaktor. */
export function eiendomspris(s: Spilltilstand, id: EiendomId): number {
  return EIENDOMSTYPER[id].pris * s.marked.eiendom.kurs * STANDARDER[standard(s, id)].verdi
}

/** Hva det koster å pusse opp alle enhetene av en type ett trinn, eller null når det ikke går. */
export function oppussingspris(s: Spilltilstand, id: EiendomId): number | null {
  const neste = STANDARDER[standard(s, id) + 1]
  const antall = s.eiendommer[id] ?? 0
  if (!neste || antall === 0) return null
  return antall * EIENDOMSTYPER[id].pris * s.marked.eiendom.kurs * neste.kostnad
}

export function eiendomsverdi(s: Spilltilstand): number {
  let sum = 0
  for (const id of EIENDOMSSTIGEN) sum += (s.eiendommer[id] ?? 0) * eiendomspris(s, id)
  return sum
}

/** Leie for én enhet per sekund. Følger indeksen og standarden — ikke verdifaktoren. */
export function leieHverPerSek(s: Spilltilstand, id: EiendomId): number {
  const t = EIENDOMSTYPER[id]
  return (t.pris * s.marked.eiendom.kurs * t.avkastning * STANDARDER[standard(s, id)].leie) / 3600
}

export function leiePerSek(s: Spilltilstand): number {
  let sum = 0
  for (const id of EIENDOMSSTIGEN) {
    // Under oppussing står enhetene tomme.
    if (s.oppussing?.[id]) continue
    sum += (s.eiendommer[id] ?? 0) * leieHverPerSek(s, id)
  }
  return sum
}

/** Fullfører oppussinger som er ferdige. Muterer — brukes på kopier. */
export function sjekkOppussing(s: Spilltilstand): void {
  for (const id of EIENDOMSSTIGEN) {
    const o = s.oppussing[id]
    if (o && s.sek >= o.ferdigSek) {
      s.eiendomStandard[id] = o.standard
      delete s.oppussing[id]
    }
  }
}

// ─────────────────────────────────────────────── Luksus

export const LUKSUS: Record<LuksusId, Luksusgjenstand> = {
  stasjonsvogn: { id: 'stasjonsvogn', navn: 'Brukt stasjonsvogn', kategori: 'bil', emoji: '🚙', pris: 150_000, status: 1 },
  elbil: { id: 'elbil', navn: 'Elektrisk sportsbil', kategori: 'bil', emoji: '🚗', pris: 1_200_000, status: 4 },
  superbil: { id: 'superbil', navn: 'Italiensk superbil', kategori: 'bil', emoji: '🏎️', pris: 4_500_000, status: 10 },
  hyperbil: { id: 'hyperbil', navn: 'Hyperbil', kategori: 'bil', emoji: '🏁', pris: 25_000_000, status: 30 },
  gullklokke: { id: 'gullklokke', navn: 'Gullklokke', kategori: 'klokke', emoji: '⌚', pris: 200_000, status: 2 },
  mesterverk: { id: 'mesterverk', navn: 'Sveitsisk mesterverk', kategori: 'klokke', emoji: '🕰️', pris: 2_000_000, status: 6 },
  diamantklokke: { id: 'diamantklokke', navn: 'Diamantklokke', kategori: 'klokke', emoji: '💎', pris: 15_000_000, status: 20 },
  snekke: { id: 'snekke', navn: 'Snekke', kategori: 'baat', emoji: '🛶', pris: 300_000, status: 2 },
  motorbaat: { id: 'motorbaat', navn: 'Motorbåt', kategori: 'baat', emoji: '🚤', pris: 6_000_000, status: 12 },
  superyacht: { id: 'superyacht', navn: 'Superyacht', kategori: 'baat', emoji: '🛥️', pris: 400_000_000, status: 80 },
  propellfly: { id: 'propellfly', navn: 'Propellfly', kategori: 'fly', emoji: '🛩️', pris: 20_000_000, status: 20 },
  forretningsjet: { id: 'forretningsjet', navn: 'Forretningsjet', kategori: 'fly', emoji: '✈️', pris: 250_000_000, status: 60 },
  langdistansejet: { id: 'langdistansejet', navn: 'Langdistansejet', kategori: 'fly', emoji: '🛫', pris: 1_200_000_000, status: 150 },
}

export const LUKSUSLISTE = Object.keys(LUKSUS) as LuksusId[]

export const KATEGORINAVN: Record<LuksusKategori, string> = {
  bil: 'Biler',
  klokke: 'Klokker',
  baat: 'Båter',
  fly: 'Fly',
}

/** Hvor mye du får igjen ved salg. Luksus er forbruk — det er verdt mindre enn du betalte. */
export const RESTVERDI: Record<LuksusKategori, number> = {
  bil: 0.7,
  klokke: 0.9,
  baat: 0.6,
  fly: 0.6,
}

export function restverdi(id: LuksusId): number {
  const g = LUKSUS[id]
  return g.pris * RESTVERDI[g.kategori]
}

/** Luksus teller med i formuen til det du ville fått ved salg. */
export function luksusverdi(s: Spilltilstand): number {
  return s.luksus.reduce((sum, id) => sum + restverdi(id), 0)
}

// ─────────────────────────────────────────────── Lager

/** Hvilket lager hver kategori trenger. Klokker ligger i bankboksen og trenger ingen plass. */
export const LAGER_FOR: Record<LuksusKategori, LagerId | null> = {
  bil: 'garasje',
  klokke: null,
  baat: 'havn',
  fly: 'hangar',
}

export const LAGER: Record<LagerId, { navn: string; bestemt: string; emoji: string; enhet: string; startpris: number; vekst: number }> = {
  garasje: { navn: 'Garasje', bestemt: 'garasjen', emoji: '🅿️', enhet: 'biler', startpris: 100_000, vekst: 3 },
  havn: { navn: 'Havn', bestemt: 'havna', emoji: '⚓', enhet: 'båter', startpris: 250_000, vekst: 4 },
  hangar: { navn: 'Hangar', bestemt: 'hangaren', emoji: '🛬', enhet: 'fly', startpris: 5_000_000, vekst: 5 },
}

export const LAGERLISTE = Object.keys(LAGER) as LagerId[]

/** Garasjen har én plass fra start; havna og hangaren må bygges. */
export const START_LAGER: Record<LagerId, number> = { garasje: 1, havn: 0, hangar: 0 }

/** Prisen for neste plass. Hver ny plass koster mer enn den forrige. */
export function utvidelsespris(s: Spilltilstand, lager: LagerId): number {
  const l = LAGER[lager]
  const kjopt = s.lager[lager] - START_LAGER[lager]
  return Math.round(l.startpris * l.vekst ** kjopt)
}

export function brukteplasser(s: Spilltilstand, lager: LagerId): number {
  return s.luksus.filter((id) => LAGER_FOR[LUKSUS[id].kategori] === lager).length
}

// ─────────────────────────────────────────────── Status

export const STATUSNIVAAER: { poeng: number; navn: string }[] = [
  { poeng: 0, navn: 'Ukjent' },
  { poeng: 3, navn: 'Lokal kjendis' },
  { poeng: 10, navn: 'Lovende gründer' },
  { poeng: 25, navn: 'Forretningsprofil' },
  { poeng: 60, navn: 'Rikmann' },
  { poeng: 120, navn: 'Magnat' },
  { poeng: 220, navn: 'Tycoon' },
  { poeng: 350, navn: 'Legende' },
]

/** Hvert statusnivå gir så mye mer inntekt fra bedriftene … */
export const STATUS_INNTEKT = 0.02
/** … og så mye lavere rente (prosentpoeng per time). */
export const STATUS_RENTEKUTT = 0.002

export function statuspoeng(s: Spilltilstand): number {
  return s.luksus.reduce((sum, id) => sum + LUKSUS[id].status, 0)
}

export function statusnivaa(s: Spilltilstand): number {
  const p = statuspoeng(s)
  let n = 0
  for (let i = 0; i < STATUSNIVAAER.length; i++) if (p >= STATUSNIVAAER[i].poeng) n = i
  return n
}
