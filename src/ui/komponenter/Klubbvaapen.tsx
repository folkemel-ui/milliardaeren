import { memo, useId } from 'react'
import { hashTekst } from '../../engine/rng'

/**
 * Klubbvåpenet: et skjold i klubbens to farger, med et mønster og initialene
 * på et merke midt på. Farger og mønster kommer fra navnet, så samme klubb
 * alltid ser lik ut — også motstanderne i tabellen.
 *
 * Initialene er HTML over tegningen, ikke <text> i SVG-en, som resten av
 * illustrasjonene (se Illustrasjoner.tsx).
 */

/** Fargepar: skjoldet og detaljene. Mørke nok til at hvitt merke og tekst leses. */
const DRAKTER: [string, string][] = [
  ['#1e3a5f', '#f4d35e'],
  ['#8e2f3a', '#f8f6f1'],
  ['#2f6b3a', '#f8f6f1'],
  ['#2b2622', '#d4af37'],
  ['#2f5d8a', '#f8f6f1'],
  ['#a33030', '#1e3a5f'],
  ['#6b4e9c', '#f4d35e'],
  ['#1f6f66', '#f4a261'],
  ['#b5563c', '#2b2622'],
  ['#235f91', '#d64545'],
]

type Monster = 'striper' | 'skraa' | 'belte' | 'delt'
const MONSTER: Monster[] = ['striper', 'skraa', 'belte', 'delt']

/** Skjoldet på et 40×48-rutenett: rett topp, spiss bunn. */
const SKJOLD = 'M4 4 H36 V22 C36 34 28 41 20 45 C12 41 4 34 4 22 Z'

/** «Fjordby IL» → «FIL», «Kvitfjell BK» → «KBK», «Lia IL» → «LIL»; uten forkortelse de to første ordene. */
export function initialer(navn: string): string {
  const ord = navn.split(/\s+/).filter(Boolean)
  const sist = ord.at(-1) ?? ''
  if (ord.length > 1 && /^[A-ZÆØÅ]{2,3}$/.test(sist)) return (ord[0][0] + sist).toUpperCase()
  return ord
    .slice(0, 2)
    .map((o) => o[0])
    .join('')
    .toUpperCase()
}

export function drakt(navn: string): { farger: [string, string]; monster: Monster } {
  const h = Math.abs(hashTekst(navn))
  return { farger: DRAKTER[h % DRAKTER.length], monster: MONSTER[Math.floor(h / DRAKTER.length) % MONSTER.length] }
}

function Monsterlag({ monster, farge }: { monster: Monster; farge: string }) {
  switch (monster) {
    case 'striper':
      return (
        <>
          <rect x="10" y="0" width="5" height="48" fill={farge} />
          <rect x="25" y="0" width="5" height="48" fill={farge} />
        </>
      )
    case 'skraa':
      return <polygon points="0,10 10,0 44,34 34,44" fill={farge} />
    case 'belte':
      // Under merket (som går ned til y = 31,5), så beltet synes i alle farger.
      return <rect x="0" y="33.5" width="40" height="6" fill={farge} />
    case 'delt':
      return <rect x="20" y="0" width="20" height="48" fill={farge} />
  }
}

export const Klubbvaapen = memo(function Klubbvaapen({ navn, størrelse = 44 }: { navn: string; størrelse?: number }) {
  const klipp = useId()
  const { farger, monster } = drakt(navn)
  const [bunn, detalj] = farger
  const tekst = initialer(navn)
  return (
    <span className="klubbvaapen" style={{ width: størrelse * (40 / 48), height: størrelse }} aria-hidden="true">
      <svg width={størrelse * (40 / 48)} height={størrelse} viewBox="0 0 40 48">
        <defs>
          <clipPath id={klipp}>
            <path d={SKJOLD} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${klipp})`}>
          <rect x="0" y="0" width="40" height="48" fill={bunn} />
          <Monsterlag monster={monster} farge={detalj} />
        </g>
        <path d={SKJOLD} fill="none" stroke={detalj} strokeWidth="2" />
        <circle cx="20" cy="21" r="10.5" fill="#f8f6f1" stroke={bunn} strokeWidth="1.5" />
      </svg>
      <span
        className="klubbvaapen-tekst"
        style={{ color: bunn, fontSize: størrelse * (tekst.length > 2 ? 0.17 : 0.22), top: størrelse * (21 / 48) }}
      >
        {tekst}
      </span>
    </span>
  )
})
