/**
 * Pakke 63 — Et bedre verksted: stilarket er delt i én fil per område under
 * src/styles/, hver med én eier, og de tunge testene kjører i sin egen gruppe.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { stilfiler } from './stiler'

const MAPPE = new URL('../../styles/', import.meta.url)
const les = (f: string) => readFileSync(new URL(f, MAPPE), 'utf8')

describe('stilarkene', () => {
  it('det gamle styles.css er borte, og main.tsx henter index.css', () => {
    expect(existsSync(new URL('../../styles.css', import.meta.url))).toBe(false)
    expect(readFileSync(new URL('../../main.tsx', import.meta.url), 'utf8')).toContain("import './styles/index.css'")
  })

  it('hver fil i mappa importeres nøyaktig én gang, og bred.css sist', () => {
    const filer = stilfiler()
    const imappa = readdirSync(MAPPE).filter((f) => f.endsWith('.css') && f !== 'index.css')
    expect([...filer].sort()).toEqual([...imappa].sort())
    expect(new Set(filer).size).toBe(filer.length)
    expect(filer.at(-1)).toBe('bred.css')
    expect(filer[0]).toBe('grunnlag.css')
  })

  it('hver fil sier hvilket spor som eier den', () => {
    for (const f of stilfiler()) expect(les(f), f).toMatch(/Eier: (spillsporet|grafikksporet)\./)
  })

  it('hver url() peker på en fil som finnes, regnet fra filen den står i', () => {
    // Fonten forsvant da den flyttet fra src/ til src/styles/ — en relativ sti må følge med.
    for (const f of stilfiler()) {
      for (const m of les(f).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
        const sti = m[1]
        if (sti.startsWith('#') || sti.startsWith('data:') || /^https?:/.test(sti)) continue
        expect(existsSync(fileURLToPath(new URL(sti, new URL(f, MAPPE)))), `${f}: ${sti}`).toBe(true)
      }
    }
  })
})

describe('testgruppene', () => {
  it('hver tung test finnes, så en omdøpt fil ikke stille havner i feil gruppe', () => {
    const konfig = readFileSync(new URL('../../../vite.config.ts', import.meta.url), 'utf8')
    const tunge = [...konfig.slice(konfig.indexOf('const TUNGE'), konfig.indexOf(']', konfig.indexOf('const TUNGE'))).matchAll(/'\*\*\/([\w.-]+)'/g)].map((m) => m[1])
    expect(tunge.length).toBeGreaterThan(5)
    const alle = (rot: string): string[] =>
      readdirSync(rot, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? alle(`${rot}/${d.name}`) : [d.name]))
    const filer = new Set(alle(fileURLToPath(new URL('../../', import.meta.url))))
    for (const t of tunge) expect(filer.has(t), t).toBe(true)
  })
})
