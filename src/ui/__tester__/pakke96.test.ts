/**
 * Pakke 96: en raskere og sikrere start.
 *
 * - Den lille skriften har alle tegnene spillet viser (lest rett fra woff2-fila).
 * - Service workeren (src/sw.js) i et lite falskt nettleseroppsett: hele utgivelsen lagres
 *   ved installasjon, lageret holder denne og forrige utgivelse, en navigering venter høyst
 *   3 s på nettet, og forespørsler med søkestreng lagres aldri.
 * - Lasteskjermen sier fra etter 10 s, og fanene er egne biter.
 *
 * Byggets filliste og skriftens forhåndslasting sjekkes i startskript.test.ts (samme bygg).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KUN_I_KOMMENTARER, TEGN } from '../skrifttegn'

const ROT = new URL('../../../', import.meta.url)
const les = (sti: string) => readFileSync(new URL(sti, ROT))

// ─────────────────────────────────────────────── Skriften

/** Tegnene en woff2-fil har (cmap-tabellen). Bare det som trengs her: ingen samlinger. */
function tegnIWoff2(fil: Buffer): Set<number> {
  if (fil.toString('latin1', 0, 4) !== 'wOF2') throw new Error('ikke woff2')
  const antall = fil.readUInt16BE(12)
  const komprimert = fil.readUInt32BE(20)
  let p = 48
  const base128 = () => {
    let v = 0
    for (let i = 0; i < 5; i++) {
      const b = fil[p++]
      v = v * 128 + (b & 0x7f)
      if (!(b & 0x80)) return v
    }
    throw new Error('UIntBase128')
  }
  const tabeller: { tag: string; lengde: number }[] = []
  for (let i = 0; i < antall; i++) {
    const flagg = fil[p++]
    const indeks = flagg & 0x3f
    const versjon = flagg >> 6
    let tag = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca'][indeks] ?? `#${indeks}`
    if (indeks === 63) {
      tag = fil.toString('latin1', p, p + 4)
      p += 4
    }
    const opprinnelig = base128()
    const omformet = tag === 'glyf' || tag === 'loca' ? versjon !== 3 : versjon !== 0
    tabeller.push({ tag, lengde: omformet ? base128() : opprinnelig })
  }
  const data = brotliDecompressSync(fil.subarray(p, p + komprimert))
  expect(tabeller.reduce((sum, t) => sum + t.lengde, 0)).toBe(data.length)
  let start = 0
  for (const t of tabeller) {
    if (t.tag === 'cmap') return lesCmap(data.subarray(start, start + t.lengde))
    start += t.lengde
  }
  throw new Error('ingen cmap')
}

function lesCmap(c: Buffer): Set<number> {
  const ut = new Set<number>()
  const n = c.readUInt16BE(2)
  for (let i = 0; i < n; i++) {
    const plattform = c.readUInt16BE(4 + i * 8)
    const koding = c.readUInt16BE(6 + i * 8)
    const o = c.readUInt32BE(8 + i * 8)
    const format = c.readUInt16BE(o)
    if (plattform === 3 && koding === 10 && format === 12) {
      const grupper = c.readUInt32BE(o + 12)
      for (let g = 0; g < grupper; g++) {
        const fra = c.readUInt32BE(o + 16 + g * 12)
        const til = c.readUInt32BE(o + 20 + g * 12)
        for (let k = fra; k <= til; k++) ut.add(k)
      }
    } else if (plattform === 3 && koding === 1 && format === 4) {
      const seg = c.readUInt16BE(o + 6) / 2
      for (let s = 0; s < seg; s++) {
        const slutt = c.readUInt16BE(o + 14 + s * 2)
        const begynn = c.readUInt16BE(o + 16 + seg * 2 + s * 2)
        for (let k = begynn; k <= slutt && k !== 0xffff; k++) ut.add(k)
      }
    }
  }
  return ut
}

/** Alle tegn over ASCII i spillets kode (ikke testene), med en fil der tegnet står. */
function tegnIKoden(): Map<string, string> {
  const ut = new Map<string, string>()
  const gå = (mappe: URL) => {
    for (const navn of readdirSync(mappe)) {
      const sti = new URL(navn, mappe)
      if (statSync(sti).isDirectory()) {
        if (navn !== '__tester__') gå(new URL(`${navn}/`, mappe))
      } else if (/\.(tsx?|css|js)$/.test(navn) && navn !== 'skrifttegn.ts') {
        for (const c of readFileSync(sti, 'utf8')) if (c.codePointAt(0)! > 0x7f && !ut.has(c)) ut.set(c, join(mappe.pathname, navn))
      }
    }
  }
  gå(new URL('src/', ROT))
  for (const c of readFileSync(new URL('index.html', ROT), 'utf8')) if (c.codePointAt(0)! > 0x7f && !ut.has(c)) ut.set(c, 'index.html')
  return ut
}

describe('den lille skriften', () => {
  const liten = tegnIWoff2(les('src/assets/fonter/InterLatin.woff2'))
  const hel = tegnIWoff2(les('src/assets/fonter/InterVariable.woff2'))

  it('har hvert tegn i lista som hele Inter har, og ingen andre', () => {
    const ønsket = [...TEGN].map((c) => c.codePointAt(0)!).filter((k) => hel.has(k))
    for (const k of ønsket) expect(liten.has(k), `U+${k.toString(16)}`).toBe(true)
    // HarfBuzz kan ta med et par tegn som henger sammen med andre (ligaturer); aldri mange.
    expect(liten.size).toBeLessThan(ønsket.length + 20)
    expect(hel.size).toBeGreaterThan(2000)
  })

  it('har æøå, «», ×, minus og tankestrek', () => {
    for (const c of 'æøåÆØÅ«»×−–—·…‹›') expect(liten.has(c.codePointAt(0)!), c).toBe(true)
  })

  it('lista dekker hvert tegn koden bruker', () => {
    const mangler = [...tegnIKoden()].filter(([c]) => !TEGN.includes(c) && !KUN_I_KOMMENTARER.includes(c))
    expect(
      mangler.map(([c, fil]) => `${c} (U+${c.codePointAt(0)!.toString(16)}) i ${fil}`),
      'legg tegnet til i src/ui/skrifttegn.ts og kjør scripts/lag-skrift.mjs',
    ).toEqual([])
  })

  it('stilarket bruker den lille fila', () => {
    const css = les('src/styles/grunnlag.css').toString()
    expect(css).toContain("url('../assets/fonter/InterLatin.woff2')")
    expect(css).not.toContain('InterVariable')
  })
})

// ─────────────────────────────────────────────── Service workeren

const BASE = 'https://spill.test/milliardaeren/'
const nøkkel = (r: RequestInfo | URL | { url: string }) => new URL(typeof r === 'object' && 'url' in r ? r.url : String(r), BASE).href

/** Origin-hodet en forespørsel sendte (modulskript og skrift sender det; installasjonen ikke). */
const originAv = (r: unknown) => (typeof r === 'object' && r !== null && 'origin' in r ? String(r.origin) : '')

/**
 * Et hurtiglager av Map-er, nok til det sw.js gjør. Som i nettleseren: et svar med
 * `Vary: Origin` passer bare en forespørsel med samme Origin, uten `ignoreVary`.
 * (Det var feilen som stoppet første start uten nett i nettleseren.)
 */
class Lager {
  m = new Map<string, Response>()
  origin = new Map<string, string>()
  constructor(private hent: (r: RequestInfo) => Promise<Response>) {}
  async match(r: RequestInfo, o?: { ignoreVary?: boolean }) {
    const k = nøkkel(r)
    const svar = this.m.get(k)
    if (svar && !o?.ignoreVary && svar.headers.get('vary') === 'Origin' && this.origin.get(k) !== originAv(r)) return undefined
    return svar?.clone()
  }
  async put(r: RequestInfo, svar: Response) {
    this.m.set(nøkkel(r), svar)
    this.origin.set(nøkkel(r), originAv(r))
  }
  async add(r: RequestInfo) {
    await this.addAll([r])
  }
  async addAll(rr: RequestInfo[]) {
    const svar = await Promise.all(rr.map((r) => this.hent(r)))
    if (svar.some((s) => !s.ok)) throw new TypeError('addAll: et svar var ikke ok')
    rr.forEach((r, i) => {
      this.m.set(nøkkel(r), svar[i])
      this.origin.set(nøkkel(r), originAv(r))
    })
  }
  async keys() {
    return [...this.m.keys()].map((u) => new Request(u))
  }
  async delete(r: RequestInfo) {
    return this.m.delete(nøkkel(r))
  }
}

interface Oppsett {
  lager: Lager
  hentet: string[]
  installer: () => Promise<void>
  aktiver: () => Promise<void>
  hent: (url: string, mode?: string) => { svar: Promise<Response> | undefined; ferdig: Promise<unknown> }
  nett: { av: boolean; treg: number; utgave: string }
}

/** Kjører sw.js med fillista `filer` mot et falskt nett og et delt lager. */
function lagServiceWorker(filer: string[], felles?: { lager: Lager; nett: Oppsett['nett']; hentet: string[] }): Oppsett {
  const nett = felles?.nett ?? { av: false, treg: 0, utgave: 'a' }
  const hentet = felles?.hentet ?? []
  const svarFra = (url: string) => new Response(`${url.replace(BASE, '')} (${nett.utgave})`, { status: 200, headers: { Vary: 'Origin' } })
  const hent = (r: RequestInfo): Promise<Response> => {
    const url = nøkkel(r)
    hentet.push(url.replace(BASE, ''))
    if (nett.av) return Promise.reject(new TypeError('uten nett'))
    if (nett.treg) return new Promise((ok) => setTimeout(() => ok(svarFra(url)), nett.treg))
    return Promise.resolve(svarFra(url))
  }
  const lager = felles?.lager ?? new Lager(hent)
  const caches = { open: async () => lager, keys: async () => ['milliardaer-v4', 'milliardaer-v3'], delete: async () => true, match: (r: RequestInfo, o?: { ignoreVary?: boolean }) => lager.match(r, o) }
  const lyttere: Record<string, (e: unknown) => void> = {}
  const self = {
    location: new URL(BASE + 'sw.js'),
    addEventListener: (navn: string, f: (e: unknown) => void) => (lyttere[navn] = f),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  }
  const kode = readFileSync(new URL('src/sw.js', ROT), 'utf8')
    .replace('/*RESSURSER*/ []', JSON.stringify(filer))
    .replace('__UTGAVE__', filer.join('|'))
  // I en ekte service worker leses en relativ adresse fra der sw.js ligger.
  const Forespørsel = class extends Request {
    constructor(u: RequestInfo, o?: RequestInit) {
      super(typeof u === 'string' ? new URL(u, BASE).href : u, o)
    }
  }
  new Function('self', 'caches', 'fetch', 'Request', kode)(self, caches, hent, Forespørsel)
  const hendelse = (navn: string, ekstra: object = {}) => {
    const venter: Promise<unknown>[] = []
    let svar: Promise<Response> | undefined
    lyttere[navn]({ waitUntil: (p: Promise<unknown>) => venter.push(p), respondWith: (p: Promise<Response>) => (svar = Promise.resolve(p)), ...ekstra })
    return { svar, ferdig: Promise.all([...venter, svar]) }
  }
  return {
    lager,
    hentet,
    nett,
    installer: async () => void (await hendelse('install').ferdig),
    aktiver: async () => void (await hendelse('activate').ferdig),
    // Et modulskript og en forhåndslastet skrift (mode cors) sender Origin.
    hent: (url, mode = 'cors') =>
      hendelse('fetch', { request: { method: 'GET', url: nøkkel(url), mode, ...(mode === 'cors' ? { origin: 'https://spill.test' } : {}) } }),
  }
}

const UTGAVE_A = ['./assets/index-a.js', './assets/index-a.css', './assets/InterLatin-x.woff2', './assets/Profil-a.js']
const UTGAVE_B = ['./assets/index-b.js', './assets/index-b.css', './assets/InterLatin-x.woff2', './assets/Profil-b.js']
const UTGAVE_C = ['./assets/index-c.js', './assets/index-c.css', './assets/InterLatin-x.woff2', './assets/Profil-c.js']
const assets = (l: Lager) =>
  [...l.m.keys()]
    .filter((k) => k.includes('/assets/'))
    .map((k) => k.replace(BASE, './'))
    .sort()

describe('service workeren', () => {
  afterEach(() => vi.useRealTimers())

  it('lagrer hele utgivelsen og index.html ved installasjon', async () => {
    const sw = lagServiceWorker(UTGAVE_A)
    await sw.installer()
    await sw.aktiver()
    expect(assets(sw.lager)).toEqual([...UTGAVE_A].sort())
    expect(sw.lager.m.has(BASE + 'index.html')).toBe(true)
    // Uten nett: alt kommer fra lageret.
    sw.nett.av = true
    for (const f of UTGAVE_A) expect(await (await sw.hent(f).svar!).text()).toContain(f.slice(2))
    expect(await (await sw.hent('./', 'navigate').svar!).text()).toContain('index.html')
  })

  it('holder denne og forrige utgivelse, og henter ikke skriften på nytt', async () => {
    const a = lagServiceWorker(UTGAVE_A)
    await a.installer()
    await a.aktiver()
    const felles = { lager: a.lager, nett: a.nett, hentet: a.hentet }
    const b = lagServiceWorker(UTGAVE_B, felles)
    a.hentet.length = 0
    await b.installer()
    // Skriften har samme navn og lå der fra før.
    expect(a.hentet).not.toContain('assets/InterLatin-x.woff2')
    await b.aktiver()
    expect(assets(a.lager)).toEqual([...new Set([...UTGAVE_A, ...UTGAVE_B])].sort())
    const c = lagServiceWorker(UTGAVE_C, felles)
    await c.installer()
    await c.aktiver()
    // Utgave A er borte; B (forrige) og C (denne) er der.
    expect(assets(a.lager)).toEqual([...new Set([...UTGAVE_B, ...UTGAVE_C])].sort())
  })

  it('en installasjon uten nett feiler hel, og lagrer ingen halv utgivelse', async () => {
    const sw = lagServiceWorker(UTGAVE_A)
    sw.nett.av = true
    await expect(sw.installer()).rejects.toThrow()
    expect(assets(sw.lager)).toEqual([])
  })

  it('en navigering venter høyst 3 s på nettet, og lagrer svaret som kommer senere', async () => {
    vi.useFakeTimers()
    const sw = lagServiceWorker(UTGAVE_A)
    await sw.lager.put('./index.html', new Response('index.html (gammel)'))
    sw.nett.treg = 8000
    sw.nett.utgave = 'ny'
    const { svar, ferdig } = sw.hent('./', 'navigate')
    let tekst = ''
    svar!.then((r) => r.text()).then((t) => (tekst = t))
    await vi.advanceTimersByTimeAsync(2900)
    expect(tekst).toBe('')
    await vi.advanceTimersByTimeAsync(200)
    expect(tekst).toBe('index.html (gammel)')
    await vi.advanceTimersByTimeAsync(6000)
    await ferdig
    expect(await (await sw.lager.match('./index.html'))!.text()).toContain('(ny)')
  })

  it('med raskt nett kommer index.html fra nettet', async () => {
    const sw = lagServiceWorker(UTGAVE_A)
    await sw.lager.put('./index.html', new Response('index.html (gammel)'))
    sw.nett.utgave = 'ny'
    expect(await (await sw.hent('./', 'navigate').svar!).text()).toContain('(ny)')
  })

  it('uten nett og uten lagret side svarer den med en feil, ikke en evig venting', async () => {
    const sw = lagServiceWorker(UTGAVE_A)
    sw.nett.av = true
    const svar = await sw.hent('./', 'navigate').svar!
    expect(svar.type).toBe('error')
  })

  it('en forespørsel med søkestreng går forbi og lagres aldri', async () => {
    const sw = lagServiceWorker(UTGAVE_A)
    const { svar } = sw.hent('./index.html?utgave=123')
    expect(svar).toBeUndefined()
    expect([...sw.lager.m.keys()].some((k) => k.includes('?'))).toBe(false)
  })
})

// ─────────────────────────────────────────────── Lasteskjermen og fanene

describe('lasteskjermen og fanene', () => {
  it('lasteskjermen sier «Kunne ikke starte» med «Prøv igjen» etter 10 s', () => {
    const html = les('index.html').toString()
    expect(html).toMatch(/setTimeout\(function \(\) \{[\s\S]*Kunne ikke starte[\s\S]*Prøv igjen[\s\S]*location\.reload\(\)[\s\S]*\}, 10000\)/)
    // Bare så lenge lasteskjermen står: spillet erstatter #root når det tegner.
    expect(html).toContain("document.querySelector('#root > .laster')")
  })

  it('App henter fanene utenom Bedrifter og avisa som egne deler', () => {
    const app = les('src/App.tsx').toString()
    for (const navn of ['Investeringer', 'Eiendom', 'Luksus', 'Profil', 'Avis']) {
      expect(app, navn).not.toMatch(new RegExp(`import \\{ ${navn} \\}`))
    }
    expect(app).toContain("import { Bedrifter } from './ui/screens/Bedrifter'")
    const skjermer = les('src/ui/skjermer.tsx').toString()
    for (const sti of ['./screens/Investeringer', './screens/Eiendom', './screens/Luksus', './screens/Profil', './komponenter/Avis']) {
      expect(skjermer).toContain(`import('${sti}')`)
    }
  })
})
