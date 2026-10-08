/**
 * Tall og beløp på norsk. Bor i motoren, så avisa og hendelsene skriver beløp
 * akkurat som grensesnittet («kr 1,25 mill»); ui/format.ts eksporterer dem videre.
 */

/*
 * Én formaterer per antall desimaler. toLocaleString lager en ny hver gang,
 * og det er rundt 25 ganger tregere — merkbart når hundrevis av tall tegnes
 * hvert sekund. Resultatet er det samme.
 */
const formaterere = new Map<number, Intl.NumberFormat>()

export function tall(n: number, desimaler = 0): string {
  // Det som rundes til null, er null — ikke «−0» (Pakke 58).
  const verdi = Number.isFinite(n) && Math.abs(n) >= 0.5 / 10 ** desimaler ? n : 0
  let f = formaterere.get(desimaler)
  if (!f) {
    f = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: desimaler, maximumFractionDigits: desimaler })
    formaterere.set(desimaler, f)
  }
  return f.format(verdi)
}

/**
 * «kr 12 345». Brøkdeler rundes ned, så tallet aldri viser penger du ikke har —
 * men et flyttallsrest som −0,000000001 er null, ikke «kr −1».
 */
export function kroner(n: number): string {
  return `kr ${tall(Math.floor(n + 1e-6))}`
}

/**
 * Kort form for store beløp: «kr 1,25 mill», «kr 12,5 mill», «kr 150 mill».
 * Tre gjeldende sifre, uten nuller på slutten — «kr 12 mill», ikke «kr 12,00 mill».
 * Over tusen milliarder blir det billioner: «kr 1,5 bill» (Pakke 47).
 */
export function kortKroner(n: number): string {
  const abs = Math.abs(n)
  const kort = (verdi: number, enhet: string) => {
    const a = Math.abs(verdi)
    const tekst = tall(verdi, a < 10 ? 2 : a < 100 ? 1 : 0).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '')
    return `kr ${tekst} ${enhet}`
  }
  // Fra 999,5 mill går det over til milliarder, så det aldri står «kr 1 000 mill» — og videre til billioner.
  if (abs >= 999.5e9) return kort(n / 1e12, 'bill')
  if (abs >= 999.5e6) return kort(n / 1e9, 'mrd')
  if (abs >= 1e6) return kort(n / 1e6, 'mill')
  return kroner(n)
}
