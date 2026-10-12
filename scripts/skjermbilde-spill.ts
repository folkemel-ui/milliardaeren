/**
 * Spillet på butikkbildet (Pakke 97): et spill midtveis, rundt 40 mrd. Sju av de tretten
 * bedriftene, de billige langt oppe og de dyre på vei, med forbedringer, retning og folk,
 * og nok kontanter til at oppgraderingsknappene lyser. Midt på dagen i spillet, så
 * tegningene ikke står i kveldsmørke. Lastes av scripts/lag-skjermbilder.mjs.
 */
import * as h from '../src/engine/handlinger'
import { nettoformue } from '../src/engine/formler'
import { nyttSpill } from '../src/engine/start'
import { simuler } from '../src/engine/simulering'
import { STIGEN } from '../src/engine/innhold'
import { DAG_SEK } from '../src/engine/kalender'
import type { Spilltilstand } from '../src/engine/types'

/** Nivået hver bedrift får, i stigens rekkefølge. */
const NIVAA = [100, 80, 70, 60, 50, 50, 40]

export function midtspill(): Spilltilstand {
  let s = nyttSpill(2027)
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  const prov = (u: h.Utfall) => {
    if (u.ok) s = u.tilstand
  }
  STIGEN.slice(0, NIVAA.length).forEach((type, i) => {
    prov(h.kjopBedrift(s, type))
    const b = s.bedrifter.find((x) => x.type === type)!
    prov(h.oppgraderFlere(s, b.id, NIVAA[i] - 1))
    // De tidlige har alle tre forbedringene, de neste én eller to, de dyreste ingen.
    for (let f = 0; f < Math.max(0, 3 - Math.floor(i / 3)); f++) prov(h.kjopForbedring(s, b.id))
    // Retning på alle som kan, så lista ikke åpner med «venter på retning».
    prov(h.velgRetning(s, b.id, i % 2 ? 'premium' : 'volum'))
    for (let a = 0; a < 4 - Math.floor(i / 3); a++) prov(h.ansett(s, b.id))
  })
  s = simuler(s, 240)
  // Til kl. 12 i spillet.
  s = simuler(s, (((DAG_SEK / 2 - (s.sek % DAG_SEK)) % DAG_SEK) + DAG_SEK) % DAG_SEK)
  // Kontanter til at oppgraderingsknappene lyser: 3 % av nettoformuen.
  s.kontanter = 0
  s.kontanter = Math.round(nettoformue(s) * 0.03)
  s.hoyesteFormue = nettoformue(s)
  return s
}
