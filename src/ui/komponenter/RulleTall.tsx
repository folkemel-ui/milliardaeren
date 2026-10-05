import { useEffect, useRef, useState } from 'react'
import { redusertBevegelse } from '../innstillinger'

/**
 * Tallet ruller mot ny verdi i stedet for å hoppe. Kommer en ny verdi midt i
 * en rulling, fortsetter den fra det som vises nå — ikke fra forrige mål.
 *
 * Med `fra` teller tallet opp fra den verdien når det dukker opp — for tall
 * du ser for første gang, som et oppgjør (fra null) eller formuen på
 * velkomstskjermen (fra det den var da du gikk).
 */
export function RulleTall({ verdi, format, fra }: { verdi: number; format: (n: number) => string; fra?: number }) {
  const start0 = fra !== undefined && !redusertBevegelse() ? fra : verdi
  const [vist, settVist] = useState(start0)
  const vistRef = useRef(start0)
  const førsteGang = useRef(fra !== undefined)

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
    // Opptellingen fra null får litt lengre tid, så den rekker å synes.
    const lengde = førsteGang.current ? 1100 : 800
    let raf = 0
    const steg = (naa: number) => {
      const t = Math.min(1, (naa - start) / lengde)
      const glatt = 1 - Math.pow(1 - t, 3)
      vis(fra + (verdi - fra) * glatt)
      if (t < 1) raf = requestAnimationFrame(steg)
      else førsteGang.current = false
    }
    raf = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(raf)
  }, [verdi])

  return <>{format(vist)}</>
}
