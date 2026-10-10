/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
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
]

export default defineConfig({
  plugins: [react()],
  // Relativ base: bygget fungerer både på rot og i en undermappe.
  base: './',
  server: { port: 5180 },
  test: {
    // Flere tester simulerer et helt døgn (et par sekunder hver); med alle filene
    // i parallell er standardgrensen på 5 s for knapp.
    testTimeout: 20_000,
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
