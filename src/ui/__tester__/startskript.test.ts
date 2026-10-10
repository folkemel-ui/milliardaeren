/**
 * Startskriptets vekt (Grafikkpakke G12). Telefonen må hente og lese hele
 * startskriptet før første bilde, så det har et budsjett, som tidene per system i
 * ytelsestesten (Pakke 64). Testen bygger spillet i minnet (8–15 s), derfor står den
 * blant de tunge i vite.config.ts.
 *
 * Etter G12: 784 kB, 238 kB gzippet (før: 1 007 kB og 300 kB i ett skript). Går
 * budsjettet, er det et valg: legg det nye i en del som lastes ved behov
 * (ui/vedBehov.ts), eller hev budsjettet med vilje og skriv hvorfor her.
 */
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { describe, expect, it } from 'vitest'

/**
 * Gzippet startskript, i kB (1 000 byte, som i byggets egen oversikt).
 * Doblet fra 250 til 500 etter G17 (11. oktober 2026), etter ønske fra Folke:
 * startskriptet sto på 249.9, og spillet må få vokse. Grensen er fortsatt et valg
 * — hev den igjen med vilje, og skriv hvorfor her.
 */
const BUDSJETT_GZIP = 500
/** Delene som skal ligge utenfor startskriptet og hentes med `import()`. */
const VED_BEHOV = ['Eiendomstegninger', 'Luksustegninger', 'Norgeskart', 'Verdenskart', 'Galleri']

describe('startskriptet (G12)', () => {
  it(`er under ${BUDSJETT_GZIP} kB gzippet, og delene ved behov er egne biter`, async () => {
    // Vitest setter NODE_ENV=test, og da bygger React og JSX-omformingen utviklingsutgaven.
    const for_ = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const ut = (await build({
      root: fileURLToPath(new URL('../../../', import.meta.url)),
      logLevel: 'silent',
      mode: 'production',
      build: { write: false, reportCompressedSize: false },
    }).finally(() => {
      if (for_ === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = for_
    })) as Rollup.RollupOutput
    const biter = ut.output.filter((o): o is Rollup.OutputChunk => o.type === 'chunk')
    const start = biter.find((b) => b.isEntry)!
    // kB som Vite skriver dem: 1 000 byte.
    const kb = gzipSync(start.code).length / 1000
    expect(kb, `startskriptet er ${kb.toFixed(1)} kB gzippet`).toBeLessThan(BUDSJETT_GZIP)

    const navn = (fil: string) => fil.replace(/^assets\//, '').replace(/-[\w-]{8}\.js$/, '')
    const dynamiske = start.dynamicImports.map(navn)
    for (const del of VED_BEHOV) expect(dynamiske, del).toContain(del)
    // Ingen av dem er dratt inn i startskriptet likevel.
    const startmoduler = Object.keys(start.modules).map((m) => m.replace(/\\/g, '/'))
    for (const del of VED_BEHOV) {
      const fil = del === 'Galleri' ? '/screens/Galleri.tsx' : `/ved-behov/${del}.tsx`
      expect(startmoduler.some((m) => m.endsWith(fil)), fil).toBe(false)
    }
  }, 120_000)
})
