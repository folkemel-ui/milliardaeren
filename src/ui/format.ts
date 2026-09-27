/** Tallformatering. Norske tall, hele kroner. */

export function tall(n: number, desimaler = 0): string {
  const verdi = Number.isFinite(n) ? n : 0
  return verdi.toLocaleString('nb-NO', {
    minimumFractionDigits: desimaler,
    maximumFractionDigits: desimaler,
  })
}

/** «kr 12 345». Brøkdeler rundes ned, så tallet aldri viser penger du ikke har. */
export function kroner(n: number): string {
  return `kr ${tall(Math.floor(n))}`
}

/** Kort form for store beløp: «kr 1,25 mill», «kr 3,40 mrd». */
export function kortKroner(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `kr ${tall(n / 1e9, 2)} mrd`
  if (abs >= 1e6) return `kr ${tall(n / 1e6, 2)} mill`
  return kroner(n)
}

/** Kroner der det er plass til hele tallet opp til en million, kort form over. */
export function formue(n: number): string {
  return Math.abs(n) >= 1e6 ? kortKroner(n) : kroner(n)
}

export function perSek(n: number): string {
  const abs = Math.abs(n)
  const tekst = abs >= 1e6 ? kortKroner(n) : `kr ${tall(n, abs < 10 && n % 1 !== 0 ? 1 : 0)}`
  return `${n >= 0 ? '+' : '−'}${tekst.replace('-', '')}/s`
}

/** «2 t 5 min», «45 s». */
export function varighet(sek: number): string {
  const d = Math.floor(sek / 86_400)
  const t = Math.floor((sek % 86_400) / 3_600)
  const m = Math.floor((sek % 3_600) / 60)
  if (d > 0) return `${d} d ${t} t`
  if (t > 0) return `${t} t ${m} min`
  if (m > 0) return `${m} min`
  return `${sek} s`
}
