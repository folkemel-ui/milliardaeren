/**
 * Historikklister som deles mellom to tilstander (etter Pakke 105). Et levende sekund
 * kopierer ikke markedets historikker, men lar den nye tilstanden peke på de samme
 * listene (`kopierSpill` i simulering.ts) og merker dem her. Den som skal legge til et
 * punkt i en merket liste, tar en egen kopi først — én gang per liste og simulering,
 * deretter legges det til i kopien som før. Slik står den gamle tilstanden urørt, og
 * to timer borte kopierer hver liste én gang i stedet for ved hvert punkt.
 */

const DELTE = new WeakSet<number[]>()

/** Merker en liste som delt med en annen tilstand: den må ikke endres der den står. */
export function merkDelt(liste: number[] | undefined): void {
  if (liste) DELTE.add(liste)
}

/**
 * Legger et punkt til en historikk og tar ut det eldste når den er full. Gir listen
 * tilbake — en ny kopi hvis den var delt — så den må skrives tilbake: `k.historikk = medPunkt(…)`.
 */
export function medPunkt(liste: number[], x: number, maks: number): number[] {
  const l = DELTE.has(liste) ? liste.slice() : liste
  l.push(x)
  if (l.length > maks) l.shift()
  return l
}
