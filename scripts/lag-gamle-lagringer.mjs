/**
 * Lager ekte lagringer fra hver lagringsversjon spillet har hatt, for
 * `src/state/__tester__/gamle-lagringer.test.ts`.
 *
 * For hver versjon hentes kildekoden fra den siste commiten før versjonen ble
 * bumpet videre (git archive), motoren derfra bygges med esbuild, og et lite
 * program spiller et spill med den gamle motoren: boten (eller en enkel
 * kjøpsløkke før boten fantes) spiller i to timer, så får spilleren penger og
 * kjøper litt av alt den versjonen kjente til, og til slutt går to døgn (576
 * spilldager med aviser, oppgjør og skatt).
 * Resultatet skrives komprimert som `vN.json.gz`, med formuen den gamle motoren regnet ut.
 *
 *     node scripts/lag-gamle-lagringer.mjs        (alle)
 *     node scripts/lag-gamle-lagringer.mjs 20     (bare versjon 20)
 *
 * Versjon 6 og 11 ble aldri lagt i en commit (Pakke 6 og Pakke 11 bumpet to
 * ganger), så de finnes ikke — migreringene deres testes likevel, siden
 * lagringene før dem går gjennom.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { gzipSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROT = resolve(import.meta.dirname, '..')
const UT = join(ROT, 'src/state/__tester__/gamle-lagringer')
const ARBEID = join(tmpdir(), 'milliardaer-gamle-lagringer')

/** Versjon → commiten som bumpet den videre. Lagringen lages fra forelderen. */
const NESTE_BUMP = {
  1: '63880f4',
  2: '3e747c2',
  3: '2ad6cb9',
  4: '15a6354',
  5: 'b7706e7',
  7: 'a06a0c8',
  8: '3cd89f7',
  9: '264df48',
  10: '50805da',
  12: '979dee0',
  13: '661653b',
  14: 'b6ab234',
  15: '9311ea6',
  16: '2bf586c',
  17: '717526b',
  18: '13abe59',
  19: '56b7f52',
  // Versjon 20 ble bumpet i Pakke 56; lagringen lages fra Pakke 55, den siste commiten med versjon 20.
  20: { fra: 'c55eb94' },
}

const sh = (cmd, cwd = ROT) => execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()

/** Modulene programmet bruker hvis den gamle versjonen har dem. */
const MODULER = ['eiendom', 'jord', 'landemerker', 'kunst', 'klubb', 'fond', 'startups', 'marked']

function program(dir) {
  const har = (f) => existsSync(join(dir, 'src/engine', f))
  const imp = MODULER.filter((m) => har(`${m}.ts`))
  return `
import { nyttSpill, SPILLVERSJON } from './engine/start'
import { simuler } from './engine/simulering'
import { nettoformue } from './engine/formler'
${har('handlinger.ts') ? "import * as H from './engine/handlinger'" : 'const H = {}'}
${har('__tester__/bot.ts') ? "import { botSpill } from './engine/__tester__/bot'" : 'const botSpill = undefined'}
${imp.map((m) => `import * as M_${m} from './engine/${m}'`).join('\n')}
const M: Record<string, any> = { ${imp.map((m) => `${m}: M_${m}`).join(', ')} }

let s: any = nyttSpill(4711)
const prov = (navn: string, ...arg: any[]) => {
  const f = (H as any)[navn]
  if (typeof f !== 'function') return
  try {
    const u = f(s, ...arg)
    if (u && u.ok) s = u.tilstand
  } catch {}
}

// To timer med boten — eller, før den fantes, oppgrader det billigste så lenge det går.
if (botSpill) s = (botSpill as any)(s, 7200, 10)
else for (let t = 0; t < 7200; t += 10) {
  for (const b of s.bedrifter) prov('oppgrader', b.id)
  s = simuler(s, 10)
}

// Rik nok til å prøve alt versjonen kjente til.
s.kontanter += 2e9
if (typeof s.hoyesteFormue === 'number') s.hoyesteFormue = Math.max(s.hoyesteFormue, nettoformue(s))
const forste = (o: any, n = 1) => (o ? Object.keys(o).slice(0, n) : [])
for (const id of forste(M.eiendom?.EIENDOMSTYPER, 3)) prov('kjopEiendom', id)
for (const id of forste(M.eiendom?.LUKSUS, 2)) prov('kjopLuksus', id)
for (const id of forste(M.jord?.JORD ?? M.jord?.JORDTYPER, 2)) prov('kjopJord', id)
for (const id of forste(M.landemerker?.LANDEMERKER)) prov('kjopLandemerke', id)
for (const id of forste(s.kunst?.kurser)) prov('kjopMaleri', id)
for (const id of forste(M.fond?.FOND)) prov('kjopFond', id, 1_000_000)
for (const id of forste(s.marked?.kurser, 3)) prov('kjopPapir', id, 50)
for (const navn of (M.klubb?.KLUBBNAVN ?? []).slice(0, 1)) prov('kjopKlubb', navn)
if (s.rivaler?.[0]) prov('kjopRivalblokk', s.rivaler[0].id)
prov('settInn', 1_000_000)
prov('laan', 100_000)
prov('kjopObligasjon', 'lang', 1_000_000)
for (const t of ['kjopBedrift']) for (const b of ['kiosk', 'kafe', 'restaurant']) prov(t, b)

// To døgn med spilling (576 spilldager): aviser, oppgjør, skatt, klubbrunder og høst. Startupene dukker opp underveis.
s = simuler(s, 24 * 3600)
for (const st of (s.startups ?? []).filter((x: any) => x.status === 'aktiv').slice(0, 2)) prov('investerIStartup', st.id, 500_000)
s = simuler(s, 24 * 3600)
export const resultat = { versjon: SPILLVERSJON, formue: nettoformue(s), tilstand: s }
`
}

mkdirSync(UT, { recursive: true })
rmSync(ARBEID, { recursive: true, force: true })
const bare = process.argv.slice(2)
for (const [versjon, bump] of Object.entries(NESTE_BUMP)) {
  if (bare.length && !bare.includes(versjon)) continue
  // En bump-commit gir lagringen fra forelderen; { fra } gir den fra commiten selv.
  const kilde = typeof bump === 'string' ? `${bump}~1` : bump.fra
  const dir = join(ARBEID, `v${versjon}`)
  mkdirSync(dir, { recursive: true })
  sh(`git -C "${ROT}" archive ${kilde} src | tar -x`, dir)
  const inn = join(dir, 'src/__lag.ts')
  writeFileSync(inn, program(dir))
  const ut = join(dir, 'lag.mjs')
  await build({ entryPoints: [inn], bundle: true, format: 'esm', platform: 'node', outfile: ut, logLevel: 'error' })
  const { resultat } = await import(pathToFileURL(ut).href)
  if (resultat.versjon !== Number(versjon)) throw new Error(`v${versjon}: commiten har versjon ${resultat.versjon}`)
  const json = JSON.stringify({ versjon: resultat.versjon, commit: sh(`git rev-parse --short ${kilde}`).trim(), formue: Math.round(resultat.formue), tilstand: resultat.tilstand })
  const gz = gzipSync(json, { level: 9 })
  writeFileSync(join(UT, `v${versjon}.json.gz`), gz)
  const t = resultat.tilstand
  const eier = [
    `${t.bedrifter.length} bedrifter`,
    t.eiendommer && `${Object.keys(t.eiendommer).length} eiendom`,
    t.luksus && `${t.luksus.length} luksus`,
    t.jord && `${Object.keys(t.jord).length} jord`,
    t.landemerker && `${Object.keys(t.landemerker).length} landemerker`,
    t.klubb && 'klubb',
    t.kunst && `${Object.keys(t.kunst.eide ?? {}).length} malerier`,
    t.fond && `${Object.keys(t.fond).length} fond`,
    t.startups && `${t.startups.filter((x) => x.andel > 0).length} startups`,
    t.beholdning && `${Object.keys(t.beholdning).length} papirer`,
  ].filter(Boolean)
  console.log(`v${versjon}: ${(gz.length / 1024).toFixed(0)} kB, formue ${Math.round(resultat.formue).toLocaleString('nb-NO')} — ${eier.join(', ')}`)
}
rmSync(ARBEID, { recursive: true, force: true })
