/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

/** Ytelsestesten måler tid, og skal ikke dele maskinen med de andre testene. */
const YTELSE = '**/ytelse.test.ts'
/** Arbeidskopier andre økter har lagt i .claude/worktrees, skal ikke testes med. */
const ARBEIDSKOPIER = '**/.claude/**'
/**
 * De tunge testene (Pakke 63): lange simuleringer, gamle lagringer og klikktestene
 * som starter hele appen. De kjører i sin egen gruppe etter de raske, så de ikke
 * kjemper om maskinen med sekstitalls andre filer — da ga testkjøreren opp å vente
 * på svar («Timeout calling onTaskUpdate») på nesten hver hele kjøring.
 */
const TUNGE = [
  '**/gamle-lagringer.test.ts',
  '**/formue.test.ts',
  '**/gullmester.test.ts',
  '**/balansebenken.test.ts',
  '**/pakke52.test.ts',
  '**/grafikkG10.test.ts',
  '**/grafikkG2.test.ts',
  '**/klikk.test.ts',
  '**/pakke61.test.ts',
  '**/pakke62.test.ts',
  '**/pakke65.test.ts',
  '**/startskript.test.ts',
  '**/ui/__tester__/pakke66.test.ts',
  '**/ui/__tester__/pakke74b.test.ts',
  '**/ui/__tester__/pakke77.test.ts',
  '**/ui/__tester__/pakke78.test.ts',
]

/**
 * Høyst tre arbeidere. Med seksten tunge filer på åtte kjerner sultet hovedprosessen
 * («Timeout calling onTaskUpdate»), og ytelsestesten ble aldri kjørt: fire arbeidere
 * holdt i Pakke 78, men en tregere natt i Pakke 79 ga feilen tre ganger på rad med fire
 * og ingen med tre. Vitest 3.2 bryr seg ikke om grensen per gruppe, så den gjelder alle.
 */
const ARBEIDERE = 3

/**
 * Service workeren med utgivelsens filliste (Pakke 96). `src/sw.js` har to plassholdere:
 * lista over alle filene under assets/ (startskriptet, stilarket, skriften, hver del som
 * lastes ved behov) og en utgave — en hash av lista. Service workeren lagrer hele lista ved
 * installasjon, så første besøk er nok til å starte uten nett. Fila havner i bygget som
 * `sw.js`; utviklingsserveren registrerer ingen service worker (src/pwa.ts).
 */
function serviceWorker(): Plugin {
  return {
    name: 'milliardaer-sw',
    apply: 'build',
    // Etter Vites egne steg, så stilarket og skriften er med i bunten.
    enforce: 'post',
    generateBundle(_, bunt) {
      const filer = Object.keys(bunt)
        .filter((f) => f.startsWith('assets/'))
        .sort()
        .map((f) => `./${f}`)
      const utgave = createHash('sha256').update(filer.join('\n')).digest('hex').slice(0, 12)
      const kilde = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
      const fyll = (t: string, fra: string, til: string) => {
        if (!t.includes(fra)) throw new Error(`src/sw.js mangler plassholderen ${fra}`)
        return t.replace(fra, () => til)
      }
      const kode = fyll(fyll(kilde, '/*RESSURSER*/ []', JSON.stringify(filer)), '__UTGAVE__', utgave)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: kode })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Relativ base: bygget fungerer både på rot og i en undermappe.
  base: './',
  server: { port: 5180 },
  test: {
    // Flere tester simulerer et helt døgn (et par sekunder hver); med alle filene
    // i parallell er standardgrensen på 5 s for knapp.
    testTimeout: 20_000,
    maxWorkers: ARBEIDERE,
    // Tre grupper som kjører etter hverandre: de raske i parallell først, så de
    // tunge, og til slutt ytelsestesten alene. I samme gruppe feilet den ofte på en
    // travel maskin.
    projects: [
      { extends: true, test: { name: 'enhet', exclude: [...configDefaults.exclude, ARBEIDSKOPIER, YTELSE, ...TUNGE], sequence: { groupOrder: 0 } } },
      { extends: true, test: { name: 'tung', include: TUNGE, exclude: [...configDefaults.exclude, ARBEIDSKOPIER], sequence: { groupOrder: 1 } } },
      { extends: true, test: { name: 'ytelse', include: [YTELSE], exclude: [...configDefaults.exclude, ARBEIDSKOPIER], sequence: { groupOrder: 2 } } },
    ],
  },
})
