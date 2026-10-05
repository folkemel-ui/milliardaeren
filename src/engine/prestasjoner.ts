/**
 * Prestasjoner: milepæler som låses opp én gang og huskes med tidspunktet.
 * Sjekkes hvert sekund i simuleringen, så også kjøp du gjør fanges opp innen
 * ett sekund. Rekkefølgen her er rekkefølgen de vises i.
 */

import { inntektPerSek } from './formler'
import { byerUtenlands, STATUSNIVAAER, statusnivaa, UTENLANDSBYER } from './eiendom'
import { mineLandemerker, LANDEMERKELISTE } from './landemerker'
import { mineMalerier } from './kunst'
import { PAPIRER } from './marked'
import type { PapirId, Spilltilstand } from './types'

/**
 * Verdier flere prestasjoner trenger, regnet ut høyst én gang per sjekk.
 * Sjekken går hvert sekund, så dette sparer mye når du har vært borte.
 */
export interface Felles {
  inntekt: () => number
  status: () => number
  byerUtenlands: () => Set<string>
}

function felles(s: Spilltilstand): Felles {
  let inntekt: number | undefined
  let status: number | undefined
  let byer: Set<string> | undefined
  return {
    inntekt: () => (inntekt ??= inntektPerSek(s)),
    status: () => (status ??= statusnivaa(s)),
    byerUtenlands: () => (byer ??= byerUtenlands(s)),
  }
}

export interface Prestasjon {
  id: string
  navn: string
  beskrivelse: string
  klart: (s: Spilltilstand, f: Felles) => boolean
}

const antallEiendommer = (s: Spilltilstand) => Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0)
const eierKlasse = (s: Spilltilstand, klasse: 'aksje' | 'krypto') =>
  (Object.keys(s.beholdning) as PapirId[]).some((id) => PAPIRER[id].klasse === klasse)

export const PRESTASJONER: Prestasjon[] = [
  { id: 'forste-steg', navn: 'Første steg', beskrivelse: 'Oppgrader en bedrift', klart: (s) => s.bedrifter.some((b) => b.nivaa > 1) },
  { id: 'fem-sifre', navn: 'Fem sifre', beskrivelse: 'Nå en nettoformue på kr 10 000', klart: (s) => s.hoyesteFormue >= 1e4 },
  { id: 'sekssifret', navn: 'Seks sifre', beskrivelse: 'Nå kr 100 000', klart: (s) => s.hoyesteFormue >= 1e5 },
  { id: 'millionaer', navn: 'Millionær', beskrivelse: 'Nå kr 1 mill', klart: (s) => s.hoyesteFormue >= 1e6 },
  { id: 'ti-mill', navn: 'Tosifret million', beskrivelse: 'Nå kr 10 mill', klart: (s) => s.hoyesteFormue >= 1e7 },
  { id: 'hundre-mill', navn: 'Hundre millioner', beskrivelse: 'Nå kr 100 mill', klart: (s) => s.hoyesteFormue >= 1e8 },
  { id: 'milliardaer', navn: 'Milliardær', beskrivelse: 'Nå kr 1 mrd — målet!', klart: (s) => s.hoyesteFormue >= 1e9 },
  { id: 'to-bedrifter', navn: 'Småbedriftseier', beskrivelse: 'Eie to bedrifter', klart: (s) => s.bedrifter.length >= 2 },
  { id: 'fem-bedrifter', navn: 'Konsernsjef', beskrivelse: 'Eie fem bedrifter', klart: (s) => s.bedrifter.length >= 5 },
  { id: 'niva-25', navn: 'Dobbelt opp', beskrivelse: 'Få en bedrift til nivå 25', klart: (s) => s.bedrifter.some((b) => b.nivaa >= 25) },
  { id: 'niva-100', navn: 'Hundre!', beskrivelse: 'Få en bedrift til nivå 100', klart: (s) => s.bedrifter.some((b) => b.nivaa >= 100) },
  { id: 'forste-ansatt', navn: 'Arbeidsgiver', beskrivelse: 'Ansett din første medarbeider', klart: (s) => s.bedrifter.some((b) => b.ansatte > 0) },
  { id: 'forste-leder', navn: 'Delegering', beskrivelse: 'Ansett en leder', klart: (s) => s.bedrifter.some((b) => b.leder) },
  { id: 'inntekt-1000', navn: 'Pengemaskin', beskrivelse: 'Tjen kr 1 000 i sekundet', klart: (_, f) => f.inntekt() >= 1000 },
  { id: 'forste-aksje', navn: 'Børsnybegynner', beskrivelse: 'Kjøp en aksje', klart: (s) => eierKlasse(s, 'aksje') },
  { id: 'forste-krypto', navn: 'Kryptonysgjerrig', beskrivelse: 'Kjøp krypto', klart: (s) => eierKlasse(s, 'krypto') },
  { id: 'utbytte', navn: 'Rentier', beskrivelse: 'Få kr 10 000 i utbytte', klart: (s) => s.totaltUtbytte >= 1e4 },
  { id: 'forste-laan', navn: 'Belånt', beskrivelse: 'Ta opp et lån', klart: (s) => s.gjeld > 0 },
  { id: 'marginkrav', navn: 'Lærepenger', beskrivelse: 'Overlev et marginkrav', klart: (s) => s.hendelser.some((h) => h.tittel === 'Marginkrav') },
  { id: 'huseier', navn: 'Huseier', beskrivelse: 'Kjøp en eiendom', klart: (s) => antallEiendommer(s) >= 1 },
  { id: 'utleier', navn: 'Utleier', beskrivelse: 'Eie fem eiendommer', klart: (s) => antallEiendommer(s) >= 5 },
  { id: 'litt-luksus', navn: 'Litt luksus', beskrivelse: 'Kjøp noe du ikke trenger', klart: (s) => s.luksus.length >= 1 },
  { id: 'rikmann', navn: 'Rikmann', beskrivelse: 'Nå statusnivå 4', klart: (_, f) => f.status() >= 4 },
  { id: 'legende', navn: 'Legende', beskrivelse: 'Nå statusnivået Legende', klart: (_, f) => f.status() >= 7 },
  { id: 'udodelig', navn: 'Udødelig', beskrivelse: 'Nå høyeste statusnivå', klart: (_, f) => f.status() >= STATUSNIVAAER.length - 1 },
  { id: 'utenlands', navn: 'Utflytter', beskrivelse: 'Kjøp eiendom i utlandet', klart: (_, f) => f.byerUtenlands().size >= 1 },
  { id: 'verdensborger', navn: 'Verdensborger', beskrivelse: 'Eie eiendom i alle byene utenlands', klart: (_, f) => f.byerUtenlands().size >= UTENLANDSBYER.length },
  { id: 'jordeier', navn: 'Godseier', beskrivelse: 'Kjøp en gård eller en skog', klart: (s) => Object.keys(s.jord ?? {}).length > 0 },
  { id: 'tommerhogger', navn: 'Tømmerhogger', beskrivelse: 'Hogg en skog', klart: (s) => s.hendelser.some((h) => h.tittel === 'Hogst') },
  { id: 'landemerke', navn: 'Landemerke', beskrivelse: 'Eie et landemerke', klart: (s) => mineLandemerker(s).length > 0 },
  { id: 'alle-landemerker', navn: 'Nasjonalskatt', beskrivelse: 'Eie alle landemerkene samtidig', klart: (s) => mineLandemerker(s).length === LANDEMERKELISTE.length },
  { id: 'kunstsamler', navn: 'Kunstsamler', beskrivelse: 'Eie tre malerier', klart: (s) => mineMalerier(s).length >= 3 },
  { id: 'mesen', navn: 'Mesen', beskrivelse: 'Lån ut et maleri til et museum', klart: (s) => mineMalerier(s).some((id) => s.kunst.eide[id]!.utlant) },
  { id: 'fusjon', navn: 'Fusjonist', beskrivelse: 'Slå sammen en rivals bedrift med din egen', klart: (s) => s.bedrifter.some((b) => (b.fusjoner ?? 0) > 0) },
  { id: 'klubbeier', navn: 'Klubbeier', beskrivelse: 'Kjøp en fotballklubb', klart: (s) => !!s.klubb },
  { id: 'forste-seier', navn: 'Tre poeng', beskrivelse: 'Vinn din første kamp', klart: (s) => (s.klubb?.seire ?? 0) > 0 },
  { id: 'opprykk', navn: 'Opprykk', beskrivelse: 'Rykk opp en divisjon', klart: (s) => (s.klubb?.opprykk ?? 0) > 0 },
  { id: 'seriemester', navn: 'Seriemester', beskrivelse: 'Vinn en serie', klart: (s) => (s.trofeer?.length ?? 0) > 0 },
  { id: 'eliteserie-gull', navn: 'Gull i Eliteserien', beskrivelse: 'Vinn Eliteserien', klart: (s) => (s.trofeer ?? []).some((t) => t.navn.includes('Eliteserien')) },
  { id: 'oljebaron', navn: 'Oljebaron', beskrivelse: 'Kjøp et oljeselskap', klart: (s) => s.bedrifter.some((b) => b.type === 'oljeselskap') },
  { id: 'skikonge', navn: 'Skikonge', beskrivelse: 'Kjøp et skisenter — toppen av stigen', klart: (s) => s.bedrifter.some((b) => b.type === 'skisenter') },
]

/** Stempler nye prestasjoner og oppdaterer rekordene. Muterer — brukes på kopier. */
export function sjekkPrestasjoner(s: Spilltilstand): string[] {
  const nye: string[] = []
  const f = felles(s)
  for (const p of PRESTASJONER) {
    if (s.prestasjoner[p.id] === undefined && p.klart(s, f)) {
      s.prestasjoner[p.id] = s.sek
      nye.push(p.id)
      // En ny prestasjon har ikke endret tilstanden noe annet enn stempelet, så de felles verdiene står.
    }
  }
  const inntekt = f.inntekt()
  if (inntekt > s.rekorder.hoyesteInntekt) s.rekorder.hoyesteInntekt = inntekt
  return nye
}
