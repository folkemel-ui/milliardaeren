import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relativ base: bygget fungerer både på rot og i en undermappe.
  base: './',
  server: { port: 5180 },
})
