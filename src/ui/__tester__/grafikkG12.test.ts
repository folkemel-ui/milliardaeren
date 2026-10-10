/**
 * Grafikkpakke G12: en lettere start. Eiendoms- og luksustegningene, kartene og
 * galleriet ligger utenfor startskriptet og hentes når de trengs. Tegningene
 * vises med de samme komponentene som før, og en tom flate i samme størrelse
 * holder plassen til delen er her. Byggets størrelse sjekkes i startskript.test.ts.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { EIENDOMSIDER, Illustrasjon, ILLUSTRASJONSIDER, LUKSUSIDER } from '../komponenter/Illustrasjoner'
import { Norgeskart } from '../komponenter/Norgeskart'
import { EIENDOMSTEGNINGER } from '../komponenter/ved-behov/Eiendomstegninger'
import { LUKSUSTEGNINGER } from '../komponenter/ved-behov/Luksustegninger'
import { VERDEN_BREDDE, VERDEN_HOYDE, Verdenskart } from '../komponenter/Verdenskart'
import { alleDeler, lastAlle } from '../vedBehov'
import { BREDDE, HOYDE } from '../verdenskartet'

const SRC = fileURLToPath(new URL('../../', import.meta.url))

/** Filene startskriptet drar med seg: alle statiske importer fra main.tsx, ikke `import type` og ikke `import()`. */
function startfiler(): Set<string> {
  const sett = new Set<string>()
  const besok = (fil: string) => {
    if (sett.has(fil)) return
    sett.add(fil)
    if (!/\.tsx?$/.test(fil)) return
    const kilde = readFileSync(fil, 'utf8')
    for (const m of kilde.matchAll(/^import (?!type )(?:[^'"]*? from )?'(\.[^']+)'/gm)) {
      const mål = normalize(join(dirname(fil), m[1]))
      const funnet = [mål, `${mål}.ts`, `${mål}.tsx`, join(mål, 'index.ts')].find((f) => existsSync(f) && statSync(f).isFile())
      if (!funnet) throw new Error(`fant ikke ${m[1]} fra ${fil}`)
      besok(funnet)
    }
  }
  besok(join(SRC, 'main.tsx'))
  return new Set([...sett].map((f) => f.slice(SRC.length).replace(/\\/g, '/')))
}

const tom = (html: string) => !/<(path|circle|ellipse|polygon|g)\b/.test(html)
const mål = (html: string) => html.match(/^<svg[^>]*?width="(\d+)" height="(\d+)"/)?.slice(1)

describe('en lettere start (G12)', () => {
  it('startskriptet tar ikke med eiendom, luksus, kartene eller galleriet', () => {
    const filer = startfiler()
    expect(filer.has('ui/komponenter/Illustrasjoner.tsx')).toBe(true)
    expect(filer.has('ui/komponenter/Norgeskart.tsx')).toBe(true)
    for (const f of [
      'ui/komponenter/ved-behov/Eiendomstegninger.tsx',
      'ui/komponenter/ved-behov/Luksustegninger.tsx',
      'ui/komponenter/ved-behov/Norgeskart.tsx',
      'ui/komponenter/ved-behov/Verdenskart.tsx',
      'ui/kartdata.ts',
      'ui/verdenskartet.ts',
      'ui/screens/Galleri.tsx',
    ])
      expect(filer.has(f), f).toBe(false)
  })

  it('hver id står i nøyaktig én del, og delene har de samme tegningene som listene sier', () => {
    expect(Object.keys(EIENDOMSTEGNINGER)).toEqual(EIENDOMSIDER)
    expect(Object.keys(LUKSUSTEGNINGER)).toEqual(LUKSUSIDER)
    expect(new Set(ILLUSTRASJONSIDER).size).toBe(ILLUSTRASJONSIDER.length)
    expect(ILLUSTRASJONSIDER.length).toBe(71)
  })

  it('før delen er hentet, står et tomt lerret i samme størrelse — etterpå tegningen', async () => {
    const s = nyttSpill()
    const tegn = () => ({
      hybel: renderToStaticMarkup(createElement(Illustrasjon, { id: 'hybel', størrelse: 120 })),
      elbil: renderToStaticMarkup(createElement(Illustrasjon, { id: 'elbil', størrelse: 44, naerbilde: [64, 40] })),
      saftbod: renderToStaticMarkup(createElement(Illustrasjon, { id: 'saftbod', størrelse: 44 })),
      norge: renderToStaticMarkup(createElement(Norgeskart, { s, valgt: null, velg: () => {}, zoom: () => {} })),
      verden: renderToStaticMarkup(createElement(Verdenskart, { s, valgt: null, velg: () => {}, zoom: () => {} })),
    })
    const før = tegn()
    expect(alleDeler().every((d) => d.verdi() === undefined)).toBe(true)
    // Bedriftene er med fra start.
    expect(tom(før.saftbod)).toBe(false)
    expect(tom(før.hybel)).toBe(true)
    expect(tom(før.elbil)).toBe(true)
    expect(før.norge).not.toContain('kart-by')

    await lastAlle()
    const etter = tegn()
    expect(tom(etter.hybel)).toBe(false)
    expect(tom(etter.elbil)).toBe(false)
    expect(mål(før.hybel)).toEqual(['120', '120'])
    expect(mål(før.hybel)).toEqual(mål(etter.hybel))
    expect(mål(før.elbil)).toEqual(mål(etter.elbil))

    // Kartene: samme ramme og samme viewBox, og teksten under verdenskartet står fra start.
    const ramme = (html: string) => [html.match(/^<(\w+) class="([^"]+)"/)?.slice(1), html.match(/viewBox="([^"]+)"/)?.[1]]
    expect(ramme(før.norge)).toEqual(ramme(etter.norge))
    expect(ramme(før.verden)).toEqual(ramme(etter.verden))
    expect(etter.norge).toContain('kart-by')
    const tekst = (html: string) => html.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1]
    expect(tekst(før.verden)).toBeTruthy()
    expect(tekst(før.verden)).toBe(tekst(etter.verden))
  })

  it('omslaget kjenner verdenskartets mål uten å laste kartdataene', () => {
    expect([VERDEN_BREDDE, VERDEN_HOYDE]).toEqual([BREDDE, HOYDE])
  })
})
