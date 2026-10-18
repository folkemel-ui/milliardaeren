// Venter til et push er live på GitHub Pages (18. oktober 2026): Folke vil ha beskjed når det
// er ute, ikke bare at pushen gikk. Kjør det etter `node scripts/lever.mjs --push`:
//
//   node scripts/live.mjs           venter på utgivelsen av HEAD (det som nettopp ble pushet)
//   node scripts/live.mjs abc1234   venter på en bestemt commit
//
// Utgivelsen (.github/workflows/pages.yml) kjører testene, bygger og legger ut — ~2–3 minutter.
// Skriptet leser GitHubs åpne API (ingen innlogging; 60 kall i timen holder godt med ett hvert
// 20. sekund) og avslutter med 0 når den er live, 1 når den feilet, 2 når den ikke ble ferdig.

import { execSync } from 'node:child_process'

const API = 'https://api.github.com/repos/folkemel-ui/milliardaeren/actions/runs?per_page=10&event=push'
const SIDE = 'https://folkemel-ui.github.io/milliardaeren/'
const VENT_MS = 20_000
const FRIST_MS = 15 * 60_000

const sha = (process.argv[2] ?? execSync('git rev-parse HEAD', { encoding: 'utf8' })).trim()
const kort = sha.slice(0, 7)
const frist = Date.now() + FRIST_MS

console.log(`Venter på utgivelsen av ${kort} …`)
// process.exit() med en åpen fetch-forbindelse krasjer Node på Windows (libuv), så løkka avslutter med exitCode.
let ferdig = false
while (!ferdig && Date.now() < frist) {
  try {
    const svar = await fetch(API, { headers: { 'User-Agent': 'milliardaer-live', Accept: 'application/vnd.github+json' } })
    const data = await svar.json()
    const kjoring = data.workflow_runs?.find((r) => r.head_sha.startsWith(sha))
    if (kjoring?.status === 'completed') {
      const sek = Math.round((new Date(kjoring.updated_at) - new Date(kjoring.run_started_at)) / 1000)
      if (kjoring.conclusion === 'success') {
        console.log(`✓ Live: ${kort} er ute på ${SIDE} (utgivelsen tok ${sek} s).`)
        process.exitCode = 0
      } else {
        console.error(`✗ Utgivelsen av ${kort} endte med «${kjoring.conclusion}»: ${kjoring.html_url}`)
        process.exitCode = 1
      }
      ferdig = true
      break
    }
  } catch (e) {
    console.error(`(kunne ikke lese GitHub nå: ${e.message} — prøver igjen)`)
  }
  await new Promise((r) => setTimeout(r, VENT_MS))
}
if (!ferdig) {
  console.error(`✗ Utgivelsen av ${kort} var ikke ferdig etter ${FRIST_MS / 60_000} minutter.`)
  process.exitCode = 2
}
