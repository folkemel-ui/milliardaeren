/**
 * Lager den lille skriftfila (Pakke 96): `src/assets/fonter/InterVariable.woff2` (hele
 * Inter, 352 kB) → `InterLatin.woff2` med bare tegnene i `src/ui/skrifttegn.ts`. Vektaksen og
 * alle OpenType-funksjonene (tabulære tall) blir med, så teksten ser lik ut.
 *
 * Verktøyet (HarfBuzz) er ikke en del av prosjektet. Kjør det fra en egen mappe:
 *
 *     npm install --prefix <mappe> subset-font@2.4.0
 *     node scripts/lag-skrift.mjs <mappe>
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { TEGN } from '../src/ui/skrifttegn.ts'

const verktøy = process.argv[2]
if (!verktøy) throw new Error('Bruk: node scripts/lag-skrift.mjs <mappe der subset-font er installert>')
const subsetFont = createRequire(join(verktøy, 'node_modules', 'x.js'))('subset-font')

const fra = new URL('../src/assets/fonter/InterVariable.woff2', import.meta.url)
const til = new URL('../src/assets/fonter/InterLatin.woff2', import.meta.url)
const hel = readFileSync(fra)
const liten = await subsetFont(hel, TEGN, { targetFormat: 'woff2' })
writeFileSync(til, liten)
console.log(`${[...TEGN].length} tegn: ${(hel.length / 1000).toFixed(1)} kB → ${(liten.length / 1000).toFixed(1)} kB`)
