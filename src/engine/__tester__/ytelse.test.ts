/**
 * Ytelse: tiden du var borte (opptil to timer) regnes ut når appen åpnes.
 * Det må gå fort nok til at ingen merker det — også på en treg telefon.
 *
 * Målt på motoren slik spillet kjører den (Pakke 52): testen bygger motoren
 * med esbuild og måler den i en egen Node-prosess. Under Vitest går den 3–4
 * ganger tregere, så grensene der var gjetninger; her betyr de noe.
 *
 * En treg telefon regnes som fem ganger tregere enn en vanlig PC. Grensene:
 *  - et nytt spill, to timer borte: høyst 100 ms her, rundt et halvt sekund på telefonen;
 *  - det tyngste en lagring kan bli (fulltSpill), to timer borte: høyst 400 ms
 *    her, rundt to sekunder på telefonen — bak lasteskjermen.
 *
 * Testen måler CPU-tiden prosessen bruker, fire simuleringer om gangen og det
 * beste av fem forsøk, så en travel maskin (en annen økt, andre tester) ikke
 * feller den. Med BENK=1 skrives tallene ut.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import { describe, expect, it } from 'vitest'

const MOTOR = resolve(__dirname, '..').replace(/\\/g, '/')

/** Programmet som måles: begge spillene, to timer borte. Skriver JSON. */
const PROGRAM = `
import { simuler } from '${MOTOR}/simulering'
import { BORTE_TAK_SEK } from '${MOTOR}/innhold'
import { nyttSpill } from '${MOTOR}/start'
import { fulltSpill } from '${MOTOR}/__tester__/hjelp'

const cpu = (f: () => void) => {
  const før = process.cpuUsage()
  f()
  const b = process.cpuUsage(før)
  return (b.user + b.system) / 1000
}
/*
 * Windows teller CPU-tid i steg på 15,6 ms — én simulering på 95 ms havner på
 * 94, 109 eller 125. Derfor måles fire simuleringer om gangen og deles på fire,
 * og det beste av fem forsøk teller.
 */
const RUNDER = 4
const maal = (s: ReturnType<typeof nyttSpill>) => {
  simuler(s, 600, true) // oppvarming av JIT
  let ms = Infinity
  for (let i = 0; i < 5; i++) {
    ms = Math.min(ms, cpu(() => {
      for (let r = 0; r < RUNDER; r++) simuler(s, BORTE_TAK_SEK, true)
    }) / RUNDER)
  }
  return Math.round(ms)
}
const nytt = maal(nyttSpill())
const fullt = maal(fulltSpill())
console.log(JSON.stringify({ nytt, fullt }))
`

/** Bygger og kjører målingen. */
async function maalBygget(): Promise<{ nytt: number; fullt: number }> {
  const mappe = mkdtempSync(join(tmpdir(), 'milliardaer-ytelse-'))
  try {
    const inn = join(mappe, 'maal.ts')
    const ut = join(mappe, 'maal.mjs')
    writeFileSync(inn, PROGRAM)
    await build({ entryPoints: [inn], bundle: true, platform: 'node', format: 'esm', outfile: ut, minify: true, logLevel: 'error' })
    return JSON.parse(execFileSync(process.execPath, [ut], { encoding: 'utf8' }).trim())
  } finally {
    rmSync(mappe, { recursive: true, force: true })
  }
}

describe('ytelse, målt på bygget motor', () => {
  it('to timer borte: et nytt spill på høyst 100 ms, det tyngste på høyst 400 ms', { timeout: 120_000 }, async () => {
    const ms = await maalBygget()
    if (process.env.BENK) console.log(`to timer borte, bygget: nytt spill ${ms.nytt} ms, fullt spill ${ms.fullt} ms CPU`)
    // På GitHub (CI) kjører testene på delte maskiner med ukjent fart før hver
    // publisering. Der får grensene dobbelt slakk, så en treg maskin ikke stopper
    // en publisering; telefonbudsjettet sjekkes her, der det ble målt.
    const slakk = process.env.CI ? 2 : 1
    expect(ms.nytt).toBeLessThanOrEqual(100 * slakk)
    expect(ms.fullt).toBeLessThanOrEqual(400 * slakk)
  })
})
