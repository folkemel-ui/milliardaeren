/**
 * Golden master: et fast antall sekunder fra standardoppstillingen, med
 * sluttilstandens nøkkeltall låst i gullmester.fasit.json. Enhver utilsiktet
 * endring i motorens økonomi gir rød test her — det er hele poenget.
 *
 * Endrer du motoren MED VILJE, oppdater fasiten og forklar det i commit-meldingen:
 *
 *     OPPDATER_FASIT=1 npm test
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../start'
import { simuler } from '../simulering'
import { inntektPerSek, nettoformue } from '../formler'
import type { Spilltilstand } from '../types'

const FASIT_STI = fileURLToPath(new URL('./gullmester.fasit.json', import.meta.url))
/** Fire timer spilletid. */
const SEKUNDER = 4 * 60 * 60

function fingeravtrykk(s: Spilltilstand) {
  return {
    sek: s.sek,
    frø: s.frø,
    kontanter: s.kontanter,
    totaltTjent: s.totaltTjent,
    nettoformue: nettoformue(s),
    inntektPerSek: inntektPerSek(s),
    antallBedrifter: s.bedrifter.length,
    historikkIntervall: s.historikk.intervall,
    historikkPunkter: s.historikk.punkter.length,
    sisteHistorikkpunkt: s.historikk.punkter[s.historikk.punkter.length - 1],
  }
}

describe('golden master', () => {
  it(`${SEKUNDER} sekunder fra standardoppstillingen treffer fasiten eksakt`, () => {
    const avtrykk = fingeravtrykk(simuler(nyttSpill(), SEKUNDER))

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
