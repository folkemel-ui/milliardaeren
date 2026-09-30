import { hashTekst } from '../../engine/rng'

/** Dempede farger som tåler hvit tekst i begge temaene. */
const FARGER = ['#2f5d8a', '#2f6b3a', '#8e2f3a', '#6b4e9c', '#9c6b1c', '#1f6f66', '#7a3e5a', '#3f4f6b']

/**
 * Logoen til en startup: initialene på en farget flis, som en ekte
 * selskapslogo. Fargen kommer fra navnet, så samme selskap alltid ser likt ut.
 */
export function StartupLogo({ navn, liten = false }: { navn: string; liten?: boolean }) {
  const ord = navn.split(/[\s-]+/).filter(Boolean)
  // Ett ord gir de to første bokstavene («Matbudet» → «MA»), flere ord første bokstav i hvert.
  const initialer = (ord.length > 1 ? ord[0][0] + ord[1][0] : navn.slice(0, 2)).toUpperCase()
  const farge = FARGER[Math.abs(hashTekst(navn)) % FARGER.length]
  return (
    <span className={liten ? 'startup-logo liten' : 'startup-logo'} style={{ background: farge }} aria-hidden="true">
      {initialer}
    </span>
  )
}
