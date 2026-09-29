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
  // Tre sifre før kommaet er presist nok: «kr 150 mill», ikke «kr 150,00 mill».
  const kort = (verdi: number, enhet: string) => `kr ${tall(verdi, Math.abs(verdi) >= 100 ? 0 : 2)} ${enhet}`
  // Fra 999,5 mill går det over til milliarder, så det aldri står «kr 1 000 mill».
  if (abs >= 999.5e6) return kort(n / 1e9, 'mrd')
  if (abs >= 1e6) return kort(n / 1e6, 'mill')
  return kroner(n)
}

/** Kroner der det er plass til hele tallet opp til en million, kort form over. */
export function formue(n: number): string {
  return Math.abs(n) >= 1e6 ? kortKroner(n) : kroner(n)
}

/**
 * For toppfeltet, der to tall skal stå side om side: færre desimaler jo
 * større tallet er, så det aldri blir lengre enn «kr 999 mill».
 */
export function kompakt(n: number): string {
  const abs = Math.abs(n)
  const kort = (verdi: number, enhet: string) => {
    const a = Math.abs(verdi)
    return `kr ${tall(verdi, a < 10 ? 2 : a < 100 ? 1 : 0)} ${enhet}`
  }
  if (abs >= 999.5e6) return kort(n / 1e9, 'mrd')
  if (abs >= 1e6) return kort(n / 1e6, 'mill')
  return kroner(n)
}

export function perSek(n: number): string {
  const abs = Math.abs(n)
  const tekst = abs >= 1e6 ? kortKroner(abs) : `kr ${tall(abs, abs < 10 && abs % 1 !== 0 ? 1 : 0)}`
  return `${n >= 0 ? '+' : '−'}${tekst}/s`
}

/** Kurs: to desimaler under tusen, ellers hele kroner. Småmynter får fire. */
export function kurs(n: number): string {
  if (Math.abs(n) >= 1000) return `kr ${tall(n)}`
  if (Math.abs(n) < 1) return `kr ${tall(n, 4)}`
  return `kr ${tall(n, 2)}`
}

/** «+kr 1 240», «−kr 141»; kort form over en million. */
export function fortegnKroner(n: number): string {
  const abs = Math.abs(n)
  return `${n >= 0 ? '+' : '−'}${abs >= 1e6 ? kortKroner(abs) : kroner(abs)}`
}

/** «+3,2 %», «−1,0 %». */
export function endring(andel: number): string {
  const tekst = tall(Math.abs(andel * 100), 1)
  return `${andel >= 0 ? '+' : '−'}${tekst} %`
}

/** Antall aksjer eller mynter: brøkdeler bare når det trengs, og færre jo større tallet er. */
export function antall(n: number): string {
  if (Number.isInteger(n)) return tall(n)
  const abs = Math.abs(n)
  if (abs >= 100) return tall(Math.floor(n))
  // Under én: opptil fire desimaler, men uten nuller på slutten («0,5», ikke «0,5000»).
  const desimaler = abs >= 1 ? 2 : 4
  return n.toLocaleString('nb-NO', { maximumFractionDigits: desimaler })
}

/** «2 t 5 min», «45 s». */
export function varighet(sek: number): string {
  const d = Math.floor(sek / 86_400)
  const t = Math.floor((sek % 86_400) / 3_600)
  const m = Math.floor((sek % 3_600) / 60)
  if (d > 0) return `${d} d ${t} t`
  if (t > 0) return m > 0 ? `${t} t ${m} min` : `${t} t`
  if (m > 0) return `${m} min`
  return `${sek} s`
}
