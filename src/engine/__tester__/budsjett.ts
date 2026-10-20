/**
 * Budsjettet per del av sekundet for det tyngste spillet, to timer borte, i ms
 * (Pakke 64). Målt etter Pakke 64: formue ~115, leie ~100, prestasjoner ~64,
 * inntekt ~39, marked ~30, resten ≤ 12. Etter Pakke 69, som regner formuen,
 * leien og prestasjonene hvert tiende sekund borte: formue ~17, leie ~15,
 * prestasjoner ~9 — totalt ~125 ms. Grensene gir rundt 40 % slakk for en
 * travel maskin.
 */
export const BUDSJETT: Record<string, number> = {
  // 25 → 35 etter Pakke 104: nettoformuen går gjennom alle papirene, og det ble åtte flere (20 alene, 30 under last).
  formue: 35,
  // 22 → 30 etter Pakke 103: leia målte 22 ms alene og 23–25 ms under en hel kjøring (Pakkene 93, 95
  // og 103). Den har vokst med det som betales som leie: de sene eiendommene (Pakke 76), utleien av
  // yachtene og jetene (Pakke 89) og gårdene (Pakkene 92–94).
  leie: 30,
  // Pakke 124: tre råvarer til i det tyngste spillet tok prestasjoner 14 → 15 og inntekt 50 → 53–55 (Folkes ja).
  prestasjoner: 16,
  inntekt: 60,
  // 45 → 55 etter Pakke 104: åtte nye aksjer gjorde markedet 27 → 39–42 ms.
  marked: 55,
  // 20 → 25 etter Pakke 107: målte 19–22 alene og 21–22 under en hel kjøring (to ganger 15. oktober),
  // likt før og etter Pakkene 105–107.
  bank: 25,
  // 20 → 25 etter Pakke 106: målte 19–20 alene og 21 under en hel kjøring (to ganger 15. oktober),
  // likt før og etter Pakkene 105–106 — avisa husker 24 utgaver og har åtte flere aksjer å skrive om.
  'dagsskifte og kø': 25,
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
// 5 → 6,5 etter Pakke 104: de åtte nye aksjene (240 punkter historikk hver) gjorde kopien 4,87 → 5,50 ms
// og sekundet 4,3 → 5,6–5,8 ms. 6,5 → 4,5 etter Pakke 105: kopien deler markedets historikker med
// sekundet før (`kopierSpill`), 5,3 → 2,8 ms, og sekundet ble ~3,0 ms.
export const LEVENDE_SEKUND_MS = 4.5
