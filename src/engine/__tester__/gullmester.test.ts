/**
 * Golden master: boten spiller et fast antall sekunder fra standardoppstillingen,
 * og sluttilstandens nøkkeltall er låst i gullmester.fasit.json. Enhver
 * utilsiktet endring i motorens økonomi gir rød test her — det er hele poenget.
 *
 * Endrer du motoren MED VILJE, oppdater fasiten og forklar det i commit-meldingen:
 *
 *     $env:OPPDATER_FASIT=1; npm test
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { inntektPerSek, nettoformue } from '../formler'
import type { Spilltilstand } from '../types'
import { botSpill } from './bot'

const FASIT_STI = fileURLToPath(new URL('./gullmester.fasit.json', import.meta.url))
/** Fire timer spilletid. */
const SEKUNDER = 4 * 60 * 60

const avrund = (n: number) => Math.round(n * 100) / 100

function fingeravtrykk(s: Spilltilstand) {
  return {
    sek: s.sek,
    frø: s.frø,
    kontanter: avrund(s.kontanter),
    totaltTjent: avrund(s.totaltTjent),
    nettoformue: avrund(nettoformue(s)),
    hoyesteFormue: avrund(s.hoyesteFormue),
    inntektPerSek: avrund(inntektPerSek(s)),
    bedrifter: s.bedrifter.map((b) => `${b.type} nivå ${b.nivaa}, ${b.ansatte} ansatte`),
    historikkIntervall: s.historikk.intervall,
    historikkPunkter: s.historikk.punkter.length,
  }
}

describe('golden master', () => {
  it(`boten spiller ${SEKUNDER} sekunder og treffer fasiten eksakt`, { timeout: 60_000 }, async () => {
    // Én time om gangen, med en pause imellom (Pakke 63): ett kall på 20 s uten
    // pause får testkjøreren til å gi opp å vente på svar. Boten tar et trekk hvert
    // femte sekund, og 3600 går opp i fem, så spillet blir nøyaktig det samme.
    let s = nyttSpill()
    for (let t = 0; t < SEKUNDER; t += 3600) {
      s = botSpill(s, Math.min(3600, SEKUNDER - t))
      await new Promise((r) => setTimeout(r, 0))
    }
    const avtrykk = fingeravtrykk(s)

    if (process.env.OPPDATER_FASIT) {
      writeFileSync(FASIT_STI, JSON.stringify(avtrykk, null, 2) + '\n')
      console.log(`Fasiten er skrevet på nytt: ${FASIT_STI}`)
      return
    }

    const fasit = JSON.parse(readFileSync(FASIT_STI, 'utf8'))
    expect(avtrykk).toEqual(fasit)
  })

  it('samme tid i én eller mange biter gir identisk tilstand (determinisme)', () => {
    const iEtt = simuler(nyttSpill(1234), 3_000)
    let iBiter = nyttSpill(1234)
    for (let i = 0; i < 1_000; i++) iBiter = simuler(iBiter, 3)
    expect(iBiter).toEqual(iEtt)
  })

  it('simuler rører ikke inndataene', () => {
    const s = nyttSpill()
    const kopi = structuredClone(s)
    simuler(s, 50)
    expect(s).toEqual(kopi)
  })
})
