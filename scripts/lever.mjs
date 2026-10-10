// Leverer sporets gren til master (Pakke 63). Samme steg i begge øktene:
//
//   node scripts/lever.mjs          hent, rebase på origin/master, typesjekk og test,
//                                   og vis hva som ville bli pushet
//   node scripts/lever.mjs --push   push til master — bare det som er testet
//
// Hvert spor jobber i sin egen mappe og gren (spill / grafikk). Master sjekkes
// ikke ut noe sted; en levering er alltid «min gren, lagt oppå det som er på
// GitHub nå». Pusher det andre sporet imellom, avviser GitHub pushen, og da
// kjører du skriptet på nytt.

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const push = process.argv.includes('--push')
const git = (args) => execSync(`git ${args}`, { encoding: 'utf8' }).trim()
const stopp = (melding) => {
  console.error(`\n✗ ${melding}`)
  process.exit(1)
}
const kjor = (kommando) => spawnSync(kommando, { stdio: 'inherit', shell: true }).status === 0

const gren = git('rev-parse --abbrev-ref HEAD')
if (gren === 'HEAD') stopp('Du står ikke på en gren (midt i en rebase?). Fullfør den eller kjør git rebase --abort.')
if (gren === 'master') stopp('Master skal ikke sjekkes ut i en spormappe. Jobb på sporets gren (spill eller grafikk).')

const urent = git('status --porcelain')
if (urent) stopp(`Det er endringer som ikke er committet:\n${urent}\nCommit dem (bare dine egne filer) før du leverer.`)

// Merket for «denne committen er testet» ligger i git-mappa til denne arbeidskopien.
const merke = git('rev-parse --git-path lever-testet')

console.log(`Henter fra GitHub …`)
git('fetch origin')

if (push) {
  const hode = git('rev-parse HEAD')
  if (!existsSync(merke) || readFileSync(merke, 'utf8').trim() !== hode) stopp('Denne committen er ikke testet. Kjør node scripts/lever.mjs uten --push først.')
  try {
    git('merge-base --is-ancestor origin/master HEAD')
  } catch {
    stopp('Det er kommet noe nytt på master siden testen. Kjør node scripts/lever.mjs på nytt (uten --push).')
  }
  const nye = git('log --oneline origin/master..HEAD')
  if (!nye) stopp('Ingenting å pushe.')
  console.log(`Pusher ${gren} til master:\n${nye}`)
  if (!kjor('git push origin HEAD:master')) stopp('Pushen ble avvist. Kjør node scripts/lever.mjs på nytt.')
  console.log('\n✓ Levert. master = denne grenen.')
  process.exit(0)
}

console.log(`Legger ${gren} oppå origin/master …`)
if (!kjor('git rebase origin/master')) {
  stopp('Rebasen stoppet på en konflikt. Løs den (git status viser filene), git add, git rebase --continue — eller git rebase --abort for å gå tilbake.')
}

const nye = git('log --oneline origin/master..HEAD')
if (!nye) {
  console.log('\n✓ Grenen er lik master. Ingenting å levere.')
  process.exit(0)
}

// Bare tekst (Ideer.md, visdomsfilene): ingen kode endret, så testene trengs ikke.
const filer = git('diff --name-only origin/master..HEAD').split('\n').filter(Boolean)
const bareTekst = filer.every((f) => f.endsWith('.md'))
if (bareTekst) {
  console.log('Bare .md-filer er endret — hopper over typesjekk og tester.')
} else {
  console.log('Typesjekk …')
  if (!kjor('npx tsc --noEmit -p .')) stopp('Typesjekken feilet.')
  console.log('Tester …')
  if (!kjor('npx vitest run')) stopp('Testene feilet.')
}
writeFileSync(merke, git('rev-parse HEAD') + '\n')

console.log(`\n✓ Klar. Dette ville bli pushet til master:\n${nye}\n\nPush med: node scripts/lever.mjs --push`)
