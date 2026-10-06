import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { drakt, initialer } from '../komponenter/Klubbvaapen'
import { KLUBBNAVN } from '../../engine/klubb'

const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** Selektoren hver deklarasjon står under. */
function deklarasjoner(egenskap: string): { sel: string; verdi: string }[] {
  const ut: { sel: string; verdi: string }[] = []
  let sel = ''
  for (const linje of css.split('\n')) {
    if (/^[^\s}@/].*\{\s*$/.test(linje)) sel = linje.trim()
    const m = linje.match(new RegExp(`^\\s*${egenskap}: (.+);$`))
    if (m) ut.push({ sel, verdi: m[1] })
  }
  return ut
}

/** Grafikk som skaleres med tegningen sin, ikke tekst i grensesnittet. */
const GRAFIKK = ['.kart-leie', '.kart-antall', '.kart-navn', '.tikk-pil', '.feiring-tekst', '.hus-pluss', '.klubb-emoji']

describe('skriftskalaen', () => {
  it('all tekst bruker et trinn på skalaen — unntatt grafikk', () => {
    const utenfor = deklarasjoner('font-size').filter(
      ({ sel, verdi }) => !verdi.startsWith('var(--skrift-') && !GRAFIKK.some((g) => sel.includes(g)),
    )
    expect(utenfor).toEqual([])
  })

  it('bare fire vekter', () => {
    // «100 900» er spennet i @font-face — hvilke vekter fonten har, ikke en tekst.
    const utenfor = deklarasjoner('font-weight').filter(
      ({ verdi }) => verdi !== '100 900' && !/^var\(--vekt-(normal|halvfet|fet|tung)\)$/.test(verdi),
    )
    expect(utenfor).toEqual([])
  })

  it('seks størrelser, i stigende rekkefølge', () => {
    const trinn = [1, 2, 3, 4, 5, 6].map((n) => Number(css.match(new RegExp(`--skrift-${n}: (\\d+)px`))?.[1]))
    expect(trinn.every((x) => x > 0)).toBe(true)
    expect([...trinn].sort((a, b) => a - b)).toEqual(trinn)
  })
})

describe('merker, etiketter og brikker', () => {
  it('de gamle enkeltstilene er borte', () => {
    for (const gammel of ['.merke-leder', '.merke-ny', '.merke-ok', '.merke-standard', '.helg', '.skattebrikke', '.estimat']) {
      expect(css.includes(`\n${gammel} {`), gammel).toBe(false)
    }
  })

  it('de tre typene finnes, med fargene de skal ha', () => {
    for (const sel of ['.merke', '.merke.gull', '.merke.kant', '.merke.ok', '.merke.varsel', '.merke.fare', '.merke.info', '.brikke', '.brikke.gull', '.etikett']) {
      expect(css.includes(`\n${sel} {`), sel).toBe(true)
    }
  })
})

describe('klubbvåpenet', () => {
  it('initialene tar med forkortelsen', () => {
    expect(initialer('Fjordby IL')).toBe('FIL')
    expect(initialer('Kvitfjell BK')).toBe('KBK')
    expect(initialer('Lia IL')).toBe('LIL')
    expect(initialer('Solstad')).toBe('S')
    expect(initialer('Nye Tider')).toBe('NT')
  })

  it('samme navn gir alltid samme drakt', () => {
    expect(drakt('Havnes FK')).toEqual(drakt('Havnes FK'))
  })

  it('klubbene som er til salgs, ser ikke like ut', () => {
    const utseender = new Set(KLUBBNAVN.map((n) => JSON.stringify(drakt(n))))
    expect(utseender.size).toBeGreaterThanOrEqual(KLUBBNAVN.length - 1)
  })
})
