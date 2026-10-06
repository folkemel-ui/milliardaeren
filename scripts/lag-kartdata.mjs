// Lager src/ui/kartdata.ts fra Natural Earth (public domain, naturalearthdata.com).
//
// Bruk: node scripts/lag-kartdata.mjs <mappe>
// der <mappe> har ne_10m_admin_0_countries.geojson, ne_50m_admin_0_countries.geojson
// ne_10m_lakes.geojson og ne_10m_geography_regions_polys.geojson
// (fra github.com/nvkelso/natural-earth-vector, geojson/).
//
// Hvert utsnitt klippes til sitt område, forenkles (Douglas–Peucker) i kartets
// egne enheter, og øyer som blir mindre enn et par enheter, faller bort. Ut
// kommer lengde- og breddegrader med to desimaler, som flate tallrekker.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const mappe = process.argv[2]
if (!mappe) throw new Error('Bruk: node scripts/lag-kartdata.mjs <mappe med geojson>')
const les = (navn) => JSON.parse(readFileSync(join(mappe, navn), 'utf8')).features

const land10 = les('ne_10m_admin_0_countries.geojson')
const land50 = les('ne_50m_admin_0_countries.geojson')
const sjoer10 = les('ne_10m_lakes.geojson')
// Fjellområdene (Kjølen og Hardangervidda), til fjellskyggene på Norgeskartet.
const fjell10 = les('ne_10m_geography_regions_polys.geojson').filter((f) => ['KJØLEN MOUNTAINS', 'Hardanger-vidda'].includes(f.properties.NAME))

const kode = (f) => (f.properties.ADM0_A3 || f.properties.ISO_A3 || '').toUpperCase()

/** Ytre ringer for en feature (hull droppes — innsjøer tegnes for seg). */
function ringer(f) {
  const g = f.geometry
  if (!g) return []
  if (g.type === 'Polygon') return [g.coordinates[0]]
  if (g.type === 'MultiPolygon') return g.coordinates.map((p) => p[0])
  return []
}

/** Sutherland–Hodgman: klipper en ring mot et rektangel i grader. */
function klipp(ring, [v, o, s, n]) {
  const kanter = [
    [(p) => p[0] >= v, (a, b) => kryssX(a, b, v)],
    [(p) => p[0] <= o, (a, b) => kryssX(a, b, o)],
    [(p) => p[1] >= s, (a, b) => kryssY(a, b, s)],
    [(p) => p[1] <= n, (a, b) => kryssY(a, b, n)],
  ]
  let ut = ring
  for (const [inne, kryss] of kanter) {
    const inn = ut
    ut = []
    for (let i = 0; i < inn.length; i++) {
      const a = inn[i]
      const b = inn[(i + 1) % inn.length]
      if (inne(b)) {
        if (!inne(a)) ut.push(kryss(a, b))
        ut.push(b)
      } else if (inne(a)) ut.push(kryss(a, b))
    }
    if (ut.length === 0) break
  }
  return ut
}
const kryssX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
const kryssY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]

/** Douglas–Peucker på en lukket ring, i projiserte koordinater. */
function forenkle(punkter, toleranse) {
  if (punkter.length < 4) return punkter
  const behold = new Uint8Array(punkter.length)
  behold[0] = behold[punkter.length - 1] = 1
  const stakk = [[0, punkter.length - 1]]
  while (stakk.length) {
    const [a, b] = stakk.pop()
    const [ax, ay] = punkter[a].p
    const [bx, by] = punkter[b].p
    const dx = bx - ax
    const dy = by - ay
    const l = Math.hypot(dx, dy)
    let maks = 0
    let k = -1
    for (let i = a + 1; i < b; i++) {
      const [px, py] = punkter[i].p
      // En lukket ring starter og slutter i samme punkt: da måles avstanden til punktet.
      const d = l < 1e-9 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / l
      if (d > maks) {
        maks = d
        k = i
      }
    }
    if (maks > toleranse && k > 0) {
      behold[k] = 1
      stakk.push([a, k], [k, b])
    }
  }
  return punkter.filter((_, i) => behold[i])
}

const areal = (p) => Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1] }, 0) / 2)

/**
 * Ett utsnitt: features → klipp → projiser → forenkle → dropp småøyer →
 * flate tallrekker [lengde, bredde, lengde, bredde, …].
 */
function utsnitt(features, koder, boks, proj, toleranse, minAreal) {
  const valgt = koder ? features.filter((f) => koder.includes(kode(f))) : features
  const ut = []
  for (const f of valgt) {
    for (const r of ringer(f)) {
      const k = klipp(r, boks)
      if (k.length < 3) continue
      // Lukk ringen for forenklingen, og fjern siste punkt etterpå.
      const pk = [...k, k[0]].map((q) => ({ q, p: proj(q) }))
      const f2 = forenkle(pk, toleranse).slice(0, -1)
      if (f2.length < 3) continue
      if (areal(f2.map((x) => x.p)) < minAreal) continue
      ut.push(f2.flatMap((x) => [+x.q[0].toFixed(2), +x.q[1].toFixed(2)]))
    }
  }
  return ut
}

const merc = (b) => Math.log(Math.tan(Math.PI / 4 + (b * Math.PI) / 360))

// Hovedkartet (Sør-Norge): x = lengde · 20, y = −bredde · 40 (som hovedpunkt i norgeskartet.ts).
const sor = (q) => [q[0] * 20, -q[1] * 40]
const SOR = [-1, 22, 56.4, 66]
// Nord-Norge-innfeltet: omtrent 10,9 enheter per breddegrad, lengdegradene × 0,39.
const nord = (q) => [q[0] * 4.25, -q[1] * 10.9]
const NORD = [7, 34, 62, 71.8]
// Verdenskartet: Mercator. Norden-utsnittet er det fineste, 5,15 enheter per lengdegrad;
// Europa-utsnittet viser lengde −41 til 62 og bredde 31,5 til 71.
const verden = (q) => [q[0] * 5.15, -merc(q[1]) * 295]
const VERDEN = [-43, 64, 29, 73]

const data = {
  NORGE_SOR: utsnitt(land10, ['NOR'], SOR, sor, 0.45, 0.8),
  NABOLAND_SOR: utsnitt(land10, ['SWE', 'DNK', 'FIN', 'DEU', 'ALD'], SOR, sor, 0.7, 2),
  INNSJOER_SOR: utsnitt(sjoer10.filter((f) => (f.properties.scalerank ?? 9) <= 6), null, [4, 18, 57, 64.5], sor, 0.5, 3),
  FJELL_SOR: utsnitt(fjell10, null, SOR, sor, 1.2, 20),
  FJELL_NORD: utsnitt(fjell10, null, NORD, nord, 0.8, 6),
  NORGE_NORD: utsnitt(land10, ['NOR'], NORD, nord, 0.34, 0.4),
  NABOLAND_NORD: utsnitt(land10, ['SWE', 'FIN', 'RUS'], NORD, nord, 0.45, 1),
  NORGE_VERDEN: utsnitt(land50, ['NOR'], VERDEN, verden, 0.35, 0.6),
  VERDEN: utsnitt(land50.filter((f) => kode(f) !== 'NOR'), null, VERDEN, verden, 0.45, 1.5),
  NEW_YORK: utsnitt(land50, ['USA', 'CAN'], [-81, -65, 36, 47], (q) => [q[0] * 6.2, -merc(q[1]) * 355], 0.3, 0.5),
  DUBAI: utsnitt(land50, ['SAU', 'ARE', 'OMN', 'QAT', 'IRN', 'BHR', 'KWT', 'IRQ', 'YEM'], [45, 62, 18, 32], (q) => [q[0] * 5.7, -merc(q[1]) * 327], 0.3, 0.5),
}

const antall = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.reduce((s, r) => s + r.length / 2, 0)]))
// Lagres som hundredeler med differanser fra forrige punkt: små heltall pakker seg godt.
const kod = (r) => r.map((v, i) => Math.round(v * 100) - (i >= 2 ? Math.round(r[i - 2] * 100) : 0))
const linjer = Object.entries(data).map(
  ([k, ringer]) => `export const ${k}: Ring[] = dekod([\n${ringer.map((r) => `  [${kod(r).join(',')}],`).join('\n')}\n])`,
)

const ts = `/**
 * Kystlinjer og grenser til kartene, fra Natural Earth (public domain,
 * naturalearthdata.com), klippet og forenklet til hvert kart.
 * Generert av scripts/lag-kartdata.mjs — ikke rediger for hånd.
 *
 * Hver ring er en flat tallrekke: [lengde, bredde, lengde, bredde, …]. I fila
 * står de som hundredeler, hvert punkt som differansen fra det forrige; dekod
 * gjør dem om til grader når modulen lastes.
 * Punkter: ${Object.entries(antall).map(([k, v]) => `${k} ${v}`).join(', ')}.
 */

export type Ring = number[]

function dekod(ringer: number[][]): Ring[] {
  return ringer.map((r) => {
    const ut: number[] = []
    for (let i = 0; i < r.length; i++) ut.push(i >= 2 ? ut[i - 2] + r[i] / 100 : r[i] / 100)
    return ut.map((v) => Math.round(v * 100) / 100)
  })
}

${linjer.join('\n\n')}
`
writeFileSync('src/ui/kartdata.ts', ts)
console.log(antall, Math.round(ts.length / 1024) + ' KB')
