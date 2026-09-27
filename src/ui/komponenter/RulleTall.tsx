import { useEffect, useRef, useState } from 'react'

function redusertBevegelse(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Tallet ruller mot ny verdi i stedet for å hoppe. Kommer en ny verdi midt i
 * en rulling, fortsetter den fra det som vises nå — ikke fra forrige mål.
 */
export function RulleTall({ verdi, format }: { verdi: number; format: (n: number) => string }) {
  const [vist, settVist] = useState(verdi)
  const vistRef = useRef(verdi)

  useEffect(() => {
    const fra = vistRef.current
    if (fra === verdi) return
    const vis = (n: number) => {
      vistRef.current = n
      settVist(n)
    }
    if (redusertBevegelse()) {
      vis(verdi)
      return
    }
    const start = performance.now()
    // Litt kortere enn ett spillsekund, så tallet står stille et øyeblikk før neste inntekt.
    const lengde = 800
    let raf = 0
    const steg = (naa: number) => {
      const t = Math.min(1, (naa - start) / lengde)
      const glatt = 1 - Math.pow(1 - t, 3)
      vis(fra + (verdi - fra) * glatt)
      if (t < 1) raf = requestAnimationFrame(steg)
    }
    raf = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(raf)
  }, [verdi])

  return <>{format(vist)}</>
}
