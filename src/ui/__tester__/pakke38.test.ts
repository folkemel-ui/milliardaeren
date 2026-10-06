import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { FUSJONSFAKTOR } from '../../engine/fusjon'
import { STIGEN } from '../../engine/innhold'
import { nytt } from '../hendelsesstrom'
import { Illustrasjon } from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'
import { bedrift } from '../../engine/__tester__/hjelp'

const tegn = (id: string, forbedringer: number, trinn: 0 | 1 | 2 | 3 = 0) =>
  renderToStaticMarkup(createElement(Illustrasjon, { id, trinn, forbedringer }))

describe('forbedringene synes', () => {
  it('hver forbedring endrer tegningen for hver bransje', () => {
    for (const id of STIGEN) {
      const utgaver = [0, 1, 2, 3].map((f) => tegn(id, f))
      expect(new Set(utgaver).size, id).toBe(4)
    }
  })

  it('plaketten ved nivå 100 er gull, ikke neon', () => {
    const svg = tegn('kiosk', 0, 3)
    expect(svg).not.toContain('#ff5fa2')
    expect(svg).toContain(S.gull.flate)
  })

  it('bevegelige deler er merket, så CSS kan styre dem', () => {
    for (const [id, klasse] of [['kafe', 'anim-damp'], ['oljeselskap', 'anim-flamme'], ['rederi', 'anim-duve'], ['skisenter', 'anim-gondol'], ['hotell', 'anim-flagg']]) {
      expect(tegn(id, 3, 3), id).toContain(klasse)
    }
  })
})

describe('fusjoner i hendelsesstrømmen', () => {
  it('en bedrift med flere fusjoner enn før blir et fusjonsfunn med faktoren', () => {
    const før = nyttSpill()
    før.bedrifter.push(bedrift('kiosk', { id: 'b2', fusjoner: 0 }))
    const etter = structuredClone(før)
    etter.bedrifter[1].fusjoner = 1
    expect(nytt(før, etter)).toContainEqual({ type: 'fusjon', id: 'kiosk', navn: 'Kiosk', faktor: FUSJONSFAKTOR })
  })

  it('to fusjoner på en gang (et oppkjøp) gir faktoren i andre', () => {
    const før = nyttSpill()
    const etter = structuredClone(før)
    etter.bedrifter[0].fusjoner = 2
    const f = nytt(før, etter).find((x) => x.type === 'fusjon')
    expect(f && f.type === 'fusjon' && f.faktor).toBeCloseTo(FUSJONSFAKTOR ** 2)
  })

  it('en ny bedrift er et kjøp, ikke en fusjon', () => {
    const før = nyttSpill()
    const etter = structuredClone(før)
    etter.bedrifter.push(bedrift('kiosk', { id: 'b2', fusjoner: 1 }))
    expect(nytt(før, etter).some((x) => x.type === 'fusjon')).toBe(false)
  })
})
