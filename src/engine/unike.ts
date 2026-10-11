/**
 * De unike tingene (Pakke 89): ting det bare finnes én av, og som bare kan kjøpes
 * når auksjonshuset byr dem fram (`auksjon.ts`). De står i samlingen sammen med
 * resten — en bil i garasjen, en båt i havna, et fly i hangaren, en klokke i
 * bankboksen — og tar en plass der.
 *
 * Fila leser bare typene, så eiendom.ts kan bruke den til plassene og statusen.
 */

import type { LuksusId, LuksusKategori, Spilltilstand, UnikId } from './types'

export interface Unik {
  id: UnikId
  navn: string
  kategori: LuksusKategori
  /** Tegningen den vises med: den nærmeste i samlingen. */
  tegning: LuksusId
  /** Hva auksjonshuset regner med at den går for. */
  estimat: number
  /** Statuspoeng så lenge du eier den. */
  status: number
  /** Én linje om tingen. */
  linje: string
}

/** I prisrekkefølge: fra rundt 120 mill i formue til de siste ved 120 mrd. */
export const UNIKE: Record<UnikId, Unik> = {
  'urmakerens-forste': { id: 'urmakerens-forste', navn: 'Urmakerens første klokke', kategori: 'klokke', tegning: 'lommeur', estimat: 30_000_000, status: 15, linje: 'Laget ved et kjøkkenbord i Le Locle i 1839, før mesteren hadde eget verksted.' },
  kongelimousin: { id: 'kongelimousin', navn: 'Kongelig limousin fra 1959', kategori: 'bil', tegning: 'limousin', estimat: 45_000_000, status: 18, linje: 'Kjørte kongen til Stortinget i tjue år. Flaggstangen på panseret følger med.' },
  sjoflyet: { id: 'sjoflyet', navn: 'Sjøflyet fra Lofotruta', kategori: 'fly', tegning: 'propellfly', estimat: 70_000_000, status: 22, linje: 'Gikk i rute mellom Bodø og Svolvær fra 1948. Flottørene er originale.' },
  regattavinneren: { id: 'regattavinneren', navn: 'Regattavinneren fra 1903', kategori: 'baat', tegning: 'seilyacht', estimat: 90_000_000, status: 25, linje: 'Vant kappseilasen over Atlanteren og har aldri tapt siden. Den har riktignok ikke stilt.' },
  'le-mans-1971': { id: 'le-mans-1971', navn: 'Le Mans-vinneren fra 1971', kategori: 'bil', tegning: 'superbil', estimat: 150_000_000, status: 30, linje: 'Kjørte 5 335 kilometer på ett døgn. Startnummeret er aldri vasket av.' },
  polarklokka: { id: 'polarklokka', navn: 'Polarklokka fra Sydpolen', kategori: 'klokke', tegning: 'mesterverk', estimat: 300_000_000, status: 35, linje: 'Gikk hele veien til polpunktet i 1911 og hjem igjen. Taper fire sekunder i døgnet.' },
  kongeyachten: { id: 'kongeyachten', navn: 'Kongelig yacht fra 1937', kategori: 'baat', tegning: 'superyacht', estimat: 1_000_000_000, status: 45, linje: 'Bygget for én konge og solgt av en annen. Salongen er urørt siden kroningen.' },
  regjeringsflyet: { id: 'regjeringsflyet', navn: 'Et tidligere regjeringsfly', kategori: 'fly', tegning: 'forretningsjet', estimat: 2_000_000_000, status: 50, linje: 'Fløy tre statsministre til toppmøter. Kaffemaskinen er fortsatt statens.' },
  prototypen: { id: 'prototypen', navn: 'Prototypen som aldri kom i salg', kategori: 'bil', tegning: 'hyperbil', estimat: 4_000_000_000, status: 60, linje: 'Den eneste som finnes. Fabrikken stoppet serien dagen etter at den sto ferdig.' },
  'store-komplikasjon': { id: 'store-komplikasjon', navn: 'Den første store komplikasjonen', kategori: 'klokke', tegning: 'diamantklokke', estimat: 8_000_000_000, status: 70, linje: 'Tusen deler, åtte år i arbeid og en evighetskalender som går til år 2100.' },
  overlydsflyet: { id: 'overlydsflyet', navn: 'Et pensjonert overlydsfly', kategori: 'fly', tegning: 'langdistansejet', estimat: 15_000_000_000, status: 90, linje: 'Krysset Atlanteren på tre og en halv time. Nå flyr det igjen, med spesialtillatelse.' },
  isbryteren: { id: 'isbryteren', navn: 'Isbryteren som ble yacht', kategori: 'baat', tegning: 'megayacht', estimat: 30_000_000_000, status: 105, linje: 'Brøt is i Barentshavet i førti år. Nå har den basseng, kino og en matros per gjest.' },
}

export const UNIKLISTE = Object.keys(UNIKE) as UnikId[]

/** Navnet midt i en setning: «kjøper urmakerens første klokke», men «Le Mans-vinneren». */
export function unikISetning(id: UnikId): string {
  const navn = UNIKE[id].navn
  return navn.startsWith('Le ') ? navn : navn[0].toLowerCase() + navn.slice(1)
}

/** Det som gikk til en rival eller ble solgt, kan komme under hammeren igjen etter så mange spilldager (ti timer). */
export const TILBAKE_DAGER = 120

/** En unik ting holder seg: den teller i formuen med så mye av det du betalte, og selges for det. */
export const UNIK_RESTVERDI = 0.9

export const eierUnik = (s: Spilltilstand, id: UnikId) => !!s.auksjon?.eide[id]

export function mineUnike(s: Spilltilstand): UnikId[] {
  return UNIKLISTE.filter((id) => s.auksjon?.eide[id])
}

/** Det du får for den hos auksjonshuset — og det den teller i formuen. */
export function unikRestverdi(s: Spilltilstand, id: UnikId): number {
  return (s.auksjon?.eide[id]?.kostpris ?? 0) * UNIK_RESTVERDI
}

export function unikverdi(s: Spilltilstand): number {
  const eide = s.auksjon?.eide
  if (!eide) return 0
  let sum = 0
  for (const id of UNIKLISTE) {
    const e = eide[id]
    if (e) sum += e.kostpris * UNIK_RESTVERDI
  }
  return sum
}

export function unikstatus(s: Spilltilstand): number {
  // Uten mellomliste: statusen regnes flere ganger i sekundet.
  const eide = s.auksjon?.eide
  if (!eide) return 0
  let sum = 0
  for (const id of UNIKLISTE) if (eide[id]) sum += UNIKE[id].status
  return sum
}

/** Hvor mange unike ting i en kategori du eier — de tar plass i garasjen, havna eller hangaren. */
export function unikeI(s: Spilltilstand, kategori: LuksusKategori): number {
  const eide = s.auksjon?.eide
  if (!eide) return 0
  let n = 0
  for (const id of UNIKLISTE) if (eide[id] && UNIKE[id].kategori === kategori) n++
  return n
}
