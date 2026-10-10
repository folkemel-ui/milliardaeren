/**
 * Budsjettet per del av sekundet for det tyngste spillet, to timer borte, i ms
 * (Pakke 64). Målt etter Pakke 64: formue ~115, leie ~100, prestasjoner ~64,
 * inntekt ~39, marked ~30, resten ≤ 12 — grensene gir rundt 40 % slakk for
 * en travel maskin. Summen ligger over totalgrensen på 400 ms med vilje: det
 * er totalen som er telefonbudsjettet, og delene sier hvor det vokste.
 */
export const BUDSJETT: Record<string, number> = {
  formue: 160,
  leie: 140,
  prestasjoner: 90,
  inntekt: 55,
  marked: 45,
  bank: 20,
  'dagsskifte og kø': 20,
  oppussing: 10,
  'sparing og utbytte': 6,
  'utbytte og margin': 6,
}
