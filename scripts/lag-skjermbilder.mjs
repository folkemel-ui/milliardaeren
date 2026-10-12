/**
 * Lager butikkbildene (Pakke 97) med Chrome uten vindu, fra et spill midtveis
 * (scripts/skjermbilde-spill.ts) i det ferdige bygget:
 *
 *  - butikk/skjermbilder/bedrifter-1290x2796.png — App Store (iPhone 6.7–6.9")
 *  - public/skjermbilder/bedrifter.png — 860 × 1864, i manifestet (Androids installasjonsark)
 *
 * Chrome styres over DevTools-protokollen med Nodes egen WebSocket (ingen avhengighet):
 * spillet skrives inn i localStorage fra /ikon.svg (der spillet ikke kjører), så åpnes
 * spillet på en telefon på 430 × 932, og bildet tas når det har tegnet seg. Mørkt tema.
 *
 *     node scripts/lag-skjermbilder.mjs
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'

const ROT = fileURLToPath(new URL('..', import.meta.url))
const PORT = 5189
const DEVTOOLS = 9339
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((f) => existsSync(f))
if (!CHROME) throw new Error('Fant ikke Chrome eller Edge')

const vent = (ms) => new Promise((ok) => setTimeout(ok, ms))

// 1. Spillet, laget av motoren selv.
const vite = await createServer({ root: ROT, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' })
const { midtspill } = await vite.ssrLoadModule('/scripts/skjermbilde-spill.ts')
const { VERSJON } = await vite.ssrLoadModule('/src/ui/versjon.ts')
const spill = midtspill()
await vite.close()
const nokler = {
  'milliardaer.lagring': JSON.stringify(spill),
  'milliardaer.sistAktiv': String(Date.now() + 3_600_000),
  'milliardaer.versjon': VERSJON,
  'milliardaer.fane': 'bedrifter',
  'milliardaer.tema': 'mork',
}

// 2. Bygget, servert som på nettet.
await build({ root: ROT, logLevel: 'warn' })
const tjener = await preview({ root: ROT, logLevel: 'silent', preview: { port: PORT, strictPort: true } })
const profil = mkdtempSync(join(tmpdir(), 'milliardaer-skjermbilde-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profil}`, `--remote-debugging-port=${DEVTOOLS}`, 'about:blank'], { stdio: 'ignore' })

try {
  // 3. Koble til siden.
  let side
  for (let i = 0; i < 50 && !side; i++) {
    await vent(200)
    side = await fetch(`http://127.0.0.1:${DEVTOOLS}/json/list`)
      .then((r) => r.json())
      .then((l) => l.find((t) => t.type === 'page'))
      .catch(() => undefined)
  }
  if (!side) throw new Error('Chrome svarte ikke')
  const ws = new WebSocket(side.webSocketDebuggerUrl)
  await new Promise((ok, feil) => ((ws.onopen = ok), (ws.onerror = feil)))
  let nr = 0
  const svar = new Map()
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && svar.has(d.id)) {
      svar.get(d.id)(d)
      svar.delete(d.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((ok, feil) => {
      const id = ++nr
      svar.set(id, (d) => (d.error ? feil(new Error(`${method}: ${d.error.message}`)) : ok(d.result)))
      ws.send(JSON.stringify({ id, method, params }))
    })
  const kjor = async (uttrykk) => (await send('Runtime.evaluate', { expression: uttrykk, awaitPromise: true, returnByValue: true })).result.value
  const gaaTil = async (url) => {
    await send('Page.navigate', { url })
    for (let i = 0; i < 100; i++) {
      await vent(100)
      if ((await kjor('document.readyState').catch(() => '')) === 'complete') return
    }
  }

  // 4. Ett bilde per skala, på samme telefonstørrelse.
  for (const [fil, skala] of [
    [join(ROT, 'butikk', 'skjermbilder', 'bedrifter-1290x2796.png'), 3],
    [join(ROT, 'public', 'skjermbilder', 'bedrifter.png'), 2],
  ]) {
    await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: skala, mobile: true })
    await gaaTil(`http://localhost:${PORT}/ikon.svg`)
    await kjor(`(() => { const n = ${JSON.stringify(nokler)}; for (const k in n) localStorage.setItem(k, n[k]); return true })()`)
    await gaaTil(`http://localhost:${PORT}/`)
    // Til spillet har tegnet seg, delene og skriften er her, og bevegelsene er ferdige.
    for (let i = 0; i < 100 && !(await kjor("!!document.querySelector('.app .bedriftskort')")); i++) await vent(100)
    await kjor('document.fonts.ready.then(() => true)')
    await vent(2500)
    await kjor('(() => { for (const a of document.getAnimations()) a.finish(); window.scrollTo(0, 0); return true })()')
    await vent(300)
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    mkdirSync(dirname(fil), { recursive: true })
    writeFileSync(fil, Buffer.from(data, 'base64'))
    console.log(`${fil.slice(ROT.length)} (${430 * skala} × ${932 * skala})`)
  }
  ws.close()
} finally {
  chrome.kill()
  await new Promise((ok) => tjener.httpServer.close(ok))
  await vent(500)
  rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
