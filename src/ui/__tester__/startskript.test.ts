/**
 * Startskriptets vekt (Grafikkpakke G12). Telefonen må hente og lese hele
 * startskriptet før første bilde, så det har et budsjett, som tidene per system i
 * ytelsestesten (Pakke 64). Testen bygger spillet i minnet (8–15 s), derfor står den
 * blant de tunge i vite.config.ts.
 *
 * Etter G12: 784 kB, 238 kB gzippet (før: 1 007 kB og 300 kB i ett skript). Pakke 96
 * fant det på 290.7 kB og flyttet fanene og avisa ut: 230.7 kB. Går budsjettet, er det
 * et valg: legg det nye i en del som lastes ved behov (ui/vedBehov.ts), eller hev
 * budsjettet med vilje og skriv hvorfor her.
 *
 * Pakke 96 la til service workerens filliste (vite.config.ts → sw.js) og den lille
 * skriften med forhåndslasting; de sjekkes på samme bygg.
 */
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Gzippet startskript, i kB (1 000 byte, som i byggets egen oversikt).
 * Doblet fra 250 til 500 etter G17 (11. oktober 2026), etter ønske fra Folke:
 * startskriptet sto på 249.9, og spillet må få vokse. Grensen er fortsatt et valg
 * — hev den igjen med vilje, og skriv hvorfor her.
 */
const BUDSJETT_GZIP = 500
/** Modulene som skal ligge utenfor startskriptet og hentes med `import()`. */
const VED_BEHOV = [
  '/ved-behov/Eiendomstegninger.tsx',
  '/ved-behov/Luksustegninger.tsx',
  '/ved-behov/Norgeskart.tsx',
  '/ved-behov/Verdenskart.tsx',
  '/screens/Galleri.tsx',
  '/ved-behov/Endringslogg.ts',
  // Pakke 96: fanene utenom Bedrifter, og avisa.
  '/screens/Investeringer.tsx',
  '/screens/Eiendom.tsx',
  '/screens/Luksus.tsx',
  '/screens/Klubb.tsx',
  '/screens/Profil.tsx',
  '/komponenter/Avis.tsx',
]
/** Den lille skriften (scripts/lag-skrift.mjs): hele Inter var 352 kB. */
const SKRIFT_MAKS_KB = 120

let ut: Rollup.RollupOutput

beforeAll(async () => {
  // Vitest setter NODE_ENV=test, og da bygger React og JSX-omformingen utviklingsutgaven.
  const for_ = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  ut = (await build({
    root: fileURLToPath(new URL('../../../', import.meta.url)),
    logLevel: 'silent',
    mode: 'production',
    build: { write: false, reportCompressedSize: false },
  }).finally(() => {
    if (for_ === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = for_
  })) as Rollup.RollupOutput
}, 120_000)

const biter = () => ut.output.filter((o): o is Rollup.OutputChunk => o.type === 'chunk')
const filer = () => ut.output.map((o) => o.fileName)
const tekst = (navn: string) => {
  const fil = ut.output.find((o) => o.fileName === navn)
  if (!fil) throw new Error(`${navn} mangler i bygget`)
  return fil.type === 'asset' ? String(fil.source) : fil.code
}
const moduler = (b: Rollup.OutputChunk) => Object.keys(b.modules).map((m) => m.replace(/\\/g, '/'))

describe('startskriptet (G12)', () => {
  it(`er under ${BUDSJETT_GZIP} kB gzippet, og delene ved behov er egne biter`, () => {
    const start = biter().find((b) => b.isEntry)!
    // kB som Vite skriver dem: 1 000 byte.
    const kb = gzipSync(start.code).length / 1000
    expect(kb, `startskriptet er ${kb.toFixed(1)} kB gzippet`).toBeLessThan(BUDSJETT_GZIP)

    // Hver del ligger i en annen bit enn startskriptet, og ingen av dem er dratt inn i det likevel.
    const startmoduler = moduler(start)
    const andre = biter()
      .filter((b) => !b.isEntry)
      .flatMap(moduler)
    for (const fil of VED_BEHOV) {
      expect(startmoduler.some((m) => m.endsWith(fil)), fil).toBe(false)
      expect(andre.some((m) => m.endsWith(fil)), fil).toBe(true)
    }
  })
})

describe('service workeren og skriften (Pakke 96)', () => {
  it('sw.js har hele utgivelsens filliste og en utgave', () => {
    const sw = tekst('sw.js')
    const liste = JSON.parse(sw.match(/const RESSURSER = (\[.*?\])/)![1]) as string[]
    const assets = filer()
      .filter((f) => f.startsWith('assets/'))
      .map((f) => `./${f}`)
      .sort()
    expect(liste).toEqual(assets)
    // Startskriptet, stilarket og skriften er med.
    expect(liste.some((f) => /assets\/index-[\w-]+\.js$/.test(f))).toBe(true)
    expect(liste.some((f) => f.endsWith('.css'))).toBe(true)
    expect(liste.some((f) => /InterLatin-[\w-]+\.woff2$/.test(f))).toBe(true)
    expect(sw).toMatch(/const UTGAVE = '[0-9a-f]{12}'/)
    expect(sw).not.toContain('__UTGAVE__')
  })

  it('index.html forhåndslaster den lille skriften, og den er liten', () => {
    const html = tekst('index.html')
    const lenke = html.match(/<link rel="preload" href="\.\/(assets\/InterLatin-[\w-]+\.woff2)" as="font" type="font\/woff2" crossorigin/)
    expect(lenke, 'preload-lenken').not.toBeNull()
    const skrift = ut.output.find((o) => o.fileName === lenke![1])
    expect(skrift, 'skriften lenken peker på').toBeDefined()
    // Stilarket peker på den samme fila, ellers hentes skriften to ganger.
    const css = filer().find((f) => f.endsWith('.css'))!
    expect(tekst(css)).toContain(lenke![1].replace('assets/', ''))
    const kb = (skrift as Rollup.OutputAsset).source.length / 1000
    expect(kb, `skriften er ${kb.toFixed(1)} kB`).toBeLessThan(SKRIFT_MAKS_KB)
    // Den store fila er ikke med i bygget.
    expect(filer().some((f) => f.includes('InterVariable'))).toBe(false)
  })
})
