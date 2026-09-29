/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relativ base: bygget fungerer både på rot og i en undermappe.
  base: './',
  server: { port: 5180 },
  // Flere tester simulerer et helt døgn (et par sekunder hver); med alle filene
  // i parallell er standardgrensen på 5 s for knapp.
  test: { testTimeout: 20_000 },
})
