/**
 * Budsjettet per del av sekundet for det tyngste spillet, to timer borte, i ms
 * (Pakke 64). Målt etter Pakke 64: formue ~115, leie ~100, prestasjoner ~64,
 * inntekt ~39, marked ~30, resten ≤ 12. Etter Pakke 69, som regner formuen,
 * leien og prestasjonene hvert tiende sekund borte: formue ~17, leie ~15,
 * prestasjoner ~9 — totalt ~125 ms. Grensene gir rundt 40 % slakk for en
 * travel maskin.
 */
export const BUDSJETT: Record<string, number> = {
  formue: 25,
  leie: 22,
  prestasjoner: 14,
  inntekt: 55,
  marked: 45,
  bank: 20,
  'dagsskifte og kø': 20,
  oppussing: 10,
  'sparing og utbytte': 6,
  'utbytte og margin': 6,
}

/**
 * Ett sekund mens du spiller, på det tyngste spillet etter to timer, i ms
 * (Pakke 69). Det meste er kopien av hele spillet (structuredClone), som gjør
 * hvert sekund til en ny tilstand skjermen kan sammenligne med den forrige.
 * Målt ~3,7 ms (≈ 18 ms på en treg telefon, ett bilde); vokser den, er det
 * lagringen som har vokst.
 */
export const LEVENDE_SEKUND_MS = 5
