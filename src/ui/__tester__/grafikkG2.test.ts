import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { BEDRIFTSTEGNINGER, Illustrasjon, NY_STIL, type Trinn } from '../komponenter/Illustrasjoner'
import { S } from '../komponenter/Tegnestil'

const tegn = (id: string, trinn: Trinn, forbedringer: number) => renderToStaticMarkup(createElement(Illustrasjon, { id, trinn, forbedringer }))
const TRINN: Trinn[] = [0, 1, 2, 3]

/** Plaketten ved nivå 100: mørk plate med gullkant (`Plakett` i Tegnestil.tsx). */
const plakett = `fill="${S.mork.skygge}" stroke="${S.gull.flate}" stroke-width="1"`

describe('bedriftene i den nye stilen (G2)', () => {
  it('alle de 13 bedriftene er tegnet om', () => {
    expect(BEDRIFTSTEGNINGER.filter((id) => !NY_STIL.includes(id))).toEqual([])
  })

  it('stedet vokser: de fire vekstrinnene er fire ulike tegninger', () => {
    for (const id of BEDRIFTSTEGNINGER) {
      expect(new Set(TRINN.map((t) => tegn(id, t, 0))).size, id).toBe(4)
    }
  })

  // Én test per bedrift (G14): samlet blokkerte den testkjøreren i 15 s med full ramme.
  it.each(BEDRIFTSTEGNINGER)('hver forbedring synes på hvert vekstrinn: %s', (id) => {
    for (const t of TRINN) {
      expect(new Set([0, 1, 2, 3].map((f) => tegn(id, t, f))).size, `${id} trinn ${t}`).toBe(4)
    }
  })

  it('gullplaketten kommer ved nivå 100, ikke før', () => {
    for (const id of BEDRIFTSTEGNINGER) {
      expect(tegn(id, 2, 3), id).not.toContain(plakett)
      expect(tegn(id, 3, 0), id).toContain(plakett)
    }
  })
})
