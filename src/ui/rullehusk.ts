/**
 * Hvor du var i hver fane (Pakke 74). Byttet du fane, havnet du øverst på den
 * nye — også når du kom tilbake til en side på åtte skjermer. Nå huskes
 * rullingen per fane til siden lastes på nytt, og bare for de samme delene:
 * står fanen på en annen del (Luksus på Kunst, ikke Hjem), starter den øverst.
 * Ren funksjon, så den kan testes.
 */

const husk = new Map<string, { y: number; del: string }>()

/** Husker rullingen `y` i `fane`, mens den viste `del`. */
export function huskRulling(fane: string, y: number, del: string): void {
  husk.set(fane, { y: Math.max(0, Math.round(y)), del })
}

/** Hvor fanen skal åpne: der du sist var, hvis den viser samme del, ellers øverst. */
export function hentRulling(fane: string, del: string): number {
  const m = husk.get(fane)
  return m && m.del === del ? m.y : 0
}

/** Til testene. */
export function glemRulling(): void {
  husk.clear()
}
