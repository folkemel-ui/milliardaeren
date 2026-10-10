import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BYPLAN, BYLISTE, INNFELT, innfeltpunkt, KYSTRUTA } from '../norgeskartet'
import { NORGE_NORD, NORGE_SOR, NABOLAND_SOR, VERDEN, NORGE_VERDEN, NEW_YORK, DUBAI, type Ring } from '../kartdata'
import { LAND, NORGE } from '../verdenskartet'
import { Kartmerke } from '../komponenter/Kartmerke'
import { alleStiler } from './stiler'

const css = alleStiler().replace(/\r\n/g, '\n')

/** Ligger punktet inne i ringen? (Partallsregelen, i grader.) */
function inni([x, y]: [number, number], r: Ring): boolean {
  let inne = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [r[i], r[i + 1], r[j], r[j + 1]]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inne = !inne
  }
  return inne
}

/** Avstanden fra punktet til nærmeste kystpunkt, i grader. */
function tilKysten([x, y]: [number, number], ringer: Ring[]): number {
  let min = Infinity
  for (const r of ringer) for (let i = 0; i < r.length; i += 2) min = Math.min(min, Math.hypot(r[i] - x, (r[i + 1] - y) * 2))
  return min
}

describe('kystlinjene (G3)', () => {
  it('kommer fra Natural Earth, med fjorder og øyer — ikke en grov klump', () => {
    const punkter = (rr: Ring[]) => rr.reduce((s, r) => s + r.length / 2, 0)
    expect(punkter(NORGE_SOR)).toBeGreaterThan(1000)
    expect(NORGE_SOR.length, 'øyer langs kysten').toBeGreaterThan(20)
    expect(punkter(NORGE_NORD)).toBeGreaterThan(500)
    expect(NABOLAND_SOR.length, 'Sverige og Danmark').toBeGreaterThan(1)
    for (const rr of [VERDEN, NORGE_VERDEN, NEW_YORK, DUBAI]) expect(rr.length).toBeGreaterThan(0)
  })

  it('hver by står på land, eller helt ute ved kysten', () => {
    for (const by of BYLISTE) {
      const pos = BYPLAN[by].pos
      const ringer = BYPLAN[by].innfelt ? NORGE_NORD : NORGE_SOR
      const påLand = ringer.some((r) => inni(pos, r))
      expect(påLand || tilKysten(pos, ringer) < 0.12, by).toBe(true)
    }
  })

  it('skipet går på sjøen, ikke over land', () => {
    for (const p of KYSTRUTA) expect(NORGE_SOR.some((r) => inni(p, r)), p.join(',')).toBe(false)
  })

  it('Lofoten står inne i Nord-Norge-innfeltet', () => {
    const [x, y] = innfeltpunkt(BYPLAN.Lofoten.pos)
    expect(x).toBeGreaterThan(INNFELT.x + 4)
    expect(x).toBeLessThan(INNFELT.x + INNFELT.bredde - 4)
    expect(y).toBeGreaterThan(INNFELT.y + 4)
    expect(y).toBeLessThan(INNFELT.y + INNFELT.hoyde - 4)
  })

  it('verdenskartet tegner Norge for seg, i landfargen', () => {
    expect(NORGE.length).toBeGreaterThan(0)
    expect(LAND.length).toBeGreaterThan(5)
  })
})

describe('rolige markører (G3)', () => {
  const tegn = (n: number, hel: boolean) =>
    renderToStaticMarkup(createElement('svg', null, createElement(Kartmerke, { x: 10, y: 10, r: 3.2, n, hel, natt: 0, puls: 0, glod: 'g', merke: n > 0 ? { x: 12, y: 0, b: 12, h: 9 } : null })))

  it('en liten prikk, og antallet i et merke ved siden av', () => {
    const svg = tegn(3, false)
    expect(svg).toContain('r="3.2"')
    expect(svg).toContain('kart-merke')
    expect(svg).not.toContain('kart-merke-krone')
  })

  it('ingen merke før du eier noe, og kronen bare når du eier hele byen', () => {
    expect(tegn(0, false)).not.toContain('kart-merke')
    expect(tegn(4, true)).toContain('kart-merke-krone')
  })

  it('gull bare for hele byer; trendringen og myntene er borte', () => {
    expect(css).toMatch(/\.kart-by\.hel \.kart-prikk \{\n {2}fill: var\(--gull\);/)
    expect(css).toMatch(/\.kart-by\.eid \.kart-prikk \{\n {2}fill: var\(--tekst\);/)
    expect(css).not.toContain('.kart-mynt')
    expect(css).not.toMatch(/\n\.kart-trend \{/)
  })

  it('kartfargene finnes i begge temaene', () => {
    const lyst = css.slice(css.indexOf(":root[data-theme='light'] {"))
    for (const v of ['--kart-hav', '--kart-land', '--kart-naboland', '--kart-kyst', '--kart-fjell']) {
      expect(css.indexOf(`${v}:`), v).toBeLessThan(css.indexOf(":root[data-theme='light'] {"))
      expect(lyst, v).toContain(`${v}:`)
    }
  })
})
