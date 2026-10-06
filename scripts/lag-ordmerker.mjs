/**
 * Lager ordmerkene til selskapslogoene (Grafikkpakke G4) som SVG-stier.
 *
 * SVG-tekst lekker inn i sidens tekst, så bokstavene tegnes som stier. Stiene
 * hentes fra åpne skrifter (SIL Open Font License, Google Fonts), lest av en
 * liten TrueType-leser her: konturer, sammensatte tegn (Ø, Å) og
 * kerning fra GPOS. Bare stiene havner i koden; ingen skrift lastes i spillet.
 *
 *   node scripts/lag-ordmerker.mjs <mappe med .ttf>
 *
 * Mappen trenger filene under FONTER. Hent dem med curl fra Google Fonts' CSS-API
 * (uten egen user agent får du .ttf), f.eks.
 *   curl -s "https://fonts.googleapis.com/css2?family=Oswald:wght@600"
 * og last ned url(...) derfra.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Skriftene, med vekten som ble lastet ned. */
const FONTER = {
  playfair: 'playfair.ttf', // Playfair Display 700
  baskerville: 'baskerville.ttf', // Libre Baskerville 400
  cormorant: 'cormorant.ttf', // Cormorant Garamond 600
  oswald: 'oswald.ttf', // Oswald 600
  archivo: 'archivo.ttf', // Archivo 125 % bredde, 800
  grotesk: 'grotesk.ttf', // Space Grotesk 600
  zilla: 'zilla.ttf', // Zilla Slab 600
  nunito: 'nunito.ttf', // Nunito 800
}

/**
 * Ordmerkene. Hver linje har skrift, tekst, størrelse (em i enheter) og sperring
 * (ekstra avstand i em). Linjene stables med `avstand` mellom grunnlinjene.
 */
const ORDMERKER = {
  NFS: [{ font: 'cormorant', tekst: 'Nordfjord', str: 12, sperr: 0.01 }],
  FJK: [{ font: 'archivo', tekst: 'FJELLKRAFT', str: 10.5, sperr: 0.02 }],
  VTK: [{ font: 'zilla', tekst: 'Viking', str: 12, sperr: 0 }, { font: 'zilla', tekst: 'TELEKOM', str: 6.4, sperr: 0.2 }],
  BSH: [{ font: 'playfair', tekst: 'BERGEN', str: 10, sperr: 0.08 }, { font: 'playfair', tekst: 'SHIPPING', str: 6.2, sperr: 0.24 }],
  POL: [{ font: 'oswald', tekst: 'POLARIS', str: 12, sperr: 0.06 }],
  NLT: [{ font: 'grotesk', tekst: 'nordlys', str: 12, sperr: -0.02 }],
  AUB: [{ font: 'grotesk', tekst: 'aurora', str: 11.5, sperr: -0.01 }, { font: 'grotesk', tekst: 'BIOTEKNOLOGI', str: 5.4, sperr: 0.1 }],
  TRS: [{ font: 'nunito', tekst: 'trollspill', str: 11.5, sperr: 0 }],
  NRB: [{ font: 'baskerville', tekst: 'Nordre', str: 10.5, sperr: 0.01 }, { font: 'baskerville', tekst: 'BANK', str: 6.4, sperr: 0.36 }],
  KRV: [{ font: 'nunito', tekst: 'kurv', str: 13, sperr: 0 }],
  FJF: [{ font: 'oswald', tekst: 'FJELLFLY', str: 12, sperr: 0.04 }],
  ROM: [{ font: 'archivo', tekst: 'ROMFART', str: 10, sperr: 0.05 }, { font: 'archivo', tekst: 'NORD', str: 6.2, sperr: 0.5 }],
  BMT: [{ font: 'grotesk', tekst: 'bitmynt', str: 12, sperr: -0.01 }],
  FJD: [{ font: 'archivo', tekst: 'FJORDIUM', str: 10.5, sperr: 0.03 }],
  NSL: [{ font: 'oswald', tekst: 'NORDSOL', str: 12, sperr: 0.08 }],
  TRM: [{ font: 'nunito', tekst: 'trollmynt', str: 11.5, sperr: 0 }],
  VKT: [{ font: 'zilla', tekst: 'Vikingtoken', str: 11.5, sperr: 0 }],
  LKS: [{ font: 'nunito', tekst: 'laksecoin', str: 11.5, sperr: 0 }],
  STK: [{ font: 'baskerville', tekst: 'Stabilkrone', str: 10, sperr: 0.01 }],
  ELG: [{ font: 'nunito', tekst: 'elgcoin', str: 12, sperr: 0 }],
  BRN: [{ font: 'nunito', tekst: 'brunost', str: 12, sperr: 0 }],
}

// ---------------------------------------------------------------- TrueType

function lesFont(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const u16 = (o) => v.getUint16(o)
  const i16 = (o) => v.getInt16(o)
  const u32 = (o) => v.getUint32(o)
  const tabeller = {}
  for (let i = 0; i < u16(4); i++) {
    const o = 12 + i * 16
    const tag = String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3])
    tabeller[tag] = u32(o + 8)
  }
  for (const t of ['head', 'hhea', 'hmtx', 'maxp', 'cmap', 'loca', 'glyf']) if (tabeller[t] === undefined) throw new Error(`mangler ${t}`)
  const head = tabeller.head
  const upm = u16(head + 18)
  const langLoca = i16(head + 50) === 1
  const antallGlyfer = u16(tabeller.maxp + 4)
  const antallMetrikk = u16(tabeller.hhea + 34)
  const bredde = (g) => u16(tabeller.hmtx + 4 * Math.min(g, antallMetrikk - 1))

  // cmap: format 4 eller 12 for Unicode.
  const tegnTilGlyf = new Map()
  const cmap = tabeller.cmap
  for (let i = 0; i < u16(cmap + 2); i++) {
    const plattform = u16(cmap + 4 + i * 8)
    const koding = u16(cmap + 6 + i * 8)
    const o = cmap + u32(cmap + 8 + i * 8)
    const format = u16(o)
    if (!(plattform === 3 && (koding === 1 || koding === 10)) && plattform !== 0) continue
    if (format === 4) {
      const n = u16(o + 6) / 2
      const slutt = o + 14
      const start = slutt + n * 2 + 2
      const delta = start + n * 2
      const rangeOff = delta + n * 2
      for (let s = 0; s < n; s++) {
        const a = u16(start + s * 2)
        const b = u16(slutt + s * 2)
        const d = i16(delta + s * 2)
        const r = u16(rangeOff + s * 2)
        for (let c = a; c <= b && c !== 0xffff; c++) {
          let g
          if (r === 0) g = (c + d) & 0xffff
          else {
            g = u16(rangeOff + s * 2 + r + (c - a) * 2)
            if (g !== 0) g = (g + d) & 0xffff
          }
          if (!tegnTilGlyf.has(c)) tegnTilGlyf.set(c, g)
        }
      }
    } else if (format === 12) {
      for (let k = 0; k < u32(o + 12); k++) {
        const a = u32(o + 16 + k * 12)
        const b = u32(o + 20 + k * 12)
        const g = u32(o + 24 + k * 12)
        for (let c = a; c <= b; c++) if (!tegnTilGlyf.has(c)) tegnTilGlyf.set(c, g + c - a)
      }
    }
  }

  const loca = (g) => (langLoca ? u32(tabeller.loca + g * 4) : u16(tabeller.loca + g * 2) * 2)

  /** Konturene til en glyf som lister av punkter {x, y, paa}. */
  function konturer(g, dybde = 0) {
    if (g >= antallGlyfer || dybde > 8) return []
    const start = loca(g)
    if (loca(g + 1) === start) return []
    const o = tabeller.glyf + start
    const n = i16(o)
    if (n >= 0) {
      const ender = []
      for (let i = 0; i < n; i++) ender.push(u16(o + 10 + i * 2))
      const antall = n ? ender[n - 1] + 1 : 0
      let p = o + 10 + n * 2
      p += 2 + u16(p)
      const flagg = []
      while (flagg.length < antall) {
        const f = buf[p++]
        flagg.push(f)
        if (f & 8) {
          let r = buf[p++]
          while (r-- > 0) flagg.push(f)
        }
      }
      const xs = []
      let x = 0
      for (const f of flagg) {
        if (f & 2) x += f & 16 ? buf[p++] : -buf[p++]
        else if (!(f & 16)) { x += i16(p); p += 2 }
        xs.push(x)
      }
      const ys = []
      let y = 0
      for (const f of flagg) {
        if (f & 4) y += f & 32 ? buf[p++] : -buf[p++]
        else if (!(f & 32)) { y += i16(p); p += 2 }
        ys.push(y)
      }
      const ut = []
      let fra = 0
      for (const e of ender) {
        const k = []
        for (let i = fra; i <= e; i++) k.push({ x: xs[i], y: ys[i], paa: (flagg[i] & 1) === 1 })
        ut.push(k)
        fra = e + 1
      }
      return ut
    }
    // Sammensatt glyf: deler med forskyvning og eventuell skalering.
    const ut = []
    let p = o + 10
    for (;;) {
      const f = u16(p)
      const del = u16(p + 2)
      p += 4
      let dx, dy
      if (f & 1) { dx = i16(p); dy = i16(p + 2); p += 4 }
      else { dx = (buf[p] << 24) >> 24; dy = (buf[p + 1] << 24) >> 24; p += 2 }
      if (!(f & 2)) throw new Error('sammensatt glyf med punktankre støttes ikke')
      let a = 1, b = 0, c = 0, d = 1
      const f2 = (q) => i16(q) / 16384
      if (f & 8) { a = d = f2(p); p += 2 }
      else if (f & 0x40) { a = f2(p); d = f2(p + 2); p += 4 }
      else if (f & 0x80) { a = f2(p); b = f2(p + 2); c = f2(p + 4); d = f2(p + 6); p += 8 }
      for (const k of konturer(del, dybde + 1)) ut.push(k.map((q) => ({ x: a * q.x + c * q.y + dx, y: b * q.x + d * q.y + dy, paa: q.paa })))
      if (!(f & 0x20)) break
    }
    return ut
  }

  // GPOS-kerning: oppslag av type 2 (eller 9 → 2) under egenskapen «kern».
  const kernOppslag = []
  if (tabeller.GPOS !== undefined) {
    const g0 = tabeller.GPOS
    const featList = g0 + u16(g0 + 6)
    const lookList = g0 + u16(g0 + 8)
    const indekser = new Set()
    for (let i = 0; i < u16(featList); i++) {
      const r = featList + 2 + i * 6
      const tag = String.fromCharCode(buf[r], buf[r + 1], buf[r + 2], buf[r + 3])
      if (tag !== 'kern') continue
      const ft = featList + u16(r + 4)
      for (let k = 0; k < u16(ft + 2); k++) indekser.add(u16(ft + 4 + k * 2))
    }
    for (const li of [...indekser].sort((a, b) => a - b)) {
      const l = lookList + u16(lookList + 2 + li * 2)
      const type = u16(l)
      const deler = []
      for (let k = 0; k < u16(l + 4); k++) {
        let st = l + u16(l + 6 + k * 2)
        let t = type
        if (t === 9) { t = u16(st + 2); st = st + u32(st + 4) }
        if (t === 2) deler.push(st)
      }
      if (deler.length) kernOppslag.push(deler)
    }
  }
  const dekning = (o, g) => {
    const f = u16(o)
    if (f === 1) {
      for (let i = 0; i < u16(o + 2); i++) if (u16(o + 4 + i * 2) === g) return i
    } else {
      for (let i = 0; i < u16(o + 2); i++) {
        const r = o + 4 + i * 6
        if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4) + g - u16(r)
      }
    }
    return -1
  }
  const klasse = (o, g) => {
    const f = u16(o)
    if (f === 1) {
      const s = u16(o + 2)
      return g >= s && g < s + u16(o + 4) ? u16(o + 6 + (g - s) * 2) : 0
    }
    for (let i = 0; i < u16(o + 2); i++) {
      const r = o + 4 + i * 6
      if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4)
    }
    return 0
  }
  const verdistr = (vf) => [...Array(8).keys()].filter((b) => vf & (1 << b)).length * 2
  /** XAdvance (eller XPlacement) for første glyf i en verdipost. */
  const xFra = (o, vf) => {
    let p = o
    let x = 0
    if (vf & 1) { x += i16(p); p += 2 }
    if (vf & 2) p += 2
    if (vf & 4) x += i16(p)
    return x
  }
  function kern(a, b) {
    let sum = 0
    for (const deler of kernOppslag) {
      for (const st of deler) {
        const format = u16(st)
        const ci = dekning(st + u16(st + 2), a)
        if (ci < 0) continue
        const vf1 = u16(st + 4)
        const vf2 = u16(st + 6)
        const s1 = verdistr(vf1)
        const s2 = verdistr(vf2)
        let funnet = null
        if (format === 1) {
          const ps = st + u16(st + 10 + ci * 2)
          for (let i = 0; i < u16(ps); i++) {
            const r = ps + 2 + i * (2 + s1 + s2)
            if (u16(r) === b) { funnet = xFra(r + 2, vf1); break }
          }
        } else if (format === 2) {
          const k1 = klasse(st + u16(st + 8), a)
          const k2 = klasse(st + u16(st + 10), b)
          const n2 = u16(st + 14)
          funnet = xFra(st + 16 + (k1 * n2 + k2) * (s1 + s2), vf1)
        }
        if (funnet !== null) { sum += funnet; break }
      }
    }
    return sum
  }

  return { upm, tegnTilGlyf, bredde, konturer, kern }
}

// ---------------------------------------------------------------- stier

const r2 = (n) => {
  const t = Math.round(n * 10) / 10
  return Object.is(t, -0) ? '0' : String(t)
}

/** En kontur (kvadratiske kurver) som SVG-sti, skalert og flyttet. */
function kontursti(k, sx, ox, oy) {
  const P = (q) => [ox + q.x * sx, oy - q.y * sx]
  const n = k.length
  if (!n) return ''
  // Start på et punkt på kurven; finnes ingen, i midten mellom de to første.
  let s = k.findIndex((q) => q.paa)
  const pkt = []
  if (s < 0) {
    const m = { x: (k[0].x + k[1].x) / 2, y: (k[0].y + k[1].y) / 2, paa: true }
    pkt.push(m, ...k.slice(1), k[0])
  } else for (let i = 0; i < n; i++) pkt.push(k[(s + i) % n])
  const [x0, y0] = P(pkt[0])
  let d = `M${r2(x0)} ${r2(y0)}`
  let i = 1
  const m = pkt.length
  while (i <= m) {
    const q = pkt[i % m]
    if (q.paa) {
      const [x, y] = P(q)
      d += `L${r2(x)} ${r2(y)}`
      i++
    } else {
      const neste = pkt[(i + 1) % m]
      const ende = neste.paa ? neste : { x: (q.x + neste.x) / 2, y: (q.y + neste.y) / 2 }
      const [cx, cy] = P(q)
      const [ex, ey] = P(ende)
      d += `Q${r2(cx)} ${r2(cy)} ${r2(ex)} ${r2(ey)}`
      i += neste.paa ? 2 : 1
    }
  }
  return d.replace(/L([\d.-]+) ([\d.-]+)$/, '') + 'Z'
}

const mappe = process.argv[2]
if (!mappe) throw new Error('bruk: node scripts/lag-ordmerker.mjs <mappe med .ttf>')
const fonter = Object.fromEntries(Object.entries(FONTER).map(([k, f]) => [k, lesFont(readFileSync(join(mappe, f)))]))

/** Setter én linje på grunnlinja y = 0 fra x = 0: sti, bredde og høyde over/under. */
function settLinje({ font, tekst, str, sperr }) {
  const f = fonter[font]
  const sx = str / f.upm
  let x = 0
  let d = ''
  let topp = 0
  let bunn = 0
  const tegn = [...tekst]
  tegn.forEach((t, i) => {
    const g = f.tegnTilGlyf.get(t.codePointAt(0))
    if (g === undefined) throw new Error(`${font} mangler «${t}»`)
    for (const k of f.konturer(g)) {
      d += kontursti(k, sx, x, 0)
      for (const q of k) {
        topp = Math.max(topp, q.y * sx)
        bunn = Math.min(bunn, q.y * sx)
      }
    }
    x += f.bredde(g) * sx
    if (i < tegn.length - 1) {
      const neste = f.tegnTilGlyf.get(tegn[i + 1].codePointAt(0))
      x += f.kern(g, neste) * sx + sperr * str
    }
  })
  return { d, bredde: x, topp, bunn }
}

/** Monogrammer: én bokstav til merker som trenger den (bankens segl, mynten). */
const MONOGRAMMER = {
  NRB: [{ font: 'baskerville', tekst: 'N', str: 13, sperr: 0 }],
  BMT: [{ font: 'grotesk', tekst: 'B', str: 13, sperr: 0 }],
}

function sett(kilde) {
const ut = {}
for (const [id, linjer] of Object.entries(kilde)) {
  // Linjene sentreres på den bredeste, med litt luft mellom.
  const satt = linjer.map(settLinje)
  const bredde = Math.max(...satt.map((l) => l.bredde))
  let y = 0
  let d = ''
  satt.forEach((l, i) => {
    y += i === 0 ? l.topp : -satt[i - 1].bunn + l.topp + linjer[i].str * 0.3
    const dx = (bredde - l.bredde) / 2
    d += l.d.replace(/([MLQ])([^MLQZ]+)/g, (_, c, tall) => {
      const v = tall.trim().split(/\s+/).map(Number)
      return c + v.map((n, j) => r2(j % 2 === 0 ? n + dx : n + y)).join(' ')
    })
    if (i === satt.length - 1) y += -l.bunn
  })
  ut[id] = { d, bredde: +bredde.toFixed(2), hoyde: +y.toFixed(2) }
}
return ut
}
const ut = sett(ORDMERKER)
const mono = sett(MONOGRAMMER)

/**
 * Gjør en absolutt sti (M/L/Q/Z) relativ (m/l/h/v/q/z) i tideler, så tallene blir
 * korte. Regnes i heltall fra de avrundede punktene, så ingenting driver.
 */
function relativ(d) {
  const t = (n) => Math.round(n * 10)
  const s = (n) => {
    const v = n / 10
    return (v < 0 ? '-' : ' ') + String(Math.abs(v)).replace(/^0\./, '.')
  }
  const par = (...v) => v.map(s).join('').replace(/^ /, '')
  let ut = ''
  let cx = 0, cy = 0, sx = 0, sy = 0
  for (const [, c, rest] of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
    const v = rest.trim() ? rest.trim().split(/\s+/).map((n) => t(Number(n))) : []
    if (c === 'M') {
      ut += 'm' + par(v[0] - cx, v[1] - cy)
      cx = sx = v[0]; cy = sy = v[1]
    } else if (c === 'L') {
      const dx = v[0] - cx, dy = v[1] - cy
      if (dx === 0 && dy === 0) continue
      ut += dy === 0 ? 'h' + par(dx) : dx === 0 ? 'v' + par(dy) : 'l' + par(dx, dy)
      cx = v[0]; cy = v[1]
    } else if (c === 'Q') {
      ut += 'q' + par(v[0] - cx, v[1] - cy, v[2] - cx, v[3] - cy)
      cx = v[2]; cy = v[3]
    } else {
      ut += 'z'
      cx = sx; cy = sy
    }
  }
  return ut
}

const rad = ([id, o]) => `  ${id}: { bredde: ${o.bredde}, hoyde: ${o.hoyde}, d: '${relativ(o.d)}' },`
const linjer = Object.entries(ut).map(rad)
const fil = `/**
 * Ordmerkene til selskapslogoene som SVG-stier (Grafikkpakke G4).
 * GENERERT av scripts/lag-ordmerker.mjs — ikke rediger for hånd.
 *
 * Bokstavene kommer fra åpne skrifter (SIL Open Font License): Playfair Display,
 * Libre Baskerville, Cormorant Garamond, Oswald, Archivo, Space Grotesk,
 * Zilla Slab og Nunito. Stiene starter i (0, 0) øverst til venstre.
 */

import type { PapirId } from '../engine/types'

export interface Ordmerke {
  bredde: number
  hoyde: number
  d: string
}

export const ORDMERKER: Record<PapirId, Ordmerke> = {
${linjer.join('\n')}
}

/** Enkeltbokstaver til merkene som bruker dem. */
export const MONOGRAMMER: Partial<Record<PapirId, Ordmerke>> = {
${Object.entries(mono).map(rad).join('\n')}
}
`
writeFileSync(new URL('../src/ui/ordmerker.ts', import.meta.url), fil)
console.log(Object.entries(ut).map(([id, o]) => `${id} ${o.bredde}×${o.hoyde} ${o.d.length} tegn`).join('\n'))
console.log('totalt', fil.length, 'byte')
