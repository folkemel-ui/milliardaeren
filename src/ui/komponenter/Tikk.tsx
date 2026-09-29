import { useEffect, useRef, useState } from 'react'

/** Bevegelser mindre enn dette (som andel) blinker ikke — et rolig marked skal se rolig ut. */
const TERSKEL = 0.0005

type Retning = 'opp' | 'ned'

/**
 * Husker forrige verdi og sier hvilken vei den siste merkbare endringen gikk.
 * `teller` øker for hver endring, så en animasjon kan startes på nytt med den som key.
 */
export function useRetning(verdi: number): { retning: Retning | null; teller: number } {
  const forrige = useRef(verdi)
  const [tilstand, settTilstand] = useState<{ retning: Retning | null; teller: number }>({ retning: null, teller: 0 })
  useEffect(() => {
    const fra = forrige.current
    if (fra > 0 && Math.abs(verdi / fra - 1) >= TERSKEL) {
      settTilstand((t) => ({ retning: verdi > fra ? 'opp' : 'ned', teller: t.teller + 1 }))
      forrige.current = verdi
    } else if (fra <= 0) {
      forrige.current = verdi
    }
  }, [verdi])
  return tilstand
}

/**
 * En kurs som blinker grønt eller rødt når den flytter seg, med en liten pil
 * for retningen på siste bevegelse. Pilen blir stående, blinket forsvinner.
 */
export function Tikkekurs({ verdi, format, className = '' }: { verdi: number; format: (n: number) => string; className?: string }) {
  const { retning, teller } = useRetning(verdi)
  return (
    <span className={`tikk ${className}`}>
      {retning && (
        <span className={`tikk-pil ${retning}`} aria-hidden="true">
          {retning === 'opp' ? '▲' : '▼'}
        </span>
      )}
      <span key={teller} className={retning && teller > 0 ? `tikk-tall blink-${retning}` : 'tikk-tall'}>
        {format(verdi)}
      </span>
    </span>
  )
}

/**
 * En puls når noe går opp: gir en klasse som bytter mellom to like
 * animasjoner hver gang `teller` øker, så pulsen starter på nytt uten at
 * elementet må lages på nytt. Første visning gir ingen puls.
 */
export function usePuls(teller: number, gull = false): string {
  const forrige = useRef(teller)
  const [puls, settPuls] = useState<{ n: number; gull: boolean }>({ n: 0, gull: false })
  useEffect(() => {
    if (teller > forrige.current) settPuls((p) => ({ n: p.n + 1, gull }))
    forrige.current = teller
  }, [teller, gull])
  if (puls.n === 0) return ''
  return `${puls.gull ? 'puls-gull' : 'puls'}-${puls.n % 2 ? 'a' : 'b'}`
}
