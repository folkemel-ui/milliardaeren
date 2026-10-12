/**
 * Pakke 97: klar for butikken.
 *
 * - Gullet i lyst tema holder 4.5:1 som tekst på alle tre lyse flater, og hvit på gull.
 * - Ikonene: 1024 × 1024 uten gjennomsiktighet, og et «maskable» ikon der alt ligger
 *   innenfor Androids sikre sirkel. Manifestet har id, kategorier og skjermbildet.
 * - Lagringen speiles til en fil når spillet kjører i en innebygd app (state/speil.ts),
 *   og et spill som starter tomt fordi iOS tømte lagringen, hentes tilbake fra fila.
 */
import { existsSync, readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'

const ROT = new URL('../../../', import.meta.url)
const les = (sti: string) => readFileSync(new URL(sti, ROT))

// ─────────────────────────────────────────────── Gullet i lyst tema

function luminans(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const kontrast = (a: string, b: string) => {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('gull du kan lese i lyst tema', () => {
  const css = les('src/styles/grunnlag.css').toString()
  const lyst = css.slice(css.indexOf(":root[data-theme='light'] {"))
  const token = (navn: string) => lyst.match(new RegExp(`--${navn}: (#[0-9a-f]{6});`))![1]

  it('gull er #8a6600 og holder 4.5:1 på bakgrunnen, kortene og de grå flatene', () => {
    expect(token('gull')).toBe('#8a6600')
    for (const flate of ['bakgrunn', 'flate', 'flate-2']) {
      expect(kontrast(token('gull'), token(flate)), flate).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('teksten på gullknappen holder 4.5:1', () => {
    expect(kontrast(token('paa-gull'), token('gull'))).toBeGreaterThanOrEqual(4.5)
  })

  it('det mørke temaets gull er urørt', () => {
    expect(css.slice(0, css.indexOf(":root[data-theme='light'] {"))).toContain('--gull: #d4af37;')
  })
})

// ─────────────────────────────────────────────── Ikonene og manifestet

/** Bredde, høyde, fargetype og pikslene (RGB) i en PNG fra lag-ikoner.mjs (filter 0 på hver rad). */
function png(fil: Buffer) {
  const bredde = fil.readUInt32BE(16)
  const høyde = fil.readUInt32BE(20)
  const fargetype = fil[25]
  const biter: Buffer[] = []
  for (let p = 8; p < fil.length; ) {
    const lengde = fil.readUInt32BE(p)
    if (fil.toString('latin1', p + 4, p + 8) === 'IDAT') biter.push(fil.subarray(p + 8, p + 8 + lengde))
    p += 12 + lengde
  }
  return { bredde, høyde, fargetype, data: biter.length ? inflateSync(Buffer.concat(biter)) : Buffer.alloc(0) }
}

describe('ikonene og manifestet', () => {
  const manifest = JSON.parse(les('public/manifest.webmanifest').toString()) as {
    id: string
    categories: string[]
    icons: { src: string; sizes: string; purpose: string }[]
    screenshots: { src: string; sizes: string; form_factor: string; label: string }[]
  }

  it('har id (lik dagens standard, så installerte apper er de samme), kategorier og skjermbildet', () => {
    expect(manifest.id).toBe('/milliardaeren/')
    expect(manifest.categories).toContain('games')
    expect(manifest.screenshots.length).toBeGreaterThan(0)
    for (const b of manifest.screenshots) {
      const p = png(les(`public/${b.src}`))
      expect(`${p.bredde}x${p.høyde}`).toBe(b.sizes)
      expect(b.form_factor).toBe('narrow')
      expect(b.label.length).toBeGreaterThan(0)
    }
  })

  it('hvert ikon i manifestet finnes og har størrelsen det sier', () => {
    for (const i of manifest.icons.filter((x) => x.src.endsWith('.png'))) {
      const p = png(les(`public/${i.src}`))
      expect(`${p.bredde}x${p.høyde}`, i.src).toBe(i.sizes)
    }
    expect(manifest.icons.some((i) => i.sizes === '1024x1024' && i.purpose === 'any')).toBe(true)
    expect(manifest.icons.filter((i) => i.purpose === 'maskable').map((i) => i.src)).toEqual(['ikon-maskable-512.png'])
  })

  it('butikkikonet er 1024 × 1024 RGB, uten gjennomsiktighet', () => {
    const p = png(les('public/ikon-1024.png'))
    expect([p.bredde, p.høyde, p.fargetype]).toEqual([1024, 1024, 2])
  })

  it('i det maskable ikonet er alt utenfor den sikre sirkelen (40 % av bredden) bare bakgrunn', () => {
    const { bredde, data } = png(les('public/ikon-maskable-512.png'))
    const rad = bredde * 3 + 1
    const radius = bredde * 0.4
    let utenfor = 0
    let innenfor = 0
    for (let y = 0; y < bredde; y++) {
      for (let x = 0; x < bredde; x++) {
        const i = y * rad + 1 + x * 3
        const bakgrunn = data[i] === 0x0d && data[i + 1] === 0x0c && data[i + 2] === 0x0a
        if (Math.hypot(x + 0.5 - bredde / 2, y + 0.5 - bredde / 2) > radius) {
          if (!bakgrunn) utenfor++
        } else if (!bakgrunn) innenfor++
      }
    }
    expect(utenfor).toBe(0)
    // Og mynten er der: mer enn en tredjedel av sirkelen er tegnet.
    expect(innenfor).toBeGreaterThan(Math.PI * radius * radius * 0.33)
  })

  it('butikkbildet er 1290 × 2796', () => {
    expect(existsSync(new URL('butikk/skjermbilder/bedrifter-1290x2796.png', ROT))).toBe(true)
    const p = png(les('butikk/skjermbilder/bedrifter-1290x2796.png'))
    expect([p.bredde, p.høyde]).toEqual([1290, 2796])
  })
})

// ─────────────────────────────────────────────── Speilfila

const LAGRING = 'milliardaer.lagring'
const SIST_AKTIV = 'milliardaer.sistAktiv'
const FIL = 'DATA/milliardaer/lagring.json'

let disk: Map<string, string>
let filer: Map<string, string>
let skrivinger: number
let reload: ReturnType<typeof vi.fn>

function falskeGlobaler(innebygd: boolean) {
  disk = new Map()
  filer = new Map()
  skrivinger = 0
  reload = vi.fn()
  const lyttere = { addEventListener: () => {}, removeEventListener: () => {} }
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => disk.get(k) ?? null,
    setItem: (k: string, v: string) => void disk.set(k, String(v)),
    removeItem: (k: string) => void disk.delete(k),
  })
  vi.stubGlobal('document', { hidden: false, ...lyttere })
  vi.stubGlobal('window', { ...lyttere })
  vi.stubGlobal('location', { reload })
  vi.stubGlobal(
    'Capacitor',
    innebygd
      ? {
          isNativePlatform: () => true,
          Plugins: {
            Filesystem: {
              readFile: async (o: { path: string; directory: string }) => {
                const d = filer.get(`${o.directory}/${o.path}`)
                if (d === undefined) throw new Error('File does not exist')
                return { data: d }
              },
              writeFile: async (o: { path: string; directory: string; data: string }) => {
                skrivinger++
                filer.set(`${o.directory}/${o.path}`, o.data)
              },
            },
          },
        }
      : undefined,
  )
}

async function åpne() {
  vi.resetModules()
  return import('../lager')
}
/** Lar ventende løfter (filen som leses og skrives) bli ferdige. */
const ferdig = () => vi.advanceTimersByTimeAsync(0)

describe('lagringen speilet i en fil (innebygd app)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'setTimeout', 'Date', 'performance'] })
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('i nettleseren skjer ingenting', async () => {
    falskeGlobaler(false)
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    l.lagre()
    await ferdig()
    expect(filer.size).toBe(0)
    expect(disk.has(LAGRING)).toBe(true)
    l.stoppSpillokke()
  })

  it('hver lagring skrives også til fila, med tiden den ble skrevet', async () => {
    falskeGlobaler(true)
    const s = simuler(nyttSpill(), 120)
    disk.set(LAGRING, JSON.stringify(s))
    disk.set(SIST_AKTIV, String(Date.now()))
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    const fil = JSON.parse(filer.get(FIL)!)
    expect(fil.versjon).toBe(1)
    expect(fil.lagring).toBe(disk.get(LAGRING))
    expect(fil.sistAktiv).toBe(Number(disk.get(SIST_AKTIV)))
    expect(JSON.parse(fil.lagring).sek).toBeGreaterThanOrEqual(s.sek)
    l.stoppSpillokke()
  })

  it('starter spillet tomt og fila har et spill, legges det tilbake og siden lastes på nytt', async () => {
    falskeGlobaler(true)
    const s = simuler(nyttSpill(), 300)
    const lagring = JSON.stringify(s)
    filer.set(FIL, JSON.stringify({ versjon: 1, lagring, sistAktiv: Date.now() - 60_000 }))
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(disk.get(LAGRING)).toBe(lagring)
    expect(disk.get(SIST_AKTIV)).toBe(String(Date.now() - 60_000))
    // Det nye, tomme spillet ble aldri skrevet over fila.
    expect(skrivinger).toBe(0)
    expect(JSON.parse(filer.get(FIL)!).lagring).toBe(lagring)
  })

  it('uten fil fortsetter det nye spillet, og neste lagring skriver fila', async () => {
    falskeGlobaler(true)
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    expect(reload).not.toHaveBeenCalled()
    l.lagre()
    await ferdig()
    expect(JSON.parse(filer.get(FIL)!).lagring).toBe(disk.get(LAGRING))
    l.stoppSpillokke()
  })

  it('en fil som ikke er et spill, blir ikke brukt, og skrives over ved neste lagring', async () => {
    falskeGlobaler(true)
    filer.set(FIL, JSON.stringify({ versjon: 1, lagring: '{"ikke":"et spill"}', sistAktiv: 1 }))
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    expect(reload).not.toHaveBeenCalled()
    l.lagre()
    await ferdig()
    expect(JSON.parse(filer.get(FIL)!).lagring).toBe(disk.get(LAGRING))
    l.stoppSpillokke()
  })

  it('med en lagring i localStorage leses fila aldri', async () => {
    falskeGlobaler(true)
    disk.set(LAGRING, JSON.stringify(nyttSpill()))
    disk.set(SIST_AKTIV, String(Date.now()))
    filer.set(FIL, JSON.stringify({ versjon: 1, lagring: JSON.stringify(simuler(nyttSpill(), 900)), sistAktiv: 1 }))
    const l = await åpne()
    l.startSpillokke()
    await ferdig()
    expect(reload).not.toHaveBeenCalled()
    l.stoppSpillokke()
  })

  it('flere lagringer mens fila skrives: bare den siste skrives etterpå', async () => {
    const { speil } = await import('../speil')
    let slipp: () => void = () => {}
    const skrevet: string[] = []
    vi.stubGlobal('Capacitor', {
      isNativePlatform: () => true,
      Plugins: {
        Filesystem: {
          readFile: async () => ({ data: '' }),
          writeFile: (o: { data: string }) => {
            skrevet.push(JSON.parse(o.data).lagring)
            return new Promise<void>((ok) => (slipp = ok))
          },
        },
      },
    })
    speil('a', 1)
    speil('b', 2)
    speil('c', 3)
    expect(skrevet).toEqual(['a'])
    slipp()
    await ferdig()
    expect(skrevet).toEqual(['a', 'c'])
  })
})
