/** Grafikkpakke G5: ting du eier — biler, klokker, båter, fly, boliger, gårder og skoger. */

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { EIENDOMSTYPER, LUKSUS } from '../../engine/eiendom'
import { JORD } from '../../engine/jord'
import { Illustrasjon, ILLUSTRASJONSIDER, NY_STIL } from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'

const tegn = (id: string, utklipp = false) => renderToStaticMarkup(createElement(Illustrasjon, { id, størrelse: 96, utklipp }))
/** Uten id-er, så to tegninger kan sammenlignes på form og farge. */
const form = (svg: string) => svg.replace(/ id="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, 'url()')

const G5 = [
  // Luksus.
  'stasjonsvogn', 'elbil', 'hyperbil', 'veteranbil', 'limousin', 'formelbil',
  'dykkerklokke', 'gullklokke', 'mesterverk', 'lommeur', 'diamantklokke',
  'snekke', 'motorbaat', 'seilyacht', 'superyacht',
  'propellfly', 'helikopter', 'forretningsjet', 'langdistansejet',
  // Boliger, byversjoner, gårder og skoger.
  'hybel', 'hybel-oslo', 'hybel-trondheim', 'leilighet', 'leilighet-bergen', 'leilighet-trondheim',
  'rekkehus', 'rekkehus-bergen', 'hytte-trysil', 'hytte-lofoten', 'kontorbygg-stavanger',
  'gard-hedmarken', 'gard-lista', 'skog-trysil', 'skog-namdalen',
]

describe('ting du eier i den nye stilen (G5)', () => {
  it('alle de 34 er tegnet om på lerretet', () => {
    expect(G5.length).toBe(34)
    for (const id of G5) {
      expect(NY_STIL, id).toContain(id)
      expect(tegn(id), id).toContain('viewBox="0 0 96 96"')
    }
  })

  it('alt du kan eie har en tegning, og ingen to deler den', () => {
    const eiendeler = [...Object.keys(EIENDOMSTYPER), ...Object.keys(LUKSUS), ...Object.keys(JORD)]
    for (const id of eiendeler) expect(ILLUSTRASJONSIDER, id).toContain(id)
    const former = new Map<string, string>()
    for (const id of ILLUSTRASJONSIDER) {
      const f = form(tegn(id))
      expect(former.get(f), `${id} er lik ${former.get(f)}`).toBeUndefined()
      former.set(f, id)
    }
  })

  it('bilene, klokkene, båtene og flyene ser ulike ut i hver sin gruppe', () => {
    const grupper = ['bil', 'klokke', 'baat', 'fly'].map((k) => Object.values(LUKSUS).filter((l) => l.kategori === k).map((l) => l.id))
    for (const ider of grupper) {
      expect(new Set(ider.map((id) => form(tegn(id)))).size, ider.join(', ')).toBe(ider.length)
    }
  })

  it('bakken rundt flyene blir igjen når de står i hangaren', () => {
    // Vindpølsa, H-en på helipaden og den røde løperen hører til bakken.
    expect(tegn('propellfly', true)).not.toContain(`fill="${S.oker.flate}"`)
    expect(tegn('helikopter', true)).not.toContain(`stroke="${S.oker.flate}"`)
    expect(tegn('forretningsjet', true)).not.toContain(`fill="${S.faluRod.flate}"`)
    expect(tegn('propellfly')).toContain(`fill="${S.oker.flate}"`)
  })

  it('hver sti er gyldig: riktig antall tall etter hver kommando', () => {
    const ARITET: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
    for (const id of G5) {
      for (const [, d] of tegn(id).matchAll(/ d="([^"]+)"/g)) {
        for (const [, k, args] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
          const n = (args.match(/-?(\d*\.\d+|\d+)(e-?\d+)?/g) ?? []).length
          const a = ARITET[k.toLowerCase()]
          expect(a === 0 ? n === 0 : n > 0 && n % a === 0, `${id}: ${k}${args}`).toBe(true)
        }
      }
    }
  })
})
