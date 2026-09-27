/**
 * Prestasjoner: milepæler som låses opp én gang og huskes med tidspunktet.
 * Sjekkes hvert sekund i simuleringen, så også kjøp du gjør fanges opp innen
 * ett sekund. Rekkefølgen her er rekkefølgen de vises i.
 */

import { inntektPerSek } from './formler'
import { byerUtenlands, statusnivaa, UTENLANDSBYER } from './eiendom'
import { PAPIRER } from './marked'
import type { PapirId, Spilltilstand } from './types'

export interface Prestasjon {
  id: string
  navn: string
  beskrivelse: string
  emoji: string
  klart: (s: Spilltilstand) => boolean
}

const antallEiendommer = (s: Spilltilstand) => Object.values(s.eiendommer).reduce((a, b) => a + (b ?? 0), 0)
const eierKlasse = (s: Spilltilstand, klasse: 'aksje' | 'krypto') =>
  (Object.keys(s.beholdning) as PapirId[]).some((id) => PAPIRER[id].klasse === klasse)

export const PRESTASJONER: Prestasjon[] = [
  { id: 'forste-steg', navn: 'Første steg', beskrivelse: 'Oppgrader en bedrift', emoji: '👣', klart: (s) => s.bedrifter.some((b) => b.nivaa > 1) },
  { id: 'fem-sifre', navn: 'Fem sifre', beskrivelse: 'Nå en nettoformue på 10 000 kr', emoji: '💵', klart: (s) => s.hoyesteFormue >= 1e4 },
  { id: 'sekssifret', navn: 'Seks sifre', beskrivelse: 'Nå 100 000 kr', emoji: '💰', klart: (s) => s.hoyesteFormue >= 1e5 },
  { id: 'millionaer', navn: 'Millionær', beskrivelse: 'Nå 1 million kr', emoji: '🥂', klart: (s) => s.hoyesteFormue >= 1e6 },
  { id: 'ti-mill', navn: 'Tosifret million', beskrivelse: 'Nå 10 millioner kr', emoji: '🍾', klart: (s) => s.hoyesteFormue >= 1e7 },
  { id: 'hundre-mill', navn: 'Hundre millioner', beskrivelse: 'Nå 100 millioner kr', emoji: '🏦', klart: (s) => s.hoyesteFormue >= 1e8 },
  { id: 'milliardaer', navn: 'Milliardær', beskrivelse: 'Nå 1 milliard kr — målet!', emoji: '👑', klart: (s) => s.hoyesteFormue >= 1e9 },
  { id: 'to-bedrifter', navn: 'Småbedriftseier', beskrivelse: 'Eie to bedrifter', emoji: '🏪', klart: (s) => s.bedrifter.length >= 2 },
  { id: 'fem-bedrifter', navn: 'Konsernsjef', beskrivelse: 'Eie fem bedrifter', emoji: '🏢', klart: (s) => s.bedrifter.length >= 5 },
  { id: 'niva-25', navn: 'Dobbelt opp', beskrivelse: 'Få en bedrift til nivå 25', emoji: '✌️', klart: (s) => s.bedrifter.some((b) => b.nivaa >= 25) },
  { id: 'niva-100', navn: 'Hundre!', beskrivelse: 'Få en bedrift til nivå 100', emoji: '💯', klart: (s) => s.bedrifter.some((b) => b.nivaa >= 100) },
  { id: 'forste-ansatt', navn: 'Arbeidsgiver', beskrivelse: 'Ansett din første medarbeider', emoji: '🤝', klart: (s) => s.bedrifter.some((b) => b.ansatte > 0) },
  { id: 'forste-leder', navn: 'Delegering', beskrivelse: 'Ansett en leder', emoji: '👔', klart: (s) => s.bedrifter.some((b) => b.leder) },
  { id: 'inntekt-1000', navn: 'Pengemaskin', beskrivelse: 'Tjen 1 000 kr i sekundet', emoji: '⚙️', klart: (s) => inntektPerSek(s) >= 1000 },
  { id: 'forste-aksje', navn: 'Børsnybegynner', beskrivelse: 'Kjøp en aksje', emoji: '📈', klart: (s) => eierKlasse(s, 'aksje') },
  { id: 'forste-krypto', navn: 'Kryptonysgjerrig', beskrivelse: 'Kjøp krypto', emoji: '🪙', klart: (s) => eierKlasse(s, 'krypto') },
  { id: 'utbytte', navn: 'Rentier', beskrivelse: 'Få 10 000 kr i utbytte', emoji: '🧾', klart: (s) => s.totaltUtbytte >= 1e4 },
  { id: 'forste-laan', navn: 'Belånt', beskrivelse: 'Ta opp et lån', emoji: '🏧', klart: (s) => s.gjeld > 0 },
  { id: 'marginkrav', navn: 'Lærepenger', beskrivelse: 'Overlev et marginkrav', emoji: '🩹', klart: (s) => s.hendelser.some((h) => h.tittel === 'Marginkrav') },
  { id: 'huseier', navn: 'Huseier', beskrivelse: 'Kjøp en eiendom', emoji: '🔑', klart: (s) => antallEiendommer(s) >= 1 },
  { id: 'utleier', navn: 'Utleier', beskrivelse: 'Eie fem eiendommer', emoji: '🏘️', klart: (s) => antallEiendommer(s) >= 5 },
  { id: 'litt-luksus', navn: 'Litt luksus', beskrivelse: 'Kjøp noe du ikke trenger', emoji: '🛍️', klart: (s) => s.luksus.length >= 1 },
  { id: 'rikmann', navn: 'Rikmann', beskrivelse: 'Nå statusnivå 4', emoji: '🎩', klart: (s) => statusnivaa(s) >= 4 },
  { id: 'legende', navn: 'Legende', beskrivelse: 'Nå høyeste statusnivå', emoji: '🌟', klart: (s) => statusnivaa(s) >= 7 },
  { id: 'utenlands', navn: 'Utflytter', beskrivelse: 'Kjøp eiendom i utlandet', emoji: '🧳', klart: (s) => byerUtenlands(s).size >= 1 },
  { id: 'verdensborger', navn: 'Verdensborger', beskrivelse: 'Eie eiendom i alle byene utenlands', emoji: '🌍', klart: (s) => byerUtenlands(s).size >= UTENLANDSBYER.length },
  { id: 'fusjon', navn: 'Fusjonist', beskrivelse: 'Slå sammen en rivals bedrift med din egen', emoji: '🧩', klart: (s) => s.bedrifter.some((b) => (b.fusjoner ?? 0) > 0) },
  { id: 'klubbeier', navn: 'Klubbeier', beskrivelse: 'Kjøp en fotballklubb', emoji: '⚽', klart: (s) => !!s.klubb },
  { id: 'forste-seier', navn: 'Tre poeng', beskrivelse: 'Vinn din første kamp', emoji: '🥅', klart: (s) => (s.klubb?.seire ?? 0) > 0 },
  { id: 'opprykk', navn: 'Opprykk', beskrivelse: 'Rykk opp en divisjon', emoji: '📣', klart: (s) => (s.klubb?.opprykk ?? 0) > 0 },
  { id: 'seriemester', navn: 'Seriemester', beskrivelse: 'Vinn en serie', emoji: '🏆', klart: (s) => (s.trofeer?.length ?? 0) > 0 },
  { id: 'eliteserie-gull', navn: 'Gull i Eliteserien', beskrivelse: 'Vinn Eliteserien', emoji: '🥇', klart: (s) => (s.trofeer ?? []).some((t) => t.navn.includes('Eliteserien')) },
  { id: 'oljebaron', navn: 'Oljebaron', beskrivelse: 'Kjøp et oljeselskap', emoji: '🛢️', klart: (s) => s.bedrifter.some((b) => b.type === 'oljeselskap') },
]

/** Stempler nye prestasjoner og oppdaterer rekordene. Muterer — brukes på kopier. */
export function sjekkPrestasjoner(s: Spilltilstand): string[] {
  const nye: string[] = []
  for (const p of PRESTASJONER) {
    if (s.prestasjoner[p.id] === undefined && p.klart(s)) {
      s.prestasjoner[p.id] = s.sek
      nye.push(p.id)
    }
  }
  const inntekt = inntektPerSek(s)
  if (inntekt > s.rekorder.hoyesteInntekt) s.rekorder.hoyesteInntekt = inntekt
  return nye
}
