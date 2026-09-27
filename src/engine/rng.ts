/** Deterministisk pseudotilfeldighet, så samme spill kan gjenspilles fra samme frø. */
export function nesteFro(fro: number): number {
  return (fro + 0x6d2b79f5) | 0
}

export function tilfeldig(fro: number): number {
  let t = (fro + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** FNV-1a — en stabil tallverdi av en tekst, til frø som ikke skal avhenge av terningen. */
export function hashTekst(tekst: string): number {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h | 0
}

/** Liten hjelpeklasse så simuleringen slipper å tråkle frøet gjennom alt. */
export class Terning {
  constructor(public fro: number) {}
  neste(): number {
    this.fro = nesteFro(this.fro)
    return tilfeldig(this.fro)
  }
  mellom(min: number, maks: number): number {
    return min + this.neste() * (maks - min)
  }
  heltall(min: number, maks: number): number {
    return Math.floor(this.mellom(min, maks + 1))
  }
  velg<T>(liste: readonly T[]): T {
    return liste[Math.min(liste.length - 1, Math.floor(this.neste() * liste.length))]
  }
  sjanse(p: number): boolean {
    return this.neste() < p
  }
}
