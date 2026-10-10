/**
 * Utseendet til hver prestasjon: ikonet i medaljen og graden — bronse for
 * de første skrittene, sølv for det som tar tid, gull for de store målene.
 * Hører til grensesnittet, ikke motoren; motoren vet bare om prestasjonen er
 * nådd. Alle prestasjoner må ha en rad her (en test passer på det).
 */

import type { Ikonnavn } from './komponenter/Ikoner'

export type Grad = 'bronse' | 'solv' | 'gull'

export const MERKER: Record<string, { ikon: Ikonnavn; grad: Grad }> = {
  'forste-steg': { ikon: 'pil', grad: 'bronse' },
  'fem-sifre': { ikon: 'mynt', grad: 'bronse' },
  sekssifret: { ikon: 'mynt', grad: 'bronse' },
  millionaer: { ikon: 'gnist', grad: 'solv' },
  'ti-mill': { ikon: 'graf', grad: 'solv' },
  'hundre-mill': { ikon: 'bank', grad: 'solv' },
  milliardaer: { ikon: 'krone', grad: 'gull' },
  'ti-mrd': { ikon: 'graf', grad: 'gull' },
  'hundre-mrd': { ikon: 'bank', grad: 'gull' },
  billionaer: { ikon: 'krone', grad: 'gull' },
  'to-bedrifter': { ikon: 'bedrift', grad: 'bronse' },
  'fem-bedrifter': { ikon: 'bedrift', grad: 'solv' },
  'forste-filial': { ikon: 'bedrift', grad: 'bronse' },
  innflytting: { ikon: 'hus', grad: 'bronse' },
  drommehjem: { ikon: 'hus', grad: 'gull' },
  landsdekkende: { ikon: 'bedrift', grad: 'gull' },
  'niva-25': { ikon: 'pil', grad: 'bronse' },
  'niva-100': { ikon: 'pil', grad: 'gull' },
  'forste-ansatt': { ikon: 'personer', grad: 'bronse' },
  'forste-leder': { ikon: 'person', grad: 'bronse' },
  'inntekt-1000': { ikon: 'lyn', grad: 'solv' },
  'forste-aksje': { ikon: 'graf', grad: 'bronse' },
  'forste-krypto': { ikon: 'mynt', grad: 'bronse' },
  utbytte: { ikon: 'kvittering', grad: 'solv' },
  'forste-laan': { ikon: 'bank', grad: 'bronse' },
  marginkrav: { ikon: 'advarsel', grad: 'solv' },
  huseier: { ikon: 'nokkel', grad: 'bronse' },
  utleier: { ikon: 'hus', grad: 'solv' },
  'litt-luksus': { ikon: 'diamant', grad: 'bronse' },
  rikmann: { ikon: 'stjerne', grad: 'solv' },
  legende: { ikon: 'stjerne', grad: 'gull' },
  udodelig: { ikon: 'krone', grad: 'gull' },
  utenlands: { ikon: 'fly', grad: 'solv' },
  verdensborger: { ikon: 'globus', grad: 'gull' },
  jordeier: { ikon: 'aks', grad: 'solv' },
  tommerhogger: { ikon: 'gran', grad: 'solv' },
  landemerke: { ikon: 'tarn', grad: 'solv' },
  'alle-landemerker': { ikon: 'borg', grad: 'gull' },
  kunstsamler: { ikon: 'ramme', grad: 'solv' },
  mesen: { ikon: 'bank', grad: 'solv' },
  fusjon: { ikon: 'fusjon', grad: 'solv' },
  klubbeier: { ikon: 'ball', grad: 'solv' },
  'forste-seier': { ikon: 'ball', grad: 'bronse' },
  opprykk: { ikon: 'pil', grad: 'solv' },
  seriemester: { ikon: 'trofe', grad: 'gull' },
  'eliteserie-gull': { ikon: 'medalje', grad: 'gull' },
  oljebaron: { ikon: 'drape', grad: 'gull' },
  skikonge: { ikon: 'fjell', grad: 'gull' },
  // Pakke 70: de skjulte.
  gjeldfri: { ikon: 'bank', grad: 'solv' },
  kontraer: { ikon: 'graf', grad: 'gull' },
  'hele-stigen': { ikon: 'bedrift', grad: 'gull' },
  'helt-aar': { ikon: 'sol', grad: 'solv' },
  samleren: { ikon: 'diamant', grad: 'gull' },
}

/** For en prestasjon som mangler i tabellen: en nøytral stjerne i bronse. */
export function merkeFor(id: string): { ikon: Ikonnavn; grad: Grad } {
  return MERKER[id] ?? { ikon: 'stjerne', grad: 'bronse' }
}
