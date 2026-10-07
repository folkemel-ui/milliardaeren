/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

/** Ytelsestesten måler tid, og skal ikke dele maskinen med de andre testene. */
const YTELSE = '**/ytelse.test.ts'
/** Arbeidskopier andre økter har lagt i .claude/worktrees, skal ikke testes med. */
const ARBEIDSKOPIER = '**/.claude/**'

export default defineConfig({
  plugins: [react()],
  // Relativ base: bygget fungerer både på rot og i en undermappe.
  base: './',
  server: { port: 5180 },
  test: {
    // Flere tester simulerer et helt døgn (et par sekunder hver); med alle filene
    // i parallell er standardgrensen på 5 s for knapp.
    testTimeout: 20_000,
    // To grupper som kjører etter hverandre: alt annet i parallell først, så
    // ytelsestesten alene. I samme gruppe feilet den ofte på en travel maskin.
    projects: [
      { extends: true, test: { name: 'enhet', exclude: [...configDefaults.exclude, ARBEIDSKOPIER, YTELSE], sequence: { groupOrder: 0 } } },
      { extends: true, test: { name: 'ytelse', include: [YTELSE], exclude: [...configDefaults.exclude, ARBEIDSKOPIER], sequence: { groupOrder: 1 } } },
    ],
  },
})
