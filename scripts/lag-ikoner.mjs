/**
 * Lager PNG-ikonene fra de samme formene som public/ikon.svg — uten
 * avhengigheter: formene tegnes piksel for piksel med 4×4 delpunkter for
 * glatte kanter, og PNG-en skrives med Nodes egen zlib.
 *
 * Ikonene fyller hele flaten (ingen avrundede hjørner og ingen
 * gjennomsiktighet): iOS og Android runder av selv, og iOS godtar ikke
 * gjennomsiktige hjemskjermikoner. Innholdet ligger innenfor den sikre
 * sirkelen for «maskable» ikoner på Android.
 *
 *     node scripts/lag-ikoner.mjs
 */

import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BAKGRUNN = [0x0d, 0x0c, 0x0a]
const GULL_LYS = [0xf0, 0xd2, 0x7a]
const GULL = [0xd4, 0xaf, 0x37]
const RING = [0x9c, 0x7c, 0x1c]
const MØRK = [0x1a, 0x15, 0x08]
const GLIMT = [0xff, 0xf4, 0xc8]
// M-en: en tykk strek med runde ender og hjørner, der høyre topp står høyest.
const M = [[178, 336], [178, 236], [254, 300], [334, 178], [334, 336]]
const M_BREDDE = 42
const STJERNE = [[382, 104], [390, 132], [418, 140], [390, 148], [382, 176], [374, 148], [346, 140], [374, 132]]

function iPolygon(x, y, punkter) {
  let inni = false
  for (let i = 0, j = punkter.length - 1; i < punkter.length; j = i++) {
    const [xi, yi] = punkter[i]
    const [xj, yj] = punkter[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inni = !inni
  }
  return inni
}

/** Avstanden fra et punkt til en linjebit — en strek med runde ender er alt innenfor halve bredden. */
function avstand(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(x - ax - t * dx, y - ay - t * dy)
}

function iStrek(x, y, punkter, bredde) {
  for (let i = 1; i < punkter.length; i++) if (avstand(x, y, punkter[i - 1], punkter[i]) <= bredde / 2) return true
  return false
}

/** Fargen i et punkt i 512-rutenettet, i samme malerekkefølge som SVG-en. */
function farge(x, y) {
  let f = BAKGRUNN
  if (Math.hypot(x - 256, y - 256) <= 184) f = GULL_LYS
  if (Math.hypot(x - 264, y - 266) <= 171) f = GULL
  if (Math.abs(Math.hypot(x - 256, y - 256) - 148) <= 5) f = RING
  if (iStrek(x, y, M, M_BREDDE)) f = MØRK
  if (iPolygon(x, y, STJERNE)) f = GLIMT
  return f
}

function tegn(n) {
  const piksler = Buffer.alloc(n * (n * 3 + 1))
  const S = 4
  for (let py = 0; py < n; py++) {
    piksler[py * (n * 3 + 1)] = 0 // filter: ingen
    for (let px = 0; px < n; px++) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const f = farge(((px + (sx + 0.5) / S) * 512) / n, ((py + (sy + 0.5) / S) * 512) / n)
          sum[0] += f[0]
          sum[1] += f[1]
          sum[2] += f[2]
        }
      }
      const i = py * (n * 3 + 1) + 1 + px * 3
      for (let k = 0; k < 3; k++) piksler[i + k] = Math.round(sum[k] / (S * S))
    }
  }
  return piksler
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(buf) {
  let c = -1
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function bit(type, data) {
  const lengde = Buffer.alloc(4)
  lengde.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([lengde, td, crc])
}

function png(n) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(n, 0)
  ihdr.writeUInt32BE(n, 4)
  ihdr[8] = 8 // bitdybde
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bit('IHDR', ihdr),
    bit('IDAT', deflateSync(tegn(n), { level: 9 })),
    bit('IEND', Buffer.alloc(0)),
  ])
}

for (const [navn, n] of [['apple-touch-icon.png', 180], ['ikon-192.png', 192], ['ikon-512.png', 512]]) {
  writeFileSync(new URL(`../public/${navn}`, import.meta.url), png(n))
  console.log(`public/${navn} (${n}×${n})`)
}
