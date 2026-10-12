/**
 * Tegnene den lille skriftfila har med (Pakke 96). Den fulle Inter-fila er 352 kB med
 * alle verdens skrifter; spillet viser bare norsk og noen få tegn til, så
 * `scripts/lag-skrift.mjs` lager en utgave med disse og ingenting annet.
 *
 * Spillerne skriver bare tall (handel på Børsen), så ingen navn trenger flere bokstaver.
 * `pakke96.test.ts` feiler hvis koden tar i bruk et tegn som ikke står her: legg det til
 * og kjør `lag-skrift.mjs` på nytt. Et tegn fonten ikke har, vises med telefonens egen skrift.
 *
 * Spillet selv importerer ikke denne fila; den er lista til skriptet og testen.
 */

/** Alle tegn fra fra–til, begge med. */
function spenn(fra: number, til: number): string {
  let t = ''
  for (let k = fra; k <= til; k++) t += String.fromCodePoint(k)
  return t
}

/** Tegnsettet: Latin-1 og tegnene spillet faktisk bruker. */
export const TEGN =
  // ASCII og Latin-1 (æøå, é, ü, «», ×, ·, °, ±, hardt mellomrom …)
  spenn(0x20, 0x7e) +
  spenn(0xa0, 0xff) +
  // Mellomrom og tegnsetting: tynt og smalt hardt mellomrom (tall), streker, anførselstegn, prikker
  '  ‐‑–—‘’‚“”„•…‹›' +
  // Euro, senket 0–9 (CO₂), piler
  '€' + spenn(0x2080, 0x2089) + '←↑→↓' +
  // Matte: minus (norsk tallformat), kvadratrot, omtrent, ulik, mindre/større enn eller lik
  '−√≈≠≤≥' +
  // Figurer: trekanter, sirkler, hake og kryss
  '▲▸▼○●✓✕'

/** Tegn som bare står i kommentarer (skillelinjer, BOM), og aldri vises. */
export const KUN_I_KOMMENTARER = '─﻿'
